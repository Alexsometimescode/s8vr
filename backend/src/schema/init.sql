-- ============================================
-- s8vr Personal Edition Database Schema
-- Generated for Supabase PostgreSQL
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- APP CONFIGURATION
-- ============================================

CREATE TABLE IF NOT EXISTS app_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- USERS (Owner account)
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  business_name TEXT,
  avatar_url TEXT,
  logo_url TEXT,
  currency TEXT DEFAULT 'USD',
  stripe_account_id TEXT,
  stripe_account_status TEXT,
  email_notifications BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  role TEXT DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CLIENTS
-- ============================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- ============================================
-- INVOICES
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'draft',
  issue_date DATE,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  theme TEXT DEFAULT 'minimal',
  access_token TEXT,
  stripe_payment_intent_id TEXT,
  reminders_enabled BOOLEAN DEFAULT false,
  reminder_frequency TEXT,
  reminder_tone TEXT DEFAULT 'professional',
  reminder_custom_interval INTEGER,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_sent TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- ============================================
-- INVOICE ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- ============================================
-- TEMPLATES
-- ============================================

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default templates
INSERT INTO templates (name, description, is_active) VALUES
  ('Minimal', 'Clean and simple design', true),
  ('Corporate', 'Professional business look', true),
  ('Startup', 'Modern tech-forward design', true),
  ('Creative', 'Bold and artistic', true),
  ('Tech', 'Digital-first appearance', true),
  ('Elegant', 'Sophisticated and refined', true),
  ('Agency', 'Creative agency style', true),
  ('Modern', 'Contemporary minimal', true),
  ('Classic', 'Timeless professional', true),
  ('Consultant', 'Expert advisor look', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- EMAIL LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_invoice_id ON email_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(type);

-- ============================================
-- FEEDBACK (for app improvement)
-- ============================================

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  type TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users FOR UPDATE USING (id = auth.uid());

-- Clients policies
DROP POLICY IF EXISTS clients_select_own ON clients;
CREATE POLICY clients_select_own ON clients FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS clients_insert_own ON clients;
CREATE POLICY clients_insert_own ON clients FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS clients_update_own ON clients;
CREATE POLICY clients_update_own ON clients FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS clients_delete_own ON clients;
CREATE POLICY clients_delete_own ON clients FOR DELETE USING (user_id = auth.uid());

-- Invoices policies
DROP POLICY IF EXISTS invoices_select_own ON invoices;
CREATE POLICY invoices_select_own ON invoices FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS invoices_insert_own ON invoices;
CREATE POLICY invoices_insert_own ON invoices FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS invoices_update_own ON invoices;
CREATE POLICY invoices_update_own ON invoices FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS invoices_delete_own ON invoices;
CREATE POLICY invoices_delete_own ON invoices FOR DELETE USING (user_id = auth.uid());

-- Invoice items policies (via invoice ownership)
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

-- Email logs policies
DROP POLICY IF EXISTS email_logs_select ON email_logs;
CREATE POLICY email_logs_select ON email_logs FOR SELECT
  USING (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS email_logs_insert ON email_logs;
CREATE POLICY email_logs_insert ON email_logs FOR INSERT
  WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid()));

-- Templates policies (everyone can read)
DROP POLICY IF EXISTS templates_select_all ON templates;
CREATE POLICY templates_select_all ON templates FOR SELECT USING (true);

-- Feedback policies
DROP POLICY IF EXISTS feedback_select_own ON feedback;
CREATE POLICY feedback_select_own ON feedback FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS feedback_insert_own ON feedback;
CREATE POLICY feedback_insert_own ON feedback FOR INSERT WITH CHECK (user_id = auth.uid());

-- App config policies (owner can read/write)
DROP POLICY IF EXISTS app_config_select ON app_config;
CREATE POLICY app_config_select ON app_config FOR SELECT USING (true);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_config_updated_at ON app_config;
CREATE TRIGGER update_app_config_updated_at BEFORE UPDATE ON app_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SETUP COMPLETE
-- ============================================

-- Mark schema version
INSERT INTO app_config (key, value) VALUES ('schema_version', '"1.0.0"')
ON CONFLICT (key) DO UPDATE SET value = '"1.0.0"', updated_at = now();
