# Database & Server Memory Audit

> **Date**: 2026-03-25 (11-agent investigation)
> **Last updated**: 2026-03-26 (corrected estimates with measured data, marked completed items, added table merge reference)
> **Prisma**: v7.4.1 with `@prisma/adapter-pg` + `pg` driver
> **Next.js**: 16.1.6 (App Router, React 19.2.3)
> **Schema**: 45 models, 27 enums, 1,754 lines
> **Observed memory**: ~1,000 MB in **production** (`next start`)
> **Target memory**: <300 MB production

> **NOTE — Table Merge Plan**: Priorities 3, 4, and parts of 6/7 will be superseded by the
> Message + BibleStudy table merge documented in `/message-biblestudy-proposed-schema.md`.
> That merge eliminates the sync layer, the duplication, and the format inconsistency in one
> migration. Items marked **[SUPERSEDED BY MERGE]** below should NOT be implemented independently —
> they'll be handled as part of the merge. Items marked **[DO NOW]** are safe to implement
> immediately and remain valid regardless of whether/when the merge happens.

---

## How to Read This Document

Everything is ordered by **permanent steady-state impact** — assuming every page is visited, every feature is used, and the server runs continuously. Temporary tricks (preload delays, GC flags) are excluded or marked as such. Each item shows effort, side effects, and which files change.

---

## Comparable Platforms

| Platform | Idle Memory | ORM | Tables | Why It's Lower |
|----------|-------------|-----|--------|----------------|
| Ghost | 80-120 MB | Knex.js | ~25 | Stores HTML directly, thin query builder, hard pagination limits |
| **Payload CMS** | **180-250 MB** | **Drizzle** | **~30-40** | 6x lighter ORM, blocks as JSON, enforced depth limits |
| Strapi | 380-450 MB | Custom | 40-80 | Fully normalized like us, similar memory profile |
| **Our app** | **~1,000 MB** | **Prisma 7** | **45** | Heaviest ORM + most tables + no ISR + TipTap on server |

---

## Key Insight: What's NOT Causing the 1 GB

- **Data volume**: The 342K BibleVerse rows, 1170 bible studies, 500 messages do NOT increase Node.js idle memory. They sit in PostgreSQL. Node.js only allocates during active requests, bounded by pagination.
- **PostgreSQL memory**: The 1 GB RSS is the Node.js process only. PostgreSQL runs as separate processes.
- **The database is not "too big"**: The problem is how much data we load per request and how heavy the runtime is.

---

## Priority 1: Selective Queries (Biggest Bang, Lowest Effort)

**Why this is #1**: Every list request currently loads megabytes of text content that the UI never displays. Fixing this saves memory on EVERY request, permanently. It also prevents PostgreSQL from reading TOAST tables (separate storage for large text), which is a 10-50x I/O improvement.

### 1a. Use `omit` in All List Queries — **[DONE 2026-03-27]**
- [x] Add `omit` to `getBibleStudies()` in `lib/dal/bible-studies.ts` (questions, answers, transcript, bibleText, keyVerseText)
- [x] Add `omit` to `getMessages()` in `lib/dal/messages.ts` (rawTranscript, liveTranscript, transcriptSegments, studySections)
- [x] Add `omit` to `getLatestMessage()` in `lib/dal/messages.ts`
- [x] Update list return types to reflect omitted fields (`BibleStudyListItem`, `MessageWithRelations` with omit)

> **2026-03-26 correction**: The original estimate of ~5-7.5 MB per list request was
> conservative. Actual measurement shows `getBibleStudies()` transfers **~80 MB** for all
> 1,185 studies (avg 71 KB of text content per row). The list page only needs ~152 KB of
> metadata. This is a **500x over-fetch** and the single largest memory issue.
>
> Measured column averages on BibleStudy: questions 6 KB, answers 56 KB, transcript 42 KB, bibleText 3 KB.

**Current problem**: `getBibleStudies()` loads full records including all text fields. For all 1,185 studies → **~80 MB loaded and immediately discarded**. The list page only uses id, slug, title, passage, dateFor, book, series, and three boolean flags.

Same for messages: list API returns messages with transcripts/studySections that the UI never displays.

**Fix**: Use Prisma `omit` (GA since 6.2.0, stable in 7.x) to exclude heavy columns from list queries:

```typescript
// In getBibleStudies() — lib/dal/bible-studies.ts
const studies = await prisma.bibleStudy.findMany({
  where: { churchId, deletedAt: null, status: 'PUBLISHED' },
  omit: {
    questions: true, answers: true, transcript: true,
    bibleText: true, keyVerseText: true,
  },
  include: {
    speaker: { select: { firstName: true, lastName: true, preferredName: true } },
    series: { select: { id: true, name: true } },
    attachments: { select: { id: true }, orderBy: { sortOrder: 'asc' } },
    relatedMessage: { select: { bibleVersion: true, slug: true, videoUrl: true, youtubeId: true } },
  },
  orderBy: { dateFor: 'desc' },
  skip, take,
})
```

> **Note**: After the table merge, this becomes a single `omit` on the merged Message table.
> The pattern is the same — `omit` works identically on a merged table. See
> `/message-biblestudy-proposed-schema.md` section 10.

**Why it matters beyond Node.js**: PostgreSQL stores large Text/JsonB fields in a separate TOAST table. When you `SELECT` without text columns, PostgreSQL **never reads TOAST** — no I/O, no decompression, no buffer pool pollution. This is the single biggest hidden win.

**Savings**: ~80 MB → ~152 KB per bible study list request (permanent, on every request)
**Effort**: LOW — add `omit` object to list queries in DAL functions
**Files**: `lib/dal/bible-studies.ts`, `lib/dal/messages.ts`, `lib/website/resolve-section-data.ts`
**Side effects**: None for list views. Detail views use `findUnique` without `omit` and still get all columns.

### 1b. Global `omit` on PrismaClient as Safety Net — **[DONE 2026-03-27]**
- [x] Add global `omit` config to `lib/db/client.ts` (Message, BibleStudy, Event, SiteSettings heavy text fields)
- [x] Add `omit: { field: false }` overrides to all detail/write queries that need heavy fields
  - [x] `getBibleStudyBySlug()`, `createBibleStudy()`, `updateBibleStudy()` in bible-studies.ts
  - [x] `getMessageBySlug()`, `getMessageById()`, `createMessage()`, `updateMessage()`, `archiveMessage()`, `unarchiveMessage()` in messages.ts
  - [x] `getEventBySlug()`, `createEvent()`, `updateEvent()` in events.ts
  - [x] `getSiteSettings()`, `updateSiteSettings()` in site-settings.ts
  - Note: DailyBread excluded from global omit — few records, body needed in all views

Even after fixing list queries, add `omit` to the PrismaClient config to prevent accidental over-fetching anywhere else:

```typescript
return new PrismaClient({
  adapter,
  omit: {
    message: { rawTranscript: true, liveTranscript: true, transcriptSegments: true, studySections: true },
    bibleStudy: { questions: true, answers: true, transcript: true, bibleText: true },
    event: { description: true, locationInstructions: true, welcomeMessage: true },
    dailyBread: { body: true, bibleText: true },
    siteSettings: { customHeadHtml: true, customBodyHtml: true },
  },
  log: ['error'],
})
```

> **Note**: After the table merge, the `bibleStudy` key is removed and the `message` key
> gains `questions`, `answers`, `transcript`, `bibleText`. Same principle.

**Savings**: Prevents regressions. Any new query that forgets to use per-query `omit` still won't load heavy fields.
**Effort**: LOW — one config change
**Files**: `lib/db/client.ts`
**Side effects**: Detail views must opt-in to heavy fields via `omit: { questions: false }`. Verify all detail pages still work.

### 1c. Add `take` Limits to All Nested 1:Many Includes — **[DONE 2026-03-27]**
- [x] `getPersonById()` → communicationPreferences: `take: 50`
- [x] `getPersonById()` → customFieldValues: `take: 50`
- [x] `getBibleStudies()` → attachments: `take: 20`
- [x] `getRoleDefinitions()` → assignments: `take: 50`
- [x] `getHouseholds()` → members: `take: 20`

Several DAL functions load unbounded nested relations:

| DAL Function | Nested Relation | Fix |
|-------------|-----------------|-----|
| `getPersonById()` | customFieldValues (unbounded) | `take: 50` |
| `getPersonById()` | communicationPreferences (unbounded) | `take: 50` |
| `getBibleStudies()` | attachments (unbounded) | `take: 20` |
| `getRoleDefinitions()` | assignments with person (unbounded) | `take: 50` |
| `getHouseholds()` | members (unbounded) | `take: 20` |

**Savings**: Prevents spikes from records with hundreds of nested items
**Effort**: LOW — add `take` parameter to include clauses
**Files**: `lib/dal/people.ts`, `lib/dal/bible-studies.ts`, `lib/dal/person-roles.ts`, `lib/dal/households.ts`

### 1d. Deduplicate Detail Page Queries with React `cache()` — **[DONE 2026-03-27]**
- [x] Wrap `getBibleStudyBySlug` with `cache()` in `app/website/bible-study/[slug]/page.tsx`
- [x] Wrap `getMessageBySlug` with `cache()` in `app/website/messages/[slug]/page.tsx`

Detail pages call their DAL function **twice** — once in `generateMetadata()`, once in the page component. Each call loads ~100 KB.

```typescript
import { cache } from 'react'

const getCachedStudy = cache((churchId: string, slug: string) =>
  getBibleStudyBySlug(churchId, slug)
)
```

**Savings**: Halves DB round-trips on every detail page (permanent)
**Effort**: LOW
**Files**: `app/website/bible-study/[slug]/page.tsx`, `app/website/messages/[slug]/page.tsx`

---

## Priority 2: ISR for Website Routes — **[DO NOW]**
- [ ] Add `export const revalidate = 60` to `app/website/[[...slug]]/page.tsx`
- [ ] Add `export const revalidate = 300` to `app/website/layout.tsx`
- [ ] Add `revalidatePath`/`revalidateTag` calls in CMS save handlers
- [ ] Verify CMS preview bypasses cache

**Why this is #2**: Caches rendered HTML to disk. Between revalidation intervals, website visitors get served from disk with **zero DB queries, zero Prisma, zero memory allocation**. For a church website where content changes ~once/day, this eliminates 99% of database-driven memory usage.

```typescript
// app/website/[[...slug]]/page.tsx
export const revalidate = 60

// app/website/layout.tsx
export const revalidate = 300
```

Then add `revalidatePath`/`revalidateTag` calls in CMS save handlers so edits appear immediately.

**Savings**: 100-300 MB during website traffic (permanent — disk cache, not memory)
**Effort**: MEDIUM — add revalidate + wire up CMS save handlers
**Files**: `app/website/[[...slug]]/page.tsx`, `app/website/layout.tsx`, all CMS API routes that modify content
**Side effects**: Content updates have up to 60s delay for anonymous visitors. CMS preview should bypass cache.

---

## Priority 3: Eliminate Data Duplication — **[SUPERSEDED BY MERGE]**

> **2026-03-26 update**: This entire priority is addressed by the Message + BibleStudy table
> merge. The merge eliminates all duplication by putting everything on a single table. See
> `/message-biblestudy-proposed-schema.md` for the full plan. Do NOT implement 3a or 3b
> independently — they would create throwaway work that the merge replaces.

### 3a. Remove Message ↔ BibleStudy Content Duplication — **[SUPERSEDED BY MERGE]**

- [ ] Merge BibleStudy content into Message table (eliminates duplication)
- [ ] Remove `syncMessageStudy()` sync layer (~448 lines)
- [ ] Resolve format inconsistency (99% TipTap JSON vs 1% HTML in BibleStudy columns)

Study content is stored **TWICE**:

```
Message.studySections  (JsonB, ~25 KB)  ← TipTap JSON
Message.attachments    (JsonB, ~5 KB)   ← file references

      │  syncMessageStudy() copies & converts
      ▼

BibleStudy.questions   (Text, ~7 KB)   ← Same content as HTML
BibleStudy.answers     (Text, ~15 KB)  ← Same content as HTML
BibleStudy.transcript  (Text, ~80 KB)  ← Same content as HTML
+ BibleStudyAttachment rows            ← Same attachments as DB rows
```

> **2026-03-26 correction**: The original estimates were based on ~500 messages. Actual data:
> 1,176 messages, but only 8 have `studySections` populated and only 3 have `rawTranscript`.
> The duplication is real but smaller than estimated because 99.3% of study content was
> migrated directly to BibleStudy and never round-tripped through Message.studySections.
> The bigger issue is the 448-line sync layer and the format inconsistency (99% TipTap JSON
> vs 1% HTML in BibleStudy columns). Both are resolved by the table merge.

### 3b. Remove Dead `transcriptSegments` Field — **[SUPERSEDED BY MERGE]**

- [ ] Drop `Message.transcriptSegments` column (confirmed dead: 7 entries, all JSON `null`, zero code refs)

> **Resolved by merge**: Column is dropped in the merge migration. If implementing before the
> merge, this is safe to drop independently.

### 3c. Remove Duplicate Fields Between Church and SiteSettings — **[DO NOW]**

- [ ] Identify canonical source for each of the 9 duplicated fields (social URLs, contact info, logo/favicon)
- [ ] Consolidate to single source of truth (remove duplicates from non-canonical model)
- [ ] Update DAL queries and admin UI to use canonical model only

**Savings**: Modest (avoids loading duplicate data in layout queries)
**Effort**: LOW-MEDIUM depending on which model becomes canonical

---

## Priority 4: Pre-Render HTML at CMS Save Time — **[PARTIALLY DONE, REST SUPERSEDED BY MERGE]**

> **2026-03-26 update**: The TipTap server split is done (committed 2026-03-26). Website pages
> now import from `lib/tiptap-server.ts` instead of the full TipTap module. This captures the
> 15-30 MB of module savings.
>
> The remaining issue — per-request `contentToHtml()` parsing of 40-80KB TipTap JSON for 99%
> of BibleStudy entries (legacy migration data) — is resolved by the table merge, which
> includes a one-time script to convert all TipTap JSON → HTML. After that, `contentToHtml()`
> calls are removed from website pages entirely.

~~Currently, TipTap JSON is stored in the database and converted to HTML **on every page render** server-side. TipTap imports ~10-20 MB of dependencies that stay permanently loaded.~~

**Done (2026-03-26):**
- [x] Create `lib/tiptap-server.ts` with lightweight server-only utilities (no editor plugins)
- [x] `app/website/bible-study/[slug]/page.tsx` → imports from `tiptap-server`
- [x] `app/website/events/[slug]/page.tsx` → imports from `tiptap-server`
- [x] `app/website/messages/[slug]/page.tsx` → imports from `tiptap-server`
- [x] Disable Sharp (`images: { unoptimized: true }` in `next.config.ts`)
- [x] Exclude TypeScript from bundle (`serverExternalPackages: ['typescript']`)

**Savings achieved**: ~50-85 MB reduction in server bundle size

**Remaining (deferred to merge):**
- [ ] One-time conversion of 1,150+ TipTap JSON entries in BibleStudy columns to HTML (eliminates per-request parsing)

---

## Priority 5: DAL Query Refactoring (People & Roles) — **[DO NOW]**

Independent of the Message/BibleStudy work. Still valid.

### 5a. Fix Cartesian Explosion in People Queries
- [ ] Refactor `getPeople()` to use `select` with minimal fields instead of full includes
- [ ] Split role search in `getPeople()` into a separate query (avoid 7-condition OR with nested joins)
- [ ] Add pagination to `getPeopleByRole()` role assignments (currently 500 people × 5 roles = 2500 records)
- [ ] Paginate `householdMemberships` and `roleAssignments` includes

**Savings**: 20-100 MB at peak (permanent — every people page load)
**Effort**: MEDIUM
**Files**: `lib/dal/people.ts`, `lib/dal/person-roles.ts`

### 5b. Batch-Fetch Speakers Instead of Per-Message Include
- [ ] Fetch messages without `include: { speaker: true }`
- [ ] Extract unique `speakerId` values from results
- [ ] Batch-fetch speakers in single query
- [ ] Join speakers to messages in app code (5 objects instead of 50)

**Savings**: 1-3 MB per list render (permanent)
**Effort**: MEDIUM
**Files**: `lib/dal/messages.ts`

---

## Priority 6: PostgreSQL Tuning (Free Performance) — **[DONE — 2026-03-27]**

> **2026-03-27**: All items implemented in migration `20260327164719_pg_tuning_priority6`.
> Note: `isFeatured` column on Event was NOT dropped — it's actively used for website display
> (renders "FEATURED" badges on event cards/detail pages). Only the index was dropped.

### 6a. Partial Indexes on `deletedAt IS NULL` — **[DONE]**
- [x] Create partial index `idx_message_active` on Message (`churchId`, `dateFor` DESC) WHERE `deletedAt` IS NULL
- [x] Create partial index `idx_event_active` on Event (`churchId`, `dateStart` DESC) WHERE `deletedAt` IS NULL
- [x] Added via raw SQL in Prisma migration

> Skipped `idx_bible_study_active` — BibleStudy table will be dropped in merge.

### 6b. LZ4 Compression for TOAST Columns — **[DONE]**
- [x] Set LZ4 compression on `Message.rawTranscript`
- [x] Set LZ4 compression on `Message.liveTranscript`
- [x] Set LZ4 compression on `Message.studySections`
- [x] Set LZ4 compression on `Event.description`
- [x] Set LZ4 compression on `Event.locationInstructions`
- [x] Set LZ4 compression on `Event.welcomeMessage`
- [ ] (Post-merge) Set LZ4 compression on `Message.questions`
- [ ] (Post-merge) Set LZ4 compression on `Message.answers`
- [ ] (Post-merge) Set LZ4 compression on `Message.transcript`
- [ ] (Post-merge) Set LZ4 compression on `Message.bibleText`

> Note: LZ4 only affects newly written data. Existing TOAST data stays pglz until `VACUUM FULL`.

### 6c. Keep PageSection.content Inline (No TOAST) — **[DONE]**
- [x] Set `STORAGE MAIN` on `PageSection.content` (avoids TOAST lookups for <2 KB JSON read on every page load)

### 6d. Drop Redundant Indexes — **[DONE]**

**Indexes dropped (2026-03-27):**
- [x] Event: `[churchId, status]` (covered by `[churchId, status, dateStart]`)
- [x] Event: `[churchId, isFeatured]` (low cardinality — column kept, actively used on website)
- [x] Event: `[churchId, isPinned]` (boolean — too low cardinality, not queried on Event)
- [x] Event: `[churchId, isRecurring]` (boolean — too low cardinality)
- [x] Event: `[churchId, campusId]` (rarely filtered alone)
- [x] Page: `[churchId, isPublished]` (boolean, <100 pages)
- [x] Page: `[churchId, isHomepage]` (only 1 true per church)
- [x] Session: `[token]` (redundant — `@unique` already creates index)
- [x] Church: `[slug]` (redundant — `@unique` already creates index)

**Indexes KEPT (reversed from original recommendation):**
- [x] Message: `[churchId, hasVideo]` — needed after merge for content type filtering
- [x] Message: `[churchId, hasStudy]` — needed after merge for content type filtering

**Dropped with table in merge:**
- [ ] BibleStudy: `[churchId, status]` — dropped when BibleStudy table is removed

---

## Priority 7: Schema Consolidation (45 → 37 Models) — **[PARTIALLY OUTDATED]**

> **2026-03-26 update**: The table merge changes the model count calculation. BibleStudy and
> MessageSeries are dropped (2 models). BibleStudyAttachment is renamed to MessageAttachment
> (0 net change — it stays as a relation table, NOT inlined as JSON, because attachments need
> individual R2 file lifecycle management). See `/message-biblestudy-proposed-schema.md`.

### Models to Remove/Merge

**Superseded by merge:**
- [ ] BibleStudy → merged into Message (HIGH effort, see merge plan) **[SUPERSEDED BY MERGE]**
- [ ] MessageSeries → direct FK on Message (MEDIUM effort, part of merge) **[SUPERSEDED BY MERGE]**

**Reversed:**
- [x] ~~BibleStudyAttachment → BibleStudy.attachments JSON~~ — **REVERSED: keep as relation table (renamed MessageAttachment). R2 lifecycle management requires individual records.**

**Still valid — independent of merge:**
- [ ] Remove Tag model (unused, zero references) — LOW effort, no side effects
- [ ] EventLink → Event.links JSON — LOW effort, update events DAL + UI
- [ ] MediaFolder → Remove (MediaAsset.folder is sufficient) — LOW effort, update media DAL
- [ ] CommunicationPreference → Person.commPrefs JSON — LOW effort, update person DAL
- [ ] SiteSettings → Church.siteSettings JSON — HIGH effort, major rewrite of DAL, theme, admin
- [ ] ThemeCustomization → Church.themeConfig JSON — HIGH effort, major rewrite of theme system
- [ ] BuilderPresence → Redis/in-memory — MEDIUM effort, architecture change

**Conservative (with merge)**: Merge tables + Remove Tag, EventLink, MediaFolder, CommunicationPreference = **6 models** (45 → 39)
**Aggressive (with merge)**: Also SiteSettings, ThemeCustomization, BuilderPresence = **9 models** (45 → 36)

### Column Consolidation (370 → ~242 Columns)

- [ ] Event recurrence: Consolidate 8 cols → `recurrenceRule Json?` (saves 7 cols, 2 enums)
- [ ] Event registration: Consolidate 7 cols → `registration Json?` (saves 6 cols)
- [ ] Event location: Consolidate 8 cols → `locationData Json?` (saves 7 cols, 1 enum)
- [ ] Person phones: Consolidate 3 cols → `phones Json?` (saves 2 cols)
- [ ] Person address: Remove 4 duplicate cols (city/state/zip/country already in address JSON)
- [ ] MenuItem featured: Consolidate 4 cols → `featured Json?` (saves 3 cols)
- [ ] Church social URLs: Remove 5 duplicate cols (duplicated in SiteSettings)
- [ ] Message/BibleStudy merge: Remove 9 duplicated cols + 5 dead/deprecated cols (saves 14 cols)

> **2026-03-26 addition**: The table merge removes: `Message.transcriptSegments` (dead),
> `Message.attachments` JSON (deprecated), `Message.relatedStudyId` (no longer needed),
> `BibleStudy.datePosted` (always = dateFor), `BibleStudy.status` (replaced by hasStudy + deletedAt),
> plus 9 duplicated metadata columns. Net: 14 fewer columns.

### Enum Reduction (27 → 9)

**Keep (9):** ChurchStatus, PlanTier, MemberRole, SubStatus, ContentStatus, EventType, BibleBook, SectionType, MembershipStatus

**Remove (absorbed into JSON):**
- [ ] Remove `Recurrence` enum
- [ ] Remove `RecurrenceEndType` enum
- [ ] Remove `LocationType` enum

**Convert to String (15):**
- [ ] Convert `AttachmentType` to String
- [ ] Convert `AnnouncePriority` to String
- [ ] Convert `NoteType` to String
- [ ] Convert `HouseholdRole` to String
- [ ] Convert `CommunicationChannel` to String
- [ ] Convert `CustomFieldType` to String
- [ ] Convert `VideoCategory` to String
- [ ] Convert `MaritalStatus` to String
- [ ] Convert `Gender` to String
- [ ] Convert `MenuLocation` to String
- [ ] Convert `PageType` to String
- [ ] Convert `PageLayout` to String
- [ ] Convert `DomainStatus` to String
- [ ] Convert `SslStatus` to String
- [ ] Convert `AccessRequestStatus` to String

### Net Result (updated with merge)

| Metric | Before | After (with merge) | Delta |
|--------|--------|---------------------|-------|
| Models | 45 | 36 | -9 |
| Enums | 27 | 9 | -18 |
| Columns | ~370 | ~228 | -142 |
| Indexes | ~65 | ~51 | -14 |
| Generated client | 4.7 MB | ~2.8 MB | -40% |
| Prisma memory | 40-70 MB | 22-45 MB | -18-25 MB |
| Sync code deleted | 0 | 800+ lines | — |

---

## Priority 8: Architecture Options (Long-Term) — **[DO NOW — still valid]**

### Option A: Split CMS + Website into Two Processes
- [ ] Evaluate feasibility of splitting into two processes
- [ ] **Process 1**: CMS admin (Next.js + Prisma, ~500 MB)
- [ ] **Process 2**: Website (lightweight Next.js, ISR-only, 150-200 MB)

### Option B: Drizzle for Website Read Paths
- [ ] Evaluate Drizzle as read-path ORM (6x lighter: ~5-15 MB vs Prisma's 40-70 MB)
- [ ] Keep Prisma for CMS writes, use Drizzle for website queries
- [ ] Effort estimate: 2-3 weeks

### Option C: Prisma Accelerate
- [ ] Evaluate Prisma Accelerate (offloads query engine to Prisma cloud, ~2-3 MB client)
- [ ] Assess cost model (paid per-query)

---

## Non-Obvious Technical Details

### RSC Serialization Doubles Data in Memory

When React Server Components render, query results exist **twice** simultaneously — the Prisma objects AND the RSC wire format. A 2.5 MB list result briefly becomes 5 MB. This is why `select`/`omit` has outsized impact.

> **2026-03-26 note**: With the measured 80 MB bible study list payload, RSC serialization
> could briefly hold ~160 MB for a single list render. This is likely the primary contributor
> to the 1 GB RSS.

### Prisma Creates Duplicate Relation Objects

`include: { speaker: true }` on 50 messages creates 50 Speaker objects even if 40 share the same speaker. No deduplication. Batch-fetching creates 5 objects instead of 50.

### PostgreSQL TOAST Avoidance

`SELECT id, title FROM message` (without text columns) means PostgreSQL **never reads TOAST tables**. No I/O, no decompression, no buffer pollution. This makes `omit` a 10-50x I/O win on tables with large text columns, not just a memory win.

> **2026-03-26 measured**: BibleStudy heap = 2 MB, TOAST = 22 MB. Message heap = 384 KB,
> TOAST = 96 KB. After the merge, the combined table TOAST will be ~22 MB (all text content),
> but list queries with `omit` will never touch it.

### `unstable_cache()` Holds Data in Memory Permanently

Unlike React `cache()` (per-request only), `unstable_cache()` stores data in Next.js Data Cache with a warm in-memory copy. Never use it for large content (transcripts, bible study text).

### Growing Data Does NOT Grow Idle Memory

BibleVerse (342K rows), Messages (1,176), Bible Studies (1,185) sit in PostgreSQL on disk. Node.js only allocates during requests, bounded by pagination. The 1 GB is runtime footprint + per-request waste, not data volume.

---

## Memory Retention & GC Analysis (added 2026-03-26)

> **Question investigated**: Is the server holding query results in memory across requests
> instead of freeing them? Is there a cache or global store that accumulates data over time?

### Short answer

**No.** The codebase has excellent memory hygiene — no unbounded accumulation, no query result caching, no leaking globals. The 1 GB RSS is NOT from retained data. It's from **per-request over-allocation** (80 MB bible study queries × RSC doubling = ~160 MB transient spike per homepage render) combined with the **permanent runtime footprint** (~40-70 MB Prisma WASM + generated client, ~15-30 MB TipTap, module cache).

V8's garbage collector reclaims the per-request allocations, but GC pressure from repeated 160 MB spikes keeps RSS high because V8 grows the heap to avoid constant collection and is slow to release pages back to the OS.

### What was audited

Every file in `lib/`, `app/api/`, `app/website/`, and `components/website/` was checked for:
- Module-level variables that could accumulate data
- Global object attachments (`globalThis`, `globalForPrisma`)
- In-memory caches (`Map`, `Set`, `WeakMap` at module scope)
- Next.js Data Cache usage (`unstable_cache`, `'use cache'`, `cacheTag`)
- React `cache()` usage
- `fetch()` calls with cache options
- Event listeners / intervals at module level
- Dynamic imports that load heavy modules permanently

### Finding 1: Zero query result caching — every request hits the DB fresh

The app uses **none** of Next.js's caching mechanisms for database queries:

| Caching mechanism | Used? | Impact |
|-------------------|-------|--------|
| `unstable_cache()` | **No** — zero usage in app code | Every Prisma query runs fresh |
| `'use cache'` directive | **No** — not enabled | No server-side result caching |
| `cacheTag()` / `cacheLife()` | **No** | N/A |
| React `cache()` | **No** — recommended in this doc (1d) but not implemented | Detail pages query DB twice (metadata + render) |
| `export const revalidate` (ISR) | **No** — zero website routes have this | Every visitor triggers full DB queries + full RSC render |
| `fetch()` with cache | **No** — only `cache: 'no-store'` used in CMS contexts | N/A for server components |

**This means every single page visit — even for the exact same URL visited 1 second ago — runs the full query pipeline, allocates the full result set in Node.js memory, serializes it through RSC, and discards it.** There is no layer preventing this repetition.

This is the opposite of the "data retained in memory" concern — the problem is that **nothing is cached**, so the server does maximum work (and maximum memory allocation) on every request, then throws it all away.

### Finding 2: The homepage renders 10 sections in parallel, each with its own query

The catch-all page route (`app/website/[[...slug]]/page.tsx:70`) resolves all visible sections via `Promise.all()`. The homepage has **10 sections**, each calling `resolveSectionData()` which fires a separate Prisma query.

During a homepage render, the server simultaneously holds in memory:
- `HIGHLIGHT_CARDS` → `getUpcomingEvents()` result
- `ALL_BIBLE_STUDIES` → `getBibleStudies()` result (**the 80 MB one**)
- `EVENT_CALENDAR` → `getEvents()` result
- `DIRECTORY_LIST` → `getCampuses()` result
- `MEDIA_GRID` → `getVideos()` result
- Plus 5 more section queries

`Promise.all()` means all 10 query results exist simultaneously in memory until all have resolved. Peak memory during homepage render: **80 MB (bible studies) + ~5 MB (other sections) + RSC serialization overhead ≈ 170+ MB transient**.

After the response is sent, V8 GC can reclaim this, but: (a) GC doesn't run instantly — it waits for heap pressure, (b) V8 is reluctant to shrink the heap after a large spike (it assumes similar spikes will recur), (c) concurrent requests compound the issue.

### Finding 3: Module-level memory is small and bounded

| Module-level item | File | Size | Bounded? |
|-------------------|------|------|----------|
| Prisma client singleton | `lib/db/client.ts` | ~40-70 MB (WASM + runtime + pool) | Yes — single instance |
| TipTap extension cache | `lib/tiptap-server.ts` | ~500 bytes (array of extension objects) | Yes — cached once |
| Rate limiter Map | `lib/rate-limit.ts` | Up to 10K entries max | Yes — cap + 5-min cleanup |
| BOOK_PATTERNS array | `lib/dal/sync-message-study.ts` | ~10 KB | Yes — constant |
| ALLOWED_FIELDS Set | `app/api/v1/church/route.ts` | ~500 bytes | Yes — constant |

**Total persistent module-level memory: ~70 MB**, almost entirely the Prisma runtime. No unbounded growth detected.

### Finding 4: Dynamic imports are cached permanently but appropriately

Node.js caches every `await import()` permanently after first execution. The codebase uses lazy imports for:

| Import | File | Loaded when | Size |
|--------|------|-------------|------|
| `mammoth` | `lib/docx-import.ts` | DOCX conversion triggered | ~2-3 MB |
| `jszip` | `lib/docx-import.ts` | DOCX conversion triggered | ~1-2 MB |
| `word-extractor` | `lib/doc-convert.ts` | .doc conversion triggered | ~1 MB |
| `@/lib/permissions` | `lib/auth/config.ts` | First auth check | ~10 KB |
| `@/lib/upload-attachment` | `lib/dal/sync-message-study.ts` | Attachment cleanup | ~5 KB |

These are correctly lazy — they only load when the feature is actually used. Once loaded, they stay in the module cache permanently (no way to evict). For document conversion tools that are rarely used, this is a ~4 MB permanent cost only after first use.

### Finding 5: No server-side React context retention

All React context providers (`MessagesProvider`, `EventsProvider`, `MembersProvider`) are client components (`"use client"`). They hold state in browser memory, not server memory. Server components receive data as props and discard it after rendering.

### Where the 1 GB actually comes from (revised model)

| Component | Size | Type | Can be reduced? |
|-----------|------|------|----------------|
| Prisma WASM compiler + generated client | ~40-70 MB | Permanent | Yes — schema consolidation (Priority 7) |
| TipTap server utilities | ~5-10 MB | Permanent | **Done** — split from full TipTap (was ~15-30 MB) |
| Node.js runtime + Next.js framework | ~80-120 MB | Permanent | No — fixed cost |
| **Per-request: Bible study list query** | **~80 MB per render** | **Transient** | **Yes — `omit` reduces to 152 KB** |
| Per-request: RSC serialization doubling | ~80 MB (mirrors query result) | Transient | Yes — fixed by fixing query size |
| Per-request: Other section queries | ~5-10 MB combined | Transient | Modest improvement with ISR |
| V8 heap headroom (doesn't shrink after spikes) | ~100-200 MB | Semi-permanent | Yes — reducing spike size lets heap shrink |
| Module cache (lazy imports, npm packages) | ~20-40 MB | Permanent | Modest — already lazy-loaded |

**Key insight**: The permanent footprint is ~200-300 MB (Prisma + Next.js + modules). The remaining ~700 MB is V8 heap that was grown to accommodate transient 160+ MB spikes and never released. **Fix the spike (Priority 1a: `omit`), and V8 will maintain a much smaller heap.**

### Recommendations (in order of impact)

**1. Fix the 80 MB query spike (Priority 1a — `omit`)**: This is by far the highest-impact change. Reducing the bible study list query from 80 MB to 152 KB eliminates the primary cause of V8 heap growth. Expected steady-state RSS reduction: **300-500 MB**.

**2. Add ISR to website routes (Priority 2)**: Eliminates per-request DB queries for repeated visits. Homepage renders drop from 170+ MB transient allocation to 0 MB (served from disk cache). Expected additional RSS reduction: **100-200 MB**.

**3. Add React `cache()` to detail pages (Priority 1d)**: Halves DB round-trips on detail views. Small but free.

**4. Do NOT add `unstable_cache()` for large content**: It would hold query results in the Next.js Data Cache with a warm in-memory copy, which is exactly the "server storing data" concern you had. For a CMS where content changes frequently, ISR's filesystem cache (Priority 2) is better — it serves from disk, not memory.

### What NOT to worry about

- **Module-level constants**: The lookup tables, regex patterns, and small Sets total < 50 KB. Not a factor.
- **Rate limiter Map**: Capped at 10K entries with 5-minute cleanup. At most ~1 MB.
- **Prisma connection pool**: 5 connections × ~500 KB each = ~2.5 MB. Negligible.
- **Dynamic import caching**: ~4 MB for rarely-used DOCX tools. Acceptable.
- **React contexts**: Client-side only. Zero server memory.

---

## Config Flags — Honest Assessment

These were initially listed as P0 fixes. After verification, most are ineffective:

**Done:**
- [x] `serverExternalPackages` for TypeScript — added `'typescript'` (~20-30 MB saved) (2026-03-26)
- [x] `images: { unoptimized: true }` — Sharp disabled (~15-25 MB saved) (2026-03-26)
- [x] `--max-old-space-size=512` — already configured

**Still worth doing:**
- [ ] Reduce connection pool 5→3 (4-10 MB permanent savings)
- [ ] Reduce Prisma dev logging (prevents string accumulation in dev)

**Skip (ineffective):**
- [x] ~~`preloadEntriesOnStart: false`~~ — same memory once all pages visited. Skip for fully-used app
- [x] ~~`serverExternalPackages` for Prisma~~ — bundler deduplicates already (verified). Not needed
- [x] ~~`webpackMemoryOptimizations`~~ — dev only, zero production impact. Skip

---

## Measurement Protocol

```bash
# Build production
npm run build

# Start with memory constraint
NODE_OPTIONS='--max-old-space-size=512' npm start &
sleep 5

# Load key pages
curl -s http://localhost:3000/ > /dev/null
curl -s http://localhost:3000/cms/messages > /dev/null
curl -s http://localhost:3000/cms/events > /dev/null
curl -s http://localhost:3000/cms/people/members > /dev/null

# Check memory
ps aux | grep "next-server" | grep -v grep | awk '{printf "RSS: %.1f MB\n", $6/1024}'
```

Run before and after each priority phase to measure actual impact.

---

## Bible Study & Message Content Profile (updated 2026-03-26)

| Item | Records | Avg Size | Total | Status |
|------|---------|----------|-------|--------|
| BibleStudy text fields | 1,185 | ~71 KB | **~82 MB** in PostgreSQL | Moves to Message in merge |
| BibleStudy metadata only | 1,185 | ~200 bytes | ~231 KB | Moves to Message in merge |
| BibleStudyAttachment | ~3,000 | ~200 bytes | ~600 KB | Renamed to MessageAttachment |
| BibleVerse (global) | ~341,000 | ~100 bytes | **~34 MB** in PostgreSQL | Unchanged |
| Message.studySections | **8** | ~25 KB | **~200 KB** | Source data, kept on merged table |
| Message.attachments (JSON) | **8** | ~5 KB | ~40 KB | **DEPRECATED** — use relation table |
| Message.transcriptSegments | **7** (all JSON null) | 0 KB real data | 0 KB | **DEAD — drop in merge** |

> **2026-03-26 correction**: Original estimates assumed ~500 messages had studySections and
> transcriptSegments populated. Actual measurement: only 8 have studySections, only 7 have
> transcriptSegments (all JSON null), only 3 have rawTranscript. The duplication is far
> smaller than estimated. The bigger problem is the 80 MB over-fetch on list queries.

**Total**: ~117 MB in PostgreSQL.
**None of this affects Node.js idle memory** — only loaded during active requests.
**The 80 MB list query over-fetch is the critical issue** — fix with `omit` (Priority 1a).

---

## Related Documents

| Document | Scope |
|----------|-------|
| `/message-biblestudy-current-architecture.md` | Full audit of both tables: every column, every operation, data population, format inconsistencies |
| `/message-biblestudy-proposed-schema.md` | Proposed table merge: schema, migration plan, workflow walkthrough, TOAST analysis, alternative approaches evaluated |
| `/bug-investigation-2026-03-25.md` | Bug #7 (memory) and #8 (transcript) findings that led to this deeper investigation |

---

## Sources

- [Prisma #16184](https://github.com/prisma/prisma/issues/16184) — Schema size spikes memory
- [Prisma #25371](https://github.com/prisma/prisma/issues/25371) — RSS on concurrent queries
- [Next.js #78069](https://github.com/vercel/next.js/issues/78069) — Dev server 10 GB+
- [Next.js #85666](https://github.com/vercel/next.js/issues/85666) — Dev memory leak in async calls
- [Next.js Memory Usage Guide](https://nextjs.org/docs/app/guides/memory-usage)
- [PostgreSQL TOAST Documentation](https://www.postgresql.org/docs/current/storage-toast.html)
- [PostgreSQL LZ4 TOAST Compression](https://www.postgresql.fastware.com/blog/what-is-the-new-lz4-toast-compression-in-postgresql-14)
- [Prisma Query Optimization](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance)
- [Prisma `omit` Documentation](https://www.prisma.io/docs/orm/prisma-client/queries/excluding-fields) — GA since 6.2.0
- [pganalyze — TOAST Performance Analysis](https://pganalyze.com/blog/5mins-postgres-TOAST-performance)
- [Drizzle vs Prisma Comparison](https://betterstack.com/community/guides/scaling-nodejs/drizzle-vs-prisma/)
- [Payload CMS Architecture](https://payloadcms.com/posts/blog/relational-database-table-structure-rfc)
- [Ghost Database Structure](https://medium.com/@danieldng/understanding-ghost-database-5b885f241f0c)
