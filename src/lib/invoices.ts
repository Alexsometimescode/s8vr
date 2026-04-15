import { supabase } from './supabase';
import { Invoice, InvoiceItem } from '../../types';

/**
 * Generates the next sequential invoice number based on the user's format preference
 * @param userId - The user's UUID
 * @param format - Invoice number format: 'YYMM-seq', 'YYYY-seq', or 'INV-seq'
 * @returns The next invoice number (e.g., '2501-0001')
 */
export const getNextInvoiceNumber = async (userId: string, format: string = 'YYMM-seq'): Promise<string> => {
  const now = new Date();
  let prefix = '';
  
  // Generate prefix based on format
  if (format === 'YYMM-seq') {
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    prefix = `${year}${month}-`;
  } else if (format === 'YYYY-seq') {
    const year = now.getFullYear().toString();
    prefix = `${year}-`;
  } else if (format === 'INV-seq') {
    prefix = 'INV-';
  } else {
    // Default to YYMM-seq
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    prefix = `${year}${month}-`;
  }
  
  // Get all invoices for this user that match the prefix
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('user_id', userId)
    .like('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false });
  
  if (error) {
    console.error('Error fetching invoices for number generation:', error);
    // Fallback to 1 if query fails
    return `${prefix}0001`;
  }
  
  // Find the highest sequence number
  let maxSeq = 0;
  if (invoices && invoices.length > 0) {
    for (const inv of invoices) {
      // Extract sequence number from invoice number (e.g., "2512-0001" -> 1)
      const match = inv.invoice_number.match(/-(\d+)$/);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  }
  
  // Increment and format with leading zeros
  const nextSeq = maxSeq + 1;
  const formattedSeq = nextSeq.toString().padStart(4, '0');
  
  return `${prefix}${formattedSeq}`;
};

/**
 * Fetches all invoices for a user with related items and client data
 * @param userId - The user's UUID
 * @returns Array of invoices with items and client details
 * @throws Error if database query fails
 */
export const fetchInvoices = async (userId: string): Promise<Invoice[]> => {
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      *,
      invoice_items (*),
      clients (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Transform to match Invoice type
  return invoices.map((inv: any) => ({
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    clientName: inv.clients?.name || '',
    clientEmail: inv.clients?.email || '',
    items: inv.invoice_items?.map((item: any) => ({
      id: item.id,
      description: item.description,
      amount: parseFloat(item.amount),
    })) || [],
    status: inv.status,
    issueDate: inv.issue_date,
    dueDate: inv.due_date,
    amount: parseFloat(inv.amount),
    currency: inv.currency || 'USD',
    remindersEnabled: inv.reminders_enabled === true,
    reminderFrequency: inv.reminder_frequency || 'weekly',
    reminderCustomInterval: inv.reminder_custom_interval || 3,
    reminderTone: inv.reminder_tone || 'friendly',
    reminderTime: inv.reminder_time || '09:00',
    sentAt: inv.sent_at,
    paidAt: inv.paid_at,
    theme: inv.theme,
    checkoutUrl: inv.checkout_url || undefined,
    logs: [],
  }));
};

/**
 * Creates a new invoice with associated client and line items
 * @param invoice - Invoice data including client info and line items
 * @param userId - The user's UUID
 * @returns The created invoice record
 * @throws Error if invoice creation fails
 */
export const createInvoice = async (invoice: Omit<Invoice, 'id'> & { clientName: string; clientEmail: string; currency?: string }, userId: string) => {
  let clientId: string | null = null;

  // First, find or create the client
  if (invoice.clientEmail) {
    // Check if client already exists for this user
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .eq('email', invoice.clientEmail)
      .single();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      // Create new client
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          name: invoice.clientName,
          email: invoice.clientEmail,
          active: true,
        })
        .select()
        .single();

      if (clientError) {
        console.error('Error creating client:', clientError);
        // Continue without client_id if creation fails
      } else {
        clientId = newClient.id;
      }
    }
  }

  const invoiceCurrency = invoice.currency || 'USD';

  // Create invoice
  const { data: invoiceData, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      user_id: userId,
      client_id: clientId,
      invoice_number: invoice.invoiceNumber,
      status: invoice.status || 'pending',
      issue_date: invoice.issueDate,
      due_date: invoice.dueDate,
      amount: invoice.amount || invoice.items.reduce((sum, item) => sum + item.amount, 0),
      reminders_enabled: invoice.remindersEnabled === true,
      theme: invoice.theme,
      currency: invoiceCurrency.toLowerCase(), // Store in lowercase for Stripe compatibility
    })
    .select()
    .single();

  if (invoiceError) throw invoiceError;

  // Create invoice items
  if (invoice.items && invoice.items.length > 0) {
    const items = invoice.items.map((item, index) => ({
      invoice_id: invoiceData.id,
      description: item.description,
      amount: item.amount,
      order_index: index,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(items);

    if (itemsError) {
      console.error('Error creating invoice items:', itemsError);
      // Don't throw - invoice was created, items are secondary
    }
  }

  return invoiceData;
};

/**
 * Updates an existing invoice with partial data
 * @param invoiceId - The invoice UUID
 * @param updates - Partial invoice data to update
 * @throws Error if update fails
 */
export const updateInvoice = async (invoiceId: string, updates: Partial<Invoice & { access_token?: string }>) => {
  const updateData: any = {};
  
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.amount !== undefined) updateData.amount = updates.amount;
  if (updates.remindersEnabled !== undefined) updateData.reminders_enabled = updates.remindersEnabled;
  if (updates.paidAt !== undefined) updateData.paid_at = updates.paidAt;
  if (updates.sentAt !== undefined) updateData.sent_at = updates.sentAt;
  if (updates.access_token !== undefined) updateData.access_token = updates.access_token;
  if ((updates as any).checkoutUrl !== undefined) updateData.checkout_url = (updates as any).checkoutUrl;

  const { error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', invoiceId);

  if (error) throw error;
};

/**
 * Sets the access token for public invoice viewing and marks as sent
 * @param invoiceId - The invoice UUID
 * @param accessToken - Secure token for public access
 * @throws Error if update fails
 */
export const updateInvoiceAccessToken = async (invoiceId: string, accessToken: string) => {
  const { error } = await supabase
    .from('invoices')
    .update({ access_token: accessToken, sent_at: new Date().toISOString() })
    .eq('id', invoiceId);

  if (error) throw error;
};

/**
 * Deletes an invoice and its associated items
 * @param invoiceId - The invoice UUID to delete
 * @throws Error if deletion fails
 */
export const deleteInvoice = async (invoiceId: string) => {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId);

  if (error) throw error;
};

