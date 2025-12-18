-- Add currency column to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';

-- Update existing invoices to use USD if currency is null
UPDATE invoices SET currency = 'USD' WHERE currency IS NULL;
