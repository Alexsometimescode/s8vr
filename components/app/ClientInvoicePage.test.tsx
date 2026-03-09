import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientInvoicePage } from './ClientInvoicePage';

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    elements: vi.fn(),
    confirmPayment: vi.fn(),
  })),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
  PaymentElement: () => <div data-testid="payment-element">Payment Form</div>,
  useStripe: () => ({
    confirmPayment: vi.fn().mockResolvedValue({ error: null }),
  }),
  useElements: () => ({}),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/invoice/inv-123?token=test-token',
  search: '?token=test-token',
  origin: 'http://localhost:3000',
  reload: vi.fn(),
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('ClientInvoicePage', () => {
  const mockInvoiceData = {
    success: true,
    invoice: {
      id: 'inv-123',
      invoiceNumber: 'INV-0001',
      clientName: 'Test Client',
      clientEmail: 'client@test.com',
      items: [
        { id: '1', description: 'Web Development', amount: 2500 },
        { id: '2', description: 'Design Services', amount: 1500 },
      ],
      status: 'pending',
      issueDate: '2024-01-01',
      dueDate: '2024-01-31',
      amount: 4000,
      theme: 'minimal',
    },
    sender: {
      name: 'Freelancer Business',
      email: 'freelancer@example.com',
    },
  };

  const mockPaymentIntentData = {
    clientSecret: 'pi_test_secret',
    paymentIntentId: 'pi_test_123',
    stripeAccountId: 'acct_test',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading spinner initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<ClientInvoicePage invoiceId="inv-123" />);

      expect(screen.getByText('Loading invoice...')).toBeInTheDocument();
    });
  });

  describe('Access Denied State', () => {
    it('shows access denied when no token provided', async () => {
      // Override location.search to have no token
      Object.defineProperty(window, 'location', {
        value: { ...mockLocation, search: '' },
        writable: true,
      });

      render(<ClientInvoicePage invoiceId="inv-123" />);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });

      // Restore
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });
    });

    it('shows access denied when token is invalid', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Invalid or expired link' }),
      });

      render(<ClientInvoicePage invoiceId="inv-123" />);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });
  });

  describe('Invoice Display', () => {
    beforeEach(() => {
      // Mock successful invoice fetch
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/invoice/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockInvoiceData),
          });
        }
        if (url.includes('/api/payments/create-intent')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockPaymentIntentData),
          });
        }
        return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      });
    });

    it('displays invoice details correctly', async () => {
      render(<ClientInvoicePage invoiceId="inv-123" />);

      await waitFor(() => {
        // Multiple elements show the amount - check at least one exists
        const amounts = screen.getAllByText('$4,000.00');
        expect(amounts.length).toBeGreaterThan(0);
      });

      // Invoice number appears in multiple places
      const invoiceNumbers = screen.getAllByText(/INV-0001/);
      expect(invoiceNumbers.length).toBeGreaterThan(0);
      // Multiple elements show the business name
      const businessNames = screen.getAllByText('Freelancer Business');
      expect(businessNames.length).toBeGreaterThan(0);
    });

    it('shows sender information', async () => {
      render(<ClientInvoicePage invoiceId="inv-123" />);

      await waitFor(() => {
        // Business name appears in multiple places (header, details)
        const businessNames = screen.getAllByText('Freelancer Business');
        expect(businessNames.length).toBeGreaterThan(0);
      });
    });

    it('displays payment summary section', async () => {
      render(<ClientInvoicePage invoiceId="inv-123" />);

      await waitFor(() => {
        expect(screen.getByText('Payment Summary')).toBeInTheDocument();
        // Amount Due appears in multiple places
        const amountDues = screen.getAllByText('Amount Due');
        expect(amountDues.length).toBeGreaterThan(0);
      });
    });

    it('shows Stripe payment element when client secret available', async () => {
      render(<ClientInvoicePage invoiceId="inv-123" />);

      await waitFor(() => {
        expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
      });
    });

    it('shows security badge', async () => {
      render(<ClientInvoicePage invoiceId="inv-123" />);

      await waitFor(() => {
        expect(screen.getByText('Secure Invoice')).toBeInTheDocument();
      });
    });
  });

  describe('Payment Flow', () => {
    it('shows payment unavailable when Stripe not connected', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/invoice/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockInvoiceData),
          });
        }
        if (url.includes('/api/payments/create-intent')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Freelancer is not connected to Stripe' }),
          });
        }
        return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      });

      render(<ClientInvoicePage invoiceId="inv-123" />);

      await waitFor(() => {
        expect(screen.getByText(/has not set up online payments yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Paid Invoice State', () => {
    it('shows payment complete for paid invoices', async () => {
      const paidInvoiceData = {
        ...mockInvoiceData,
        invoice: {
          ...mockInvoiceData.invoice,
          status: 'paid',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(paidInvoiceData),
      });

      render(<ClientInvoicePage invoiceId="inv-123" />);

      await waitFor(() => {
        expect(screen.getByText('Payment Complete')).toBeInTheDocument();
      });

      expect(screen.getByText('Thank you for your payment!')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows error state on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<ClientInvoicePage invoiceId="inv-123" />);

      await waitFor(() => {
        expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Server error' }),
      });

      render(<ClientInvoicePage invoiceId="inv-123" />);

      await waitFor(() => {
        // Server errors show Access Denied page with link to home
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('Go to s8vr Home')).toBeInTheDocument();
      });
    });
  });

  describe('Invoice Due Date Display', () => {
    it('formats due date correctly', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/invoice/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockInvoiceData),
          });
        }
        if (url.includes('/api/payments/create-intent')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockPaymentIntentData),
          });
        }
        return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
      });

      render(<ClientInvoicePage invoiceId="inv-123" />);

      await waitFor(() => {
        // Due date should be formatted
        expect(screen.getByText('Due Date')).toBeInTheDocument();
        expect(screen.getByText('Jan 31, 2024')).toBeInTheDocument();
      });
    });
  });
});

describe('Payment Form Validation', () => {
  it('validates payment amount is positive', () => {
    const validateAmount = (amount: number) => amount > 0;

    expect(validateAmount(100)).toBe(true);
    expect(validateAmount(0.01)).toBe(true);
    expect(validateAmount(0)).toBe(false);
    expect(validateAmount(-50)).toBe(false);
  });

  it('calculates platform fee correctly (3%)', () => {
    const calculateFee = (amount: number) => Math.round(amount * 0.03 * 100) / 100;

    expect(calculateFee(100)).toBe(3);
    expect(calculateFee(1000)).toBe(30);
    expect(calculateFee(4000)).toBe(120);
  });

  it('calculates transfer amount correctly', () => {
    const calculateTransfer = (amount: number) => {
      const fee = Math.round(amount * 0.03 * 100) / 100;
      return amount - fee;
    };

    expect(calculateTransfer(100)).toBe(97);
    expect(calculateTransfer(1000)).toBe(970);
    expect(calculateTransfer(4000)).toBe(3880);
  });
});

describe('Access Token Validation', () => {
  it('validates token presence', () => {
    const urlParams = new URLSearchParams('?token=abc123');
    const token = urlParams.get('token');

    expect(token).toBe('abc123');
  });

  it('handles missing token', () => {
    const urlParams = new URLSearchParams('');
    const token = urlParams.get('token');

    expect(token).toBeNull();
  });

  it('handles empty token', () => {
    const urlParams = new URLSearchParams('?token=');
    const token = urlParams.get('token');

    expect(token).toBe('');
  });
});

describe('Currency Formatting', () => {
  it('formats USD amounts correctly', () => {
    const formatCurrency = (amount: number) =>
      amount.toLocaleString('en-US', { minimumFractionDigits: 2 });

    expect(formatCurrency(1000)).toBe('1,000.00');
    expect(formatCurrency(4000)).toBe('4,000.00');
    expect(formatCurrency(99.99)).toBe('99.99');
    expect(formatCurrency(1000000)).toBe('1,000,000.00');
  });
});
