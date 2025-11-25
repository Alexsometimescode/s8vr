
import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/app/Dashboard';
import { InvoiceBuilder, ClientInvoiceView, InvoiceModal } from './components/app/InvoiceBuilder';
import { ViewState, Invoice } from './types';

const App: React.FC = () => {
  // Start directly in the dashboard as requested
  const [view, setView] = useState<ViewState>('dashboard');
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  
  // Robust Mock Data for a "Live" feel
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1',
      invoiceNumber: '1001',
      clientName: 'Acme Corp',
      clientEmail: 'billing@acme.com',
      items: [{ id: '1', description: 'Web Development Services', amount: 2400 }],
      status: 'ghosted',
      issueDate: '2023-08-01',
      dueDate: '2023-08-15',
      amount: 2400,
      remindersEnabled: true,
      theme: 'corporate',
      logs: [
        { id: '1', date: '2023-08-01T09:00:00', type: 'sent', message: 'Invoice #1001 sent to client' },
        { id: '2', date: '2023-08-01T10:15:00', type: 'opened', message: 'Client opened invoice' },
        { id: '3', date: '2023-08-16T09:00:00', type: 'reminder', message: 'Automated Reminder (Friendly) sent' },
        { id: '4', date: '2023-08-23T09:00:00', type: 'reminder', message: 'Automated Reminder (Casual) sent' },
      ]
    },
    {
      id: '2',
      invoiceNumber: '1002',
      clientName: 'Starlight Studio',
      clientEmail: 'sarah@starlight.io',
      items: [{ id: '1', description: 'Logo Design & Brand Identity', amount: 850 }],
      status: 'overdue',
      issueDate: '2023-09-15',
      dueDate: '2023-09-30',
      amount: 850,
      remindersEnabled: true,
      theme: 'creative',
      logs: [
        { id: '1', date: '2023-09-15T14:30:00', type: 'sent', message: 'Invoice #1002 sent to client' },
        { id: '2', date: '2023-10-01T09:00:00', type: 'reminder', message: 'Automated Reminder (Friendly) sent' }
      ]
    },
    {
      id: '3',
      invoiceNumber: '1003',
      clientName: 'Nexus Inc',
      clientEmail: 'finance@nexus.com',
      items: [{ id: '1', description: 'Q3 Consultation & Strategy', amount: 4200 }],
      status: 'pending', 
      issueDate: '2023-10-20',
      dueDate: '2023-11-03',
      amount: 4200,
      remindersEnabled: true,
      theme: 'minimal',
      logs: [
        { id: '1', date: '2023-10-20T11:00:00', type: 'sent', message: 'Invoice #1003 sent to client' }
      ]
    },
    {
      id: '4',
      invoiceNumber: '1004',
      clientName: 'Cyberdyne Systems',
      clientEmail: 'ap@cyberdyne.net',
      items: [{ id: '1', description: 'AI Model Training', amount: 12500 }],
      status: 'paid',
      issueDate: '2023-07-01',
      dueDate: '2023-07-15',
      amount: 12500,
      remindersEnabled: false,
      paidAt: '2023-07-10',
      theme: 'corporate',
      logs: [
        { id: '1', date: '2023-07-01T09:00:00', type: 'sent', message: 'Invoice #1004 sent' },
        { id: '2', date: '2023-07-10T15:45:00', type: 'paid', message: 'Payment received via Stripe' }
      ]
    },
    {
      id: '5',
      invoiceNumber: '1005',
      clientName: 'Massive Dynamic',
      clientEmail: 'nina@massive.com',
      items: [{ id: '1', description: 'UX Research Phase 1', amount: 3200 }],
      status: 'pending',
      issueDate: '2023-10-25',
      dueDate: '2023-11-08',
      amount: 3200,
      remindersEnabled: true,
      theme: 'minimal',
      logs: []
    },
    {
      id: '6',
      invoiceNumber: '1006',
      clientName: 'Starlight Studio',
      clientEmail: 'sarah@starlight.io',
      items: [{ id: '1', description: 'Social Media Assets', amount: 450 }],
      status: 'paid',
      issueDate: '2023-06-10',
      dueDate: '2023-06-24',
      amount: 450,
      remindersEnabled: true,
      paidAt: '2023-06-20',
      theme: 'creative',
      logs: [
        { id: '1', date: '2023-06-10T10:00:00', type: 'sent' },
        { id: '2', date: '2023-06-20T11:20:00', type: 'paid' }
      ]
    },
    {
      id: '7',
      invoiceNumber: '1007',
      clientName: 'Hooli',
      clientEmail: 'gavin@hooli.xyz',
      items: [{ id: '1', description: 'Compression Algorithm Audit', amount: 8000 }],
      status: 'draft',
      issueDate: '2023-11-01',
      dueDate: '2023-11-15',
      amount: 8000,
      remindersEnabled: false,
      theme: 'minimal',
      logs: []
    },
    {
      id: '8',
      invoiceNumber: '1008',
      clientName: 'Acme Corp',
      clientEmail: 'billing@acme.com',
      items: [{ id: '1', description: 'Maintenance Retainer (Oct)', amount: 500 }],
      status: 'paid',
      issueDate: '2023-10-01',
      dueDate: '2023-10-15',
      amount: 500,
      remindersEnabled: true,
      paidAt: '2023-10-02',
      theme: 'corporate',
      logs: [
          { id: '1', date: '2023-10-01T08:00:00', type: 'sent' },
          { id: '2', date: '2023-10-02T14:00:00', type: 'paid' }
      ]
    }
  ]);

  const navigate = (newView: ViewState, invoiceId?: string) => {
    if (invoiceId) setActiveInvoiceId(invoiceId);
    setView(newView);
    window.scrollTo(0, 0);
  };

  const handleOpenInvoice = (id: string) => {
    setActiveInvoiceId(id);
    // Don't change view, we will render a modal over the dashboard
  };

  const handleCreateInvoice = (newInvoice: Invoice) => {
    setInvoices([newInvoice, ...invoices]);
    navigate('dashboard');
  };

  const handlePayment = (id: string) => {
    setInvoices(invoices.map(inv => 
      inv.id === id ? { ...inv, status: 'paid', paidAt: new Date().toISOString() } : inv
    ));
    // Optional: Navigate back or stay on receipt
  };

  // Views
  if (view === 'landing') {
    return <LandingPage onLogin={() => navigate('dashboard')} />;
  }

  // Pure Client View (Simulated public link)
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

  if (view === 'create-invoice') {
    return (
      <InvoiceBuilder 
        onCancel={() => navigate('dashboard')} 
        onSave={handleCreateInvoice} 
      />
    );
  }

  return (
    <div className="min-h-screen text-zinc-100 selection:bg-emerald-500/30 relative">
      <Dashboard 
        invoices={invoices}
        onLogout={() => navigate('landing')}
        onCreate={() => navigate('create-invoice')}
        onViewClient={handleOpenInvoice}
      />
      
      {/* Invoice Modal Overlay */}
      {activeInvoiceId && view === 'dashboard' && (
         <InvoiceModal 
            invoice={invoices.find(i => i.id === activeInvoiceId) as Invoice}
            onClose={() => setActiveInvoiceId(null)}
         />
      )}
    </div>
  );
};

export default App;