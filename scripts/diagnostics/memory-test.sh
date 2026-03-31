#!/bin/bash
# =============================================================================
# Memory Test Script
# Hits every major route to simulate full usage, then reports peak RSS.
# Usage: ./scripts/memory-test.sh [base_url]
# Default: http://localhost:3000
# =============================================================================

BASE="${1:-http://localhost:3000}"
COOKIE_JAR="/tmp/cms-memory-test-cookies.txt"

echo "=== Memory Test ==="
echo "Target: $BASE"
echo ""

# --- Get initial memory ---
echo "--- Initial Memory ---"
ps aux | grep "next-server\|node.*server.js" | grep -v grep | awk '{printf "PID %s — RSS: %.1f MB\n", $2, $6/1024}'
echo ""

# --- Login to get session cookie ---
echo "--- Logging in ---"
# Get CSRF token
curl -sk -c "$COOKIE_JAR" "$BASE/cms/login" > /dev/null 2>&1
CSRF=$(cat "$COOKIE_JAR" | grep csrf | awk '{print $NF}')

# Login with credentials
curl -sk -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST "$BASE/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=${AUTH_TEST_EMAIL}&password=${AUTH_TEST_PASSWORD}&csrfToken=$CSRF&callbackUrl=$BASE/cms/dashboard" \
  -L > /dev/null 2>&1

echo "Session established"
echo ""

# --- Hit all website routes (public) ---
echo "--- Website Routes ---"
WEBSITE_ROUTES=(
  "/"
  "/about"
  "/messages"
  "/events"
  "/ministries"
  "/im-new"
  "/giving"
  "/contact"
  "/bible-study"
)

for route in "${WEBSITE_ROUTES[@]}"; do
  STATUS=$(curl -sk -o /dev/null -w "%{http_code}" "$BASE$route")
  printf "  %-30s %s\n" "$route" "$STATUS"
done
echo ""

# --- Hit all CMS routes (authenticated) ---
echo "--- CMS Routes ---"
CMS_ROUTES=(
  "/cms/dashboard"
  "/cms/messages"
  "/cms/events"
  "/cms/media"
  "/cms/storage"
  "/cms/people"
  "/cms/people/members"
  "/cms/people/groups"
  "/cms/church-profile"
  "/cms/form-submissions"
  "/cms/website/pages"
  "/cms/website/navigation"
  "/cms/website/theme"
  "/cms/website/settings"
  "/cms/website/domains"
  "/cms/settings"
  "/cms/settings/roles"
)

for route in "${CMS_ROUTES[@]}"; do
  STATUS=$(curl -sk -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" "$BASE$route")
  printf "  %-30s %s\n" "$route" "$STATUS"
done
echo ""

# --- Hit all API routes ---
echo "--- API Routes ---"
API_ROUTES=(
  "/api/v1/messages?page=1&pageSize=10"
  "/api/v1/bible-studies?page=1&pageSize=10"
  "/api/v1/events"
  "/api/v1/videos"
  "/api/v1/series"
  "/api/v1/media?folder=/&sort=newest"
  "/api/v1/media/folders"
  "/api/v1/storage"
  "/api/v1/people?page=1&pageSize=10"
  "/api/v1/roles"
  "/api/v1/ministries"
  "/api/v1/campuses"
  "/api/v1/daily-bread"
  "/api/v1/church"
  "/api/v1/menus"
  "/api/v1/pages"
  "/api/v1/site-settings"
  "/api/v1/theme"
  "/api/v1/form-submissions?countOnly=true"
  "/api/v1/access-requests?status=PENDING"
)

for route in "${API_ROUTES[@]}"; do
  STATUS=$(curl -sk -b "$COOKIE_JAR" -o /dev/null -w "%{http_code}" "$BASE$route")
  printf "  %-45s %s\n" "$route" "$STATUS"
done
echo ""

# --- Simulate concurrent load (5 parallel requests × 3 rounds) ---
echo "--- Concurrent Load (5 parallel × 3 rounds) ---"
for round in 1 2 3; do
  curl -sk -b "$COOKIE_JAR" "$BASE/" &
  curl -sk -b "$COOKIE_JAR" "$BASE/cms/messages" &
  curl -sk -b "$COOKIE_JAR" "$BASE/cms/events" &
  curl -sk -b "$COOKIE_JAR" "$BASE/api/v1/messages?page=1&pageSize=50" &
  curl -sk -b "$COOKIE_JAR" "$BASE/api/v1/bible-studies?page=1&pageSize=50" &
  wait
  echo "  Round $round complete"
done
echo ""

# --- Final memory ---
echo "--- Peak Memory (after full load) ---"
ps aux | grep "next-server\|node.*server.js" | grep -v grep | awk '{printf "PID %s — RSS: %.1f MB\n", $2, $6/1024}'

# Cleanup
rm -f "$COOKIE_JAR"

echo ""
echo "Done. Compare initial vs peak RSS above."
