-- Add email_notifications column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Update existing users to have email notifications enabled by default
UPDATE users SET email_notifications = true WHERE email_notifications IS NULL;
