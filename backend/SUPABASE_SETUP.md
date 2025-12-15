# Supabase Project Setup

## Project Details

- **Project Name:** s8vr
- **Project ID:** mdvpvoiidifdlgjjigzb
- **Project Ref:** mdvpvoiidifdlgjjigzb
- **Region:** us-east-1
- **Status:** ACTIVE_HEALTHY
- **API URL:** https://mdvpvoiidifdlgjjigzb.supabase.co

## Database Connection

**Host:** db.mdvpvoiidifdlgjjigzb.supabase.co  
**Port:** 5432  
**Database:** postgres  
**User:** postgres

### To Get Your Database Password:

1. Go to: https://supabase.com/dashboard/project/mdvpvoiidifdlgjjigzb/settings/database
2. Under "Database Password", click "Reset database password" or copy existing password
3. Use this password in your `DATABASE_URL`

### Connection String Format:
```
postgresql://postgres:[YOUR-PASSWORD]@db.mdvpvoiidifdlgjjigzb.supabase.co:5432/postgres
```

## API Keys

**Publishable Key (anon):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kdnB2b2lpZGlmZGxnamppZ3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTU4MDgsImV4cCI6MjA4MTEzMTgwOH0.CYFLOYtAsc6TES-8cvTS8MMi-T0sqEixV3Bi8ZObSvg`

**Modern Publishable Key:** `sb_publishable_BdjxNtOgAhfwFz6B_EAJHg_OqkKdHIZ`

## Database Schema

The initial schema has been created with the following tables:
- `users` - Freelancer accounts
- `clients` - Client information
- `invoices` - Invoice records
- `invoice_items` - Line items for invoices
- `email_logs` - Email activity tracking
- `reminder_configs` - Reminder settings

All tables include proper indexes and triggers for `updated_at` timestamps.

## Next Steps

1. Get your database password from Supabase dashboard
2. Update `backend/.env` with the `DATABASE_URL`
3. Test the connection by running `npm run dev` in the backend folder

