# Second-Pass Audit: Bible Study Migration

**Audit Date:** 2026-03-02
**Auditor:** Claude (automated code + database verification)

---

## Summary

| # | Item | Verdict |
|---|------|---------|
| 1 | Prisma Schema | **PASS** |
| 2 | Bible Text Import | **PASS** |
| 3 | Bible API Refactor | **PASS** |
| 4 | Auth Exemption | **PASS** |
| 5 | Bible Text Backfill | **PASS** |
| 6 | Study Detail View | **PASS** |
| 7 | Speakers | **PASS** |
| 8 | Content Migration | **PASS** |
| 9 | Video Import | **PASS** |
| 10 | File Download | **PASS** |
| 11 | Documentation | **PARTIAL** |
| 12 | Messages Context | **PASS** |

**Overall: 11 PASS, 1 PARTIAL**

---

## Detailed Findings

### 1. Prisma Schema -- PASS

**File:** `prisma/schema.prisma`

- **BibleVerse model:** Present at line 788. Fields: `id` (autoincrement Int), `book` (BibleBook enum), `chapter` (Int), `verse` (Int), `text` (Text), `version` (VarChar(10)). Has unique constraint on `[version, book, chapter, verse]` and two indexes. Mapped to `bible_verses` table.
- **BibleStudyAttachment.legacySourceId:** Present at line 764. Field is `Int?` (nullable integer), with an inline comment explaining it is temporary for file migration second-pass.
- **AttachmentType enum:** Present at line 773. Includes: `PDF`, `DOCX`, `DOC`, `RTF`, `IMAGE`, `OTHER`. Both DOC and RTF are present as required.

### 2. Bible Text Import -- PASS

**File:** `scripts/import-bible-text.mts`

- Script exists and is fully implemented (247 lines).
- Reads from `00_old_laubf_db_dump/laubf_bible_nword.sql`.
- Targets 11 translations via `IMPORT_VERSIONS` set: ESV, NIV, KJV, NLT, NASB, AMP, NIV(1984) (normalized to NIV1984), plus 3 Korean and 1 Spanish.
- **Database state verified:** 342,069 total BibleVerse rows across 11 versions:
  - NASB: 31,103
  - AMP: 31,103
  - NIV: 31,103
  - NIV1984: 31,102
  - RVR1960: 31,102
  - (Korean) 31,102 / 31,099 / 31,088
  - ESV: 31,086
  - NLT: 31,080
  - KJV: 31,101

### 3. Bible API Refactor -- PASS

**File:** `lib/bible-api.ts`

- Uses local DB query via `prisma.bibleVerse.findMany()` (line 126). No external API calls.
- Exports `LOCAL_VERSIONS` set with all 11 local versions.
- Imports `prisma` from `@/lib/db` and `parseBookFromPassage` from DAL -- all local.

**File:** `lib/bible-versions.ts`

- ESV, NIV, KJV, NLT, NASB, AMP all marked `apiAvailable: true` (lines 21-26).
- `API_AVAILABLE_VERSIONS` computed from filter (line 45).

**File:** `app/api/v1/bible/route.ts`

- Imports `fetchBibleText` and `LOCAL_VERSIONS` from `@/lib/bible-api`.
- Validates version against `LOCAL_VERSIONS.has(version)` (line 18).
- No external fetch calls anywhere in the file.

**File:** `lib/dal/sync-message-study.ts`

- No `getBibleApiTranslation` import or reference anywhere. Grep across entire `lib/` directory confirms zero matches for `getBibleApiTranslation`.
- Uses `fetchBibleText` from `@/lib/bible-api` (local DB query) at line 184.

### 4. Auth Exemption -- PASS

**File:** `lib/auth/edge-config.ts`

- Lines 36-39: The `authorized` callback checks `pathname.startsWith('/api/v1/bible')` and returns `true` (bypassing auth).
- Comment at line 36: "Bible text endpoint is used by the public website".

### 5. Bible Text Backfill -- PASS

**File:** `scripts/backfill-bible-text.mts`

- Script exists (133 lines).
- Finds BibleStudy records where `bibleText` is null and `passage` is not empty.
- Fetches ESV text from local BibleVerse table and updates each study.
- **Database state verified:** 1,407 out of 1,486 BibleStudies have `bibleText` populated (94.7%). The remaining 79 likely have unparseable passages or books not in the ESV dataset.

### 6. Study Detail View -- PASS

**File:** `components/website/study-detail/study-detail-view.tsx`

- **useEffect for fetching on mount (lines 249-269):** Present. Checks `if (study.bibleText || !study.passage) return` -- only fetches when bibleText is null AND passage exists.
- **Correct API endpoint (line 253-254):** Uses `/api/v1/bible?passage=${encodeURIComponent(study.passage)}&version=${encodeURIComponent(bibleVersion)}`.
- **Version switching (lines 219-245):** `handleVersionChange` callback fetches from same endpoint for different versions.
- **Fallback display (line 281):** `displayBibleText = fetchedBibleText || study.bibleText || ""` -- correctly prefers fetched text, falls back to server-rendered text, then empty.

### 7. Speakers -- PASS

**File:** `scripts/seed-speakers-and-series.mts`

- **23 speakers defined** (lines 38-62): William Larsen, John Kwon, David Park, Paul Lim, Robert Fishman, David Min, Paul Im, John Baik, Jason Koch, Moses Yoon, Troy Segale, Ron Ward, Augustine Kim, Juan Perez, Terry Lopez, Frank Holman, Daniel Shim, Peace Oh, Andrew Cuevas, Isiah Pulido, James Park, Timothy Cho, Joshua Lopez.
- **8 series defined** (lines 67-76): Sunday Service, Wednesday Bible Study, Conference, CBF, JBF, Events, Prayer Meeting, Special Studies.
- **Database state verified:** 23 speakers (via Speaker view), 23 Person records, 8 Series records.

### 8. Content Migration -- PASS

**File:** `scripts/migrate-legacy-content.mts`

- **Wipes existing data (lines 322-332):** Deletes BibleStudyAttachments, MessageSeries, unlinks Messages from BibleStudies, then deletes BibleStudies and Messages. Correct order to avoid FK violations.
- **Parses laubfmaterial (line 336-338):** `parseMaterials()` reads `laubf_laubfmaterial.sql`, parses INSERT statements with a state-machine SQL value parser.
- **Parses videolist (line 340-342):** `parseVideos()` reads `laubf_videolist.sql`.
- **Matches videos to materials (lines 368-377):** Keys on `title.toLowerCase() + "|" + mdate`. Tracks matched video keys.
- **Creates Messages + BibleStudies + Attachments (lines 380-507):**
  - Creates BibleStudy first if book is parseable and has question/note docs.
  - Creates BibleStudyAttachments for up to 4 file slots per material.
  - Creates Message with `relatedStudyId` link.
  - Links to speakers via `SPEAKER_CONSOLIDATION` map.
  - Links to series via `MTYPE_TO_SERIES` and `VIDEOTYPE_TO_SERIES` maps.
- **Database state verified:**
  - 1,803 Messages
  - 1,486 BibleStudies
  - 3,145 BibleStudyAttachments
  - 1,782 MessageSeries links

### 9. Video Import -- PASS

**File:** `scripts/migrate-legacy-content.mts`

- **YouTube ID parsing (lines 277-287):** `parseYoutubeId()` handles:
  - Full YouTube URLs: `youtu.be/`, `youtube.com/live/`, `youtube.com/watch?v=` (regex at line 280)
  - Short YouTube IDs: 11-character alphanumeric match (line 283)
  - Vimeo numeric IDs: Returns null for pure numeric strings (line 285)
- **Vimeo URL parsing (lines 289-292):** `getVimeoUrl()` detects 6+ digit numeric IDs and returns `https://vimeo.com/{id}`.
- **Matched videos (lines 403-411):** Videos matched to materials get `youtubeId` set, `hasVideo: true`, AND study data from the material record.
- **Unmatched videos (lines 513-564):** Created as standalone Message entries with `hasStudy: false`, video fields populated.
- **Database state verified:**
  - 260 messages with video
  - 1,504 messages with study
  - 67 messages with BOTH video + study (these are the matched ones)

### 10. File Download -- PASS

**Directory:** `00_old_laubf_db_dump/files/`

- Directory exists and contains files. Glob returned 100+ results (truncated). Files include `.doc` and `.docx` formats matching the legacy study materials (e.g., `1COR13-2018Q.docx`, `1Ch15a2007N.doc`).

### 11. Documentation -- PARTIAL

**Existing docs:**
- `docs/old-db-migration/01-old-database-analysis.md` -- EXISTS
- `docs/old-db-migration/02-bible-study-migration-plan.md` -- EXISTS
- `docs/old-db-migration/03-implementation-steps.md` -- EXISTS

**docs/bible-api-research.md deletion:**
- File does NOT exist on disk (confirmed via `ls`).
- Git shows it as `deleted:` in unstaged changes, meaning it was previously committed and then deleted from the working tree, but the deletion has not been committed yet.
- **Verdict:** Functionally deleted, but not committed as a deletion.

**CLAUDE.md note about 00_old_laubf_db_dump:**
- Present at line 49 of CLAUDE.md: `"00_old_laubf_db_dump/ -- SQL dump files from the legacy LA UBF website database (MySQL)..."` with full description.

**Why PARTIAL:** `docs/bible-api-research.md` deletion is not committed. The file is removed from disk but git still tracks it as a pending change.

### 12. Messages Context -- PASS

**File:** `lib/messages-context.tsx`

- Line 166: `fetch("/api/v1/messages?pageSize=5000&status=")`
- pageSize is set to 5000, not hardcoded to 100. The `status=` empty string parameter ensures all statuses are returned (not just published).
- This is sufficient for loading all messages for the CMS admin view (current dataset is 1,803 messages).

---

## Database State Summary (at audit time)

| Table | Row Count |
|-------|-----------|
| BibleVerse | 342,069 |
| Message | 1,803 |
| BibleStudy | 1,486 |
| BibleStudyAttachment | 3,145 |
| Person (speakers) | 23 |
| Series | 8 |
| MessageSeries | 1,782 |

| Metric | Count |
|--------|-------|
| BibleVerse versions | 11 |
| Messages with video | 260 |
| Messages with study | 1,504 |
| Messages with both video + study | 67 |
| BibleStudies with bibleText populated | 1,407 / 1,486 (94.7%) |

---

## Remaining Items

1. **Commit the `docs/bible-api-research.md` deletion** -- the file is deleted on disk but the deletion is unstaged.
2. **79 BibleStudies without bibleText** -- these likely have passages that could not be parsed or are not in the ESV dataset. Consider logging which passages failed during backfill.
3. **File migration to cloud storage** -- `BibleStudyAttachment.legacySourceId` is in place for a second-pass that uploads files from `00_old_laubf_db_dump/files/` to cloud storage and updates URLs.
