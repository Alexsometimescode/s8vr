import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://mdvpvoiidifdlgjjigzb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  console.log('💡 Get it from: https://supabase.com/dashboard/project/mdvpvoiidifdlgjjigzb/settings/api');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(fileName: string) {
  const filePath = path.join(__dirname, '../migrations', fileName);
  const sql = fs.readFileSync(filePath, 'utf-8');
  
  console.log(`\n📄 Running migration: ${fileName}`);
  
  // Split by semicolons and run each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (statement.trim()) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          // Try direct query if RPC doesn't work
          const { error: queryError } = await supabase.from('_').select('*').limit(0);
          // This is a workaround - we'll need to use the REST API or SQL editor
          console.log(`⚠️  Note: Some statements may need to be run manually in SQL Editor`);
        }
      } catch (err) {
        console.log(`⚠️  Could not execute statement automatically`);
      }
    }
  }
  
  console.log(`✅ Migration ${fileName} processed`);
}

async function setup() {
  console.log('🚀 Setting up s8vr database...\n');
  
  console.log('⚠️  Note: This script requires manual SQL execution.');
  console.log('📋 Please run these migrations in Supabase SQL Editor:\n');
  console.log('1. backend/migrations/002_add_auth_and_plans.sql');
  console.log('2. backend/migrations/004_fix_password_hash.sql\n');
  console.log('🔗 SQL Editor: https://supabase.com/dashboard/project/mdvpvoiidifdlgjjigzb/sql/new\n');
  
  // Read and display the SQL
  const migration2 = fs.readFileSync(path.join(__dirname, '../migrations/002_add_auth_and_plans.sql'), 'utf-8');
  const migration4 = fs.readFileSync(path.join(__dirname, '../migrations/004_fix_password_hash.sql'), 'utf-8');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('MIGRATION 002: Add Auth and Plans');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(migration2);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('MIGRATION 004: Fix Password Hash');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(migration4);
}

setup().catch(console.error);

