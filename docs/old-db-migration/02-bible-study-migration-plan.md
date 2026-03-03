# Bible Study Data Migration Plan

> Created: 2026-03-02
> Updated: 2026-03-02 (Scoped to English-only content)
> Status: DRAFT — Research in progress

## 1. Executive Summary

Migrate English-language content from the legacy LA UBF database into the new CMS. Korean-only content (BibleStudy, BibleForest, Bible66 boards) is **excluded** from migration.

### Migration scope:

**Content Migration:**
- ✅ `laubfmaterial` → `Message` + `BibleStudy` + `BibleStudyAttachment` (1,637 records with DOCX attachments)
- ✅ `videolist` → `Message` (315 video records, joined to laubfmaterial by title+date+passage)

**Infrastructure Migration:**
- ✅ `bible_nword` → New `BibleVerse` model (~342K rows, 11 translations: 7 English + 3 Korean + 1 Spanish)
- ✅ `bible_names` / `bible_ename` → Used as reference for book code mapping during migration

**Speaker Setup:**
- ✅ Delete all existing People → Replace with deduplicated speakers from migration data

**Excluded (Korean-only):**
- ❌ `BibleStudy_list` (~1,232 Korean Q&A worksheets) — Korean only
- ❌ `Bible66_list` (~1,409 Korean exposition) — Korean only
- ❌ `BibleForest_list` (~197 Korean overviews) — Korean only
- ❌ `IBSIntro_list` / `IBSMessage_list` — Minimal content (5 entries)
- ❌ `_cnt` / `_ad` / `_re` / `message_list` — Empty or admin config

**Excluded (replaced by local DB):**
- ❌ External bible-api.com dependency → Replaced by local `bible_nword` data

## 2. Decisions Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | No `studyType` field | Use Series model to categorize (Sunday Service, etc.) |
| 2 | No Korean content migration | English-only scope |
| 3 | No `language` field | All migrated content is English |
| 4 | Temporary `legacySourceId` on BibleStudyAttachment | For second-pass file import if files can't be migrated now |
| 5 | Series from `mtype` / `videotype` | Sunday Service, Wednesday Study, Events, Conference, CBF, JBF, etc. |
| 6 | Replace bible-api.com with local DB | Import `bible_nword` English translations into PostgreSQL |
| 7 | Speaker consolidation | Wipe existing People, import deduplicated names from videolist |
| 8 | File storage TBD | Researching scalable solution for 200+ churches |

## 3. Field Mapping: Old → New

### laubfmaterial → Message + BibleStudy + BibleStudyAttachment

| Old Field | New Field(s) | Transformation |
|-----------|-------------|----------------|
| `title` | `Message.title`, `BibleStudy.title` | Direct copy |
| `passage` | `Message.passage`, `BibleStudy.passage` | Normalize: replace `~` with `-` |
| `bcode` | `BibleStudy.book` | Map 101-166 → BibleBook enum |
| `mdate` | `Message.dateFor`, `BibleStudy.dateFor/datePosted` | Parse "YYYY/MM/DD" → Date |
| `mtype` | Series assignment | Sunday→"Sunday Service", etc. |
| `doctype1-4` + `filename1-4` + `fileurl1-4` | `BibleStudyAttachment` records | One attachment per non-null slot |
| — | `Message.slug` | Generate from title + date |
| — | `Message.status` | `PUBLISHED` |
| — | `Message.hasStudy` | `true` if has Question/Note docs |

### videolist → Merge into Message records

| Old Field | New Field | Transformation |
|-----------|-----------|----------------|
| `title` | — | Used for matching to laubfmaterial Message |
| `videonum` | `Message.youtubeId` | Parse YouTube ID from various URL formats |
| `messenger` | `Message.speakerId` | Lookup Speaker by consolidated name |
| `mdate` | — | Used for matching |
| `videotype` | Series | Sunday/Wednesday/Events |
| — | `Message.hasVideo` | `true` |

### bible_nword → BibleVerse (new model)

| Old Field | New Field | Transformation |
|-----------|-----------|----------------|
| `b_num` | `book` | Map 101-166 → BibleBook enum |
| `chapter` | `chapter` | Direct copy |
| `verse` | `verse` | Direct copy |
| `word` | `text` | Direct copy |
| `bversion` | `version` | Normalize version code (ESV, NIV, KJV, etc.) |

Only import English translations: ESV, NIV, KJV, NASB, AMP, NLT (skip Korean and Spanish).

## 4. Bible Book Code Mapping

```
101=GENESIS         140=MATTHEW
102=EXODUS          141=MARK
103=LEVITICUS       142=LUKE
104=NUMBERS         143=JOHN
105=DEUTERONOMY     144=ACTS
106=JOSHUA          145=ROMANS
107=JUDGES          146=FIRST_CORINTHIANS
108=RUTH            147=SECOND_CORINTHIANS
109=FIRST_SAMUEL    148=GALATIANS
110=SECOND_SAMUEL   149=EPHESIANS
111=FIRST_KINGS     150=PHILIPPIANS
112=SECOND_KINGS    151=COLOSSIANS
113=FIRST_CHRONICLES 152=FIRST_THESSALONIANS
114=SECOND_CHRONICLES 153=SECOND_THESSALONIANS
115=EZRA            154=FIRST_TIMOTHY
116=NEHEMIAH        155=SECOND_TIMOTHY
117=ESTHER          156=TITUS
118=JOB             157=PHILEMON
119=PSALMS          158=HEBREWS
120=PROVERBS        159=JAMES
121=ECCLESIASTES    160=FIRST_PETER
122=SONG_OF_SOLOMON 161=SECOND_PETER
123=ISAIAH          162=FIRST_JOHN
124=JEREMIAH        163=SECOND_JOHN
125=LAMENTATIONS    164=THIRD_JOHN
126=EZEKIEL         165=JUDE
127=DANIEL          166=REVELATION
128=HOSEA
129=JOEL
130=AMOS
131=OBADIAH
132=JONAH
133=MICAH
134=NAHUM
135=HABAKKUK
136=ZEPHANIAH
137=HAGGAI
138=ZECHARIAH
139=MALACHI
```

## 5. Speaker Consolidation

All existing People records will be deleted and replaced with this deduplicated list from videolist:

| Canonical Name | Variations in Old Data |
|---|---|
| William Larsen | "William", "William Larsen" |
| John Kwon | "John Kwon", "John" |
| David Park | "David Park" |
| Paul Lim | "Paul Lim", "Dr. Paul Lim", "Paul" |
| Robert Fishman | "Robert Fishman", "Robert" |
| David Min | "David Min" |
| Troy Segale | "Troy Segale" |
| Augustine Kim | "Augustine Kim" |
| Frank Holman | "Frank Holman" |
| Terry Lopez | "Terry Lopez" |
| Daniel Shim | "Daniel Shim" |
| Juan Perez | "Juan Perez" |
| Peace Oh | "Peace Oh" |
| Jason Koch | "Jason Koch" |
| John Baik | "John Baik" |
| Moses Yoon | "Moses Yoon" |
| Ron Ward | "Ron Ward" |
| James Park | "James Park" |
| Timothy Cho | "Timothy Cho" |
| Joshua Lopez | "Joshua Lopez" |
| Isiah Pulido | "Isiah Pulido" |
| Andrew Cuevas | "Andrew Cuevas" |
| Paul Im | "Paul Im" |
| Mark Yang | "Mark C Yang" |

Each speaker gets: Person record + Speaker role assignment.

## 6. Series Organization

Create Series from `laubfmaterial.mtype` and `videolist.videotype`:

| Series Name | Source | Estimated Count |
|---|---|---|
| Sunday Service | mtype="Sunday" + videotype="Sunday" | ~1,182 |
| Wednesday Bible Study | mtype="Wednesday" + videotype="Wednesday" | ~82 |
| Conference | mtype="Conference" | ~61 |
| CBF (Children's Bible Fellowship) | mtype="CBF" | ~149 |
| JBF (Junior Bible Fellowship) | mtype="JBF" | ~91 |
| Events | videotype="Events" | ~10 |
| Prayer Meeting | mtype="Prayer" | ~40 |
| Special Studies | mtype="Genesis", "9 Step", "LBCC GBS", etc. | ~22 |

## 7. File Attachment Strategy

### File Accessibility (CONFIRMED)
- Old server at `https://laubf.org` is **live and serving files**
- DOCX files accessible at `https://laubf.org/documentation/bible/{filename}`
- Tested: `Mk2d-2019Q.docx` (7.1KB, 200 OK), `Mk2d-2019N.docx` (28KB, 200 OK), `.doc` and `.rtf` also verified
- **3,266 unique file URLs** across 1,637 laubfmaterial rows (up to 4 files per row)
- File types: .doc (1,910/58%), .docx (1,268/39%), .rtf (79), .pdf (3), other (6)
- Some files may return 404 — track failures for manual follow-up
- **Download urgently** before old server is retired

### Recommended Storage: Cloudflare R2
- Zero egress fees (critical for file serving at scale)
- S3-compatible API, built-in CDN
- Cost: ~$3/month for 200 churches × 2,000 files × 500KB avg
- Multi-tenant via `{churchId}/` prefix
- Project already uses Cloudflare (see `docs/cloudflare-cdn-setup.md`)

### Temporary Approach
Until R2 is set up:
1. Add temporary `legacySourceId` column to `BibleStudyAttachment` (maps to `laubfmaterial.no`)
2. Store the original `fileurl` path in `BibleStudyAttachment.url`
3. Mark attachment records as `pendingMigration` (or use a flag)
4. **REMINDER FOR FUTURE**: Run a second-pass migration to download files from old server and re-upload to new storage

### Scalable Storage Solution
Research in progress — evaluating Cloudflare R2, AWS S3, Vercel Blob for 200+ church scalability.

> **⚠️ TEMPORARY COLUMN**: `BibleStudyAttachment.legacySourceId` is a migration artifact. Remove after file migration is complete. This column maps back to `laubfmaterial.no` in the old MySQL database for second-pass file imports.

## 8. Bible Text Database (Replacing External API)

### Current Problem
- `lib/bible-api.ts` fetches from bible-api.com (only supports KJV, ASV, WEB, YLT natively)
- ESV is the default version but silently falls back to KJV — misleading
- NIV, NASB, NLT, AMP are listed in UI but not actually available

### Solution: Import `bible_nword` into PostgreSQL
The old database has a complete local Bible text database with 12 translations including ESV, NIV, KJV, NASB, AMP, NLT.

1. Create new `BibleVerse` Prisma model
2. Import ~186K English verses (31,102 verses × 6 translations)
3. Refactor `lib/bible-api.ts` to query local PostgreSQL instead of external API
4. Update bible version dropdown to show actually available translations
5. Fix study detail page to use local data

### Translations to Import (ALL — Bible is a global service)

Bible text is not tenant-scoped content — it's a shared reference service. Import all available translations to future-proof for Korean/Spanish-speaking churches.

| Version | Code | Language | Rows | Notes |
|---|---|---|---|---|
| ESV | ESV | English | 31,086 | Primary default |
| NIV | NIV | English | 31,103 | Most popular (2011 edition) |
| KJV | KJV | English | 31,101 | Public domain classic |
| NASB | NASB | English | 31,103 | Literal translation |
| NLT | NLT | English | 31,080 | Easy reading |
| AMP | AMP | English | 31,103 | Amplified |
| NIV(1984) | NIV1984 | English | 31,102 | Legacy edition, kept for reference |
| 개역개정 | 개역개정 | Korean | 31,099 | Korean Revised Version |
| 새번역 | 새번역 | Korean | 31,088 | New Korean Standard |
| 바른성경 | 바른성경 | Korean | 31,102 | Korean Correct Bible |
| RVR1960 | RVR1960 | Spanish | 31,102 | Reina-Valera 1960 |
| **Total** | | | **~342,000** | **~64MB in PostgreSQL** |

Skip: NIV1 (duplicate of NIV 2011)

The `version` column is a String, so adding new translations in the future requires only data insertion — no schema migration.

The UI version dropdown will initially show the 6 primary English versions (ESV, NIV, KJV, NASB, NLT, AMP). Korean and Spanish versions can be exposed per-church when needed.

## 9. Migration Execution Plan

### Phase 0: Schema & Infrastructure
1. [ ] Add `BibleVerse` model to Prisma schema
2. [ ] Add temporary `legacySourceId` to `BibleStudyAttachment`
3. [ ] Run Prisma migration
4. [ ] Import `bible_nword` English translations into BibleVerse table
5. [ ] Refactor `lib/bible-api.ts` to use local DB
6. [ ] Delete `docs/bible-api-research.md` ✅ (done)

### Phase 1: Speakers & Series Setup
1. [ ] Delete all existing People records
2. [ ] Create Person + Speaker role for each canonical speaker name
3. [ ] Create Series records from Section 6

### Phase 2: laubfmaterial → Message + BibleStudy (1,637 records)
1. [ ] Parse SQL dump, skip non-English entries if any
2. [ ] For each entry: create Message, create BibleStudy (linked), create BibleStudyAttachment records
3. [ ] Assign to Series based on `mtype`
4. [ ] Store `laubfmaterial.no` in `BibleStudyAttachment.legacySourceId`

### Phase 3: videolist → Merge into Messages (315 records)
1. [ ] Parse SQL dump
2. [ ] Match to existing Messages by title+date+passage
3. [ ] Set youtubeId, hasVideo=true on matched Messages
4. [ ] Create new Messages for unmatched videos
5. [ ] Assign speakers from `messenger` field

### Phase 4: Verification
1. [ ] Verify total counts
2. [ ] Spot-check random entries
3. [ ] Test CMS Messages page
4. [ ] Test public website study detail pages
5. [ ] Test bible version switching (local DB)

### Phase 5: File Migration (DEFERRED — second pass)
1. [ ] Set up scalable file storage (R2/S3/etc.)
2. [ ] Download files from old server using `legacySourceId` → `laubfmaterial.fileurl*` mapping
3. [ ] Upload to new storage, update `BibleStudyAttachment.url`
4. [ ] Remove `legacySourceId` column after migration complete

## 10. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| SQL parsing errors | Data loss | Test parser on sample data first |
| Duplicate Messages | Double entries | Match laubfmaterial↔videolist before insertion |
| Speaker name mismatches | Wrong attribution | Build dedup mapping upfront |
| Missing bible passages (bcode=0) | Can't set BibleBook | Default to generic or skip |
| Old files inaccessible | No attachments | legacySourceId enables second-pass |
| bible_nword licensing | Legal risk for NIV/ESV | These translations were already in old system; same church usage |
