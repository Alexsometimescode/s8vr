import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  testSupabaseConnection,
  testStripeConnection,
  testResendConnection,
  testAllConnections,
  getSetupStatus,
  pushSchema,
  createAccount,
  writeConfig,
} from './setupApi';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Setup API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('testSupabaseConnection', () => {
    it('should return success when connection is valid', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          message: 'Connected to Supabase',
        }),
      });

      const result = await testSupabaseConnection(
        'https://test.supabase.co',
        'anon-key',
        'service-key'
      );

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/setup/test/supabase'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should return error when connection fails', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid credentials',
        }),
      });

      const result = await testSupabaseConnection(
        'https://invalid.supabase.co',
        'bad-key',
        'bad-service-key'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await testSupabaseConnection(
        'https://test.supabase.co',
        'anon-key',
        'service-key'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('testStripeConnection', () => {
    it('should return success for valid Stripe key', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          message: 'Stripe connected',
        }),
      });

      const result = await testStripeConnection('sk_test_123');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/setup/test/stripe'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ secretKey: 'sk_test_123' }),
        })
      );
    });

    it('should return error for invalid Stripe key', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid API key',
        }),
      });

      const result = await testStripeConnection('invalid_key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });
  });

  describe('testResendConnection', () => {
    it('should return success for valid Resend key', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          message: 'Resend connected',
        }),
      });

      const result = await testResendConnection('re_123');

      expect(result.success).toBe(true);
    });

    it('should return error for invalid Resend key', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid API key',
        }),
      });

      const result = await testResendConnection('invalid');

      expect(result.success).toBe(false);
    });
  });

  describe('testAllConnections', () => {
    const validCredentials = {
      supabaseUrl: 'https://test.supabase.co',
      supabaseAnonKey: 'anon-key',
      supabaseServiceKey: 'service-key',
      stripeSecretKey: 'sk_test_123',
      stripeWebhookSecret: 'whsec_123',
      resendApiKey: 're_123',
      frontendUrl: 'http://localhost:3000',
    };

    it('should return all successes when all connections valid', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          results: {
            supabase: { success: true },
            stripe: { success: true },
            resend: { success: true },
          },
        }),
      });

      const result = await testAllConnections(validCredentials);

      expect(result.success).toBe(true);
      expect(result.results.supabase.success).toBe(true);
      expect(result.results.stripe.success).toBe(true);
      expect(result.results.resend.success).toBe(true);
    });

    it('should return partial failures correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          results: {
            supabase: { success: true },
            stripe: { success: false, error: 'Invalid key' },
            resend: { success: true },
          },
        }),
      });

      const result = await testAllConnections(validCredentials);

      expect(result.success).toBe(false);
      expect(result.results.supabase.success).toBe(true);
      expect(result.results.stripe.success).toBe(false);
    });

    it('should handle API failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API down'));

      const result = await testAllConnections(validCredentials);

      expect(result.success).toBe(false);
      expect(result.results.supabase.error).toBe('API connection failed');
    });
  });

  describe('getSetupStatus', () => {
    it('should return configured status', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          isConfigured: true,
          hasSupabase: true,
          hasStripe: true,
          hasResend: true,
          setupComplete: true,
        }),
      });

      const result = await getSetupStatus();

      expect(result.isConfigured).toBe(true);
      expect(result.setupComplete).toBe(true);
    });

    it('should return unconfigured status on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed'));

      const result = await getSetupStatus();

      expect(result.isConfigured).toBe(false);
      expect(result.setupComplete).toBe(false);
    });
  });

  describe('pushSchema', () => {
    it('should return success with created tables', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          tables: ['users', 'clients', 'invoices', 'invoice_items', 'templates', 'email_logs', 'app_config'],
        }),
      });

      const result = await pushSchema('https://test.supabase.co', 'service-key');

      expect(result.success).toBe(true);
      expect(result.tables).toContain('users');
      expect(result.tables).toContain('invoices');
      expect(result.tables.length).toBe(7);
    });

    it('should return error on schema push failure', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'Permission denied',
          tables: [],
        }),
      });

      const result = await pushSchema('https://test.supabase.co', 'bad-key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });
  });

  describe('createAccount', () => {
    it('should create account successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
          },
        }),
      });

      const result = await createAccount(
        'https://test.supabase.co',
        'service-key',
        {
          name: 'Test User',
          email: 'test@example.com',
          password: 'securepassword123',
          businessName: 'Test Business',
        }
      );

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('test@example.com');
    });

    it('should handle duplicate email error', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'User with this email already exists',
        }),
      });

      const result = await createAccount(
        'https://test.supabase.co',
        'service-key',
        {
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123',
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });

  describe('writeConfig', () => {
    it('should write config successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          path: '/app/.env',
        }),
      });

      const result = await writeConfig({
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'anon-key',
        supabaseServiceKey: 'service-key',
        stripeSecretKey: 'sk_test_123',
        stripeWebhookSecret: 'whsec_123',
        resendApiKey: 're_123',
        frontendUrl: 'http://localhost:3000',
      });

      expect(result.success).toBe(true);
      expect(result.path).toBe('/app/.env');
    });

    it('should handle write permission error', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: 'Permission denied: cannot write to .env',
        }),
      });

      const result = await writeConfig({
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'anon-key',
        supabaseServiceKey: 'service-key',
        stripeSecretKey: 'sk_test_123',
        stripeWebhookSecret: 'whsec_123',
        resendApiKey: 're_123',
        frontendUrl: 'http://localhost:3000',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });
  });
});
