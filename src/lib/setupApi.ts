/**
 * Setup API client for the setup wizard
 * Handles all API calls during initial configuration
 */

import { SetupCredentials } from '../../types';

// Use a hardcoded URL for setup since env vars may not exist yet
const getApiUrl = (): string => {
  // Try env var first, fallback to localhost
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Default to localhost during setup
  return 'http://localhost:3001';
};

interface TestResult {
  success: boolean;
  error?: string;
  message?: string;
}

interface TestAllResults {
  success: boolean;
  results: {
    supabase: TestResult;
    stripe: TestResult;
    resend: TestResult;
  };
}

/**
 * Test Supabase connection
 */
export const testSupabaseConnection = async (
  url: string,
  anonKey: string,
  serviceKey: string
): Promise<TestResult> => {
  try {
    const response = await fetch(`${getApiUrl()}/api/setup/test/supabase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, anonKey, serviceKey }),
    });

    const data = await response.json();
    return {
      success: data.success,
      error: data.error,
      message: data.message,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to connect to setup API',
    };
  }
};

/**
 * Test Stripe connection
 */
export const testStripeConnection = async (secretKey: string): Promise<TestResult> => {
  try {
    const response = await fetch(`${getApiUrl()}/api/setup/test/stripe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretKey }),
    });

    const data = await response.json();
    return {
      success: data.success,
      error: data.error,
      message: data.message,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to connect to setup API',
    };
  }
};

/**
 * Test Resend connection
 */
export const testResendConnection = async (apiKey: string): Promise<TestResult> => {
  try {
    const response = await fetch(`${getApiUrl()}/api/setup/test/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });

    const data = await response.json();
    return {
      success: data.success,
      error: data.error,
      message: data.message,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to connect to setup API',
    };
  }
};

/**
 * Test all connections at once
 */
export const testAllConnections = async (
  credentials: SetupCredentials
): Promise<TestAllResults> => {
  try {
    const response = await fetch(`${getApiUrl()}/api/setup/test/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supabase: {
          url: credentials.supabaseUrl,
          anonKey: credentials.supabaseAnonKey,
          serviceKey: credentials.supabaseServiceKey,
        },
        stripe: {
          secretKey: credentials.stripeSecretKey,
        },
        resend: {
          apiKey: credentials.resendApiKey,
        },
      }),
    });

    const data = await response.json();
    return {
      success: data.success,
      results: data.results,
    };
  } catch (error: any) {
    return {
      success: false,
      results: {
        supabase: { success: false, error: 'API connection failed' },
        stripe: { success: false, error: 'API connection failed' },
        resend: { success: false, error: 'API connection failed' },
      },
    };
  }
};

/**
 * Get setup status from backend
 */
export const getSetupStatus = async (): Promise<{
  isConfigured: boolean;
  hasSupabase: boolean;
  hasStripe: boolean;
  hasResend: boolean;
  setupComplete: boolean;
}> => {
  try {
    const response = await fetch(`${getApiUrl()}/api/setup/status`);
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      isConfigured: false,
      hasSupabase: false,
      hasStripe: false,
      hasResend: false,
      setupComplete: false,
    };
  }
};

/**
 * Push database schema to Supabase
 */
export const pushSchema = async (
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{
  success: boolean;
  tables: string[];
  error?: string;
}> => {
  try {
    const response = await fetch(`${getApiUrl()}/api/setup/schema/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supabaseUrl,
        supabaseServiceKey,
      }),
    });

    const data = await response.json();
    return {
      success: data.success,
      tables: data.tables || [],
      error: data.error,
    };
  } catch (error: any) {
    return {
      success: false,
      tables: [],
      error: error.message || 'Failed to push schema',
    };
  }
};

/**
 * Create owner account in Supabase
 */
export const createAccount = async (
  supabaseUrl: string,
  supabaseServiceKey: string,
  account: {
    name: string;
    email: string;
    password: string;
    businessName?: string;
  }
): Promise<{
  success: boolean;
  user?: { id: string; email: string; name: string };
  error?: string;
}> => {
  try {
    const response = await fetch(`${getApiUrl()}/api/setup/account/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supabaseUrl,
        supabaseServiceKey,
        account,
      }),
    });

    const data = await response.json();
    return {
      success: data.success,
      user: data.user,
      error: data.error,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create account',
    };
  }
};

/**
 * Write configuration to .env file
 */
export const writeConfig = async (
  credentials: SetupCredentials
): Promise<{ success: boolean; error?: string; path?: string }> => {
  try {
    const response = await fetch(`${getApiUrl()}/api/setup/config/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credentials,
        frontendUrl: credentials.frontendUrl || window.location.origin,
      }),
    });

    const data = await response.json();
    return {
      success: data.success,
      error: data.error,
      path: data.path,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to write configuration',
    };
  }
};
