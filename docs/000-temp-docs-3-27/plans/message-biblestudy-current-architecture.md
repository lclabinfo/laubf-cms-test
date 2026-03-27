# Message & BibleStudy — Current Architecture

**Date:** 2026-03-26
**Purpose:** Full audit of the current two-table architecture for Message and BibleStudy, including schema, data population, operations, and data flow.

---

## Table of Contents

1. [Schema Overview](#1-schema-overview)
2. [Data Population Audit](#2-data-population-audit)
3. [Column-by-Column Reference](#3-column-by-column-reference)
4. [Relationship Map](#4-relationship-map)
5. [Operations Audit: Message](#5-operations-audit-message)
6. [Operations Audit: BibleStudy](#6-operations-audit-biblestudy)
7. [Sync Pipeline: Message → BibleStudy](#7-sync-pipeline-message--biblestudy)
8. [Website Rendering: Who Reads What](#8-website-rendering-who-reads-what)
9. [CMS Editing: Who Writes What](#9-cms-editing-who-writes-what)
10. [Data Format Audit](#10-data-format-audit)
11. [Legacy / Dead Columns](#11-legacy--dead-columns)
12. [Problems with Current Architecture](#12-problems-with-current-architecture)

---

## 1. Schema Overview

Two tables with a 1:1 relationship via `Message.relatedStudyId → BibleStudy.id`.

### Message (`prisma/schema.prisma:394-462`)

The **CMS editing surface**. All content is created and edited here. Holds video metadata, transcript source data (TipTap JSON), study section source data, and shared metadata (title, passage, speaker, date).

### BibleStudy (`prisma/schema.prisma:621-681`)

The **public website read model**. Holds rendered study content (HTML), availability flags, and duplicated metadata. Populated via `syncMessageStudy()` on every Message save. Never edited directly by the CMS.

### Supporting Tables

| Table | Role |
|-------|------|
| `MessageSeries` | Join table: Message ↔ Series (M:N, but currently 1:1 in practice) |
| `BibleStudyAttachment` | 1:N attachments for BibleStudy (files stored in R2) |
| `Person` | Speaker reference (shared by both tables via `speakerId`) |
| `Series` | Series reference (shared by both tables) |

---

## 2. Data Population Audit

**Queried 2026-03-26 against local dev database.**

### Row Counts

| Metric | Count |
|--------|-------|
| Messages (non-deleted) | 1,176 |
| BibleStudy rows (non-deleted) | 1,185 |
| Messages linked to a BibleStudy | 1,161 (98.7%) |
| Messages with NO linked BibleStudy | 15 (all video-only) |
| Orphan BibleStudy rows (no Message) | 24 (legacy studies-only, no video) |

### Message Column Population

| Column | Rows with Data | % | Notes |
|--------|---------------|---|-------|
| `title` | 1,176 | 100% | Always populated |
| `passage` | 1,176 | 100% | Always populated |
| `bibleVersion` | 1,176 | 100% | Default "ESV" |
| `dateFor` | 1,176 | 100% | Always populated |
| `speakerId` | 234 | 19.9% | Only recent entries have speaker linked |
| `videoUrl` | 227 | 19.3% | Vimeo URLs |
| `youtubeId` | 227 | 19.3% | YouTube video IDs |
| `thumbnailUrl` | 227 | 19.3% | Video thumbnails |
| `hasVideo` | 227 true | 19.3% | Matches video URL presence |
| `hasStudy` | 1,160 true | 98.6% | Almost all have study content |
| `rawTranscript` | **3** | 0.3% | Only 3 messages have Video tab transcript |
| `liveTranscript` | **0** | 0% | Feature exists in UI but no data |
| `transcriptSegments` | **7** | 0.6% | All contain JSON `null` (not SQL NULL) — effectively empty |
| `studySections` | **8** | 0.7% | Only 8 messages edited via CMS Study tab |
| `attachments` (JSON) | **8** | 0.7% | Deprecated by BibleStudyAttachment table |
| `relatedStudyId` | 1,161 | 98.7% | FK to BibleStudy |

### BibleStudy Column Population

| Column | Rows with Data | % | Notes |
|--------|---------------|---|-------|
| `title` | 1,185 | 100% | Always populated |
| `passage` | 1,185 | 100% | Always populated |
| `book` | 1,185 | 100% | BibleBook enum, required |
| `dateFor` | 1,185 | 100% | Always populated |
| `seriesId` | 1,185 | 100% | All have series |
| `speakerId` | 3 | 0.3% | Barely populated |
| `questions` | 1,158 | 97.7% | Primary study content |
| `answers` | 906 | 76.5% | Most have answers |
| `transcript` | 626 | 52.8% | About half have transcripts |
| `bibleText` | 8 | 0.7% | Only 8 fetched (recent entries via sync) |
| `keyVerseRef` | 0 | 0% | Never populated |
| `keyVerseText` | 0 | 0% | Never populated |
| `hasQuestions` | 1,158 true | 97.7% | Matches questions presence |
| `hasAnswers` | 906 true | 76.5% | Matches answers presence |
| `hasTranscript` | 626 true | 52.8% | Matches transcript presence |

---

## 3. Column-by-Column Reference

### Message Columns

| Column | Type | Nullable | Purpose | Used By |
|--------|------|----------|---------|---------|
| `id` | UUID | ✗ | Primary key | All operations |
| `churchId` | UUID | ✗ | Tenant isolation | All queries |
| `slug` | String | ✗ | URL identifier | Lookups, links |
| `title` | String | ✗ | Display title | CMS + website |
| `videoTitle` | String | ✓ | Separate video title | CMS video tab, website messages page |
| `passage` | String | ✓ | Scripture reference | CMS + website |
| `bibleVersion` | String | ✓ | Default "ESV" | Bible API calls, study detail |
| `speakerId` | UUID | ✓ | FK to Person | CMS + website display |
| `dateFor` | Date | ✗ | Content date | Sorting, filtering |
| `videoUrl` | String | ✓ | Vimeo/video URL | Website video player |
| `videoDescription` | Text | ✓ | Video description | Website messages page |
| `youtubeId` | String | ✓ | YouTube video ID | Website video embed |
| `thumbnailUrl` | String | ✓ | Video thumbnail | Website message cards |
| `duration` | String | ✓ | Video duration | Website display |
| `audioUrl` | String | ✓ | Audio file URL | Website audio player |
| `rawTranscript` | Text | ✓ | TipTap JSON (Video tab transcript) | CMS editor, sync fallback |
| `liveTranscript` | Text | ✓ | TipTap JSON (auto-generated) | Website transcript panel |
| `transcriptSegments` | JsonB | ✓ | Timestamped segments | **DEAD — all entries are JSON null** |
| `studySections` | JsonB | ✓ | TipTap JSON sections array | CMS Study tab editor |
| `attachments` | JsonB | ✓ | **DEPRECATED** — replaced by BibleStudyAttachment table | Legacy only |
| `hasVideo` | Boolean | ✗ | Video availability flag | Website filtering |
| `hasStudy` | Boolean | ✗ | Study availability flag | Sync trigger |
| `publishedAt` | DateTime | ✓ | Publish timestamp | CMS status |
| `archivedAt` | DateTime | ✓ | Archive timestamp | CMS filtering |
| `relatedStudyId` | UUID | ✓ | FK to BibleStudy (1:1, unique) | Cross-table link |
| `legacyId` | Int | ✓ | MySQL migration ID | Migration only |
| `viewCount` | Int | ✗ | Page views | Analytics |
| `createdAt` | DateTime | ✗ | Auto timestamp | Metadata |
| `updatedAt` | DateTime | ✗ | Auto timestamp | Metadata |
| `createdBy` | UUID | ✓ | Audit trail | Metadata |
| `updatedBy` | UUID | ✓ | Audit trail | Metadata |
| `deletedAt` | DateTime | ✓ | Soft delete | All queries filter this |
| `searchVector` | tsvector | ✓ | Full-text search | Search queries |

### BibleStudy Columns

| Column | Type | Nullable | Purpose | Used By |
|--------|------|----------|---------|---------|
| `id` | UUID | ✗ | Primary key | All operations |
| `churchId` | UUID | ✗ | Tenant isolation | All queries |
| `slug` | String | ✗ | URL identifier | Website links |
| `title` | String | ✗ | Display title | Website display |
| `book` | BibleBook enum | ✗ | Bible book (parsed from passage) | Filtering, display |
| `passage` | String | ✗ | Scripture reference | Website display |
| `datePosted` | Date | ✗ | Post date (= dateFor) | Unused in practice |
| `dateFor` | Date | ✗ | Content date | Sorting, filtering |
| `seriesId` | UUID | ✓ | FK to Series | Website filtering |
| `speakerId` | UUID | ✓ | FK to Person | Website display |
| `questions` | Text | ✓ | Study questions (TipTap JSON or HTML) | Website detail page |
| `answers` | Text | ✓ | Study answers (TipTap JSON or HTML) | Website detail page |
| `transcript` | Text | ✓ | Message transcript (TipTap JSON or HTML) | Website detail page |
| `bibleText` | Text | ✓ | Full Bible passage HTML | Website detail page |
| `keyVerseRef` | String | ✓ | Key verse reference | **Never populated** |
| `keyVerseText` | Text | ✓ | Key verse text | **Never populated** |
| `hasQuestions` | Boolean | ✗ | Availability flag | Website card icons |
| `hasAnswers` | Boolean | ✗ | Availability flag | Website card icons |
| `hasTranscript` | Boolean | ✗ | Availability flag | Website card icons |
| `status` | ContentStatus enum | ✗ | Publish state | Website filtering |
| `publishedAt` | DateTime | ✓ | Publish timestamp | Metadata |
| `createdAt` | DateTime | ✗ | Auto timestamp | Metadata |
| `updatedAt` | DateTime | ✗ | Auto timestamp | Metadata |
| `createdBy` | UUID | ✓ | Audit trail | Metadata |
| `updatedBy` | UUID | ✓ | Audit trail | Metadata |
| `deletedAt` | DateTime | ✓ | Soft delete | All queries filter this |
| `legacyId` | Int | ✓ | MySQL migration ID | Migration only |

---

## 4. Relationship Map

```
Person (Speaker)
  ├── Message.speakerId (FK)
  └── BibleStudy.speakerId (FK)        ← DUPLICATED

Series
  ├── MessageSeries.seriesId (join)     ← Message uses a join table
  └── BibleStudy.seriesId (direct FK)   ← BibleStudy uses direct FK

Message ──(1:1)──► BibleStudy
  │                   │
  │  relatedStudyId   │  relatedMessage (reverse)
  │                   │
  └── MessageSeries   └── BibleStudyAttachment[]

Church
  ├── Message.churchId
  └── BibleStudy.churchId              ← DUPLICATED
```

### Duplicated Columns Between Tables

| Column | Message | BibleStudy | Notes |
|--------|---------|------------|-------|
| `title` | ✓ | ✓ | 95% identical (1,106/1,161 match exactly) |
| `passage` | ✓ | ✓ | 98% identical (1,137/1,161 match) |
| `speakerId` | ✓ | ✓ | Only 3 matches (BibleStudy barely populated) |
| `dateFor` | ✓ | ✓ | 98% identical (1,136/1,161 match) |
| `churchId` | ✓ | ✓ | Always identical |
| `slug` | ✓ | ✓ | Usually identical (sync copies it) |
| `publishedAt` | ✓ | ✓ | Sync copies it |
| `deletedAt` | ✓ | ✓ | Managed separately |
| `createdAt/updatedAt` | ✓ | ✓ | Independent timestamps |
| `createdBy/updatedBy` | ✓ | ✓ | Independent |
| `legacyId` | ✓ | ✓ | Different legacy IDs (MySQL messages vs studies tables) |

**Series linkage is also duplicated** — Message uses a join table (`MessageSeries`), BibleStudy uses a direct FK (`seriesId`). The sync function copies the first series ID from the join table to the direct FK.

---

## 5. Operations Audit: Message

### DAL Functions (`lib/dal/messages.ts`)

| Function | Line | Type | Columns Read | Columns Written |
|----------|------|------|-------------|-----------------|
| `getMessages()` | 64 | READ | slug, title, passage, dateFor, hasVideo, hasStudy, videoTitle, videoUrl, youtubeId, videoDescription, thumbnailUrl, duration + speaker, series, relatedStudy._count | — |
| `getMessageBySlug()` | 124 | READ | All columns + speaker, series, relatedStudy (full with attachments) | — |
| `getMessageById()` | 140 | READ | Same as getMessageBySlug | — |
| `getLatestMessage()` | 150 | READ | Core fields + speaker, series, relatedStudy (full) | — |
| `getLatestPublishedDates()` | 185 | READ | dateFor (selected), hasVideo/hasStudy (filtered) | — |
| `createMessage()` | 245 | CREATE | — | All writable fields, creates MessageSeries join |
| `updateMessage()` | 292 | UPDATE | videoUrl, youtubeId (validation) | Any field in payload |
| `deleteMessage()` | 358 | SOFT DELETE | — | deletedAt |
| `archiveMessage()` | 365 | UPDATE | — | archivedAt, hasVideo=false, hasStudy=false |
| `unarchiveMessage()` | 377 | UPDATE | — | archivedAt=null |
| `bulkDeleteMessages()` | 385 | BULK DELETE | — | deletedAt |
| `bulkArchiveMessages()` | 392 | BULK UPDATE | — | archivedAt, hasVideo, hasStudy |
| `bulkUnarchiveMessages()` | 403 | BULK UPDATE | — | archivedAt=null |

### API Routes

| Route | Method | Handler Location | Uses |
|-------|--------|-----------------|------|
| `/api/v1/messages` | GET | `app/api/v1/messages/route.ts:9` | `getMessages()` |
| `/api/v1/messages` | POST | `app/api/v1/messages/route.ts:53` | `createMessage()` + `syncMessageStudy()` |
| `/api/v1/messages/[slug]` | GET | `app/api/v1/messages/[slug]/route.ts:10` | `getMessageBySlug()` |
| `/api/v1/messages/[slug]` | PATCH | `app/api/v1/messages/[slug]/route.ts:39` | `updateMessage()` + `syncMessageStudy()` |
| `/api/v1/messages/[slug]` | DELETE | `app/api/v1/messages/[slug]/route.ts:166` | `deleteMessage()` + `unlinkMessageStudy()` |
| `/api/v1/messages/bulk` | POST | `app/api/v1/messages/bulk/route.ts:9` | Bulk actions (delete, archive, unarchive) |

---

## 6. Operations Audit: BibleStudy

### DAL Functions (`lib/dal/bible-studies.ts`)

| Function | Line | Type | Columns Read | Columns Written |
|----------|------|------|-------------|-----------------|
| `getBibleStudies()` | 24 | READ | All columns + speaker, series, attachments, relatedMessage (bibleVersion, slug, videoUrl, youtubeId) | — |
| `getBibleStudyBySlug()` | 54 | READ | Same as getBibleStudies (single record) | — |
| `createBibleStudy()` | 64 | CREATE | — | All fields from payload |
| `updateBibleStudy()` | 74 | UPDATE | — | Any field in payload |
| `deleteBibleStudy()` | 86 | SOFT DELETE | — | deletedAt (+ hard-deletes attachments) |

### API Routes

| Route | Method | Handler Location | Uses |
|-------|--------|-----------------|------|
| `/api/v1/bible-studies` | GET | `app/api/v1/bible-studies/route.ts:9` | `getBibleStudies()` |
| `/api/v1/bible-studies` | POST | `app/api/v1/bible-studies/route.ts:46` | `createBibleStudy()` |
| `/api/v1/bible-studies/[slug]` | GET | `app/api/v1/bible-studies/[slug]/route.ts:9` | `getBibleStudyBySlug()` |
| `/api/v1/bible-studies/[slug]` | PATCH | `app/api/v1/bible-studies/[slug]/route.ts:34` | `updateBibleStudy()` |
| `/api/v1/bible-studies/[slug]` | DELETE | `app/api/v1/bible-studies/[slug]/route.ts:67` | `deleteBibleStudy()` |

**Note:** The BibleStudy API endpoints exist but the CMS never calls them directly. All BibleStudy writes go through `syncMessageStudy()` triggered by Message saves. The API endpoints were created during the migration phase and are now only used for the public website read path.

---

## 7. Sync Pipeline: Message → BibleStudy

**File:** `lib/dal/sync-message-study.ts` (448 lines)

### Trigger Points

1. **POST `/api/v1/messages`** — after creating a Message, if `hasStudy=true` and (studySections or rawTranscript exists)
2. **PATCH `/api/v1/messages/[slug]`** — after updating a Message, same conditions

### Data Flow

```
CMS Message Editor
    │
    ├─ Details tab: title, passage, speaker, date, series, bibleVersion
    ├─ Video tab: videoUrl, youtubeId, rawTranscript (TipTap JSON), liveTranscript
    ├─ Study tab: studySections[] (TipTap JSON), attachments[]
    │
    ▼
Message API (POST/PATCH)
    │
    ├─ Saves to Message table (all columns)
    │
    ▼
syncMessageStudy() — lib/dal/sync-message-study.ts:135
    │
    ├─ Copies: title, slug, passage, speakerId, seriesId, dateFor, publishedAt
    ├─ Parses: passage → BibleBook enum
    ├─ Converts: studySections[].content (TipTap JSON) → questions/answers/transcript (HTML)
    │     - Section title contains "question" → questions
    │     - Section title contains "answer" → answers
    │     - Section title contains "transcript" → transcript
    │     - Unmatched sections → appended to questions with <h3> headers
    ├─ Fallback: if no transcript section, uses rawTranscript (TipTap JSON → HTML)
    ├─ Fetches: Bible text from API → bibleText (HTML)
    ├─ Sets: hasQuestions, hasAnswers, hasTranscript flags
    ├─ Ensures: unique slug for BibleStudy (appends -2, -3, etc.)
    │
    ▼
BibleStudy table (CREATE or UPDATE)
    │
    ├─ Also syncs attachments to BibleStudyAttachment table
    ├─ Promotes staging URLs to permanent R2 keys
    └─ Sets Content-Disposition headers for downloads
```

### Data Duplication in Sync

Every sync copies these fields from Message → BibleStudy:

| Field | Source (Message) | Destination (BibleStudy) |
|-------|-----------------|--------------------------|
| title | `message.title` | `study.title` |
| slug | `message.slug` | `study.slug` (with uniqueness suffix) |
| passage | `message.passage` | `study.passage` |
| speakerId | `message.speakerId` | `study.speakerId` |
| seriesId | `messageSeries[0].seriesId` | `study.seriesId` |
| dateFor | `message.dateFor` | `study.dateFor` + `study.datePosted` |
| publishedAt | `message.publishedAt` | `study.publishedAt` |
| bibleVersion | `message.bibleVersion` | Used for Bible API fetch only |
| churchId | `message.churchId` | `study.churchId` (on create) |

---

## 8. Website Rendering: Who Reads What

### Bible Study Pages (read from BibleStudy table)

| Page | Route | DAL Function | Fields Used |
|------|-------|-------------|-------------|
| Study list | `/bible-study` | `getBibleStudies()` | id, slug, title, passage, dateFor, series.name, book, hasQuestions, hasAnswers, hasTranscript |
| Study detail | `/bible-study/[slug]` | `getBibleStudyBySlug()` | All fields + speaker, series, attachments, relatedMessage.{bibleVersion, slug, videoUrl, youtubeId} |
| Section builder | resolve-section-data | `getBibleStudies()` | Same as list |

### Message Pages (read from Message table)

| Page | Route | DAL Function | Fields Used |
|------|-------|-------------|-------------|
| Messages list | `/messages` | `getMessages()` | id, slug, title, videoTitle, passage, dateFor, speaker, series, youtubeId, videoUrl, thumbnailUrl, duration, hasVideo |
| Message detail | `/messages/[slug]` | `getMessageBySlug()` | All fields + speaker, series, relatedStudy.{attachments, status, transcript} |
| Message spotlight | resolve-section-data | `getLatestMessage()` | title, dateFor, slug, speaker, series, hasVideo |

**Key observation:** The message detail page (`/messages/[slug]`) reads `relatedStudy.transcript` as a fallback for rawTranscript. This is the cross-table dependency.

---

## 9. CMS Editing: Who Writes What

**All CMS writes go to the Message table.** The CMS never writes directly to BibleStudy.

### Entry Form (`components/cms/messages/entry/entry-form.tsx`)

| Tab | Fields Edited | Stored On |
|-----|--------------|-----------|
| Details | title, dateFor, speakerId, passage, bibleVersion, seriesId, publishedAt | Message |
| Video | videoUrl, youtubeId, videoTitle, videoDescription, duration, audioUrl, rawTranscript, liveTranscript, transcriptSegments, thumbnailUrl | Message |
| Study | studySections[], attachments[] | Message.studySections (JSON), then synced to BibleStudy |
| Publish | hasVideo, hasStudy | Message |

---

## 10. Data Format Audit

### BibleStudy Content Columns — Format Breakdown

| Column | TipTap JSON | HTML | Total |
|--------|-------------|------|-------|
| `questions` | 1,150 (99.3%) | 8 (0.7%) | 1,158 |
| `answers` | 904 (99.8%) | 2 (0.2%) | 906 |
| `transcript` | 626 (100%) | 0 (0%) | 626 |

**The 8 HTML entries** in questions (and 2 in answers) were written by `syncMessageStudy()` after the recent bug fix. All other entries are raw TipTap JSON from the legacy MySQL → PostgreSQL migration.

### Why It Still Works

The website page calls `contentToHtml()` which auto-detects the format:
- If content starts with `{` → treats as TipTap JSON, converts to HTML
- Otherwise → returns as-is (assumes HTML)

This means every page load for legacy entries re-parses 40-80KB of TipTap JSON.

### Message Content Columns

| Column | Format | Notes |
|--------|--------|-------|
| `rawTranscript` | TipTap JSON (3 entries) | Source format, correct |
| `liveTranscript` | TipTap JSON (0 entries) | Source format, correct |
| `studySections` | JSONB array of {id, title, content: TipTap JSON} (8 entries) | Source format, correct |
| `transcriptSegments` | JSONB (7 entries, all JSON null) | Dead data |

---

## 11. Legacy / Dead Columns

| Column | Table | Status | Evidence |
|--------|-------|--------|----------|
| `Message.transcriptSegments` | Message | **DEAD** | 7 entries, all JSON `null`. Not referenced in sync, rendering, or any active code path. |
| `Message.attachments` (JSON) | Message | **DEPRECATED** | 8 entries. Replaced by `BibleStudyAttachment` relation table. Reads now come from the relation. |
| `BibleStudy.keyVerseRef` | BibleStudy | **UNUSED** | 0 entries populated. UI exists on Daily Bread only. |
| `BibleStudy.keyVerseText` | BibleStudy | **UNUSED** | 0 entries populated. |
| `BibleStudy.datePosted` | BibleStudy | **REDUNDANT** | Always identical to `dateFor`. Set by sync as `datePosted: dateForValue`. |

---

## 12. Problems with Current Architecture

### 1. Data Duplication

9 columns are duplicated between Message and BibleStudy (title, slug, passage, speakerId, dateFor, churchId, publishedAt, seriesId linkage, deletedAt). The sync function exists solely to keep them in sync.

### 2. Sync Complexity

`sync-message-study.ts` is 448 lines of sync logic including:
- Title matching for section extraction
- TipTap JSON → HTML conversion
- Bible API fetching
- Slug deduplication
- Attachment promotion from staging to permanent R2 keys
- Content-Disposition header setting
- BibleStudy create vs update branching

### 3. Format Inconsistency

BibleStudy content columns contain a mix of TipTap JSON (99%+, from migration) and HTML (< 1%, from recent sync). The website `contentToHtml()` handles both, but it means per-request parsing of 40-80KB JSON for legacy entries.

### 4. Two-Phase Writes

Every Message save that includes study content requires: (1) Message update, (2) BibleStudy upsert, (3) MessageSeries join update, (4) BibleStudyAttachment sync. Failure partway through leaves inconsistent state.

### 5. Orphan Data

24 BibleStudy rows exist without a linked Message. 15 Messages exist without a linked BibleStudy. These edge cases complicate every query that tries to join the two.

### 6. Series Linkage Mismatch

Message uses a join table (`MessageSeries`) for series. BibleStudy uses a direct FK (`seriesId`). The sync copies the first entry from the join table to the FK. This is redundant and error-prone.

### 7. Speaker Linkage Barely Works

BibleStudy has `speakerId` but only 3 out of 1,185 rows have it populated. The website falls back to `relatedMessage.speaker` anyway. The column is nearly dead on BibleStudy.

### 8. List Queries Fetch Full Records (the 80 MB problem)

`getBibleStudies()` uses `include: bibleStudyInclude` which returns all scalar fields including the 40-80KB text columns (questions, answers, transcript, bibleText) for every row in a list query. The list page only needs: id, slug, title, passage, dateFor, series, book, hasQuestions, hasAnswers, hasTranscript.

**Measured impact (2026-03-26):**

| What | Size |
|------|------|
| Current list query payload (all 1,185 rows, all columns) | **~80 MB** |
| Payload if text columns excluded via `omit` | **~152 KB** |
| BibleStudy heap size (main table rows) | 2 MB |
| BibleStudy TOAST size (out-of-line text) | 22 MB |
| Average text content per BibleStudy row | ~71 KB |

Average column sizes:
- `questions`: 6,397 bytes
- `answers`: 55,698 bytes (largest — many have detailed answer content)
- `transcript`: 41,755 bytes
- `bibleText`: 3,452 bytes

This means every bible study list page request transfers **500x more data than needed** from PostgreSQL to Node.js. On a server with 256 MB `--max-old-space-size`, this is the primary memory pressure source identified in Bug #7. The fix is straightforward: use Prisma `omit` on list queries to exclude text columns. This applies regardless of whether the tables are merged or kept separate.
