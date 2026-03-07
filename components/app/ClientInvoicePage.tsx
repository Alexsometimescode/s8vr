import React, { useState, useEffect } from 'react';
import { Invoice } from '../../types';
import { InvoicePreviewCard } from './InvoiceBuilder';
import { Logo, Button } from '../ui/Shared';
import { Loader2, CheckCircle, AlertTriangle, ShieldCheck, CreditCard, XCircle, Lock, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href, // This will reload the page with payment_intent_client_secret
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setProcessing(false);
    } else {
      // Payment succeeded!
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <Button 
        type="submit" 
        disabled={!stripe || processing} 
        className="w-full"
        icon={processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
      >
        {processing ? 'Processing...' : `Pay $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
      </Button>
    </form>
  );
};

interface ClientInvoicePageProps {
  invoiceId: string;
}

export const ClientInvoicePage: React.FC<ClientInvoicePageProps> = ({ invoiceId }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [senderProfile, setSenderProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      setAccessDenied(false);

      // Extract token from URL
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      
      // If no token provided, deny access
      if (!urlToken) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // Fetch invoice via backend API (bypasses RLS)
      const response = await fetch(`${API_URL}/api/invoice/${invoiceId}?token=${urlToken}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('Fetch failed:', data.error);
        setError(data.error || 'Failed to fetch invoice');
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const invoiceData = data.invoice;
      setSenderProfile(data.sender);

      // Check if invoice is already paid
      if (invoiceData.status === 'paid') {
        setIsPaid(true);
        setInvoice({
          ...invoiceData,
          remindersEnabled: false,
          logs: [],
        });
        setLoading(false);
        return;
      }

      setInvoice({
        ...invoiceData,
        remindersEnabled: false,
        logs: [],
      });

      // Initialize Payment Intent
      initializePayment(invoiceData.id);

    } catch (err: any) {
      console.error('Error loading invoice:', err);
      setError(err.message || 'Failed to load invoice');
      setLoading(false);
    }
  };

  const initializePayment = async (invId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/payments/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invId }),
      });
      const data = await res.json();

      if (res.ok) {
        setClientSecret(data.clientSecret);
        setStripeAccountId(data.stripeAccountId);
      } else {
        console.warn('Payment initialization failed:', data.error);
        if (data.error === 'Freelancer is not connected to Stripe') {
            setPaymentError('The sender has not set up online payments yet.');
        } else {
            setPaymentError('Online payment is currently unavailable.');
        }
      }
    } catch (err) {
      console.error('Error initializing payment:', err);
      setPaymentError('Failed to initialize payment system.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setIsPaid(true);
    
    // Immediately update the invoice status in the database
    // This ensures the status is updated even without webhooks (local dev)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      await fetch(`${API_URL}/api/invoice/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch (err) {
      console.error('Failed to update invoice status:', err);
      // Payment succeeded in Stripe, status will be updated by webhook eventually
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-textMain">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-textMuted">Loading invoice...</p>
          <p className="text-xs text-textMuted mt-2 opacity-50">ID: {invoiceId}</p>
        </div>
      </div>
    );
  }

  // Access Denied state
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 text-textMain">
        <div className="bg-surface border border-border rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-textMain mb-2">Access Denied</h2>
          <p className="text-textMuted mb-6">
            {error || 'This invoice link is invalid or has expired. Please contact the sender for a new link.'}
          </p>
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-emerald-500 hover:underline"
          >
            Go to s8vr Home
          </a>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 text-textMain">
        <div className="bg-surface border border-border rounded-2xl p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-textMain mb-2">Something Went Wrong</h2>
          <p className="text-textMuted mb-6">{error || 'Unable to load this invoice.'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-emerald-500 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Payment Complete state
  if (isPaid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface border border-border rounded-2xl p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-textMain mb-2">Payment Complete</h2>
          <p className="text-textMuted mb-2">Invoice #{invoice.invoiceNumber}</p>
          <p className="text-4xl font-bold text-emerald-500 mb-6">
            ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-textMuted">Thank you for your payment!</p>
          <p className="text-xs text-textMuted mt-4">
            {senderProfile?.name || 'The sender'} has been notified.
          </p>
        </div>
      </div>
    );
  }

  // Main Invoice View
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2 text-sm text-textMuted">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Secure Invoice
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-5 gap-8">

          {/* Invoice Preview - Shows the actual template */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <InvoicePreviewCard
              data={invoice}
              userProfile={senderProfile}
              minimal={false}
            />
          </div>

          {/* Payment Sidebar */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-surface border border-border rounded-2xl p-6 sticky top-24 lg:sticky">
              <h2 className="text-lg font-bold text-textMain mb-6">Payment Summary</h2>
              
              {/* Amount */}
              <div className="mb-6">
                <p className="text-sm text-textMuted mb-1">Amount Due</p>
                <p className="text-4xl font-bold text-textMain">
                  ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-textMuted">Invoice</span>
                  <span className="text-textMain font-medium">#{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-textMuted">From</span>
                  <span className="text-textMain font-medium">{senderProfile?.name || 'Business'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-textMuted">Due Date</span>
                  <span className="text-textMain font-medium">
                    {new Date(invoice.dueDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Payment Element or Error */}
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ 
                    clientSecret, 
                    appearance: { 
                        theme: 'night', 
                        variables: {
                          colorPrimary: '#10b981',
                          colorBackground: '#18181b',
                          colorText: '#fafafa',
                          colorTextSecondary: '#a1a1aa',
                          colorDanger: '#ef4444',
                          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                          fontSizeBase: '14px',
                          borderRadius: '12px',
                          spacingUnit: '4px',
                        },
                        rules: {
                          '.Input': {
                            backgroundColor: '#09090b',
                            border: '1px solid #27272a',
                            boxShadow: 'none',
                          },
                          '.Input:focus': {
                            border: '1px solid #10b981',
                            boxShadow: '0 0 0 1px #10b981',
                          },
                          '.Label': {
                            color: '#a1a1aa',
                            fontSize: '12px',
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          },
                          '.Tab': {
                            backgroundColor: '#18181b',
                            border: '1px solid #27272a',
                          },
                          '.Tab:hover': {
                            backgroundColor: '#27272a',
                          },
                          '.Tab--selected': {
                            backgroundColor: '#10b981',
                            borderColor: '#10b981',
                          },
                        }
                    } 
                }}>
                  <PaymentForm amount={invoice.amount} onSuccess={handlePaymentSuccess} />
                </Elements>
              ) : (
                <div className="bg-surfaceHighlight border border-border rounded-xl p-6 text-center">
                    {paymentError ? (
                         <>
                            <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                            <p className="text-sm font-medium mb-1">{paymentError}</p>
                            <p className="text-xs text-textMuted">Please contact the sender directly to arrange payment.</p>
                         </>
                    ) : (
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-6 h-6 animate-spin text-textMuted mb-2" />
                            <p className="text-xs text-textMuted">Loading payment options...</p>
                        </div>
                    )}
                </div>
              )}

              {/* Security Note */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-textMuted">
                <ShieldCheck className="w-3 h-3" />
                Secure payment powered by Stripe
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-textMuted mb-2">
            Questions about this invoice? Contact{' '}
            <a href={`mailto:${senderProfile?.email}`} className="text-emerald-500 hover:underline">
              {senderProfile?.name || 'the sender'}
            </a>
          </p>
          <p className="text-xs text-textMuted">
            Powered by <a href="https://s8vr.app" className="hover:underline">s8vr</a> - Smart Invoicing
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ClientInvoicePage;
