import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChange, getSession, signOut } from './src/lib/auth';
import { fetchInvoices, createInvoice, updateInvoice, updateInvoiceAccessToken } from './src/lib/invoices';
import { fetchClients, Client } from './src/lib/clients';
import { sendInvoiceEmail } from './src/lib/email';
import { Login } from './components/auth/Login';
import { SignUp } from './components/auth/SignUp';
import Dashboard from './components/app/Dashboard';
import LandingPage from './components/LandingPage';
import { InvoiceBuilder, ClientInvoiceView, InvoiceModal } from './components/app/InvoiceBuilder';
import AdminDashboard from './components/app/AdminDashboard';
import { ClientInvoicePage } from './components/app/ClientInvoicePage';
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
  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup'>('landing');
  const [view, setView] = useState<ViewState>('dashboard');
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [publicInvoiceId, setPublicInvoiceId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Global mouse tracking for background glow effect (landing page only)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Check for public invoice URL on load (runs immediately, before auth check)
  useEffect(() => {
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const hasToken = searchParams.get('token');

    // Handle /invoice/:id route for public invoice viewing
    if (path.startsWith('/invoice/') && hasToken) {
      const invoiceId = path.replace('/invoice/', '').split('?')[0];
      if (invoiceId) {
        setPublicInvoiceId(invoiceId);
        setView('public-invoice');
        setLoading(false); // Don't wait for auth for public pages
        return;
      }
    }
    // Handle /pay/:id route
    if (path.startsWith('/pay/') && hasToken) {
      const invoiceId = path.replace('/pay/', '').split('?')[0];
      if (invoiceId) {
        setPublicInvoiceId(invoiceId);
        setView('public-invoice');
        setLoading(false); // Don't wait for auth for public pages
        return;
      }
    }
  }, []);

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
    // Skip auth check if we are on a public view
    if (publicInvoiceId) return;

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
  }, [publicInvoiceId]);

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
    if (invoiceId) setActiveInvoiceId(invoiceId);
    setView(newView);
    window.scrollTo(0, 0);
  };

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
      });

      // Store the access token with the invoice for secure link verification
      if (emailResult.success && emailResult.accessToken) {
        await updateInvoiceAccessToken(savedInvoice.id, emailResult.accessToken);
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

  // Public Invoice Page (for clients via email link) - show even when not logged in
  if (view === 'public-invoice' && publicInvoiceId) {
    return (
      <div className="dark relative overflow-hidden min-h-screen">
        <ClientInvoicePage invoiceId={publicInvoiceId} />
      </div>
    );
  }

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

  // Show landing page or auth pages if not logged in
  if (!user) {
    if (authView === 'landing') {
      return (
        <div className="dark relative overflow-hidden min-h-screen">
          <div 
            className="fixed pointer-events-none"
            style={{
              left: `${mousePosition.x}px`,
              top: `${mousePosition.y}px`,
              transform: 'translate(-50%, -50%)',
              width: '800px',
              height: '800px',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(100px)',
              transition: 'all 0.15s ease-out',
              zIndex: 0,
            }}
          />
          <LandingPage />
        </div>
      );
    }
    if (authView === 'login') {
      return (
        <div className="dark relative overflow-hidden min-h-screen">
          <Login
            onSuccess={() => {
              // Auth state change will handle this
            }}
            onSwitchToSignUp={() => setAuthView('signup')}
            onBackToLanding={() => setAuthView('landing')}
          />
        </div>
      );
    }
    return (
      <div className="dark relative overflow-hidden min-h-screen">
        <SignUp
          onSuccess={() => {
            // Auth state change will handle this
          }}
          onSwitchToLogin={() => setAuthView('login')}
          onBackToLanding={() => setAuthView('landing')}
        />
      </div>
    );
  }

  // Client View (public invoice link - legacy)
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
