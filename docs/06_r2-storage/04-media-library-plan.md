# Media Library — R2 Implementation Plan

## Current State

- `MediaAsset` model exists in Prisma schema with `url`, `filename`, `mimeType`, `fileSize`, `width`, `height`, `alt`, `folder`, `thumbnailUrl`
- CMS media page exists as placeholder ("Coming Soon")
- UI scaffolding in `components/cms/media/`: upload dialog, grid, sidebar, preview, selector
- **No backend integration** — no DAL, no API routes, no actual file storage
- Media types defined in `lib/media-data.ts` but not connected to DB

## Target State

- Full media library: upload, browse, search, edit metadata, delete
- Files stored in the **`file-media`** R2 bucket at `{churchSlug}/{type}/{year}/{uuid}-{filename}`
- Same staging→permanent key pattern as bible study attachments (see `03-bible-study-attachments-plan.md`)
- Reusable media selector for embedding images in bible studies, messages, events, etc.
- Shared storage quota with bible study attachments (10 GB combined per church)

---

## Implementation Phases

### Phase 1: R2 Infrastructure — DONE (shared)

**Shared with Bible Study implementation** — same Cloudflare account, same S3 client (`lib/storage/r2.ts`), same upload URL endpoint (`POST /api/v1/upload-url`). The `context` param routes to the correct validation allowlist (`media` vs `bible-study`). Currently both contexts use the `file-attachments` bucket — will need to add `file-media` bucket support when implementing media uploads (add `R2_MEDIA_BUCKET_NAME` and `R2_MEDIA_PUBLIC_URL` env vars, and route by context in the upload endpoint).

### Phase 2: Media DAL (`lib/dal/media.ts`)

```ts
export async function listMedia(churchId: string, opts?: { folder?: string, mimeType?: string, cursor?: string, limit?: number })
export async function getMediaAsset(churchId: string, id: string)
export async function createMediaAsset(churchId: string, data: CreateMediaInput)
export async function updateMediaAsset(churchId: string, id: string, data: UpdateMediaInput)
export async function deleteMediaAsset(churchId: string, id: string)
export async function moveMediaAsset(churchId: string, id: string, newFolder: string)
export async function getMediaByFolder(churchId: string, folder: string)
```

### Phase 3: Media API Routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/v1/media` | List media (paginated, filterable by folder/type) |
| POST | `/api/v1/media` | Create media record (after R2 upload complete) |
| GET | `/api/v1/media/[id]` | Get single media asset |
| PATCH | `/api/v1/media/[id]` | Update metadata (alt text, folder) |
| DELETE | `/api/v1/media/[id]` | Delete media asset + R2 object |
| POST | `/api/v1/media/folders` | Create folder (virtual — stored as prefix) |

### Phase 4: Upload Flow

**Same presigned URL + staging pattern as bible study attachments:**

1. User opens upload dialog in media library
2. Selects files (images, audio, documents)
3. For each file:
   a. `POST /api/v1/upload-url` with `context: "media"` → file goes to `{churchSlug}/staging/{uuid}-{filename}`
   b. Direct PUT to R2 via presigned URL
   c. On success: `POST /api/v1/media` moves from staging to permanent key and creates DB record
4. Grid refreshes to show new assets

**Uses same staging→permanent pattern:** Upload to `staging/` prefix first, then `POST /api/v1/media` moves to permanent key (`{churchSlug}/images/{year}/{uuid}-{filename}`) and creates the DB record. Lifecycle rule cleans up orphaned staging files. This reuses the `moveObject()` and `isStagingKey()` helpers from `lib/storage/r2.ts`.

### Phase 5: Wire Up CMS UI

| File | Change |
|---|---|
| `app/cms/(dashboard)/media/page.tsx` | Replace placeholder with real grid + toolbar |
| `components/cms/media/upload-photo-dialog.tsx` | Connect to presigned URL upload flow |
| `components/cms/media/media-grid.tsx` | Fetch from API, handle pagination |
| `components/cms/media/media-sidebar.tsx` | Fetch folders from API |
| `components/cms/media/media-preview-dialog.tsx` | Load from R2 URL |
| `components/cms/media/media-selector-dialog.tsx` | Browse + select existing media for embedding |
| `components/cms/media/toolbar.tsx` | Search, filter, bulk actions |

### Phase 6: Media Selector Integration

Allow other editors (messages, events, pages) to embed media from the library:

```tsx
<MediaSelectorDialog
  onSelect={(asset) => {
    // Insert image/file reference into editor
    insertMedia(asset.url, asset.alt)
  }}
  accept={["image/*"]}
/>
```

---

## File Type Allowlist

| Category | Extensions | Max Size |
|---|---|---|
| Images | `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.svg` | 10 MB |
| Audio | `.mp3`, `.m4a`, `.wav` | 100 MB |
| Documents | `.pdf`, `.docx` | 50 MB |
| Video thumbnails | `.jpg`, `.png`, `.webp` | 5 MB |

## Folder Structure (Virtual)

Folders are virtual — implemented as R2 key prefixes and tracked in the `folder` column of `MediaAsset`.

Default folders per church:
```
/                     (root — all media)
/series-covers        (auto-created when series image uploaded)
/event-images
/people
/general
```

Users can create custom folders via the media sidebar.

## Thumbnail Generation

**Deferred — not in initial implementation.**

For MVP: use the original image URL for thumbnails. The `thumbnailUrl` column exists but will be null initially.

Future: Add a Cloudflare Worker or Image Resizing rule to generate thumbnails on-the-fly:
```
https://cdn.laubf.org/cdn-cgi/image/width=300,quality=80/{key}
```
This requires Cloudflare Pro plan ($20/mo) or a separate Worker-based solution.

## Quota Enforcement

Same as bible study plan — shared 10 GB quota per church, enforced at `POST /api/v1/upload-url`:

```ts
const usage = await getChurchStorageUsage(churchId) // sum of MediaAsset + BibleStudyAttachment fileSize
const remaining = STORAGE_LIMIT - usage
if (fileSize > remaining) {
  return Response.json({ error: "Storage quota exceeded" }, { status: 413 })
}
```

## Delete Handling

When a media asset is deleted:
1. Soft-delete in DB (`deletedAt` timestamp on `MediaAsset`)
2. After 30 days (or immediately on hard delete): remove R2 object
3. This allows "undo" for accidental deletes

For immediate hard delete (user empties trash):
1. Delete R2 object
2. Delete DB record
3. Check if any bible study, message, or page still references the URL — warn if so
