import React, { useState } from 'react';
import { signUp } from '../../src/lib/auth';
import { Button, Logo } from '../ui/Shared';
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

interface SignUpProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signUp({ name, email, password });
      
      // Check if email confirmation is required
      if (result.user && !result.session) {
        // Email confirmation required
        setSuccess(true);
      } else {
        // Auto-confirmed (or confirmation disabled)
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo className="text-3xl mb-4" />
          <h1 className="text-2xl font-bold text-textMain mb-2">Create account</h1>
          <p className="text-textMuted">Start invoicing in minutes</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold text-textMain mb-2">Check your email</h2>
              <p className="text-textMuted mb-6">
                We've sent a verification link to <span className="text-textMain font-medium">{email}</span>
              </p>
              <p className="text-sm text-textMuted mb-6">
                Click the link in your email to verify your account and get started.
              </p>
              <Button onClick={onSwitchToLogin} className="w-full">
                Back to Sign In
              </Button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-textMuted mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-textMain focus:border-emerald-500 focus:outline-none"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-textMuted mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-textMain focus:border-emerald-500 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-textMuted mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-textMain focus:border-emerald-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-textMuted">At least 6 characters</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              icon={loading ? undefined : <UserPlus className="w-4 h-4" />}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-sm text-emerald-500 hover:text-emerald-400"
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
};

