-- Reset reminders to off by default for all existing invoices.
-- They were created with reminders_enabled = true as a blanket default.
-- Users must now explicitly enable reminders per invoice.
UPDATE invoices SET reminders_enabled = false WHERE reminders_enabled = true OR reminders_enabled IS NULL;

-- Also set the column default to false going forward
ALTER TABLE invoices ALTER COLUMN reminders_enabled SET DEFAULT false;
