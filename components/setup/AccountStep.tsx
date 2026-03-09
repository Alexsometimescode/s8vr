import React, { useState } from 'react';
import { SetupAccount } from '../../types';
import { User, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, Mail, Lock, Building } from 'lucide-react';

interface AccountStepProps {
  account: SetupAccount;
  onChange: (updates: Partial<SetupAccount>) => void;
  isCreating: boolean;
  onCreateAccount: () => Promise<void>;
  onBack: () => void;
  error: string | null;
}

// Email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const AccountStep: React.FC<AccountStepProps> = ({
  account,
  onChange,
  isCreating,
  onCreateAccount,
  onBack,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const nameValid = account.name.trim().length >= 2;
  const emailValid = isValidEmail(account.email);
  const passwordValid = account.password.length >= 8;

  const isValid = nameValid && emailValid && passwordValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isCreating) {
      onCreateAccount();
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 mb-4">
          <User className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-textMain mb-2">Create Your Account</h2>
        <p className="text-textMuted">
          Set up your owner account to access s8vr
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-textMuted mb-2">
              Your Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
              <input
                type="text"
                value={account.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="John Doe"
                className={`w-full bg-background border rounded-lg pl-10 pr-4 py-3 text-textMain focus:outline-none ${
                  account.name && !nameValid
                    ? 'border-yellow-500 focus:border-yellow-500'
                    : account.name && nameValid
                    ? 'border-emerald-500/50 focus:border-emerald-500'
                    : 'border-border focus:border-emerald-500'
                }`}
              />
            </div>
            {account.name && !nameValid && (
              <p className="text-xs text-yellow-500 mt-1">Name must be at least 2 characters</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-textMuted mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
              <input
                type="email"
                value={account.email}
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder="you@example.com"
                className={`w-full bg-background border rounded-lg pl-10 pr-4 py-3 text-textMain focus:outline-none ${
                  account.email && !emailValid
                    ? 'border-yellow-500 focus:border-yellow-500'
                    : account.email && emailValid
                    ? 'border-emerald-500/50 focus:border-emerald-500'
                    : 'border-border focus:border-emerald-500'
                }`}
              />
            </div>
            {account.email && !emailValid && (
              <p className="text-xs text-yellow-500 mt-1">Please enter a valid email address</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-textMuted mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={account.password}
                onChange={(e) => onChange({ password: e.target.value })}
                placeholder="Minimum 8 characters"
                className={`w-full bg-background border rounded-lg pl-10 pr-10 py-3 text-textMain focus:outline-none ${
                  account.password && !passwordValid
                    ? 'border-yellow-500 focus:border-yellow-500'
                    : account.password && passwordValid
                    ? 'border-emerald-500/50 focus:border-emerald-500'
                    : 'border-border focus:border-emerald-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {account.password && !passwordValid && (
              <p className="text-xs text-yellow-500 mt-1">Password must be at least 8 characters</p>
            )}
          </div>

          {/* Business Name (optional) */}
          <div>
            <label className="block text-sm font-medium text-textMuted mb-2">
              Business Name <span className="text-textMuted/50">(optional)</span>
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
              <input
                type="text"
                value={account.businessName || ''}
                onChange={(e) => onChange({ businessName: e.target.value })}
                placeholder="Your Company Inc."
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-textMain focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <p className="text-xs text-textMuted mt-1">
              This will appear on your invoices
            </p>
          </div>
        </div>
      </form>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={isCreating}
          className="flex items-center gap-2 px-4 py-2 text-textMuted hover:text-textMain transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <button
          onClick={onCreateAccount}
          disabled={!isValid || isCreating}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            isValid && !isCreating
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
              : 'bg-border text-textMuted cursor-not-allowed'
          }`}
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AccountStep;
