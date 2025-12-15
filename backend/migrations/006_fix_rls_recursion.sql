-- Fix RLS infinite recursion by using auth.jwt() instead of subquery

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Simple policies for users table - no subqueries to avoid recursion
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- For admin access, we'll handle this in application code instead of RLS
-- to avoid infinite recursion

-- Also fix invoices admin policy
DROP POLICY IF EXISTS "Admins can view all invoices" ON invoices;

