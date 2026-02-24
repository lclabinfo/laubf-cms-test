# Website Rendering — Implementation Guide

## Detailed Implementation Plan for the Shared Rendering Architecture

> **Current state** (February 2026): Two separate Next.js apps — CMS admin (root) and public website (`laubf-test/`). Database schema exists with 32 models and 22 enums. DAL (14 modules at `lib/dal/`) and API routes (15 files at `app/api/v1/`) are built. CMS integration complete (context providers wired to API). 38 section components exist in `laubf-test/src/components/sections/`. Public website still uses mock data. No middleware, no tenant resolution, no caching layer yet. Church ID resolution uses `CHURCH_SLUG` env var (not `CHURCH_ID`) via `lib/api/get-church-id.ts`.

---

## 1. Project Structure — Target State

Starting from the existing codebase, here's the target directory structure with the website rendering layer added. The `(website)` route group and website components are **new additions** to the root project:

```
app/
├── (marketing)/                    ← Platform landing site (lclab.io)
│   ├── layout.tsx
│   ├── page.tsx                    ← Landing page
│   ├── pricing/page.tsx
│   ├── register/page.tsx           ← Church signup flow
│   └── login/page.tsx
│
├── (website)/                      ← Public church websites (NEW)
│   ├── layout.tsx                  ← Injects theme, navbar, footer per church
│   └── [[...slug]]/page.tsx        ← Catch-all: renders any page from DB
│
├── (admin)/                        ← CMS dashboard (currently at app/cms/, will be reorganized)
│   ├── layout.tsx                  ← Admin sidebar, auth guard
│   ├── dashboard/page.tsx
│   ├── messages/...
│   ├── events/...
│   ├── website/                    ← Website builder admin (NEW)
│   │   ├── pages/                  ← Page list + editor
│   │   │   ├── page.tsx            ← List all pages
│   │   │   └── [slug]/edit/page.tsx ← Section editor
│   │   ├── navigation/page.tsx     ← Menu editor (exists as placeholder)
│   │   └── theme/page.tsx          ← Theme customizer (exists as placeholder)
│   └── settings/
│       └── general/page.tsx        ← Site settings
│
├── api/v1/...                      ← Shared API routes (existing)
└── middleware.ts                   ← Tenant resolution + routing (NEW)

components/
├── admin/                          ← CMS admin components (existing)
├── marketing/                      ← Platform marketing components (future)
├── ui/                             ← shadcn/ui primitives (existing)
└── website/                        ← Public website components (NEW)
    ├── layout/
    │   ├── website-navbar.tsx       ← Dynamic navbar from Menu table
    │   └── website-footer.tsx       ← Dynamic footer from SiteSettings
    ├── sections/                   ← Section component library
    │   ├── registry.tsx            ← Maps SectionType → component
    │   ├── section-wrapper.tsx     ← Shared wrapper (padding, color scheme)
    │   ├── hero-banner.tsx
    │   ├── media-text.tsx
    │   ├── all-messages.tsx
    │   └── ... (38 section types, migrated from laubf-test)
    └── theme/
        └── theme-provider.tsx       ← CSS variable injection

lib/
├── db/                             ← Database layer (existing)
│   ├── client.ts
│   └── types.ts
├── dal/                            ← Data access layer (existing)
│   ├── messages.ts
│   ├── events.ts
│   ├── pages.ts
│   ├── menus.ts
│   ├── site-settings.ts
│   ├── theme.ts
│   └── index.ts
├── tenant/                         ← Tenant resolution (NEW)
│   ├── context.ts                  ← Request-scoped church ID
│   ├── resolve.ts                  ← Domain → church_id resolution
│   └── types.ts
├── cache/                          ← Caching layer (NEW, deferred)
│   ├── client.ts                   ← Redis connection (when needed)
│   ├── keys.ts                     ← Cache key generators
│   └── invalidate.ts              ← Cache invalidation helpers
├── validators/                     ← Zod schemas for JSONB content (NEW)
│   └── sections.ts
└── types/
    ├── sections.ts                 ← JSONB content type definitions
    └── ...
```

---

## 2. Middleware — The Routing Layer

The middleware runs on every request and determines: which route group to use, which church (if any) the request belongs to, and whether authentication is needed.

### For Single-Tenant MVP (Phase A)

During the single-tenant phase, the middleware is minimal — no hostname resolution needed:

```typescript
// middleware.ts (single-tenant MVP)
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Admin routes need auth (future)
  if (pathname.startsWith('/cms') || pathname.startsWith('/api/v1')) {
    // For now, pass through. Auth middleware added later.
    return NextResponse.next()
  }

  // All other routes are public website
  // Set the church context from env var
  const headers = new Headers(request.headers)
  headers.set('x-tenant-id', process.env.CHURCH_SLUG || '')

  return NextResponse.next({ headers })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',],
}
```

### For Multi-Tenant (Phase C)

```typescript
// middleware.ts (multi-tenant)
import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_DOMAINS = ['lclab.io', 'www.lclab.io']
const ADMIN_PATH_PREFIX = '/cms'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // 1. Platform marketing site
  if (PLATFORM_DOMAINS.includes(hostname)) {
    return NextResponse.next() // Falls through to (marketing) routes
  }

  // 2. Resolve tenant from hostname
  const churchId = await resolveChurchId(hostname)

  if (!churchId) {
    return NextResponse.redirect(new URL('https://lclab.io'))
  }

  // 3. Set tenant context header
  const headers = new Headers(request.headers)
  headers.set('x-tenant-id', churchId)

  // 4. Admin routes — rewrite to (admin) route group
  if (pathname.startsWith(ADMIN_PATH_PREFIX)) {
    return NextResponse.next({ headers })
  }

  // 5. Public website routes — rewrite to (website) route group
  const url = request.nextUrl.clone()
  url.pathname = `/_website${pathname}`
  return NextResponse.rewrite(url, { headers })
}

async function resolveChurchId(hostname: string): Promise<string | null> {
  // Priority 1: Custom domain lookup (cached in-memory + Redis)
  const customDomain = await lookupCustomDomain(hostname)
  if (customDomain) return customDomain.churchId

  // Priority 2: Subdomain extraction
  const subdomain = extractSubdomain(hostname, 'lclab.io')
  if (subdomain) {
    const church = await lookupChurchBySlug(subdomain)
    return church?.id || null
  }

  return null
}
```

### Tenant Context for Server Components

```typescript
// lib/tenant/context.ts
import { headers } from 'next/headers'

export async function getChurchId(): Promise<string> {
  const headersList = await headers()
  const churchId = headersList.get('x-tenant-id')
  if (!churchId) {
    // Fallback for single-tenant MVP: resolve by slug from env
    const slug = process.env.CHURCH_SLUG || 'la-ubf'
    const { prisma } = await import('@/lib/db/client')
    const church = await prisma.church.findUnique({ where: { slug } })
    if (!church) throw new Error(`Church not found: ${slug}`)
    return church.id
  }
  return churchId
}
```

> **Note**: In Next.js 16, `headers()` is async and must be awaited.

---

## 3. The Website Layout

The `(website)/layout.tsx` runs on every public page load. It fetches the church's branding, theme, and navigation, then wraps the page content.

```typescript
// app/(website)/layout.tsx
import { getChurchId } from '@/lib/tenant/context'
import { getSiteSettings } from '@/lib/dal/site-settings'
import { getThemeWithCustomization } from '@/lib/dal/theme'
import { getMenuByLocation } from '@/lib/dal/menus'
import { WebsiteNavbar } from '@/components/website/layout/website-navbar'
import { WebsiteFooter } from '@/components/website/layout/website-footer'
import { ThemeProvider } from '@/components/website/theme/theme-provider'

export default async function WebsiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const churchId = await getChurchId()

  // Parallel data fetching — all tenant-scoped
  const [siteSettings, theme, headerMenu, footerMenu] = await Promise.all([
    getSiteSettings(churchId),
    getThemeWithCustomization(churchId),
    getMenuByLocation(churchId, 'HEADER'),
    getMenuByLocation(churchId, 'FOOTER'),
  ])

  if (!siteSettings) {
    return <SetupRequiredPage />
  }

  return (
    <ThemeProvider theme={theme}>
      <WebsiteNavbar
        menu={headerMenu}
        logo={siteSettings.logoUrl}
        siteName={siteSettings.siteName}
      />
      <main>{children}</main>
      <WebsiteFooter
        menu={footerMenu}
        siteSettings={siteSettings}
      />
    </ThemeProvider>
  )
}
```

### Theme Provider

Converts database theme values into CSS custom properties:

```typescript
// components/website/theme/theme-provider.tsx
import type { ThemeWithCustomization } from '@/lib/dal/theme'

interface ThemeProviderProps {
  theme: ThemeWithCustomization | null
  children: React.ReactNode
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const tokens: Record<string, string> = {
    '--color-primary': theme?.primaryColor || '#1a1a2e',
    '--color-secondary': theme?.secondaryColor || '#16213e',
    '--color-background': theme?.backgroundColor || '#ffffff',
    '--color-text': theme?.textColor || '#1a1a1a',
    '--color-heading': theme?.headingColor || '#0a0a0a',
    '--font-heading': theme?.headingFont || 'Inter',
    '--font-body': theme?.bodyFont || 'Source Sans Pro',
    '--font-size-base': `${theme?.baseFontSize || 16}px`,
    '--border-radius': theme?.borderRadius || '0.5rem',
    // Spread org-specific token overrides from JSONB
    ...(theme?.tokenOverrides as Record<string, string> || {}),
  }

  return (
    <div style={tokens as React.CSSProperties}>
      {children}
    </div>
  )
}
```

---

## 4. The Catch-All Page Route

This single route handles every page on every church's website.

```typescript
// app/(website)/[[...slug]]/page.tsx
import { notFound } from 'next/navigation'
import { getChurchId } from '@/lib/tenant/context'
import { getPageBySlug } from '@/lib/dal/pages'
import { SectionRenderer } from '@/components/website/sections/registry'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug?: string[] }>
}

export default async function ChurchPage({ params }: PageProps) {
  const { slug } = await params
  const churchId = await getChurchId()
  const slugPath = slug ? `/${slug.join('/')}` : '/'

  const page = await getPageBySlug(churchId, slugPath)
  if (!page || !page.isPublished) return notFound()

  return (
    <>
      {page.sections
        .filter(section => section.visible)
        .map(section => (
          <SectionRenderer
            key={section.id}
            type={section.sectionType}
            content={section.content}
            colorScheme={section.colorScheme}
            paddingY={section.paddingY}
            containerWidth={section.containerWidth}
            enableAnimations={section.enableAnimations}
            churchId={churchId}
          />
        ))}
    </>
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const churchId = await getChurchId()
  const slugPath = slug ? `/${slug.join('/')}` : '/'
  const page = await getPageBySlug(churchId, slugPath)

  if (!page) return {}

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription,
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || undefined,
      images: page.ogImageUrl ? [page.ogImageUrl] : undefined,
    },
    robots: page.noIndex ? { index: false } : undefined,
  }
}
```

> **Note**: In Next.js 16, `params` is a Promise and must be awaited.

---

## 5. Section Component Registry

The registry maps every `SectionType` enum value to a React component. All section components are React Server Components — no `lazy()` needed.

```typescript
// components/website/sections/registry.tsx
import type { SectionType, ColorScheme, PaddingSize, ContainerWidth } from '@/lib/db/types'
import { SectionWrapper } from './section-wrapper'

// Import section components directly (they're RSCs, tree-shaking handles bundle)
import HeroBannerSection from './hero-banner'
import MediaTextSection from './media-text'
import AllMessagesSection from './all-messages'
import AllEventsSection from './all-events'
import SpotlightMediaSection from './spotlight-media'
import CTABannerSection from './cta-banner'
// ... import all 38 section components

const SECTION_COMPONENTS: Partial<Record<SectionType, React.ComponentType<any>>> = {
  HERO_BANNER: HeroBannerSection,
  MEDIA_TEXT: MediaTextSection,
  ALL_MESSAGES: AllMessagesSection,
  ALL_EVENTS: AllEventsSection,
  SPOTLIGHT_MEDIA: SpotlightMediaSection,
  CTA_BANNER: CTABannerSection,
  // ... all 38 section types
}

interface SectionRendererProps {
  type: SectionType
  content: Record<string, any>
  colorScheme: ColorScheme
  paddingY: PaddingSize
  containerWidth: ContainerWidth
  enableAnimations: boolean
  churchId: string
}

export function SectionRenderer({
  type,
  content,
  colorScheme,
  paddingY,
  containerWidth,
  enableAnimations,
  churchId,
}: SectionRendererProps) {
  const Component = SECTION_COMPONENTS[type]
  if (!Component) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Unknown section type: ${type}`)
    }
    return null
  }

  return (
    <SectionWrapper
      colorScheme={colorScheme}
      paddingY={paddingY}
      containerWidth={containerWidth}
    >
      <Component
        content={content}
        churchId={churchId}
        enableAnimations={enableAnimations}
      />
    </SectionWrapper>
  )
}
```

### Why RSC Instead of Lazy Loading

The original doc used `React.lazy()` for code splitting. For our architecture, direct imports with RSC are better:

1. **Section components are React Server Components** — they render on the server, not the client. `lazy()` is a client-side concept.
2. **Dynamic sections fetch data** — they're `async` components that query the database. `lazy()` doesn't work with async server components.
3. **Tree-shaking** handles dead code elimination automatically — unused section types won't be bundled.
4. **Suspense boundaries** can still be added at the page level for streaming if needed.

---

## 6. Building a Section Component

Each section component receives its JSONB `content` as props and renders accordingly.

### Static Section Example: Hero Banner

```typescript
// components/website/sections/hero-banner.tsx
import Image from 'next/image'

interface HeroBannerContent {
  heading: { line1: string; line2: string }
  subheading?: string
  primaryButton?: { label: string; href: string; visible: boolean }
  secondaryButton?: { label: string; href: string; visible: boolean }
  backgroundImage?: { src: string; alt: string }
}

interface Props {
  content: HeroBannerContent
  enableAnimations: boolean
}

export default function HeroBannerSection({ content }: Props) {
  const { heading, subheading, primaryButton, secondaryButton, backgroundImage } = content

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center">
      {backgroundImage && (
        <Image
          src={backgroundImage.src}
          alt={backgroundImage.alt}
          fill
          className="object-cover"
          priority
        />
      )}
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 text-center text-white px-4 max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}>
          {heading.line1}<br />{heading.line2}
        </h1>
        {subheading && <p className="text-lg md:text-xl mb-8 opacity-90">{subheading}</p>}
        <div className="flex gap-4 justify-center flex-wrap">
          {primaryButton?.visible && (
            <a href={primaryButton.href}
               className="px-8 py-3 rounded-md font-semibold"
               style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
              {primaryButton.label}
            </a>
          )}
          {secondaryButton?.visible && (
            <a href={secondaryButton.href}
               className="px-8 py-3 rounded-md font-semibold border border-white">
              {secondaryButton.label}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
```

### Dynamic Section Example: All Messages

This section is an async RSC that fetches live data:

```typescript
// components/website/sections/all-messages.tsx
import { getMessages } from '@/lib/dal/messages'
import { getSpeakers } from '@/lib/dal/speakers'
import { getAllSeries } from '@/lib/dal/series'

interface AllMessagesContent {
  heading?: string
}

interface Props {
  content: AllMessagesContent
  churchId: string
}

export default async function AllMessagesSection({ content, churchId }: Props) {
  const { heading = 'Messages' } = content

  const [messages, speakers, series] = await Promise.all([
    getMessages(churchId, { status: 'PUBLISHED', pageSize: 12 }),
    getSpeakers(churchId),
    getAllSeries(churchId),
  ])

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
          {heading}
        </h2>
      </div>
      {/* MessageFilters is a client component for interactivity */}
      {/* MessageGrid renders the message cards */}
      {/* These use the same components from laubf-test, migrated over */}
    </div>
  )
}
```

---

## 7. Data Access Layer for Website Queries

The existing DAL at `lib/dal/` already has the functions needed. Key patterns for website rendering:

```typescript
// lib/dal/pages.ts — getPageBySlug already exists
// Needs: include sections, ordered by sortOrder
export async function getPageBySlug(churchId: string, slug: string) {
  return prisma.page.findFirst({
    where: {
      churchId,
      slug,
      isPublished: true,
      deletedAt: null,
    },
    include: {
      sections: {
        where: { visible: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
}

// lib/dal/theme.ts — new, needed for website layout
export async function getThemeWithCustomization(churchId: string) {
  return prisma.themeCustomization.findUnique({
    where: { churchId },
    include: { theme: true },
  })
}
```

### Adding Caching (When Needed)

For the single-tenant MVP, no caching is needed — Prisma queries are fast enough. When scaling to multiple churches, wrap DAL functions with Next.js `unstable_cache`:

```typescript
import { unstable_cache } from 'next/cache'

export const getCachedSiteSettings = unstable_cache(
  async (churchId: string) => getSiteSettings(churchId),
  ['site-settings'],
  { tags: ['site-settings'], revalidate: 3600 }
)
```

Cache invalidation from CMS writes:

```typescript
// In API route after CMS write
import { revalidateTag } from 'next/cache'

// After updating site settings
revalidateTag(`church:${churchId}:site-settings`)

// After updating any CMS content
revalidateTag(`church:${churchId}:content`)
```

---

## 8. Cache Invalidation Strategy

### Next.js Tag-Based Revalidation (Recommended for MVP)

Use Next.js's built-in tag system instead of Redis for the first stage:

```typescript
// lib/cache/invalidate.ts
import { revalidateTag } from 'next/cache'

export function invalidateOnContentChange(churchId: string, entity: string) {
  // Invalidate entity-specific cache
  revalidateTag(`church:${churchId}:${entity}`)

  // Dynamic sections that display this content also need refresh
  const ENTITIES_THAT_AFFECT_PAGES = [
    'messages', 'events', 'bible-studies', 'videos', 'daily-bread',
    'speakers', 'series', 'campuses', 'ministries',
  ]

  if (ENTITIES_THAT_AFFECT_PAGES.includes(entity)) {
    revalidateTag(`church:${churchId}:pages`)
  }
}
```

### Redis Caching (Added at Scale)

When traffic justifies it, add Redis as a query-level cache in front of the database:

```typescript
// lib/cache/client.ts (added when needed)
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
})

export const cache = {
  async getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = await redis.get(key)
    if (cached !== null) return cached as T

    const data = await fetcher()
    redis.set(key, JSON.stringify(data), { ex: ttlSeconds }).catch(console.error)
    return data
  },

  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(...keys)
  },
}
```

---

## 9. JSONB Content Validation

The JSONB `content` field on `PageSection` needs validation. Define Zod schemas for each section type:

```typescript
// lib/validators/sections.ts
import { z } from 'zod'

const buttonSchema = z.object({
  label: z.string(),
  href: z.string(),
  visible: z.boolean().optional().default(true),
})

const imageSchema = z.object({
  src: z.string(),
  alt: z.string(),
})

export const heroBannerSchema = z.object({
  heading: z.object({ line1: z.string(), line2: z.string() }),
  subheading: z.string().optional(),
  primaryButton: buttonSchema.optional(),
  secondaryButton: buttonSchema.optional(),
  backgroundImage: imageSchema.optional(),
})

export const allMessagesSchema = z.object({
  heading: z.string().optional(),
})

// Map section types to validators
export const SECTION_VALIDATORS: Record<string, z.ZodSchema> = {
  HERO_BANNER: heroBannerSchema,
  ALL_MESSAGES: allMessagesSchema,
  // ... all section types
}

export function validateSectionContent(type: string, content: unknown) {
  const validator = SECTION_VALIDATORS[type]
  if (!validator) throw new Error(`No validator for section type: ${type}`)
  return validator.parse(content)
}
```

Validation runs when CMS admins create or edit sections through the page builder API.

---

## 10. Implementation Order

Build in this order. Each step is independently testable.

### Step 1: Tenant Context Helper
Create `lib/tenant/context.ts` with `getChurchId()` that reads from env var (single-tenant MVP). No middleware needed yet.

### Step 2: Website Layout
Create `app/(website)/layout.tsx` with theme provider, navbar, and footer. Start with data from the database (site settings, theme, menus). The DAL functions already exist.

### Step 3: Catch-All Page Route
Create `app/(website)/[[...slug]]/page.tsx` that fetches pages and sections from the database.

### Step 4: Section Registry + Migrate First 5 Sections
Create `components/website/sections/registry.tsx` and migrate the 5 most critical sections from `laubf-test/`: `HERO_BANNER`, `MEDIA_TEXT`, `ALL_MESSAGES`, `ALL_EVENTS`, `CTA_BANNER`. Adapt them to read JSONB props instead of TypeScript interfaces.

### Step 5: Seed Default Pages
Update `prisma/seed.ts` to create Page and PageSection records for the LA UBF site. The section JSONB content comes from the current page data (documented in doc 03, section 11).

### Step 6: Migrate Remaining 33 Section Components
Migrate the rest of the section components from `laubf-test/`. Group by priority:
- **P0**: SpotlightMedia, UpcomingEvents, HighlightCards, FAQSection, FormSection, EventCalendar (homepage + key pages)
- **P1**: AllBibleStudies, AllVideos, RecurringMeetings, RecurringSchedule, MinistryHero, MinistrySchedule, CampusCardGrid (ministry pages)
- **P2**: Everything else (About-specific, timeline, gallery, etc.)

### Step 7: Middleware (Multi-Tenant)
Add `middleware.ts` with tenant resolution from hostname. This enables multiple churches.

### Step 8: Caching Layer
Add Next.js tag-based caching with `revalidateTag()` for on-demand invalidation. Redis comes later.

### Step 9: Page Builder Admin
Build the CMS admin UI for managing pages: list pages, create page, edit page sections (add/remove/reorder), configure section content.

### Step 10: Theme Customizer + Menu Editor
Build the admin UIs for customizing the theme tokens and editing navigation menus.

---

## 11. Local Development Setup

### Single-Tenant MVP (No Middleware)

For local development with one church:

```env
# .env
CHURCH_SLUG=la-ubf
```

Visit `http://localhost:3000/messages` — the `getChurchId()` helper reads `CHURCH_SLUG` from the env var and resolves the church UUID via a database lookup.

### Multi-Tenant Development (With Middleware)

Add to `/etc/hosts`:
```
127.0.0.1  la-ubf.localhost
127.0.0.1  grace.localhost
```

Update `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  // Allow subdomains on localhost
  async headers() {
    return [{ source: '/:path*', headers: [{ key: 'X-DNS-Prefetch-Control', value: 'on' }] }]
  },
}
```

Then visit `http://la-ubf.localhost:3000/messages` — the middleware extracts "la-ubf" from the hostname and resolves it to the church ID.

---

## 12. Migration Checklist: laubf-test → Root Project

When moving from two apps to one, track these migrations:

- [ ] Section components: `laubf-test/src/components/sections/` → `components/website/sections/`
- [ ] Section types: `laubf-test/src/lib/types/sections.ts` → `lib/types/sections.ts`
- [ ] Navbar/Footer: `laubf-test/src/components/layout/` → `components/website/layout/`
- [ ] Theme utilities: `laubf-test/src/lib/theme.ts` → `lib/theme.ts`
- [ ] Global styles: Merge `laubf-test/src/app/globals.css` website-specific styles into root `app/globals.css`
- [ ] Font configuration: Move Google Fonts setup to root `app/(website)/layout.tsx`
- [ ] Mock data removal: Delete `laubf-test/src/lib/mock-data/` after confirming all pages work from DB
- [ ] Static assets: Move `laubf-test/public/` images/videos to root `public/` or CDN

Each item can be migrated independently. Test after each migration.
