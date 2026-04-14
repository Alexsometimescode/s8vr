import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getReminderEmailTemplate, getInvoiceEmailTemplate, getWelcomeEmailTemplate } from './emailTemplates';
import { generateInvoicePdf } from './invoicePdf';

// Extend Express Request to include user info
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
}) : null;

// Middleware
app.use(cors({
  origin: true, // Allow all origins for now to fix CORS issues during dev
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

/**
 * Middleware to authenticate JWT token from Authorization header
 * Verifies Supabase JWT and attaches user info to request
 */
const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, jwtSecret) as { sub: string; email?: string };

    // Get user from database to verify they exist and get their role
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', decoded.sub)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role || 'user'
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to require admin role
 * Must be used after authenticateToken middleware
 */
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 's8vr backend is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.get('/api', (req, res) => {
  res.json({
    message: 's8vr API v1',
    endpoints: {
      health: '/health',
      api: '/api',
      sendInvoice: 'POST /api/send-invoice',
      marketing: 'GET /api/marketing/email-list'
    }
  });
});

// --- PAYMENT ROUTES ---

// Create payment intent for invoice
app.post('/api/payments/create-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY.' });
    }

    const { invoiceId } = req.body;
    
    // Get invoice with items
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, invoice_items (*)')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoiceData) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get client email if available
    let clientEmail = '';
    if (invoiceData.client_id) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('email')
        .eq('id', invoiceData.client_id)
        .single();
      clientEmail = clientData?.email || '';
    }

    // Get currency: invoice → user default → USD
    let invoiceCurrency = invoiceData.currency?.toLowerCase() || 'usd';
    if (!invoiceCurrency || invoiceCurrency === 'usd') {
      const { data: ownerData } = await supabase
        .from('users')
        .select('currency')
        .eq('id', invoiceData.user_id)
        .single();
      invoiceCurrency = ownerData?.currency?.toLowerCase() || 'usd';
    }

    // Use items sum as fallback if stored amount is 0
    const itemsSum = (invoiceData.invoice_items as any[] || []).reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0);
    const effectiveAmount = Number(invoiceData.amount) > 0 ? Number(invoiceData.amount) : itemsSum;
    const amountInCents = Math.round(effectiveAmount * 100);

    // Direct payment — money goes straight to the owner's Stripe account (STRIPE_SECRET_KEY)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: invoiceCurrency,
      metadata: {
        invoice_id: invoiceId,
        user_id: invoiceData.user_id,
        client_email: clientEmail,
      },
    });

    await supabase
      .from('invoices')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', invoiceId);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Create Payment Intent Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send Invoice Email via Resend
app.post('/api/send-invoice', async (req, res) => {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'RESEND_API_KEY is not configured in environment variables' 
      });
    }

    const {
      to,
      clientName,
      invoiceNumber,
      amount,
      dueDate,
      issueDate,
      items,
      fromName,
      fromEmail,
      userLogo,
      isPremium,
      invoiceId,
      currency
    } = req.body;

    // Validate required fields
    if (!to || !clientName || !invoiceNumber || !amount || !items) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: to, clientName, invoiceNumber, amount, items' 
      });
    }

    // Generate secure access token for this invoice
    const accessToken = crypto.randomBytes(32).toString('hex');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Build payment link — use Stripe Checkout if Stripe is configured, otherwise fall back to app invoice page
    let paymentLink = `${frontendUrl}/invoice/${invoiceId || invoiceNumber}?token=${accessToken}`;
    if (stripe && invoiceId) {
      try {
        const lineItems = Array.isArray(items) && items.length > 0
          ? items.map((item: { description: string; amount: number }) => ({
              price_data: {
                currency: (currency || 'usd').toLowerCase(),
                product_data: { name: item.description || 'Service' },
                unit_amount: Math.round(Number(item.amount) * 100),
              },
              quantity: 1,
            }))
          : [{
              price_data: {
                currency: (currency || 'usd').toLowerCase(),
                product_data: { name: `Invoice #${invoiceNumber}` },
                unit_amount: Math.round(Number(amount) * 100),
              },
              quantity: 1,
            }];

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          customer_email: to,
          metadata: { invoiceId, invoiceNumber },
          success_url: `https://s8vr.app/?paid=1`,
          cancel_url: `${frontendUrl}/invoice/${invoiceId}?token=${accessToken}`,
        });
        if (session.url) paymentLink = session.url;
      } catch (stripeErr: any) {
        console.warn('Stripe Checkout session failed, falling back to app link:', stripeErr.message);
      }
    }

    const invoiceViewLink = `${frontendUrl}/invoice/${invoiceId || invoiceNumber}?token=${accessToken}`;
    const reportLink = `${frontendUrl}/report/${invoiceId || invoiceNumber}`;

    // Format the due date
    const formattedDueDate = dueDate 
      ? new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'Upon Receipt';

    // Generate beautiful HTML email using template
    const { subject: emailSubject, html: emailHtml } = getInvoiceEmailTemplate({
      recipientName: clientName,
      senderName: fromName || 'Your Business',
      senderEmail: fromEmail,
      senderLogo: userLogo,
      invoiceNumber: invoiceNumber,
      amount: Number(amount),
      dueDate: formattedDueDate,
      paymentLink: paymentLink,
      items: items,
      issueDate: issueDate ? new Date(issueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      currency: currency,
    });

    const senderName = fromName || 'Invoices';
    const senderEmail = process.env.FROM_EMAIL || 'invoices@s8vr.app';

    // Generate PDF attachment
    let pdfAttachment: { filename: string; content: string } | null = null;
    try {
      const pdfBuffer = await generateInvoicePdf({
        invoiceNumber,
        clientName,
        clientEmail: to,
        items: Array.isArray(items) ? items : [],
        amount: Number(amount),
        issueDate: issueDate || new Date().toISOString(),
        dueDate: dueDate || new Date().toISOString(),
        currency,
        senderName: fromName,
        senderEmail: fromEmail,
        senderLogo: userLogo,
      });
      pdfAttachment = {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer.toString('base64'),
      };
    } catch (pdfErr: any) {
      console.warn('PDF generation failed, sending without attachment:', pdfErr.message);
    }

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${senderName} <${senderEmail}>`,
        to: [to],
        reply_to: fromEmail || undefined,
        subject: `Invoice #${invoiceNumber} from ${fromName || 's8vr'} - $${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        html: emailHtml,
        ...(pdfAttachment ? { attachments: [pdfAttachment] } : {}),
      }),
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return res.status(response.status).json({ 
        success: false, 
        error: data?.message || 'Failed to send email via Resend' 
      });
    }

    // Return access token and checkout URL so frontend can store them with the invoice
    res.json({ success: true, id: data?.id, accessToken, checkoutUrl: paymentLink });

  } catch (error: any) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

// Get Invoice by ID and Token (public endpoint for clients)
app.get('/api/invoice/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!id || !token) {
      return res.status(400).json({ success: false, error: 'Missing invoice ID or token' });
    }

    // Use Supabase service role to bypass RLS
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch invoice with token verification
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        invoice_items (*),
        clients (*)
      `)
      .eq('id', id)
      .eq('access_token', token)
      .single();

    if (invoiceError || !invoice) {
      return res.status(403).json({ success: false, error: 'Invalid or expired link' });
    }

    // Fetch sender profile
    const { data: senderProfile } = await supabase
      .from('users')
      .select('name, email, avatar_url, logo_url')
      .eq('id', invoice.user_id)
      .single();

    // Return invoice data
    res.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        clientName: invoice.clients?.name || '',
        clientEmail: invoice.clients?.email || '',
        items: invoice.invoice_items?.map((item: any) => ({
          id: item.id,
          description: item.description,
          amount: parseFloat(item.amount),
        })) || [],
        status: invoice.status,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        amount: parseFloat(invoice.amount),
        theme: invoice.theme || 'minimal',
        paidAt: invoice.paid_at,
      },
      sender: senderProfile || { name: 'Business', email: '' }
    });

  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoice' });
  }
});

// Mark invoice as paid (public endpoint for clients)
app.post('/api/invoice/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    if (!id || !token) {
      return res.status(400).json({ success: false, error: 'Missing invoice ID or token' });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token and update status
    const { data, error } = await supabase
      .from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id)
      .eq('access_token', token)
      .select()
      .single();

    if (error || !data) {
      return res.status(403).json({ success: false, error: 'Invalid or expired link' });
    }

    res.json({ success: true, message: 'Payment recorded' });

  } catch (error: any) {
    console.error('Error processing payment:', error);
    res.status(500).json({ success: false, error: 'Failed to process payment' });
  }
});

// Get payment link for an invoice (used by freelancers to share)
app.get('/api/invoice/:id/link', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing invoice ID' });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the invoice with access token and checkout URL
    const { data, error } = await supabase
      .from('invoices')
      .select('id, access_token, checkout_url')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Return Stripe checkout URL if available, otherwise fallback to app link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = data.checkout_url || `${frontendUrl}/invoice/${data.id}?token=${data.access_token}`;

    res.json({ success: true, link });

  } catch (error: any) {
    console.error('Error getting payment link:', error);
    res.status(500).json({ success: false, error: 'Failed to get payment link' });
  }
});

// Verify Stripe payment status for an invoice (fallback when webhooks aren't configured)
app.post('/api/invoice/:id/verify-payment', async (req, res) => {
  try {
    const { id } = req.params;

    if (!stripe) {
      return res.status(503).json({ success: false, error: 'Stripe not configured' });
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('id, status, checkout_url')
      .eq('id', id)
      .single();

    if (error || !invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.json({ success: true, status: 'paid', alreadyPaid: true });
    }

    if (!invoice.checkout_url) {
      return res.status(400).json({ success: false, error: 'No Stripe checkout session for this invoice' });
    }

    // Extract session ID from Stripe checkout URL (cs_test_xxx or cs_live_xxx)
    const sessionMatch = invoice.checkout_url.match(/\/(cs_(?:test|live)_\w+)/);
    if (!sessionMatch) {
      return res.status(400).json({ success: false, error: 'Cannot parse Stripe session ID from checkout URL' });
    }

    const sessionId = sessionMatch[1];
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      await supabase
        .from('invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id);

      try {
        await supabase.from('email_logs').insert({
          invoice_id: id,
          type: 'paid',
          message: `Payment of $${((session.amount_total || 0) / 100).toFixed(2)} confirmed via Stripe (manual verify)`,
        });
      } catch {} // non-critical

      return res.json({ success: true, status: 'paid' });
    }

    res.json({ success: true, status: session.payment_status });

  } catch (error: any) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, error: 'Failed to verify payment status' });
  }
});

// Download invoice as PDF
app.get('/api/invoice/:id/pdf', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`*, invoice_items(*), clients(*)`)
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('name, email, logo_url, avatar_url')
      .eq('id', req.user!.id)
      .single();

    const pdfBuffer = await generateInvoicePdf({
      invoiceNumber: invoice.invoice_number,
      clientName: invoice.clients?.name || '',
      clientEmail: invoice.clients?.email || '',
      items: (invoice.invoice_items || []).map((i: any) => ({
        description: i.description,
        amount: parseFloat(i.amount),
      })),
      amount: parseFloat(invoice.amount),
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      currency: invoice.currency,
      senderName: userProfile?.name,
      senderEmail: userProfile?.email,
      senderLogo: userProfile?.logo_url || userProfile?.avatar_url,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoice_number}.pdf"`);
    res.send(pdfBuffer);

  } catch (error: any) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Sync payment status for all pending invoices against Stripe
app.post('/api/invoices/sync-payments', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!stripe) {
      return res.json({ success: true, updated: [] });
    }

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, checkout_url, amount')
      .eq('user_id', req.user!.id)
      .in('status', ['pending', 'overdue'])
      .not('checkout_url', 'is', null);

    if (error || !invoices || invoices.length === 0) {
      return res.json({ success: true, updated: [] });
    }

    const updated: string[] = [];

    for (const invoice of invoices) {
      try {
        const sessionMatch = invoice.checkout_url.match(/\/(cs_(?:test|live)_\w+)/);
        if (!sessionMatch) continue;

        const session = await stripe.checkout.sessions.retrieve(sessionMatch[1]);
        if (session.payment_status === 'paid') {
          await supabase
            .from('invoices')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', invoice.id);

          try {
            await supabase.from('email_logs').insert({
              invoice_id: invoice.id,
              type: 'paid',
              message: `Payment confirmed via Stripe (auto-sync)`,
            });
          } catch {} // non-critical

          updated.push(invoice.id);
        }
      } catch {
        // skip invoices where Stripe lookup fails
      }
    }

    res.json({ success: true, updated });
  } catch (error: any) {
    console.error('Error syncing payments:', error);
    res.status(500).json({ success: false, error: 'Failed to sync payments' });
  }
});

// --- STRIPE WEBHOOK ---
// Note: This must use raw body parser, not JSON
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe) {
    console.error('Stripe not configured');
    return res.status(503).json({ error: 'Stripe is not configured' });
  }

  if (!webhookSecret) {
    console.warn('⚠️ Webhook secret not configured - skipping signature verification');
    // In development, we can skip signature verification
  }

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // Development mode - parse body directly
      event = JSON.parse(req.body.toString());
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Update invoice status
      const { data, error } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid', 
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating invoice:', error);
      } else if (data) {
        // Log the payment
        await supabase
          .from('email_logs')
          .insert({
            invoice_id: data.id,
            type: 'paid',
            message: `Payment of $${(paymentIntent.amount / 100).toFixed(2)} received via Stripe`,
          });
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Log failure
      const { data } = await supabase
        .from('invoices')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .single();

      if (data) {
        await supabase
          .from('email_logs')
          .insert({
            invoice_id: data.id,
            type: 'sent',
            message: `Payment attempt failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
          });
      }
      break;
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoiceId;
      if (invoiceId) {
        const { data, error } = await supabase
          .from('invoices')
          .update({ status: 'paid', paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', invoiceId)
          .select()
          .single();
        if (!error && data) {
          await supabase.from('email_logs').insert({
            invoice_id: data.id,
            type: 'paid',
            message: `Payment of $${((session.amount_total || 0) / 100).toFixed(2)} received via Stripe Checkout`,
          });
        }
      }
      break;
    }

    default:
      // Unhandled event type - no action needed
      break;
  }

  res.json({ received: true });
});

// ============================================
// ADMIN DASHBOARD ENDPOINTS
// ============================================

// Get admin stats
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Get user counts
    const { data: users } = await supabase.from('users').select('id, plan, created_at');
    const totalUsers = users?.length || 0;
    const proUsers = users?.filter(u => u.plan === 'pro').length || 0;

    // Recent signups (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentSignups = users?.filter(u => new Date(u.created_at) > weekAgo).length || 0;

    // Get invoice stats
    const { data: invoices } = await supabase.from('invoices').select('id, status, amount, due_date');
    const totalInvoices = invoices?.length || 0;
    const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.amount || 0), 0) || 0;
    const paidInvoices = invoices?.filter(i => i.status === 'paid').length || 0;
    const pendingInvoices = invoices?.filter(i => i.status === 'pending' || i.status === 'sent').length || 0;
    
    // Overdue invoices
    const today = new Date();
    const overdueInvoices = invoices?.filter(i => 
      (i.status === 'pending' || i.status === 'sent') && 
      new Date(i.due_date) < today
    ).length || 0;

    res.json({
      success: true,
      stats: {
        totalUsers,
        proUsers,
        totalInvoices,
        totalRevenue,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        recentSignups,
        monthlyGrowth: 0 // Could calculate from historical data
      }
    });
  } catch (error: any) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all users
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, plan, role, created_at, is_banned, ban_reason')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, users: users || [] });
  } catch (error: any) {
    console.error('Error getting users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user plan
app.put('/api/admin/users/:userId/plan', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body;

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { error } = await supabase
      .from('users')
      .update({ plan, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user plan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all feedback
app.get('/api/admin/feedback', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Get feedback
    const { data: feedback, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // If we have user_ids, fetch user info separately
    const feedbackWithUsers = await Promise.all((feedback || []).map(async (f: any) => {
      if (f.user_id) {
        const { data: user } = await supabase
          .from('users')
          .select('email, name')
          .eq('id', f.user_id)
          .single();
        return {
          ...f,
          user_email: f.user_email || user?.email,
          user_name: user?.name,
        };
      }
      return f;
    }));

    res.json({ success: true, feedback: feedbackWithUsers });
  } catch (error: any) {
    console.error('Error getting feedback:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update feedback status
app.put('/api/admin/feedback/:feedbackId/status', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { feedbackId } = req.params;
    const { status } = req.body;

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { error } = await supabase
      .from('feedback')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', feedbackId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get reminder logs
app.get('/api/admin/reminder-logs', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Get email logs (sent reminders)
    const { data: logs, error } = await supabase
      .from('email_logs')
      .select(`
        id, type, message, created_at, invoice_id,
        invoices!email_logs_invoice_id_fkey(
          invoice_number,
          clients!invoices_client_id_fkey(name, email)
        )
      `)
      .eq('type', 'reminder')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Get invoices with reminders enabled (active reminder configs)
    const { data: invoicesWithReminders, error: invError } = await supabase
      .from('invoices')
      .select(`
        id, invoice_number, amount, due_date, status,
        reminders_enabled, reminder_frequency, reminder_tone, reminder_count, last_reminder_sent,
        clients!invoices_client_id_fkey(name, email),
        users!invoices_user_id_fkey(name, email)
      `)
      .eq('reminders_enabled', true)
      .in('status', ['pending', 'sent', 'overdue'])
      .order('created_at', { ascending: false });

    if (invError) console.error('Error fetching invoices with reminders:', invError);

    const transformedLogs = (logs || []).map((log: any) => ({
      id: log.id,
      invoice_id: log.invoice_id,
      invoice_number: log.invoices?.invoice_number || 'N/A',
      client_name: log.invoices?.clients?.name || 'Unknown',
      client_email: log.invoices?.clients?.email || '',
      sent_at: log.created_at,
      status: log.message?.includes('failed') ? 'failed' : 'sent',
      message: log.message,
    }));

    const activeReminders = (invoicesWithReminders || []).map((inv: any) => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      client_name: inv.clients?.name || 'Unknown',
      client_email: inv.clients?.email || '',
      user_name: inv.users?.name || 'Unknown',
      user_email: inv.users?.email || '',
      amount: inv.amount,
      due_date: inv.due_date,
      status: inv.status,
      reminder_frequency: inv.reminder_frequency,
      reminder_tone: inv.reminder_tone,
      reminder_count: inv.reminder_count || 0,
      last_reminder_sent: inv.last_reminder_sent,
    }));

    res.json({ success: true, logs: transformedLogs, activeReminders });
  } catch (error: any) {
    console.error('Error getting reminder logs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all invoices (admin)
app.get('/api/admin/invoices', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        id, invoice_number, amount, status, due_date, created_at,
        clients!invoices_client_id_fkey(name, email),
        users!invoices_user_id_fkey(email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const transformedInvoices = (invoices || []).map((inv: any) => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      client_name: inv.clients?.name || 'Unknown',
      client_email: inv.clients?.email || '',
      amount: inv.amount,
      status: inv.status,
      due_date: inv.due_date,
      created_at: inv.created_at,
      user_email: inv.users?.email,
    }));

    res.json({ success: true, invoices: transformedInvoices });
  } catch (error: any) {
    console.error('Error getting invoices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update invoice status (admin)
app.put('/api/admin/invoices/:invoiceId/status', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { invoiceId } = req.params;
    const { status } = req.body;

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (status === 'paid') updateData.paid_at = new Date().toISOString();

    const { error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete invoice (admin)
app.delete('/api/admin/invoices/:invoiceId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { invoiceId } = req.params;

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Delete invoice items first
    await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
    // Delete email logs
    await supabase.from('email_logs').delete().eq('invoice_id', invoiceId);
    // Delete the invoice
    const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user role (admin)
app.put('/api/admin/users/:userId/role', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete user (admin)
app.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Note: This will fail if user has invoices/clients due to FK constraints
    // In production, you'd want to soft delete or cascade properly
    const { error } = await supabase.from('users').delete().eq('id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send password reset email (admin)
app.post('/api/admin/users/:userId/reset-password', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { email } = req.body;

    // Use Supabase Auth to send password reset
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`,
    });

    if (error) throw error;

    res.json({ success: true, message: 'Password reset email sent' });
  } catch (error: any) {
    console.error('Error sending password reset:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// AUTOMATED REMINDERS SYSTEM
// ============================================

// Process reminders - this can be called manually or via cron job
app.post('/api/reminders/process', async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const { getReminderEmailTemplate } = await import('./emailTemplates');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Get all unpaid invoices with reminders enabled
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        id, invoice_number, amount, due_date, status, 
        reminders_enabled, reminder_frequency, reminder_custom_interval, 
        reminder_tone, last_reminder_sent, reminder_count, user_id,
        access_token,
        clients!invoices_client_id_fkey(name, email),
        users!invoices_user_id_fkey(name, email, logo_url)
      `)
      .in('status', ['pending', 'sent', 'overdue'])
      .eq('reminders_enabled', true);

    if (error) {
      console.error('Error fetching invoices for reminders:', error);
      throw error;
    }

    const now = new Date();
    let remindersSent = 0;
    let remindersSkipped = 0;
    let remindersEligible = 0;

    for (const invoice of invoices || []) {
      // Calculate if reminder should be sent
      const lastSent = invoice.last_reminder_sent ? new Date(invoice.last_reminder_sent) : null;
      const dueDate = new Date(invoice.due_date);
      
      // Determine interval in days based on frequency
      let intervalDays = 7; // default weekly
      switch (invoice.reminder_frequency) {
        case 'daily': intervalDays = 1; break;
        case 'weekly': intervalDays = 7; break;
        case 'biweekly': intervalDays = 14; break;
        case 'custom': intervalDays = invoice.reminder_custom_interval || 3; break;
      }

      // Check if enough time has passed since last reminder
      const shouldSend = !lastSent || 
        (now.getTime() - lastSent.getTime()) >= (intervalDays * 24 * 60 * 60 * 1000);

      if (!shouldSend) {
        remindersSkipped++;
        continue;
      }

      remindersEligible++;

      // Get client and user info
      const clientEmail = (invoice.clients as any)?.email;
      const clientName = (invoice.clients as any)?.name || 'Client';
      const userName = (invoice.users as any)?.name || 'Your Service Provider';
      const userEmail = (invoice.users as any)?.email;
      const userLogo = (invoice.users as any)?.logo_url;

      if (!clientEmail) {
        remindersSkipped++;
        continue;
      }

      // Generate reminder message based on tone using HTML template
      const isOverdue = now > dueDate;
      const daysOverdue = isOverdue ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invoice/${invoice.id}?token=${invoice.access_token}`;
      
      // Generate beautiful HTML email
      const { subject, html } = getReminderEmailTemplate({
        recipientName: clientName,
        senderName: userName,
        senderEmail: userEmail,
        senderLogo: userLogo,
        invoiceNumber: invoice.invoice_number,
        amount: Number(invoice.amount),
        dueDate: dueDate.toLocaleDateString(),
        paymentLink: paymentLink,
        isOverdue: isOverdue,
        daysOverdue: daysOverdue,
        reminderCount: (invoice.reminder_count || 0) + 1,
      }, invoice.reminder_tone || 'professional');

      // Send the reminder email via Resend
      try {
        const resendApiKey = process.env.RESEND_API_KEY;
        
        if (resendApiKey) {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: `${userName || 'Invoices'} <${process.env.FROM_EMAIL || 'noreply@s8vr.app'}>`,
              to: [clientEmail],
              subject: subject,
              html: html,
              reply_to: userEmail,
            }),
          });

          if (!emailResponse.ok) {
            throw new Error('Failed to send email');
          }
        }

        // Update invoice with last reminder sent
        await supabase
          .from('invoices')
          .update({ 
            last_reminder_sent: now.toISOString(),
            reminder_count: (invoice.reminder_count || 0) + 1,
            updated_at: now.toISOString()
          })
          .eq('id', invoice.id);

        // Log the reminder
        await supabase
          .from('email_logs')
          .insert({
            invoice_id: invoice.id,
            type: 'reminder',
            message: `Reminder #${(invoice.reminder_count || 0) + 1} sent to ${clientEmail}`,
          });

        remindersSent++;
      } catch (emailError) {
        console.error(`❌ Failed to send reminder for invoice ${invoice.invoice_number}:`, emailError);
        
        // Log the failure
        await supabase
          .from('email_logs')
          .insert({
            invoice_id: invoice.id,
            type: 'reminder',
            message: `Reminder failed to send to ${clientEmail}`,
          });
      }
    }

    res.json({ 
      success: true, 
      remindersSent, 
      remindersSkipped,
      remindersEligible,
      totalInvoicesChecked: invoices?.length || 0,
      message: remindersSent > 0 
        ? `Processed ${remindersSent} reminders` 
        : remindersEligible > 0 
          ? `${remindersEligible} reminders eligible but already sent recently`
          : 'No invoices found with reminders enabled. Enable reminders on unpaid invoices first.'
    });
  } catch (error: any) {
    console.error('Error processing reminders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// TEMPLATES MANAGEMENT
// ============================================

// Marketing endpoint - Get users who have opted in for email notifications (admin only)
app.get('/api/marketing/email-list', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    // Query users who have email_notifications enabled
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, created_at, email_notifications')
      .eq('email_notifications', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching marketing email list:', error);
      return res.status(500).json({ error: 'Failed to fetch email list' });
    }

    // Return list of emails and user info for marketing campaigns
    const emailList = users?.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || 'No name',
      createdAt: user.created_at,
      optedIn: user.email_notifications
    })) || [];

    res.json({
      success: true,
      count: emailList.length,
      users: emailList,
      // Also provide just emails for easy CSV export
      emails: emailList.map(u => u.email)
    });
  } catch (error: any) {
    console.error('Marketing email list error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch marketing email list' });
  }
});

app.get('/api/admin/templates', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { data: templates, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      // If table doesn't exist, return default templates
      const defaultTemplates = [
        { id: '1', name: 'Minimal', description: 'Clean and simple design', is_premium: false, is_active: true },
        { id: '2', name: 'Corporate', description: 'Professional business look', is_premium: false, is_active: true },
        { id: '3', name: 'Startup', description: 'Modern tech-forward design', is_premium: false, is_active: true },
        { id: '4', name: 'Creative', description: 'Bold and artistic', is_premium: true, is_active: true },
        { id: '5', name: 'Tech', description: 'Digital-first appearance', is_premium: true, is_active: true },
        { id: '6', name: 'Elegant', description: 'Sophisticated and refined', is_premium: true, is_active: true },
        { id: '7', name: 'Agency', description: 'Creative agency style', is_premium: true, is_active: true },
        { id: '8', name: 'Modern', description: 'Contemporary minimal', is_premium: true, is_active: true },
        { id: '9', name: 'Classic', description: 'Timeless professional', is_premium: true, is_active: true },
        { id: '10', name: 'Consultant', description: 'Expert advisor look', is_premium: true, is_active: true },
      ];
      return res.json({ success: true, templates: defaultTemplates });
    }

    res.json({ success: true, templates: templates || [] });
  } catch (error: any) {
    console.error('Error getting templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create template
app.post('/api/admin/templates', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, description, is_premium } = req.body;

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { data: template, error } = await supabase
      .from('templates')
      .insert({ name, description, is_premium: is_premium || false, is_active: true })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, template });
  } catch (error: any) {
    console.error('Error creating template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update template
app.put('/api/admin/templates/:templateId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { templateId } = req.params;
    const updates = req.body;

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { error } = await supabase
      .from('templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', templateId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete template
app.delete('/api/admin/templates/:templateId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { templateId } = req.params;

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { error } = await supabase.from('templates').delete().eq('id', templateId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// USER BAN MANAGEMENT
// ============================================

// Ban user
app.post('/api/admin/users/:userId/ban', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const { email, reason } = req.body;

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Update user with ban status
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        is_banned: true, 
        banned_at: new Date().toISOString(),
        ban_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userError) throw userError;

    // Add email to banned_emails table to prevent re-registration
    const { error: banError } = await supabase
      .from('banned_emails')
      .upsert({ email, reason, banned_by: userId }, { onConflict: 'email' });

    // Don't throw if banned_emails table doesn't exist
    if (banError) {
      console.warn('Could not add to banned_emails table:', banError.message);
    }

    res.json({ success: true, message: 'User banned successfully' });
  } catch (error: any) {
    console.error('Error banning user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unban user
app.post('/api/admin/users/:userId/unban', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.body;

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Update user
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        is_banned: false, 
        banned_at: null,
        ban_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userError) throw userError;

    // Remove from banned_emails
    if (email) {
      await supabase.from('banned_emails').delete().eq('email', email);
    }

    res.json({ success: true, message: 'User unbanned successfully' });
  } catch (error: any) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// REMINDER LOG MANAGEMENT
// ============================================

// Delete reminder log
app.delete('/api/admin/reminder-logs/:reminderId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { reminderId } = req.params;

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { error } = await supabase.from('email_logs').delete().eq('id', reminderId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting reminder log:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit feedback (for users)
app.post('/api/feedback', async (req, res) => {
  try {
    const { userId, type, message } = req.body;

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { data, error } = await supabase
      .from('feedback')
      .insert({ user_id: userId, type, message })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, feedback: data });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── Config read/write endpoints ─────────────────────────────────���────────────
const BACKEND_ENV  = path.resolve(__dirname, '../.env');
const FRONTEND_ENV = path.resolve(__dirname, '../../.env');

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const result: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    result[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return result;
}

function writeEnvFile(filePath: string, values: Record<string, string>) {
  const lines = Object.entries(values).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
}

app.get('/api/config', (req, res) => {
  try {
    const be = parseEnvFile(BACKEND_ENV);
    const fe = parseEnvFile(FRONTEND_ENV);
    res.json({
      supabaseUrl:         be.SUPABASE_URL                 || fe.VITE_SUPABASE_URL        || '',
      supabaseAnonKey:     fe.VITE_SUPABASE_ANON_KEY       || '',
      supabaseServiceKey:  be.SUPABASE_SERVICE_ROLE_KEY    || '',
      databaseUrl:         be.DATABASE_URL                 || '',
      stripePublishableKey: fe.VITE_STRIPE_PUBLISHABLE_KEY || be.STRIPE_PUBLISHABLE_KEY   || '',
      stripeSecretKey:     be.STRIPE_SECRET_KEY            || '',
      stripeWebhookSecret: be.STRIPE_WEBHOOK_SECRET        || '',
      resendApiKey:        be.RESEND_API_KEY               || '',
      fromEmail:           be.FROM_EMAIL                   || '',
      appUrl:              be.FRONTEND_URL                 || '',
      backendUrl:          fe.VITE_API_URL                 || '',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/config', (req, res) => {
  try {
    const {
      supabaseUrl, supabaseAnonKey, supabaseServiceKey, databaseUrl,
      stripePublishableKey, stripeSecretKey, stripeWebhookSecret,
      resendApiKey, fromEmail, appUrl, backendUrl,
    } = req.body;

    const be = parseEnvFile(BACKEND_ENV);
    const fe = parseEnvFile(FRONTEND_ENV);

    if (supabaseUrl)          { be.SUPABASE_URL = supabaseUrl;                        fe.VITE_SUPABASE_URL = supabaseUrl; }
    if (supabaseAnonKey)      { fe.VITE_SUPABASE_ANON_KEY = supabaseAnonKey; }
    if (supabaseServiceKey)   { be.SUPABASE_SERVICE_ROLE_KEY = supabaseServiceKey; }
    if (databaseUrl)          { be.DATABASE_URL = databaseUrl; }
    if (stripePublishableKey) { be.STRIPE_PUBLISHABLE_KEY = stripePublishableKey;     fe.VITE_STRIPE_PUBLISHABLE_KEY = stripePublishableKey; }
    if (stripeSecretKey)      { be.STRIPE_SECRET_KEY = stripeSecretKey; }
    if (stripeWebhookSecret)  { be.STRIPE_WEBHOOK_SECRET = stripeWebhookSecret; }
    if (resendApiKey)         { be.RESEND_API_KEY = resendApiKey; }
    if (fromEmail)            { be.FROM_EMAIL = fromEmail; }
    if (appUrl)               { be.FRONTEND_URL = appUrl; }
    if (backendUrl)           { fe.VITE_API_URL = backendUrl; }

    writeEnvFile(BACKEND_ENV, be);
    writeEnvFile(FRONTEND_ENV, fe);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server with graceful shutdown
const server = app.listen(PORT);

// Graceful shutdown - prevents EADDRINUSE on nodemon restart
const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
  // Force close after 5 seconds
  setTimeout(() => {
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGUSR2', shutdown); // nodemon uses this

export default app;

