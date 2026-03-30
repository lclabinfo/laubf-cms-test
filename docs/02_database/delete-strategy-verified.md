# Delete Strategy: Verified Audit & Hard Delete Migration Plan

> **Status:** Verified against codebase — 2026-03-30
> **Replaces:** `docs/02_database/delete-strategy.md` (draft 2026-03-17), `docs/000-temp-docs-3-27/audits/soft-delete-audit.md` (2026-03-27), `docs/000-temp-docs-3-27/audits/backup-recovery-proposal.md` (2026-03-27)

---

## Summary

**Goal:** Switch all CMS content deletions from soft delete to hard delete so the database doesn't grow forever and no cron/purge job is needed.

**Current problem:** 11 models soft-delete (set `deletedAt`), rows stay forever, R2 files leak, and only Message has undelete. There is no purge job and no recovery system. This means every "deleted" record is a zombie that inflates the DB, pollutes queries (60 `deletedAt: null` filters across 13 DAL files), and will feed stale data to any future AI features.

**Solution:** Hard delete with R2 backup-before-delete for recovery. No purge cron needed — rows are gone immediately.

---

## Verified Current State (2026-03-30)

### 14 Models with `deletedAt` in Prisma Schema

| # | Model | Schema Line | DAL Delete Function | Delete Type | R2 Cleanup? | Restore? | Problem |
|---|-------|------------|--------------------:|-------------|:-----------:|:--------:|---------|
| 1 | **Church** | 57 | _None_ | — | — | — | Field exists but no delete function. Keep as-is (too dangerous). |
| 2 | **User** | 134 | _None_ | — | — | — | Field exists but no delete function. Keep as-is. |
| 3 | **Message** | 442 | `deleteMessage()` | SOFT | No | Yes (bulk undelete) | Rows stay forever. If linked BibleStudy, soft-deletes study too. |
| 4 | **Message** (bulk) | — | `bulkDeleteMessages()` | SOFT | No | Yes | `action: 'undelete'` supported in bulk endpoint. |
| 5 | **BibleStudy** | 667 | `deleteBibleStudy()` | SOFT | **Yes** (hard-deletes R2 attachments first) | No | **P0 bug:** Attachments destroyed on soft-delete = restore impossible. |
| 6 | **BibleStudy** (sync) | — | `unlinkMessageStudy()` | SOFT | **Yes** (same) | No | Same P0 bug as above. |
| 7 | **Event** | 559 | `deleteEvent()` | SOFT | No | No | Rows stay forever. EventLinks cascade on hard delete. |
| 8 | **Video** | 821 | `deleteVideo()` | SOFT | No | No | Rows stay forever. YouTube links only. |
| 9 | **Series** | 314 | `deleteSeries()` | SOFT | No | No | Rows stay forever. Messages/Studies get `seriesId: null` on cascade. |
| 10 | **Ministry** | 338 | `deleteMinistry()` | SOFT | No | No | Rows stay forever. Events get `ministryId: null` on cascade. |
| 11 | **Campus** | 366 | `deleteCampus()` | SOFT | No | No | Rows stay forever. Events get `campusId: null` on cascade. |
| 12 | **DailyBread** | 864 | `deleteDailyBread()` | SOFT | No | No | Rows stay forever. No relations. |
| 13 | **MediaAsset** | 892 | `deleteMediaAsset()` (soft) / `hardDeleteMediaAsset()` (hard) | BOTH | Hard only | No | Soft-delete leaks R2 files. Public API hard-deletes correctly. |
| 14 | **Announcement** | 928 | _None_ | — | — | — | Schema has `deletedAt` but no CMS UI, no DAL, no API route yet. |
| 15 | **Page** | 1103 | `deletePage()` | **HARD** | No | No | **Inconsistency:** Has `deletedAt` field but uses hard delete. Field is dead weight. |
| 16 | **Person** | 1432 | `deletePerson()` (soft) / `permanentDeletePerson()` (hard) | BOTH | No | No | Soft sets `deletedAt` + `membershipStatus: ARCHIVED`. Hard cascades cleanup. |

### Models That Already Hard Delete (correct — no changes needed)

| Model | DAL Function | Notes |
|-------|-------------|-------|
| PageSection | `deletePageSection()` | Also cascades when Page deleted |
| MediaFolder | `deleteFolder()` | Moves items to root, then deletes folder record |
| ContactSubmission | `deleteSubmission()` | Hard delete + batch support |
| Role | `deleteRole()` | Reassigns members to fallback role first |
| PersonRoleDefinition | `deleteRoleDefinition()` | Prevents system role deletion |
| PersonRoleAssignment | `removeRole()` | Junction table |
| PersonNote | `deletePersonNote()` | Hard delete |
| CustomFieldDefinition | `deleteCustomFieldDefinition()` | Hard delete |
| CustomFieldValue | `deleteCustomFieldValue()` | Junction table |
| Household | `deleteHousehold()` | Hard delete |
| HouseholdMember | `removeHouseholdMember()` | Junction table |
| MenuItem | `deleteMenuItem()` | Recursive descendants first |
| ChurchMember | `removeChurchUser()` | Bumps sessionVersion |
| BuilderFeedback | `deleteBuilderFeedback()` | Hard delete |
| CustomDomain | `deleteDomain()` | Hard delete |

### `deletedAt: null` Filter Count (verified)

| File | Count | Models |
|------|------:|--------|
| `lib/dal/media.ts` | 14 | MediaAsset |
| `lib/dal/messages.ts` | 11 | Message |
| `lib/dal/pages.ts` | 6 | Page, PageSection |
| `lib/dal/users.ts` | 5 | ChurchMember/User |
| `lib/dal/events.ts` | 4 | Event |
| `lib/dal/storage.ts` | 4 | MediaAsset (storage calcs) |
| `lib/dal/bible-studies.ts` | 4 | BibleStudy |
| `lib/dal/videos.ts` | 3 | Video |
| `lib/dal/series.ts` | 2 | Series |
| `lib/dal/daily-bread.ts` | 2 | DailyBread |
| `lib/dal/campuses.ts` | 2 | Campus |
| `lib/dal/ministries.ts` | 2 | Ministry |
| `lib/dal/people.ts` | 1 | Person |
| **Total** | **60** | **13 files** |

Note: `lib/website/resolve-section-data.ts` has zero `deletedAt` filters — it delegates to DAL functions.

---

## What Needs to Change: 11 Models → Hard Delete

### Tier 1: Simple (no R2 files, no cascade complexity)

These are straightforward `update({deletedAt})` → `delete()` swaps.

| Model | DAL Function | Side Effects on Hard Delete | Effort |
|-------|-------------|----------------------------|--------|
| **Event** | `deleteEvent()` | EventLink cascade-deletes automatically | LOW |
| **Video** | `deleteVideo()` | No relations | LOW |
| **Series** | `deleteSeries()` | Messages/Studies get `seriesId: null` (SetNull) | LOW |
| **Ministry** | `deleteMinistry()` | Events get `ministryId: null` (SetNull) | LOW |
| **Campus** | `deleteCampus()` | Events get `campusId: null` (SetNull) | LOW |
| **DailyBread** | `deleteDailyBread()` | No relations | LOW |

**Pattern for each:**
```typescript
// BEFORE:
export async function deleteEvent(churchId: string, id: string) {
  return prisma.event.update({
    where: { id, churchId },
    data: { deletedAt: new Date() },
  })
}

// AFTER:
export async function deleteEvent(churchId: string, id: string) {
  // Optional: backupBeforeDelete(...) if backup infra exists
  return prisma.event.delete({ where: { id, churchId } })
}
```

### Tier 2: Medium (has R2 files or linked records)

| Model | DAL Function | What Changes | Effort |
|-------|-------------|-------------|--------|
| **BibleStudy** | `deleteBibleStudy()` | Already cleans R2 attachments. Change `update({deletedAt})` → `delete()`. Fix is actually simpler than current code. | LOW-MED |
| **BibleStudy** (sync) | `unlinkMessageStudy()` | Same change — soft-delete → hard-delete after attachment cleanup | LOW-MED |
| **Message** | `deleteMessage()`, `bulkDeleteMessages()` | Change to hard delete. Remove `undelete` action from bulk endpoint. If linked study, hard-delete study too. | MEDIUM |
| **MediaAsset** | Remove `deleteMediaAsset()` entirely | All deletes go through `hardDeleteMediaAsset()`. Remove `bulkSoftDelete()`. | LOW-MED |
| **Person** | Remove `deletePerson()` soft-delete | All deletes go through `permanentDeletePerson()` (already handles cascade cleanup). | MEDIUM |

### Tier 3: Schema-only cleanup (no behavior change)

| Model | What Changes | Effort |
|-------|-------------|--------|
| **Page** | Remove `deletedAt` from schema (already hard-deletes, field is unused) | LOW |
| **Announcement** | Remove `deletedAt` from schema (no CMS UI, no DAL, no API) | LOW |
| **Church** | Keep `deletedAt` — admin-only, no auto-delete | NONE |
| **User** | Keep `deletedAt` — account deletion not implemented yet | NONE |

---

## Implementation Plan

### Phase 1: Backup Infrastructure (optional but recommended)

Create `backupBeforeDelete()` utility that snapshots the record to R2 before hard delete. This replaces soft-delete's "oops" recovery with a 30-day R2 backup. See `docs/000-temp-docs-3-27/audits/backup-recovery-proposal.md` for full design.

**If you skip this phase:** Hard deletes are truly permanent. For an MVP with a single church (LA UBF), this may be acceptable — David can restore from `pg_dump` if needed.

### Phase 2: Switch to Hard Delete (the main work)

**Order matters.** Do Tier 1 first (low risk, validates pattern), then Tier 2.

For each model:
1. Change DAL delete function from `update({deletedAt})` to `delete()`
2. Update API route if it references the return value differently
3. Remove `deletedAt: null` from all queries for that model
4. Remove partial indexes referencing `deletedAt` for that model

**Estimated total:** ~4-6 hours for all 11 models + filter removal.

### Phase 3: Schema Migration

After all code changes:
1. Remove `deletedAt` from: Message, BibleStudy, Event, Video, Series, Ministry, Campus, DailyBread, MediaAsset, Person, Page, Announcement
2. Keep `deletedAt` on: Church, User
3. Drop partial indexes that reference `deletedAt`
4. Run `prisma migrate dev --name remove-soft-deletes`

### Phase 4: Purge Existing Zombie Rows

One-time cleanup of any rows where `deletedAt IS NOT NULL`:
```sql
-- Audit counts first
SELECT 'Message' as model, COUNT(*) FROM "Message" WHERE "deletedAt" IS NOT NULL
UNION ALL SELECT 'BibleStudy', COUNT(*) FROM "BibleStudy" WHERE "deletedAt" IS NOT NULL
UNION ALL SELECT 'Event', COUNT(*) FROM "Event" WHERE "deletedAt" IS NOT NULL
UNION ALL SELECT 'MediaAsset', COUNT(*) FROM "MediaAsset" WHERE "deletedAt" IS NOT NULL
UNION ALL SELECT 'Video', COUNT(*) FROM "Video" WHERE "deletedAt" IS NOT NULL
UNION ALL SELECT 'Series', COUNT(*) FROM "Series" WHERE "deletedAt" IS NOT NULL
UNION ALL SELECT 'Ministry', COUNT(*) FROM "Ministry" WHERE "deletedAt" IS NOT NULL
UNION ALL SELECT 'Campus', COUNT(*) FROM "Campus" WHERE "deletedAt" IS NOT NULL
UNION ALL SELECT 'DailyBread', COUNT(*) FROM "DailyBread" WHERE "deletedAt" IS NOT NULL
UNION ALL SELECT 'Person', COUNT(*) FROM "Person" WHERE "deletedAt" IS NOT NULL
UNION ALL SELECT 'Page', COUNT(*) FROM "Page" WHERE "deletedAt" IS NOT NULL
UNION ALL SELECT 'Announcement', COUNT(*) FROM "Announcement" WHERE "deletedAt" IS NOT NULL;
```

Then hard-delete those rows (with R2 cleanup for MediaAsset/BibleStudy attachments) before running the schema migration.

### Phase 5: R2 Staging Cleanup (independent)

Orphaned staging files (`{churchSlug}/staging/*`) from abandoned uploads need periodic cleanup. This is the only part that actually needs a cron job — but it's for upload leftovers, not deleted content.

---

## What This Eliminates

| Before | After |
|--------|-------|
| 11 models soft-delete, rows stay forever | Hard delete, rows gone immediately |
| 60 `deletedAt: null` filters across 13 files | Zero filters needed |
| No purge job (data grows forever) | No purge job needed (nothing to purge) |
| R2 files leak on MediaAsset soft-delete | R2 cleaned up at delete time |
| BibleStudy attachments destroyed but row lingers | Row and attachments both gone |
| Only Message has undelete | Optional R2 backup provides universal restore |
| Partial indexes for `deletedAt IS NULL` | Simpler regular indexes |

---

## Cascade Behavior Reference (verified from schema)

### `onDelete: Cascade` (child auto-deleted)

| Parent → Child | Safe? |
|---------------|:-----:|
| Church → everything | Yes (nuclear option) |
| Message → MessageSeries | Yes |
| BibleStudy → BibleStudyAttachment | Yes |
| Event → EventLink | Yes |
| Page → PageSection | Yes |
| User → Account, Session, ChurchMember | Yes |

### `onDelete: SetNull` (FK nulled)

| Parent → Child.FK | Effect |
|-------------------|--------|
| Person → Message.speakerId | Speaker cleared |
| BibleStudy → Message.relatedStudyId | Study link cleared |
| Ministry → Event.ministryId | Ministry cleared |
| Campus → Event.campusId | Campus cleared |
| Series → BibleStudy.seriesId | Series cleared |
| Series → Message (via MessageSeries) | Junction row cascades |

---

## Website Builder: Confirmed Hard Delete (no issues)

The builder and CMS pages manager both use the same API endpoints, which call `prisma.page.delete()` (hard delete). PageSections cascade-delete automatically. The builder implements client-side "undo" by capturing full page data before DELETE and re-creating via POST if the user clicks Undo. No soft-delete involved.

The Page model's `deletedAt DateTime?` field is **dead weight** — never set by any current code path. There is 1 zombie Page in the DB ("test", soft-deleted 2026-03-21) that was created outside the normal flow (likely Prisma Studio or direct SQL). The 6 `deletedAt: null` filters in `pages.ts` are technically unnecessary since `deletePage()` hard-deletes, but they exist as a safety net.

**Action:** Remove `deletedAt` from Page and Announcement schemas as part of the hard-delete migration. These fields are unused.

---

## Related: Bible Study Data Anomalies

See `docs/02_database/bible-study-data-anomalies.md` for a detailed catalog of:
- 24 orphaned BibleStudy duplicates from the legacy migration (safe to delete)
- 8 empty conference BibleStudy shells linked to messages (review needed)
- 1 zombie soft-deleted Page row

---

## Corrections to Previous Documents

The following inaccuracies were found in the earlier docs:

| Document | Claim | Actual |
|----------|-------|--------|
| `delete-strategy.md` (2026-03-17) | "11 models with deletedAt" | **14 models** — was missing Announcement, Page, Person |
| `delete-strategy.md` | Lists DailyBread and Campus as absent | Both exist in schema and have soft-delete DAL functions |
| `soft-delete-audit.md` (2026-03-27) | "59 query locations" | **60 occurrences** (bible-studies.ts has 4, not 3) |
| `soft-delete-audit.md` | Event has "No" undelete | Correct — Event does NOT have undelete. Earlier `delete-strategy.md` incorrectly said "Yes (undelete)" |
| `delete-strategy.md` | Event: "Restore UI: Yes" | **No** — Event has no restore/undelete capability |
| `delete-strategy.md` | Doesn't mention Announcement | Announcement has `deletedAt` in schema (line 928) but no DAL/API |
| `delete-strategy.md` | Doesn't mention AccessRequest model | AccessRequest exists (line 1675) but has no `deletedAt` — correct to omit |
| `backup-recovery-proposal.md` | References `listObjects` function | This function doesn't exist in `lib/storage/r2.ts` — would need to be created |
