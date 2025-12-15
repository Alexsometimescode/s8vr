import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Shared';
import { 
  Users, FileText, DollarSign, TrendingUp, Clock, CheckCircle, 
  AlertCircle, Search, Eye, Mail, Shield, Trash2, Edit2, Key,
  BarChart3, MessageSquare, RefreshCw, Crown, Zap, LayoutTemplate,
  ArrowUpRight, X, Loader2, Bell, Plus, Save, Copy, Send, Ban, 
  Unlock, ExternalLink, Check, ToggleLeft, ToggleRight
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro';
  role: 'user' | 'admin';
  stripe_account_status: string;
  created_at: string;
  is_banned?: boolean;
  ban_reason?: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
  user_email?: string;
}

interface AdminStats {
  totalUsers: number;
  proUsers: number;
  totalInvoices: number;
  totalRevenue: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  connectedStripeAccounts: number;
  recentSignups: number;
}

interface Feedback {
  id: string;
  user_id: string;
  type: string;
  message: string;
  status: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

interface ReminderLog {
  id: string;
  invoice_id: string;
  invoice_number: string;
  client_name: string;
  client_email?: string;
  sent_at: string;
  status: string;
  message?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  is_premium: boolean;
  is_active: boolean;
  preview_url?: string;
  created_at?: string;
}

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'invoices' | 'templates' | 'feedback' | 'reminders'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [activeReminders, setActiveReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingReminders, setProcessingReminders] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showResetPassword, setShowResetPassword] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showBanModal, setShowBanModal] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', is_premium: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'user' | 'invoice' | 'reminder' | 'template'; id: string; name: string } | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, feedbackRes, remindersRes, invoicesRes, templatesRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`),
        fetch(`${API_URL}/api/admin/users`),
        fetch(`${API_URL}/api/admin/feedback`),
        fetch(`${API_URL}/api/admin/reminder-logs`),
        fetch(`${API_URL}/api/admin/invoices`),
        fetch(`${API_URL}/api/admin/templates`),
      ]);

      const [statsData, usersData, feedbackData, remindersData, invoicesData, templatesData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        feedbackRes.json(),
        remindersRes.json(),
        invoicesRes.json(),
        templatesRes.json(),
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (usersData.success) setUsers(usersData.users);
      if (feedbackData.success) setFeedback(feedbackData.feedback);
      if (remindersData.success) {
        setReminderLogs(remindersData.logs);
        setActiveReminders(remindersData.activeReminders || []);
      }
      if (invoicesData.success) setInvoices(invoicesData.invoices);
      if (templatesData.success) setTemplates(templatesData.templates);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReminders = async () => {
    setProcessingReminders(true);
    try {
      await fetch(`${API_URL}/api/reminders/process`, { method: 'POST' });
      const remindersRes = await fetch(`${API_URL}/api/admin/reminder-logs`);
      const remindersData = await remindersRes.json();
      if (remindersData.success) {
        setReminderLogs(remindersData.logs);
        setActiveReminders(remindersData.activeReminders || []);
      }
    } catch (err) {
      console.error('Failed to process reminders:', err);
    } finally {
      setProcessingReminders(false);
    }
  };

  const handleUpdateUserPlan = async (userId: string, newPlan: 'free' | 'pro') => {
    setActionLoading(userId);
    try {
      await fetch(`${API_URL}/api/admin/users/${userId}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      });
      setUsers(users.map(u => u.id === userId ? { ...u, plan: newPlan } : u));
    } catch (err) {
      console.error('Failed to update user plan:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    setActionLoading(userId);
    try {
      await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Failed to update user role:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await fetch(`${API_URL}/api/admin/users/${userId}`, { method: 'DELETE' });
      setUsers(users.filter(u => u.id !== userId));
      setSelectedUser(null);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendPasswordReset = async (userId: string, email: string) => {
    setActionLoading(userId);
    try {
      await fetch(`${API_URL}/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setShowResetPassword(null);
      alert('Password reset email sent!');
    } catch (err) {
      console.error('Failed to send password reset:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateFeedbackStatus = async (feedbackId: string, newStatus: string) => {
    try {
      await fetch(`${API_URL}/api/admin/feedback/${feedbackId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setFeedback(feedback.map(f => f.id === feedbackId ? { ...f, status: newStatus } : f));
    } catch (err) {
      console.error('Failed to update feedback status:', err);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    setActionLoading(invoiceId);
    try {
      await fetch(`${API_URL}/api/admin/invoices/${invoiceId}`, { method: 'DELETE' });
      setInvoices(invoices.filter(i => i.id !== invoiceId));
      setSelectedInvoice(null);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete invoice:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    setActionLoading(invoiceId);
    try {
      await fetch(`${API_URL}/api/admin/invoices/${invoiceId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setInvoices(invoices.map(i => i.id === invoiceId ? { ...i, status: newStatus } : i));
    } catch (err) {
      console.error('Failed to update invoice status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Ban/Unban user
  const handleBanUser = async (userId: string, email: string) => {
    if (!banReason.trim()) {
      alert('Please provide a reason for banning');
      return;
    }
    setActionLoading(userId);
    try {
      await fetch(`${API_URL}/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason: banReason }),
      });
      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: true, ban_reason: banReason } : u));
      setShowBanModal(null);
      setBanReason('');
    } catch (err) {
      console.error('Failed to ban user:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnbanUser = async (userId: string, email: string) => {
    setActionLoading(userId);
    try {
      await fetch(`${API_URL}/api/admin/users/${userId}/unban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: false, ban_reason: undefined } : u));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to unban user:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete reminder log
  const handleDeleteReminder = async (reminderId: string) => {
    setActionLoading(reminderId);
    try {
      await fetch(`${API_URL}/api/admin/reminder-logs/${reminderId}`, { method: 'DELETE' });
      setReminderLogs(reminderLogs.filter(r => r.id !== reminderId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Template CRUD operations
  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      return;
    }
    setActionLoading('new-template');
    try {
      const res = await fetch(`${API_URL}/api/admin/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      });
      const data = await res.json();
      if (data.success && data.template) {
        setTemplates([...templates, data.template]);
        setShowNewTemplate(false);
        setNewTemplate({ name: '', description: '', is_premium: false });
      } else if (!data.success) {
        // Table might not exist - show helpful message
        console.error('Template creation failed:', data.error);
        // Add to local state temporarily
        const tempTemplate: Template = {
          id: `temp-${Date.now()}`,
          name: newTemplate.name,
          description: newTemplate.description,
          is_premium: newTemplate.is_premium,
          is_active: true,
        };
        setTemplates([...templates, tempTemplate]);
        setShowNewTemplate(false);
        setNewTemplate({ name: '', description: '', is_premium: false });
      }
    } catch (err) {
      console.error('Failed to create template:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateTemplate = async (template: Template) => {
    setActionLoading(template.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      const data = await res.json();
      // Update local state regardless of API response
      setTemplates(templates.map(t => t.id === template.id ? template : t));
      setEditingTemplate(null);
    } catch (err) {
      console.error('Failed to update template:', err);
      // Still update local state for UX
      setTemplates(templates.map(t => t.id === template.id ? template : t));
      setEditingTemplate(null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    setActionLoading(templateId);
    try {
      await fetch(`${API_URL}/api/admin/templates/${templateId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete template:', err);
    } finally {
      // Always update local state
      setTemplates(templates.filter(t => t.id !== templateId));
      setDeleteConfirm(null);
      setActionLoading(null);
    }
  };

  const handleToggleTemplatePremium = async (templateId: string, isPremium: boolean) => {
    // Update local state immediately for responsiveness
    setTemplates(templates.map(t => t.id === templateId ? { ...t, is_premium: isPremium } : t));
    try {
      await fetch(`${API_URL}/api/admin/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_premium: isPremium }),
      });
    } catch (err) {
      console.error('Failed to update template:', err);
    }
  };

  const handleToggleTemplateActive = async (templateId: string, isActive: boolean) => {
    // Update local state immediately for responsiveness
    setTemplates(templates.map(t => t.id === templateId ? { ...t, is_active: isActive } : t));
    try {
      await fetch(`${API_URL}/api/admin/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });
    } catch (err) {
      console.error('Failed to update template:', err);
    }
  };

  const handleCopyTemplate = async (template: Template) => {
    const copiedTemplate: Template = {
      id: `temp-${Date.now()}`,
      name: `${template.name} (Copy)`,
      description: template.description,
      is_premium: template.is_premium,
      is_active: true,
    };
    // Add to local state immediately
    setTemplates([...templates, copiedTemplate]);
    
    try {
      const res = await fetch(`${API_URL}/api/admin/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: copiedTemplate.name,
          description: copiedTemplate.description,
          is_premium: copiedTemplate.is_premium,
        }),
      });
      const data = await res.json();
      if (data.success && data.template) {
        // Replace temp with real template
        setTemplates(prev => prev.map(t => t.id === copiedTemplate.id ? data.template : t));
      }
    } catch (err) {
      console.error('Failed to copy template:', err);
    }
  };

  const filteredUsers = users.filter(u => 
    !searchQuery || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInvoices = invoices.filter(i => 
    !searchQuery || 
    i.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.client_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusData = stats ? [
    { name: 'Paid', value: stats.paidInvoices, color: '#10B981' },
    { name: 'Pending', value: stats.pendingInvoices, color: '#F59E0B' },
    { name: 'Overdue', value: stats.overdueInvoices, color: '#EF4444' },
  ] : [];

  const planData = stats ? [
    { name: 'Free', value: stats.totalUsers - stats.proUsers, color: '#6B7280' },
    { name: 'Pro', value: stats.proUsers, color: '#10B981' },
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-textMuted">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-textMain">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-textMuted hover:text-textMain transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-xs text-textMuted">Platform Management</p>
              </div>
            </div>
          </div>
          <Button onClick={loadAdminData} variant="outline" size="sm" icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-border bg-surface/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
              { id: 'invoices', label: 'Invoices', icon: <FileText className="w-4 h-4" /> },
              { id: 'templates', label: 'Templates', icon: <LayoutTemplate className="w-4 h-4" /> },
              { id: 'feedback', label: 'Feedback', icon: <MessageSquare className="w-4 h-4" /> },
              { id: 'reminders', label: 'Reminders', icon: <Bell className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSearchQuery(''); }}
                className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-emerald-500 text-emerald-500' 
                    : 'border-transparent text-textMuted hover:text-textMain'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="text-xs text-emerald-500 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" /> +{stats.recentSignups} this week
                  </span>
                </div>
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
                <div className="text-sm text-textMuted">Total Users</div>
              </div>

              <div className="bg-surface border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Crown className="w-5 h-5 text-emerald-500" />
                  </div>
                  <span className="text-xs text-textMuted">
                    {stats.totalUsers > 0 ? Math.round((stats.proUsers / stats.totalUsers) * 100) : 0}% conversion
                  </span>
                </div>
                <div className="text-3xl font-bold">{stats.proUsers}</div>
                <div className="text-sm text-textMuted">Pro Users</div>
              </div>

              <div className="bg-surface border border-border rounded-2xl p-6">
                <div className="p-2 rounded-lg bg-purple-500/10 w-fit mb-4">
                  <FileText className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-3xl font-bold">{stats.totalInvoices}</div>
                <div className="text-sm text-textMuted">Total Invoices</div>
              </div>

              <div className="bg-surface border border-border rounded-2xl p-6">
                <div className="p-2 rounded-lg bg-green-500/10 w-fit mb-4">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-3xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-textMuted">Total Revenue Processed</div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-surface border border-border rounded-2xl p-6">
                <h3 className="font-bold mb-6 text-textMain">Invoice Status Distribution</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie 
                      data={statusData} 
                      cx="50%" 
                      cy="45%" 
                      innerRadius={50} 
                      outerRadius={90} 
                      paddingAngle={3} 
                      dataKey="value"
                      labelLine={false}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        border: '1px solid #3f3f46', 
                        borderRadius: '12px', 
                        color: '#fafafa',
                        padding: '12px 16px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                      }} 
                      formatter={(value: number, name: string) => [
                        <span style={{ color: '#fafafa', fontWeight: 600 }}>{value}</span>,
                        <span style={{ color: '#a1a1aa' }}>{name}</span>
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-8 mt-2">
                  {statusData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-textMain font-medium">{item.value}</span>
                      <span className="text-sm text-textMuted">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface border border-border rounded-2xl p-6">
                <h3 className="font-bold mb-6 text-textMain">User Plan Distribution</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie 
                      data={planData} 
                      cx="50%" 
                      cy="45%" 
                      innerRadius={50} 
                      outerRadius={90} 
                      paddingAngle={3} 
                      dataKey="value"
                      labelLine={false}
                    >
                      {planData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        border: '1px solid #3f3f46', 
                        borderRadius: '12px', 
                        color: '#fafafa',
                        padding: '12px 16px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                      }} 
                      formatter={(value: number, name: string) => [
                        <span style={{ color: '#fafafa', fontWeight: 600 }}>{value}</span>,
                        <span style={{ color: '#a1a1aa' }}>{name}</span>
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-8 mt-2">
                  {planData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-textMain font-medium">{item.value}</span>
                      <span className="text-sm text-textMuted">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surfaceHighlight border border-border rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-500">{stats.paidInvoices}</div>
                <div className="text-xs text-textMuted">Paid Invoices</div>
              </div>
              <div className="bg-surfaceHighlight border border-border rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-500">{stats.pendingInvoices}</div>
                <div className="text-xs text-textMuted">Pending</div>
              </div>
              <div className="bg-surfaceHighlight border border-border rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{stats.overdueInvoices}</div>
                <div className="text-xs text-textMuted">Overdue</div>
              </div>
              <div className="bg-surfaceHighlight border border-border rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">{stats.connectedStripeAccounts}</div>
                <div className="text-xs text-textMuted">Stripe Connected</div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users by email or name..."
                  className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-surfaceHighlight border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-bold text-textMuted uppercase tracking-wider">User</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-textMuted uppercase tracking-wider">Plan</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-textMuted uppercase tracking-wider">Role</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-textMuted uppercase tracking-wider">Stripe</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-textMuted uppercase tracking-wider">Joined</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-textMuted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-surfaceHighlight/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            user.is_banned 
                              ? 'bg-red-500/10 text-red-500' 
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {user.name || 'No name'}
                              {user.is_banned && (
                                <span className="px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-500 border border-red-500/20">
                                  BANNED
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-textMuted">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.plan}
                          onChange={(e) => handleUpdateUserPlan(user.id, e.target.value as 'free' | 'pro')}
                          disabled={actionLoading === user.id}
                          className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer border ${
                            user.plan === 'pro' 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                              : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                          }`}
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateUserRole(user.id, e.target.value as 'user' | 'admin')}
                          disabled={actionLoading === user.id}
                          className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer border ${
                            user.role === 'admin' 
                              ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' 
                              : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                          }`}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.stripe_account_status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {user.stripe_account_status || 'Not connected'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-textMuted">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-2 hover:bg-surfaceHighlight rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-textMuted" />
                          </button>
                          <button
                            onClick={() => setShowResetPassword(user.id)}
                            className="p-2 hover:bg-surfaceHighlight rounded-lg transition-colors"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4 text-textMuted" />
                          </button>
                          {user.is_banned ? (
                            <button
                              onClick={() => handleUnbanUser(user.id, user.email)}
                              disabled={actionLoading === user.id}
                              className="p-2 hover:bg-emerald-500/10 rounded-lg transition-colors"
                              title="Unban User"
                            >
                              <Unlock className="w-4 h-4 text-emerald-500" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowBanModal(user.id)}
                              disabled={actionLoading === user.id}
                              className="p-2 hover:bg-orange-500/10 rounded-lg transition-colors"
                              title="Ban User"
                            >
                              <Ban className="w-4 h-4 text-orange-500" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteConfirm({ type: 'user', id: user.id, name: user.email })}
                            disabled={actionLoading === user.id}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 text-textMuted mx-auto mb-4 opacity-20" />
                  <p className="text-textMuted">No users found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search invoices by number, client..."
                  className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-surfaceHighlight border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-bold text-textMuted uppercase tracking-wider">Invoice</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-textMuted uppercase tracking-wider">Client</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-textMuted uppercase tracking-wider">Amount</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-textMuted uppercase tracking-wider">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-textMuted uppercase tracking-wider">Due Date</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-textMuted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredInvoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-surfaceHighlight/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium">#{invoice.invoice_number}</div>
                        <div className="text-xs text-textMuted">{invoice.user_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{invoice.client_name}</div>
                        <div className="text-xs text-textMuted">{invoice.client_email}</div>
                      </td>
                      <td className="px-6 py-4 font-bold">${Number(invoice.amount).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <select
                          value={invoice.status}
                          onChange={(e) => handleUpdateInvoiceStatus(invoice.id, e.target.value)}
                          disabled={actionLoading === invoice.id}
                          className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer border ${
                            invoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            invoice.status === 'pending' || invoice.status === 'sent' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                            'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}
                        >
                          <option value="draft">Draft</option>
                          <option value="pending">Pending</option>
                          <option value="sent">Sent</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-textMuted">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedInvoice(invoice)}
                            className="p-2 hover:bg-surfaceHighlight rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-textMuted" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'invoice', id: invoice.id, name: `#${invoice.invoice_number}` })}
                            disabled={actionLoading === invoice.id}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredInvoices.length === 0 && (
                <div className="p-12 text-center">
                  <FileText className="w-12 h-12 text-textMuted mx-auto mb-4 opacity-20" />
                  <p className="text-textMuted">No invoices found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Invoice Templates ({templates.length})</h2>
                <p className="text-sm text-textMuted">Manage available invoice templates - mark as Free or Premium</p>
              </div>
              <Button onClick={() => setShowNewTemplate(true)} icon={<Plus className="w-4 h-4" />}>Add Template</Button>
            </div>

            {/* Template Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surfaceHighlight border border-border rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-textMain">{templates.length}</div>
                <div className="text-xs text-textMuted">Total Templates</div>
              </div>
              <div className="bg-surfaceHighlight border border-border rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-zinc-400">{templates.filter(t => !t.is_premium).length}</div>
                <div className="text-xs text-textMuted">Free Templates</div>
              </div>
              <div className="bg-surfaceHighlight border border-border rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-500">{templates.filter(t => t.is_premium).length}</div>
                <div className="text-xs text-textMuted">Premium Templates</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <div key={template.id} className={`bg-surface border rounded-xl p-6 transition-all ${
                  !template.is_active ? 'opacity-50 border-border' : 'border-border hover:border-emerald-500/30'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold">{template.name}</h3>
                      <p className="text-sm text-textMuted mt-1">{template.description}</p>
                    </div>
                    <button
                      onClick={() => handleToggleTemplatePremium(template.id, !template.is_premium)}
                      disabled={actionLoading === template.id}
                      className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer border transition-colors ${
                        template.is_premium 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' 
                          : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20'
                      }`}
                      title={template.is_premium ? 'Click to make Free' : 'Click to make Premium'}
                    >
                      {template.is_premium ? 'PRO' : 'FREE'}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                    <button 
                      onClick={() => setEditingTemplate(template)}
                      className="p-2 hover:bg-surfaceHighlight rounded-lg transition-colors" 
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-textMuted" />
                    </button>
                    <button 
                      onClick={() => handleCopyTemplate(template)}
                      disabled={actionLoading === template.id}
                      className="p-2 hover:bg-surfaceHighlight rounded-lg transition-colors" 
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4 text-textMuted" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm({ type: 'template', id: template.id, name: template.name })}
                      disabled={actionLoading === template.id}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors" 
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => handleToggleTemplateActive(template.id, !template.is_active)}
                      disabled={actionLoading === template.id}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                        template.is_active 
                          ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' 
                          : 'bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20'
                      }`}
                      title={template.is_active ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {template.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      {template.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {templates.length === 0 && (
              <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                <LayoutTemplate className="w-12 h-12 text-textMuted mx-auto mb-4 opacity-20" />
                <p className="text-textMuted">No templates found. Add your first template!</p>
              </div>
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-lg font-bold">User Feedback ({feedback.length})</h2>

            <div className="space-y-4">
              {feedback.length === 0 ? (
                <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-textMuted mx-auto mb-4 opacity-20" />
                  <p className="text-textMuted">No feedback submitted yet.</p>
                </div>
              ) : (
                feedback.map(item => (
                  <div key={item.id} className="bg-surface border border-border rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          item.type === 'bug' ? 'bg-red-500/10 text-red-500' :
                          item.type === 'feature' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                          {item.type}
                        </span>
                        <span className="text-sm text-textMuted">{item.user_email || 'Anonymous'}</span>
                        <span className="text-xs text-textMuted">{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateFeedbackStatus(item.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border appearance-none bg-surface ${
                          item.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          item.status === 'reviewed' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                          'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                        }`}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px', paddingRight: '28px' }}
                      >
                        <option value="pending" className="bg-zinc-900 text-zinc-300">Pending</option>
                        <option value="reviewed" className="bg-zinc-900 text-yellow-400">Reviewed</option>
                        <option value="resolved" className="bg-zinc-900 text-emerald-400">Resolved</option>
                      </select>
                    </div>
                    <p className="text-textMain">{item.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Reminders Tab */}
        {activeTab === 'reminders' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Automated Reminders</h2>
                <p className="text-sm text-textMuted">Manage and monitor invoice reminder automation</p>
              </div>
              <Button
                onClick={handleProcessReminders}
                disabled={processingReminders}
                icon={processingReminders ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              >
                {processingReminders ? 'Processing...' : 'Process Reminders Now'}
              </Button>
            </div>

            <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/20">
                  <Bell className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Reminder System Active</h3>
                  <p className="text-sm text-textMuted">
                    {activeReminders.length} active reminder configurations across all users
                  </p>
                </div>
              </div>
            </div>

            {/* Active Reminder Configurations */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-bold">Active Reminder Configurations ({activeReminders.length})</h3>
                <p className="text-xs text-textMuted mt-1">Invoices with reminders enabled by users</p>
              </div>
              {activeReminders.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-12 h-12 text-textMuted mx-auto mb-4 opacity-20" />
                  <p className="text-textMuted">No active reminder configurations.</p>
                  <p className="text-xs text-textMuted mt-2">Users can enable reminders on their invoices</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {activeReminders.map(reminder => (
                    <div key={reminder.id} className="px-6 py-4 hover:bg-surfaceHighlight/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <Bell className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium">Invoice #{reminder.invoice_number}</div>
                            <div className="text-sm text-textMuted">{reminder.client_name} • {reminder.client_email}</div>
                            <div className="text-xs text-textMuted mt-1">
                              By: {reminder.user_name} ({reminder.user_email})
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400">
                              {reminder.reminder_frequency}
                            </span>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-500/10 text-purple-400">
                              {reminder.reminder_tone}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              reminder.status === 'overdue' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              {reminder.status}
                            </span>
                          </div>
                          <div className="text-xs text-textMuted">
                            ${reminder.amount?.toLocaleString()} • Due: {reminder.due_date ? new Date(reminder.due_date).toLocaleDateString() : 'N/A'}
                          </div>
                          <div className="text-xs text-textMuted">
                            {reminder.reminder_count} sent • Last: {reminder.last_reminder_sent ? new Date(reminder.last_reminder_sent).toLocaleDateString() : 'Never'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                <h3 className="font-bold">Sent Reminder History ({reminderLogs.length})</h3>
                <span className="text-xs text-textMuted">Delete reminders in case of violations</span>
              </div>
              {reminderLogs.length === 0 ? (
                <div className="p-12 text-center">
                  <Clock className="w-12 h-12 text-textMuted mx-auto mb-4 opacity-20" />
                  <p className="text-textMuted">No reminders sent yet.</p>
                  <p className="text-xs text-textMuted mt-2">Click "Process Reminders Now" to send pending reminders</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {reminderLogs.map(log => (
                    <div key={log.id} className="px-6 py-4 flex items-center justify-between hover:bg-surfaceHighlight/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          log.status === 'sent' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium">Invoice #{log.invoice_number}</div>
                          <div className="text-sm text-textMuted">{log.client_name}</div>
                          {log.message && (
                            <div className="text-xs text-textMuted mt-1 max-w-md truncate">{log.message}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            log.status === 'sent' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {log.status}
                          </span>
                          <div className="text-xs text-textMuted mt-1">{new Date(log.sent_at).toLocaleString()}</div>
                        </div>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'reminder', id: log.id, name: `Invoice #${log.invoice_number}` })}
                          disabled={actionLoading === log.id}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Reminder Log"
                        >
                          {actionLoading === log.id ? (
                            <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="relative bg-surface border border-border rounded-2xl p-6 max-w-lg w-full animate-in zoom-in-95">
            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-textMuted hover:text-textMain">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold mb-4">User Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-2xl font-bold">
                  {selectedUser.name?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-lg">{selectedUser.name || 'No name'}</div>
                  <div className="text-textMuted">{selectedUser.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surfaceHighlight rounded-lg p-3">
                  <div className="text-xs text-textMuted mb-1">Plan</div>
                  <div className="font-medium capitalize">{selectedUser.plan}</div>
                </div>
                <div className="bg-surfaceHighlight rounded-lg p-3">
                  <div className="text-xs text-textMuted mb-1">Role</div>
                  <div className="font-medium capitalize">{selectedUser.role}</div>
                </div>
                <div className="bg-surfaceHighlight rounded-lg p-3">
                  <div className="text-xs text-textMuted mb-1">Stripe Status</div>
                  <div className="font-medium capitalize">{selectedUser.stripe_account_status || 'Not connected'}</div>
                </div>
                <div className="bg-surfaceHighlight rounded-lg p-3">
                  <div className="text-xs text-textMuted mb-1">Joined</div>
                  <div className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button variant="outline" size="sm" icon={<Key className="w-4 h-4" />} onClick={() => setShowResetPassword(selectedUser.id)}>
                  Reset Password
                </Button>
                <Button variant="outline" size="sm" icon={<Trash2 className="w-4 h-4" />} className="text-red-500 hover:bg-red-500/10" onClick={() => { setSelectedUser(null); setDeleteConfirm({ type: 'user', id: selectedUser.id, name: selectedUser.email }); }}>
                  Delete User
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedInvoice(null)} />
          <div className="relative bg-surface border border-border rounded-2xl p-6 max-w-lg w-full animate-in zoom-in-95">
            <button onClick={() => setSelectedInvoice(null)} className="absolute top-4 right-4 text-textMuted hover:text-textMain">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold mb-4">Invoice #{selectedInvoice.invoice_number}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surfaceHighlight rounded-lg p-3">
                  <div className="text-xs text-textMuted mb-1">Client</div>
                  <div className="font-medium">{selectedInvoice.client_name}</div>
                  <div className="text-xs text-textMuted">{selectedInvoice.client_email}</div>
                </div>
                <div className="bg-surfaceHighlight rounded-lg p-3">
                  <div className="text-xs text-textMuted mb-1">Amount</div>
                  <div className="font-bold text-xl">${Number(selectedInvoice.amount).toLocaleString()}</div>
                </div>
                <div className="bg-surfaceHighlight rounded-lg p-3">
                  <div className="text-xs text-textMuted mb-1">Status</div>
                  <div className={`font-medium capitalize ${
                    selectedInvoice.status === 'paid' ? 'text-emerald-500' :
                    selectedInvoice.status === 'overdue' ? 'text-red-500' : 'text-yellow-500'
                  }`}>{selectedInvoice.status}</div>
                </div>
                <div className="bg-surfaceHighlight rounded-lg p-3">
                  <div className="text-xs text-textMuted mb-1">Due Date</div>
                  <div className="font-medium">{new Date(selectedInvoice.due_date).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowResetPassword(null)} />
          <div className="relative bg-surface border border-border rounded-2xl p-6 max-w-md w-full animate-in zoom-in-95">
            <button onClick={() => setShowResetPassword(null)} className="absolute top-4 right-4 text-textMuted hover:text-textMain">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold mb-4">Reset Password</h3>
            <p className="text-textMuted mb-4">
              Send a password reset email to {users.find(u => u.id === showResetPassword)?.email}?
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowResetPassword(null)}>Cancel</Button>
              <Button 
                onClick={() => {
                  const user = users.find(u => u.id === showResetPassword);
                  if (user) handleSendPasswordReset(user.id, user.email);
                }}
                disabled={actionLoading === showResetPassword}
                icon={actionLoading === showResetPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              >
                Send Reset Email
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowBanModal(null); setBanReason(''); }} />
          <div className="relative bg-surface border border-border rounded-2xl p-6 max-w-md w-full animate-in zoom-in-95">
            <button onClick={() => { setShowBanModal(null); setBanReason(''); }} className="absolute top-4 right-4 text-textMuted hover:text-textMain">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Ban className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold">Ban User</h3>
            </div>
            <p className="text-textMuted mb-4">
              Ban <strong>{users.find(u => u.id === showBanModal)?.email}</strong>? 
              This will prevent them from using the platform and block re-registration with this email.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Ban Reason (required)</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter the reason for banning this user..."
                className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500 min-h-[80px]"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowBanModal(null); setBanReason(''); }}>Cancel</Button>
              <Button 
                onClick={() => {
                  const user = users.find(u => u.id === showBanModal);
                  if (user) handleBanUser(user.id, user.email);
                }}
                disabled={actionLoading === showBanModal || !banReason.trim()}
                className="!bg-orange-500 hover:!bg-orange-600"
                icon={actionLoading === showBanModal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              >
                Ban User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New Template Modal */}
      {showNewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowNewTemplate(false); setNewTemplate({ name: '', description: '', is_premium: false }); }} />
          <div className="relative bg-surface border border-border rounded-2xl p-6 max-w-md w-full animate-in zoom-in-95">
            <button onClick={() => { setShowNewTemplate(false); setNewTemplate({ name: '', description: '', is_premium: false }); }} className="absolute top-4 right-4 text-textMuted hover:text-textMain">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Plus className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold">Add New Template</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Template Name *</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Executive"
                  className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Brief description of the template style..."
                  className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 min-h-[80px]"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Premium Template</label>
                <button
                  type="button"
                  onClick={() => setNewTemplate({ ...newTemplate, is_premium: !newTemplate.is_premium })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    newTemplate.is_premium ? 'bg-emerald-500' : 'bg-zinc-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    newTemplate.is_premium ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => { setShowNewTemplate(false); setNewTemplate({ name: '', description: '', is_premium: false }); }}>Cancel</Button>
              <Button 
                onClick={handleCreateTemplate}
                disabled={actionLoading === 'new-template' || !newTemplate.name.trim()}
                icon={actionLoading === 'new-template' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              >
                Create Template
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingTemplate(null)} />
          <div className="relative bg-surface border border-border rounded-2xl p-6 max-w-md w-full animate-in zoom-in-95">
            <button onClick={() => setEditingTemplate(null)} className="absolute top-4 right-4 text-textMuted hover:text-textMain">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Edit2 className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold">Edit Template</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Template Name *</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={editingTemplate.description || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 min-h-[80px]"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Premium Template</label>
                <button
                  type="button"
                  onClick={() => setEditingTemplate({ ...editingTemplate, is_premium: !editingTemplate.is_premium })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editingTemplate.is_premium ? 'bg-emerald-500' : 'bg-zinc-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    editingTemplate.is_premium ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Active</label>
                <button
                  type="button"
                  onClick={() => setEditingTemplate({ ...editingTemplate, is_active: !editingTemplate.is_active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editingTemplate.is_active ? 'bg-emerald-500' : 'bg-zinc-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    editingTemplate.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
              <Button 
                onClick={() => handleUpdateTemplate(editingTemplate)}
                disabled={actionLoading === editingTemplate.id || !editingTemplate.name.trim()}
                icon={actionLoading === editingTemplate.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-surface border border-border rounded-2xl p-6 max-w-md w-full animate-in zoom-in-95">
            <button onClick={() => setDeleteConfirm(null)} className="absolute top-4 right-4 text-textMuted hover:text-textMain">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-red-500/10">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Confirm Delete</h3>
                <p className="text-sm text-textMuted">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-textMain mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-red-400">{deleteConfirm.name}</span>?
              {deleteConfirm.type === 'user' && ' All associated data will also be removed.'}
              {deleteConfirm.type === 'invoice' && ' This will permanently remove the invoice and its items.'}
              {deleteConfirm.type === 'reminder' && ' This will remove the reminder log from history.'}
              {deleteConfirm.type === 'template' && ' Users will no longer be able to use this template.'}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (deleteConfirm.type === 'user') handleDeleteUser(deleteConfirm.id);
                  if (deleteConfirm.type === 'invoice') handleDeleteInvoice(deleteConfirm.id);
                  if (deleteConfirm.type === 'reminder') handleDeleteReminder(deleteConfirm.id);
                  if (deleteConfirm.type === 'template') handleDeleteTemplate(deleteConfirm.id);
                }}
                disabled={actionLoading === deleteConfirm.id}
                className="flex-1 !bg-red-500 hover:!bg-red-600"
                icon={actionLoading === deleteConfirm.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
