import React, { useState } from 'react';
import { Button, Logo } from '../ui/Shared';
import { Mail, User, AlertCircle, CheckCircle, ArrowLeft, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface SignUpProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
  onBackToLanding?: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onSuccess, onSwitchToLogin, onBackToLanding }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setAlreadyExists(false);

    try {
      const response = await fetch(`${API_URL}/api/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      if (data.alreadyExists) {
        setAlreadyExists(true);
      }
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to join waitlist. Please try again.');
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
          <h1 className="text-2xl font-bold text-textMain mb-2">Join the Waitlist</h1>
          <p className="text-textMuted">We're in beta. Get notified when access is available</p>
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
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                alreadyExists ? 'bg-blue-500/10' : 'bg-emerald-500/10'
              }`}>
                {alreadyExists ? (
                  <Clock className="w-8 h-8 text-blue-500" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                )}
              </div>
              <h2 className="text-xl font-semibold text-textMain mb-2">
                {alreadyExists ? 'You\'re already on the list!' : 'You\'re on the waitlist!'}
              </h2>
              <p className="text-textMuted mb-4">
                {alreadyExists ? (
                  <>
                    <span className="text-textMain font-medium">{email}</span> is already on our waitlist.
                  </>
                ) : (
                  <>
                    We've added <span className="text-textMain font-medium">{email}</span> to our waitlist.
                  </>
                )}
              </p>
              <p className="text-sm text-textMuted mb-6">
                We're currently in beta testing. We'll notify you via email when your access is ready!
              </p>
              <Button onClick={onSwitchToLogin} className="w-full">
                Back to Sign In
              </Button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-textMain mb-1">Beta Waitlist</h3>
                  <p className="text-xs text-textMuted">
                    We're currently in beta. Join the waitlist and we'll notify you when access is available.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-textMuted mb-2">
                Full Name (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-textMain focus:border-emerald-500 focus:outline-none"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-textMuted mb-2">
                Email <span className="text-red-500">*</span>
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              icon={loading ? undefined : <Mail className="w-4 h-4" />}
            >
              {loading ? 'Joining waitlist...' : 'Join Waitlist'}
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

