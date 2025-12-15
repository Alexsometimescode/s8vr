
export interface InvoiceItem {
  id: string; // UUID
  description: string;
  amount: number;
}

export interface Client {
  id: string; // UUID
  name: string;
  email: string;
}

export type InvoiceTheme = 
  | 'minimal' 
  | 'corporate' 
  | 'startup' 
  | 'creative' 
  | 'tech' 
  | 'elegant' 
  | 'agency' 
  | 'modern' 
  | 'classic' 
  | 'consultant';

export type ReminderFrequency = 'weekly' | 'biweekly' | 'daily' | 'custom';
export type ReminderTone = 'friendly' | 'formal' | 'professional' | 'urgent' | 'casual';

export interface EmailLog {
  id: string; // UUID
  date: string;
  type: 'sent' | 'reminder' | 'opened' | 'paid';
  message?: string;
}

export interface InvoiceCustomization {
  textColor?: string;
  backgroundColor?: string;
  accentColor?: string;
  fontFamily?: 'inter' | 'georgia' | 'merriweather' | 'playfair' | 'roboto-mono' | 'space-grotesk';
}

export interface Invoice {
  id: string; // UUID
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
  logs?: EmailLog[];
  customization?: InvoiceCustomization;
}

export type ViewState = 'landing' | 'dashboard' | 'create-invoice' | 'client-view' | 'public-invoice' | 'admin';