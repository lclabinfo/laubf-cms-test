# Bible Study Attachments — R2 Integration

## Current State (March 2026) — IMPLEMENTED

- `BibleStudyAttachment` model in schema: `url`, `name`, `type` (enum), `fileSize`, `sortOrder`
- 2,731 attachments migrated to R2, 188.7 MB total (see `05-migration-checklist.md`)
- Full upload flow: presigned URL → staging → move-on-save → permanent key
- Full delete flow: derive R2 key from URL → delete R2 object → delete DB record
- CMS upload from 3 entry points: metadata sidebar, study tab DOCX import, entry form upload button
- `BibleStudyAttachment.url` stores the full CDN URL (e.g., `https://pub-XXX.r2.dev/la-ubf/2026/study-slug/{uuid}-handout.pdf`)
- Orphan uploads auto-cleaned via staging prefix + lifecycle rule (when configured)

---

## Implementation Phases

### Phase 1: R2 Infrastructure (one-time setup)

1. Create R2 bucket in Cloudflare dashboard
2. Create S3-compatible API token (read/write)
3. Configure CORS for localhost + production domain
4. Set up custom domain (optional — can use `pub-XXX.r2.dev` initially)
5. Add env vars to `.env` and `.env.example`
6. Install `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`

### Phase 2: Storage Client (`lib/storage/r2.ts`)

Create a thin wrapper around the S3 client:

```ts
// lib/storage/r2.ts — IMPLEMENTED
export async function getUploadUrl(key: string, contentType: string, fileSize?: number, opts?: { expiresIn?: number; bucket?: string }): Promise<string>
export async function deleteObject(key: string, bucket?: string): Promise<void>
export async function moveObject(srcKey: string, destKey: string, bucket?: string): Promise<void>
export function getPublicUrl(key: string): string
export function isStagingKey(key: string): boolean
export function keyFromUrl(url: string): string | null
```

- `getUploadUrl` — generates presigned PUT URL (1-hour expiry) for direct browser uploads
- `deleteObject` — removes file from R2
- `moveObject` — copies from staging to permanent key, then deletes staging original
- `getPublicUrl` — returns `${R2_ATTACHMENTS_PUBLIC_URL}/${key}`
- `isStagingKey` — checks if a key is in the staging/ prefix
- `keyFromUrl` — derives R2 key from a full public URL

Default bucket is `ATTACHMENTS_BUCKET`. Bucket param available for future `media` bucket.

### Phase 3: Upload API Route (`app/api/v1/upload-url/route.ts`) — IMPLEMENTED

```
POST /api/v1/upload-url
Body: { filename, contentType, fileSize, context: "bible-study" | "media" }
Response: { success, data: { uploadUrl, key, publicUrl } }
```

Server-side logic:
1. Resolve church context via `getChurchId()`
2. Validate file type (PDF, DOCX, DOC, RTF, IMAGE for bible study)
3. Validate file size (max 50 MB per file)
4. Generate staging key: `{churchSlug}/staging/{uuid}-{sanitized-filename}`
5. Return presigned PUT URL + staging public URL

### Phase 4: Client Upload + Server Move-on-Save — IMPLEMENTED

**Upload sequence:**

1. User uploads file (via sidebar, import, or drag-drop)
2. Client calls `POST /api/v1/upload-url` → gets presigned URL
3. Client `PUT`s file directly to R2 staging via presigned URL
4. Attachment added to local state with staging `publicUrl`
5. User continues editing (files sit in `staging/` prefix on R2)
6. On **Save**:
   a. API receives attachment list (with staging URLs)
   b. `syncStudyAttachments()` detects staging URLs via `isStagingKey()`
   c. Moves each staging file to permanent key: `{churchSlug}/{year}/{studySlug}/{uuid}-{filename}`
   d. Saves permanent URL to `BibleStudyAttachment.url`
7. On **Cancel/Navigate away**:
   a. Staged files remain in `staging/` prefix
   b. R2 lifecycle rule auto-deletes after 24 hours — no cleanup code needed

**Delete sequence:**

1. User removes an attachment in the editor
2. Attachment removed from local state
3. On **Save**:
   a. `syncStudyAttachments()` compares incoming vs DB records
   b. For removed attachments: derives R2 key from stored URL → deletes from R2 → deletes DB record
   c. For new attachments: moves from staging → creates DB record with permanent URL

### Phase 5: Wire Up CMS UI — IMPLEMENTED

All three CMS upload entry points are wired to R2:

| File | What was done |
|---|---|
| `components/cms/messages/entry/metadata-sidebar.tsx` | Presigned URL upload on file select, `r2Key` tracked on attachment |
| `components/cms/messages/entry/entry-form.tsx` | Upload button calls `POST /api/v1/upload-url`, attachments include `url` in save payload |
| `components/cms/messages/entry/study-tab.tsx` | DOCX import uploads file to R2 before adding to attachment list |
| `lib/dal/sync-message-study.ts` | `syncStudyAttachments()` moves staging → permanent, deletes R2 on removal |
| `app/api/v1/messages/[slug]/route.ts` | PATCH handler passes attachments through to `syncMessageStudy()` |

### Phase 6: Quota Enforcement — IMPLEMENTED

Implemented in `lib/dal/storage.ts`:

- `getChurchStorageUsage(churchId)` — sums `fileSize` across `BibleStudyAttachment` + `MediaAsset`
- `checkStorageQuota(churchId, additionalBytes)` — returns `{ allowed, currentUsage, quota, remaining }`
- Enforced at `POST /api/v1/upload-url` — rejects with 413 if quota exceeded
- Default quota: 10 GB per church (combined media + attachments)

---

## File Type Allowlist

| Type | Extensions | Max Size |
|---|---|---|
| PDF | `.pdf` | 50 MB |
| Word | `.docx`, `.doc` | 50 MB |
| Rich Text | `.rtf` | 50 MB |
| Image | `.jpg`, `.png`, `.webp` | 10 MB |

## Error Handling

| Scenario | Handling |
|---|---|
| Presigned URL expired | Client retries `POST /api/v1/upload-url`, gets fresh URL |
| Upload fails mid-transfer | Client can retry PUT to same presigned URL (idempotent) |
| User cancels before save | Staging files auto-deleted by lifecycle rule (24h) |
| R2 unreachable | Show error toast, allow retry, do not save partial state |
| Storage quota exceeded | Reject at `POST /api/v1/upload-url` with 413 + message |

---

## Lessons Learned / Implementation Notes

Critical bugs and edge cases discovered during implementation. **Read this section before extending the R2 integration to new content types (e.g., media assets).**

### 1. API Response Parsing — Destructure from `data`

The upload-url API returns `{ success: true, data: { uploadUrl, key, publicUrl } }`. Client code must destructure from `response.data`, not the top level:

```ts
// WRONG — uploadUrl will be undefined
const { uploadUrl, key, publicUrl } = await res.json()

// CORRECT
const { data } = await res.json()
const { uploadUrl, key, publicUrl } = data
```

### 2. UUID Requirement for Attachment IDs

`BibleStudyAttachment.id` is `@db.Uuid` in the Prisma schema. Client-generated IDs **must** use `crypto.randomUUID()`. Custom formats like `att-${Date.now()}-${Math.random()}` cause silent Postgres cast errors on upsert — the query fails with no clear error message.

### 3. CORS Is Required for Browser Uploads

Presigned URL PUTs from the browser require CORS rules on the R2 bucket. Server-side uploads (migration scripts using `uploadFile()`) bypass CORS entirely. **CORS must be configured before any browser upload will work.** Additionally, origins in the CORS config must NOT have trailing slashes — Cloudflare silently rejects them. See `01-r2-env-setup.md` for the CORS config.

### 4. All Upload Paths Must Use Presigned URL Flow

The entry-form upload button (`entry-form.tsx`) originally had its own `handleFileChange` that created attachment records with empty URLs without uploading to R2. Every upload entry point — metadata sidebar, study tab DOCX import, and entry form upload button — must go through the `POST /api/v1/upload-url` presigned URL flow. Verify all paths when adding new upload entry points.

### 5. Next.js Cache Must Be Cleared After Prisma Schema Changes

After running `prisma generate`, the Next.js dev server caches the old Prisma client in `.next/`. You must delete `.next/` and restart the dev server, or you will get stale type definitions and runtime errors:

```bash
rm -rf .next && npm run dev
```

### 6. Staging Promotion — moveObject Helper

Files uploaded via presigned URLs go to the `staging/` prefix. On save, they must be moved to permanent keys using the `moveObject()` helper (copy + delete). Permanent key format: `{churchSlug}/{year}/{studySlug}/{uuid}-{filename}`. If you skip the move step, files will be auto-deleted by the staging lifecycle rule.

### 7. R2 Lifecycle Rule for Staging Cleanup

An auto-delete lifecycle rule should be configured on the R2 bucket for the `staging/` prefix with a 24-hour TTL. This cleans up orphaned uploads from cancelled editing sessions without requiring any server-side cleanup code. **This rule must be set up in the Cloudflare dashboard** — it is not configured via the S3 API.

### 8. PUBLIC_URL Trailing Slash

The `R2_ATTACHMENTS_PUBLIC_URL` env var must NOT have a trailing slash. The `keyFromUrl()` helper strips the public URL prefix to derive the R2 key — a trailing slash causes an off-by-one error where the derived key starts with `/`, which does not match the actual R2 object key. The `r2.ts` client should defensively strip trailing slashes:

```ts
export const PUBLIC_URL = process.env.R2_ATTACHMENTS_PUBLIC_URL!.replace(/\/+$/, "")
```

### 9. Client-Side File Size Validation

The server validates the 50 MB limit at `POST /api/v1/upload-url`, but the client should check file size **before** requesting the presigned URL. This avoids an unnecessary round trip and gives the user immediate feedback. All upload entry points should include:

```ts
if (file.size > 50 * 1024 * 1024) {
  toast.error("File exceeds 50 MB limit")
  return
}
```

### 10. fileSize Round-Trip Preservation

`synthesizeAttachments()` (in `lib/messages-data.ts`) must preserve the raw `fileSize` (number of bytes) when loading attachments from the API — not just the formatted display string (e.g., `"2.4 MB"`). The raw byte value is needed for quota tracking and accurate display after reload. Both `size` (formatted string) and `fileSize` (raw bytes) must be carried through the full round trip: API response -> client state -> save payload -> DB.

### 11. Authentication Required on Upload Endpoint

The `POST /api/v1/upload-url` endpoint now requires an authenticated session. Previously, `getChurchId()` silently fell back to `CHURCH_SLUG` env var when no session was present, allowing unauthenticated users to generate presigned upload URLs. The endpoint now returns 401 if no valid session exists. This prevents abuse where anyone could fill the church's R2 bucket with arbitrary files.

### 12. ContentLength Enforcement on Presigned URLs

`getUploadUrl()` now accepts a `fileSize` parameter and sets `ContentLength` on the `PutObjectCommand`. R2 will reject any PUT request whose body size doesn't match the declared `ContentLength`. This prevents a client from declaring a small file size (to pass the 50 MB validation) but actually uploading a much larger file. The upload-url endpoint passes the validated `fileSize` through to `getUploadUrl()`.

### 13. Per-Type File Size Limits

The upload-url endpoint now enforces per-MIME-type size limits instead of a flat 50 MB cap:
- Images: 10 MB
- Audio: 100 MB
- Video: 200 MB
- PDF/Documents: 50 MB

This aligns with the media library plan's file type allowlist and prevents oversized uploads for image-heavy use cases while allowing larger audio files.
