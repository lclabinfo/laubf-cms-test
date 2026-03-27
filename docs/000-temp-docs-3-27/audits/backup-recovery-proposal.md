# Backup & Recovery System Proposal

> **Date**: 2026-03-27
> **Goal**: Replace soft deletes with hard deletes while providing a recovery mechanism that doesn't consume local server storage or bloat the PostgreSQL database.

---

## Architecture Overview

```
User clicks "Delete" in CMS
        │
        ▼
  ┌─────────────────┐
  │  Backup to R2   │  ← JSON snapshot of record + relations
  │  (fire & forget)│    uploaded to separate backup bucket
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  Hard Delete     │  ← prisma.model.delete() removes row from DB
  │  from PostgreSQL │    CASCADE handles child records
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  Delete R2 files │  ← For models with files (MediaAsset, Attachments)
  │  (if applicable) │    Already implemented for media
  └─────────────────┘


Recovery path:
  Admin clicks "Restore" in CMS Trash view
        │
        ▼
  ┌─────────────────┐
  │  Read backup     │  ← Download JSON from R2 backup bucket
  │  from R2         │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  Re-create       │  ← prisma.model.create() with original data
  │  in PostgreSQL   │    (new UUID to avoid conflicts)
  └─────────────────┘
```

---

## Why R2 Backup Bucket (Not Local, Not PostgreSQL)

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Soft delete (current)** | Simple, instant restore | DB grows forever, queries slower, R2 files leak | **Reject** |
| **Trash table in PostgreSQL** | Single system, queryable | Still grows the DB, still on local disk | **Reject** |
| **Local JSON files** | Simple | Consumes server disk, no redundancy, lost on server rebuild | **Reject** |
| **R2 backup bucket** | Zero server disk usage, auto-lifecycle (30-day TTL), cheap ($0.015/GB/month), Cloudflare-native | Extra R2 API calls on delete | **Winner** |
| **PostgreSQL `pg_dump` cron** | Full database backup | Doesn't help with individual record recovery, large dumps | **Complement** — use for disaster recovery, not per-record |

### Recommended: R2 Backup Bucket + Periodic `pg_dump`

- **Per-record recovery**: R2 backup bucket with 30-day lifecycle
- **Full disaster recovery**: Automated `pg_dump` to R2 (daily, keep 7 days)

---

## R2 Backup Bucket Design

### Bucket Configuration

```
Bucket name:  laubf-cms-backups
Region:       auto (same as media bucket)
Lifecycle:    Delete objects after 30 days (default)
Access:       Same R2 credentials as media bucket
```

### Key Structure

```
{churchSlug}/deleted/{model}/{recordId}/{timestamp}.json

Examples:
la-ubf/deleted/message/0fa566fe-4727-415e-8012-a051106f3e72/2026-03-27T17:30:00Z.json
la-ubf/deleted/event/ce07f334-67ef-4a28-aab7-c703ca3e8ed5/2026-03-27T18:00:00Z.json
la-ubf/deleted/person/abc123/2026-03-27T18:15:00Z.json
```

### Backup JSON Schema

```typescript
interface DeletedRecordBackup {
  /** Schema version for forward compatibility */
  version: 1
  /** Model name (Message, Event, Person, etc.) */
  model: string
  /** Original record ID */
  recordId: string
  /** Church ID */
  churchId: string
  /** Who deleted it (user ID) */
  deletedBy: string | null
  /** When it was deleted */
  deletedAt: string // ISO 8601
  /** The full record as it existed before deletion */
  record: Record<string, unknown>
  /** Related records that were cascade-deleted */
  relations: {
    [relationName: string]: Record<string, unknown>[]
  }
  /** R2 file keys that were deleted (for reference — files are gone) */
  deletedFiles: string[]
}
```

### Example Backup (Message)

```json
{
  "version": 1,
  "model": "Message",
  "recordId": "0fa566fe-4727-415e-8012-a051106f3e72",
  "churchId": "abc-123",
  "deletedBy": "user-456",
  "deletedAt": "2026-03-27T17:30:00.000Z",
  "record": {
    "id": "0fa566fe-4727-415e-8012-a051106f3e72",
    "title": "Behold Your King!",
    "slug": "behold-your-king",
    "dateFor": "2026-03-21",
    "speakerId": "speaker-789",
    "rawTranscript": "...",
    "studySections": [...]
  },
  "relations": {
    "messageSeries": [
      { "id": "ms-1", "seriesId": "series-1", "sortOrder": 1 }
    ]
  },
  "deletedFiles": []
}
```

---

## Implementation: Backup Utility

### `lib/backup/deleted-record.ts`

```typescript
import { PutObjectCommand } from "@aws-sdk/client-s3"
// Uses same S3 client as r2.ts

const BACKUP_BUCKET = process.env.R2_BACKUP_BUCKET_NAME!

interface BackupOptions {
  model: string
  recordId: string
  churchId: string
  deletedBy?: string | null
  record: Record<string, unknown>
  relations?: Record<string, Record<string, unknown>[]>
  deletedFiles?: string[]
}

export async function backupBeforeDelete(opts: BackupOptions): Promise<void> {
  const churchSlug = process.env.CHURCH_SLUG || "la-ubf"
  const timestamp = new Date().toISOString()
  const key = `${churchSlug}/deleted/${opts.model.toLowerCase()}/${opts.recordId}/${timestamp}.json`

  const backup = {
    version: 1,
    model: opts.model,
    recordId: opts.recordId,
    churchId: opts.churchId,
    deletedBy: opts.deletedBy ?? null,
    deletedAt: timestamp,
    record: opts.record,
    relations: opts.relations ?? {},
    deletedFiles: opts.deletedFiles ?? [],
  }

  try {
    await getClient().send(new PutObjectCommand({
      Bucket: BACKUP_BUCKET,
      Key: key,
      Body: JSON.stringify(backup),
      ContentType: "application/json",
    }))
  } catch (err) {
    // Fire-and-forget: log but don't block deletion
    console.error(`[backup] Failed to backup ${opts.model}/${opts.recordId}:`, err)
  }
}
```

### Usage in DAL (Example: Event)

```typescript
// BEFORE (soft delete):
export async function deleteEvent(churchId: string, id: string) {
  return prisma.event.update({
    where: { id, churchId },
    data: { deletedAt: new Date() },
  })
}

// AFTER (hard delete with backup):
export async function deleteEvent(churchId: string, id: string, deletedBy?: string) {
  const event = await prisma.event.findFirst({
    where: { id, churchId },
    include: { eventLinks: true },
  })
  if (!event) return null

  await backupBeforeDelete({
    model: "Event",
    recordId: id,
    churchId,
    deletedBy,
    record: event as unknown as Record<string, unknown>,
    relations: { eventLinks: event.eventLinks },
  })

  return prisma.event.delete({ where: { id } })
}
```

---

## Implementation: Restore API

### `POST /api/v1/restore`

```typescript
// Request body:
{ model: "Event", recordId: "abc-123" }

// Flow:
// 1. List backup files for that model/id in R2
// 2. Download the most recent one
// 3. Re-create the record (with new ID to avoid conflicts)
// 4. Return the restored record
```

### Restore Limitations

| Scenario | Restorable? | Notes |
|----------|------------|-------|
| Record deleted < 30 days ago | Yes | Backup exists in R2 |
| Record deleted > 30 days ago | No | Lifecycle rule purged the backup |
| Record with R2 files (media) | Partial | Metadata restored, but the file is gone. User must re-upload. |
| Record with cascade relations | Yes | Relations stored in backup JSON, re-created on restore |
| Record whose parent was deleted | Depends | If parent (e.g., Church) was deleted, restore fails. Check first. |

---

## Implementation: Periodic `pg_dump` to R2

For full disaster recovery (not per-record), run a daily database backup.

### Cron Script (`scripts/backup-database.sh`)

```bash
#!/bin/bash
# Run daily via cron: 0 3 * * * /path/to/backup-database.sh

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
DUMP_FILE="/tmp/laubf_cms_${TIMESTAMP}.sql.gz"
R2_KEY="la-ubf/db-backups/${TIMESTAMP}.sql.gz"

# Dump and compress
pg_dump -U laubf_cms laubf_cms | gzip > "$DUMP_FILE"

# Upload to R2 backup bucket (using rclone or aws cli)
aws s3 cp "$DUMP_FILE" "s3://laubf-cms-backups/${R2_KEY}" \
  --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

# Clean up local file
rm "$DUMP_FILE"

echo "Backup uploaded: ${R2_KEY}"
```

### R2 Lifecycle for DB Backups

```
Prefix: la-ubf/db-backups/
Lifecycle: Delete after 7 days
```

Keep 7 daily backups. For longer retention, could keep weekly backups for 30 days.

---

## Implementation: R2 Staging Cleanup

### `lib/storage/cleanup-staging.ts`

```typescript
import { listObjects, deleteObject, MEDIA_BUCKET } from "./r2"

export async function cleanupStagingFiles(
  churchSlug: string,
  olderThanHours = 24
): Promise<{ deleted: number; bytesReclaimed: number }> {
  const cutoff = Date.now() - olderThanHours * 60 * 60 * 1000
  let deleted = 0
  let bytesReclaimed = 0

  for await (const obj of listObjects(`${churchSlug}/staging/`, MEDIA_BUCKET)) {
    // R2 objects have LastModified, but listObjects returns size only.
    // Use HeadObject to check age, or parse UUID timestamp from key.
    // For simplicity, delete all staging files — they should be promoted
    // within minutes. Anything still in staging/ is orphaned.
    try {
      await deleteObject(obj.key, MEDIA_BUCKET)
      deleted++
      bytesReclaimed += obj.size
    } catch {
      // best effort
    }
  }

  return { deleted, bytesReclaimed }
}
```

### Wire up to health check or cron

```typescript
// Option A: API endpoint called by external cron
// POST /api/v1/admin/cleanup-staging (admin-only)

// Option B: Call on server startup after a delay
// setTimeout(() => cleanupStagingFiles('la-ubf'), 60_000)
```

---

## Rollout Order

| Phase | What | Depends On | Effort |
|-------|------|-----------|--------|
| **1a** | Create R2 backup bucket + env vars | Nothing | LOW — Cloudflare dashboard |
| **1b** | `backupBeforeDelete()` utility | 1a | LOW — one file |
| **1c** | Restore API | 1b | MEDIUM — API route + DAL |
| **2a** | Switch simple models (Event, Video, Series, Ministry, Campus, DailyBread) | 1b | LOW — 6 DAL functions |
| **2b** | Switch Message + BibleStudy | 1b, 2a tested | MEDIUM — cascade logic |
| **2c** | Switch Person | 1b | MEDIUM — cascading cleanup |
| **2d** | Remove MediaAsset soft delete | 1b | LOW — already has hard delete |
| **3** | Purge existing soft-deleted records | 2a-2d | LOW — one-time script |
| **4** | Remove `deletedAt` from schema + queries | 3 | MEDIUM — 59 query sites, migration |
| **5** | Staging cleanup job | Nothing | LOW |
| **6** | `pg_dump` cron to R2 | 1a | LOW — bash script |
| **7** | CMS Trash view (optional) | 1c | MEDIUM — new page |

---

## Cost Estimate

| Item | Size | Monthly Cost |
|------|------|-------------|
| R2 backup bucket (deleted records) | ~50 MB/month (JSON, auto-purged at 30 days) | ~$0.001 |
| R2 backup bucket (DB dumps) | ~200 MB × 7 days = 1.4 GB | ~$0.02 |
| R2 Class A ops (writes) | ~100/day | Free tier (10M/month free) |
| R2 Class B ops (reads, restore) | ~10/month | Free tier |
| **Total** | | **< $0.05/month** |

Negligible cost. R2 has no egress fees.

---

## What This Replaces

| Current | After |
|---------|-------|
| Soft delete (`deletedAt = now()`) | Hard delete (`DELETE FROM`) |
| Data stays in PostgreSQL forever | Data removed immediately, JSON backup in R2 for 30 days |
| R2 files leak on soft-delete | R2 files cleaned up on hard delete |
| No staging cleanup | Orphaned staging files cleaned up daily |
| No database backup | Daily `pg_dump` to R2 (7-day retention) |
| `deletedAt: null` on every query (59 places) | No filter needed — deleted rows don't exist |
| Partial indexes for `deletedAt IS NULL` | Regular indexes (simpler, same performance) |
| Only Message supports undelete | Any model can be restored from R2 backup within 30 days |
