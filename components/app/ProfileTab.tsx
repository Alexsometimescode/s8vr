import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Shared';
import { Save, User, Upload, Check, CreditCard, Loader2, Mail, Edit2, Send, X, Calendar } from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { StripeConnect } from './StripeConnect';

interface ProfileTabProps {
  userProfile: any;
  onRefresh?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ userProfile, onRefresh }) => {
  const [editingProfile, setEditingProfile] = useState<any>(userProfile || {});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // File input refs
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  
  // Email change state
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailSending, setEmailSending] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setEditingProfile(userProfile);
      setAvatarPreview(userProfile.avatar_url || null);
      setLogoPreview(userProfile.logo_url || null);
    }
  }, [userProfile]);

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

  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveProfile = async () => {
    if (!userProfile?.id || !editingProfile) return;
    
    setSaving(true);
    setSaveMessage(null);
    
    try {
      // Use base64 previews directly (simpler than storage buckets for MVP)
      let avatarUrl = avatarPreview || editingProfile.avatar_url;
      let logoUrl = logoPreview || editingProfile.logo_url;

      // Upsert profile in database (insert if not exists, update if exists)
      const { error } = await supabase
        .from('users')
        .upsert({
          id: userProfile.id,
          email: userProfile.email,
          name: editingProfile.name,
          avatar_url: avatarUrl,
          logo_url: logoUrl,
          plan: editingProfile.plan || 'free',
          role: editingProfile.role || 'user',
          created_at: userProfile.created_at || new Date().toISOString(),
        }, { 
          onConflict: 'id'
        });

      if (error) {
        console.error('Profile save error:', error);
        setSaveMessage({ type: 'error', text: 'Failed to save: ' + error.message });
        return;
      }

      // Refresh profile
      if (onRefresh) {
        await onRefresh();
      }
      
      setAvatarFile(null);
      setLogoFile(null);
      setSaveMessage({ type: 'success', text: 'Profile saved successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setSaveMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSendVerification = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      setEmailMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }
    
    setEmailSending(true);
    setEmailMessage(null);
    
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });
      
      if (error) {
        // Handle specific error cases
        if (error.message.includes('invalid')) {
          setEmailMessage({ 
            type: 'error', 
            text: 'Email change requires a verified account. Please verify your current email first in Supabase dashboard.' 
          });
        } else if (error.message.includes('rate limit')) {
          setEmailMessage({ type: 'error', text: 'Too many requests. Please try again later.' });
        } else {
          setEmailMessage({ type: 'error', text: error.message });
        }
        return;
      }
      
      setEmailMessage({ type: 'success', text: 'Verification email sent to ' + newEmail + '!' });
      setTimeout(() => {
        setEditingEmail(false);
        setNewEmail('');
        setEmailMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error updating email:', error);
      setEmailMessage({ type: 'error', text: error.message || 'Failed to update email' });
    } finally {
      setEmailSending(false);
    }
  };

  const handleConnectStripe = async () => {
    // Legacy function replaced by StripeConnect component
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!editingProfile) {
    return (
      <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-textMuted" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-[20px] font-medium text-textMain mb-1">Profile</h3>
        <p className="text-[14px] text-textMuted">Manage your account information</p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {/* Avatar & Identity Section */}
        <div className="p-8 border-b border-border">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              {/* Hidden file input */}
              <input 
                ref={avatarInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                className="hidden" 
              />
              {avatarPreview || editingProfile?.avatar_url ? (
                <img
                  src={avatarPreview || editingProfile.avatar_url}
                  alt="Avatar"
                  className="w-24 h-24 rounded-2xl object-cover border border-border"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-surfaceHighlight text-textMuted flex items-center justify-center font-medium text-3xl border border-border">
                  {editingProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <button 
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center cursor-pointer transition-opacity"
              >
                <Upload className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Identity */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-textMuted uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  value={editingProfile?.name || ''}
                  onChange={(e) => setEditingProfile({...editingProfile, name: e.target.value})}
                  className="w-full max-w-md bg-background border border-border rounded-xl px-4 py-3 text-[14px] text-textMain placeholder:text-textMuted focus:border-[#10b981] focus:outline-none transition-colors"
                  placeholder="Your name"
                />
              </div>

              {/* Plan Badge */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-lg text-[12px] font-medium capitalize ${
                  editingProfile?.plan === 'pro' 
                    ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20' 
                    : 'bg-surfaceHighlight text-textMuted border border-border'
                }`}>
                  {editingProfile?.plan || 'free'} Plan
                </span>
                {editingProfile?.role === 'admin' && (
                  <span className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Email Section */}
        <div className="p-8 border-b border-border">
          <label className="block text-[12px] font-medium text-textMuted uppercase tracking-wider mb-3">Email Address</label>
          
          {editingEmail ? (
            <div className="flex items-center gap-3 max-w-md">
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-3 text-[14px] text-textMain placeholder:text-textMuted focus:border-[#10b981] focus:outline-none transition-colors"
                  placeholder="New email address"
                  autoFocus
                />
              </div>
              <Button 
                onClick={handleSendVerification}
                disabled={emailSending || !newEmail}
                size="sm"
                icon={emailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              >
                {emailSending ? 'Sending...' : 'Verify'}
              </Button>
              <button 
                onClick={() => { setEditingEmail(false); setNewEmail(''); }}
                className="p-2 text-textMuted hover:text-textMain transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-[16px] text-textMain">{editingProfile?.email || 'No email'}</span>
              <button
                onClick={() => setEditingEmail(true)}
                className="p-2 text-textMuted hover:text-[#10b981] hover:bg-[#10b981]/10 rounded-lg transition-colors"
                title="Change email"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
          {editingEmail && (
            <div className="mt-2">
              {emailMessage ? (
                <p className={`text-[12px] font-medium ${emailMessage.type === 'success' ? 'text-[#10b981]' : 'text-red-400'}`}>
                  {emailMessage.text}
                </p>
              ) : (
                <p className="text-[12px] text-textMuted">A verification link will be sent to your new email address.</p>
              )}
            </div>
          )}
        </div>

        {/* Company Logo Section */}
        <div className="p-8 border-b border-border">
          <label className="block text-[12px] font-medium text-textMuted uppercase tracking-wider mb-3">Company Logo</label>
          {/* Hidden file input */}
          <input 
            ref={logoInputRef}
            type="file" 
            accept="image/*" 
            onChange={handleLogoChange} 
            className="hidden" 
          />
          <div className="flex items-center gap-4">
            {logoPreview || editingProfile?.logo_url ? (
              <div className="relative group">
                <img src={logoPreview || editingProfile.logo_url} alt="Logo" className="h-14 max-w-[200px] object-contain rounded-lg border border-border p-2 bg-background" />
                <button 
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center cursor-pointer transition-opacity"
                >
                  <Upload className="w-5 h-5 text-white" />
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="h-14 px-6 bg-background border border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-textMuted text-[14px] cursor-pointer hover:border-textMuted hover:text-textMain transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Logo
              </button>
            )}
          </div>
          <p className="text-[12px] text-textMuted mt-2">This logo will appear on your invoices and email notifications.</p>
          <p className="text-[11px] text-textMuted/70 mt-1">Note: For email display, use a hosted image URL (e.g., from your website).</p>
        </div>

        {/* Account Info Section */}
        <div className="p-8 border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Account Created */}
            <div>
              <label className="block text-[12px] font-medium text-textMuted uppercase tracking-wider mb-2">Account Created</label>
              <div className="flex items-center gap-2 text-[14px] text-textMain">
                <Calendar className="w-4 h-4 text-textMuted" />
                {formatDate(editingProfile?.created_at)}
              </div>
            </div>

            {/* Stripe Connection */}
            <div>
              <label className="block text-[12px] font-medium text-textMuted uppercase tracking-wider mb-2">Stripe Account</label>
              <StripeConnect 
                userId={userProfile.id} 
                userEmail={userProfile.email}
                onConnected={() => {
                   // Refresh profile to show connected status if needed, though component handles its own state
                   if (onRefresh) onRefresh();
                }} 
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="p-8 bg-background/50">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {saveMessage ? (
                <p className={`text-[14px] font-medium ${saveMessage.type === 'success' ? 'text-[#10b981]' : 'text-red-400'}`}>
                  {saveMessage.text}
                </p>
              ) : (
                <p className="text-[12px] text-textMuted">Changes are saved to your account.</p>
              )}
            </div>
            <Button 
              onClick={handleSaveProfile}
              disabled={saving}
              icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
