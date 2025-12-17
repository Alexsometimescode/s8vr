import React, { useState } from 'react';
import { signIn } from '../../src/lib/auth';
import { Button, Logo } from '../ui/Shared';
import { LogIn, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onSuccess: () => void;
  onSwitchToSignUp: () => void;
  onBackToLanding?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onSwitchToSignUp, onBackToLanding }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn({ email, password });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            className="mb-6 flex items-center gap-2 text-textMuted hover:text-textMain transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to home</span>
          </button>
        )}
        <div className="text-center mb-8">
          <Logo className="text-3xl mb-4" />
          <h1 className="text-2xl font-bold text-textMain mb-2">Welcome back</h1>
          <p className="text-textMuted">Sign in to your s8vr account</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-textMain focus:border-emerald-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              icon={loading ? undefined : <LogIn className="w-4 h-4" />}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onSwitchToSignUp}
              className="text-sm text-emerald-500 hover:text-emerald-400"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-textMuted">
          <p>Secure login powered by Supabase</p>
        </div>
      </div>
    </div>
  );
};

