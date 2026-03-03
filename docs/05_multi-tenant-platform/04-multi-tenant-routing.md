# Multi-Tenant Routing & Domain Strategy

---

## Domain Architecture

| Domain | Purpose | Example |
|--------|---------|---------|
| **Root domain** | Marketing site, pricing, signup | `digitalchurch.com` |
| **Platform admin** | Superadmin console | `admin.digitalchurch.com` |
| **Church subdomain** | Default church website | `la-ubf.digitalchurch.com` |
| **Church CMS** | Church admin panel | `la-ubf.digitalchurch.com/cms/` |
| **Custom domain** | Church's own domain | `www.laubf.org` |
| **CDN** | Media assets | `cdn.digitalchurch.com` (Cloudflare R2) |

---

## Middleware Implementation

```typescript
// middleware.ts (project root)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/edge-config'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'

export default async function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || ''
  const url = req.nextUrl.clone()

  // --- Static assets and API: pass through ---
  if (url.pathname.startsWith('/_next') || url.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // --- Platform admin subdomain ---
  if (hostname === `admin.${ROOT_DOMAIN}`) {
    // Rewrite to (platform-admin) route group
    url.pathname = `/admin${url.pathname}`
    return NextResponse.rewrite(url)
  }

  // --- Root domain: marketing site ---
  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
    return NextResponse.next() // Serve (marketing) route group
  }

  // --- Church subdomain ---
  const isSubdomain = hostname.endsWith(`.${ROOT_DOMAIN}`)
  if (isSubdomain) {
    const slug = hostname.replace(`.${ROOT_DOMAIN}`, '')
    // Set tenant context headers
    const response = NextResponse.rewrite(
      new URL(`/_tenants/${slug}${url.pathname}`, req.url)
    )
    response.headers.set('x-tenant-slug', slug)
    return response
  }

  // --- Custom domain ---
  // Look up domain → church mapping (cache this in Redis/KV)
  const tenantSlug = await resolveCustomDomain(hostname)
  if (tenantSlug) {
    const response = NextResponse.rewrite(
      new URL(`/_tenants/${tenantSlug}${url.pathname}`, req.url)
    )
    response.headers.set('x-tenant-slug', tenantSlug)
    return response
  }

  // Unrecognized domain → 404 or redirect to root
  return NextResponse.redirect(new URL(`https://${ROOT_DOMAIN}`))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## Custom Domain Setup Flow

### Church admin adds a domain
1. Church goes to CMS > Website > Domains
2. Enters their domain (e.g., `www.laubf.org`)
3. System calls Vercel SDK to add the domain to the project
4. System saves `CustomDomain` record with `status: PENDING`
5. UI shows DNS instructions (CNAME record pointing to `cname.vercel-dns.com`)

### DNS verification
6. Church (or us) adds the DNS record at their registrar
7. System periodically checks DNS propagation (or church clicks "Verify")
8. Once verified, Vercel auto-provisions SSL certificate
9. Status updates to `VERIFIED`
10. Middleware now resolves this domain to the correct church

### Vercel SDK integration
```typescript
// app/api/v1/domains/route.ts
import { Vercel } from '@vercel/sdk'

const vercel = new Vercel({ bearerToken: process.env.VERCEL_TOKEN })

export async function POST(req: Request) {
  const { domain, churchId } = await req.json()

  // Add to Vercel project
  await vercel.projects.addProjectDomain({
    idOrName: process.env.VERCEL_PROJECT_ID!,
    requestBody: { name: domain },
  })

  // Save in our DB
  await prisma.customDomain.create({
    data: { domain, churchId, status: 'PENDING' },
  })

  return Response.json({ success: true })
}
```

---

## Project Structure After Routing

```
app/
  (marketing)/                  # Root domain — landing, pricing, signup
    page.tsx                    # Homepage
    pricing/page.tsx
    signup/page.tsx
    login/page.tsx

  (platform-admin)/             # admin.* subdomain
    admin/
      layout.tsx
      page.tsx                  # Superadmin dashboard
      churches/...
      billing/...
      support/...

  cms/                          # /cms/* on any church domain
    (dashboard)/
      layout.tsx                # Auth guard + church context
      messages/...
      events/...
      ...

  _tenants/
    [slug]/                     # Dynamic: rewritten by middleware
      layout.tsx                # ThemeProvider + FontLoader
      [[...path]]/page.tsx      # Catch-all church website renderer

  api/
    v1/...                      # REST API (tenant-scoped via session)
    auth/...                    # Auth routes
    webhooks/
      stripe/route.ts           # Stripe webhooks
```

---

## Caching Tenant Resolution

Custom domain lookups should be cached to avoid a DB query on every request:

```typescript
// lib/tenant/resolve.ts
import { kv } from '@vercel/kv'  // or Upstash Redis

const CACHE_TTL = 300 // 5 minutes

export async function resolveCustomDomain(domain: string): Promise<string | null> {
  // Check cache first
  const cached = await kv.get<string>(`domain:${domain}`)
  if (cached) return cached

  // Query DB
  const record = await prisma.customDomain.findFirst({
    where: { domain, status: 'VERIFIED' },
    select: { church: { select: { slug: true } } },
  })

  if (!record) return null

  // Cache the result
  await kv.set(`domain:${domain}`, record.church.slug, { ex: CACHE_TTL })
  return record.church.slug
}
```

Invalidate cache when a domain is added, verified, or removed.

---

## Environment Variables

```env
NEXT_PUBLIC_ROOT_DOMAIN=digitalchurch.com   # or localhost:3000 for dev
VERCEL_TOKEN=your_vercel_api_token
VERCEL_PROJECT_ID=your_project_id
VERCEL_TEAM_ID=your_team_id                 # if using Vercel Teams
```
