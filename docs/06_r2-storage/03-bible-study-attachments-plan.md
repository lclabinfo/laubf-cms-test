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
export async function getUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<string>
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

Default bucket is `ATTACHMENTS_BUCKET`. Bucket param available for future `file-media` bucket.

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

### Phase 6: Quota Enforcement — NOT IMPLEMENTED

Planned DAL function (not yet built):

```ts
// lib/dal/storage.ts
export async function getChurchStorageUsage(churchId: string): Promise<number>
```

Query: `SUM(fileSize)` across `BibleStudyAttachment` + `MediaAsset` where `churchId` matches. Return bytes. Compare against 10 GB limit before allowing uploads. Enforce at `POST /api/v1/upload-url`.

---

## File Type Allowlist

| Type | Extensions | Max Size |
|---|---|---|
| PDF | `.pdf` | 50 MB |
| Word | `.docx`, `.doc` | 25 MB |
| Rich Text | `.rtf` | 10 MB |
| Image | `.jpg`, `.png`, `.webp` | 10 MB |

## Error Handling

| Scenario | Handling |
|---|---|
| Presigned URL expired | Client retries `POST /api/v1/upload-url`, gets fresh URL |
| Upload fails mid-transfer | Client can retry PUT to same presigned URL (idempotent) |
| User cancels before save | Staging files auto-deleted by lifecycle rule (24h) |
| R2 unreachable | Show error toast, allow retry, do not save partial state |
| Storage quota exceeded | Reject at `POST /api/v1/upload-url` with 413 + message |
