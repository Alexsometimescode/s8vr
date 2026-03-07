# S8VR - Getting Started Guide

> **Smart Invoicing & Reminder Tool for Freelancers**  
> Last Updated: December 15, 2025

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Architecture](#-architecture)
4. [Getting Started](#-getting-started)
5. [Environment Variables](#-environment-variables)
6. [Database Schema](#-database-schema)
7. [API Endpoints](#-api-endpoints)
8. [Stripe Integration](#-stripe-integration)
9. [Testing Guide](#-testing-guide)
10. [Troubleshooting](#-troubleshooting)
11. [Known Issues & Solutions](#-known-issues--solutions)
12. [Development Workflow](#-development-workflow)

---

## 🎯 Project Overview

### What is S8VR?

S8VR is a minimal, smart invoicing + reminder tool built for **freelancers** to:

- ✅ Create professional invoices for their services
- ✅ Have an overview of all invoices and payments
- ✅ Set up automated reminders for clients who don't respond
- ✅ Receive payments directly via **Stripe Connect** (freelancer's own account)
- ✅ Track financial metrics with visual reports

### Core Features

| Feature | Status | Description |
|---------|--------|-------------|
| Authentication | ✅ Complete | Supabase Auth with email/password |
| Profile Management | ✅ Complete | Name, avatar, company logo |
| Invoice Creation | ✅ Complete | 10 premium templates, line items |
| Invoice Sending | ✅ Complete | Email notifications with payment link |
| Stripe Connect | ✅ Complete | Direct payments to freelancer's account |
| Payment Processing | ✅ Complete | Secure Stripe Elements checkout |
| Client Management | ✅ Complete | Add, edit, delete clients |
| Dashboard | ✅ Complete | At-a-glance metrics and stats |
| Reports | ✅ Complete | Charts, CSV export |
| Reminders | ✅ Complete | Automated email follow-ups with configurable frequency/tone |
| Admin Dashboard | ✅ Complete | Platform statistics, user management, feedback, reminders |

### User Types

| User Type | Description |
|-----------|-------------|
| **Free Plan** | 3 invoices/month, 3 templates |
| **Pro Plan** | Unlimited invoices, all 10 templates, advanced reports |
| **Admin** | Full platform access, user management |

---

## 🔧 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.1 | UI framework |
| TypeScript | 5.8.2 | Type safety |
| Vite | 6.2.0 | Build tool & dev server |
| Tailwind CSS | (via config) | Styling |
| Recharts | 3.5.1 | Charts & graphs |
| Lucide React | 0.554.0 | Icon library |
| @stripe/react-stripe-js | 5.4.1 | Stripe Elements |
| @stripe/stripe-js | 8.5.3 | Stripe SDK |
| @supabase/supabase-js | 2.87.1 | Database client |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x | Runtime |
| Express | 4.18.2 | API framework |
| TypeScript | 5.3.3 | Type safety |
| Stripe | 14.21.0 | Payment processing |
| @supabase/supabase-js | 2.87.1 | Database client |
| bcrypt | 5.1.1 | Password hashing |
| jsonwebtoken | 9.0.2 | JWT auth |
| nodemon | 3.0.2 | Dev hot reload |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **Supabase** | PostgreSQL database, Auth, Row Level Security |
| **Stripe Connect** | Payment processing, connected accounts |
| **Resend** | Email delivery (planned) |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   React     │  │   Stripe    │  │     Supabase Client     │ │
│  │   Frontend  │  │   Elements  │  │   (Auth + Realtime)     │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
└─────────┼────────────────┼─────────────────────┼───────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────┐  ┌─────────────┐  ┌─────────────────────────┐
│  Backend API    │  │   Stripe    │  │       Supabase          │
│  (Express.js)   │◄─┤   API       │  │  ┌─────────────────┐    │
│  localhost:3001 │  │             │  │  │   PostgreSQL    │    │
└────────┬────────┘  └─────────────┘  │  │   (with RLS)    │    │
         │                            │  └─────────────────┘    │
         └────────────────────────────┤  ┌─────────────────┐    │
                                      │  │   Auth          │    │
                                      │  └─────────────────┘    │
                                      └─────────────────────────┘
```

### Data Flow

1. **Authentication**: User signs up/logs in via Supabase Auth
2. **Invoice Creation**: Frontend creates invoice → Supabase DB
3. **Payment Flow**:
   - Client clicks "Pay Now" on invoice link
   - Frontend requests PaymentIntent from Backend
   - Backend creates PaymentIntent via Stripe API
   - Client enters card details in Stripe Elements (100% secure)
   - Payment succeeds → Invoice marked as paid
4. **Stripe Connect**: Freelancer connects their Stripe account to receive payments directly

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Git
- Supabase account (free tier works)
- Stripe account (test mode)

### Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd s8vr-App

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd backend
npm install
cd ..

# 4. Set up environment variables (see next section)
cp .env.example .env
cp backend/env.example backend/.env

# 5. Start the development servers

# Terminal 1: Frontend (runs on port 3000)
npm run dev

# Terminal 2: Backend (runs on port 3001)
cd backend
npm run dev
```

### Verify Installation

1. Open http://localhost:3000 - Should see landing page
2. Open http://localhost:3001/health - Should return `{ "status": "ok" }`

---

## 🔐 Environment Variables

### Frontend (.env)

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_SUPABASE_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# Backend API URL
VITE_API_URL=http://localhost:3001
```

### Backend (backend/.env)

```env
# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://YOUR_SUPABASE_PROJECT_ID.supabase.co
VITE_SUPABASE_URL=https://YOUR_SUPABASE_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret (optional for local dev)

# Email (Resend)
RESEND_API_KEY=re_your_key_here
```

### Where to Get These Keys

| Key | Location |
|-----|----------|
| SUPABASE_URL | Supabase Dashboard → Project Settings → API |
| SUPABASE_ANON_KEY | Supabase Dashboard → Project Settings → API |
| SUPABASE_SERVICE_ROLE_KEY | Supabase Dashboard → Project Settings → API |
| STRIPE_SECRET_KEY | Stripe Dashboard → Developers → API Keys |
| STRIPE_PUBLISHABLE_KEY | Stripe Dashboard → Developers → API Keys |
| STRIPE_WEBHOOK_SECRET | Stripe Dashboard → Developers → Webhooks |
| RESEND_API_KEY | Resend Dashboard → API Keys |

---

## 📊 Database Schema

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │   clients    │       │   invoices   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │◄──────│ user_id (FK) │       │ id (PK)      │
│ email        │       │ id (PK)      │◄──────│ client_id    │
│ password_hash│       │ name         │       │ user_id (FK) │───►
│ name         │       │ email        │       │ invoice_number│
│ plan         │       │ phone        │       │ status       │
│ role         │       │ website      │       │ issue_date   │
│ avatar_url   │       │ contact_person│      │ due_date     │
│ logo_url     │       │ active       │       │ amount       │
│ stripe_account_id    │ created_at   │       │ theme        │
│ stripe_account_status│ updated_at   │       │ access_token │
│ created_at   │       └──────────────┘       │ reminders_*  │
│ updated_at   │                              │ created_at   │
└──────────────┘                              │ updated_at   │
                                              └──────────────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │invoice_items │
                                              ├──────────────┤
                                              │ id (PK)      │
                                              │ invoice_id(FK)│
                                              │ description  │
                                              │ amount       │
                                              │ order_index  │
                                              └──────────────┘
```

### Table Details

#### users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, auto-generated |
| email | VARCHAR | Unique, user's email |
| password_hash | VARCHAR | bcrypt hashed password |
| name | VARCHAR | Display name |
| plan | VARCHAR | 'free' or 'pro' |
| role | VARCHAR | 'user' or 'admin' |
| avatar_url | TEXT | Base64 or URL of avatar |
| logo_url | TEXT | Base64 or URL of company logo |
| stripe_account_id | VARCHAR | Connected Stripe account ID |
| stripe_account_status | VARCHAR | 'pending' or 'active' |
| created_at | TIMESTAMP | Auto-set on creation |
| updated_at | TIMESTAMP | Auto-updated |

#### clients
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users.id |
| name | VARCHAR | Client name |
| email | VARCHAR | Client email |
| phone | VARCHAR | Optional phone |
| website | VARCHAR | Optional website |
| contact_person | VARCHAR | Optional contact name |
| active | BOOLEAN | Default true |

#### invoices
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users.id |
| client_id | UUID | FK to clients.id |
| invoice_number | VARCHAR | e.g., "2512-1234" |
| status | VARCHAR | draft, pending, paid, overdue, ghosted |
| issue_date | DATE | Invoice date |
| due_date | DATE | Payment due date |
| amount | NUMERIC | Total amount |
| theme | VARCHAR | Invoice template theme |
| access_token | TEXT | Secure token for payment link |
| stripe_payment_intent_id | VARCHAR | Stripe PaymentIntent ID |
| reminders_enabled | BOOLEAN | Auto-reminders on/off |
| reminder_frequency | VARCHAR | weekly, biweekly, daily, custom |
| reminder_tone | VARCHAR | friendly, formal, professional, urgent, casual |
| reminder_time | TIME | Time to send reminders |

#### invoice_items
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| invoice_id | UUID | FK to invoices.id |
| description | TEXT | Line item description |
| amount | NUMERIC | Line item amount |
| order_index | INTEGER | Display order |

### Row Level Security (RLS)

All tables have RLS enabled. Users can only access their own data:

```sql
-- Example RLS Policy for invoices
CREATE POLICY "Users can only view their own invoices"
ON invoices FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can only create their own invoices"
ON invoices FOR INSERT
WITH CHECK (user_id = auth.uid());
```

---

## 🔌 API Endpoints

### Base URL
- Local: `http://localhost:3001`
- Production: `https://api.s8vr.app` (planned)

### Authentication

Currently using Supabase Auth directly. Backend endpoints use service role key.

### Stripe Connect Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/connect/create-account` | Create Stripe Express account |
| POST | `/api/connect/create-account-link` | Get Stripe onboarding URL |
| GET | `/api/connect/status/:userId` | Check Stripe connection status |

#### Create Account
```javascript
// Request
POST /api/connect/create-account
{
  "userId": "uuid",
  "email": "user@example.com"
}

// Response
{
  "accountId": "acct_xxx",
  "message": "Account created"
}
```

### Payment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-intent` | Create PaymentIntent for invoice |
| GET | `/api/invoice/:id/public` | Get public invoice data |
| POST | `/api/invoice/:id/pay` | Mark invoice as paid |

#### Create Payment Intent
```javascript
// Request
POST /api/payments/create-intent
{
  "invoiceId": "uuid",
  "token": "access_token_from_url"
}

// Response
{
  "clientSecret": "pi_xxx_secret_xxx",
  "stripeAccountId": "acct_xxx"
}
```

### Webhook Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/stripe` | Handle Stripe webhook events |

Handled events:
- `payment_intent.succeeded` - Mark invoice as paid
- `payment_intent.payment_failed` - Log failure
- `account.updated` - Update Stripe connection status

---

## 💳 Stripe Integration

### Architecture: Separate Charges and Transfers

We use the **Separate Charges and Transfers** pattern:

```
1. Platform creates PaymentIntent on platform's Stripe account
2. Customer pays via Stripe Elements
3. Payment succeeds → Webhook fires
4. Platform transfers funds to connected account (minus platform fee)
```

This pattern was chosen because:
- ✅ Works for cross-border payments
- ✅ Platform can be in different country than connected accounts
- ✅ More control over fund flow
- ✅ Can hold funds if needed (e.g., disputes)

### Payment Flow Diagram

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Client  │    │ Frontend│    │ Backend │    │ Stripe  │
└────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
     │              │              │              │
     │ Click Pay    │              │              │
     │─────────────►│              │              │
     │              │ Create Intent│              │
     │              │─────────────►│              │
     │              │              │ PaymentIntent│
     │              │              │─────────────►│
     │              │              │◄─────────────│
     │              │◄─────────────│ clientSecret │
     │ Enter Card   │              │              │
     │─────────────►│              │              │
     │              │ confirmPayment             │
     │              │────────────────────────────►│
     │              │◄────────────────────────────│
     │              │              │   Webhook    │
     │              │              │◄─────────────│
     │              │              │ Update DB    │
     │              │              │ Transfer $   │
     │              │              │─────────────►│
     │ Success!     │              │              │
     │◄─────────────│              │              │
```

### Test Cards

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Decline |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0027 6000 3184 | Requires authentication |

**For all test cards:**
- Expiry: Any future date (e.g., 12/26)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

### Stripe Elements Styling

The payment form uses Stripe Elements with custom styling to match our brand:

```javascript
appearance: {
  theme: 'night',
  variables: {
    colorPrimary: '#10b981',        // Emerald
    colorBackground: '#18181b',      // Zinc-900
    colorText: '#fafafa',
    colorDanger: '#ef4444',
    borderRadius: '12px',
  }
}
```

---

## 🧪 Testing Guide

### Manual Testing Checklist

#### Authentication
- [ ] Sign up with new email
- [ ] Login with existing credentials
- [ ] Logout properly clears session
- [ ] Protected routes redirect to login

#### Invoice Creation
- [ ] Create invoice with single item
- [ ] Create invoice with multiple items
- [ ] Template selection works (free vs premium)
- [ ] Client selection from dropdown
- [ ] New client creation inline
- [ ] Date pickers work correctly
- [ ] Amount calculations are correct

#### Payment Flow
- [ ] Client can access invoice via link
- [ ] Payment form loads correctly
- [ ] Test card payment succeeds
- [ ] Invoice status updates to "paid"
- [ ] Dashboard stats update

#### Stripe Connect
- [ ] Connect button initiates flow
- [ ] Redirect to Stripe onboarding
- [ ] Return URL works correctly
- [ ] Status updates after completion

### Test Data

Create test invoices using these scenarios:

| Scenario | Amount | Status | Purpose |
|----------|--------|--------|---------|
| Small invoice | $100 | Pending | Basic payment test |
| Large invoice | $5,000 | Pending | Verify large amounts |
| Overdue invoice | $500 | Overdue | Test reminder logic |
| Paid invoice | $1,000 | Paid | Verify paid UI |

### Browser Testing

Test in these browsers:
- Chrome (primary)
- Firefox
- Safari
- Edge
- Mobile Safari/Chrome

---

## 🔧 Troubleshooting

### Common Errors & Solutions

#### 1. "Infinite recursion detected in RLS policy"

**Symptom**: Database queries fail with recursion error

**Solution**:
```sql
-- Run FIX_DATABASE.sql or:
DROP POLICY IF EXISTS "policy_name" ON table_name;
-- Recreate without recursive references
```

#### 2. "EADDRINUSE: address already in use :::3001"

**Symptom**: Backend won't start

**Solution**:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3001
kill -9 <PID>
```

#### 3. "Invalid API Key provided"

**Symptom**: Stripe operations fail

**Solution**:
1. Check `STRIPE_SECRET_KEY` in backend/.env
2. Make sure it starts with `sk_test_` (test) or `sk_live_` (production)
3. Restart backend server after changing

#### 4. "Cannot create a destination charge for connected accounts"

**Symptom**: Payment fails with cross-border error

**Solution**: 
- We use "Separate Charges and Transfers" pattern
- Ensure backend creates PaymentIntent without `transfer_data`
- Transfer happens in webhook after payment succeeds

#### 5. Invoice shows as unpaid after payment

**Symptom**: Payment succeeds but status doesn't update

**Solution**:
- Webhooks don't work in local dev without Stripe CLI
- We added a fallback that updates status immediately after payment
- If still failing, manually update in Supabase:
```sql
UPDATE invoices SET status = 'paid', paid_at = NOW() WHERE id = 'invoice-id';
```

#### 6. "Stripe not connected" error

**Symptom**: User can't create invoices/accept payments

**Solution**:
1. User must connect Stripe account first
2. Go to Profile → Connect Stripe Account
3. Complete Stripe onboarding
4. Wait for `stripe_account_status` to become 'active'

### Debug Checklist

When debugging issues:

1. **Check Browser Console** (F12 → Console)
   - JavaScript errors
   - Network request failures

2. **Check Backend Logs** (Terminal running backend)
   - API errors
   - Database errors
   - Stripe API errors

3. **Check Supabase Dashboard**
   - Table Editor → Verify data
   - Logs → Check for errors

4. **Check Stripe Dashboard**
   - Payments → Payment attempts
   - Developers → Logs → API errors
   - Connect → Connected accounts status

---

## ⚠️ Known Issues & Solutions

### Current Known Issues

| Issue | Impact | Workaround | Status |
|-------|--------|------------|--------|
| Webhooks don't work locally | Invoice status may not update | Fallback updates status immediately | ✅ Fixed |
| Cross-border payments | Previously blocked | Using Separate Charges pattern | ✅ Fixed |
| Large file uploads | Avatar/logo uploads may fail | Use compressed images | 🔄 Monitoring |
| Email sending | Not fully implemented | Manual notification needed | ⏳ Pending |

### Historical Issues (Resolved)

| Issue | Root Cause | Solution | Date Fixed |
|-------|------------|----------|------------|
| RLS infinite recursion | Self-referential policy | Simplified RLS policies | Dec 13, 2025 |
| Stripe destination charge error | Cross-border restriction | Switched to Separate Charges | Dec 15, 2025 |
| Backend port conflicts | Previous process not killed | Added kill command to start script | Dec 14, 2025 |
| Invalid Stripe API key | Malformed key in .env | Updated with correct key | Dec 15, 2025 |

---

## 📁 Project Structure

```
s8vr-App/
├── App.tsx                    # Main app entry, routing
├── index.tsx                  # React DOM render
├── index.html                 # HTML template
├── types.ts                   # TypeScript type definitions
├── vite.config.ts             # Vite configuration
├── package.json               # Frontend dependencies
├── tsconfig.json              # TypeScript config
│
├── components/
│   ├── app/
│   │   ├── Dashboard.tsx      # Main dashboard with all tabs
│   │   ├── InvoiceBuilder.tsx # Invoice creation & templates
│   │   ├── InvoiceList.tsx    # Invoice list helper (unused)
│   │   ├── ClientInvoicePage.tsx # Public invoice payment page
│   │   ├── ProfileTab.tsx     # User profile management
│   │   └── StripeConnect.tsx  # Stripe Connect integration
│   ├── auth/
│   │   ├── Login.tsx          # Login form
│   │   └── SignUp.tsx         # Sign up form
│   ├── ui/
│   │   ├── Shared.tsx         # Button, Logo, Navbar components
│   │   ├── Modal.tsx          # Modal & ConfirmModal
│   │   └── Skeleton.tsx       # Loading skeletons
│   └── LandingPage.tsx        # Public landing page
│
├── src/
│   └── lib/
│       ├── supabase.ts        # Supabase client config
│       ├── auth.ts            # Auth functions
│       ├── invoices.ts        # Invoice CRUD
│       ├── clients.ts         # Client CRUD
│       ├── email.ts           # Email functions (planned)
│       └── feedback.ts        # Feedback submission
│
├── backend/
│   ├── src/
│   │   ├── server.ts          # Express server & all endpoints
│   │   └── db/
│   │       └── connection.ts  # Database connection
│   ├── migrations/            # SQL migration files
│   ├── package.json           # Backend dependencies
│   ├── tsconfig.json          # TypeScript config
│   └── env.example            # Environment template
│
└── supabase/
    └── functions/
        └── send-invoice/      # Edge function for emails
            └── index.ts
```

### Key Files to Know

| File | Purpose | When to Modify |
|------|---------|----------------|
| `App.tsx` | Routing & view state | Adding new pages |
| `Dashboard.tsx` | All dashboard tabs | Modifying dashboard UI |
| `InvoiceBuilder.tsx` | Invoice creation | Changing invoice templates |
| `ClientInvoicePage.tsx` | Payment page | Modifying payment flow |
| `backend/src/server.ts` | All API endpoints | Adding/changing APIs |
| `types.ts` | Type definitions | Adding new data types |
| `src/lib/*.ts` | Database operations | Changing DB logic |

---

## 🔄 Development Workflow

### Making Changes

1. **Frontend Changes**
   ```bash
   # Frontend auto-reloads on save
   npm run dev
   ```

2. **Backend Changes**
   ```bash
   # Backend auto-restarts via nodemon
   cd backend && npm run dev
   ```

3. **Database Changes**
   - Create migration file in `backend/migrations/`
   - Run via Supabase MCP or Dashboard
   - **IMPORTANT**: Restart backend after DB changes

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
# ...

# Commit with descriptive message
git add .
git commit -m "feat: add payment link copy button"

# Push and create PR
git push origin feature/your-feature
```

### Deployment Checklist

Before deploying to production:

- [ ] All environment variables set
- [ ] Stripe in live mode (not test)
- [ ] CORS configured for production domain
- [ ] RLS policies verified
- [ ] SSL certificate configured
- [ ] Webhook endpoint registered in Stripe
- [ ] Error monitoring set up

---

## 📞 Support & Resources

### Documentation Links

- [Supabase Docs](https://supabase.com/docs)
- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)

### Project Resources

| Resource | Link |
|----------|------|
| Supabase Project | https://supabase.com/dashboard/project/YOUR_SUPABASE_PROJECT_ID |
| Stripe Dashboard | https://dashboard.stripe.com |
| Repository | (your repo URL) |

---

---

## 🔐 Admin Dashboard

The Admin Dashboard provides platform-wide management capabilities for administrators.

### Accessing Admin Dashboard

1. User must have `role = 'admin'` in the `users` table
2. Click "Admin Panel" button in the sidebar (only visible to admins)

### Admin Features

| Tab | Functionality |
|-----|---------------|
| **Overview** | Platform statistics, charts, key metrics |
| **Users** | View all users, change plans (Free/Pro), view details |
| **Feedback** | Review user feedback, update status (pending/reviewed/resolved) |
| **Reminders** | Monitor reminder activity, manually trigger reminders |

### Admin API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/stats` | GET | Get platform statistics |
| `/api/admin/users` | GET | List all users |
| `/api/admin/users/:id/plan` | PUT | Update user plan |
| `/api/admin/feedback` | GET | List all feedback |
| `/api/admin/feedback/:id/status` | PUT | Update feedback status |
| `/api/admin/reminder-logs` | GET | Get reminder activity logs |

### Making a User Admin

```sql
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

---

## 🔔 Automated Reminders System

S8VR includes a powerful automated reminder system for unpaid invoices.

### How It Works

1. **Per-Invoice Settings**: Each invoice has configurable reminder settings:
   - `reminders_enabled` - Toggle reminders on/off
   - `reminder_frequency` - weekly, biweekly, daily, or custom
   - `reminder_custom_interval` - Days between reminders (for custom)
   - `reminder_tone` - friendly, formal, professional, urgent, casual
   - `reminder_time` - Preferred send time

2. **Reminder Processing**: 
   - Can be triggered manually from Admin Dashboard
   - Can be set up as a cron job for production

### Reminder Tones

| Tone | Description |
|------|-------------|
| **Friendly** | Warm, casual tone with exclamation marks |
| **Formal** | Professional business language |
| **Professional** | Balanced and courteous |
| **Urgent** | Emphasizes importance and deadlines |
| **Casual** | Relaxed, conversational style |

### API Endpoint

```bash
# Trigger reminder processing
POST /api/reminders/process

# Response
{
  "success": true,
  "remindersSent": 5,
  "remindersSkipped": 2,
  "message": "Processed 5 reminders"
}
```

### Setting Up Automated Reminders (Production)

For production, set up a cron job or scheduled task to call the reminder endpoint:

```bash
# Using cron (every day at 9 AM)
0 9 * * * curl -X POST https://your-backend-url.com/api/reminders/process

# Using a cloud scheduler (AWS EventBridge, Google Cloud Scheduler, etc.)
```

### Reminder Tracking

- `last_reminder_sent` - Timestamp of last reminder
- `reminder_count` - Total reminders sent for this invoice
- `email_logs` table - Full history of all emails sent

---

## 📧 Email Templates

S8VR uses beautiful, branded HTML email templates that match the app's dark theme with emerald accents.

### Template Types

| Template | Purpose | Features |
|----------|---------|----------|
| **Reminder Email** | Payment reminders | Tone variants (friendly, formal, urgent, casual, professional), overdue styling |
| **Invoice Email** | Initial invoice send | Amount, due date, line items, secure payment button |
| **Welcome Email** | New user registration | Feature highlights, getting started CTA |
| **Password Reset** | Password recovery | Secure reset link, expiry warning |

### Email Template Location

Templates are defined in `backend/src/emailTemplates.ts`:

```typescript
// Available exports
getReminderEmailTemplate(data, tone)  // Reminder emails with tone variants
getWelcomeEmailTemplate(data)         // Welcome/registration email
getInvoiceEmailTemplate(data)         // Invoice notification email
getPasswordResetEmailTemplate(data)   // Password reset email
```

### Template Styling

All templates follow the brand:
- Dark background (`#09090b` / `#18181b`)
- Emerald accent (`#10b981`)
- Inter-like font family
- Rounded cards and buttons
- Mobile responsive
- Secure payment badges

---

## 📝 Changelog

### December 15, 2025 (Latest)
- ✅ Stripe Connect integration complete
- ✅ Payment flow working with Separate Charges pattern
- ✅ Fixed cross-border payment issues
- ✅ Added payment link copy functionality
- ✅ Created comprehensive documentation
- ✅ **Admin Dashboard** with full management capabilities:
  - User management (view, edit plan/role, reset password, delete)
  - Invoice management (view, change status, delete)
  - Feedback management (view, update status)
  - Template management (view all templates)
  - Reminder processing and monitoring
  - Platform statistics and charts
- ✅ **Automated Reminders** with beautiful branded HTML emails
- ✅ **Email Templates** matching brand theme (dark + emerald)
- ✅ Fixed feedback submission and RLS policies
- ✅ Reminder activity logging and monitoring

### December 14, 2025
- ✅ Invoice builder with 10 templates
- ✅ Client management system
- ✅ Dashboard with charts and reports

### December 13, 2025
- ✅ Initial project setup
- ✅ Supabase authentication
- ✅ Profile management with avatar/logo
- ✅ Fixed RLS recursion issues

---

*This documentation is maintained by the development team. For questions or updates, please contact the project maintainer.*

