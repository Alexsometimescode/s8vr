
import React, { useState } from 'react';
import { Button, Logo } from '../ui/Shared';
import { Invoice, ReminderFrequency, ReminderTone, Client } from '../../types';
import { LayoutDashboard, LogOut, ArrowUpRight, Copy, Check, Info, Users, PieChart, Settings, Plus, Menu, FileText, UserPlus, Download, Save, Search, Filter, Bell, MessageSquare, Zap, Clock, Mail, Calendar, Sliders, TrendingUp, DollarSign, Activity, Trash2, ArrowLeft, Phone, Globe, AlertCircle } from 'lucide-react';

interface DashboardProps {
  invoices: Invoice[];
  onLogout: () => void;
  onCreate: () => void;
  onViewClient: (id: string) => void;
}

// Mock Clients Data moved outside to be used as initial state
const INITIAL_CLIENTS = [
    { id: '1', name: 'Acme Corp', email: 'billing@acme.com', phone: '+1 (555) 0123', website: 'acme.com', billed: 14500, last: '2 days ago', active: true, contactPerson: 'John Smith' },
    { id: '2', name: 'Starlight Studio', email: 'sarah@starlight.io', phone: '+1 (555) 0456', website: 'starlight.io', billed: 3200, last: '1 week ago', active: true, contactPerson: 'Sarah Connor' },
    { id: '3', name: 'Nexus Inc', email: 'finance@nexus.com', phone: '+1 (555) 0789', website: 'nexus.com', billed: 8400, last: '3 weeks ago', active: true, contactPerson: 'Replicant Roy' },
    { id: '4', name: 'Cyberdyne Systems', email: 'ap@cyberdyne.net', phone: '+1 (800) SKY-NET', website: 'cyberdyne.net', billed: 22000, last: '1 month ago', active: false, contactPerson: 'Miles Dyson' },
    { id: '5', name: 'Massive Dynamic', email: 'nina@massive.com', phone: '+1 (555) 9999', website: 'massivedynamic.com', billed: 3200, last: '12 hours ago', active: true, contactPerson: 'Nina Sharp' },
    { id: '6', name: 'Hooli', email: 'gavin@hooli.xyz', phone: '+1 (555) 5555', website: 'hooli.xyz', billed: 45000, last: '5 days ago', active: true, contactPerson: 'Gavin Belson' },
    { id: '7', name: 'Umbrella Corp', email: 'finance@umbrella.com', phone: '+1 (666) 1234', website: 'umbrella.com', billed: 1200, last: '2 months ago', active: false, contactPerson: 'Albert Wesker' },
];

const Dashboard: React.FC<DashboardProps> = ({ invoices, onLogout, onCreate, onViewClient }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'reminders' | 'clients' | 'reports' | 'settings'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Clients State
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [editingClient, setEditingClient] = useState<any | null>(null);

  // Reminders State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [reminderConfig, setReminderConfig] = useState<{
      freq: ReminderFrequency, 
      customInterval: number,
      tone: ReminderTone, 
      enabled: boolean,
      time: string
  }>({
      freq: 'weekly',
      customInterval: 3,
      tone: 'friendly',
      enabled: true,
      time: '09:00'
  });

  const totalDue = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue' || i.status === 'ghosted').reduce((sum, i) => sum + i.amount, 0);
  const totalCollected = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);

  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);

  // Initialize config when an invoice is selected
  const handleSelectInvoice = (invoice: Invoice) => {
      setSelectedInvoiceId(invoice.id);
      setReminderConfig({
          freq: invoice.reminderFrequency || 'weekly',
          customInterval: invoice.reminderCustomInterval || 3,
          tone: invoice.reminderTone || 'friendly',
          enabled: invoice.remindersEnabled,
          time: invoice.reminderTime || '09:00'
      });
  };

  const handleSaveClient = (updatedClient: any) => {
      setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
      setEditingClient(null);
  };

  const handleDeleteClient = (id: string) => {
      if (window.confirm("Are you sure you want to delete this client?")) {
          setClients(clients.filter(c => c.id !== id));
          setEditingClient(null);
      }
  };

  const renderHeaderAction = () => {
    switch (activeTab) {
        case 'overview':
            return <Button onClick={onCreate} icon={<Plus className="w-4 h-4"/>} size="sm">New Invoice</Button>;
        case 'invoices':
            return <Button onClick={onCreate} icon={<Plus className="w-4 h-4"/>} size="sm">New Invoice</Button>;
        case 'reminders':
            return <Button onClick={() => {}} disabled={!selectedInvoiceId} icon={<Save className="w-4 h-4"/>} size="sm">Save Configuration</Button>;
        case 'clients':
            if (editingClient) return null;
            return <Button onClick={() => {}} icon={<UserPlus className="w-4 h-4"/>} size="sm">Add Client</Button>;
        case 'reports':
            return <Button onClick={() => {}} icon={<Download className="w-4 h-4"/>} size="sm" variant="outline">Export CSV</Button>;
        case 'settings':
            return <Button onClick={() => {}} icon={<Save className="w-4 h-4"/>} size="sm">Save Changes</Button>;
        default:
            return null;
    }
  };

  const getEmailPreview = (tone: ReminderTone, clientName: string, invoiceNum: string) => {
      switch(tone) {
          case 'friendly':
              return {
                  subject: `Friendly reminder: Invoice #${invoiceNum}`,
                  body: `Hi ${clientName.split(' ')[0]},\n\nHope you're having a great week! Just a gentle nudge that Invoice #${invoiceNum} is coming up due. Let me know if you have any questions!\n\nBest,\n[Your Name]`
              };
          case 'professional':
              return {
                  subject: `Invoice #${invoiceNum} Outstanding`,
                  body: `Dear ${clientName},\n\nThis is a reminder regarding Invoice #${invoiceNum}, which is currently outstanding. Please remit payment at your earliest convenience.\n\nRegards,\n[Your Name]`
              };
          case 'casual':
              return {
                  subject: `Quick thing about #${invoiceNum} 👋`,
                  body: `Hey ${clientName.split(' ')[0]},\n\nJust bumping this to the top of your inbox. Invoice #${invoiceNum} is ready for payment whenever you have a sec.\n\nThanks!\n[Your Name]`
              };
          case 'urgent':
              return {
                  subject: `URGENT: Payment Required - Invoice #${invoiceNum}`,
                  body: `ATTN: ${clientName},\n\nInvoice #${invoiceNum} is significantly overdue. Immediate payment is required to avoid service interruption.\n\nPlease process this today.\n[Your Name]`
              };
          default: return { subject: '', body: '' };
      }
  };

  // Demo Data for Reports
  const monthlyRevenue = [
      { month: 'Jan', value: 4500 }, { month: 'Feb', value: 3200 }, { month: 'Mar', value: 6800 },
      { month: 'Apr', value: 5100 }, { month: 'May', value: 4200 }, { month: 'Jun', value: 7500 },
      { month: 'Jul', value: 8100 }, { month: 'Aug', value: 5400 }, { month: 'Sep', value: 6200 },
      { month: 'Oct', value: 9400 }, { month: 'Nov', value: 2400 }, { month: 'Dec', value: 0 }
  ];
  const maxRevenue = 10000; // Fixed max for scale visualization

  // Filter logic for invoices
  const filteredInvoices = invoices.filter(inv => {
      if (!searchQuery) return true;
      return inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
             inv.invoiceNumber.includes(searchQuery);
  });

  const overdueInvoices = filteredInvoices.filter(inv => ['overdue', 'ghosted'].includes(inv.status));
  const activeInvoices = filteredInvoices.filter(inv => ['pending', 'draft'].includes(inv.status));
  const paidInvoices = filteredInvoices.filter(inv => inv.status === 'paid');


  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-black/50 p-6 z-20">
        <div className="mb-12">
            <Logo />
        </div>
        
        <nav className="flex-1 space-y-1">
            <NavTab 
                active={activeTab === 'overview'} 
                onClick={() => { setActiveTab('overview'); setEditingClient(null); }} 
                icon={<LayoutDashboard className="w-5 h-5"/>} 
                label="Overview" 
            />
            <NavTab 
                active={activeTab === 'invoices'} 
                onClick={() => { setActiveTab('invoices'); setEditingClient(null); }} 
                icon={<FileText className="w-5 h-5"/>} 
                label="Invoices" 
            />
            <NavTab 
                active={activeTab === 'reminders'} 
                onClick={() => { setActiveTab('reminders'); setEditingClient(null); }} 
                icon={<Bell className="w-5 h-5"/>} 
                label="Reminders" 
            />
            <NavTab 
                active={activeTab === 'clients'} 
                onClick={() => { setActiveTab('clients'); setEditingClient(null); }} 
                icon={<Users className="w-5 h-5"/>} 
                label="Clients" 
            />
            <NavTab 
                active={activeTab === 'reports'} 
                onClick={() => { setActiveTab('reports'); setEditingClient(null); }} 
                icon={<PieChart className="w-5 h-5"/>} 
                label="Reports" 
            />
            <NavTab 
                active={activeTab === 'settings'} 
                onClick={() => { setActiveTab('settings'); setEditingClient(null); }} 
                icon={<Settings className="w-5 h-5"/>} 
                label="Settings" 
            />
        </nav>

        <div className="pt-6 border-t border-zinc-800">
             <div className="flex items-center gap-3 px-3 py-3 mb-4 rounded-lg bg-zinc-900/50">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-black text-xs">
                    JD
                </div>
                <div className="overflow-hidden">
                    <div className="text-sm font-bold truncate">John Doe</div>
                    <div className="text-xs text-zinc-500 truncate">john@s8vr.so</div>
                </div>
             </div>
             <button 
                onClick={onLogout}
                className="flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-red-400 transition-colors text-sm font-medium w-full"
             >
                <LogOut className="w-4 h-4" />
                Sign Out
             </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
         
         {/* Mobile Header */}
         <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-black z-30">
             <Logo />
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-zinc-400">
                 <Menu className="w-6 h-6" />
             </button>
         </div>

         {/* Mobile Menu Overlay */}
         {mobileMenuOpen && (
             <div className="absolute inset-0 z-40 bg-black p-6 flex flex-col md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
                 <div className="flex justify-between items-center mb-8">
                     <Logo />
                     <button onClick={() => setMobileMenuOpen(false)} className="text-zinc-400">
                         <Menu className="w-6 h-6" />
                     </button>
                 </div>
                 <nav className="space-y-4">
                    <NavTab active={activeTab === 'overview'} onClick={() => {setActiveTab('overview'); setMobileMenuOpen(false)}} icon={<LayoutDashboard/>} label="Overview" />
                    <NavTab active={activeTab === 'invoices'} onClick={() => {setActiveTab('invoices'); setMobileMenuOpen(false)}} icon={<FileText/>} label="Invoices" />
                    <NavTab active={activeTab === 'reminders'} onClick={() => {setActiveTab('reminders'); setMobileMenuOpen(false)}} icon={<Bell/>} label="Reminders" />
                    <NavTab active={activeTab === 'clients'} onClick={() => {setActiveTab('clients'); setMobileMenuOpen(false)}} icon={<Users/>} label="Clients" />
                    <NavTab active={activeTab === 'reports'} onClick={() => {setActiveTab('reports'); setMobileMenuOpen(false)}} icon={<PieChart/>} label="Reports" />
                    <NavTab active={activeTab === 'settings'} onClick={() => {setActiveTab('settings'); setMobileMenuOpen(false)}} icon={<Settings/>} label="Settings" />
                 </nav>
                 <div className="mt-auto pt-8 border-t border-zinc-800">
                     <button onClick={onLogout} className="text-red-400 font-medium">Sign Out</button>
                 </div>
             </div>
         )}

         {/* Top Bar (Desktop) */}
         <header className="hidden md:flex h-20 items-center justify-between px-8 border-b border-zinc-800 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
            <h2 className="text-2xl font-bold capitalize tracking-tight">{editingClient ? 'Edit Client' : activeTab}</h2>
            <div>
               {renderHeaderAction()}
            </div>
         </header>

         {/* Content Scroll Area */}
         <main className="flex-1 overflow-y-auto bg-black p-4 md:p-8">
            
            {activeTab === 'overview' && (
                <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                    
                    <div className="mb-8">
                        <h3 className="text-xl font-medium text-zinc-400">At a glance</h3>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Total Outstanding
                                </div>
                                <div className="text-3xl font-bold text-white">${totalDue.toLocaleString()}</div>
                            </div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-10 transition-opacity">
                                <DollarSign className="w-16 h-16" />
                            </div>
                        </div>
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
                            <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Overdue Amount
                            </div>
                            <div className="text-3xl font-bold text-red-400">${totalOverdue.toLocaleString()}</div>
                        </div>
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between">
                            <div>
                                <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Check className="w-3 h-3" /> Collected (YTD)
                                </div>
                                <div className="text-3xl font-bold text-emerald-500">${totalCollected.toLocaleString()}</div>
                            </div>
                            {/* Mobile Create Button */}
                            <div className="md:hidden">
                                <Button onClick={onCreate} icon={<Plus className="w-4 h-4"/>} size="sm">New</Button>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                         <div className="flex items-center justify-between mb-4">
                             <h3 className="text-lg font-bold">Recent Invoices</h3>
                             <Button size="sm" variant="ghost" onClick={() => setActiveTab('invoices')}>View All</Button>
                         </div>

                        <div className="bg-[#0e0e0e] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden relative min-h-[200px]">
                            <div className="p-2 space-y-1">
                                {invoices.length > 0 ? (
                                invoices.slice(0, 5).map(invoice => (
                                    <InvoiceListItem 
                                        key={invoice.id} 
                                        invoice={invoice} 
                                        onClick={() => onViewClient(invoice.id)}
                                    />
                                ))
                                ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                                    <p className="mb-4">No recent activity.</p>
                                    <Button variant="outline" onClick={onCreate}>Create your first invoice</Button>
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'invoices' && (
                <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                     {/* Search / Filter Bar */}
                     <div className="flex gap-4 mb-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search invoices by client or number..." 
                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors" 
                            />
                        </div>
                        <Button variant="outline" icon={<Filter className="w-4 h-4"/>} className="hidden md:flex">Filter</Button>
                     </div>

                    {filteredInvoices.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-20 text-zinc-500 bg-[#0e0e0e] border border-zinc-800 rounded-2xl">
                             <FileText className="w-12 h-12 mb-4 opacity-20" />
                             <p>No invoices found.</p>
                         </div>
                    ) : (
                        <>
                             {/* Urgent / Overdue Section */}
                             {overdueInvoices.length > 0 && (
                                <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
                                    <h3 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-3 pl-2 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4"/> Requires Action
                                    </h3>
                                    <div className="bg-[#0e0e0e] border border-red-900/30 rounded-2xl overflow-hidden p-2 space-y-1">
                                        {overdueInvoices.map(inv => (
                                            <InvoiceListItem key={inv.id} invoice={inv} onClick={() => onViewClient(inv.id)} />
                                        ))}
                                    </div>
                                </div>
                             )}

                             {/* Active Section */}
                             {activeInvoices.length > 0 && (
                                <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                                    <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3 pl-2">Active</h3>
                                    <div className="bg-[#0e0e0e] border border-zinc-800 rounded-2xl overflow-hidden p-2 space-y-1">
                                        {activeInvoices.map(inv => (
                                            <InvoiceListItem key={inv.id} invoice={inv} onClick={() => onViewClient(inv.id)} />
                                        ))}
                                    </div>
                                </div>
                             )}

                             {/* Paid Section */}
                             {paidInvoices.length > 0 && (
                                <div className="animate-in slide-in-from-bottom-6 fade-in duration-700">
                                    <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3 pl-2">Paid History</h3>
                                    <div className="bg-[#0e0e0e] border border-zinc-800 rounded-2xl overflow-hidden p-2 space-y-1 opacity-80 hover:opacity-100 transition-opacity">
                                        {paidInvoices.map(inv => (
                                            <InvoiceListItem key={inv.id} invoice={inv} onClick={() => onViewClient(inv.id)} />
                                        ))}
                                    </div>
                                </div>
                             )}
                        </>
                    )}
                </div>
            )}

            {activeTab === 'reminders' && (
                <div className="max-w-7xl mx-auto animate-in fade-in duration-500 h-[calc(100vh-140px)] flex gap-8">
                    
                    {/* Left Col: Invoice Selector */}
                    <div className="w-1/3 bg-[#0e0e0e] border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-zinc-800">
                            <h3 className="font-bold text-zinc-400 text-sm uppercase tracking-wider">Active Invoices</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                             {invoices.filter(i => i.status !== 'paid').map(invoice => (
                                 <div 
                                    key={invoice.id}
                                    onClick={() => handleSelectInvoice(invoice)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                        selectedInvoiceId === invoice.id 
                                        ? 'bg-zinc-800 border-emerald-500/50' 
                                        : 'bg-transparent border-transparent hover:bg-zinc-900 hover:border-zinc-800'
                                    }`}
                                 >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-bold">{invoice.clientName}</div>
                                        <div className="text-xs font-mono bg-black px-1.5 py-0.5 rounded text-zinc-400">#{invoice.invoiceNumber}</div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="text-zinc-500">${invoice.amount.toLocaleString()}</div>
                                        {invoice.remindersEnabled ? (
                                            <div className="flex items-center gap-1 text-emerald-500"><Bell className="w-3 h-3" /> On</div>
                                        ) : (
                                            <div className="text-zinc-600">Off</div>
                                        )}
                                    </div>
                                 </div>
                             ))}
                             {invoices.filter(i => i.status !== 'paid').length === 0 && (
                                 <div className="p-8 text-center text-zinc-500 text-sm">No active invoices to remind.</div>
                             )}
                        </div>
                    </div>

                    {/* Right Col: Configuration */}
                    <div className="flex-1 flex flex-col space-y-6 overflow-y-auto pr-2 pb-24">
                        {selectedInvoice ? (
                            <>
                                {/* Master Toggle */}
                                <div className="bg-[#0e0e0e] border border-zinc-800 rounded-2xl p-6 flex items-center justify-between">
                                    <div className="flex gap-4 items-center">
                                        <div className={`p-3 rounded-full ${reminderConfig.enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-900 text-zinc-600'}`}>
                                            <Bell className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">Automated Nudges</h3>
                                            <p className="text-sm text-zinc-400">Automatically send email reminders when this invoice is outstanding.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setReminderConfig({...reminderConfig, enabled: !reminderConfig.enabled})}
                                        className={`w-14 h-8 rounded-full relative transition-colors ${reminderConfig.enabled ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                                    >
                                        <div className={`absolute top-1 bottom-1 w-6 bg-white rounded-full shadow transition-all ${reminderConfig.enabled ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                {reminderConfig.enabled && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
                                    {/* Frequency Selection */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Frequency</label>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                            {[
                                                { id: 'weekly', label: 'Weekly', desc: 'Every 7 Days', icon: <Clock className="w-4 h-4"/> },
                                                { id: 'biweekly', label: 'Fast', desc: 'Every 3 Days', icon: <CalendarDaysIcon className="w-4 h-4"/> },
                                                { id: 'daily', label: 'Daily', desc: 'Aggressive', icon: <Zap className="w-4 h-4"/> },
                                                { id: 'custom', label: 'Custom', desc: 'Specific Interval', icon: <Sliders className="w-4 h-4"/> },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setReminderConfig({...reminderConfig, freq: opt.id as ReminderFrequency})}
                                                    className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                                                        reminderConfig.freq === opt.id 
                                                        ? 'bg-zinc-800 border-zinc-600 ring-1 ring-zinc-600' 
                                                        : 'bg-[#0e0e0e] border-zinc-800 hover:border-zinc-700'
                                                    }`}
                                                >
                                                    <div className={`mb-2 ${reminderConfig.freq === opt.id ? 'text-white' : 'text-zinc-500'}`}>{opt.icon}</div>
                                                    <div className="font-bold text-sm mb-1">{opt.label}</div>
                                                    <div className="text-[10px] text-zinc-500">{opt.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                        
                                        {/* Custom Interval Input */}
                                        {reminderConfig.freq === 'custom' && (
                                            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-4 animate-in slide-in-from-top-2 fade-in">
                                                <span className="text-sm text-zinc-400">Repeat every</span>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    max="365"
                                                    value={reminderConfig.customInterval}
                                                    onChange={(e) => setReminderConfig({...reminderConfig, customInterval: parseInt(e.target.value) || 1})}
                                                    className="bg-black border border-zinc-700 rounded-lg w-20 px-3 py-1 text-center font-mono focus:border-emerald-500 focus:outline-none"
                                                />
                                                <span className="text-sm text-zinc-400">days after due date</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Delivery Time */}
                                    <div className="space-y-3">
                                         <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Delivery Time</label>
                                         <div className="bg-[#0e0e0e] border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-zinc-400">
                                                <Clock className="w-5 h-5" />
                                                <span className="text-sm">Send emails at approximately</span>
                                            </div>
                                            <input 
                                                type="time" 
                                                value={reminderConfig.time}
                                                onChange={(e) => setReminderConfig({...reminderConfig, time: e.target.value})}
                                                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none font-mono"
                                            />
                                         </div>
                                    </div>

                                    {/* Vibe Selection */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email Vibe</label>
                                        <div className="grid grid-cols-4 gap-3">
                                            {[
                                                { id: 'friendly', label: 'Friendly', emoji: '👋' },
                                                { id: 'casual', label: 'Casual', emoji: '✌️' },
                                                { id: 'professional', label: 'Professional', emoji: '👔' },
                                                { id: 'urgent', label: 'Urgent', emoji: '🚨' },
                                            ].map((vibe) => (
                                                <button
                                                    key={vibe.id}
                                                    onClick={() => setReminderConfig({...reminderConfig, tone: vibe.id as ReminderTone})}
                                                    className={`p-3 rounded-xl border text-center transition-all ${
                                                        reminderConfig.tone === vibe.id 
                                                        ? 'bg-zinc-800 border-zinc-600' 
                                                        : 'bg-[#0e0e0e] border-zinc-800 hover:border-zinc-700'
                                                    }`}
                                                >
                                                    <div className="text-2xl mb-2">{vibe.emoji}</div>
                                                    <div className="font-bold text-xs">{vibe.label}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Email Preview */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Preview</label>
                                        <div className="bg-[#0e0e0e] border border-zinc-800 rounded-2xl p-6 font-mono text-sm">
                                            {(() => {
                                                const preview = getEmailPreview(reminderConfig.tone, selectedInvoice.clientName, selectedInvoice.invoiceNumber);
                                                return (
                                                    <>
                                                        <div className="border-b border-zinc-800 pb-4 mb-4">
                                                            <div className="flex gap-2 mb-1">
                                                                <span className="text-zinc-500 w-16">Subject:</span>
                                                                <span className="text-white">{preview.subject}</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="text-zinc-500 w-16">To:</span>
                                                                <span className="text-zinc-400">{selectedInvoice.clientEmail}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-zinc-300 whitespace-pre-line leading-relaxed">
                                                            {preview.body}
                                                        </div>
                                                    </>
                                                )
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                )}
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 border border-zinc-800/50 border-dashed rounded-2xl bg-zinc-900/10">
                                <Bell className="w-12 h-12 mb-4 opacity-20" />
                                <p>Select an invoice to configure reminders.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'clients' && (
                <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
                    {editingClient ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 mb-8">
                                <Button variant="ghost" size="sm" onClick={() => setEditingClient(null)} icon={<ArrowLeft className="w-4 h-4"/>}>Back to Clients</Button>
                                <h3 className="text-2xl font-bold">Edit Client: {editingClient.name}</h3>
                            </div>
                            
                            <div className="bg-[#0e0e0e] border border-zinc-800 rounded-2xl p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Company Name</label>
                                        <input 
                                            type="text" 
                                            value={editingClient.name} 
                                            onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 focus:border-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Contact Person</label>
                                        <input 
                                            type="text" 
                                            value={editingClient.contactPerson} 
                                            onChange={(e) => setEditingClient({...editingClient, contactPerson: e.target.value})}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 focus:border-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
                                        <input 
                                            type="email" 
                                            value={editingClient.email} 
                                            onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 focus:border-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Phone</label>
                                        <input 
                                            type="text" 
                                            value={editingClient.phone} 
                                            onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 focus:border-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Website</label>
                                        <input 
                                            type="text" 
                                            value={editingClient.website} 
                                            onChange={(e) => setEditingClient({...editingClient, website: e.target.value})}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 focus:border-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                
                                <div className="pt-6 border-t border-zinc-800 flex justify-between">
                                    <Button variant="danger" icon={<Trash2 className="w-4 h-4"/>} onClick={() => handleDeleteClient(editingClient.id)}>Delete Client</Button>
                                    <div className="flex gap-4">
                                        <Button variant="ghost" onClick={() => setEditingClient(null)}>Cancel</Button>
                                        <Button onClick={() => handleSaveClient(editingClient)}>Save Changes</Button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Client History */}
                            <div className="mt-8">
                                <h4 className="text-lg font-bold mb-4">Invoice History</h4>
                                <div className="bg-[#0e0e0e] border border-zinc-800 rounded-2xl overflow-hidden p-2">
                                    {invoices.filter(inv => inv.clientName === editingClient.name).length > 0 ? (
                                        invoices.filter(inv => inv.clientName === editingClient.name).map(inv => (
                                            <InvoiceListItem key={inv.id} invoice={inv} onClick={() => {}} />
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-zinc-500">No invoices for this client yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                <div className="col-span-4">Client</div>
                                <div className="col-span-3">Contact</div>
                                <div className="col-span-2 text-right">Total Billed</div>
                                <div className="col-span-2 text-right">Last Active</div>
                                <div className="col-span-1 text-center">Status</div>
                            </div>

                            {clients.map((client) => (
                                <div 
                                    key={client.id} 
                                    onClick={() => setEditingClient(client)}
                                    className="bg-[#0e0e0e] border border-zinc-800 p-4 rounded-xl hover:bg-zinc-900/50 cursor-pointer transition-colors grid grid-cols-12 gap-4 items-center group"
                                >
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center font-bold text-zinc-400 group-hover:text-white group-hover:bg-zinc-700 transition-colors">
                                            {client.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="font-bold text-sm group-hover:text-emerald-400 transition-colors">{client.name}</span>
                                    </div>
                                    <div className="col-span-3 text-sm text-zinc-500 truncate">{client.email}</div>
                                    <div className="col-span-2 text-right font-mono text-sm">${client.billed.toLocaleString()}</div>
                                    <div className="col-span-2 text-right text-xs text-zinc-500">{client.last}</div>
                                    <div className="col-span-1 flex justify-center">
                                        <div className={`w-2 h-2 rounded-full ${client.active ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'reports' && (
                 <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-8">
                    
                    {/* Revenue Chart */}
                    <div className="bg-[#0e0e0e] border border-zinc-800 rounded-2xl p-8">
                        <div className="flex items-center justify-between mb-8">
                             <div>
                                <h3 className="text-lg font-bold">Revenue</h3>
                                <p className="text-zinc-500 text-sm">Monthly income breakdown</p>
                             </div>
                             <div className="text-2xl font-bold font-mono">$62,700.00 <span className="text-zinc-500 text-sm font-sans font-normal">YTD</span></div>
                        </div>
                        
                        {/* Chart Render */}
                        <div className="h-64 w-full flex items-end justify-between gap-2 border-b border-zinc-800/50 pb-2">
                             {monthlyRevenue.map((m) => (
                                 <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                                     <div 
                                        className="w-full bg-zinc-800 rounded-t-sm hover:bg-emerald-500 transition-all duration-300 relative group-hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                                        style={{ height: `${Math.max((m.value / maxRevenue) * 100, 2)}%` }}
                                     >
                                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                             ${m.value.toLocaleString()}
                                         </div>
                                     </div>
                                     <div className="text-[10px] text-zinc-600 font-bold uppercase">{m.month}</div>
                                 </div>
                             ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {/* Top Clients */}
                         <div className="bg-[#0e0e0e] border border-zinc-800 rounded-2xl p-6">
                            <h3 className="font-bold mb-6">Top Clients</h3>
                            <div className="space-y-4">
                                {[
                                    { name: 'Hooli', val: 45000 },
                                    { name: 'Cyberdyne', val: 22000 },
                                    { name: 'Acme Corp', val: 14500 },
                                    { name: 'Nexus Inc', val: 8400 }
                                ].map((c, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-zinc-600 font-mono text-xs">0{i+1}</span>
                                            <span className="font-medium text-sm">{c.name}</span>
                                        </div>
                                        <div className="h-1 flex-1 mx-4 bg-zinc-900 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500/50" style={{ width: `${(c.val / 45000) * 100}%` }} />
                                        </div>
                                        <span className="font-mono text-sm text-zinc-400">${c.val.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                         </div>

                         {/* Quick Stats */}
                         <div className="grid grid-cols-2 gap-4">
                             <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl p-6 flex flex-col justify-center">
                                 <div className="text-zinc-500 text-xs uppercase font-bold mb-2">Avg. Invoice</div>
                                 <div className="text-2xl font-bold text-white">$2,450</div>
                             </div>
                             <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl p-6 flex flex-col justify-center">
                                 <div className="text-zinc-500 text-xs uppercase font-bold mb-2">Collection Time</div>
                                 <div className="text-2xl font-bold text-white">4.2 <span className="text-sm text-zinc-500 font-normal">days</span></div>
                             </div>
                             <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl p-6 flex flex-col justify-center col-span-2">
                                 <div className="text-zinc-500 text-xs uppercase font-bold mb-2">Scheduled Revenue</div>
                                 <div className="flex justify-between items-end">
                                     <div className="text-2xl font-bold text-white">$12,800</div>
                                     <div className="text-xs text-emerald-500">+12% vs last month</div>
                                 </div>
                             </div>
                         </div>
                    </div>
                 </div>
            )}

            {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto animate-in fade-in duration-500 space-y-6">
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                        <h3 className="font-bold mb-4">Profile</h3>
                        <div className="flex gap-4 items-center">
                            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-black text-xl">JD</div>
                            <div>
                                <Button variant="outline" size="sm">Change Avatar</Button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                        <h3 className="font-bold mb-4">Preferences</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-400">Email Notifications</span>
                                <div className="w-10 h-6 bg-emerald-500 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-400">Dark Mode</span>
                                <div className="w-10 h-6 bg-zinc-700 rounded-full relative"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
         </main>
      </div>

    </div>
  );
};

const NavTab: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            active 
            ? 'bg-white text-black shadow-lg shadow-white/5' 
            : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
        }`}
    >
        <span className={active ? 'text-black' : 'text-zinc-400 group-hover:text-white'}>{icon}</span>
        {label}
    </button>
);

const InvoiceListItem: React.FC<{ invoice: Invoice; onClick: () => void }> = ({ invoice, onClick }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    // Dynamic Status Calculation
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let statusLabel = '';
    let statusColor = 'gray';

    // Status Logic: PAID or Days count. No text labels.
    if (invoice.status === 'paid') {
        statusLabel = 'PAID';
        statusColor = 'green';
    } else {
        if (diffDays < 0) {
            // Overdue
            statusLabel = `${Math.abs(diffDays)}d`;
            statusColor = 'red';
        } else {
            // Upcoming
            statusLabel = `${diffDays}d`;
            statusColor = diffDays <= 3 ? 'orange' : 'gray';
        }
    }

    const colorClasses = {
        green: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
        red: "bg-red-950/40 border-red-900/40 text-red-400",
        orange: "bg-orange-500/10 border-orange-500/20 text-orange-500",
        gray: "bg-zinc-800 border-zinc-700 text-zinc-400"
    };

    const activeClass = colorClasses[statusColor as keyof typeof colorClasses] || colorClasses.gray;

    return (
        <div 
          onClick={onClick}
          className="group relative flex items-center justify-between p-4 rounded-xl hover:bg-zinc-900/50 border border-transparent hover:border-zinc-800 transition-all cursor-pointer select-none overflow-hidden"
        >
            <div className="flex items-center gap-4 z-10">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${invoice.status === 'paid' ? 'bg-emerald-900/20 text-emerald-500' : 'bg-zinc-900 text-zinc-500 group-hover:bg-zinc-800'}`}>
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <div className="font-bold text-white text-base">{invoice.clientName}</div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                      <span>#{invoice.invoiceNumber}</span>
                      {invoice.status !== 'paid' && invoice.remindersEnabled && (
                          <span className="hidden md:inline-flex items-center gap-1 text-emerald-500/70 ml-2">
                             ● Auto-nudge
                          </span>
                      )}
                    </div>
                </div>
            </div>
            
            {/* Right Side Container */}
            <div className="relative flex items-center justify-end h-10 w-64">
                
                {/* Status & Amount Wrapper - Slides Left on Hover */}
                <div className="absolute right-0 top-0 bottom-0 flex items-center gap-4 md:gap-6 transition-transform duration-300 ease-out group-hover:-translate-x-24">
                     <div className="text-right hidden md:block">
                         <div className="font-mono font-bold text-base tracking-tight">${invoice.amount.toLocaleString()}</div>
                         <div className="text-xs text-zinc-600 font-medium">USD</div>
                    </div>
                    
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold border min-w-[60px] justify-center tracking-wide uppercase z-10 ${activeClass}`}>
                        {statusLabel}
                    </div>
                </div>

                {/* Hover Actions - Slides In from Right */}
                <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 translate-x-full opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out z-20">
                    <button 
                        onClick={handleCopy}
                        className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors bg-zinc-800 border border-zinc-700 shadow-xl"
                        title="Copy Link"
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-500"/> : <Copy className="w-4 h-4"/>}
                    </button>
                    <button 
                        className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors bg-zinc-800 border border-zinc-700 shadow-xl"
                        title="View Details"
                    >
                        <ArrowUpRight className="w-4 h-4"/>
                    </button>
                </div>

            </div>
        </div>
    );
};

// Helper for icon since it was missing in original context
const CalendarDaysIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
);

export default Dashboard;
