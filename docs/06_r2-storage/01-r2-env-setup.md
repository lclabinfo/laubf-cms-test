# Cloudflare R2 — Environment Setup

## Bucket Architecture

Two separate R2 buckets, each serving a distinct purpose:

| Bucket | Env Var | Contents | Access Pattern |
|---|---|---|---|
| `file-attachments` | `R2_ATTACHMENTS_BUCKET_NAME` | Bible study PDFs, DOCXs, sermon handouts | Download-oriented (user clicks to download) |
| `file-media` | `R2_MEDIA_BUCKET_NAME` | Images, audio, thumbnails, series covers | Serve-oriented (embedded inline, cached by CDN) |

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
| `R2_MEDIA_BUCKET_NAME` | Media bucket name | e.g., `file-media` |
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
export const PUBLIC_URL = process.env.R2_ATTACHMENTS_PUBLIC_URL!
```

**Exported helpers:**

| Function | Purpose |
|---|---|
| `getUploadUrl(key, contentType)` | Presigned PUT URL for browser uploads (1h expiry) |
| `deleteObject(key)` | Delete an R2 object |
| `moveObject(srcKey, destKey)` | Copy + delete (staging → permanent) |
| `getPublicUrl(key)` | Full CDN URL from key |
| `isStagingKey(key)` | Check if key is in `staging/` prefix |
| `keyFromUrl(url)` | Derive R2 key from full public URL |
| `uploadFile(key, body, contentType)` | Server-side upload (scripts/migration) |
| `listObjects(prefix)` | Paginated listing under a prefix |

Usage example:

```ts
import { getUploadUrl, getPublicUrl } from "@/lib/storage/r2"

const key = `la-ubf/staging/${uuid}-handout.pdf`
const uploadUrl = await getUploadUrl(key, "application/pdf")
const publicUrl = getPublicUrl(key) // https://pub-XXX.r2.dev/la-ubf/staging/{uuid}-handout.pdf
```

## R2 Bucket CORS Configuration

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
