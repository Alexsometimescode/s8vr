<div align="center">

```
███████╗ █████╗ ██╗   ██╗██████╗
██╔════╝██╔══██╗██║   ██║██╔══██╗
███████╗╚█████╔╝██║   ██║██████╔╝
╚════██║██╔══██╗╚██╗ ██╔╝██╔══██╗
███████║╚█████╔╝ ╚████╔╝ ██║  ██║
╚══════╝ ╚════╝   ╚═══╝  ╚═╝  ╚═╝
```

**Self-hosted invoicing for freelancers.**

[![MIT License](https://img.shields.io/badge/license-MIT-emerald?style=flat-square)](./LICENSE)
[![Node 20+](https://img.shields.io/badge/node-20%2B-zinc?style=flat-square)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.8-blue?style=flat-square)](https://www.typescriptlang.org)

[Demo](https://s8vr.app) · [Issues](https://github.com/Alexsometimescode/s8vr/issues) · [Discussions](https://github.com/Alexsometimescode/s8vr/discussions)

</div>

---

s8vr is an open-source invoicing tool you run on your own server. Send professional invoices, collect Stripe payments, and automate follow-up reminders — no subscriptions, no per-seat fees, no vendor lock-in.

## Install

```bash
curl -fsSL https://s8vr.app/install.sh | bash
```

> Runs directly from GitHub. Requires Node 20+ and Git.

The installer will ask for your Supabase, Stripe, and Resend credentials, write your `.env` files, build the app, and start it with PM2.

**Prerequisites:** Node 20+, Git

---

## Manual setup

```bash
git clone https://github.com/Alexsometimescode/s8vr.git
cd s8vr
cp .env.example .env
cp backend/.env.example backend/.env
```

Fill in both `.env` files, then:

```bash
npm install && npm install --prefix backend
npm run dev:all
```

Open [http://localhost:5173](http://localhost:5173)

### Environment variables

**`.env` (frontend)**

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `VITE_API_URL` | Backend URL (default: `http://localhost:3001`) |

**`backend/.env`**

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `DATABASE_URL` | Postgres connection string |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `RESEND_API_KEY` | Resend API key |
| `FROM_EMAIL` | Sender address for invoices and reminders |
| `JWT_SECRET` | Random secret for session tokens |

### Database

Run the schema from `backend/src/schema/init.sql` in your Supabase SQL editor. That's it — no migrations to track.

---

## Features

- **Invoices** — 10 templates, custom line items, due dates, secure payment links
- **Payments** — Stripe checkout embedded directly in the invoice
- **Reminders** — Automated follow-ups with configurable frequency and tone
- **Clients** — Client list with history across invoices
- **Reports** — Revenue charts and CSV export

---

## Stack

| | |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | Supabase (PostgreSQL + Auth + RLS) |
| **Payments** | Stripe |
| **Email** | Resend |

---

## Self-hosting in production

The install script handles this automatically. For manual production deploys:

```bash
npm run build                     # build frontend → dist/
npm run build --prefix backend    # build backend → backend/dist/

# start with PM2
pm2 start backend/dist/server.js --name s8vr-api
pm2 serve dist 3000 --spa --name s8vr-ui
pm2 save
```

---

## Contributing

PRs welcome. Open an issue first for larger changes.

```bash
git checkout -b feat/your-feature
# make changes
git push origin feat/your-feature
# open a PR
```

---

## License

MIT — see [LICENSE](./LICENSE)
