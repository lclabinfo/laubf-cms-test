#!/usr/bin/env bash
# ─────────────────────────────────────────────────
# Deploy the Next.js app to the Azure VM.
#
# Usage:
#   ./scripts/deploy.sh <user>@<host>
#
# Example:
#   ./scripts/deploy.sh azureuser@20.1.2.3
#
# Prerequisites (run once on the server):
#   1. Node.js 20+:  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
#   2. PM2:          sudo npm install -g pm2 && pm2 startup
#   3. nginx:        sudo apt install -y nginx certbot python3-certbot-nginx
#   4. SSL certs:    sudo certbot --nginx -d laubf.lclab.io -d admin.laubf.lclab.io
#   5. nginx config: See scripts/nginx/laubf.conf
# ─────────────────────────────────────────────────

set -euo pipefail

SERVER="${1:?Usage: ./scripts/deploy.sh user@host}"
REMOTE_USER="$(echo "$SERVER" | cut -d@ -f1)"
APP_DIR="/home/${REMOTE_USER}/laubf-cms"

echo "=== 1. Building Next.js (standalone) ==="
npm run build

echo ""
echo "=== 2. Uploading to $SERVER:$APP_DIR ==="
ssh "$SERVER" "mkdir -p $APP_DIR"

# Standalone build (includes server.js + minimal node_modules)
rsync -azP --delete \
  ".next/standalone/" \
  "$SERVER:$APP_DIR/"

# Static assets (CSS, JS chunks)
rsync -azP --delete \
  ".next/static/" \
  "$SERVER:$APP_DIR/.next/static/"

# Public assets (favicon, images, etc.)
if [ -d "public" ]; then
  rsync -azP \
    "public/" \
    "$SERVER:$APP_DIR/public/"
fi

# Upload production env
if [ -f ".env.production" ]; then
  rsync -azP \
    ".env.production" \
    "$SERVER:$APP_DIR/.env"
  echo "   Uploaded .env.production as .env"
else
  echo "   WARNING: No .env.production found — make sure .env exists on server"
fi

echo ""
echo "=== 3. Restarting app ==="
ssh "$SERVER" "cd $APP_DIR && pm2 restart laubf-cms 2>/dev/null || pm2 start server.js --name laubf-cms -- -p 3000"

echo ""
echo "=== Done! ==="
echo "Website: https://laubf.lclab.io"
echo "CMS:     https://admin.laubf.lclab.io/cms"
