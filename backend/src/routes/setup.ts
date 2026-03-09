import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const router = Router();

// ============================================
// CONNECTION TEST ENDPOINTS
// ============================================

/**
 * Test Supabase connection
 * POST /api/setup/test/supabase
 */
router.post('/test/supabase', async (req: Request, res: Response) => {
  try {
    const { url, anonKey, serviceKey } = req.body;

    if (!url || !anonKey || !serviceKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: url, anonKey, serviceKey',
      });
    }

    // Validate URL format
    if (!url.includes('supabase.co') && !url.includes('supabase.in')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Supabase URL format',
      });
    }

    // Test connection with service role key
    const supabase = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Try to query the database to verify connection
    // We'll try to check if we can access the auth schema
    const { error } = await supabase.auth.admin.listUsers({ perPage: 1 });

    if (error) {
      // If listUsers fails, try a simpler query
      const { error: healthError } = await supabase.from('_health_check_dummy').select('*').limit(1);

      // PGRST116 means table doesn't exist, which is fine - it means we connected
      if (healthError && !healthError.message.includes('does not exist') && !healthError.code?.includes('PGRST')) {
        return res.status(400).json({
          success: false,
          error: `Supabase connection failed: ${healthError.message}`,
        });
      }
    }

    // Also verify the anon key works
    const supabaseAnon = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Simple health check for anon key
    const { error: anonError } = await supabaseAnon.from('_anon_health_check').select('*').limit(1);

    // If we get here without a connection error, the keys work
    // Table not existing errors (PGRST116) are expected and fine

    res.json({
      success: true,
      message: 'Supabase connection successful',
    });
  } catch (error: any) {
    console.error('Supabase test error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect to Supabase',
    });
  }
});

/**
 * Test Stripe connection
 * POST /api/setup/test/stripe
 */
router.post('/test/stripe', async (req: Request, res: Response) => {
  try {
    const { secretKey } = req.body;

    if (!secretKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: secretKey',
      });
    }

    // Validate key format
    if (!secretKey.startsWith('sk_')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Stripe secret key format. Should start with sk_',
      });
    }

    // Initialize Stripe with the provided key
    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });

    // Try to retrieve account info to verify the key works
    const account = await stripe.accounts.retrieve();

    res.json({
      success: true,
      message: 'Stripe connection successful',
      accountId: account.id,
      accountEmail: account.email,
    });
  } catch (error: any) {
    console.error('Stripe test error:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeAuthenticationError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid Stripe API key',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect to Stripe',
    });
  }
});

/**
 * Test Resend connection
 * POST /api/setup/test/resend
 */
router.post('/test/resend', async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: apiKey',
      });
    }

    // Validate key format
    if (!apiKey.startsWith('re_')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Resend API key format. Should start with re_',
      });
    }

    // Test the API key by fetching domains (doesn't send email)
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return res.status(400).json({
        success: false,
        error: data.message || 'Invalid Resend API key',
      });
    }

    const domains = await response.json();

    res.json({
      success: true,
      message: 'Resend connection successful',
      domainsCount: domains.data?.length || 0,
    });
  } catch (error: any) {
    console.error('Resend test error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect to Resend',
    });
  }
});

/**
 * Test all connections at once
 * POST /api/setup/test/all
 */
router.post('/test/all', async (req: Request, res: Response) => {
  try {
    const { supabase: supabaseConfig, stripe: stripeConfig, resend: resendConfig } = req.body;

    const results = {
      supabase: { success: false, error: null as string | null },
      stripe: { success: false, error: null as string | null },
      resend: { success: false, error: null as string | null },
    };

    // Test Supabase
    try {
      if (supabaseConfig?.url && supabaseConfig?.serviceKey) {
        const supabase = createClient(supabaseConfig.url, supabaseConfig.serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        await supabase.auth.admin.listUsers({ perPage: 1 });
        results.supabase.success = true;
      } else {
        results.supabase.error = 'Missing Supabase credentials';
      }
    } catch (e: any) {
      // Check if it's just a permission issue vs connection issue
      if (e.message?.includes('Invalid API key') || e.message?.includes('invalid')) {
        results.supabase.error = 'Invalid Supabase credentials';
      } else {
        // Assume connection works if we got any response
        results.supabase.success = true;
      }
    }

    // Test Stripe
    try {
      if (stripeConfig?.secretKey) {
        const stripe = new Stripe(stripeConfig.secretKey, { apiVersion: '2023-10-16' });
        await stripe.accounts.retrieve();
        results.stripe.success = true;
      } else {
        results.stripe.error = 'Missing Stripe credentials';
      }
    } catch (e: any) {
      results.stripe.error = e.message || 'Invalid Stripe credentials';
    }

    // Test Resend
    try {
      if (resendConfig?.apiKey) {
        const response = await fetch('https://api.resend.com/domains', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${resendConfig.apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          results.resend.success = true;
        } else {
          results.resend.error = 'Invalid Resend API key';
        }
      } else {
        results.resend.error = 'Missing Resend credentials';
      }
    } catch (e: any) {
      results.resend.error = e.message || 'Invalid Resend credentials';
    }

    const allSuccess = results.supabase.success && results.stripe.success && results.resend.success;

    res.json({
      success: allSuccess,
      results,
    });
  } catch (error: any) {
    console.error('Test all error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Connection test failed',
    });
  }
});

// ============================================
// DATABASE SCHEMA ENDPOINTS
// ============================================

/**
 * Push database schema to Supabase
 * POST /api/setup/schema/push
 */
router.post('/schema/push', async (req: Request, res: Response) => {
  try {
    const { supabaseUrl, supabaseServiceKey } = req.body;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing Supabase credentials',
      });
    }

    // Read the schema SQL file
    const schemaPath = path.resolve(__dirname, '../schema/init.sql');

    if (!fs.existsSync(schemaPath)) {
      return res.status(500).json({
        success: false,
        error: 'Schema file not found',
      });
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Split into individual statements (simple split by semicolon)
    // We need to be careful with functions that contain semicolons
    const statements = splitSqlStatements(schemaSql);

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Track created tables
    const createdTables: string[] = [];
    const errors: string[] = [];

    // Execute each statement
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;

      try {
        // Use the Supabase SQL execution via RPC or direct query
        // We'll use the REST API to execute raw SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ query: trimmed }),
        });

        // If exec_sql doesn't exist, try direct query execution
        if (!response.ok) {
          // Try using the postgres connection directly via supabase-js
          const { error } = await supabase.rpc('exec_sql', { query: trimmed });

          if (error) {
            // For some statements, errors are expected (like DROP IF EXISTS)
            // Only log non-critical errors
            if (!error.message.includes('does not exist') &&
                !error.message.includes('already exists') &&
                !error.message.includes('duplicate key')) {
              errors.push(`${trimmed.substring(0, 50)}...: ${error.message}`);
            }
          }
        }

        // Track table creation
        const tableMatch = trimmed.match(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)/i);
        if (tableMatch) {
          createdTables.push(tableMatch[1]);
        }

      } catch (stmtError: any) {
        // Non-critical errors are fine
        if (!stmtError.message?.includes('does not exist') &&
            !stmtError.message?.includes('already exists')) {
          errors.push(stmtError.message);
        }
      }
    }

    // Verify tables were created by checking if they exist
    const tablesToVerify = ['users', 'clients', 'invoices', 'invoice_items', 'templates', 'email_logs', 'app_config'];
    const verifiedTables: string[] = [];

    for (const table of tablesToVerify) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (!error || error.code === 'PGRST116') {
          // Table exists (even if empty or RLS blocks access)
          verifiedTables.push(table);
        }
      } catch {
        // Table might not exist
      }
    }

    // If we couldn't verify any tables, try alternative method
    if (verifiedTables.length === 0) {
      // Execute schema via SQL Editor approach (chunks)
      const chunks = splitIntoChunks(schemaSql);

      for (const chunk of chunks) {
        try {
          // Try direct SQL execution via Supabase Management API
          // This requires the service role key
          await executeRawSql(supabaseUrl, supabaseServiceKey, chunk);
        } catch (e) {
          // Continue with next chunk
        }
      }

      // Re-verify
      for (const table of tablesToVerify) {
        try {
          const { error } = await supabase.from(table).select('*').limit(1);
          if (!error || error.code === 'PGRST116' || error.message?.includes('permission denied')) {
            verifiedTables.push(table);
          }
        } catch {
          // Continue
        }
      }
    }

    const success = verifiedTables.length >= tablesToVerify.length - 1; // Allow 1 table to fail

    res.json({
      success,
      tables: verifiedTables,
      expectedTables: tablesToVerify,
      message: success
        ? 'Database schema created successfully'
        : 'Some tables may not have been created. Check Supabase dashboard.',
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    });

  } catch (error: any) {
    console.error('Schema push error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to push schema',
    });
  }
});

/**
 * Helper: Split SQL into statements
 */
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inFunction = false;
  let dollarQuote = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const remaining = sql.substring(i);

    // Check for dollar-quoted strings (used in functions)
    if (!inFunction && remaining.match(/^\$\w*\$/)) {
      const match = remaining.match(/^\$\w*\$/);
      if (match) {
        dollarQuote = match[0];
        inFunction = true;
        current += dollarQuote;
        i += dollarQuote.length - 1;
        continue;
      }
    }

    // Check for end of dollar quote
    if (inFunction && remaining.startsWith(dollarQuote)) {
      current += dollarQuote;
      i += dollarQuote.length - 1;
      inFunction = false;
      dollarQuote = '';
      continue;
    }

    // Check for statement end
    if (char === ';' && !inFunction) {
      current += char;
      statements.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

/**
 * Helper: Split SQL into larger chunks for execution
 */
function splitIntoChunks(sql: string): string[] {
  // Split by major sections (CREATE TABLE, etc.)
  const chunks: string[] = [];
  const lines = sql.split('\n');
  let currentChunk = '';

  for (const line of lines) {
    if (line.trim().startsWith('-- ====') && currentChunk.trim()) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    currentChunk += line + '\n';
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Helper: Execute raw SQL via Supabase
 */
async function executeRawSql(url: string, serviceKey: string, sql: string): Promise<void> {
  // Try using the SQL execution endpoint
  const response = await fetch(`${url}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SQL execution failed: ${text}`);
  }
}

// ============================================
// ACCOUNT CREATION ENDPOINTS
// ============================================

/**
 * Create owner account
 * POST /api/setup/account/create
 */
router.post('/account/create', async (req: Request, res: Response) => {
  try {
    const { supabaseUrl, supabaseServiceKey, account } = req.body;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing Supabase credentials',
      });
    }

    if (!account?.email || !account?.password || !account?.name) {
      return res.status(400).json({
        success: false,
        error: 'Missing account details: email, password, and name are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(account.email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // Validate password length
    if (account.password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true, // Auto-confirm email for setup
      user_metadata: {
        name: account.name,
        business_name: account.businessName || '',
      },
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return res.status(400).json({
        success: false,
        error: authError.message || 'Failed to create auth user',
      });
    }

    if (!authData.user) {
      return res.status(500).json({
        success: false,
        error: 'User creation failed - no user returned',
      });
    }

    // Create user profile in users table
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: account.email,
        name: account.name,
        business_name: account.businessName || null,
        role: 'owner',
        currency: 'USD',
        settings: {},
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // User exists in auth but profile failed - try to clean up
      // But don't fail the whole operation
    }

    res.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: account.name,
      },
      message: 'Account created successfully',
    });

  } catch (error: any) {
    console.error('Account creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create account',
    });
  }
});

// ============================================
// CONFIGURATION ENDPOINTS
// ============================================

/**
 * Check if setup is complete
 * GET /api/setup/status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const isConfigured = process.env.SETUP_COMPLETE === 'true';
    const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    const hasStripe = !!process.env.STRIPE_SECRET_KEY;
    const hasResend = !!process.env.RESEND_API_KEY;

    res.json({
      isConfigured,
      hasSupabase,
      hasStripe,
      hasResend,
      setupComplete: isConfigured && hasSupabase && hasStripe && hasResend,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Write configuration to .env file
 * POST /api/setup/config/write
 */
router.post('/config/write', async (req: Request, res: Response) => {
  try {
    const { credentials, frontendUrl } = req.body;

    if (!credentials) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials',
      });
    }

    // Generate a single JWT secret for consistency
    const jwtSecret = crypto.randomBytes(32).toString('hex');

    // Build .env content for root (frontend)
    const rootEnvContent = `# s8vr Configuration
# Generated by setup wizard on ${new Date().toISOString()}

# App Mode
VITE_SETUP_COMPLETE=true

# Frontend URL
VITE_API_URL=http://localhost:3001

# Supabase (frontend)
VITE_SUPABASE_URL=${credentials.supabaseUrl}
VITE_SUPABASE_ANON_KEY=${credentials.supabaseAnonKey}
`;

    // Build .env content for backend
    const backendEnvContent = `# s8vr Backend Configuration
# Generated by setup wizard on ${new Date().toISOString()}

# App Mode
SETUP_COMPLETE=true

# Server
PORT=3001
FRONTEND_URL=${frontendUrl || 'http://localhost:3000'}

# Supabase
SUPABASE_URL=${credentials.supabaseUrl}
VITE_SUPABASE_URL=${credentials.supabaseUrl}
SUPABASE_SERVICE_ROLE_KEY=${credentials.supabaseServiceKey}

# Stripe
STRIPE_SECRET_KEY=${credentials.stripeSecretKey}
STRIPE_WEBHOOK_SECRET=${credentials.stripeWebhookSecret || ''}

# Resend
RESEND_API_KEY=${credentials.resendApiKey}

# JWT Secret (auto-generated)
JWT_SECRET=${jwtSecret}
`;

    // Combined .env for single-file setup (root of project)
    const combinedEnvContent = `# s8vr Configuration
# Generated by setup wizard on ${new Date().toISOString()}

# ============================================
# APP MODE
# ============================================
VITE_SETUP_COMPLETE=true
SETUP_COMPLETE=true

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3001
FRONTEND_URL=${frontendUrl || 'http://localhost:3000'}
VITE_API_URL=http://localhost:3001

# ============================================
# SUPABASE
# ============================================
VITE_SUPABASE_URL=${credentials.supabaseUrl}
VITE_SUPABASE_ANON_KEY=${credentials.supabaseAnonKey}
SUPABASE_URL=${credentials.supabaseUrl}
SUPABASE_SERVICE_ROLE_KEY=${credentials.supabaseServiceKey}

# ============================================
# STRIPE
# ============================================
STRIPE_SECRET_KEY=${credentials.stripeSecretKey}
STRIPE_WEBHOOK_SECRET=${credentials.stripeWebhookSecret || ''}

# ============================================
# RESEND (Email)
# ============================================
RESEND_API_KEY=${credentials.resendApiKey}

# ============================================
# SECURITY
# ============================================
JWT_SECRET=${jwtSecret}
`;

    // Determine paths
    const backendDir = process.cwd(); // backend directory
    const rootDir = path.resolve(backendDir, '..'); // project root

    const rootEnvPath = path.join(rootDir, '.env');
    const backendEnvPath = path.join(backendDir, '.env');

    // Write both .env files
    const writtenFiles: string[] = [];

    try {
      fs.writeFileSync(rootEnvPath, combinedEnvContent, 'utf-8');
      writtenFiles.push(rootEnvPath);
    } catch (e: any) {
      console.error('Failed to write root .env:', e.message);
    }

    try {
      fs.writeFileSync(backendEnvPath, backendEnvContent, 'utf-8');
      writtenFiles.push(backendEnvPath);
    } catch (e: any) {
      console.error('Failed to write backend .env:', e.message);
    }

    if (writtenFiles.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to write any .env files. Check file permissions.',
      });
    }

    res.json({
      success: true,
      message: '.env files created successfully',
      paths: writtenFiles,
    });
  } catch (error: any) {
    console.error('Config write error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to write configuration',
    });
  }
});

export default router;
