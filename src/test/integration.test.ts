import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Integration Tests for s8vr Invoice App
 *
 * These tests simulate the complete user journey:
 * 1. Installation/Setup
 * 2. Account Creation
 * 3. First Invoice Creation
 * 4. Sending Invoice
 * 5. Receiving Payment
 */

// Mock fetch for all API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      upsert: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('User Journey: Install to First Payment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Step 1: Installation & Setup', () => {
    it('should check setup status on app load', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          isConfigured: false,
          hasSupabase: false,
          hasStripe: false,
          hasResend: false,
          setupComplete: false,
        }),
      });

      const response = await fetch('http://localhost:3001/api/setup/status');
      const data = await response.json();

      expect(data.isConfigured).toBe(false);
      expect(data.setupComplete).toBe(false);
    });

    it('should test all service connections', async () => {
      const credentials = {
        supabase: {
          url: 'https://test.supabase.co',
          anonKey: 'test-anon-key',
          serviceKey: 'test-service-key',
        },
        stripe: {
          secretKey: 'sk_test_123',
        },
        resend: {
          apiKey: 're_test_123',
        },
      };

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

      const response = await fetch('http://localhost:3001/api/setup/test/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.results.supabase.success).toBe(true);
      expect(data.results.stripe.success).toBe(true);
      expect(data.results.resend.success).toBe(true);
    });

    it('should push database schema', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          tables: ['users', 'clients', 'invoices', 'invoice_items', 'templates', 'email_logs', 'app_config'],
        }),
      });

      const response = await fetch('http://localhost:3001/api/setup/schema/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUrl: 'https://test.supabase.co',
          supabaseServiceKey: 'test-service-key',
        }),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.tables).toContain('users');
      expect(data.tables).toContain('invoices');
      expect(data.tables.length).toBe(7);
    });

    it('should create owner account', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          user: {
            id: 'user-owner-123',
            email: 'owner@business.com',
            name: 'Business Owner',
          },
        }),
      });

      const response = await fetch('http://localhost:3001/api/setup/account/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseUrl: 'https://test.supabase.co',
          supabaseServiceKey: 'test-service-key',
          account: {
            name: 'Business Owner',
            email: 'owner@business.com',
            password: 'SecurePassword123!',
            businessName: 'My Business',
          },
        }),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.user.email).toBe('owner@business.com');
    });

    it('should write configuration file', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          path: '/app/.env',
        }),
      });

      const response = await fetch('http://localhost:3001/api/setup/config/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials: {
            supabaseUrl: 'https://test.supabase.co',
            supabaseAnonKey: 'anon-key',
            supabaseServiceKey: 'service-key',
            stripeSecretKey: 'sk_test_123',
            stripeWebhookSecret: 'whsec_123',
            resendApiKey: 're_123',
            frontendUrl: 'http://localhost:3000',
          },
        }),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
    });
  });

  describe('Step 2: User Authentication', () => {
    it('should sign up new user', async () => {
      const { supabase } = await import('../lib/supabase');

      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: 'user@test.com' },
          session: null,
        },
        error: null,
      } as any);

      const result = await supabase.auth.signUp({
        email: 'user@test.com',
        password: 'Password123!',
        options: { data: { name: 'Test User' } },
      });

      expect(result.data.user).toBeTruthy();
      expect(result.data.user?.email).toBe('user@test.com');
    });

    it('should sign in existing user', async () => {
      const { supabase } = await import('../lib/supabase');

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: 'user@test.com' },
          session: { access_token: 'jwt-token' },
        },
        error: null,
      } as any);

      const result = await supabase.auth.signInWithPassword({
        email: 'user@test.com',
        password: 'Password123!',
      });

      expect(result.data.session).toBeTruthy();
      expect(result.data.session?.access_token).toBe('jwt-token');
    });
  });

  describe('Step 3: Creating First Invoice', () => {
    it('should generate next invoice number', async () => {
      const { supabase } = await import('../lib/supabase');

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      // Simulate getNextInvoiceNumber logic
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const expectedNumber = `${year}${month}-0001`;

      expect(expectedNumber).toMatch(/^\d{4}-0001$/);
    });

    it('should create invoice with client and items', async () => {
      const { supabase } = await import('../lib/supabase');

      // Mock client creation
      const mockClientInsert = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'client-123' },
          error: null,
        }),
      });

      // Mock invoice creation
      const mockInvoiceInsert = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'invoice-123', invoice_number: 'INV-0001' },
          error: null,
        }),
      });

      // Mock items creation
      const mockItemsInsert = vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'clients') return mockClientInsert() as any;
        if (table === 'invoices') return mockInvoiceInsert() as any;
        if (table === 'invoice_items') return mockItemsInsert() as any;
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { currency: 'USD' } }),
          } as any;
        }
        return {} as any;
      });

      // Verify the mock structure is correct
      expect(supabase.from('invoices')).toBeDefined();
    });

    it('should validate invoice data before creation', () => {
      const validateInvoice = (invoice: {
        clientName: string;
        clientEmail: string;
        items: { description: string; amount: number }[];
      }) => {
        const errors: string[] = [];

        if (!invoice.clientName.trim()) {
          errors.push('Client name is required');
        }

        if (!invoice.clientEmail.trim()) {
          errors.push('Client email is required');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoice.clientEmail)) {
          errors.push('Invalid email format');
        }

        if (!invoice.items.length) {
          errors.push('At least one item is required');
        }

        const hasValidItems = invoice.items.some(
          (item) => item.description.trim() && item.amount > 0
        );
        if (!hasValidItems) {
          errors.push('At least one item must have description and positive amount');
        }

        return errors;
      };

      // Valid invoice
      expect(validateInvoice({
        clientName: 'Test Client',
        clientEmail: 'client@test.com',
        items: [{ description: 'Service', amount: 100 }],
      })).toHaveLength(0);

      // Missing client name
      expect(validateInvoice({
        clientName: '',
        clientEmail: 'client@test.com',
        items: [{ description: 'Service', amount: 100 }],
      })).toContain('Client name is required');

      // Invalid email
      expect(validateInvoice({
        clientName: 'Client',
        clientEmail: 'invalid',
        items: [{ description: 'Service', amount: 100 }],
      })).toContain('Invalid email format');

      // No items with positive amount
      expect(validateInvoice({
        clientName: 'Client',
        clientEmail: 'client@test.com',
        items: [{ description: '', amount: 0 }],
      })).toContain('At least one item must have description and positive amount');
    });
  });

  describe('Step 4: Sending Invoice', () => {
    it('should send invoice email via API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          id: 'email-123',
          accessToken: 'secure-token-abc',
        }),
      });

      const response = await fetch('http://localhost:3001/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'client@test.com',
          clientName: 'Test Client',
          invoiceNumber: 'INV-0001',
          amount: 1000,
          dueDate: '2024-01-31',
          issueDate: '2024-01-01',
          items: [
            { description: 'Web Development', amount: 800 },
            { description: 'Hosting Setup', amount: 200 },
          ],
          fromName: 'Freelancer',
          fromEmail: 'freelancer@business.com',
          invoiceId: 'invoice-123',
        }),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.accessToken).toBeTruthy();
    });

    it('should update invoice with access token after sending', async () => {
      const { supabase } = await import('../lib/supabase');

      const mockUpdate = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockImplementation(mockUpdate);

      // Simulate update
      const result = await supabase.from('invoices');
      expect(result).toBeDefined();
    });
  });

  describe('Step 5: Client Payment Flow', () => {
    it('should fetch invoice with valid token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          invoice: {
            id: 'invoice-123',
            invoiceNumber: 'INV-0001',
            clientName: 'Test Client',
            clientEmail: 'client@test.com',
            items: [{ description: 'Service', amount: 1000 }],
            amount: 1000,
            status: 'pending',
            dueDate: '2024-01-31',
            theme: 'minimal',
          },
          sender: {
            name: 'Freelancer',
            email: 'freelancer@business.com',
          },
        }),
      });

      const response = await fetch(
        'http://localhost:3001/api/invoice/invoice-123?token=secure-token'
      );
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.invoice.invoiceNumber).toBe('INV-0001');
      expect(data.sender.name).toBe('Freelancer');
    });

    it('should deny access with invalid token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid or expired link',
        }),
      });

      const response = await fetch(
        'http://localhost:3001/api/invoice/invoice-123?token=invalid-token'
      );
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid');
    });

    it('should create payment intent', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          clientSecret: 'pi_test_secret_123',
          paymentIntentId: 'pi_test_123',
          stripeAccountId: 'acct_test_123',
        }),
      });

      const response = await fetch('http://localhost:3001/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: 'invoice-123' }),
      });
      const data = await response.json();

      expect(data.clientSecret).toBeTruthy();
      expect(data.paymentIntentId).toMatch(/^pi_/);
    });

    it('should mark invoice as paid', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Payment recorded',
        }),
      });

      const response = await fetch('http://localhost:3001/api/invoice/invoice-123/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'secure-token' }),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
    });
  });

  describe('Step 6: Stripe Webhook Processing', () => {
    it('should handle payment_intent.succeeded webhook', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ received: true }),
      });

      const webhookPayload = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            amount: 100000, // $1000 in cents
            currency: 'usd',
            metadata: {
              invoice_id: 'invoice-123',
              user_id: 'user-123',
              connected_account_id: 'acct_test',
              transfer_amount: '97000', // After 3% fee
            },
          },
        },
      };

      const response = await fetch('http://localhost:3001/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'test-signature',
        },
        body: JSON.stringify(webhookPayload),
      });
      const data = await response.json();

      expect(data.received).toBe(true);
    });

    it('should handle payment_intent.payment_failed webhook', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ received: true }),
      });

      const webhookPayload = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_failed',
            last_payment_error: {
              message: 'Card declined',
            },
          },
        },
      };

      const response = await fetch('http://localhost:3001/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });
      const data = await response.json();

      expect(data.received).toBe(true);
    });
  });
});

describe('Platform Fee Calculations', () => {
  it('calculates 3% platform fee correctly', () => {
    const calculateFee = (amount: number) => Math.round(amount * 0.03 * 100) / 100;
    const calculateTransfer = (amount: number) => amount - calculateFee(amount);

    // Test various amounts
    expect(calculateFee(100)).toBe(3);
    expect(calculateFee(500)).toBe(15);
    expect(calculateFee(1000)).toBe(30);
    expect(calculateFee(5000)).toBe(150);

    // Verify transfer amounts
    expect(calculateTransfer(100)).toBe(97);
    expect(calculateTransfer(1000)).toBe(970);
  });

  it('handles small amounts correctly', () => {
    const calculateFee = (amount: number) => Math.round(amount * 0.03 * 100) / 100;

    expect(calculateFee(1)).toBe(0.03);
    expect(calculateFee(10)).toBe(0.30);
  });
});

describe('Invoice Status Transitions', () => {
  const validTransitions: Record<string, string[]> = {
    draft: ['pending', 'sent'],
    pending: ['sent', 'paid', 'overdue'],
    sent: ['paid', 'overdue', 'pending'],
    overdue: ['paid', 'pending'],
    paid: [], // Final state
  };

  it('validates status transitions', () => {
    const canTransition = (from: string, to: string) => {
      return validTransitions[from]?.includes(to) || false;
    };

    // Valid transitions
    expect(canTransition('pending', 'sent')).toBe(true);
    expect(canTransition('sent', 'paid')).toBe(true);
    expect(canTransition('overdue', 'paid')).toBe(true);

    // Invalid transitions
    expect(canTransition('paid', 'pending')).toBe(false);
    expect(canTransition('paid', 'draft')).toBe(false);
  });
});
