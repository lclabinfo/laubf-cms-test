# Delete Strategy: Unified Lifecycle Management

> **Status:** Draft — 2026-03-17
> **Author:** David Lim + Claude
> **Scope:** All models with `deletedAt`, R2 storage cleanup, permanent purge, AI data hygiene

---

## Problem Statement

The current delete system has three compounding issues:

1. **Soft-deleted records accumulate forever.** There is no purge mechanism. Every "delete" just sets `deletedAt` and the row stays in the database indefinitely — inflating table sizes, polluting queries (every `WHERE` needs `deletedAt: null`), and feeding stale data to AI features.

2. **Inconsistent patterns across models.** Messages soft-delete. Media hard-deletes from R2. BibleStudy soft-deletes the record but hard-deletes attachments from R2 (making "restore" impossible). Person has both soft and permanent delete. Events soft-delete with no restore UI. There is no principled reason for the differences.

3. **R2 storage leaks.** When a BibleStudy is soft-deleted, its R2 attachments are immediately destroyed — but the DB record lingers. When a MediaAsset is soft-deleted, the R2 file is preserved — but there's no scheduled cleanup if the record is never permanently deleted. Orphan cleanup is manual via ad-hoc scripts.

### Why this matters for AI

Any AI features (transcript search, content suggestions, study recommendations) will query the database. Soft-deleted records with `deletedAt` set are invisible to normal queries but still exist as noise. If AI pipelines don't perfectly filter on `deletedAt`, they hallucinate from deleted content. A clean database is the best defense.

---

## Current State Audit

### Models with `deletedAt` (soft delete)

| Model | Hard Delete? | R2 Cleanup | Restore UI | Bulk Ops | Notes |
|-------|:---:|:---:|:---:|:---:|---|
| **Message** | No | No | Yes (undelete) | Yes | Also has separate `archivedAt` |
| **BibleStudy** | No | Yes (attachments only) | No | No | Attachments destroyed immediately — restore impossible |
| **MediaAsset** | Yes | Yes (on hard delete) | No | Yes | Soft delete preserves R2 file; hard delete removes it |
| **Event** | No | No | Yes (undelete) | Yes | |
| **Video** | No | No | No | No | |
| **Page** | No | No | No | No | PageSections cascade-delete |
| **Person** | Yes (`permanent=true`) | No | Yes (status change) | No | Uses `membershipStatus: ARCHIVED` alongside `deletedAt` |
| **Series** | No | No | No | No | |
| **Ministry** | No | No | No | No | |
| **Church** | No | No | No | No | |
| **User** | No | No | No | No | |

### Models with hard delete only (no `deletedAt`)

ContactSubmission, Role, PersonRoleDefinition, PersonRoleAssignment, MenuItem, CustomDomain, CustomField*, Household*, PersonNote, MediaFolder, BibleStudyAttachment, EventLink, MessageSeries

These are correct as hard deletes — they are either child/junction records (cascade-safe) or configuration objects with no user content worth preserving.

---

## Target Architecture

### Principle: Two-phase delete with automatic purge

Every user-facing content record follows the same lifecycle:

```
ACTIVE  →  TRASHED  →  PURGED
           (soft)      (hard + R2 cleanup)

        ← RESTORED ←
```

- **Trash** = set `deletedAt = now()`. Record is invisible in all normal queries. R2 files are NOT deleted yet.
- **Restore** = clear `deletedAt`. Record reappears with all its data and files intact.
- **Purge** = hard delete from DB + delete R2 files + cascade-delete child records. Irreversible.

### Automatic purge schedule

Soft-deleted records are automatically purged after a configurable retention period (default: **30 days**). This is enforced by a scheduled job, not by user action.

```
Trash retention: 30 days (configurable per church via SiteSettings)
Purge job cadence: Daily (cron or Vercel Cron)
```

### Which models get the two-phase lifecycle?

**Yes — user content worth preserving temporarily:**
- Message, BibleStudy, Event, MediaAsset, Video, Page, Series, Ministry, Person

**No — keep as hard delete (child/config records):**
- All junction tables, MenuItem, CustomDomain, ContactSubmission, Role definitions, CustomField definitions, Household, PersonNote

**No — keep as soft delete only, never auto-purge (admin records):**
- Church, User (these are too dangerous to auto-purge; manual admin action only)

---

## Implementation Plan

### Phase 1: Fix BibleStudy delete (immediate)

The most urgent inconsistency. Currently destroys R2 attachments on soft delete, making restore impossible.

**Changes:**
- `deleteBibleStudy()` → soft delete only. Do NOT delete R2 attachments.
- Remove the `deleteAllStudyAttachments()` call from the soft-delete path.
- R2 attachment cleanup moves to the purge job (Phase 3).

**Files:** `lib/dal/bible-studies.ts`
**Risk:** Low — the only caller is the message delete flow.
**Effort:** ~30 min

### Phase 2: Standardize restore across all soft-delete models (short-term)

Add restore capability to models that currently lack it.

**Changes:**
- Add `restoreMessage`, `restoreBibleStudy`, `restoreEvent`, `restoreVideo`, `restorePage`, `restoreSeries`, `restoreMinistry` DAL functions (clear `deletedAt`).
- Add `undelete` action to bulk endpoints that don't have it (events already have it; add to others).
- Message restore should also restore its linked BibleStudy if it was soft-deleted at the same time.

**Files:** `lib/dal/messages.ts`, `lib/dal/bible-studies.ts`, `lib/dal/events.ts`, `lib/dal/media.ts`, `lib/dal/pages.ts`, `lib/dal/series.ts`, `lib/dal/ministries.ts`
**Risk:** Low — additive only.
**Effort:** ~2 hours

### Phase 3: Purge job + R2 cleanup (short-term)

The core of the strategy. A scheduled job that permanently deletes records past the retention window.

**New file:** `app/api/v1/cron/purge-deleted/route.ts`

**Logic:**
```
1. Query all records where deletedAt < (now - retentionDays) across all soft-delete models
2. For each record:
   a. Delete associated R2 files (MediaAsset files, BibleStudy attachments, Person photos)
   b. Hard-delete child records not covered by cascade (if any)
   c. Hard-delete the record itself
3. Log purge results to AuditLog
```

**Scheduling options:**
- **Vercel Cron** (`vercel.json` cron config) — simplest, runs daily
- **External cron** (e.g., GitHub Actions scheduled workflow) — if not on Vercel
- **Manual trigger** via admin API — for testing and emergency cleanup

**R2 cleanup mapping:**
| Model | R2 files to delete |
|---|---|
| MediaAsset | The asset file itself (`keyFromMediaUrl`) |
| BibleStudy | All `BibleStudyAttachment` records → R2 keys |
| Person | `photoUrl` if hosted on R2 |
| Message | None (videos are external URLs) |
| Event | `imageUrl` if hosted on R2 |
| Page | None |
| Video | None (external URLs) |
| Series | `artworkUrl` if hosted on R2 |

**Files:** New cron route, `lib/dal/purge.ts` (new DAL module)
**Risk:** Medium — destructive by design. Needs thorough testing. Add dry-run mode.
**Effort:** ~4 hours

### Phase 4: Trash UI in CMS (medium-term)

Give users visibility into what's been deleted and the ability to restore or permanently delete.

**New pages:**
- `/cms/trash` — unified trash view across all content types
- Filter by type (messages, events, media, etc.)
- Show `deletedAt` timestamp and days remaining before auto-purge
- Actions: Restore, Permanently Delete (skip waiting for auto-purge)

**Files:** New page + components in `app/cms/(dashboard)/trash/`
**Risk:** Low — read-only + restore/delete actions that already exist.
**Effort:** ~4-6 hours

### Phase 5: Retire orphan cleanup scripts (cleanup)

Once the purge job handles R2 cleanup systematically, the manual scripts become unnecessary.

**Remove or archive:**
- `scripts/r2-cleanup.mts`
- `scripts/cleanup-orphaned-r2.mts`

**Keep the npm script** `cleanup-orphans` pointed at the purge API instead, for manual runs.

**Effort:** ~30 min

---

## Schema Changes

### Add retention config to SiteSettings

```prisma
model SiteSettings {
  // ... existing fields
  trashRetentionDays  Int  @default(30)
}
```

### No other schema changes needed

All soft-delete models already have `deletedAt DateTime?`. The purge job reads this field and hard-deletes when expired. No new columns required.

---

## AI Data Hygiene

### Current risk

Any AI feature that queries the database (search, recommendations, transcript analysis) must filter `deletedAt: null` on every query. If a single query misses this filter, deleted content leaks into AI responses.

### With the purge job

- Soft-deleted records exist for max 30 days (recoverable window)
- After 30 days, records are permanently gone — zero chance of AI hallucination from deleted content
- During the 30-day window, the existing `deletedAt: null` filters remain the guardrail

### Additional safeguard (optional)

Add a database view or Prisma middleware that automatically filters `deletedAt: null` on all queries. This eliminates the risk of forgetting the filter in new code.

```typescript
// prisma middleware approach (conceptual)
prisma.$use(async (params, next) => {
  if (SOFT_DELETE_MODELS.includes(params.model) && params.action === 'findMany') {
    params.args.where = { ...params.args.where, deletedAt: null }
  }
  return next(params)
})
```

**Recommendation:** Don't add middleware now. The purge job is the real fix. Middleware adds hidden behavior that makes debugging harder. Keep explicit `deletedAt: null` filters — they're grep-able and obvious.

---

## Migration: Clean Up Existing Soft-Deleted Records

Before the purge job goes live, run a one-time cleanup of all currently soft-deleted records.

```sql
-- Audit first: count soft-deleted records per table
SELECT 'Message' as model, COUNT(*) FROM "Message" WHERE "deletedAt" IS NOT NULL
UNION ALL
SELECT 'BibleStudy', COUNT(*) FROM "BibleStudy" WHERE "deletedAt" IS NOT NULL
UNION ALL
SELECT 'Event', COUNT(*) FROM "Event" WHERE "deletedAt" IS NOT NULL
UNION ALL
SELECT 'MediaAsset', COUNT(*) FROM "MediaAsset" WHERE "deletedAt" IS NOT NULL
UNION ALL
SELECT 'Video', COUNT(*) FROM "Video" WHERE "deletedAt" IS NOT NULL
UNION ALL
SELECT 'Page', COUNT(*) FROM "Page" WHERE "deletedAt" IS NOT NULL
UNION ALL
SELECT 'Person', COUNT(*) FROM "Person" WHERE "deletedAt" IS NOT NULL
UNION ALL
SELECT 'Series', COUNT(*) FROM "Series" WHERE "deletedAt" IS NOT NULL
UNION ALL
SELECT 'Ministry', COUNT(*) FROM "Ministry" WHERE "deletedAt" IS NOT NULL;
```

Review the counts, then run the purge job in dry-run mode to preview what would be deleted. Only after review, run the actual purge.

---

## Priority & Sequencing

| Phase | Priority | Depends On | Ship Target |
|---|---|---|---|
| 1. Fix BibleStudy delete | P0 | Nothing | This sprint |
| 2. Standardize restore | P1 | Phase 1 | This sprint |
| 3. Purge job | P1 | Phase 1 | Next sprint |
| 4. Trash UI | P2 | Phase 2 + 3 | Next sprint |
| 5. Retire scripts | P2 | Phase 3 | After Phase 3 ships |

**Phase 1 is the only blocker.** Everything else can be done incrementally.

---

## Decision Log

| Decision | Rationale |
|---|---|
| 30-day retention default | Long enough for "oh no" recovery, short enough to keep DB clean. Configurable per church. |
| No Prisma middleware for auto-filtering | Explicit `deletedAt: null` is grep-able and debuggable. Hidden middleware causes surprises. |
| R2 cleanup in purge job, not at soft-delete time | Enables restore with files intact. Single cleanup path instead of scattered R2 delete calls. |
| Hard delete child/config records immediately | Junction tables, menu items, custom fields have no user-facing "undo" expectation. Simpler. |
| Church + User never auto-purge | Too dangerous. Admin-only manual action. |
| Daily cron, not real-time purge | Batch is simpler, cheaper, and easier to audit. No need for real-time permanent deletion. |
