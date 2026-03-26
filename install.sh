#!/usr/bin/env bash
# s8vr — Self-Hosted Invoicing Installer
# Usage: curl -fsSL https://s8vr.app/install.sh | bash

set -e

# ─── Colors ───────────────────────────────────────────────────────────────────
BOLD='\033[1m'
DIM='\033[2m'
GREEN='\033[0;32m'
EMERALD='\033[0;36m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
WHITE='\033[1;37m'
NC='\033[0m'

# ─── Helpers ──────────────────────────────────────────────────────────────────
ok()     { echo -e "  ${GREEN}✓${NC}  $1"; }
fail()   { echo -e "  ${RED}✗${NC}  $1"; exit 1; }
info()   { echo -e "  ${DIM}→${NC}  $1"; }
section(){ echo ""; echo -e "${BOLD}${WHITE}  $1${NC}"; echo -e "  ${DIM}$(printf '─%.0s' {1..52})${NC}"; }

ask() {
  local __var=$1 __prompt=$2
  printf "  ${EMERALD}?${NC}  ${BOLD}%s${NC} " "$__prompt"
  read -r "$__var" </dev/tty
}

ask_secret() {
  local __var=$1 __prompt=$2
  printf "  ${EMERALD}?${NC}  ${BOLD}%s${NC} " "$__prompt"
  read -rs "$__var" </dev/tty
  echo ""
}

ask_default() {
  local __var=$1 __prompt=$2 __default=$3
  printf "  ${EMERALD}?${NC}  ${BOLD}%s${NC} ${DIM}(${__default})${NC} " "$__prompt"
  read -r "$__var" </dev/tty
  eval "$__var=\${$__var:-$__default}"
}

# ─── Banner ───────────────────────────────────────────────────────────────────
clear
echo ""
echo -e "${BOLD}${WHITE}"
echo "   ███████╗ █████╗ ██╗   ██╗██████╗ "
echo "   ██╔════╝██╔══██╗██║   ██║██╔══██╗"
echo "   ███████╗╚█████╔╝██║   ██║██████╔╝"
echo "   ╚════██║██╔══██╗╚██╗ ██╔╝██╔══██╗"
echo "   ███████║╚█████╔╝ ╚████╔╝ ██║  ██║"
echo "   ╚══════╝ ╚════╝   ╚═══╝  ╚═╝  ╚═╝"
echo -e "${NC}"
echo -e "   ${DIM}Self-Hosted Invoicing for Freelancers${NC}"
echo ""
echo -e "   ${DIM}MIT License · https://github.com/Alexsometimescode/s8vr${NC}"
echo ""
echo -e "  ${DIM}$(printf '═%.0s' {1..54})${NC}"
echo ""
echo -e "  This installer will:"
echo -e "  ${DIM}·${NC} Clone s8vr to your server"
echo -e "  ${DIM}·${NC} Walk you through configuration"
echo -e "  ${DIM}·${NC} Set up the database and services"
echo -e "  ${DIM}·${NC} Start everything automatically"
echo ""
echo -e "  ${YELLOW}Have your Supabase, Stripe, and Resend${NC}"
echo -e "  ${YELLOW}credentials ready before continuing.${NC}"
echo ""
printf "  Press ${BOLD}Enter${NC} to begin or ${BOLD}Ctrl+C${NC} to cancel "
read -r </dev/tty

# ─── Requirements ─────────────────────────────────────────────────────────────
section "Checking requirements"
echo ""

command -v git  >/dev/null 2>&1 && ok "git" || fail "git is required. Run: apt install git"
command -v node >/dev/null 2>&1 && ok "node $(node -v)" || fail "Node.js 18+ is required. Run: curl -fsSL https://deb.nodesource.com/setup_20.x | bash && apt install nodejs"
command -v npm  >/dev/null 2>&1 && ok "npm $(npm -v)" || fail "npm is required (comes with Node.js)"

NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
  fail "Node.js 18+ is required. Current: $(node -v)"
fi

# ─── Install directory ────────────────────────────────────────────────────────
section "Installation directory"
echo ""
ask_default INSTALL_DIR "Install s8vr to" "$HOME/s8vr"
INSTALL_DIR="${INSTALL_DIR/#\~/$HOME}"

if [ -d "$INSTALL_DIR/.git" ]; then
  echo ""
  info "Directory exists — pulling latest changes..."
  git -C "$INSTALL_DIR" pull --quiet
else
  echo ""
  info "Cloning s8vr..."
  git clone https://github.com/Alexsometimescode/s8vr "$INSTALL_DIR" --quiet
  ok "Cloned to $INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# ─── Supabase ─────────────────────────────────────────────────────────────────
section "Database  ·  Supabase"
echo ""
echo -e "  ${DIM}Create a free project at${NC} ${BLUE}https://supabase.com${NC}"
echo -e "  ${DIM}Then go to: Project Settings → API${NC}"
echo ""

ask         SUPABASE_URL         "Supabase project URL"
ask_secret  SUPABASE_ANON_KEY    "Supabase anon key    "
ask_secret  SUPABASE_SERVICE_KEY "Supabase service role key"
ask_secret  DATABASE_URL         "Postgres connection string (Settings → Database → URI)"

# ─── Stripe ───────────────────────────────────────────────────────────────────
section "Payments  ·  Stripe"
echo ""
echo -e "  ${DIM}Get your keys at${NC} ${BLUE}https://dashboard.stripe.com/apikeys${NC}"
echo ""

ask_secret  STRIPE_SECRET_KEY      "Stripe secret key (sk_live_...)"
ask         STRIPE_PUBLISHABLE_KEY "Stripe publishable key (pk_live_...)"
echo ""
echo -e "  ${DIM}Optional: Set up webhook at${NC} ${BLUE}https://dashboard.stripe.com/webhooks${NC}"
echo -e "  ${DIM}Endpoint URL: https://YOUR_DOMAIN/webhook/stripe${NC}"
echo ""
ask_secret  STRIPE_WEBHOOK_SECRET  "Stripe webhook secret (whsec_... or Enter to skip)"

# ─── Email ────────────────────────────────────────────────────────────────────
section "Email  ·  Resend"
echo ""
echo -e "  ${DIM}Get your API key at${NC} ${BLUE}https://resend.com${NC}"
echo ""

ask_secret  RESEND_API_KEY "Resend API key (re_...)"
ask         FROM_EMAIL     "From email address (e.g. invoices@yourdomain.com)"

# ─── App config ───────────────────────────────────────────────────────────────
section "App configuration"
echo ""

ask_default APP_URL          "Your app URL" "http://localhost:3000"
ask_default BACKEND_URL      "Backend API URL" "http://localhost:3001"
ask_default PORT_FRONTEND    "Frontend port" "3000"
ask_default PORT_BACKEND     "Backend port" "3001"

JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")

# ─── Write .env files ─────────────────────────────────────────────────────────
section "Writing configuration"
echo ""

# Frontend .env
cat > "$INSTALL_DIR/.env" <<EOF
# s8vr Frontend Configuration
# Generated by installer on $(date)

VITE_API_URL=${BACKEND_URL}
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
VITE_STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
EOF

ok "Frontend .env written"

# Backend .env
cat > "$INSTALL_DIR/backend/.env" <<EOF
# s8vr Backend Configuration
# Generated by installer on $(date)

PORT=${PORT_BACKEND}
NODE_ENV=production
FRONTEND_URL=${APP_URL}

DATABASE_URL=${DATABASE_URL}
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY}

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}

RESEND_API_KEY=${RESEND_API_KEY}
FROM_EMAIL=${FROM_EMAIL}
EOF

ok "Backend .env written"

# ─── Install dependencies ─────────────────────────────────────────────────────
section "Installing dependencies"
echo ""

info "Installing frontend dependencies..."
npm install --silent --prefix "$INSTALL_DIR"
ok "Frontend dependencies installed"

info "Installing backend dependencies..."
npm install --silent --prefix "$INSTALL_DIR/backend"
ok "Backend dependencies installed"

# ─── Build ────────────────────────────────────────────────────────────────────
section "Building"
echo ""

info "Building frontend..."
npm run build --prefix "$INSTALL_DIR" 2>&1 | tail -3 | while read -r line; do info "$line"; done
ok "Frontend built"

info "Building backend..."
npm run build --prefix "$INSTALL_DIR/backend" 2>&1 | tail -3 | while read -r line; do info "$line"; done
ok "Backend built"

# ─── PM2 / process manager ────────────────────────────────────────────────────
section "Starting s8vr"
echo ""

if command -v pm2 >/dev/null 2>&1; then
  # Write PM2 ecosystem config
  cat > "$INSTALL_DIR/ecosystem.config.js" <<EOF
module.exports = {
  apps: [
    {
      name: 's8vr-backend',
      script: 'dist/server.js',
      cwd: '${INSTALL_DIR}/backend',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 's8vr-frontend',
      script: 'npx',
      args: 'serve dist -p ${PORT_FRONTEND} -s',
      cwd: '${INSTALL_DIR}',
      env: { NODE_ENV: 'production' }
    }
  ]
}
EOF
  pm2 start "$INSTALL_DIR/ecosystem.config.js" --silent 2>/dev/null || \
    pm2 restart "$INSTALL_DIR/ecosystem.config.js" --silent
  pm2 save --silent
  ok "Started with PM2"
else
  info "PM2 not found — starting manually (install PM2 for production: npm i -g pm2)"
  nohup node "$INSTALL_DIR/backend/dist/server.js" > /tmp/s8vr-backend.log 2>&1 &
  echo $! > /tmp/s8vr-backend.pid
  nohup npx serve "$INSTALL_DIR/dist" -p "$PORT_FRONTEND" -s > /tmp/s8vr-frontend.log 2>&1 &
  echo $! > /tmp/s8vr-frontend.pid
  ok "Started (logs: /tmp/s8vr-*.log)"
fi

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "  ${DIM}$(printf '═%.0s' {1..54})${NC}"
echo ""
echo -e "  ${GREEN}${BOLD}s8vr is running!${NC}"
echo ""
echo -e "  ${BOLD}Open in your browser:${NC}"
echo -e "  ${BLUE}${BOLD}${APP_URL}${NC}"
echo ""
echo -e "  ${DIM}Useful commands:${NC}"
echo -e "  ${DIM}·${NC} Logs:    ${DIM}pm2 logs${NC}"
echo -e "  ${DIM}·${NC} Status:  ${DIM}pm2 status${NC}"
echo -e "  ${DIM}·${NC} Restart: ${DIM}pm2 restart all${NC}"
echo -e "  ${DIM}·${NC} Docs:    ${BLUE}https://github.com/Alexsometimescode/s8vr${NC}"
echo ""
