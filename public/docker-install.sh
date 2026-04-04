#!/usr/bin/env bash
# s8vr — Docker Installer
# Usage: curl -fsSL https://s8vr.app/docker-install.sh | bash

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
ok()      { echo -e "  ${GREEN}✓${NC}  $1"; }
fail()    { echo -e "  ${RED}✗${NC}  $1"; exit 1; }
info()    { echo -e "  ${DIM}→${NC}  $1"; }
section() { echo ""; echo -e "${BOLD}${WHITE}  $1${NC}"; echo -e "  ${DIM}$(printf '─%.0s' {1..52})${NC}"; }

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
echo -e "   ${DIM}Self-Hosted Invoicing  ·  Docker Install${NC}"
echo ""
echo -e "   ${DIM}MIT License · https://github.com/Alexsometimescode/s8vr${NC}"
echo ""
echo -e "  ${DIM}$(printf '═%.0s' {1..54})${NC}"
echo ""
echo -e "  This installer will:"
echo -e "  ${DIM}·${NC} Download the Docker Compose configuration"
echo -e "  ${DIM}·${NC} Walk you through configuration"
echo -e "  ${DIM}·${NC} Pull and start all containers"
echo ""
echo -e "  ${YELLOW}Have your Supabase, Stripe, and Resend${NC}"
echo -e "  ${YELLOW}credentials ready before continuing.${NC}"
echo ""
printf "  Press ${BOLD}Enter${NC} to begin or ${BOLD}Ctrl+C${NC} to cancel "
read -r </dev/tty

# ─── Requirements ─────────────────────────────────────────────────────────────
section "Checking requirements"
echo ""

command -v docker >/dev/null 2>&1 && ok "Docker $(docker --version | grep -oE '[0-9]+\.[0-9]+')" || \
  fail "Docker not found. Install from: https://docs.docker.com/get-docker/"

# Check for docker compose (v2) or docker-compose (v1)
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
  ok "Docker Compose v2"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
  ok "Docker Compose v1"
else
  fail "Docker Compose not found. Install from: https://docs.docker.com/compose/install/"
fi

# ─── Install directory ────────────────────────────────────────────────────────
section "Installation directory"
echo ""
ask_default INSTALL_DIR "Install s8vr to" "$HOME/s8vr"
INSTALL_DIR="${INSTALL_DIR/#\~/$HOME}"

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"
ok "Using $INSTALL_DIR"

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

ask_default APP_URL       "Your app URL" "http://localhost:3000"
ask_default PORT_FRONTEND "Frontend port" "3000"
ask_default PORT_BACKEND  "Backend port" "3001"

JWT_SECRET=$(cat /dev/urandom | tr -dc 'a-f0-9' | head -c 96)

# ─── Download compose file ────────────────────────────────────────────────────
section "Downloading Docker configuration"
echo ""

info "Fetching docker-compose.yml..."
cat > "$INSTALL_DIR/docker-compose.yml" <<'COMPOSEFILE'
version: '3.8'

services:
  frontend:
    image: ghcr.io/alexsometimescode/s8vr-frontend:latest
    restart: unless-stopped
    ports:
      - "${PORT_FRONTEND:-3000}:80"
    env_file: .env
    depends_on:
      - backend

  backend:
    image: ghcr.io/alexsometimescode/s8vr-backend:latest
    restart: unless-stopped
    ports:
      - "${PORT_BACKEND:-3001}:3001"
    env_file: .env

  # Uncomment to run from source instead of pre-built images:
  # frontend:
  #   build:
  #     context: .
  #     dockerfile: Dockerfile.frontend
  #   ...
COMPOSEFILE

ok "docker-compose.yml created"

# ─── Write .env ───────────────────────────────────────────────────────────────
section "Writing configuration"
echo ""

cat > "$INSTALL_DIR/.env" <<EOF
# s8vr Configuration
# Generated by installer on $(date)

# Ports
PORT_FRONTEND=${PORT_FRONTEND}
PORT_BACKEND=${PORT_BACKEND}

# App URLs
FRONTEND_URL=${APP_URL}
VITE_API_URL=http://localhost:${PORT_BACKEND}

# Supabase
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_KEY}

# Database
DATABASE_URL=${DATABASE_URL}

# Auth
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}

# Email
RESEND_API_KEY=${RESEND_API_KEY}
FROM_EMAIL=${FROM_EMAIL}

# Setup
NODE_ENV=production
EOF

ok ".env written"

# ─── Pull & start ─────────────────────────────────────────────────────────────
section "Starting containers"
echo ""

info "Pulling images (this may take a minute)..."
$COMPOSE_CMD -f "$INSTALL_DIR/docker-compose.yml" pull 2>&1 | grep -E "Pull|pulled|already" | while read -r line; do info "$line"; done
ok "Images ready"

info "Starting containers..."
$COMPOSE_CMD -f "$INSTALL_DIR/docker-compose.yml" up -d
ok "Containers started"

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "  ${DIM}$(printf '═%.0s' {1..54})${NC}"
echo ""
echo -e "  ${GREEN}${BOLD}s8vr is running!${NC}"
echo ""
echo -e "  ${BOLD}Open in your browser:${NC}"
echo -e "  ${BLUE}${BOLD}${APP_URL}${NC}"
echo ""
echo -e "  ${DIM}Useful commands (from ${INSTALL_DIR}):${NC}"
echo -e "  ${DIM}·${NC} Status:  ${DIM}${COMPOSE_CMD} ps${NC}"
echo -e "  ${DIM}·${NC} Logs:    ${DIM}${COMPOSE_CMD} logs -f${NC}"
echo -e "  ${DIM}·${NC} Stop:    ${DIM}${COMPOSE_CMD} down${NC}"
echo -e "  ${DIM}·${NC} Update:  ${DIM}${COMPOSE_CMD} pull && ${COMPOSE_CMD} up -d${NC}"
echo -e "  ${DIM}·${NC} Docs:    ${BLUE}https://github.com/Alexsometimescode/s8vr${NC}"
echo ""
