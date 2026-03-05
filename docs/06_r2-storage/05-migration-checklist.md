# R2 Migration Checklist — Bible Study Attachments

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
  - What: S3-compatible client singleton with helpers — `getUploadUrl()`, `deleteObject()`, `getPublicUrl()`, `uploadFile()`, `listObjects()`
  - Note: Currently uses `R2_PUBLIC_URL` env var (single URL). The env setup doc (`01-r2-env-setup.md`) specifies separate `R2_ATTACHMENTS_PUBLIC_URL` and `R2_MEDIA_PUBLIC_URL`. Reconcile when adding media bucket support.

- [x] **Add R2 env vars to `.env.example`**
  - File: `.env.example`
  - What: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ATTACHMENTS_BUCKET_NAME`, `R2_ATTACHMENTS_PUBLIC_URL`, `R2_MEDIA_BUCKET_NAME`, `R2_MEDIA_PUBLIC_URL`

- [x] **Configure R2 bucket in Cloudflare dashboard**
  - What: Created `file-attachments` bucket, S3 API token, CORS rules, public access URL
  - Verify: `R2_PUBLIC_URL` is set in `.env` to `https://pub-59a92027daa648c8a02f226cb5873645.r2.dev`

### 1.2 Presigned URL API Endpoint

- [ ] **Create upload URL endpoint**
  - File: `app/api/v1/upload-url/route.ts` (NEW)
  - What: `POST /api/v1/upload-url` accepting `{ filename, contentType, fileSize, context }`. Returns `{ uploadUrl, key, publicUrl }`. Must:
    - Authenticate the request
    - Validate file type against allowlist (PDF, DOCX, DOC, RTF, IMAGE)
    - Validate file size (max 50 MB)
    - Generate key: `{churchId}/{year}/{uuid}-{sanitized-filename}`
    - Return presigned PUT URL from `getUploadUrl()` + public CDN URL from `getPublicUrl()`
  - Reference: `docs/06_r2-storage/03-bible-study-attachments-plan.md` Phase 3

### 1.3 Next.js Image Config

- [ ] **Add R2 domain to remote patterns**
  - File: `next.config.ts`
  - What: Add `{ protocol: "https", hostname: "pub-59a92027daa648c8a02f226cb5873645.r2.dev" }` to `images.remotePatterns` so `<Image>` can load R2-hosted files (needed for image-type attachments)

---

## Phase 2: Migration (Upload Legacy Files to R2 + Update DB)

### 2.1 Migration Script

- [ ] **Create migration script**
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

- [ ] **Execute migration (dry run)**
  - Command: `npx tsx scripts/migrate-attachments-to-r2.mts --dry-run`
  - What: Verify all 2,731 attachment files can be found locally and would upload successfully

- [ ] **Execute migration (live)**
  - Command: `npx tsx scripts/migrate-attachments-to-r2.mts`
  - What: Upload all files to R2 and update DB URLs

### 2.3 Verify Migration

- [ ] **Verify upload counts**
  - What: Confirm R2 bucket object count matches expected (2,731 or close — some files may be missing)
  - Method: Use `listObjects()` from `lib/storage/r2.ts` or Cloudflare dashboard

- [ ] **Verify DB URLs updated**
  - What: Query `SELECT count(*) FROM "BibleStudyAttachment" WHERE url LIKE '/legacy-files/%'` — should return 0
  - What: Query `SELECT count(*) FROM "BibleStudyAttachment" WHERE url LIKE 'https://%'` — should match total count

- [ ] **Spot-check file accessibility**
  - What: Open 5-10 random R2 URLs in browser to confirm files download correctly and content matches originals

---

## Phase 3: CMS Integration (Upload, Delete, Save Flows)

### 3.1 Attachment Type Update

- [ ] **Add `url` and `fileSize` (bytes) to Attachment type**
  - File: `/lib/messages-data.ts`
  - What: The `Attachment` type currently has `{ id, name, size: string, type, url? }`. Ensure `url` is always present for saved attachments (it is optional today). Consider adding `key` (R2 object key) for delete operations, or derive key from URL.
  - Current type:
    ```ts
    export type Attachment = {
      id: string
      name: string
      size: string
      type: string
      url?: string
    }
    ```

### 3.2 Upload Flow (Metadata Sidebar)

- [ ] **Replace in-memory file handling with R2 upload**
  - File: `/components/cms/messages/entry/metadata-sidebar.tsx` (lines 83-98)
  - What: Currently `handleFileChange()` creates in-memory `Attachment` objects from `File` objects with no URL — files are lost on navigation. Change to:
    1. For each selected file, call `POST /api/v1/upload-url` to get presigned URL
    2. `PUT` file directly to R2 via presigned URL (show upload progress)
    3. Create `Attachment` object with the returned `publicUrl` as `url`
    4. Add to attachment state via `onAttachmentsChange`
  - Related: `entry-form.tsx` has a duplicate `handleUploadAttachment` / `handleFileChange` at lines 354-368 that follows the same pattern — update both or consolidate into one location

### 3.3 Upload Flow (DOCX Import)

- [ ] **Upload imported DOCX to R2 as attachment**
  - File: `/components/cms/messages/entry/study-tab.tsx` (lines 66-74)
  - What: Currently creates attachment with `{ id, name, size, type }` but no `url`. After DOCX import, also upload the file to R2 and set the `url` on the attachment object.

### 3.4 Delete Flow

- [ ] **Delete R2 objects when attachments are removed on save**
  - File: `/lib/dal/sync-message-study.ts` — `syncStudyAttachments()` function (line 277)
  - What: Currently deletes DB records for removed attachments but does NOT delete the files from R2. Add: before deleting DB records, call `deleteObject()` for each removed attachment's R2 key (derive key from URL by stripping the public URL prefix).
  - Approach: Fetch full attachment records (including `url`) before deletion, extract R2 keys, call `deleteObject()` for each.

### 3.5 Save Payload

- [ ] **Ensure attachments include `url` in save payload**
  - File: `/components/cms/messages/entry/entry-form.tsx` (line 262)
  - What: `buildMessageData()` already includes `attachments` in the payload. Verify that the `Attachment` objects passed to the API include the R2 `url` field. Currently attachments created in `handleFileChange` (line 361-366) do NOT include `url`.

- [ ] **Verify API routes pass `url` through to DAL**
  - File: `/app/api/v1/messages/route.ts` — POST handler
  - File: `/app/api/v1/messages/[slug]/route.ts` — PATCH handler (line 79, `effectiveAttachments`)
  - File: `/lib/dal/sync-message-study.ts` — `syncStudyAttachments()` upsert (lines 298-314)
  - What: The `SyncAttachment` interface (line 96) already has `url?: string` and the upsert uses `att.url || ''`. Confirm that the full pipeline preserves the `url` field from client through API to DAL.

---

## Phase 4: Seed Update (R2 URLs Instead of Legacy Paths)

- [ ] **Update seed to generate R2 URLs**
  - File: `/prisma/seed.mts` (lines 500-534)
  - What: Currently generates URLs like `/legacy-files/${bs.slug}/${filename}`. After migration, change to generate R2 CDN URLs: `${R2_PUBLIC_URL}/${churchId}/{year}/${filename}` matching the key structure used by the migration script.
  - Note: The seed must work in environments without R2 access (e.g., CI). Options:
    - Use `process.env.R2_PUBLIC_URL` with fallback to `/legacy-files/...` path
    - Or always generate the CDN URL pattern (files may 404 in dev if not uploaded, but DB is consistent)
  - Decision: Document chosen approach here when implemented.

- [ ] **Update estimated file sizes in seed**
  - File: `/prisma/seed.mts` (line 520)
  - What: Currently uses hardcoded estimated sizes (`245000` for PDF, `185000` for DOCX, etc.). After migration, actual file sizes are known — consider storing real sizes or leaving estimates as-is for seed data.

---

## Phase 5: Cleanup (Remove Legacy Files + Schema Artifacts)

### 5.1 Remove Legacy File Directories

- [ ] **Delete `public/legacy-files/` directory**
  - Path: `/public/legacy-files/` (193 MB, ~1,171 folders)
  - What: Static files previously served by Next.js. No longer needed once all URLs point to R2.
  - Pre-check: Confirm zero DB records still reference `/legacy-files/` paths (Phase 2 verification)

- [ ] **Delete `legacy-files/` directory**
  - Path: `/legacy-files/` (246 MB, ~3,262 files)
  - What: Original source files copied from legacy server. Used as source for migration script. No longer needed after R2 upload.

- [ ] **Update `.gitignore`**
  - File: `/.gitignore`
  - What: Remove `legacy-files/` and `public/legacy-files/` entries if present (no longer needed). Or leave them as a safeguard.

### 5.2 Remove Legacy Schema Fields

- [ ] **Remove `legacySourceId` from BibleStudyAttachment**
  - File: `/prisma/schema.prisma` (line 776)
  - What: `legacySourceId Int?` field with comment "TEMPORARY: maps to laubfmaterial.no for file migration second-pass. Remove after files are migrated to cloud storage."
  - Steps:
    1. Remove the field from the schema
    2. Run `npx prisma migrate dev --name remove_legacy_source_id`
    3. Verify seed still works
  - Pre-check: Confirm no code references `legacySourceId` outside of seed

- [ ] **Verify no code references `legacySourceId`**
  - What: Grep entire codebase for `legacySourceId` — should only appear in schema and seed. Remove from seed if present.

### 5.3 Build Verification

- [ ] **Run full build**
  - Command: `npm run build`
  - What: Ensure no broken imports, no references to deleted files or removed schema fields

- [ ] **Run lint**
  - Command: `npm run lint`
  - What: Ensure no lint errors introduced

- [ ] **Re-seed and verify**
  - Command: `npx prisma db seed`
  - What: Confirm seed completes successfully with updated URL generation

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
| 1. Infrastructure | 4 done, 2 pending | Partial |
| 2. Migration | 0 done, 5 pending | Not started |
| 3. CMS Integration | 0 done, 6 pending | Not started |
| 4. Seed Update | 0 done, 2 pending | Not started |
| 5. Cleanup | 0 done, 6 pending | Not started |
| 6. Verification | 0 done, 9 pending | Not started |
| **Total** | **4 done, 30 pending** | |

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
| `R2_ACCOUNT_ID` | `abc123...` | `lib/storage/r2.ts` |
| `R2_ACCESS_KEY_ID` | `abc123...` | `lib/storage/r2.ts` |
| `R2_SECRET_ACCESS_KEY` | `abc123...` | `lib/storage/r2.ts` |
| `R2_ATTACHMENTS_BUCKET_NAME` | `file-attachments` | `lib/storage/r2.ts` |
| `R2_PUBLIC_URL` | `https://pub-XXX.r2.dev` | `lib/storage/r2.ts` |
