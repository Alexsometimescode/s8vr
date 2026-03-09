#!/usr/bin/env node
'use strict';

/**
 * s8vr — create-s8vr
 * Interactive terminal installer for s8vr
 * Usage: npx create-s8vr@latest
 */

const readline = require('readline');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// ─── Platform check ───────────────────────────────────────────────────────────
if (process.platform === 'win32') {
  console.log('');
  console.log('  s8vr installer does not support Windows natively.');
  console.log('');
  console.log('  Please use WSL (Windows Subsystem for Linux):');
  console.log('  https://learn.microsoft.com/en-us/windows/wsl/install');
  console.log('');
  console.log('  Once inside WSL, run: npx create-s8vr@latest');
  console.log('');
  process.exit(1);
}

// ─── Credential validators ────────────────────────────────────────────────────
function httpsGet(url, headers = {}) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers }, (res) => resolve(res.statusCode));
    req.on('error', () => resolve(null));
    req.setTimeout(6000, () => { req.destroy(); resolve(null); });
  });
}

async function validateSupabase(url, anonKey) {
  try {
    const status = await httpsGet(`${url}/rest/v1/`, { apikey: anonKey });
    return status !== null && status < 500;
  } catch { return false; }
}

async function validateStripe(secretKey) {
  return new Promise((resolve) => {
    const req = https.get('https://api.stripe.com/v1/account', {
      headers: { Authorization: `Bearer ${secretKey}` }
    }, (res) => resolve(res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.setTimeout(6000, () => { req.destroy(); resolve(false); });
  });
}

async function validateResend(apiKey) {
  return new Promise((resolve) => {
    const req = https.get('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` }
    }, (res) => resolve(res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.setTimeout(6000, () => { req.destroy(); resolve(false); });
  });
}

// ─── ANSI Colors ──────────────────────────────────────────────────────────────
const c = {
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  green:   '\x1b[0;32m',
  emerald: '\x1b[0;36m',
  blue:    '\x1b[0;34m',
  yellow:  '\x1b[1;33m',
  red:     '\x1b[0;31m',
  white:   '\x1b[1;37m',
  reset:   '\x1b[0m',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ok      = (msg) => console.log(`  ${c.green}✓${c.reset}  ${msg}`);
const fail    = (msg) => { console.log(`  ${c.red}✗${c.reset}  ${msg}`); process.exit(1); };
const info    = (msg) => console.log(`  ${c.dim}→${c.reset}  ${msg}`);
const section = (title) => {
  console.log('');
  console.log(`${c.bold}${c.white}  ${title}${c.reset}`);
  console.log(`  ${c.dim}${'─'.repeat(52)}${c.reset}`);
};

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { stdio: opts.silent ? 'pipe' : 'inherit', ...opts }).toString().trim();
  } catch (e) {
    if (opts.optional) return '';
    fail(`Command failed: ${cmd}\n${e.message}`);
  }
}

// ─── Prompt helpers ───────────────────────────────────────────────────────────
async function ask(prompt, opts = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const label = `  ${c.emerald}?${c.reset}  ${c.bold}${prompt}${c.reset} `;

    if (opts.secret) {
      process.stdout.write(label);
      // Hide input
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      let value = '';
      process.stdin.on('data', function handler(char) {
        if (char === '\r' || char === '\n') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', handler);
          process.stdout.write('\n');
          rl.close();
          resolve(value);
        } else if (char === '\u0003') {
          process.exit();
        } else if (char === '\u007f') {
          value = value.slice(0, -1);
        } else {
          value += char;
        }
      });
    } else {
      const displayPrompt = opts.default
        ? `${label}${c.dim}(${opts.default})${c.reset} `
        : label;
      rl.question(displayPrompt, (answer) => {
        rl.close();
        resolve(answer || opts.default || '');
      });
    }
  });
}

async function confirm(prompt) {
  const answer = await ask(`${prompt} ${c.dim}(Y/n)${c.reset}`);
  return answer.toLowerCase() !== 'n';
}

// ─── Banner ───────────────────────────────────────────────────────────────────
function showBanner() {
  console.clear();
  console.log('');
  console.log(`${c.bold}${c.white}   ███████╗ █████╗ ██╗   ██╗██████╗ ${c.reset}`);
  console.log(`${c.bold}${c.white}   ██╔════╝██╔══██╗██║   ██║██╔══██╗${c.reset}`);
  console.log(`${c.bold}${c.white}   ███████╗╚█████╔╝██║   ██║██████╔╝${c.reset}`);
  console.log(`${c.bold}${c.white}   ╚════██║██╔══██╗╚██╗ ██╔╝██╔══██╗${c.reset}`);
  console.log(`${c.bold}${c.white}   ███████║╚█████╔╝ ╚████╔╝ ██║  ██║${c.reset}`);
  console.log(`${c.bold}${c.white}   ╚══════╝ ╚════╝   ╚═══╝  ╚═╝  ╚═╝${c.reset}`);
  console.log('');
  console.log(`   ${c.dim}Self-Hosted Invoicing for Freelancers${c.reset}`);
  console.log('');
  console.log(`   ${c.dim}MIT License · https://github.com/Alexsometimescode/s8vr${c.reset}`);
  console.log('');
  console.log(`  ${c.dim}${'═'.repeat(54)}${c.reset}`);
  console.log('');
  console.log(`  This installer will:`);
  console.log(`  ${c.dim}·${c.reset} Clone s8vr to your machine`);
  console.log(`  ${c.dim}·${c.reset} Walk you through configuration`);
  console.log(`  ${c.dim}·${c.reset} Install dependencies and build`);
  console.log(`  ${c.dim}·${c.reset} Start s8vr automatically`);
  console.log('');
  console.log(`  ${c.yellow}Have your Supabase, Stripe, and Resend${c.reset}`);
  console.log(`  ${c.yellow}credentials ready before continuing.${c.reset}`);
  console.log('');
}

// ─── Check requirements ───────────────────────────────────────────────────────
function checkRequirements() {
  section('Checking requirements');
  console.log('');

  const nodeVersion = parseInt(process.versions.node.split('.')[0]);
  if (nodeVersion < 18) {
    fail(`Node.js 18+ required. Current: v${process.versions.node}`);
  }
  ok(`node v${process.versions.node}`);

  try { run('git --version', { silent: true }); ok('git'); }
  catch { fail('git is required. Install from: https://git-scm.com'); }

  try { run('npm --version', { silent: true }); ok('npm'); }
  catch { fail('npm is required (bundled with Node.js)'); }
}

// ─── Main installer ───────────────────────────────────────────────────────────
async function main() {
  showBanner();
  await ask('Press Enter to begin (Ctrl+C to cancel)');

  checkRequirements();

  // ── Install directory
  section('Installation directory');
  console.log('');
  const defaultDir = path.join(process.cwd(), 's8vr');
  const installDir = await ask('Install s8vr to', { default: defaultDir });
  const absDir = installDir.replace(/^~/, process.env.HOME);

  console.log('');
  if (fs.existsSync(path.join(absDir, '.git'))) {
    info('Directory exists — pulling latest changes...');
    run(`git -C "${absDir}" pull --quiet`);
  } else {
    info('Cloning s8vr...');
    run(`git clone https://github.com/Alexsometimescode/s8vr "${absDir}" --quiet`);
    ok(`Cloned to ${absDir}`);
  }

  // ── Supabase
  section('Database  ·  Supabase');
  console.log('');
  console.log(`  ${c.dim}Create a free project at${c.reset} ${c.blue}https://supabase.com${c.reset}`);
  console.log(`  ${c.dim}Then go to: Project Settings → API${c.reset}`);
  console.log('');

  const supabaseUrl         = await ask('Supabase project URL');
  const supabaseAnonKey     = await ask('Supabase anon key    ', { secret: true });
  const supabaseServiceKey  = await ask('Supabase service role key', { secret: true });
  const databaseUrl         = await ask('Postgres connection string (Settings → Database → URI)', { secret: true });

  console.log('');
  process.stdout.write(`  ${c.dim}→${c.reset}  Verifying Supabase credentials...`);
  const supabaseOk = await validateSupabase(supabaseUrl, supabaseAnonKey);
  if (supabaseOk) {
    console.log(`\r  ${c.green}✓${c.reset}  Supabase connected                    `);
  } else {
    console.log(`\r  ${c.yellow}⚠${c.reset}  Could not verify Supabase — check your URL and anon key`);
  }

  // ── Stripe
  section('Payments  ·  Stripe');
  console.log('');
  console.log(`  ${c.dim}Get your keys at${c.reset} ${c.blue}https://dashboard.stripe.com/apikeys${c.reset}`);
  console.log('');

  const stripeSecretKey      = await ask('Stripe secret key (sk_live_ or sk_test_...)', { secret: true });
  const stripePublishableKey = await ask('Stripe publishable key (pk_live_ or pk_test_...)');

  console.log('');
  process.stdout.write(`  ${c.dim}→${c.reset}  Verifying Stripe credentials...`);
  const stripeOk = await validateStripe(stripeSecretKey);
  if (stripeOk) {
    console.log(`\r  ${c.green}✓${c.reset}  Stripe connected                    `);
  } else {
    console.log(`\r  ${c.yellow}⚠${c.reset}  Could not verify Stripe — check your secret key`);
  }

  console.log('');
  console.log(`  ${c.dim}Optional: Stripe webhook endpoint: https://YOUR_DOMAIN/webhook/stripe${c.reset}`);
  console.log('');
  const stripeWebhookSecret  = await ask('Stripe webhook secret (whsec_... or Enter to skip)', { secret: true });

  // ── Email
  section('Email  ·  Resend');
  console.log('');
  console.log(`  ${c.dim}Get your API key at${c.reset} ${c.blue}https://resend.com${c.reset}`);
  console.log('');

  const resendApiKey = await ask('Resend API key (re_...)', { secret: true });

  console.log('');
  process.stdout.write(`  ${c.dim}→${c.reset}  Verifying Resend credentials...`);
  const resendOk = await validateResend(resendApiKey);
  if (resendOk) {
    console.log(`\r  ${c.green}✓${c.reset}  Resend connected                    `);
  } else {
    console.log(`\r  ${c.yellow}⚠${c.reset}  Could not verify Resend — check your API key`);
  }
  console.log('');

  const fromEmail    = await ask('From email address (e.g. invoices@yourdomain.com)');

  // ── App config
  section('App configuration');
  console.log('');

  const appUrl       = await ask('Your app URL', { default: 'http://localhost:3000' });
  const backendUrl   = await ask('Backend API URL', { default: 'http://localhost:3001' });
  const portFrontend = await ask('Frontend port', { default: '3000' });
  const portBackend  = await ask('Backend port', { default: '3001' });

  const jwtSecret = crypto.randomBytes(48).toString('hex');

  // ── Write .env files
  section('Writing configuration');
  console.log('');

  const timestamp = new Date().toLocaleString();

  const frontendEnv = [
    `# s8vr Frontend Configuration`,
    `# Generated by create-s8vr on ${timestamp}`,
    ``,
    `VITE_API_URL=${backendUrl}`,
    `VITE_SUPABASE_URL=${supabaseUrl}`,
    `VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}`,
    `VITE_STRIPE_PUBLISHABLE_KEY=${stripePublishableKey}`,
    `VITE_SETUP_COMPLETE=true`,
  ].join('\n');

  const backendEnv = [
    `# s8vr Backend Configuration`,
    `# Generated by create-s8vr on ${timestamp}`,
    ``,
    `PORT=${portBackend}`,
    `NODE_ENV=production`,
    `FRONTEND_URL=${appUrl}`,
    ``,
    `DATABASE_URL=${databaseUrl}`,
    `SUPABASE_URL=${supabaseUrl}`,
    `SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}`,
    ``,
    `JWT_SECRET=${jwtSecret}`,
    `JWT_EXPIRES_IN=7d`,
    ``,
    `STRIPE_SECRET_KEY=${stripeSecretKey}`,
    `STRIPE_PUBLISHABLE_KEY=${stripePublishableKey}`,
    `STRIPE_WEBHOOK_SECRET=${stripeWebhookSecret}`,
    ``,
    `RESEND_API_KEY=${resendApiKey}`,
    `FROM_EMAIL=${fromEmail}`,
  ].join('\n');

  fs.writeFileSync(path.join(absDir, '.env'), frontendEnv);
  ok('Frontend .env written');

  const backendDir = path.join(absDir, 'backend');
  fs.mkdirSync(backendDir, { recursive: true });
  fs.writeFileSync(path.join(backendDir, '.env'), backendEnv);
  ok('Backend .env written');

  // ── Install dependencies
  section('Installing dependencies');
  console.log('');

  info('Installing frontend dependencies...');
  run(`npm install --silent --prefix "${absDir}"`);
  ok('Frontend dependencies installed');

  info('Installing backend dependencies...');
  run(`npm install --silent --prefix "${absDir}/backend"`);
  ok('Backend dependencies installed');

  // ── Build
  section('Building');
  console.log('');

  info('Building frontend...');
  run(`npm run build --prefix "${absDir}" 2>&1`);
  ok('Frontend built');

  info('Building backend...');
  run(`npm run build --if-present --prefix "${absDir}/backend" 2>&1`);
  ok('Backend built');

  // ── Start
  section('Starting s8vr');
  console.log('');

  let hasPm2 = false;
  try { run('pm2 --version', { silent: true }); hasPm2 = true; } catch {}

  if (hasPm2) {
    const ecosystemConfig = `module.exports = {
  apps: [
    {
      name: 's8vr-backend',
      script: 'dist/server.js',
      cwd: '${absDir}/backend',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 's8vr-frontend',
      script: 'npx',
      args: 'serve dist -p ${portFrontend} -s',
      cwd: '${absDir}',
      env: { NODE_ENV: 'production' }
    }
  ]
}`;
    fs.writeFileSync(path.join(absDir, 'ecosystem.config.js'), ecosystemConfig);
    try {
      run(`pm2 start "${path.join(absDir, 'ecosystem.config.js')}" 2>/dev/null || pm2 restart "${path.join(absDir, 'ecosystem.config.js')}"`, { silent: true });
      run('pm2 save', { silent: true });
    } catch {
      run(`pm2 start "${path.join(absDir, 'ecosystem.config.js')}"`, { silent: true });
    }
    ok('Started with PM2');
  } else {
    info('PM2 not found — starting manually. For production, install PM2: npm i -g pm2');
    const backend = spawn('node', [path.join(absDir, 'backend/dist/server.js')], {
      detached: true, stdio: 'ignore',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    backend.unref();
    ok('Backend started');
    const frontend = spawn('npx', ['serve', path.join(absDir, 'dist'), '-p', portFrontend, '-s'], {
      detached: true, stdio: 'ignore'
    });
    frontend.unref();
    ok(`Frontend started`);
  }

  // ── Done
  console.log('');
  console.log(`  ${c.dim}${'═'.repeat(54)}${c.reset}`);
  console.log('');
  console.log(`  ${c.green}${c.bold}s8vr is running!${c.reset}`);
  console.log('');
  console.log(`  ${c.bold}Open in your browser:${c.reset}`);
  console.log(`  ${c.blue}${c.bold}${appUrl}${c.reset}`);
  console.log('');
  console.log(`  ${c.dim}Useful commands:${c.reset}`);
  if (hasPm2) {
    console.log(`  ${c.dim}·${c.reset} Logs:    ${c.dim}pm2 logs${c.reset}`);
    console.log(`  ${c.dim}·${c.reset} Status:  ${c.dim}pm2 status${c.reset}`);
    console.log(`  ${c.dim}·${c.reset} Restart: ${c.dim}pm2 restart all${c.reset}`);
  }
  console.log(`  ${c.dim}·${c.reset} Docs:    ${c.blue}https://github.com/Alexsometimescode/s8vr${c.reset}`);
  console.log('');

  process.exit(0);
}

main().catch((err) => {
  console.error(`\n  ${c.red}Error:${c.reset} ${err.message}`);
  process.exit(1);
});
