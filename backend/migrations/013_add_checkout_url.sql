-- Add Stripe Checkout URL to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS checkout_url TEXT;
