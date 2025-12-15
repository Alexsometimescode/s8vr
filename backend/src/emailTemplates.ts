// Clean, minimal email templates for S8VR
// Matches the dark theme with emerald accents - no photos, clean design

export interface EmailTemplateData {
  recipientName: string;
  senderName: string;
  senderEmail?: string;
  senderLogo?: string;
  invoiceNumber?: string;
  amount?: number;
  dueDate?: string;
  paymentLink?: string;
  isOverdue?: boolean;
  daysOverdue?: number;
  reminderCount?: number;
  reportLink?: string;
}

// Font stack for email clients
const fontStack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// Clean invoice email template (matches screenshot)
const getCleanInvoiceHtml = (data: {
  senderName: string;
  senderEmail?: string;
  invoiceNumber: string;
  recipientName: string;
  amount: number;
  dueDate: string;
  dueDaysText?: string;
  paymentLink: string;
  reportLink?: string;
  statusBadge?: string;
  statusColor?: string;
  customMessage?: string;
  isReminder?: boolean;
  reminderCount?: number;
}) => {
  const statusBadge = data.statusBadge || '';
  const statusColor = data.statusColor || '#f59e0b';
  const reportLink = data.reportLink || `https://s8vr.app/report/${data.invoiceNumber}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoice #${data.invoiceNumber} from ${data.senderName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: ${fontStack}; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 480px; margin: 0 auto; padding: 48px 24px;">
    
    <!-- Main Card -->
    <div style="background-color: #18181b; border-radius: 16px; border: 1px solid #27272a; overflow: hidden;">
      
      <!-- Header - Name and email only (no photo) -->
      <div style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #27272a;">
        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #ffffff;">${data.senderName}</p>
        ${data.senderEmail ? `<a href="mailto:${data.senderEmail}" style="margin: 4px 0 0 0; font-size: 14px; color: #a1a1aa; text-decoration: none; display: block;">${data.senderEmail}</a>` : ''}
      </div>

      ${data.customMessage ? `
      <!-- Custom Message -->
      <div style="padding: 24px 32px; border-bottom: 1px solid #27272a;">
        <p style="margin: 0; font-size: 14px; color: #a1a1aa; line-height: 1.6;">${data.customMessage}</p>
      </div>
      ` : ''}

      <!-- Amount -->
      <div style="padding: 32px; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 1.5px;">Amount Due</p>
        <p style="margin: 0; font-size: 48px; font-weight: 700; color: #ffffff; letter-spacing: -1px;">$${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        <p style="margin: 16px 0 0 0; font-size: 14px; color: #71717a;">Due ${data.dueDate}</p>
      </div>

      <!-- Invoice Details -->
      <div style="padding: 0 32px 24px 32px;">
        <div style="background-color: #27272a; border-radius: 12px; padding: 16px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #71717a;">Invoice</td>
              <td style="padding: 8px 0; font-size: 14px; color: #ffffff; text-align: right; font-weight: 500;">#${data.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #71717a;">To</td>
              <td style="padding: 8px 0; font-size: 14px; color: #ffffff; text-align: right; font-weight: 500;">${data.recipientName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #71717a;">Due</td>
              <td style="padding: 8px 0; font-size: 14px; color: #ffffff; text-align: right; font-weight: 500;">${data.dueDaysText || data.dueDate}</td>
            </tr>
            ${statusBadge ? `
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #71717a;">Status</td>
              <td style="padding: 8px 0; font-size: 14px; text-align: right;">
                <span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background-color: ${statusColor}20; color: ${statusColor};">${statusBadge}</span>
              </td>
            </tr>
            ` : ''}
          </table>
        </div>
      </div>
      
      <!-- Pay Button (smaller) -->
      <div style="padding: 0 32px 32px 32px;">
        <a href="${data.paymentLink}" style="display: block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-size: 15px; font-weight: 600; text-align: center;">Pay Invoice</a>
      </div>

    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a;">
        Questions? Reply to this email or contact 
        <a href="mailto:${data.senderEmail || 'support@s8vr.app'}" style="color: #10b981; text-decoration: none;">${data.senderName}</a>
      </p>
      <p style="margin: 0 0 16px 0; font-size: 12px; color: #52525b;">
        Sent via <a href="https://s8vr.app" style="color: #71717a; text-decoration: none;">s8vr</a>
      </p>
      <p style="margin: 0;">
        <a href="${reportLink}" style="font-size: 11px; color: #52525b; text-decoration: none;">Report this invoice</a>
      </p>
    </div>
  </div>
</body>
</html>
`;
};

// Invoice Sent Email Template (for clients)
export const getInvoiceEmailTemplate = (data: EmailTemplateData & { items?: { description: string; amount: number }[]; issueDate?: string }): { subject: string; html: string } => {
  const subject = `Invoice #${data.invoiceNumber} from ${data.senderName} - $${Number(data.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  
  // Calculate days until due
  const daysUntilDue = data.dueDate 
    ? Math.ceil((new Date(data.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 14;
  
  const dueDaysText = daysUntilDue > 0 ? `In ${daysUntilDue} days` : daysUntilDue === 0 ? 'Today' : `${Math.abs(daysUntilDue)} days ago`;
  
  const html = getCleanInvoiceHtml({
    senderName: data.senderName,
    senderEmail: data.senderEmail,
    invoiceNumber: data.invoiceNumber || '',
    recipientName: data.recipientName,
    amount: Number(data.amount),
    dueDate: data.dueDate || 'Upon Receipt',
    dueDaysText: dueDaysText,
    paymentLink: data.paymentLink || '',
    reportLink: data.reportLink,
  });

  return { subject, html };
};

// Invoice Reminder Email Template
export const getReminderEmailTemplate = (data: EmailTemplateData, tone: string): { subject: string; html: string } => {
  const isOverdue = data.isOverdue || false;
  const daysOverdue = data.daysOverdue || 0;
  
  // Subject and message based on tone
  let subject = '';
  let customMessage = '';
  
  switch (tone) {
    case 'friendly':
      subject = isOverdue 
        ? `Friendly Reminder: Invoice #${data.invoiceNumber} is overdue`
        : `Quick reminder about Invoice #${data.invoiceNumber}`;
      customMessage = isOverdue
        ? `Hey ${data.recipientName}! Hope you're doing great. Just a friendly nudge about invoice #${data.invoiceNumber} - it's ${daysOverdue} days past due. When you get a chance, please take a look!`
        : `Hey ${data.recipientName}! Quick reminder that invoice #${data.invoiceNumber} is coming up. No rush, just making sure it's on your radar.`;
      break;
      
    case 'formal':
      subject = isOverdue 
        ? `Payment Overdue Notice: Invoice #${data.invoiceNumber}`
        : `Payment Reminder: Invoice #${data.invoiceNumber}`;
      customMessage = isOverdue
        ? `Dear ${data.recipientName}, This is a formal notice regarding invoice #${data.invoiceNumber}, which is currently ${daysOverdue} days past the payment due date. We kindly request payment at your earliest convenience.`
        : `Dear ${data.recipientName}, This is a reminder that invoice #${data.invoiceNumber} is pending payment. We would appreciate your attention to this matter.`;
      break;
      
    case 'urgent':
      subject = `URGENT: Invoice #${data.invoiceNumber} Requires Immediate Attention`;
      customMessage = isOverdue
        ? `Dear ${data.recipientName}, This is an urgent notice regarding invoice #${data.invoiceNumber}, which is now ${daysOverdue} days overdue. Immediate payment is required.`
        : `Dear ${data.recipientName}, This is an urgent reminder that invoice #${data.invoiceNumber} requires immediate attention. Please process payment as soon as possible.`;
      break;
      
    case 'casual':
      subject = isOverdue 
        ? `Hey! About Invoice #${data.invoiceNumber}...`
        : `Quick heads up - Invoice #${data.invoiceNumber}`;
      customMessage = isOverdue
        ? `Hi ${data.recipientName}! Just checking in about invoice #${data.invoiceNumber}. It's been ${daysOverdue} days since it was due. Let me know if you need anything!`
        : `Hi ${data.recipientName}! Quick heads up that invoice #${data.invoiceNumber} is due soon. Thanks for staying on top of things!`;
      break;
      
    default: // professional
      subject = isOverdue 
        ? `Payment Reminder: Invoice #${data.invoiceNumber} is Overdue`
        : `Payment Reminder: Invoice #${data.invoiceNumber}`;
      customMessage = isOverdue
        ? `Hello ${data.recipientName}, This is a reminder regarding invoice #${data.invoiceNumber}, which is currently ${daysOverdue} days past due. We would appreciate prompt attention to this matter.`
        : `Hello ${data.recipientName}, This is a friendly reminder that invoice #${data.invoiceNumber} is pending payment.`;
  }

  // Calculate due text
  const dueDaysText = isOverdue 
    ? `${daysOverdue} days overdue` 
    : data.dueDate || 'Upon Receipt';
  
  // Status badge
  const statusBadge = isOverdue ? 'Overdue' : 'Pending';
  const statusColor = isOverdue ? '#ef4444' : '#f59e0b';

  const html = getCleanInvoiceHtml({
    senderName: data.senderName,
    senderEmail: data.senderEmail,
    invoiceNumber: data.invoiceNumber || '',
    recipientName: data.recipientName,
    amount: Number(data.amount),
    dueDate: data.dueDate || 'Upon Receipt',
    dueDaysText: dueDaysText,
    paymentLink: data.paymentLink || '',
    reportLink: data.reportLink,
    statusBadge: statusBadge,
    statusColor: statusColor,
    customMessage: customMessage,
    isReminder: true,
    reminderCount: data.reminderCount,
  });

  return { subject, html };
};

// Welcome/Registration Email Template
export const getWelcomeEmailTemplate = (data: { name: string; email: string }): { subject: string; html: string } => {
  const subject = `Welcome to s8vr! Let's get you paid faster`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: ${fontStack}; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 480px; margin: 0 auto; padding: 48px 24px;">
    
    <!-- Main Card -->
    <div style="background-color: #18181b; border-radius: 16px; border: 1px solid #27272a; overflow: hidden;">
      
      <!-- Header -->
      <div style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #27272a;">
        <p style="margin: 0; font-size: 24px; font-weight: 700; color: #10b981;">s8vr</p>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #a1a1aa;">Smart invoicing for freelancers</p>
      </div>

      <!-- Welcome Message -->
      <div style="padding: 32px; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 1.5px;">Welcome Aboard</p>
        <p style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">Hey ${data.name}!</p>
        <p style="margin: 16px 0 0 0; font-size: 14px; color: #a1a1aa; line-height: 1.6;">
          You've joined thousands of freelancers who are getting paid faster and stressing less about invoicing.
        </p>
      </div>

      <!-- Features -->
      <div style="padding: 0 32px 24px 32px;">
        <div style="background-color: #27272a; border-radius: 12px; padding: 20px;">
          <div style="margin-bottom: 16px;">
            <span style="font-size: 16px; margin-right: 12px;">📄</span>
            <span style="font-size: 14px; color: #ffffff;">Create beautiful invoices in seconds</span>
          </div>
          <div style="margin-bottom: 16px;">
            <span style="font-size: 16px; margin-right: 12px;">💳</span>
            <span style="font-size: 14px; color: #ffffff;">Get paid directly via Stripe</span>
          </div>
          <div style="margin-bottom: 16px;">
            <span style="font-size: 16px; margin-right: 12px;">🔔</span>
            <span style="font-size: 14px; color: #ffffff;">Automated payment reminders</span>
          </div>
          <div>
            <span style="font-size: 16px; margin-right: 12px;">📊</span>
            <span style="font-size: 14px; color: #ffffff;">Track everything in one place</span>
          </div>
        </div>
      </div>
      
      <!-- CTA Button -->
      <div style="padding: 0 32px 32px 32px;">
        <a href="https://s8vr.app" style="display: block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-size: 15px; font-weight: 600; text-align: center;">Create Your First Invoice</a>
      </div>

    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a;">
        Need help? Just reply to this email.
      </p>
      <p style="margin: 0 0 16px 0; font-size: 12px; color: #52525b;">
        Sent via <a href="https://s8vr.app" style="color: #71717a; text-decoration: none;">s8vr</a>
      </p>
      <p style="margin: 0; font-size: 11px; color: #52525b;">
        You're receiving this because you signed up at s8vr.app
      </p>
    </div>
  </div>
</body>
</html>
`;

  return { subject, html };
};

// Password Reset Email Template
export const getPasswordResetEmailTemplate = (data: { name: string; resetLink: string }): { subject: string; html: string } => {
  const subject = `Reset your s8vr password`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: ${fontStack}; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 480px; margin: 0 auto; padding: 48px 24px;">
    
    <!-- Main Card -->
    <div style="background-color: #18181b; border-radius: 16px; border: 1px solid #27272a; overflow: hidden;">
      
      <!-- Header -->
      <div style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #27272a;">
        <p style="margin: 0; font-size: 24px; font-weight: 700; color: #10b981;">s8vr</p>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #a1a1aa;">Password Reset</p>
      </div>

      <!-- Message -->
      <div style="padding: 32px;">
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #ffffff;">Hi ${data.name},</p>
        <p style="margin: 0 0 24px 0; font-size: 14px; color: #a1a1aa; line-height: 1.6;">
          We received a request to reset your password. Click the button below to create a new password.
        </p>
        
        <!-- Warning -->
        <div style="background-color: #27272a; border-radius: 12px; padding: 16px; margin-bottom: 24px; border-left: 3px solid #f59e0b;">
          <p style="margin: 0; font-size: 13px; color: #f59e0b;">
            This link will expire in 1 hour for security reasons.
          </p>
        </div>
      </div>
      
      <!-- CTA Button -->
      <div style="padding: 0 32px 32px 32px;">
        <a href="${data.resetLink}" style="display: block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-size: 15px; font-weight: 600; text-align: center;">Reset Password</a>
      </div>

    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a;">
        If you didn't request this, you can safely ignore this email.
      </p>
      <p style="margin: 0; font-size: 12px; color: #52525b;">
        Sent via <a href="https://s8vr.app" style="color: #71717a; text-decoration: none;">s8vr</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

  return { subject, html };
};

export default {
  getReminderEmailTemplate,
  getWelcomeEmailTemplate,
  getInvoiceEmailTemplate,
  getPasswordResetEmailTemplate,
};
