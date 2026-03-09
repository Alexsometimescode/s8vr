import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvoiceBuilder, InvoiceModal, InvoicePreviewCard } from './InvoiceBuilder';

// Mock the invoice lib
vi.mock('../../src/lib/invoices', () => ({
  getNextInvoiceNumber: vi.fn().mockResolvedValue('2503-0001'),
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
});

describe('InvoiceBuilder', () => {
  const mockOnCancel = vi.fn();
  const mockOnSave = vi.fn();
  const mockUserProfile = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    plan: 'free',
    currency: 'USD',
    invoice_number_format: 'YYMM-seq',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Template Selection Step', () => {
    it('renders template selection initially', () => {
      render(
        <InvoiceBuilder
          onCancel={mockOnCancel}
          onSave={mockOnSave}
          userProfile={mockUserProfile}
        />
      );

      expect(screen.getByText('Choose a Template')).toBeInTheDocument();
      expect(screen.getByText('Minimal')).toBeInTheDocument();
      expect(screen.getByText('Corporate')).toBeInTheDocument();
      expect(screen.getByText('Startup')).toBeInTheDocument();
    });

    it('shows free plan indicator for free users', () => {
      render(
        <InvoiceBuilder
          onCancel={mockOnCancel}
          onSave={mockOnSave}
          userProfile={mockUserProfile}
        />
      );

      expect(screen.getByText('Free Plan')).toBeInTheDocument();
    });

    it('shows pro plan indicator for pro users', () => {
      const proUser = { ...mockUserProfile, plan: 'pro' };
      render(
        <InvoiceBuilder
          onCancel={mockOnCancel}
          onSave={mockOnSave}
          userProfile={proUser}
        />
      );

      expect(screen.getByText('Pro Plan Active')).toBeInTheDocument();
    });

    it('calls onCancel when back button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <InvoiceBuilder
          onCancel={mockOnCancel}
          onSave={mockOnSave}
          userProfile={mockUserProfile}
        />
      );

      const backButton = screen.getByText('Back');
      await user.click(backButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('selects free template and navigates to editor', async () => {
      const user = userEvent.setup();
      render(
        <InvoiceBuilder
          onCancel={mockOnCancel}
          onSave={mockOnSave}
          userProfile={mockUserProfile}
        />
      );

      // Click on Minimal template (free)
      const minimalTemplate = screen.getByText('Minimal').closest('button');
      if (minimalTemplate) {
        await user.click(minimalTemplate);
      }

      // Should navigate to editor
      await waitFor(() => {
        expect(screen.getByText('Client Details')).toBeInTheDocument();
      });
    });

    it('shows upgrade modal when premium template selected by free user', async () => {
      const user = userEvent.setup();
      render(
        <InvoiceBuilder
          onCancel={mockOnCancel}
          onSave={mockOnSave}
          userProfile={mockUserProfile}
        />
      );

      // Click on Agency template (premium)
      const agencyTemplate = screen.getByText('Agency').closest('button');
      if (agencyTemplate) {
        await user.click(agencyTemplate);
      }

      // Should show upgrade modal
      await waitFor(() => {
        expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
      });
    });
  });

  describe('Editor Step', () => {
    const navigateToEditor = async () => {
      const user = userEvent.setup();
      const { container } = render(
        <InvoiceBuilder
          onCancel={mockOnCancel}
          onSave={mockOnSave}
          userProfile={mockUserProfile}
        />
      );

      // Select Minimal template
      const minimalTemplate = screen.getByText('Minimal').closest('button');
      if (minimalTemplate) {
        await user.click(minimalTemplate);
      }

      await waitFor(() => {
        expect(screen.getByText('Client Details')).toBeInTheDocument();
      });

      return { user, container };
    };

    it('renders editor with form fields', async () => {
      await navigateToEditor();

      expect(screen.getByText('Client Details')).toBeInTheDocument();
      expect(screen.getByText('Line Items')).toBeInTheDocument();
      expect(screen.getByText('Dates')).toBeInTheDocument();
      expect(screen.getByText('Template')).toBeInTheDocument();
    });

    it('has disabled send button when form is incomplete', async () => {
      await navigateToEditor();

      const sendButton = screen.getByRole('button', { name: /send invoice/i });
      expect(sendButton).toBeDisabled();
    });

    it('validates email format', async () => {
      const { user } = await navigateToEditor();

      // Get all text inputs and use the first one for name
      const inputs = screen.getAllByRole('textbox');
      await user.type(inputs[0], 'Test Client');

      // Fill in invalid email - second input is email
      const emailInput = inputs[1];
      await user.type(emailInput, 'invalid-email');

      // Should show validation warning
      expect(screen.getByText(/Enter a valid email/i)).toBeInTheDocument();
    });

    it('adds line items', async () => {
      const { user } = await navigateToEditor();

      const addButton = screen.getByText('Add Line Item');
      await user.click(addButton);

      // Should have multiple line items now
      const descriptionInputs = screen.getAllByRole('textbox');
      expect(descriptionInputs.length).toBeGreaterThan(2);
    });

    it('calculates total correctly', async () => {
      const { user } = await navigateToEditor();

      // Find amount input
      const amountInputs = screen.getAllByRole('spinbutton');
      await user.clear(amountInputs[0]);
      await user.type(amountInputs[0], '500');

      // Add another item
      await user.click(screen.getByText('Add Line Item'));

      const newAmountInputs = screen.getAllByRole('spinbutton');
      await user.clear(newAmountInputs[1]);
      await user.type(newAmountInputs[1], '250');

      // Total should be $750
      expect(screen.getByText('$750')).toBeInTheDocument();
    });

    it('enables send button when form is complete', async () => {
      const { user } = await navigateToEditor();

      // Fill in all required fields
      const textInputs = screen.getAllByRole('textbox');
      await user.type(textInputs[0], 'Test Client'); // Client name
      await user.type(textInputs[1], 'client@test.com'); // Client email
      await user.type(textInputs[2], 'Web Design Services'); // Item description

      const amountInputs = screen.getAllByRole('spinbutton');
      await user.clear(amountInputs[0]);
      await user.type(amountInputs[0], '1000');

      await waitFor(() => {
        const sendButton = screen.getByRole('button', { name: /send invoice/i });
        expect(sendButton).not.toBeDisabled();
      });
    });
  });

  describe('Client Selection', () => {
    const existingClients = [
      { id: 'client-1', name: 'Existing Client', email: 'existing@client.com' },
      { id: 'client-2', name: 'Another Client', email: 'another@client.com' },
    ];

    it('shows client dropdown when existing clients provided', async () => {
      const user = userEvent.setup();
      render(
        <InvoiceBuilder
          onCancel={mockOnCancel}
          onSave={mockOnSave}
          userProfile={mockUserProfile}
          existingClients={existingClients}
        />
      );

      // Select template first
      const minimalTemplate = screen.getByText('Minimal').closest('button');
      if (minimalTemplate) {
        await user.click(minimalTemplate);
      }

      await waitFor(() => {
        expect(screen.getByText('Select existing client')).toBeInTheDocument();
      });
    });
  });
});

describe('InvoicePreviewCard', () => {
  const mockInvoice = {
    id: 'inv-1',
    invoiceNumber: 'INV-0001',
    clientName: 'Test Client',
    clientEmail: 'client@test.com',
    items: [
      { id: '1', description: 'Service A', amount: 500 },
      { id: '2', description: 'Service B', amount: 500 },
    ],
    status: 'pending' as const,
    issueDate: '2024-01-01',
    dueDate: '2024-01-31',
    amount: 1000,
    currency: 'USD',
    remindersEnabled: true,
    theme: 'minimal' as const,
  };

  it('renders invoice details correctly', () => {
    render(<InvoicePreviewCard data={mockInvoice} />);

    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('client@test.com')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
  });

  it('displays line items', () => {
    render(<InvoicePreviewCard data={mockInvoice} />);

    expect(screen.getByText('Service A')).toBeInTheDocument();
    expect(screen.getByText('Service B')).toBeInTheDocument();
  });

  it('shows Stripe security badge when not minimal', () => {
    render(<InvoicePreviewCard data={mockInvoice} minimal={false} />);

    expect(screen.getByText('Secure Payment')).toBeInTheDocument();
    expect(screen.getByText('Processed by Stripe')).toBeInTheDocument();
  });

  it('hides Stripe badge when minimal mode', () => {
    render(<InvoicePreviewCard data={mockInvoice} minimal={true} />);

    expect(screen.queryByText('Secure Payment')).not.toBeInTheDocument();
  });

  it('applies different themes', () => {
    const corporateInvoice = { ...mockInvoice, theme: 'corporate' as const };
    const { container } = render(<InvoicePreviewCard data={corporateInvoice} />);

    // Corporate theme should have serif font class
    expect(container.querySelector('.font-serif')).toBeInTheDocument();
  });
});

describe('InvoiceModal', () => {
  const mockInvoice = {
    id: 'inv-1',
    invoiceNumber: 'INV-0001',
    clientName: 'Test Client',
    clientEmail: 'client@test.com',
    items: [{ id: '1', description: 'Service', amount: 1000 }],
    status: 'pending' as const,
    issueDate: '2024-01-01',
    dueDate: '2024-01-31',
    amount: 1000,
    currency: 'USD',
    remindersEnabled: true,
    theme: 'minimal' as const,
    logs: [],
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders invoice modal with details', () => {
    render(<InvoiceModal invoice={mockInvoice} onClose={mockOnClose} />);

    // Invoice number appears in multiple places (preview and details panel)
    const invoiceNumbers = screen.getAllByText(/Invoice #INV-0001/);
    expect(invoiceNumbers.length).toBeGreaterThan(0);
    expect(screen.getByText('Payment Pending')).toBeInTheDocument();
  });

  it('shows paid status for paid invoices', () => {
    const paidInvoice = {
      ...mockInvoice,
      status: 'paid' as const,
      paidAt: '2024-01-15T10:00:00Z',
    };

    render(<InvoiceModal invoice={paidInvoice} onClose={mockOnClose} />);

    expect(screen.getByText('Paid in Full')).toBeInTheDocument();
  });

  it('shows overdue badge for overdue invoices', () => {
    const overdueInvoice = {
      ...mockInvoice,
      dueDate: '2020-01-01', // Past date
    };

    render(<InvoiceModal invoice={overdueInvoice} onClose={mockOnClose} />);

    // Should show overdue indicator
    expect(screen.getByText(/Overdue/i)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();
    render(<InvoiceModal invoice={mockInvoice} onClose={mockOnClose} />);

    // Find and click close button (X icon)
    const closeButton = screen.getByRole('button', { name: '' });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows client details section', () => {
    render(<InvoiceModal invoice={mockInvoice} onClose={mockOnClose} />);

    expect(screen.getByText('Client Details')).toBeInTheDocument();
    // Client name appears in both preview and details panel
    const clientNames = screen.getAllByText('Test Client');
    expect(clientNames.length).toBeGreaterThan(0);
    // Email also appears in multiple places
    const emails = screen.getAllByText('client@test.com');
    expect(emails.length).toBeGreaterThan(0);
  });

  it('shows activity log section', () => {
    render(<InvoiceModal invoice={mockInvoice} onClose={mockOnClose} />);

    expect(screen.getByText('Activity Log')).toBeInTheDocument();
  });

  it('displays payment link actions', () => {
    render(<InvoiceModal invoice={mockInvoice} onClose={mockOnClose} />);

    expect(screen.getByText('Copy Payment Link')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });
});

describe('Invoice Validation', () => {
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  it('validates correct email formats', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    expect(isValidEmail('user+tag@example.org')).toBe(true);
  });

  it('rejects invalid email formats', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('no@')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
  });

  it('calculates invoice total correctly', () => {
    const items = [
      { id: '1', description: 'Item 1', amount: 100.50 },
      { id: '2', description: 'Item 2', amount: 250.00 },
      { id: '3', description: 'Item 3', amount: 149.50 },
    ];

    const total = items.reduce((sum, item) => sum + item.amount, 0);
    expect(total).toBe(500);
  });

  it('validates due date is after issue date', () => {
    const validateDates = (issueDate: string, dueDate: string) => {
      return new Date(dueDate) >= new Date(issueDate);
    };

    expect(validateDates('2024-01-01', '2024-01-31')).toBe(true);
    expect(validateDates('2024-01-15', '2024-01-15')).toBe(true); // Same day is OK
    expect(validateDates('2024-02-01', '2024-01-01')).toBe(false);
  });
});
