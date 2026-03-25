# Database & Server Memory Audit

> **Date**: 2026-03-25 (11-agent investigation)
> **Prisma**: v7.4.1 with `@prisma/adapter-pg` + `pg` driver
> **Next.js**: 16.1.6 (App Router, React 19.2.3)
> **Schema**: 45 models, 27 enums, 1,754 lines
> **Observed memory**: ~1,000 MB in **production** (`next start`)
> **Target memory**: <300 MB production

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

### 1a. Use `select` Instead of `include` in All List Queries

**Current problem**: `getBibleStudies()` loads full records including `questions` (7 KB), `answers` (15 KB), `transcript` (80 KB) per study. It then only uses 7 metadata fields. For 50 studies → **~5 MB loaded and immediately discarded**.

Same for messages: list API returns 50 messages with transcripts (50 KB each) = **2.5 MB per request** the UI never displays.

**Fix**: Create `bibleStudyListSelect` and `messageListSelect`:

```typescript
const bibleStudyListSelect = {
  id: true, slug: true, title: true, passage: true, book: true,
  dateFor: true, hasQuestions: true, hasAnswers: true, hasTranscript: true,
  speaker: { select: { id: true, firstName: true, lastName: true } },
  series: { select: { id: true, name: true } },
  // EXCLUDED: questions, answers, transcript, bibleText, keyVerseText
}

const messageListSelect = {
  id: true, slug: true, title: true, videoTitle: true,
  passage: true, dateFor: true, hasVideo: true, hasStudy: true,
  youtubeId: true, thumbnailUrl: true, duration: true,
  speaker: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
  messageSeries: { select: { series: { select: { id: true, name: true, slug: true } } } },
  // EXCLUDED: rawTranscript, liveTranscript, transcriptSegments, studySections, attachments
}
```

**Why it matters beyond Node.js**: PostgreSQL stores large Text/JsonB fields in a separate TOAST table. When you `SELECT id, title` without text columns, PostgreSQL **never reads TOAST** — no I/O, no decompression, no buffer pool pollution. This is the single biggest hidden win.

**Savings**: ~5-7.5 MB per list request (permanent, on every request)
**Effort**: LOW — change `include` to `select` in DAL functions
**Files**: `lib/dal/messages.ts`, `lib/dal/bible-studies.ts`, `lib/website/resolve-section-data.ts`
**Side effects**: Detail views must explicitly select heavy fields. Test both list and detail views.

### 1b. Prisma `omit` as a Safety Net

Even after converting lists to `select`, add `omit` to the PrismaClient config to prevent accidental over-fetching anywhere else:

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

**Savings**: Prevents regressions. Any new query that forgets to use `select` still won't load heavy fields.
**Effort**: LOW — one config change
**Files**: `lib/db/client.ts`
**Side effects**: Detail views must opt-in to heavy fields via `select: { rawTranscript: true }`. Verify all detail pages still work.

### 1c. Add `take` Limits to All Nested 1:Many Includes

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

### 1d. Deduplicate Detail Page Queries with React `cache()`

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

## Priority 2: ISR for Website Routes

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

## Priority 3: Eliminate Data Duplication

### 3a. Remove Message ↔ BibleStudy Content Duplication

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

~30 KB duplication per message. With ~500 messages → **~15 MB of pure duplicate data** that's loaded, transferred, and discarded on queries.

**Fix**: Stop populating `Message.studySections` and `Message.attachments`. Read study content exclusively from BibleStudy via `relatedStudyId`. The website already falls back to `relatedStudy.transcript`.

**Savings**: 15 MB storage + ~30 KB less per message query (permanent)
**Effort**: MEDIUM — update sync function, API handlers, website pages
**Files**: `lib/dal/sync-message-study.ts`, `lib/dal/messages.ts`, `app/api/v1/messages/route.ts`, `app/website/messages/[slug]/page.tsx`

### 3b. Remove Dead `transcriptSegments` Field

`Message.transcriptSegments` (JsonB, ~5 KB per record) is loaded on every query but **never rendered anywhere** in the app. Zero rendering usage in the entire codebase.

**Savings**: 2.5 MB storage + ~5 KB less per message query (permanent)
**Effort**: LOW — migration to drop column
**Files**: `prisma/schema.prisma`, migration

### 3c. Remove Duplicate Fields Between Church and SiteSettings

9 fields are duplicated across both models (social URLs, contact info, logo/favicon). After any consolidation, one source of truth should remain.

**Savings**: Modest (avoids loading duplicate data in layout queries)
**Effort**: LOW-MEDIUM depending on which model becomes canonical

---

## Priority 4: Pre-Render HTML at CMS Save Time

Currently, TipTap JSON is stored in the database and converted to HTML **on every page render** server-side. TipTap imports ~10-20 MB of dependencies that stay permanently loaded.

**Fix**: When the CMS user saves, convert TipTap JSON → HTML immediately. Store **both** in the database. The website reads pre-rendered HTML (a simple string). TipTap is never imported on website routes.

**Savings**: 15-30 MB of permanently loaded TipTap modules removed from production
**Effort**: MEDIUM — add HTML column or store alongside JSON, update save handlers
**Files**: TipTap editor components, bible study/message API routes, website detail pages
**Side effects**: Need to re-render stored HTML if TipTap schema changes. CMS admin still loads TipTap for editing.

---

## Priority 5: DAL Query Refactoring (People & Roles)

### 5a. Fix Cartesian Explosion in People Queries

`getPeople()` has 2-level nested includes (householdMemberships.household + roleAssignments.role) with a 7-condition OR search filter. `getPeopleByRole()` loads 500 people × 5 roles each = 2500 role records.

**Fix**: Use `select` with minimal fields. Split role search into separate query. Paginate assignments.

**Savings**: 20-100 MB at peak (permanent — every people page load)
**Effort**: MEDIUM
**Files**: `lib/dal/people.ts`, `lib/dal/person-roles.ts`

### 5b. Batch-Fetch Speakers Instead of Per-Message Include

When `include: { speaker: true }` loads 50 messages, Prisma creates **50 separate Speaker objects** even if 40 share the same speaker. No deduplication.

**Fix**: Fetch messages without speaker. Extract unique `speakerId` values. Batch-fetch speakers. Join in app code. Creates 5 objects instead of 50.

**Savings**: 1-3 MB per list render (permanent)
**Effort**: MEDIUM
**Files**: `lib/dal/messages.ts`

---

## Priority 6: PostgreSQL Tuning (Free Performance)

### 6a. Partial Indexes on `deletedAt IS NULL`

Almost every query filters `deletedAt: null`, but indexes include deleted rows. Partial indexes only index live rows — smaller indexes, faster lookups, no code change.

```sql
CREATE INDEX idx_message_active ON "Message" ("churchId", "dateFor" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX idx_bible_study_active ON "BibleStudy" ("churchId", "dateFor" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX idx_event_active ON "Event" ("churchId", "dateStart" DESC) WHERE "deletedAt" IS NULL;
```

Note: Added via raw SQL migration (Prisma doesn't support partial indexes natively).

### 6b. LZ4 Compression for TOAST Columns

Decompresses 3-5x faster than default pglz. Speeds up detail page loads.

```sql
ALTER TABLE "Message" ALTER COLUMN "rawTranscript" SET COMPRESSION lz4;
ALTER TABLE "BibleStudy" ALTER COLUMN "transcript" SET COMPRESSION lz4;
ALTER TABLE "BibleStudy" ALTER COLUMN "questions" SET COMPRESSION lz4;
ALTER TABLE "BibleStudy" ALTER COLUMN "answers" SET COMPRESSION lz4;
```

### 6c. Keep PageSection.content Inline (No TOAST)

`PageSection.content` is usually small (<2 KB) but read on every page load. `STORAGE MAIN` avoids TOAST table lookups:

```sql
ALTER TABLE "PageSection" ALTER COLUMN "content" SET STORAGE MAIN;
```

### 6d. Drop 12 Redundant Indexes

| Model | Drop | Reason |
|-------|------|--------|
| Event | `[churchId, status]` | Covered by `[churchId, status, dateStart]` |
| Event | `[churchId, isFeatured]` | Boolean — too low cardinality |
| Event | `[churchId, isPinned]` | Boolean — too low cardinality |
| Event | `[churchId, isRecurring]` | Boolean — too low cardinality |
| Event | `[churchId, campusId]` | Rarely filtered alone |
| Message | `[churchId, hasVideo]` | Boolean — too low cardinality |
| Message | `[churchId, hasStudy]` | Boolean — too low cardinality |
| BibleStudy | `[churchId, status]` | Small table, seq scan faster |
| Page | `[churchId, isPublished]` | Boolean, <100 pages |
| Page | `[churchId, isHomepage]` | Only 1 true per church |
| Session | `[token]` | Redundant — `@unique` already creates index |
| Church | `[slug]` | Redundant — `@unique` already creates index |

**Effort**: LOW — migration to drop indexes
**Savings**: Faster writes, less PostgreSQL memory for index pages

---

## Priority 7: Schema Consolidation (45 → 37 Models)

### Models to Remove/Merge

| Change | Models Saved | Effort | Side Effects |
|--------|-------------|--------|-------------|
| Remove Tag (unused, zero references) | 1 | LOW | None |
| EventLink → Event.links JSON | 1 | LOW | Update events DAL + UI |
| BibleStudyAttachment → BibleStudy.attachments JSON | 1 | MEDIUM | Update bible study DAL |
| MediaFolder → Remove (MediaAsset.folder is sufficient) | 1 | LOW | Update media DAL |
| CommunicationPreference → Person.commPrefs JSON | 1 | LOW | Update person DAL |
| SiteSettings → Church.siteSettings JSON | 1 | HIGH | Major — rewrite DAL, theme, admin |
| ThemeCustomization → Church.themeConfig JSON | 1 | HIGH | Major — rewrite theme system |
| BuilderPresence → Redis/in-memory | 1 | MEDIUM | Architecture change |

**Conservative (LOW risk)**: Remove Tag, EventLink, MediaFolder, CommunicationPreference = **4 models** (45 → 41)
**Aggressive (MEDIUM risk)**: Also BibleStudyAttachment, SiteSettings, ThemeCustomization, BuilderPresence = **8 models** (45 → 37)

### Column Consolidation (370 → ~242 Columns)

| Model | Columns to Consolidate | Into | Saves |
|-------|----------------------|------|-------|
| Event recurrence | 8 cols | `recurrenceRule Json?` | 7 cols, 2 enums |
| Event registration | 7 cols | `registration Json?` | 6 cols |
| Event location | 8 cols | `locationData Json?` | 7 cols, 1 enum |
| Person phones | 3 cols | `phones Json?` | 2 cols |
| Person address duplication | 4 cols (city/state/zip/country already in address JSON) | Remove | 4 cols |
| MenuItem featured | 4 cols | `featured Json?` | 3 cols |
| Church social URLs | 5 cols (duplicated in SiteSettings) | Remove | 5 cols |

### Enum Reduction (27 → 9)

**Keep (9)**: ChurchStatus, PlanTier, MemberRole, SubStatus, ContentStatus, EventType, BibleBook, SectionType, MembershipStatus

**Remove (3)**: Recurrence, RecurrenceEndType, LocationType (absorbed into JSON)

**Convert to String (15)**: AttachmentType, AnnouncePriority, NoteType, HouseholdRole, CommunicationChannel, CustomFieldType, VideoCategory, MaritalStatus, Gender, MenuLocation, PageType, PageLayout, DomainStatus, SslStatus, AccessRequestStatus

### Net Result

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Models | 45 | 37 | -8 |
| Enums | 27 | 9 | -18 |
| Columns | ~370 | ~242 | -128 |
| Indexes | ~65 | ~53 | -12 |
| Generated client | 4.7 MB | ~3.0 MB | -36% |
| Prisma memory | 40-70 MB | 25-50 MB | -15-20 MB |

---

## Priority 8: Architecture Options (Long-Term)

### Option A: Split CMS + Website into Two Processes

- **Process 1**: CMS admin (Next.js + Prisma, ~500 MB)
- **Process 2**: Website (lightweight Next.js, ISR-only, 150-200 MB)

### Option B: Drizzle for Website Read Paths

Keep Prisma for CMS writes. Use Drizzle (6x lighter, ~5-15 MB vs 40-70 MB) for website queries. Effort: 2-3 weeks.

### Option C: Prisma Accelerate

Offload query engine to Prisma's cloud. Server keeps thin HTTP client (~2-3 MB). Paid per-query.

---

## Non-Obvious Technical Details

### RSC Serialization Doubles Data in Memory

When React Server Components render, query results exist **twice** simultaneously — the Prisma objects AND the RSC wire format. A 2.5 MB list result briefly becomes 5 MB. This is why `select` has outsized impact.

### Prisma Creates Duplicate Relation Objects

`include: { speaker: true }` on 50 messages creates 50 Speaker objects even if 40 share the same speaker. No deduplication. Batch-fetching creates 5 objects instead of 50.

### PostgreSQL TOAST Avoidance

`SELECT id, title FROM message` (without text columns) means PostgreSQL **never reads TOAST tables**. No I/O, no decompression, no buffer pollution. This makes `select` a 10-50x I/O win on tables with large text columns, not just a memory win.

### `unstable_cache()` Holds Data in Memory Permanently

Unlike React `cache()` (per-request only), `unstable_cache()` stores data in Next.js Data Cache with a warm in-memory copy. Never use it for large content (transcripts, bible study text).

### Growing Data Does NOT Grow Idle Memory

BibleVerse (342K rows), Messages (500+), Bible Studies (1170+) sit in PostgreSQL on disk. Node.js only allocates during requests, bounded by pagination. The 1 GB is runtime footprint + per-request waste, not data volume.

---

## Config Flags — Honest Assessment

These were initially listed as P0 fixes. After verification, most are ineffective:

| Flag | Permanent? | Verdict |
|------|-----------|---------|
| `preloadEntriesOnStart: false` | NO — same memory once all pages visited | Skip for fully-used app |
| `serverExternalPackages` for Prisma | Already handled — bundler deduplicates (verified) | Not needed |
| `webpackMemoryOptimizations` | Dev only — zero production impact | Skip |
| `--max-old-space-size=512` | Diagnostic — forces GC or crashes | Already configured |
| Reduce connection pool 5→3 | YES — 4-10 MB permanent | Worth doing |
| Reduce Prisma dev logging | YES — prevents string accumulation in dev | Worth doing |

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

## Bible Study & Message Content Profile

| Item | Records | Avg Size | Total |
|------|---------|----------|-------|
| BibleStudy text fields | ~1,170 | ~102 KB | **~119 MB** in PostgreSQL |
| BibleStudy metadata only | ~1,170 | ~500 bytes | ~600 KB |
| BibleStudyAttachment | ~3,000 | ~200 bytes | ~600 KB |
| BibleVerse (global) | ~341,000 | ~100 bytes | **~34 MB** in PostgreSQL |
| Message.studySections (DUPLICATE) | ~500 | ~25 KB | **~12.5 MB** |
| Message.attachments (DUPLICATE) | ~500 | ~5 KB | ~2.5 MB |
| Message.transcriptSegments (DEAD) | ~500 | ~5 KB | ~2.5 MB |

**Total**: ~171 MB in PostgreSQL, of which **~17.5 MB is duplicate/dead**.
**None of this affects Node.js idle memory** — only loaded during active requests.

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
- [Drizzle vs Prisma Comparison](https://betterstack.com/community/guides/scaling-nodejs/drizzle-vs-prisma/)
- [Payload CMS Architecture](https://payloadcms.com/posts/blog/relational-database-table-structure-rfc)
- [Ghost Database Structure](https://medium.com/@danieldng/understanding-ghost-database-5b885f241f0c)
