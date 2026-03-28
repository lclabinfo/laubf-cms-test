# Caching & Data Access Layer Plan

> **Date**: 2026-03-27 (updated with official Next.js 16.2.1 docs)
> **Status**: ISR active, `'use cache'` blocked, `unstable_cache` available as middle ground
> **Priority**: Medium (ISR handles 90% of the memory win already)
> **Estimated effort**: 2-4 hours for either approach

---

## Current State: What's Active

**ISR (`export const revalidate`) is live** on all 6 website routes:
- `app/website/[[...slug]]/page.tsx` — 60s
- `app/website/layout.tsx` — 300s
- `app/website/bible-study/page.tsx` — 60s
- `app/website/bible-study/[slug]/page.tsx` — 3600s
- `app/website/messages/[slug]/page.tsx` — 3600s
- `app/website/events/[slug]/page.tsx` — 600s

ISR caches entire rendered pages to the filesystem (`.next/cache/`). Repeat visitors get served from disk with zero memory allocation and zero database queries. On-demand invalidation via `revalidatePath()` is wired into all CMS API write handlers.

**Debug tip:** Add `NEXT_PRIVATE_DEBUG_CACHE=1` to `.env` on the server to log ISR cache hits/misses to the console.

**Verify with:** `curl -I https://laubf.lclab.io/ 2>&1 | grep x-nextjs-cache` — values are `HIT`, `STALE`, `MISS`, or `REVALIDATED`.

---

## Three Caching Approaches (Comparison)

### 1. ISR Only (Current) — Page-Level, Time-Based

```typescript
// app/website/[[...slug]]/page.tsx
export const revalidate = 60  // re-render at most every 60 seconds
```

- **How it works:** First visitor after TTL triggers background re-render. All visitors get cached HTML from disk instantly. `revalidatePath()` clears specific pages on CMS save.
- **What's cached:** The full rendered HTML page.
- **Where cached:** Filesystem (`.next/cache/`), plus up to 50 MB in-memory LRU (`cacheMaxMemorySize`).
- **Invalidation:** `revalidatePath('/website/messages')` or `revalidatePath('/website')`.
- **Limitation:** When a page regenerates, ALL database queries re-run even if only one content type changed. No per-query caching.
- **Works with:** `output: 'standalone'`, self-hosted, no extra config needed.

### 2. `unstable_cache` — Function-Level, Tag-Based (Available NOW)

```typescript
import { unstable_cache } from 'next/cache'

const getCachedMessages = unstable_cache(
  async (churchId: string) => {
    return prisma.message.findMany({ where: { churchId, deletedAt: null } })
  },
  ['messages'],  // cache key prefix
  { revalidate: 3600, tags: ['sermons'] }  // 1 hour TTL + tag
)
```

- **How it works:** Wraps an async function. Results cached by key + arguments. `revalidateTag('sermons')` clears only sermon-related cache entries.
- **What's cached:** Individual function return values (serialized JSON).
- **Where cached:** Same filesystem cache as ISR.
- **Invalidation:** `revalidateTag('sermons')` — granular, only clears tagged entries.
- **Advantage over ISR alone:** When a page regenerates, cached query results are reused. Sermon edit only clears sermon cache, not events/menus/settings.
- **Works with:** `output: 'standalone'`, **no `cacheComponents` flag needed**, no Suspense refactor needed.
- **Limitation:** `unstable_` prefix means API may change. But it's been stable since Next.js 14.1 and is widely used in production.

### 3. `'use cache'` — Function/Component-Level, Tag-Based (Blocked)

```typescript
export async function getMessages(churchId: string) {
  'use cache'
  cacheTag(`church:${churchId}:sermons`)
  cacheLife('hours')
  return prisma.message.findMany({ ... })
}
```

- **How it works:** Same as `unstable_cache` but with cleaner syntax and component-level caching.
- **What's cached:** Function results OR entire component render output.
- **Requires:** `cacheComponents: true` in next.config.ts.
- **Blocked because:** `cacheComponents` enables Partial Prerendering (PPR), which requires ALL pages to handle dynamic APIs (`headers()`, `cookies()`) inside `<Suspense>` boundaries. 7 CMS files fail the build.
- **Replaces ISR:** `export const revalidate` is incompatible with `cacheComponents`. They are mutually exclusive.

---

## Recommended Next Step: `unstable_cache` (No Suspense Refactor Needed)

`unstable_cache` gives us 80% of what `'use cache'` offers without ANY CMS page changes:

| Feature | ISR Only | + `unstable_cache` | + `'use cache'` |
|---------|----------|-------------------|-----------------|
| Page-level caching | Yes | Yes | Yes (via `cacheLife`) |
| Query-level caching | No | **Yes** | Yes |
| Tag-based invalidation | No (`revalidatePath` only) | **Yes** (`revalidateTag`) | Yes |
| Requires Suspense refactor | No | **No** | Yes (7 files) |
| Requires `cacheComponents` | No | **No** | Yes |
| API stability | Stable | Stable since 14.1 | Stable in 16+ |
| Memory impact | Good | **Better** | Best |

**Implementation pattern:**

```typescript
// lib/dal/messages.ts
import { unstable_cache } from 'next/cache'

// Wrap read-only DAL functions
export const getMessages = unstable_cache(
  async (churchId: string, filters?: MessageFilters & PaginationParams) => {
    // ... existing Prisma query (unchanged)
  },
  ['messages'],
  { revalidate: 300, tags: ['sermons'] }
)

// CMS API route — after save:
import { revalidateTag } from 'next/cache'
revalidateTag('sermons')  // clears only sermon-related cache
```

**Effort:** ~1-2 hours (wrap existing functions, add revalidateTag to API routes).
**Risk:** Low (function signatures unchanged, just wrapped).
**Invalidation helper:** Already created at `lib/cache/invalidation.ts`.

---

## Why It's Blocked

`'use cache'` requires `cacheComponents: true` in `next.config.ts`. This flag changes how Next.js builds the application — it attempts to prerender all pages and requires that any page using dynamic APIs (`headers()`, `cookies()`, `searchParams`) wraps them in `<Suspense>` boundaries.

**7 CMS files fail the build with this flag enabled:**

| File | Dynamic API | Type |
|------|-------------|------|
| `app/cms/(dashboard)/layout.tsx` | `auth()` (NextAuth session) | Layout |
| `app/cms/website/builder/layout.tsx` | `auth()` | Layout |
| `app/cms/onboarding/page.tsx` | `auth()` + `searchParams` | Page |
| `app/cms/website/builder/(editor)/[pageId]/page.tsx` | `getChurchId()` → `headers()` | Page |
| `app/cms/website/builder/(editor)/page.tsx` | `getChurchId()` → `headers()` | Page |
| `app/cms/website/builder/preview/[pageId]/page.tsx` | `getChurchId()` → `headers()` | Page |
| `app/cms/(dashboard)/people/members/[id]/page.tsx` | `getChurchId()` → `headers()` | Page |

**Root cause:** `getChurchId()` in `lib/tenant/context.ts` calls `await headers()` to read the `x-tenant-id` header. `auth()` from NextAuth reads cookies. Both are request-time APIs that can't be prerendered.

---

## What "Suspense-Compatible" Means

The fix is to wrap the dynamic portion of each page in a `<Suspense>` boundary with a loading fallback. This tells Next.js "this part needs request data, don't try to prerender it."

**Before (current, fails with cacheComponents):**
```typescript
export default async function DashboardLayout({ children }) {
  const session = await auth()  // ← dynamic API, blocks prerender
  if (!session) redirect('/cms/login')
  return <Shell>{children}</Shell>
}
```

**After (Suspense-compatible):**
```typescript
async function AuthenticatedShell({ children }) {
  const session = await auth()
  if (!session) redirect('/cms/login')
  return <Shell>{children}</Shell>
}

export default function DashboardLayout({ children }) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  )
}
```

The layout itself becomes a synchronous function that renders a Suspense boundary. The async auth check moves into a child component that streams in after the initial shell.

---

## Files That Need Changes

### Layouts (2 files) — Highest Impact

These are the most important because they wrap ALL CMS pages.

**1. `app/cms/(dashboard)/layout.tsx`**
- Current: Calls `auth()` at top level, redirects if no session
- Change: Extract auth check into an async child component wrapped in Suspense
- Fallback: Dashboard skeleton (sidebar + header + loading spinner)
- Side effects: Users will briefly see the skeleton before auth resolves (~50ms)

**2. `app/cms/website/builder/layout.tsx`**
- Current: Calls `auth()` at top level
- Change: Same pattern as dashboard layout
- Fallback: Builder skeleton
- Side effects: Brief skeleton flash on builder load

### Pages (5 files) — Lower Impact

**3. `app/cms/onboarding/page.tsx`**
- Current: Calls `auth()` + reads `searchParams`
- Change: Wrap page content in Suspense
- Fallback: Onboarding skeleton

**4-6. Builder pages (3 files)**
- `app/cms/website/builder/(editor)/[pageId]/page.tsx`
- `app/cms/website/builder/(editor)/page.tsx`
- `app/cms/website/builder/preview/[pageId]/page.tsx`
- Current: Call `getChurchId()` which uses `headers()`
- Change: Wrap data-fetching portion in Suspense
- Fallback: Builder loading state

**7. `app/cms/(dashboard)/people/members/[id]/page.tsx`**
- Current: Calls `getChurchId()`
- Change: Wrap in Suspense
- Fallback: Member detail skeleton

### Library Files (no changes needed)
- `lib/tenant/context.ts` — `getChurchId()` stays the same. The Suspense boundary in the consuming page handles the dynamic API.
- `lib/auth/config.ts` — No changes. Auth config is fine.

---

## What Gets Enabled After

Once the 7 files have Suspense boundaries, `cacheComponents: true` can be added to `next.config.ts`. Then:

**DAL functions get `'use cache'` + `cacheTag()`:**

| DAL File | Functions | Cache Tag |
|----------|-----------|-----------|
| `lib/dal/messages.ts` | getMessages, getMessageBySlug, getMessageById, getLatestMessage, getMessageFilterMeta, getLatestPublishedDates | `church:{id}:sermons` |
| `lib/dal/events.ts` | getEvents, getEventBySlug, getUpcomingEvents, getRecurringEvents, getEventFilterMeta | `church:{id}:events` |
| `lib/dal/bible-studies.ts` | getBibleStudies, getBibleStudyBySlug, getBibleStudyFilterMeta | `church:{id}:studies` |
| `lib/dal/videos.ts` | getVideos, getVideoBySlug, getVideoFilterMeta | `church:{id}:videos` |
| `lib/dal/site-settings.ts` | getSiteSettings | `church:{id}:settings` |
| `lib/dal/menus.ts` | getMenuByLocation | `church:{id}:menus` |
| `lib/dal/pages.ts` | getPageBySlug, getHomepage, getPages | `church:{id}:pages` |
| `lib/dal/daily-bread.ts` | getTodaysDailyBread | `church:{id}:daily-bread` |
| `lib/dal/theme.ts` | getThemeWithCustomization | `church:{id}:theme` |
| `lib/website/build-layout-props.ts` | buildLayoutData | `menus` + `settings` |

**CMS API routes get `revalidateTag()` via the invalidation helper (`lib/cache/invalidation.ts`):**

The helper already exists and is ready to wire in. Each CMS write endpoint adds one line:
```typescript
invalidateSermons(churchId) // or invalidateEvents, invalidateStudies, etc.
```

**ISR `export const revalidate` gets removed** from website routes (replaced by `cacheLife()` on each function).

---

## Important Caveats (from official Next.js docs)

1. **ISR is per-instance on self-hosted.** If you ever run multiple PM2 processes or multiple servers, on-demand revalidation (`revalidatePath`/`revalidateTag`) only invalidates the cache on the instance that receives the API call. Other instances still serve stale data until their TTL expires. Fix: use a shared `cacheHandler` (Redis) when scaling to multiple processes.

2. **Proxy/rewrites don't apply to on-demand ISR.** Our `proxy.ts` rewrites `laubf.lclab.io/about` → `/website/about`. When calling `revalidatePath`, use the actual path (`/website/about`), not the public URL (`/about`). This is already correct in our API routes.

3. **Lowest `revalidate` wins.** If a page has multiple data sources with different revalidation times, the lowest one is used for the page's ISR TTL. Our layout (300s) doesn't affect child pages (60s) because the child's lower value takes precedence.

4. **Error resilience.** If regeneration fails (DB error, etc.), the last successfully generated page continues to be served. Next.js retries on the next request. This means temporary DB outages don't break the website.

5. **`unstable_cache` is safe to use.** Despite the `unstable_` prefix, it's been stable since Next.js 14.1 (released Jan 2024) and is the recommended approach for caching database queries in the official ISR guide.

## Side Effects of Current ISR Setup

| Side Effect | Impact | Mitigation |
|-------------|--------|------------|
| Cache entries use disk space | LOW | Bounded by `cacheMaxMemorySize: 50MB` for in-memory; disk is small |
| First visit after deploy is uncached | LOW | Stale-while-revalidate means user still gets fast response |
| All mutation functions must NOT be cached | NONE | Only read functions; mutations already excluded |
| Per-instance cache on self-hosted | LOW for now | Single PM2 process; Redis needed for multi-process |

---

## Is This Necessary?

**No — ISR alone handles the majority of the memory win.** Here's the comparison:

| Metric | ISR Only (current) | ISR + `'use cache'` |
|--------|-------------------|---------------------|
| Repeat website visitors | Served from disk (0 memory) | Same |
| Page regeneration after TTL | All DAL queries re-run (~5 MB temp) | DAL results cached, minimal re-query |
| CMS edit → website update | `revalidatePath()` clears all pages in path | `revalidateTag()` clears only affected content type |
| Concurrent page regenerations | Each runs full query set | Queries shared via cache |
| **Estimated additional savings** | — | **~50-100 MB under heavy traffic** |

**Verdict:** ISR is sufficient for the current scale (1 church, low traffic). `'use cache'` becomes valuable when:
- Multiple churches share the same server (each needs independent cache tags)
- High traffic causes frequent page regenerations
- CMS editors are active while website traffic is high

---

## Implementation Order

1. Add Suspense to dashboard layout (covers all CMS pages)
2. Add Suspense to builder layout
3. Add Suspense to remaining 5 pages
4. Enable `cacheComponents: true` in next.config.ts
5. Add `'use cache'` + `cacheTag()` + `cacheLife()` to all DAL read functions
6. Wire `invalidation.ts` helpers into CMS API routes
7. Remove `export const revalidate` from website routes
8. Test: CMS edits invalidate correct cache tags, website shows fresh content

**Estimated time:** 2-4 hours (mostly boilerplate Suspense wrappers + testing)
