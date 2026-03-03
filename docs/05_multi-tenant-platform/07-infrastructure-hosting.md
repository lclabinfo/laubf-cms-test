# Infrastructure & Hosting

---

## Recommended Stack

| Service | Provider | Why | Cost |
|---------|----------|-----|------|
| **Hosting** | Vercel (Pro) | Native multi-tenant, edge middleware, preview deploys | $20/mo base |
| **Database** | Neon (Pro) | Serverless Postgres, branching, Vercel integration | $19/mo base |
| **Storage** | Cloudflare R2 | Zero egress, built-in CDN, S3-compatible | ~$0.30/mo |
| **Cache** | Upstash Redis | Serverless, pay-per-request | Free tier → $10/mo |
| **Email** | Resend | Developer-friendly, generous free tier | Free → $20/mo |
| **Payments** | Stripe | Industry standard, Customer Portal | 2.9% + $0.30/txn |
| **Error tracking** | Sentry | Free tier covers 5K errors/mo | Free → $26/mo |
| **Analytics** | PostHog | Free tier covers 1M events/mo | Free → $0/mo |
| **DNS/CDN** | Cloudflare | Free plan, DDoS protection | Free |

### Monthly cost at launch: ~$60/mo
### Monthly cost at 500 churches: ~$200-400/mo
### Monthly cost at 2000 churches: ~$500-1500/mo (consider self-hosting at this point)

---

## Vercel Configuration

### Wildcard domain
Add `*.digitalchurch.com` to your Vercel project domains. Requires Vercel's nameservers for the root domain.

### Environment variables (per-environment)
```env
# Production
NEXT_PUBLIC_ROOT_DOMAIN=digitalchurch.com
DATABASE_URL=postgres://... (Neon production)

# Preview (per-PR)
NEXT_PUBLIC_ROOT_DOMAIN=preview.digitalchurch.com
DATABASE_URL=postgres://... (Neon branch — auto-created)
```

### Build configuration
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npx prisma generate && next build",
  "regions": ["iad1"]  // US East (closest to Neon default region)
}
```

---

## Neon Database

### Why Neon over Supabase/RDS
- **Branching**: Each PR gets its own database copy. Seed it, test it, delete it.
- **Scale-to-zero**: Dev/preview databases cost $0 when idle.
- **Vercel integration**: One-click setup, auto-creates branches for preview deployments.
- **Connection pooling**: Built-in PgBouncer, no separate setup.

### Configuration
```env
DATABASE_URL="postgres://user:pass@ep-xxx.us-east-1.aws.neon.tech/digitalchurch?sslmode=require"
DIRECT_URL="postgres://user:pass@ep-xxx.us-east-1.aws.neon.tech/digitalchurch?sslmode=require"
```

### Scaling path
1. **Free tier** (0-100 churches): 0.5 GiB storage, autosuspend after 5 min
2. **Launch plan $19/mo** (100-1000 churches): 10 GiB, always-on compute
3. **Scale plan $69/mo** (1000+ churches): Autoscaling compute, read replicas
4. **Business plan** (5000+ churches): Dedicated compute, larger storage

---

## CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
  pull_request:

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx prisma generate
      - run: npm run lint
      - run: npx tsc --noEmit  # Type check

  # Vercel handles the actual deployment via GitHub integration
  # PRs get preview deployments automatically
  # Main branch deploys to production automatically
```

---

## When to Self-Host

Self-host when Vercel costs exceed **$500/month** (typically ~2000+ churches with moderate traffic).

### Self-hosting stack
| Component | Service | Cost |
|-----------|---------|------|
| Server | Hetzner AX41 (dedicated) | $50/mo |
| Container | Docker + Coolify (open-source PaaS) | $0 |
| Reverse proxy | Caddy (auto-HTTPS) | $0 |
| Database | Still Neon (managed) | $69/mo |
| CDN | Cloudflare (free plan) | $0 |
| Custom domains | Cloudflare for SaaS | $0 |
| CI/CD | GitHub Actions → Docker → deploy | $0 |
| **Total** | | **~$120/mo** |

At 2M page views/month: Vercel ~$3,500/mo vs self-hosted ~$120/mo.

---

## Security Checklist

| Item | Tool | Status |
|------|------|--------|
| SSL/TLS on all endpoints | Vercel (auto) + Cloudflare | Automatic |
| DDoS protection | Cloudflare free tier | Automatic |
| WAF (web application firewall) | Cloudflare managed rules | Free tier |
| Secret management | Vercel env variables + `.env.local` | Manual |
| Database encryption at rest | Neon (automatic AES-256) | Automatic |
| Audit logging | Custom (AuditLog model) | Needs implementation |
| Rate limiting | Vercel Edge Middleware or Upstash Ratelimit | Needs implementation |
| CORS | Next.js API route headers | Partially implemented |
| CSP headers | `next.config.ts` security headers | Needs implementation |
| Dependency scanning | GitHub Dependabot | Enable in repo settings |
