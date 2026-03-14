# Media Storage System

## Overview

The platform uses a **two-bucket Cloudflare R2 architecture** for file storage. All uploads go through presigned URLs for direct browser-to-R2 uploads, with a **staging-then-promote** pattern that prevents orphan files when saves fail.

- **Media bucket** (`media`) — Images, audio, video, and documents uploaded through the media library or content editors (TipTap, event covers, series images, etc.).
- **Attachments bucket** (`file-attachments`) — Bible study file attachments (PDFs, Word docs, RTFs, images).

Both buckets are accessed via a single S3-compatible client (`lib/storage/r2.ts`) using the `@aws-sdk/client-s3` SDK. Each bucket has its own public URL for serving files.

Storage is **tenant-scoped**: all object keys are prefixed with the church slug (e.g., `la-ubf/`). A 10 GB default quota is enforced per church, checked before every upload.

## R2 Buckets & Folder Structure

### Media Bucket (`media`)

```
{churchSlug}/
  staging/           # Temporary presigned-URL uploads (promoted on save)
    {uuid}-{filename}
  images/            # Promoted image files
    {year}/
      {uuid}-{filename}
  audio/             # Promoted audio files
    {year}/
      {uuid}-{filename}
  video/             # Promoted video files
    {year}/
      {uuid}-{filename}
  other/             # Promoted documents/other MIME types
    {year}/
      {uuid}-{filename}
  fonts/             # Custom font files (system files, not tracked in DB)
defaults/
  event-templates/   # Default event template images (system files)
```

### Attachments Bucket (`file-attachments`)

```
{churchSlug}/
  staging/           # Temporary presigned-URL uploads
    {uuid}-{filename}
  bible-studies/     # Promoted bible study attachments
    {slug}/
      {uuid}-{filename}
```

## Upload Flow

### Image Upload (Media Bucket)

Used by: media library, TipTap editor (toolbar, paste, drag-and-drop), event cover images, series images, and any CMS image field.

Orchestrated by `uploadImageToR2()` in `lib/upload-media.ts`:

1. **Client-side validation** — File must be `image/*` and under 10 MB.
2. **Folder creation** (fire-and-forget) — `POST /api/v1/media/folders` ensures the target folder exists in the `MediaFolder` table.
3. **Get presigned URL** — `POST /api/v1/upload-url` with `context: "media"`.
   - Server validates MIME type against allowlist, checks per-type size limit, and checks storage quota.
   - Generates a staging key: `{churchSlug}/staging/{uuid}-{sanitized-filename}`.
   - Returns a presigned PUT URL with `ContentLength` enforcement (R2 rejects mismatched body sizes).
4. **Direct upload to R2** — Client PUTs the file to the presigned URL.
5. **Get image dimensions** — Client reads `naturalWidth`/`naturalHeight` via `Image()` element.
6. **Create MediaAsset record** — `POST /api/v1/media` with filename, staging URL, MIME type, size, dimensions, and folder.
   - Server **promotes** the staging file to its permanent key via `moveObject()`:
     - Determines category from MIME type: `images/`, `audio/`, `video/`, or `other/`.
     - Destination key: `{churchSlug}/{category}/{year}/{uuid}-{filename}`.
     - `moveObject()` = CopyObject + DeleteObject (atomic promotion).
   - Creates the `MediaAsset` DB record with the permanent URL.
   - **Rollback**: If the DB insert fails, the server deletes the promoted R2 object to prevent orphans.

### Attachment Upload (Attachments Bucket)

Used by: Bible study attachment editor.

1. **Get presigned URL** — `POST /api/v1/upload-url` with `context: "bible-study"`.
   - Allowed MIME types: PDF, .doc, .docx, .rtf, JPEG, PNG, WebP.
   - Staging key: `{churchSlug}/staging/{uuid}-{sanitized-filename}` in the attachments bucket.
2. **Direct upload to R2** — Client PUTs the file to the presigned URL.
3. **On save** — `syncStudyAttachments()` promotes staging files to permanent keys via `moveObject()` and creates/updates `BibleStudyAttachment` DB records.

**Note:** There is no automatic staging cleanup for attachments. If a user uploads but never saves, the staging file remains in R2 until the orphan cleanup script is run.

## Delete Flow

### Hard Delete (Media Library)

`DELETE /api/v1/media/[id]` — Requires `media.delete` permission.

1. Looks up the `MediaAsset` by ID and churchId.
2. Derives the R2 key from the URL via `keyFromMediaUrl()`.
3. Deletes the R2 object (best-effort — DB deletion proceeds even if R2 fails).
4. Deletes the `MediaAsset` DB record permanently.

### Delete by URL (Editor cleanup)

`DELETE /api/v1/media/by-url` — Requires `media.delete` permission.

Used by `deleteImageFromR2()` in `lib/upload-media.ts` when the TipTap editor's `onImagesRemoved` callback fires.

1. Accepts `{ url }` in the request body.
2. Finds the `MediaAsset` by URL and churchId.
3. Deletes the R2 object + DB record (same as hard delete).
4. Returns 404 if not found (which `deleteImageFromR2()` treats as acceptable — the asset may already be deleted).

### Bulk Delete

`POST /api/v1/media/bulk-delete` — Requires `media.delete` permission.

1. Accepts `{ ids: string[] }` (max 100 per batch).
2. Fetches all matching `MediaAsset` records.
3. Deletes R2 objects in parallel via `Promise.allSettled()` (best-effort).
4. Hard-deletes all DB records via `deleteMany`.

### Cascading Deletes

When parent entities are deleted, their associated files are cleaned up:

- **Bible Study deletion** — `deleteAllStudyAttachments(studyId)` in `lib/upload-attachment.ts` deletes all R2 files and `BibleStudyAttachment` DB records. R2 deletions are best-effort; DB records are always cleaned.
- **Event/Series deletion** — Cover images and series images referenced by URL fields should be cleaned up by the calling code using `deleteImageFromR2()`.

## TipTap Editor Integration

The rich-text editor (`components/ui/rich-text-editor.tsx`) provides three ways to insert images, all of which upload to R2.

### Image Upload Methods

1. **Toolbar button** — Inserts an `imageUpload` TipTap node that renders a dotted dropzone (`components/ui/image-upload-node.tsx`). The user clicks to browse or drags a file onto the dropzone. After upload, the node replaces itself with a standard `image` node pointing to the R2 URL.

2. **Paste** — The `ImagePasteHandler` ProseMirror plugin intercepts pasted images. It inserts a placeholder paragraph ("Uploading image..."), uploads via `uploadImageToR2()`, then replaces the placeholder with an `image` node.

3. **Drag-and-drop** — The same `ImagePasteHandler` plugin intercepts dropped image files. Uses `toast.promise()` to show upload progress, then inserts the image at the current cursor position.

All three methods call `uploadImageToR2()` from `lib/upload-media.ts`, which handles the full presigned URL flow.

### Image Removal Tracking (`onImagesRemoved`)

The editor tracks R2 image URLs across updates to detect when images are removed from content:

1. **On create**: `extractImageUrls()` walks the TipTap JSON tree and collects all `image` node `src` attributes into a `Set<string>`.
2. **On each update**: Extracts current image URLs, compares against the previous set, and filters removed URLs through `isR2MediaUrl()` (checks for `.r2.dev/` in the URL).
3. **Callback**: If any R2 URLs were removed, calls `onImagesRemoved(removedUrls)` — the parent component typically calls `deleteImageFromR2()` for each removed URL to clean up storage immediately.

### Staging Behavior

Images uploaded via the editor go through the standard staging-then-promote flow. The editor does not need to know about staging — it receives the final permanent URL from `uploadImageToR2()` after the `POST /api/v1/media` endpoint promotes the file.

## Shared Helper Functions

### `lib/upload-media.ts`

Client-side utilities for media image uploads and deletions.

| Export | Signature | Description |
|---|---|---|
| `uploadImageToR2` | `(file: File, folder?: string) => Promise<UploadResult>` | Full upload flow: validate, get presigned URL, upload to R2, read dimensions, create MediaAsset record. Default folder is `"Content"`. Returns `{ url, width, height, fileSize, filename, mimeType }`. |
| `deleteImageFromR2` | `(url: string) => Promise<void>` | Hard-deletes a media asset by its public URL via `DELETE /api/v1/media/by-url`. Silently succeeds on 404 (already deleted). |
| `isR2MediaUrl` | `(url: string) => boolean` | Returns `true` if the URL contains `.r2.dev/`. Used to filter which image URLs should be tracked for R2 deletion. |
| `UploadResult` | interface | `{ url, width, height, fileSize, filename, mimeType }` |

### `lib/upload-attachment.ts`

Server-side utilities for Bible study attachment cleanup.

| Export | Signature | Description |
|---|---|---|
| `deleteAllStudyAttachments` | `(studyId: string) => Promise<{ deleted, r2Errors }>` | Deletes all R2 files and DB records for a bible study's attachments. R2 deletions are best-effort. |
| `deleteAttachmentFile` | `(url: string) => Promise<void>` | Deletes a single attachment's R2 file by URL. Does not touch the DB. |

### `lib/storage/r2.ts`

Low-level R2 operations shared by all upload/delete code.

| Export | Signature | Description |
|---|---|---|
| `getUploadUrl` | `(key, contentType, fileSize?, opts?) => Promise<string>` | Generate a presigned PUT URL. Default expiry: 1 hour. Optional `ContentLength` enforcement and bucket override. |
| `deleteObject` | `(key, bucket?) => Promise<void>` | Delete an object from a bucket. Defaults to attachments bucket. |
| `moveObject` | `(srcKey, destKey, bucket?) => Promise<void>` | Copy + delete to promote files from staging to permanent keys. |
| `uploadFile` | `(key, body, contentType, bucket?) => Promise<void>` | Server-side upload (for migration scripts). |
| `listObjects` | `(prefix, bucket?) => AsyncGenerator<{ key, size }>` | Paginated listing of objects under a prefix. |
| `getPublicUrl` | `(key) => string` | Build a public URL for the attachments bucket. |
| `getMediaPublicUrl` | `(key) => string` | Build a public URL for the media bucket. |
| `keyFromUrl` | `(url) => string \| null` | Extract the R2 key from an attachments-bucket public URL. |
| `keyFromMediaUrl` | `(url) => string \| null` | Extract the R2 key from a media-bucket public URL. |
| `isStagingKey` | `(key) => boolean` | Check if a key matches the `{slug}/staging/` pattern. |
| `MEDIA_BUCKET` | `string` | Media bucket name from env. |
| `ATTACHMENTS_BUCKET` | `string` | Attachments bucket name from env. |
| `PUBLIC_URL` | `string` | Attachments bucket public URL from env. |
| `MEDIA_PUBLIC_URL` | `string` | Media bucket public URL from env. |

## API Endpoints

| Endpoint | Method | Auth Permission | Description |
|---|---|---|---|
| `/api/v1/upload-url` | POST | `media.upload` | Generate a presigned PUT URL for direct-to-R2 upload. Validates MIME type, file size, and storage quota. |
| `/api/v1/media` | GET | `media.view` | List media assets with cursor pagination. Filters: `type`, `folder`, `search`, `cursor`, `limit` (max 200). |
| `/api/v1/media` | POST | `media.upload` | Create a MediaAsset record. Promotes the staging file to a permanent key. Rolls back R2 on DB failure. |
| `/api/v1/media/[id]` | GET | `media.view` | Get a single media asset by ID. |
| `/api/v1/media/[id]` | PATCH | `media.edit_own` | Update metadata (alt text, folder, filename). |
| `/api/v1/media/[id]` | DELETE | `media.delete` | Hard-delete: removes R2 object + DB record. |
| `/api/v1/media/by-url` | DELETE | `media.delete` | Hard-delete by public URL. Used by editor cleanup. |
| `/api/v1/media/bulk-delete` | POST | `media.delete` | Hard-delete up to 100 assets at once. R2 deletions are parallel and best-effort. |
| `/api/v1/media/folders` | GET | `media.view` | List folders with item counts and total media counts (all, photos, videos). |
| `/api/v1/media/folders` | POST | `media.manage_folders` | Create a folder. Returns 409 on duplicate name. |

## DAL Functions

### `lib/dal/media.ts`

| Function | Signature | Description |
|---|---|---|
| `listMedia` | `(churchId, opts?) => Promise<{ items, hasMore, nextCursor }>` | Cursor-paginated listing. Filters: folder, mimeTypePrefix, search (case-insensitive), cursor (ISO date). Default limit: 50. |
| `getMediaAsset` | `(churchId, id) => Promise<MediaAsset \| null>` | Get single non-deleted asset. |
| `createMediaAsset` | `(churchId, data) => Promise<MediaAsset>` | Create a MediaAsset record. |
| `updateMediaAsset` | `(churchId, id, data) => Promise<MediaAsset \| null>` | Update alt, folder, or filename. |
| `deleteMediaAsset` | `(churchId, id) => Promise<MediaAsset \| null>` | Soft delete (sets `deletedAt`). |
| `hardDeleteMediaAsset` | `(churchId, id) => Promise<MediaAsset \| null>` | Hard delete: removes R2 object (best-effort) + DB record. |
| `findMediaAssetByUrl` | `(churchId, url) => Promise<MediaAsset \| null>` | Find non-deleted asset by exact URL match. |
| `hardDeleteMediaAssetByUrl` | `(churchId, url) => Promise<MediaAsset \| null>` | Hard delete by URL: removes R2 object + DB record. |
| `listFolders` | `(churchId) => Promise<MediaFolder[]>` | List all folders, sorted alphabetically. |
| `createFolder` | `(churchId, name) => Promise<MediaFolder>` | Create a folder (unique per church). |
| `renameFolder` | `(churchId, id, name) => Promise<MediaFolder \| null>` | Rename folder and update all assets in that folder (transactional). |
| `deleteFolder` | `(churchId, id) => Promise<MediaFolder \| null>` | Delete folder, moving all its assets to root `/` (transactional). |
| `getFolderCounts` | `(churchId) => Promise<Record<string, number>>` | Item count per folder name (non-deleted). |
| `getMediaCounts` | `(churchId) => Promise<{ all, photos, videos }>` | Total counts for sidebar. |
| `bulkMoveToFolder` | `(churchId, ids, folder) => Promise<BatchPayload>` | Move multiple assets to a folder. |
| `bulkSoftDelete` | `(churchId, ids) => Promise<BatchPayload>` | Soft delete multiple assets. |
| `bulkHardDelete` | `(churchId, ids) => Promise<{ count }>` | Hard delete multiple assets: parallel R2 deletion + DB deleteMany. |

### `lib/dal/storage.ts`

| Function | Signature | Description |
|---|---|---|
| `getChurchStorageUsage` | `(churchId) => Promise<number>` | Total bytes used across MediaAsset (non-deleted) + BibleStudyAttachment. |
| `getStorageBreakdown` | `(churchId) => Promise<StorageBreakdown>` | Detailed breakdown: media vs. attachment bytes, media by type (images/audio/video/other), file counts, top 15 largest files with links. |
| `getDefaultFilesUsage` | `(churchSlug) => Promise<{ totalBytes, fileCount, categories }>` | Scans R2 for system files not tracked in DB (custom fonts, event templates). |
| `checkStorageQuota` | `(churchId, additionalBytes, quota?) => Promise<QuotaResult>` | Check if upload is allowed. Returns `{ allowed, currentUsage, quota, remaining }`. |
| `formatBytes` | `(bytes) => string` | Human-readable byte string (e.g., "1.5 GB"). |

## Storage Tracking & Quotas

### How Storage Is Calculated

Total storage = `SUM(MediaAsset.fileSize where deletedAt IS NULL)` + `SUM(BibleStudyAttachment.fileSize)`.

This is a DB-level calculation — it does not scan R2. System files (fonts, templates) are tracked separately via `getDefaultFilesUsage()` which performs an R2 listing.

### Quota Enforcement

- Default quota: **10 GB per church** (`DEFAULT_STORAGE_QUOTA` in `lib/dal/storage.ts`).
- Checked on every upload via `checkStorageQuota()` in the `POST /api/v1/upload-url` endpoint.
- If the upload would exceed the quota, the endpoint returns HTTP 413 with a `QUOTA_EXCEEDED` error including the remaining and total quota.

### Storage Breakdown Page

The CMS dashboard includes a storage breakdown page that shows:

- Total usage (media + attachments).
- Media usage grouped by type (images, audio, video, other) with file counts.
- Top 15 largest files across both buckets, with links to their CMS pages.
- System/default files usage (fonts, event templates).

## Orphan Cleanup

The script `scripts/cleanup-orphaned-r2.mts` scans both R2 buckets and compares against all DB references to find orphaned files.

### What It Scans

**R2 side**: Lists all objects under `{churchSlug}/` in both buckets, plus `defaults/` in the media bucket.

**DB side**: Collects every URL referenced anywhere in the database:
- `MediaAsset.url` and `MediaAsset.thumbnailUrl` (including soft-deleted records)
- `BibleStudyAttachment.url`
- `Church.logoUrl`, `Church.faviconUrl`
- `SiteSettings.logoUrl`, `logoDarkUrl`, `faviconUrl`, `ogImageUrl`
- `Message.thumbnailUrl`, `audioUrl`, `studySections` (JSON), `attachments` (JSON)
- `Event.coverImage`, `description` (text), `welcomeMessage` (text)
- `Series.imageUrl`
- `Speaker.photoUrl`
- `Ministry.imageUrl`
- `Campus.imageUrl`
- `Person.photoUrl`
- `BibleStudy.questions`, `answers`, `transcript` (text/JSON content scanning)
- `Page.ogImageUrl`
- `PageSection.content` (JSON)
- `Announcement.body` (text)

### Orphan Rules

- **Non-staging files**: Orphaned if their public URL is not found in any DB reference.
- **Staging files**: Orphaned if older than 24 hours (regardless of DB references, since staging files should be promoted or abandoned within that window).

### How to Run

```bash
# Dry run (default) — reports what would be deleted
npx tsx scripts/cleanup-orphaned-r2.mts

# Actual delete
npx tsx scripts/cleanup-orphaned-r2.mts --dry-run=false
```

The script outputs:
- Object counts and sizes per bucket.
- Total unique DB URLs found.
- Orphan breakdown (media vs. attachments, staging vs. non-staging).
- Sample of up to 50 orphaned file keys.
- Summary with total storage to reclaim.

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `R2_ACCOUNT_ID` | Cloudflare account ID for the R2 endpoint | `b244c7c3...` |
| `R2_ACCESS_KEY_ID` | R2 API access key | `327d9c79...` |
| `R2_SECRET_ACCESS_KEY` | R2 API secret key | `42efc49d...` |
| `R2_MEDIA_BUCKET_NAME` | Media bucket name | `media` |
| `R2_MEDIA_PUBLIC_URL` | Public URL for the media bucket | `https://pub-91add7d8455848c9a871477af3249f9e.r2.dev` |
| `R2_ATTACHMENTS_BUCKET_NAME` | Attachments bucket name | `file-attachments` |
| `R2_ATTACHMENTS_PUBLIC_URL` | Public URL for the attachments bucket | `https://pub-59a92027daa648c8a02f226cb5873645.r2.dev` |
| `CHURCH_SLUG` | Church slug used as R2 key prefix and for DB lookups | `la-ubf` |

Note: `R2_PUBLIC_URL` is accepted as a fallback for `R2_ATTACHMENTS_PUBLIC_URL` in `lib/storage/r2.ts`.

## Media Folder Conventions

Folders are logical groupings stored in the `MediaAsset.folder` field and the `MediaFolder` table. They organize files within the media library UI but do not correspond to R2 key prefixes.

| Folder Name | Used By | Description |
|---|---|---|
| `/` (root) | Default | Assets not assigned to any folder. Also the destination when a folder is deleted. |
| `Content` | TipTap editor via `uploadImageToR2(file)` | Default folder for images uploaded through content editors (message editor, event editor, etc.). |
| `Events` | Event cover image uploader | Event cover/hero images. |
| `Series` | Series image uploader | Message series artwork. |
| Custom names | User-created via media library | Users can create arbitrary folders through the media library UI. |

Folders are auto-created (fire-and-forget) when `uploadImageToR2()` is called with a folder name. The `POST /api/v1/media/folders` endpoint handles deduplication (returns 409 on duplicate, which the fire-and-forget call ignores).

### File Size Limits by Type

Enforced by the `POST /api/v1/upload-url` endpoint:

| File Type | Max Size |
|---|---|
| Images (`image/*`) | 10 MB |
| Documents (PDF, Word, RTF, other) | 50 MB |
| Audio (`audio/*`) | 100 MB |
| Video (`video/*`) | 200 MB |

### Allowed MIME Types by Context

**`media` context**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `video/mp4`, `audio/mpeg`, `application/pdf`

**`bible-study` context**: `application/pdf`, `application/msword` (.doc), `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx), `application/rtf`, `image/jpeg`, `image/png`, `image/webp`
