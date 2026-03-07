# Cloudflare R2 — Environment Setup

## Bucket Architecture

Two separate R2 buckets, each serving a distinct purpose:

| Bucket | Env Var | Contents | Access Pattern |
|---|---|---|---|
| `file-attachments` | `R2_ATTACHMENTS_BUCKET_NAME` | Bible study PDFs, DOCXs, sermon handouts | Download-oriented (user clicks to download) |
| `media` | `R2_MEDIA_BUCKET_NAME` | Images, audio, thumbnails, series covers | Serve-oriented (embedded inline, cached by CDN) |

**Why two buckets instead of one?**
- Different access patterns — media is served inline with aggressive caching; attachments are downloaded on-demand
- Independent lifecycle rules — media may keep thumbnails forever; attachments may archive old documents
- Cleaner CORS policies — media bucket can allow broad public reads; attachments can be more restrictive
- Easier monitoring — per-bucket usage and cost visibility in Cloudflare dashboard

Both buckets live in the same Cloudflare account and share API credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`).

**Current setup (Phase 1):** Each church has its own Cloudflare account with its own buckets and free tier. See `00-account-strategy.md` for the account management plan and future consolidation path.

## Required Environment Variables

| Variable | Purpose | Where to find |
|---|---|---|
| `R2_ACCOUNT_ID` | Cloudflare account identifier | Cloudflare dashboard > Account Home > right sidebar |
| `R2_ACCESS_KEY_ID` | S3-compatible API token access key | Cloudflare > R2 > Manage R2 API Tokens > Create |
| `R2_SECRET_ACCESS_KEY` | S3-compatible API token secret | Shown once at token creation — save immediately |
| `R2_ATTACHMENTS_BUCKET_NAME` | Attachments bucket name | e.g., `file-attachments` |
| `R2_ATTACHMENTS_PUBLIC_URL` | Attachments public URL | Custom domain or R2 dev URL |
| `R2_MEDIA_BUCKET_NAME` | Media bucket name | e.g., `media` |
| `R2_MEDIA_PUBLIC_URL` | Media public URL | Custom domain or R2 dev URL |

## Endpoint

The S3-compatible endpoint (shared by both buckets):
```
https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com
```

## NPM Packages

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## S3Client Configuration — Implemented

One shared S3-compatible client in `lib/storage/r2.ts`:

```ts
// lib/storage/r2.ts (actual implementation)
import { S3Client, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export const ATTACHMENTS_BUCKET = process.env.R2_ATTACHMENTS_BUCKET_NAME!
// Strip trailing slash — keyFromUrl() relies on exact prefix matching
export const PUBLIC_URL = process.env.R2_ATTACHMENTS_PUBLIC_URL!.replace(/\/+$/, "")

export const MEDIA_BUCKET = process.env.R2_MEDIA_BUCKET_NAME!
export const MEDIA_PUBLIC_URL = (process.env.R2_MEDIA_PUBLIC_URL || "").replace(/\/+$/, "")
```

**Exported helpers:**

| Function | Purpose |
|---|---|
| `getUploadUrl(key, contentType, fileSize?, opts?)` | Presigned PUT URL with ContentLength enforcement (1h expiry) |
| `deleteObject(key)` | Delete an R2 object |
| `moveObject(srcKey, destKey)` | Copy + delete (staging → permanent) |
| `getPublicUrl(key)` | Full CDN URL from key |
| `isStagingKey(key)` | Check if key is in `staging/` prefix |
| `keyFromUrl(url)` | Derive R2 key from full public URL |
| `uploadFile(key, body, contentType)` | Server-side upload (scripts/migration) |
| `listObjects(prefix)` | Paginated listing under a prefix |
| `getMediaPublicUrl(key)` | Full CDN URL for media bucket |
| `keyFromMediaUrl(url)` | Derive R2 key from media public URL |

**Media bucket support (added March 2026):**
The storage client now exports `MEDIA_BUCKET` and `MEDIA_PUBLIC_URL` alongside the attachments equivalents. All bucket-aware helpers accept an optional `bucket` parameter. The `getUploadUrl()` function now accepts `fileSize` to set `ContentLength` on the presigned URL — R2 will reject uploads that don't match the declared size. This prevents clients from bypassing the per-file size validation.

Usage example:

```ts
import { getUploadUrl, getPublicUrl } from "@/lib/storage/r2"

const key = `la-ubf/staging/${uuid}-handout.pdf`
const uploadUrl = await getUploadUrl(key, "application/pdf")
const publicUrl = getPublicUrl(key) // https://pub-XXX.r2.dev/la-ubf/staging/{uuid}-handout.pdf
```

## R2 Bucket CORS Configuration

**CORS is REQUIRED for browser uploads.** Presigned URL PUTs from the browser will fail silently without CORS rules. Server-side uploads (migration scripts using `uploadFile()`) bypass CORS entirely, so this issue only surfaces when testing the CMS upload UI.

Apply to **both** buckets in Cloudflare dashboard > R2 > Bucket > Settings > CORS:

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

**Critical: Origins must NOT have trailing slashes.** Cloudflare silently rejects CORS rules with trailing slashes on origins. For example, `"http://localhost:3000/"` will not work — use `"http://localhost:3000"` (no trailing slash). This is a Cloudflare-specific requirement that produces no error message; browser uploads will simply fail with opaque CORS errors.

## Next.js Config

Add both bucket domains to `next.config.ts` remote patterns so `<Image>` can load R2-hosted files:

```ts
images: {
  remotePatterns: [
    // R2 dev URLs (available immediately, no custom domain needed)
    { protocol: "https", hostname: "pub-XXXX.r2.dev" },
    // Custom domains (optional — set up CNAME in Cloudflare DNS)
    // { protocol: "https", hostname: "media.laubf.org" },
    // { protocol: "https", hostname: "files.laubf.org" },
  ],
}
```

**Note:** R2 dev URLs (`pub-XXX.r2.dev`) work out of the box. Custom domains (e.g., `media.laubf.org`) require adding a CNAME record in the same Cloudflare account's DNS — since `laubf.org` is already on Cloudflare, this is a one-click setup.

## R2 Bucket Lifecycle Rules

Configure in Cloudflare dashboard > R2 > Bucket > Settings > Object lifecycle rules:

| Rule | Prefix | Action | TTL |
|---|---|---|---|
| Auto-delete staging uploads | `staging/` | Delete | 24 hours |

This cleans up orphaned uploads from cancelled editing sessions. Files are uploaded to `staging/` via presigned URLs, then moved to permanent keys on save. If the user cancels or navigates away, the staging files are automatically cleaned up — no server-side cleanup code needed.

## Important Configuration Notes

- **`R2_ATTACHMENTS_PUBLIC_URL` must NOT have a trailing slash.** The `keyFromUrl()` helper strips the public URL prefix to derive the R2 key. A trailing slash causes an off-by-one error where the derived key starts with `/`, which does not match the actual R2 object key.
- **CORS must be configured before browser uploads work.** Server-side uploads (migration scripts) bypass CORS, so this issue only surfaces in the CMS UI. See the CORS section above.
- **After Prisma schema changes, delete `.next/` and restart the dev server.** The Next.js dev server caches the old Prisma client, leading to stale types and runtime errors.
