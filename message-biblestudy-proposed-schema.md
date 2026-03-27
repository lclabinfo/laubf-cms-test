# Message & BibleStudy — Proposed Schema Redesign

**Date:** 2026-03-26
**Companion doc:** `message-biblestudy-current-architecture.md` (current state audit)
**Goal:** Merge Message and BibleStudy into a single table. Eliminate the sync layer. Fix the transcript pipeline. Optimize query performance.

---

## Table of Contents

1. [The Problem in Plain English](#1-the-problem-in-plain-english)
2. [Alternative Approaches Considered](#2-alternative-approaches-considered)
3. [Decision: Why Single Table Wins](#3-decision-why-single-table-wins)
4. [What Every Workflow Looks Like After the Merge](#4-what-every-workflow-looks-like-after-the-merge)
5. [Decision: Why Merge (The Numbers)](#5-decision-why-merge)
6. [Proposed Schema](#6-proposed-schema)
7. [Column Decisions](#7-column-decisions)
8. [Indexes](#8-indexes)
9. [Relations](#9-relations)
10. [Query Patterns After Merge](#10-query-patterns-after-merge)
11. [Write Path After Merge](#11-write-path-after-merge)
12. [PostgreSQL TOAST Behavior](#12-postgresql-toast-behavior)
13. [What Gets Deleted](#13-what-gets-deleted)
14. [Migration Plan](#14-migration-plan)
15. [API Surface Changes](#15-api-surface-changes)
16. [Website Route Changes](#16-website-route-changes)
17. [Risk Assessment](#17-risk-assessment)
18. [Sources](#18-sources)

---

## 1. The Problem in Plain English

Today, each "message entry" in the CMS is split across two database tables:

- **Message** holds the video stuff (YouTube ID, Vimeo URL, thumbnail, duration) plus the raw CMS editing data (TipTap JSON for study sections and transcripts).
- **BibleStudy** holds a *copy* of the study content (questions, answers, transcript — converted to HTML) plus *duplicated* metadata (same title, date, passage, speaker, series, all copied from Message).

Every time you save in the CMS, a 448-line sync function reads from Message, converts TipTap JSON to HTML, and writes to BibleStudy. The public website then reads from BibleStudy for bible study pages and from Message for video pages.

### Why this is a problem

1. **It's wasteful.** 9 columns are duplicated. A 448-line function exists just to keep the copy in sync.
2. **It's fragile.** The sync can fail halfway through, leaving the two tables out of sync. The transcript bug (#8) happened exactly because of this — rawTranscript was saved to Message but never synced to BibleStudy.
3. **It's slow.** The bible study list page currently fetches **80 MB** from PostgreSQL per request — because the query grabs all text columns (questions averages 56KB, transcript averages 42KB per row) even though the list only needs titles, dates, and boolean flags (~152 KB total). This is the real cause of the memory issues from Bug #7.

### What is this document about

This document proposes merging the two tables into one, evaluates alternative approaches, and explains how every workflow changes.

---

## 2. Alternative Approaches Considered

We evaluated three architectures before settling on the recommendation.

### Option A: Single Merged Table (recommended)

Merge everything into one Message table. Each row can have video content, study content, or both. Use Prisma `omit` to exclude heavy text columns from list queries.

### Option B: Parent + Video + Study (3 tables)

This was the initial intuition — separate tables for different "content types" with a shared parent for metadata:

```
MessageEntry (parent — lightweight metadata only)
  ├── id, slug, title, passage, dateFor, speaker, series, book
  ├── hasVideo, hasStudy, hasQuestions, hasAnswers, hasTranscript
  └── flags, timestamps, soft delete

VideoContent (child — video-specific, ~227 rows)
  ├── messageEntryId (FK)
  ├── videoUrl, youtubeId, thumbnailUrl, duration, audioUrl
  ├── rawTranscript, liveTranscript
  └── videoTitle, videoDescription

StudyContent (child — study-specific, ~1,160 rows)
  ├── messageEntryId (FK)
  ├── studySections (TipTap JSON source)
  ├── questions, answers, transcript, bibleText (HTML rendered)
  └── keyVerseRef, keyVerseText
```

**Where Option B wins:**
- Parent table is guaranteed tiny (zero TOAST overhead, not even pointers)
- Clear domain separation — video vs study concerns are physically separated
- Could add new content types (podcast, devotional) as new child tables

**Where Option B loses:**
- Every detail page needs 2-3 JOINs (parent + video + study + attachments). Prisma doesn't do SQL JOINs — it fires separate queries for each `include`, so detail views become 3-4 round trips instead of 1.
- Writes are MORE complex: 3 UPSERT queries in a transaction instead of 1 UPDATE.
- The "tiny parent table" advantage is illusory — see the TOAST analysis below.
- Prisma's type system doesn't natively model polymorphic children well. You'd need manual discriminated unions.

### Option C: Keep Two Tables, Just Fix the Queries

Add `omit` to the current `getBibleStudies()` to stop fetching text columns on list views. Don't restructure anything.

**Where Option C wins:**
- Zero migration risk. Minimal code changes.
- Fixes the 80 MB list query immediately.

**Where Option C loses:**
- The 448-line sync function stays. Every new feature touching study content must understand the two-table sync flow.
- 9 duplicated columns stay. Data can drift out of sync.
- The transcript format inconsistency stays (99% TipTap JSON, 1% HTML in BibleStudy).
- The `contentToHtml()` per-request parsing of 40-80KB TipTap JSON stays for 99% of entries.
- Future developers must always ask: "Do I read from Message or BibleStudy?"

---

## 3. Decision: Why Single Table Wins

### The TOAST argument (key technical insight)

The main concern with merging is: "Won't putting 40-80KB text columns on the same table as lightweight metadata make list queries slow?"

**No.** PostgreSQL uses TOAST (The Oversized-Attribute Storage Technique) to handle large values. Here's what actually happens:

1. Text columns over ~2KB are automatically compressed and moved to a **separate TOAST table** — physically separate storage, like a child table that PostgreSQL manages for you.
2. When a query does NOT select a TOASTed column, PostgreSQL **never reads the TOAST table**. It only reads the main heap, which contains small inline values plus ~18-byte TOAST pointers.
3. Prisma's `omit` generates a column-explicit `SELECT col1, col2, col3...` — PostgreSQL knows exactly which columns are needed and skips TOAST entirely.

This means:

| Approach | List query: what PostgreSQL reads | Detail query |
|----------|----------------------------------|-------------|
| **Option A (merged + omit)** | Main heap only (~200 bytes/row + 108 bytes of TOAST pointers = ~308 bytes/row). **Total for 1,185 rows: ~356 KB** | 1 query, 1 row, TOAST fetches text lazily |
| **Option B (parent + children)** | Parent table only (~200 bytes/row, zero TOAST). **Total for 1,185 rows: ~231 KB** | 1 query + 2-3 JOINs (Prisma fires separate queries) |
| **Current (broken)** | Main heap + ALL TOAST data. **Total: ~80 MB** | 2 queries (Message + BibleStudy) |

The difference between Option A and Option B on list queries is **~125 KB** (the TOAST pointers). That's negligible. But Option A saves 2-3 extra queries on every detail view.

### Performance comparison summary

| Metric | Current (broken) | Option A (merged) | Option B (3 tables) | Option C (fix queries) |
|--------|-------------------|-------------------|---------------------|----------------------|
| List query data from DB | 80 MB | 356 KB | 231 KB | 356 KB |
| Detail view queries | 2 | 1 | 3-4 | 2 |
| Write queries per save | 2-4 (Message + sync + BibleStudy + attachments) | 1 + attachments | 3 + attachments | 2-4 (unchanged) |
| Sync code lines | 448 | 0 | 0 | 448 |
| Duplicated columns | 9 | 0 | 0 | 9 |
| Migration effort | — | Medium | High | None |

### The bottom line

Option A gives 99.5% of Option B's list query performance, better detail view performance, simpler writes, and dramatically less code — with a medium-effort migration instead of a high-effort one.

---

## 4. What Every Workflow Looks Like After the Merge

### Creating a new message in the CMS

1. Admin opens `/cms/messages/new`
2. Fills out **Details tab**: title, date, speaker, passage, series, bible version
3. Fills out **Video tab**: video URL, transcript in TipTap editor
4. Fills out **Study tab**: study sections (questions, answers, transcript) in TipTap editors, file attachments
5. Hits **Save**

**What happens:**
- Single `POST /api/v1/messages` API call
- Server receives all form data
- **Inline content processing** (no separate sync step):
  - Parses `studySections` → extracts questions/answers/transcript sections by title
  - Converts each from TipTap JSON → HTML
  - If no transcript section but `rawTranscript` exists → converts that to HTML
  - Parses `passage` → derives `book` enum (e.g., "John 3:16" → `JOHN`)
  - Fetches Bible text from API → stores HTML
  - Sets `hasQuestions`, `hasAnswers`, `hasTranscript` flags
- Single `prisma.message.create()` — one row, all data
- Attachment upserts if files were added
- **Done.** No sync function. No second table. No slug deduplication for a copy.

### Editing an existing message

1. Admin opens `/cms/messages/gods-covenant/edit`
2. CMS fetches the Message row (one query)
3. TipTap editors load from `studySections` (TipTap JSON — the editing format)
4. Admin makes changes, hits **Save**

**What happens:**
- Single `PATCH /api/v1/messages/gods-covenant` API call
- Same inline content processing as above
- Single `prisma.message.update()` — same row, all data
- **No sync needed.** The rendered HTML columns are updated in the same write.

### Visitor browses `/bible-study` (list page)

1. Server calls `getMessages(churchId, { hasStudy: true })`
2. Query uses `omit` to exclude all text columns
3. PostgreSQL reads main heap only — **152 KB** instead of 80 MB
4. Page renders cards with: title, passage, date, series, hasQuestions/hasAnswers/hasTranscript icons
5. Client-side pagination fetches additional pages via API

**No change to the user experience.** Same page, same cards, same filters. 500x less data from the database.

### Visitor opens `/bible-study/gods-covenant` (study detail)

1. Server calls `getMessageBySlug(churchId, 'gods-covenant')` — one query
2. PostgreSQL fetches the one row including text columns from TOAST
3. `questions`, `answers`, `transcript` are already HTML — rendered directly via `dangerouslySetInnerHTML`
4. **No `contentToHtml()` conversion** — content was pre-rendered on save
5. Bible text panel shows `bibleText` (also pre-rendered HTML)
6. Attachments loaded from `MessageAttachment` relation

**What's eliminated:** No cross-table join. No `relatedStudy` fallback. No per-request TipTap JSON parsing.

### Visitor opens `/messages/some-sermon` (video detail)

1. Server calls `getMessageBySlug(churchId, 'some-sermon')` — one query, same table
2. Video player uses `videoUrl` / `youtubeId` from the same row
3. Transcript panel reads `transcript` (HTML) directly — no fallback chain
4. "View Bible Study" link checks `hasStudy` flag on the same row

**What's eliminated:** No `message.relatedStudy.transcript` fallback. No second query.

### Dashboard page

1. Count queries use indexes: `COUNT(*) WHERE hasVideo=true`, `COUNT(*) WHERE hasStudy=true`
2. Recent messages query uses `omit` for text columns
3. **No change to dashboard UI or behavior.**

### Archiving / deleting a message

1. `archiveMessage()` sets `archivedAt`, `hasVideo=false`, `hasStudy=false` on one row
2. `deleteMessage()` sets `deletedAt` on one row
3. **What's eliminated:** No `unlinkMessageStudy()`. No soft-deleting a separate BibleStudy row.

---

## 5. Decision: Why Merge

### The numbers

- 98.7% of Messages and BibleStudies are 1:1 linked
- 9 columns are duplicated across both tables
- 448 lines of sync code exist solely to keep them in sync
- The CMS only writes to Message; BibleStudy is a derived read-model
- The BibleStudy API endpoints are unused by the CMS

### What merging eliminates

| Component | Lines | Purpose |
|-----------|-------|---------|
| `lib/dal/sync-message-study.ts` | 448 | Entire sync layer |
| `lib/dal/bible-studies.ts` | ~100 | Separate DAL (merged into messages.ts) |
| `app/api/v1/bible-studies/route.ts` | ~90 | Separate API endpoint (becomes `/api/v1/messages` with filters) |
| `app/api/v1/bible-studies/[slug]/route.ts` | ~100 | Separate detail endpoint |
| BibleStudy table | — | Entire table dropped after migration |
| `Message.relatedStudyId` | — | FK column removed |
| `ensureUniqueBibleStudySlug()` | ~20 | No longer needed (single slug per message) |
| `unlinkMessageStudy()` | ~25 | No longer needed |

**Estimated net deletion: ~800 lines of code.**

### What merging preserves

- All current URLs and routing (`/bible-study/[slug]`, `/messages/[slug]`)
- All CMS editing workflows (unchanged — still edits Message)
- All website rendering (reads from same table, just different columns)
- Video-only entries (15 messages) — they simply have `hasStudy=false`
- Study-only entries (24 orphans) — migrated into Message with `hasVideo=false`

### Edge cases handled

| Case | Current | After Merge |
|------|---------|-------------|
| Video-only message | Message with `hasStudy=false`, no BibleStudy | Same row, `hasStudy=false`, study columns NULL |
| Study-only entry | BibleStudy with no linked Message | Migrated to Message row with `hasVideo=false` |
| Video + study | Message + BibleStudy (1:1 linked) | Single row with both video and study columns |

---

## 6. Proposed Schema

```prisma
model Message {
  id               String        @id @default(uuid()) @db.Uuid
  churchId         String        @db.Uuid
  slug             String
  title            String
  passage          String?
  bibleVersion     String?       @default("ESV")
  book             BibleBook?    // Parsed from passage on save (was on BibleStudy)
  speakerId        String?       @db.Uuid
  seriesId         String?       @db.Uuid    // Direct FK (replaces MessageSeries join table)
  dateFor          DateTime      @db.Date

  // ── Video ──
  videoTitle       String?
  videoUrl         String?
  videoDescription String?       @db.Text
  youtubeId        String?
  thumbnailUrl     String?
  duration         String?
  audioUrl         String?

  // ── Transcript Source (TipTap JSON — CMS editing format) ──
  rawTranscript    String?       @db.Text    // Video tab transcript (TipTap JSON)
  liveTranscript   String?       @db.Text    // Auto-generated live caption (TipTap JSON)

  // ── Study Source (TipTap JSON — CMS editing format) ──
  studySections    Json?         @db.JsonB   // Array of {id, title, content: TipTap JSON}

  // ── Rendered Content (HTML — generated on save, served to website) ──
  questions        String?       @db.Text    // Extracted from studySections, converted to HTML
  answers          String?       @db.Text    // Extracted from studySections, converted to HTML
  transcript       String?       @db.Text    // From studySections or rawTranscript, converted to HTML
  bibleText        String?       @db.Text    // Fetched from Bible API on save

  // ── Key Verse ──
  keyVerseRef      String?                   // e.g., "John 3:16"
  keyVerseText     String?       @db.Text    // Resolved verse text

  // ── Availability Flags ──
  hasVideo         Boolean       @default(false)
  hasStudy         Boolean       @default(false)
  hasQuestions      Boolean       @default(false)
  hasAnswers        Boolean       @default(false)
  hasTranscript     Boolean       @default(false)

  // ── Publishing ──
  publishedAt      DateTime?
  archivedAt       DateTime?

  // ── Legacy ──
  legacyMessageId  Int?          // From MySQL messages table
  legacyStudyId    Int?          // From MySQL bible_studies table

  // ── Metadata ──
  viewCount        Int           @default(0)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  createdBy        String?       @db.Uuid
  updatedBy        String?       @db.Uuid
  deletedAt        DateTime?

  // ── Relations ──
  church           Church        @relation(fields: [churchId], references: [id], onDelete: Cascade)
  speaker          Person?       @relation("MessageSpeaker", fields: [speakerId], references: [id], onDelete: SetNull)
  series           Series?       @relation(fields: [seriesId], references: [id], onDelete: SetNull)
  attachments      MessageAttachment[]

  // ── Search ──
  searchVector     Unsupported("tsvector")?

  // ── Indexes ──
  @@unique([churchId, slug])
  @@index([churchId, deletedAt, dateFor(sort: Desc)])  // Primary list query
  @@index([churchId, deletedAt, title])                 // Sort by title
  @@index([churchId, speakerId])
  @@index([churchId, seriesId])                         // Direct FK (was join table)
  @@index([churchId, hasVideo])
  @@index([churchId, hasStudy])
  @@index([churchId, book])                             // Bible book filtering
}

// Renamed from BibleStudyAttachment — now references Message directly
model MessageAttachment {
  id           String         @id @default(uuid()) @db.Uuid
  messageId    String         @db.Uuid
  name         String
  url          String
  type         AttachmentType @default(OTHER)
  fileSize     Int?
  sortOrder    Int            @default(0)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  message      Message        @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@index([messageId, sortOrder])
}
```

---

## 7. Column Decisions

### Columns ADDED to Message (from BibleStudy)

| Column | Type | Rationale |
|--------|------|-----------|
| `book` | BibleBook? | Parsed from passage. Enables book-based filtering without a join. Made nullable since video-only messages won't have it. |
| `seriesId` | UUID? | Direct FK replaces `MessageSeries` join table. Current data shows 1:1 usage only. |
| `questions` | Text? | Rendered HTML for website. Generated from `studySections` on save. |
| `answers` | Text? | Rendered HTML for website. Generated from `studySections` on save. |
| `transcript` | Text? | Rendered HTML for website. Generated from `studySections` or `rawTranscript` on save. |
| `bibleText` | Text? | Bible passage HTML. Fetched from API on save when passage changes. |
| `keyVerseRef` | String? | Keep for future use (Daily Bread feature). |
| `keyVerseText` | Text? | Keep for future use. |
| `hasQuestions` | Boolean | Availability flag for card icons. |
| `hasAnswers` | Boolean | Availability flag for card icons. |
| `hasTranscript` | Boolean | Availability flag for card icons. |
| `legacyStudyId` | Int? | Preserves migration lineage (was `BibleStudy.legacyId`). |

### Columns REMOVED

| Column | Table | Reason |
|--------|-------|--------|
| `transcriptSegments` | Message | Dead — 7 entries all JSON null, zero code references |
| `attachments` (JSON) | Message | Deprecated — replaced by MessageAttachment relation |
| `relatedStudyId` | Message | No longer needed — single table |
| `datePosted` | BibleStudy | Always identical to dateFor — redundant |
| `status` | BibleStudy | Replaced by Message's `hasStudy` + `deletedAt` + `archivedAt` |
| `videoTitle` | Message | **Keep** — separate video title is a valid CMS feature |

### Series: Join Table → Direct FK

**Current:** `MessageSeries` join table (M:N design, but only 1:1 in practice).
**Proposed:** Direct `seriesId` FK on Message.

Rationale:
- Current data shows zero messages with multiple series
- Join table adds a query hop for every list view
- Direct FK enables `@@index([churchId, seriesId])` for efficient filtering
- If multi-series is ever needed, the join table can be re-added

**Migration:** Copy `MessageSeries.seriesId` (first entry per message) to `Message.seriesId`. The `MessageSeries` table is dropped.

---

## 8. Indexes

### Primary Indexes

```
@@unique([churchId, slug])                          -- Slug lookup
@@index([churchId, deletedAt, dateFor(sort: Desc)]) -- Default list sort
@@index([churchId, deletedAt, title])               -- Title sort
@@index([churchId, speakerId])                      -- Speaker filter
@@index([churchId, seriesId])                       -- Series filter (NEW: direct FK)
@@index([churchId, hasVideo])                       -- Video-only filter
@@index([churchId, hasStudy])                       -- Study-only filter
@@index([churchId, book])                           -- Bible book filter (NEW)
```

### Index Rationale

The composite `[churchId, deletedAt, dateFor]` index covers the most common query pattern: "all non-deleted messages for this church, sorted by date." PostgreSQL can seek directly to non-deleted rows and walk the dateFor portion in order.

The `[churchId, book]` index is new — enables the "Books" tab on the bible study list page to filter by book without a full table scan.

### Indexes NOT Needed

- `[churchId, status]` — BibleStudy's `status` is removed. The equivalent is `[churchId, hasStudy]` + `deletedAt` filter.
- `[churchId, hasQuestions]` / `[churchId, hasAnswers]` / `[churchId, hasTranscript]` — these boolean flags are only used for card icon display, never for filtering.

---

## 9. Relations

### Before (3 tables + join)

```
Message ──(1:1 via FK)──► BibleStudy
Message ──(1:N join)──► MessageSeries ──► Series
BibleStudy ──(direct FK)──► Series
BibleStudy ──(1:N)──► BibleStudyAttachment
```

### After (1 table + direct FKs)

```
Message ──(direct FK)──► Series
Message ──(direct FK)──► Person (speaker)
Message ──(1:N)──► MessageAttachment
```

**Simplification:** 4 relations → 3 relations. The join table and 1:1 FK are eliminated.

---

## 10. Query Patterns After Merge

### List View (Bible Studies page, Messages page)

```typescript
// Bible study list — light fields only, no TOAST access
const studies = await prisma.message.findMany({
  where: { churchId, deletedAt: null, hasStudy: true },
  omit: {
    // Exclude all large text columns (TOAST-stored, never accessed)
    questions: true,
    answers: true,
    transcript: true,
    bibleText: true,
    rawTranscript: true,
    liveTranscript: true,
    studySections: true,
    videoDescription: true,
    keyVerseText: true,
  },
  include: {
    speaker: { select: { firstName: true, lastName: true, preferredName: true } },
    series: { select: { id: true, name: true } },
  },
  orderBy: { dateFor: 'desc' },
  skip: (page - 1) * pageSize,
  take: pageSize,
})
```

**Result:** PostgreSQL reads only the ~200-byte metadata columns from the main table page. TOAST table is never accessed. This is equivalent performance to the current two-table setup, but without the join.

### Detail View (Bible Study detail, Message detail)

```typescript
// Full record — includes all text columns
const message = await prisma.message.findUnique({
  where: { churchId_slug: { churchId, slug } },
  include: {
    speaker: true,
    series: true,
    attachments: { orderBy: { sortOrder: 'asc' } },
  },
})
```

**Result:** One query fetches everything — no cross-table join needed. TOAST lazily fetches the large text columns.

### Video Messages List (Messages page — video-only)

```typescript
const messages = await prisma.message.findMany({
  where: { churchId, deletedAt: null, hasVideo: true },
  omit: {
    questions: true, answers: true, transcript: true, bibleText: true,
    rawTranscript: true, liveTranscript: true, studySections: true,
    keyVerseText: true,
  },
  include: {
    speaker: { select: { firstName: true, lastName: true, preferredName: true } },
    series: { select: { id: true, name: true } },
  },
  orderBy: { dateFor: 'desc' },
})
```

### Dashboard Counts

```typescript
// Efficient count queries — no data fetched
const [videoCount, studyCount] = await Promise.all([
  prisma.message.count({ where: { churchId, deletedAt: null, hasVideo: true } }),
  prisma.message.count({ where: { churchId, deletedAt: null, hasStudy: true } }),
])
```

---

## 11. Write Path After Merge

### Current (two-table sync)

```
CMS save → Message UPDATE → syncMessageStudy() → BibleStudy UPSERT → BibleStudyAttachment UPSERT
              (1 query)           (complex logic)      (1 query)            (N queries)
```

### Proposed (single-table write)

```
CMS save → Message UPDATE (with inline content processing)
              (1 query + attachment upserts)
```

### Content Processing (inlined into Message DAL)

The study section extraction and HTML conversion logic moves from `syncMessageStudy()` into the Message update function:

```typescript
async function updateMessage(churchId: string, id: string, data: MessageUpdateInput) {
  // If study sections changed, re-derive HTML columns
  if (data.studySections !== undefined) {
    const { questions, answers, transcript } = extractStudyContent(data.studySections)
    data.questions = questions
    data.answers = answers
    data.hasQuestions = !!questions
    data.hasAnswers = !!answers

    // Transcript fallback: studySections → rawTranscript
    if (!transcript && data.rawTranscript?.trim()) {
      data.transcript = tiptapJsonToHtml(data.rawTranscript)
    } else {
      data.transcript = transcript
    }
    data.hasTranscript = !!data.transcript
  }

  // If rawTranscript changed and no study transcript exists, re-derive
  if (data.rawTranscript !== undefined && !data.transcript) {
    if (data.rawTranscript?.trim()) {
      data.transcript = tiptapJsonToHtml(data.rawTranscript)
      data.hasTranscript = true
    }
  }

  // If passage changed, re-parse book and optionally re-fetch bible text
  if (data.passage !== undefined) {
    data.book = parseBookFromPassage(data.passage)
    const result = await fetchBibleText(data.passage, data.bibleVersion || 'ESV')
    if (result) data.bibleText = result.html
  }

  return prisma.message.update({
    where: { id, churchId },
    data,
  })
}
```

**Key difference:** No separate sync function, no BibleStudy table, no slug deduplication for a second table, no cross-table transaction.

---

## 12. PostgreSQL TOAST Behavior

### Why large text columns on a single table are safe

PostgreSQL uses [TOAST (The Oversized-Attribute Storage Technique)](https://www.postgresql.org/docs/current/storage-toast.html) to handle large values:

1. **Text columns default to `EXTENDED` storage strategy** — values are compressed (LZ4), then moved out-of-line to a separate TOAST table if still over ~2KB.
2. **Your 40-80KB content columns will always be stored out-of-line** — they are well above the TOAST threshold.
3. **TOAST values are lazily fetched** — if a query does not SELECT a TOASTed column, PostgreSQL never reads the TOAST table. This is why `omit` is critical.
4. **The main table stays compact** — with text columns moved to TOAST, each main-table row is ~200-400 bytes of metadata, so more rows fit in shared_buffers and sequential scans are faster.

### Performance validation

From [pganalyze benchmarks](https://pganalyze.com/blog/5mins-postgres-TOAST-performance): replacing `SELECT *` with column-explicit SELECT on a table with 50KB JSONB columns showed a **170x improvement** (5ms vs 850ms for 100 rows). Prisma's `omit` generates column-explicit SQL.

### The "medium text" non-concern

The [Haki Benita article](https://hakibenita.com/sql-medium-text-performance) documents performance issues with 1-2KB text values that compress but don't move out-of-line. Your content is 40-80KB — always out-of-line. This is the ideal TOAST case.

### Measured data from our database (2026-03-26)

| Table | Heap size (main rows) | TOAST size (large values) | Total |
|-------|----------------------|--------------------------|-------|
| Message | 384 KB | 96 KB | 1 MB |
| BibleStudy | 2 MB | **22 MB** | 25 MB |

Average text column sizes on BibleStudy:
- `questions`: 6,397 bytes
- `answers`: 55,698 bytes
- `transcript`: 41,755 bytes
- `bibleText`: 3,452 bytes
- **Total text per row: ~71 KB**

**Current list query payload (all columns):** ~80 MB for 1,185 rows
**Proposed list query payload (metadata only via `omit`):** ~152 KB for 1,185 rows
**Reduction: 99.8% less data transferred per list request**

---

## 13. What Gets Deleted

### Tables Dropped

| Table | Rows | Reason |
|-------|------|--------|
| `BibleStudy` | 1,185 | Merged into Message |
| `MessageSeries` | ~1,200 | Replaced by direct FK `Message.seriesId` |

### Tables Renamed

| Old Name | New Name | Reason |
|----------|----------|--------|
| `BibleStudyAttachment` | `MessageAttachment` | FK now references Message |

### Files Deleted

| File | Lines | Reason |
|------|-------|--------|
| `lib/dal/sync-message-study.ts` | 448 | Sync layer eliminated |
| `lib/dal/bible-studies.ts` | ~100 | Merged into messages.ts |
| `app/api/v1/bible-studies/route.ts` | ~90 | Merged into messages API |
| `app/api/v1/bible-studies/[slug]/route.ts` | ~100 | Merged into messages API |

### Columns Dropped

| Column | Table | Reason |
|--------|-------|--------|
| `Message.transcriptSegments` | Message | Dead data (7 JSON nulls, zero code refs) |
| `Message.attachments` (JSON) | Message | Deprecated by relation table |
| `Message.relatedStudyId` | Message | No longer needed |
| `BibleStudy.datePosted` | BibleStudy | Always = dateFor |
| `BibleStudy.status` | BibleStudy | Replaced by hasStudy + deletedAt |

---

## 14. Migration Plan

### Phase 1: Schema Migration (Prisma)

1. Add new columns to Message model: `book`, `seriesId`, `questions`, `answers`, `transcript`, `bibleText`, `keyVerseRef`, `keyVerseText`, `hasQuestions`, `hasAnswers`, `hasTranscript`, `legacyStudyId`
2. Add `@@index([churchId, book])` and `@@index([churchId, seriesId])`
3. Run `prisma migrate dev --name merge-message-bible-study`

### Phase 2: Data Migration (Script)

```sql
-- Step 1: Copy BibleStudy data into linked Message rows
UPDATE "Message" m
SET
  "book" = bs."book",
  "questions" = bs."questions",
  "answers" = bs."answers",
  "transcript" = bs."transcript",
  "bibleText" = bs."bibleText",
  "keyVerseRef" = bs."keyVerseRef",
  "keyVerseText" = bs."keyVerseText",
  "hasQuestions" = bs."hasQuestions",
  "hasAnswers" = bs."hasAnswers",
  "hasTranscript" = bs."hasTranscript",
  "legacyStudyId" = bs."legacyId"
FROM "BibleStudy" bs
WHERE m."relatedStudyId" = bs."id"
  AND bs."deletedAt" IS NULL;

-- Step 2: Copy series from MessageSeries join table to direct FK
UPDATE "Message" m
SET "seriesId" = ms."seriesId"
FROM "MessageSeries" ms
WHERE ms."messageId" = m."id";

-- Step 3: Migrate 24 orphan BibleStudy rows (no linked Message)
INSERT INTO "Message" (
  "id", "churchId", "slug", "title", "passage", "bibleVersion",
  "book", "speakerId", "seriesId", "dateFor",
  "questions", "answers", "transcript", "bibleText",
  "keyVerseRef", "keyVerseText",
  "hasVideo", "hasStudy", "hasQuestions", "hasAnswers", "hasTranscript",
  "publishedAt", "legacyStudyId", "createdAt", "updatedAt"
)
SELECT
  bs."id", bs."churchId", bs."slug", bs."title", bs."passage", 'ESV',
  bs."book", bs."speakerId", bs."seriesId", bs."dateFor",
  bs."questions", bs."answers", bs."transcript", bs."bibleText",
  bs."keyVerseRef", bs."keyVerseText",
  false, true, bs."hasQuestions", bs."hasAnswers", bs."hasTranscript",
  bs."publishedAt", bs."legacyId", bs."createdAt", bs."updatedAt"
FROM "BibleStudy" bs
LEFT JOIN "Message" m ON m."relatedStudyId" = bs."id"
WHERE m."id" IS NULL AND bs."deletedAt" IS NULL;

-- Step 4: Re-point BibleStudyAttachment to Message
-- (Add messageId FK to BibleStudyAttachment, copy from BibleStudy link)
UPDATE "BibleStudyAttachment" bsa
SET "messageId" = m."id"
FROM "Message" m
WHERE m."relatedStudyId" = bsa."bibleStudyId";

-- Step 5: Convert all TipTap JSON content to HTML (one-time)
-- (Run as a Node.js script using tiptapJsonToHtml for each row)
```

### Phase 3: Content Format Normalization (Node.js Script)

Convert all BibleStudy-originated content from TipTap JSON to HTML:

```typescript
// For each Message with questions/answers/transcript that starts with '{'
const messages = await prisma.message.findMany({
  where: { deletedAt: null },
  select: { id: true, questions: true, answers: true, transcript: true },
})

for (const msg of messages) {
  const updates: Record<string, string | null> = {}

  if (msg.questions?.startsWith('{')) {
    updates.questions = tiptapJsonToHtml(msg.questions)
  }
  if (msg.answers?.startsWith('{')) {
    updates.answers = tiptapJsonToHtml(msg.answers)
  }
  if (msg.transcript?.startsWith('{')) {
    updates.transcript = tiptapJsonToHtml(msg.transcript)
  }

  if (Object.keys(updates).length > 0) {
    await prisma.message.update({ where: { id: msg.id }, data: updates })
  }
}
```

After this, all content columns contain HTML. The `contentToHtml()` calls on the website can be removed — content is served as-is.

### Phase 4: Code Migration

1. Update `lib/dal/messages.ts` — add `omit` patterns, inline study content processing
2. Update `app/api/v1/messages/` routes — remove sync calls, inline content conversion
3. Update `app/website/bible-study/` — read from Message table with `hasStudy=true` filter
4. Update `app/website/messages/` — remove `relatedStudy` joins
5. Remove `contentToHtml()` calls from website pages (content is already HTML)
6. Rename `BibleStudyAttachment` → `MessageAttachment`, update FK
7. Delete: `sync-message-study.ts`, `bible-studies.ts` DAL, `bible-studies/` API routes

### Phase 5: Cleanup

1. Drop `BibleStudy` table
2. Drop `MessageSeries` table
3. Drop `Message.relatedStudyId`, `Message.transcriptSegments`, `Message.attachments` (JSON)
4. Run `prisma migrate dev --name cleanup-merged-tables`

---

## 15. API Surface Changes

### Public Website API

| Current | Proposed | Notes |
|---------|----------|-------|
| `GET /api/v1/bible-studies` | `GET /api/v1/messages?hasStudy=true` | Same data, different filter |
| `GET /api/v1/bible-studies/[slug]` | `GET /api/v1/messages/[slug]` | Same endpoint, full record |
| `GET /api/v1/messages` | `GET /api/v1/messages?hasVideo=true` | Add explicit video filter |

### CMS API

| Current | Proposed | Notes |
|---------|----------|-------|
| `POST /api/v1/messages` | `POST /api/v1/messages` | Unchanged, inline content processing |
| `PATCH /api/v1/messages/[slug]` | `PATCH /api/v1/messages/[slug]` | Unchanged, inline content processing |
| `DELETE /api/v1/messages/[slug]` | `DELETE /api/v1/messages/[slug]` | Simpler — no unlinkMessageStudy() |
| `POST /api/v1/bible-studies` | **Removed** | Unused by CMS |
| `PATCH /api/v1/bible-studies/[slug]` | **Removed** | Unused by CMS |
| `DELETE /api/v1/bible-studies/[slug]` | **Removed** | Unused by CMS |

### URL Routing

| Current URL | Source | After Merge |
|-------------|--------|-------------|
| `/bible-study` | Reads from BibleStudy table | Reads from Message table with `hasStudy=true` |
| `/bible-study/[slug]` | Reads from BibleStudy table | Reads from Message table by slug |
| `/messages` | Reads from Message table | Unchanged |
| `/messages/[slug]` | Reads from Message + BibleStudy (via join) | Reads from Message only |

**No public URLs change.** The slug uniqueness constraint is the same (`churchId_slug`).

---

## 16. Website Route Changes

### `/bible-study` (list page)

**Before:** `getBibleStudies(churchId)` → BibleStudy table
**After:** `getMessages(churchId, { hasStudy: true })` → Message table with `omit` for heavy columns

The page component transforms the data into the same shape — no client component changes needed.

### `/bible-study/[slug]` (detail page)

**Before:** `getBibleStudyBySlug(churchId, slug)` → BibleStudy table → `contentToHtml(study.transcript)`
**After:** `getMessageBySlug(churchId, slug)` → Message table → `message.transcript` (already HTML)

The `contentToHtml()` call is removed because all content is pre-rendered HTML after the migration.

### `/messages/[slug]` (detail page)

**Before:** `getMessageBySlug(churchId, slug)` → Message table → `message.relatedStudy.transcript` (fallback)
**After:** `getMessageBySlug(churchId, slug)` → Message table → `message.transcript` (direct)

No more cross-table fallback. Transcript, questions, answers are all on the same row.

---

## 17. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Data loss during migration | Low | High | Run migration script in transaction, verify row counts before/after |
| Slug collisions (BibleStudy orphans → Message) | Low | Medium | Check for slug conflicts before inserting orphans, suffix if needed |
| Content format corruption during JSON→HTML conversion | Low | High | Run conversion on dev first, spot-check 10 random entries, diff against `contentToHtml()` output |
| Missing `omit` on a list query → TOAST overhead | Medium | Low | Create `messageListOmit` constant, use in all list queries |
| Attachment FK re-pointing fails | Low | Medium | Verify all BibleStudyAttachment.bibleStudyId values have matching Message.relatedStudyId |
| Future need for M:N series | Low | Low | Direct FK handles 100% of current data. Re-add join table only if needed. |

---

## 18. Sources

| Topic | Source |
|-------|--------|
| PostgreSQL TOAST | [PostgreSQL 18 Docs — TOAST](https://www.postgresql.org/docs/current/storage-toast.html) |
| TOAST performance | [pganalyze — TOAST Performance Analysis](https://pganalyze.com/blog/5mins-postgres-TOAST-performance) |
| Medium text performance | [Haki Benita — Surprising Impact of Medium-Size Texts](https://hakibenita.com/sql-medium-text-performance) |
| Prisma `omit` | [Prisma Docs — Excluding Fields](https://www.prisma.io/docs/orm/prisma-client/queries/excluding-fields) — GA since 6.2.0, stable in 7.x |
| TipTap persistence | [TipTap Docs — Persistence](https://tiptap.dev/docs/editor/core-concepts/persistence) — recommends JSON as source, HTML on demand |
| 1:1 table merging | [PostgreSQL Wiki — Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization) — avoid unnecessary JOINs when data is always accessed together |
