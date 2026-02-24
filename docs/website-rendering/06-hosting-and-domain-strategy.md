# Hosting & Domain Strategy

## Default Hosting, Custom Domains, Infrastructure, and Business Model

> **Context**: We're self-hosting on Azure VMs (not Vercel). Default church websites are hosted at `*.lclab.io`. Custom domains are a paid add-on. This document covers the technical architecture, cost analysis, and business strategy for domain hosting at scale.

---

## 1. Domain Strategy Overview

Every church on the platform gets a website. The question is: what URL do they get?

### Default Hosting: `churchname.lclab.io`

Every church gets a free subdomain on the platform domain:

```
laubf.lclab.io          ← LA UBF
gracechurch.lclab.io    ← Grace Church
newlife.lclab.io        ← New Life Fellowship
```

This follows the industry-standard pattern:

| Platform | Default URL Pattern |
|---|---|
| Shopify | `storename.myshopify.com` |
| Webflow | `sitename.webflow.io` |
| Notion | `workspace.notion.site` |
| Planning Center | `churchname.churchcenter.com` |
| Vercel | `project.vercel.app` |
| **Ours** | **`churchname.lclab.io`** |

**Why a separate domain from the marketing site?** Security best practice. Tenant-hosted content on a separate domain (`lclab.io`) isolates it from the platform's own cookies and session data (on whatever the marketing domain will be). This is what Shopify (`myshopify.com` vs `shopify.com`) and Webflow (`webflow.io` vs `webflow.com`) do.

### Custom Domain Hosting: `gracechurch.org` (Paid Tier)

Churches on a paid plan can connect their own domain. The visitor sees `gracechurch.org` with no trace of the platform branding. This is the premium experience.

### Why Not Random Strings?

Some platforms (like Figma for prototype sharing) use random strings like `figma.com/proto/abc123xyz`. This works for disposable links but is terrible for a church's primary website — nobody wants to tell their congregation to visit `lclab.io/x7f9k2m`. Subdomains with the church name are human-readable, memorable, and professional enough for the free tier.

---

## 2. Technical Architecture

### Default Subdomains (`*.lclab.io`)

**What's needed:**

| Component | Setup | Cost |
|---|---|---|
| Domain registration | `lclab.io` at Cloudflare Registrar | ~$34/year |
| Wildcard DNS | `*.lclab.io` → Azure VM IP (A record) | $0 (included with domain) |
| Wildcard SSL | `*.lclab.io` certificate via Let's Encrypt DNS-01 challenge | $0 |
| Reverse proxy | Caddy with Cloudflare DNS plugin for auto-cert | $0 |

**How it works:**

1. Register `lclab.io` with Cloudflare as DNS provider.
2. Add a single wildcard `A` record: `*.lclab.io → <Azure VM public IP>`.
3. Add an apex `A` record: `lclab.io → <Azure VM public IP>`.
4. Caddy (on the Azure VM) handles wildcard SSL automatically:

```
# Caddyfile
*.lclab.io {
    tls {
        dns cloudflare {env.CF_API_TOKEN}
    }
    reverse_proxy localhost:3000
}
```

5. Caddy obtains and auto-renews the wildcard certificate via Let's Encrypt DNS-01 challenge (proves domain ownership by creating a `_acme-challenge.lclab.io` TXT record via Cloudflare API).
6. All subdomains (`laubf.lclab.io`, `grace.lclab.io`, etc.) resolve to the same Azure VM and are handled by Next.js middleware, which extracts the subdomain and resolves it to a `church_id`.

**Per-church cost: $0.** One domain, one wildcard cert, unlimited subdomains.

### Custom Domains (`gracechurch.org`)

**The standard SaaS custom domain flow:**

1. **Church admin enters their domain** in the CMS settings (e.g., `gracechurch.org`).
2. **Platform shows DNS instructions**: "Add a CNAME record pointing `gracechurch.org` to `proxy.lclab.io`" (or an A record to the VM IP).
3. **Platform verifies DNS**: Background job checks if the domain resolves correctly.
4. **Platform provisions SSL**: Caddy obtains a Let's Encrypt certificate for `gracechurch.org` automatically.
5. **Traffic flows**: Visitor hits `gracechurch.org` → DNS resolves to Azure VM → Caddy terminates SSL → Next.js middleware looks up `gracechurch.org` in the `CustomDomain` table → resolves to `church_id` → renders the church's website.

**Caddy's On-Demand TLS is the key feature here:**

```
# Caddyfile — custom domain support
https:// {
    tls {
        on_demand
    }
    reverse_proxy localhost:3000
}
```

With a verification endpoint to prevent abuse:

```
{
    on_demand_tls {
        ask http://localhost:3000/api/internal/verify-domain
        interval 1m
        burst 10
    }
}
```

When a request arrives for an unknown domain (e.g., `gracechurch.org`):
1. Caddy calls `http://localhost:3000/api/internal/verify-domain?domain=gracechurch.org`.
2. Your API checks the `CustomDomain` table — if the domain exists and is verified, return 200.
3. Caddy obtains a Let's Encrypt certificate for that domain automatically.
4. Certificate is cached and auto-renewed. Zero manual intervention.

**Per-church cost: $0 for SSL.** Let's Encrypt is free and unlimited. The only cost is the church's own domain registration (~$10-15/year for `.org`, which they pay themselves).

### Why Caddy Over Nginx

| | Caddy | Nginx + Certbot |
|---|---|---|
| Wildcard SSL | Built-in with DNS plugin | Requires certbot + dns plugin + cron |
| On-Demand TLS (custom domains) | Built-in, first-class feature | Requires OpenResty + lua-resty-auto-ssl (complex) |
| Auto-renewal | Automatic, zero config | Requires cron job or systemd timer |
| Config complexity | ~10 lines for full setup | ~50+ lines + separate certbot config |
| HTTP/2, HTTP/3 | Enabled by default | Requires explicit config |

Caddy is strongly recommended for this use case. Companies like Hashnode and Pirsch Analytics have publicly documented switching from Nginx to Caddy specifically for the automatic SSL and custom domain support.

---

## 3. Infrastructure: Azure VM + Cloudflare

### Current Setup: Azure VM

We're running on Azure VMs, not Vercel. This means we manage our own server infrastructure but gain cost predictability and full control.

**Recommended VM stack:**

```
Azure VM (B2s: 2 vCPU, 4GB RAM, ~$30/month)
├── Caddy (reverse proxy, SSL termination)
├── Node.js + PM2 (Next.js standalone server)
├── PostgreSQL (same VM or Azure Database for PostgreSQL)
└── Redis (only when needed — Stage 2+)
```

**Next.js standalone mode** (`output: 'standalone'` in `next.config.ts`) produces a self-contained build that runs without `node_modules`. PM2 manages the Node.js process (auto-restart, cluster mode, logging).

### Cloudflare as CDN (Free Tier)

Cloudflare sits in front of the Azure VM, providing CDN caching, DDoS protection, and DNS hosting.

**What the free plan includes:**

| Feature | Free Plan |
|---|---|
| Domains per account | Unlimited |
| Bandwidth | Unlimited |
| Request volume | Unlimited (for CDN/proxy) |
| DDoS protection | Included (unmetered) |
| SSL/TLS | Universal SSL |
| DNS hosting | Full DNS, fast propagation |
| Page Rules | 3 per domain |
| Custom Hostnames (for SaaS) | First 100 free, then $0.10/month each |

**Is the free plan enough for 10-100 churches?** Yes. There are no request limits on the CDN proxy. Each church's subdomain is handled by the wildcard DNS — it's one Cloudflare zone (`lclab.io`), not one per church.

**Setup:**
1. Point `lclab.io` nameservers to Cloudflare.
2. Add `A` records for `lclab.io` and `*.lclab.io` → Azure VM IP, proxy enabled (orange cloud).
3. Set SSL mode to "Full (Strict)" — Cloudflare encrypts to origin using Caddy's Let's Encrypt cert.
4. Optionally use Cloudflare Tunnel (`cloudflared`) to avoid exposing the VM's IP publicly.

**When to upgrade to Cloudflare Pro ($20/month):**
- Need more than 3 Page Rules (Pro gets 20)
- Want image optimization at the edge (Polish, Mirage)
- Need enhanced WAF (Web Application Firewall) rules
- Want better analytics

For our current stage (1-10 churches), the free plan is more than sufficient.

### What We Lose vs. Vercel (and How to Compensate)

| Feature | Vercel | Azure VM + Cloudflare | Mitigation |
|---|---|---|---|
| Edge Functions | 30+ global locations | Runs on single VM | Cloudflare free CDN caches static assets globally |
| ISR | Managed global cache | Filesystem cache (local only) | Works fine on single server; add Redis later if needed |
| Image Optimization | Edge-optimized globally | `sharp` on origin server | Cloudflare caches optimized images |
| Zero-config deploys | `git push` | Manual or CI/CD | GitHub Actions pipeline |
| Custom domains | Enterprise feature | Free with Caddy On-Demand TLS | Actually *easier* self-hosted |
| DDoS protection | Built-in | Cloudflare free tier | Equivalent or better |
| Cost (50 churches) | $50-200+/month (unpredictable) | ~$30/month (fixed) | Significant savings |

**Key insight**: For a multi-tenant SaaS with custom domain support, self-hosting on Azure with Caddy is actually *simpler and cheaper* than Vercel, which doesn't natively support multi-tenant custom domains outside their Enterprise plan.

---

## 4. Cost Analysis

### Fixed Infrastructure Costs

| Item | Cost | Frequency |
|---|---|---|
| `lclab.io` domain | ~$34 | Per year |
| Azure VM (B2s) | ~$30 | Per month |
| Cloudflare (free plan) | $0 | — |
| Wildcard SSL | $0 | — (Let's Encrypt) |
| Custom domain SSL | $0 | — (Caddy On-Demand TLS) |
| **Total baseline** | **~$33/month** | |

### Per-Church Marginal Cost

| Tier | Default subdomain | Custom domain |
|---|---|---|
| 1-100 churches | $0/church | $0/church (Caddy handles SSL) |
| 100+ churches | $0/church | $0.10/month/church if using Cloudflare Custom Hostnames |

The marginal cost per church is effectively zero. The fixed VM cost is the floor.

### Scaling Costs

| Scale | Infrastructure | Estimated Monthly Cost |
|---|---|---|
| 1-10 churches | 1 Azure VM + Cloudflare free | ~$33 |
| 10-50 churches | 1 Azure VM + Cloudflare free | ~$33 |
| 50-100 churches | 1 Azure VM (upgrade to B2ms: 2 vCPU, 8GB) + Cloudflare free | ~$60 |
| 100-500 churches | 2 Azure VMs + Load Balancer + Redis + Cloudflare Pro | ~$150-250 |
| 500-1000+ churches | 3+ Azure VMs + Azure LB + Azure Redis Standard + Cloudflare Pro | ~$400-800 |

---

## 5. Business Model: How to Price Domain Hosting

### Competitive Landscape

| Competitor | Monthly Price | Custom Domain |
|---|---|---|
| Tithe.ly Sites | $19/month | Included in plan |
| Planning Center (Church Center) | Free-$99/month | No custom domain (always `churchname.churchcenter.com`) |
| Faithlife Sites | ~$17-20/month | Included in plan |
| Nucleus | $79-129/month | Included in plan |
| Squarespace | $16-33/month | Included on paid plans |
| Wix | $17-36/month | Included on paid plans |

**Key insight**: Most church CMS competitors include custom domain support in their base subscription. Custom domains are table stakes, not a premium upsell. Planning Center is the notable exception — they never offer custom domains, always `churchname.churchcenter.com`.

### Recommended Pricing Strategy

#### Free Tier

- Default subdomain: `churchname.lclab.io`
- Platform branding in footer ("Powered by [Platform Name]")
- Limited to N pages / N sections
- Good for small churches to get started

**Why offer a free tier?** Church budgets are tight. A free tier drives adoption, and churches that grow will naturally upgrade. This is the Shopify model — free trial, then convert to paid.

#### Starter Plan (~$19-29/month)

- Custom domain support included
- No platform branding
- Full CMS features
- This is the plan most churches will be on

**Why include custom domains?** Our infrastructure cost for a custom domain is $0 (Caddy handles SSL automatically). Not including it would feel like an artificial restriction and put us behind competitors. The value is in the CMS/builder features, not the domain hosting.

#### Growth Plan (~$49-79/month)

- Everything in Starter
- Advanced features (analytics, multi-campus, team roles)
- Priority support

#### How Much Should Custom Domain Hosting "Cost" the Customer?

It shouldn't be a separate line item. The infrastructure cost is near-zero ($0 for SSL, $0 for DNS routing). Charging separately for custom domains ($5-10/month) is a dated practice from the 2010s when SSL certificates and DNS management were manual and expensive. Modern SaaS includes it in the base plan.

**Exception**: If you want to offer free accounts without custom domains and paid accounts with custom domains, that's a reasonable feature gate. But within paid plans, include custom domains.

### Domain Registration: Our Responsibility or Theirs?

**Recommended: Churches register their own domain.** This is how Shopify, Squarespace, and Wix work. The church buys `gracechurch.org` from any registrar (Namecheap, Google Domains, Cloudflare) and connects it to our platform. We provide DNS instructions.

**Why not register domains for them?**
- Legal liability — domain ownership gets messy if the church leaves the platform
- Accounting complexity — reselling domains means different billing cycles, refund policies
- Support burden — "my domain expired" becomes your problem
- Margin is tiny — a `.org` domain costs ~$10-12/year, markup to $15-20/year barely moves the needle

**Optional future offering**: A "managed domain" add-on where we register and manage the domain on their behalf for a small markup ($5-10/year). This is a convenience feature, not a core offering.

---

## 6. Subdomain Slug Strategy

When a church signs up, they choose their slug (e.g., `laubf` for `laubf.lclab.io`). Rules:

- **Slugification**: Lowercase, alphanumeric + hyphens. `"Grace Church LA"` → `grace-church-la`
- **Reserved slugs**: Block `www`, `api`, `admin`, `cms`, `app`, `mail`, `smtp`, `ftp`, `ns1`, `ns2`, `staging`, `dev`, `test`, `beta`, `help`, `support`, `status`, `blog`
- **Uniqueness**: Enforced at the database level (`UNIQUE` constraint on `Church.slug`)
- **Length limits**: 3-63 characters (DNS subdomain spec)
- **Immutable after creation**: Changing a slug breaks existing links, bookmarks, and SEO. If a church absolutely needs to change it, support the old slug as a redirect for 6 months.

### Subdomain Validation (Zod)

```typescript
const churchSlugSchema = z.string()
  .min(3, 'Slug must be at least 3 characters')
  .max(63, 'Slug must be 63 characters or fewer')
  .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, 'Only lowercase letters, numbers, and hyphens')
  .refine(slug => !RESERVED_SLUGS.includes(slug), 'This subdomain is reserved')
```

---

## 7. DNS & SSL Implementation Checklist

### Phase A (Single-Tenant MVP)

No domain infrastructure needed. Access the site at `localhost:3000` or the Azure VM's IP/hostname directly.

### Phase B-C (Pre-Launch)

1. Register `lclab.io` (Cloudflare Registrar, ~$34/year)
2. Set up Cloudflare zone for `lclab.io`
3. Add wildcard `A` record: `*.lclab.io → <Azure VM IP>`
4. Add apex `A` record: `lclab.io → <Azure VM IP>`
5. Install Caddy on Azure VM with `caddy-dns/cloudflare` plugin
6. Configure Caddyfile for wildcard SSL
7. Verify: `curl https://laubf.lclab.io` returns the LA UBF website

### Phase D (Multi-Tenant + Custom Domains)

1. Add On-Demand TLS block to Caddyfile for custom domains
2. Create `/api/internal/verify-domain` endpoint
3. Create CMS UI for churches to add their custom domain
4. Create background job to verify DNS propagation
5. Store verified domains in `CustomDomain` table
6. Verify: `curl https://gracechurch.org` returns Grace Church website

### Full Caddyfile

```
{
    on_demand_tls {
        ask http://localhost:3000/api/internal/verify-domain
        interval 1m
        burst 10
    }
}

# Default subdomains
*.lclab.io {
    tls {
        dns cloudflare {env.CF_API_TOKEN}
    }
    reverse_proxy localhost:3000
}

# Platform apex (marketing site or redirect)
lclab.io {
    tls {
        dns cloudflare {env.CF_API_TOKEN}
    }
    reverse_proxy localhost:3000
}

# Custom domains (catch-all with On-Demand TLS)
https:// {
    tls {
        on_demand
    }
    reverse_proxy localhost:3000
}
```

---

## 8. Key Decisions Summary

| Decision | Choice | Rationale |
|---|---|---|
| Default domain | `lclab.io` | Cheap, short, matches industry pattern |
| Default URL format | `churchname.lclab.io` | Human-readable, professional, zero per-church cost |
| Reverse proxy | Caddy | Built-in wildcard SSL + On-Demand TLS for custom domains |
| CDN | Cloudflare (free tier) | Unlimited bandwidth, DDoS protection, DNS hosting |
| Custom domain SSL | Caddy On-Demand TLS (Let's Encrypt) | Free, automatic, zero manual intervention |
| Custom domain pricing | Included in paid plans | Industry standard, near-zero infrastructure cost |
| Domain registration | Church's responsibility | Avoids legal/billing complexity |
| Hosting infrastructure | Azure VM | Cost-predictable, full control, better for multi-tenant than Vercel |
