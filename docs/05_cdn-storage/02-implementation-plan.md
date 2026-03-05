# CDN & Storage Implementation Plan

**Date:** 2026-03-04 (updated)
**Status:** Planning
**Depends on:** Platform decision in `01-platform-comparison.md` (Cloudflare R2 confirmed)
**Related:** `docs/04_infrastructure/media-storage-cdn-guide.md` (detailed R2 setup steps + code snippets)

---

## Overview

This document outlines the full implementation plan for integrating Cloudflare R2 + CDN into the church CMS platform. Covers infrastructure setup, code changes, media library activation, multi-tenant considerations, image optimization, and pricing tiers.

---

## Architecture

```
                        CMS (Next.js)
                    ┌──────────────────┐
                    │                  │
  Admin uploads  ──►│ /api/v1/upload-url │──► presigned URL (2-min expiry)
  via CMS editor    │                  │         │
                    │ /api/v1/media    │         │
                    │ (CRUD records)   │         │
                    └──────────────────┘         │
                                                ▼
                    ┌──────────────────┐   ┌─────────────┐
  Browser uploads   │   Cloudflare R2  │   │  AWS S3 SDK  │
  directly to    ──►│   laubf-media    │◄──│  (presigned) │
  presigned URL     │                  │   └──────────────┘
                    └────────┬─────────┘
                             │
  Multi-tenant key:          │   /{churchId}/images/uuid.jpg
  per-church folder          │   /{churchId}/docs/uuid.pdf
                             │
                    ┌────────▼─────────┐
  Public visitors   │  Cloudflare CDN  │
  load from CDN  ◄──│  cdn.laubf.org   │   ← 300+ edge PoPs
                    │  (auto-cached)   │
                    └──────────────────┘
                             │
                    ┌────────▼─────────┐
  (Future)          │ CF Worker / Image│   ← On-the-fly WebP conversion
                    │ Transformations  │
                    └──────────────────┘
```

---

## Action Plan

### Phase 1 — Now (Before Any Clients Go Live)

**Time:** ~30 minutes
**Priority:** Do this immediately — lowest-risk moment for DNS migration

1. **Move DNS to Cloudflare** (zero risk with no live clients)
   - Create Cloudflare account at [dash.cloudflare.com](https://dash.cloudflare.com) (free plan)
   - Add domain `laubf.org` — Cloudflare provides new nameservers
   - Copy all existing DNS records to Cloudflare
   - Update nameservers at your domain registrar
   - Propagation: ~15 minutes to a few hours
   - **Why now?** Once 50+ churches are live, DNS migration becomes much riskier

2. **Create R2 bucket**
   - Go to R2 Object Storage > Create Bucket
   - Name: `laubf-media`, Location: Automatic
   - Create scoped API token: `laubf-cms-upload`, Object Read & Write, `laubf-media` bucket only

3. **Connect custom domain for CDN**
   - R2 > `laubf-media` > Settings > Custom Domains > Connect `cdn.laubf.org`
   - Cloudflare auto-creates DNS record + SSL certificate
   - Files accessible at `https://cdn.laubf.org/path/to/file.jpg`

4. **Configure CORS** (required for browser uploads)
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

**Deliverables:**
- [ ] Cloudflare account active
- [ ] DNS migrated to Cloudflare
- [ ] R2 bucket `laubf-media` created
- [ ] API token saved securely
- [ ] `cdn.laubf.org` resolves with SSL
- [ ] CORS policy configured

---

### Phase 2 — Project Configuration

**Time:** ~10 minutes
**Files changed:** `package.json`, `.env`, `.env.example`, `next.config.ts`

1. **Install S3 SDK**
   ```bash
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```

2. **Add environment variables** to `.env`:
   ```env
   CLOUDFLARE_ACCOUNT_ID=
   R2_ACCESS_KEY_ID=
   R2_SECRET_ACCESS_KEY=
   R2_BUCKET_NAME=laubf-media
   R2_PUBLIC_URL=https://cdn.laubf.org
   ```

3. **Add CDN domain to Next.js config** (`next.config.ts`):
   ```typescript
   images: {
     remotePatterns: [
       { protocol: "https", hostname: "cdn.laubf.org", pathname: "/**" },
     ],
   }
   ```

**Deliverables:**
- [ ] S3 SDK installed
- [ ] Env vars configured (local + production)
- [ ] `.env.example` updated
- [ ] `next.config.ts` has CDN domain in remotePatterns

---

### Phase 3 — Storage Layer (Server-Side)

**Time:** ~30 minutes
**New files:** `lib/storage/r2-client.ts`, `lib/storage/upload.ts`, `app/api/v1/upload-url/route.ts`

#### 3a. R2 Client (`lib/storage/r2-client.ts`)

S3Client singleton for Cloudflare R2 endpoint. Exports:
- `r2Client` — S3Client instance
- `R2_BUCKET` — bucket name
- `R2_PUBLIC_URL` — public CDN base URL
- `isR2Configured()` — graceful fallback check for dev environments without R2

#### 3b. Presigned URL Endpoint (`app/api/v1/upload-url/route.ts`)

`POST /api/v1/upload-url`
- Requires auth (EDITOR role minimum)
- Accepts: `{ contentType, filename, folder? }`
- Generates unique key: `{churchId}/{folder}/{uuid}.{ext}`
- Returns: `{ uploadUrl, publicUrl, key }`
- URL expires in 120 seconds

#### 3c. Client Upload Helper (`lib/storage/upload.ts`)

Browser-side function:
1. Requests presigned URL from API
2. PUTs file directly to R2 (file never touches our server)
3. Returns public CDN URL

Includes: progress callback, file size validation (10 MB images, 50 MB docs), MIME type validation, error handling.

**Deliverables:**
- [ ] R2 client module with graceful fallback
- [ ] Presigned URL endpoint with auth
- [ ] Client upload helper with progress support

---

### Phase 4 — Media DAL & API Routes

**Time:** ~45 minutes
**New files:** `lib/dal/media.ts`, `app/api/v1/media/route.ts`, `app/api/v1/media/[id]/route.ts`

#### DAL (`lib/dal/media.ts`)

Standard DAL following existing patterns (`churchId` as first param):
- `listMediaAssets(churchId, filters?)` — paginated list
- `getMediaAsset(churchId, id)` — single asset
- `createMediaAsset(churchId, data)` — insert record after R2 upload
- `updateMediaAsset(churchId, id, data)` — update metadata (alt text, folder, name)
- `deleteMediaAsset(churchId, id)` — soft delete + R2 cleanup

#### API Routes

- `GET /api/v1/media` — list assets (paginated, filterable by folder, type, search)
- `POST /api/v1/media` — create asset record (called after upload to R2)
- `PATCH /api/v1/media/[id]` — update metadata
- `DELETE /api/v1/media/[id]` — soft delete + delete R2 object

#### R2 Cleanup

MVP: delete R2 object immediately on delete. Later: cleanup job for soft-deleted assets older than 30 days.

**Deliverables:**
- [ ] Media DAL with full CRUD
- [ ] API routes with pagination + filters
- [ ] R2 object deletion on asset delete

---

### Phase 5 — Wire Up Media Library UI

**Time:** ~1-2 hours
**Files modified:** All files in `components/cms/media/`, `app/cms/(dashboard)/media/page.tsx`

#### 5a. Activate Media Page

Replace "Coming Soon" placeholder with the real media library:
- Sidebar with folders + filters (stubs already built)
- Grid/list view with real data from `GET /api/v1/media`
- Toolbar with search, sort, view toggle

#### 5b. Upload Flow

Wire `upload-photo-dialog.tsx`:
1. User selects files
2. For each file: call `uploadFile()` from `lib/storage/upload.ts`
3. Show progress bar per file
4. On success: `POST /api/v1/media` with CDN URL + metadata
5. Refresh grid

Wire `add-video-dialog.tsx`:
1. User pastes YouTube/Vimeo URL
2. Extract video metadata (title, thumbnail)
3. `POST /api/v1/media` with video type + URL

#### 5c. Universal Media Picker

Update `media-selector-dialog.tsx` from simple URL paste to full media picker:
- Grid of existing media assets
- Upload new button
- Search/filter
- Returns selected asset's CDN URL

Used by: event form (cover image), series form, rich text editor (inline images), any future image fields.

#### 5d. Replace Data URL Usage

Migrate from `readAsDataURL()` to R2 upload:
- `components/cms/messages/series/image-upload.tsx`
- `components/ui/image-upload-node.tsx` (TipTap)
- Any other base64-in-DB patterns

**Deliverables:**
- [ ] Media page shows real library
- [ ] Photo upload works end-to-end (browser → R2 → DB → grid)
- [ ] Video embed creation works
- [ ] Media picker dialog available for all editors
- [ ] No more base64 data URLs in database

---

### Phase 6 — Scale & Optimize

**Time:** Ongoing as platform grows

#### Multi-Tenant Storage

Key structure: `{churchId}/images/uuid.jpg`, `{churchId}/docs/uuid.pdf`
- Presigned URL endpoint validates `churchId` from session
- DAL filters all queries by `churchId`
- Public CDN URLs are world-readable (acceptable for church media)
- For private files later: Cloudflare Workers to check auth

#### Storage Quotas

Not needed for MVP. When billing is added:
- Track per-church storage usage in DB
- Enforce upload limits in presigned URL endpoint
- Dashboard shows storage meter (already built in `media-sidebar.tsx`)
- See pricing tiers in `01-platform-comparison.md`

#### WebP Image Optimization

Store original uploads in R2. Use **Cloudflare Image Transformations** or a **Cloudflare Worker** to convert to WebP on-the-fly when serving. CDN caches the converted version. Same auto-optimization Webflow provides, without extra storage cost.

#### Migration: Existing Data URLs → R2

One-time migration script for existing base64 data URLs in JSON fields:
1. Query records with data URL patterns
2. Decode base64 → file buffer
3. Upload to R2 via S3 SDK
4. Update DB record with CDN URL

Script: `scripts/migrate-data-urls-to-r2.ts`

---

## Timeline Estimate

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Cloudflare + R2 Setup | 30 min | Domain registrar access |
| Phase 2: Project Config | 10 min | Phase 1 |
| Phase 3: Storage Layer | 30 min | Phase 2 |
| Phase 4: DAL & API | 45 min | Phase 3 |
| Phase 5: Wire Up UI | 1-2 hrs | Phase 4 |
| Phase 6: Scale | Ongoing | — |
| Migration script | 30 min | Phase 5 |
| **Total (Phases 1-5)** | **~3-4 hours** | |

---

## Verification Checklist

- [ ] Upload an image via CMS → appears in R2 bucket
- [ ] Image accessible at `cdn.laubf.org/...` with < 100ms TTFB
- [ ] Media grid shows uploaded images with correct thumbnails
- [ ] Delete an asset → removed from grid, R2 object deleted
- [ ] Media picker works in event editor (select existing image)
- [ ] Rich text editor inline image upload works
- [ ] Series cover image upload works
- [ ] No base64 data URLs remain in database
- [ ] Multiple churches' media are isolated by `churchId` folder
- [ ] Upload fails gracefully when R2 is not configured (dev mode)
