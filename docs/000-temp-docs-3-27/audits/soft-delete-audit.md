# Soft Delete Audit & Hard Delete Migration Plan

> **Date**: 2026-03-27
> **Problem**: Soft deletes cause the database to grow indefinitely. Deleted content is never reclaimed. R2 files for soft-deleted records remain stored and count against the storage quota.
> **Goal**: Switch to hard deletes with a cloud-based backup/recovery system so the database and R2 storage actually shrink when users delete content.

---

## Current State: Every Model's Deletion Behavior

### Models That Soft Delete (13 models — data never leaves the DB)

| Model | DAL Function | API Route | R2 Files? | Undelete? | Notes |
|-------|-------------|-----------|-----------|-----------|-------|
| **Message** | `deleteMessage()` | `DELETE /api/v1/messages/[slug]` | No direct files | Yes (bulk undelete) | If linked to BibleStudy, also soft-deletes the study |
| **Message** (bulk) | `bulkDeleteMessages()` | `POST /api/v1/messages/bulk` | No | Yes (bulk undelete) | Supports `action: 'undelete'` |
| **BibleStudy** | `deleteBibleStudy()` | `DELETE /api/v1/bible-studies/[slug]` | **Yes** — hard-deletes attachment R2 files first | No | Attachments are cleaned up, but study row stays forever |
| **Event** | `deleteEvent()` | `DELETE /api/v1/events/[slug]` | No | No | Row stays in DB forever |
| **Video** | `deleteVideo()` | `DELETE /api/v1/videos/[slug]` | No (YouTube links only) | No | Row stays forever |
| **Series** | `deleteSeries()` | `DELETE /api/v1/series/[id]` | No | No | Row stays forever |
| **Ministry** | `deleteMinistry()` | `DELETE /api/v1/ministries/[id]` | No | No | Row stays forever |
| **Campus** | `deleteCampus()` | `DELETE /api/v1/campuses/[id]` | No | No | Row stays forever |
| **DailyBread** | `deleteDailyBread()` | `DELETE /api/v1/daily-bread/[id]` | No | No | Row stays forever |
| **Person** | `deletePerson()` | `DELETE /api/v1/people/[id]` | No | No | Also sets `membershipStatus: 'ARCHIVED'` |
| **MediaAsset** | `deleteMediaAsset()` | (not exposed — only used internally) | **Yes** — R2 file NOT cleaned up | No | Soft delete used for internal "trash" state |
| **Announcement** | (no DAL function yet) | (no API route yet) | No | No | Schema has `deletedAt` but no CMS UI yet |
| **BibleStudy** (via sync) | `unlinkMessageStudy()` | Called from message delete | **Yes** — hard-deletes R2 files | No | Soft-deletes study after cleaning attachments |

### Models That Hard Delete (always removed from DB)

| Model | DAL Function | API Route | R2 Cleanup? | Notes |
|-------|-------------|-----------|-------------|-------|
| **Page** | `deletePage()` | `DELETE /api/v1/pages/[slug]` | No | **Has `deletedAt` field but uses hard delete** — inconsistent |
| **PageSection** | `deletePageSection()` | `DELETE /api/v1/pages/[slug]/sections/[id]` | No | Also cascade-deleted when Page is deleted |
| **MediaAsset** | `hardDeleteMediaAsset()` | `DELETE /api/v1/media/[id]` | **Yes** | Public API does hard delete + R2 cleanup |
| **MediaAsset** (bulk) | `bulkHardDelete()` | `POST /api/v1/media/bulk-delete` | **Yes** | Bulk hard delete + R2 cleanup |
| **MediaAsset** (by URL) | `hardDeleteMediaAssetByUrl()` | `DELETE /api/v1/media/by-url` | **Yes** | Hard delete by URL + R2 cleanup |
| **MediaFolder** | `deleteFolder()` | `DELETE /api/v1/media/folders/[id]` | No (moves items to root) | Hard delete of folder record only |
| **Person** | `permanentDeletePerson()` | (not exposed via API) | No | Cascading cleanup of related records |
| **Role** | `deleteRole()` | `DELETE /api/v1/roles/[id]` | No | Hard delete |
| **PersonRoleDefinition** | `deleteRoleDefinition()` | `DELETE /api/v1/roles/[id]` | No | Hard delete |
| **PersonRoleAssignment** | `removeAssignment()` | `DELETE /api/v1/roles/[id]/assignments/[assignmentId]` | No | Hard delete |
| **PersonNote** | `deleteNote()` | `DELETE /api/v1/people/[id]/notes/[noteId]` | No | Hard delete |
| **CustomFieldDefinition** | `deleteCustomField()` | `DELETE /api/v1/custom-fields/[id]` | No | Hard delete |
| **Household** | `deleteHousehold()` | `DELETE /api/v1/households/[id]` | No | Hard delete |
| **HouseholdMember** | `removeMember()` | (part of household API) | No | Hard delete |
| **MenuItem** | (inline in menus DAL) | `DELETE /api/v1/menus/[id]/items/[itemId]` | No | Hard delete |
| **ContactSubmission** | `deleteSubmission()` | `DELETE /api/v1/form-submissions/[id]` | No | Hard delete |
| **ChurchMember** | `removeChurchUser()` | `DELETE /api/v1/users/[id]` | No | Hard delete (removes CMS access) |
| **BuilderFeedback** | `deleteFeedback()` | (builder internal) | No | Hard delete |
| **CustomDomain** | `deleteCustomDomain()` | (domain management) | No | Hard delete |

### Models with `deletedAt` That Have No Delete Function

| Model | Notes |
|-------|-------|
| **Church** | `deletedAt` exists in schema but no delete function. Cascade would delete everything. |
| **User** | `deletedAt` exists but no delete function. Account deletion not implemented. |

---

## Problems with Current Approach

### 1. Database grows forever
Soft-deleted rows are never purged. With 1,185 bible studies and 1,176 messages, even deleting half would leave ~1,000 zombie rows with ~40 MB of text content sitting in PostgreSQL TOAST tables, counted in every `COUNT(*)` unless `WHERE deletedAt IS NULL` is present.

### 2. R2 storage leaks for soft-deleted MediaAssets
When `deleteMediaAsset()` soft-deletes a media record, the R2 file is **not** cleaned up. The file continues consuming storage quota. Only `hardDeleteMediaAsset()` (the public API) does R2 cleanup.

### 3. Orphaned R2 staging files
Upload flow creates staging files in R2 (`{churchSlug}/staging/{uuid}-{filename}`). If the user uploads but never saves (closes tab, navigates away, upload fails at step 3), the staging file stays in R2 permanently. No cleanup job exists.

### 4. Inconsistent deletion patterns
- Page has `deletedAt` field but uses hard delete
- MediaAsset has both soft delete (internal) and hard delete (public API)
- BibleStudy soft-deletes but hard-deletes its attachments first
- Message bulk supports undelete; nothing else does

### 5. No recovery mechanism
Only Message supports undelete (via bulk action). All other soft-deletes have no restore UI. The soft-deleted data just sits there with no way for users to recover it and no system to eventually purge it.

### 6. Partial index waste
The Priority 6 partial indexes (`WHERE deletedAt IS NULL`) improve query performance, but soft-deleted rows still consume disk space, vacuum cycles, and bloat the main heap.

---

## Impact Analysis: Switching Each Model to Hard Delete

### Low Risk (no side effects beyond row removal)

| Model | Side Effects | Migration Effort |
|-------|-------------|-----------------|
| **Event** | EventLink cascade-deletes automatically | LOW — change `update` to `delete` |
| **Video** | No relations | LOW |
| **Series** | Messages/BibleStudies with `seriesId` get FK set to NULL (`onDelete: SetNull`) | LOW |
| **Ministry** | Events with `ministryId` get FK set to NULL | LOW |
| **Campus** | Events with `campusId` get FK set to NULL | LOW |
| **DailyBread** | No relations | LOW |
| **Announcement** | No relations, no CMS UI yet | LOW |

### Medium Risk (has relations or files)

| Model | Side Effects | Migration Effort |
|-------|-------------|-----------------|
| **BibleStudy** | Already cleans up R2 attachments before soft-delete. Switch to hard delete after attachment cleanup. `relatedMessage.relatedStudyId` gets set to NULL. | MEDIUM |
| **Message** | MessageSeries junction rows cascade-delete. Messages with `relatedStudyId` need to handle linked studies. Need to remove undelete support or replace with backup. | MEDIUM |
| **MediaAsset** (internal soft-delete) | Remove `deleteMediaAsset()` soft-delete function entirely. All deletes go through `hardDeleteMediaAsset()` with R2 cleanup. | LOW-MEDIUM |
| **Person** | Has cascading cleanup in `permanentDeletePerson()`. Need to verify all related records (notes, assignments, household memberships, custom field values) are cleaned up. Communication preferences cascade. | MEDIUM |

### High Risk (needs careful planning)

| Model | Side Effects | Migration Effort |
|-------|-------------|-----------------|
| **Page** | Already hard-deletes (inconsistent with schema). No change needed for deletion, but backup system should capture page content before delete since pages are complex (multiple sections with JSON content). | LOW (already hard) but needs backup |

---

## Proposed Plan

### Phase 1: Backup Infrastructure (do first)

Before switching any soft delete to hard delete, set up the recovery system.

#### 1a. R2 Backup Bucket
- [ ] Create a separate R2 bucket: `laubf-cms-backups`
- [ ] Bucket structure: `{churchSlug}/deleted/{model}/{id}/{timestamp}.json`
- [ ] Each backup file contains the full record + all related records as JSON
- [ ] Set R2 lifecycle rule: auto-delete after 30 days (configurable per church)

#### 1b. Backup Utility (`lib/backup/deleted-record.ts`)
- [ ] Create `backupBeforeDelete(model, id, record, relations?)` function
- [ ] Serializes the record + optional relations to JSON
- [ ] Uploads to the backup bucket with timestamp key
- [ ] Fire-and-forget (don't block deletion if backup fails — log warning)
- [ ] Include metadata: `deletedBy`, `deletedAt`, `model`, `churchId`

#### 1c. Restore API (`/api/v1/restore/[model]/[id]`)
- [ ] Admin-only endpoint
- [ ] Reads backup JSON from R2
- [ ] Re-creates the record in the database
- [ ] For records with R2 files (media, attachments): restore from backup if file still exists, otherwise mark as "file missing"
- [ ] Returns the restored record

#### 1d. CMS Trash View (optional, can defer)
- [ ] `/cms/trash` page listing recent deletions from R2 backup bucket
- [ ] "Restore" button per item
- [ ] Shows auto-purge countdown (e.g., "Deleted 5 days ago — auto-purges in 25 days")

### Phase 2: Switch Content Models to Hard Delete

These are the main content models that users interact with in the CMS.

#### 2a. Message
- [ ] In `deleteMessage()`: backup record to R2, then `prisma.message.delete()` (cascade handles MessageSeries)
- [ ] In `bulkDeleteMessages()`: backup each record, then `prisma.message.deleteMany()`
- [ ] Remove `undeleteMessages()` — replaced by restore from backup
- [ ] If message has `relatedStudyId`: backup + delete linked study too (same as current behavior but hard delete)
- [ ] Update `POST /api/v1/messages/bulk` to remove `'undelete'` action (replace with restore API)

**Side effects:**
- `MessageSeries` junction rows cascade-delete (desired)
- `relatedStudyId` on other messages: SetNull (safe)
- Website section queries (`ALL_MESSAGES`, etc.) already filter `deletedAt: null` — after switch, the filter becomes unnecessary but harmless

#### 2b. BibleStudy
- [ ] Already cleans up R2 attachments. Add backup step before delete.
- [ ] Change `prisma.bibleStudy.update({ data: { deletedAt } })` to `prisma.bibleStudy.delete()`
- [ ] `BibleStudyAttachment` rows cascade-delete (already cleaned up by `deleteAllStudyAttachments()`)
- [ ] `Message.relatedStudyId` gets set to NULL (`onDelete: SetNull`)

#### 2c. Event
- [ ] Backup record (include EventLink relations in backup JSON)
- [ ] Change to `prisma.event.delete()` — EventLink cascade-deletes

#### 2d. Video, Series, Ministry, Campus, DailyBread, Announcement
- [ ] Backup record, then hard delete
- [ ] All have simple relations (SetNull FKs or no children)

#### 2e. Person
- [ ] Use existing `permanentDeletePerson()` pattern (cascading cleanup)
- [ ] Add backup step before permanent delete
- [ ] Remove the soft-delete `deletePerson()` — go directly to permanent delete
- [ ] Backup should include: person record, role assignments, household memberships, notes, custom field values, communication preferences

### Phase 3: Clean Up MediaAsset Soft Delete

- [ ] Remove `deleteMediaAsset()` (soft delete) from DAL
- [ ] All media deletion goes through `hardDeleteMediaAsset()` (already does R2 cleanup)
- [ ] Add backup step (JSON metadata only — the R2 file itself is gone, but the metadata tells you what was there)
- [ ] Update any internal callers of `deleteMediaAsset()` to use `hardDeleteMediaAsset()`

### Phase 4: Purge Existing Soft-Deleted Records

- [ ] Write a one-time migration script
- [ ] For each model: find all records where `deletedAt IS NOT NULL`
- [ ] Back up each to R2 backup bucket
- [ ] Hard-delete from database
- [ ] Report: count of records purged per model, total DB space reclaimed
- [ ] Run `VACUUM FULL` on affected tables to reclaim disk space

### Phase 5: R2 Staging Cleanup

- [ ] Create cleanup function: `cleanupStagingFiles(olderThanHours: number)`
- [ ] Lists all objects under `{churchSlug}/staging/` prefix
- [ ] Deletes any older than the threshold (default: 24 hours)
- [ ] Wire up to a cron job or call periodically from a health-check endpoint
- [ ] Log results: files cleaned, bytes reclaimed

### Phase 6: Schema Cleanup

- [ ] Remove `deletedAt` field from all models (migration)
- [ ] Remove all `deletedAt: null` filters from DAL queries (59 occurrences across 13 files)
- [ ] Remove partial indexes that reference `deletedAt` (Priority 6 indexes become regular indexes)
- [ ] Drop `deletedAt` from the `Page` model (was never used anyway — Page already hard-deletes)
- [ ] Update `deletedAt`-based query patterns in `resolve-section-data.ts` and website queries

---

## Filter Removal Impact (Phase 6)

Removing `deletedAt: null` from queries touches 59 query locations across 13 DAL files:

| File | Occurrences | Models |
|------|-------------|--------|
| `lib/dal/media.ts` | 14 | MediaAsset |
| `lib/dal/messages.ts` | 11 | Message |
| `lib/dal/pages.ts` | 6 | Page, PageSection |
| `lib/dal/users.ts` | 5 | ChurchMember/User |
| `lib/dal/events.ts` | 4 | Event |
| `lib/dal/storage.ts` | 4 | MediaAsset (storage calculations) |
| `lib/dal/bible-studies.ts` | 3 | BibleStudy |
| `lib/dal/videos.ts` | 3 | Video |
| `lib/dal/series.ts` | 2 | Series |
| `lib/dal/daily-bread.ts` | 2 | DailyBread |
| `lib/dal/campuses.ts` | 2 | Campus |
| `lib/dal/ministries.ts` | 2 | Ministry |
| `lib/dal/people.ts` | 1 | Person |

After hard delete migration, these filters become unnecessary. They can be removed in a single pass (search-and-replace `deletedAt: null,` with empty string, then clean up any empty `where` clauses).

---

## Cascade Behavior Reference

These `onDelete: Cascade` relations auto-delete child records when parent is hard-deleted:

| Parent → Child | Effect |
|---------------|--------|
| Church → (everything) | Deleting a church cascade-deletes ALL content |
| Message → MessageSeries | Junction rows auto-deleted |
| BibleStudy → BibleStudyAttachment | Attachment rows auto-deleted |
| Event → EventLink | Link rows auto-deleted |
| Page → PageSection | Section rows auto-deleted |
| User → Account, Session, ChurchMember | Auth records auto-deleted |

These `onDelete: SetNull` relations null out the FK:

| Parent → Child.FK | Effect |
|-------------------|--------|
| Person → Message.speakerId | Speaker field nulled |
| BibleStudy → Message.relatedStudyId | Link to study nulled |
| Ministry → Event.ministryId | Ministry field nulled |
| Campus → Event.campusId | Campus field nulled |
| Series → BibleStudy.seriesId | Series field nulled |

---

## Risk Mitigation

1. **Phase 1 must be complete before Phase 2** — no hard deletes without the backup system in place
2. **Test cascade behavior** — verify that deleting a Message with MessageSeries entries doesn't leave orphans
3. **R2 backup lifecycle** — 30-day retention by default, but make it configurable so churches can extend if needed
4. **Backup failures must not block deletion** — fire-and-forget with warning logs
5. **Storage quota** — backup bucket should NOT count against the church's media storage quota (it's a separate bucket)
6. **Website cache invalidation** — hard-deleted content must trigger `revalidatePath`/`revalidateTag` (same as current soft-delete behavior, no change needed)
