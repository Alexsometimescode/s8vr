# Stripe Connect Implementation Guide

## Quick Start: Adding Stripe Connect to s8vr

This guide walks you through implementing Stripe Connect for direct payments to freelancer accounts.

---

## Prerequisites

1. **Stripe Account**
   - Sign up at https://stripe.com
   - Get your API keys (test mode first)
   - Enable Stripe Connect in dashboard

2. **Backend Setup** (Choose one)
   - Node.js + Express (recommended)
   - Python + FastAPI
   - Go + Gin

3. **Database**
   - PostgreSQL (recommended)
   - Or MongoDB/Supabase

---

## Step-by-Step Implementation

### Step 1: Install Stripe SDK

**Node.js:**
```bash
npm install stripe
npm install @stripe/stripe-js  # For frontend
```

**Python:**
```bash
pip install stripe
```

### Step 2: Environment Variables

Create `.env` file:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://user:pass@localhost:5432/s8vr
JWT_SECRET=your-secret-key
```

### Step 3: Backend API - Connect Onboarding

**File: `backend/routes/stripe.js`**

```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Step 1: Create Connect Account
router.post('/connect/create-account', async (req, res) => {
  try {
    const { userId, email } = req.body;
    
    // Create Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // or get from user
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Save account_id to database
    await db.query(
      'UPDATE users SET stripe_account_id = $1 WHERE id = $2',
      [account.id, userId]
    );

    res.json({ accountId: account.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Step 2: Create Account Link (for onboarding)
router.post('/connect/create-account-link', async (req, res) => {
  try {
    const { accountId } = req.body;
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.FRONTEND_URL}/stripe/reauth`,
      return_url: `${process.env.FRONTEND_URL}/dashboard?connected=true`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Step 3: Check Account Status
router.get('/connect/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await db.query(
      'SELECT stripe_account_id FROM users WHERE id = $1',
      [userId]
    );

    if (!user.rows[0].stripe_account_id) {
      return res.json({ connected: false });
    }

    const account = await stripe.accounts.retrieve(
      user.rows[0].stripe_account_id
    );

    res.json({
      connected: account.details_submitted && account.charges_enabled,
      status: account.details_submitted ? 'active' : 'pending',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Step 4: Create Payment Intent with Connect

**File: `backend/routes/payments.js`**

```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Create payment intent for invoice
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { invoiceId } = req.body;
    
    // Get invoice and freelancer from database
    const invoice = await db.query(
      `SELECT i.*, u.stripe_account_id 
       FROM invoices i 
       JOIN users u ON i.user_id = u.id 
       WHERE i.id = $1`,
      [invoiceId]
    );

    if (!invoice.rows[0]) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoiceData = invoice.rows[0];
    const platformFee = Math.round(invoiceData.amount * 0.03 * 100); // 3% fee

    // Create payment intent with Connect
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(invoiceData.amount * 100), // Convert to cents
      currency: 'usd',
      application_fee_amount: platformFee, // Your platform fee
      transfer_data: {
        destination: invoiceData.stripe_account_id, // Direct to freelancer
      },
      metadata: {
        invoice_id: invoiceId,
        user_id: invoiceData.user_id,
        client_email: invoiceData.client_email,
      },
    });

    // Save payment_intent_id to invoice
    await db.query(
      'UPDATE invoices SET stripe_payment_intent_id = $1 WHERE id = $2',
      [paymentIntent.id, invoiceId]
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Step 5: Webhook Handler

**File: `backend/routes/webhooks.js`**

```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Stripe webhook endpoint
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      // Update invoice status
      await db.query(
        `UPDATE invoices 
         SET status = 'paid', 
             paid_at = NOW(),
             updated_at = NOW()
         WHERE stripe_payment_intent_id = $1`,
        [paymentIntent.id]
      );

      // Log activity
      const invoice = await db.query(
        'SELECT id FROM invoices WHERE stripe_payment_intent_id = $1',
        [paymentIntent.id]
      );

      await db.query(
        `INSERT INTO email_logs (invoice_id, type, message, created_at)
         VALUES ($1, 'paid', 'Payment received via Stripe', NOW())`,
        [invoice.rows[0].id]
      );

      // Send confirmation email to freelancer
      // TODO: Implement email service
      
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      
      await db.query(
        `UPDATE invoices 
         SET updated_at = NOW()
         WHERE stripe_payment_intent_id = $1`,
        [failedPayment.id]
      );
      
      // Log failure
      // TODO: Notify freelancer
      
      break;

    case 'account.updated':
      // Handle Connect account updates
      const account = event.data.object;
      
      await db.query(
        `UPDATE users 
         SET stripe_account_status = $1
         WHERE stripe_account_id = $2`,
        [account.details_submitted ? 'active' : 'pending', account.id]
      );
      
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;
```

### Step 6: Frontend Integration

**File: `components/app/StripeConnect.tsx`** (New Component)

```typescript
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Shared';
import { CreditCard, Check, Loader2 } from 'lucide-react';

interface StripeConnectProps {
  userId: string;
  onConnected?: () => void;
}

export const StripeConnect: React.FC<StripeConnectProps> = ({ userId, onConnected }) => {
  const [status, setStatus] = useState<'loading' | 'not_connected' | 'pending' | 'connected'>('loading');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkStatus();
  }, [userId]);

  const checkStatus = async () => {
    try {
      const res = await fetch(`/api/stripe/connect/status/${userId}`);
      const data = await res.json();
      
      if (data.connected) {
        setStatus('connected');
      } else if (data.status === 'pending') {
        setStatus('pending');
      } else {
        setStatus('not_connected');
      }
    } catch (error) {
      console.error('Failed to check Stripe status:', error);
      setStatus('not_connected');
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Step 1: Create account
      const accountRes = await fetch('/api/stripe/connect/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: 'user@example.com' }), // Get from auth
      });
      const { accountId } = await accountRes.json();

      // Step 2: Get onboarding link
      const linkRes = await fetch('/api/stripe/connect/create-account-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });
      const { url } = await linkRes.json();

      // Redirect to Stripe onboarding
      window.location.href = url;
    } catch (error) {
      console.error('Failed to connect Stripe:', error);
      alert('Failed to connect Stripe account. Please try again.');
      setConnecting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-textMuted">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking status...
      </div>
    );
  }

  if (status === 'connected') {
    return (
      <div className="flex items-center gap-2 text-emerald-500">
        <Check className="w-4 h-4" />
        <span>Stripe Connected</span>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="text-orange-500">
        Stripe account setup in progress...
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={connecting}
      icon={connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
    >
      {connecting ? 'Connecting...' : 'Connect Stripe Account'}
    </Button>
  );
};
```

### Step 7: Payment Button Integration

**Update: `components/app/InvoiceBuilder.tsx`**

Add Stripe Elements to the payment button:

```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY!);

// In ClientInvoiceView component:
const handlePay = async () => {
  setIsProcessing(true);
  
  try {
    // 1. Create payment intent
    const res = await fetch('/api/payments/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: invoice.id }),
    });
    
    const { clientSecret } = await res.json();
    
    // 2. Confirm payment with Stripe
    const stripe = await stripePromise;
    const { error, paymentIntent } = await stripe!.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement, // From Stripe Elements
      },
    });

    if (error) {
      alert(`Payment failed: ${error.message}`);
      setIsProcessing(false);
      return;
    }

    if (paymentIntent.status === 'succeeded') {
      setSuccess(true);
      setTimeout(() => {
        onPay();
      }, 2000);
    }
  } catch (error) {
    console.error('Payment error:', error);
    alert('Payment failed. Please try again.');
    setIsProcessing(false);
  }
};
```

---

## Testing Checklist

### Test Mode
1. ✅ Create Connect account
2. ✅ Complete onboarding flow
3. ✅ Create payment intent
4. ✅ Process test payment (use card: `4242 4242 4242 4242`)
5. ✅ Verify webhook received
6. ✅ Check invoice status updated
7. ✅ Verify payment appears in Stripe dashboard

### Production Checklist
- [ ] Switch to live API keys
- [ ] Set up production webhook endpoint
- [ ] Test with real bank account
- [ ] Verify platform fees are correct
- [ ] Test payment failures
- [ ] Test refunds (if needed)

---

## Common Issues & Solutions

### Issue: "Account not connected"
**Solution:** Ensure `stripe_account_id` is saved in database after onboarding.

### Issue: "Webhook not received"
**Solution:** 
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe-webhook`
- Verify webhook secret matches
- Check endpoint is accessible (use ngrok for local)

### Issue: "Payment failed"
**Solution:**
- Check account is fully onboarded (`details_submitted: true`)
- Verify account has `charges_enabled: true`
- Check payment method is valid
- Review Stripe dashboard logs

---

## Next Steps

1. **Implement Email Service**
   - Send invoice emails
   - Send payment confirmations
   - Send reminder emails

2. **Add Reminder Automation**
   - Background job system
   - Schedule reminder emails
   - Respect user preferences

3. **Add Analytics**
   - Track revenue
   - Track payment success rate
   - Generate reports

4. **Add Error Handling**
   - Retry failed payments
   - Handle webhook failures
   - Log errors properly

---

## Resources

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Stripe Connect Express Accounts](https://stripe.com/docs/connect/express-accounts)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)

---

**Need help?** Review the main CTO_ANALYSIS.md for architecture decisions and implementation strategy.

