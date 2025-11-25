
export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
}

export type InvoiceTheme = 'minimal' | 'corporate' | 'creative';

export type ReminderFrequency = 'weekly' | 'biweekly' | 'daily' | 'custom';
export type ReminderTone = 'friendly' | 'professional' | 'urgent' | 'casual';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  status: 'paid' | 'pending' | 'overdue' | 'draft' | 'ghosted';
  issueDate: string;
  dueDate: string;
  amount: number;
  remindersEnabled: boolean;
  sentAt?: string;
  paidAt?: string;
  theme?: InvoiceTheme;
  reminderFrequency?: ReminderFrequency;
  reminderCustomInterval?: number; // Days
  reminderTone?: ReminderTone;
  reminderTime?: string; // HH:MM 24h format
}

export type ViewState = 'landing' | 'dashboard' | 'create-invoice' | 'client-view';