-- ============================================
-- Cleanup unused/dead schema
-- Self-hosted invoicing app — remove SaaS/Connect remnants
-- ============================================

-- 1. Remove password_hash — Supabase Auth handles auth, this is never set
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- 2. Remove Stripe Connect columns — app uses Stripe Checkout (single key),
--    not Connect (per-user Stripe accounts). These are never populated.
ALTER TABLE users DROP COLUMN IF EXISTS stripe_account_id;
ALTER TABLE users DROP COLUMN IF EXISTS stripe_account_status;

-- 3. Drop waitlist table — SaaS/beta concept, self-hosted app has no waitlist
DROP TABLE IF EXISTS waitlist;

-- 4. Clear stale template seed data and replace with current single template
TRUNCATE TABLE templates;
INSERT INTO templates (name, description, is_premium, is_active)
VALUES ('Agency', 'Clean agency-style invoice layout', false, true);
