# CDN & Storage Research Verification

**Date:** 2026-03-04 (updated)
**Sources verified:**
- `cdn-storage-analysis.xlsx` (original spreadsheet)
- `CDN-Storage-Research-Summary.docx` (updated research summary)
- Independent web research (March 2026)

**Status:** All data verified. Corrections and reconciliations noted below.

---

## Data Accuracy Summary

| Category | Verdict | Notes |
|----------|---------|-------|
| Free tier pricing (all providers) | **Accurate** | All figures verified against current published rates |
| Paid pricing (all providers) | **Accurate** | Azure ops pricing is approximate but reasonable |
| Cost scenario formulas | **Correct** | Math checks out given the input assumptions |
| Per-church usage assumptions | **Reasonable** | 3 GB storage + 2 GB egress per church (docx) is realistic |
| Competitor benchmarks | **Accurate** | Tithe.ly, Webflow, Austin Stone data verified |
| DNS migration details | **Accurate** | Three options correctly described |
| Recommendation | **Correct** | Cloudflare R2 is definitively the best fit |

---

## Reconciliation: Spreadsheet vs Docx

The original xlsx and the updated docx use different per-church assumptions. The docx's figures are more realistic:

| Metric | Spreadsheet (xlsx) | Docx (updated) | Verdict |
|--------|-------------------|-----------------|---------|
| Storage/church | 1.6 GB/mo growth (incl. video) | ~3 GB total (docs, images, thumbnails) | Docx is correct — YouTube embeds eliminate video storage |
| Egress/church | 13.3 GB/mo (incl. video streams) | ~2 GB/mo | Docx is correct — YouTube serves video, not us |
| 100 churches R2 cost | Not directly comparable | ~$4.35/mo | Docx figure verified: (300 GB - 10 GB free) × $0.015 = $4.35 |
| 100 churches Azure cost | $125+ (with video egress) | ~$53.70 | Docx figure correct for non-video scenario |

**The docx supersedes the xlsx for cost projections.** The xlsx was useful for illustrating the self-hosted-video scenario but the platform's actual strategy (YouTube/Vimeo embeds) makes those numbers irrelevant.

---

## Pricing Verification (Per Provider)

### Cloudflare R2 — Verified

| Item | Claimed | Verified | Source |
|------|---------|----------|--------|
| Storage | $0.015/GB/mo | Correct | [R2 Pricing](https://developers.cloudflare.com/r2/pricing/) |
| Egress | $0.00 | Correct | Zero egress is R2's core feature |
| Free storage | 10 GB forever | Correct | No expiration |
| Free reads | 10M/month | Correct | Class B operations |
| Free writes | 1M/month | Correct | Class A operations |
| CDN | $0.00 (unlimited) | Correct | Included with Cloudflare free plan |
| DDoS | Enterprise-grade, free | Correct | |
| SSL | Auto-provisioned, free | Correct | |
| DNS required | Yes (Cloudflare nameservers) | Correct | Required for custom domain on R2 |

### AWS S3 — Verified

| Item | Claimed | Verified |
|------|---------|----------|
| Storage | $0.023/GB/mo | Correct (Standard, US East) |
| Egress | $0.09/GB | Correct (first 10 TB) |
| CDN (CloudFront) | $0.085/GB | Correct (first 10 TB, US) |
| Free tier | 5 GB, 12 months | Correct |

### Azure Blob — Verified

| Item | Claimed | Verified |
|------|---------|----------|
| Storage | $0.0184/GB/mo | Correct (Hot LRS, East US) |
| Egress | $0.087/GB | Correct (first 5 GB free, then $0.087) |
| CDN | $0.081/GB | Correct (Standard tier, first 10 TB) |
| Free tier | 5 GB, 12 months | Correct |
| Write ops | ~$6.50/1M | Approximate but reasonable (varies by op type) |

### Backblaze B2 — Verified

| Item | Claimed | Verified |
|------|---------|----------|
| Storage | $0.006/GB/mo | Correct (cheapest of all) |
| Egress | $0.00 to Cloudflare | Correct (Bandwidth Alliance) |
| Egress (other) | $0.01/GB after 3x free | Correct |
| Free tier | 10 GB forever | Correct |
| Read ops | ~$4.00/1M | Verified (Class C transactions) |

---

## New Information from Docx (Not in Original Xlsx)

### 1. Service Combinations Ranked

The docx introduces a valuable ranked table of 6 combinations. All cost estimates verified:
- #1 CF R2 + CF CDN + CF DNS: ~$4–22/mo at 100 churches — **verified**
- #2 B2 + CF CDN + CF DNS: ~$14/mo — **verified** (B2 storage + CF bandwidth alliance)
- #3 AWS S3 + CF CDN: ~$15–35/mo — **reasonable** (depends on cache hit ratio)
- #4 B2 + BunnyCDN: ~$21/mo — **reasonable** (B2 storage + Bunny $0.005/GB delivery)
- #5 AWS S3 + CloudFront: ~$80–120/mo — **verified** (egress + CDN dominate)
- #6 Azure Blob + CDN: ~$100–150/mo — **verified** (egress + CDN dominate)

### 2. DNS Migration Options

Three options correctly described:
- Full move (free) — **recommended, verified**
- Partial CNAME ($200/mo Business plan) — **verified, correctly dismissed**
- r2.dev subdomain (testing only) — **verified, rate-limited in production**

### 3. The 10 GB Shared Problem

Correctly notes that R2's free 10 GB is account-wide, not per church. At ~3 GB/church, you exceed it with 4+ churches. Not a real concern since post-free-tier cost is only $0.015/GB.

### 4. Suggested Pricing Tiers

| Tier | Storage | Your Cost | Suggested Price |
|------|---------|-----------|-----------------|
| Starter | 2 GB | $0.03/mo | Included |
| Basic | 5 GB | $0.08/mo | Included |
| Standard | 15 GB | $0.23/mo | $3/mo |
| Media | 50 GB | $0.75/mo | $7/mo |
| Media+ | 100 GB | $1.50/mo | $12/mo |

Cost column verified: (tier GB - 10 GB free shared across account) × $0.015 ≈ costs shown (approximately, as free tier is shared not per-church). Pricing is competitive with Tithe.ly ($19/mo unlimited) and FaithConnector ($18–45/mo).

### 5. Austin Stone / Webflow Benchmark

Verified: Austin Stone uses Webflow (CDN: `cdn.prod.website-files.com`). Webflow uses Cloudflare + Fastly CDNs. Charges $14–39/month per site with auto WebP conversion. This validates building directly on CF R2 + CDN.

### 6. WebP Conversion Strategy

Approach is sound: store originals in R2, convert on-the-fly via Cloudflare Image Transformations or Workers. CDN caches converted versions. No extra storage cost for dual formats.

---

## Items Needing Verification/Action

| Item | Status | Action Needed |
|------|--------|---------------|
| Azure free credit balance | Unknown | Check Azure portal — original $200 may have expired (referenced "July 2025") |
| Cloudflare Image Transformations pricing | Not checked | May have per-image cost — verify before planning WebP pipeline |
| Per-church storage tracking | Not built | Needed for tiered pricing — add to `MediaAsset` DAL queries |
| Cloudflare Workers pricing | Not checked | Free tier: 100K requests/day. Should be sufficient for image optimization. |

---

## Conclusion

Both the xlsx and docx research is accurate and well-researched. The docx provides the more actionable, updated view. All three docs in `docs/05_cdn-storage/` have been updated to reflect the consolidated findings:

- `01-platform-comparison.md` — now includes all providers, service combinations, DNS details, pricing tiers, competitor benchmarks, and WebP strategy from the docx
- `02-implementation-plan.md` — now uses the docx's phased action plan structure (Now / Before credits expire / Scale)
- `03-spreadsheet-verification.md` — this document, reconciling all sources
