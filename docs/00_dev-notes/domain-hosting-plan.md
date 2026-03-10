# Domain Hosting & Deployment Plan

> **Created:** 2026-03-09
> **Status:** Planning
> **Scope:** MVP (LA UBF single-tenant) → multi-tenant ready

---

## Remaining Work

- [x] Create `middleware.ts` for subdomain-based routing
- [x] Add `NEXT_PUBLIC_ROOT_DOMAIN`, `WEBSITE_URL`, `CMS_URL` env vars
- [x] Create `lib/url.ts` — dynamic URL helper (`getWebsiteUrl()`, `getCmsUrl()`)
- [x] Update builder topbar "View Site" to open real domain
- [x] Make domains page default subdomain dynamic (not hardcoded `la-ubf.lclab.io`)
- [x] Gate custom domain add form with "Coming Soon" overlay
- [x] DNS instructions removed (gated behind "Coming Soon")
- [x] Add `output: 'standalone'` to `next.config.ts`
- [x] Create deployment script (`scripts/deploy.sh`)
- [x] Create nginx config template (`scripts/nginx/laubf.conf`)
- [x] `laubf-test/` already in `.gitignore`

### Remaining (server-side — run Claude on the VM)

- [ ] SSH into Azure VM, confirm nginx setup, apply `scripts/nginx/laubf.conf`
- [ ] Get SSL certs: `sudo certbot --nginx -d laubf.lclab.io -d admin.laubf.lclab.io`
- [ ] Add DNS A records in Namecheap: `laubf` + `admin.laubf` → VM IP
- [ ] Create `.env.production` with production values
- [ ] Deploy via `./scripts/deploy.sh user@host`
- [ ] Disconnect old service from `laubf.lclab.io`
- [ ] Test full flow: `laubf.lclab.io` serves website, `admin.laubf.lclab.io` serves CMS
- [ ] Update `AUTH_URL` in production to `https://admin.laubf.lclab.io`

---

## 1. Architecture Overview

### Current State

```
localhost:3000/website/...     → Public website (app/website/ routes)
localhost:3000/cms/...         → CMS admin (app/cms/ routes)
admin.laubf.lclab.io/cms/...  → CMS (deployed, working)
laubf.lclab.io                → Currently another service (needs to be switched)
```

### Target State (MVP)

```
laubf.lclab.io/              → Public website (middleware rewrites to /website/...)
laubf.lclab.io/about          → Public page  (middleware rewrites to /website/about)
laubf.lclab.io/messages/...   → Public page  (middleware rewrites to /website/messages/...)
admin.laubf.lclab.io/cms/...  → CMS admin    (middleware passes through)
```

**Key insight:** A Next.js middleware rewrite is invisible to the browser. `laubf.lclab.io/about` stays exactly as `laubf.lclab.io/about` in the URL bar, Google, and all links. The `/website` prefix is purely internal routing — it never appears publicly.

### Target State (Multi-Tenant — Future)

```
laubf.lclab.io/               → LA UBF website      (slug: la-ubf)
grace.lclab.io/               → Grace Church website (slug: grace)
www.gracechurch.org/           → Grace Church website (custom domain)
admin.laubf.lclab.io/cms/     → LA UBF CMS
admin.grace.lclab.io/cms/     → Grace CMS (or grace.lclab.io/cms)
lclab.io/                     → Marketing site (future)
```

The MVP middleware is designed so that multi-tenant is a configuration change, not an architecture change.

---

## 2. How the Middleware Works

### Domain Routing Logic

```
Request arrives at hostname
│
├─ hostname = admin.*.lclab.io (e.g., admin.laubf.lclab.io)
│  └─ CMS admin: pass through (serves /cms/... routes as-is)
│
├─ hostname = *.lclab.io (e.g., laubf.lclab.io)
│  ├─ Extract slug from subdomain (laubf → la-ubf mapping or direct slug)
│  ├─ Set x-tenant-slug header
│  └─ Rewrite: /about → /website/about (invisible to browser)
│
├─ hostname = custom domain (e.g., www.laubf.org) [FUTURE]
│  ├─ Look up CustomDomain table → get church slug
│  ├─ Set x-tenant-slug header
│  └─ Rewrite: /about → /website/about
│
├─ hostname = lclab.io (root domain) [FUTURE]
│  └─ Marketing site (serve (marketing) route group)
│
└─ hostname = localhost:3000 (development)
   └─ Pass through — /website/... and /cms/... work as-is
```

### What Stays the Same

- **CMS routes (`/cms/*`)**: No rewriting. Middleware only checks auth (existing behavior).
- **API routes (`/api/*`)**: No rewriting. Pass through directly.
- **Static assets (`/_next/*`, `/favicon.ico`)**: Skip middleware entirely.
- **Auth flow**: No changes. Auth.js callbacks, JWT tokens, session — all unchanged.

### What Changes

- **Website routes**: Requests to `laubf.lclab.io/about` get rewritten to `/website/about` internally.
- **Tenant context**: `lib/tenant/context.ts` reads `x-tenant-slug` header (already supported — currently unused because there's no middleware setting it).

---

## 3. Environment Variables

### New Variables

```env
# Domain Configuration
NEXT_PUBLIC_ROOT_DOMAIN=lclab.io           # Platform root domain (used by middleware)
WEBSITE_URL=https://laubf.lclab.io         # Public website URL (for emails, OG tags, sitemaps)
CMS_URL=https://admin.laubf.lclab.io       # CMS admin URL (for internal redirects)

# Already exists, update for production:
AUTH_URL=https://admin.laubf.lclab.io       # Auth.js base URL (must match CMS domain)
```

### Why Three URL Variables?

| Variable | Used By | Example | Why Separate |
|----------|---------|---------|--------------|
| `WEBSITE_URL` | Email templates, OG meta, sitemaps, "View Site" button | `https://laubf.lclab.io` | The public-facing URL visitors see |
| `CMS_URL` | Auth callbacks, internal redirects, admin links | `https://admin.laubf.lclab.io` | CMS lives on a different subdomain |
| `AUTH_URL` | Auth.js config (NextAuth) | `https://admin.laubf.lclab.io` | Auth.js needs to know its own origin |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Middleware (subdomain extraction) | `lclab.io` | Edge runtime — no DB access, needs to be fast |

### Development vs Production

```env
# .env (development)
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
WEBSITE_URL=http://localhost:3000/website
CMS_URL=http://localhost:3000
AUTH_URL=http://localhost:3000

# .env.production (production)
NEXT_PUBLIC_ROOT_DOMAIN=lclab.io
WEBSITE_URL=https://laubf.lclab.io
CMS_URL=https://admin.laubf.lclab.io
AUTH_URL=https://admin.laubf.lclab.io
```

In development, there's no subdomain routing — `/website/...` is accessed directly. The middleware detects `localhost` and skips rewriting.

### Multi-Tenant Future

When church #2 arrives, `WEBSITE_URL` and `CMS_URL` become dynamic (resolved per-tenant from DB). `NEXT_PUBLIC_ROOT_DOMAIN` stays the same — it's the platform constant. The middleware already handles multiple subdomains by design. The only changes needed:

1. Remove hardcoded `WEBSITE_URL` from env — compute it from `slug + ROOT_DOMAIN`
2. Update `getWebsiteUrl()` helper to accept a churchSlug parameter
3. Add wildcard DNS (`*.lclab.io`) instead of per-subdomain A records

---

## 4. File Inventory

### New Files

| File | Purpose |
|------|---------|
| `middleware.ts` | Domain routing — subdomain detection, rewrite to `/website/...` |
| `lib/url.ts` | URL helpers: `getWebsiteUrl()`, `getCmsUrl()`, `getPageUrl()` |
| `scripts/deploy.sh` | Server deployment script (build, upload, restart) |
| `scripts/nginx/laubf.conf` | nginx config template for production |

### Modified Files

| File | Change |
|------|--------|
| `.env` / `.env.example` | Add `NEXT_PUBLIC_ROOT_DOMAIN`, `WEBSITE_URL`, `CMS_URL` |
| `next.config.ts` | Add `output: 'standalone'` |
| `lib/email/templates.ts` | Use `WEBSITE_URL` instead of `AUTH_URL` for email links |
| `lib/auth/edge-config.ts` | Integrate with new middleware (minimal changes) |
| `lib/tenant/context.ts` | Read `x-tenant-slug` → resolve to churchId |
| `components/cms/website/builder/builder-topbar.tsx` | "View Site" opens real domain URL |
| `app/cms/(dashboard)/website/domains/page.tsx` | Dynamic subdomain, gate custom domains |
| `.gitignore` | Add `laubf-test/` |

### Unchanged Files (by design)

| File | Why No Changes |
|------|---------------|
| `app/website/**` | Routes stay at `/website/...` — middleware handles the rewrite |
| `app/cms/**` | CMS routes unchanged — served on `admin.` subdomain |
| `app/api/**` | API routes unchanged — no rewriting needed |
| `lib/dal/**` | DAL functions unchanged — `churchId` resolution happens upstream |
| `prisma/schema.prisma` | No schema changes — `CustomDomain` model already exists |
| `lib/auth/config.ts` | Auth config unchanged — just update `AUTH_URL` env var |

---

## 5. Middleware Implementation

### middleware.ts

```typescript
// middleware.ts (project root)
import { NextRequest, NextResponse } from 'next/server'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'

export default function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || ''
  const { pathname } = req.nextUrl

  // Skip static assets, API routes, CMS routes, auth routes
  // These should NOT be rewritten — they work as-is
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/cms') ||
    pathname.startsWith('/website') ||  // Direct access (dev mode)
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Development: localhost — no subdomain routing
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return NextResponse.next()
  }

  // Admin subdomain: admin.*.lclab.io — pass through (CMS is at /cms/...)
  if (hostname.startsWith('admin.')) {
    return NextResponse.next()
  }

  // Church subdomain: laubf.lclab.io → rewrite to /website/...
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const slug = hostname.replace(`.${ROOT_DOMAIN}`, '')

    // Rewrite root to /website, /about to /website/about, etc.
    const websitePath = pathname === '/' ? '/website' : `/website${pathname}`
    const url = req.nextUrl.clone()
    url.pathname = websitePath

    const response = NextResponse.rewrite(url)
    response.headers.set('x-tenant-slug', slug)
    return response
  }

  // [FUTURE] Custom domain lookup
  // const tenantSlug = await resolveCustomDomain(hostname)
  // if (tenantSlug) { ... rewrite to /website/... }

  // Unrecognized domain — pass through (could 404 or redirect)
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Key Design Decisions

1. **No database calls in middleware.** The middleware runs on every request in Edge Runtime. For MVP, the slug is extracted from the subdomain — no DB lookup needed. Custom domain resolution (future) will use Redis/KV cache.

2. **CMS routes are NOT rewritten.** The `admin.` subdomain serves CMS pages directly. No `/cms` → `/admin/cms` rewriting or anything like that. The existing auth middleware in `edge-config.ts` handles CMS auth as before.

3. **Auth.js middleware compatibility.** Auth.js currently runs its own middleware via `edge-config.ts`. The new `middleware.ts` handles domain routing FIRST, then Auth.js authorized callback runs on the resulting route. Auth.js needs no changes — it already skips website routes and only gates `/cms/*` and `/api/v1/*`.

4. **`/website` direct access works in dev.** When developing locally, you access `/website/...` directly at `localhost:3000/website/about`. The middleware detects localhost and skips rewriting.

### How Auth.js Middleware Integrates

Currently auth is configured in `edge-config.ts` with an `authorized` callback. Auth.js creates its own middleware wrapper. We need to combine them:

```typescript
// middleware.ts — combined approach
import { auth } from '@/lib/auth/edge-config'  // This wraps NextAuth middleware

// The auth() wrapper from Auth.js calls our authorized callback
// We chain our domain routing before it
export default auth((req) => {
  // Domain routing logic runs after auth check
  // ...rewrite logic from above...
})
```

**Or simpler (recommended for MVP):** Keep domain routing and auth as separate concerns. Auth.js `authorized` callback already returns `true` for non-CMS routes. The middleware rewrite happens before auth checks the path, so `/website/about` (rewritten) is a public route — auth passes it through.

---

## 6. URL Helper — `lib/url.ts`

```typescript
/**
 * URL construction helpers.
 * Centralizes all domain/URL logic so nothing is hardcoded in components.
 */

/** Public website URL (what visitors see in their browser) */
export function getWebsiteUrl(): string {
  return process.env.WEBSITE_URL || 'http://localhost:3000/website'
}

/** CMS admin URL */
export function getCmsUrl(): string {
  return process.env.CMS_URL || process.env.AUTH_URL || 'http://localhost:3000'
}

/** Full URL for a website page */
export function getPageUrl(slug: string): string {
  const base = getWebsiteUrl()
  if (!slug || slug === '/') return base
  return `${base}/${slug.replace(/^\//, '')}`
}

/** Default subdomain for the current church (e.g., "laubf.lclab.io") */
export function getDefaultSubdomain(): string {
  const slug = process.env.CHURCH_SLUG || 'la-ubf'
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
  if (rootDomain.includes('localhost')) {
    return `localhost:3000/website`
  }
  return `${slug}.${rootDomain}`
}
```

### Where This Gets Used

| Location | Before | After |
|----------|--------|-------|
| Email templates (`lib/email/templates.ts`) | `process.env.AUTH_URL` for all links | `getWebsiteUrl()` for verify/reset links, `getCmsUrl()` for CMS links |
| Builder topbar "View Site" | `window.open("/website")` | `window.open(getPageUrl(page.slug))` |
| Domains page default subdomain | Hardcoded `"la-ubf.lclab.io"` | `getDefaultSubdomain()` |
| OG meta tags | Not implemented | `getPageUrl(slug)` for canonical URLs |

---

## 7. CMS Domains Page Updates

### Changes Needed

1. **Dynamic default subdomain**: Replace hardcoded `"la-ubf.lclab.io"` with `getDefaultSubdomain()` (fetched from an API or computed client-side from env).

2. **Gate custom domain add form**: Replace the add form with a "Coming Soon" card. The existing add/delete API stays functional (for future use) but the UI prevents interaction.

3. **Dynamic DNS IP**: Replace hardcoded `76.76.21.21` with a value from env or API. For MVP this doesn't matter since custom domains are gated, but it should be configurable for when we un-gate it.

### Gated Custom Domain Card

```tsx
{/* Add Custom Domain — Coming Soon */}
<Card>
  <CardHeader>
    <CardTitle>Custom Domains</CardTitle>
    <CardDescription>
      Connect your own domain to your church website.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Globe className="size-8 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium text-muted-foreground mb-1">
        Coming Soon
      </p>
      <p className="text-xs text-muted-foreground max-w-sm">
        Custom domain support is coming in a future update.
        Your website is available at your default subdomain.
      </p>
    </div>
  </CardContent>
</Card>
```

---

## 8. Email Template Updates

### Current Problem

Email templates use `AUTH_URL` (which points to the CMS domain) for all links. This means:
- Verification link: `https://admin.laubf.lclab.io/cms/verify-email?token=...` ← Correct (CMS route)
- Password reset: `https://admin.laubf.lclab.io/cms/reset-password?token=...` ← Correct (CMS route)

Actually, **email links are fine** — they all point to CMS pages (`/cms/verify-email`, `/cms/reset-password`, `/cms/accept-invite`), which live on the `admin.` subdomain. No changes needed for MVP.

### Future Consideration

When the website has public-facing links (e.g., "View your church's website" in a welcome email), those should use `WEBSITE_URL`. For now, all email links are CMS actions — `AUTH_URL` is correct.

---

## 9. nginx Configuration

### Current Setup (Assumed)

The Azure VM likely has nginx proxying `admin.laubf.lclab.io` to the Next.js app on port 3000. We need to add a second server block for `laubf.lclab.io`.

### Required nginx Config

```nginx
# /etc/nginx/sites-available/laubf

# Website: laubf.lclab.io → Next.js app
server {
    listen 80;
    server_name laubf.lclab.io;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# CMS Admin: admin.laubf.lclab.io → Same Next.js app
server {
    listen 80;
    server_name admin.laubf.lclab.io;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**SSL:** Use certbot to get Let's Encrypt certificates for both domains:
```bash
sudo certbot --nginx -d laubf.lclab.io -d admin.laubf.lclab.io
```

This auto-modifies the nginx config to add SSL (listen 443, redirect 80→443, cert paths).

### DNS Requirements

Two A records in Namecheap DNS for `lclab.io`:

| Type | Name | Value |
|------|------|-------|
| A | `laubf` | `<Azure VM IP>` |
| A | `admin.laubf` | `<Azure VM IP>` |

**Note:** DNS is managed in Namecheap (not Cloudflare). SSL is handled by certbot on the server.

---

## 10. Deployment Script

### scripts/deploy.sh

```bash
#!/usr/bin/env bash
# Deploy the Next.js app to the Azure VM.
#
# Prerequisites:
#   - SSH access to the server (ssh key configured)
#   - Node.js 20+ installed on server
#   - PM2 installed globally: npm install -g pm2
#   - nginx configured (see docs/00_dev-notes/domain-hosting-plan.md §9)
#
# Usage:
#   ./scripts/deploy.sh <server-user>@<server-ip>
#
# Example:
#   ./scripts/deploy.sh azureuser@20.1.2.3

set -euo pipefail

SERVER="${1:?Usage: ./scripts/deploy.sh user@host}"
APP_DIR="/home/$(echo $SERVER | cut -d@ -f1)/laubf-cms"
BUILD_DIR=".next/standalone"

echo "=== Building Next.js standalone ==="
npm run build

echo "=== Uploading build to $SERVER:$APP_DIR ==="
# Create app directory if it doesn't exist
ssh "$SERVER" "mkdir -p $APP_DIR"

# Upload standalone build + static + public
rsync -azP --delete \
  "$BUILD_DIR/" \
  "$SERVER:$APP_DIR/"

rsync -azP --delete \
  ".next/static/" \
  "$SERVER:$APP_DIR/.next/static/"

rsync -azP \
  "public/" \
  "$SERVER:$APP_DIR/public/"

# Upload .env.production as .env
rsync -azP \
  ".env.production" \
  "$SERVER:$APP_DIR/.env"

echo "=== Restarting app on server ==="
ssh "$SERVER" "cd $APP_DIR && pm2 restart laubf-cms || pm2 start server.js --name laubf-cms"

echo "=== Done! ==="
echo "Website: https://laubf.lclab.io"
echo "CMS:     https://admin.laubf.lclab.io/cms"
```

### First-Time Server Setup

Run these commands once on the Azure VM before the first deploy:

```bash
# 1. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Install PM2
sudo npm install -g pm2
pm2 startup  # Follow the instructions to enable auto-start

# 3. Install nginx + certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# 4. Copy nginx config (or create via the template in §9)
sudo nano /etc/nginx/sites-available/laubf
sudo ln -s /etc/nginx/sites-available/laubf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 5. Get SSL certificates
sudo certbot --nginx -d laubf.lclab.io -d admin.laubf.lclab.io

# 6. Set up Prisma database
# (Run migrations on the production database — the app connects via DATABASE_URL in .env)
```

---

## 11. next.config.ts Changes

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',  // ← ADD THIS for self-hosted deployment
  images: {
    remotePatterns: [
      // ... existing patterns ...
    ],
  },
}
```

`output: 'standalone'` produces a self-contained build at `.next/standalone/` that includes only the necessary `node_modules`. This is required for non-Vercel deployments.

---

## 12. Builder "View Site" Button

### Current (broken for production)

```typescript
onClick={() => {
  const path = page.isHomepage ? "/website" : `/website/${page.slug}`
  window.open(path, "_blank")
}}
```

### Updated

```typescript
onClick={() => {
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || '/website'
  const path = page.isHomepage ? '' : `/${page.slug}`
  window.open(`${websiteUrl}${path}`, "_blank")
}}
```

**Note:** `WEBSITE_URL` is server-side only. For the client component, we need `NEXT_PUBLIC_WEBSITE_URL` or fetch the URL from an API endpoint. Simplest approach: add `NEXT_PUBLIC_WEBSITE_URL=https://laubf.lclab.io` to env.

Alternatively, create an API endpoint (`GET /api/v1/site-info`) that returns the website URL, and fetch it in the builder.

---

## 13. Multi-Tenant Migration Path

When church #2 arrives, here's what changes:

### Middleware Changes (Small)

```diff
// middleware.ts
- // Only handles laubf subdomain
+ // Handles any *.lclab.io subdomain
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const slug = hostname.replace(`.${ROOT_DOMAIN}`, '')
+   // Validate slug exists (cache in Redis/KV)
    const websitePath = pathname === '/' ? '/website' : `/website${pathname}`
    ...
  }

+ // Custom domain support
+ const tenantSlug = await resolveCustomDomain(hostname)
+ if (tenantSlug) { ... }
```

### Tenant Context Changes (Small)

```diff
// lib/tenant/context.ts
  export async function getChurchId(): Promise<string> {
    const headersList = await headers()
-   const churchId = headersList.get('x-tenant-id')
+   const tenantSlug = headersList.get('x-tenant-slug')
+   if (tenantSlug) {
+     const church = await prisma.church.findUnique({ where: { slug: tenantSlug } })
+     if (church) return church.id
+   }
+   const churchId = headersList.get('x-tenant-id')
    if (churchId) return churchId
    // ... existing fallback ...
  }
```

### DNS Changes

```diff
  # Cloudflare DNS for lclab.io
- A  laubf        <VM IP>    # Single subdomain
- A  admin.laubf  <VM IP>    # Single admin subdomain
+ A  *            <VM IP>    # Wildcard — all subdomains
+ A  admin.*      <VM IP>    # Admin subdomains (or handle in middleware)
```

### URL Helper Changes

```diff
// lib/url.ts
- export function getWebsiteUrl(): string {
-   return process.env.WEBSITE_URL || 'http://localhost:3000/website'
+ export function getWebsiteUrl(churchSlug?: string): string {
+   if (churchSlug) {
+     const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
+     return `https://${churchSlug}.${rootDomain}`
+   }
+   return process.env.WEBSITE_URL || 'http://localhost:3000/website'
  }
```

### What Does NOT Change

- Prisma schema (already has `churchId` on everything)
- DAL functions (already take `churchId` as first param)
- API routes (already scoped via `requireApiAuth()`)
- CMS UI (already reads from session's `churchId`)
- Auth system (already stores `churchId` in JWT)
- Website rendering (already uses `getChurchId()` from tenant context)

**The architecture is already multi-tenant at the data layer.** The only single-tenant pieces are:
1. The `CHURCH_SLUG` env var fallback (removed when middleware sets headers)
2. Hardcoded URLs (fixed by `lib/url.ts` helpers)
3. DNS (upgraded from single A record to wildcard)

---

## 14. Switching From the Current Service

You mentioned another service is currently using `laubf.lclab.io`. The switchover process:

1. **Before switchover**: Deploy the app to the Azure VM and verify it works at the VM's IP or a temporary domain (e.g., `test.lclab.io`).

2. **DNS cutover**: Change the `laubf` A record in Cloudflare to point to the Azure VM's IP. DNS propagation takes seconds to minutes with Cloudflare.

3. **SSL**: If using certbot, run `sudo certbot --nginx -d laubf.lclab.io` after DNS points to the VM. If using Cloudflare proxy, SSL is automatic.

4. **Rollback plan**: Keep the old service running on a different port. If something breaks, flip the DNS back (or point nginx to the old service's port).

**Zero-downtime approach**: Since Cloudflare DNS has near-instant propagation, the switchover is effectively instantaneous. Users hitting the old service during the brief transition will see the old site; after propagation, they see the new site.

---

## 15. Implementation Order

### Phase 1: Code Changes (no server needed)

1. Create `middleware.ts`
2. Create `lib/url.ts`
3. Add env vars to `.env` and `.env.example`
4. Update builder topbar "View Site"
5. Update domains page (dynamic subdomain + gate custom domains)
6. Add `output: 'standalone'` to `next.config.ts`
7. Add `laubf-test/` to `.gitignore`
8. Test locally: verify middleware rewrites work, `/website/...` still works directly

### Phase 2: Server Preparation (needs SSH access)

9. SSH into Azure VM, confirm nginx is running, document current config
10. Create nginx config for `laubf.lclab.io` + `admin.laubf.lclab.io`
11. Create deployment script (`scripts/deploy.sh`)
12. Add DNS records in Cloudflare (if not already done)

### Phase 3: Deploy & Switch

13. Deploy app to Azure VM using `scripts/deploy.sh`
14. Get SSL certificates via certbot
15. Verify at `laubf.lclab.io` and `admin.laubf.lclab.io`
16. Switch DNS from old service to Azure VM (if needed)
17. Update `.env.production` with correct `AUTH_URL`, `WEBSITE_URL`, `CMS_URL`

---

## 16. Questions to Resolve Before Starting

These need your input:

| # | Question | Impact |
|---|----------|--------|
| 1 | What's the Azure VM IP address? | nginx config, DNS records, deploy script |
| 2 | Can you SSH in and run `nginx -v` and `cat /etc/nginx/sites-enabled/*`? | Understand current nginx setup |
| 3 | Is there a `pm2` or `systemd` process running the current service? | Know how to stop/replace it |
| 4 | Is the DNS for `lclab.io` managed in Cloudflare? | Determines how we add records |
| 5 | Is there a `.env.production` file or are env vars set on the server directly? | Deployment script needs to know |
| 6 | The CMS is already at `admin.laubf.lclab.io` — is this the same Next.js app, or a separate deployment? | Determines if we're adding a domain or replacing |

---

## 17. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Middleware breaks CMS auth | Low | High | Middleware explicitly skips `/cms/*` and `admin.` subdomain |
| SSL cert issues during switchover | Medium | Medium | Certbot handles this; Cloudflare proxy as backup |
| Email links point to wrong domain | Low | Medium | Email links go to CMS routes which are on `admin.` — unchanged |
| Session cookies scoped wrong | Medium | High | Set `AUTH_URL` to `admin.laubf.lclab.io`; cookies auto-scope to that domain |
| Old service still running on same port | Low | High | Stop old service before starting new one; use different port if needed |

### Cookie Scoping (Important)

Auth.js sets session cookies. The cookie domain matters:
- **Cookie set on `admin.laubf.lclab.io`**: Only sent to `admin.laubf.lclab.io` — CMS works, website is public (no cookies needed). This is correct.
- **Cookie set on `.lclab.io`**: Sent to ALL subdomains — session leaks to website. This is wrong.

Auth.js defaults to the current hostname for cookie domain, so as long as `AUTH_URL=https://admin.laubf.lclab.io`, cookies are scoped correctly.

---

## Cross-References

| Topic | Document |
|-------|----------|
| Hosting & domain strategy (detailed) | `docs/03_website-rendering/06-hosting-domain-strategy.md` |
| Multi-tenant routing (future) | `docs/05_multi-tenant-platform/04-multi-tenant-routing.md` |
| Implementation phases | `docs/05_multi-tenant-platform/08-implementation-phases.md` |
| Deployment roadmap | `docs/deployment-roadmap.md` |
| Auth implementation | `docs/00_dev-notes/auth-users-permissions-plan.md` |
