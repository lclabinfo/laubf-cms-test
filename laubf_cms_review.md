# Full Project Review Report

## Project Size Overview

| Item | Size |
|------|------|
| Source code (excl. node_modules) | **388 MB** |
| node_modules | **1.2 GB** (683 packages) |
| .git history | **679 MB** (644 MB packed) |
| SQL dumps (00_old_laubf_db_dump/) | **118 MB** |
| DB snapshots (db-snapshots/) | **148 MB** |
| Script data (scripts/) | **92 MB** |
| **Total repo on disk** | **~1.07 GB** (excl. node_modules) |

**Root cause of heaviness:** 358 MB of SQL dumps and snapshot files are committed to Git.

---

## CRITICAL — Immediate Action Required

### 1. 358 MB of Binary/Dump Files Committed to Git

```
00_old_laubf_db_dump/  → 118 MB (legacy MySQL SQL files)
db-snapshots/          → 148 MB (PostgreSQL dumps)
scripts/               → 92 MB  (seed data JSON)
```

**Impact:**
- Every `git clone` downloads 358 MB of non-essential data
- CI/CD build times inflated
- Permanently stored in `.git/objects` even after deletion from working tree
- Git pack size is already 644 MB

**Fix:** Add to `.gitignore`, then use `git filter-repo` to purge from history. Move to S3/R2 or a separate backup system.

### 2. Missing Security Headers

`next.config.ts` has **zero security headers** configured:

| Header | Status | Risk |
|--------|--------|------|
| Content-Security-Policy | Missing | XSS attack surface |
| Strict-Transport-Security | Missing | HTTPS downgrade possible |
| X-Frame-Options | Missing | Clickjacking possible |
| X-Content-Type-Options | Missing | MIME sniffing attacks |
| Referrer-Policy | Missing | Information leakage |
| Permissions-Policy | Missing | Unnecessary API access |

**Fix:** Add `headers()` function to `next.config.ts`.

### 3. Turnstile CAPTCHA Fails Open

`lib/turnstile.ts:55` — On network error, returns `{ success: true }`. An attacker who blocks Cloudflare Turnstile servers can bypass CAPTCHA entirely.

**Fix:** Return `{ success: false }` on network failures. Rely on rate limiting as fallback.

---

## HIGH — Fix Before Production

### 4. All Website Pages Forced to Dynamic Rendering

`lib/tenant/context.ts` calls `headers()` for tenant resolution, which **prevents Static Site Generation** for every website page.

```typescript
// lib/tenant/context.ts
const headersList = await headers()  // ← blocks SSG
```

**Impact:** Every page request hits the database (50-200ms latency). For a single-tenant MVP, this is unnecessary overhead.

**Fix:** For single-tenant, resolve church ID from env var directly without `headers()`. Reserve header-based resolution for multi-tenant phase.

### 5. Zero Dynamic Imports / Code Splitting

No usage of `React.lazy()` or `next/dynamic` found anywhere in the project.

**Heavy libraries loaded on all pages:**

| Library | Est. Size | Used In | Problem |
|---------|----------|---------|---------|
| TipTap (17 extensions) | ~200 KB+ | CMS editor only | May leak into website bundle |
| motion | ~50 KB | 3 sections only | Loaded across all 46 sections |
| dnd-kit | ~30 KB | CMS builder only | Should be code-split |

**Fix:** Wrap heavy components with `next/dynamic(() => import(...), { ssr: false })`.

### 6. Excessive Data Fetching (pageSize: 5000)

`lib/website/resolve-section-data.ts` — Sections like `all-messages`, `all-events`, `all-bible-studies`, `all-videos` fetch **5,000 records each**. A page with multiple "all-*" sections loads 20K+ records into memory.

**Fix:** Implement pagination with client-side infinite scroll or reasonable limits (e.g., 50 per page).

### 7. In-Memory Rate Limiting (Breaks in Multi-Instance)

`lib/rate-limit.ts` — Uses `Map()` for rate limiting. In multi-instance deployments (Vercel, K8s), each instance maintains a separate counter, effectively multiplying the allowed rate by instance count.

**Fix:** Use Upstash Redis or Cloudflare Workers KV for distributed rate limiting.

### 8. API Cache Headers Missing

Out of 25+ GET API routes, **only 1** sets a `Cache-Control` header (`/api/v1/messages/[slug]`). All others hit the database on every request with no CDN caching.

**Fix:** Add `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` to all public GET endpoints.

---

## MEDIUM — Fix Before Scaling

### 9. XSS Risk — dangerouslySetInnerHTML Without Sanitization

`app/website/events/[slug]/page.tsx:223,233` renders `contentToHtml()` output directly. While TipTap JSON is safely converted, **pre-existing HTML content is returned as-is** (`lib/tiptap.ts:892`) without sanitization.

Risk is low (only CMS admins can write content), but defense-in-depth recommends DOMPurify.

### 10. 46 Website Sections All Marked "use client"

Only ~8 sections need client interactivity (animations, modals). The remaining ~38 are purely presentational and could be Server Components, reducing JS bundle sent to the browser significantly.

### 11. Search Queries Not Indexed

`lib/dal/people.ts` — Uses `contains` + `mode: 'insensitive'` across multiple columns (firstName, lastName, email, phone). This does a full table scan per query. Fine for <5K records, unusable beyond that.

**Fix:** Add PostgreSQL `pg_trgm` extension with GIN indexes, or use full-text search.

### 12. File Upload MIME Type Not Validated

`app/api/v1/convert-doc/route.ts:27` — Only checks file extension (`.doc`), not the actual MIME type. An attacker could rename a malicious file to `.doc`.

### 13. Type Safety — `any` Usage in 7 Files

Adapter/integration code uses `any` types:
- `lib/tiptap.ts` (editor internals)
- `lib/messages-context.tsx`, `lib/events-context.tsx` (API adapters)
- `lib/docx-import.ts` (DOCX parsing)
- `app/cms/(dashboard)/church-profile/page.tsx`

Not critical, but weakens type safety. Use `unknown` with type guards instead.

### 14. No Server-Side Cache Layer

No `unstable_cache()`, Redis, or Memcached usage found. Every request goes straight to PostgreSQL. Acceptable for single-instance, but won't scale.

### 15. CMS Fetch Boilerplate Duplication

CMS pages repeat the same fetch + error-handling pattern ~8 times per page (e.g., `media/page.tsx`). A shared `useFetchApi()` hook would reduce ~200 lines of duplicate code.

---

## What's Done Well

| Area | Assessment |
|------|-----------|
| **Authentication** | JWT + bcrypt(12) + permission checks + session invalidation — solid |
| **SQL Injection** | All `$queryRaw` calls are parameterized — safe |
| **API Error Handling** | Every route has try/catch with proper HTTP status codes |
| **DAL Design** | `churchId` scoping, smart select/include splits prevent N+1 |
| **Database Indexes** | Well-designed composites (`@@unique([churchId, slug])`, etc.) |
| **Build Config** | `output: 'standalone'` — container-ready |
| **Parallel Fetching** | `Promise.all()` used in layouts and page data resolution |
| **Input Validation** | Comprehensive validation functions with length limits |
| **Token Security** | Nonce-based replay prevention, proper expiry, purpose validation |
| **Clean Code** | Zero `console.log` in production, zero TODO/FIXME comments |
| **Rate Limiting (auth)** | Login attempts limited to 5/15min per email |
| **Password Policy** | 8-72 chars, mixed case + digit, bcrypt DoS protection |

---

## Prioritized Action Plan

### P0 — Today
1. Add security headers to `next.config.ts`
2. Fix Turnstile fail-open → fail-closed
3. Add `00_old_laubf_db_dump/`, `db-snapshots/`, large script data to `.gitignore`

### P1 — Before Production
4. Purge 358 MB of dumps from Git history (`git filter-repo`)
5. Optimize `getChurchId()` — remove `headers()` dependency for single-tenant
6. Add `next/dynamic` for TipTap, motion, dnd-kit
7. Replace in-memory rate limiter with Redis-based solution
8. Add `Cache-Control` headers to all public GET API routes
9. Add MIME type validation to file upload endpoint

### P2 — Before Scaling
10. Paginate "all-*" section data fetches (5000 → reasonable limit)
11. Convert ~38 website sections from Client to Server Components
12. Add PostgreSQL trgm/FTS indexes for search
13. Add `unstable_cache()` or Redis caching layer
14. Create shared `useFetchApi()` hook to reduce CMS boilerplate
15. Replace `any` types with `unknown` + type guards

---

## Additional Findings (Agent Audit — 2026-03-23)

### Multi-Tenant Gaps in CMS (6 API routes)

Six unauthenticated API routes hardcode `CHURCH_SLUG` env var instead of accepting the
church from the request context. These break if a second church is deployed:

| Route | Problem |
|-------|---------|
| `app/api/v1/auth/signup/route.ts:26` | New users always join env var church |
| `app/api/v1/media/promote/route.ts:75` | **All uploads stored under `la-ubf/` path** |
| `app/api/v1/access-requests/route.ts:30` | Access requests target wrong church |
| `app/api/v1/access-requests/mine/route.ts:20` | Status check uses wrong church |
| `app/api/v1/auth/resend-verification/route.ts:64` | Email shows wrong church name |
| `app/api/v1/storage/route.ts:26` | Storage quota calculated for wrong church |

Additionally, `app/cms/(dashboard)/website/domains/page.tsx:30` reads
`NEXT_PUBLIC_CHURCH_SLUG` instead of `session.churchSlug`.

### Git History — Larger Than Expected

`scripts/bible-study-content.json` was committed **6 times** during migration iterations,
accounting for **~438 MB** of git history alone. Combined with dumps and snapshots:

| Path | Versions | Cumulative Size |
|------|----------|-----------------|
| `scripts/bible-study-content.json` | 6 | ~438 MB |
| `db-snapshots/*.dump` | 5 | ~159 MB |
| `00_old_laubf_db_dump/*.sql` | 124 files | ~112 MB |
| `figma-cms-2:25:26/` assets | ~241 objects | ~75 MB |
| **Total reclaimable** | | **~784 MB** |

### Website Sections — All Client Components

41 of 41 website section components use `"use client"`. Only ~8 need interactivity
(animations, modals, carousels). The other ~33 are purely presentational and could be
Server Components, cutting ~60% of the client JS bundle for public visitors.

### Hardcoded LA UBF Assets

3 hardcoded R2 URLs point to LA UBF-specific images:
- `components/website/sections/statement.tsx:10` — cross image
- `components/cms/website/builder/section-catalog.ts:263` — cross image (template default)
- `components/cms/website/builder/section-catalog.ts:325` — LA UBF logo (template default)

### Subdomain Routing Gap

`proxy.ts:40` sets `x-tenant-slug` header but `lib/tenant/context.ts` reads `x-tenant-id`
(different header name). All subdomain requests silently fall back to `CHURCH_SLUG` env var.

---

*Review conducted: 2026-03-23*
*Agent audit: 2026-03-23 (4 parallel agents: CMS tenant, website tenant, bundle/memory, git history)*
*Reviewed by: Claude Code (Opus 4.6)*
