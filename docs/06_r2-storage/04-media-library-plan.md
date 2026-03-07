# Media Library — R2 Implementation Plan

> **Revised 2026-03-05** — Incorporates lessons learned from the bible study attachments R2 integration. Read this entire document before writing any code.

## Current State

- `MediaAsset` model exists in Prisma schema (`prisma/schema.prisma`, line ~890) with `url`, `filename`, `mimeType`, `fileSize`, `width`, `height`, `alt`, `folder`, `thumbnailUrl`
- `MediaAsset.id` is `@id @default(uuid()) @db.Uuid` — all IDs must be `crypto.randomUUID()` on the client
- CMS media page exists at `app/cms/(dashboard)/media/page.tsx` (placeholder)
- UI scaffolding in `components/cms/media/`: upload dialog, grid, sidebar, preview, selector (12 files)
- **No backend integration** — no DAL, no API routes, no actual file storage
- Media types defined in `lib/media-data.ts` but not connected to DB

## Target State

- Full media library: upload, browse, search, edit metadata, delete
- Files stored in the **`media`** R2 bucket (separate from `file-attachments`)
- Same staging-to-permanent key pattern as bible study attachments
- Reusable media selector for embedding images in bible studies, messages, events, etc.
- Shared storage quota with bible study attachments (10 GB combined per church)

---

## Prerequisites (Complete BEFORE writing any application code)

These steps caused bugs when skipped during the attachments implementation. Do them first.

### 1. Create the `media` R2 bucket

In Cloudflare dashboard > R2 > Create Bucket:
- Bucket name: `media`
- Region: Automatic
- Enable public access (R2.dev subdomain)
- Copy the public URL (e.g., `https://pub-XXXX.r2.dev`)

### 2. Configure CORS on the `media` bucket

**This MUST be done before any browser upload code is written.** Without CORS, the browser's `PUT` to the presigned URL will silently fail with a network error.

Cloudflare dashboard > R2 > `media` bucket > Settings > CORS Policy:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://laubf.org", "https://www.laubf.org"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

**Common CORS mistakes that caused bugs:**
- Trailing slashes on origins (e.g., `http://localhost:3000/`) — will break matching
- Missing `PUT` method — presigned URL uploads fail
- Missing `Content-Type` in AllowedHeaders — upload rejected

### 3. Set environment variables

Add to `.env` (values already templated in `.env.example`):

```
R2_MEDIA_BUCKET_NAME=media
R2_MEDIA_PUBLIC_URL=https://pub-XXXX.r2.dev
```

### 4. Add `media` bucket domain to `next.config.ts`

The R2 dev URL must be in `images.remotePatterns` for `<Image>` to load media files:

```ts
// next.config.ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "pub-XXXX.r2.dev" }, // existing attachments bucket
    { protocol: "https", hostname: "pub-YYYY.r2.dev" }, // new media bucket
  ],
}
```

### 5. Configure lifecycle rule for staging cleanup

Cloudflare dashboard > R2 > `media` bucket > Settings > Object lifecycle rules:
- Prefix: `la-ubf/staging/`
- Action: Delete after 1 day

This auto-cleans orphaned uploads (user cancels before saving). Not blocking for development, but set it up early.

---

## Common Pitfalls (Lessons from Attachments Implementation)

These caused real bugs. The implementing agent MUST account for each one.

### Pitfall 1: API response destructuring

The `POST /api/v1/upload-url` endpoint returns:
```json
{ "success": true, "data": { "uploadUrl": "...", "key": "...", "publicUrl": "..." } }
```

Client code MUST destructure from `.data`:
```ts
// CORRECT
const res = await fetch('/api/v1/upload-url', { method: 'POST', body: JSON.stringify({...}) })
const json = await res.json()
const { uploadUrl, key, publicUrl } = json.data

// WRONG — will get undefined values
const { uploadUrl, key, publicUrl } = await res.json()
```

### Pitfall 2: UUID IDs for DB records

`MediaAsset.id` uses `@db.Uuid`. When creating records client-side (for optimistic UI or pre-generating IDs), you MUST use:
```ts
const id = crypto.randomUUID() // "a1b2c3d4-e5f6-..."
```

Never use custom ID formats like `media-${Date.now()}` or `media-${counter}` — Prisma will reject them as invalid UUIDs.

### Pitfall 3: Client-side file size validation

Check file size BEFORE requesting a presigned URL. Show a toast error immediately:
```ts
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB (or per-type limit)
if (file.size > MAX_FILE_SIZE) {
  toast.error(`File too large. Maximum size is ${maxSizeMB} MB.`)
  return
}
```

### Pitfall 4: All upload paths must use R2

Every file input handler must go through the presigned URL flow. Never create a `MediaAsset` DB record with a placeholder or empty URL. The flow is always: get presigned URL -> PUT to R2 -> create DB record with real URL.

### Pitfall 5: Next.js cache after schema changes

If you modify `prisma/schema.prisma` (e.g., adding fields to `MediaAsset`), you MUST:
1. Run `npx prisma migrate dev --name <name>`
2. Delete the `.next/` directory
3. Restart the dev server

Failure to do this causes stale Prisma client types and cryptic runtime errors.

### Pitfall 6: Bucket routing in r2.ts

The current `r2.ts` only exports `ATTACHMENTS_BUCKET` and `PUBLIC_URL` (attachments). All existing helpers (`getUploadUrl`, `getPublicUrl`, `moveObject`, `keyFromUrl`) default to the attachments bucket. The media implementation MUST add media bucket support — see Phase 1 below.

### Pitfall 7: R2 key is immutable after creation
When a user renames a `MediaAsset` (changes `filename`), the R2 object key still contains the original sanitized filename. This is by design — the `url` stored in the DB is the permanent URL and always works. The rename only updates the `filename` column (used for display). If download filenames need to match, use a `Content-Disposition` response header override (via Cloudflare Transform Rule or at serve-time).

### Pitfall 8: Orphan reconciliation
If an R2 `deleteObject()` call fails (network error, R2 outage), the code logs the error and continues with DB deletion. This means R2 objects can become orphaned (no matching DB record). A periodic reconciliation script should be run to identify and clean up orphans. Not critical for MVP but plan for it. The script pattern: `listObjects()` all permanent keys -> check each against DB -> delete any with no matching record older than 7 days.

---

## Implementation Phases

### Phase 1: Extend `lib/storage/r2.ts` for Media Bucket

**File:** `lib/storage/r2.ts`

Add media bucket constants alongside existing attachments ones:

```ts
// Add after the existing ATTACHMENTS_BUCKET and PUBLIC_URL exports
export const MEDIA_BUCKET = process.env.R2_MEDIA_BUCKET_NAME!;
export const MEDIA_PUBLIC_URL = (process.env.R2_MEDIA_PUBLIC_URL || "").replace(/\/+$/, "");
```

Update all helper functions that currently hardcode `ATTACHMENTS_BUCKET` to accept a `bucket` parameter (some already do via optional param — verify each one):

| Function | Current bucket param | Action needed |
|---|---|---|
| `getUploadUrl(key, contentType, fileSize?, opts?)` | `opts.bucket`, defaults to `ATTACHMENTS_BUCKET` | **Done** — accepts `fileSize` (ContentLength) and `opts.bucket` |
| `deleteObject(key, bucket?)` | Optional, defaults to `ATTACHMENTS_BUCKET` | **Done** — no change needed |
| `moveObject(srcKey, destKey, bucket?)` | Optional, defaults to `ATTACHMENTS_BUCKET` | **Done** — no change needed |
| `getPublicUrl(key)` | None — hardcodes `PUBLIC_URL` (attachments) | **Done** — `getMediaPublicUrl(key)` added |
| `keyFromUrl(url)` | None — hardcodes `PUBLIC_URL` (attachments) | **Done** — `keyFromMediaUrl(url)` added |
| `uploadFile(key, body, contentType, bucket?)` | Optional | **Done** — no change needed |
| `listObjects(prefix, bucket?)` | Optional | **Done** — no change needed |

**Recommended approach:** Add a `bucket` param to `getUploadUrl`, and create separate `getMediaPublicUrl(key)` and `keyFromMediaUrl(url)` functions that use `MEDIA_PUBLIC_URL`. This avoids breaking existing attachment code.

```ts
export function getMediaPublicUrl(key: string): string {
  return `${MEDIA_PUBLIC_URL}/${key}`;
}

export function keyFromMediaUrl(url: string): string | null {
  if (!MEDIA_PUBLIC_URL || !url.startsWith(MEDIA_PUBLIC_URL)) return null;
  return url.slice(MEDIA_PUBLIC_URL.length + 1);
}
```

**Status (March 2026):** Media bucket support added to `r2.ts`. `MEDIA_BUCKET`, `MEDIA_PUBLIC_URL`, `getMediaPublicUrl()`, and `keyFromMediaUrl()` are now exported. `getUploadUrl()` accepts `bucket` and `fileSize` params. The upload-url endpoint routes to the correct bucket based on context.

### Phase 2: Update Upload URL Endpoint

**File:** `app/api/v1/upload-url/route.ts`

The endpoint already has a `media` context with its own MIME type allowlist. Changes needed:

1. **Route to the correct bucket based on context.** Currently `getUploadUrl()` always writes to `ATTACHMENTS_BUCKET`. When `context === "media"`, use `MEDIA_BUCKET` instead.

2. **Return the correct public URL.** Currently `getPublicUrl(key)` returns the attachments public URL. When `context === "media"`, use `getMediaPublicUrl(key)`.

3. **Per-type file size limits** (optional enhancement):

```ts
const MAX_SIZE_BY_TYPE: Record<string, number> = {
  'image/': 10 * 1024 * 1024,    // 10 MB
  'audio/': 100 * 1024 * 1024,   // 100 MB
  'video/': 200 * 1024 * 1024,   // 200 MB (thumbnails only for now)
  'application/pdf': 50 * 1024 * 1024, // 50 MB
}
```

4. **Media key format.** Change the staging key generation for media context to include a category sub-path that will be used when promoting:

```ts
// For media context, the staging key is the same flat format:
// {churchSlug}/staging/{uuid}-{sanitized-filename}
// The category (images/audio/video) is determined at promotion time based on MIME type.
```

### Phase 3: Media DAL (`lib/dal/media.ts`)

**File to create:** `lib/dal/media.ts`

Follow the pattern in existing DAL modules (e.g., `lib/dal/messages.ts`). Every function takes `churchId` as first param.

```ts
import { prisma } from '@/lib/db'

export async function listMedia(
  churchId: string,
  opts?: {
    folder?: string
    mimeType?: string  // e.g., "image/%" for all images
    search?: string    // filename search
    cursor?: string
    limit?: number
  }
) {
  const limit = opts?.limit || 50
  const where = {
    churchId,
    deletedAt: null,
    ...(opts?.folder && { folder: opts.folder }),
    ...(opts?.mimeType && { mimeType: { startsWith: opts.mimeType.replace('%', '') } }),
    ...(opts?.search && { filename: { contains: opts.search, mode: 'insensitive' as const } }),
    ...(opts?.cursor && { createdAt: { lt: new Date(opts.cursor) } }),
  }
  return prisma.mediaAsset.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // +1 for cursor-based pagination
  })
}

export async function getMediaAsset(churchId: string, id: string) {
  return prisma.mediaAsset.findFirst({
    where: { id, churchId, deletedAt: null },
  })
}

export async function createMediaAsset(churchId: string, data: {
  id?: string         // client-generated UUID
  filename: string
  url: string
  mimeType: string
  fileSize: number
  width?: number
  height?: number
  alt?: string
  folder?: string
  createdBy?: string
}) {
  return prisma.mediaAsset.create({
    data: {
      ...(data.id && { id: data.id }),
      churchId,
      filename: data.filename,
      url: data.url,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      width: data.width,
      height: data.height,
      alt: data.alt || null,
      folder: data.folder || '/',
      createdBy: data.createdBy,
    },
  })
}

export async function updateMediaAsset(churchId: string, id: string, data: {
  alt?: string
  folder?: string
  filename?: string
}) {
  return prisma.mediaAsset.update({
    where: { id },
    data,
  })
}

export async function deleteMediaAsset(churchId: string, id: string) {
  // Soft delete
  return prisma.mediaAsset.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

export async function hardDeleteMediaAsset(churchId: string, id: string) {
  return prisma.mediaAsset.delete({
    where: { id },
  })
}

export async function getMediaByFolder(churchId: string, folder: string) {
  return prisma.mediaAsset.findMany({
    where: { churchId, folder, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getDistinctFolders(churchId: string): Promise<string[]> {
  const results = await prisma.mediaAsset.findMany({
    where: { churchId, deletedAt: null },
    select: { folder: true },
    distinct: ['folder'],
    orderBy: { folder: 'asc' },
  })
  return results.map(r => r.folder)
}
```

### Phase 4: Media API Routes

**Directory:** `app/api/v1/media/`

Create these route files:

| File | Method | Purpose |
|---|---|---|
| `app/api/v1/media/route.ts` | GET | List media (paginated, filterable) |
| `app/api/v1/media/route.ts` | POST | Create media record after R2 upload + promote from staging |
| `app/api/v1/media/[id]/route.ts` | GET | Get single media asset |
| `app/api/v1/media/[id]/route.ts` | PATCH | Update metadata (alt, folder, filename) |
| `app/api/v1/media/[id]/route.ts` | DELETE | Soft-delete media asset |
| `app/api/v1/media/folders/route.ts` | GET | List distinct folders |

**Critical: POST `/api/v1/media` must handle staging promotion.**

The POST handler receives a staging URL (from the upload flow) and must:
1. Derive the staging key from the URL using `keyFromMediaUrl(url)`
2. Determine the category from MIME type (`image/* -> images/`, `audio/* -> audio/`, etc.)
3. Build the permanent key: `{churchSlug}/{category}/{year}/{uuid}-{filename}`
4. Move from staging to permanent using `moveObject(srcKey, destKey, MEDIA_BUCKET)`
5. Build the permanent public URL using `getMediaPublicUrl(destKey)`
6. Create the `MediaAsset` DB record with the permanent URL

```ts
// POST /api/v1/media — Reference implementation
import { getChurchId } from '@/lib/api/get-church-id'
import { moveObject, isStagingKey, keyFromMediaUrl, getMediaPublicUrl, MEDIA_BUCKET } from '@/lib/storage/r2'
import { createMediaAsset } from '@/lib/dal/media'

export async function POST(request: NextRequest) {
  const churchId = await getChurchId()
  const body = await request.json()
  const { filename, url, mimeType, fileSize, width, height, alt, folder } = body

  // Promote from staging
  const srcKey = keyFromMediaUrl(url)
  if (!srcKey || !isStagingKey(srcKey)) {
    return NextResponse.json({ success: false, error: 'Invalid staging URL' }, { status: 400 })
  }

  const category = mimeType.startsWith('image/') ? 'images'
    : mimeType.startsWith('audio/') ? 'audio'
    : mimeType.startsWith('video/') ? 'video'
    : 'other'
  const year = new Date().getFullYear().toString()
  const uuidFilename = srcKey.replace(/^[^/]+\/staging\//, '')
  const churchSlug = process.env.CHURCH_SLUG || 'la-ubf'
  const destKey = `${churchSlug}/${category}/${year}/${uuidFilename}`

  await moveObject(srcKey, destKey, MEDIA_BUCKET)
  const permanentUrl = getMediaPublicUrl(destKey)

  const asset = await createMediaAsset(churchId, {
    filename,
    url: permanentUrl,
    mimeType,
    fileSize,
    width,
    height,
    alt,
    folder,
  })

  return NextResponse.json({ success: true, data: asset })
}
```

**Critical: DELETE handler must clean up R2 objects.**

Follow the pattern in `lib/dal/sync-message-study.ts` — delete the R2 object first, then the DB record:

```ts
// DELETE /api/v1/media/[id] — Reference implementation
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const churchId = await getChurchId()
  const asset = await getMediaAsset(churchId, params.id)
  if (!asset) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  // Delete R2 object
  const key = keyFromMediaUrl(asset.url)
  if (key) {
    try {
      await deleteObject(key, MEDIA_BUCKET)
    } catch (err) {
      console.error(`Failed to delete R2 object "${key}":`, err)
      // Continue with DB deletion — orphaned R2 objects are cheaper than orphaned DB records
    }
  }

  // Soft-delete DB record (or hard-delete if emptying trash)
  await deleteMediaAsset(churchId, params.id)
  return NextResponse.json({ success: true })
}
```

### Phase 5: Upload Flow (Client-Side)

**Reference implementation:** See how `components/cms/messages/entry/metadata-sidebar.tsx` handles bible study attachment uploads. Follow the same pattern.

**Upload sequence for each file:**

```ts
// 1. Validate file size on the client BEFORE requesting presigned URL
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB
if (file.size > MAX_IMAGE_SIZE) {
  toast.error('Image too large. Maximum size is 10 MB.')
  return
}

// 2. Request presigned URL
const res = await fetch('/api/v1/upload-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filename: file.name,
    contentType: file.type,
    fileSize: file.size,
    context: 'media',  // routes to media MIME allowlist
  }),
})
const json = await res.json()
if (!json.success) {
  toast.error(json.error?.message || 'Failed to get upload URL')
  return
}
// CRITICAL: destructure from .data, not top-level
const { uploadUrl, key, publicUrl } = json.data

// 3. PUT file directly to R2 via presigned URL
const uploadRes = await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type },
})
if (!uploadRes.ok) {
  toast.error('Upload failed. Please try again.')
  return
}

// 4. Create media record (promotes from staging to permanent key)
const id = crypto.randomUUID() // MUST be UUID for @db.Uuid primary key
const createRes = await fetch('/api/v1/media', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id,
    filename: file.name,
    url: publicUrl,  // staging URL — server will promote
    mimeType: file.type,
    fileSize: file.size,
    folder: currentFolder || '/',
  }),
})
```

**For images, extract dimensions before upload:**

```ts
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = URL.createObjectURL(file)
  })
}
```

### Phase 6: Wire Up CMS UI

| File | Change |
|---|---|
| `app/cms/(dashboard)/media/page.tsx` | Replace placeholder with real grid + toolbar. Fetch from `GET /api/v1/media`. |
| `components/cms/media/upload-photo-dialog.tsx` | Connect to presigned URL upload flow (Phase 5 pattern). |
| `components/cms/media/media-grid.tsx` | Fetch from API, handle pagination, show loading/empty states. |
| `components/cms/media/media-sidebar.tsx` | Fetch folders from `GET /api/v1/media/folders`. |
| `components/cms/media/media-preview-dialog.tsx` | Load from R2 URL, show metadata. |
| `components/cms/media/media-selector-dialog.tsx` | Browse + select existing media for embedding in other editors. |
| `components/cms/media/toolbar.tsx` | Search, filter by type, bulk delete. |
| `components/cms/media/columns.tsx` | Update columns if using table view. |

### Phase 7: Media Selector Integration

Allow other editors (messages, events, pages) to embed media from the library:

```tsx
<MediaSelectorDialog
  onSelect={(asset) => {
    insertMedia(asset.url, asset.alt)
  }}
  accept={["image/*"]}
/>
```

---

## File Type Allowlist

Already defined in `app/api/v1/upload-url/route.ts` under the `media` context:

| Category | MIME Types | Max Size |
|---|---|---|
| Images | `image/jpeg`, `image/png`, `image/webp`, `image/gif` | 10 MB |
| Audio | `audio/mpeg` (.mp3) | 100 MB |
| Video | `video/mp4` (thumbnails, short clips) | 200 MB |
| Documents | `application/pdf` | 50 MB |

If additional MIME types are needed (e.g., `image/svg+xml`, `audio/wav`, `audio/mp4`), add them to the `media` allowlist in `app/api/v1/upload-url/route.ts`.

## R2 Key Format

**Staging (pre-save):**
```
{churchSlug}/staging/{uuid}-{sanitized-filename}
```
Example: `la-ubf/staging/a1b2c3d4-sermon-cover.jpg`

**Permanent (post-save):**
```
{churchSlug}/{category}/{year}/{uuid}-{sanitized-filename}
```
Example: `la-ubf/images/2026/a1b2c3d4-sermon-cover.jpg`

Categories: `images`, `audio`, `video`, `other`

## Folder Structure (Virtual)

Folders are virtual — implemented as R2 key prefixes and tracked in the `folder` column of `MediaAsset`. The R2 permanent key does NOT use the virtual folder; folders are a DB-only organizational concept.

Default folders per church:
```
/                     (root -- all media)
/series-covers        (auto-created when series image uploaded)
/event-images
/people
/general
```

Users can create custom folders via the media sidebar.

## Delete Handling

**Strategy: Keep R2 file until hard-delete (supports undo).**

When a media asset is soft-deleted:
1. Set `deletedAt` timestamp on `MediaAsset` record
2. R2 file is **NOT** deleted — it remains accessible if the user undoes
3. Soft-deleted assets are excluded from all queries (`WHERE deletedAt IS NULL`)
4. The file continues to count toward storage quota until hard-deleted

For hard delete (admin "empty trash" action or scheduled cleanup):
1. Delete R2 object via `deleteObject(key, MEDIA_BUCKET)`
2. Delete DB record via `hardDeleteMediaAsset()`
3. Check if any bible study, message, or page still references the URL — warn if so
4. Storage quota is recalculated after hard delete

**Rationale:** Media assets are commonly reused across pages and posts. Immediate R2 deletion on soft-delete would make "undo" impossible since the file would be gone. Keeping the file until hard-delete is safer and costs minimal extra storage (soft-deleted files are typically cleaned up within days).

## Quota Enforcement

Same as bible study plan — shared 10 GB quota per church, enforced at `POST /api/v1/upload-url`:

```ts
// lib/dal/storage.ts
export async function getChurchStorageUsage(churchId: string): Promise<number> {
  const [mediaResult, attachmentResult] = await Promise.all([
    prisma.mediaAsset.aggregate({
      where: { churchId },
      _sum: { fileSize: true },
    }),
    prisma.bibleStudyAttachment.aggregate({
      where: { bibleStudy: { churchId } },
      _sum: { fileSize: true },
    }),
  ])
  return (mediaResult._sum.fileSize || 0) + (attachmentResult._sum.fileSize || 0)
}
```

**Implemented** in `lib/dal/storage.ts` and enforced at `POST /api/v1/upload-url`. Note: soft-deleted MediaAssets still count toward quota (the aggregation does not filter by `deletedAt`) to prevent quota gaming. Storage is only freed after hard-delete.

## Security Hardening — IMPLEMENTED

### Authentication Gate
The `POST /api/v1/upload-url` endpoint requires an authenticated session. Unauthenticated requests receive a 401 response. This prevents anonymous abuse of the upload system.

### ContentLength Enforcement
Presigned PUT URLs include a `ContentLength` constraint matching the client-declared `fileSize`. R2 rejects any upload whose actual body size doesn't match. This closes a bypass where a client could declare a small size to pass validation but upload a much larger file.

### Per-Type Size Limits
File size limits are enforced per MIME type category (not a flat 50 MB for everything):
| Category | Max Size |
|---|---|
| Images (`image/*`) | 10 MB |
| Audio (`audio/*`) | 100 MB |
| Video (`video/*`) | 200 MB |
| Documents (`application/pdf`, Word) | 50 MB |

### Quota Enforcement
Combined storage across media + attachments is capped at 10 GB per church. Enforced at the presigned URL endpoint before issuing upload URLs.

## Thumbnail Generation

**Deferred — not in initial implementation.**

For MVP: use the original image URL for thumbnails. The `thumbnailUrl` column exists but will be null initially.

Future: Add a Cloudflare Worker or Image Resizing rule to generate thumbnails on-the-fly:
```
https://cdn.laubf.org/cdn-cgi/image/width=300,quality=80/{key}
```
This requires Cloudflare Pro plan ($20/mo) or a separate Worker-based solution.

---

## Implementation Checklist

Use this as a step-by-step guide. Complete each item in order.

### Infrastructure (do first, do once)
- [ ] Create `media` R2 bucket in Cloudflare dashboard
- [ ] Configure CORS on `media` bucket (see Prerequisites section)
- [ ] Set `R2_MEDIA_BUCKET_NAME` and `R2_MEDIA_PUBLIC_URL` in `.env`
- [ ] Add media bucket R2.dev hostname to `next.config.ts` `images.remotePatterns`
- [ ] Configure staging lifecycle rule on `media` bucket (delete after 1 day, prefix `la-ubf/staging/`)

### Storage client
- [ ] Add `MEDIA_BUCKET` and `MEDIA_PUBLIC_URL` exports to `lib/storage/r2.ts`
- [ ] Add `bucket` param to `getUploadUrl()` in `lib/storage/r2.ts`
- [ ] Add `getMediaPublicUrl(key)` function to `lib/storage/r2.ts`
- [ ] Add `keyFromMediaUrl(url)` function to `lib/storage/r2.ts`
- [ ] Verify existing helpers (`deleteObject`, `moveObject`, `listObjects`, `uploadFile`) already accept optional `bucket` param

### Upload endpoint
- [ ] Update `POST /api/v1/upload-url` to use `MEDIA_BUCKET` when `context === "media"`
- [ ] Update `POST /api/v1/upload-url` to return `getMediaPublicUrl(key)` when `context === "media"`

### DAL
- [ ] Create `lib/dal/media.ts` with all functions from Phase 3

### API routes
- [ ] Create `app/api/v1/media/route.ts` (GET + POST)
- [ ] Create `app/api/v1/media/[id]/route.ts` (GET + PATCH + DELETE)
- [ ] Create `app/api/v1/media/folders/route.ts` (GET)
- [ ] Verify POST handler promotes staging files to permanent keys
- [ ] Verify DELETE handler cleans up R2 objects

### CMS UI
- [ ] Wire `upload-photo-dialog.tsx` to presigned URL flow
- [ ] Wire `media-grid.tsx` to `GET /api/v1/media`
- [ ] Wire `media-sidebar.tsx` to folders endpoint
- [ ] Wire `media-preview-dialog.tsx` to show R2-hosted files
- [ ] Wire `toolbar.tsx` search/filter to API query params
- [ ] Update `app/cms/(dashboard)/media/page.tsx` to compose all components

### After schema changes (if any)
- [ ] Run `npx prisma migrate dev --name <name>`
- [ ] Delete `.next/` directory
- [ ] Restart dev server

### Verification
- [ ] Upload an image — verify it appears in R2 `media` bucket under `la-ubf/staging/`
- [ ] Save — verify file moves to `la-ubf/images/2026/` permanent key
- [ ] Verify the `MediaAsset` DB record has the permanent URL (not staging)
- [ ] Delete a media asset — verify R2 object is removed
- [ ] Upload from media selector in another editor — verify cross-editor flow works

---

## Reference Files

| Purpose | File Path |
|---|---|
| R2 storage client | `lib/storage/r2.ts` |
| Upload URL endpoint | `app/api/v1/upload-url/route.ts` |
| Attachments sync (reference pattern) | `lib/dal/sync-message-study.ts` |
| Attachments upload UI (reference pattern) | `components/cms/messages/entry/metadata-sidebar.tsx` |
| MediaAsset model | `prisma/schema.prisma` (search for `model MediaAsset`) |
| Env var template | `.env.example` (R2 section) |
| Two-bucket architecture | `docs/06_r2-storage/01-r2-env-setup.md` |
| Attachments plan (completed reference) | `docs/06_r2-storage/03-bible-study-attachments-plan.md` |
