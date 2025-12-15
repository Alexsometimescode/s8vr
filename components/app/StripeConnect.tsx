import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Shared';
import { CreditCard, Check, Loader2, AlertCircle, ExternalLink } from 'lucide-react';

interface StripeConnectProps {
  userId: string;
  userEmail?: string;
  onConnected?: () => void;
}

// Ensure API URL is defined, fallback for dev
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const StripeConnect: React.FC<StripeConnectProps> = ({ userId, userEmail, onConnected }) => {
  const [status, setStatus] = useState<'loading' | 'not_connected' | 'pending' | 'connected'>('loading');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
        checkStatus();
    }
  }, [userId]);

  // Check for return from Stripe onboarding
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'true') {
      // User returned from Stripe onboarding - recheck status
      checkStatus();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/connect/status/${userId}`);
      const data = await res.json();
      
      if (data.connected) {
        setStatus('connected');
        setAccountId(data.accountId);
        if (onConnected) onConnected();
      } else if (data.accountId) {
        // Has account but not fully onboarded
        setStatus('pending');
        setAccountId(data.accountId);
      } else {
        setStatus('not_connected');
      }
    } catch (error) {
      console.error('Failed to check Stripe status:', error);
      setStatus('not_connected');
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      // Step 1: Create account (or get existing)
      const accountRes = await fetch(`${API_URL}/api/connect/create-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: userEmail }),
      });
      const accountData = await accountRes.json();
      
      if (!accountRes.ok) throw new Error(accountData.error || 'Failed to create account');

      const { accountId: newAccountId } = accountData;

      // Step 2: Get onboarding link
      const linkRes = await fetch(`${API_URL}/api/connect/create-account-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: newAccountId }),
      });
      const linkData = await linkRes.json();

      if (!linkRes.ok) throw new Error(linkData.error || 'Failed to get onboarding link');

      const { url } = linkData;

      // Redirect to Stripe onboarding
      window.location.href = url;
    } catch (error: any) {
      console.error('Failed to connect Stripe:', error);
      setError(error.message || 'Failed to connect Stripe account. Please try again.');
      setConnecting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-textMuted text-sm">
        <Loader2 className="w-3 h-3 animate-spin" />
        Checking Stripe status...
      </div>
    );
  }

  if (status === 'connected') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Stripe Connected</span>
        </div>
        <p className="text-xs text-textMuted">
          You can receive payments directly to your Stripe account.
        </p>
        <a 
          href="https://dashboard.stripe.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-emerald-500 hover:underline inline-flex items-center gap-1"
        >
          Open Stripe Dashboard <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="space-y-2">
          <div className="flex items-center gap-2 text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 w-fit">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Setup Incomplete</span>
          </div>
          <p className="text-xs text-textMuted">Complete your Stripe account setup to start receiving payments.</p>
          <Button
            onClick={handleConnect}
            disabled={connecting}
            size="sm"
            variant="outline"
            icon={connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
          >
            {connecting ? 'Redirecting...' : 'Continue Setup'}
          </Button>
          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
        <p className="text-xs text-textMuted mb-2">
          Connect your Stripe account to receive payments directly from your clients.
        </p>
        <Button
          onClick={handleConnect}
          disabled={connecting}
          size="sm"
          variant="secondary"
          icon={connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
        >
          {connecting ? 'Redirecting to Stripe...' : 'Connect Stripe Account'}
        </Button>
        {error && (
            <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {error}
            </p>
        )}
    </div>
  );
};

