import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChange, getSession, signOut } from './src/lib/auth';
import { fetchInvoices, createInvoice, updateInvoice, updateInvoiceAccessToken } from './src/lib/invoices';
import { fetchClients, Client } from './src/lib/clients';
import { sendInvoiceEmail } from './src/lib/email';
import { Login } from './components/auth/Login';
import Dashboard from './components/app/Dashboard';
import { InvoiceBuilder, ClientInvoiceView, InvoiceModal } from './components/app/InvoiceBuilder';
import AdminDashboard from './components/app/AdminDashboard';
import { ViewState, Invoice } from './types';
import { supabase } from './src/lib/supabase';
import { DashboardSkeleton } from './components/ui/Skeleton';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

// Global Toast/Notification Component
interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'info';
  title: string;
  message: string;
}

const Toast: React.FC<{ toast: ToastMessage; onClose: (id: string) => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 5000); // Auto dismiss after 5s
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

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>('dashboard');
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Toast notification helper
  const showToast = (type: 'error' | 'success' | 'info', title: string, message: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Fetch user profile from database
  const fetchUserProfile = async (authUser: any) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Fallback to auth user data if users table query fails (RLS issues)
        setUserProfile({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          created_at: authUser.created_at,
          plan: 'free',
          role: 'user'
        });
      } else {
        setUserProfile(data);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      // Fallback
      setUserProfile({
        id: authUser.id,
        email: authUser.email,
        name: authUser.email?.split('@')[0] || 'User',
        created_at: authUser.created_at,
        plan: 'free',
        role: 'user'
      });
    }
  };

  // Check auth state on mount
  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user);
      }
      setLoading(false);
    };

    checkSession();

    // Listen to auth changes
    const { data: { subscription } } = onAuthStateChange(async (authUser) => {
      setUser(authUser);
      if (authUser) {
        await fetchUserProfile(authUser);
      } else {
        setUserProfile(null);
        setInvoices([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch invoices and clients when user is logged in
  useEffect(() => {
    if (user?.id) {
      loadInvoices();
      loadClients();
    }
  }, [user]);

  const loadInvoices = async () => {
    if (!user?.id) return;
    try {
      const data = await fetchInvoices(user.id);
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const loadClients = async () => {
    if (!user?.id) return;
    try {
      const data = await fetchClients(user.id);
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  // Ensure dark mode is always enabled
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.add('dark');
    body.classList.add('dark');
    body.style.backgroundColor = '#09090b';
    body.style.color = '#a1a1aa';
  }, []);

  const navigate = (newView: ViewState, invoiceId?: string) => {
    const id = invoiceId ?? activeInvoiceId ?? null;
    window.history.pushState({ view: newView, invoiceId: id }, '');
    if (invoiceId) setActiveInvoiceId(invoiceId);
    setView(newView);
    window.scrollTo(0, 0);
  };

  // Sync browser back/forward with app view state
  useEffect(() => {
    // Set initial history entry so back button works from the first view
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

  const handleOpenInvoice = (id: string) => {
    setActiveInvoiceId(id);
  };

  const handleCreateInvoice = async (newInvoice: Invoice) => {
    if (!user?.id) return;
    try {
      // Ensure currency is set from userProfile if not in invoice
      const invoiceWithCurrency = {
        ...newInvoice,
        currency: newInvoice.currency || userProfile?.currency || 'USD'
      };
      // Save invoice to database
      const savedInvoice = await createInvoice(invoiceWithCurrency, user.id);

      // Determine if user is premium
      const isPremium = userProfile?.plan === 'pro' || userProfile?.plan === 'premium';

      // Send invoice email with all required params
      const emailResult = await sendInvoiceEmail({
        to: newInvoice.clientEmail,
        clientName: newInvoice.clientName,
        invoiceNumber: newInvoice.invoiceNumber,
        amount: newInvoice.amount || newInvoice.items.reduce((sum, item) => sum + item.amount, 0),
        dueDate: newInvoice.dueDate,
        issueDate: newInvoice.issueDate,
        items: newInvoice.items,
        fromName: userProfile?.name || 'Your Business',
        fromEmail: userProfile?.email || user.email || '',
        userLogo: userProfile?.logo_url || userProfile?.avatar_url,
        isPremium: isPremium,
        invoiceId: savedInvoice.id,
        currency: newInvoice.currency || invoiceWithCurrency.currency,
      });

      // Store the access token and checkout URL with the invoice
      if (emailResult.success && emailResult.accessToken) {
        await updateInvoiceAccessToken(savedInvoice.id, emailResult.accessToken);
      }
      if (emailResult.checkoutUrl) {
        await updateInvoice(savedInvoice.id, { checkoutUrl: emailResult.checkoutUrl } as any);
      }

      await loadInvoices(); // Reload invoices
      navigate('dashboard');

      if (emailResult.success) {
        showToast('success', 'Invoice Sent!', `Invoice #${newInvoice.invoiceNumber} has been sent to ${newInvoice.clientEmail}`);
      } else {
        showToast('info', 'Invoice Saved', `Invoice created but email could not be sent: ${emailResult.error}`);
      }
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      showToast('error', 'Failed to Create Invoice', error.message || 'There was an error creating your invoice. Please try again.');
    }
  };

  const handlePayment = async (id: string) => {
    try {
      await updateInvoice(id, {
        status: 'paid',
        paidAt: new Date().toISOString(),
      });
      await loadInvoices(); // Reload invoices
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      setUserProfile(null);
      setInvoices([]);
      setView('dashboard');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };


  // Admin Dashboard View
  if (view === 'admin') {
    return (
      <div className="dark relative overflow-hidden min-h-screen">
        <AdminDashboard onBack={() => navigate('dashboard')} />
      </div>
    );
  }

  // Show loading state with skeleton
  if (loading) {
    return (
      <div className="dark relative overflow-hidden min-h-screen">
        <DashboardSkeleton />
      </div>
    );
  }

  // Show auth pages if not logged in
  if (!user) {
    return (
      <div className="dark relative overflow-hidden min-h-screen">
        <Login
          onSuccess={() => {
            // Auth state change will handle this
          }}
        />
      </div>
    );
  }

  // Client View (legacy - kept for internal preview only)
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

  // Create Invoice View
  if (view === 'create-invoice') {
    return (
      <div className="dark relative overflow-hidden min-h-screen">
        <InvoiceBuilder
          onCancel={() => navigate('dashboard')}
          onSave={handleCreateInvoice}
          userProfile={userProfile}
          existingClients={clients}
        />
        {/* Global Toast Notifications */}
        {toasts.length > 0 && (
          <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 max-w-md">
            {toasts.map(toast => (
              <Toast key={toast.id} toast={toast} onClose={removeToast} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="dark min-h-screen bg-background relative overflow-hidden">
      <Dashboard
        invoices={invoices}
        onLogout={handleLogout}
        onCreate={() => navigate('create-invoice')}
        onViewClient={handleOpenInvoice}
        userProfile={userProfile}
        onRefresh={async () => {
          await loadInvoices();
          if (user) await fetchUserProfile(user);
        }}
        onNavigateAdmin={() => navigate('admin')}
      />

      {/* Invoice Modal Overlay */}
      {activeInvoiceId && view === 'dashboard' && (
        <InvoiceModal
          invoice={invoices.find(i => i.id === activeInvoiceId) as Invoice}
          onClose={() => setActiveInvoiceId(null)}
          userProfile={userProfile}
          onRefresh={async () => { await loadInvoices(); }}
        />
      )}

      {/* Global Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 max-w-md">
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} onClose={removeToast} />
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
