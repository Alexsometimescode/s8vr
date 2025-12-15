-- ============================================
-- S8VR Admin Dashboard Enhancement Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create templates table for managing invoice templates
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  preview_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create banned_emails table to prevent re-registration
CREATE TABLE IF NOT EXISTS banned_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  reason TEXT,
  banned_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add is_banned column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- 4. Insert default templates (only if table is empty)
INSERT INTO templates (name, description, is_premium, is_active) 
SELECT * FROM (VALUES
  ('Minimal', 'Clean and simple design with focus on clarity', false, true),
  ('Corporate', 'Professional business look for enterprises', false, true),
  ('Startup', 'Modern tech-forward design for startups', false, true),
  ('Creative', 'Bold and artistic design for creative professionals', true, true),
  ('Tech', 'Digital-first appearance for tech companies', true, true),
  ('Elegant', 'Sophisticated and refined for luxury services', true, true),
  ('Agency', 'Creative agency style with bold typography', true, true),
  ('Modern', 'Contemporary minimal with clean lines', true, true),
  ('Classic', 'Timeless professional design', true, true),
  ('Consultant', 'Expert advisor look for consultants', true, true)
) AS t(name, description, is_premium, is_active)
WHERE NOT EXISTS (SELECT 1 FROM templates LIMIT 1);

-- 5. Enable RLS on new tables
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_emails ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for templates (public read)
DROP POLICY IF EXISTS "Templates are viewable by everyone" ON templates;
CREATE POLICY "Templates are viewable by everyone" ON templates FOR SELECT USING (true);

-- 7. Create RLS policies for banned_emails (admin only via service role)
DROP POLICY IF EXISTS "Service role can manage banned emails" ON banned_emails;
CREATE POLICY "Service role can manage banned emails" ON banned_emails FOR ALL USING (true);

-- Done!
SELECT 'Migration completed successfully!' as status;

