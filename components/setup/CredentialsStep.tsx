import React, { useState } from 'react';
import { SetupCredentials } from '../../types';
import {
  Database, CreditCard, Mail, ArrowRight, ArrowLeft,
  Check, X, Loader2, Eye, EyeOff, ExternalLink
} from 'lucide-react';

interface CredentialsStepProps {
  credentials: SetupCredentials;
  onChange: (updates: Partial<SetupCredentials>) => void;
  connectionResults: {
    supabase: boolean | null;
    stripe: boolean | null;
    resend: boolean | null;
  };
  isTestingConnections: boolean;
  onTestConnections: () => Promise<void>;
  onNext: () => void;
  onBack: () => void;
  error: string | null;
}

// Validation helpers
const validateSupabaseUrl = (url: string): string | null => {
  if (!url) return null;
  if (!url.startsWith('https://')) return 'URL must start with https://';
  if (!url.includes('.supabase.co')) return 'URL should be a Supabase project URL';
  return null;
};

const validateSupabaseKey = (key: string, type: 'anon' | 'service'): string | null => {
  if (!key) return null;
  if (!key.startsWith('eyJ')) return 'Key should start with "eyJ"';
  if (key.length < 100) return 'Key appears to be incomplete';
  return null;
};

const validateStripeKey = (key: string): string | null => {
  if (!key) return null;
  if (!key.startsWith('sk_')) return 'Secret key should start with "sk_"';
  if (key.startsWith('sk_test_')) return null; // Valid test key
  if (key.startsWith('sk_live_')) return null; // Valid live key
  return 'Key should be sk_test_... or sk_live_...';
};

const validateResendKey = (key: string): string | null => {
  if (!key) return null;
  if (!key.startsWith('re_')) return 'API key should start with "re_"';
  return null;
};

export const CredentialsStep: React.FC<CredentialsStepProps> = ({
  credentials,
  onChange,
  connectionResults,
  isTestingConnections,
  onTestConnections,
  onNext,
  onBack,
  error,
}) => {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<'supabase' | 'stripe' | 'resend'>('supabase');

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Validation states
  const validationErrors = {
    supabaseUrl: validateSupabaseUrl(credentials.supabaseUrl),
    supabaseAnonKey: validateSupabaseKey(credentials.supabaseAnonKey, 'anon'),
    supabaseServiceKey: validateSupabaseKey(credentials.supabaseServiceKey, 'service'),
    stripeSecretKey: validateStripeKey(credentials.stripeSecretKey),
    resendApiKey: validateResendKey(credentials.resendApiKey),
  };

  const hasValidationErrors = Object.values(validationErrors).some(err => err !== null);

  const allFieldsFilled =
    credentials.supabaseUrl &&
    credentials.supabaseAnonKey &&
    credentials.supabaseServiceKey &&
    credentials.stripeSecretKey &&
    credentials.resendApiKey;

  const allConnectionsValid =
    connectionResults.supabase === true &&
    connectionResults.stripe === true &&
    connectionResults.resend === true;

  const renderConnectionStatus = (result: boolean | null) => {
    if (result === null) return null;
    if (result) {
      return <Check className="w-4 h-4 text-emerald-500" />;
    }
    return <X className="w-4 h-4 text-red-500" />;
  };

  const renderInput = (
    label: string,
    key: keyof SetupCredentials,
    placeholder: string,
    isSecret: boolean = true
  ) => {
    const validationError = validationErrors[key as keyof typeof validationErrors];
    const hasValue = !!credentials[key];

    return (
      <div>
        <label className="block text-sm font-medium text-textMuted mb-2">
          {label}
        </label>
        <div className="relative">
          <input
            type={isSecret && !showKeys[key] ? 'password' : 'text'}
            value={credentials[key]}
            onChange={(e) => onChange({ [key]: e.target.value })}
            placeholder={placeholder}
            className={`w-full bg-background border rounded-lg px-4 py-3 text-textMain focus:outline-none pr-10 font-mono text-sm ${
              hasValue && validationError
                ? 'border-yellow-500 focus:border-yellow-500'
                : hasValue && !validationError
                ? 'border-emerald-500/50 focus:border-emerald-500'
                : 'border-border focus:border-emerald-500'
            }`}
          />
          {isSecret && (
            <button
              type="button"
              onClick={() => toggleShowKey(key)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain"
            >
              {showKeys[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {hasValue && validationError && (
          <p className="text-xs text-yellow-500 mt-1">{validationError}</p>
        )}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-textMain mb-2">Configure Services</h2>
        <p className="text-textMuted">
          Enter your API credentials to connect s8vr to your services
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'supabase', label: 'Supabase', icon: Database, result: connectionResults.supabase },
          { id: 'stripe', label: 'Stripe', icon: CreditCard, result: connectionResults.stripe },
          { id: 'resend', label: 'Resend', icon: Mail, result: connectionResults.resend },
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
              activeSection === section.id
                ? 'bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500'
                : 'bg-surface text-textMuted border-2 border-border hover:border-emerald-500/50'
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
            {renderConnectionStatus(section.result)}
          </button>
        ))}
      </div>

      {/* Credential forms */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        {activeSection === 'supabase' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" />
                <h3 className="font-semibold text-textMain">Supabase</h3>
              </div>
              <a
                href="https://supabase.com/dashboard/project/_/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-500 hover:underline flex items-center gap-1"
              >
                Get credentials <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {renderInput('Project URL', 'supabaseUrl', 'https://xxxxx.supabase.co', false)}
            {renderInput('Anon (Public) Key', 'supabaseAnonKey', 'eyJhbGciOiJIUzI1NiIs...')}
            {renderInput('Service Role Key', 'supabaseServiceKey', 'eyJhbGciOiJIUzI1NiIs...')}
          </div>
        )}

        {activeSection === 'stripe' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                <h3 className="font-semibold text-textMain">Stripe</h3>
              </div>
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-500 hover:underline flex items-center gap-1"
              >
                Get credentials <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {renderInput('Secret Key', 'stripeSecretKey', 'sk_live_...')}
            {renderInput('Webhook Secret', 'stripeWebhookSecret', 'whsec_...')}
            <p className="text-xs text-textMuted">
              Webhook secret is optional for local development but required for production.
            </p>
          </div>
        )}

        {activeSection === 'resend' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-500" />
                <h3 className="font-semibold text-textMain">Resend</h3>
              </div>
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-500 hover:underline flex items-center gap-1"
              >
                Get credentials <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {renderInput('API Key', 'resendApiKey', 're_...')}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Test & Continue */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-textMuted hover:text-textMain transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onTestConnections}
            disabled={!allFieldsFilled || isTestingConnections || hasValidationErrors}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              allFieldsFilled && !isTestingConnections && !hasValidationErrors
                ? 'bg-surface border border-border hover:border-emerald-500 text-textMain'
                : 'bg-border text-textMuted cursor-not-allowed'
            }`}
          >
            {isTestingConnections ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                Test Connections
              </>
            )}
          </button>

          <button
            onClick={onNext}
            disabled={!allConnectionsValid}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              allConnectionsValid
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-border text-textMuted cursor-not-allowed'
            }`}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CredentialsStep;
