-- Add access_token column for secure invoice links
-- This token is required to view an invoice via public link

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS access_token TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_access_token ON invoices(access_token);

-- Comment for documentation
COMMENT ON COLUMN invoices.access_token IS 'Secure token required to access invoice via public link. Valid until invoice is paid.';

