
import React, { useState } from 'react';
import { Invoice, InvoiceItem, InvoiceTheme } from '../../types';
import { Button, Navbar, Logo } from '../ui/Shared';
import { Plus, Trash2, ArrowLeft, Send, Check, Loader2, ShieldCheck, CreditCard, LayoutTemplate, Building2, Palette, X, Mail, Bell, Clock, Calendar, AlertCircle, RefreshCw, FileText, Lock, Zap, Crown } from 'lucide-react';

// SECURITY: Validation Helper
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

interface InvoiceBuilderProps {
  onCancel: () => void;
  onSave: (invoice: Invoice) => void;
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

export const InvoiceModal: React.FC<{ invoice: Invoice; onClose: () => void }> = ({ invoice, onClose }) => {
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
            className="absolute top-4 right-4 z-50 p-2 text-textMuted hover:text-textMain transition-colors bg-surface/50 hover:bg-surface rounded-full backdrop-blur-md border border-border"
         >
            <X className="w-5 h-5" />
         </button>

         {/* Left Side: Invoice Preview */}
         <div className="flex-1 bg-surfaceHighlight overflow-y-auto custom-scrollbar p-6 flex flex-col items-center border-b lg:border-b-0 lg:border-r border-border">
             <div className="w-full max-w-[480px] scale-[0.95] origin-top shadow-xl">
                {/* Use minimal prop to remove Stripe footer in report view */}
                <InvoicePreviewCard data={invoice} minimal={true} />
             </div>
         </div>

         {/* Right Side: Report & Activity */}
         <div className="w-full lg:w-[420px] bg-background p-8 overflow-y-auto custom-scrollbar">
             <div className="space-y-8">
                 
                 {/* Header Status */}
                 <div>
                     <div className="flex items-center justify-between mb-1">
                        <h2 className="text-xl font-bold text-textMain">Invoice #{invoice.invoiceNumber}</h2>
                        <span className="text-textMuted font-mono text-sm">${invoice.amount.toLocaleString()}</span>
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
                                   : 'Client has viewed the invoice but not yet paid.'
                                 }
                             </div>
                         </div>
                     </div>
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


export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ onCancel, onSave }) => {
  const [step, setStep] = useState<'edit' | 'preview'>('edit');
  const [theme, setTheme] = useState<InvoiceTheme>('agency'); // CHANGED DEFAULT TO AGENCY
  const [isProMember, setIsProMember] = useState(false); // Simulate Pro Membership state
  
  const [invoice, setInvoice] = useState<Invoice>({
    id: crypto.randomUUID(), // SECURITY: Secure ID
    invoiceNumber: String(Math.floor(1000 + Math.random() * 9000)),
    clientName: '',
    clientEmail: '',
    items: [{ id: '1', description: '', amount: 0 }],
    status: 'pending',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    amount: 0,
    remindersEnabled: true,
    theme: 'agency' // CHANGED DEFAULT TO AGENCY
  });

  const [isSending, setIsSending] = useState(false);

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
    setInvoice({
      ...invoice,
      items: invoice.items.filter(item => item.id !== id)
    });
  };

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
      if (t.isPremium && !isProMember) {
          alert("This template is for Pro members only. Click 'Upgrade' to simulate upgrading.");
          return;
      }
      setTheme(t.id);
      setInvoice({
          ...invoice,
          theme: t.id,
          items: t.items ? [...t.items] : invoice.items
      });
  };

  const handleSave = () => {
    // SECURITY: Input Validation before sending
    if (!invoice.clientName.trim() || !invoice.clientEmail.trim()) {
        alert('Please fill in client details.');
        return;
    }
    if (!isValidEmail(invoice.clientEmail)) {
        alert('Invalid email address.');
        return;
    }
    if (invoice.items.length === 0 || invoice.items.some(i => i.amount <= 0)) {
        alert('Please add valid line items.');
        return;
    }

    setIsSending(true);
    // Simulate API Call
    setTimeout(() => {
        onSave({
            ...invoice, 
            amount: invoice.items.reduce((sum, item) => sum + item.amount, 0),
            theme: theme,
            logs: [
                { id: crypto.randomUUID(), date: new Date().toISOString(), type: 'sent', message: 'Invoice sent to client' }
            ]
        });
    }, 1500);
  };

  if (step === 'preview') {
      return (
          <div className="min-h-screen bg-background text-textMain pt-20 pb-12 px-4 flex flex-col items-center animate-in slide-in-from-right duration-300">
              <div className="w-full max-w-4xl mb-8 flex justify-between items-center">
                  <Button variant="ghost" onClick={() => setStep('edit')} icon={<ArrowLeft className="w-4 h-4" />}>Back to Edit</Button>
                  <Button onClick={handleSave} disabled={isSending}>
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                      {isSending ? 'Sending...' : 'Send Invoice'}
                  </Button>
              </div>
              
              <div className="w-full max-w-2xl transform transition-all">
                  <InvoicePreviewCard data={{ ...invoice, amount: invoice.items.reduce((sum, item) => sum + item.amount, 0), theme }} />
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-background text-textMain">
      <Navbar onAction={() => setStep('preview')} actionLabel="Preview Invoice" isApp onBack={onCancel} />
      
      <div className="max-w-4xl mx-auto pt-24 px-6 pb-20">
        <h1 className="text-3xl font-bold mb-8">New Invoice</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-8">
                {/* Client Info */}
                <div className="bg-surface border border-border rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4">Client Details</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-textMuted mb-1">Client Name</label>
                            <input 
                                type="text" 
                                value={invoice.clientName}
                                onChange={e => setInvoice({...invoice, clientName: e.target.value})}
                                className="w-full bg-background border border-border rounded-lg p-3 text-textMain focus:border-emerald-500 focus:outline-none transition-colors"
                                placeholder="e.g. Acme Corp"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-textMuted mb-1">Client Email</label>
                            <input 
                                type="email" 
                                value={invoice.clientEmail}
                                onChange={e => setInvoice({...invoice, clientEmail: e.target.value})}
                                className="w-full bg-background border border-border rounded-lg p-3 text-textMain focus:border-emerald-500 focus:outline-none transition-colors"
                                placeholder="billing@acme.com"
                            />
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-surface border border-border rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4">Line Items</h2>
                    <div className="space-y-3">
                        {invoice.items.map((item, index) => (
                            <div key={item.id} className="flex gap-3 items-start animate-in slide-in-from-left duration-200">
                                <div className="flex-1">
                                    <input 
                                        type="text" 
                                        value={item.description}
                                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg p-3 text-textMain focus:border-emerald-500 focus:outline-none"
                                        placeholder="Description of work..."
                                    />
                                </div>
                                <div className="w-32">
                                    <input 
                                        type="number" 
                                        value={item.amount || ''}
                                        onChange={e => updateItem(item.id, 'amount', parseFloat(e.target.value))}
                                        className="w-full bg-background border border-border rounded-lg p-3 text-textMain focus:border-emerald-500 focus:outline-none text-right"
                                        placeholder="0.00"
                                    />
                                </div>
                                <button 
                                    onClick={() => removeItem(item.id)}
                                    className="p-3 text-textMuted hover:text-red-500 hover:bg-surfaceHighlight rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={addItem}
                        className="mt-4 flex items-center gap-2 text-sm text-emerald-500 hover:text-emerald-400 font-medium px-2 py-1 rounded hover:bg-emerald-500/10 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Item
                    </button>
                    
                    <div className="mt-8 border-t border-border pt-6 flex justify-between items-center">
                        <span className="text-textMuted">Total</span>
                        <span className="text-2xl font-bold">${invoice.items.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            {/* Sidebar Settings */}
            <div className="space-y-6">
                 {/* Upgrade Simulator */}
                 <div className={`p-4 rounded-xl border flex items-center justify-between ${isProMember ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-surfaceHighlight border-border'}`}>
                    <div className="flex items-center gap-2 text-sm font-bold">
                        {isProMember ? <Zap className="w-4 h-4" /> : <Lock className="w-4 h-4 text-textMuted" />}
                        {isProMember ? 'Pro Active' : 'Free Plan'}
                    </div>
                    <button 
                        onClick={() => setIsProMember(!isProMember)}
                        className="text-xs underline hover:no-underline"
                    >
                        {isProMember ? 'Downgrade' : 'Upgrade'}
                    </button>
                 </div>

                 {/* Templates */}
                <div className="bg-surface border border-border rounded-2xl p-6">
                    <h2 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-4 flex items-center gap-2">
                        <LayoutTemplate className="w-4 h-4" /> Templates
                    </h2>
                    <div className="space-y-3">
                        {TEMPLATES.map((t) => {
                            const isLocked = t.isPremium && !isProMember;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => applyTemplate(t)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all relative group ${
                                        theme === t.id
                                        ? 'bg-surfaceHighlight border-emerald-500 ring-1 ring-emerald-500'
                                        : 'bg-background border-border hover:border-textMuted'
                                    } ${isLocked ? 'opacity-70 cursor-not-allowed hover:border-border' : ''}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <div className={`font-bold text-sm ${theme === t.id ? 'text-textMain' : 'text-textMain'}`}>{t.name}</div>
                                        {t.isPremium && (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${isLocked ? 'bg-surface text-textMuted' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500'}`}>
                                                {isLocked ? <Lock className="w-3 h-3" /> : <Crown className="w-3 h-3" />}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-textMuted">{t.description}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Dates */}
                <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-textMuted uppercase mb-2">Issue Date</label>
                        <input 
                            type="date"
                            value={invoice.issueDate}
                            onChange={(e) => setInvoice({...invoice, issueDate: e.target.value})} 
                            className="w-full bg-background border border-border rounded-lg p-2 text-sm text-textMain focus:outline-none focus:border-emerald-500"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-textMuted uppercase mb-2">Due Date</label>
                        <input 
                            type="date"
                            value={invoice.dueDate}
                            onChange={(e) => setInvoice({...invoice, dueDate: e.target.value})} 
                            className="w-full bg-background border border-border rounded-lg p-2 text-sm text-textMain focus:outline-none focus:border-emerald-500"
                        />
                     </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export const InvoicePreviewCard: React.FC<{ data: Invoice; minimal?: boolean }> = ({ data, minimal }) => {
    const total = data.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const theme = data.theme || 'minimal';
    
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

    if (theme === 'agency') {
        return (
             <div className={`w-full aspect-[3/4] md:aspect-auto md:min-h-[600px] rounded-lg shadow-2xl p-8 md:p-12 relative overflow-hidden flex flex-col border transition-colors duration-300 ${styles.container}`}>
                {/* Header Agency Style */}
                <div className="flex justify-between items-start mb-16">
                     <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-sm ${styles.accentBg}`}>
                             {data.clientName ? data.clientName.charAt(0).toUpperCase() : 'C'}
                         </div>
                         <div className={`text-xl font-bold ${styles.headerText}`}>{data.clientName || 'Client Name'}</div>
                     </div>
                     <div className="text-right">
                         <div className={`text-xs uppercase tracking-widest ${styles.mutedText}`}>Invoice #</div>
                         <div className={`font-mono text-lg ${styles.headerText}`}>{data.invoiceNumber}</div>
                     </div>
                </div>

                {/* Center Amount */}
                <div className="text-center mb-16">
                    <div className={`text-xs font-bold uppercase tracking-widest mb-4 ${styles.mutedText}`}>Amount Due</div>
                    <div className={`text-6xl font-bold tracking-tight ${styles.headerText}`}>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>

                {/* Items */}
                <div className="flex-1 border-t pt-8 border-zinc-100">
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
                <div className={`mt-auto pt-8 border-t ${styles.border}`}>
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
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full aspect-[3/4] md:aspect-auto md:min-h-[600px] rounded-lg shadow-2xl p-8 md:p-12 relative overflow-hidden flex flex-col border transition-colors duration-300 ${styles.container}`}>
            
            {/* Header */}
            <div className="flex justify-between items-start mb-16">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shadow-sm ${styles.accentBg}`}>
                        {data.clientName ? data.clientName.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                        <div className={`text-lg ${styles.headerText}`}>{data.clientName || 'Client Name'}</div>
                        <div className={`text-sm ${styles.mutedText}`}>Invoice #{data.invoiceNumber}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${styles.mutedText}`}>Amount Due</div>
                    <div className={`text-3xl font-bold ${styles.headerText}`}>${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
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
            <div className={`mt-auto pt-8 border-t ${styles.border}`}>
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
                 <div className={`mt-6 flex justify-between items-center text-xs ${styles.mutedText}`}>
                     <span>Due in 14 days</span>
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
