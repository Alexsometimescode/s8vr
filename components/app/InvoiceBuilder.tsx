import React, { useState } from 'react';
import { Invoice, InvoiceItem, InvoiceTheme } from '../../types';
import { Button, Navbar, Logo } from '../ui/Shared';
import { Plus, Trash2, ArrowLeft, Send, Check, Loader2, ShieldCheck, CreditCard, LayoutTemplate, Building2, Palette } from 'lucide-react';

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

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ onCancel, onSave }) => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', description: '', amount: 0 }]);
  const [reminders, setReminders] = useState(true);
  const [theme, setTheme] = useState<InvoiceTheme>('minimal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', amount: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
      setTheme(t.id);
      if (t.items) {
          // Ask for confirmation if user has typed data? For now, just overwrite for the "preset" effect
          const confirmOverwrite = items.some(i => i.description !== '') ? window.confirm("Load template items? This will replace your current items.") : true;
          if (confirmOverwrite) {
             setItems(t.items.map((i, idx) => ({ ...i, id: Date.now() + idx.toString() })));
          }
      }
  };

  const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleSave = () => {
    setIsSubmitting(true);
    // Simulate API delay
    setTimeout(() => {
      const newInvoice: Invoice = {
        id: Date.now().toString(),
        invoiceNumber: Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
        clientName: clientName || 'Unknown Client',
        clientEmail: clientEmail || 'client@example.com',
        items: items.filter(i => i.description),
        status: 'pending',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: total,
        remindersEnabled: reminders,
        sentAt: new Date().toISOString(),
        theme: theme
      };
      onSave(newInvoice);
    }, 800);
  };

  const previewData: Invoice = {
      id: 'preview',
      invoiceNumber: '0001',
      clientName: clientName || 'Client Name',
      clientEmail: clientEmail || 'email@client.com',
      items: items,
      status: 'draft',
      issueDate: new Date().toLocaleDateString(),
      dueDate: '14 days',
      amount: total,
      remindersEnabled: reminders,
      theme: theme
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar onAction={() => {}} actionLabel="" isApp onBack={onCancel} />
      
      <div className="pt-24 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in duration-500">
        
        {/* Editor Side */}
        <div className="space-y-8">
          <div className="mb-8">
              <h2 className="text-3xl font-bold">New Invoice</h2>
              <p className="text-zinc-400">Create and send a smart invoice in seconds.</p>
          </div>

          <div className="space-y-8">
              {/* Template Selector */}
              <div className="space-y-4">
                  <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                      <LayoutTemplate className="w-4 h-4" /> Template
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                      {TEMPLATES.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => applyTemplate(t)}
                            className={`p-4 rounded-xl border text-left transition-all ${
                                theme === t.id 
                                ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500' 
                                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                              <div className={`mb-2 ${theme === t.id ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                  {t.id === 'minimal' && <LayoutTemplate className="w-5 h-5" />}
                                  {t.id === 'corporate' && <Building2 className="w-5 h-5" />}
                                  {t.id === 'creative' && <Palette className="w-5 h-5" />}
                              </div>
                              <div className={`font-bold text-sm mb-1 ${theme === t.id ? 'text-white' : 'text-zinc-300'}`}>{t.name}</div>
                              <div className="text-[10px] text-zinc-500 leading-tight">{t.description}</div>
                          </button>
                      ))}
                  </div>
              </div>

              <div className="space-y-4">
                  <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Client Details</label>
                  <div className="grid gap-4">
                    <input 
                        type="text" 
                        placeholder="Client Name (e.g. Acme Corp)"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        autoFocus
                    />
                    <input 
                        type="email" 
                        placeholder="Client Email (for reminders)"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                        value={clientEmail}
                        onChange={e => setClientEmail(e.target.value)}
                    />
                  </div>
              </div>

              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Line Items</label>
                    <span className="text-xs text-zinc-500 font-mono">USD</span>
                  </div>
                  <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="flex gap-3 group">
                            <input 
                                type="text" 
                                placeholder="Description of service..."
                                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                value={item.description}
                                onChange={e => updateItem(item.id, 'description', e.target.value)}
                            />
                            <div className="relative w-32">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                              <input 
                                  type="number" 
                                  placeholder="0.00"
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 pl-8 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-right font-mono"
                                  value={item.amount || ''}
                                  onChange={e => updateItem(item.id, 'amount', parseFloat(e.target.value))}
                              />
                            </div>
                            {items.length > 1 && (
                                <button onClick={() => removeItem(item.id)} className="px-3 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={addItem} icon={<Plus className="w-4 h-4"/>} className="w-full border-dashed border-zinc-700 hover:border-emerald-500 hover:text-emerald-500">Add Item</Button>
              </div>

              {/* Polite Nudge Toggle */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between group hover:border-zinc-700 transition-colors cursor-pointer" onClick={() => setReminders(!reminders)}>
                  <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${reminders ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-zinc-600'}`}>
                         <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-1">Polite Nudges</h4>
                        <p className="text-sm text-zinc-400 max-w-xs">If enabled, s8vr will email {clientEmail || 'the client'} friendly reminders if the invoice goes overdue.</p>
                      </div>
                  </div>
                  <div className={`w-14 h-8 rounded-full transition-colors relative ${reminders ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                      <div className={`absolute top-1 bottom-1 bg-white rounded-full w-6 shadow-md transition-all duration-300 ${reminders ? 'left-7' : 'left-1'}`} />
                  </div>
              </div>

              <div className="pt-4 pb-12">
                  <Button className="w-full h-14 text-lg bg-white hover:bg-zinc-200 text-black shadow-[0_0_30px_rgba(255,255,255,0.1)]" onClick={handleSave} disabled={!clientName || total <= 0 || isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                      <span className="flex items-center gap-2">Send Invoice <ArrowLeft className="w-5 h-5 rotate-180"/></span>}
                  </Button>
              </div>
          </div>
        </div>

        {/* Preview Side */}
        <div className="hidden lg:block relative">
          <div className="sticky top-32">
             <div className="absolute -inset-4 bg-gradient-to-b from-emerald-500/20 to-transparent blur-3xl opacity-20 rounded-full" />
             <div className="relative">
                <div className="text-center mb-6">
                    <span className="bg-zinc-800 text-zinc-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Live Preview</span>
                </div>
                <InvoicePreviewCard data={previewData} />
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export const InvoicePreviewCard: React.FC<{ data: Invoice, minimal?: boolean }> = ({ data, minimal = false }) => {
    const theme = data.theme || 'minimal';

    // Theme Styles
    const styles = {
        minimal: {
            container: "bg-white text-black",
            header: "",
            headerInner: "mb-12",
            totalBox: "bg-zinc-50 border border-zinc-100",
            fontHead: "font-sans",
            itemBorder: "border-zinc-100 border-dashed"
        },
        corporate: {
            container: "bg-white text-slate-900",
            header: "bg-slate-900 text-white -mx-8 -mt-8 p-8 mb-8",
            headerInner: "flex justify-between items-start",
            totalBox: "bg-slate-50 border border-slate-200",
            fontHead: "font-serif",
            itemBorder: "border-slate-200"
        },
        creative: {
            container: "bg-[#111] text-zinc-100 border border-zinc-800",
            header: "",
            headerInner: "mb-12",
            totalBox: "bg-zinc-900 border border-zinc-800",
            fontHead: "font-sans tracking-wide",
            itemBorder: "border-zinc-800"
        }
    };

    const currentStyle = styles[theme];

    return (
        <div className={`${currentStyle.container} rounded-[2rem] overflow-hidden shadow-2xl mx-auto transition-all duration-300 ${minimal ? 'p-8' : 'p-8 max-w-[420px]'}`}>
            
            <div className={currentStyle.header}>
                <div className={currentStyle.headerInner}>
                    <div className={`${theme === 'minimal' || theme === 'creative' ? 'flex justify-between items-start' : 'w-full flex justify-between items-start'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg ${theme === 'creative' ? 'bg-emerald-500 text-black' : 'bg-black text-white'}`}>
                                {data.clientName ? data.clientName.substring(0,2).toUpperCase() : '??'}
                            </div>
                            <div>
                                <span className={`block font-bold text-xl leading-none mb-1 ${currentStyle.fontHead}`}>{data.clientName || 'Client'}</span>
                                <span className={`text-xs font-medium ${theme === 'corporate' ? 'text-slate-400' : 'text-zinc-500'}`}>Billed to {data.clientEmail || '...'}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${theme === 'corporate' ? 'text-slate-400' : 'text-zinc-400'}`}>Invoice</div>
                            <div className={`font-mono font-bold ${theme === 'corporate' ? 'text-white' : ''}`}>#{data.invoiceNumber}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`text-center mb-10 py-8 rounded-2xl ${currentStyle.totalBox}`}>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Total Amount Due</div>
                <div className={`text-5xl font-bold tracking-tighter mb-2 ${theme === 'creative' ? 'text-white' : 'text-zinc-900'}`}>
                    ${data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium ${theme === 'creative' ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : 'bg-white border border-zinc-200 text-zinc-500'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Due in 14 days
                </div>
            </div>

            <div className="space-y-4 mb-12 min-h-[100px]">
                {data.items.map((item, i) => (
                    <div key={i} className={`flex justify-between items-center py-3 border-b last:border-0 ${currentStyle.itemBorder}`}>
                        <span className={`font-medium ${theme === 'creative' ? 'text-zinc-300' : 'text-zinc-700'}`}>{item.description || 'Item Description'}</span>
                        <span className={`font-mono font-bold ${theme === 'creative' ? 'text-white' : 'text-zinc-900'}`}>${(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                ))}
            </div>

            {!minimal && (
                <div className="space-y-3">
                    <button className="w-full bg-[#635BFF] hover:bg-[#5851DF] text-white py-4 rounded-xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20">
                        Pay with Stripe
                    </button>
                    <div className="flex items-center justify-center gap-2 text-zinc-400 text-xs font-medium">
                        <ShieldCheck className="w-3 h-3" /> Secure payment via Stripe
                    </div>
                </div>
            )}
        </div>
    );
};

// Client Facing View Component
export const ClientInvoiceView: React.FC<{ invoice: Invoice; onPay: () => void; onBack: () => void }> = ({ invoice, onPay, onBack }) => {
  const [isPaid, setIsPaid] = useState(invoice.status === 'paid');
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
        setIsPaid(true);
        setProcessing(false);
        onPay();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-zinc-900 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-900/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 w-full max-w-md">
            <div className="mb-8 flex justify-between items-center">
                <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>
                <div className="flex items-center gap-2 opacity-50">
                   <ShieldCheck className="w-4 h-4 text-zinc-500" />
                   <span className="text-xs text-zinc-500">Secured by Stripe</span>
                </div>
            </div>

            {isPaid ? (
                 <div className="bg-[#111] border border-zinc-800 rounded-3xl p-10 text-center shadow-2xl animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-in bounce-in duration-700">
                        <Check className="w-12 h-12 text-white stroke-[3]" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-3">Payment Received</h3>
                    <p className="text-zinc-400 mb-8 text-lg">Transfer initiated to freelancer.</p>
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 mb-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-zinc-500">Amount Paid</span>
                            <span className="text-white font-mono">${invoice.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Transaction ID</span>
                            <span className="text-zinc-400 font-mono">txt_8293102</span>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={onBack}>Return to Dashboard</Button>
                 </div>
            ) : (
                <div className="relative">
                    {/* Reuse InvoicePreviewCard for consistent theming */}
                    <InvoicePreviewCard data={invoice} />
                    
                    {/* Overlay interaction logic over the card's button is tricky with reuse. 
                        Instead, I'll let InvoicePreviewCard render the visuals, but I need to intercept the click.
                        However, InvoicePreviewCard's button is purely visual in builder.
                        
                        Refactor: InvoicePreviewCard now has the button built-in for non-minimal.
                        I need to attach the real click handler.
                        
                        Let's Modify InvoicePreviewCard to accept an onPay prop.
                    */}
                    <div className="absolute bottom-10 left-8 right-8 h-16 opacity-0 cursor-pointer" onClick={handlePay}></div>
                    
                    {/* Visual loading overlay if processing */}
                    {processing && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-[2rem] flex items-center justify-center z-20">
                            <Loader2 className="w-10 h-10 text-white animate-spin" />
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};