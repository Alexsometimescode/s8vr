-- ============================================
-- s8vr Personal Edition — Database Schema
-- Single file. Run once on a fresh Supabase project.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS (single owner account)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY,           -- matches auth.uid() from Supabase Auth
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  avatar_url    TEXT,
  logo_url      TEXT,
  currency      TEXT NOT NULL DEFAULT 'USD',
  invoice_number_format TEXT NOT NULL DEFAULT 'YYMM-seq',
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- CLIENTS
-- ============================================

CREATE TABLE IF NOT EXISTS clients (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  company    TEXT,
  phone      TEXT,
  address    TEXT,
  notes      TEXT,
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email   ON clients(email);

-- ============================================
-- INVOICES
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id                UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number           TEXT NOT NULL,
  amount                   DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency                 TEXT NOT NULL DEFAULT 'USD',
  status                   TEXT NOT NULL DEFAULT 'draft',
  issue_date               DATE,
  due_date                 DATE,
  theme                    TEXT DEFAULT 'minimal',
  access_token             TEXT,
  stripe_payment_intent_id TEXT,
  reminders_enabled        BOOLEAN NOT NULL DEFAULT false,
  reminder_frequency       TEXT,
  reminder_tone            TEXT DEFAULT 'professional',
  reminder_custom_interval INTEGER,
  reminder_time            TIME DEFAULT '09:00',
  reminder_count           INTEGER NOT NULL DEFAULT 0,
  last_reminder_sent       TIMESTAMPTZ,
  sent_at                  TIMESTAMPTZ,
  paid_at                  TIMESTAMPTZ,
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id    ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id  ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status     ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date   ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_access_token ON invoices(access_token);

-- ============================================
-- INVOICE ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS invoice_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount      DECIMAL(12,2) NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- ============================================
-- EMAIL LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS email_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  message    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_invoice_id ON email_logs(invoice_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs    ENABLE ROW LEVEL SECURITY;

-- Users
DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS users_insert_own ON users;
CREATE POLICY users_insert_own ON users FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users FOR UPDATE USING (id = auth.uid());

-- Clients
DROP POLICY IF EXISTS clients_select ON clients;
CREATE POLICY clients_select ON clients FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS clients_insert ON clients;
CREATE POLICY clients_insert ON clients FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS clients_update ON clients;
CREATE POLICY clients_update ON clients FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS clients_delete ON clients;
CREATE POLICY clients_delete ON clients FOR DELETE USING (user_id = auth.uid());

-- Invoices
DROP POLICY IF EXISTS invoices_select ON invoices;
CREATE POLICY invoices_select ON invoices FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS invoices_insert ON invoices;
CREATE POLICY invoices_insert ON invoices FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS invoices_update ON invoices;
CREATE POLICY invoices_update ON invoices FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS invoices_delete ON invoices;
CREATE POLICY invoices_delete ON invoices FOR DELETE USING (user_id = auth.uid());

-- Invoice items (scoped through invoice ownership)
DROP POLICY IF EXISTS invoice_items_select ON invoice_items;
CREATE POLICY invoice_items_select ON invoice_items FOR SELECT
  USING (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS invoice_items_insert ON invoice_items;
CREATE POLICY invoice_items_insert ON invoice_items FOR INSERT
  WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS invoice_items_update ON invoice_items;
CREATE POLICY invoice_items_update ON invoice_items FOR UPDATE
  USING (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS invoice_items_delete ON invoice_items;
CREATE POLICY invoice_items_delete ON invoice_items FOR DELETE
  USING (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()));

-- Email logs (scoped through invoice ownership)
DROP POLICY IF EXISTS email_logs_select ON email_logs;
CREATE POLICY email_logs_select ON email_logs FOR SELECT
  USING (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS email_logs_insert ON email_logs;
CREATE POLICY email_logs_insert ON email_logs FOR INSERT
  WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()));

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at    ON users;
CREATE TRIGGER trg_users_updated_at    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_clients_updated_at  ON clients;
CREATE TRIGGER trg_clients_updated_at  BEFORE UPDATE ON clients  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_invoices_updated_at ON invoices;
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
