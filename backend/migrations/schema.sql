-- ============================================
-- s8vr complete database schema
-- Run this once in Supabase SQL Editor
-- ============================================

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  name            VARCHAR(255),
  plan            VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  role            VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url      TEXT,
  logo_url        TEXT,
  currency        VARCHAR(10) DEFAULT 'USD',
  invoice_number_format VARCHAR(50) DEFAULT 'YYMM-seq',
  email_notifications BOOLEAN DEFAULT true,
  is_banned       BOOLEAN DEFAULT false,
  banned_at       TIMESTAMPTZ,
  ban_reason      TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  phone           VARCHAR(50),
  website         VARCHAR(255),
  contact_person  VARCHAR(255),
  company         VARCHAR(255),
  address         TEXT,
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  client_id                UUID REFERENCES clients(id),
  invoice_number           VARCHAR(50) NOT NULL,
  status                   VARCHAR(20) DEFAULT 'draft',
  issue_date               DATE NOT NULL,
  due_date                 DATE NOT NULL,
  amount                   DECIMAL(10, 2) NOT NULL,
  currency                 VARCHAR(10) DEFAULT 'USD',
  theme                    VARCHAR(50),
  stripe_payment_intent_id VARCHAR(255),
  checkout_url             TEXT,
  access_token             TEXT,
  reminders_enabled        BOOLEAN DEFAULT false,
  sent_at                  TIMESTAMP,
  paid_at                  TIMESTAMP,
  created_at               TIMESTAMP DEFAULT NOW(),
  updated_at               TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount      DECIMAL(10, 2) NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  type       VARCHAR(20) NOT NULL,
  message    TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminder_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  frequency       VARCHAR(20),
  custom_interval INTEGER,
  tone            VARCHAR(20),
  reminder_time   TIME,
  enabled         BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(invoice_id)
);

CREATE TABLE IF NOT EXISTS feedback (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  type       TEXT NOT NULL DEFAULT 'feedback' CHECK (type IN ('feedback', 'bug', 'feature')),
  message    TEXT NOT NULL,
  status     TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  is_premium  BOOLEAN DEFAULT false,
  is_active   BOOLEAN DEFAULT true,
  preview_url TEXT,
  settings    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS banned_emails (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  reason     TEXT,
  banned_by  UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Seed data ─────────────────────────────────────────────────────────────────

INSERT INTO templates (name, description, is_premium, is_active)
SELECT 'Agency', 'Clean agency-style invoice layout', false, true
WHERE NOT EXISTS (SELECT 1 FROM templates LIMIT 1);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_invoices_user_id           ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id         ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status            ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_access_token      ON invoices(access_token);
CREATE INDEX IF NOT EXISTS idx_clients_user_id            ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id   ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_invoice_id      ON email_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_reminder_configs_invoice_id ON reminder_configs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id           ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status            ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at        ON feedback(created_at DESC);

-- ── Triggers ──────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminder_configs_updated_at
  BEFORE UPDATE ON reminder_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Row Level Security ────────────────────────────────────────────────────────
-- s8vr is a self-hosted single-user local app. There is no Supabase Auth.
-- The backend uses the service role key (bypasses RLS entirely).
-- The frontend uses the anon key with permissive policies — security is
-- provided by CORS being locked to localhost in the backend.

ALTER TABLE clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices         ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback         ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates        ENABLE ROW LEVEL SECURITY;

-- Permissive policies for local anon-key access
DROP POLICY IF EXISTS "local full access" ON clients;
DROP POLICY IF EXISTS "local full access" ON invoices;
DROP POLICY IF EXISTS "local full access" ON invoice_items;
DROP POLICY IF EXISTS "local full access" ON email_logs;
DROP POLICY IF EXISTS "local full access" ON reminder_configs;
DROP POLICY IF EXISTS "local full access" ON feedback;
DROP POLICY IF EXISTS "local full access" ON templates;

CREATE POLICY "local full access" ON clients         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "local full access" ON invoices        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "local full access" ON invoice_items   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "local full access" ON email_logs      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "local full access" ON reminder_configs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "local full access" ON feedback        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "local full access" ON templates       FOR ALL USING (true) WITH CHECK (true);
