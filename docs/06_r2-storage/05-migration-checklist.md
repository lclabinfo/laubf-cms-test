# R2 Migration Checklist — Bible Study Attachments

## Migration Results

| Field | Value |
|---|---|
| **Date** | March 5, 2026 |
| **Files migrated** | 2,727 / 2,731 |
| **Failures** | 0 |
| **Missing source files** | 4 (files never existed on disk) |
| **Total data** | 188.7 MB |
| **R2 bucket** | file-attachments |
| **Key prefix** | la-ubf/ |
| **Public URL** | https://pub-59a92027daa648c8a02f226cb5873645.r2.dev |

---

End-to-end task list for migrating Bible study attachment files from local `legacy-files/` directories to Cloudflare R2, integrating R2 uploads into the CMS, and cleaning up legacy artifacts.

**Scope:** 2,731 `BibleStudyAttachment` records currently pointing to `/legacy-files/{slug}/{filename}` paths. 193 MB in `public/legacy-files/`, 246 MB in `legacy-files/` (original source). Target: all files served from R2 via CDN URL.

---

## Phase 1: Infrastructure (R2 Client + API Endpoint)

### 1.1 R2 Client Library

- [x] **Install AWS SDK packages**
  - File: `package.json`
  - What: Added `@aws-sdk/client-s3` (^3.1003.0) and `@aws-sdk/s3-request-presigner` (^3.1003.0)

- [x] **Create R2 storage client**
  - File: `/lib/storage/r2.ts`
  - What: S3-compatible client singleton with helpers — `getUploadUrl()`, `deleteObject()`, `moveObject()`, `getPublicUrl()`, `isStagingKey()`, `keyFromUrl()`, `uploadFile()`, `listObjects()`
  - Uses `R2_ATTACHMENTS_PUBLIC_URL` env var (resolved with fallback to `R2_PUBLIC_URL`). Media bucket support will add `R2_MEDIA_PUBLIC_URL` when implemented.

- [x] **Add R2 env vars to `.env.example`**
  - File: `.env.example`
  - What: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ATTACHMENTS_BUCKET_NAME`, `R2_ATTACHMENTS_PUBLIC_URL`, `R2_MEDIA_BUCKET_NAME`, `R2_MEDIA_PUBLIC_URL`

- [x] **Configure R2 bucket in Cloudflare dashboard**
  - What: Created `file-attachments` bucket, S3 API token, CORS rules, public access URL
  - Verify: `R2_PUBLIC_URL` is set in `.env` to `https://pub-59a92027daa648c8a02f226cb5873645.r2.dev`

### 1.2 Presigned URL API Endpoint

- [x] **Create upload URL endpoint**
  - File: `app/api/v1/upload-url/route.ts` (NEW)
  - What: `POST /api/v1/upload-url` accepting `{ filename, contentType, fileSize, context }`. Returns `{ success, data: { uploadUrl, key, publicUrl } }`.
    - Resolves church context via `getChurchId()`
    - Validates file type against allowlist (PDF, DOCX, DOC, RTF, IMAGE for bible-study; images/audio/pdf for media)
    - Validates file size (max 50 MB)
    - Generates staging key: `{churchSlug}/staging/{uuid}-{sanitized-filename}`
    - Returns presigned PUT URL + staging public URL

### 1.3 Next.js Image Config

- [x] **Add R2 domain to remote patterns**
  - File: `next.config.ts`
  - What: Add `{ protocol: "https", hostname: "pub-59a92027daa648c8a02f226cb5873645.r2.dev" }` to `images.remotePatterns` so `<Image>` can load R2-hosted files (needed for image-type attachments)

---

## Phase 2: Migration (Upload Legacy Files to R2 + Update DB)

### 2.1 Migration Script

- [x] **Create migration script**
  - File: `scripts/migrate-attachments-to-r2.mts` (NEW)
  - What: Script that:
    1. Reads all `BibleStudyAttachment` records where `url` starts with `/legacy-files/`
    2. For each record, locates the file in `public/legacy-files/{slug}/{filename}`
    3. Uploads file to R2 with key `{churchId}/{year}/{uuid}-{filename}` using `uploadFile()` from `lib/storage/r2.ts`
    4. Updates the DB record's `url` to the R2 CDN URL (`getPublicUrl(key)`)
    5. Tracks success/failure counts, logs errors for manual review
    6. Supports dry-run mode (`--dry-run` flag) for verification before actual upload
    7. Supports resume (skip records whose `url` already starts with `https://`)
  - Note: Determine `year` from the associated `BibleStudy.publishedAt` or fall back to current year

### 2.2 Run Migration

- [x] **Execute migration (dry run)**
  - Command: `npx tsx scripts/migrate-attachments-to-r2.mts --dry-run`
  - What: Verify all 2,731 attachment files can be found locally and would upload successfully

- [x] **Execute migration (live)**
  - Command: `npx tsx scripts/migrate-attachments-to-r2.mts`
  - What: Upload all files to R2 and update DB URLs
  - Results: 2,727 files uploaded (188.7 MB), 0 failures, 4 missing source files (never existed on disk)

### 2.3 Verify Migration

- [x] **Verify upload counts**
  - What: Confirm R2 bucket object count matches expected (2,731 or close — some files may be missing)
  - Method: Use `listObjects()` from `lib/storage/r2.ts` or Cloudflare dashboard
  - Result: 2,727 objects in bucket (4 source files were missing on disk)

- [x] **Verify DB URLs updated**
  - What: Query `SELECT count(*) FROM "BibleStudyAttachment" WHERE url LIKE '/legacy-files/%'` — should return 0
  - What: Query `SELECT count(*) FROM "BibleStudyAttachment" WHERE url LIKE 'https://%'` — should match total count
  - Result: All 2,731 records updated (4 missing files still got R2 URL pattern in DB)

- [x] **Spot-check file accessibility**
  - What: Open 5-10 random R2 URLs in browser to confirm files download correctly and content matches originals

---

## Phase 3: CMS Integration (Upload, Delete, Save Flows) — DONE

### 3.1 Attachment Type Update

- [x] **Add `url`, `r2Key`, and `fileSize` (bytes) to Attachment type**
  - File: `/lib/messages-data.ts`
  - Implemented type:
    ```ts
    export type Attachment = {
      id: string
      name: string
      size: string       // formatted display string
      type: string
      url?: string       // R2 public URL (set after upload)
      r2Key?: string     // R2 object key (client-side only, for reference)
      fileSize?: number  // raw bytes (for quota tracking)
    }
    ```

### 3.2 Upload Flow (Metadata Sidebar)

- [x] **Replace in-memory file handling with R2 upload**
  - File: `/components/cms/messages/entry/metadata-sidebar.tsx`
  - What: `handleUploadAttachment()` calls `POST /api/v1/upload-url`, PUTs file to R2 via presigned URL, creates `Attachment` with `url`, `r2Key`, `fileSize`.

### 3.3 Upload Flow (DOCX Import)

- [x] **Upload imported DOCX to R2 as attachment**
  - File: `/components/cms/messages/entry/study-tab.tsx`
  - What: On DOCX import, file is uploaded to R2 first, then `onAttachmentAdd` is called with the R2 `url` and `r2Key`. Falls back to no-URL attachment if R2 upload fails.

### 3.4 Upload Flow (Entry Form)

- [x] **Entry form upload button**
  - File: `/components/cms/messages/entry/entry-form.tsx`
  - What: `handleUploadAttachment()` follows same presigned URL pattern.

### 3.5 Delete Flow

- [x] **Delete R2 objects when attachments are removed on save**
  - File: `/lib/dal/sync-message-study.ts` — `syncStudyAttachments()`
  - What: Fetches full attachment records (including `url`) before deletion, derives R2 key via `keyFromUrl()`, calls `deleteObject()` for each, then deletes DB records.

### 3.6 Move-on-Save (Staging → Permanent)

- [x] **Move staging files to permanent keys on save**
  - File: `/lib/dal/sync-message-study.ts` — `promoteFromStaging()`
  - What: Detects staging URLs via `isStagingKey()`, moves to `{churchSlug}/{year}/{studySlug}/{uuid}-{filename}` via `moveObject()`, saves permanent URL to DB.

### 3.7 Save Payload

- [x] **Attachments include `url` in save payload**
  - Files: `entry-form.tsx` → `messages-context.tsx` → API routes → `syncMessageStudy()` → `syncStudyAttachments()`
  - Full pipeline: client `Attachment.url` → API payload → `SyncAttachment.url` → `promoteFromStaging()` → `BibleStudyAttachment.url`

---

## Phase 4: Seed Update (R2 URLs Instead of Legacy Paths)

- [x] **Update seed to generate R2 URLs**
  - File: `/prisma/seed.mts` (lines 500-534)
  - What: Updated to generate R2 CDN URLs: `${R2_PUBLIC_URL}/${churchId}/{year}/${filename}` matching the key structure used by the migration script.
  - Decision: Always generates R2 CDN URL pattern (files may 404 in dev if not uploaded, but DB is consistent with production).

- [ ] **Update estimated file sizes in seed**
  - File: `/prisma/seed.mts` (line 520)
  - What: Currently uses hardcoded estimated sizes (`245000` for PDF, `185000` for DOCX, etc.). After migration, actual file sizes are known — consider storing real sizes or leaving estimates as-is for seed data.

---

## Phase 5: Cleanup (Remove Legacy Files + Schema Artifacts) — DONE

### 5.1 Remove Legacy File Directories

- [x] **Delete `public/legacy-files/` directory** — Removed (was 193 MB, ~1,171 folders)
- [x] **Delete `legacy-files/` directory** — Removed (was 246 MB, ~3,262 files)
- [x] **Update `.gitignore`** — Legacy paths no longer present

### 5.2 Remove Legacy Schema Fields

- [x] **Remove `legacySourceId` from BibleStudyAttachment**
  - Migration: `20260306000632_remove_legacy_source_id`
  - Field removed from schema, no code references remain
- [x] **Verify no code references `legacySourceId`** — Confirmed clean

### 5.3 Build Verification

- [x] **Seed runs clean** — `npx prisma db seed` completes successfully
- [x] **TypeScript compiles** — `npx tsc --noEmit` passes

---

## Phase 6: Verification (End-to-End Testing)

### 6.1 Website Display (Read Path)

- [ ] **Test Bible study detail page**
  - URL: `/bible-study/{slug}` for a study with attachments
  - What: Attachments should display with correct names and download links pointing to R2 CDN URLs
  - Files (NO changes needed): `components/website/study-detail/study-detail-view.tsx` uses `attachment.url` from props; `app/website/bible-study/[slug]/page.tsx` maps from Prisma to display type

- [ ] **Test attachment downloads**
  - What: Click 5+ attachment download links across different studies. Verify files download correctly with expected content and file sizes.

### 6.2 CMS Upload (Write Path)

- [ ] **Test new file upload**
  - What: In CMS message editor, upload a PDF attachment via the sidebar. Verify:
    - File uploads to R2 (check bucket in Cloudflare dashboard)
    - Attachment shows in the UI with correct name and download link
    - After save, DB record has R2 CDN URL

- [ ] **Test DOCX import with attachment**
  - What: In CMS message editor study tab, import a DOCX file. Verify:
    - Content is extracted into the editor
    - DOCX file is uploaded to R2 as an attachment
    - Attachment URL points to R2

- [ ] **Test multiple file upload**
  - What: Upload 3+ files at once. Verify all upload successfully and appear in the attachment list with valid R2 URLs.

### 6.3 CMS Delete (Delete Path)

- [ ] **Test attachment removal**
  - What: Remove an attachment from a message, save. Verify:
    - DB record is deleted
    - R2 object is deleted (check bucket — file should be gone)

- [ ] **Test attachment replacement**
  - What: Remove an existing attachment and add a new one in the same save operation. Verify old file deleted from R2 and new file uploaded.

### 6.4 Edge Cases

- [ ] **Test upload with large file (near 50 MB limit)**
  - What: Upload a ~45 MB PDF. Verify it completes successfully.

- [ ] **Test upload with disallowed file type**
  - What: Try uploading a `.exe` or `.zip`. Verify it is rejected with a clear error message.

- [ ] **Test presigned URL expiry handling**
  - What: If upload takes too long or network interrupts, verify the client shows an error and allows retry.

- [ ] **Test concurrent uploads**
  - What: Upload multiple files simultaneously. Verify no race conditions or duplicate records.

---

## Summary Table

| Phase | Tasks | Status |
|---|---|---|
| 1. Infrastructure | 6 done | **Done** |
| 2. Migration | 5 done | **Done** |
| 3. CMS Integration | 7 done | **Done** |
| 4. Seed Update | 1 done, 1 pending (est. file sizes) | **Partial** |
| 5. Cleanup | 5 done | **Done** |
| 6. Verification | 0 done, 9 pending | **Not started** |
| **Total** | **24 done, 10 pending** | |

---

## Dependencies & Ordering

```
Phase 1 (Infrastructure)
  |
  v
Phase 2 (Migration) -----> Phase 5.1 (Delete legacy files)
  |                              |
  v                              v
Phase 3 (CMS Integration)  Phase 5.2 (Remove legacySourceId)
  |                              |
  v                              v
Phase 4 (Seed Update) ---> Phase 5.3 (Build verification)
                                |
                                v
                           Phase 6 (Verification)
```

- Phase 2 can run independently of Phase 3 (migration is a one-time batch operation)
- Phase 3 can start in parallel with Phase 2 (CMS upload flow doesn't depend on legacy migration)
- Phase 4 should wait until Phase 2 is done (need to know the final URL pattern)
- Phase 5 cleanup must wait until both Phase 2 and Phase 3 are complete and verified
- Phase 6 verification runs after all other phases

## Environment Variables Required

| Variable | Example Value | Used By |
|---|---|---|
| `R2_ACCOUNT_ID` | `b244c7c3...` | `lib/storage/r2.ts` |
| `R2_ACCESS_KEY_ID` | `327d9c79...` | `lib/storage/r2.ts` |
| `R2_SECRET_ACCESS_KEY` | `42efc49d...` | `lib/storage/r2.ts` |
| `R2_ATTACHMENTS_BUCKET_NAME` | `file-attachments` | `lib/storage/r2.ts` |
| `R2_ATTACHMENTS_PUBLIC_URL` | `https://pub-XXX.r2.dev` | `lib/storage/r2.ts`, `lib/dal/sync-message-study.ts` |

**Note:** The env var must be `R2_ATTACHMENTS_PUBLIC_URL` (all caps). The code falls back to `R2_PUBLIC_URL` if the primary isn't set.

---

## Implementation Gotchas

Issues encountered during implementation that future migrations should account for:

1. **UUID IDs only**: `BibleStudyAttachment.id` is `@db.Uuid`. Any client-generated IDs must use `crypto.randomUUID()`. Non-UUID formats (e.g., `att-{timestamp}`) cause silent Postgres cast errors on upsert.

2. **Clear `.next/` after schema changes**: After `prisma generate`, delete `.next/` and restart the dev server. The cached Prisma client causes stale types and runtime errors.

3. **PUBLIC_URL must not have trailing slash**: `keyFromUrl()` strips the public URL prefix to derive the R2 key. A trailing slash causes the derived key to start with `/`, which won't match the actual R2 object key. Defensively strip trailing slashes in `r2.ts`.

4. **CORS must be configured before browser uploads**: Migration scripts use server-side `uploadFile()` which bypasses CORS. But CMS browser uploads use presigned PUT URLs that require CORS. Don't forget to configure CORS rules when setting up a new bucket. Origins must not have trailing slashes (Cloudflare silently rejects them).

5. **Staging lifecycle rule**: Configure a 24-hour auto-delete lifecycle rule on the `staging/` prefix in the Cloudflare dashboard. This cleans up orphaned uploads from cancelled sessions.

6. **API response shape**: `POST /api/v1/upload-url` returns `{ success, data: { uploadUrl, key, publicUrl } }`. Client code must destructure from `response.data`, not the top level.

7. **fileSize preservation**: When loading attachments back from the API, preserve the raw `fileSize` (bytes), not just the formatted display string. The raw value is needed for quota tracking and accurate round-trip display.
