import React, { useState, useEffect, useCallback } from 'react';
import { getProfile, saveProfile, getOwnerId, Profile } from './src/lib/profile';
import { fetchInvoices, createInvoice, updateInvoice, updateInvoiceAccessToken } from './src/lib/invoices';
import { fetchClients, Client } from './src/lib/clients';
import { sendInvoiceEmail } from './src/lib/email';
import Dashboard from './components/app/Dashboard';
import { InvoiceBuilder, ClientInvoiceView, InvoiceModal } from './components/app/InvoiceBuilder';
import AdminDashboard from './components/app/AdminDashboard';
import { ViewState, Invoice } from './types';
import { DashboardSkeleton } from './components/ui/Skeleton';
import { AlertCircle, CheckCircle, X, ArrowRight } from 'lucide-react';

// ── Toast ────────────────────────────────────────────────────────────────────
interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'info';
  title: string;
  message: string;
}

const Toast: React.FC<{ toast: ToastMessage; onClose: (id: string) => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-5 duration-300 ${
      toast.type === 'error'
        ? 'bg-red-500/10 border-red-500/30 text-red-400'
        : toast.type === 'success'
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
    }`}>
      {toast.type === 'error' ? (
        <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
      ) : (
        <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{toast.title}</p>
        <p className="text-sm opacity-80 mt-0.5">{toast.message}</p>
      </div>
      <button onClick={() => onClose(toast.id)} className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// ── First-run setup ───────────────────────────────────────────────────────────
const FirstRunSetup: React.FC<{ onComplete: (p: Omit<Profile, 'id'>) => void }> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Valid email is required'); return; }
    onComplete({
      name: name.trim(),
      email: email.trim(),
      currency: 'USD',
      invoice_number_format: 'YYMM-seq',
      email_notifications: true,
      created_at: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <span className="text-2xl font-bold text-emerald-400">s8</span>
          </div>
          <h1 className="text-2xl font-bold text-textMain">Welcome to s8vr</h1>
          <p className="text-textMuted mt-2 text-sm">Set up your profile to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface/20 border border-white/10 rounded-2xl p-8 space-y-5 backdrop-blur-xl">
          <div>
            <label className="block text-xs font-medium text-textMuted uppercase tracking-wider mb-2">Your Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-textMain placeholder:text-textMuted focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-textMuted uppercase tracking-wider mb-2">Your Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-textMain placeholder:text-textMuted focus:border-emerald-500 focus:outline-none transition-colors"
            />
            <p className="text-xs text-textMuted mt-1.5">Used as the "from" name on invoice emails</p>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 transition-colors"
          >
            Get started <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-textMuted mt-6">
          Profile is stored locally on this device
        </p>
      </div>
    </div>
  );
};

// ── App ───────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(getProfile());
  const [view, setView] = useState<ViewState>('dashboard');
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const showToast = (type: 'error' | 'success' | 'info', title: string, message: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Ensure dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    document.body.style.backgroundColor = '#09090b';
    document.body.style.color = '#a1a1aa';
  }, []);

  // Load data once profile is set
  useEffect(() => {
    if (profile) {
      loadInvoices();
      loadClients();
    }
  }, [profile?.id]);

  const loadInvoices = async () => {
    try {
      const data = await fetchInvoices(getOwnerId());
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const loadClients = async () => {
    try {
      const data = await fetchClients(getOwnerId());
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  // Browser history sync
  useEffect(() => {
    window.history.replaceState({ view, invoiceId: activeInvoiceId }, '');
    const onPopState = (e: PopStateEvent) => {
      if (e.state?.view) {
        setView(e.state.view);
        setActiveInvoiceId(e.state.invoiceId ?? null);
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (newView: ViewState, invoiceId?: string) => {
    const id = invoiceId ?? activeInvoiceId ?? null;
    window.history.pushState({ view: newView, invoiceId: id }, '');
    if (invoiceId) setActiveInvoiceId(invoiceId);
    setView(newView);
    window.scrollTo(0, 0);
  };

  const handleOpenInvoice = (id: string) => setActiveInvoiceId(id);

  const handleCreateInvoice = async (newInvoice: Invoice) => {
    try {
      const invoiceWithCurrency = {
        ...newInvoice,
        currency: newInvoice.currency || profile?.currency || 'USD',
      };
      const savedInvoice = await createInvoice(invoiceWithCurrency, getOwnerId());

      const isPremium = false; // local app, no plan gating

      const emailResult = await sendInvoiceEmail({
        to: newInvoice.clientEmail,
        clientName: newInvoice.clientName,
        invoiceNumber: newInvoice.invoiceNumber,
        amount: newInvoice.amount || newInvoice.items.reduce((sum, item) => sum + item.amount, 0),
        dueDate: newInvoice.dueDate,
        issueDate: newInvoice.issueDate,
        items: newInvoice.items,
        fromName: profile?.name || 'Your Business',
        fromEmail: profile?.email || '',
        userLogo: profile?.logo_url || profile?.avatar_url,
        isPremium,
        invoiceId: savedInvoice.id,
        currency: invoiceWithCurrency.currency,
      });

      if (emailResult.success && emailResult.accessToken) {
        await updateInvoiceAccessToken(savedInvoice.id, emailResult.accessToken);
      }
      if (emailResult.checkoutUrl) {
        await updateInvoice(savedInvoice.id, { checkoutUrl: emailResult.checkoutUrl } as any);
      }

      await loadInvoices();
      navigate('dashboard');

      if (emailResult.success) {
        showToast('success', 'Invoice Sent!', `Invoice #${newInvoice.invoiceNumber} sent to ${newInvoice.clientEmail}`);
      } else {
        showToast('info', 'Invoice Saved', `Invoice created but email could not be sent: ${emailResult.error}`);
      }
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      showToast('error', 'Failed to Create Invoice', error.message || 'There was an error creating your invoice.');
    }
  };

  const handlePayment = async (id: string) => {
    try {
      await updateInvoice(id, { status: 'paid', paidAt: new Date().toISOString() });
      await loadInvoices();
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const handleProfileUpdate = (updated: Profile) => {
    setProfile(updated);
  };

  // ── First-run setup ────────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="dark relative overflow-hidden min-h-screen">
        <FirstRunSetup
          onComplete={(p) => {
            const saved = saveProfile(p);
            setProfile(saved);
          }}
        />
      </div>
    );
  }

  // ── Admin ──────────────────────────────────────────────────────────────────
  if (view === 'admin') {
    return (
      <div className="dark relative overflow-hidden min-h-screen">
        <AdminDashboard onBack={() => navigate('dashboard')} />
      </div>
    );
  }

  // ── Client view (internal preview) ────────────────────────────────────────
  if (view === 'client-view' && activeInvoiceId) {
    const invoice = invoices.find(i => i.id === activeInvoiceId);
    if (!invoice) return <div>Invoice not found</div>;
    return (
      <ClientInvoiceView
        invoice={invoice}
        onPay={() => handlePayment(invoice.id)}
        onBack={() => navigate('dashboard')}
      />
    );
  }

  // ── Create invoice ─────────────────────────────────────────────────────────
  if (view === 'create-invoice') {
    return (
      <div className="dark relative overflow-hidden min-h-screen">
        <InvoiceBuilder
          onCancel={() => navigate('dashboard')}
          onSave={handleCreateInvoice}
          userProfile={profile}
          existingClients={clients}
        />
        {toasts.length > 0 && (
          <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 max-w-md">
            {toasts.map(toast => <Toast key={toast.id} toast={toast} onClose={removeToast} />)}
          </div>
        )}
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <div className="dark min-h-screen bg-background relative overflow-hidden">
      <Dashboard
        invoices={invoices}
        onLogout={() => {}} // no-op — local app, no sessions
        onCreate={() => navigate('create-invoice')}
        onViewClient={handleOpenInvoice}
        userProfile={profile}
        onRefresh={async () => {
          await loadInvoices();
          setProfile(getProfile());
        }}
        onProfileUpdate={handleProfileUpdate}
        onNavigateAdmin={() => navigate('admin')}
      />

      {activeInvoiceId && view === 'dashboard' && (
        <InvoiceModal
          invoice={invoices.find(i => i.id === activeInvoiceId) as Invoice}
          onClose={() => setActiveInvoiceId(null)}
          userProfile={profile}
          onRefresh={async () => { await loadInvoices(); }}
        />
      )}

      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 max-w-md">
          {toasts.map(toast => <Toast key={toast.id} toast={toast} onClose={removeToast} />)}
        </div>
      )}
    </div>
  );
};

export default App;
