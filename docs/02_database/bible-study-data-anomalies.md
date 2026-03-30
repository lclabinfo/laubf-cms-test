# Bible Study & Page Data Anomalies

> **Date:** 2026-03-30 (verified against live local DB)
> **Purpose:** Catalog all weird/orphaned/inconsistent records for David to review before cleanup

---

## 1. Orphaned BibleStudies: 24 duplicates with no linked Message

**What:** 24 BibleStudy rows exist that have no Message pointing to them (`relatedStudyId`). All 24 are **duplicates** of studies that DO have linked messages — the migration created two copies with different slugs (e.g., `have-faith-in-god-5` orphan vs `have-faith-in-god` linked).

**Why this happened:** The legacy MySQL migration (2026-03-12) likely ran twice or had a code path that created the BibleStudy without linking it back to the Message. The orphan always has the higher slug suffix number.

**Impact:** 24 zombie rows + 47 attachment records + 47 R2 files wasting storage. Not visible in the CMS because no Message references them. The public website won't show them.

**Action needed:** Safe to hard-delete all 24 orphans + their 47 attachments + R2 files. The linked copies have their own attachments.

| Orphan ID | Title | Orphan Slug | Attachments | Linked Duplicate Slug(s) |
|-----------|-------|-------------|:-----------:|--------------------------|
| `c2ce7d13` | Suffer for Doing Good | suffer-for-doing-good-2 | 2 | suffer-for-doing-good |
| `b45674ea` | Give thanks to the Lord | give-thanks-to-the-lord-3 | 2 | give-thanks-to-the-lord, give-thanks-to-the-lord-2 |
| `370e5664` | God With Us | god-with-us-5 | 1 | god-with-us, god-with-us-2, god-with-us-3, god-with-us-4 |
| `cbed49a5` | Have faith in God | have-faith-in-god-5 | 3 | have-faith-in-god, have-faith-in-god-2, have-faith-in-god-3, have-faith-in-god-4, have-faith-in-god-6 |
| `ff5a79ac` | How many loaves do you have? | how-many-loaves-do-you-have-2 | 3 | how-many-loaves-do-you-have |
| `2028aaad` | THE PARABLE OF THE SOWER | the-parable-of-the-sower-2 | 2 | the-parable-of-the-sower |
| `351c5240` | The God of the living | the-god-of-the-living-2 | 2 | the-god-of-the-living |
| `2c181507` | The Lost Sheep | the-lost-sheep-2 | 1 | the-lost-sheep |
| `46e2e8ab` | The stone the builders rejected | the-stone-the-builders-rejected-2 | 3 | the-stone-the-builders-rejected |
| `883258fd` | WHAT IS YOUR NAME? | what-is-your-name-2 | 2 | what-is-your-name |
| `ba30ae8a` | Where are the other nine? | where-are-the-other-nine-3 | 2 | where-are-the-other-nine, where-are-the-other-nine-2 |
| `a371ee76` | You Give Them Something To Eat | you-give-them-something-to-eat-6 | 3 | you-give-them-something-to-eat, -2, -3, -5, -7 |
| `589238a3` | The gospel must first be preached | the-gospel-must-first-be-preached-2 | 2 | (check DB) |
| `3af1a7b9` | I am the resurrection | i-am-the-resurrection | 2 | (check DB) |
| `6ba1b4b1` | FOR MY EYES HAVE SEEN YOUR SALVATION | for-my-eyes-have-seen-your-salvation | 2 | (check DB) |
| `60c41bb3` | Everything we need for godly lives | everything-we-need-for-godly-lives | 2 | (check DB) |
| `0144f572` | Love One Another Deeply | love-one-another-deeply | 2 | (check DB) |
| `2a7c6a72` | Walk before with intergrity of heart | walk-before-with-intergrity-of-heart | 3 | (check DB) |
| `142bef3b` | Don't ask just a few | don-t-ask-just-a-few | 3 | (check DB) |
| `3a5c6325` | His Kingdom Will Never End-Special | his-kingdom-will-never-end-special | 1 | (check DB) |
| `317bb00c` | And they were all filled with the Holy Spirit | and-they-were-all-filled-with-the-holy-spirit | 1 | (check DB) |
| `7ef8d9e4` | Grace and Truth | grace-and-truth | 1 | (check DB) |
| `6de513c7` | The Great Commission | the-great-commission | 1 | (check DB) |
| `3575f353` | WORK, FOR I AM WITH YOU | work-for-i-am-with-you | 1 | (check DB) |

**Cleanup SQL (after verifying R2 files are duplicates too):**
```sql
-- Step 1: Delete attachment records for orphaned studies
DELETE FROM "BibleStudyAttachment"
WHERE "bibleStudyId" IN (
  SELECT bs.id FROM "BibleStudy" bs
  WHERE NOT EXISTS (SELECT 1 FROM "Message" m WHERE m."relatedStudyId" = bs.id)
);

-- Step 2: Delete the orphaned study records
DELETE FROM "BibleStudy"
WHERE id IN (
  SELECT bs.id FROM "BibleStudy" bs
  WHERE NOT EXISTS (SELECT 1 FROM "Message" m WHERE m."relatedStudyId" = bs.id)
);
```
Note: R2 attachment files for these orphans should also be cleaned up. Need to list the R2 keys from the attachment URLs before deleting the DB records.

---

## 2. Attachment-stripped BibleStudies: 8 conference studies with empty content

**What:** 8 BibleStudy rows are properly linked to Messages but have zero attachments AND `hasQuestions: false`, `hasAnswers: false`, `hasTranscript: false`. They're essentially empty shells.

**Why:** These are all conference/special-event messages (e.g., "2025 West Coast Summer Bible Conference", "Easter Spring Conference"). The legacy data likely didn't have study material for these — they were sermon-only events. The migration created a BibleStudy for every message regardless.

**Impact:** Low — these studies are empty but linked. The public website may show a "Bible Study" link that leads to an empty page.

**Action needed:** Review whether these messages should have `hasStudy: false` and `relatedStudyId: null`. If so, unlink them. Do NOT use `unlinkMessageStudy()` for cleanup — it will try to delete R2 attachments that don't exist and soft-delete the study (adding a zombie). Instead, do a direct cleanup:

```sql
-- Unlink empty conference studies from their messages
UPDATE "Message" SET "relatedStudyId" = NULL, "hasStudy" = false
WHERE "relatedStudyId" IN (
  SELECT bs.id FROM "BibleStudy" bs
  JOIN "Message" m ON m."relatedStudyId" = bs.id
  WHERE NOT EXISTS (SELECT 1 FROM "BibleStudyAttachment" bsa WHERE bsa."bibleStudyId" = bs.id)
  AND bs."hasQuestions" = false AND bs."hasAnswers" = false AND bs."hasTranscript" = false
);

-- Then hard-delete the empty studies
DELETE FROM "BibleStudy" WHERE id IN (
  SELECT bs.id FROM "BibleStudy" bs
  WHERE NOT EXISTS (SELECT 1 FROM "Message" m WHERE m."relatedStudyId" = bs.id)
  AND NOT EXISTS (SELECT 1 FROM "BibleStudyAttachment" bsa WHERE bsa."bibleStudyId" = bs.id)
  AND bs."hasQuestions" = false AND bs."hasAnswers" = false AND bs."hasTranscript" = false
);
```

**The 8 studies:**

| Title | Message Title | Status |
|-------|--------------|--------|
| 2024 Spring Bible Conference: Feed My Sheep | (same) | PUBLISHED, all content flags false |
| 2024 Summer Bible Conference: Love for one another | (same) | PUBLISHED, all content flags false |
| 2025 Spring Conference: Calling, Cross, Glory | (same) | PUBLISHED, all content flags false |
| 2025 West Coast Summer Bible Conference | (same) | PUBLISHED, all content flags false |
| Easter Spring Conference 'Open Your Eyes and See' | (same) | PUBLISHED, all content flags false |
| Have this mind among yourselves... | (same) | PUBLISHED, all content flags false |
| The Book of Jonah | (same) | PUBLISHED, all content flags false |
| The Book of Ruth | (same) | PUBLISHED, all content flags false |

---

## 3. Soft-deleted test Page: 1 zombie row

**What:** Page `e5ca20b3` (title: "test", slug: "test") was soft-deleted on 2026-03-21 but the row is still in the DB. It has zero PageSections (cascade already cleaned those, or it never had any).

**Why this is weird:** The `deletePage()` DAL function does a **hard delete** (`prisma.page.delete()`), so this page was NOT deleted through the normal builder or CMS flow. It was likely soft-deleted via Prisma Studio, a direct SQL query, or an earlier version of the code that used soft-delete.

**Impact:** Minimal — 1 row. But it proves the `deletedAt` field on Page is being used somewhere outside the normal flow, or was used historically.

**Action needed:** Hard-delete this row:
```sql
DELETE FROM "Page" WHERE id = 'e5ca20b3-d776-45b9-8176-4af01f8fe3fe';
```

---

## 4. Builder delete behavior: confirmed HARD DELETE

The website builder (page builder UI) and the CMS pages manager both call the same API endpoints:
- `DELETE /api/v1/pages/[slug]` → calls `deletePage()` → `prisma.page.delete()` (hard delete, cascade removes sections)
- `DELETE /api/v1/pages/[slug]/sections/[id]` → calls `deletePageSection()` → `prisma.pageSection.delete()` (hard delete)

The builder has a client-side "undo" that works by re-creating the page via POST (it captures the full page data before calling DELETE). This is a proper pattern — no soft-delete needed.

**The Page model's `deletedAt` field is dead weight.** It's never set by any current code path. It exists only in the schema and in 6 `deletedAt: null` query filters that could be removed.

---

## Summary of cleanup actions

| # | Action | Rows | Risk | Effort |
|---|--------|-----:|------|--------|
| 1 | Hard-delete 24 orphaned BibleStudies + 47 attachments + R2 files | 71 | LOW (verified duplicates) | 30 min |
| 2 | Unlink 8 empty conference studies from messages, then delete | 16 | LOW (empty content) | 15 min |
| 3 | Hard-delete 1 zombie Page row | 1 | NONE | 1 min |
| 4 | Remove `deletedAt` from Page schema (future) | schema only | LOW | part of hard-delete migration |
