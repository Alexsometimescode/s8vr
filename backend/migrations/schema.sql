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

ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback        ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_emails   ENABLE ROW LEVEL SECURITY;

-- Users
DROP POLICY IF EXISTS "Users can view own profile"   ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

CREATE POLICY "Users can view own profile"   ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Clients
DROP POLICY IF EXISTS "Users can view own clients"   ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;

CREATE POLICY "Users can view own clients"   ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (auth.uid() = user_id);

-- Invoices
DROP POLICY IF EXISTS "Users can view own invoices"   ON invoices;
DROP POLICY IF EXISTS "Users can insert own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete own invoices" ON invoices;

CREATE POLICY "Users can view own invoices"   ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON invoices FOR DELETE USING (auth.uid() = user_id);

-- Invoice items
DROP POLICY IF EXISTS "Users can view own invoice items"   ON invoice_items;
DROP POLICY IF EXISTS "Users can insert own invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Users can update own invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Users can delete own invoice items" ON invoice_items;

CREATE POLICY "Users can view own invoice items" ON invoice_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Users can insert own invoice items" ON invoice_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Users can update own invoice items" ON invoice_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Users can delete own invoice items" ON invoice_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);

-- Email logs
DROP POLICY IF EXISTS "Users can view own email logs"   ON email_logs;
DROP POLICY IF EXISTS "Users can insert own email logs" ON email_logs;

CREATE POLICY "Users can view own email logs" ON email_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = email_logs.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Users can insert own email logs" ON email_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = email_logs.invoice_id AND invoices.user_id = auth.uid())
);

-- Reminder configs
DROP POLICY IF EXISTS "Users can view own reminder configs"   ON reminder_configs;
DROP POLICY IF EXISTS "Users can manage own reminder configs" ON reminder_configs;

CREATE POLICY "Users can view own reminder configs" ON reminder_configs FOR SELECT USING (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = reminder_configs.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Users can manage own reminder configs" ON reminder_configs FOR ALL USING (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = reminder_configs.invoice_id AND invoices.user_id = auth.uid())
);

-- Feedback
DROP POLICY IF EXISTS "Users can insert feedback"    ON feedback;
DROP POLICY IF EXISTS "Users can view own feedback"  ON feedback;

CREATE POLICY "Users can insert feedback"   ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can view own feedback" ON feedback FOR SELECT USING (auth.uid() = user_id);

-- Templates (public read)
DROP POLICY IF EXISTS "Templates are viewable by everyone" ON templates;
CREATE POLICY "Templates are viewable by everyone" ON templates FOR SELECT USING (true);

-- Banned emails (service role only)
DROP POLICY IF EXISTS "Service role can manage banned emails" ON banned_emails;
CREATE POLICY "Service role can manage banned emails" ON banned_emails FOR ALL USING (true);
