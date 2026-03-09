-- s8vr Seed Data
-- Run this after all migrations to populate example data for testing.
-- WARNING: This creates demo accounts with known passwords. Dev/staging only.

-- ─── Demo user ────────────────────────────────────────────────────────────────
-- Password: demo1234 (bcrypt hash)
INSERT INTO users (id, email, password_hash, name, stripe_account_status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@example.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- demo1234
  'Alex Demo',
  'pending'
)
ON CONFLICT (email) DO NOTHING;

-- ─── Clients ──────────────────────────────────────────────────────────────────
INSERT INTO clients (id, user_id, name, email, phone, company_name, active)
VALUES
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Sarah Chen',
    'sarah@acmecorp.com',
    '+1 415 555 0101',
    'Acme Corp',
    true
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Marcus Webb',
    'marcus@starlight.io',
    '+1 212 555 0182',
    'Starlight Studio',
    true
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Priya Nair',
    'priya@novabuild.co',
    '+44 20 7946 0321',
    'NovaBuild',
    true
  )
ON CONFLICT DO NOTHING;

-- ─── Invoices ─────────────────────────────────────────────────────────────────
INSERT INTO invoices (id, user_id, client_id, invoice_number, status, issue_date, due_date, amount, reminders_enabled, sent_at)
VALUES
  (
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'INV-0001',
    'paid',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '16 days',
    3200.00,
    true,
    CURRENT_TIMESTAMP - INTERVAL '30 days'
  ),
  (
    '00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000002',
    'INV-0002',
    'sent',
    CURRENT_DATE - INTERVAL '14 days',
    CURRENT_DATE + INTERVAL '1 day',
    1850.00,
    true,
    CURRENT_TIMESTAMP - INTERVAL '14 days'
  ),
  (
    '00000000-0000-0000-0002-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000003',
    'INV-0003',
    'overdue',
    CURRENT_DATE - INTERVAL '45 days',
    CURRENT_DATE - INTERVAL '15 days',
    5500.00,
    true,
    CURRENT_TIMESTAMP - INTERVAL '45 days'
  ),
  (
    '00000000-0000-0000-0002-000000000004',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'INV-0004',
    'draft',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    2400.00,
    true,
    NULL
  )
ON CONFLICT DO NOTHING;

-- ─── Invoice items ────────────────────────────────────────────────────────────
INSERT INTO invoice_items (invoice_id, description, amount, order_index)
VALUES
  ('00000000-0000-0000-0002-000000000001', 'Brand identity design', 2000.00, 0),
  ('00000000-0000-0000-0002-000000000001', 'Logo variations and assets', 1200.00, 1),
  ('00000000-0000-0000-0002-000000000002', 'Homepage redesign', 1200.00, 0),
  ('00000000-0000-0000-0002-000000000002', 'Mobile responsive layouts', 650.00, 1),
  ('00000000-0000-0000-0002-000000000003', 'Full-stack web application', 4500.00, 0),
  ('00000000-0000-0000-0002-000000000003', 'Deployment and DevOps setup', 1000.00, 1),
  ('00000000-0000-0000-0002-000000000004', 'UX audit and wireframes', 1600.00, 0),
  ('00000000-0000-0000-0002-000000000004', 'Prototype and user testing', 800.00, 1)
ON CONFLICT DO NOTHING;
