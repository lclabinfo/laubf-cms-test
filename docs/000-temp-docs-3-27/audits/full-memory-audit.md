# Full CMS Memory Audit — All Modules

> **Date**: 2026-03-27
> **Scope**: Website builder, messages, events, media library, people/members, Node.js runtime
> **Current memory**: ~400 MB after restart, grows toward ~800-1000 MB over days
> **Target**: Stable at <500 MB under normal usage

---

## Executive Summary

The global omit and selective query work done today (Priority 1 from the database memory audit) was the single biggest win — eliminating ~80 MB per bible study list request and similar savings on messages/events. The remaining memory concerns fall into three categories:

1. **CMS context providers loading too much data upfront** (people: 500, events: 100, all held in React state)
2. **Website builder duplicate data loading** (iframe preview re-fetches everything the parent already loaded)
3. **V8 heap growth over time** (normal behavior, but rate limiter Map is an unbounded leak)

None of these are emergency-level. The system should stabilize around **400-550 MB** under normal CMS usage with the current optimizations. The items below are ordered by impact.

---

## Module-by-Module Findings

### 1. People / Members — CRITICAL (Highest Memory User in CMS)

**The problem:** `lib/members-context.tsx:109` fetches `pageSize=500` on mount — loading ALL members with relations into client-side React state. The DAL query (`getPeople()`) uses a 7-condition OR for search with nested joins, causing cartesian explosion on the database side.

| Finding | File | Line | Severity |
|---------|------|------|----------|
| Members context loads 500 members on mount | `lib/members-context.tsx` | 109 | CRITICAL |
| Archived members also loaded (500 more) | `lib/members-context.tsx` | 125 | CRITICAL |
| 7-condition OR search with nested role join | `lib/dal/people.ts` | 42-74 | CRITICAL |
| No max pageSize enforced on API | `app/api/v1/people/route.ts` | 14-15 | SERIOUS |
| Users page loads all users, no pagination | `app/cms/.../people/users/page.tsx` | 61 | SERIOUS |
| Ministries page loads all, no pagination | `app/cms/.../people/ministries/page.tsx` | 90 | MODERATE |

**Estimated memory:** 500 members x 5-10 KB = **2.5-5 MB in client state**, plus the server-side query processing.

**Recommended fix (future):**
- Reduce default pageSize to 50, implement server-side pagination + search
- Move the role-based search to a separate indexed query
- Add `pageSize = Math.min(requested, 100)` guard on the API

---

### 2. Website Builder — HIGH (Duplicate Loading)

**The problem:** The builder page and its iframe preview independently fetch all page data. A page with 10 sections loads ~400 KB on the parent, then ~330 KB again in the iframe. The undo/redo stack holds full section snapshots (up to 10 levels x 250 KB = 2.5 MB).

| Finding | File | Severity |
|---------|------|----------|
| Preview iframe re-fetches all page data independently | `builder/preview/[pageId]/page.tsx` | HIGH |
| `getPages()` loads ALL pages unbounded (for page switcher) | `builder/(editor)/[pageId]/page.tsx:24` | HIGH |
| Undo/redo stores full section snapshots | `builder-shell.tsx:204-265` | HIGH |
| Menu data JSON.stringify'd 3x redundantly | `builder/(editor)/[pageId]/page.tsx:64,107,124` | MODERATE |
| Hidden sections keep resolvedData in memory | `builder/types.ts` | LOW |

**Estimated memory per builder session:** ~4-5 MB (parent + iframe + undo stack)

**Recommended fix (future):**
- Have iframe receive data via postMessage from parent instead of re-fetching
- Cap undo history at 5-10 entries
- Add `take: 100` to `getPages()` query

---

### 3. Events CMS — HIGH (Unbounded Queries)

**The problem:** `lib/events-context.tsx:240` fetches `pageSize=100` on mount. `getRecurringEvents()` has no limit at all. `description` field is NOT included in the global omit.

| Finding | File | Line | Severity |
|---------|------|------|----------|
| Context loads 100 events on mount | `lib/events-context.tsx` | 240 | HIGH |
| `getRecurringEvents()` has no limit | `lib/dal/events.ts` | 192-205 | HIGH |
| `description` not in global omit | `lib/db/client.ts` | 23 | MODERATE |
| Bulk operations no array length validation | `app/api/v1/events/bulk/route.ts` | 10 | MODERATE |

**Estimated memory:** 100 events x 2-3 KB = 200-300 KB (acceptable now, but grows)

**Recommended fix (future):**
- Add `take` limit to `getRecurringEvents()`
- Consider adding `description` to global omit (opt back in for detail views)
- Add `ids.length > 1000` guard on bulk endpoints

---

### 4. Media Library — MODERATE (R2 File Operations)

**The problem:** `r2.ts:moveObject()` downloads the entire file into a byte array before re-uploading (Cloudflare R2 doesn't support CopyObject). For a 15 MB file, that's 15 MB held in memory during the operation.

| Finding | File | Line | Severity |
|---------|------|------|----------|
| `moveObject()` downloads full file to memory | `lib/storage/r2.ts` | 102-172 | HIGH |
| Media list accumulates in client state (no pagination UI) | `app/cms/.../media/page.tsx` | 62 | MODERATE |
| Bulk delete fires 100 parallel R2 deletes | `lib/dal/media.ts` | 293-317 | MODERATE |
| R2 font scan iterates all objects (no pagination) | `lib/dal/storage.ts` | 181-224 | LOW |

**Estimated memory per promote operation:** Up to 15 MB per file (temporary, freed after upload)

**Recommended fix (future):**
- Batch R2 deletes to 10-20 concurrent operations instead of 100
- Monitor if Cloudflare adds CopyObject support to eliminate download-reupload

---

### 5. Messages CMS — GOOD (Already Fixed)

Messages are the best-optimized module after today's work.

| Finding | Status |
|---------|--------|
| List queries properly omit heavy fields | GOOD |
| Detail queries opt back into needed fields | GOOD (fixed today for relatedStudy) |
| Pagination enforced (50 per page, configurable) | GOOD |
| Context only holds current page of data | GOOD |
| Bulk operations use `select` for minimal fields | GOOD |
| Series loaded unbounded but small dataset | ACCEPTABLE |

**No action needed.**

---

### 6. Node.js Runtime — MODERATE (Expected Growth Pattern)

**Why memory grows from 400 MB to ~800-1000 MB over time:**

The PM2 ecosystem config sets `--max-old-space-size=256`, which caps V8's old generation heap. But total RSS includes V8 heap + external memory (native buffers, TLS connections, Prisma engine) + Node.js overhead.

| Component | Size | Notes |
|-----------|------|-------|
| V8 old generation heap | 256 MB (capped) | Set by `--max-old-space-size` |
| V8 young generation + JIT | ~64-96 MB | Scales with code size |
| External memory (TLS, Prisma, native buffers) | ~200-400 MB | Grows under traffic |
| Node.js runtime overhead | ~50 MB | Fixed |
| **Expected steady state** | **570-800 MB** | |

**One fixable leak found:**

| Finding | File | Line | Severity |
|---------|------|------|----------|
| Rate limiter uses unbounded `Map` | `lib/rate-limit.ts` | module scope | MODERATE |

The rate limiter stores hits in a `Map<string, { count, resetAt }>` with cleanup every 5 minutes. Between cleanups, entries accumulate. Under sustained traffic from many unique IPs, this grows unbounded (up to 10K entries = ~2-3 MB before emergency clear).

**Other runtime items — all safe:**

| Component | File | Status |
|-----------|------|--------|
| Prisma pool (5 connections, 30s idle) | `lib/db/client.ts` | Properly bounded |
| TipTap server extensions cache | `lib/tiptap-server.ts` | Single instance, never grows |
| `unstable_cache` (frequent speakers) | `app/api/v1/speakers/frequent/route.ts` | One entry per church |
| AWS S3 client | `lib/storage/r2.ts` | Lazy-loaded, single instance |
| Static validation Sets | `lib/api/validation.ts` | Fixed size, never grows |

---

## Expected Steady-State Memory

With the optimizations already implemented today:

| Scenario | Expected RSS | Notes |
|----------|-------------|-------|
| After fresh restart, idle | ~350-400 MB | Prisma + Next.js + TipTap loaded |
| Normal CMS usage (1-2 users) | ~400-500 MB | Page loads, editing, saving |
| Active builder session | ~450-550 MB | Builder + iframe + undo stack |
| Website traffic (no ISR yet) | ~500-600 MB | DB queries per request, GC cycles |
| Website traffic (with ISR) | ~400-500 MB | Most requests served from disk cache |
| **Peak under load** | **~600-800 MB** | Multiple concurrent users + website |
| **Previous peak (before optimizations)** | **~1000 MB** | Fixed by global omit + selective queries |

The key difference from before: list queries no longer load 80 MB of TOAST data, so memory spikes are bounded. The remaining growth from 400 to 600-800 MB is **normal V8 behavior** — the old generation heap fills under traffic and V8 runs major GC cycles to reclaim space. RSS doesn't decrease because V8 keeps the allocated pages for future use.

**If you see memory exceeding 800 MB consistently**, the likely causes are:
1. The people/members context loading 500 records (fixable)
2. Multiple builder sessions with large undo stacks (fixable)
3. The rate limiter Map under sustained unique-IP traffic (fixable with LRU cache)

---

## Priority Actions (What to Do Next)

### Done (2026-03-27)
- [x] Global omit on PrismaClient (Message, BibleStudy, Event, SiteSettings)
- [x] Per-query omit overrides for detail views
- [x] `take` limits on nested includes (attachments, roles, households)
- [x] Fix CMS Bible Study tab empty state (relatedStudy omit override)
- [x] PostgreSQL tuning (partial indexes, LZ4 compression, TOAST storage)
- [x] Fix website filter dropdowns (filterMeta for all listing pages)
- [x] Messages eager-fetch for complete data access
- [x] ISR on all website routes (60-3600s revalidation) + `cacheMaxMemorySize: 50MB`
- [x] API pageSize caps (100 on most endpoints, 500 on people until server-side search)
- [x] Bulk operation guards (1000 ID max on messages + events)
- [x] `getRecurringEvents()` bounded with `take` limit
- [x] `eventDetailOmit` includes `description: false` override
- [x] Builder undo history capped at 10 (was 50)
- [x] `getPages()` bounded with `take: 100`
- [x] Builder JSON.stringify consolidated (3x → 1x for header menu)
- [x] Rate limiter: cleanup 5min→1min, max entries 10K→5K, inline expiry check

### Verified (5-agent verification pass, all clean)
- [x] ISR: All 6 website routes have correct revalidation + all CMS writes have `revalidatePath()`
- [x] Events: DAL, bulk route, API cap — all correct, no callers broken
- [x] Builder: Undo cap enforced, all `getPages()` callers verified, JSON cleanup correct
- [x] API guards: Math.min applied correctly, NaN/undefined fallthrough works
- [x] Rate limiter: Constants correct, inline expiry works, callers unaffected

### Remaining (Ordered by Impact)

| Priority | Action | Effort | Savings |
|----------|--------|--------|---------|
| 1 | **Refactor members context to server-side pagination + search** (like messages-context pattern: `manualPagination: true`, server `?search=` param, only hold 1 page in state) | 2-3 hrs | 2-5 MB per CMS session |
| 2 | Unify builder iframe data (postMessage instead of re-fetch) | 2-3 hrs | ~330 KB per builder session |
| 3 | Add `description` to Event global omit (requires refactoring events-context to use detail API for edit form, not list context) | 1-2 hrs | ~5-50 KB per event list |
| 4 | Batch R2 bulk deletes to 10-20 concurrent | 30 min | Prevents spike during bulk ops |

### People/Members Refactor Plan

The messages CMS is the gold standard for scalable data loading:
- `manualPagination: true` in TanStack Table (server handles page navigation)
- Server-side search via `?search=` API param with 300ms debounce
- Only 50 records in React state at a time (one page)
- Scales to 5000+ records without memory issues

The people/members context (`pageSize=500`, client-side search) needs the same refactor:
1. Change `members-context.tsx` to fetch one page at a time (pageSize=50)
2. Add `manualPagination: true` and `manualSorting: true` to TanStack Table config
3. Move search to server-side: debounce input, send `?search=` to API
4. The DAL `getPeople()` already supports `search` filter — just needs wiring
5. Reduce people API cap from 500 back to 100 after refactor

---

## What NOT to Worry About

These came up in the audit but are non-issues:

- **Bible verse data (342K rows):** Stays in PostgreSQL, fetched per-verse-range. Not a memory problem.
- **TipTap server extensions cache:** Single instance, ~30 KB, never grows.
- **Media thumbnails/URLs:** Small strings, properly paginated.
- **Theme/navigation data:** Small datasets (<50 KB), loaded once per session.
- **Series data:** Typically <100 items, loaded once per session.
- **Upload queue File objects:** Properly cleaned after upload completes.
