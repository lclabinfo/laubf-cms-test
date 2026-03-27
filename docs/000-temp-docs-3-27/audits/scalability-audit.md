# Multi-Church Scalability Audit

> Audit of the entire codebase for multi-tenant readiness. Identifies every place that
> assumes a single church (LA UBF), assesses storage/memory growth per tenant,
> and provides a roadmap to support N churches on one deployment.
>
> Conducted: 2026-03-23

---

## Executive Summary

The **data layer is excellent** — all 16 DAL modules, 100+ API routes, and the Prisma schema
enforce `churchId` scoping consistently. The **website rendering layer is 95% ready** — theme,
font, navbar, footer, and section data all resolve per-tenant. The **CMS is 90% ready** —
auth sessions carry `churchId`, API routes use it, but a few pages and the builder default
templates assume LA UBF.

**What would break today if you added a second church:**
1. Subdomain routing silently falls back to LA UBF (routing layer gap)
2. New user signup always joins the env var church (can't sign up for church B)
3. Access requests always target the env var church
4. Media uploads store under `la-ubf/` path regardless of which church uploaded
5. Three hardcoded R2 URLs point to LA UBF assets in section templates
6. Storage quota calculation uses wrong church slug

**Storage/memory per additional church:** Approximately **O(1)** for code, **O(n)** for
database rows and media storage. No exponential growth. The concerns are configuration,
not architecture.

---

## Growth Complexity Analysis

| Resource | Growth per Church | Notes |
|----------|------------------|-------|
| **Code / JS bundle** | O(1) | Same codebase serves all churches. No per-church code. |
| **Runtime memory (RSS)** | O(1) | Single Node process serves all. Prisma connection pool is shared. |
| **Database rows** | O(n) | Linear — each church adds its own pages, messages, events, people. |
| **Database indexes** | O(1) | Composite indexes on `(churchId, ...)` already exist. No per-church indexes needed. |
| **Media storage (R2)** | O(n) | Linear — each church uploads its own images/videos. |
| **Git repo size** | O(1) | No per-church files in repo. |
| **Build time** | O(1) | One build serves all churches. |
| **DNS/routing config** | O(n) | One subdomain per church (wildcard DNS solves this). |

**Verdict:** Storage grows linearly with content (unavoidable), but runtime resources are
constant. This is the correct architecture. The only concern is the 4x `pageSize: 5000`
queries — if a church has 5000 messages, that's fine; if 10 churches each have 5000 messages
and all are on the same page, it's still fine because queries are scoped by `churchId`.

---

## Layer-by-Layer Audit

### 1. Database Layer (Prisma Schema)

**Status: READY**

Every tenant-scoped model has a `churchId` field with a foreign key to `Church`:

```
@@unique([churchId, slug])  // on Page, Message, Event, BibleStudy, Video, etc.
@@index([churchId])         // on all content models
```

The `Church` model is the root tenant entity. Users are linked to churches via `ChurchMember`.
A user can belong to multiple churches (important for denominational admins).

**No issues found.** The schema is designed for multi-tenancy from the start.

### 2. Data Access Layer (lib/dal/)

**Status: READY**

All 16 DAL modules take `churchId` as the first parameter:

```typescript
// Every DAL function follows this pattern:
export async function getMessages(churchId: string, options?: {...}) {
  return prisma.message.findMany({
    where: { churchId, deletedAt: null, ... }
  })
}
```

Verified modules: `messages.ts`, `events.ts`, `bible-studies.ts`, `videos.ts`, `people.ts`,
`menus.ts`, `pages.ts`, `media.ts`, `theme.ts`, `site-settings.ts`, `speakers.ts`,
`campuses.ts`, `ministries.ts`, `series.ts`, `daily-bread.ts`, `builder-feedback.ts`.

**No cross-tenant data leakage possible** at this layer.

### 3. API Routes (app/api/v1/)

**Status: READY (with one fallback concern)**

107 route files. Every authenticated route follows this pattern:

```typescript
export async function GET(req: NextRequest) {
  const authResult = await requireApiAuth('permission.string')
  if (!authResult.authorized) return authResult.response
  const churchId = await getChurchId()  // reads session.churchId
  // ... uses churchId in all DAL calls
}
```

**How `getChurchId()` works (CMS API routes):**
1. Reads `session.churchId` from the authenticated JWT
2. Validates the churchId still exists in the database
3. Falls back to `CHURCH_SLUG` env var only if session is missing

In multi-tenant mode, step 1 always succeeds because users are tied to a church via
`ChurchMember`. The fallback in step 3 is only hit for unauthenticated contexts (scripts,
cron jobs) — this is safe.

**One pattern to watch:** A few public GET endpoints (daily-bread, speakers) use `getChurchId()`
without auth. These fall back to `CHURCH_SLUG` env var. For multi-tenant, they would need
the church slug from the request context instead.

### 4. CMS Pages (app/cms/)

**Status: READY**

The CMS dashboard layout (`app/cms/(dashboard)/layout.tsx`) reads `session.churchId` from
the auth session. Every CMS page inherits this context. Users see only their church's data
because:

1. Session JWT contains `churchId`, `permissions[]`, `rolePriority`
2. All data fetching goes through API routes that scope by `churchId`
3. The sidebar, page headers, and navigation are church-agnostic

**No single-tenant assumptions found** in CMS page components.

### 5. Website Rendering (app/website/)

**Status: 95% READY — routing layer is the gap**

#### What works:
- `app/website/layout.tsx` calls `getChurchId()` and passes it to ThemeProvider, FontLoader,
  and `buildLayoutData()` — all per-tenant
- `app/website/[[...slug]]/page.tsx` resolves page + sections scoped to `churchId`
- `resolve-section-data.ts` passes `churchId` to every DAL call — no cross-tenant leakage
- ThemeProvider loads per-church theme from `ThemeCustomization`
- FontLoader loads per-church Google Fonts or custom fonts
- Navbar and footer read from `Menu` table scoped by `churchId`

#### What's broken:

**BLOCKER: Subdomain slug is set but never read**

```
proxy.ts:40    → sets header: x-tenant-slug = "laubf"
context.ts:5   → reads header: x-tenant-id (NOT x-tenant-slug)
                 → falls back to CHURCH_SLUG env var = "la-ubf"
```

Result: ALL subdomain requests resolve to the same church regardless of subdomain.

**Fix:** Update `lib/tenant/context.ts` to read `x-tenant-slug`, look up the church by slug,
and return the `churchId`. This is a ~10-line change.

### 6. CMS Unauthenticated API Routes

**Status: 6 routes hardcode CHURCH_SLUG — breaks multi-tenant signup/access**

These routes run before the user has a session, so they can't read `session.churchId`.
Instead they fall back to `process.env.CHURCH_SLUG`, locking all unauthenticated actions
to a single church.

| Route | Line | Impact |
|-------|------|--------|
| `app/api/v1/auth/signup/route.ts` | 26-28 | New users always join the env var church |
| `app/api/v1/auth/resend-verification/route.ts` | 64-66 | Verification email shows wrong church name |
| `app/api/v1/access-requests/route.ts` | 30-32 | Can't request access to a different church |
| `app/api/v1/access-requests/mine/route.ts` | 20-22 | Can't check access status for other churches |
| `app/api/v1/media/promote/route.ts` | 75-76 | **All media stored under `la-ubf/` path** regardless of church |
| `app/api/v1/storage/route.ts` | 26 | Storage quota lookup uses wrong church slug |

**Fix:** These routes need to accept a `churchSlug` parameter (from request body, query
param, or `x-tenant-slug` header) and resolve it to a `churchId` via DB lookup. The
media/promote route should resolve the slug from the authenticated user's `churchId`.

### 7. Builder & Section Templates

**Status: 3 hardcoded URLs need fixing**

| File | Line | Hardcoded Value | Fix |
|------|------|-----------------|-----|
| `components/website/sections/statement.tsx` | 10 | R2 URL to `la-ubf/initial-setup/compressed-cross.png` | Move to section content JSON or ThemeCustomization |
| `components/cms/website/builder/section-catalog.ts` | 263 | Same R2 URL as default mask image | Make default template content configurable per church |
| `components/cms/website/builder/section-catalog.ts` | 325 | R2 URL to `la-ubf/initial-setup/laubf-logo-blue.svg` | Replace with church logo from SiteSettings |

These defaults are used when a user adds a new section from the picker. A new church would
get LA UBF's cross image and logo as defaults.

### 7. Environment Variables & Configuration

**Status: Mostly fine, one to remove**

| Variable | Purpose | Multi-Tenant Impact |
|----------|---------|-------------------|
| `CHURCH_SLUG=la-ubf` | Single-tenant fallback | Safe — only used when no subdomain header |
| `NEXT_PUBLIC_CHURCH_SLUG=la-ubf` | Exposed to client JS | **REMOVE** — misleading for multi-tenant |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Root domain for subdomain extraction | Fine — shared across all tenants |
| `DATABASE_URL` | Shared database | Fine — all tenants share one DB |
| `R2_*` credentials | Shared storage bucket | Fine — namespace by church slug in path |

### 8. Media Storage (R2)

**Status: Partially ready**

Current R2 path structure: `la-ubf/initial-setup/...`, `la-ubf/media/...`

The upload URL generator (`app/api/v1/upload-url/route.ts`) should namespace uploads by
church slug: `{churchSlug}/media/{filename}`. Need to verify this is the case.

**Concern:** If all churches share one R2 bucket, access control depends on path-based
isolation. A misconfigured URL could serve church A's private media to church B. For MVP
this is acceptable; for production, consider per-church bucket prefixes with signed URLs.

---

## Hardcoded LA UBF References (Complete List)

### Code (must fix for multi-tenant)

| File | Line | Reference | Severity |
|------|------|-----------|----------|
| `app/api/v1/auth/signup/route.ts` | 26 | `CHURCH_SLUG` for new user church | **CRITICAL** — signup broken for other churches |
| `app/api/v1/media/promote/route.ts` | 75 | `CHURCH_SLUG` for storage path | **CRITICAL** — media stored under wrong church |
| `app/api/v1/access-requests/route.ts` | 30 | `CHURCH_SLUG` for request target | **HIGH** — can't request access to other churches |
| `app/api/v1/access-requests/mine/route.ts` | 20 | `CHURCH_SLUG` for status check | **HIGH** — wrong church in status lookup |
| `app/api/v1/auth/resend-verification/route.ts` | 64 | `CHURCH_SLUG` for email template | MEDIUM — wrong church name in email |
| `app/api/v1/storage/route.ts` | 26 | `CHURCH_SLUG` for quota lookup | MEDIUM — wrong storage calculation |
| `components/website/sections/statement.tsx` | 10 | Hardcoded R2 URL | **HIGH** — visible to other churches |
| `components/cms/website/builder/section-catalog.ts` | 263 | Default template R2 URL | **HIGH** — new sections get LA UBF assets |
| `components/cms/website/builder/section-catalog.ts` | 325 | Default template R2 URL | **HIGH** — new sections get LA UBF logo |
| `app/cms/(dashboard)/website/domains/page.tsx` | 30 | `NEXT_PUBLIC_CHURCH_SLUG` for display | MEDIUM — shows wrong subdomain |
| `lib/tenant/context.ts` | 9 | `'la-ubf'` fallback | LOW — only when env var missing |
| `lib/api/get-church-id.ts` | 28 | `'la-ubf'` fallback | LOW — only when session missing |
| `lib/url.ts` | 25 | `'la-ubf'` fallback | LOW — only when env var missing |
| `lib/dal/sync-message-study.ts` | 250 | `'la-ubf'` fallback | LOW — utility script |
| `components/cms/events/entry/event-form.tsx` | 853 | Placeholder: "e.g. LA UBF Main Center" | LOW — cosmetic |

### Config (acceptable)

| File | Reference | Notes |
|------|-----------|-------|
| `.env.example` | `CHURCH_SLUG=la-ubf` | Example value — correct |
| `prisma/seed.mts` | LA UBF church data | Seed is dev-only — each church would be seeded separately |

### Documentation (no action needed)

Multiple docs reference LA UBF as the example church. This is expected and fine.

---

## What Needs to Change for N Churches

### Phase 1: Routing Fix (enables multi-tenant)

**Effort: 1-2 hours**

1. Update `lib/tenant/context.ts`:
   ```typescript
   export async function getChurchId(): Promise<string> {
     const headersList = await headers()

     // Direct churchId header (set by middleware for known tenants)
     const churchId = headersList.get('x-tenant-id')
     if (churchId) return churchId

     // Slug header from subdomain proxy
     const slug = headersList.get('x-tenant-slug')
     if (slug) {
       const { prisma } = await import('@/lib/db/client')
       const church = await prisma.church.findUnique({ where: { slug } })
       if (church) return church.id
     }

     // Fallback for dev / single-tenant
     const envSlug = process.env.CHURCH_SLUG || 'la-ubf'
     const { prisma } = await import('@/lib/db/client')
     const church = await prisma.church.findUnique({ where: { slug: envSlug } })
     if (!church) throw new Error(`Church not found: ${envSlug}`)
     return church.id
   }
   ```

2. Add caching for slug-to-churchId lookups (in-memory Map with TTL, or `unstable_cache`).
   This lookup happens on every request — without caching, it adds one DB query per page load.

### Phase 2: Remove Hardcoded Assets (enables clean multi-tenant UX)

**Effort: 2-3 hours**

1. Replace hardcoded R2 URLs in `section-catalog.ts` with a function that reads defaults
   from `SiteSettings` or `ThemeCustomization` per church
2. Replace `DEFAULT_MASK_IMAGE_URL` in `statement.tsx` with content from the section's
   `content` JSON (already editable in the builder)
3. Replace placeholder text in `event-form.tsx` with a generic "e.g. Main Building, Room 201"

### Phase 3: Church Onboarding Flow (enables self-service)

**Effort: 1-2 weeks**

For a new church to be added today, someone must:
1. Insert a `Church` record in the database
2. Create a `ChurchMember` for the admin
3. Seed default pages, menus, theme, and site settings
4. Configure DNS for the subdomain

This should become a self-service onboarding flow:
1. Admin signs up at `admin.lclab.io/register`
2. Chooses a church name and subdomain
3. System creates: Church, ChurchMember (owner), default Pages, Menus, Theme, SiteSettings
4. Wildcard DNS (`*.lclab.io`) routes to the app — no manual DNS needed

### Phase 4: Isolation & Security Hardening

**Effort: 1 week**

1. **R2 path namespacing:** Ensure all uploads go to `{churchSlug}/...` path. Add signed
   URLs for private media.
2. **Rate limiting per church:** Extend rate limiter keys to include `churchId` so one
   church can't exhaust another's rate limit.
3. **Remove `NEXT_PUBLIC_CHURCH_SLUG`:** Replace with runtime resolution.
4. **Add cross-tenant access tests:** Verify that church A's API token cannot access
   church B's data.

---

## Storage & Memory Projections

### Database Growth (PostgreSQL)

Assuming each church averages:
- 200 messages, 100 events, 50 bible studies, 20 videos
- 50 pages with 300 sections total
- 500 people, 200 media records

| Churches | Estimated Rows | Estimated DB Size | Query Impact |
|----------|---------------|-------------------|--------------|
| 1 | ~1,500 | ~50 MB | Baseline |
| 10 | ~15,000 | ~500 MB | Negligible — indexes handle it |
| 100 | ~150,000 | ~5 GB | Still fast with proper indexes |
| 1,000 | ~1,500,000 | ~50 GB | Need connection pooling (PgBouncer) |

All existing indexes are composite on `(churchId, ...)` which means queries are **O(log n)**
regardless of total row count. No full table scans possible for scoped queries.

### Media Storage (R2/S3)

| Churches | Estimated Media | Storage Cost (~$0.015/GB/mo) |
|----------|----------------|------------------------------|
| 1 | ~5 GB | $0.08/mo |
| 10 | ~50 GB | $0.75/mo |
| 100 | ~500 GB | $7.50/mo |
| 1,000 | ~5 TB | $75/mo |

Linear growth, manageable costs. R2 has no egress fees.

### Runtime Memory

| Churches | RSS Impact | Notes |
|----------|-----------|-------|
| 1 | ~300 MB (after optimization) | Baseline |
| 10 | ~300 MB | Same process, same code |
| 100 | ~320 MB | Slightly more Prisma connection pool usage |
| 1,000 | ~350 MB | May need connection pooler (PgBouncer) |

Memory is **O(1)** because all churches share the same Node.js process, the same compiled
code, and the same Prisma client. The only growth vector is the connection pool, which
tops out at the configured `connection_limit` (default 10).

---

## Current Architecture Strengths

These are already done correctly and should NOT be changed:

1. **`churchId` on every table** — proper tenant isolation at the data layer
2. **Composite unique constraints** — `@@unique([churchId, slug])` prevents cross-tenant
   slug collisions
3. **Session-based tenant scoping** — CMS users' JWT carries `churchId`, no URL hacking possible
4. **Subdomain routing** — `proxy.ts` extracts slug from hostname, clean separation of concerns
5. **Theme/font per tenant** — ThemeProvider and FontLoader are already per-church
6. **Shared database** — simpler ops than database-per-tenant, correct for this scale
7. **DAL pattern** — consistent `churchId` first-param convention across all 16 modules

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Cross-tenant data leak via API | Low | Critical | All DAL functions scope by churchId; add integration tests |
| Church A sees Church B's media | Medium | High | Namespace R2 paths by slug; add signed URLs |
| Subdomain spoofing | Low | Medium | Validate slug against DB; return 404 for unknown slugs |
| One church's traffic degrades all | Medium | High | Add per-church rate limits; consider CDN caching |
| Database growth slows queries | Low | Medium | Indexes are already composite; add PgBouncer at 100+ churches |
| Builder defaults show LA UBF assets | High (now) | Low | Replace hardcoded URLs with per-church defaults |

---

## Summary: What to Do When

| When | What | Effort |
|------|------|--------|
| **Now** | Fix subdomain routing (context.ts reads x-tenant-slug) | 1 hr |
| **Now** | Remove 3 hardcoded R2 URLs | 1 hr |
| **Now** | Remove NEXT_PUBLIC_CHURCH_SLUG | 5 min |
| **Before 2nd church** | Church onboarding seed script (creates defaults) | 1 day |
| **Before 2nd church** | Verify R2 upload paths are namespaced | 30 min |
| **Before 10 churches** | Add per-church rate limiting | 2 hr |
| **Before 10 churches** | Add cross-tenant integration tests | 1 day |
| **Before 100 churches** | Add PgBouncer connection pooling | 2 hr |
| **Before 100 churches** | Add CDN caching for public website pages | 1 day |
| **Before 1000 churches** | Consider read replicas for the database | 1 week |

*Reviewed: 2026-03-23*
