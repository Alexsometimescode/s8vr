# Changelog

All notable changes to s8vr are documented here.

## [0.1.0] — 2026-03-09

### Initial open source release

**Core features:**
- Professional invoice creation with 10 customizable templates
- Client management (add, edit, archive clients)
- Automated email reminders for unpaid invoices (configurable frequency and tone)
- Stripe Connect integration — payments go directly to your Stripe account
- Financial reports with charts and CSV export
- Admin dashboard with platform analytics
- Multi-tenant architecture with Row Level Security (RLS) in Supabase

**Installation:**
- Interactive bash installer (`curl -fsSL https://s8vr.app/install.sh | bash`)
- Docker installer (`curl -fsSL https://s8vr.app/docker-install.sh | bash`)
- NPM installer (`npx create-s8vr@latest`)

**Tech stack:**
- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Recharts
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL via Supabase (14 migrations included)
- Payments: Stripe Connect
- Email: Resend

---

[0.1.0]: https://github.com/Alexsometimescode/s8vr/releases/tag/v0.1.0
