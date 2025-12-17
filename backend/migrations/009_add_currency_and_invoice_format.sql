-- Add currency and invoice number format columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS invoice_number_format VARCHAR(50) DEFAULT 'YYMM-seq';

