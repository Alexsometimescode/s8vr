import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Shared';
import { Save, Upload, Loader2, Calendar, ExternalLink } from 'lucide-react';
import { saveProfile } from '../../src/lib/profile';

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
    if (!editingProfile) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      const avatarUrl = avatarPreview || editingProfile.avatar_url;
      const logoUrl = logoPreview || editingProfile.logo_url;

      saveProfile({
        ...userProfile,
        name: editingProfile.name,
        avatar_url: avatarUrl,
        logo_url: logoUrl,
      });

      if (onRefresh) await onRefresh();

      setAvatarFile(null);
      setLogoFile(null);
      setSaveMessage({ type: 'success', text: 'Profile saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setSaveMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
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
        <p className="text-[14px] text-textMuted">Manage your account information</p>
      </div>

      {/* Main Profile Card */}
      <div className="relative bg-gradient-to-br from-surface/20 to-surface/10 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/20 before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none">
        {/* Avatar & Identity Section */}
        <div className="relative z-10 p-8 border-b border-white/10">
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

            </div>
          </div>
        </div>

        {/* Email Section */}
        <div className="relative z-10 p-8 border-b border-white/10">
          <label className="block text-[12px] font-medium text-textMuted uppercase tracking-wider mb-3">Email Address</label>
          <span className="text-[16px] text-textMain">{editingProfile?.email || 'No email'}</span>
          <p className="text-[12px] text-textMuted mt-1">This email is used as the sender on invoice emails.</p>
        </div>

        {/* Company Logo Section */}
        <div className="relative z-10 p-8 border-b border-white/10">
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
        <div className="relative z-10 p-8 border-b border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Account Created */}
            <div>
              <label className="block text-[12px] font-medium text-textMuted uppercase tracking-wider mb-2">Account Created</label>
              <div className="flex items-center gap-2 text-[14px] text-textMain">
                <Calendar className="w-4 h-4 text-textMuted" />
                {formatDate(editingProfile?.created_at)}
              </div>
            </div>

            {/* Stripe */}
            <div>
              <label className="block text-[12px] font-medium text-textMuted uppercase tracking-wider mb-2">Stripe Payments</label>
              <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium">Configured via STRIPE_SECRET_KEY</span>
              </div>
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-500 hover:underline inline-flex items-center gap-1"
              >
                Open Stripe Dashboard <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="relative z-10 p-8 bg-gradient-to-br from-background/10 to-background/5 backdrop-blur-xl">
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
