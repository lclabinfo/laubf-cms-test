# Media Storage & CDN Implementation Guide

**Date:** 2026-03-03
**Status:** Planning

---

## How It All Works (Big Picture)

```
                        YOUR CMS
                    ┌──────────────┐
                    │  Next.js App │
                    │              │
  Admin uploads  ──►│ API Route    │──► generates presigned URL
  an image          │              │         │
                    └──────────────┘         │
                                            ▼
                    ┌──────────────┐   ┌─────────────┐
  Browser uploads   │  Cloudflare  │   │ Cloudflare   │
  directly via   ──►│  R2 Bucket   │◄──│ R2 API       │
  presigned URL     │ (storage)    │   │ (S3-compat)  │
                    └──────┬───────┘   └──────────────┘
                           │
                    ┌──────▼───────┐
  Public visitors   │  Cloudflare  │
  load images    ◄──│  CDN Edge    │   ← cdn.laubf.org
  from CDN          │ (300+ PoPs)  │
                    └──────────────┘
```

**In plain English:**

1. Admin clicks "Upload" in the CMS
2. Your server generates a short-lived signed URL that lets the browser upload directly to R2 (your file never touches your server)
3. The file lands in the R2 bucket
4. The public URL (e.g., `cdn.laubf.org/uploads/photo.jpg`) goes through Cloudflare's CDN automatically
5. Your database stores the public URL in the `MediaAsset` table
6. Visitors load images from the CDN — Cloudflare caches them at 300+ edge locations worldwide

---

## Why Cloudflare R2 (Not Azure Blob Storage)

Both are "object storage" — a bucket in the cloud where you put files and get URLs back. We evaluated both:

| | Azure Blob Storage | Cloudflare R2 |
|---|---|---|
| Storage cost | $0.018/GB/mo | $0.015/GB/mo |
| Egress (bandwidth) | **$0.087/GB** | **Free** |
| CDN included | No (extra setup) | Yes (built-in) |
| Free tier | Negligible | 10 GB + 10M reads/mo |
| SDK | Azure-only (`@azure/storage-blob`) | S3-compatible (`@aws-sdk/client-s3`) |
| Vendor lock-in | High | Low (can migrate to any S3-compatible) |
| Monthly cost (20GB stored, 100GB served) | ~$9 | **~$0.30** |

**R2 wins on every dimension.** Zero egress fees is the killer feature — Azure charges $0.087 per GB downloaded, which adds up fast for image-heavy sites. R2's S3-compatible API also means we can switch to AWS S3, Backblaze B2, or any S3-compatible storage later without changing code.

> **Note:** We already use Azure for OpenAI (transcript features). Storage is a separate concern — using Cloudflare for storage and Azure for AI is normal and fine.

---

## Current State of the Media Library

### What exists today

| Layer | Status | Details |
|-------|--------|---------|
| **UI components** | Built (placeholder) | Grid, sidebar, preview dialog, upload dialog — all in `components/cms/media/` |
| **CMS page** | Placeholder | `app/cms/(dashboard)/media/page.tsx` shows "Coming Soon" |
| **Prisma schema** | Ready | `MediaAsset` model with churchId, filename, url, mimeType, fileSize, dimensions, folder |
| **DAL** | Not started | No `lib/dal/media.ts` |
| **API routes** | Not started | No upload or media CRUD endpoints |
| **Storage backend** | None | Images stored as data URLs in DB or external URL references |

### What needs to be built

1. Cloudflare R2 bucket + API credentials
2. `lib/storage/r2-client.ts` — R2 client configuration
3. `app/api/v1/upload-url/route.ts` — presigned URL endpoint
4. `app/api/v1/media/route.ts` — media CRUD (list, create record, delete)
5. `lib/dal/media.ts` — data access layer for MediaAsset
6. Wire upload dialog to actually upload files
7. `next.config.ts` — add CDN domain to `remotePatterns`
8. `.env` — add R2 credentials

---

## Step-by-Step Setup

### Phase 1: Cloudflare R2 Setup (one-time, ~15 minutes)

#### Step 1: Create a Cloudflare account
Go to [dash.cloudflare.com](https://dash.cloudflare.com) and sign up (free).

#### Step 2: Create an R2 bucket
1. In the Cloudflare dashboard, go to **R2 Object Storage** in the left sidebar
2. Click **Create Bucket**
3. Name it `laubf-media` (or whatever you prefer)
4. Select **Automatic** for location (Cloudflare picks the closest region)
5. Leave default storage class (Standard)

#### Step 3: Create R2 API credentials
1. Go to **R2 Object Storage** > **Manage R2 API Tokens**
2. Click **Create API Token**
3. Name it `laubf-cms-upload`
4. Permissions: **Object Read & Write**
5. Specify bucket: `laubf-media` only
6. Click **Create**
7. **Copy and save** the Access Key ID and Secret Access Key — you won't see the secret again

> **Why a scoped token?** Instead of giving full account access, this token can only read/write to one specific bucket. If it leaks, the damage is limited.

#### Step 4: Add a custom domain (for CDN)
1. Your domain (`laubf.org`) must be managed by Cloudflare DNS. If not, add it first (Cloudflare will guide you through changing nameservers).
2. Go to **R2** > **laubf-media** bucket > **Settings** > **Custom Domains**
3. Click **Connect Domain**
4. Enter `cdn.laubf.org`
5. Cloudflare automatically creates the DNS record and SSL certificate

After this, files in your bucket are accessible at `https://cdn.laubf.org/path/to/file.jpg` with Cloudflare CDN caching built in.

#### Step 5: Configure CORS (required for browser uploads)

> **Why CORS?** When the browser uploads directly to R2 via presigned URL, it's a cross-origin request (your site is `laubf.org`, R2 is `r2.cloudflarestorage.com`). Without CORS, the browser blocks it.

1. Go to **R2** > **laubf-media** > **Settings** > **CORS Policy**
2. Add this policy:
```json
[
  {
    "AllowedOrigins": ["https://laubf.org", "https://www.laubf.org", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

---

### Phase 2: Project Configuration (~10 minutes)

#### Step 6: Install the S3 SDK

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

> **Why the AWS SDK for Cloudflare?** R2 is S3-compatible — it speaks the same protocol as AWS S3. This means we use the standard, well-maintained AWS SDK instead of a Cloudflare-specific one. Bonus: if we ever switch to AWS S3, Backblaze B2, or MinIO, zero code changes needed.

#### Step 7: Add environment variables

Add to `.env`:
```env
# ---------- Cloudflare R2 (media storage) ----------
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=laubf-media
R2_PUBLIC_URL=https://cdn.laubf.org
```

Also add these to `.env.example` (already exists).

> **Where to find your Account ID:** Cloudflare dashboard > any domain > right sidebar under "API" section, or the URL bar shows it as `dash.cloudflare.com/<account-id>/...`

#### Step 8: Configure Next.js remote image patterns

In `next.config.ts`, add to the `images.remotePatterns` array:
```typescript
{
  protocol: "https",
  hostname: "cdn.laubf.org",
  pathname: "/**",
},
```

> **Why?** Next.js's `<Image>` component only optimizes images from whitelisted domains. Without this, using `<Image src="https://cdn.laubf.org/..." />` throws an error.

---

### Phase 3: Build the Storage Layer (~30 minutes)

#### Step 9: Create the R2 client

**File:** `lib/storage/r2-client.ts`
```typescript
import { S3Client } from "@aws-sdk/client-s3"

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export const R2_BUCKET = process.env.R2_BUCKET_NAME!
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!

export function isR2Configured(): boolean {
  return !!(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  )
}
```

#### Step 10: Create the presigned URL API route

**File:** `app/api/v1/upload-url/route.ts`

This endpoint generates a short-lived URL that lets the browser upload directly to R2.

```typescript
import { NextRequest, NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/storage/r2-client"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  const { contentType, filename, folder = "uploads" } = await request.json()

  if (!contentType || !filename) {
    return NextResponse.json({ error: "Missing contentType or filename" }, { status: 400 })
  }

  // Generate a unique key to prevent overwrites
  const ext = filename.split(".").pop()
  const key = `${folder}/${randomUUID()}.${ext}`

  const signedUrl = await getSignedUrl(
    r2Client,
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 120 } // URL valid for 2 minutes
  )

  return NextResponse.json({
    uploadUrl: signedUrl,           // Browser PUTs the file here
    publicUrl: `${R2_PUBLIC_URL}/${key}`, // Where the file is served from
    key,
  })
}
```

> **Why presigned URLs instead of uploading through our server?** The file goes directly from the user's browser to R2. This means: (1) no server bandwidth used, (2) no server memory used, (3) supports files up to 5GB, (4) faster uploads. Our server only generates the permission token — it never touches the file.

#### Step 11: Client-side upload helper

**File:** `lib/storage/upload.ts`
```typescript
export async function uploadFile(
  file: File,
  folder = "uploads"
): Promise<{ url: string; key: string }> {
  // Step 1: Get a presigned URL from our API
  const res = await fetch("/api/v1/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contentType: file.type,
      filename: file.name,
      folder,
    }),
  })

  if (!res.ok) throw new Error("Failed to get upload URL")
  const { uploadUrl, publicUrl, key } = await res.json()

  // Step 2: Upload the file directly to R2
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  })

  if (!uploadRes.ok) throw new Error("Upload to storage failed")

  return { url: publicUrl, key }
}
```

---

### Phase 4: Build the Media DAL & API (~45 minutes)

#### Step 12: Create the media DAL

**File:** `lib/dal/media.ts` — standard CRUD for MediaAsset records in the database.

Key functions needed:
- `listMediaAssets(churchId, { folder, mimeType, page, pageSize })`
- `createMediaAsset(churchId, data)` — called after successful R2 upload
- `updateMediaAsset(churchId, id, data)` — rename, change folder, update alt text
- `deleteMediaAsset(churchId, id)` — soft delete + queue R2 object deletion

#### Step 13: Create media API routes

**File:** `app/api/v1/media/route.ts`
- `GET` — list media assets (with pagination, folder filter)
- `POST` — create media asset record (after upload completes)

**File:** `app/api/v1/media/[id]/route.ts`
- `PATCH` — update metadata (alt text, folder, name)
- `DELETE` — soft delete asset

---

### Phase 5: Wire Up the UI (~1 hour)

#### Step 14: Connect the upload dialog

Update `components/cms/media/upload-photo-dialog.tsx` to:
1. Call `uploadFile()` for each selected file
2. After upload, create a MediaAsset record via `POST /api/v1/media`
3. Show progress bar during upload
4. Refresh the media grid on completion

#### Step 15: Connect the media grid

Update `components/cms/media/media-grid.tsx` to:
1. Fetch real data from `GET /api/v1/media`
2. Use actual CDN URLs for thumbnails
3. Wire delete action to `DELETE /api/v1/media/[id]`

#### Step 16: Replace data URL usage

Update these components to use the upload flow instead of `readAsDataURL`:
- `components/cms/messages/series/image-upload.tsx` (if re-introduced)
- `components/ui/rich-text-editor.tsx` (image insertion)
- Any other places that embed base64 images in the database

---

## Upload Flow (Sequence Diagram)

```
Browser                    Next.js API              Cloudflare R2
  │                            │                         │
  │ 1. POST /api/v1/upload-url │                         │
  │   {contentType, filename}  │                         │
  │ ──────────────────────────►│                         │
  │                            │ 2. Generate presigned   │
  │                            │    URL with PutObject   │
  │ 3. Return {uploadUrl,      │◄────────────────────────│
  │           publicUrl, key}  │                         │
  │ ◄──────────────────────────│                         │
  │                            │                         │
  │ 4. PUT file directly ─────────────────────────────► │
  │    to presigned URL        │                         │ 5. File stored
  │ ◄───────────────────────── 200 OK ─────────────────│
  │                            │                         │
  │ 6. POST /api/v1/media      │                         │
  │   {url, filename, etc.}    │                         │
  │ ──────────────────────────►│ 7. Insert MediaAsset    │
  │                            │    into Postgres        │
  │ 8. Return MediaAsset       │                         │
  │ ◄──────────────────────────│                         │
  │                            │                         │
  │                    Later, when visitors load the page:│
  │                            │                         │
  │ 9. GET cdn.laubf.org/...   │                         │
  │ ──────────────── Cloudflare CDN ────────────────────►│
  │ ◄──── cached response ─────│                         │
```

---

## Environment Variables Summary

After implementation, add to `.env.example`:

```env
# ---------- Cloudflare R2 (media storage) ----------
# Create a bucket and API token at https://dash.cloudflare.com > R2
CLOUDFLARE_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=laubf-media
R2_PUBLIC_URL=https://cdn.laubf.org
```

---

## Estimated Costs

For a church website with ~20 GB of media:

| Item | Monthly Cost |
|------|-------------|
| R2 storage (20 GB) | $0.30 (first 10 GB free) |
| R2 reads (under 10M) | $0.00 (free tier) |
| R2 writes (under 1M) | $0.00 (free tier) |
| Egress / CDN bandwidth | **$0.00** (always free) |
| Cloudflare plan | $0.00 (free tier) |
| **Total** | **~$0.30/month** |

Even at 100 GB of media with heavy traffic, cost stays under $2/month. Azure Blob Storage would be ~$9+/month for the same usage.

---

## Future Enhancements (Not Part of Initial Implementation)

- **Image processing:** Generate thumbnails on upload (via Cloudflare Image Transformations or a background job)
- **Video transcoding:** For uploaded video files (not YouTube/Vimeo links)
- **Bulk migration:** Script to move existing data URL images from Postgres to R2
- **Image optimization:** Cloudflare Polish or Image Resizing for automatic WebP/AVIF conversion
- **Storage quotas:** Per-church storage limits for multi-tenant billing
