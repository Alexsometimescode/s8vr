import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getReminderEmailTemplate, getInvoiceEmailTemplate, getWelcomeEmailTemplate } from './emailTemplates';

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
      stripeConnect: '/api/connect/*'
    }
  });
});

// --- STRIPE CONNECT ROUTES ---

// Step 1: Create Connect Account
app.post('/api/connect/create-account', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY.' });
    }

    const { userId, email } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user already has an account
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_account_id')
      .eq('id', userId)
      .single();

    if (userData?.stripe_account_id) {
       return res.json({ accountId: userData.stripe_account_id });
    }
    
    // Create Express account
    // Platform is in Czechia, so default to CZ for connected accounts
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'CZ', // Platform is in Czechia
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Save account_id to database
    await supabase
      .from('users')
      .update({ stripe_account_id: account.id })
      .eq('id', userId);

    res.json({ accountId: account.id });
  } catch (error: any) {
    console.error('Stripe Create Account Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Step 2: Create Account Link (for onboarding)
app.post('/api/connect/create-account-link', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY.' });
    }

    const { accountId } = req.body;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${frontendUrl}/dashboard`, // TODO: specific reauth page
      return_url: `${frontendUrl}/dashboard?connected=true`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Stripe Account Link Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Step 3: Check Account Status
app.get('/api/connect/status/:userId', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY.' });
    }

    const { userId } = req.params;
    
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_account_id, stripe_account_status')
      .eq('id', userId)
      .single();

    if (!userData || !userData.stripe_account_id) {
      return res.json({ connected: false });
    }

    const accountId = userData.stripe_account_id;

    // Retrieve account details from Stripe to verify status
    const account = await stripe.accounts.retrieve(accountId);

    const isConnected = account.details_submitted && account.charges_enabled;

    // Update DB if status changed
    if (isConnected && userData.stripe_account_status !== 'active') {
       await supabase
         .from('users')
         .update({ stripe_account_status: 'active' })
         .eq('id', userId);
    }

    res.json({
      connected: isConnected,
      accountId: accountId,
      status: account.details_submitted ? 'active' : 'pending',
    });
  } catch (error: any) {
    console.error('Stripe Status Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- PAYMENT ROUTES ---

// Create payment intent for invoice
app.post('/api/payments/create-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY.' });
    }

    const { invoiceId } = req.body;
    
    // Get invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoiceData) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get user (freelancer) Stripe account
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_account_id, email')
      .eq('id', invoiceData.user_id)
      .single();

    const stripeAccountId = userData?.stripe_account_id;
    if (!stripeAccountId) {
      return res.status(400).json({ error: 'Freelancer is not connected to Stripe' });
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

    const amountInCents = Math.round(Number(invoiceData.amount) * 100);
    const platformFee = Math.round(amountInCents * 0.03); // 3% fee
    const transferAmount = amountInCents - platformFee; // Amount to transfer to connected account

    // Use "Separate Charges and Transfers" pattern
    // This works for both same-region and cross-border scenarios
    // 1. Charge happens on platform account
    // 2. After successful payment, webhook triggers transfer to connected account
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        invoice_id: invoiceId,
        user_id: invoiceData.user_id,
        client_email: clientEmail,
        connected_account_id: stripeAccountId,
        transfer_amount: transferAmount.toString(),
      },
    });

    // Save payment_intent_id to invoice
    await supabase
      .from('invoices')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', invoiceId);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      stripeAccountId: stripeAccountId, // Needed for frontend Stripe Elements
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
      invoiceId
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

    // Use FRONTEND_URL from env (for local dev: http://localhost:3000)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Generate links with secure token
    const invoiceViewLink = `${frontendUrl}/invoice/${invoiceId || invoiceNumber}?token=${accessToken}`;
    const paymentLink = `${frontendUrl}/pay/${invoiceId || invoiceNumber}?token=${accessToken}`;
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
    });

    // Determine sender based on user plan
    // Free users: Invoices@s8vr.app
    // Premium users: User's name as display name
    const senderName = isPremium ? (fromName || 's8vr') : 's8vr Invoices';
    const senderEmail = 'invoices@s8vr.app'; // Verified domain

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

    console.log('Invoice email sent successfully:', data?.id);
    // Return access token so frontend can store it with the invoice
    res.json({ success: true, id: data?.id, accessToken });

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

    // Get the invoice with access token
    const { data, error } = await supabase
      .from('invoices')
      .select('id, access_token')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Construct the full payment link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${frontendUrl}/invoice/${data.id}?token=${data.access_token}`;

    res.json({ success: true, link });

  } catch (error: any) {
    console.error('Error getting payment link:', error);
    res.status(500).json({ success: false, error: 'Failed to get payment link' });
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

  console.log(`📩 Webhook received: ${event.type}`);

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`✅ Payment succeeded: ${paymentIntent.id}`);
      
      // Transfer funds to connected account if specified
      const connectedAccountId = paymentIntent.metadata?.connected_account_id;
      const transferAmount = paymentIntent.metadata?.transfer_amount;
      
      if (connectedAccountId && transferAmount && stripe) {
        try {
          // Create transfer to connected account
          const transfer = await stripe.transfers.create({
            amount: parseInt(transferAmount),
            currency: 'usd',
            destination: connectedAccountId,
            transfer_group: paymentIntent.id,
            metadata: {
              payment_intent_id: paymentIntent.id,
              invoice_id: paymentIntent.metadata?.invoice_id || '',
            },
          });
          console.log(`💸 Transfer created: ${transfer.id} - $${(parseInt(transferAmount) / 100).toFixed(2)} to ${connectedAccountId}`);
        } catch (transferError: any) {
          console.error('Transfer failed:', transferError.message);
          // Payment succeeded but transfer failed - log this for manual resolution
        }
      }
      
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
        console.log(`📋 Invoice ${data.id} marked as paid`);
        
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
      console.log(`❌ Payment failed: ${paymentIntent.id}`);
      
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

    case 'account.updated': {
      // Handle Connect account updates
      const account = event.data.object as Stripe.Account;
      console.log(`👤 Account updated: ${account.id}`);
      
      const newStatus = account.details_submitted && account.charges_enabled ? 'active' : 'pending';
      
      await supabase
        .from('users')
        .update({ stripe_account_status: newStatus })
        .eq('stripe_account_id', account.id);
      
      console.log(`📊 Account ${account.id} status: ${newStatus}`);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// ============================================
// ADMIN DASHBOARD ENDPOINTS
// ============================================

// Get admin stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Get user counts
    const { data: users } = await supabase.from('users').select('id, plan, stripe_account_status, created_at');
    const totalUsers = users?.length || 0;
    const proUsers = users?.filter(u => u.plan === 'pro').length || 0;
    const connectedStripeAccounts = users?.filter(u => u.stripe_account_status === 'active').length || 0;
    
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
        connectedStripeAccounts,
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
app.get('/api/admin/users', async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, plan, role, stripe_account_status, created_at, is_banned, ban_reason')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, users: users || [] });
  } catch (error: any) {
    console.error('Error getting users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user plan
app.put('/api/admin/users/:userId/plan', async (req, res) => {
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
app.get('/api/admin/feedback', async (req, res) => {
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
app.put('/api/admin/feedback/:feedbackId/status', async (req, res) => {
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
app.get('/api/admin/reminder-logs', async (req, res) => {
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
app.get('/api/admin/invoices', async (req, res) => {
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
app.put('/api/admin/invoices/:invoiceId/status', async (req, res) => {
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
app.delete('/api/admin/invoices/:invoiceId', async (req, res) => {
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
app.put('/api/admin/users/:userId/role', async (req, res) => {
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
app.delete('/api/admin/users/:userId', async (req, res) => {
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
app.post('/api/admin/users/:userId/reset-password', async (req, res) => {
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

    console.log('🔔 Processing invoice reminders...');

    // First, get all unpaid invoices to see what's available
    const { data: allInvoices, error: allError } = await supabase
      .from('invoices')
      .select('id, invoice_number, status, reminders_enabled')
      .in('status', ['pending', 'sent', 'overdue']);

    console.log(`📋 Found ${allInvoices?.length || 0} unpaid invoices total`);
    console.log(`📋 Invoices with reminders enabled: ${allInvoices?.filter(i => i.reminders_enabled).length || 0}`);

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

    console.log(`📋 Found ${invoices?.length || 0} invoices eligible for reminders`);

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
        console.log(`⏭️ Skipping invoice ${invoice.invoice_number}: Not due for reminder yet (interval: ${intervalDays} days)`);
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
        console.log(`⏭️ Skipping invoice ${invoice.invoice_number}: No client email`);
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
              from: 'S8VR <noreply@s8vr.app>',
              to: [clientEmail],
              subject: subject,
              html: html,
              reply_to: userEmail,
            }),
          });

          if (!emailResponse.ok) {
            throw new Error('Failed to send email');
          }

          console.log(`✅ Reminder sent for invoice ${invoice.invoice_number} to ${clientEmail}`);
        } else {
          console.log(`📧 [DEV MODE] Would send reminder for invoice ${invoice.invoice_number} to ${clientEmail}`);
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

    console.log(`🔔 Reminder processing complete: ${remindersSent} sent, ${remindersSkipped} skipped, ${remindersEligible} were eligible`);

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

// Get all templates
app.get('/api/admin/templates', async (req, res) => {
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
      console.log('Templates table not found, returning defaults');
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
app.post('/api/admin/templates', async (req, res) => {
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
app.put('/api/admin/templates/:templateId', async (req, res) => {
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
app.delete('/api/admin/templates/:templateId', async (req, res) => {
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
app.post('/api/admin/users/:userId/ban', async (req, res) => {
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
app.post('/api/admin/users/:userId/unban', async (req, res) => {
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
app.delete('/api/admin/reminder-logs/:reminderId', async (req, res) => {
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
const server = app.listen(PORT, () => {
  console.log(`🚀 s8vr backend server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Graceful shutdown - prevents EADDRINUSE on nodemon restart
const shutdown = () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  // Force close after 5 seconds
  setTimeout(() => {
    console.log('⚠️ Forcing shutdown');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGUSR2', shutdown); // nodemon uses this

export default app;

