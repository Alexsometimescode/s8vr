import React, { useState } from 'react';
import { Button, Logo } from '../ui/Shared';
import { Invoice, ReminderFrequency, ReminderTone, Client } from '../../types';
import { LogOut, ArrowUpRight, Copy, Check, Plus, Menu, FileText, UserPlus, Download, Save, Search, Filter, Bell, Zap, Clock, Calendar, Sliders, DollarSign, Activity, Trash2, ArrowLeft, AlertCircle, Settings, MessageSquarePlus, User, Upload, Shield, AlertTriangle, X, Send, Lock, Moon, Sun } from 'lucide-react';

interface DashboardProps {
  invoices: Invoice[];
  onLogout: () => void;
  onCreate: () => void;
  onViewClient: (id: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// Custom Animated Icons Component - Vercel Style Micro-interactions
const AnimatedIcon: React.FC<{ type: 'overview' | 'invoices' | 'reminders' | 'clients' | 'reports' | 'settings' | 'feedback' }> = ({ type }) => {
  const baseClass = "w-5 h-5 stroke-current fill-none stroke-2 text-current";
  
  switch (type) {
    case 'overview':
      return (
        <svg viewBox="0 0 24 24" className={baseClass}>
           <rect x="3" y="3" width="7" height="7" rx="1" className="origin-center transition-all duration-300 group-hover:scale-90" />
           <rect x="14" y="3" width="7" height="7" rx="1" className="transition-all duration-300 group-hover:stroke-emerald-500" />
           <rect x="14" y="14" width="7" height="7" rx="1" className="origin-center transition-all duration-300 group-hover:scale-110" />
           <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case 'invoices':
      return (
        <svg viewBox="0 0 24 24" className={baseClass}>
           <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
           <polyline points="14 2 14 8 20 8" />
           <g className="transition-transform duration-500 group-hover:-translate-y-1">
             <line x1="8" y1="13" x2="16" y2="13" className="transition-all duration-300 group-hover:translate-x-1" />
             <line x1="8" y1="17" x2="16" y2="17" className="transition-all duration-300 group-hover:-translate-x-1" />
             <line x1="8" y1="9" x2="10" y2="9" />
           </g>
        </svg>
      );
    case 'reminders':
      return (
        <svg viewBox="0 0 24 24" className={`${baseClass} origin-[50%_10%] transition-all duration-300 group-hover:animate-bell-ring`}>
           <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
           <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
    case 'clients':
      return (
        <svg viewBox="0 0 24 24" className={baseClass}>
           <g className="transition-all duration-500 ease-in-out group-hover:translate-x-1">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
           </g>
           <g className="transition-all duration-500 ease-in-out group-hover:-translate-x-2 group-hover:opacity-60">
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
           </g>
        </svg>
      );
    case 'reports':
      return (
        <svg viewBox="0 0 24 24" className={baseClass}>
           <path d="M21.21 15.89A10 10 0 1 1 8 2.83" className="transition-opacity duration-300 group-hover:opacity-50" />
           <path d="M22 12A10 10 0 0 0 12 2v10z" className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 fill-current opacity-20" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" className={baseClass}>
           <path 
              d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.35a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" 
              className="origin-center transition-transform duration-700 ease-in-out group-hover:rotate-180"
           />
           <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'feedback':
      return (
        <svg viewBox="0 0 24 24" className={baseClass}>
           <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" className="transition-transform duration-300 group-hover:-translate-y-1" />
           <path d="M12 7v6" className="group-hover:stroke-emerald-500" />
           <path d="M9 10h6" className="group-hover:stroke-emerald-500" />
        </svg>
      );
    default:
      return null;
  }
};

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

const Dashboard: React.FC<DashboardProps> = ({ invoices, onLogout, onCreate, onViewClient, isDarkMode, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'reminders' | 'clients' | 'reports' | 'settings' | 'profile'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Feedback Modal State
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'feature' | 'bug'>('feature');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  
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
  
  const handleSendFeedback = () => {
    setFeedbackSending(true);
    
    // Simulate API call
    setTimeout(() => {
        const payload = {
            user: {
                id: '123',
                name: 'John Doe',
                email: 'john@s8vr.so',
                invoicesSent: invoices.filter(i => i.status !== 'draft').length,
                totalRevenue: totalCollected
            },
            type: feedbackType,
            content: feedbackText,
            timestamp: new Date().toISOString(),
            context: 'AI_SUMMARIZER_QUEUE' 
        };
        console.log('Sending Feedback Payload:', payload);
        
        setFeedbackSending(false);
        setFeedbackOpen(false);
        setFeedbackText('');
        alert('Thanks! Your feedback has been sent directly to our team.');
    }, 1500);
  };

  const hasUsedApp = invoices.some(i => i.status !== 'draft');

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
        case 'profile':
            return <Button onClick={onLogout} icon={<LogOut className="w-4 h-4"/>} variant="danger" size="sm">Sign Out</Button>;
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

  const monthlyRevenue = [
      { month: 'Jan', value: 4500 }, { month: 'Feb', value: 3200 }, { month: 'Mar', value: 6800 },
      { month: 'Apr', value: 5100 }, { month: 'May', value: 4200 }, { month: 'Jun', value: 7500 },
      { month: 'Jul', value: 8100 }, { month: 'Aug', value: 5400 }, { month: 'Sep', value: 6200 },
      { month: 'Oct', value: 9400 }, { month: 'Nov', value: 2400 }, { month: 'Dec', value: 0 }
  ];
  const maxRevenue = 10000;

  const filteredInvoices = invoices.filter(inv => {
      if (!searchQuery) return true;
      return inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
             inv.invoiceNumber.includes(searchQuery);
  });

  const overdueInvoices = filteredInvoices.filter(inv => ['overdue', 'ghosted'].includes(inv.status));
  const activeInvoices = filteredInvoices.filter(inv => ['pending', 'draft'].includes(inv.status));
  const paidInvoices = filteredInvoices.filter(inv => inv.status === 'paid');


  return (
    <div className="flex h-screen bg-background text-textMain overflow-hidden font-sans transition-colors duration-300">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-surface/50 p-6 z-20">
        <div className="mb-12">
            <Logo />
        </div>
        
        <nav className="flex-1 space-y-1">
            <NavTab 
                active={activeTab === 'overview'} 
                onClick={() => { setActiveTab('overview'); setEditingClient(null); }} 
                icon={<AnimatedIcon type="overview"/>} 
                label="Overview" 
            />
            <NavTab 
                active={activeTab === 'invoices'} 
                onClick={() => { setActiveTab('invoices'); setEditingClient(null); }} 
                icon={<AnimatedIcon type="invoices"/>} 
                label="Invoices" 
            />
            <NavTab 
                active={activeTab === 'reminders'} 
                onClick={() => { setActiveTab('reminders'); setEditingClient(null); }} 
                icon={<AnimatedIcon type="reminders"/>} 
                label="Reminders" 
            />
            <NavTab 
                active={activeTab === 'clients'} 
                onClick={() => { setActiveTab('clients'); setEditingClient(null); }} 
                icon={<AnimatedIcon type="clients"/>} 
                label="Clients" 
            />
            <NavTab 
                active={activeTab === 'reports'} 
                onClick={() => { setActiveTab('reports'); setEditingClient(null); }} 
                icon={<AnimatedIcon type="reports"/>} 
                label="Reports" 
            />
            <NavTab 
                active={activeTab === 'settings'} 
                onClick={() => { setActiveTab('settings'); setEditingClient(null); }} 
                icon={<AnimatedIcon type="settings"/>} 
                label="Settings" 
            />
        </nav>

        <div className="mt-auto space-y-6">
            {/* Feedback Button */}
             <button
                onClick={() => setFeedbackOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-2 text-textMuted hover:text-emerald-500 transition-colors text-sm font-medium group"
             >
                <div className="text-textMuted group-hover:text-emerald-500 transition-colors">
                    <AnimatedIcon type="feedback" />
                </div>
                <span>Feature Request</span>
             </button>

            {/* Profile Section */}
            <div className="pt-6 border-t border-border">
                <button
                    onClick={() => { setActiveTab('profile'); setEditingClient(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left group ${activeTab === 'profile' ? 'bg-surfaceHighlight' : 'hover:bg-surfaceHighlight'}`}
                >
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white text-xs shrink-0">
                        JD
                    </div>
                    <div className="overflow-hidden flex-1">
                        <div className="text-sm font-bold truncate text-textMain">John Doe</div>
                        <div className="text-xs text-textMuted truncate">john@s8vr.so</div>
                    </div>
                </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-background">
         
         {/* Mobile Header */}
         <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background z-30">
             <Logo />
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-textMuted">
                 <Menu className="w-6 h-6" />
             </button>
         </div>

         {/* Mobile Menu Overlay */}
         {mobileMenuOpen && (
             <div className="absolute inset-0 z-40 bg-background p-6 flex flex-col md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
                 <div className="flex justify-between items-center mb-8">
                     <Logo />
                     <button onClick={() => setMobileMenuOpen(false)} className="text-textMuted">
                         <Menu className="w-6 h-6" />
                     </button>
                 </div>
                 <nav className="space-y-4">
                    <NavTab active={activeTab === 'overview'} onClick={() => {setActiveTab('overview'); setMobileMenuOpen(false)}} icon={<AnimatedIcon type="overview"/>} label="Overview" />
                    <NavTab active={activeTab === 'invoices'} onClick={() => {setActiveTab('invoices'); setMobileMenuOpen(false)}} icon={<AnimatedIcon type="invoices"/>} label="Invoices" />
                    <NavTab active={activeTab === 'reminders'} onClick={() => {setActiveTab('reminders'); setMobileMenuOpen(false)}} icon={<AnimatedIcon type="reminders"/>} label="Reminders" />
                    <NavTab active={activeTab === 'clients'} onClick={() => {setActiveTab('clients'); setMobileMenuOpen(false)}} icon={<AnimatedIcon type="clients"/>} label="Clients" />
                    <NavTab active={activeTab === 'reports'} onClick={() => {setActiveTab('reports'); setMobileMenuOpen(false)}} icon={<AnimatedIcon type="reports"/>} label="Reports" />
                    <NavTab active={activeTab === 'settings'} onClick={() => {setActiveTab('settings'); setMobileMenuOpen(false)}} icon={<AnimatedIcon type="settings"/>} label="Settings" />
                 </nav>
                 <div className="mt-auto pt-8 border-t border-border space-y-4">
                     <button 
                        onClick={() => {setActiveTab('profile'); setMobileMenuOpen(false)}}
                        className="flex items-center gap-3 text-textMuted font-medium w-full"
                     >
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white text-xs">JD</div>
                        <span>John Doe (Profile)</span>
                     </button>
                     <button onClick={onLogout} className="text-red-400 font-medium flex items-center gap-3">
                        <LogOut className="w-4 h-4" /> Sign Out
                     </button>
                 </div>
             </div>
         )}

         {/* Top Bar (Desktop) */}
         <header className="hidden md:flex h-20 items-center justify-between px-8 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <h2 className="text-2xl font-bold capitalize tracking-tight text-textMain">{editingClient ? 'Edit Client' : activeTab}</h2>
            <div>
               {renderHeaderAction()}
            </div>
         </header>

         {/* Content Scroll Area */}
         <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8 custom-scrollbar">
            
            {activeTab === 'overview' && (
                <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                    
                    <div className="mb-8">
                        <h3 className="text-xl font-medium text-textMuted">At a glance</h3>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="text-textMuted text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Total Outstanding
                                </div>
                                <div className="text-3xl font-bold text-textMain">${totalDue.toLocaleString()}</div>
                            </div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-5 transition-opacity text-textMain">
                                <DollarSign className="w-16 h-16" />
                            </div>
                        </div>
                        <div className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden">
                            <div className="text-textMuted text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Overdue Amount
                            </div>
                            <div className="text-3xl font-bold text-red-500">${totalOverdue.toLocaleString()}</div>
                        </div>
                        <div className="bg-surface border border-border rounded-2xl p-6 flex items-center justify-between">
                            <div>
                                <div className="text-textMuted text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Check className="w-3 h-3" /> Collected (YTD)
                                </div>
                                <div className="text-3xl font-bold text-emerald-500">${totalCollected.toLocaleString()}</div>
                            </div>
                            <div className="md:hidden">
                                <Button onClick={onCreate} icon={<Plus className="w-4 h-4"/>} size="sm">New</Button>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                         <div className="flex items-center justify-between mb-4">
                             <h3 className="text-lg font-bold text-textMain">Recent Invoices</h3>
                             <Button size="sm" variant="ghost" onClick={() => setActiveTab('invoices')}>View All</Button>
                         </div>

                        <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden relative min-h-[200px]">
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
                                <div className="flex flex-col items-center justify-center py-12 text-textMuted">
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
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search invoices by client or number..." 
                                className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-textMain focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-textMuted" 
                            />
                        </div>
                        <Button variant="outline" icon={<Filter className="w-4 h-4"/>} className="hidden md:flex">Filter</Button>
                     </div>

                    {filteredInvoices.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-20 text-textMuted bg-surface border border-border rounded-2xl">
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
                                    <div className="bg-surface border border-red-500/30 rounded-2xl overflow-hidden p-2 space-y-1">
                                        {overdueInvoices.map(inv => (
                                            <InvoiceListItem key={inv.id} invoice={inv} onClick={() => onViewClient(inv.id)} />
                                        ))}
                                    </div>
                                </div>
                             )}

                             {/* Active Section */}
                             {activeInvoices.length > 0 && (
                                <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                                    <h3 className="text-textMuted text-xs font-bold uppercase tracking-wider mb-3 pl-2">Active</h3>
                                    <div className="bg-surface border border-border rounded-2xl overflow-hidden p-2 space-y-1">
                                        {activeInvoices.map(inv => (
                                            <InvoiceListItem key={inv.id} invoice={inv} onClick={() => onViewClient(inv.id)} />
                                        ))}
                                    </div>
                                </div>
                             )}

                             {/* Paid Section */}
                             {paidInvoices.length > 0 && (
                                <div className="animate-in slide-in-from-bottom-6 fade-in duration-700">
                                    <h3 className="text-textMuted text-xs font-bold uppercase tracking-wider mb-3 pl-2">Paid History</h3>
                                    <div className="bg-surface border border-border rounded-2xl overflow-hidden p-2 space-y-1 opacity-80 hover:opacity-100 transition-opacity">
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
                    <div className="w-1/3 bg-surface border border-border rounded-2xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <h3 className="font-bold text-textMuted text-sm uppercase tracking-wider">Active Invoices</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                             {invoices.filter(i => i.status !== 'paid').map(invoice => (
                                 <div 
                                    key={invoice.id}
                                    onClick={() => handleSelectInvoice(invoice)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                        selectedInvoiceId === invoice.id 
                                        ? 'bg-surfaceHighlight border-emerald-500/50' 
                                        : 'bg-transparent border-transparent hover:bg-surfaceHighlight hover:border-border'
                                    }`}
                                 >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-bold text-textMain">{invoice.clientName}</div>
                                        <div className="text-xs font-mono bg-background px-1.5 py-0.5 rounded text-textMuted border border-border">#{invoice.invoiceNumber}</div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="text-textMuted">${invoice.amount.toLocaleString()}</div>
                                        {invoice.remindersEnabled ? (
                                            <div className="flex items-center gap-1 text-emerald-500"><Bell className="w-3 h-3" /> On</div>
                                        ) : (
                                            <div className="text-textMuted">Off</div>
                                        )}
                                    </div>
                                 </div>
                             ))}
                             {invoices.filter(i => i.status !== 'paid').length === 0 && (
                                 <div className="p-8 text-center text-textMuted text-sm">No active invoices to remind.</div>
                             )}
                        </div>
                    </div>

                    {/* Right Col: Configuration */}
                    <div className="flex-1 flex flex-col space-y-6 overflow-y-auto pr-2 pb-24 custom-scrollbar">
                        {selectedInvoice ? (
                            <>
                                {/* Master Toggle */}
                                <div className="bg-surface border border-border rounded-2xl p-6 flex items-center justify-between">
                                    <div className="flex gap-4 items-center">
                                        <div className={`p-3 rounded-full ${reminderConfig.enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surfaceHighlight text-textMuted'}`}>
                                            <Bell className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-textMain">Automated Nudges</h3>
                                            <p className="text-sm text-textMuted">Automatically send email reminders when this invoice is outstanding.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setReminderConfig({...reminderConfig, enabled: !reminderConfig.enabled})}
                                        className={`w-14 h-8 rounded-full relative transition-colors ${reminderConfig.enabled ? 'bg-emerald-500' : 'bg-surfaceHighlight'}`}
                                    >
                                        <div className={`absolute top-1 bottom-1 w-6 bg-white rounded-full shadow transition-all ${reminderConfig.enabled ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                {reminderConfig.enabled && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
                                    {/* Frequency Selection */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Frequency</label>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                            {[
                                                { id: 'weekly', label: 'Weekly', desc: 'Every 7 Days', icon: <Clock className="w-4 h-4"/> },
                                                { id: 'biweekly', label: 'Fast', desc: 'Every 3 Days', icon: <Calendar className="w-4 h-4"/> },
                                                { id: 'daily', label: 'Daily', desc: 'Aggressive', icon: <Zap className="w-4 h-4"/> },
                                                { id: 'custom', label: 'Custom', desc: 'Specific Interval', icon: <Sliders className="w-4 h-4"/> },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setReminderConfig({...reminderConfig, freq: opt.id as ReminderFrequency})}
                                                    className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                                                        reminderConfig.freq === opt.id 
                                                        ? 'bg-surfaceHighlight border-textMuted ring-1 ring-textMuted' 
                                                        : 'bg-surface border-border hover:border-textMuted'
                                                    }`}
                                                >
                                                    <div className={`mb-2 ${reminderConfig.freq === opt.id ? 'text-textMain' : 'text-textMuted'}`}>{opt.icon}</div>
                                                    <div className={`font-bold text-sm mb-1 ${reminderConfig.freq === opt.id ? 'text-textMain' : 'text-textMuted'}`}>{opt.label}</div>
                                                    <div className="text-[10px] text-textMuted">{opt.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                        
                                        {/* Custom Interval Input */}
                                        {reminderConfig.freq === 'custom' && (
                                            <div className="bg-surfaceHighlight border border-border p-4 rounded-xl flex items-center gap-4 animate-in slide-in-from-top-2 fade-in">
                                                <span className="text-sm text-textMuted">Repeat every</span>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    max="365"
                                                    value={reminderConfig.customInterval}
                                                    onChange={(e) => setReminderConfig({...reminderConfig, customInterval: parseInt(e.target.value) || 1})}
                                                    className="bg-background border border-border rounded-lg w-20 px-3 py-1 text-center font-mono focus:border-emerald-500 focus:outline-none text-textMain"
                                                />
                                                <span className="text-sm text-textMuted">days after due date</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Delivery Time */}
                                    <div className="space-y-3">
                                         <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Delivery Time</label>
                                         <div className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-textMuted">
                                                <Clock className="w-5 h-5" />
                                                <span className="text-sm">Send emails at approximately</span>
                                            </div>
                                            <input 
                                                type="time" 
                                                value={reminderConfig.time}
                                                onChange={(e) => setReminderConfig({...reminderConfig, time: e.target.value})}
                                                className="bg-background border border-border rounded-lg px-3 py-2 text-textMain focus:border-emerald-500 focus:outline-none font-mono"
                                            />
                                         </div>
                                    </div>

                                    {/* Vibe Selection */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Email Vibe</label>
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
                                                        ? 'bg-surfaceHighlight border-textMuted' 
                                                        : 'bg-surface border-border hover:border-textMuted'
                                                    }`}
                                                >
                                                    <div className="text-2xl mb-2">{vibe.emoji}</div>
                                                    <div className={`font-bold text-xs ${reminderConfig.tone === vibe.id ? 'text-textMain' : 'text-textMuted'}`}>{vibe.label}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Email Preview */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Preview</label>
                                        <div className="bg-surface border border-border rounded-2xl p-6 font-mono text-sm">
                                            {(() => {
                                                const preview = getEmailPreview(reminderConfig.tone, selectedInvoice.clientName, selectedInvoice.invoiceNumber);
                                                return (
                                                    <>
                                                        <div className="border-b border-border pb-4 mb-4">
                                                            <div className="flex gap-2 mb-1">
                                                                <span className="text-textMuted w-16">Subject:</span>
                                                                <span className="text-textMain">{preview.subject}</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="text-textMuted w-16">To:</span>
                                                                <span className="text-textMuted">{selectedInvoice.clientEmail}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-textMain whitespace-pre-line leading-relaxed opacity-90">
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
                            <div className="h-full flex flex-col items-center justify-center text-textMuted border border-border border-dashed rounded-2xl bg-surface/50">
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
                                <h3 className="text-2xl font-bold text-textMain">Edit Client: {editingClient.name}</h3>
                            </div>
                            
                            <div className="bg-surface border border-border rounded-2xl p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Company Name</label>
                                        <input 
                                            type="text" 
                                            value={editingClient.name} 
                                            onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                                            className="w-full bg-background border border-border rounded-lg p-3 text-textMain focus:border-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Contact Person</label>
                                        <input 
                                            type="text" 
                                            value={editingClient.contactPerson} 
                                            onChange={(e) => setEditingClient({...editingClient, contactPerson: e.target.value})}
                                            className="w-full bg-background border border-border rounded-lg p-3 text-textMain focus:border-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Email Address</label>
                                        <input 
                                            type="email" 
                                            value={editingClient.email} 
                                            onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                                            className="w-full bg-background border border-border rounded-lg p-3 text-textMain focus:border-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Phone</label>
                                        <input 
                                            type="text" 
                                            value={editingClient.phone} 
                                            onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})}
                                            className="w-full bg-background border border-border rounded-lg p-3 text-textMain focus:border-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Website</label>
                                        <input 
                                            type="text" 
                                            value={editingClient.website} 
                                            onChange={(e) => setEditingClient({...editingClient, website: e.target.value})}
                                            className="w-full bg-background border border-border rounded-lg p-3 text-textMain focus:border-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                
                                <div className="pt-6 border-t border-border flex justify-between">
                                    <Button variant="danger" icon={<Trash2 className="w-4 h-4"/>} onClick={() => handleDeleteClient(editingClient.id)}>Delete Client</Button>
                                    <div className="flex gap-4">
                                        <Button variant="ghost" onClick={() => setEditingClient(null)}>Cancel</Button>
                                        <Button onClick={() => handleSaveClient(editingClient)}>Save Changes</Button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Client History */}
                            <div className="mt-8">
                                <h4 className="text-lg font-bold mb-4 text-textMain">Invoice History</h4>
                                <div className="bg-surface border border-border rounded-2xl overflow-hidden p-2">
                                    {invoices.filter(inv => inv.clientName === editingClient.name).length > 0 ? (
                                        invoices.filter(inv => inv.clientName === editingClient.name).map(inv => (
                                            <InvoiceListItem key={inv.id} invoice={inv} onClick={() => {}} />
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-textMuted">No invoices for this client yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-2 text-xs font-bold text-textMuted uppercase tracking-wider">
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
                                    className="bg-surface border border-border p-4 rounded-xl hover:bg-surfaceHighlight cursor-pointer transition-colors grid grid-cols-12 gap-4 items-center group"
                                >
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-surfaceHighlight rounded-lg flex items-center justify-center font-bold text-textMuted group-hover:text-textMain group-hover:bg-background transition-colors border border-border">
                                            {client.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="font-bold text-sm text-textMain group-hover:text-emerald-500 transition-colors">{client.name}</span>
                                    </div>
                                    <div className="col-span-3 text-sm text-textMuted truncate">{client.email}</div>
                                    <div className="col-span-2 text-right font-mono text-sm text-textMain">${client.billed.toLocaleString()}</div>
                                    <div className="col-span-2 text-right text-xs text-textMuted">{client.last}</div>
                                    <div className="col-span-1 flex justify-center">
                                        <div className={`w-2 h-2 rounded-full ${client.active ? 'bg-emerald-500' : 'bg-surfaceHighlight'}`} />
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
                    <div className="bg-surface border border-border rounded-2xl p-8">
                        <div className="flex items-center justify-between mb-8">
                             <div>
                                <h3 className="text-lg font-bold text-textMain">Revenue</h3>
                                <p className="text-textMuted text-sm">Monthly income breakdown</p>
                             </div>
                             <div className="text-2xl font-bold font-mono text-textMain">$62,700.00 <span className="text-textMuted text-sm font-sans font-normal">YTD</span></div>
                        </div>
                        
                        {/* Chart Render */}
                        <div className="h-64 w-full flex items-end justify-between gap-2 border-b border-border pb-2">
                             {monthlyRevenue.map((m) => (
                                 <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                                     <div 
                                        className="w-full bg-surfaceHighlight rounded-t-sm hover:bg-emerald-500 transition-all duration-300 relative group-hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                                        style={{ height: `${Math.max((m.value / maxRevenue) * 100, 2)}%` }}
                                     >
                                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surfaceHighlight text-textMain border border-border text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-md">
                                             ${m.value.toLocaleString()}
                                         </div>
                                     </div>
                                     <div className="text-[10px] text-textMuted font-bold uppercase">{m.month}</div>
                                 </div>
                             ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {/* Top Clients */}
                         <div className="bg-surface border border-border rounded-2xl p-6">
                            <h3 className="font-bold mb-6 text-textMain">Top Clients</h3>
                            <div className="space-y-4">
                                {[
                                    { name: 'Hooli', val: 45000 },
                                    { name: 'Cyberdyne', val: 22000 },
                                    { name: 'Acme Corp', val: 14500 },
                                    { name: 'Nexus Inc', val: 8400 }
                                ].map((c, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-textMuted font-mono text-xs">0{i+1}</span>
                                            <span className="font-medium text-sm text-textMain">{c.name}</span>
                                        </div>
                                        <div className="h-1 flex-1 mx-4 bg-surfaceHighlight rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500/50" style={{ width: `${(c.val / 45000) * 100}%` }} />
                                        </div>
                                        <span className="font-mono text-sm text-textMuted">${c.val.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                         </div>

                         {/* Quick Stats */}
                         <div className="grid grid-cols-2 gap-4">
                             <div className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-center">
                                 <div className="text-textMuted text-xs uppercase font-bold mb-2">Avg. Invoice</div>
                                 <div className="text-2xl font-bold text-textMain">$2,450</div>
                             </div>
                             <div className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-center">
                                 <div className="text-textMuted text-xs uppercase font-bold mb-2">Collection Time</div>
                                 <div className="text-2xl font-bold text-textMain">4.2 <span className="text-sm text-textMuted font-normal">days</span></div>
                             </div>
                             <div className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-center col-span-2">
                                 <div className="text-textMuted text-xs uppercase font-bold mb-2">Scheduled Revenue</div>
                                 <div className="flex justify-between items-end">
                                     <div className="text-2xl font-bold text-textMain">$12,800</div>
                                     <div className="text-xs text-emerald-500">+12% vs last month</div>
                                 </div>
                             </div>
                         </div>
                    </div>
                 </div>
            )}

            {/* General Settings View */}
            {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto animate-in fade-in duration-500 space-y-6">
                    <h3 className="text-xl font-bold mb-6 text-textMain">App Settings</h3>
                    
                    <div className="bg-surface border border-border rounded-xl p-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-textMain"><Sliders className="w-4 h-4" /> Preferences</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-textMuted">Email Notifications</span>
                                <div className="w-10 h-6 bg-emerald-500 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-textMuted">Appearance</span>
                                <button 
                                  onClick={toggleTheme}
                                  className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-surfaceHighlight transition-colors"
                                >
                                  {isDarkMode ? <Moon className="w-4 h-4"/> : <Sun className="w-4 h-4"/>}
                                  {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-textMain"><DollarSign className="w-4 h-4" /> Billing & Currency</h3>
                        <div className="space-y-4">
                             <div>
                                <label className="block text-xs font-bold text-textMuted uppercase mb-2">Default Currency</label>
                                <select className="w-full bg-background border border-border rounded-lg p-2 text-sm text-textMain focus:outline-none">
                                    <option>USD ($)</option>
                                    <option>EUR (€)</option>
                                    <option>GBP (£)</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-textMuted uppercase mb-2">Tax Rate Default (%)</label>
                                <input type="number" className="w-full bg-background border border-border rounded-lg p-2 text-sm text-textMain focus:outline-none" placeholder="0" />
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Profile View */}
            {activeTab === 'profile' && (
                <div className="max-w-2xl mx-auto animate-in fade-in duration-500 space-y-6">
                    <h3 className="text-xl font-bold mb-6 text-textMain">User Profile</h3>

                    <div className="bg-surface border border-border rounded-xl p-6">
                         <div className="flex items-center gap-6 mb-6">
                             <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-4xl font-bold text-white border-4 border-background shadow-xl">JD</div>
                             <div>
                                 <h2 className="text-xl font-bold text-textMain">John Doe</h2>
                                 <p className="text-textMuted">Freelance Developer</p>
                                 <Button variant="outline" size="sm" className="mt-3" icon={<Upload className="w-4 h-4" />}>Change Avatar</Button>
                             </div>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-textMuted uppercase mb-2">Display Name</label>
                                <input type="text" defaultValue="John Doe" className="w-full bg-background border border-border rounded-lg p-2 text-sm text-textMain focus:outline-none" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-textMuted uppercase mb-2">Email</label>
                                <div className="relative">
                                    <input 
                                        type="email" 
                                        defaultValue="john@s8vr.so" 
                                        disabled
                                        className="w-full bg-surfaceHighlight border border-border rounded-lg p-2 pr-10 text-sm text-textMuted focus:outline-none cursor-not-allowed opacity-70" 
                                    />
                                    <Lock className="w-3 h-3 text-textMuted absolute right-3 top-1/2 -translate-y-1/2" />
                                </div>
                                <p className="text-[10px] text-textMuted mt-1.5 flex items-center gap-1"><Shield className="w-3 h-3"/> Managed Account</p>
                             </div>
                         </div>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-textMain"><Shield className="w-4 h-4" /> Branding</h3>
                        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-surfaceHighlight transition-colors cursor-pointer group">
                            <Upload className="w-8 h-8 text-textMuted group-hover:text-textMain mx-auto mb-2 transition-colors" />
                            <p className="text-sm font-medium text-textMain">Upload Company Logo</p>
                            <p className="text-xs text-textMuted mt-1">PNG, JPG up to 2MB</p>
                        </div>
                    </div>

                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                        <h3 className="font-bold text-red-500 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Danger Zone</h3>
                        <p className="text-textMuted text-sm mb-4">Permanently delete your account and all data.</p>
                        <Button variant="danger" icon={<Trash2 className="w-4 h-4" />}>Delete Account</Button>
                    </div>
                </div>
            )}

         </main>
      </div>
      
      {/* Feedback Modal */}
      {feedbackOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setFeedbackOpen(false)} />
              <div className="relative bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                  <button onClick={() => setFeedbackOpen(false)} className="absolute top-4 right-4 text-textMuted hover:text-textMain">
                      <X className="w-5 h-5" />
                  </button>
                  
                  <h3 className="text-xl font-bold mb-2 text-textMain">Help us improve s8vr</h3>
                  <p className="text-sm text-textMuted mb-6">Found a bug? Have a feature in mind? Let us know.</p>
                  
                  {!hasUsedApp && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6 flex gap-3 text-sm text-amber-500">
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                          <p>We noticed you haven't sent an invoice yet. While we'd love your feedback, trying the app first might help you give better suggestions!</p>
                      </div>
                  )}
                  
                  <div className="flex gap-4 mb-6">
                      <button 
                        onClick={() => setFeedbackType('feature')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${feedbackType === 'feature' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-surfaceHighlight border-border text-textMuted hover:border-textMuted'}`}
                      >
                          Request Feature
                      </button>
                      <button 
                        onClick={() => setFeedbackType('bug')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${feedbackType === 'bug' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-surfaceHighlight border-border text-textMuted hover:border-textMuted'}`}
                      >
                          Report Bug
                      </button>
                  </div>
                  
                  <textarea 
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder={feedbackType === 'feature' ? "I wish I could..." : "Something went wrong when..."}
                    className="w-full h-32 bg-background border border-border rounded-xl p-4 text-sm focus:border-emerald-500 focus:outline-none mb-6 resize-none text-textMain"
                  />
                  
                  <div className="flex justify-end gap-3">
                      <Button variant="ghost" onClick={() => setFeedbackOpen(false)}>Cancel</Button>
                      <Button onClick={handleSendFeedback} disabled={!feedbackText.trim() || feedbackSending}>
                          {feedbackSending ? 'Sending...' : 'Send Feedback'}
                          {!feedbackSending && <Send className="w-4 h-4 ml-2" />}
                      </Button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

const NavTab: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`group w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            active 
            ? 'bg-textMain text-background shadow-lg shadow-black/5' 
            : 'text-textMuted hover:text-textMain hover:bg-surfaceHighlight'
        }`}
    >
        <span className={`transition-transform duration-300 ease-in-out ${active ? 'text-background' : 'text-textMuted group-hover:text-textMain'}`}>
            {icon}
        </span>
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
        red: "bg-red-500/10 border-red-500/20 text-red-500",
        orange: "bg-orange-500/10 border-orange-500/20 text-orange-500",
        gray: "bg-surfaceHighlight border-border text-textMuted"
    };

    const activeClass = colorClasses[statusColor as keyof typeof colorClasses] || colorClasses.gray;

    return (
        <div 
          onClick={onClick}
          className="group relative flex items-center justify-between p-4 rounded-xl hover:bg-surfaceHighlight border border-transparent hover:border-border transition-all cursor-pointer select-none overflow-hidden"
        >
            <div className="flex items-center gap-4 z-10">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors border border-border ${invoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface text-textMuted group-hover:bg-background'}`}>
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <div className="font-bold text-textMain text-base">{invoice.clientName}</div>
                    <div className="flex items-center gap-2 text-xs text-textMuted font-mono">
                      <span>#{invoice.invoiceNumber}</span>
                      {invoice.status !== 'paid' && invoice.remindersEnabled && (
                          <span className="hidden md:inline-flex items-center gap-1 text-emerald-500 ml-2">
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
                         <div className="font-mono font-bold text-base tracking-tight text-textMain">${invoice.amount.toLocaleString()}</div>
                         <div className="text-xs text-textMuted font-medium">USD</div>
                    </div>
                    
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-bold border min-w-[60px] justify-center tracking-wide uppercase z-10 ${activeClass}`}>
                        {statusLabel}
                    </div>
                </div>

                {/* Hover Actions - Slides In from Right */}
                <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 translate-x-full opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out z-20">
                    <button 
                        onClick={handleCopy}
                        className="p-2 hover:bg-background rounded-lg text-textMuted hover:text-textMain transition-colors bg-surface border border-border shadow-md"
                        title="Copy Link"
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-500"/> : <Copy className="w-4 h-4"/>}
                    </button>
                    <button 
                        className="p-2 hover:bg-background rounded-lg text-textMuted hover:text-textMain transition-colors bg-surface border border-border shadow-md"
                        title="View Details"
                    >
                        <ArrowUpRight className="w-4 h-4"/>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;