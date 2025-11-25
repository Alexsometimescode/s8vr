
import React, { useState } from 'react';
import { Invoice, InvoiceItem, InvoiceTheme } from '../../types';
import { Button, Navbar, Logo } from '../ui/Shared';
import { Plus, Trash2, ArrowLeft, Send, Check, Loader2, ShieldCheck, CreditCard, LayoutTemplate, Building2, Palette, X, Mail, Bell, Clock, Calendar, AlertCircle, RefreshCw, FileText } from 'lucide-react';

interface InvoiceBuilderProps {
  onCancel: () => void;
  onSave: (invoice: Invoice) => void;
}

const TEMPLATES: { id: InvoiceTheme; name: string; description: string; items?: InvoiceItem[] }[] = [
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean whitespace. Pure simplicity.',
    },
    {
      id: 'corporate',
      name: 'Corporate',
      description: 'Structured header. Professional serif fonts.',
      items: [
          { id: '1', description: 'Consultation Services', amount: 1500 },
          { id: '2', description: 'Implementation Phase', amount: 3500 }
      ]
    },
    {
      id: 'creative',
      name: 'Creative',
      description: 'Dark mode aesthetic. Bold accents.',
      items: [
          { id: '1', description: 'Brand Identity Design', amount: 4000 },
          { id: '2', description: 'Asset Export', amount: 500 }
      ]
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
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-red-950/40 text-red-400 border border-red-900/40">
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
        className="relative z-10 w-full max-w-5xl h-[85vh] bg-[#0e0e0e] border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row transform transition-all animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={handleContentClick}
      >
         <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-800/50 hover:bg-zinc-800 rounded-full backdrop-blur-md"
         >
            <X className="w-5 h-5" />
         </button>

         {/* Left Side: Invoice Preview */}
         <div className="flex-1 bg-zinc-900/30 overflow-y-auto custom-scrollbar p-6 flex flex-col items-center border-b lg:border-b-0 lg:border-r border-zinc-800">
             <div className="w-full max-w-[480px] scale-[0.95] origin-top">
                {/* Use minimal prop to remove Stripe footer as requested ("i don't want to see the stripe payment cart") */}
                <InvoicePreviewCard data={invoice} minimal={true} />
             </div>
         </div>

         {/* Right Side: Report & Activity */}
         <div className="w-full lg:w-[420px] bg-black p-8 overflow-y-auto custom-scrollbar">
             <div className="space-y-8">
                 
                 {/* Header Status */}
                 <div>
                     <div className="flex items-center justify-between mb-1">
                        <h2 className="text-xl font-bold">Invoice #{invoice.invoiceNumber}</h2>
                        <span className="text-zinc-500 font-mono text-sm">${invoice.amount.toLocaleString()}</span>
                     </div>
                     <div className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
                         <span>Created on {new Date(invoice.issueDate).toLocaleDateString()}</span>
                     </div>
                     {!isPaid && statusBadge}
                 </div>

                 {/* Payment Status Card */}
                 <div className={`p-4 rounded-xl border ${isPaid ? 'bg-emerald-950/20 border-emerald-900' : 'bg-zinc-900/50 border-zinc-800'}`}>
                     <div className="flex items-start gap-4">
                         <div className={`p-2 rounded-lg ${isPaid ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-zinc-400'}`}>
                             {isPaid ? <Check className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                         </div>
                         <div>
                             <div className={`font-bold text-sm ${isPaid ? 'text-emerald-500' : 'text-zinc-300'}`}>
                                 {isPaid ? 'Paid in Full' : 'Payment Pending'}
                             </div>
                             <div className="text-xs text-zinc-500 mt-1">
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
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Client Details</h3>
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Name</span>
                            <span className="text-white font-medium">{invoice.clientName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Email</span>
                            <span className="text-white">{invoice.clientEmail}</span>
                        </div>
                    </div>
                 </div>

                 {/* Automation Status */}
                 <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Automation</h3>
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Bell className={`w-4 h-4 ${invoice.remindersEnabled ? 'text-emerald-500' : 'text-zinc-600'}`} />
                            <span className={`text-sm font-medium ${invoice.remindersEnabled ? 'text-white' : 'text-zinc-500'}`}>
                                {invoice.remindersEnabled ? 'Reminders Active' : 'Reminders Paused'}
                            </span>
                        </div>
                        {invoice.remindersEnabled && (
                            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                                {invoice.reminderFrequency || 'Weekly'}
                            </span>
                        )}
                    </div>
                 </div>

                 {/* Activity Timeline */}
                 <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Activity Log</h3>
                    <div className="space-y-6 relative pl-2">
                        {/* Vertical Line - Centered through circles (left-5 is 1.25rem/20px, circles centered at 8px+12px=20px) */}
                        <div className="absolute left-5 top-2 bottom-2 w-px bg-zinc-800 -ml-[0.5px]" />

                        {(!invoice.logs || invoice.logs.length === 0) ? (
                            <div className="pl-8 py-2 text-sm text-zinc-500 italic">No activity recorded yet.</div>
                        ) : (
                            invoice.logs.map((log) => (
                                <div key={log.id} className="relative flex gap-4 items-start">
                                    <div className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-black ${
                                        log.type === 'paid' ? 'border-emerald-500 text-emerald-500' :
                                        log.type === 'sent' ? 'border-blue-500 text-blue-500' :
                                        log.type === 'reminder' ? 'border-orange-500 text-orange-500' :
                                        'border-zinc-700 text-zinc-500'
                                    }`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <div className="text-sm font-medium text-zinc-200">
                                            {log.message || (
                                                log.type === 'sent' ? 'Invoice sent to client' :
                                                log.type === 'paid' ? 'Payment received' :
                                                log.type === 'reminder' ? 'Reminder email sent' :
                                                'Opened by client'
                                            )}
                                        </div>
                                        <div className="text-xs text-zinc-500 mt-1">
                                            {new Date(log.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </div>
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
  const [theme, setTheme] = useState<InvoiceTheme>('minimal');
  
  const [invoice, setInvoice] = useState<Invoice>({
    id: Date.now().toString(),
    invoiceNumber: String(Math.floor(1000 + Math.random() * 9000)),
    clientName: '',
    clientEmail: '',
    items: [{ id: '1', description: '', amount: 0 }],
    status: 'pending',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    amount: 0,
    remindersEnabled: true,
    theme: 'minimal'
  });

  const [isSending, setIsSending] = useState(false);

  const addItem = () => {
    setInvoice({
      ...invoice,
      items: [...invoice.items, { id: Date.now().toString(), description: '', amount: 0 }]
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
      setTheme(t.id);
      setInvoice({
          ...invoice,
          theme: t.id,
          items: t.items ? [...t.items] : invoice.items
      });
  };

  const handleSave = () => {
    setIsSending(true);
    // Simulate API Call
    setTimeout(() => {
        onSave({
            ...invoice, 
            amount: invoice.items.reduce((sum, item) => sum + item.amount, 0),
            theme: theme,
            logs: [
                { id: Date.now().toString(), date: new Date().toISOString(), type: 'sent', message: 'Invoice sent to client' }
            ]
        });
    }, 1500);
  };

  if (step === 'preview') {
      return (
          <div className="min-h-screen bg-[#050505] text-white pt-20 pb-12 px-4 flex flex-col items-center animate-in slide-in-from-right duration-300">
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

              {/* Automation Toggle in Preview */}
              <div className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 w-full max-w-2xl flex items-center justify-between">
                  <div>
                      <h3 className="font-bold mb-1">Polite Nudges</h3>
                      <p className="text-zinc-400 text-sm">Automatically follow up if unpaid after due date.</p>
                  </div>
                  <div className="flex items-center gap-2">
                       <span className={`text-sm ${invoice.remindersEnabled ? 'text-emerald-500' : 'text-zinc-500'}`}>
                           {invoice.remindersEnabled ? 'On' : 'Off'}
                       </span>
                       <button 
                            onClick={() => setInvoice({...invoice, remindersEnabled: !invoice.remindersEnabled})}
                            className={`w-12 h-6 rounded-full relative transition-colors ${invoice.remindersEnabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                       >
                           <div className={`absolute top-1 bottom-1 w-4 bg-white rounded-full transition-all shadow ${invoice.remindersEnabled ? 'left-7' : 'left-1'}`} />
                       </button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar onAction={() => setStep('preview')} actionLabel="Preview Invoice" isApp onBack={onCancel} />
      
      <div className="max-w-4xl mx-auto pt-24 px-6 pb-20">
        <h1 className="text-3xl font-bold mb-8">New Invoice</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-8">
                {/* Client Info */}
                <div className="bg-[#0e0e0e] border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4">Client Details</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Client Name</label>
                            <input 
                                type="text" 
                                value={invoice.clientName}
                                onChange={e => setInvoice({...invoice, clientName: e.target.value})}
                                className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none transition-colors"
                                placeholder="e.g. Acme Corp"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Client Email</label>
                            <input 
                                type="email" 
                                value={invoice.clientEmail}
                                onChange={e => setInvoice({...invoice, clientEmail: e.target.value})}
                                className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none transition-colors"
                                placeholder="billing@acme.com"
                            />
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-[#0e0e0e] border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4">Line Items</h2>
                    <div className="space-y-3">
                        {invoice.items.map((item, index) => (
                            <div key={item.id} className="flex gap-3 items-start animate-in slide-in-from-left duration-200">
                                <div className="flex-1">
                                    <input 
                                        type="text" 
                                        value={item.description}
                                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                                        className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none"
                                        placeholder="Description of work..."
                                    />
                                </div>
                                <div className="w-32">
                                    <input 
                                        type="number" 
                                        value={item.amount || ''}
                                        onChange={e => updateItem(item.id, 'amount', parseFloat(e.target.value))}
                                        className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-emerald-500 focus:outline-none text-right"
                                        placeholder="0.00"
                                    />
                                </div>
                                <button 
                                    onClick={() => removeItem(item.id)}
                                    className="p-3 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors"
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
                    
                    <div className="mt-8 border-t border-zinc-800 pt-6 flex justify-between items-center">
                        <span className="text-zinc-400">Total</span>
                        <span className="text-2xl font-bold">${invoice.items.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            {/* Sidebar Settings */}
            <div className="space-y-6">
                
                {/* Templates */}
                <div className="bg-[#0e0e0e] border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4 text-zinc-400">
                        <LayoutTemplate className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Templates</span>
                    </div>
                    <div className="space-y-2">
                        {TEMPLATES.map(t => (
                            <button
                                key={t.id}
                                onClick={() => applyTemplate(t)}
                                className={`w-full text-left p-3 rounded-xl border transition-all ${
                                    theme === t.id 
                                    ? 'bg-zinc-800 border-zinc-600 ring-1 ring-zinc-500' 
                                    : 'bg-black border-zinc-800 hover:border-zinc-700'
                                }`}
                            >
                                <div className="font-bold text-sm mb-0.5">{t.name}</div>
                                <div className="text-xs text-zinc-500 leading-snug">{t.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dates */}
                <div className="bg-[#0e0e0e] border border-zinc-800 rounded-2xl p-6 space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Issue Date</label>
                        <input 
                            type="date"
                            value={invoice.issueDate}
                            onChange={(e) => setInvoice({...invoice, issueDate: e.target.value})} 
                            className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Due Date</label>
                        <input 
                            type="date"
                            value={invoice.dueDate}
                            onChange={(e) => setInvoice({...invoice, dueDate: e.target.value})} 
                            className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
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
    
    // Always use the "Design that sells" minimalist white style regardless of selected theme in builder for now
    // to maintain the high quality look requested.
    
    return (
        <div className="w-full aspect-[3/4] md:aspect-auto md:min-h-[600px] bg-white text-black rounded-lg shadow-2xl p-8 md:p-12 relative overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-16">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white bg-black">
                        {data.clientName ? data.clientName.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                        <div className="font-bold text-lg">{data.clientName || 'Client Name'}</div>
                        <div className="text-sm text-gray-500">Invoice #{data.invoiceNumber}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold uppercase tracking-wider mb-1 text-gray-400">Amount Due</div>
                    <div className="text-3xl font-bold text-gray-900">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                {/* Table Header */}
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider border-b pb-4 mb-4 text-gray-400 border-gray-100">
                    <span>Description</span>
                    <span>Amount</span>
                </div>
                
                {/* Line Items */}
                <div className="space-y-4">
                    {data.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-start">
                            <span className="font-medium text-gray-900">{item.description || 'Item Description'}</span>
                            <span className="text-gray-600 font-mono">${item.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer / Stripe Integration */}
            <div className="mt-auto pt-8 border-t border-gray-100/10">
                 {!minimal && (
                     <div className="rounded-xl p-4 flex items-center justify-between bg-gray-50 border border-gray-100">
                         <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-[#635BFF] rounded flex items-center justify-center text-white font-bold text-xs">S</div>
                             <div className="text-xs">
                                 <div className="font-bold text-gray-900">Secure Payment</div>
                                 <div className="text-gray-500">Processed by Stripe</div>
                             </div>
                         </div>
                         <div className="flex items-center gap-2 text-xs text-gray-400">
                             <ShieldCheck className="w-3 h-3" /> Encrypted
                         </div>
                     </div>
                 )}
                 <div className="mt-6 flex justify-between items-center text-xs text-gray-400">
                     <span>Due in 14 days</span>
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
        setTimeout(() => {
            setIsProcessing(false);
            setSuccess(true);
            setTimeout(onPay, 2000);
        }, 1500);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
                <div className="bg-[#0e0e0e] border border-zinc-800 rounded-3xl p-12 text-center max-w-sm w-full animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                        <Check className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Payment Received</h2>
                    <p className="text-zinc-400">Transfer initiated to bank.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center py-12 px-4 md:px-6">
            <div className="w-full max-w-4xl mb-8 flex justify-between items-center">
                 <div className="flex items-center gap-2 text-white font-bold text-xl"><Logo /></div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
                 <div className="flex-1">
                     <InvoicePreviewCard data={invoice} minimal={false} />
                 </div>
                 
                 <div className="w-full md:w-80 space-y-4">
                     <div className="bg-[#0e0e0e] border border-zinc-800 rounded-2xl p-6 shadow-xl sticky top-8">
                         <div className="text-sm text-zinc-400 mb-1">Total Due</div>
                         <div className="text-4xl font-bold text-white mb-6">${invoice.amount.toLocaleString()}</div>
                         
                         <button 
                            onClick={handlePay}
                            disabled={isProcessing}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                         >
                            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Pay Invoice'}
                         </button>
                         
                         <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500">
                             <ShieldCheck className="w-3 h-3" /> Secure 256-bit SSL Encrypted
                         </div>

                         <div className="mt-6 pt-6 border-t border-zinc-800">
                             <div className="flex justify-between text-sm mb-2">
                                 <span className="text-zinc-500">Invoice #</span>
                                 <span className="text-zinc-300">{invoice.invoiceNumber}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                 <span className="text-zinc-500">Due Date</span>
                                 <span className="text-zinc-300">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                             </div>
                         </div>
                     </div>
                 </div>
            </div>
        </div>
    );
};
