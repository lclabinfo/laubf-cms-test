# `'use cache'` Implementation Plan

> **Date**: 2026-03-27
> **Status**: Blocked by CMS Suspense compatibility
> **Priority**: Medium (ISR handles 90% of the memory win already)
> **Estimated effort**: 2-4 hours
> **Prerequisite**: CMS pages must be Suspense-compatible

---

## What This Is

`'use cache'` is a Next.js 16 directive that caches individual function results to disk. It's more granular than ISR — instead of caching entire pages, it caches each database query independently with tag-based invalidation.

**Current caching (ISR):**
- Pages cached to disk for 60-3600 seconds
- When a page expires, ALL queries re-run to regenerate it
- `revalidatePath()` clears page cache when CMS content changes

**What `'use cache'` adds:**
- Each DAL function cached independently with its own TTL
- When a page needs to regenerate, cached query results are reused (zero DB queries)
- `revalidateTag()` clears only the affected content type (e.g., sermon edit only clears sermon cache, not events/pages/menus)
- Cache lives on disk, not in RAM

**Memory impact:** Moderate improvement on top of ISR. ISR already eliminates 99% of redundant page renders. `'use cache'` makes the remaining 1% (page regeneration after TTL expires) cheaper by caching the underlying queries.

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

## Side Effects

| Side Effect | Impact | Mitigation |
|-------------|--------|------------|
| Brief skeleton flash on CMS page load (~50ms) | LOW | Skeletons match existing loading states |
| `export const revalidate` removed from website routes | NONE | Replaced by `cacheLife()` on DAL functions with same or better TTLs |
| Cache entries use disk space | LOW | Bounded by `cacheMaxMemorySize: 50MB` for in-memory; disk cache is small (text/JSON only) |
| First visit after deploy is uncached | LOW | Same as current ISR behavior |
| All mutation functions must NOT have `'use cache'` | NONE | Only read functions are cached; mutations already excluded |

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
