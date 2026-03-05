# CDN & File Storage: Platform Comparison

**Date:** 2026-03-04 (updated)
**Status:** Research complete — Cloudflare R2 recommended
**Sources:** `cdn-storage-analysis.xlsx`, `CDN-Storage-Research-Summary.docx`, independent web research
**Related:** `docs/04_infrastructure/media-storage-cdn-guide.md` (Cloudflare R2 implementation guide)

---

## Executive Summary

**Recommendation: Cloudflare R2 + Cloudflare CDN + Cloudflare DNS.** Move DNS now before any clients are live.

After researching AWS S3, Azure Blob Storage, Cloudflare R2, Backblaze B2, Tigris, Bunny, Vercel Blob, and UploadThing — plus every viable combination of storage and CDN services — Cloudflare R2 emerges as the clear winner for a multi-tenant church platform optimizing for cost at early stage. Zero egress fees, free CDN, free SSL, and free DDoS protection create an unmatched total cost of ownership.

At 100 churches with YouTube/Vimeo video embeds, total monthly storage cost is approximately **$4–22/month** (depending on per-church storage). The same workload on Azure after free credits expire would cost $50–150+/month. On AWS S3 with CloudFront, approximately $15–120/month.

---

## Key Terms

| Term | Definition |
|------|-----------|
| **Egress** | Data leaving a server to reach a user's browser. Azure charges ~$0.087/GB, AWS ~$0.09/GB, Cloudflare $0. |
| **CDN** | Content Delivery Network — copies files to servers worldwide for faster delivery. Cloudflare's CDN is free. Azure and AWS CDNs cost extra. |
| **DNS** | Domain Name System — translates domain names to server IPs. "Moving DNS to Cloudflare" means Cloudflare handles this lookup. Domain registration stays wherever it is. |
| **Object Storage** | Cloud file storage (like a giant Dropbox). R2 = Cloudflare's, S3 = Amazon's, Blob = Azure's. |
| **S3-Compatible API** | Amazon S3 created the standard interface. R2 and B2 speak the same protocol, so code works across providers by changing a URL. |
| **Operations** | Every upload (Class A/write) or download (Class B/read) counts as an operation. Priced per million — usually very cheap. |

---

## Provider Comparison

### Free Tier

| Feature | Cloudflare R2 | AWS S3 | Azure Blob | Backblaze B2 |
|---------|--------------|--------|------------|--------------|
| Free Storage | 10 GB forever | 5 GB (12 mo) | 5 GB (12 mo) | 10 GB forever |
| Free Egress | **$0 always** | 100 GB/mo (12 mo) | 100 GB/mo | 3x storage + $0 to CF |
| Free CDN | Unlimited | None | None | None (use CF) |
| Free SSL | Yes, auto | Via CloudFront ($) | Config needed | N/A (use CF) |
| Free DDoS | Enterprise-grade | Basic | Basic | N/A (use CF) |
| Duration | **Forever** | 12 months | 12 months | **Forever** |
| DNS Required | CF DNS required | None | None | None |

### Paid Pricing (Per GB/Month)

| Cost | Cloudflare R2 | AWS S3 | Azure Blob | Backblaze B2 |
|------|--------------|--------|------------|--------------|
| Storage/GB | $0.015 | $0.023 | $0.0184 | $0.006 |
| Egress/GB | **$0.00** | $0.09 | $0.087 | $0.00 to CF |
| CDN/GB | **$0.00** (free) | $0.085 | $0.081 | $0.00 via CF |
| Write/1M ops | $4.50 | $5.00 | ~$6.50 | ~$4.00 |
| Read/1M ops | $0.36 | $0.40 | ~$0.50 | ~$4.00 |

### Additional Providers

| Provider | Storage ($/GB/mo) | Egress | S3-Compatible | Notes |
|----------|-------------------|--------|---------------|-------|
| **Tigris** (Fly.io) | $0.02 | $0.00 | Yes | 5 GB free. Globally distributed auto-cache. Good for Fly.io apps. |
| **Bunny Storage** | $0.01/region | $0.00 | In progress | Min $1/mo CDN. S3 compat being rebuilt from ground up. EU-based. |
| **Vercel Blob** | $0.023 | $0.05/GB | No | 1 GB free. Vercel-locked, no portability. Expensive at scale. |
| **UploadThing** | ~$0.08 | $0.00 | No | 2 GB free. Simple DX. $10/mo for 100 GB. Not multi-tenant ready. |

---

## Service Combinations Ranked

Every viable combination of storage + CDN + DNS, ranked by total cost and simplicity:

| Rank | Combination | Est. Cost (100 churches) | Notes |
|------|-------------|--------------------------|-------|
| **#1 BEST** | CF R2 + CF CDN + CF DNS | **~$4–22/mo** | Zero egress, free CDN, simple setup. Requires CF DNS (move now). |
| #2 | Backblaze B2 + CF CDN + CF DNS | ~$14/mo | Cheapest storage ($0.006/GB). Free egress to CF via Bandwidth Alliance. More config. |
| #3 | AWS S3 + CF CDN + CF DNS | ~$15–35/mo | CF caches reduce S3 egress, but cache misses still cost $0.09/GB. |
| #4 | BB B2 + BunnyCDN + Any DNS | ~$21/mo | No CF DNS needed. BunnyCDN is $0.005/GB. More moving parts. |
| #5 | AWS S3 + CloudFront | ~$80–120/mo | Native AWS. No DNS change. CDN + egress costs add up. |
| #6 | Azure Blob + Azure CDN | ~$100–150/mo | All-Azure, no migration. Most expensive at scale. |

---

## Cost Scenarios by Church Count

Assumes YouTube/Vimeo video embeds (not self-hosted). Storage per church: ~3 GB (docs, images, thumbnails). Egress per church: ~2 GB/month.

| Churches | Storage GB | Egress GB | CF R2 Cost | Azure Cost | AWS+CF Cost | Savings/yr vs Azure |
|----------|-----------|-----------|------------|------------|-------------|---------------------|
| 10 | 30 | 20 | $0.30 | $5.27 | $2.23 | $59.64 |
| 25 | 75 | 50 | $0.98 | $13.18 | $4.08 | $146.40 |
| 50 | 150 | 100 | $2.10 | $26.34 | $8.15 | $290.88 |
| 100 | 300 | 200 | $4.35 | $53.70 | $15.60 | $592.20 |
| 200 | 600 | 400 | $8.85 | $108.40 | $31.60 | $1,194.60 |
| 500 | 1,500 | 1,000 | $22.35 | $274.00 | $80.50 | $3,019.80 |

**Key:** At 500 churches, Cloudflare R2 saves over **$3,000/year** vs Azure.

---

## The Shared 10 GB Problem

Cloudflare R2's 10 GB free tier is **shared across your entire account** — not per church. Once you have ~7+ churches each adding content, you'll exceed it.

**Your actual cost per GB is tiny.** Beyond the free 10 GB, R2 charges $0.015/GB/month. Even at 500 churches with 15 GB each (7,500 GB), total storage cost is only ~$112/month. With zero egress fees, storage is your only variable cost.

---

## DNS: Must You Move to Cloudflare?

**Short answer: Yes, but it's easy and free.**

To use R2 with a custom domain (e.g., `cdn.yourplatform.com`), the domain must be on Cloudflare DNS. Three options:

1. **Full DNS move (free, recommended):** Point your domain's nameservers to Cloudflare. Keep your domain registrar. Copy existing DNS records to Cloudflare, update nameservers. Takes ~15 minutes + propagation.

2. **Partial CNAME setup ($200/mo):** Keep your current DNS provider and only proxy subdomains through Cloudflare. Requires Business plan at $200/month. Way too expensive.

3. **r2.dev subdomain (testing only):** Cloudflare gives you a public URL like `your-bucket.r2.dev`, but it's rate-limited and not suitable for production.

**Since no services are deployed yet, move DNS now.** This is the lowest-risk moment. Once 50+ churches are live, DNS migration becomes much riskier. A separate cheap domain (e.g., `cdn-yourplatform.com`) registered on Cloudflare is another option if you want to keep your main domain elsewhere.

---

## Suggested Pricing Tiers for Churches

| Tier | Storage | Your Cost | Suggested Price | Use Case |
|------|---------|-----------|-----------------|----------|
| Starter | 2 GB | $0.03/mo | Included | New church, text-only content |
| Basic | 5 GB | $0.08/mo | Included in base | Most small churches year 1 |
| Standard | 15 GB | $0.23/mo | $3/mo add-on | Active church, many images/docs |
| Media | 50 GB | $0.75/mo | $7/mo add-on | Church hosting audio sermons |
| Media+ | 100 GB | $1.50/mo | $12/mo add-on | Church self-hosting some video |

### How Competitors Handle Storage

Most church SaaS platforms bundle storage into a flat subscription:
- **Tithe.ly** — unlimited storage at $19/month
- **Subsplash** — custom-quoted pricing based on church size
- **FaithConnector** — $18–45/month with storage varying by plan

None expose per-GB costs to churches. Follow the same pattern: include a generous base amount and charge add-ons only for heavy users.

---

## Benchmark: Austin Stone Church

Austin Stone uses **Webflow** as their website platform (CDN URL: `cdn.prod.website-files.com`). Webflow hosts on Cloudflare and Fastly CDNs behind the scenes, charges $14–39/month per site, and handles all CDN, SSL, and image optimization (including automatic WebP conversion) as part of the subscription.

**This validates the approach:** Cloudflare's CDN is what powers Webflow's infrastructure. By building directly on R2 + CF CDN, you get the same underlying technology at a fraction of the per-site cost.

---

## WebP Conversion Strategy

Store original uploads in R2. Use **Cloudflare Image Transformations** or a **Cloudflare Worker** to convert to WebP on-the-fly when serving. The CDN caches the converted version. This gives the same auto-optimization Austin Stone gets through Webflow, without extra storage cost for maintaining two versions of every image.

---

## Provider Deep Dives

### Cloudflare R2 (Recommended)

**Pros:**
- Zero egress fees, forever
- S3-compatible API (standard AWS SDK)
- Free CDN with 300+ edge PoPs
- Free DDoS protection (enterprise-grade)
- Custom domain support (e.g., `cdn.laubf.org`)
- Free SSL auto-provisioned
- 10 GB + 10M reads free forever (not 12-month trial)
- Low vendor lock-in (S3 API = portable)
- Workers integration for per-tenant routing and image optimization

**Cons:**
- Requires DNS migration to Cloudflare (one-time effort)
- No spending limit/cap available
- No built-in image transformation (separate product, or use Workers)
- Slightly higher storage cost than B2 ($0.015 vs $0.006)

### Backblaze B2

**Pros:**
- Cheapest raw storage ($0.006/GB — 2.5x cheaper than R2)
- 10 GB free forever
- S3-compatible API
- Free egress to Cloudflare CDN via Bandwidth Alliance partnership
- Good for large archives and backups

**Cons:**
- No built-in CDN (must pair with Cloudflare CDN)
- Egress charges after 3x free allowance ($0.01/GB) outside CF
- Single region storage (no global replication)

### Tigris (Fly.io)

**Pros:**
- Zero egress fees
- Globally distributed by default (auto-caches near readers)
- S3-compatible API

**Cons:**
- Tied to Fly.io platform for billing
- $0.02/GB storage (33% more than R2)
- Smaller free tier (5 GB), newer product, less mature

### AWS S3 + CloudFront

Most mature but most expensive. $0.09/GB egress + CloudFront costs. Only makes sense if already deep in AWS.

### Azure Blob + CDN

$0.087/GB egress after free credits expire. Azure CDN is separate paid product. Not recommended long-term.

---

## Decision Matrix

| Criteria (weighted) | Weight | R2 | B2+CF | Tigris | Bunny | AWS S3 | Azure |
|---------------------|--------|-----|-------|--------|-------|--------|-------|
| Cost at scale | 25% | 10 | 9 | 8 | 8 | 4 | 3 |
| Zero egress | 20% | 10 | 9 | 10 | 10 | 2 | 2 |
| S3 compatibility | 15% | 10 | 10 | 10 | 3 | 10 | 3 |
| Built-in CDN | 15% | 10 | 8 | 8 | 10 | 7 | 5 |
| Free tier | 10% | 9 | 8 | 6 | 0 | 4 | 4 |
| Multi-tenant ready | 10% | 9 | 7 | 7 | 7 | 8 | 6 |
| Ecosystem maturity | 5% | 9 | 8 | 5 | 7 | 10 | 8 |
| **Weighted Score** | | **9.7** | **8.5** | **8.0** | **6.9** | **5.7** | **3.7** |

---

## Bottom Line

At 100 churches, Cloudflare R2 costs **~$4–22/month** total. Azure would cost ~$50–150+/month. AWS S3 would cost ~$15–120/month. The DNS migration is a one-time 15-minute task that saves thousands of dollars annually.
