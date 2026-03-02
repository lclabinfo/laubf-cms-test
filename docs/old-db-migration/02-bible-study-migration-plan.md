# Bible Study Data Migration Plan

> Created: 2026-03-02
> Status: DRAFT — Awaiting review before implementation

## 1. Executive Summary

The legacy LA UBF database contains **~5,000 content entries** across 8 tables. The most important are:
- **`laubfmaterial`** (1,637 entries) — The primary study materials library with structured bible passage data and DOCX file attachments (questions, notes, manuscripts). Spans 26 years (2000-2026).
- **`videolist`** (315 entries) — Sermon video catalog with YouTube links, speakers, and passages.
- **Korean board tables** (~2,838 entries) — BibleStudy Q&A worksheets, Bible66 verse-by-verse expositions, BibleForest book overviews.

### Migration scope (this plan):

**Phase 1 — High Priority (English, structured):**
- ✅ `laubfmaterial` → `Message` + `BibleStudy` + `BibleStudyAttachment` (1,637 records with document links)
- ✅ `videolist` → `Message` model (315 video records, joined to laubfmaterial by title+date+passage)

**Phase 2 — Medium Priority (Korean, HTML content):**
- ✅ `BibleStudy_list` → `BibleStudy` model (~1,232 Korean Q&A worksheets)
- ✅ `Bible66_list` → `BibleStudy` model (~1,409 Korean verse-by-verse exposition)
- ✅ `BibleForest_list` → `BibleStudy` model (~197 Korean book overviews)

**Deferred / Skipped:**
- ⏭️ `IBSIntro_list` / `IBSMessage_list` → Deferred (5 total entries)
- ⏭️ `messengers` → Deferred (schedule planner, 247 entries)
- ❌ `bible_nword` / `bible_enlog2` → NOT migrated (replaced by bible API)
- ❌ `_cnt` / `_ad` / `_re` tables → NOT migrated (analytics/config/comments, all empty)
- ❌ `message_list` → NOT migrated (empty table)

## 2. Current Schema (New System)

### Message Model
```prisma
model Message {
  id               String        @id @default(uuid())
  churchId         String
  slug             String
  title            String
  passage          String?       // e.g., "John 3:16-21"
  bibleVersion     String?       @default("ESV")
  speakerId        String?       // FK to Speaker
  dateFor          DateTime      @db.Date
  description      String?
  videoUrl         String?
  youtubeId        String?
  thumbnailUrl     String?
  duration         String?
  audioUrl         String?
  rawTranscript    String?
  liveTranscript   String?
  transcriptSegments Json?
  studySections    Json?
  attachments      Json?
  hasVideo         Boolean       @default(false)
  hasStudy         Boolean       @default(false)
  status           ContentStatus @default(DRAFT)
  publishedAt      DateTime?
  relatedStudyId   String?       // FK to BibleStudy
  viewCount        Int           @default(0)
  // ... timestamps
}
```

### BibleStudy Model
```prisma
model BibleStudy {
  id               String        @id @default(uuid())
  churchId         String
  slug             String
  title            String
  book             BibleBook     // Enum: GENESIS, EXODUS, etc.
  passage          String        // e.g., "Genesis 1:1-25"
  datePosted       DateTime      @db.Date
  dateFor          DateTime      @db.Date
  seriesId         String?       // FK to Series
  speakerId        String?       // FK to Speaker
  questions        String?
  answers          String?
  transcript       String?
  bibleText        String?
  keyVerseRef      String?
  keyVerseText     String?
  hasQuestions      Boolean       @default(false)
  hasAnswers       Boolean       @default(false)
  hasTranscript    Boolean       @default(false)
  relatedMessage   Message?      // via Message.relatedStudyId
  status           ContentStatus @default(DRAFT)
  publishedAt      DateTime?
  // ... timestamps
}
```

## 3. Field Mapping: Old → New

### laubfmaterial → Message + BibleStudy + BibleStudyAttachment

This is the **primary migration source**. Each `laubfmaterial` row becomes a `Message` record, and its document attachments become `BibleStudyAttachment` records linked to an auto-created `BibleStudy`.

| Old Field | New Field(s) | Transformation |
|-----------|-------------|----------------|
| `no` | — | Used for `legacyId` if enabled |
| `title` | `Message.title`, `BibleStudy.title` | Direct copy |
| `passage` | `Message.passage`, `BibleStudy.passage` | Normalize: replace `~` with `-` |
| `bcode` | `BibleStudy.book` | Map 101-166 → BibleBook enum |
| `bname` | — | Validation only (redundant with bcode) |
| `from_chapter`/`to_chapter` | — | Captured in passage string |
| `mdate` | `Message.dateFor`, `BibleStudy.dateFor/datePosted` | Parse "YYYY/MM/DD" → Date |
| `mtype` | Series assignment | Map: Sunday→"Sunday Messages", CBF→"CBF", etc. |
| `doctype1-4` | `BibleStudyAttachment.type` + `name` | Question→PDF/DOCX, Note→PDF/DOCX, etc. |
| `filename1-4` | `BibleStudyAttachment.name` | Direct copy |
| `fileurl1-4` | `BibleStudyAttachment.url` | Convert from `/documentation/bible/...` to new storage path |
| — | `Message.slug` | Generate from title + date |
| — | `Message.status` | `PUBLISHED` |
| — | `Message.hasStudy` | `true` (if has question/note docs) |
| — | `BibleStudy.hasQuestions` | `true` if doctype includes "Question" |
| — | `BibleStudy.hasAnswers` | `false` (answers not separate in old system) |

**Joining with videolist:** After inserting laubfmaterial records as Messages, match with videolist by `title + mdate + passage` to attach YouTube video IDs to the same Message record (set `youtubeId`, `hasVideo=true`).

### videolist → Message

| Old Field | New Field | Transformation |
|-----------|-----------|----------------|
| `no` | — | Not migrated (new UUID generated) |
| `title` | `title` | Direct copy |
| `passage` | `passage` | Direct copy (e.g., "Joshua 23:1~16" → "Joshua 23:1-16", replace `~` with `-`) |
| `bname` | — | Used to validate passage, not stored separately |
| `from_chapter`/`to_chapter` | — | Captured in `passage` string |
| `mdate` | `dateFor` | Parse "YYYY/MM/DD" → Date |
| `messenger` | `speakerId` | Lookup/create Speaker by name |
| `videonum` | `youtubeId` / `videoUrl` | Parse: if Vimeo ID → `videoUrl`, if YouTube ID/URL → `youtubeId` |
| `videotype` | — | Could map to Series (Sunday/Wednesday/Events) |
| — | `slug` | Generate from title: slugify(title) |
| — | `status` | `PUBLISHED` |
| — | `hasVideo` | `true` |
| — | `bibleVersion` | `null` (unknown) |
| `no` | `viewCount` | 0 (or could use `hit` from corresponding _cnt table) |

### BibleStudy/BibleForest/Bible66 `_list` → BibleStudy

| Old Field | New Field | Transformation |
|-----------|-----------|----------------|
| `no` | — | Not migrated (new UUID generated) |
| `subject` | `title` | Direct copy |
| `tbody` | `transcript` | Store full HTML as transcript content |
| `tbody` | `questions` | Extract from HTML if Q&A sections found (regex) |
| `tbody` | `answers` | Extract from HTML if Q&A sections found (regex) |
| `tbody` | `keyVerseRef` / `keyVerseText` | Extract "요절/" pattern from HTML |
| `tbody` | `book` / `passage` | Extract bible reference from HTML title section |
| `wdate` | `datePosted` / `dateFor` | Convert Unix timestamp → Date |
| `name` / `mnick` | `speakerId` | Lookup/create Speaker by name |
| `board_name` | — | Used to determine Series grouping |
| `hit` | — | Not migrated (analytics) |
| `category` | — | Could map to Series or tags |
| `ufile1`/`ufile2` | `attachments` | Convert to BibleStudyAttachment if files exist |
| `ulink1`/`ulink2` | `attachments` | Convert to BibleStudyAttachment if links exist |
| — | `slug` | Generate from title + date |
| — | `status` | `PUBLISHED` |
| — | `bibleVersion` | Not in old data |

### Content Extraction from `tbody` HTML

The old system stores ALL content in a single HTML blob (`tbody`). Key patterns to extract:

```
Pattern: <h4>{title}</h4>
Pattern: <h2 align=center>{theme/subtitle}</h2>
Pattern: {BookName} {Chapter}:{VerseStart}-{VerseEnd}
Pattern: 요절/{BookName} {Chapter}:{Verse} "{key verse text}"
Pattern: <h3>{section_number}. {section_title}</h3>
```

**Extraction strategy:**
1. Parse book/chapter/verse from the first lines of content
2. Parse key verse from "요절/" pattern
3. The rest of the HTML becomes `transcript` content
4. The `subject` field becomes `title`

## 4. Gap Analysis: Missing Fields in Current Schema

### Fields in old data NOT in current schema:

| Old Field | Description | Recommendation |
|-----------|-------------|----------------|
| `board_name` | Content category (BibleStudy/BibleForest/Bible66) | **QUESTION:** Should we add a `category` or `studyType` field to BibleStudy? Or use Series to group them? |
| `category` (numeric) | Sub-category within a board | Map to Series if meaningful |
| `tbody` (full HTML) | Rich formatted content | Current `transcript` is `@db.Text` — fits. But original HTML includes formatting, tables, etc. |
| `name`/`id`/`mnick` | Author identity | Current schema has `speakerId` FK — need to create Speaker records |
| `wmail` | Author email | Not in BibleStudy model (but in Person model) |
| `ufile1`/`ufile2` | Attached files | Current `BibleStudyAttachment` model handles this, but files may no longer be accessible |
| `ulink1`/`ulink2` | External links | Not in current schema. Could use `attachments` JSON or BibleStudyAttachment |
| `hit` | View count | Not in BibleStudy model (Message has `viewCount`) |
| `ip` | Author IP | Not needed |
| `comment`/`comment2` | Comment counts | No comment system in new CMS |
| `vote` | Vote count | No voting in new CMS |
| `secret` | Secret/private flag | Not in current schema |
| Korean book names | 창세기, 출애굽기, etc. | Current schema uses English BibleBook enum. Need Korean→English mapping |
| `videotype` | Sunday/Wednesday/Events | Not in Message model. Could use Series |

### Recommended Schema Changes

> **QUESTION FOR USER:** Please review these proposed changes:

#### 4a. Add `studyType` enum to BibleStudy?

The old data has 3 distinct bible study categories. Options:
- **Option A:** Add `studyType` enum (`WEEKLY_STUDY`, `BOOK_OVERVIEW`, `VERSE_COMMENTARY`, `IBS`) to BibleStudy model
- **Option B:** Use the existing `Series` model to group them (create "Bible Study", "Bible Forest", "Bible 66" series)
- **Option C:** Don't differentiate — treat all as generic bible studies

#### 4b. Add `contentHtml` field to BibleStudy?

The old content is rich HTML with tables, formatting, etc. Current schema has:
- `transcript` (plain text)
- `questions` / `answers` (plain text)

Options:
- **Option A:** Add `contentHtml` Text field to preserve original HTML formatting
- **Option B:** Store HTML in `transcript` field (repurpose it)
- **Option C:** Strip HTML to plain text during migration

#### 4c. Add `language` field?

Most old content is Korean. Current schema doesn't have a language field.
- **Option A:** Add `language` field to BibleStudy (e.g., 'ko', 'en')
- **Option B:** Don't add — assume content language from church context

#### 4d. Add `legacyId` field for traceability?

- **Option A:** Add `legacyId` Int field to BibleStudy and Message for mapping back to old `no` values
- **Option B:** Don't add — one-time migration, no ongoing sync needed

#### 4e. Video message type?

The `videotype` field (Sunday/Wednesday/Events) is useful categorization.
- **Option A:** Create Series records for "Sunday Messages", "Wednesday Messages", "Events" and link videos to them
- **Option B:** Add a `messageType` field to Message model

## 5. Bible Book Name Mapping

The old system uses a numeric book numbering system (101-166) with Korean names. We need to map to our `BibleBook` enum.

```
101=GENESIS (창세기)    140=MATTHEW (마태복음)
102=EXODUS (출애굽기)   141=MARK (마가복음)
103=LEVITICUS (레위기)  142=LUKE (누가복음)
104=NUMBERS (민수기)    143=JOHN (요한복음)
105=DEUTERONOMY (신명기) 144=ACTS (사도행전)
...                     ...
139=MALACHI (말라기)    166=REVELATION (요한계시록)
```

The mapping table is already available in `bible_names` (198 rows, Korean+English+Spanish). We'll build a lookup map from Korean book names → BibleBook enum values.

## 6. Speaker Resolution

Old data has author names in `name`/`mnick`/`messenger` fields. These need to map to the `Speaker` model.

### Known speakers from videolist:
- William Larsen (most frequent)
- John Kwon
- David Park
- Paul Lim / Dr. Paul Lim
- Robert Fishman / Robert
- David Min
- Troy Segale
- Augustine Kim
- Frank Holman
- Terry Lopez
- Daniel Shim
- Juan Perez
- Peace Oh
- Jason Koch
- John Baik
- Moses Yoon
- Ron Ward
- James Park
- Timothy Cho
- Joshua Lopez
- Isiah Pulido
- Andrew Cuevas

### Known authors from Korean bible studies:
- 전요한 (John Jeon)
- john66
- joseph / Joseph3
- Prayer (username)
- bible (username)
- Various others

**Strategy:** Create Speaker records for each unique name. For Korean studies, create speakers from the `name` field. For videos, use the `messenger` field. Deduplicate where possible.

## 7. Migration Execution Plan

### Phase 0: Preparation (no data changes)
1. [ ] Review and approve schema changes (Section 4 questions)
2. [ ] Create Prisma migration for any approved schema changes
3. [ ] Build bible book code mapping: `bcode` (101-166) → `BibleBook` enum
4. [ ] Build Korean→English bible book name mapping (from `bible_names` table)
5. [ ] Build speaker name deduplication mapping (normalize "William" → "William Larsen" etc.)
6. [ ] Verify accessibility of old file URLs (`/documentation/bible/*.docx`)

### Phase 1: laubfmaterial → Message + BibleStudy (PRIMARY, 1,637 records)
This is the richest data source with structured fields AND document attachments.
1. [ ] Parse `laubfmaterial` SQL dump
2. [ ] Create/resolve Speaker records (deduplicate names)
3. [ ] Create Series records from `mtype`: "Sunday Messages", "CBF Bible Study", "JBF Bible Study", "Conference Messages", "Prayer Meeting", "Wednesday Study", etc.
4. [ ] For each `laubfmaterial` entry:
   a. Create `Message` record: title, passage (normalized), dateFor, status=PUBLISHED
   b. Map `bcode` → BibleBook enum
   c. Create `BibleStudy` record linked via `Message.relatedStudyId`
   d. Set `hasStudy=true`, `hasQuestions` based on doctype slots
   e. Create `BibleStudyAttachment` records for each non-null filename/fileurl pair
   f. Assign to appropriate Series based on `mtype`
   g. Generate unique slugs
5. [ ] Verify: 1,637 Message + BibleStudy pairs created

### Phase 2: videolist → Merge into existing Messages (315 records)
Join video data into Messages created in Phase 1.
1. [ ] Parse `videolist` SQL dump
2. [ ] For each video entry:
   a. Parse `videonum` → YouTube ID (handle Vimeo IDs, YouTube URLs, YouTube live URLs)
   b. Match to existing Message by title + date + passage (fuzzy matching)
   c. If match found: update Message with `youtubeId`, `videoUrl`, `hasVideo=true`
   d. If no match: create new Message with video data only
3. [ ] Resolve speaker names from `messenger` field → Speaker records
4. [ ] Create "Sunday Messages", "Wednesday Messages", "Events" Series if not already created
5. [ ] Verify: ~315 Messages now have video data

### Phase 3: Korean Board Tables → BibleStudy (2,838 records)
Import Korean study content as standalone BibleStudy records (no Message link).
1. [ ] Parse `BibleStudy_list` SQL dump (~1,232 Q&A worksheets)
   - Use `user_add2` for bible book code, `user_add3` for chapter
   - Store `tbody` HTML in transcript or contentHtml field
   - Extract key verse from "요절/" pattern
2. [ ] Parse `Bible66_list` SQL dump (~1,409 verse-by-verse expositions)
   - Use `user_add2` for bible book code, `user_add3` for chapter, `user_add1` for part number
   - Store full exposition HTML
3. [ ] Parse `BibleForest_list` SQL dump (~197 book overviews)
   - Use `user_add4`/`user_add5`/`user_add6` for chapter ranges
   - Store overview HTML
4. [ ] Create Series: "성경공부 (Bible Study)", "성경66권 강해 (Bible 66)", "성경숲 (Bible Forest)"
5. [ ] Generate unique slugs, set status=PUBLISHED
6. [ ] Verify: ~2,838 BibleStudy records created

### Phase 4: Verification & Cleanup
1. [ ] Run full migration script in dev environment
2. [ ] Verify total counts:
   - ~1,637 Messages from laubfmaterial
   - ~315 with video data from videolist
   - ~4,475 total BibleStudy records (1,637 linked + 2,838 standalone)
3. [ ] Spot-check 10 random entries per source for data accuracy
4. [ ] Verify CMS Messages page displays migrated content
5. [ ] Verify public website study detail pages render correctly
6. [ ] Check for encoding issues (Korean text, HTML entities)
7. [ ] Verify BibleStudyAttachment URLs resolve correctly

## 8. Technical Implementation

### Migration Script Approach

**Recommended:** TypeScript migration script (similar to `prisma/seed.mts`)

```
scripts/migrate-legacy-bible-data.ts
```

The script will:
1. Read SQL dump files and parse INSERT statements
2. Build lookup tables (book names, speakers)
3. Use Prisma client to insert records in batches
4. Handle duplicates gracefully (upsert or skip)
5. Log progress and errors

### SQL Parsing Strategy

The dump files contain single-line INSERT statements with all records. Strategy:
1. Extract the INSERT VALUES portion
2. Split on `),( ` pattern (careful with escaped content)
3. Parse each record's fields by position
4. Handle escaped quotes and special characters in HTML content

### Alternative: Direct MySQL → PostgreSQL

If parsing SQL dumps proves too complex (due to HTML escaping), we could:
1. Load dumps into a temporary MySQL database
2. Query MySQL directly from the migration script
3. Transform and insert into PostgreSQL via Prisma

## 9. Open Questions for User

### Schema Questions
1. **Content categorization:** Should we add a `studyType` field to BibleStudy, use Series, or treat all as generic? (Section 4a)
2. **HTML preservation:** Should we add a `contentHtml` field, store in `transcript`, or strip to plain text? (Section 4b) — The Korean board content is rich HTML with tables, footnotes, and structured formatting.
3. **Language field:** Add explicit `language` field? (Section 4c) — ~2,838 entries are Korean, ~1,952 are English.
4. **Legacy ID tracking:** Add `legacyId` for traceability? (Section 4d)
5. **Video types → Series:** Create Sunday/Wednesday/Events series from videolist + laubfmaterial mtypes? (Section 4e)

### Data Questions
6. **File attachments:** The `laubfmaterial` table has 1,637 rows with DOCX file references at `/documentation/bible/`. Are these files still accessible on the old server? Should we download and re-host them? This is the most valuable structured data.
7. **laubfmaterial scope:** Should we import ALL 1,637 laubfmaterial entries (including CBF, JBF, Conference, Prayer meeting materials), or focus only on Sunday messages (~1,182)?
8. **Korean content display:** The CMS is English-oriented. How should ~2,838 Korean-language bible studies appear? Separate section? Mixed with English? Different Series?
9. **Reply/comment data:** All `_re` tables are empty. Confirmed skip.
10. **messengers table:** The weekly schedule planner (247 entries) — skip or use for speaker/date validation?

### Priority Questions
11. **Phase 1 scope:** Start with `laubfmaterial` (1,637 structured records with documents) + `videolist` (315 video records)? This gives us the richest, most display-ready content.
12. **Phase 2 timing:** Import Korean board tables in same release or defer to a later sprint?

## 10. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| HTML parsing errors | Data corruption | Test parser on sample data first; manual review |
| Korean encoding issues | Garbled text | Ensure UTF-8 throughout pipeline |
| Duplicate speakers | Messy speaker list | Build dedup mapping before migration |
| Missing bible passages | Can't set BibleBook enum | Default to a "UNCATEGORIZED" approach or require manual fix |
| Large data volume (~3,200 records) | Slow migration | Batch inserts, progress logging |
| Old file URLs broken | Missing attachments | Pre-check URL accessibility |
