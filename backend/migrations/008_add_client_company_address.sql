-- Add company and address columns to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS company VARCHAR(255),
ADD COLUMN IF NOT EXISTS address TEXT;

