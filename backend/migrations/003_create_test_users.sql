-- This script creates test users via Supabase Auth
-- Run these commands in Supabase SQL Editor after creating auth users

-- Note: You need to create the auth users first via the Supabase dashboard or API
-- Then update their user profiles with these commands

-- After creating auth users with emails:
-- free@test.com, pro@test.com, admin@test.com
-- Update their profiles:

-- Free plan user (replace USER_ID with actual auth user ID)
-- UPDATE users SET plan = 'free', role = 'user' WHERE email = 'free@test.com';

-- Pro plan user
-- UPDATE users SET plan = 'pro', role = 'user' WHERE email = 'pro@test.com';

-- Admin user
-- UPDATE users SET plan = 'pro', role = 'admin' WHERE email = 'admin@test.com';

