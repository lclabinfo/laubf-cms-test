# Implementation Steps — Bible Study Migration

> Created: 2026-03-02
> Status: READY FOR REVIEW
> Prereqs: Read `01-old-database-analysis.md` and `02-bible-study-migration-plan.md` first

## Overview

This document contains the concrete implementation steps. Work is split into 4 independent workstreams that can be partially parallelized.

---

## Workstream A: Local Bible Text Database

**Goal:** Replace external bible-api.com dependency with local PostgreSQL Bible text serving.

### A1. Add BibleVerse Prisma model

```prisma
model BibleVerse {
  id      Int       @id @default(autoincrement())
  book    BibleBook // Reuse existing 66-book enum
  chapter Int
  verse   Int
  text    String    @db.Text
  version String    @db.VarChar(10) // "ESV", "NIV", "KJV", etc.

  @@unique([version, book, chapter, verse]) // Prevents duplicates
  @@index([book, chapter, verse, version])  // Fast passage lookups
  @@index([version, book, chapter])         // Fast chapter fetches

  @@map("bible_verses")
}
```

Design notes:
- **No `churchId`** — Bible text is global/shared, not tenant-scoped
- **`version` as String** (not enum) — add new translations without schema migrations
- **~186K rows, ~32MB** — trivial for PostgreSQL

### A2. Add legacySourceId to BibleStudyAttachment

```prisma
model BibleStudyAttachment {
  // ... existing fields ...
  legacySourceId  Int?  // ⚠️ TEMPORARY: maps to laubfmaterial.no for file migration second-pass. Remove after files are migrated.
}
```

### A3. Run Prisma migration
```bash
npx prisma migrate dev --name add-bible-verse-and-legacy-source-id
```

### A4. Create bible_nword import script

**Recommended: Hybrid approach** (fastest)

Step 1 — Python parser (`scripts/parse-bible-dump.py`):
- Parse the 64MB SQL dump, extract INSERT values
- Import ALL translations (Bible text is a global service, not tenant-scoped)
- Skip only `NIV1` (duplicate of NIV 2011)
- Map `b_num` (101-166) → BibleBook enum values
- Output clean CSV: `book,chapter,verse,text,version`
- ~5 seconds to parse

Translations to import (11 total):
- English (6): ESV, NIV, KJV, NLT, NASB, AMP
- English legacy (1): NIV(1984) — keep for reference, normalize label to "NIV1984"
- Korean (3): 개역개정, 새번역, 바른성경
- Spanish (1): RVR1960
- Skip: NIV1 (duplicate of NIV 2011)

Step 2 — Load via psql:
```bash
psql $DATABASE_URL -c "\COPY bible_verses(book,chapter,verse,text,version) FROM 'bible_verses.csv' WITH CSV"
```
- ~3-5 seconds for ~342K rows

Alternative: TypeScript script with `prisma.bibleVerse.createMany()` in batches of 5000 (slower but doesn't require psql access).

Expected: ~342,000 rows (31,102 verses × 11 versions, ~64MB)

### A5. Refactor lib/bible-api.ts

Replace `fetchBibleText(passage, version)`:
- Parse passage string into book + chapter + verse range
- Query `prisma.bibleVerse.findMany({ where: { book, chapter, verse: { gte, lte }, version } })`
- Format response as HTML with `<sup>` verse numbers (same format as current)
- Return `{ html, reference }` matching existing interface

### A6. Update lib/bible-versions.ts

- Set `apiAvailable: true` for ESV, NIV, KJV, NASB, AMP, NLT
- Remove bible-api.com specific logic
- `API_AVAILABLE_VERSIONS` now returns all 6 local versions

### A7. Update app/api/v1/bible/route.ts

- Remove external fetch, use local DB query
- Support all 6 English versions

### A8. Test bible version switching on study detail page

---

## Workstream B: Speaker & Series Setup

**Goal:** Clean slate for People, create speakers and series from migration data.

### B1. Delete all existing People records

Via Prisma or API — clear `Person`, `PersonRoleAssignment` tables for the church.

### B2. Create canonical speakers

24 speakers (see migration plan Section 5). For each:
1. Create `Person` record (firstName, lastName, slug, membershipStatus=VISITOR)
2. Assign "Speaker" role via `PersonRoleAssignment`

Speaker consolidation rules:
- "William" / "William Larsen" → Person("William", "Larsen")
- "Paul" / "Paul Lim" / "Dr. Paul Lim" → Person("Paul", "Lim")
- "Robert" / "Robert Fishman" → Person("Robert", "Fishman")
- "John" / "John Kwon" → Person("John", "Kwon")
- All other names: split on last space for first/last

### B3. Create Series records

From migration plan Section 6:
- "Sunday Service"
- "Wednesday Bible Study"
- "Conference"
- "CBF (Children's Bible Fellowship)"
- "JBF (Junior Bible Fellowship)"
- "Events"
- "Prayer Meeting"
- "Special Studies"

---

## Workstream C: Content Migration (laubfmaterial + videolist → Message + BibleStudy)

**Goal:** Import English sermon content into CMS.

**Depends on:** Workstream B (speakers + series must exist first)

### C1. Parse laubfmaterial SQL dump

File: `scripts/migrate-legacy-content.ts`

Parse `00_old_laubf_db_dump/laubf_laubfmaterial.sql`:
1. Extract CREATE TABLE for column positions
2. Parse INSERT VALUES (positional)
3. Build array of LaubfMaterialRecord objects

### C2. Parse videolist SQL dump

Same script, parse `laubf_videolist.sql`:
1. Build array of VideoRecord objects
2. Normalize YouTube IDs from various formats:
   - Vimeo numeric: store as-is in `videoUrl` (prefix with `https://vimeo.com/`)
   - YouTube short ID: use directly as `youtubeId`
   - YouTube URL: extract video ID → `youtubeId`
   - YouTube live URL: extract video ID → `youtubeId`

### C3. Match videolist to laubfmaterial

For each video, find matching laubfmaterial by:
- Exact title match (case-insensitive) + same date
- If no exact match: fuzzy title match (Levenshtein) + same week
- Track matched and unmatched entries

### C4. Insert Messages from laubfmaterial

For each laubfmaterial entry:
1. Resolve speaker (if speaker data available from matched video)
2. Resolve series from `mtype`
3. Map `bcode` → BibleBook enum (skip if bcode=0 and passage empty)
4. Create `Message`:
   - title, passage (normalize `~` → `-`), dateFor, slug
   - status=PUBLISHED, publishedAt=dateFor
   - hasStudy=true (if has Question/Note documents)
   - hasVideo=true (if matched to a video)
   - youtubeId (from matched video)
   - speakerId (from matched video's messenger field)
5. Create `BibleStudy` linked via relatedStudyId:
   - Same title, passage, book, dates
   - hasQuestions=true if doctype includes "Question"
6. Create `BibleStudyAttachment` for each non-null file slot:
   - name=filename, url=fileurl (old path for now)
   - type=DOCX (or PDF based on extension)
   - legacySourceId=laubfmaterial.no
7. Link Message to Series via MessageSeries

### C5. Insert Messages from unmatched videos

For videos with no laubfmaterial match:
1. Create `Message` with video data only
2. hasVideo=true, hasStudy=false
3. Resolve speaker from `messenger`
4. Assign to Series based on `videotype`

### C6. Verification queries

```sql
-- Check counts
SELECT COUNT(*) FROM "Message" WHERE "churchId" = ?;
SELECT COUNT(*) FROM "BibleStudy" WHERE "churchId" = ?;
SELECT COUNT(*) FROM "BibleStudyAttachment";
SELECT COUNT(*) FROM "MessageSeries";

-- Check linked entries
SELECT COUNT(*) FROM "Message" WHERE "relatedStudyId" IS NOT NULL;
SELECT COUNT(*) FROM "Message" WHERE "hasVideo" = true;
```

---

## Workstream D: File Download & Storage Setup

**Goal:** Download DOCX/DOC files from old server and set up cloud storage.

### File Accessibility Status (CONFIRMED LIVE)
- **All 3,266 files are accessible** at `https://laubf.org/documentation/bible/{filename}`
- File types: .doc (1,910 files, 58%), .docx (1,268, 39%), .rtf (79), .pdf (3), other (6)
- Old server is Laravel on nginx/Ubuntu — files served from `public/documentation/`
- **Action urgently needed** — download files before old server is retired

### D1. Download all files to local archive first

Script: `scripts/download-legacy-files.ts`
1. Parse `laubfmaterial` SQL dump for all fileurl1-4 values
2. For each unique URL: `fetch https://laubf.org{url}` → save to `00_old_laubf_db_dump/files/{filename}`
3. Log successes and 404 failures
4. Expected: ~3,266 files, mostly 5KB-50KB DOCX/DOC
5. **Never modify original dump files** — only read/copy

### D2. Set up Cloudflare R2 bucket

Recommended storage: **Cloudflare R2** (~$7/month at 200-church scale, zero egress)

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Setup:
- Create R2 bucket in Cloudflare dashboard
- Configure custom domain (e.g., `files.lclab.io`)
- Set up CORS for Next.js app
- Add env vars: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`

Multi-tenant key structure:
```
churches/{churchId}/studies/{bibleStudyId}/{filename}
churches/{churchId}/media/{year}/{month}/{filename}
```

### D3. Create file upload/download infrastructure

- `lib/storage/r2.ts` — R2 client singleton, presigned URL generation
- `POST /api/v1/files/upload` — generate presigned PUT URL for client-side upload
- File metadata tracked in `BibleStudyAttachment` / `MediaAsset` Prisma models

### D4. Upload downloaded files to R2

Script: `scripts/upload-legacy-files-to-r2.ts`
1. Read downloaded files from local archive
2. Upload to R2 at `churches/{churchId}/studies/{attachmentId}/{filename}`
3. Update `BibleStudyAttachment.url` with new R2 URL
4. Log results

### D5. Clean up

After file migration complete:
- Remove `legacySourceId` column via Prisma migration
- Remove migration scripts
- Verify all attachments resolve to R2 URLs

---

## Execution Order

```
Workstream A (Bible text DB)     ─── can start immediately
Workstream B (Speakers/Series)   ─── can start immediately
Workstream C (Content migration) ─── depends on B
Workstream D (File migration)    ─── deferred, depends on R2 setup + C
```

A and B can run in parallel. C starts after B completes. D is deferred.

## TipTap Note

**Correction from research:** The `tiptapJsonToHtml()` in `lib/tiptap.ts` actually DOES use TipTap's official `generateHTML()` from `@tiptap/html` with shared extensions from `getExtensions()`. It is NOT a manual converter. Extensions supported: StarterKit (headings 1-4, bold, italic, strike, code, blockquote, lists, hr), Underline, TextAlign, Link, Image, TextStyle+Color.

**No table support** — `@tiptap/extension-table` is not installed. Tables from DOCX imports via mammoth will be silently dropped by TipTap. No table CSS exists in `.study-content` on the public website either.

For migration purposes: imported content stored as HTML strings in BibleStudy fields renders correctly via `dangerouslySetInnerHTML`. The TipTap converter is only used for new content created in the CMS editor.
