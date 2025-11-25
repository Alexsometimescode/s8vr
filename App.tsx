import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/app/Dashboard';
import { InvoiceBuilder, ClientInvoiceView } from './components/app/InvoiceBuilder';
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
      theme: 'corporate'
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
      theme: 'creative'
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
      theme: 'minimal'
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
      theme: 'corporate'
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
      theme: 'minimal'
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
      theme: 'creative'
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
      theme: 'minimal'
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
      theme: 'corporate'
    }
  ]);

  const navigate = (newView: ViewState, invoiceId?: string) => {
    if (invoiceId) setActiveInvoiceId(invoiceId);
    setView(newView);
    window.scrollTo(0, 0);
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
    <div className="min-h-screen text-zinc-100 selection:bg-emerald-500/30">
      <Dashboard 
        invoices={invoices}
        onLogout={() => navigate('landing')}
        onCreate={() => navigate('create-invoice')}
        onViewClient={(id) => navigate('client-view', id)}
      />
    </div>
  );
};

export default App;