# Plan: Clean Up Orphaned Bible Study Records

## Problem

The database has **two separate tables** for bible study content:

- **`BibleStudy` table** — 16 published records, displayed on `/website/bible-study`
- **`Message` table** — 29 published records, managed from CMS at `/cms/messages`

Only **7 of the 16** BibleStudy records are linked to Messages (via `Message.relatedStudyId`). The other **9 are orphaned** — they appear on the public website but have **no CMS management path**. The CMS should be the single source of truth for all public website content.

### Architecture Overview

```
BibleStudy table (16 rows)          Message table (29 rows)
├── Standalone content records       ├── CMS-managed sermons
├── Has: questions, answers,         ├── Has: hasStudy boolean
│   transcript, bibleText            ├── Has: relatedStudyId (FK → BibleStudy)
├── Queried by: /website/bible-study │   └── Only 7 messages have this set
└── NO CMS admin UI exists           └── Managed via: /cms/messages
```

**The public website `/website/bible-study` fetches from the `BibleStudy` table directly** via `lib/dal/bible-studies.ts` → `getBibleStudies()`. The DAL already filters by `deletedAt: null`, so soft-deleting orphans will automatically exclude them.

---

## Orphaned BibleStudy Records (9 total)

These exist in `BibleStudy` but have **NO linked Message** (`relatedStudyId` pointing to them):

| # | Slug | Title | Passage |
|---|---|---|---|
| 1 | `do-you-truly-love-me` | Do You Truly Love Me More Than These? | John 21:1-25 |
| 2 | `the-lord-is-my-shepherd` | The Lord is My Shepherd | Psalms 23:1-6 |
| 3 | `blessed-are-the-poor-in-spirit` | The Sermon on the Mount: Blessed Are the Poor in Spirit | Matthew 5:1-12 |
| 4 | `his-steadfast-love-endures-forever` | His Steadfast Love Endures Forever | Psalms 136:1-26 |
| 5 | `to-worship-him` | To Worship Him: Joy for a Broken World | Matthew 2:1-12 |
| 6 | `prepare-the-way` | Prepare the Way for the Lord | Mark 1:1-8 |
| 7 | `christ-is-all` | Christ is All, and is in All | Colossians 3:1-17 |
| 8 | `set-your-minds-on-things-above` | Set Your Minds on Things Above | Colossians 3:1-4 |
| 9 | `watered-the-flock` | Watered The Flock | Exodus 2:11-22 |

### Linked BibleStudy Records (7 total — these stay)

| BibleStudy Slug | BibleStudy Title | Linked Message Title |
|---|---|---|
| `testing` | testing | testing |
| `more-than-conquerors` | More Than Conquerors | As The Spirit Gave Them Utterance |
| `remain-in-my-love` | Remain in My Love | The Rich Man and Lazarus |
| `the-call-of-abram` | The Call of Abram | The Shrewd Manager |
| `the-day-of-pentecost` | The Day of Pentecost | The Cost of Being a Disciple |
| `saved-by-grace-through-faith` | Saved by Grace Through Faith | God and Money |
| `not-of-the-world` | Not Of The World | Not of This World |

> Note: Message↔BibleStudy pairings are by **weekly date**, not content match. A Sunday message and its companion bible study cover different passages.

---

## Implementation Steps

### Step 1: Soft-delete orphaned BibleStudy records

Run this SQL against the database:

```sql
UPDATE "BibleStudy"
SET "deletedAt" = NOW()
WHERE id NOT IN (
  SELECT "relatedStudyId" FROM "Message"
  WHERE "relatedStudyId" IS NOT NULL
)
AND "deletedAt" IS NULL;
```

**Method:** Use `node -e` with the `pg` module:

```bash
source .env && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(\`
  UPDATE \"BibleStudy\"
  SET \"deletedAt\" = NOW()
  WHERE id NOT IN (
    SELECT \"relatedStudyId\" FROM \"Message\"
    WHERE \"relatedStudyId\" IS NOT NULL
  )
  AND \"deletedAt\" IS NULL
\`).then(r => {
  console.log('Soft-deleted', r.rowCount, 'orphaned BibleStudy records');
  pool.end();
}).catch(e => { console.error(e); pool.end(); });
"
```

This is a **soft delete** — fully reversible by setting `deletedAt = NULL`.

### Step 2: Verify database state

```sql
-- Should return 7
SELECT count(*) FROM "BibleStudy" WHERE "deletedAt" IS NULL;

-- Should return 9
SELECT count(*) FROM "BibleStudy" WHERE "deletedAt" IS NOT NULL;

-- All 7 remaining should have a linked Message
SELECT bs.slug, bs.title, m.title as "linkedMessage"
FROM "BibleStudy" bs
LEFT JOIN "Message" m ON m."relatedStudyId" = bs.id
WHERE bs."deletedAt" IS NULL;
```

### Step 3: Verify public website

1. Navigate to `/website/bible-study` — should show exactly **7 studies**
2. Each study title should correspond to a Message with `hasStudy=true` in the CMS
3. Click "Load More" to confirm no orphaned entries appear
4. Check browser console for errors (should be clean)

### Step 4: Update seed script (optional, recommended)

**File:** `prisma/seed.mts`

Remove or comment out the 9 orphaned bible study entries from the seed data so future re-seeds (`npx prisma db seed`) don't recreate orphans. Alternatively, link them to existing Messages by adding `relatedStudySlug` entries to the MESSAGES array.

Orphaned slugs to remove from seed:
- `do-you-truly-love-me`
- `the-lord-is-my-shepherd`
- `blessed-are-the-poor-in-spirit`
- `his-steadfast-love-endures-forever`
- `to-worship-him`
- `prepare-the-way`
- `christ-is-all`
- `set-your-minds-on-things-above`
- `watered-the-flock`

Also check for 2 additional slugs that may be in seed but not in the DB query results: `ephesians-2-the-gospel-summary` and `the-riches-of-grace-in-christ`.

---

## Files Affected

| File | Action | Description |
|---|---|---|
| Database (`BibleStudy` table) | **UPDATE** | Soft-delete 9 orphaned records |
| `prisma/seed.mts` | **Edit** (optional) | Remove orphaned study seeds |

**No code changes needed** — the DAL (`lib/dal/bible-studies.ts`) already filters by `deletedAt: null`, so soft-deleted records are automatically excluded from all queries on the public website.

---

## Key Files Reference

| File | Purpose |
|---|---|
| `lib/dal/bible-studies.ts` | DAL — queries `BibleStudy` table with `deletedAt: null` filter |
| `app/website/bible-study/page.tsx` | Public listing page — calls `getBibleStudies()` |
| `app/website/bible-study/[slug]/page.tsx` | Public detail page — calls `getBibleStudyBySlug()` |
| `components/website/sections/all-bible-studies.tsx` | Section component (server) |
| `components/website/sections/all-bible-studies-client.tsx` | Section component (client, filtering/search) |
| `lib/website/resolve-section-data.ts` | `all-bible-studies` data source resolution |
| `app/api/v1/bible-studies/route.ts` | REST API (GET list, POST create) |
| `app/api/v1/bible-studies/[slug]/route.ts` | REST API (GET/PATCH/DELETE single) |
| `prisma/schema.prisma` | Schema — `BibleStudy` model (line 628), `Message.relatedStudyId` (line 449) |
| `prisma/seed.mts` | Seed script — bible study entries (lines 1210-1240) |

---

## Future Consideration

When a **Bible Studies CMS management page** is built (currently no admin UI exists for `BibleStudy` CRUD), the soft-deleted records can be restored by setting `deletedAt = NULL`. This would allow admins to manage standalone bible studies that aren't tied to a Message. Until then, the CMS Messages page with its `hasStudy` indicator is the single management interface.
