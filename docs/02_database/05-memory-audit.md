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

### 1a. Use `omit` in All List Queries — **[DO NOW]**

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

### 1b. Global `omit` on PrismaClient as Safety Net — **[DO NOW]**

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

### 1c. Add `take` Limits to All Nested 1:Many Includes — **[DO NOW]**

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

### 1d. Deduplicate Detail Page Queries with React `cache()` — **[DO NOW]**

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

> **2026-03-26 correction**: The original estimates were based on ~500 messages. Actual data:
> 1,176 messages, but only 8 have `studySections` populated and only 3 have `rawTranscript`.
> The duplication is real but smaller than estimated because 99.3% of study content was
> migrated directly to BibleStudy and never round-tripped through Message.studySections.
> The bigger issue is the 448-line sync layer and the format inconsistency (99% TipTap JSON
> vs 1% HTML in BibleStudy columns). Both are resolved by the table merge.

### 3b. Remove Dead `transcriptSegments` Field

`Message.transcriptSegments` (JsonB) — **confirmed dead** as of 2026-03-26: 7 entries in the database, all containing JSON `null` (not SQL NULL). Zero code references in sync, rendering, or any active code path.

> **Resolved by merge**: Column is dropped in the merge migration. If implementing before the
> merge, this is safe to drop independently.

### 3c. Remove Duplicate Fields Between Church and SiteSettings — **[DO NOW]**

9 fields are duplicated across both models (social URLs, contact info, logo/favicon). After any consolidation, one source of truth should remain. Independent of the table merge.

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
- `lib/tiptap-server.ts` created with lightweight server-only utilities (no editor plugins)
- `app/website/bible-study/[slug]/page.tsx` → imports from `tiptap-server`
- `app/website/events/[slug]/page.tsx` → imports from `tiptap-server`
- `app/website/messages/[slug]/page.tsx` → imports from `tiptap-server`
- Sharp disabled (`images: { unoptimized: true }` in `next.config.ts`)
- TypeScript excluded from bundle (`serverExternalPackages: ['typescript']`)

**Savings achieved**: ~50-85 MB reduction in server bundle size

**Remaining (deferred to merge)**: One-time conversion of 1,150+ TipTap JSON entries in BibleStudy columns to HTML, eliminating per-request parsing.

---

## Priority 5: DAL Query Refactoring (People & Roles) — **[DO NOW]**

Independent of the Message/BibleStudy work. Still valid.

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

## Priority 6: PostgreSQL Tuning (Free Performance) — **[PARTIALLY OUTDATED]**

### 6a. Partial Indexes on `deletedAt IS NULL` — **[DO NOW]**

Almost every query filters `deletedAt: null`, but indexes include deleted rows. Partial indexes only index live rows — smaller indexes, faster lookups, no code change.

```sql
CREATE INDEX idx_message_active ON "Message" ("churchId", "dateFor" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX idx_event_active ON "Event" ("churchId", "dateStart" DESC) WHERE "deletedAt" IS NULL;
```

> **2026-03-26 update**: The `idx_bible_study_active` index is no longer needed if the table
> merge proceeds — the BibleStudy table will be dropped. If implementing before the merge,
> it's still valid but short-lived.

Note: Added via raw SQL migration (Prisma doesn't support partial indexes natively).

### 6b. LZ4 Compression for TOAST Columns — **[DO NOW]**

Decompresses 3-5x faster than default pglz. Speeds up detail page loads.

```sql
ALTER TABLE "Message" ALTER COLUMN "rawTranscript" SET COMPRESSION lz4;
ALTER TABLE "Message" ALTER COLUMN "liveTranscript" SET COMPRESSION lz4;
```

> **2026-03-26 update**: After the table merge, also apply to the new text columns on Message:
> ```sql
> ALTER TABLE "Message" ALTER COLUMN "questions" SET COMPRESSION lz4;
> ALTER TABLE "Message" ALTER COLUMN "answers" SET COMPRESSION lz4;
> ALTER TABLE "Message" ALTER COLUMN "transcript" SET COMPRESSION lz4;
> ALTER TABLE "Message" ALTER COLUMN "bibleText" SET COMPRESSION lz4;
> ```
> The BibleStudy-specific ALTER statements are no longer needed since that table will be dropped.

### 6c. Keep PageSection.content Inline (No TOAST) — **[DO NOW]**

`PageSection.content` is usually small (<2 KB) but read on every page load. `STORAGE MAIN` avoids TOAST table lookups:

```sql
ALTER TABLE "PageSection" ALTER COLUMN "content" SET STORAGE MAIN;
```

### 6d. Drop Redundant Indexes — **[PARTIALLY OUTDATED]**

> **2026-03-26 update**: Several items in this list have changed:
> - `[churchId, isFeatured]` on Event: Manual featuring was removed (committed 2026-03-26).
>   The `isFeatured` column is still in the schema but unused — **drop the column AND the
>   index** in the next schema migration.
> - `[churchId, hasVideo]` and `[churchId, hasStudy]` on Message: The original audit
>   recommended dropping these as "too low cardinality." **This is REVERSED** — after the
>   table merge, these become the primary filters for partitioning content by type
>   (`WHERE hasStudy=true` replaces `FROM BibleStudy`). **Keep these indexes.**
> - `[churchId, status]` on BibleStudy: **Dropped with the table** during the merge.

| Model | Drop | Reason |
|-------|------|--------|
| Event | `[churchId, status]` | Covered by `[churchId, status, dateStart]` |
| Event | `[churchId, isFeatured]` | **Column is now unused** — drop column and index together |
| Event | `[churchId, isPinned]` | Boolean — too low cardinality |
| Event | `[churchId, isRecurring]` | Boolean — too low cardinality |
| Event | `[churchId, campusId]` | Rarely filtered alone |
| ~~Message~~ | ~~`[churchId, hasVideo]`~~ | ~~Boolean — too low cardinality~~ **KEEP — needed after merge** |
| ~~Message~~ | ~~`[churchId, hasStudy]`~~ | ~~Boolean — too low cardinality~~ **KEEP — needed after merge** |
| ~~BibleStudy~~ | ~~`[churchId, status]`~~ | ~~Small table, seq scan faster~~ **Dropped with table in merge** |
| Page | `[churchId, isPublished]` | Boolean, <100 pages |
| Page | `[churchId, isHomepage]` | Only 1 true per church |
| Session | `[token]` | Redundant — `@unique` already creates index |
| Church | `[slug]` | Redundant — `@unique` already creates index |

**Effort**: LOW — migration to drop indexes
**Savings**: Faster writes, less PostgreSQL memory for index pages

---

## Priority 7: Schema Consolidation (45 → 37 Models) — **[PARTIALLY OUTDATED]**

> **2026-03-26 update**: The table merge changes the model count calculation. BibleStudy and
> MessageSeries are dropped (2 models). BibleStudyAttachment is renamed to MessageAttachment
> (0 net change — it stays as a relation table, NOT inlined as JSON, because attachments need
> individual R2 file lifecycle management). See `/message-biblestudy-proposed-schema.md`.

### Models to Remove/Merge

| Change | Models Saved | Effort | Side Effects | Status |
|--------|-------------|--------|-------------|--------|
| **BibleStudy → merged into Message** | 1 | HIGH | See merge plan | **[SUPERSEDED BY MERGE]** |
| **MessageSeries → direct FK on Message** | 1 | MEDIUM | Part of merge | **[SUPERSEDED BY MERGE]** |
| Remove Tag (unused, zero references) | 1 | LOW | None | Still valid |
| EventLink → Event.links JSON | 1 | LOW | Update events DAL + UI | Still valid |
| ~~BibleStudyAttachment → BibleStudy.attachments JSON~~ | ~~1~~ | — | — | **REVERSED — keep as relation table (renamed MessageAttachment). R2 lifecycle management requires individual records.** |
| MediaFolder → Remove (MediaAsset.folder is sufficient) | 1 | LOW | Update media DAL | Still valid |
| CommunicationPreference → Person.commPrefs JSON | 1 | LOW | Update person DAL | Still valid |
| SiteSettings → Church.siteSettings JSON | 1 | HIGH | Major — rewrite DAL, theme, admin | Still valid |
| ThemeCustomization → Church.themeConfig JSON | 1 | HIGH | Major — rewrite theme system | Still valid |
| BuilderPresence → Redis/in-memory | 1 | MEDIUM | Architecture change | Still valid |

**Conservative (with merge)**: Merge tables + Remove Tag, EventLink, MediaFolder, CommunicationPreference = **6 models** (45 → 39)
**Aggressive (with merge)**: Also SiteSettings, ThemeCustomization, BuilderPresence = **9 models** (45 → 36)

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
| **Message/BibleStudy merge** | **9 duplicated cols + 5 dead/deprecated cols** | **Single table** | **14 cols** |

> **2026-03-26 addition**: The table merge removes: `Message.transcriptSegments` (dead),
> `Message.attachments` JSON (deprecated), `Message.relatedStudyId` (no longer needed),
> `BibleStudy.datePosted` (always = dateFor), `BibleStudy.status` (replaced by hasStudy + deletedAt),
> plus 9 duplicated metadata columns. Net: 14 fewer columns.

### Enum Reduction (27 → 9)

**Keep (9)**: ChurchStatus, PlanTier, MemberRole, SubStatus, ContentStatus, EventType, BibleBook, SectionType, MembershipStatus

**Remove (3)**: Recurrence, RecurrenceEndType, LocationType (absorbed into JSON)

**Convert to String (15)**: AttachmentType, AnnouncePriority, NoteType, HouseholdRole, CommunicationChannel, CustomFieldType, VideoCategory, MaritalStatus, Gender, MenuLocation, PageType, PageLayout, DomainStatus, SslStatus, AccessRequestStatus

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

- **Process 1**: CMS admin (Next.js + Prisma, ~500 MB)
- **Process 2**: Website (lightweight Next.js, ISR-only, 150-200 MB)

### Option B: Drizzle for Website Read Paths

Keep Prisma for CMS writes. Use Drizzle (6x lighter, ~5-15 MB vs 40-70 MB) for website queries. Effort: 2-3 weeks.

### Option C: Prisma Accelerate

Offload query engine to Prisma's cloud. Server keeps thin HTTP client (~2-3 MB). Paid per-query.

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

## Config Flags — Honest Assessment

These were initially listed as P0 fixes. After verification, most are ineffective:

| Flag | Permanent? | Verdict |
|------|-----------|---------|
| `preloadEntriesOnStart: false` | NO — same memory once all pages visited | Skip for fully-used app |
| `serverExternalPackages` for Prisma | Already handled — bundler deduplicates (verified) | Not needed |
| `serverExternalPackages` for TypeScript | **DONE (2026-03-26)** — added `'typescript'` | ~20-30 MB saved |
| `webpackMemoryOptimizations` | Dev only — zero production impact | Skip |
| `--max-old-space-size=512` | Diagnostic — forces GC or crashes | Already configured |
| `images: { unoptimized: true }` | **DONE (2026-03-26)** — Sharp disabled | ~15-25 MB saved |
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
