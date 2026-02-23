# AI-Optimized Next Steps — Website Rendering

## Phased Implementation Prompts for Claude Code Agent Teams

This document provides copy-paste-ready prompts for implementing the website rendering pipeline — the system that connects CMS content to the public-facing church websites. Each prompt is self-contained and can be given directly to a Claude Code agent.

> **Current state of the project** (as of February 2026):
> - **Root project** (`/Users/davidlim/Desktop/laubf-cms-test`): CMS admin with working pages, API routes at `/api/v1/`, DAL at `lib/dal/`, Prisma schema with 32 models, seed script
> - **Public website** (`/laubf-test/`): Separate Next.js app with 38 section components, 29+ pages, all using **mock data** from `src/lib/mock-data/`
> - **Database**: PostgreSQL with seeded LA UBF data (messages, events, bible studies, videos, daily bread, speakers, series, ministries, campuses)
> - **NOT built yet**: middleware.ts, tenant resolution, (website) route group, section registry, website builder admin, caching layer, theme provider
> - Tech stack: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Prisma 7.4.1

> **Architecture docs to reference**:
> - `docs/website-rendering/05-website-rendering-architecture.md` — Overall rendering architecture
> - `docs/website-rendering/06-website-rendering-implementation.md` — Implementation details
> - `docs/website-rendering/07-cms-website-connection.md` — CMS ↔ Website data flow
> - `docs/website-rendering/08-development-phases.md` — Development phases and fidelity guide
> - `docs/database/03-website-database-schema.md` — Page, PageSection, Menu, Theme schemas + JSONB examples

---

## Phase A: Single-Tenant Rendering in laubf-test

### Phase A.1: Set Up Prisma in laubf-test

**Effort**: S (2-3 hours)
**Dependencies**: Database must be running with seeded data (Phase 1.2 and 1.3 from database docs)
**What this does**: Gives the public website (`laubf-test/`) access to the same PostgreSQL database that the CMS uses. The public website will read data; the CMS will write data. Both share the same schema.

#### Prompt:

> The public website at `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/` needs to read from the same PostgreSQL database as the CMS admin (root project). Set up Prisma in laubf-test to share the database.
>
> **Read first**:
> - `/Users/davidlim/Desktop/laubf-cms-test/prisma/schema.prisma` — the existing schema
> - `/Users/davidlim/Desktop/laubf-cms-test/lib/db/client.ts` — the root project's Prisma client singleton
> - `/Users/davidlim/Desktop/laubf-cms-test/.env` — the database connection string
>
> **1. Install Prisma in laubf-test**:
> ```
> cd /Users/davidlim/Desktop/laubf-cms-test/laubf-test
> npm install prisma @prisma/client
> ```
>
> **2. Create a symlink or copy of the schema**:
> Create `laubf-test/prisma/schema.prisma` that is identical to the root's schema. To avoid duplication drift, prefer a symlink:
> ```
> mkdir -p laubf-test/prisma
> cp prisma/schema.prisma laubf-test/prisma/schema.prisma
> ```
> If Prisma 7.x requires a `prisma.config.ts`, create that too — copy from root and adjust paths.
>
> **3. Generate the Prisma client**:
> ```
> cd laubf-test
> npx prisma generate
> ```
>
> **4. Create the Prisma client singleton** at `laubf-test/src/lib/db/client.ts`:
> Use the same singleton pattern as the root project, but adjusted for laubf-test's import paths.
>
> **5. Create `.env`** in laubf-test (or `.env.local`) with the same `DATABASE_URL` and `DIRECT_URL` from the root `.env`.
>
> **6. Create a church ID helper** at `laubf-test/src/lib/get-church-id.ts`:
> ```typescript
> import { prisma } from '@/lib/db/client'
>
> let cachedChurchId: string | null = null
>
> export async function getChurchId(): Promise<string> {
>   if (cachedChurchId) return cachedChurchId
>   const slug = process.env.CHURCH_SLUG || 'la-ubf'
>   const church = await prisma.church.findUnique({ where: { slug } })
>   if (!church) throw new Error(`Church not found: ${slug}`)
>   cachedChurchId = church.id
>   return church.id
> }
> ```
>
> Add `CHURCH_SLUG=la-ubf` to laubf-test's `.env`.
>
> **7. Create a read-only DAL** at `laubf-test/src/lib/dal/`. Copy the existing DAL modules from the root `lib/dal/` and adjust imports to use laubf-test's Prisma client. Only copy the read functions — the public website doesn't need create/update/delete. Key modules:
> - `messages.ts` — getMessages, getMessageBySlug, getLatestMessage
> - `events.ts` — getEvents, getEventBySlug, getUpcomingEvents, getRecurringEvents, getFeaturedEvents
> - `bible-studies.ts` — getBibleStudies, getBibleStudyBySlug
> - `videos.ts` — getVideos, getVideoBySlug
> - `daily-bread.ts` — getTodaysDailyBread, getDailyBreadByDate
> - `speakers.ts` — getSpeakers
> - `series.ts` — getAllSeries
> - `ministries.ts` — getMinistries
> - `campuses.ts` — getCampuses
> - `index.ts` — barrel export
>
> **Important constraints:**
> - Do NOT modify the root project's files
> - Do NOT run `prisma migrate` in laubf-test — only `prisma generate`
> - The laubf-test Prisma client must be read-only in practice (no writes from the public website)
> - Verify the Prisma client can connect by running a simple query

#### Verification:
- [ ] `laubf-test/prisma/schema.prisma` exists
- [ ] `laubf-test/src/lib/db/client.ts` exists with singleton pattern
- [ ] `laubf-test/src/lib/get-church-id.ts` exists
- [ ] `laubf-test/src/lib/dal/` has all read-only modules
- [ ] `npx prisma generate` succeeds in laubf-test
- [ ] A test import of `getChurchId()` resolves the LA UBF church ID from the database
- [ ] DAL functions return data (e.g., `getMessages(churchId)` returns seeded messages)

---

### Phase A.2: Replace Mock Data in Public Website Pages

**Effort**: L (3-5 days)
**Dependencies**: Phase A.1
**What this does**: Switches every page in the public website from mock data arrays to real database queries via the DAL. After this, content published in the CMS appears on the public website.

#### Prompt:

> The public website at `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/` currently imports mock data from `src/lib/mock-data/`. Replace ALL mock data imports with DAL function calls so pages render content from PostgreSQL.
>
> **Read these files first** to understand the current data flow:
> - `laubf-test/src/lib/mock-data/messages.ts` — mock message data and helper functions
> - `laubf-test/src/lib/mock-data/events.ts` — mock event data
> - `laubf-test/src/lib/mock-data/bible-studies.ts` — mock bible study data
> - `laubf-test/src/lib/mock-data/videos.ts` — mock video data
> - `laubf-test/src/lib/mock-data/daily-bread.ts` — mock daily bread data
>
> **Also read the TypeScript type definitions** the components expect:
> - `laubf-test/src/lib/types/message.ts`
> - `laubf-test/src/lib/types/events.ts`
> - `laubf-test/src/lib/types/bible-study.ts`
> - `laubf-test/src/lib/types/video.ts`
> - `laubf-test/src/lib/types/daily-bread.ts`
>
> **For each page, follow this pattern:**
>
> 1. Read the page file to understand what mock data it imports
> 2. Read the section components the page uses (in `src/components/sections/`)
> 3. Make the page component `async` (Server Component)
> 4. Replace mock data import with DAL call:
>    ```typescript
>    // Before:
>    import { MOCK_MESSAGES } from '@/lib/mock-data/messages'
>    const messages = MOCK_MESSAGES
>
>    // After:
>    import { getMessages } from '@/lib/dal/messages'
>    import { getChurchId } from '@/lib/get-church-id'
>    const churchId = await getChurchId()
>    const messages = await getMessages(churchId)
>    ```
>
> 5. If the Prisma return type differs from the mock data type, create an adapter function. Common differences:
>    - `speaker: string` (mock) vs `speaker: { name: string, slug: string }` (Prisma)
>    - `series: string` (mock) vs `messageSeries: [{ series: { name: string } }]` (Prisma)
>    - `ministry: string` (mock) vs `ministry: { name: string, slug: string } | null` (Prisma)
>    - `campus: string` (mock) vs `campus: { name: string, slug: string } | null` (Prisma)
>    - Date strings vs Date objects
>    - Lowercase enum values vs UPPER_CASE enum values
>
> **Pages to update (in priority order):**
>
> 1. `/messages` page (`src/app/messages/page.tsx`) + `/messages/[slug]` detail page
> 2. `/events` page + `/events/[slug]` detail page
> 3. `/bible-study` page + `/bible-study/[slug]` detail page
> 4. `/videos` page
> 5. `/daily-bread` page
> 6. Homepage (`src/app/page.tsx`) — has SpotlightMedia, HighlightCards, UpcomingEvents, EventCalendar, RecurringMeetings, MediaGrid sections that fetch data
> 7. Ministry/campus pages (`/ministries/college`, `/ministries/campus/lbcc`, etc.)
>
> **Section components that need updating** (they receive data from pages as props, or fetch their own):
> - Read each section component in `src/components/sections/` to understand if it fetches data or receives it as props
> - If a section receives data from the page, update the page to pass database data
> - If a section fetches its own data, update it to use DAL instead of mock data
>
> **Important constraints:**
> - Preserve ALL existing styling and layout — zero visual regressions
> - Remove `generateStaticParams` from dynamic pages and add `export const dynamic = 'force-dynamic'` for now (ISR optimization comes later)
> - Handle the case where database returns no data gracefully (empty states)
> - Do NOT delete mock data files — keep as reference
> - Do NOT modify the root project
> - Every page must work with `npm run dev` and `npm run build`
>
> **Adapter function example** (put in `laubf-test/src/lib/adapters/`):
> ```typescript
> // src/lib/adapters/message.ts
> import type { Message as PrismaMessage, Speaker, Series, MessageSeries } from '@prisma/client'
> import type { Message as UIMessage } from '@/lib/types/message'
>
> type MessageWithRelations = PrismaMessage & {
>   speaker: Speaker | null
>   messageSeries: (MessageSeries & { series: Series })[]
> }
>
> export function adaptMessage(m: MessageWithRelations): UIMessage {
>   return {
>     id: m.id,
>     slug: m.slug,
>     title: m.title,
>     passage: m.passage || '',
>     speaker: m.speaker?.name || 'Unknown',
>     series: m.messageSeries[0]?.series.name || '',
>     dateFor: m.dateFor.toISOString().split('T')[0],
>     description: m.description || '',
>     youtubeId: m.youtubeId || '',
>     thumbnailUrl: m.thumbnailUrl || (m.youtubeId ? `https://img.youtube.com/vi/${m.youtubeId}/maxresdefault.jpg` : ''),
>     duration: m.duration || '',
>     rawTranscript: m.rawTranscript || undefined,
>     liveTranscript: m.liveTranscript || undefined,
>     // ... map remaining fields
>   }
> }
> ```

#### Verification:
- [ ] `/messages` page loads and displays messages from the database
- [ ] `/messages/[slug]` page shows correct message detail
- [ ] `/events` page shows events from database
- [ ] `/events/[slug]` page shows correct event detail
- [ ] `/bible-study` and `/bible-study/[slug]` work with database
- [ ] `/videos` page works with database
- [ ] `/daily-bread` page works with database
- [ ] Homepage sections show database content
- [ ] Ministry and campus pages work
- [ ] Zero visual regressions on any page
- [ ] `npm run build` succeeds in laubf-test

---

## Phase B: Section Registry & App Consolidation

### Phase B.1: Create Website Route Group and Section Registry

**Effort**: L (3-5 days)
**Dependencies**: Phase A.2 (public website working from DB)
**What this does**: Creates the `(website)` route group in the root project with the catch-all page route and section renderer. This is the unified rendering architecture described in doc 05.

#### Prompt:

> Create the website rendering infrastructure in the root project at `/Users/davidlim/Desktop/laubf-cms-test/`. This adds the `(website)` route group and section component system that renders public church websites from database-stored page configurations.
>
> **Read these architecture docs first**:
> - `/docs/website-rendering/05-website-rendering-architecture.md` — overall architecture
> - `/docs/website-rendering/06-website-rendering-implementation.md` — implementation details (sections 2-6)
> - `/docs/database/03-website-database-schema.md` — Page, PageSection, Menu, Theme schemas
>
> **Read the existing section components** to understand what needs to be migrated:
> - List all files in `laubf-test/src/components/sections/` — 38 components
> - Read `laubf-test/src/lib/types/sections.ts` — TypeScript types for section JSONB content
>
> **Step 1: Create the tenant context helper**
>
> Create `lib/tenant/context.ts`:
> ```typescript
> import { headers } from 'next/headers'
>
> export async function getChurchId(): Promise<string> {
>   const headersList = await headers()
>   const churchId = headersList.get('x-tenant-id')
>   if (churchId) return churchId
>
>   // Fallback for single-tenant MVP
>   const envChurchId = process.env.CHURCH_ID
>   if (envChurchId) return envChurchId
>
>   // Fallback: look up by slug
>   const slug = process.env.CHURCH_SLUG || 'la-ubf'
>   const { prisma } = await import('@/lib/db/client')
>   const church = await prisma.church.findUnique({ where: { slug } })
>   if (!church) throw new Error(`Church not found: ${slug}`)
>   return church.id
> }
> ```
>
> **Step 2: Create the section wrapper**
>
> Create `components/website/sections/section-wrapper.tsx` — see doc 06 section 5 for the implementation. Uses `ColorScheme`, `PaddingSize`, `ContainerWidth` from the Prisma types.
>
> **Step 3: Create the section registry**
>
> Create `components/website/sections/registry.tsx` — maps `SectionType` enum values to React components. Start with the 6 most critical sections. Use direct imports (not lazy loading — these are RSCs).
>
> **Step 4: Migrate the first 6 section components**
>
> Copy these from `laubf-test/src/components/sections/` to `components/website/sections/`:
> - `HeroBannerSection.tsx` → `hero-banner.tsx`
> - `MediaTextSection.tsx` → `media-text.tsx`
> - `AllMessagesSection.tsx` → `all-messages.tsx`
> - `AllEventsSection.tsx` → `all-events.tsx`
> - `SpotlightMediaSection.tsx` → `spotlight-media.tsx`
> - `CTABannerSection.tsx` → `cta-banner.tsx`
>
> For each migrated component:
> - Update imports to use root project paths (`@/lib/dal/`, `@/components/ui/`, etc.)
> - Change the component to receive JSONB `content` as props (matching doc 03 section 4 JSONB structures)
> - For dynamic sections, make them `async` RSCs that call DAL functions with `churchId`
> - For static sections, keep them as regular RSCs that render from JSONB
> - Preserve all existing styling
>
> **Step 5: Create the website layout**
>
> Create `app/(website)/layout.tsx` — see doc 06 section 3. Fetches SiteSettings, ThemeCustomization, and Menu data.
>
> For the navbar and footer, create simplified versions initially:
> - `components/website/layout/website-navbar.tsx` — reads from Menu + SiteSettings
> - `components/website/layout/website-footer.tsx` — reads from SiteSettings
>
> **Step 6: Create the catch-all page route**
>
> Create `app/(website)/[[...slug]]/page.tsx` — see doc 06 section 4. Note that in Next.js 16, `params` is a Promise.
>
> **Step 7: Create the theme provider**
>
> Create `components/website/theme/theme-provider.tsx` — see doc 06 section 3.
>
> **Step 8: Add DAL functions for website-specific queries**
>
> If not already present in `lib/dal/`, add:
> - `lib/dal/theme.ts` — `getThemeWithCustomization(churchId)`
> - Update `lib/dal/pages.ts` — `getPageBySlug(churchId, slug)` must include sections ordered by sortOrder
> - Update `lib/dal/menus.ts` — `getMenuByLocation(churchId, location)` must include nested items
>
> **Step 9: Seed Page + PageSection records**
>
> Update `prisma/seed.ts` (or create a separate seed file) to create:
> - Page records for: Home (`/`), About (`/about`), I'm New (`/im-new`), Messages (`/messages`), Events (`/events`), Bible Study (`/bible-study`), Videos (`/videos`), Daily Bread (`/daily-bread`), Ministries (`/ministries`), Giving (`/giving`)
> - PageSection records with correct sectionType, sortOrder, and JSONB content — use the content from doc 03 section 4 and the default page templates from doc 03 section 11
> - Menu records for HEADER and FOOTER
> - MenuItem records matching the current mega-menu structure (documented in doc 03 section 5)
>
> **Important constraints:**
> - Do NOT modify the existing `app/cms/` pages
> - Do NOT modify the existing `app/api/v1/` routes
> - Do NOT modify `laubf-test/` — this is a new addition to the root project
> - The `(website)` route group should coexist with `app/cms/`
> - Use existing shadcn/ui components (`components/ui/`) in section components
> - Add `CHURCH_ID` or `CHURCH_SLUG` to `.env` for the single-tenant fallback
> - Test by visiting `http://localhost:3000/` — it should render the homepage from the database

#### Verification:
- [ ] `app/(website)/layout.tsx` exists and renders navbar + footer from database
- [ ] `app/(website)/[[...slug]]/page.tsx` exists and renders pages from database
- [ ] `components/website/sections/registry.tsx` maps section types to components
- [ ] At least 6 section components migrated and working
- [ ] Theme CSS variables are injected from ThemeCustomization
- [ ] Homepage renders with sections from PageSection table
- [ ] `/about` renders with sections from PageSection table
- [ ] `/messages` renders with ALL_MESSAGES dynamic section
- [ ] No conflicts with existing `app/cms/` routes
- [ ] `npm run build` succeeds
- [ ] `npm run dev` shows the website at localhost:3000

---

### Phase B.2: Migrate All 38 Section Components

**Effort**: L (5-7 days)
**Dependencies**: Phase B.1
**What this does**: Migrates all remaining section components from laubf-test to the root project's `components/website/sections/`. After this, the root project can render every page type.

#### Prompt:

> Migrate all remaining section components from `laubf-test/src/components/sections/` to `components/website/sections/` in the root project at `/Users/davidlim/Desktop/laubf-cms-test/`.
>
> **Phase B.1 already migrated**: HeroBanner, MediaText, AllMessages, AllEvents, SpotlightMedia, CTABanner
>
> **Read the complete section list** — all 38 components in `laubf-test/src/components/sections/`:
> ```
> AboutDescriptionSection.tsx    MinistryHeroSection.tsx
> ActionCardGridSection.tsx      MinistryIntroSection.tsx
> AllBibleStudiesSection.tsx     MinistryScheduleSection.tsx
> AllVideosSection.tsx           NewcomerSection.tsx
> CampusCardGridSection.tsx      PageHeroSection.tsx
> DirectoryListSection.tsx       PathwayCardSection.tsx
> EventCalendarSection.tsx       PhotoGallerySection.tsx
> EventsHeroSection.tsx          PillarsSection.tsx
> FAQSection.tsx                 QuickLinksSection.tsx
> FeatureBreakdownSection.tsx    QuoteBannerSection.tsx
> FooterSection.tsx              RecurringMeetingsSection.tsx
> FormSection.tsx                RecurringScheduleSection.tsx
> HighlightCardsSection.tsx      StatementSection.tsx
> LocationDetailSection.tsx      TextImageHeroSection.tsx
> MediaGridSection.tsx           TimelineSection.tsx
> MeetTeamSection.tsx            UpcomingEventsSection.tsx
> ```
>
> **Read the JSONB content structures** in `/docs/database/03-website-database-schema.md` section 4 — each section type has documented JSONB content that the component should accept as props.
>
> **Read the static vs. dynamic classification** in doc 03 section 8 — dynamic sections need to be `async` RSCs that call DAL functions.
>
> **For each component:**
>
> 1. Read the source file in laubf-test
> 2. Create a new file in `components/website/sections/` with kebab-case naming (e.g., `EventCalendarSection.tsx` → `event-calendar.tsx`)
> 3. Update imports:
>    - `@/lib/*` → root project `@/lib/*`
>    - `@/components/ui/*` → root project `@/components/ui/*`
>    - `lucide-react` icons → same (already installed in root)
>    - `@/lib/types/sections` → create matching type in root or inline
> 4. Change the props interface to accept JSONB `content` prop:
>    ```typescript
>    interface Props {
>      content: SomeContentType  // Matches doc 03 JSONB structure
>      churchId: string          // Only for dynamic sections
>      enableAnimations: boolean
>    }
>    ```
> 5. For dynamic sections, make them `async` and call DAL functions:
>    ```typescript
>    export default async function AllBibleStudiesSection({ content, churchId }: Props) {
>      const studies = await getBibleStudies(churchId)
>      // ...
>    }
>    ```
> 6. For static sections, render directly from `content`:
>    ```typescript
>    export default function FAQSection({ content }: Props) {
>      const { heading, items } = content
>      // ...
>    }
>    ```
>
> **After migrating all components, update the registry**:
> - Import all 38 components in `components/website/sections/registry.tsx`
> - Map every `SectionType` enum value to its component
>
> **Also update the seed** to include PageSection records for all page types in doc 03 section 11 (Home, About, I'm New, Messages, Events, Bible Study, Videos, Daily Bread, Ministries, College Ministry, Campus pages).
>
> **Migrate priority order**:
> - **Batch 1** (P0 — homepage + content pages): HighlightCards, UpcomingEvents, EventCalendar, RecurringMeetings, MediaGrid, EventsHero, AllBibleStudies, AllVideos, DailyBreadFeature
> - **Batch 2** (P1 — ministry pages): MinistryHero, MinistryIntro, MinistrySchedule, CampusCardGrid, MeetTeam, LocationDetail
> - **Batch 3** (P2 — about + I'm New): PageHero, TextImageHero, AboutDescription, Pillars, Statement, Newcomer, FeatureBreakdown, PathwayCard, Timeline, PhotoGallery, FAQ, Form, DirectoryList, QuickLinks
> - **Batch 4** (layout): Footer (move to layout), Navbar (move to layout), QuoteBanner, ActionCardGrid
>
> **Important constraints:**
> - Preserve ALL existing styling
> - If a shadcn/ui component is needed that isn't installed yet, install it: `npx shadcn add <component>`
> - If a shared utility is needed, check if it exists in root `lib/utils.ts` first
> - Some section components may use client-side interactivity (tabs, accordions, carousels) — keep those parts as `"use client"` sub-components
> - Do NOT modify laubf-test files

#### Verification:
- [ ] All 38 section components exist in `components/website/sections/`
- [ ] Registry maps all `SectionType` values to components
- [ ] Every page type from doc 03 section 11 renders correctly
- [ ] Dynamic sections fetch data from the database
- [ ] Static sections render from JSONB content
- [ ] No missing imports or broken references
- [ ] `npm run build` succeeds
- [ ] Visual parity with laubf-test for all pages

---

## Phase D: Multi-Tenant Middleware

### Phase D.1: Implement Tenant Resolution

**Effort**: M (2-3 days)
**Dependencies**: Phase B.1, Auth (database Phase 6.1)
**What this does**: Adds middleware that resolves the incoming hostname to a church_id, enabling multiple churches to run on the same deployment.

#### Prompt:

> Implement multi-tenant routing middleware for the root project at `/Users/davidlim/Desktop/laubf-cms-test/`.
>
> **Read the architecture docs first**:
> - `/docs/website-rendering/05-website-rendering-architecture.md` sections 6 (isolation) and 8 (app architecture)
> - `/docs/website-rendering/06-website-rendering-implementation.md` section 2 (middleware)
> - `/docs/database/01-high-level-database-architecture.md` sections 2 (tenant flow) and 6 (RLS)
>
> **1. Create `middleware.ts`** at the project root:
>
> The middleware must handle three routing scenarios:
>
> a) **Platform domain** (`digitalchurch.com`, `www.digitalchurch.com`):
>    → Route to `(marketing)` route group (or a landing page for now)
>
> b) **Church subdomain** (`grace.digitalchurch.com`) or **custom domain** (`gracechurch.org`):
>    → Resolve to church_id
>    → Set `x-tenant-id` header
>    → For `/cms/*` paths: route to `(admin)` route group
>    → For all other paths: route to `(website)` route group
>
> c) **Development** (localhost):
>    → Support `?church=la-ubf` query parameter override
>    → Support subdomain on localhost (`la-ubf.localhost:3000`)
>    → Fall back to `CHURCH_SLUG` env var
>
> **2. Create `lib/tenant/resolve.ts`**:
> - `resolveChurchId(hostname: string)` → string | null
> - Custom domain lookup: query `CustomDomain` table (cache result in-memory for the request)
> - Subdomain extraction from `*.digitalchurch.com`
> - Return null for unknown hostnames
>
> **3. Create `lib/tenant/context.ts`** (update existing if created in Phase B):
> - `getChurchId()` reads from `x-tenant-id` header
> - Falls back to env var for single-tenant
> - Throws if no context found
>
> **4. Update `(website)/layout.tsx`** to use `getChurchId()` from tenant context
>
> **5. Update API routes** to read church_id from middleware header instead of hardcoded env var
>
> **6. For local development**, update `.env`:
> ```
> PLATFORM_DOMAIN=localhost:3000
> CHURCH_SLUG=la-ubf
> ```
>
> **7. Create a second test church** in the seed script:
> - Name: "Grace Community Church", slug: "grace"
> - Minimal content: 1 speaker, 1 series, 3 messages, 2 events
> - SiteSettings with different name/colors
> - ThemeCustomization with different primary color
>
> This allows testing tenant isolation.
>
> **Important constraints:**
> - The middleware must work in the Edge runtime (no Node.js-only APIs)
> - For database lookups in middleware, use a lightweight approach (e.g., Prisma with edge adapter, or a simple fetch to an internal API route)
> - If Edge + Prisma is problematic, use an internal `/api/internal/resolve-tenant` route that the middleware calls
> - Do NOT use AsyncLocalStorage in middleware — use headers for tenant propagation
> - Keep backward compatibility — existing single-tenant behavior must still work
> - Do NOT modify the Prisma schema

#### Verification:
- [ ] `la-ubf.localhost:3000` shows LA UBF website
- [ ] `grace.localhost:3000` shows Grace Church website (different content, different theme)
- [ ] `/cms` routes are accessible and show correct church's data
- [ ] API routes use the resolved church_id
- [ ] Unknown subdomains show 404 or redirect
- [ ] Platform domain shows marketing/landing page
- [ ] No data leaks between tenants
- [ ] `npm run build` succeeds

---

## Phase E: Caching & Performance

### Phase E.1: Add Next.js Cache Layer

**Effort**: M (1-2 days)
**Dependencies**: Phase B.1
**What this does**: Adds caching to the website rendering queries so pages load fast and the database isn't hit on every request.

#### Prompt:

> Add caching to the website rendering pipeline in the root project at `/Users/davidlim/Desktop/laubf-cms-test/`.
>
> **Strategy**: Use Next.js's built-in `unstable_cache` with tag-based invalidation. No Redis for now.
>
> **1. Create cache wrappers for DAL functions** at `lib/cache/website.ts`:
>
> For each DAL function used by the public website, create a cached version:
> ```typescript
> import { unstable_cache } from 'next/cache'
> import { getSiteSettings as _getSiteSettings } from '@/lib/dal/site-settings'
>
> export const getCachedSiteSettings = (churchId: string) =>
>   unstable_cache(
>     () => _getSiteSettings(churchId),
>     [`site-settings-${churchId}`],
>     { tags: [`church:${churchId}:site-settings`], revalidate: 3600 }
>   )()
> ```
>
> Wrap these DAL functions:
> - `getSiteSettings` → tag: `church:{id}:site-settings`, revalidate: 3600
> - `getThemeWithCustomization` → tag: `church:{id}:theme`, revalidate: 3600
> - `getMenuByLocation` → tag: `church:{id}:menus`, revalidate: 1800
> - `getPageBySlug` → tag: `church:{id}:pages`, revalidate: 600
> - `getMessages` → tag: `church:{id}:messages`, revalidate: 300
> - `getEvents`, `getUpcomingEvents`, etc. → tag: `church:{id}:events`, revalidate: 300
> - All other content queries → tag: `church:{id}:content`, revalidate: 300
>
> **2. Update the website layout and page route** to use cached DAL functions instead of raw DAL functions.
>
> **3. Create cache invalidation helper** at `lib/cache/invalidate.ts`:
> ```typescript
> import { revalidateTag } from 'next/cache'
>
> export function invalidateChurchCache(churchId: string, entity: string) {
>   revalidateTag(`church:${churchId}:${entity}`)
>
>   // Content changes also affect page rendering
>   const CONTENT_ENTITIES = ['messages', 'events', 'bible-studies', 'videos', 'daily-bread']
>   if (CONTENT_ENTITIES.includes(entity)) {
>     revalidateTag(`church:${churchId}:pages`)
>   }
> }
> ```
>
> **4. Add invalidation calls to all CMS write API routes**:
>
> Update every POST, PATCH, DELETE handler in `app/api/v1/` to call `invalidateChurchCache()` after successful writes:
> - `POST /api/v1/messages` → `invalidateChurchCache(churchId, 'messages')`
> - `PATCH /api/v1/messages/[slug]` → `invalidateChurchCache(churchId, 'messages')`
> - `DELETE /api/v1/messages/[slug]` → `invalidateChurchCache(churchId, 'messages')`
> - Same pattern for events, bible-studies, videos, daily-bread, speakers, series
> - `PATCH /api/v1/site-settings` → `invalidateChurchCache(churchId, 'site-settings')`
> - `PATCH /api/v1/theme` → `invalidateChurchCache(churchId, 'theme')`
> - Menu changes → `invalidateChurchCache(churchId, 'menus')`
> - Page/section changes → `invalidateChurchCache(churchId, 'pages')`
>
> **Important constraints:**
> - `unstable_cache` is the correct API for Next.js 16 (it may be renamed to `cache` in future versions)
> - Cache tags must be tenant-namespaced to prevent cross-tenant cache pollution
> - The `revalidate` parameter is a fallback TTL — on-demand invalidation via tags is the primary mechanism
> - Do NOT add Redis yet — Next.js's built-in cache is sufficient for 1-10 churches
> - Test that content changes in the CMS are reflected on the public website within seconds

#### Verification:
- [ ] Website pages load with cached data (check Next.js cache headers)
- [ ] Publishing a sermon in CMS → appears on `/messages` within seconds
- [ ] Updating theme colors → reflected on next page load
- [ ] Editing site settings → footer/navbar update
- [ ] Cache keys are tenant-namespaced (no cross-church contamination)
- [ ] `npm run build` succeeds

---

## Summary: Phase Dependency Graph

```
Phase A.1: Prisma in laubf-test
  └── Phase A.2: Replace mock data in laubf-test
       └── Phase B.1: (website) route group + section registry + first 6 components
            ├── Phase B.2: Migrate all 38 section components
            ├── Phase E.1: Add caching layer
            └── Phase D.1: Multi-tenant middleware (requires auth)
                 └── Phase F: Production deployment

Phase C (Website Builder Admin) — separate agent, starts after B.1
```

## Estimated Total Effort

| Phase | Effort | Calendar Days |
|---|---|---|
| A.1 Prisma in laubf-test | S | 0.5 |
| A.2 Replace mock data | L | 3-5 |
| B.1 Route group + registry | L | 3-5 |
| B.2 Migrate all sections | L | 5-7 |
| D.1 Multi-tenant middleware | M | 2-3 |
| E.1 Caching layer | M | 1-2 |
| **Total** | | **15-23 days** |

Note: Phase C (Website Builder Admin) is handled by a separate agent and runs in parallel with B.2/D.1/E.1. Phase F (Production) is documented in the database docs.

---

## Future Phases (Not Detailed Here)

- **Phase C: Website Builder Admin** — Page management UI, section editor, menu editor, theme customizer (separate agent)
- **Phase G: Redis Caching** — Add Redis for query-level caching at 100+ churches
- **Phase H: ISR Optimization** — Fine-tune revalidation strategies per page type
- **Phase I: CDN Configuration** — Full-page caching with stale-while-revalidate headers
- **Phase J: Performance Monitoring** — Core Web Vitals tracking, Lighthouse CI
- **Phase K: A/B Testing & Analytics** — Per-church analytics, section performance
