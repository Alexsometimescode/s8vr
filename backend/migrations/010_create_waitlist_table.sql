-- Waitlist table for beta testing
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, invited
  invited_at TIMESTAMP,
  notes TEXT
);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (for signup)
CREATE POLICY "Anyone can add to waitlist" ON waitlist
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only service role can read (for admin)
CREATE POLICY "Service role can read waitlist" ON waitlist
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
