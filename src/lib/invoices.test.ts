import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

import { supabase } from './supabase';
import {
  getNextInvoiceNumber,
  fetchInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from './invoices';

describe('Invoice Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getNextInvoiceNumber', () => {
    it('should generate first invoice number with YYMM-seq format', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const result = await getNextInvoiceNumber('user-123', 'YYMM-seq');

      // Should be current year/month + 0001
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      expect(result).toBe(`${year}${month}-0001`);
    });

    it('should increment existing invoice numbers', async () => {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { invoice_number: `${year}${month}-0003` },
            { invoice_number: `${year}${month}-0002` },
            { invoice_number: `${year}${month}-0001` },
          ],
          error: null,
        }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const result = await getNextInvoiceNumber('user-123', 'YYMM-seq');
      expect(result).toBe(`${year}${month}-0004`);
    });

    it('should support YYYY-seq format', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const result = await getNextInvoiceNumber('user-123', 'YYYY-seq');
      const year = new Date().getFullYear().toString();
      expect(result).toBe(`${year}-0001`);
    });

    it('should support INV-seq format', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const result = await getNextInvoiceNumber('user-123', 'INV-seq');
      expect(result).toBe('INV-0001');
    });
  });

  describe('fetchInvoices', () => {
    it('should fetch and transform invoices correctly', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          invoice_number: 'INV-0001',
          status: 'pending',
          issue_date: '2024-01-01',
          due_date: '2024-01-31',
          amount: '1000.00',
          currency: 'USD',
          reminders_enabled: true,
          theme: 'minimal',
          clients: { name: 'Test Client', email: 'client@test.com' },
          invoice_items: [
            { id: 'item-1', description: 'Service A', amount: '500.00' },
            { id: 'item-2', description: 'Service B', amount: '500.00' },
          ],
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockInvoices, error: null }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const result = await fetchInvoices('user-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'inv-1',
        invoiceNumber: 'INV-0001',
        clientName: 'Test Client',
        clientEmail: 'client@test.com',
        status: 'pending',
        currency: 'USD',
      });
      expect(result[0].items).toHaveLength(2);
    });

    it('should throw error on database failure', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      });
      vi.mocked(supabase.from).mockImplementation(mockFrom);

      await expect(fetchInvoices('user-123')).rejects.toThrow();
    });
  });

  describe('createInvoice', () => {
    it('should create invoice with new client', async () => {
      const mockInvoiceData = {
        invoiceNumber: 'INV-0001',
        clientName: 'New Client',
        clientEmail: 'new@client.com',
        items: [{ id: '1', description: 'Service', amount: 100 }],
        status: 'pending',
        issueDate: '2024-01-01',
        dueDate: '2024-01-31',
        theme: 'minimal' as const,
      };

      // Mock for finding existing client (not found)
      const mockClientSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      });

      // Mock for creating new client
      const mockClientInsert = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'client-new' },
          error: null,
        }),
      });

      // Mock for getting user currency
      const mockUserSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { currency: 'USD' } }),
      });

      // Mock for creating invoice
      const mockInvoiceInsert = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'inv-new', invoice_number: 'INV-0001' },
          error: null,
        }),
      });

      // Mock for creating items
      const mockItemsInsert = vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'clients') {
          callCount++;
          if (callCount === 1) return mockClientSelect() as any;
          return mockClientInsert() as any;
        }
        if (table === 'users') return mockUserSelect() as any;
        if (table === 'invoices') return mockInvoiceInsert() as any;
        if (table === 'invoice_items') return mockItemsInsert() as any;
        return {} as any;
      });

      const result = await createInvoice(mockInvoiceData, 'user-123');
      expect(result.id).toBe('inv-new');
    });
  });

  describe('updateInvoice', () => {
    it('should update invoice status', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockImplementation(mockUpdate);

      await expect(
        updateInvoice('inv-123', { status: 'paid' })
      ).resolves.not.toThrow();
    });

    it('should throw on update failure', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
      });
      vi.mocked(supabase.from).mockImplementation(mockUpdate);

      await expect(
        updateInvoice('inv-123', { status: 'paid' })
      ).rejects.toThrow();
    });
  });

  describe('deleteInvoice', () => {
    it('should delete invoice successfully', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockImplementation(mockDelete);

      await expect(deleteInvoice('inv-123')).resolves.not.toThrow();
    });

    it('should throw on delete failure', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') }),
      });
      vi.mocked(supabase.from).mockImplementation(mockDelete);

      await expect(deleteInvoice('inv-123')).rejects.toThrow();
    });
  });
});

describe('Invoice Validation', () => {
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  it('should validate client email', () => {
    expect(isValidEmail('client@example.com')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
  });

  it('should validate invoice amount is positive', () => {
    const validateAmount = (amount: number) => amount > 0;
    expect(validateAmount(100)).toBe(true);
    expect(validateAmount(0)).toBe(false);
    expect(validateAmount(-50)).toBe(false);
  });

  it('should validate due date is after issue date', () => {
    const validateDates = (issueDate: string, dueDate: string) => {
      return new Date(dueDate) >= new Date(issueDate);
    };
    expect(validateDates('2024-01-01', '2024-01-31')).toBe(true);
    expect(validateDates('2024-01-31', '2024-01-01')).toBe(false);
  });
});
