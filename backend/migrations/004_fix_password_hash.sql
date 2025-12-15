-- Make password_hash nullable since Supabase Auth handles passwords
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

