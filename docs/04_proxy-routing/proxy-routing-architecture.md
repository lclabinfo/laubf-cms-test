# Proxy Routing Architecture

> How public website requests are routed from church subdomains to `/website/...` routes using the Next.js 16 `proxy.ts` file convention.

## Why proxy.ts, not middleware.ts

Next.js 16 [deprecated the `middleware` file convention](https://nextjs.org/docs/messages/middleware-to-proxy) and renamed it to [`proxy`](https://nextjs.org/docs/app/api-reference/file-conventions/proxy). The rename clarifies that the feature acts as a network-level proxy in front of the app, not as Express-style middleware. The API is identical — same `NextRequest`/`NextResponse`, same `config.matcher` — only the file and function name changed.

```diff
- // middleware.ts
- export function middleware(req) { ... }

+ // proxy.ts
+ export function proxy(req) { ... }
```

Our project migrated in commit `ef89140` (Feb 25, 2026) using the official codemod pattern.

**Reference:** The proxy file is auto-detected by Next.js at the project root (same level as `app/` or `pages/`). It exports a named `proxy` function and an optional `config` with `matcher`.

---

## Current Implementation

**File:** `/proxy.ts`

The proxy handles two concerns:

### 1. Subdomain Routing (Domain → /website rewrite)

When a request arrives at a church subdomain (e.g., `laubf.lclab.io/about`), the proxy rewrites it internally to `/website/about` so the `app/website/[[...slug]]/page.tsx` catch-all route handles it. The browser URL stays clean — no `/website/` prefix visible to users.

```
Browser: laubf.lclab.io/about
  → Proxy rewrites to: /website/about (internal)
  → Renders: app/website/[[...slug]]/page.tsx with slug=["about"]
```

### 2. Auth Gating (CMS + API protection)

CMS routes (`/cms/*`) and API routes (`/api/v1/*`) are protected via Auth.js. The proxy delegates to the edge-safe auth config (`lib/auth/edge-config.ts`) which checks for a valid JWT.

### Request Flow

```
Incoming Request
  │
  ├─ Static assets (_next/static, _next/image, favicon.ico)
  │   └─ Skipped by matcher → served directly
  │
  ├─ Church subdomain (laubf.lclab.io/*)
  │   ├─ Proxy rewrites / → /website
  │   ├─ Proxy rewrites /about → /website/about
  │   ├─ Sets x-tenant-slug header (e.g., "laubf")
  │   └─ Response served from app/website/ layout + catch-all
  │
  ├─ Admin subdomain (admin.lclab.io/website/*)
  │   └─ Redirected to /cms (blocked)
  │
  ├─ CMS routes (/cms/*)
  │   └─ Auth gated via Auth.js JWT check
  │
  ├─ API routes (/api/v1/*)
  │   └─ Auth gated via Auth.js JWT check
  │
  └─ Everything else
      └─ Passed through (NextResponse.next())
```

### Execution Order

Per [Next.js docs](https://nextjs.org/docs/app/api-reference/file-conventions/proxy#execution-order):

1. `headers` from next.config.ts
2. `redirects` from next.config.ts
3. **Proxy** (our `proxy.ts` — rewrites, redirects, auth)
4. `beforeFiles` rewrites from next.config.ts
5. Filesystem routes
6. Dynamic routes

The proxy runs **before** config-level rewrites. If the proxy rewrites a request, the config rewrites are skipped for that request.

---

## Key Files

| File | Purpose |
|------|---------|
| `proxy.ts` | Subdomain routing + auth gating |
| `lib/auth/edge-config.ts` | Edge-safe Auth.js config (no Prisma imports) |
| `lib/tenant/context.ts` | `getChurchId()` — reads `x-tenant-id` header, falls back to `CHURCH_SLUG` env |
| `lib/website/resolve-href.ts` | `resolveHref()` — prepends website base path to internal links |
| `next.config.ts` | `beforeFiles` rewrites (redundant backup, runs after proxy) |
| `app/website/[[...slug]]/page.tsx` | Catch-all website page route |
| `app/website/layout.tsx` | Website layout (navbar, footer, theme, fonts) |

---

## Environment Variables

### Critical: Build-time vs Runtime

Next.js treats `NEXT_PUBLIC_*` env vars specially — they are **inlined at `next build` time** into the JavaScript bundle. This applies to ALL contexts: client components, server components, AND proxy code.

**This means: a `NEXT_PUBLIC_` variable baked during a local build will have the local value even when deployed to production.**

Non-`NEXT_PUBLIC_` env vars are read via `process.env` at **runtime** in proxy code. This is confirmed by inspecting the compiled output — `AUTH_SECRET` appears as `process.env.AUTH_SECRET` while `NEXT_PUBLIC_ROOT_DOMAIN` is replaced with the literal `"localhost:3000"`.

### Variable Reference

| Variable | Type | Used By | Purpose |
|----------|------|---------|---------|
| `NEXT_PUBLIC_ROOT_DOMAIN` | Build-time | `proxy.ts`, link generation | Root domain for subdomain extraction (e.g., `lclab.io`). Inlined at build — must be correct when running `next build`. |
| `NEXT_PUBLIC_WEBSITE_BASE` | Build-time | `resolve-href.ts` | Link prefix: `'/website'` in dev, `''` in prod |
| `NEXT_PUBLIC_WEBSITE_URL` | Build-time | OG tags, emails | Full public URL (e.g., `https://laubf.lclab.io`) |
| `CHURCH_SLUG` | Runtime | `lib/tenant/context.ts` | Fallback tenant resolution |

### Development (.env)

```env
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
NEXT_PUBLIC_WEBSITE_BASE=/website
CHURCH_SLUG=la-ubf
```

### Production (.env on server)

```env
NEXT_PUBLIC_ROOT_DOMAIN=lclab.io
NEXT_PUBLIC_WEBSITE_BASE=
CHURCH_SLUG=la-ubf
```

**Build requirement:** Since `NEXT_PUBLIC_*` values are inlined at build time, always build on the production server (where the production `.env` is active) or set the production values before running `next build`.

---

## Root Cause of the 404 (March 26, 2026)

### The Bug

After deploying commit `19137c0` to the production server, all public website pages returned 404.

### Investigation

Diagnostic curl tests on the server confirmed:
- `curl http://localhost:3012/website` → **200** (direct access works)
- `curl -H "Host: laubf.lclab.io" http://localhost:3012/` → **404**
- `curl -H "Host: laubf.lclab.io" http://localhost:3012/about` → **404**

The pages exist and render correctly when accessed directly at `/website/...`. The routing layer (proxy + config rewrites) was breaking them.

### Root Cause: Double Rewriting

Commit `19137c0` added `beforeFiles` rewrites to `next.config.ts` that **conflicted with the proxy**:

```
Request: laubf.lclab.io/about

Step 3 (Proxy):        /about  →  /website/about     ✓ correct
Step 4 (beforeFiles):  /website/about  →  /website/website/about  ✗ DOUBLE REWRITE
```

The execution order is: Proxy → beforeFiles → Filesystem. After the proxy correctly rewrites to `/website/about`, the `beforeFiles` rewrites fire on the **rewritten URL**. Since `/website/about` still matches the rewrite pattern (`/:path((?!_next|api|favicon\\.ico).*)`) and the host condition (`laubf.lclab.io`), it prepends another `/website/` → resulting in `/website/website/about`.

The catch-all route receives slug `["website", "about"]` → `getPageBySlug(churchId, "website/about")` → no such page → `notFound()`.

### The Fix

Remove the `beforeFiles` rewrites from `next.config.ts`. The proxy in `proxy.ts` already handles subdomain routing correctly — the config rewrites were redundant and conflicting.

```diff
// next.config.ts
- async rewrites() { ... beforeFiles: [...] ... }
+ // Subdomain routing handled by proxy.ts — no config rewrites needed
```

### Why Not Use Config Rewrites Instead of Proxy?

| Feature | Proxy (`proxy.ts`) | Config Rewrites (`next.config.ts`) |
|---------|-------------------|-------------------------------------|
| Can set custom headers | Yes (`x-tenant-slug`) | No |
| Can do auth gating | Yes | No |
| Can read request details | Full `NextRequest` access | Only `has`/`missing` conditions |
| Double-rewrite risk | No (runs once) | Yes (runs after proxy) |

The proxy is the correct mechanism. Config rewrites cannot replace it because they can't do auth gating or set headers, and they conflict with proxy rewrites.

---

## Link Generation (resolveHref)

Internal links must work in both environments:

- **Dev:** `/website/about` (user navigates directly to `/website/...`)
- **Prod:** `/about` (proxy rewrites to `/website/about` transparently)

The `resolveHref()` function (in `lib/website/resolve-href.ts`) handles this:

```typescript
const WEBSITE_BASE = process.env.NEXT_PUBLIC_WEBSITE_BASE ?? '/website'

export function resolveHref(href: string): string {
  // External URLs, anchors — pass through
  // Already prefixed — pass through
  // Internal path: prepend WEBSITE_BASE
  return `${WEBSITE_BASE}${path}`
}
```

**33 files** use `resolveHref()` for link generation — navbar, footer, CTAs, section components, cards, detail pages, and the 404 page.

| Environment | `NEXT_PUBLIC_WEBSITE_BASE` | `resolveHref('/about')` |
|-------------|--------------------------|------------------------|
| Dev | `/website` (default) | `/website/about` |
| Prod | `''` (empty string) | `/about` |

**This is a build-time variable** — the production build must be done with `NEXT_PUBLIC_WEBSITE_BASE=''`.

---

## Tenant Resolution

The proxy sets an `x-tenant-slug` header on rewritten requests. However, `getChurchId()` in `lib/tenant/context.ts` checks for `x-tenant-id` (not `x-tenant-slug`):

```typescript
export async function getChurchId(): Promise<string> {
  const headersList = await headers()
  const churchId = headersList.get('x-tenant-id')  // <-- checks x-tenant-id
  if (churchId) return churchId

  // Fallback: resolve by CHURCH_SLUG env var
  const slug = process.env.CHURCH_SLUG || 'la-ubf'
  // ... DB lookup
}
```

**Current state:** The header check fails (name mismatch), and the function falls back to the `CHURCH_SLUG` env var. This works for the single-tenant MVP but won't scale to multi-tenant.

**Future fix (Phase D):** Either:
- Change proxy to set `x-tenant-id` (requires DB lookup in proxy — not ideal for Edge Runtime)
- Change `getChurchId()` to also check `x-tenant-slug` and resolve the UUID from the slug

---

## Deployment Checklist

### Building for Production

1. Set production env vars **before** running `next build`:
   ```env
   ROOT_DOMAIN=lclab.io
   NEXT_PUBLIC_ROOT_DOMAIN=lclab.io
   NEXT_PUBLIC_WEBSITE_BASE=
   NEXT_PUBLIC_WEBSITE_URL=https://laubf.lclab.io
   ```

2. Run `npm run build`

3. Copy into standalone:
   ```bash
   cp -r public .next/standalone/
   cp -r .next/static .next/standalone/.next/
   cp .env .next/standalone/
   ```

4. Verify the proxy compiled: check for `ƒ Proxy (Middleware)` in build output

### Server Environment

The production server's `.env` must include:
```env
ROOT_DOMAIN=lclab.io
CHURCH_SLUG=la-ubf
```

These are **runtime** values read by `process.env` in the proxy and server components.

### Verifying the Proxy Works

1. **Build output** should show `ƒ Proxy (Middleware)`
2. **Compiled proxy check:**
   ```bash
   # Should find the proxy logic with the correct domain
   python3 -c "
   import glob
   for f in glob.glob('.next/server/chunks/*.js'):
       with open(f) as fh:
           if 'x-tenant-slug' in fh.read():
               print(f'Proxy compiled in: {f}')
   "
   ```
3. **Runtime test:** Visit `laubf.lclab.io/` — should load the homepage, not redirect to CMS

---

## Feasibility Assessment

### Does proxy.ts work as a middleware replacement? Yes.

**Confirmed working:**
- Next.js 16.1.6 auto-detects `proxy.ts` at the project root
- The build compiles it (shown as `ƒ Proxy (Middleware)` in output)
- The `config.matcher` is registered in the compiled bundle
- The proxy function receives full `NextRequest` with headers, cookies, URL
- `NextResponse.rewrite()` works for transparent URL rewriting
- Custom headers can be set on the rewritten response
- Auth.js integration works via the edge-safe config

**Key constraint:**
- `NEXT_PUBLIC_*` env vars are inlined at build time — use non-prefixed vars for runtime config
- The proxy compiles into the middleware system internally (files are named `middleware.js` in `.next/`)
- The `middleware-manifest.json` may appear empty in Next.js 16 with Turbopack — this does NOT mean the proxy isn't running. The proxy config is registered inside the compiled chunk itself.

### What the proxy can NOT do (use alternatives):

| Need | Alternative |
|------|-------------|
| DB queries | Server Components, Route Handlers |
| Heavy computation | Server Components |
| Setting `NEXT_PUBLIC_` vars dynamically | Build-time only |
| WebSocket upgrades | Custom server |

---

## Architecture Diagram

```
                    Internet
                       │
                   ┌───┴───┐
                   │ Caddy  │  (reverse proxy, SSL termination)
                   └───┬───┘
                       │
              ┌────────┴────────┐
              │  Next.js Server  │  (PM2: .next/standalone/server.js)
              │                  │
              │  ┌────────────┐  │
              │  │  proxy.ts  │  │  ← Runs FIRST for every matched request
              │  │            │  │
              │  │ 1. Check   │  │  hostname.endsWith('.lclab.io')?
              │  │    subdomain│  │
              │  │ 2. Rewrite │  │  /about → /website/about
              │  │    to       │  │  + set x-tenant-slug header
              │  │    /website │  │
              │  │ 3. Auth    │  │  /cms/*, /api/v1/* → JWT check
              │  │    gate    │  │
              │  └─────┬──────┘  │
              │        │         │
              │  ┌─────┴──────┐  │
              │  │ next.config │  │  ← beforeFiles rewrites (backup)
              │  │  rewrites   │  │
              │  └─────┬──────┘  │
              │        │         │
              │  ┌─────┴──────┐  │
              │  │  App Router │  │
              │  │            │  │
              │  │ /website/  │  │  ← Public website (layout + catch-all)
              │  │ /cms/      │  │  ← CMS admin
              │  │ /api/v1/   │  │  ← REST API
              │  └────────────┘  │
              └──────────────────┘
```
