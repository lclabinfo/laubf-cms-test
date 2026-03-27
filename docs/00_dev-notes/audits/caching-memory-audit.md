> **Date**: 2026-03-27
> **Observed memory**: ~1,000 MB in production (`next start`)
> **Target memory**: <300 MB production
> **Next.js**: 16.1.6 (App Router, React 19.2.3)
> **Prisma**: v7.4.1 with `@prisma/adapter-pg` + `pg` driver
> **Related docs**: `docs/02_database/05-memory-audit.md` (database-focused), `docs/03_website-rendering/07-caching.md` (caching strategy)

---

## Current State: No Server-Side Caching

The project currently has **no server-side caching at all**:

| Mechanism | Status | Evidence |
|-----------|--------|----------|
| `export const revalidate` (ISR) | **Not used** | Zero instances in any `app/website/` route |
| `'use cache'` directive | **Not used** | Zero instances in codebase |
| `cacheTag()` / `revalidateTag()` | **Not used** | Zero instances (only `revalidatePath()`) |
| `unstable_cache()` | **1 instance** | `app/api/v1/speakers/frequent/route.ts` only |
| React `cache()` | **Not used** | Detail pages query DB twice (metadata + render) |
| Redis / external cache | **Not configured** | No Redis anywhere |
| `.next/cache/` | **592 KB** | Only TypeScript build info, no cached pages |

**Consequence:** Every single visitor to every page triggers full database queries, Prisma object hydration, and React server rendering from scratch. 50 visitors to the same page = 50 identical database round-trips.

---

## Memory Hotspot Analysis

### Hotspot 1: Bible Verses (NOT a problem)

- 342,000 rows in PostgreSQL `BibleVerse` table
- Source file: `prisma/data/bible-verses.tsv.gz` (15 MB compressed) — used only during seeding
- **Fetched on-demand** per verse range via indexed queries in `lib/bible-api.ts`
- Query pattern: `findMany({ where: { version, book, chapter, verse: { gte, lte } } })`
- Indices: `@@index([version, book, chapter])` and `@@index([book, chapter, verse, version])`
- **Verdict: No memory issue.** Data stays in PostgreSQL, never bulk-loaded into Node.js.

### Hotspot 2: BibleStudy Content (TipTap JSON)

**List queries — handled correctly:**
- Global `omit` in `lib/db/client.ts:20-25` excludes `questions`, `answers`, `transcript`, `bibleText`, `keyVerseText` from all queries by default
- Per-query `omit` in `lib/dal/bible-studies.ts:11-17` reinforces this for list queries
- This prevents loading ~80 MB of TOAST data for all 1,185 studies

**Detail pages — no caching:**
- `getBibleStudyBySlug()` loads all 5 heavy fields (2-10 MB per record)
- `contentToHtml()` in `lib/tiptap-server.ts` converts TipTap JSON to HTML **on every request**
- `generateMetadata()` and the page component both call `getBibleStudyBySlug()` — **duplicate DB query per page load**
- Files: `app/website/bible-study/[slug]/page.tsx`, `app/website/messages/[slug]/page.tsx`
- **Without ISR:** 50 visitors = 50 DB queries + 50 TipTap-to-HTML conversions for the same content

### Hotspot 3: Website Section Rendering

**Data duplication between resolver and section components:**

| Section Component | Its own fetch | resolve-section-data.ts also fetches |
|-------------------|---------------|--------------------------------------|
| `all-messages.tsx:36` | `getMessages(churchId, { pageSize: 200 })` | `getMessages(churchId, { pageSize: 50 })` |
| `all-events.tsx:16` | `getEvents(churchId, { pageSize: 200 })` | `getEvents(churchId, { pageSize: 50 })` |
| `all-bible-studies.tsx:55` | `getBibleStudies(churchId, { pageSize: 50 })` | `getBibleStudies(churchId, { pageSize: 50 })` |

These section components are async Server Components that fetch their own data independently, but `resolve-section-data.ts` also fetches data for the same section types. This means **duplicate queries** for sections that appear on a page.

**Parallel loading amplifies peak memory:**

```
app/website/[[...slug]]/page.tsx:70-79

const resolvedSections = await Promise.all(
  visibleSections.map(async (section) => {
    const { content, resolvedData } = await resolveSectionData(...)
  })
)
```

A homepage with 5 data-driven sections loads all data simultaneously:
- ALL_MESSAGES: 200 records (~1 MB)
- ALL_EVENTS: 200 records (~800 KB)
- UPCOMING_EVENTS: up to 100 records (~800 KB)
- ALL_BIBLE_STUDIES: 50 records with omit (~100 KB)
- ALL_VIDEOS: 50 records (~150 KB)
- Page metadata + section configs (~2 MB)
- **Peak: ~4-6 MB per page request, all in memory simultaneously**

Without caching, this repeats for **every visitor**.

### Hotspot 4: Layout Data (Every Request)

`app/website/layout.tsx:79` calls `buildLayoutData(churchId)` which fetches:
- `getSiteSettings(churchId)` — site name, description, social URLs, etc.
- `getMenuByLocation(churchId, 'HEADER')` — full header menu with children
- `getMenuByLocation(churchId, 'FOOTER')` — full footer menu with children

Additionally, `generateMetadata()` in the layout calls `getSiteSettings()` **again** (duplicate).

This layout data is identical for every page and every visitor but is re-fetched from the database every time.

---

## Why the Server Is at ~1 GB

From `docs/02_database/05-memory-audit.md`:

| Platform | Idle Memory | ORM | Tables | Why It's Lower |
|----------|-------------|-----|--------|----------------|
| Ghost | 80-120 MB | Knex.js | ~25 | Thin query builder, hard pagination |
| Payload CMS | 180-250 MB | Drizzle | ~30-40 | 6x lighter ORM, enforced depth limits |
| Strapi | 380-450 MB | Custom | 40-80 | Similar memory profile |
| **Our app** | **~1,000 MB** | **Prisma 7** | **45** | Heaviest ORM + no ISR + TipTap on server |

The 1 GB is NOT from data volume (342K bible verses, 1,185 studies, 500 messages all sit in PostgreSQL). It's from:

1. **Prisma 7 runtime overhead** — heaviest Node.js ORM
2. **No ISR** — every page request allocates memory for DB queries + React rendering
3. **No query caching** — identical queries re-execute on every request
4. **TipTap server module** — loaded permanently in memory for JSON→HTML conversion
5. **Node.js memory behavior** — V8 doesn't return freed memory to the OS readily

---

## Implementation Plan

### Tier 1: ISR — Incremental Static Regeneration (Biggest Win)

**What it does:** Caches rendered HTML to disk. Between revalidation intervals, website visitors get served from disk with **zero DB queries, zero Prisma, zero memory allocation**.

**Why it's #1:** Church website content changes ~1x/day. ISR eliminates 99% of redundant renders. The existing `revalidatePath()` calls in CMS API routes already handle on-demand invalidation.

**Changes:**

| File | Change | Revalidation | Why |
|------|--------|-------------|-----|
| `app/website/[[...slug]]/page.tsx` | Add `export const revalidate = 60` | 60 seconds | Content pages; CMS edits trigger `revalidatePath()` |
| `app/website/layout.tsx` | Add `export const revalidate = 300` | 5 minutes | Nav/footer change ~1x/week |
| `app/website/bible-study/[slug]/page.tsx` | Add `export const revalidate = 3600` | 1 hour | Individual studies never change |
| `app/website/messages/[slug]/page.tsx` | Add `export const revalidate = 3600` | 1 hour | Individual messages rarely change |
| `app/website/events/[slug]/page.tsx` | Add `export const revalidate = 600` | 10 minutes | Events change occasionally |

**On-demand invalidation already wired:**
- `app/api/v1/messages/[slug]/route.ts:59-61` — calls `revalidatePath('/website')`, `revalidatePath('/website/messages')`
- `app/api/v1/events/[slug]/route.ts:158-159` — calls `revalidatePath('/website')`, `revalidatePath('/website/events')`
- `app/api/v1/pages/[slug]/route.ts:52-58` — calls `revalidatePath('/website/${slug}')`
- `app/api/v1/pages/[slug]/sections/[id]/route.ts:41-44` — calls `revalidatePath()` for page and root
- `app/api/v1/church/route.ts:50` — calls `revalidatePath('/website', 'layout')`
- `app/api/v1/site-settings/route.ts:33` — calls `revalidatePath('/website', 'layout')`
- `app/api/v1/menus/[id]/items/route.ts:60,100` — calls `revalidatePath('/website', 'layout')`

**Estimated savings: 100-300 MB steady-state**
**Effort: LOW (15-30 minutes)**
**Cost: $0**

---

### Tier 2: `'use cache'` + `cacheTag()` on DAL Functions

**What it does:** Caches database query results in memory/filesystem so repeated calls within a revalidation cycle return cached data instead of hitting PostgreSQL.

**Why it matters:** Even with ISR, the first request after revalidation still runs all queries. With `'use cache'`, DAL results are cached independently with granular tags, so a sermon edit only invalidates sermon cache — not events, pages, or layout.

**Tag naming convention** (from `docs/03_website-rendering/07-caching.md`):

```
church:{churchId}:sermons     — All sermon/message caches
church:{churchId}:events      — All event caches
church:{churchId}:studies     — All bible study caches
church:{churchId}:videos      — All video caches
church:{churchId}:pages       — All page/section caches
church:{churchId}:theme       — Theme customization
church:{churchId}:menus       — Navigation menus
church:{churchId}:settings    — Site settings
church:{churchId}:people      — People/members
```

**DAL functions to wrap:**

| Function | File | Tag | Notes |
|----------|------|-----|-------|
| `getMessages()` | `lib/dal/messages.ts` | `church:{id}:sermons` | Called by resolve-section-data + all-messages section |
| `getLatestMessage()` | `lib/dal/messages.ts` | `church:{id}:sermons` | Homepage spotlight |
| `getEvents()` | `lib/dal/events.ts` | `church:{id}:events` | Called by resolve-section-data + all-events section |
| `getUpcomingEvents()` | `lib/dal/events.ts` | `church:{id}:events` | Called 2-3 times per homepage |
| `getBibleStudies()` | `lib/dal/bible-studies.ts` | `church:{id}:studies` | List pages + sections |
| `getBibleStudyBySlug()` | `lib/dal/bible-studies.ts` | `church:{id}:studies` | Detail page (heavy fields) |
| `getMessageBySlug()` | `lib/dal/messages.ts` | `church:{id}:sermons` | Detail page (heavy fields) |
| `getVideos()` | `lib/dal/videos.ts` | `church:{id}:videos` | Video sections |
| `buildLayoutData()` | `lib/website/build-layout-props.ts` | `church:{id}:menus`, `church:{id}:settings` | Every page load |
| `getSiteSettings()` | `lib/dal/site-settings.ts` | `church:{id}:settings` | Layout + page metadata |
| `getMenuByLocation()` | `lib/dal/menus.ts` | `church:{id}:menus` | Header + footer |

**Pattern:**

```typescript
// lib/dal/messages.ts
import { cacheTag } from 'next/cache'

export async function getMessages(churchId: string, filters?: ...) {
  'use cache'
  cacheTag(`church:${churchId}:sermons`)

  return prisma.message.findMany({ ... })
}
```

**Invalidation helper:**

```typescript
// lib/cache/invalidation.ts
import { revalidateTag } from 'next/cache'

export function invalidateSermons(churchId: string) {
  revalidateTag(`church:${churchId}:sermons`)
  revalidateTag(`church:${churchId}:pages`) // Sermons appear in page sections
}

export function invalidateEvents(churchId: string) {
  revalidateTag(`church:${churchId}:events`)
  revalidateTag(`church:${churchId}:pages`)
}

export function invalidateStudies(churchId: string) {
  revalidateTag(`church:${churchId}:studies`)
  revalidateTag(`church:${churchId}:pages`)
}

export function invalidateLayout(churchId: string) {
  revalidateTag(`church:${churchId}:menus`)
  revalidateTag(`church:${churchId}:settings`)
}

export function invalidateTheme(churchId: string) {
  revalidateTag(`church:${churchId}:theme`)
}
```

**CMS API routes to update** (replace `revalidatePath` with `revalidateTag`):

| API Route | Current | Change to |
|-----------|---------|-----------|
| `app/api/v1/messages/[slug]/route.ts` | `revalidatePath('/website')` | `invalidateSermons(churchId)` |
| `app/api/v1/events/route.ts` | `revalidatePath('/website')` | `invalidateEvents(churchId)` |
| `app/api/v1/events/[slug]/route.ts` | `revalidatePath('/website')` | `invalidateEvents(churchId)` |
| `app/api/v1/events/bulk/route.ts` | `revalidatePath('/website')` | `invalidateEvents(churchId)` |
| `app/api/v1/videos/[slug]/route.ts` | `revalidatePath('/website')` | `invalidateVideos(churchId)` |
| `app/api/v1/pages/[slug]/route.ts` | `revalidatePath('/website/${slug}')` | `revalidateTag(\`church:${churchId}:pages\`)` |
| `app/api/v1/pages/[slug]/sections/route.ts` | `revalidatePath(...)` | `revalidateTag(\`church:${churchId}:pages\`)` |
| `app/api/v1/church/route.ts` | `revalidatePath('/website', 'layout')` | `invalidateLayout(churchId)` |
| `app/api/v1/site-settings/route.ts` | `revalidatePath('/website', 'layout')` | `invalidateLayout(churchId)` |
| `app/api/v1/menus/[id]/items/route.ts` | `revalidatePath('/website', 'layout')` | `invalidateLayout(churchId)` |
| `app/api/v1/daily-bread/route.ts` | `revalidatePath('/website', 'layout')` | `revalidateTag(\`church:${churchId}:daily-bread\`)` |

**Estimated savings: 50-100 MB (eliminates duplicate DB round-trips within revalidation cycles)**
**Effort: MEDIUM (2-3 hours)**
**Cost: $0**

---

### Tier 3: React `cache()` for Detail Page Deduplication

**What it does:** Deduplicates identical function calls within a single React render pass. Detail pages call their DAL function twice — once in `generateMetadata()`, once in the page component.

**Changes:**

```typescript
// app/website/bible-study/[slug]/page.tsx
import { cache } from 'react'

const getCachedStudy = cache((churchId: string, slug: string) =>
  getBibleStudyBySlug(churchId, slug)
)

// Then use getCachedStudy() in both generateMetadata() and the page component
```

**Files:**
- `app/website/bible-study/[slug]/page.tsx` — wraps `getBibleStudyBySlug`
- `app/website/messages/[slug]/page.tsx` — wraps `getMessageBySlug`
- `app/website/events/[slug]/page.tsx` — wraps `getEventBySlug`
- `app/website/[[...slug]]/page.tsx` — wraps `resolvePage()` (called by both metadata and render)

**Estimated savings: 2-5 MB per detail page request (halves DB round-trips)**
**Effort: LOW (30 minutes)**
**Cost: $0**

---

### Tier 4: `cacheMaxMemorySize` Config

**What it does:** Limits how much of the filesystem cache Next.js keeps in RAM.

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  cacheMaxMemorySize: 50 * 1024 * 1024, // 50 MB cap (default is 50MB but explicit is safer)
  // ...existing config
}
```

This prevents the in-memory LRU cache from growing unbounded if many pages are visited.

**Effort: LOW (1 line)**
**Cost: $0**

---

### Tier 5: Fix Section Data Duplication

**What it does:** Eliminates redundant database queries where both `resolve-section-data.ts` and individual section components fetch the same data independently.

**Current problem:**

```
Page render
  └── resolveSectionData('all-messages')
  │     └── getMessages(churchId, { pageSize: 50 })     ← Query #1
  └── <AllMessagesSection>
        └── getMessages(churchId, { pageSize: 200 })     ← Query #2 (same table, different limit)
```

**Fix options:**

**Option A (recommended):** Have `resolve-section-data.ts` skip resolution for section types that are async Server Components (`ALL_MESSAGES`, `ALL_EVENTS`, `ALL_BIBLE_STUDIES`). These sections fetch their own data and don't use `resolvedData`.

```typescript
// resolve-section-data.ts
const SELF_FETCHING_SECTIONS: Set<SectionType> = new Set([
  'ALL_MESSAGES', 'ALL_EVENTS', 'ALL_BIBLE_STUDIES', 'ALL_VIDEOS',
])

export async function resolveSectionData(churchId, sectionType, content) {
  if (SELF_FETCHING_SECTIONS.has(sectionType)) return { content }
  // ... existing resolution logic
}
```

**Option B:** Remove data fetching from section components and pass `resolvedData` from the resolver. This requires updating all `all-*` section components to accept pre-fetched data.

**Estimated savings: Eliminates 1-3 redundant 200-record queries per page**
**Effort: LOW (Option A: 15 minutes)**
**Cost: $0**

---

### Tier 6: Redis — NOT Yet Needed

**When to add:** When any of these trigger:
- Move to PM2 cluster mode (multiple Node.js processes)
- Deploy to multiple servers behind a load balancer
- Cold caches after deploys cause noticeable latency spikes

**What it provides:**
- Shared cache across processes and servers
- Cache survives restarts and deployments
- Prevents "thundering herd" after deploys

**Implementation:**

```typescript
// next.config.ts (future — Stage 2 only)
const nextConfig: NextConfig = {
  cacheHandler: require.resolve('./cache-handler.js'),
  cacheMaxMemorySize: 0, // Disable in-memory, use Redis only
}
```

**Cost:** $0 (self-hosted on same VM) or ~$16/mo (Azure Cache for Redis Basic C0, 250 MB)

**Current state:** Single server, single process. ISR filesystem cache + `'use cache'` is sufficient.

---

## Implementation Priority & Summary

| Step | Tier | What | Effort | Savings | Cost |
|------|------|------|--------|---------|------|
| 1 | Tier 1 | ISR: `export const revalidate` on website routes | 15 min | **100-300 MB** | $0 |
| 2 | Tier 3 | React `cache()` on detail page queries | 30 min | **2-5 MB/request** | $0 |
| 3 | Tier 5 | Skip resolver for self-fetching sections | 15 min | **1-3 queries/page** | $0 |
| 4 | Tier 4 | `cacheMaxMemorySize` in next.config.ts | 1 min | **Prevents bloat** | $0 |
| 5 | Tier 2 | `'use cache'` + `cacheTag()` on DAL functions | 2-3 hrs | **50-100 MB** | $0 |
| 6 | Tier 2 | `revalidateTag()` in CMS API routes | 1-2 hrs | Required for step 5 | $0 |
| 7 | Tier 6 | Redis (when scaling) | 2-4 hrs | Multi-process sharing | $0-16/mo |

**Steps 1-4 alone (< 1 hour of work) should bring memory from ~1 GB toward the 300 MB target.**

Steps 5-6 add granular cache control and eliminate redundant DB queries. Step 7 is deferred until multi-process/multi-server scaling.

---

## Steady-State Memory Estimates

After the global omit and selective query optimizations (already done):

| Scenario | Expected RSS | Notes |
|----------|-------------|-------|
| After fresh restart, idle | ~350-400 MB | Prisma + Next.js + TipTap loaded |
| Normal CMS usage (1-2 users) | ~400-500 MB | Page loads, editing, saving |
| Active builder session | ~450-550 MB | Builder + iframe + undo stack |
| Website traffic (no ISR yet) | ~500-600 MB | DB queries per request, GC cycles |
| Website traffic (with ISR) | ~400-500 MB | Most requests served from disk cache |
| **Peak under load** | **~600-800 MB** | Multiple concurrent users + website |
| **Previous peak (before optimizations)** | **~1000 MB** | Fixed by global omit + selective queries |

Growth from 400 to 600-800 MB is **normal V8 behavior** — the old generation heap fills under traffic and RSS doesn't decrease because V8 keeps allocated pages. This is not a leak.

**If memory exceeds 800 MB consistently**, check: people/members context (500 records), multiple builder sessions, rate limiter Map under heavy unique-IP traffic.

See `full-memory-audit.md` for the complete module-by-module breakdown.

---

## Verification Commands

After implementing, verify with:

```bash
# Check ISR cache is being created
ls -la .next/cache/

# Monitor Node.js memory during load test
node -e "const used = process.memoryUsage(); console.log('RSS:', (used.rss / 1024 / 1024).toFixed(0), 'MB')"

# On production server (PM2)
pm2 monit

# Check if pages are being served from cache (look for x-nextjs-cache header)
curl -I https://laubf.lclab.io/ 2>&1 | grep -i cache
```
