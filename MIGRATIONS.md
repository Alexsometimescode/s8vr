# Database Migrations

s8vr uses Supabase (PostgreSQL). All migrations live in `backend/migrations/`.

## Running migrations

### Option 1 — Supabase SQL Editor (recommended)

1. Open your Supabase project → **SQL Editor**
2. Run each file in order (001 → 012 → add_templates)
3. Paste the file contents and click **Run**

### Option 2 — psql directly

```bash
# Set your connection string
export DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"

# Run all migrations in order
for f in backend/migrations/*.sql; do
  echo "Running $f..."
  psql "$DATABASE_URL" -f "$f"
done
```

### Option 3 — backend migrate script

```bash
cd backend
npm run migrate
```

---

## Migration order

| File | What it does |
|------|-------------|
| `001_initial_schema.sql` | Core tables: users, clients, invoices, invoice_items, email_logs, reminder_configs |
| `002_add_auth_and_plans.sql` | Auth fields and plan tiers |
| `003_create_test_users.sql` | Test user accounts (dev only — skip in production) |
| `004_fix_password_hash.sql` | Password hashing fix |
| `005_add_avatar_logo.sql` | Avatar and logo fields for users |
| `006_fix_rls_recursion.sql` | Row Level Security policy fix |
| `007_add_access_token.sql` | Access token support |
| `007_create_feedback_table.sql` | Feedback/support table |
| `008_add_client_company_address.sql` | Company name and address fields for clients |
| `009_add_currency_and_invoice_format.sql` | Multi-currency support, invoice number format |
| `010_create_waitlist_table.sql` | Waitlist/early access table |
| `011_add_currency_to_invoices.sql` | Per-invoice currency field |
| `012_add_email_notifications.sql` | Email notification preferences |
| `add_templates_and_banning.sql` | Invoice templates and user banning |

> **Note:** Skip `003_create_test_users.sql` in production — it creates test accounts with known passwords.

---

## Database schema overview

```
users
  ├── clients (user_id → users.id)
  │     └── invoices (client_id → clients.id)
  │           ├── invoice_items (invoice_id → invoices.id)
  │           ├── email_logs (invoice_id → invoices.id)
  │           └── reminder_configs (invoice_id → invoices.id)
  └── stripe_account_id (Stripe Connect)
```

All tables use UUID primary keys and have `created_at` / `updated_at` timestamps.
Row Level Security (RLS) is enabled — users can only access their own data.
