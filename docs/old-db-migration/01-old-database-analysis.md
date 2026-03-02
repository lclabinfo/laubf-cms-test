# Old LA UBF Database Analysis

> Analyzed: 2026-03-02
> Source: `00_old_laubf_db_dump/` (MySQL 8.0 dump from legacy LA UBF website)

## Overview

The legacy LA UBF website uses a MySQL database with a **board-based CMS architecture**. Each content type (Bible Study, Messages, BibleForest, etc.) is implemented as a separate "board" with 4 associated tables following a consistent naming convention:

| Suffix | Purpose | Example |
|--------|---------|---------|
| `_list` | Main content entries (posts) | `a_tn2_BibleStudy_list` |
| `_ad` | Board admin/config settings | `a_tn2_BibleStudy_ad` |
| `_cnt` | Visitor/hit counters (analytics) | `a_tn2_BibleStudy_cnt` |
| `_re` | Replies/comments on posts | `a_tn2_BibleStudy_re` |

All `_list` tables share an **identical schema** — they are instances of the same generic board system. The `board_name` column differentiates content types.

## Bible Study Content Tables

### 1. `a_tn2_BibleStudy_list` — Bible Study Materials

- **Board name:** `BibleStudy`
- **Record count:** ~1,240 entries
- **AUTO_INCREMENT:** 1575
- **Content language:** Primarily Korean (한국어)
- **Description:** Weekly/regular bible study materials with passage analysis, questions, and commentary

### 2. `a_tn2_BibleForest_list` — Bible Forest (성경 숲)

- **Board name:** `BibleForest`
- **Record count:** ~197 entries
- **AUTO_INCREMENT:** 211
- **Content language:** Korean
- **Description:** Bible overview/summary materials. "Bible Forest" appears to be a study program that provides book-level overviews (e.g., "창세기 개요: 하나님 나라의 시작" = "Genesis Overview: The Beginning of God's Kingdom"). Contains structural outlines and thematic summaries.

### 3. `a_tn2_Bible66_list` — 66 Books Bible Study (성경 66권 강해)

- **Board name:** `Bible66`
- **Record count:** ~1,439 entries
- **AUTO_INCREMENT:** 11675
- **Content language:** Korean
- **Description:** Verse-by-verse/chapter-by-chapter Bible commentary across all 66 books. The largest bible study collection. Entries follow a pattern: "1장 1부 창조주 하나님" (Chapter 1 Part 1: God the Creator).

### 4. `a_tn2_IBSIntro_list` — Inductive Bible Study Introductions

- **Board name:** `eBibleStudy`
- **Record count:** 1 entry (AUTO_INCREMENT=5, so 3 were deleted)
- **Content language:** English
- **Description:** Book-level introductions for Inductive Bible Study. The single remaining entry is "INTRODUCTION TO HEBREWS" — discusses authorship, dating (before 70 AD), recipients (Jewish Christians under Roman persecution), structure (doctrinal 1:1-10:18, practical 10:19-13:25), and themes. `user_add1`="158" likely references `bible_names.bnum` (158=Hebrews).

### 5. `a_tn2_IBSMessage_list` — IBS Messages

- **Board name:** `IBSMessage`
- **Record count:** 1 entry
- **Content language:** English
- **Description:** A dedicated board for Missionary Mark Yang's Bible study lecture materials. The single post is a board description/intro, not actual study content. The board was created but never populated with lectures.

### 6. `a_tn2_mysdb_list` — Personal Study Checklists

- **Board name:** `dbshare2`
- **Record count:** ~27 entries
- **Content language:** English
- **Description:** Personal daily study/task checklists (e.g., "Today Check List (05-20-2018)"). Used by one user ("Joseph2") over ~4 months (2018-05 to 2018-09). Not structured bible study content — more of a personal journal/tracker. **Not relevant for migration.**

### 6. `a_tn2_message_list` — General Messages/Sermons

- **Board name:** `dbshare2`
- **Record count:** **0 entries** (table exists but is empty)
- **Description:** General sermon messages board. Empty — sermons may have been stored elsewhere or this was unused.

## Shared Board Schema (all `_list` tables)

```sql
CREATE TABLE `a_tn2_XXX_list` (
  -- Identity
  `no`          int NOT NULL AUTO_INCREMENT,  -- Primary key / entry ID
  `board_name`  varchar(50),                   -- Board identifier (e.g., 'BibleStudy')
  `uid`         double,                        -- Unique ID (often negative of `no`)

  -- Threading (for replies)
  `division`    int DEFAULT 1,                 -- Division/group
  `thread`      int DEFAULT 0,                 -- Thread ID
  `parent`      int,                           -- Parent post ID
  `follow`      int,                           -- Follow-up post ID
  `replycnt`    tinyint DEFAULT 0,             -- Reply count
  `no_reply`    tinyint,                       -- No-reply flag

  -- Author info
  `mlevel`      int,                           -- Member level
  `member`      tinyint,                       -- Is member flag
  `micon`       varchar(255),                  -- Member icon
  `mphoto`      varchar(255),                  -- Member photo
  `mcharacter`  varchar(50),                   -- Member character/avatar
  `mnick`       varchar(50),                   -- Member nickname (display name)
  `name`        varchar(50),                   -- Author name
  `id`          varchar(50),                   -- Author user ID
  `wmail`       varchar(50),                   -- Author email

  -- Content
  `subject`     varchar(255),                  -- ★ Post title
  `category`    tinyint DEFAULT 0,             -- Category code
  `tbody`       text,                          -- ★ Post body (HTML content)
  `tbody_img`   text,                          -- Image HTML for post body
  `bodytype`    char(1),                       -- Body type flag
  `bodystyle`   varchar(255),                  -- Body CSS style

  -- Metadata
  `wdate`       int,                           -- ★ Write date (Unix timestamp)
  `wdate_re`    int,                           -- Last reply date (Unix timestamp)
  `hit`         int DEFAULT 0,                 -- View count
  `vote`        int DEFAULT 0,                 -- Vote count
  `comment`     smallint DEFAULT 0,            -- Comment count
  `comment2`    smallint DEFAULT 0,            -- Comment count 2
  `ip`          varchar(15),                   -- Author IP address
  `specialset`  varchar(10),                   -- Special setting flag
  `give_point`  mediumint,                     -- Points awarded
  `re_select`   tinyint,                       -- Reply selected flag

  -- Security
  `home`        varchar(255),                  -- Homepage URL
  `mypass`      varchar(50),                   -- Post password
  `secret`      int DEFAULT 0,                 -- Secret post flag
  `openerid`    varchar(255),                  -- Opener ID

  -- Attachments
  `sms_tel`     varchar(20),                   -- SMS telephone
  `ulink1`      varchar(255),                  -- Upload link 1
  `ulink1size`  int,                           -- Upload link 1 size
  `ulink1hit`   int DEFAULT 0,                 -- Upload link 1 hit count
  `ulink2`      varchar(255),                  -- Upload link 2
  `ulink2size`  int,                           -- Upload link 2 size
  `ulink2hit`   int DEFAULT 0,                 -- Upload link 2 hit count
  `filedir`     int,                           -- File directory
  `ufile1`      varchar(150),                  -- Uploaded file 1
  `ufile1size`  int,                           -- File 1 size
  `ufile1hit`   int DEFAULT 0,                 -- File 1 download count
  `ufile2`      varchar(150),                  -- Uploaded file 2
  `ufile2size`  int,                           -- File 2 size
  `ufile2hit`   int DEFAULT 0,                 -- File 2 download count

  -- Custom fields (board-specific)
  `temp1`       int,                           -- Temp field 1
  `temp2`       int,                           -- Temp field 2
  `temp3`       mediumtext,                    -- Temp field 3
  `user_add1`   varchar(255),                  -- User additional 1
  `user_add2`   varchar(255),                  -- User additional 2
  `user_add3`   varchar(255),                  -- User additional 3

  PRIMARY KEY (`no`)
);
```

### Key Content Fields

The actual bible study content is embedded in the `tbody` (body) HTML. Based on analysis of the data, the HTML content typically contains structured sections:

```
<h4>Title</h4>
<h2>주제 (Theme)</h2>
Book Chapter:Verse-Verse
요절/Book Chapter:Verse "Key verse text"

[Body content with commentary...]

<h3>Section headings</h3>
[Section content...]
```

**Bible passage information is NOT in separate columns** — it is embedded within the `tbody` HTML and the `subject` title. The board system has no dedicated bible book/chapter/verse columns.

## Video Table

### `videolist` — Sermon Videos

```sql
CREATE TABLE `videolist` (
  `no`           int NOT NULL AUTO_INCREMENT,
  `videonum`     varchar(100),    -- ★ YouTube video ID or URL
  `title`        text,            -- ★ Sermon title
  `videotype`    varchar(50),     -- Type: 'Sunday', 'Wednesday', 'Events'
  `mtype`        varchar(50),     -- Media type: 'YouTube' or NULL
  `mdate`        varchar(50),     -- ★ Date: 'YYYY/MM/DD' format
  `messenger`    varchar(100),    -- ★ Speaker name
  `passage`      varchar(100),    -- ★ Bible passage: 'Book Chapter:Verse~Verse'
  `bname`        varchar(100),    -- ★ Bible book name
  `from_chapter` int DEFAULT 0,   -- ★ Starting chapter number
  `to_chapter`   int DEFAULT 0,   -- ★ Ending chapter number
  PRIMARY KEY (`no`)
);
```

- **Record count:** ~327 entries (AUTO_INCREMENT=348)
- **Date range:** 2019/05/05 to 2024/06/09
- **Speakers:** William Larsen, John Kwon, David Park, Paul Lim, Robert Fishman, David Min, Troy Segale, Augustine Kim, and others
- **Types:** Sunday (majority), Wednesday, Events
- **Video format:** Mix of Vimeo IDs (early entries), YouTube video IDs, and full YouTube URLs

### Key observations:
1. Videos have **explicit bible passage columns** (`passage`, `bname`, `from_chapter`, `to_chapter`) — better structured than the board tables
2. The `videonum` field evolved over time: early entries use Vimeo numeric IDs, then YouTube video IDs, then full YouTube URLs
3. This is the **best-structured data source** for mapping sermons to bible passages

## Bible Reference Tables

### `bible_names` — Bible Book Names (Korean/English/Spanish)

```sql
CREATE TABLE `bible_names` (
  `id`       int NOT NULL AUTO_INCREMENT,
  `language` varchar(20),    -- 'Korean', 'English', 'Spanish'
  `bnum`     int,            -- Book number (101-166, OT=101-139, NT=140-166)
  `blname`   varchar(15),    -- Long book name
  `bsname`   varchar(5),     -- Short/abbreviated name
  `chaptlen` int,            -- Number of chapters in book
  PRIMARY KEY (`id`)
);
```

- **198 rows** (66 books × 3 languages)
- Book numbering: 101=Genesis through 166=Revelation (OT: 101-139, NT: 140-166)
- Provides Korean ↔ English ↔ Spanish book name mappings

### `bible_ename` — English Bible Book Names

- 66 rows, English-only book names with abbreviations
- Simpler version of `bible_names`

### `bible_nword` — Full Bible Text Database (12 Translations)

```sql
CREATE TABLE `bible_nword` (
  `id`             int NOT NULL AUTO_INCREMENT,
  `b_num`          int,            -- Book number (101-166, joins to bible_names.bnum)
  `b_version`      int,            -- Version number (numeric)
  `chapter`        int,            -- Chapter number
  `verse`          int,            -- Verse number
  `word`           text,           -- ★ THE ACTUAL VERSE TEXT
  `bversion`       varchar(15),    -- Version name string
  `bversion_order` int,            -- NULL in all rows
  `bver_order`     int,            -- Ordering
  PRIMARY KEY (`id`)
);
```

- **373,107 rows** (66.8 MB) — Complete Bible text in **12 translations**:
  - **Korean (3):** 개역개정 (Korean Revised Version), 바른성경, 새번역 (New Korean Standard)
  - **English (8):** NIV, NIV(1984), NIV1, NASB, KJV, ESV, AMP, NLT
  - **Spanish (1):** RVR1960
- ~31,102 verses per translation × 12 translations ≈ 373K rows

### `bible_enlog2` — Bible App Activity Log

```sql
CREATE TABLE `bible_enlog2` (
  `num`    int DEFAULT 0,
  `m_id`   varchar(50),    -- User ID (email or username)
  `b_date` date,           -- Log date
  `b_time` time,           -- Log time
  `menu`   varchar(30),    -- Action type (Task/selbible/selchapter/rbible/bsearch/etc.)
  `memo`   text            -- Action details
);
```

- **~86,903 rows** (8.2 MB) — User activity log for the Bible reading app
- Tracks logins, book selections, chapter reads, searches, dictionary lookups
- Date range: 2018-12-01 onward
- NOT bible content — usage analytics only

> **Note:** The new system uses external APIs (bible-api.com) for bible text. The local `bible_nword` table does NOT need to be migrated for text serving. However, the fact that it contains NIV and ESV text is notable — the old system had these texts locally while our new system currently only has API access to KJV/ASV/WEB/YLT via bible-api.com (ESV API integration is planned but not implemented). The `bible_enlog2` activity log is not needed for migration.

## Study Materials Table (CRITICAL)

### `laubfmaterial` — Study Materials Library

This is the **most well-structured and comprehensive** content table in the old system. It links sermons to downloadable study documents.

```sql
CREATE TABLE `laubfmaterial` (
  `no`           int NOT NULL AUTO_INCREMENT,
  `bcode`        int DEFAULT 0,       -- ★ Bible book code (101=Genesis...166=Revelation, 0=misc)
  `title`        varchar(100),        -- ★ Message/study title
  `mtype`        varchar(50),         -- ★ Material type (Sunday/CBF/JBF/Conference/Prayer/etc.)
  `mdate`        varchar(50),         -- ★ Date: 'YYYY/MM/DD'
  `passage`      varchar(50),         -- ★ Bible passage (e.g., "Mark 2:23-27")
  `bname`        varchar(50),         -- ★ Bible book name
  `from_chapter` int DEFAULT 0,       -- ★ Starting chapter
  `to_chapter`   int DEFAULT 0,       -- ★ Ending chapter
  `doctype1`     varchar(20),         -- ★ Doc type slot 1 (Question/Message/Note/Inductive)
  `doctype2`     varchar(20),         -- Doc type slot 2
  `doctype3`     varchar(20),         -- Doc type slot 3
  `doctype4`     varchar(20),         -- Doc type slot 4
  `filename1`    varchar(50),         -- ★ Filename slot 1
  `filename2`    varchar(50),
  `filename3`    varchar(50),
  `filename4`    varchar(50),
  `fileurl1`     varchar(400),        -- ★ URL slot 1 (e.g., /documentation/bible/Mk2d-2019Q.docx)
  `fileurl2`     varchar(400),
  `fileurl3`     varchar(400),
  `fileurl4`     varchar(400),
  `msgurl`       varchar(400),        -- Message URL (rarely used)
  PRIMARY KEY (`no`),
  KEY `laubfm_idx1` (`bcode`),
  KEY `laubfm_idx2` (`bcode`,`from_chapter`,`to_chapter`)
);
```

- **Record count:** 1,637 entries (AUTO_INCREMENT=9319)
- **Date range:** 2000/01/01 to 2026/02/15 (~26 years of materials!)

**Material type (`mtype`) distribution:**
| Type | Count | % | Description |
|------|-------|---|-------------|
| Sunday | 1,182 | 72% | Sunday worship message materials |
| CBF | 149 | 9% | Children's Bible Fellowship |
| JBF | 91 | 6% | Junior Bible Fellowship |
| Conference | 61 | 4% | Conference messages |
| Prayer | 40 | 2% | Prayer meeting materials |
| Genesis | 32 | 2% | Genesis study series |
| Wednesday | 27 | 2% | Wednesday group notes |
| Other | 55 | 3% | LBCC GBS, World Mission, 9 Step, etc. |

**Document types (across 4 slots per entry):**
- Question sheets: 1,529 occurrences
- Study notes: 1,176 occurrences
- Message manuscripts: 935 occurrences
- Inductive worksheets: 238 occurrences

**File naming convention:** `{BookAbbrev}{Chapter}{Letter}-{Year}{Type}.docx`
- Q = Question sheet, N = Notes, M = Message
- Example: `Mk2d-2019Q.docx` = Mark chapter 2 section d, 2019, Questions

**File paths:** `/documentation/bible/{filename}` on old server

### Relationship to `videolist`

`laubfmaterial` and `videolist` are **NOT linked by foreign keys** but correspond by title + date + passage:
- videolist row 32: "JESUS, LORD OF THE SABBATH", 2019/07/14, Mark 2:23~27
- laubfmaterial row 7545: "JESUS, LORD OF THE SABBATH", 2019/07/14, Mark 2:23-27

Together they form the complete sermon record: video + study documents.

## Schedule/Planner Table

### `messengers` — Weekly Message Schedule

```sql
CREATE TABLE `messengers` (
  `no`      int NOT NULL AUTO_INCREMENT,
  `m_id`    varchar(50),     -- Editor's email/user ID
  `type`    varchar(50),     -- "Sunday", "Youth", "Children"
  `mdate`   varchar(50),     -- Date 'YYYY/MM/DD'
  `passage` varchar(100),    -- Bible passage
  `title`   text,            -- Message title
  `speaker` varchar(100),    -- Speaker name
  PRIMARY KEY (`no`)
);
```

- **~247 entries** — Weekly schedule planner, not a content table
- Overlaps with `videolist` for Sunday messages
- Lower priority for migration

## Other Related Tables

### `topiclist` — Topics/Categories
- Only 3 entries, used for church announcements, not bible study categorization

### `announcelist` — Announcements
- 10 entries, simple announcements, not bible study content

## Hidden Metadata in `user_add` Fields

The generic board schema has `user_add1`/`user_add2`/`user_add3` columns repurposed differently per board:

### BibleStudy_list
- `user_add2`: Bible book code (101-166, matching `bible_names.bnum`) — e.g., 142=Luke, 140=Matthew, 101=Genesis
- `user_add3`: Chapter number — e.g., 18 for Luke 18

### BibleForest_list (has extra columns `user_add4`/`user_add5`/`user_add6`)
- `user_add4`: Start chapter of covered section
- `user_add5`: End chapter of covered section
- `user_add6`: Section/order number within the book

### Bible66_list
- `user_add1`: Part number within chapter (e.g., 1, 2)
- `user_add2`: Bible book code (101-166)
- `user_add3`: Chapter number

**This is crucial** — it means bible passage data IS available in structured form for the board tables, not just embedded in HTML.

## Summary Statistics

| Table | Records | Language | Content Type | Priority |
|-------|---------|----------|-------------|----------|
| laubfmaterial | 1,637 | English | Study materials (Q&A, notes, manuscripts) | **HIGH** |
| videolist | ~315 | English | Sermon videos with YouTube links | **HIGH** |
| BibleStudy_list | ~1,232 | Korean | Q&A study worksheets | MEDIUM |
| Bible66_list | ~1,409 | Korean | Verse-by-verse exposition | MEDIUM |
| BibleForest_list | ~197 | Korean | Book-level overviews/commentary | MEDIUM |
| messengers | ~247 | English | Weekly schedule planner | LOW |
| IBSIntro_list | ~4 | English | IBS course introductions | LOW |
| IBSMessage_list | ~1 | English | IBS messages | LOW |
| message_list | 0 | — | Empty table | SKIP |
| **Total content** | **~5,042** | | |

### Content Breakdown by Priority
- **High priority (English, structured):** ~1,952 entries (laubfmaterial + videolist) — well-structured fields, bible passage columns, document attachments
- **Medium priority (Korean, HTML-embedded):** ~2,838 entries (BibleStudy + Bible66 + BibleForest) — passage data in user_add fields + HTML content
- **Low priority:** ~252 entries (messengers + IBS) — schedule data or minimal content

### Three-Table Relationship (Old System's "Message" = Video + Materials)
```
videolist (video recording)     ←— match by title+date+passage —→     laubfmaterial (study documents)
   ↓                                                                      ↓
   YouTube video ID                                              Question sheet, Notes, Message manuscript
   Speaker name                                                  DOCX file attachments
   Passage reference                                             Bible book code (structured)
```
Together, `videolist` + `laubfmaterial` = what our new `Message` + `BibleStudy` models represent.
