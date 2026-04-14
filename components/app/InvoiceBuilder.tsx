
import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, InvoiceTheme, InvoiceCustomization } from '../../types';
import { Button, Navbar, Logo } from '../ui/Shared';
import { Modal, ConfirmModal } from '../ui/Modal';
import { Plus, Trash2, ArrowLeft, Send, Check, Loader2, ShieldCheck, CreditCard, Building2, X, Mail, Bell, Clock, Calendar, AlertCircle, RefreshCw, FileText, AlertTriangle, ChevronDown, User, Users, Copy, ArrowUpRight } from 'lucide-react';
import { getNextInvoiceNumber } from '../../src/lib/invoices';
import { supabase } from '../../src/lib/supabase';

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

const TEMPLATES: { id: InvoiceTheme; name: string; description: string; items?: InvoiceItem[] }[] = [
    {
      id: 'agency', name: 'Agency', description: 'Big centered amount. Focus on value.',
      items: [{ id: '1', description: 'Brand Strategy', amount: 4500 }, { id: '2', description: 'Visual Identity', amount: 3000 }]
    },
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

export const InvoiceModal: React.FC<{ invoice: Invoice; onClose: () => void; userProfile?: UserProfile; onRefresh?: () => void }> = ({ invoice, onClose, userProfile, onRefresh }) => {
  // Prevent clicks inside the modal from closing it
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const [markingPaid, setMarkingPaid] = React.useState(false);
  const [downloadingPdf, setDownloadingPdf] = React.useState(false);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/api/invoice/${invoice.id}/pdf`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleMarkPaid = async () => {
    setMarkingPaid(true);
    try {
      await supabase
        .from('invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', invoice.id);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      console.error('Mark as paid failed:', err);
    } finally {
      setMarkingPaid(false);
    }
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

                 {/* PDF Download + Mark as Paid */}
                 <div className="flex gap-2">
                   <button
                     onClick={handleDownloadPdf}
                     disabled={downloadingPdf}
                     className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-medium text-textMain hover:border-textMuted transition-colors disabled:opacity-50"
                   >
                     {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                     Download PDF
                   </button>
                   {!isPaid && (
                     <button
                       onClick={handleMarkPaid}
                       disabled={markingPaid}
                       className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm font-medium text-emerald-500 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                     >
                       {markingPaid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                       Mark as Paid
                     </button>
                   )}
                 </div>

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
  const [theme, setTheme] = useState<InvoiceTheme>('agency');
  const [isSending, setIsSending] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  
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
    theme: 'agency',
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

  // Editor with Live Preview
  return (
    <div className="min-h-screen bg-background text-textMain flex flex-col">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={onCancel} className="flex items-center gap-2 text-textMuted hover:text-textMain transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Back</span>
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
                <span className="text-2xl font-bold text-textMain">{getCurrencySymbol(invoice.currency)}{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
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

const getCurrencySymbol = (currency?: string): string => {
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'CA$', AUD: 'A$', CHF: 'CHF ', NZD: 'NZ$' };
  return symbols[(currency || 'USD').toUpperCase()] ?? ((currency || 'USD').toUpperCase() + ' ');
};

export const InvoicePreviewCard: React.FC<InvoicePreviewProps> = ({ data, minimal, userProfile }) => {
    const itemsTotal = data.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const total = itemsTotal > 0 ? itemsTotal : (data.amount || 0);
    const theme = data.theme || 'minimal';
    const currencySymbol = getCurrencySymbol(data.currency);
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
                    <div className={`text-6xl font-bold tracking-tight ${styles.headerText}`}>{currencySymbol}{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
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
                                <span className={`${styles.mutedText} font-mono`}>{currencySymbol}{item.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
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
