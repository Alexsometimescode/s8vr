// Email service for sending invoices

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface SendInvoiceEmailParams {
  to: string;
  clientName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  issueDate: string;
  items: { description: string; amount: number }[];
  fromName: string;
  fromEmail: string;
  userLogo?: string;
  isPremium: boolean;
  invoiceId: string;
}

export const sendInvoiceEmail = async (params: SendInvoiceEmailParams): Promise<{ success: boolean; id?: string; accessToken?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/api/send-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send invoice email');
    }

    // Return accessToken so it can be stored with the invoice
    return { success: true, id: data.id, accessToken: data.accessToken };
  } catch (error: any) {
    console.error('Error sending invoice email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
};
