
import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, InvoiceTheme, InvoiceCustomization } from '../../types';
import { Button, Navbar, Logo } from '../ui/Shared';
import { Modal, ConfirmModal } from '../ui/Modal';
import { Plus, Trash2, ArrowLeft, Send, Check, Loader2, ShieldCheck, CreditCard, LayoutTemplate, Building2, Palette, X, Mail, Bell, Clock, Calendar, AlertCircle, RefreshCw, FileText, Lock, Zap, Crown, AlertTriangle, ChevronDown, User, Users, Copy, ArrowUpRight } from 'lucide-react';
import { getNextInvoiceNumber } from '../../src/lib/invoices';

// SECURITY: Validation Helper
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

interface UserProfile {
  id: string;
  name?: string;
  email: string;
  avatar_url?: string;
  logo_url?: string;
  plan?: string;
  currency?: string;
  invoice_number_format?: string;
}

interface ExistingClient {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface InvoiceBuilderProps {
  onCancel: () => void;
  onSave: (invoice: Invoice) => void;
  userProfile?: UserProfile;
  existingClients?: ExistingClient[];
}

const TEMPLATES: { id: InvoiceTheme; name: string; description: string; isPremium?: boolean; items?: InvoiceItem[] }[] = [
    // FREE TIER
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean whitespace. Pure simplicity.',
      isPremium: false
    },
    {
      id: 'corporate',
      name: 'Corporate',
      description: 'Structured header. Professional serif fonts.',
      isPremium: false,
      items: [
          { id: '1', description: 'Consultation Services', amount: 1500 },
          { id: '2', description: 'Implementation Phase', amount: 3500 }
      ]
    },
    {
      id: 'startup',
      name: 'Startup',
      description: 'Friendly, geometric, and modern.',
      isPremium: false,
      items: [
          { id: '1', description: 'MVP Development', amount: 5000 },
          { id: '2', description: 'User Testing', amount: 1200 }
      ]
    },
    
    // PREMIUM TIER
    {
      id: 'agency',
      name: 'Agency',
      description: 'Big centered amount. Focus on value.',
      isPremium: true,
      items: [
          { id: '1', description: 'Brand Strategy', amount: 4500 },
          { id: '2', description: 'Visual Identity', amount: 3000 }
      ]
    },
    {
      id: 'creative',
      name: 'Creative',
      description: 'Dark mode aesthetic. Bold accents.',
      isPremium: true,
      items: [
          { id: '1', description: 'Brand Identity Design', amount: 4000 },
          { id: '2', description: 'Asset Export', amount: 500 }
      ]
    },
    {
      id: 'tech',
      name: 'Terminal',
      description: 'Monospace fonts. Developer focused.',
      isPremium: true,
      items: [
          { id: '1', description: 'Backend API Integration', amount: 3200 },
          { id: '2', description: 'Server Configuration', amount: 800 }
      ]
    },
    {
      id: 'elegant',
      name: 'Elegant',
      description: 'Cream paper, gold accents, refined.',
      isPremium: true
    },
    {
      id: 'modern',
      name: 'Modern',
      description: 'Subtle gradients and soft shadows.',
      isPremium: true
    },
    {
      id: 'classic',
      name: 'Classic',
      description: 'Traditional layout. Double borders.',
      isPremium: true
    },
    {
      id: 'consultant',
      name: 'Consultant',
      description: 'Detailed grid. Clean lines.',
      isPremium: true
    }
];

// Payment Link Actions Component
const PaymentLinkActions: React.FC<{ invoiceId: string; isPaid: boolean }> = ({ invoiceId, isPaid }) => {
  const [copied, setCopied] = React.useState(false);
  
  const getPaymentLink = async () => {
    // Fetch the access token from the database
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    try {
      const res = await fetch(`${API_URL}/api/invoice/${invoiceId}/link`);
      const data = await res.json();
      if (data.link) {
        return data.link;
      }
    } catch (err) {
      console.error('Failed to get payment link:', err);
    }
    // Fallback to basic link
    return `${window.location.origin}/invoice/${invoiceId}`;
  };

  const handleCopyLink = async () => {
    const link = await getPaymentLink();
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenLink = async () => {
    const link = await getPaymentLink();
    window.open(link, '_blank');
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCopyLink}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
          copied 
            ? 'bg-emerald-500 text-white' 
            : 'bg-surface border border-border hover:border-emerald-500/50 text-textMain hover:bg-surfaceHighlight'
        }`}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy Payment Link
          </>
        )}
      </button>
      {!isPaid && (
        <button
          onClick={handleOpenLink}
          className="px-4 py-3 rounded-xl font-medium text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center gap-2"
        >
          <ArrowUpRight className="w-4 h-4" />
          Open
        </button>
      )}
    </div>
  );
};

export const InvoiceModal: React.FC<{ invoice: Invoice; onClose: () => void; userProfile?: UserProfile }> = ({ invoice, onClose, userProfile }) => {
  // Prevent clicks inside the modal from closing it
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const isPaid = invoice.status === 'paid';
  
  // Calculate Days Remaining
  const today = new Date();
  const dueDate = new Date(invoice.dueDate);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let statusBadge = null;
  if (!isPaid) {
      if (diffDays < 0) {
          statusBadge = (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-red-500/10 text-red-500 border border-red-500/20">
                   <AlertCircle className="w-3 h-3" /> Overdue by {Math.abs(diffDays)}d
              </span>
          );
      } else if (diffDays <= 10) {
          statusBadge = (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-orange-500/10 text-orange-500 border border-orange-500/20">
                   <Clock className="w-3 h-3" /> Due in {diffDays}d
              </span>
          );
      } else {
          statusBadge = (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                   <Calendar className="w-3 h-3" /> Due in {diffDays}d
              </span>
          );
      }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Content - Split View */}
      <div 
        className="relative z-10 w-full max-w-5xl h-[85vh] bg-surface border border-border rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row transform transition-all animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={handleContentClick}
      >
         <button 
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-2 text-textMuted hover:text-textMain transition-colors bg-surface/50 hover:bg-surface rounded-full backdrop-blur-md border border-border"
         >
            <X className="w-5 h-5" />
         </button>

         {/* Left Side: Invoice Preview */}
         <div className="flex-1 bg-surfaceHighlight overflow-y-auto custom-scrollbar p-8 flex flex-col items-center border-b lg:border-b-0 lg:border-r border-border">
             <div className="w-full max-w-[480px] scale-[0.95] origin-top shadow-xl mt-4">
                {/* Use minimal prop to remove Stripe footer in report view */}
                <InvoicePreviewCard data={invoice} minimal={true} userProfile={userProfile} />
             </div>
         </div>

         {/* Right Side: Report & Activity */}
         <div className="w-full lg:w-[420px] bg-background p-8 overflow-y-auto custom-scrollbar">
             <div className="space-y-8">
                 
                 {/* Header Status */}
                 <div>
                     <div className="flex items-center justify-between mb-1">
                        <h2 className="text-xl font-bold text-textMain">Invoice #{invoice.invoiceNumber}</h2>
                     </div>
                     <div className="flex items-center gap-2 text-textMuted text-sm mb-4">
                         <span>Created on {new Date(invoice.issueDate).toLocaleDateString()}</span>
                     </div>
                     {!isPaid && statusBadge}
                 </div>

                 {/* Payment Status Card */}
                 <div className={`p-4 rounded-xl border ${isPaid ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-surfaceHighlight border-border'}`}>
                     <div className="flex items-start gap-4">
                         <div className={`p-2 rounded-lg ${isPaid ? 'bg-emerald-500/20 text-emerald-500' : 'bg-surface text-textMuted'}`}>
                             {isPaid ? <Check className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                         </div>
                         <div>
                             <div className={`font-bold text-sm ${isPaid ? 'text-emerald-500' : 'text-textMain'}`}>
                                 {isPaid ? 'Paid in Full' : 'Payment Pending'}
                             </div>
                             <div className="text-xs text-textMuted mt-1">
                                 {isPaid 
                                   ? `Payment received via Stripe on ${new Date(invoice.paidAt || Date.now()).toLocaleDateString()}` 
                                   : 'Awaiting client payment.'
                                 }
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* Payment Link Actions */}
                 <PaymentLinkActions invoiceId={invoice.id} isPaid={isPaid} />

                 {/* Client Details */}
                 <div>
                    <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-3">Client Details</h3>
                    <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-textMuted">Name</span>
                            <span className="text-textMain font-medium">{invoice.clientName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-textMuted">Email</span>
                            <span className="text-textMain">{invoice.clientEmail}</span>
                        </div>
                    </div>
                 </div>

                 {/* Activity Timeline */}
                 <div>
                    <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-4">Activity Log</h3>
                    <div className="space-y-6 relative pl-2">
                        <div className="absolute left-5 top-2 bottom-2 w-px bg-border -ml-[0.5px]" />
                        {(!invoice.logs || invoice.logs.length === 0) ? (
                            <div className="pl-8 py-2 text-sm text-textMuted italic">No activity recorded yet.</div>
                        ) : (
                            invoice.logs.map((log) => (
                                <div key={log.id} className="relative flex gap-4 items-start">
                                    <div className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-background ${
                                        log.type === 'paid' ? 'border-emerald-500 text-emerald-500' : 'border-border text-textMuted'
                                    }`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <div className="text-sm font-medium text-textMain">{log.message || log.type}</div>
                                        <div className="text-xs text-textMuted mt-1">{new Date(log.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                 </div>

             </div>
         </div>
      </div>
    </div>
  );
};


export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ onCancel, onSave, userProfile, existingClients = [] }) => {
  // Step: 'templates' -> 'editor'
  const [step, setStep] = useState<'templates' | 'editor'>('templates');
  const [theme, setTheme] = useState<InvoiceTheme>('minimal');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  
  // Determine pro status from userProfile (reactive)
  const isProMember = userProfile?.plan === 'pro' || userProfile?.plan === 'premium';
  
  // Customization state
  const [customization, setCustomization] = useState<InvoiceCustomization>({
    textColor: '#18181b',
    backgroundColor: '#ffffff',
    accentColor: '#10b981',
    fontFamily: 'inter'
  });
  const [showCustomization, setShowCustomization] = useState(false);
  
  const [invoice, setInvoice] = useState<Invoice>({
    id: crypto.randomUUID(),
    invoiceNumber: '', // Will be set by useEffect
    clientName: '',
    clientEmail: '',
    items: [{ id: '1', description: '', amount: 0 }],
    status: 'pending',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    amount: 0,
    remindersEnabled: true,
    theme: 'minimal',
    customization: {
      textColor: '#18181b',
      backgroundColor: '#ffffff',
      accentColor: '#10b981',
      fontFamily: 'inter'
    }
  });

  // Generate invoice number on mount and when format changes
  useEffect(() => {
    const generateInvoiceNum = async () => {
      if (!userProfile?.id) return;
      
      const format = userProfile.invoice_number_format || 'YYMM-seq';
      try {
        const nextNumber = await getNextInvoiceNumber(userProfile.id, format);
        setInvoice(prev => ({ ...prev, invoiceNumber: nextNumber }));
      } catch (error) {
        console.error('Error generating invoice number:', error);
        // Fallback to timestamp-based number
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const seq = now.getTime().toString().slice(-4);
        setInvoice(prev => ({ ...prev, invoiceNumber: `${year}${month}-${seq}` }));
      }
    };
    
    generateInvoiceNum();
  }, [userProfile?.id, userProfile?.invoice_number_format]);

  // Check if invoice is ready to send
  const isReadyToSend = 
    invoice.clientName.trim() !== '' &&
    invoice.clientEmail.trim() !== '' &&
    isValidEmail(invoice.clientEmail) &&
    invoice.items.length > 0 &&
    invoice.items.some(i => i.description.trim() !== '' && i.amount > 0);

  const total = invoice.items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const addItem = () => {
    setInvoice({
      ...invoice,
      items: [...invoice.items, { id: crypto.randomUUID(), description: '', amount: 0 }]
    });
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvoice({
      ...invoice,
      items: invoice.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    });
  };

  const removeItem = (id: string) => {
    if (invoice.items.length > 1) {
      setInvoice({
        ...invoice,
        items: invoice.items.filter(item => item.id !== id)
      });
    }
  };

  const selectTemplate = (t: typeof TEMPLATES[0]) => {
    if (t.isPremium && !isProMember) {
      setShowUpgradeModal(true);
      return;
    }
    setTheme(t.id);
    setInvoice({ ...invoice, theme: t.id });
    setStep('editor');
  };

  const selectClient = (client: ExistingClient) => {
    setSelectedClientId(client.id);
    setInvoice({
      ...invoice,
      clientName: client.name,
      clientEmail: client.email,
    });
    setShowClientDropdown(false);
  };

  const clearSelectedClient = () => {
    setSelectedClientId(null);
    setInvoice({
      ...invoice,
      clientName: '',
      clientEmail: '',
    });
  };

  const handleUpgrade = () => {
    // In production, this would redirect to pricing/checkout page
    window.open('/pricing', '_blank');
    setShowUpgradeModal(false);
  };

  const handleSend = () => {
    if (!isReadyToSend) return;
    
    setIsSending(true);
    setTimeout(() => {
      onSave({
        ...invoice,
        amount: total,
        theme: theme,
        currency: userProfile?.currency || 'USD',
        logs: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: 'sent', message: 'Invoice sent to client' }]
      });
    }, 1500);
  };

  // STEP 1: Template Selection (3x3 Grid)
  if (step === 'templates') {
    return (
      <div className="min-h-screen bg-background text-textMain">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <button onClick={onCancel} className="flex items-center gap-2 text-textMuted hover:text-textMain transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <Logo />
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Content */}
        <div className="pt-24 pb-16 px-6">
          <div className="max-w-5xl mx-auto">
            {/* Title */}
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-textMain mb-3">Choose a Template</h1>
              <p className="text-textMuted">Select a style for your invoice. You can always change it later.</p>
            </div>

            {/* Pro Badge */}
            <div className="flex justify-center mb-8">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                isProMember 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                  : 'bg-surfaceHighlight text-textMuted border border-border'
              }`}>
                {isProMember ? <Zap className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {isProMember ? 'Pro Plan Active' : 'Free Plan'}
                {!isProMember && (
                  <button onClick={() => setShowUpgradeModal(true)} className="ml-2 text-emerald-500 hover:underline">
                    Upgrade
                  </button>
                )}
              </div>
            </div>

            {/* 3x3 Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEMPLATES.map((t) => {
                const isLocked = t.isPremium && !isProMember;
                const isSelected = theme === t.id;
                
                return (
                  <button
                    key={t.id}
                    onClick={() => selectTemplate(t)}
                    className={`group relative bg-surface border-2 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                      isSelected 
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20' 
                        : 'border-border hover:border-textMuted'
                    }`}
                  >
                    {/* Template Preview */}
                    <div className="aspect-[4/3] p-4 bg-gradient-to-br from-surfaceHighlight to-surface flex items-center justify-center">
                      <div className="w-full max-w-[200px] transform scale-[0.6] origin-center">
                        <MiniInvoicePreview theme={t.id} />
                      </div>
                    </div>
                    
                    {/* Template Info */}
                    <div className="p-4 border-t border-border">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-textMain">{t.name}</h3>
                        {t.isPremium && (
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                            isLocked 
                              ? 'bg-surfaceHighlight text-textMuted' 
                              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                          }`}>
                            {isLocked ? <Lock className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                            PRO
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-textMuted">{t.description}</p>
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Locked Overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="px-4 py-2 bg-surface border border-border rounded-lg flex items-center gap-2">
                          <Lock className="w-4 h-4 text-textMuted" />
                          <span className="text-sm font-medium">Upgrade to unlock</span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowUpgradeModal(false)} />
            <div className="bg-surface border border-border rounded-2xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden">
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-textMain mb-2">Upgrade to Pro</h3>
                <p className="text-textMuted mb-6">
                  Unlock premium invoice templates, advanced analytics, and more features to grow your business.
                </p>
                <div className="space-y-3">
                  <Button onClick={handleUpgrade} className="w-full" icon={<Zap className="w-4 h-4" />}>
                    Upgrade Now
                  </Button>
                  <button onClick={() => setShowUpgradeModal(false)} className="w-full py-3 text-textMuted hover:text-textMain transition-colors text-sm">
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // STEP 2: Editor with Live Preview
  return (
    <div className="min-h-screen bg-background text-textMain flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => setStep('templates')} className="flex items-center gap-2 text-textMuted hover:text-textMain transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Templates</span>
          </button>
          <Logo />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobilePreview(!showMobilePreview)}
              className="lg:hidden px-3 py-1.5 text-sm text-textMuted hover:text-textMain transition-colors border border-border rounded-lg"
            >
              {showMobilePreview ? 'Edit' : 'Preview'}
            </button>
            <Button
              onClick={handleSend}
              disabled={!isReadyToSend || isSending}
              icon={isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            >
              {isSending ? 'Sending...' : 'Send Invoice'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 pt-16 flex flex-col lg:flex-row">
        {/* Left Side: Form */}
        <div className={`w-full lg:w-[480px] xl:w-[520px] lg:border-r border-border bg-surface overflow-y-auto h-full lg:h-[calc(100vh-64px)] ${showMobilePreview ? 'hidden lg:block' : 'block'}`}>
          <div className="p-6 space-y-6">
            {/* Client Details */}
            <div>
              <h2 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Client Details
              </h2>
              
              {/* Client Selector */}
              {existingClients.length > 0 && (
                <div className="mb-4">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowClientDropdown(!showClientDropdown)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-left flex items-center justify-between hover:border-textMuted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-textMuted" />
                        <span className={selectedClientId ? 'text-textMain' : 'text-textMuted'}>
                          {selectedClientId 
                            ? existingClients.find(c => c.id === selectedClientId)?.name 
                            : 'Select existing client'}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-textMuted transition-transform ${showClientDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown */}
                    {showClientDropdown && (
                      <div className="absolute z-50 w-full mt-2 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="max-h-60 overflow-y-auto">
                          {/* New Client Option */}
                          <button
                            type="button"
                            onClick={() => {
                              clearSelectedClient();
                              setShowClientDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-surfaceHighlight flex items-center gap-3 border-b border-border"
                          >
                            <Plus className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-500 font-medium">New Client</span>
                          </button>
                          
                          {/* Existing Clients */}
                          {existingClients.map(client => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => selectClient(client)}
                              className={`w-full px-4 py-3 text-left hover:bg-surfaceHighlight flex items-center gap-3 ${
                                selectedClientId === client.id ? 'bg-emerald-500/10' : ''
                              }`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-surfaceHighlight flex items-center justify-center text-textMuted">
                                {client.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-textMain truncate">{client.name}</div>
                                <div className="text-xs text-textMuted truncate">{client.email}</div>
                              </div>
                              {selectedClientId === client.id && (
                                <Check className="w-4 h-4 text-emerald-500" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Divider */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-textMuted">or enter manually</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">Client Name</label>
                  <input 
                    type="text" 
                    value={invoice.clientName}
                    onChange={e => {
                      setSelectedClientId(null);
                      setInvoice({...invoice, clientName: e.target.value});
                    }}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-textMain placeholder:text-textMuted/40 focus:border-emerald-500 focus:outline-none transition-colors"
                    placeholder=""
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">Client Email</label>
                  <input 
                    type="email" 
                    value={invoice.clientEmail}
                    onChange={e => {
                      setSelectedClientId(null);
                      setInvoice({...invoice, clientEmail: e.target.value});
                    }}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-textMain placeholder:text-textMuted/40 focus:border-emerald-500 focus:outline-none transition-colors"
                    placeholder=""
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h2 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Line Items
              </h2>
              <div className="space-y-3">
                {invoice.items.map((item) => (
                  <div key={item.id} className="flex gap-2 items-center group">
                    <input 
                      type="text" 
                      value={item.description}
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                      className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-textMain placeholder:text-textMuted/40 focus:border-emerald-500 focus:outline-none"
                      placeholder=""
                    />
                    <div className="relative w-28">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted">$</span>
                      <input 
                        type="number" 
                        value={item.amount || ''}
                        onChange={e => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full bg-background border border-border rounded-xl pl-7 pr-3 py-3 text-textMain placeholder:text-textMuted/40 focus:border-emerald-500 focus:outline-none text-right"
                        placeholder=""
                      />
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-textMuted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={addItem}
                className="mt-4 flex items-center gap-2 text-sm text-emerald-500 hover:text-emerald-400 font-medium"
              >
                <Plus className="w-4 h-4" /> Add Line Item
              </button>
              
              {/* Total */}
              <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                <span className="text-textMuted font-medium">Total</span>
                <span className="text-2xl font-bold text-textMain">${total.toLocaleString()}</span>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h2 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Dates
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">Issue Date</label>
                  <input 
                    type="date"
                    value={invoice.issueDate}
                    onChange={e => setInvoice({...invoice, issueDate: e.target.value})}
                    onDoubleClick={(e) => (e.target as HTMLInputElement).showPicker()}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-emerald-500 [color-scheme:dark] dark:[color-scheme:dark]"
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textMuted mb-2">Due Date</label>
                  <input 
                    type="date"
                    value={invoice.dueDate}
                    onChange={e => setInvoice({...invoice, dueDate: e.target.value})}
                    onDoubleClick={(e) => (e.target as HTMLInputElement).showPicker()}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-emerald-500 [color-scheme:dark] dark:[color-scheme:dark]"
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            {/* Template Selector (compact) */}
            <div>
              <h2 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-4 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4" /> Template
              </h2>
              <button
                onClick={() => setStep('templates')}
                className="w-full p-4 bg-background border border-border rounded-xl flex items-center justify-between hover:border-textMuted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surfaceHighlight rounded-lg flex items-center justify-center">
                    <Palette className="w-5 h-5 text-textMuted" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-textMain">{TEMPLATES.find(t => t.id === theme)?.name}</div>
                    <div className="text-xs text-textMuted">{TEMPLATES.find(t => t.id === theme)?.description}</div>
                  </div>
                </div>
                <span className="text-sm text-emerald-500">Change</span>
              </button>
            </div>

            {/* Customization Options */}
            <div>
              <button
                onClick={() => setShowCustomization(!showCustomization)}
                className="w-full flex items-center justify-between text-xs font-bold text-textMuted uppercase tracking-wider mb-4"
              >
                <span className="flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Customize Style
                  {isProMember && <span className="text-emerald-500 text-[10px] normal-case font-medium px-1.5 py-0.5 rounded bg-emerald-500/10">PRO</span>}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showCustomization ? 'rotate-180' : ''}`} />
              </button>
              
              {showCustomization && (
                <div className="space-y-4 p-4 bg-background border border-border rounded-xl">
                  {!isProMember && (
                    <div className="p-3 bg-surfaceHighlight border border-border rounded-lg mb-4">
                      <div className="flex items-center gap-2 text-textMuted text-sm">
                        <Lock className="w-4 h-4" />
                        <span>Upgrade to Pro to customize colors and fonts</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Text Color */}
                  <div className={!isProMember ? 'opacity-50 pointer-events-none' : ''}>
                    <label className="block text-sm font-medium text-textMuted mb-2">Text Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customization.textColor}
                        onChange={(e) => {
                          setCustomization({ ...customization, textColor: e.target.value });
                          setInvoice({ ...invoice, customization: { ...customization, textColor: e.target.value } });
                        }}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-border"
                      />
                      <input
                        type="text"
                        value={customization.textColor}
                        onChange={(e) => {
                          setCustomization({ ...customization, textColor: e.target.value });
                          setInvoice({ ...invoice, customization: { ...customization, textColor: e.target.value } });
                        }}
                        className="flex-1 bg-surfaceHighlight border border-border rounded-lg px-3 py-2 text-sm text-textMain"
                      />
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className={!isProMember ? 'opacity-50 pointer-events-none' : ''}>
                    <label className="block text-sm font-medium text-textMuted mb-2">Background Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customization.backgroundColor}
                        onChange={(e) => {
                          setCustomization({ ...customization, backgroundColor: e.target.value });
                          setInvoice({ ...invoice, customization: { ...customization, backgroundColor: e.target.value } });
                        }}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-border"
                      />
                      <input
                        type="text"
                        value={customization.backgroundColor}
                        onChange={(e) => {
                          setCustomization({ ...customization, backgroundColor: e.target.value });
                          setInvoice({ ...invoice, customization: { ...customization, backgroundColor: e.target.value } });
                        }}
                        className="flex-1 bg-surfaceHighlight border border-border rounded-lg px-3 py-2 text-sm text-textMain"
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className={!isProMember ? 'opacity-50 pointer-events-none' : ''}>
                    <label className="block text-sm font-medium text-textMuted mb-2">Accent Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customization.accentColor}
                        onChange={(e) => {
                          setCustomization({ ...customization, accentColor: e.target.value });
                          setInvoice({ ...invoice, customization: { ...customization, accentColor: e.target.value } });
                        }}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-border"
                      />
                      <input
                        type="text"
                        value={customization.accentColor}
                        onChange={(e) => {
                          setCustomization({ ...customization, accentColor: e.target.value });
                          setInvoice({ ...invoice, customization: { ...customization, accentColor: e.target.value } });
                        }}
                        className="flex-1 bg-surfaceHighlight border border-border rounded-lg px-3 py-2 text-sm text-textMain"
                      />
                    </div>
                  </div>

                  {/* Font Family */}
                  <div className={!isProMember ? 'opacity-50 pointer-events-none' : ''}>
                    <label className="block text-sm font-medium text-textMuted mb-2">Font Family</label>
                    <select
                      value={customization.fontFamily}
                      onChange={(e) => {
                        const font = e.target.value as InvoiceCustomization['fontFamily'];
                        setCustomization({ ...customization, fontFamily: font });
                        setInvoice({ ...invoice, customization: { ...customization, fontFamily: font } });
                      }}
                      className="w-full bg-surfaceHighlight border border-border rounded-lg px-3 py-2.5 text-sm text-textMain appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                    >
                      <option value="inter" className="bg-zinc-900">Inter (Modern Sans)</option>
                      <option value="georgia" className="bg-zinc-900">Georgia (Classic Serif)</option>
                      <option value="merriweather" className="bg-zinc-900">Merriweather (Elegant Serif)</option>
                      <option value="playfair" className="bg-zinc-900">Playfair Display (Luxury)</option>
                      <option value="roboto-mono" className="bg-zinc-900">Roboto Mono (Technical)</option>
                      <option value="space-grotesk" className="bg-zinc-900">Space Grotesk (Modern)</option>
                    </select>
                  </div>

                  {/* Reset Button */}
                  {isProMember && (
                    <button
                      onClick={() => {
                        const defaultCustomization: InvoiceCustomization = {
                          textColor: '#18181b',
                          backgroundColor: '#ffffff',
                          accentColor: '#10b981',
                          fontFamily: 'inter'
                        };
                        setCustomization(defaultCustomization);
                        setInvoice({ ...invoice, customization: defaultCustomization });
                      }}
                      className="w-full py-2 text-sm text-textMuted hover:text-textMain transition-colors"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Validation Status */}
            {!isReadyToSend && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-500">Complete the form to send</p>
                    <ul className="text-xs text-yellow-500/80 mt-1 space-y-0.5">
                      {!invoice.clientName.trim() && <li>• Add client name</li>}
                      {!invoice.clientEmail.trim() && <li>• Add client email</li>}
                      {invoice.clientEmail && !isValidEmail(invoice.clientEmail) && <li>• Enter a valid email</li>}
                      {!invoice.items.some(i => i.description.trim() && i.amount > 0) && <li>• Add at least one line item</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Live Preview */}
        <div className={`hidden lg:flex flex-1 bg-surfaceHighlight items-start justify-center overflow-y-auto h-[calc(100vh-64px)] p-8 ${showMobilePreview ? 'lg:hidden flex' : ''}`}>
          <div className="w-full max-w-xl sticky top-8">
            <div className="text-center mb-4">
              <span className="text-xs font-medium text-textMuted uppercase tracking-wider">Live Preview</span>
            </div>
            <div className="transform transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden">
              <InvoicePreviewCard 
                data={{ 
                  ...invoice, 
                  amount: total, 
                  theme,
                  clientName: invoice.clientName || 'Client Name',
                  clientEmail: invoice.clientEmail || 'client@email.com',
                  items: invoice.items.map(i => ({
                    ...i,
                    description: i.description || 'Item Description',
                    amount: i.amount || 0
                  }))
                }}
                userProfile={userProfile}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mini Invoice Preview for Template Selection - Shows actual template style
const MiniInvoicePreview: React.FC<{ theme: InvoiceTheme }> = ({ theme }) => {
  // Each template has its own unique visual design
  switch(theme) {
    case 'minimal':
      return (
        <div className="bg-white rounded-lg p-3 shadow-lg text-[10px]">
          <div className="flex justify-between items-start mb-2">
            <div className="w-6 h-6 bg-emerald-500 rounded" />
            <div className="text-right text-gray-400 text-[8px]">INV-001</div>
          </div>
          <div className="text-gray-900 font-semibold mb-1">Acme Corp</div>
          <div className="text-xl font-bold text-gray-900 mb-2">$2,500</div>
          <div className="border-t border-gray-100 pt-2 space-y-1">
            <div className="flex justify-between text-gray-500">
              <span>Design Services</span>
              <span>$2,500</span>
            </div>
          </div>
        </div>
      );
    
    case 'corporate':
      return (
        <div className="bg-slate-50 rounded-lg p-3 shadow-lg text-[10px] border border-slate-200">
          <div className="border-b-2 border-slate-800 pb-2 mb-2">
            <div className="font-serif font-bold text-slate-800 text-sm">INVOICE</div>
            <div className="text-slate-500 text-[8px]">Professional Services</div>
          </div>
          <div className="flex justify-between mb-2">
            <div className="text-slate-700">Client Co.</div>
            <div className="font-bold text-slate-900">$4,200</div>
          </div>
          <div className="bg-slate-100 p-1 rounded text-[8px] text-slate-600">
            Consulting • Strategy • Implementation
          </div>
        </div>
      );
    
    case 'startup':
      return (
        <div className="bg-white rounded-xl p-3 shadow-lg text-[10px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 bg-blue-500 rounded-lg" />
            <span className="font-bold text-gray-900">startup.io</span>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 mb-2">
            <div className="text-blue-600 text-[8px] font-medium">AMOUNT DUE</div>
            <div className="text-xl font-bold text-blue-600">$3,800</div>
          </div>
          <div className="text-gray-500 text-[8px]">MVP Development Package</div>
        </div>
      );
    
    case 'agency':
      return (
        <div className="bg-white rounded-lg p-3 shadow-lg text-[10px] text-center">
          <div className="w-8 h-8 bg-black rounded-full mx-auto mb-2" />
          <div className="text-[8px] text-gray-400 uppercase tracking-widest mb-1">Invoice</div>
          <div className="text-3xl font-black text-black mb-2">$7,500</div>
          <div className="text-gray-500 text-[8px]">Brand Strategy & Identity</div>
        </div>
      );
    
    case 'creative':
      return (
        <div className="bg-zinc-900 rounded-lg p-3 shadow-lg text-[10px]">
          <div className="flex justify-between items-center mb-2">
            <div className="text-white font-bold">STUDIO</div>
            <div className="text-zinc-500 text-[8px]">#2024</div>
          </div>
          <div className="text-2xl font-bold text-white mb-2">$4,500</div>
          <div className="flex gap-1">
            <span className="px-1.5 py-0.5 bg-white text-black rounded text-[8px]">Design</span>
            <span className="px-1.5 py-0.5 bg-zinc-700 text-white rounded text-[8px]">Motion</span>
          </div>
        </div>
      );
    
    case 'tech':
      return (
        <div className="bg-zinc-950 rounded-lg p-3 shadow-lg text-[10px] font-mono">
          <div className="text-emerald-500 text-[8px] mb-1">$ invoice --generate</div>
          <div className="text-emerald-400 mb-2">
            <span className="text-zinc-500">amount:</span> $3,200
          </div>
          <div className="text-zinc-500 text-[8px]">
            <div>client: "TechCorp"</div>
            <div>service: "API Integration"</div>
          </div>
        </div>
      );
    
    case 'elegant':
      return (
        <div className="bg-amber-50 rounded-lg p-3 shadow-lg text-[10px] border border-amber-200">
          <div className="text-center border-b border-amber-300 pb-2 mb-2">
            <div className="text-amber-800 font-serif text-sm">✦ INVOICE ✦</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-serif text-amber-900">$5,000</div>
            <div className="text-amber-600 text-[8px] mt-1">Luxury Consulting</div>
          </div>
        </div>
      );
    
    case 'modern':
      return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 shadow-lg text-[10px]">
          <div className="flex justify-between items-start mb-2">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg" />
            <div className="text-gray-400 text-[8px]">2024-001</div>
          </div>
          <div className="text-gray-800 font-medium mb-1">Modern Co.</div>
          <div className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">$2,800</div>
        </div>
      );
    
    case 'classic':
      return (
        <div className="bg-stone-100 rounded-lg p-3 shadow-lg text-[10px] border-2 border-stone-300">
          <div className="border-b-2 border-double border-stone-400 pb-1 mb-2">
            <div className="font-serif font-bold text-stone-800 text-center">INVOICE</div>
          </div>
          <div className="text-center">
            <div className="text-stone-600 text-[8px]">Amount Due</div>
            <div className="text-xl font-bold text-stone-800">$1,800</div>
          </div>
        </div>
      );
    
    case 'consultant':
      return (
        <div className="bg-white rounded-lg p-3 shadow-lg text-[10px] border-l-4 border-teal-500">
          <div className="flex justify-between items-center mb-2">
            <div className="font-bold text-gray-800">Consultant</div>
            <div className="text-teal-500 text-[8px]">INV-001</div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[8px] text-gray-500 mb-2">
            <div>Hours: 40</div>
            <div>Rate: $150/hr</div>
          </div>
          <div className="text-right font-bold text-teal-600">$6,000</div>
        </div>
      );
    
    default:
      return (
        <div className="bg-white rounded-lg p-3 shadow-lg text-[10px]">
          <div className="text-gray-900 font-bold mb-2">Invoice</div>
          <div className="text-xl font-bold text-emerald-500">$1,500</div>
        </div>
      );
  }
};

interface InvoicePreviewProps {
  data: Invoice;
  minimal?: boolean;
  userProfile?: UserProfile;
}

// Font family mapping
const fontFamilyMap: Record<string, string> = {
  'inter': "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  'georgia': "Georgia, 'Times New Roman', serif",
  'merriweather': "'Merriweather', Georgia, serif",
  'playfair': "'Playfair Display', Georgia, serif",
  'roboto-mono': "'Roboto Mono', 'Courier New', monospace",
  'space-grotesk': "'Space Grotesk', -apple-system, sans-serif"
};

export const InvoicePreviewCard: React.FC<InvoicePreviewProps> = ({ data, minimal, userProfile }) => {
    const itemsTotal = data.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const total = itemsTotal > 0 ? itemsTotal : (data.amount || 0);
    const theme = data.theme || 'minimal';
    const customization = data.customization;
    
    // Check if custom styles should be applied
    const hasCustomization = customization && (
      customization.textColor !== '#18181b' ||
      customization.backgroundColor !== '#ffffff' ||
      customization.accentColor !== '#10b981' ||
      customization.fontFamily !== 'inter'
    );
    
    // Custom inline styles
    const customStyles: React.CSSProperties = hasCustomization ? {
      backgroundColor: customization?.backgroundColor || '#ffffff',
      color: customization?.textColor || '#18181b',
      fontFamily: fontFamilyMap[customization?.fontFamily || 'inter']
    } : {};
    
    // THEME CONFIGURATION
    const getThemeStyles = (t: string) => {
        switch(t) {
            case 'creative':
                return {
                    container: "bg-[#111] text-white border-zinc-800",
                    headerText: "text-white font-sans",
                    mutedText: "text-zinc-500",
                    border: "border-zinc-800",
                    accentBg: "bg-white text-black",
                    font: "font-sans"
                };
            case 'agency':
                 return {
                    container: "bg-white text-black border-zinc-200 font-sans",
                    headerText: "text-black font-sans font-bold",
                    mutedText: "text-zinc-400",
                    border: "border-zinc-100",
                    accentBg: "bg-black text-white",
                    font: "font-sans"
                };
            case 'corporate':
                return {
                    container: "bg-white text-slate-900 border-slate-200 font-serif",
                    headerText: "text-slate-900 font-serif tracking-tight",
                    mutedText: "text-slate-500",
                    border: "border-slate-200",
                    accentBg: "bg-slate-900 text-white",
                    font: "font-serif"
                };
            case 'startup':
                return {
                    container: "bg-white text-zinc-900 border-zinc-200 font-sans",
                    headerText: "text-emerald-600 font-bold tracking-tight",
                    mutedText: "text-zinc-500",
                    border: "border-zinc-100",
                    accentBg: "bg-emerald-500 text-white",
                    font: "font-sans"
                };
            case 'tech':
                return {
                    container: "bg-black text-green-400 border-green-900/50 font-mono",
                    headerText: "text-green-500 font-mono uppercase",
                    mutedText: "text-green-700",
                    border: "border-green-900/30",
                    accentBg: "bg-green-500 text-black",
                    font: "font-mono"
                };
            case 'elegant':
                return {
                    container: "bg-[#faf9f6] text-stone-800 border-stone-200",
                    headerText: "text-stone-900 font-serif italic",
                    mutedText: "text-stone-500",
                    border: "border-stone-200",
                    accentBg: "bg-stone-800 text-[#faf9f6]",
                    font: "font-serif"
                };
            case 'modern':
                return {
                    container: "bg-slate-50 text-slate-800 border-slate-200 shadow-lg",
                    headerText: "text-indigo-600 font-sans font-bold",
                    mutedText: "text-slate-400",
                    border: "border-slate-200",
                    accentBg: "bg-indigo-600 text-white",
                    font: "font-sans"
                };
            case 'classic':
                return {
                    container: "bg-white text-gray-900 border-double border-4 border-gray-300",
                    headerText: "text-gray-900 font-serif uppercase tracking-widest",
                    mutedText: "text-gray-500",
                    border: "border-gray-300",
                    accentBg: "bg-gray-800 text-white",
                    font: "font-serif"
                };
            case 'consultant':
                return {
                    container: "bg-white text-neutral-800 border-neutral-200",
                    headerText: "text-neutral-800 font-sans font-light tracking-wide",
                    mutedText: "text-neutral-400",
                    border: "border-neutral-200",
                    accentBg: "bg-neutral-200 text-neutral-800",
                    font: "font-sans"
                };
            case 'minimal':
            default:
                return {
                    container: "bg-white text-black border-zinc-200",
                    headerText: "text-gray-900 font-sans font-bold",
                    mutedText: "text-gray-500",
                    border: "border-gray-100",
                    accentBg: "bg-black text-white",
                    font: "font-sans"
                };
        }
    };
    
    const styles = getThemeStyles(theme);

    // Get user display info
    const userName = userProfile?.name || 'Your Business';
    const userInitial = userName.charAt(0).toUpperCase();
    const userLogo = userProfile?.logo_url || userProfile?.avatar_url;
    
    // Calculate days until due
    const daysUntilDue = data.dueDate 
        ? Math.ceil((new Date(data.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 14;

    if (theme === 'agency') {
        return (
             <div className={`w-full aspect-[3/4] md:aspect-auto md:min-h-[600px] rounded-lg shadow-2xl p-8 md:p-12 relative overflow-hidden flex flex-col border transition-colors duration-300 ${hasCustomization ? '' : styles.container}`} style={customStyles}>
                {/* Header - USER/SENDER Info */}
                <div className="flex justify-between items-start mb-8">
                     <div className="flex items-center gap-3">
                         {userLogo ? (
                             <img src={userLogo} alt={userName} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                         ) : (
                             <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-sm ${styles.accentBg}`}>
                                 {userInitial}
                             </div>
                         )}
                         <div>
                             <div className={`text-lg font-bold ${styles.headerText}`}>{userName}</div>
                             <div className={`text-xs ${styles.mutedText}`}>{userProfile?.email || ''}</div>
                         </div>
                     </div>
                     <div className="text-right">
                         <div className={`text-xs uppercase tracking-widest ${styles.mutedText}`}>Invoice #</div>
                         <div className={`font-mono text-lg ${styles.headerText}`}>{data.invoiceNumber}</div>
                     </div>
                </div>

                {/* Center Amount */}
                <div className="text-center mb-8">
                    <div className={`text-xs font-bold uppercase tracking-widest mb-4 ${styles.mutedText}`}>Amount Due</div>
                    <div className={`text-6xl font-bold tracking-tight ${styles.headerText}`}>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>

                {/* Billed To - CLIENT Info */}
                <div className={`mb-8 p-4 rounded-lg ${theme === 'agency' ? 'bg-gray-50' : 'bg-gray-50'}`}>
                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.mutedText}`}>Billed To</div>
                    <div className={`font-bold ${styles.headerText}`}>{data.clientName || 'Client Name'}</div>
                    <div className={`text-sm ${styles.mutedText}`}>{data.clientEmail || 'client@email.com'}</div>
                </div>

                {/* Items */}
                <div className="flex-1 border-t pt-6 border-zinc-100">
                    <div className="space-y-4">
                        {data.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-2">
                                <span className={`font-medium ${styles.font}`}>{item.description || 'Service'}</span>
                                <span className={`${styles.mutedText} font-mono`}>${item.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        ))}
                    </div>
                </div>

                 {/* Footer / Stripe Integration */}
                <div className={`mt-auto pt-6 border-t ${styles.border}`}>
                    {!minimal && (
                        <div className={`rounded-xl p-4 flex items-center justify-between border ${styles.border} bg-gray-50`}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#635BFF] rounded flex items-center justify-center text-white font-bold text-xs">S</div>
                                <div className="text-xs">
                                    <div className="font-bold text-gray-900">Secure Payment</div>
                                    <div className={styles.mutedText}>Processed by Stripe</div>
                                </div>
                            </div>
                            <div className={`flex items-center gap-2 text-xs ${styles.mutedText}`}>
                                <ShieldCheck className="w-3 h-3" /> Encrypted
                            </div>
                        </div>
                    )}
                    <div className={`mt-4 flex justify-between items-center text-xs ${styles.mutedText}`}>
                        <span>Due in {daysUntilDue} days</span>
                        <span>Thank you for your business</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full aspect-[3/4] md:aspect-auto md:min-h-[600px] rounded-lg shadow-2xl p-8 md:p-12 relative overflow-hidden flex flex-col border transition-colors duration-300 ${hasCustomization ? '' : styles.container}`} style={customStyles}>
            
            {/* Header - USER/SENDER Info */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    {userLogo ? (
                        <img src={userLogo} alt={userName} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                    ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-sm ${styles.accentBg}`}>
                            {userInitial}
                        </div>
                    )}
                    <div>
                        <div className={`text-lg ${styles.headerText}`}>{userName}</div>
                        <div className={`text-sm ${styles.mutedText}`}>Invoice #{data.invoiceNumber}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${styles.mutedText}`}>Amount Due</div>
                    <div className={`text-3xl font-bold ${styles.headerText}`}>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
            </div>

            {/* Billed To - CLIENT Info */}
            <div className={`mb-8 p-4 rounded-lg ${theme === 'creative' ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${styles.mutedText}`}>Billed To</div>
                <div className={`font-bold ${styles.headerText}`}>{data.clientName || 'Client Name'}</div>
                <div className={`text-sm ${styles.mutedText}`}>{data.clientEmail || 'client@email.com'}</div>
            </div>

            {/* Content */}
            <div className="flex-1">
                {/* Table Header */}
                <div className={`flex justify-between text-xs font-bold uppercase tracking-wider border-b pb-4 mb-4 ${styles.mutedText} ${styles.border}`}>
                    <span>Description</span>
                    <span>Amount</span>
                </div>
                
                {/* Line Items */}
                <div className="space-y-4">
                    {data.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-start">
                            <span className={`font-medium ${styles.font}`}>{item.description || 'Item Description'}</span>
                            <span className={`${styles.mutedText} font-mono`}>${item.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer / Stripe Integration */}
            <div className={`mt-auto pt-6 border-t ${styles.border}`}>
                 {!minimal && (
                     <div className={`rounded-xl p-4 flex items-center justify-between border ${theme === 'creative' ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-100'}`}>
                         <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-[#635BFF] rounded flex items-center justify-center text-white font-bold text-xs">S</div>
                             <div className="text-xs">
                                 <div className={`font-bold ${theme === 'creative' ? 'text-white' : 'text-gray-900'}`}>Secure Payment</div>
                                 <div className={styles.mutedText}>Processed by Stripe</div>
                             </div>
                         </div>
                         <div className={`flex items-center gap-2 text-xs ${styles.mutedText}`}>
                             <ShieldCheck className="w-3 h-3" /> Encrypted
                         </div>
                     </div>
                 )}
                 <div className={`mt-4 flex justify-between items-center text-xs ${styles.mutedText}`}>
                     <span>Due in {daysUntilDue} days</span>
                     <span>Thank you for your business</span>
                 </div>
            </div>
        </div>
    );
};

export const ClientInvoiceView: React.FC<{ invoice: Invoice; onPay: () => void; onBack: () => void }> = ({ invoice, onPay, onBack }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const handlePay = () => {
        setIsProcessing(true);
        // SECURITY: Simulated Server-side handshake
        // In reality, this would await a POST to /api/create-payment-intent
        // Then confirm on backend via webhook
        setTimeout(() => {
            setIsProcessing(false);
            setSuccess(true);
            setTimeout(onPay, 2000);
        }, 1500);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="bg-surface border border-border rounded-3xl p-12 text-center max-w-sm w-full animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                        <Check className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-textMain mb-2">Payment Received</h2>
                    <p className="text-textMuted">Transfer initiated to bank.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 md:px-6">
            <div className="w-full max-w-4xl mb-8 flex justify-between items-center">
                 <div className="flex items-center gap-2 text-textMain font-bold text-xl"><Logo /></div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
                 <div className="flex-1">
                     <InvoicePreviewCard data={invoice} minimal={false} />
                 </div>
                 
                 <div className="w-full md:w-80 space-y-4">
                     <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl sticky top-8">
                         <div className="text-sm text-textMuted mb-1">Total Due</div>
                         <div className="text-4xl font-bold text-textMain mb-6">${invoice.amount.toLocaleString()}</div>
                         
                         <button 
                            onClick={handlePay}
                            disabled={isProcessing}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                         >
                            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Pay Invoice'}
                         </button>
                         
                         <div className="mt-4 flex items-center justify-center gap-2 text-xs text-textMuted">
                             <ShieldCheck className="w-3 h-3" /> Secure 256-bit SSL Encrypted
                         </div>

                         <div className="mt-6 pt-6 border-t border-border">
                             <div className="flex justify-between text-sm mb-2">
                                 <span className="text-textMuted">Invoice #</span>
                                 <span className="text-textMain">{invoice.invoiceNumber}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                 <span className="text-textMuted">Due Date</span>
                                 <span className="text-textMain">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                             </div>
                         </div>
                     </div>
                 </div>
            </div>
        </div>
    );
};
