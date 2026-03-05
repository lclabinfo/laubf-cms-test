# Bible Study Attachments — R2 Migration Plan

## Current State

- `BibleStudyAttachment` model exists in Prisma schema with `url`, `name`, `type`, `fileSize`, `sortOrder`
- DAL (`lib/dal/bible-studies.ts`) includes attachments in queries
- API routes support CRUD on bible studies
- **No actual file upload** — attachment URLs point to legacy source or are not yet populated
- CMS metadata sidebar has file picker UI but files only live in memory (lost on navigation)

## Target State

- Files uploaded to R2 via presigned URLs
- `BibleStudyAttachment.url` stores the CDN URL (e.g., `https://cdn.laubf.org/{churchId}/attachments/2026/{uuid}-handout.pdf`)
- Upload, replace, and delete operations all keep R2 and DB in sync
- Orphan files auto-cleaned via staging prefix + lifecycle rule

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
// lib/storage/r2.ts
export async function getUploadUrl(key: string, contentType: string, maxSize: number): Promise<string>
export async function deleteObject(key: string): Promise<void>
export async function moveObject(srcKey: string, destKey: string): Promise<void>
export function getPublicUrl(key: string): string
```

- `getUploadUrl` — generates presigned PUT URL (5-minute expiry)
- `deleteObject` — removes file from R2
- `moveObject` — copies from staging to permanent key, then deletes staging
- `getPublicUrl` — returns `${R2_PUBLIC_URL}/${key}`

### Phase 3: Upload API Route (`app/api/v1/upload-url/route.ts`)

```
POST /api/v1/upload-url
Body: { filename, contentType, fileSize, context: "bible-study" | "media" }
Response: { uploadUrl, key, publicUrl }
```

Server-side logic:
1. Authenticate user
2. Validate file type (PDF, DOCX, DOC, RTF, IMAGE for bible study)
3. Validate file size (max 50 MB per file)
4. Check church storage quota (sum of existing files < 10 GB)
5. Generate staging key: `staging/{churchId}/attachments/{uuid}-{filename}`
6. Return presigned PUT URL + final public URL

### Phase 4: Client Upload Flow

**Upload sequence:**

1. User clicks "Upload" in the study editor sidebar
2. File picker opens, user selects file(s)
3. For each file:
   a. Call `POST /api/v1/upload-url` to get presigned URL
   b. `PUT` file directly to R2 via presigned URL (with progress tracking)
   c. Add attachment to local state with the returned `publicUrl`
4. User continues editing (files are in `staging/` prefix on R2)
5. On **Save**:
   a. API receives attachment list with keys
   b. Server moves each file from `staging/` to permanent key
   c. Creates/updates `BibleStudyAttachment` records in DB
6. On **Cancel/Navigate away**:
   a. Staged files remain in `staging/` prefix
   b. R2 lifecycle rule auto-deletes after 24 hours — no cleanup code needed

**Delete sequence:**

1. User clicks remove on an existing attachment
2. Attachment removed from local state
3. On **Save**:
   a. API compares submitted attachments vs DB records
   b. For removed attachments: delete from R2 + delete DB record
   c. For new attachments: move from staging + create DB record

### Phase 5: Wire Up CMS UI

**Files to modify:**

| File | Change |
|---|---|
| `components/cms/messages/entry/metadata-sidebar.tsx` | Replace in-memory file handling with presigned URL upload |
| `components/cms/messages/entry/entry-form.tsx` | Pass R2 keys in save payload; handle attachment diffing |
| `app/api/v1/messages/[id]/route.ts` | Accept attachment keys, move from staging, sync DB |
| `lib/dal/bible-studies.ts` | Add `syncAttachments(studyId, attachments)` function |

### Phase 6: Quota Enforcement

Add a DAL function:

```ts
// lib/dal/storage.ts
export async function getChurchStorageUsage(churchId: string): Promise<number>
```

Query: `SUM(fileSize)` across `BibleStudyAttachment` + `MediaAsset` where `churchId` matches. Return bytes. Compare against 10 GB limit before allowing uploads.

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
