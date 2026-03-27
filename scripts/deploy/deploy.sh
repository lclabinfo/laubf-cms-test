#!/usr/bin/env bash
# ─────────────────────────────────────────────────
# Deploy the Next.js standalone app to the server.
#
# Reads deployment config from .env (or .env.production):
#   DEPLOY_HOST     — SSH target (e.g. ubfuser@20.1.2.3)
#   DEPLOY_APP_DIR  — Remote app directory
#   DEPLOY_PM2_NAME — PM2 process name
#
# Usage:
#   ./scripts/deploy/deploy.sh                  # uses .env values
#   ./scripts/deploy/deploy.sh user@host        # override DEPLOY_HOST
#
# Prerequisites (run once on the server):
#   1. Node.js 20+:  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
#   2. PM2:          sudo npm install -g pm2 && pm2 startup
#   3. nginx:        sudo apt install -y nginx certbot python3-certbot-nginx
#   4. SSL certs:    sudo certbot --nginx -d <domain>
#   5. nginx config: See scripts/deploy/nginx/
# ─────────────────────────────────────────────────

set -euo pipefail

# ── Load config from .env files ──
load_env() {
  local file="$1"
  if [ -f "$file" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$file"
    set +a
  fi
}

# .env.production takes precedence over .env
load_env ".env"
load_env ".env.production"

# CLI arg overrides env for DEPLOY_HOST
SERVER="${1:-${DEPLOY_HOST:-}}"
APP_DIR="${DEPLOY_APP_DIR:-}"
PM2_NAME="${DEPLOY_PM2_NAME:-}"

# ── Validate required config ──
if [ -z "$SERVER" ]; then
  echo "Error: No deploy target."
  echo "Set DEPLOY_HOST in .env or pass as argument: ./scripts/deploy/deploy.sh user@host"
  exit 1
fi

if [ -z "$APP_DIR" ]; then
  echo "Error: DEPLOY_APP_DIR not set in .env"
  echo "Example: DEPLOY_APP_DIR=/home/ubfuser/digital_church/laubf_cms"
  exit 1
fi

if [ -z "$PM2_NAME" ]; then
  echo "Error: DEPLOY_PM2_NAME not set in .env"
  echo "Example: DEPLOY_PM2_NAME=laubf_cms"
  exit 1
fi

echo "═══════════════════════════════════════════"
echo "  DEPLOY: $PM2_NAME → $SERVER"
echo "  App dir: $APP_DIR"
echo "═══════════════════════════════════════════"

# ── 1. Build ──
echo ""
echo "=== 1. Building Next.js (standalone) ==="
npm run build

# ── 2. Upload ──
echo ""
echo "=== 2. Uploading to $SERVER:$APP_DIR ==="
ssh "$SERVER" "mkdir -p $APP_DIR/.next $APP_DIR/prisma"

# Standalone build (server.js + bundled node_modules)
rsync -azP --delete \
  ".next/standalone/" \
  "$SERVER:$APP_DIR/"

# Static assets (CSS, JS chunks) — standalone output doesn't include these
rsync -azP --delete \
  ".next/static/" \
  "$SERVER:$APP_DIR/.next/static/"

# Public assets (favicon, images, etc.)
if [ -d "public" ]; then
  rsync -azP \
    "public/" \
    "$SERVER:$APP_DIR/public/"
fi

# Production env file
if [ -f ".env.production" ]; then
  rsync -azP \
    ".env.production" \
    "$SERVER:$APP_DIR/.env"
  echo "   Uploaded .env.production → .env"
else
  echo "   WARNING: No .env.production found — ensure .env exists on server"
fi

# Prisma schema + migrations (needed for prisma migrate deploy)
rsync -azP --delete \
  "prisma/migrations/" \
  "$SERVER:$APP_DIR/prisma/migrations/"

rsync -azP \
  "prisma/schema.prisma" \
  "$SERVER:$APP_DIR/prisma/"

if [ -f "prisma.config.ts" ]; then
  rsync -azP "prisma.config.ts" "$SERVER:$APP_DIR/"
fi

# ── 3. Run migrations ──
echo ""
echo "=== 3. Running database migrations ==="
ssh "$SERVER" "cd $APP_DIR && npx prisma migrate deploy" || {
  echo "WARNING: prisma migrate deploy failed — check server manually"
}

# ── 4. Restart ──
echo ""
echo "=== 4. Restarting $PM2_NAME ==="
ssh "$SERVER" "cd $APP_DIR && pm2 restart $PM2_NAME 2>/dev/null || pm2 start server.js --name $PM2_NAME"

# ── Done ──
echo ""
echo "═══════════════════════════════════════════"
echo "  DEPLOY COMPLETE"
echo "═══════════════════════════════════════════"

# Print URLs from env if available
if [ -n "${NEXT_PUBLIC_WEBSITE_URL:-}" ]; then
  echo "  Website: $NEXT_PUBLIC_WEBSITE_URL"
fi
if [ -n "${CMS_URL:-}" ]; then
  echo "  CMS:     $CMS_URL/cms"
fi
