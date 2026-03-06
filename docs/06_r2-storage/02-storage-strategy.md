# Storage Strategy — Cloud-Only with R2

## Decision: Cloud-Only (No Local Copies)

**Recommendation: Go cloud-only with R2 from day one.**

### Why Not Hybrid (Local + Cloud)?

| Factor                 | Local/Hybrid                      | Cloud-Only                |
|------------------------|-----------------------------------|---------------------------|
| Complexity             | Two backends, sync logic needed   | Single storage layer      |
| Cost (small scale)     | Disk "free" but ops cost for sync | R2 free tier (10 GB)      |
| CDN/Delivery           | Manual setup, extra config        | Built-in via R2 + CDN     |
| Multi-tenant isolation | Filesystem permissions, quotas    | Key prefixes              |
| Durability             | You do backups/RAID               | 11x9 durability (R2)      |
| Scaling                | Limited by disk                   | Unlimited                 |
| Host migration         | Must move files                   | Files already in R2       |
|                        |                                   |                           |
| Summary                | Local+cloud: more moving parts,   | R2 covers old reasons for |
|                        | complex sync & failover           | local—fewer headaches     |

Hybrid made sense in legacy apps where cloud egress was expensive and CDNs cost extra. R2 eliminates both concerns — egress is **free forever**, and Cloudflare's CDN (300+ edge locations) is included.

### Why Not Hybrid — Plain Summary

- **Hybrid = two systems.** You maintain local disk and R2, plus sync logic and fallback behavior. More code, more failure modes.
- **R2 already covers the old reasons for local storage.** Egress is free and the CDN is built in, so the main benefits of keeping files on the server (cheap bandwidth, fast delivery) don’t apply.
- **Ops burden.** With hybrid you still manage disk, backups, and migration when the server changes. With R2-only, durability and scaling are the provider’s problem.

So hybrid adds complexity without a clear win for this project.

### Hybrid as Backup (Redundancy if Cloudflare Has Issues)

A valid reason for hybrid is **redundancy**: if R2 or Cloudflare has an outage, a local copy could still serve or restore files.

- **Tradeoff:** You’d need to build and maintain sync, fallback logic, and decide when to use local vs cloud. The “backup” also lives on the same app server — if that server dies or you lose the disk, you’ve lost the fallback.
- **Recommendation:** For resilience, rely on R2’s durability and, if desired, add a separate backup strategy (e.g. another region or provider) rather than hybrid local + cloud in the app.

### When Hybrid Would Make Sense (Not Now)

- Regulatory data residency requirements
- Very high-volume processing pipelines needing local staging
- Self-hosted customer deployments with customer-owned storage

None of these apply to this project in its current phase.

### Phased Approach

1. **Now (LA UBF):** Cloud-only with R2. Dedicated Cloudflare account per church. Two buckets (`file-attachments`, `file-media`). 10 GB free tier per account.
2. **Growth (2-5 churches):** Same pattern — new Cloudflare account per church, managed by lclab.io. Single-tenant deployments.
3. **Consolidation (~5-10 churches):** Migrate to centralized lclab.io Cloudflare account. Shared buckets with tenant-prefixed keys. Multi-tenant app.

See `00-account-strategy.md` for the full account management and migration plan.

## R2 Pricing Reality Check

| Usage | Monthly Cost |
|---|---|
| 5 GB stored, light traffic | **$0** (free tier) |
| 10 GB stored, moderate traffic | **$0** (free tier) |
| 20 GB stored, 100 GB served | **~$0.15** |
| 50 GB stored, 500 GB served | **~$0.60** |
| 200 GB stored, 2 TB served | **~$2.85** |

Key insight: **egress is always $0**. Only storage and write operations cost money. For a church CMS with hundreds of visitors, monthly costs stay under $1-5 for a long time.

## Egress and Bandwidth

**Egress** = data that *leaves* the provider’s network (e.g. when someone or something downloads it). **Ingress** = data going *in* (e.g. uploads); it’s usually free.

So when we say “bandwidth” in a cost context, we usually mean **egress**: how much data is sent out. With providers like S3, you pay per GB of egress, so serving a lot of images or videos could get expensive. Some apps kept a local copy and served from their own server to avoid that cost. **R2 charges $0 for egress**, so that reason to keep files on your server goes away.

### What Counts as Egress (Not Just User Downloads)

Egress is any time data leaves R2’s network, not only when a user downloads in the browser:

| Scenario | What happens | Egress? |
|----------|----------------|--------|
| User downloads a file in the browser | R2 (or CDN) → user | Yes |
| Your app reads from R2 | e.g. resize image, generate thumbnail, stream to user — R2 → your server | Yes |
| Copy/sync data out | Replicate from R2 to another region or provider (e.g. backup to S3) | Yes |
| Another provider pulls from R2 | Third-party CDN or service using R2 as origin | Yes |

**Bottom line:** Any time data leaves R2 (to a user, your app, or another cloud), that’s egress. With R2, all of it is $0.

## Storage Limit

**Initial platform limit: 10 GB per church (media + bible study combined).**

Track usage via `MediaAsset.fileSize` and `BibleStudyAttachment.fileSize` columns — sum per `churchId` on upload to enforce the limit server-side.

## Two-Bucket Architecture

Files are split across two R2 buckets by purpose:

| Bucket | Contents | Access Pattern |
|---|---|---|
| `file-attachments` | Bible study PDFs, DOCXs, sermon handouts | Download-oriented |
| `file-media` | Images, audio, thumbnails, series covers | Serve-oriented (inline, cached) |

See `docs/06_r2-storage/01-r2-env-setup.md` for env vars and rationale.

## Multi-Tenant Key Structure

Both buckets use the same key pattern — `churchSlug` prefix for tenant isolation (e.g. `la-ubf/`).

**Phase 1 (account-per-church):** The `churchSlug` prefix is technically redundant since each church has its own buckets, but we include it from day one so that keys don't need to change during Phase 2 migration.

**Phase 2 (shared buckets):** The `churchSlug` prefix becomes essential for isolation.

**`file-attachments` bucket:**
```
{churchSlug}/
  staging/                              ← temporary uploads (lifecycle: auto-delete after 24h)
    {uuid}-{sanitized-filename}.docx
  {year}/
    {entry-slug}/                       ← permanent location (moved from staging on save)
      {uuid}-{sanitized-filename}.pdf
      {uuid}-{sanitized-filename}.docx
```

**`file-media` bucket:**
```
{churchSlug}/
  staging/
    {uuid}-{sanitized-filename}.jpg
  images/
    {year}/
      {uuid}-{sanitized-filename}.jpg
  audio/
    {year}/
      {uuid}-{sanitized-filename}.mp3
```

- `churchSlug` prefix provides tenant isolation (uses slug, not UUID, for readability)
- `staging/` prefix for uploads that haven't been saved yet — lifecycle rule auto-cleans orphans after 24h
- On save, files are moved from `staging/` to `{year}/{entry-slug}/` (permanent key)
- `year` sub-prefix keeps listings fast and enables lifecycle rules
- `entry-slug` sub-prefix groups all files for one entry together (human-readable in R2 dashboard)
- `uuid` prefix prevents filename collisions
- Original filename preserved (sanitized) for human readability
- Permanent URLs are stored in the DB — slug changes don't require file moves

## Lifecycle Rules

Configure per-bucket in Cloudflare dashboard. The staging prefix includes the church slug (e.g. `la-ubf/staging/`).

**`file-attachments` bucket:**

| Prefix | Rule | Purpose |
|---|---|---|
| `*/staging/` (or per-church: `la-ubf/staging/`) | Delete after 24 hours | Orphan upload cleanup |
| (all) | Transition to IA after 90 days | Cost optimization for old study materials |

**`file-media` bucket:**

| Prefix | Rule | Purpose |
|---|---|---|
| `*/staging/` (or per-church: `la-ubf/staging/`) | Delete after 24 hours | Orphan upload cleanup |

**Note:** R2 lifecycle rules use prefix matching. For Phase 1 (single church), use the specific church prefix. For Phase 2 (multi-tenant), use a wildcard or add per-church rules.

**Status:** Lifecycle rules are NOT yet configured in Cloudflare — staging files currently persist indefinitely. This is safe because the move-on-save logic promotes files to permanent keys, so only orphaned uploads (user cancels before saving) accumulate in staging. Configure the rule when cleanup becomes needed.
