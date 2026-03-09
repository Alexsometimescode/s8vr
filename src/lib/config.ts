/**
 * Configuration detection utilities for s8vr
 * Determines if the app has been set up and configured
 */

export interface AppConfig {
  isConfigured: boolean;
  hasSupabase: boolean;
  hasStripe: boolean;
  hasResend: boolean;
  setupComplete: boolean;
}

/**
 * Check if all required environment variables are present
 */
export const getAppConfig = (): AppConfig => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const setupComplete = import.meta.env.VITE_SETUP_COMPLETE === 'true';

  const hasSupabase = !!(supabaseUrl && supabaseKey);
  // Stripe and Resend are checked on backend, but we can check for setup flag
  const hasStripe = setupComplete; // Assume configured if setup complete
  const hasResend = setupComplete;

  return {
    isConfigured: hasSupabase && setupComplete,
    hasSupabase,
    hasStripe,
    hasResend,
    setupComplete,
  };
};

/**
 * Check if setup wizard should be shown
 */
export const shouldShowSetupWizard = (): boolean => {
  const config = getAppConfig();
  return !config.setupComplete;
};

/**
 * Check if manual .env setup was done (has Supabase but no setup flag)
 */
export const isManualSetup = (): boolean => {
  const config = getAppConfig();
  return config.hasSupabase && !config.setupComplete;
};

/**
 * Get the API URL for backend calls
 */
export const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};
