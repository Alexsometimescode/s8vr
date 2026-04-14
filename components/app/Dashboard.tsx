
import React, { useState, useRef, useEffect } from 'react';
import { Button, Logo } from '../ui/Shared';
import { Invoice, ReminderFrequency, ReminderTone } from '../../types';
import { LogOut, ArrowUpRight, Copy, Check, Plus, Menu, FileText, UserPlus, Download, Save, Search, Filter, Bell, Zap, Clock, Calendar, Sliders, DollarSign, Activity, Trash2, ArrowLeft, AlertCircle, Settings, Upload, AlertTriangle, X, Send, Lock, ChevronLeft, ChevronRight, LayoutGrid, Users, ChevronDown, Mail, Phone, Globe, User, Loader2, CreditCard, BarChart3, PanelLeftClose, PanelLeft, MoreVertical } from 'lucide-react';
import { InvoicePreviewCard } from './InvoiceBuilder';
import { fetchClients, createClient, updateClient, deleteClient } from '../../src/lib/clients';
import { deleteInvoice } from '../../src/lib/invoices';
import { supabase } from '../../src/lib/supabase';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ProfileTab } from './ProfileTab';
import { Modal, ConfirmModal } from '../ui/Modal';
import { Edit2 } from 'lucide-react';

// SECURITY: Input Validation Helpers
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const sanitizeInput = (input: string) => input.replace(/[<>]/g, ''); // Basic strip to prevent XSS in demo

const getCurrencySymbol = (currency?: string): string => {
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'CA$', AUD: 'A$', CHF: 'CHF ', NZD: 'NZ$' };
  return symbols[(currency || 'USD').toUpperCase()] ?? ((currency || 'USD').toUpperCase() + ' ');
};

interface DashboardProps {
  invoices: Invoice[];
  onLogout: () => void;
  onCreate: () => void;
  onViewClient: (id: string) => void;
  userProfile?: any;
  onRefresh?: () => void;
  onNavigateAdmin?: () => void;
}

// Internal Components

const NavTab = ({ active, onClick, icon, label, collapsed }: any) => (
  <div className="relative group px-2">
    <button
      onClick={onClick}
      className={`relative flex items-center transition-all duration-200 rounded-xl w-full overflow-hidden
      ${active
          ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 backdrop-blur-xl text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
          : 'text-white hover:bg-gradient-to-br hover:from-white/10 hover:to-white/5 hover:backdrop-blur-xl hover:border-white/20 border border-transparent'
      }
      ${collapsed ? 'justify-center p-3' : 'justify-start px-4 py-3 gap-3'}
      `}
    >
      <span className={`shrink-0 transition-colors flex items-center justify-center relative z-10 ${active ? 'text-emerald-400' : 'text-white'}`}>{icon}</span>
      {!collapsed && (
        <span className={`font-medium whitespace-nowrap text-[14px] relative z-10 ${active ? 'text-emerald-400' : 'text-white'}`}>{label}</span>
      )}
    </button>
    
    {/* Tooltip for Collapsed State */}
    {collapsed && (
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-surface border border-border text-textMain text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
        {label}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[5px] w-2 h-2 bg-surface border-l border-b border-border rotate-45" />
      </div>
    )}
  </div>
);

const InvoiceListItem: React.FC<{ invoice: Invoice; onClick: () => void; onDelete?: () => void; isActive?: boolean; onCopy?: () => void }> = ({ invoice, onClick, onDelete, isActive, onCopy }) => {
  const isPaid = invoice.status === 'paid';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  
  // Calculate Days
  const today = new Date();
  const dueDate = new Date(invoice.dueDate);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Update menu position when opened
  useEffect(() => {
    if (menuOpen && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [menuOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    if (menuOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest(`[data-invoice-menu="${invoice.id}"]`) && !target.closest(`[data-menu-dropdown="${invoice.id}"]`)) {
          setMenuOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen, invoice.id]);

  return (
    <div 
      onClick={onClick}
      className={`group relative flex items-center justify-between p-4 border rounded-xl transition-all cursor-pointer overflow-hidden mb-2 md:mb-3 last:mb-0 ${isActive ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 backdrop-blur-xl border-emerald-500/30 shadow-lg shadow-emerald-500/10' : 'bg-gradient-to-br from-surface/30 to-surface/20 backdrop-blur-xl border-white/10 md:hover:border-white/20 md:hover:bg-gradient-to-br md:hover:from-surface/40 md:hover:to-surface/30'} shadow-md shadow-black/5`}
      style={{ zIndex: menuOpen ? 10000 : 'auto' }}
    >
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm border ${isPaid ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-surfaceHighlight text-textMuted border-border'}`}>
                {invoice.clientName.charAt(0)}
            </div>
            <div>
                <div className="font-bold text-sm text-textMain">{invoice.clientName}</div>
                <div className="text-xs text-textMuted/70">#{invoice.invoiceNumber}</div>
            </div>
        </div>

        <div className="flex items-center gap-2 relative">
            {/* Amount & Status - Slide Left on Hover (Desktop Only) */}
            <div className="flex items-center gap-3 transition-transform duration-300 md:group-hover:-translate-x-28">
                <div className="font-bold font-mono text-sm text-textMain" style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' }}>{getCurrencySymbol(invoice.currency)}{invoice.amount.toLocaleString()}</div>
                
                {/* Status Badge - Days Only */}
                {isPaid ? (
                   <div className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold font-mono">
                       PAID
                   </div>
                ) : (
                   <div className={`px-2 py-1 rounded border text-xs font-bold font-mono ${
                       diffDays < 0 
                       ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                       : diffDays <= 3 
                           ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                           : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                   }`}>
                       {diffDays < 0 ? `${diffDays}d` : `${diffDays}d`}
                   </div>
                )}
            </div>

            {/* Mobile: 3-Dots Menu */}
            <div className="md:hidden relative" data-invoice-menu={invoice.id}>
                <button
                    ref={menuButtonRef}
                    onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(!menuOpen);
                    }}
                    className="h-8 w-8 rounded-full flex items-center justify-center bg-surface border border-border hover:bg-surfaceHighlight hover:border-textMuted transition-all relative"
                    style={{ zIndex: menuOpen ? 10001 : 'auto' }}
                >
                    <MoreVertical className="w-4 h-4 text-textMuted" />
                </button>
                
                {/* Dropdown Menu - Absolute positioning to overlay */}
                {menuOpen && (
                    <>
                        <div className="fixed inset-0 z-[9998]" onClick={() => setMenuOpen(false)} />
                        <div 
                            data-menu-dropdown={invoice.id}
                            className="absolute right-0 top-10 bg-surface border border-border rounded-lg shadow-2xl min-w-[160px] overflow-hidden"
                            style={{ zIndex: 10002 }}
                        >
                            {invoice.checkoutUrl && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(invoice.checkoutUrl!);
                                        if (onCopy) onCopy();
                                        setMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm text-textMain hover:bg-surfaceHighlight flex items-center gap-3 transition-colors"
                                >
                                    <Copy className="w-4 h-4 text-textMuted" />
                                    Copy payment link
                                </button>
                            )}
                            {invoice.checkoutUrl && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(invoice.checkoutUrl!, '_blank');
                                        setMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm text-textMain hover:bg-surfaceHighlight flex items-center gap-3 transition-colors"
                                >
                                    <ArrowUpRight className="w-4 h-4 text-textMuted" />
                                    Pay on Stripe
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete();
                                        setMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete invoice
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Desktop: Action Buttons - Slide In from Right on Hover */}
            <div className="hidden md:flex absolute right-0 gap-1 translate-x-36 opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100 transition-all duration-300 ml-4 z-10">
                {invoice.checkoutUrl && (
                <div className="relative group/copy">
                    <button
                        className="h-8 w-8 rounded-full flex items-center justify-center bg-surface border border-border hover:bg-surfaceHighlight hover:border-textMuted transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(invoice.checkoutUrl!);
                            if (onCopy) onCopy();
                        }}
                        title="Copy payment link"
                    >
                        <Copy className="w-4 h-4 text-textMuted" />
                    </button>
                    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-surface border border-border text-textMain text-xs font-medium rounded opacity-0 group-hover/copy:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl max-w-[200px]">
                        Copy payment link
                        <div className="absolute left-full top-1/2 -translate-y-1/2 -translate-x-[5px] w-2 h-2 bg-surface border-r border-b border-border rotate-45" />
                    </div>
                </div>
                )}
                {invoice.checkoutUrl && (
                <div className="relative group/open">
                    <button
                        className="h-8 w-8 rounded-full flex items-center justify-center bg-surface border border-border hover:bg-surfaceHighlight hover:border-textMuted transition-all"
                        onClick={(e) => { e.stopPropagation(); window.open(invoice.checkoutUrl!, '_blank'); }}
                        title="Pay on Stripe"
                    >
                        <ArrowUpRight className="w-4 h-4 text-textMuted" />
                    </button>
                    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-surface border border-border text-textMain text-xs font-medium rounded opacity-0 group-hover/open:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl max-w-[200px]">
                        Pay on Stripe
                        <div className="absolute left-full top-1/2 -translate-y-1/2 -translate-x-[5px] w-2 h-2 bg-surface border-r border-b border-border rotate-45" />
                    </div>
                </div>
                )}
                {onDelete && (
                    <button
                        className="h-8 w-8 rounded-full flex items-center justify-center bg-surface border border-border text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        title="Delete invoice"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

// Custom Date Modal
const CustomDateModal = ({ isOpen, onClose, onApply, range }: any) => {
    const [localRange, setLocalRange] = useState(range);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm relative z-10 animate-in zoom-in-95 shadow-xl">
                <h3 className="font-bold text-lg mb-4 text-textMain">Select Date Range</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-textMuted uppercase mb-2">Start Date</label>
                        <input
                            type="date"
                            value={localRange.start}
                            onChange={(e) => setLocalRange({ ...localRange, start: e.target.value })}
                            onDoubleClick={(e) => (e.target as HTMLInputElement).showPicker()}
                            className="w-full bg-background border border-border rounded-lg p-2 text-sm text-textMain focus:outline-none focus:border-emerald-500 [color-scheme:dark] dark:[color-scheme:dark]"
                            style={{ cursor: 'pointer' }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-textMuted uppercase mb-2">End Date</label>
                        <input
                            type="date"
                            value={localRange.end}
                            onChange={(e) => setLocalRange({ ...localRange, end: e.target.value })}
                            onDoubleClick={(e) => (e.target as HTMLInputElement).showPicker()}
                            className="w-full bg-background border border-border rounded-lg p-2 text-sm text-textMain focus:outline-none focus:border-emerald-500 [color-scheme:dark] dark:[color-scheme:dark]"
                            style={{ cursor: 'pointer' }}
                        />
                    </div>
                    <div className="flex gap-3 justify-end mt-6">
                        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
                        <Button size="sm" onClick={() => onApply(localRange)}>Apply Filter</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Clients will be loaded from database

const TIME_RANGES = [
  { id: 'all', label: 'All Time' },
  { id: 'this_year', label: 'This Year' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_30', label: 'Last 30 Days' },
  { id: 'custom', label: 'Custom Range' },
];

const Dashboard: React.FC<DashboardProps> = ({ invoices, onLogout, onCreate, onViewClient, userProfile, onRefresh, onNavigateAdmin }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'reminders' | 'clients' | 'reports' | 'preferences' | 'profile'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeRange, setTimeRange] = useState<string>('all');
  
  // Time Filter State
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);
  const timeFilterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Jan 1st of current year
      end: new Date().toISOString().split('T')[0] // Today
  });
  
  
  // Clients State
  const [clients, setClients] = useState<any[]>([]);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientHasChanges, setClientHasChanges] = useState(false);
  const [originalClientData, setOriginalClientData] = useState<any | null>(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', company: '', email: '', phone: '', address: '' });
  const [addingClient, setAddingClient] = useState(false);

  // Toast Notification State
  const [toasts, setToasts] = useState<{ id: string; type: 'error' | 'success' | 'info'; title: string; message: string }[]>([]);
  
  const showToast = (type: 'error' | 'success' | 'info', title: string, message: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, title, message }]);
    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Profile State
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [unsavedItemType, setUnsavedItemType] = useState<'invoice' | 'client' | null>(null);

  // Reports State
  const [exporting, setExporting] = useState(false);

  // Settings State
  const [currency, setCurrency] = useState<string>('USD');
  const [invoiceNumberFormat, setInvoiceNumberFormat] = useState<string>('YYMM-seq');
  const [savingSettings, setSavingSettings] = useState(false);

  // Update settings when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setCurrency(userProfile.currency || 'USD');
      setInvoiceNumberFormat(userProfile.invoice_number_format || 'YYMM-seq');
    }
  }, [userProfile]);

  // Sync payment status with Stripe on load and every 2 minutes
  useEffect(() => {
    const syncPayments = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${API_URL}/api/invoices/sync-payments`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (data.updated?.length > 0 && onRefresh) onRefresh();
      } catch {
        // silent — polling should never surface errors to the user
      }
    };

    syncPayments();
    const interval = setInterval(syncPayments, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Export CSV function for reports
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // Convert filtered invoices to CSV
      const headers = ['Invoice #', 'Client', 'Date', 'Due Date', 'Amount', 'Status'];
      const rows = timeFilteredInvoices.map((inv) => [
        inv.invoiceNumber,
        inv.clientName || 'N/A',
        new Date(inv.issueDate).toLocaleDateString(),
        inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A',
        `${getCurrencySymbol(inv.currency)}${inv.amount.toFixed(2)}`,
        inv.status || 'pending',
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showToast('success', 'Export Successful', 'CSV exported successfully!');
    } catch (error: any) {
      console.error('Export error:', error);
      showToast('error', 'Export Failed', 'Failed to export CSV: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  // Modal State
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'default' | 'danger';
  } | null>(null);

  // Initialize profile editing state
  useEffect(() => {
    if (activeTab === 'profile' && userProfile) {
      setEditingProfile(userProfile);
      setAvatarPreview(userProfile.avatar_url || null);
      setLogoPreview(userProfile.logo_url || null);
    }
  }, [activeTab, userProfile]);

  // Profile handlers
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile?.id || !editingProfile) return;
    
    setSavingProfile(true);
    try {
      let avatarUrl = editingProfile.avatar_url;
      let logoUrl = editingProfile.logo_url;

      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        avatarUrl = publicUrl;
      }

      // Upload logo if changed
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${userProfile.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(fileName, logoFile, { upsert: true });

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('logos')
          .getPublicUrl(fileName);
        logoUrl = publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from('users')
        .update({
          name: editingProfile.name,
          avatar_url: avatarUrl,
          logo_url: logoUrl,
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      // Refresh profile
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userProfile.id)
        .single();

      if (data) {
        setEditingProfile(data);
        setAvatarFile(null);
        setLogoFile(null);
        if (onRefresh) onRefresh();
      }
      showToast('success', 'Profile Updated', 'Your profile has been saved successfully.');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showToast('error', 'Update Failed', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleConnectStripe = async () => {
    showToast('info', 'Coming Soon', 'Stripe Connect integration will be available soon!');
  };

  // Save currency setting
  const handleSaveCurrency = async (newCurrency: string) => {
    if (!userProfile?.id) return;
    
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ currency: newCurrency })
        .eq('id', userProfile.id);

      if (error) throw error;

      // Update local profile
      if (onRefresh) {
        await onRefresh();
      }
      showToast('success', 'Currency Updated', 'Your default currency has been saved.');
    } catch (error: any) {
      console.error('Error updating currency:', error);
      showToast('error', 'Update Failed', error.message || 'Failed to update currency. Please try again.');
      // Revert on error
      setCurrency(userProfile?.currency || 'USD');
    } finally {
      setSavingSettings(false);
    }
  };

  // Save invoice number format setting
  const handleSaveInvoiceFormat = async (newFormat: string) => {
    if (!userProfile?.id) return;
    
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ invoice_number_format: newFormat })
        .eq('id', userProfile.id);

      if (error) throw error;

      // Update local profile
      if (onRefresh) {
        await onRefresh();
      }
      showToast('success', 'Format Updated', 'Your invoice number format has been saved.');
    } catch (error: any) {
      console.error('Error updating invoice format:', error);
      showToast('error', 'Update Failed', error.message || 'Failed to update invoice format. Please try again.');
      // Revert on error
      setInvoiceNumberFormat(userProfile?.invoice_number_format || 'YYMM-seq');
    } finally {
      setSavingSettings(false);
    }
  };

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
      enabled: false,
      time: '09:00'
  });

  // Time Filter Interaction Handlers
  const handleTimeFilterEnter = () => {
      if (timeFilterTimeoutRef.current) clearTimeout(timeFilterTimeoutRef.current);
      setIsTimeFilterOpen(true);
  };

  const handleTimeFilterLeave = () => {
      timeFilterTimeoutRef.current = setTimeout(() => {
          setIsTimeFilterOpen(false);
      }, 400); // Delay closing by 400ms
  };

  const applyCustomDate = (range: { start: string, end: string }) => {
      setCustomDateRange(range);
      setTimeRange('custom');
      setShowCustomDateModal(false);
      setIsTimeFilterOpen(false);
  };

  // Time Filter Logic
  const getFilteredInvoices = (invoices: Invoice[]) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return invoices.filter(inv => {
      const date = new Date(inv.issueDate);
      switch(timeRange) {
        case 'this_month':
          return date >= startOfMonth;
        case 'this_year':
          return date >= startOfYear;
        case 'last_30':
          return date >= last30Days;
        case 'custom':
          if (!customDateRange.start || !customDateRange.end) return true;
          const start = new Date(customDateRange.start);
          const end = new Date(customDateRange.end);
          end.setHours(23, 59, 59, 999); // Include end of day
          return date >= start && date <= end;
        default:
          return true;
      }
    });
  };

  const timeFilteredInvoices = getFilteredInvoices(invoices);

  // Calculate stats based on FILTERED invoices
  const totalDue = timeFilteredInvoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = timeFilteredInvoices.filter(i => i.status === 'overdue' || i.status === 'ghosted').reduce((sum, i) => sum + i.amount, 0);
  const totalCollected = timeFilteredInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);

  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId);

  // Initialize config when an invoice is selected
  const handleSelectInvoice = (invoice: Invoice) => {
      setSelectedInvoiceId(invoice.id);
      setReminderConfig({
          freq: invoice.reminderFrequency || 'weekly',
          customInterval: invoice.reminderCustomInterval || 3,
          tone: invoice.reminderTone || 'friendly',
          enabled: invoice.remindersEnabled === true,
          time: invoice.reminderTime || '09:00'
      });
  };

  // Load clients from database (only once when userProfile is available)
  const clientsLoadedRef = useRef<string | null>(null);
  useEffect(() => {
    const loadClients = async () => {
      if (!userProfile?.id) return;
      // Only load if we haven't loaded for this user yet
      if (clientsLoadedRef.current === userProfile.id) return;
      try {
        setClientsLoading(true);
        const data = await fetchClients(userProfile.id);
        setClients(data);
        clientsLoadedRef.current = userProfile.id;
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setClientsLoading(false);
      }
    };
    loadClients();
  }, [userProfile?.id]);

  const handleSaveClient = async (updatedClient: any) => {
      // SECURITY: Basic Validation
      if (!updatedClient.name || !updatedClient.email) {
          showToast('error', 'Validation Error', 'Name and Email are required fields.');
          return;
      }
      if (!isValidEmail(updatedClient.email)) {
          showToast('error', 'Invalid Email', 'Please enter a valid email address.');
          return;
      }
      
      try {
        await updateClient(updatedClient.id, updatedClient);
        const data = await fetchClients(userProfile?.id);
        setClients(data);
        setEditingClient(null);
        showToast('success', 'Client Updated', 'Client information has been saved.');
      } catch (error) {
        console.error('Error updating client:', error);
        showToast('error', 'Update Failed', 'Failed to update client. Please try again.');
      }
  };

  const handleDeleteClient = async (id: string) => {
      try {
        await deleteClient(id);
        const data = await fetchClients(userProfile?.id);
        setClients(data);
        setEditingClient(null);
        showToast('success', 'Client Deleted', 'The client has been removed.');
      } catch (error) {
        console.error('Error deleting client:', error);
        showToast('error', 'Delete Failed', 'Failed to delete client. Please try again.');
      }
  };

  const handleAddClient = () => {
    setNewClient({ name: '', company: '', email: '', phone: '', address: '' });
    setShowAddClientModal(true);
  };

  // Delete Invoice Handler
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  
  const handleDeleteInvoice = async (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
  };

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    try {
      await deleteInvoice(invoiceToDelete.id);
      showToast('success', 'Invoice Deleted', `Invoice #${invoiceToDelete.invoiceNumber} has been deleted.`);
      if (onRefresh) onRefresh();
      setInvoiceToDelete(null);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      showToast('error', 'Delete Failed', 'Failed to delete invoice. Please try again.');
    }
  };

  // Save Reminder Configuration
  const handleSaveReminderConfig = async () => {
    if (!selectedInvoiceId) return;
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          reminders_enabled: reminderConfig.enabled,
          reminder_frequency: reminderConfig.freq,
          reminder_custom_interval: reminderConfig.customInterval,
          reminder_tone: reminderConfig.tone,
          reminder_time: reminderConfig.time
        })
        .eq('id', selectedInvoiceId);

      if (error) throw error;
      
      showToast('success', 'Settings Saved', 'Reminder configuration has been saved.');
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Error saving reminder config:', error);
      showToast('error', 'Save Failed', 'Failed to save reminder settings. Please try again.');
    }
  };

  const handleSaveNewClient = async () => {
    if (!newClient.name.trim() || !newClient.email.trim()) {
      return;
    }
    if (!isValidEmail(newClient.email)) {
      return;
    }
    
    setAddingClient(true);
    try {
      await createClient({ 
        name: newClient.name, 
        company: newClient.company,
        email: newClient.email, 
        phone: newClient.phone,
        address: newClient.address,
        active: true 
      }, userProfile?.id);
      const data = await fetchClients(userProfile?.id);
      setClients(data);
      setShowAddClientModal(false);
      setNewClient({ name: '', company: '', email: '', phone: '', address: '' });
    } catch (error) {
      console.error('Error adding client:', error);
    } finally {
      setAddingClient(false);
    }
  };

  

  const hasUsedApp = invoices.some(i => i.status !== 'draft');

  const renderHeaderAction = () => {
    // Shared Time Filter for Overview and Reports
    const timeFilterComponent = (activeTab === 'overview' || activeTab === 'reports') && (
        <div className="relative" onMouseEnter={handleTimeFilterEnter} onMouseLeave={handleTimeFilterLeave}>
            <button className="flex items-center gap-2 text-sm font-medium text-textMuted hover:text-textMain px-3 py-2 rounded-lg hover:bg-surfaceHighlight transition-colors">
                <Calendar className="w-4 h-4" />
                <span>
                    {timeRange === 'custom' 
                        ? `${new Date(customDateRange.start).toLocaleDateString()} - ${new Date(customDateRange.end).toLocaleDateString()}` 
                        : TIME_RANGES.find(r => r.id === timeRange)?.label}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isTimeFilterOpen ? 'rotate-180' : ''}`} />
            </button>
            {isTimeFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-surface/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-1">
                        {TIME_RANGES.map(range => (
                            <button
                                key={range.id}
                                onClick={() => {
                                    if (range.id === 'custom') {
                                        setShowCustomDateModal(true);
                                    } else {
                                        setTimeRange(range.id);
                                        setIsTimeFilterOpen(false);
                                    }
                                }}
                                className={`w-full text-left px-3 py-2.5 text-[14px] rounded-lg transition-colors ${
                                    timeRange === range.id 
                                        ? 'text-[#10b981] font-medium bg-[#10b981]/10' 
                                        : 'text-textMain hover:bg-surfaceHighlight'
                                }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="flex items-center gap-3">
            {timeFilterComponent}
            {(() => {
                switch (activeTab) {
                    case 'overview':
                    case 'invoices':
                        return <Button onClick={onCreate} icon={<Plus className="w-4 h-4"/>} size="sm">New Invoice</Button>;
                    case 'reminders':
                        return <Button onClick={handleSaveReminderConfig} disabled={!selectedInvoiceId || !reminderConfig.enabled} icon={<Save className="w-4 h-4"/>} size="sm">Save Configuration</Button>;
                    case 'clients':
                        if (editingClient) return null;
                        return <Button onClick={handleAddClient} icon={<UserPlus className="w-4 h-4"/>} size="sm">Add Client</Button>;
                    case 'reports':
                        return <Button onClick={() => {}} icon={<Download className="w-4 h-4"/>} size="sm" variant="outline">Export CSV</Button>;
                    case 'settings':
                        return null; // No action button needed for settings
                    case 'profile':
                        return <Button onClick={onLogout} icon={<LogOut className="w-4 h-4"/>} variant="danger" size="sm">Sign Out</Button>;
                    default:
                        return null;
                }
            })()}
        </div>
    );
  };

  const getEmailPreview = (tone: ReminderTone, clientName: string, invoiceNum: string) => {
      // SECURITY: Sanitize inputs for display
      const safeName = sanitizeInput(clientName);
      const safeNum = sanitizeInput(invoiceNum);

      switch(tone) {
          case 'friendly':
              return {
                  subject: `Friendly reminder: Invoice #${safeNum}`,
                  body: `Hi ${safeName.split(' ')[0]},\n\nHope you're having a great week! Just a gentle nudge that Invoice #${safeNum} is coming up due. Let me know if you have any questions!\n\nBest,\n[Your Name]`
              };
          case 'formal':
              return {
                  subject: `Reminder: Invoice #${safeNum} Payment Due`,
                  body: `Dear ${safeName},\n\nThis is a formal reminder that Invoice #${safeNum} is due for payment. We kindly request that you process this payment at your earliest convenience.\n\nIf you have any questions or concerns, please do not hesitate to contact us.\n\nSincerely,\n[Your Name]`
              };
          case 'professional':
              return {
                  subject: `Invoice #${safeNum} Outstanding`,
                  body: `Dear ${safeName},\n\nThis is a reminder regarding Invoice #${safeNum}, which is currently outstanding. Please remit payment at your earliest convenience.\n\nRegards,\n[Your Name]`
              };
          case 'casual':
              return {
                  subject: `Quick thing about #${safeNum} 👋`,
                  body: `Hey ${safeName.split(' ')[0]},\n\nJust bumping this to the top of your inbox. Invoice #${safeNum} is ready for payment whenever you have a sec.\n\nThanks!\n[Your Name]`
              };
          case 'urgent':
              return {
                  subject: `URGENT: Payment Required - Invoice #${safeNum}`,
                  body: `ATTN: ${safeName},\n\nInvoice #${safeNum} is significantly overdue. Immediate payment is required to avoid service interruption.\n\nPlease process this today.\n[Your Name]`
              };
          default: return { subject: '', body: '' };
      }
  };

  // Calculate next reminder time
  const getNextReminderTime = () => {
      if (!selectedInvoice || !reminderConfig.enabled) return null;
      
      const now = new Date();
      const [hours, minutes] = reminderConfig.time.split(':').map(Number);
      const nextTime = new Date();
      nextTime.setHours(hours, minutes, 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (nextTime <= now) {
          nextTime.setDate(nextTime.getDate() + 1);
      }
      
      let daysToAdd = 0;
      switch (reminderConfig.freq) {
          case 'daily':
              daysToAdd = 1;
              break;
          case 'weekly':
              daysToAdd = 7;
              break;
          case 'biweekly':
              daysToAdd = 14;
              break;
          case 'custom':
              daysToAdd = reminderConfig.customInterval || 3;
              break;
      }
      
      // Calculate first reminder date
      const dueDate = new Date(selectedInvoice.dueDate);
      const firstReminder = new Date(dueDate);
      firstReminder.setHours(hours, minutes, 0, 0);
      
      // If due date has passed, start from today
      if (firstReminder < now) {
          firstReminder.setTime(nextTime.getTime());
      }
      
      // Format the date
      const options: Intl.DateTimeFormatOptions = { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
      };
      
      return firstReminder.toLocaleDateString('en-US', options);
  };

  const monthlyRevenue = [
      { month: 'Jan', value: 4500 }, { month: 'Feb', value: 3200 }, { month: 'Mar', value: 6800 },
      { month: 'Apr', value: 5100 }, { month: 'May', value: 4200 }, { month: 'Jun', value: 7500 },
      { month: 'Jul', value: 8100 }, { month: 'Aug', value: 5400 }, { month: 'Sep', value: 6200 },
      { month: 'Oct', value: 9400 }, { month: 'Nov', value: 2400 }, { month: 'Dec', value: 0 }
  ];
  const maxRevenue = 10000;

  // Apply search filter on top of time-filtered invoices
  const searchFilteredInvoices = timeFilteredInvoices.filter(inv => {
      if (!searchQuery) return true;
      // SECURITY: Sanitize Search Query implicitly handled by React rendering, but good to keep in mind
      return inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
             inv.invoiceNumber.includes(searchQuery);
  });

  // Legacy alias for backward compatibility with search-only filtering
  const filteredInvoices = searchFilteredInvoices;

  const overdueInvoices = searchFilteredInvoices.filter(inv => ['overdue', 'ghosted'].includes(inv.status));
  const activeInvoices = searchFilteredInvoices.filter(inv => ['pending', 'draft'].includes(inv.status));
  const paidInvoices = searchFilteredInvoices.filter(inv => inv.status === 'paid');


  return (
    <div className="flex h-screen bg-background text-textMain overflow-hidden font-sans transition-colors duration-300">
      
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden md:flex flex-col border-r border-white/10 bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl py-6 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] relative group/sidebar ${sidebarCollapsed ? 'w-20 px-3' : 'w-64 px-6'} z-20 shadow-2xl shadow-black/20`}
      >
        {/* Collapse Toggle Button - Always visible */}
        <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`absolute -right-3 top-10 w-6 h-6 flex items-center justify-center bg-surface border border-border rounded-full text-white hover:text-[#10b981] hover:border-[#10b981]/50 transition-all duration-300 z-50 shadow-md hover:shadow-lg ${sidebarCollapsed ? 'rotate-180' : ''}`}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
            <ChevronLeft size={14} />
        </button>

        <div className={`mb-8 ${sidebarCollapsed ? 'px-0 flex justify-center' : 'px-2'}`}>
            <div className={sidebarCollapsed ? 'w-full flex justify-center' : 'px-4'}>
                <Logo collapsed={sidebarCollapsed} />
            </div>
        </div>
        
        <nav className="flex-1 space-y-2">
            <NavTab 
                active={activeTab === 'overview'} 
                onClick={() => { setActiveTab('overview'); setEditingClient(null); }} 
                icon={<LayoutGrid className="w-5 h-5" />} 
                label="Overview" 
                collapsed={sidebarCollapsed}
            />
            <NavTab 
                active={activeTab === 'invoices'} 
                onClick={() => { setActiveTab('invoices'); setEditingClient(null); }} 
                icon={<FileText className="w-5 h-5" />} 
                label="Invoices" 
                collapsed={sidebarCollapsed}
            />
            <NavTab 
                active={activeTab === 'reminders'} 
                onClick={() => { setActiveTab('reminders'); setEditingClient(null); }} 
                icon={<Bell className="w-5 h-5" />} 
                label="Reminders" 
                collapsed={sidebarCollapsed}
            />
            <NavTab 
                active={activeTab === 'clients'} 
                onClick={() => { setActiveTab('clients'); setEditingClient(null); }} 
                icon={<Users className="w-5 h-5" />} 
                label="Clients" 
                collapsed={sidebarCollapsed}
            />
            <NavTab 
                active={activeTab === 'reports'} 
                onClick={() => { setActiveTab('reports'); setEditingClient(null); }} 
                icon={<BarChart3 className="w-5 h-5" />} 
                label="Reports" 
                collapsed={sidebarCollapsed}
            />
        </nav>

        <div className="mt-auto space-y-2">
            <NavTab
                active={activeTab === 'preferences'}
                onClick={() => { setActiveTab('preferences'); setEditingClient(null); }}
                icon={<Settings className="w-5 h-5" />}
                label="Preferences"
                collapsed={sidebarCollapsed}
            />

            {/* Profile Section */}
            <div className={`pt-4 border-t border-white/10 transition-all duration-300 ${sidebarCollapsed ? 'mx-0' : ''}`}>
                <button
                    onClick={() => { setActiveTab('profile'); setEditingClient(null); }}
                    className={`w-full flex items-center rounded-xl transition-all duration-200 group overflow-hidden relative ${
                        activeTab === 'profile' 
                            ? 'bg-gradient-to-br from-zinc-500/20 to-zinc-500/10 backdrop-blur-xl border border-zinc-500/30 shadow-lg shadow-zinc-500/10' 
                            : 'hover:bg-gradient-to-br hover:from-white/10 hover:to-white/5 hover:backdrop-blur-xl hover:border-white/20 border border-transparent'
                    } ${sidebarCollapsed ? 'p-2 justify-center' : 'px-3 py-3 gap-3 text-left'} shadow-md shadow-black/5`}
                >
                    {userProfile?.avatar_url ? (
                        <img 
                            src={userProfile.avatar_url} 
                            alt="Avatar" 
                            className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-surfaceHighlight text-white border border-border flex items-center justify-center font-medium text-xs shrink-0">
                            {userProfile?.name?.charAt(0)?.toUpperCase() || userProfile?.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                    )}
                    <div className={`overflow-hidden flex-1 transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100'}`}>
                        <div className="text-[14px] font-medium truncate text-white">{userProfile?.name || 'User'}</div>
                        <div className="text-[12px] text-white/70 truncate">{userProfile?.email || ''}</div>
                    </div>
                </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-background">
         
         {/* Mobile Header */}
         <div className="md:hidden flex items-center justify-between p-4 px-[26px] border-b border-border bg-background z-30">
             <Logo />
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-textMuted">
                 <Menu className="w-6 h-6" />
             </button>
         </div>

         {/* Mobile Menu Overlay */}
         {mobileMenuOpen && (
             <div className="absolute inset-0 z-40 bg-background p-6 flex flex-col md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
                 <div className="flex justify-between items-center mb-8 px-[10px]">
                     <Logo />
                     <button onClick={() => setMobileMenuOpen(false)} className="text-textMuted">
                         <Menu className="w-6 h-6" />
                     </button>
                 </div>
                 <nav className="space-y-4">
                    <NavTab active={activeTab === 'overview'} onClick={() => {setActiveTab('overview'); setMobileMenuOpen(false)}} icon={<LayoutGrid className="w-5 h-5"/>} label="Overview" />
                    <NavTab active={activeTab === 'invoices'} onClick={() => {setActiveTab('invoices'); setMobileMenuOpen(false)}} icon={<FileText className="w-5 h-5"/>} label="Invoices" />
                    <NavTab active={activeTab === 'reminders'} onClick={() => {setActiveTab('reminders'); setMobileMenuOpen(false)}} icon={<Bell className="w-5 h-5"/>} label="Reminders" />
                    <NavTab active={activeTab === 'clients'} onClick={() => {setActiveTab('clients'); setMobileMenuOpen(false)}} icon={<Users className="w-5 h-5"/>} label="Clients" />
                    <NavTab active={activeTab === 'reports'} onClick={() => {setActiveTab('reports'); setMobileMenuOpen(false)}} icon={<BarChart3 className="w-5 h-5"/>} label="Reports" />
                    <NavTab active={activeTab === 'preferences'} onClick={() => {setActiveTab('preferences'); setMobileMenuOpen(false)}} icon={<Settings className="w-5 h-5"/>} label="Preferences" />
                 </nav>
                  <div className="mt-auto pt-8 border-t border-border space-y-4">
                      <button 
                         onClick={() => {setActiveTab('profile'); setMobileMenuOpen(false)}}
                         className="flex items-center gap-3 text-white font-medium w-full"
                      >
                         {userProfile?.avatar_url ? (
                             <img 
                                 src={userProfile.avatar_url} 
                                 alt="Avatar" 
                                 className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                             />
                         ) : (
                             <div className="w-10 h-10 rounded-full bg-surfaceHighlight text-white border border-border flex items-center justify-center font-medium text-sm shrink-0">
                                 {userProfile?.name?.charAt(0)?.toUpperCase() || userProfile?.email?.charAt(0)?.toUpperCase() || 'U'}
                             </div>
                         )}
                         <div className="flex-1 min-w-0 text-left">
                             <div className="text-sm font-medium truncate">{userProfile?.name || 'User'}</div>
                             <div className="text-xs text-white/70 truncate">{userProfile?.email || ''}</div>
                         </div>
                      </button>
                      <button onClick={onLogout} className="text-red-400 font-medium flex items-center gap-3 ml-[10px]">
                         <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                  </div>
             </div>
         )}

         {/* Top Bar (Desktop) */}
         <header className="hidden md:flex h-20 items-center justify-between px-8 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10 transition-all">
            {/* Tab heading - white text */}
            <h2 className="text-[28px] font-medium capitalize tracking-tight text-white">{editingClient ? 'Edit Client' : activeTab}</h2>
            <div>
               {renderHeaderAction()}
            </div>
         </header>

         {/* Content Scroll Area */}
         <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8 custom-scrollbar pb-20 md:pb-8">
            
            {activeTab === 'overview' && (
                <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                    
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-medium text-white">
                                Hello <span className="font-bold">{userProfile?.name || 'there'}</span> 👋
                            </h3>
                            <span className="text-sm text-white/70">
                                ({timeRange === 'custom' ? 'Custom Range' : TIME_RANGES.find(r => r.id === timeRange)?.label})
                            </span>
                        </div>
                    </div>

                    {/* Stats Row - Linear/Attio inspired */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 flex flex-col shadow-2xl shadow-black/20 hover:border-white/20 transition-all duration-300 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none">
                            <div className="relative z-10">
                                <div className="text-[32px] font-bold text-orange-400 tracking-tight mb-1 border-none">{getCurrencySymbol(userProfile?.currency)}{totalDue.toLocaleString()}</div>
                                <div className="text-textMuted text-xs font-medium">Total outstanding</div>
                            </div>
                        </div>
                        <div className="relative bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 flex flex-col shadow-2xl shadow-black/20 hover:border-white/20 transition-all duration-300 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none">
                            <div className="relative z-10">
                                <div className="text-[32px] font-bold text-red-400 tracking-tight mb-1">{getCurrencySymbol(userProfile?.currency)}{totalOverdue.toLocaleString()}</div>
                                <div className="text-textMuted text-xs font-medium">Overdue amount</div>
                            </div>
                        </div>
                        <div className="relative bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 flex flex-col shadow-2xl shadow-black/20 hover:border-white/20 transition-all duration-300 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none">
                            <div className="relative z-10">
                                <div className="text-[32px] font-bold text-emerald-400 tracking-tight mb-1 border-none">{getCurrencySymbol(userProfile?.currency)}{totalCollected.toLocaleString()}</div>
                                <div className="text-textMuted text-xs font-medium">Collected</div>
                                <div className="md:hidden mt-4">
                                    <Button onClick={onCreate} icon={<Plus className="w-4 h-4"/>} size="sm">New</Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                         <div className="flex items-center justify-between mb-4">
                             <h3 className="text-lg font-bold text-textMain">Recent Invoices</h3>
                             <Button size="sm" variant="ghost" onClick={() => setActiveTab('invoices')}>View All</Button>
                         </div>

                        <div className="bg-surface border border-border rounded-2xl shadow-sm relative min-h-[200px] overflow-hidden">
                            <div className="p-2 space-y-1">
                                {timeFilteredInvoices.length > 0 ? (
                                timeFilteredInvoices.slice(0, 5).map(invoice => (
                                    <InvoiceListItem 
                                        key={invoice.id} 
                                        invoice={invoice} 
                                        onClick={() => onViewClient(invoice.id)}
                                        onDelete={() => handleDeleteInvoice(invoice)}
                                        onCopy={() => showToast('success', 'Invoice link copied', 'The invoice link has been copied to your clipboard.')}
                                    />
                                ))
                                ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-textMuted">
                                    <p className="mb-4">No invoices in selected time range.</p>
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
                        <div className="space-y-4">
                             {/* Urgent / Overdue Section */}
                             {overdueInvoices.length > 0 && (
                                <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 mb-0">
                                    <h3 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-3 pl-2 flex items-center gap-2">Requires Action</h3>
                                    <div className="relative bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl border border-red-500/20 rounded-2xl pt-2 pb-2 px-2 md:pt-3 md:pb-3 md:px-3 space-y-2 md:space-y-3 overflow-hidden shadow-2xl shadow-black/20 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none">
                                        <div className="relative z-10">
                                            {overdueInvoices.map(inv => (
                                                <InvoiceListItem key={inv.id} invoice={inv} onClick={() => onViewClient(inv.id)} onDelete={() => handleDeleteInvoice(inv)} onCopy={() => showToast('success', 'Invoice link copied', 'The invoice link has been copied to your clipboard.')} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                             )}

                             {/* Active Section */}
                             {activeInvoices.length > 0 && (
                                <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 mb-0">
                                    <h3 className="text-textMuted text-xs font-bold uppercase tracking-wider mb-3 pl-2">Active</h3>
                                    <div className="relative bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl border border-white/10 rounded-2xl pt-2 pb-2 px-2 md:pt-3 md:pb-3 md:px-3 space-y-2 md:space-y-3 overflow-hidden shadow-2xl shadow-black/20 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none">
                                        <div className="relative z-10">
                                            {activeInvoices.map(inv => (
                                                <InvoiceListItem key={inv.id} invoice={inv} onClick={() => onViewClient(inv.id)} onDelete={() => handleDeleteInvoice(inv)} onCopy={() => showToast('success', 'Invoice link copied', 'The invoice link has been copied to your clipboard.')} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                             )}

                             {/* Paid Section */}
                             {paidInvoices.length > 0 && (
                                <div className="animate-in slide-in-from-bottom-6 fade-in duration-700 mb-0">
                                    <h3 className="text-textMuted text-xs font-bold uppercase tracking-wider mb-3 pl-2">Paid History</h3>
                                    <div className="relative bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl border border-white/10 rounded-2xl pt-2 pb-2 px-2 md:pt-3 md:pb-3 md:px-3 space-y-2 md:space-y-3 overflow-hidden shadow-2xl shadow-black/20 opacity-80 hover:opacity-100 hover:border-white/20 transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none after:absolute after:inset-0 after:bg-gradient-to-t after:from-black/5 after:to-transparent after:pointer-events-none">
                                        <div className="relative z-10">
                                            {paidInvoices.map(inv => (
                                                <InvoiceListItem key={inv.id} invoice={inv} onClick={() => onViewClient(inv.id)} onDelete={() => handleDeleteInvoice(inv)} onCopy={() => showToast('success', 'Invoice link copied', 'The invoice link has been copied to your clipboard.')} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                             )}
                        </div>
                    )}
                </div>
            )}
            
            {/* Reminders Tab Content */}
            {activeTab === 'reminders' && (
                <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
                    {invoices.length === 0 ? (
                        // Empty State - No invoices
                        <div className="h-[calc(100vh-200px)] flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface border border-border flex items-center justify-center">
                                    <Bell className="w-10 h-10 text-textMuted opacity-30" />
                                </div>
                                <h3 className="text-xl font-semibold text-textMain mb-2">No invoices yet</h3>
                                <p className="text-textMuted mb-6 max-w-sm">
                                    Create your first invoice to set up automated reminders for your clients.
                                </p>
                                <Button onClick={onCreate} icon={<Plus className="w-4 h-4" />}>
                                    Create Your First Invoice
                                </Button>
                            </div>
                        </div>
                    ) : invoices.filter(i => i.status !== 'paid').length === 0 ? (
                        // Empty State - All invoices paid
                        <div className="h-[calc(100vh-200px)] flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-transparent">
                                    <Check className="w-10 h-10 text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-textMain mb-2">All invoices paid!</h3>
                                <p className="text-textMuted mb-6 max-w-sm">
                                    All your invoices have been paid. Create a new invoice to set up reminders.
                                </p>
                                <Button onClick={onCreate} icon={<Plus className="w-4 h-4" />}>
                                    Create New Invoice
                                </Button>
                            </div>
                        </div>
                    ) : (
                    <div className="flex flex-col md:flex-row gap-4 md:gap-8 h-full">
                    {/* Left Col: Invoice Selector */}
                    <div className="w-full md:w-1/3 relative bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl shadow-black/20 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none">
                        <div className="relative z-10 p-4 border-b border-white/10">
                            <h3 className="font-bold text-textMuted text-sm uppercase tracking-wider">Active Invoices</h3>
                        </div>
                        <div className="relative z-10 flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                             {invoices.filter(i => i.status !== 'paid').length === 0 ? (
                                 <div className="text-center py-8 text-textMuted text-sm">
                                     <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" />
                                     <p>All invoices have been paid!</p>
                                 </div>
                             ) : invoices.filter(i => i.status !== 'paid').map(invoice => (
                                 <div 
                                    key={invoice.id}
                                    onClick={() => handleSelectInvoice(invoice)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                                        selectedInvoiceId === invoice.id 
                                        ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 backdrop-blur-xl border-emerald-500/30 shadow-lg shadow-emerald-500/10' 
                                        : 'bg-gradient-to-br from-surface/30 to-surface/20 backdrop-blur-xl border-white/10 hover:border-white/20 hover:bg-gradient-to-br hover:from-surface/40 hover:to-surface/30'
                                    } shadow-md shadow-black/5`}
                                 >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-bold text-textMain">{invoice.clientName}</div>
                                        <div className="text-xs font-mono bg-background px-1.5 py-0.5 rounded text-textMuted border border-border">#{invoice.invoiceNumber}</div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="text-textMuted">{getCurrencySymbol(invoice.currency)}{invoice.amount.toLocaleString()}</div>
                                        {invoice.remindersEnabled ? (
                                            <div className="flex items-center gap-1 text-emerald-500"><Bell className="w-3 h-3" /> On</div>
                                        ) : (
                                            <div className="text-textMuted">Off</div>
                                        )}
                                    </div>
                                 </div>
                             ))}
                        </div>
                    </div>

                    {/* Right Col: Configuration */}
                    <div className="flex-1 flex flex-col space-y-6 overflow-y-auto md:pr-2 pb-24 custom-scrollbar">
                        {selectedInvoice ? (
                            <>
                                {/* Master Toggle */}
                                <div className="relative bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl shadow-black/20 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none overflow-hidden">
                                    <div className="relative z-10 flex gap-3 md:gap-4 items-center flex-1 min-w-0">
                                        <div className={`p-2 md:p-3 rounded-full shrink-0 ${reminderConfig.enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surfaceHighlight text-textMuted'}`}>
                                            <Bell className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-base md:text-lg text-textMain">Automated Nudges</h3>
                                            <p className="text-xs md:text-sm text-textMuted">Automatically send email reminders when this invoice is outstanding.</p>
                                        </div>
                                    </div>
                                    <div className="relative z-10">
                                        <button 
                                            onClick={() => setReminderConfig({...reminderConfig, enabled: !reminderConfig.enabled})}
                                            className={`w-12 h-7 md:w-14 md:h-8 rounded-full relative transition-colors shrink-0 ${reminderConfig.enabled ? 'bg-emerald-500' : 'bg-surfaceHighlight'}`}
                                        >
                                            <div className={`absolute top-0.5 bottom-0.5 md:top-1 md:bottom-1 w-5 md:w-6 bg-white rounded-full shadow transition-all ${reminderConfig.enabled ? 'left-6 md:left-7' : 'left-0.5 md:left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                                {/* Configuration Options */}
                                {reminderConfig.enabled && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
                                    {/* Frequency Selection */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Frequency</label>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                            {[
                                                { id: 'weekly', label: 'Weekly', icon: <Clock className="w-4 h-4"/>, description: 'Every 7 days' },
                                                { id: 'biweekly', label: 'Bi-weekly', icon: <Calendar className="w-4 h-4"/>, description: 'Every 14 days' },
                                                { id: 'daily', label: 'Daily', icon: <Zap className="w-4 h-4"/>, description: 'Every day' },
                                                { id: 'custom', label: 'Custom', icon: <Sliders className="w-4 h-4"/>, description: 'Set your own interval' }
                                            ].map((opt) => (
                                                <button 
                                                    key={opt.id} 
                                                    onClick={() => setReminderConfig({...reminderConfig, freq: opt.id as ReminderFrequency})} 
                                                    className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${reminderConfig.freq === opt.id ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 backdrop-blur-xl border-emerald-500/30 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/10' : 'bg-gradient-to-br from-surface/30 to-surface/20 backdrop-blur-xl border-white/10 hover:border-white/20 hover:bg-gradient-to-br hover:from-surface/40 hover:to-surface/30'} shadow-md shadow-black/5`}
                                                >
                                                    <div className={`mb-2 ${reminderConfig.freq === opt.id ? 'text-emerald-500' : 'text-textMuted'}`}>{opt.icon}</div>
                                                    <div className={`font-bold text-sm mb-1 ${reminderConfig.freq === opt.id ? 'text-textMain' : 'text-textMuted'}`}>{opt.label}</div>
                                                    <div className={`text-xs ${reminderConfig.freq === opt.id ? 'text-textMuted' : 'text-textMuted/70'}`}>{opt.description}</div>
                                                    {reminderConfig.freq === opt.id && (
                                                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-transparent">
                                                            <Check className="w-3 h-3 text-emerald-500" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        {/* Custom Interval Input */}
                                        {reminderConfig.freq === 'custom' && (
                                            <div className="mt-4 space-y-2">
                                                <label className="text-xs font-medium text-textMuted">Interval (days)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="365"
                                                    value={reminderConfig.customInterval}
                                                    onChange={(e) => setReminderConfig({...reminderConfig, customInterval: parseInt(e.target.value) || 3})}
                                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-textMain focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                                                    placeholder="Enter days"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Time Selection */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Send Time</label>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                                            <input
                                                type="time"
                                                value={reminderConfig.time}
                                                onChange={(e) => setReminderConfig({...reminderConfig, time: e.target.value})}
                                                className="w-full sm:w-auto px-4 py-2 bg-surface border border-border rounded-lg text-textMain focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all [color-scheme:dark]"
                                            />
                                            {getNextReminderTime() && (
                                                <div className="flex items-center gap-2 text-xs sm:text-sm text-textMuted flex-wrap">
                                                    <Clock className="w-4 h-4 shrink-0" />
                                                    <span className="whitespace-nowrap">Next reminder: <span className="text-textMain font-medium">{getNextReminderTime()}</span></span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Email Tone Selection */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Email Tone</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { id: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
                                                { id: 'formal', label: 'Formal', description: 'Professional and respectful' }
                                            ].map((tone) => (
                                                <button 
                                                    key={tone.id} 
                                                    onClick={() => setReminderConfig({...reminderConfig, tone: tone.id as ReminderTone})} 
                                                    className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${reminderConfig.tone === tone.id ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 backdrop-blur-xl border-emerald-500/30 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/10' : 'bg-gradient-to-br from-surface/30 to-surface/20 backdrop-blur-xl border-white/10 hover:border-white/20 hover:bg-gradient-to-br hover:from-surface/40 hover:to-surface/30'} shadow-md shadow-black/5`}
                                                >
                                                    <div className={`font-bold text-sm mb-1 ${reminderConfig.tone === tone.id ? 'text-textMain' : 'text-textMuted'}`}>{tone.label}</div>
                                                    <div className={`text-xs ${reminderConfig.tone === tone.id ? 'text-textMuted' : 'text-textMuted/70'}`}>{tone.description}</div>
                                                    {reminderConfig.tone === tone.id && (
                                                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-transparent">
                                                            <Check className="w-3 h-3 text-emerald-500" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Preview Box */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Email Preview</label>
                                        <div className="relative bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/20 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none overflow-hidden">
                                            <div className="relative z-10">
                                                {(() => {
                                                    const preview = getEmailPreview(reminderConfig.tone, selectedInvoice.clientName, selectedInvoice.invoiceNumber);
                                                    return (
                                                        <>
                                                            <div className="border-b border-white/10 pb-4 mb-4">
                                                                <div className="text-xs text-textMuted uppercase tracking-wider mb-1">Subject</div>
                                                                <div className="text-sm text-textMain font-medium">{preview.subject}</div>
                                                            </div>
                                                            <div className="text-xs text-textMuted uppercase tracking-wider mb-2">Body</div>
                                                            <div className="text-sm text-textMain whitespace-pre-line leading-relaxed">{preview.body}</div>
                                                        </>
                                                    )
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                )}
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-textMuted border border-border border-dashed rounded-2xl bg-surface/50">
                                <p>Select an invoice to configure reminders.</p>
                            </div>
                        )}
                    </div>
                    </div>
                    )}
                </div>
            )}

            {/* Clients, Reports, Settings, Profile Tabs (Standard UI) */}
            {activeTab === 'clients' && (
                <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
                    {!showEditClientModal && (
                        <div className="space-y-4">
                            {clientsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-textMuted" />
                                </div>
                            ) : clients.length === 0 ? (
                                <div className="relative bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl border border-white/10 rounded-2xl py-12 text-textMuted shadow-2xl shadow-black/20 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none overflow-hidden">
                                    <div className="relative z-10 flex flex-col items-center justify-center">
                                        <Users className="w-12 h-12 mb-4 opacity-20" />
                                        <p className="mb-4">No clients yet.</p>
                                        <Button onClick={handleAddClient} icon={<UserPlus className="w-4 h-4"/>}>Add Your First Client</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Header Row - Desktop Only */}
                                    <div className="hidden md:grid grid-cols-12 gap-4 items-center pb-2 border-b border-white/10">
                                        <div className="col-span-4 text-xs font-bold text-textMuted uppercase tracking-wider">Name</div>
                                        <div className="col-span-3 text-xs font-bold text-textMuted uppercase tracking-wider">Email</div>
                                        <div className="col-span-2 text-xs font-bold text-textMuted uppercase tracking-wider">Phone</div>
                                        <div className="col-span-1 text-xs font-bold text-textMuted uppercase tracking-wider text-center">Status</div>
                                        <div className="col-span-2"></div>
                                    </div>
                                    {/* Client Rows */}
                                    {clients.map((client) => (
                                        <div key={client.id} className="relative bg-gradient-to-br from-surface/30 to-surface/20 backdrop-blur-xl border border-white/10 rounded-xl hover:border-white/20 hover:bg-gradient-to-br hover:from-surface/40 hover:to-surface/30 transition-all shadow-md shadow-black/5 group">
                                            {/* Desktop Layout */}
                                            <div className="hidden md:grid grid-cols-12 gap-4 items-center p-4">
                                                <div className="col-span-4 font-bold text-sm text-textMain">{client.name}</div>
                                                <div className="col-span-3 text-sm text-textMuted truncate">{client.email}</div>
                                                <div className="col-span-2 text-sm text-textMuted">{client.phone || '-'}</div>
                                                <div className="col-span-1 flex justify-center"><div className={`w-2 h-2 rounded-full ${client.active ? 'bg-emerald-500' : 'bg-surfaceHighlight'}`} /></div>
                                                <div className="col-span-2 flex justify-end">
                                                    <button
                                                        onClick={() => {
                                                            setEditingClient({...client});
                                                            setOriginalClientData({...client});
                                                            setClientHasChanges(false);
                                                            setShowEditClientModal(true);
                                                        }}
                                                        className="p-2 text-textMuted hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Mobile Layout */}
                                            <div className="md:hidden p-4 space-y-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-base text-textMain mb-1">{client.name}</div>
                                                        <div className="text-sm text-textMuted truncate">{client.email}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <div className={`w-2.5 h-2.5 rounded-full ${client.active ? 'bg-emerald-500' : 'bg-surfaceHighlight'}`} />
                                                        <button
                                                            onClick={() => {
                                                                setEditingClient({...client});
                                                                setOriginalClientData({...client});
                                                                setClientHasChanges(false);
                                                                setShowEditClientModal(true);
                                                            }}
                                                            className="p-2 text-textMuted hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {client.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-textMuted">
                                                        <Phone className="w-4 h-4 shrink-0" />
                                                        <span>{client.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            
            {/* Reports Tab */}
            {activeTab === 'reports' && (() => {
                // Use time-filtered invoices for reports
                const reportInvoices = timeFilteredInvoices;
                
                // Calculate analytics
                const totalRevenue = reportInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
                const pendingAmount = reportInvoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
                const overdueAmount = reportInvoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);
                const avgInvoiceValue = reportInvoices.length > 0 ? reportInvoices.reduce((sum, i) => sum + i.amount, 0) / reportInvoices.length : 0;
                
                // Calculate monthly revenue data for chart
                const monthlyData = reportInvoices
                    .filter(i => i.status === 'paid')
                    .reduce((acc: any, invoice) => {
                        const month = new Date(invoice.paidAt || invoice.issueDate).toLocaleString('default', { month: 'short' });
                        if (!acc[month]) acc[month] = 0;
                        acc[month] += invoice.amount;
                        return acc;
                    }, {});

                const chartData = Object.entries(monthlyData).map(([month, revenue]) => ({
                    month,
                    revenue: Number(revenue)
                })).sort((a, b) => {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return months.indexOf(a.month) - months.indexOf(b.month);
                });

                // Status breakdown for pie chart
                const statusData = [
                    { name: 'Paid', value: reportInvoices.filter(i => i.status === 'paid').length, color: '#10B981' },
                    { name: 'Pending', value: reportInvoices.filter(i => i.status === 'pending').length, color: '#F59E0B' },
                    { name: 'Overdue', value: reportInvoices.filter(i => i.status === 'overdue').length, color: '#EF4444' },
                ].filter(item => item.value > 0);

                return (
                    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-[20px] font-medium text-textMain mb-2">Analytics & Reports</h3>
                                <p className="text-textMuted">Detailed insights into your invoicing performance</p>
                            </div>
                            <Button 
                                onClick={handleExportCSV}
                                disabled={exporting}
                                icon={exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            >
                                {exporting ? 'Exporting...' : 'Export CSV'}
                            </Button>
                        </div>


                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="relative bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/20 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none overflow-hidden">
                                <div className="relative z-10">
                                    <div className="text-textMuted text-xs font-bold uppercase tracking-wider mb-2">Total Revenue</div>
                                    <div className="text-[32px] font-medium text-[#10b981]">
                                        {getCurrencySymbol(userProfile?.currency)}{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-xs text-textMuted mt-1">{reportInvoices.filter(i => i.status === 'paid').length} paid invoices</div>
                                </div>
                            </div>
                            <div className="relative bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/20 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none overflow-hidden">
                                <div className="relative z-10">
                                    <div className="text-textMuted text-xs font-bold uppercase tracking-wider mb-2">Pending</div>
                                    <div className="text-[32px] font-medium text-yellow-400">
                                        {getCurrencySymbol(userProfile?.currency)}{pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-xs text-textMuted mt-1">{reportInvoices.filter(i => i.status === 'pending').length} pending</div>
                                </div>
                            </div>
                            <div className="relative bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/20 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none overflow-hidden">
                                <div className="relative z-10">
                                    <div className="text-textMuted text-xs font-bold uppercase tracking-wider mb-2">Overdue</div>
                                    <div className="text-[32px] font-medium text-red-400">
                                        {getCurrencySymbol(userProfile?.currency)}{overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-xs text-textMuted mt-1">{reportInvoices.filter(i => i.status === 'overdue').length} overdue</div>
                                </div>
                            </div>
                            <div className="relative bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/20 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none overflow-hidden">
                                <div className="relative z-10">
                                    <div className="text-textMuted text-xs font-bold uppercase tracking-wider mb-2">Avg Invoice</div>
                                    <div className="text-[32px] font-medium text-textMain">
                                        {getCurrencySymbol(userProfile?.currency)}{avgInvoiceValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-xs text-textMuted mt-1">{reportInvoices.length} total invoices</div>
                                </div>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Revenue Trend */}
                            <div className="relative bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/20 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none overflow-hidden">
                                <div className="relative z-10">
                                    <h4 className="font-bold text-textMain mb-6">Revenue Trend</h4>
                                    {chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={250}>
                                            <LineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                                <XAxis dataKey="month" stroke="var(--text-muted)" />
                                                <YAxis stroke="var(--text-muted)" />
                                                <Tooltip 
                                                    contentStyle={{ 
                                                        backgroundColor: 'var(--surface)', 
                                                        border: '1px solid var(--border)',
                                                        borderRadius: '8px',
                                                        color: 'var(--text-main)'
                                                    }} 
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="revenue" 
                                                    stroke="#10B981" 
                                                    strokeWidth={3}
                                                    dot={{ fill: '#10B981', r: 5 }}
                                                    activeDot={{ r: 8 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center text-textMuted">
                                            No revenue data available
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status Distribution */}
                            <div className="relative bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/20 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none overflow-hidden">
                                <div className="relative z-10">
                                    <h4 className="font-bold text-textMain mb-6">Status Distribution</h4>
                                    {statusData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={250}>
                                            <PieChart>
                                                <Pie
                                                    data={statusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {statusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center text-textMuted">
                                            No invoice data available
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Detailed Breakdown */}
                        <div className="relative bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/20 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none overflow-hidden">
                            <div className="relative z-10">
                                <h4 className="font-bold text-textMain mb-4">Invoice Status Breakdown</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-textMuted">Paid</span>
                                    <span className="font-bold text-emerald-500">{reportInvoices.filter(i => i.status === 'paid').length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-textMuted">Pending</span>
                                    <span className="font-bold text-yellow-500">{reportInvoices.filter(i => i.status === 'pending').length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-textMuted">Overdue</span>
                                    <span className="font-bold text-red-500">{reportInvoices.filter(i => i.status === 'overdue' || i.status === 'ghosted').length}</span>
                                </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-textMuted">Draft</span>
                                        <span className="font-bold text-textMuted">{reportInvoices.filter(i => i.status === 'draft').length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
                <div className="max-w-6xl mx-auto animate-in fade-in duration-500 space-y-8">
                    <div>
                        <h3 className="text-[20px] font-medium text-textMain mb-2">Preferences</h3>
                        <p className="text-textMuted">Customize how s8vr works for you</p>
                    </div>

                    <div className="space-y-4">
                        {/* Currency */}
                        <div className="bg-surface border border-border rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-textMain">Currency</div>
                                        <div className="text-sm text-textMuted">Default currency for invoices</div>
                                    </div>
                                </div>
                                <select
                                    value={currency}
                                    onChange={async (e) => { setCurrency(e.target.value); await handleSaveCurrency(e.target.value); }}
                                    disabled={savingSettings}
                                    className="bg-background border border-border rounded-lg px-4 py-2 text-textMain focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="CAD">CAD (C$)</option>
                                    <option value="AUD">AUD (A$)</option>
                                </select>
                            </div>
                        </div>

                        {/* Invoice Number Format */}
                        <div className="bg-surface border border-border rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-full bg-purple-500/10 text-purple-500">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-textMain">Invoice Number Format</div>
                                        <div className="text-sm text-textMuted">Default format for new invoices</div>
                                    </div>
                                </div>
                                <select
                                    value={invoiceNumberFormat}
                                    onChange={async (e) => { setInvoiceNumberFormat(e.target.value); await handleSaveInvoiceFormat(e.target.value); }}
                                    disabled={savingSettings}
                                    className="bg-background border border-border rounded-lg px-4 py-2 text-textMain focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                                >
                                    <option value="YYMM-seq">YYMM-#### (e.g., 2512-0001)</option>
                                    <option value="YYYY-seq">YYYY-#### (e.g., 2025-0001)</option>
                                    <option value="INV-seq">INV-#### (e.g., INV-0001)</option>
                                </select>
                            </div>
                        </div>

                        {/* Edit Configuration */}
                        <div className="bg-surface border border-border rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
                                        <Settings className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-textMain">Edit Configuration</div>
                                        <div className="text-sm text-textMuted">Update Supabase, Stripe, or Resend credentials</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowConfigModal(true)}
                                    className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-sm font-medium transition-colors border border-emerald-500/20"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>

                        {/* Restart App */}
                        <div className="bg-surface border border-border rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-full bg-amber-500/10 text-amber-500">
                                        <Activity className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-textMain">Restart App</div>
                                        <div className="text-sm text-textMuted">Reload to apply config changes or recover from errors</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-sm font-medium transition-colors border border-amber-500/20"
                                >
                                    Restart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <ProfileTab userProfile={userProfile} onRefresh={onRefresh} />
            )}

         </main>
      </div>

       {/* Add Client Modal */}
       {showAddClientModal && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <div 
                   className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity" 
                   onClick={() => !addingClient && setShowAddClientModal(false)} 
               />
               <div className="bg-surface border border-border rounded-2xl w-full max-w-lg relative z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 shadow-2xl overflow-hidden">
                   {/* Header */}
                   <div className="flex justify-between items-center p-6 border-b border-border">
                       <h3 className="text-[18px] font-medium text-textMain">Add New Client</h3>
                       <button 
                           onClick={() => setShowAddClientModal(false)} 
                           className="p-2 text-textMuted hover:text-textMain hover:bg-surfaceHighlight rounded-lg transition-colors"
                       >
                           <X className="w-5 h-5"/>
                       </button>
                   </div>
                   
                   <div className="p-6 space-y-5">
                       {/* Client Name */}
                       <div className="space-y-2">
                           <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Client / Company Name *</label>
                           <input 
                               type="text" 
                               value={newClient.name}
                               onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                               className="w-full bg-background border border-border rounded-xl p-3 text-textMain focus:border-[#10b981] focus:outline-none transition-colors"
                               placeholder="Acme Corporation"
                           />
                       </div>

                       {/* Email */}
                       <div className="space-y-2">
                           <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Email Address *</label>
                           <input 
                               type="email" 
                               value={newClient.email}
                               onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                               className="w-full bg-background border border-border rounded-xl p-3 text-textMain focus:border-[#10b981] focus:outline-none transition-colors"
                               placeholder="billing@acme.com"
                           />
                       </div>

                       {/* Phone */}
                       <div className="space-y-2">
                           <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Phone Number</label>
                           <input 
                               type="tel" 
                               value={newClient.phone}
                               onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                               className="w-full bg-background border border-border rounded-xl p-3 text-textMain focus:border-[#10b981] focus:outline-none transition-colors"
                               placeholder="+1 (555) 123-4567"
                           />
                       </div>

                       {/* Address */}
                       <div className="space-y-2">
                           <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Address</label>
                           <textarea 
                               value={newClient.address}
                               onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                               className="w-full bg-background border border-border rounded-xl p-3 text-textMain focus:border-[#10b981] focus:outline-none transition-colors resize-none h-20"
                               placeholder="123 Business St, Suite 100&#10;San Francisco, CA 94102"
                           />
                       </div>
                       
                       {/* Actions */}
                       <div className="flex justify-end gap-3 pt-4 border-t border-border">
                           <Button variant="ghost" onClick={() => setShowAddClientModal(false)}>Cancel</Button>
                           <Button 
                               onClick={handleSaveNewClient} 
                               disabled={!newClient.name.trim() || !newClient.email.trim() || addingClient} 
                               icon={addingClient ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4"/>}
                           >
                               {addingClient ? 'Adding...' : 'Add Client'}
                           </Button>
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* Edit Client Modal */}
       <Modal
           isOpen={showEditClientModal}
           onClose={() => {
               if (clientHasChanges) {
                   setConfirmModalConfig({
                       title: 'Unsaved Changes',
                       message: 'You have unsaved changes. Are you sure you want to leave?',
                       onConfirm: () => {
                           setShowEditClientModal(false);
                           setEditingClient(null);
                           setClientHasChanges(false);
                           setOriginalClientData(null);
                       },
                       variant: 'default'
                   });
                   setShowConfirmModal(true);
               } else {
                   setShowEditClientModal(false);
                   setEditingClient(null);
                   setOriginalClientData(null);
               }
           }}
           title={`Edit Client: ${editingClient?.name || ''}`}
           size="lg"
           onBackdropClick={() => {
               if (clientHasChanges) {
                   setConfirmModalConfig({
                       title: 'Unsaved Changes',
                       message: 'You have unsaved changes. Are you sure you want to leave?',
                       onConfirm: () => {
                           setShowEditClientModal(false);
                           setEditingClient(null);
                           setClientHasChanges(false);
                           setOriginalClientData(null);
                       },
                       variant: 'default'
                   });
                   setShowConfirmModal(true);
               } else {
                   setShowEditClientModal(false);
                   setEditingClient(null);
                   setOriginalClientData(null);
               }
           }}
       >
           {editingClient && (
               <div className="space-y-6">
                   {clientHasChanges && (
                       <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2 text-yellow-500 text-sm">
                           <AlertTriangle className="w-4 h-4" />
                           <span>You have unsaved changes</span>
                       </div>
                   )}
                   <div className="space-y-6">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                               <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Client Name</label>
                               <input 
                                   type="text" 
                                   value={editingClient.name || ''} 
                                   onChange={(e) => {
                                       setEditingClient({...editingClient, name: e.target.value});
                                       setClientHasChanges(true);
                                   }} 
                                   className="w-full bg-background border border-border rounded-lg p-3 text-textMain focus:border-emerald-500 focus:outline-none"
                                   placeholder="John Doe"
                               />
                           </div>
                           <div className="space-y-2">
                               <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Company Name</label>
                               <input 
                                   type="text" 
                                   value={editingClient.company || ''} 
                                   onChange={(e) => {
                                       setEditingClient({...editingClient, company: e.target.value});
                                       setClientHasChanges(true);
                                   }} 
                                   className="w-full bg-background border border-border rounded-lg p-3 text-textMain focus:border-emerald-500 focus:outline-none"
                                   placeholder="Acme Corporation"
                               />
                           </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                               <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Email Address</label>
                               <input 
                                   type="email" 
                                   value={editingClient.email || ''} 
                                   onChange={(e) => {
                                       setEditingClient({...editingClient, email: e.target.value});
                                       setClientHasChanges(true);
                                   }} 
                                   className="w-full bg-background border border-border rounded-lg p-3 text-textMain focus:border-emerald-500 focus:outline-none"
                                   placeholder="billing@acme.com"
                               />
                           </div>
                           <div className="space-y-2">
                               <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Phone Number</label>
                               <input 
                                   type="tel" 
                                   value={editingClient.phone || ''} 
                                   onChange={(e) => {
                                       setEditingClient({...editingClient, phone: e.target.value});
                                       setClientHasChanges(true);
                                   }} 
                                   className="w-full bg-background border border-border rounded-lg p-3 text-textMain focus:border-emerald-500 focus:outline-none"
                                   placeholder="+1 (555) 123-4567"
                               />
                           </div>
                       </div>
                       <div className="space-y-2">
                           <label className="text-xs font-bold text-textMuted uppercase tracking-wider">Address</label>
                           <textarea 
                               value={editingClient.address || ''} 
                               onChange={(e) => {
                                   setEditingClient({...editingClient, address: e.target.value});
                                   setClientHasChanges(true);
                               }} 
                               className="w-full bg-background border border-border rounded-lg p-3 text-textMain focus:border-emerald-500 focus:outline-none resize-none h-20"
                               placeholder="123 Business St, Suite 100&#10;San Francisco, CA 94102"
                           />
                       </div>
                   </div>
                   <div className="pt-6 border-t border-border flex justify-between">
                       <Button 
                           variant="danger" 
                           icon={<Trash2 className="w-4 h-4"/>} 
                           onClick={() => {
                               setConfirmModalConfig({
                                   title: 'Delete Client',
                                   message: `Are you sure you want to delete ${editingClient.name}? This action cannot be undone.`,
                                   onConfirm: async () => {
                                       await handleDeleteClient(editingClient.id);
                                       setShowEditClientModal(false);
                                       setEditingClient(null);
                                       setClientHasChanges(false);
                                       setOriginalClientData(null);
                                   },
                                   variant: 'danger'
                               });
                               setShowConfirmModal(true);
                           }}
                       >
                           Delete Client
                       </Button>
                       <Button 
                           onClick={async () => {
                               await handleSaveClient(editingClient);
                               setClientHasChanges(false);
                               setOriginalClientData(null);
                               setShowEditClientModal(false);
                           }}
                       >
                           Save Changes
                       </Button>
                   </div>
               </div>
           )}
       </Modal>

       {/* Confirm Modal */}
       {confirmModalConfig && (
           <ConfirmModal
               isOpen={showConfirmModal}
               onClose={() => setShowConfirmModal(false)}
               onConfirm={confirmModalConfig.onConfirm}
               title={confirmModalConfig.title}
               message={confirmModalConfig.message}
               variant={confirmModalConfig.variant || 'default'}
           />
       )}

       {/* Delete Invoice Confirm Modal */}
       {invoiceToDelete && (
           <ConfirmModal
               isOpen={!!invoiceToDelete}
               onClose={() => setInvoiceToDelete(null)}
               onConfirm={confirmDeleteInvoice}
               title="Delete Invoice"
               message={`Are you sure you want to delete Invoice #${invoiceToDelete.invoiceNumber}? This will also remove any associated reminders. This action cannot be undone.`}
               variant="danger"
           />
       )}


       {/* Custom Date Range Modal */}
       <CustomDateModal 
            isOpen={showCustomDateModal} 
            onClose={() => setShowCustomDateModal(false)} 
            onApply={applyCustomDate}
            range={customDateRange}
       />

       {/* Toast Notifications */}
       {toasts.length > 0 && (
           <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 max-w-md">
               {toasts.map(toast => (
                   <div 
                       key={toast.id}
                       className={`flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-5 duration-300 ${
                           toast.type === 'error' 
                               ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                               : toast.type === 'success'
                               ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                               : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                       }`}
                   >
                       {toast.type === 'error' ? (
                           <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                       ) : toast.type === 'success' ? (
                           <Check className="w-5 h-5 mt-0.5 shrink-0" />
                       ) : (
                           <Bell className="w-5 h-5 mt-0.5 shrink-0" />
                       )}
                       <div className="flex-1 min-w-0">
                           <p className="font-semibold text-sm">{toast.title}</p>
                           <p className="text-sm opacity-80 mt-0.5">{toast.message}</p>
                       </div>
                       <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0">
                           <X className="w-4 h-4" />
                       </button>
                   </div>
               ))}
           </div>
       )}
      {/* Config Modal */}
      {showConfigModal && (
        <ConfigModal
          onClose={() => setShowConfigModal(false)}
          onSaved={() => { showToast('success', 'Saved', 'Configuration updated. Restart the app to apply changes.'); setShowConfigModal(false); }}
        />
      )}
    </div>
  );
};

// ─── Config Modal ─────────────────────────────────────────────────────────────
interface ConfigField { key: string; label: string; secret?: boolean; placeholder?: string; }

const CONFIG_FIELDS: { section: string; fields: ConfigField[]; note?: string }[] = [
  { section: 'Supabase', fields: [
    { key: 'supabaseUrl',        label: 'Project URL',        placeholder: 'https://xxxx.supabase.co' },
    { key: 'supabaseAnonKey',    label: 'Anon Key',           secret: true },
    { key: 'supabaseServiceKey', label: 'Service Role Key',   secret: true },
    { key: 'databaseUrl',        label: 'Database URL',       secret: true, placeholder: 'postgresql://...' },
  ]},
  { section: 'Stripe', fields: [
    { key: 'stripePublishableKey', label: 'Publishable Key',  placeholder: 'pk_live_...' },
    { key: 'stripeSecretKey',      label: 'Secret Key',       secret: true, placeholder: 'sk_live_...' },
    { key: 'stripeWebhookSecret',  label: 'Webhook Secret',   secret: true, placeholder: 'whsec_... (optional)' },
  ], note: 'To send clients automatic payment receipts, enable receipt emails in your Stripe Dashboard → Settings → Emails → Successful payments.' },
  { section: 'Email', fields: [
    { key: 'resendApiKey', label: 'Resend API Key', secret: true, placeholder: 're_...' },
    { key: 'fromEmail',    label: 'From Email',     placeholder: 'invoices@yourdomain.com' },
  ]},
  { section: 'App', fields: [
    { key: 'appUrl',     label: 'App URL',     placeholder: 'http://localhost:3000' },
    { key: 'backendUrl', label: 'Backend URL', placeholder: 'http://localhost:3001' },
  ]},
];

const ConfigModal: React.FC<{ onClose: () => void; onSaved: () => void }> = ({ onClose, onSaved }) => {
  const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [shown, setShown] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [backendOffline, setBackendOffline] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/config`);
        if (!res.ok) throw new Error('backend_offline');
        setValues(await res.json());
      } catch {
        setBackendOffline(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const [confirmSave, setConfirmSave] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setConfirmSave(false);
    try {
      const res = await fetch(`${apiUrl}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-bold text-textMain">Edit Configuration</h2>
            <p className="text-sm text-textMuted mt-0.5">Changes are written to your .env files</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surfaceHighlight text-textMuted hover:text-textMain transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-textMuted">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading current config...
            </div>
          ) : (
            <>
              {backendOffline && (
                <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                  Backend not reachable — current values couldn't be loaded. Enter new values below to overwrite your .env files.
                </div>
              )}
              {CONFIG_FIELDS.map(({ section, fields, note }) => (
                <div key={section}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-textMuted mb-3">{section}</h3>
                  <div className="space-y-3">
                    {fields.map(({ key, label, secret, placeholder }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-textMain mb-1">{label}</label>
                        <div className="relative">
                          <input
                            type={secret && !shown[key] ? 'password' : 'text'}
                            value={values[key] || ''}
                            onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                            placeholder={placeholder || (secret ? '••••••••' : '')}
                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-textMain text-sm focus:outline-none focus:border-emerald-500 pr-10 placeholder:text-textMuted/40"
                          />
                          {secret && (
                            <button
                              type="button"
                              onClick={() => setShown(s => ({ ...s, [key]: !s[key] }))}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain transition-colors"
                            >
                              <Lock className={`w-4 h-4 ${shown[key] ? '' : 'opacity-40'}`} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {note && (
                      <div className="flex items-start gap-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mt-1">
                        <span className="mt-0.5 shrink-0">ℹ</span>
                        <span>{note}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border shrink-0">
          {confirmSave ? (
            <>
              <p className="text-sm text-amber-400 mr-auto">Saving will reload the app — unsaved work will be lost.</p>
              <Button variant="ghost" onClick={() => setConfirmSave(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
                {saving ? 'Saving...' : 'Yes, save & reload'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={() => setConfirmSave(true)} disabled={loading} icon={<Save className="w-4 h-4" />}>
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

