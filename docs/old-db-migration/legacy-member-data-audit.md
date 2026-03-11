# Legacy Database Member & Account Data Audit

**Date:** 2026-03-11
**Source:** `00_old_laubf_db_dump/` (MySQL dump from legacy LA UBF website)
**Purpose:** Identify member/account data that could be seeded into the new CMS

---

## Executive Summary

The legacy database contains **~120 SQL tables** across a Korean BBS framework ("TechNote TN3") and a Laravel backend. The primary member table has **28 legitimate LA UBF members** (plus ~10 spam/bot accounts). Most auxiliary tables (messaging, SMS, notes, points) are empty. The richest data sources are:

1. **Member accounts** (28 real people with names, emails, permission levels)
2. **Video/sermon catalog** (327 YouTube videos with speakers -- already migrated)
3. **Bible studies** (1,574 entries -- already migrated)
4. **Photo albums** (441 Google Photos URLs)
5. **Community posts** (names of additional church members from org posts)

---

## 1. Member Accounts (`a_tn3_memberboard_list`)

The primary user table. 38 total records, 28 legitimate, 10 spam/bot.

### Legitimate Members

| # | Name | Email | Level | Fellowship/Group | Joined |
|---|---|---|---|---|---|
| 1 | Joseph Cho | whcho@kookmin.ac.kr | 10 (Admin) | LBCC | 2018-04 |
| 2 | Yerin | cds05187@gmail.com | 10 (Admin) | -- | 2019-06 |
| 3 | Seung | Lseu8@cs.com | 5 (Editor) | LBCC | 2019-06 |
| 4 | David Park | davidwanp@gmail.com | 10 (Admin) | USC | 2019-06 |
| 5 | Billy Park | bcjmepark@gmail.com | 5 (Editor) | ETC | 2019-06 |
| 6 | Young Choi | mscfc472@gmail.com | 5 (Editor) | ETC | 2019-07 |
| 7 | Jason Koch | jkoch7@gmail.com | 5 (Editor) | VISION | 2019-07 |
| 8 | Joseph Cho (2nd) | danylight@gmail.com | 3 | ETC | 2019-10 |
| 9 | Rebecca Park | parkrebecca@gmail.com | 10 (Admin) | Fullerton | 2019-10 |
| 10 | Teresa Park | teresapark5145@gmail.com | 3 | LBCC | 2019-10 |
| 11 | Youngran Chang | djexpressusa@gmail.com | 3 | ETC | 2019-10 |
| 12 | Jennifer Perez | jvu008@gmail.com | 3 | Matthew | 2019-10 |
| 13 | Grace Han | gracehan1674@gmail.com | 3 | Source of Blessing | 2019-10 |
| 14 | Heather Koch | vision4more@gmail.com | 3 | Vision Fellowship | 2019-11 |
| 15 | Rebecca M | chun.rebecca@gmail.com | 3 | -- | 2019-11 |
| 16 | Jae Yu | jamesyum3@gmail.com | 1 | ETC | 2020-03 |
| 17 | Leo | leo.alexanderg1999@gmail.com | 1 | ETC | 2020-03 |
| 18 | Joseph Cho (3rd) | joseph.whcho@gmail.com | 10 (Admin) | LBCC | 2020-04 |
| 19 | Lillia Michaud | lillia2@yahoo.com | 1 | ETC | 2020-04 |
| 20 | Robert L Fishman | rfishman2@gmail.com | 1 | Long Beach State | 2020-04 |
| 21 | Maria Oh | almondblossom72@gmail.com | 1 | ETC | 2020-04 |
| 22 | Sangim Lee | susanna2237@gmail.com | 1 | ETC | 2020-05 |
| 23 | David H Chung | dchung3115@gmail.com | 0 | George Mason | 2020-05 |
| 24 | Tatiana Liseth | lisethtatiana3@gmail.com | 0 | ETC | 2020-06 |
| 25 | Keong Cha | Pd154@hanmail.net | 1 | ETC | 2020-09 |
| 26 | LA UBF (org account) | laubf.downey@gmail.com | 5 (Editor) | Admin | 2020-09 |
| 27 | Juan Perez | jvperez13@gmail.com | 5 (Editor) | Mathew Fellowship | 2021-02 |
| 28 | William Larsen | williamjlarsen@gmail.com | 10 (Admin) | ETC | 2022-01 |
| 29 | Choibi | globalchoibi@hanmail.net | 0 | ETC | 2022-02 |
| 30 | Danbee Park | p.sweetrain@gmail.com | 0 | ETC | 2023-02 |
| 31 | James Park Sr. | jpark90241@yahoo.com | 0 | ETC | 2023-03 |
| 32 | Jeongsoo Park | mdjs0721@gmail.com | 0 | ETC | 2023-10 |

### Permission Levels
- **10 (Admin):** Joseph Cho, David Park, Rebecca Park, William Larsen, Yerin
- **5 (Editor):** Seung, Billy Park, Young Choi, Jason Koch, LA UBF org, Juan Perez
- **3 (Contributor):** Joseph Cho (2nd acct), Teresa Park, Youngran Chang, Jennifer Perez, Grace Han, Heather Koch, Rebecca M
- **1 (Member):** Jae Yu, Leo, Lillia Michaud, Robert Fishman, Maria Oh, Sangim Lee, Keong Cha
- **0 (Unverified/New):** David H Chung, Tatiana Liseth, Choibi, Danbee Park, James Park Sr., Jeongsoo Park

### Spam/Bot Accounts (excluded)
10 accounts with gibberish names, `.ru`/`.biz`/`.xyz`/`.sbs` email domains. IDs: 3077, 3080-3090.

---

## 2. Additional People from Content

### From Community Posts & Notices

These names appear in church organization documents and announcements but don't have accounts:

**Woman Coworkers Organization (from community board):**
Grace Oh, Teresa, Sarah Segale, Esther Lim, Maria Oh, Mari Lopez, Connie Park, Sung Yon Lee, Susana Min

**Conference/Event Speakers (from notices):**
Abraham Lee (Vision Camp 2020 director), Mark Vucekovich (UBF International Coordinator), Greg Cocco

**From Messengers Table (sermon schedule, ~247 records):**
Additional speakers not in the current seed: Gideon Im, Noah Jang, David Cho, James Yu, Sungyon Lee, Maggie Wang, Andrew Park, Sarah Larsen, Billy Park, Kenny Yoon, Cassandra Pyles

### From Daily Bread Share
- Debbie (username: Debbiec, email: changy@satellitehealth.com)

---

## 3. Already-Migrated Data

| Table | Records | Status |
|---|---|---|
| `a_tn2_BibleStudy_list` | ~1,574 | Migrated (1,171 DB records updated) |
| `videolist` (speakers) | ~327 | Speaker names already seeded as Person records |
| `laubfmaterial` | ~1,180 | Content files converted and imported |

---

## 4. Potentially Useful Unmigrated Data

### Photo Albums (`album`) -- 441 records
Google Photos URLs organized by album (Easter 2019, CBF Harvest Festival, etc.). Could seed a photo gallery if URLs are still valid.

### Church Notices (`a_tn2_notice_list`) -- 15 records
COVID-era announcements, summer conference programs (2021, 2022 SBC), campus ministry updates. Valuable as church history record.

### Video Catalog (`videolist`) -- 327 records
YouTube video IDs with titles, speakers, Bible passages, dates (2019-2024). The speaker data is already migrated, but the **YouTube video IDs** could be useful for linking existing Message records to their YouTube videos.

**Sample video data structure:**
```
videonum: YouTube ID (e.g., "dQw4w9WgXcQ")
title: "Message title"
videotype: Sunday/Wednesday/Events
mdate: "2024-01-07"
messenger: "William Larsen"
passage: "Genesis 1:1-31"
bname: "Genesis"
from_chapter: 1
to_chapter: 1
```

### Bible Reading Activity Log (`bible_enlog2`) -- 86,903 records
344 unique user IDs. This is app usage data, not profile data -- just usernames/emails with reading timestamps. Most are from other UBF chapters (Korean), not LA UBF specific.

### Mobile Q&A (`a_tn2_mobqna_list`) -- 87 records
~49 unique users of the UBF Bible reading app. Mostly Korean UBF members from other chapters -- **not LA UBF-specific**. Not useful for seeding.

---

## 5. Observations & Notes

### System Architecture
- **Framework:** Korean BBS system "TechNote TN3" + Laravel backend
- **Board pattern:** Every feature is a "board" (`_list` = posts, `_re` = replies, `_ad` = admin config, `_cnt` = counters)
- **32 boards total** (see `a_tn1_root_cnt`), most empty or with < 10 records
- **Encoding issues:** Korean text is garbled (EUC-KR stored as UTF-8)

### Admin Accounts
- **Primary admin:** Joseph Cho / WonheeCho (3 accounts: `joseph`, `whcho2`, `joseph.whcho@gmail.com`)
- **System admin email:** `danylight@gmail.com` (used across root admin, mobile boards, Korean boards)
- **Site admin:** `laubf.downey@gmail.com` (organizational account)

### Empty/Unused Features
These board features were created but never populated:
- Private messaging, SMS, member notes, member points/gamification
- Youth events, children events, children announcements, praise night, youth parents
- The site seems to have been primarily used for: Bible studies, video catalog, daily bread, and basic announcements

### Password Reset History
5 password resets recorded (2019-2023): Joseph Cho (2x), Teresa Park, David Park, Yerin.
3 newer tokens (2025): appear to be from a different system version.

### Bible Reference Data
- `bible_names`: 66 books x 3 languages (Korean, English, Spanish)
- `bible_nword`: 626,687 Bible verse records (multiple translations)
- Not useful for CMS seeding but shows the app was Bible-study-focused.

---

## 6. Seed Recommendations

### High Priority -- New Person Records

These 28 legitimate members could be seeded as Person records with `membershipStatus: 'MEMBER'`. Many overlap with existing Speaker records. **New people not already in the seed:**

| Name | Email | Notes |
|---|---|---|
| Joseph Cho | joseph.whcho@gmail.com | Primary site admin |
| Rebecca Park | parkrebecca@gmail.com | Admin, Fullerton fellowship |
| Teresa Park | teresapark5145@gmail.com | LBCC |
| Jennifer Perez | jvu008@gmail.com | Matthew fellowship |
| Grace Han | gracehan1674@gmail.com | Source of Blessing |
| Heather Koch | vision4more@gmail.com | Vision Fellowship |
| Billy Park | bcjmepark@gmail.com | Editor |
| Youngran Chang | djexpressusa@gmail.com | -- |
| Maria Oh | almondblossom72@gmail.com | -- |
| Sangim Lee | susanna2237@gmail.com | -- |
| Danbee Park | p.sweetrain@gmail.com | -- |
| James Park Sr. | jpark90241@yahoo.com | -- |

**Already in Speaker seed (no action needed):**
William Larsen, David Park, Robert Fishman, Jason Koch, Juan Perez, James Park, David Min, Paul Lim, Paul Im, John Baik, Moses Yoon, Troy Segale, Ron Ward, Augustine Kim, Terry Lopez, Frank Holman, Daniel Shim, Peace Oh, Andrew Cuevas, Isiah Pulido, Timothy Cho, Joshua Lopez, John Kwon

### Medium Priority -- Additional Speakers
From the `messengers` table, these speakers are NOT in the current seed:
Gideon Im, Noah Jang, David Cho, James Yu, Sungyon Lee, Maggie Wang, Andrew Park, Sarah Larsen, Kenny Yoon, Cassandra Pyles, Greg Cocco

### Low Priority -- YouTube Video IDs
327 YouTube video IDs could be matched to existing Message records by date + speaker to populate the `videoUrl` field.

### Low Priority -- Photo Albums
441 Google Photos URLs. Verify if still accessible before migrating.
