# Cloudflare R2 — Account & Scaling Strategy

## Overview

This document describes the two-phase approach to Cloudflare account and R2 bucket management as the platform grows from a single church to many.

## Phase 1: Account-Per-Church (Current — LA UBF)

**Setup:** Each church gets its own Cloudflare account with its own R2 buckets.

```
Cloudflare Account: LA UBF
  laubf.org DNS (proxied — app hosted on Azure VM)
  R2 Bucket: file-attachments
  R2 Bucket: media
  Free tier: 10 GB storage, 0 egress cost
```

**How it works:**
- lclab.io team creates and manages the Cloudflare account on behalf of the church
- Credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) are stored in the app's `.env`
- The app is deployed as a single-tenant instance — one deployment per church
- Each church's R2 buckets live under their own Cloudflare account
- Each account gets its own 10 GB free tier

**DNS setup (LA UBF):**
- `laubf.org` DNS is managed by Cloudflare (proxied)
- App is hosted on Azure VM — Cloudflare proxies traffic to Azure
- R2 buckets are accessed independently from the app hosting
- Custom domains like `media.laubf.org` can be CNAMEd to R2 within the same account
- No need to move app hosting to Cloudflare — R2 works regardless of where the app runs

**Account ownership:**
- For now, lclab.io creates accounts using an internal email or the church's Google account
- Long-term, this is a manual process — fine for the first 3-5 churches
- Credentials are managed by lclab.io, not by the church

**Why this works for now:**
- Zero cost per church (10 GB free tier each)
- Full isolation between churches (separate accounts, separate credentials)
- Simple deployment model (one `.env` per church)
- No multi-tenant credential routing needed in the app code

**Limitations:**
- Manual account creation per church
- Multiple Cloudflare dashboards to monitor
- No unified billing or storage overview
- Credential management becomes unwieldy beyond ~5-10 churches

## Phase 2: Centralized lclab.io Account (Future — Multi-Tenant)

**Trigger:** When the platform moves to multi-tenant (one app serving all churches) or when managing individual accounts becomes impractical (~5-10 churches).

```
Cloudflare Account: lclab.io
  lclab.io DNS
  R2 Bucket: file-attachments    (all churches, tenant-prefixed keys)
  R2 Bucket: media           (all churches, tenant-prefixed keys)
  -- OR --
  R2 Bucket: {church-slug}-attachments   (per-church buckets)
  R2 Bucket: {church-slug}-media         (per-church buckets)
```

**Two sub-options:**

### Option A: Shared Buckets with Tenant Prefixes

```
file-attachments/
  {churchId-1}/2026/uuid-handout.pdf
  {churchId-2}/2026/uuid-notes.docx

media/
  {churchId-1}/images/2026/uuid-photo.jpg
  {churchId-2}/images/2026/uuid-banner.png
```

- Simpler — two buckets total regardless of church count
- Tenant isolation via key prefixes (enforced at app level)
- Single set of R2 credentials in `.env`
- Easier to monitor total platform storage
- Quota enforcement: `SUM(fileSize) WHERE churchId = X`

### Option B: Per-Church Buckets Under One Account

```
laubf-attachments/
laubf-media/
sflaubf-attachments/
sflaubf-media/
```

- Stronger isolation (bucket-level, not just key-level)
- Per-bucket lifecycle rules and CORS
- More buckets to manage (2 per church)
- R2 has no hard limit on buckets per account

**Recommendation:** Option A (shared buckets) for simplicity. Option B only if a church requests strict data isolation.

## Migration: Phase 1 to Phase 2

When consolidating from per-church accounts to lclab.io:

### What needs to happen

1. **Create buckets** under lclab.io Cloudflare account (or reuse existing ones)
2. **Copy files** from old account's R2 to new account's R2
3. **Update DB** — rewrite `url` columns in `BibleStudyAttachment` and `MediaAsset` to point to new public URLs
4. **Update `.env`** — swap credentials to lclab.io account
5. **Update DNS** — CNAME custom domains (e.g., `media.laubf.org`) to new R2 bucket
6. **Decommission** old Cloudflare account

### Migration costs

| Operation | Cost |
|---|---|
| Download from old R2 (egress) | **$0** — R2 egress is free |
| Upload to new R2 (Class A writes) | **$4.50 per million PUTs** — for a few thousand files, effectively $0 |
| Brief storage overlap (both copies exist) | **$0.015/GB/month** — pennies for a few days |
| DNS propagation | **$0** — free, takes minutes |
| **Total for a typical church (5 GB, 500 files)** | **~$0** |

### Migration script outline

```ts
// 1. List all objects in old bucket
// 2. For each object:
//    a. Download from old R2 (GET)
//    b. Upload to new R2 (PUT) with same key
// 3. Update DB urls: replace old public URL prefix with new one
// 4. Verify all files accessible via new URLs
// 5. Delete old bucket contents (optional — can let old account expire)
```

## Timeline

| Phase | When | Trigger |
|---|---|---|
| Phase 1 (account-per-church) | **Now** | LA UBF is first customer |
| Multi-tenant app refactor | **Next** (planned) | Before onboarding 2nd church |
| Phase 2 (centralized account) | **Before ~5-10 churches** | When manual account management becomes a burden |

## Current State (as of March 2026)

- LA UBF Cloudflare account: created
- R2 buckets: `file-attachments` and `media` created
- DNS: `laubf.org` managed by Cloudflare, proxied to Azure VM
- App hosting: Azure VM (unchanged — no migration needed)
- R2 integration: **bible study attachments fully implemented** (storage client, presigned upload, staging→permanent move, deletion)
- Media library: **not yet implemented** (schema exists, UI placeholder, no R2 integration — see `04-media-library-plan.md`)
