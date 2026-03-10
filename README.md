# s8vr - Smart Invoicing & Reminder Tool

<div align="center">
  <h3>Recover your lost revenue.</h3>
  <p>A minimal, smart invoicing + reminder tool built for freelancers</p>

  [Live Demo](https://s8vr.app)
</div>

---

## 🎯 Overview

**s8vr** is a professional invoicing platform designed specifically for freelancers. Create beautiful invoices, automate payment reminders, and get paid directly through Stripe Connect.

### Key Features

- ✅ **Professional Invoice Creation** - 10 premium templates with customization options
- ✅ **Stripe Connect Integration** - Direct payments to your Stripe account
- ✅ **Automated Reminders** - Configurable email follow-ups for unpaid invoices
- ✅ **Client Management** - Organize and track all your clients
- ✅ **Financial Reports** - Visual charts and CSV exports
- ✅ **Admin Dashboard** - Platform management and analytics
- ✅ **Multi-tenant Architecture** - Secure data isolation with Row Level Security

---

## 🚀 Quick Start

### Option 1 — CLI installer (recommended)

```bash
npx s8vr install
```

This walks you through Supabase, Stripe, and Resend setup, writes your `.env` files, builds, and starts s8vr automatically.

**CLI commands:**

| Command | Description |
|---|---|
| `npx s8vr` or `s8vr` | Start s8vr |
| `npx s8vr install` | Install s8vr interactively |
| `npx s8vr update` | Pull latest changes, rebuild, restart |
| `npx s8vr config` | Reconfigure environment variables |
| `npx s8vr restart` | Restart services |

**If you already cloned this repo**, install the CLI globally from the repo:
```bash
npm install -g ./create-s8vr
```

Then use `s8vr` as a command anywhere.

---

### Option 2 — Manual setup

#### Prerequisites

- **Node.js** 20.x or higher
- **npm** or **yarn**
- **Supabase** account (for database)
- **Stripe** account (for payments)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Alexsometimescode/s8vr.git
   cd s8vr
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Set up environment variables:**

   Copy the example files and fill in your values:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

   Then edit both `.env` files with your credentials from:
   - [Supabase Dashboard](https://supabase.com/dashboard) - for database URL and keys
   - [Stripe Dashboard](https://dashboard.stripe.com/apikeys) - for API keys
   - [Resend](https://resend.com/api-keys) - for email API key

5. **Set up the database:**
   - Run migrations from `backend/migrations/` in Supabase SQL Editor
   - See `GETTING_STARTED.md` for detailed migration instructions

6. **Run the development servers:**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   npm run dev
   ```

7. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

---

## 📁 Project Structure

```
s8vr-App/
├── components/
│   ├── app/          # Main app components (Dashboard, InvoiceBuilder, etc.)
│   ├── auth/         # Login & SignUp components
│   └── ui/           # Shared UI components
├── src/
│   └── lib/          # Supabase client, auth, data access functions
├── backend/
│   ├── src/
│   │   ├── server.ts         # Express API server
│   │   └── emailTemplates.ts # HTML email templates
│   └── migrations/   # Database migration files
├── public/           # Static assets (favicon, etc.)
├── types.ts          # TypeScript type definitions
├── App.tsx           # Main application component
└── GETTING_STARTED.md # Comprehensive documentation
```

---

## 🔧 Tech Stack

### Frontend
- **React** 19.2.1 - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Recharts** - Charts & graphs
- **Stripe Elements** - Payment forms
- **Supabase Client** - Database & auth

### Backend
- **Node.js** + **Express** - API server
- **TypeScript** - Type safety
- **Stripe SDK** - Payment processing
- **Supabase** - Database client
- **Resend** - Email delivery

### Infrastructure
- **Supabase** - PostgreSQL database, Authentication, Row Level Security
- **Stripe Connect** - Payment processing with connected accounts
- **Resend** - Transactional email delivery

---

## 📚 Documentation

For comprehensive documentation, see **[GETTING_STARTED.md](./GETTING_STARTED.md)** which includes:

- Detailed setup instructions
- Database schema documentation
- API endpoint reference
- Stripe Connect implementation guide
- Testing procedures
- Troubleshooting guide
- Known issues and solutions

---

## 🎨 Features

### Invoice Management
- Create professional invoices with 10 premium templates
- Customize colors, fonts, and backgrounds (Pro feature)
- Generate secure payment links
- Send invoices via email with branded templates
- Track invoice status (draft, pending, paid, overdue)

### Payment Processing
- Stripe Connect integration for direct payments
- Secure checkout with Stripe Elements
- Automatic invoice status updates
- Payment webhook handling

### Automated Reminders
- Configurable reminder frequency (daily, weekly, biweekly, custom)
- Multiple tone options (friendly, formal, professional, urgent, casual)
- Scheduled email delivery
- Beautiful branded reminder emails

### Client Management
- Add, edit, and organize clients
- Track client payment history
- Quick client selection when creating invoices

### Reports & Analytics
- Visual charts for revenue tracking
- Invoice status distribution
- CSV export functionality
- Time-filtered reports

### Admin Dashboard
- Platform statistics and analytics
- User management (plan changes, ban/unban)
- Invoice management
- Template management (CRUD operations)
- Feedback and bug report handling
- Reminder log monitoring

---

## 🔐 Security

- **Row Level Security (RLS)** - Users can only access their own data
- **Secure invoice links** - Access tokens required for public invoice viewing
- **Stripe webhook verification** - All webhooks are cryptographically verified
- **Environment variables** - Sensitive keys stored securely
- **Supabase Auth** - Industry-standard authentication

---

## 🧪 Testing

### Stripe Test Cards

Use these test card numbers for testing payments:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`

Any future expiry date and CVC will work.

### Test Mode

The app runs in Stripe test mode by default. Switch to live mode in production by updating your Stripe keys.

---

## 🐛 Troubleshooting

### Common Issues

1. **Database connection errors**
   - Verify Supabase credentials in `.env`
   - Check that migrations have been run
   - Ensure RLS policies are correctly configured

2. **Stripe payment failures**
   - Verify Stripe keys are correct
   - Check webhook endpoint configuration
   - Ensure webhook secret matches

3. **Email sending issues**
   - Verify Resend API key
   - Check backend logs for email errors
   - Ensure email templates are properly formatted

For more detailed troubleshooting, see [GETTING_STARTED.md](./GETTING_STARTED.md#troubleshooting).

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📞 Support

For detailed setup instructions and documentation, see **[GETTING_STARTED.md](./GETTING_STARTED.md)**.

---

<div align="center">
  <p>Built with ❤️ for freelancers</p>
  <p><strong>s8vr</strong> - Recover your lost revenue.</p>
</div>
