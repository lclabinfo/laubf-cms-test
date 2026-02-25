# Website Rendering Architecture

## How One Codebase Serves 1,000+ Unique Church Websites

---

## 1. The Core Concept: Data-Driven Rendering

Every church on the platform gets a fully customizable, unique-looking website — but they all share the same application code. There are no separate codebases, no separate Next.js projects, and no separate hosting per church.

Instead, each church's website is a **configuration stored in the database**: which pages exist, what sections are on each page, what content fills those sections, what colors and fonts to use, and how the navigation is structured. The application is a **rendering engine** that reads this configuration and outputs a finished website.

This is the same model used by Shopify, Squarespace, and Webflow. One deployment. One codebase. Thousands of unique websites. Since our builder is **template-based and CMS-driven** (closer to Shopify than Wix/Framer), churches customize within safe, curated boundaries — they don't have pixel-level freedom that could break layouts.

---

## 2. Why NOT One Project Per Church

At first glance, it seems like each church having a "unique website" means each church needs its own codebase. Here's why that breaks down:

| Approach | At 1 Church | At 10 Churches | At 1,000 Churches |
|---|---|---|---|
| **Separate Next.js project per church** | Fine | Manageable | 1,000 deployments, 1,000 builds on every framework update |
| **Separate hosting per church** | ~$20/mo | ~$200/mo | ~$20,000/mo |
| **Shared codebase, data-driven** | Same infra as 1K | Same infra as 1K | One deployment, one build, ~$200-1,000/mo infra |

A separate project per church means:
- Every bug fix deploys N times
- Every Next.js upgrade requires N rebuilds
- Every new feature is N PRs
- Hosting costs scale linearly with tenants

A shared rendering engine means:
- One deployment covers everyone
- Bug fixes and features ship once
- Hosting costs scale with traffic, not tenant count
- The database handles the per-church differentiation

**For our current stage**: 1 church today, targeting 10 stable. The shared architecture costs us nothing extra now and avoids a painful rewrite later. We build for shared from day one.

---

## 3. What Makes Each Church's Website Unique

Five layers of database-driven configuration combine to produce a unique website for each church:

### Layer 1: Theme & Design Tokens

Stored in `ThemeCustomization`, these values are injected as CSS custom properties at the layout level. They control the visual identity of the entire site without touching any component code.

- Primary and secondary colors
- Heading and body fonts (Google Fonts)
- Border radius, spacing scale
- Navbar and footer style overrides
- Custom CSS for advanced users

**Result**: Church A has blue rounded buttons with Inter font. Church B has red sharp-cornered buttons with Playfair Display. Same button component, different CSS variables.

### Layer 2: Template Selection

Stored in the `Theme` table (platform-level). Each template defines a default set of pages, sections, color tokens, and typography. Churches select a template during onboarding, then override specific tokens in `ThemeCustomization`. This is the Shopify model — pick a template, customize within its rails.

### Layer 3: Page Structure

Stored in the `Page` table. Each church defines which pages exist on their site and their URL slugs.

One church might have: Home, About, Messages, Events, Giving, Contact.
Another might have: Home, About, Ministries, Sermons, Bible Studies, Events, Daily Bread, I'm New, Campus Life.

Pages are created, deleted, reordered, and configured entirely through the CMS admin — no code changes. Template-governed pages (Messages, Events, Bible Studies, etc.) have protected layouts that admins cannot break — they can only toggle visibility and choose layout variants.

### Layer 4: Section Composition

Stored in `PageSection`. Each page is composed of ordered sections, and each section is a configurable block. The section type determines which React component renders; the JSONB content determines what that component displays.

Church A's homepage might be:
```
HERO_BANNER → HIGHLIGHT_CARDS → SPOTLIGHT_MEDIA → CTA_BANNER
```

Church B's homepage might be:
```
HERO_BANNER → MEDIA_TEXT → EVENT_CALENDAR → CAMPUS_CARD_GRID → QUOTE_BANNER → CTA_BANNER
```

Same rendering engine, completely different page layouts. Custom pages allow admins to add/remove/reorder sections. Template-governed pages lock the section structure but allow content editing.

### Layer 5: CMS Content

The actual content that dynamic sections pull from: messages/sermons, events, bible studies, videos, daily devotionals. Each church creates and manages their own content through the CMS, and dynamic sections (like `ALL_MESSAGES` or `UPCOMING_EVENTS`) query this content scoped to the current church.

---

## 4. The Rendering Pipeline

When a visitor hits `gracechurch.lclab.io/about` (or `gracechurch.org/about` via custom domain):

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. NEXT.JS MIDDLEWARE                                           │
│    Request: gracechurch.org/about                               │
│    → Look up "gracechurch.org" in CustomDomain table (cached)   │
│    → OR extract "gracechurch" from *.lclab.io                   │
│    → Resolve to church_id = "abc123"                            │
│    → Set x-tenant-id header for the request lifecycle           │
│    → Rewrite URL to (website) route group                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│ 2. LAYOUT (runs once per request)                               │
│    Parallel queries (all scoped to church_id "abc123"):         │
│    ├── SiteSettings → site name, logo, social links             │
│    ├── ThemeCustomization + Theme → CSS variables                │
│    └── Menu (HEADER) + MenuItems → navigation structure         │
│                                                                  │
│    Output: <html> with CSS vars, <Navbar/>, <Footer/>           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│ 3. PAGE ROUTE (catch-all [[...slug]])                           │
│    Query: Page WHERE church_id = "abc123" AND slug = "/about"   │
│    Query: PageSections WHERE page_id = {page.id}                │
│           ORDER BY sort_order ASC                                │
│                                                                  │
│    Result: Ordered list of sections with type + JSONB content   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│ 4. SECTION RENDERER (for each section)                          │
│    Match sectionType → React component from registry            │
│    Pass JSONB content as props                                  │
│                                                                  │
│    Static sections: Render directly from JSONB (RSC)            │
│    Dynamic sections: Fetch CMS data, then render (RSC)          │
│    ├── ALL_MESSAGES → query Messages table                      │
│    ├── UPCOMING_EVENTS → query Events table                     │
│    ├── DAILY_BREAD_FEATURE → query DailyBread table             │
│    └── etc.                                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│ 5. CACHING (layered)                                            │
│    Layer A: Next.js Data Cache + ISR revalidation               │
│      → revalidateTag("church:abc123") on CMS content change     │
│    Layer B: Redis query cache (added when needed at scale)       │
│      → Cache keys: church:abc123:page:about (5-60 min TTL)      │
│    Layer C: CDN (Cloudflare)                                     │
│      → Stale-while-revalidate for public pages                  │
│    Invalidation: CMS write → revalidateTag() → fresh on next    │
└─────────────────────────────────────────────────────────────────┘
```

### Caching Strategy: Start Simple, Add Layers

For 1-10 churches, Next.js's built-in caching is sufficient:
- **`unstable_cache`** (Next.js 16) or `fetch` with `revalidate` for data queries
- **On-demand revalidation** via `revalidateTag()` when CMS content changes
- **No Redis needed** until traffic justifies it

For 100+ churches, add Redis:
- Tenant-namespaced query caching
- Reduces database load from public website reads

For 1,000+ churches:
- CDN-level full page caching with stale-while-revalidate
- Read replicas for public website queries
- Connection pooling via PgBouncer

---

## 5. Section Types: Static vs. Dynamic

Sections fall into two categories based on where their data comes from:

### Static Sections

Content lives entirely in the JSONB payload. No additional database queries needed at render time. These are fast, fully cacheable, and render as pure React Server Components.

Examples: `HERO_BANNER`, `MEDIA_TEXT`, `CTA_BANNER`, `FAQ_SECTION`, `QUOTE_BANNER`, `ACTION_CARD_GRID`, `PILLARS`, `STATEMENT`, `NEWCOMER`, `CAMPUS_CARD_GRID`, `MEET_TEAM`, `FOOTER`

### Dynamic Sections

The JSONB payload contains configuration (what to show, how many items, which filters), but the actual content comes from CMS tables at render time. These sections are async React Server Components that fetch data.

| Section | Queries | Data |
|---|---|---|
| `ALL_MESSAGES` | Message + Speaker + Series | Full message listing with filters |
| `ALL_EVENTS` | Event + Ministry + Campus | Full event listing with tabs |
| `ALL_BIBLE_STUDIES` | BibleStudy + Series | Full study listing with filters |
| `ALL_VIDEOS` | Video | Full video listing |
| `SPOTLIGHT_MEDIA` | Message (latest or by slug) | Featured sermon details |
| `UPCOMING_EVENTS` | Event (upcoming, limited) | Next N upcoming events |
| `HIGHLIGHT_CARDS` | Event (featured) | Featured event cards |
| `RECURRING_MEETINGS` | Event (isRecurring = true) | Recurring meeting cards |
| `EVENT_CALENDAR` | Event (date range) | Monthly calendar view |
| `DAILY_BREAD_FEATURE` | DailyBread (today) | Today's devotional |

This split matters because dynamic sections are the ones that need cache invalidation when CMS content changes, while static sections only change when someone edits the page in the builder.

---

## 6. Multi-Tenant Request Isolation

Every request is scoped to a single church. The tenant boundary is enforced at three levels:

1. **Next.js Middleware** — resolves the hostname to a `church_id` before any application code runs. Sets `x-tenant-id` header on the request.
2. **Prisma Client Extension** — automatically injects `WHERE church_id = ?` on every database query for tenant-scoped models.
3. **PostgreSQL RLS** (defense-in-depth) — database-level policy that prevents any query from seeing another tenant's data, even if the application layer has a bug.

This means Church A's visitors can never see Church B's content, even if a developer accidentally writes a query without filtering by church. RLS is the safety net.

### Tenant Resolution Priority

```
1. Custom domain lookup    → gracechurch.org → church_id
2. Subdomain extraction    → grace.lclab.io → church_id
3. Dev override            → ?church=la-ubf (development only)
4. Default church          → CHURCH_SLUG env var (single-tenant MVP)
```

---

## 7. Scaling Model

The shared architecture scales efficiently because the workload is read-heavy and cacheable:

### Stage 1: 1-10 Churches (Current Target)
- **Azure VM** (B2s, ~$30/month) with Caddy reverse proxy
- **Cloudflare free tier** for CDN, DDoS protection, and DNS
- **PostgreSQL** on the same VM or Azure Database for PostgreSQL
- **Next.js built-in cache** (filesystem + in-memory) handles caching
- **No Redis needed**
- Estimated cost: ~$33/month

### Stage 2: 10-100 Churches
- **Azure VM** (upgrade to B2ms: 2 vCPU, 8GB RAM) or second VM
- **Azure Database for PostgreSQL** (Flexible Server) with connection pooling
- **Redis** (Azure Cache for Redis Basic or self-hosted) for shared server-side caching
- **ISR + on-demand revalidation** for public pages
- **Cloudflare free or Pro** ($20/month) for CDN + caching
- Estimated cost: $60-250/month

### Stage 3: 100-1,000+ Churches
- **Multiple Azure VMs** behind Azure Load Balancer
- **Read replicas** for public website queries (separate from CMS writes)
- **Cloudflare Pro/Business** for CDN-level full page caching with stale-while-revalidate
- **PgBouncer** for connection pooling
- **Redis Standard** (with replication) — mandatory for multi-server cache sharing
- **Composite indexes** starting with `church_id` ensure every query is fast regardless of total row count
- Estimated cost: $400-800/month

The application code doesn't change between stages — only the infrastructure configuration.

---

## 8. Application Architecture

### Current State (Two Separate Apps)

The project currently has two separate Next.js applications:

```
/                          ← Root project (CMS admin)
├── app/
│   ├── cms/               ← CMS admin pages (messages, events, media, etc.)
│   └── api/v1/            ← API routes
├── lib/
│   ├── db/                ← Prisma client singleton
│   ├── dal/               ← Data access layer
│   └── generated/         ← Generated Prisma types
│
/laubf-test/               ← Public website (separate Next.js app)
├── src/app/               ← Public pages (messages, events, bible-study, etc.)
├── src/components/
│   └── sections/          ← 42 section types (40 real + 2 placeholders)
└── src/lib/
    ├── mock-data/         ← Currently using mock data
    └── types/             ← TypeScript interfaces
```

### Target State (Single Unified App)

The target architecture consolidates into one Next.js app with route groups:

```
app/
├── (marketing)/           ← lclab.io — platform landing, pricing, signup
├── (website)/             ← *.lclab.io + custom domains — public church sites
│   ├── layout.tsx         ← Injects theme, navbar, footer per church
│   └── [[...slug]]/       ← Catch-all: renders any page from DB
├── cms/                   ← CMS admin (current structure)
│   ├── (dashboard)/       ← Dashboard layout with sidebar
│   │   ├── dashboard/
│   │   ├── messages/
│   │   ├── events/
│   │   ├── website/       ← v1 page editor, theme, navigation, domains, settings
│   │   └── ...
│   └── website/builder/   ← Full-screen builder (v2, outside dashboard layout)
│       ├── layout.tsx     ← No CMS sidebar, auth check
│       ├── page.tsx       ← Entry: redirect to homepage
│       └── [pageId]/      ← Builder for specific page
├── api/v1/                ← Shared API routes
└── middleware.ts           ← Tenant resolution + route group selection
```

### Migration Path

The consolidation from two apps to one happens during the **Website Rendering Integration Phase** (see `docs/development-status.md` Section 4 for detailed phase specs). The approach:

1. **Phase A**: Get the single-tenant MVP working — root CMS + laubf-test public site, both reading from the same database, no route groups needed yet. **STATUS: COMPLETE.**
2. **Phase B**: Move public website components (`sections/`, layouts, theme) from `laubf-test/` into the root project under `components/website/` and `app/(website)/`. Retire `laubf-test/` as a standalone app. **STATUS: B.1, B.2, and B.3 COMPLETE (40/42 section types have real implementations; 2 intentional placeholders).**
3. **Phase C (v1)**: Website builder admin UI. **STATUS: COMPLETE.** List-based editor with all CRUD operations for pages, sections, menus, theme, domains, and site settings. See `docs/00_dev-notes/website-admin-implementation.md`.
3b. **Phase C (v2)**: Full-screen website builder. **STATUS: IN PROGRESS.** Canvas-based WYSIWYG editor replacing the v1 list-based editor. See `docs/00_dev-notes/website-builder-plan.md`.
4. **Phase D**: Add middleware for tenant resolution and route group separation. **STATUS: NOT STARTED.**

---

## 9. When Would You Split Back Into Separate Apps?

The unified single-app approach works well up to a significant scale. You'd consider splitting into separate apps (in a monorepo) when:

- You have dedicated teams for CMS vs. public website vs. marketing
- The CMS admin and public website have divergent deployment cadences
- You need independent scaling (e.g., public websites get 100x the traffic of admin)
- The single app's bundle size becomes a concern

At that point, the split looks like:

```
packages/
├── db/              ← shared Prisma client, DAL, types
├── shared/          ← shared utilities, validators, section types
apps/
├── cms/             ← admin dashboard
├── website/         ← public church websites
└── marketing/       ← lclab.io platform site
```

But this is an optimization for much later — not a prerequisite. The single-app approach serves well past 1,000 churches.

---

## 10. Template-Based Builder vs. Free-Form Builder

Our website builder is intentionally closer to **Shopify** than **Wix/Framer**:

| | Our Approach (Shopify-like) | Wix/Framer Approach |
|---|---|---|
| **Structure** | Template-governed, section-based | Free-form drag-and-drop |
| **Customization** | Pick template, customize tokens + content | Pixel-level control |
| **Risk of broken layouts** | Near zero | High |
| **Skill required** | None | Design skills needed |
| **Build complexity** | Moderate — finite section types | Very high — visual editor |
| **Rendering** | Server-side (RSC) | Client-side (often) |

### What This Means for Implementation

1. **Section components are the atomic unit.** We build ~35-40 section components. Each one handles its own responsive layout. Admins compose pages from these sections — they never manipulate the internals.

2. **Templates define safe defaults.** A template is a preset combination of pages + sections + theme tokens. Churches can customize within the template's boundaries. Switching templates re-skins the site without losing content.

3. **Section-based visual editor.** ~~The section editor is a list-based UI (v1).~~ The full-screen builder (v2, in progress) provides a WYSIWYG canvas that renders actual section components with drag-and-drop reordering via @dnd-kit. Section content is edited in modal forms, not inline on the canvas. See `docs/00_dev-notes/website-builder-plan.md` for the builder architecture.

4. **CMS content pages are immutable in structure.** The Messages page always renders `SPOTLIGHT_MEDIA → ALL_MESSAGES`. The admin can configure display options (grid vs. list, items per page), but they can't remove or rearrange those sections. This prevents "I accidentally deleted my sermons page" support tickets.

---

## 11. Key Takeaway

The "website builder" doesn't mean each church gets custom code. It means each church gets a **custom configuration** that the shared rendering engine interprets. The database schema (Pages, PageSections, ThemeCustomization, Menus) is the website builder's storage layer. The section component registry is the rendering layer. Together, they produce unique websites from shared code.

The template-based approach means we ship a polished, professional website to every church from day one — then give them safe knobs to customize it. The CMS handles the daily content work; the builder handles the occasional design work. Both share the same rendering engine.

---

## 12. Operational Details — Rendering Pipeline & Data Flow

> This section provides the operational/tactical counterpart to the strategic architecture above. It documents the actual rendering pipeline, section data resolution, and component specifications as implemented.

### 12.1 End-to-End Rendering Pipeline

The public website uses a **single catch-all route** that renders any page from the database:

```
Browser request → Next.js App Router
  → app/(website)/layout.tsx
    → ThemeProvider (injects CSS vars from ThemeCustomization)
    → FontLoader (loads Google Fonts + custom @font-face per tenant)
    → Navbar (from Menu records, location=HEADER)
    → app/(website)/[[...slug]]/page.tsx
      → Resolves churchId (from tenant context)
      → Fetches Page by slug (or homepage if no slug)
      → For each PageSection (sorted by sortOrder):
        → resolveSectionData() if content.dataSource exists
        → SectionWrapper (padding, color scheme, visibility, animations)
          → Registry lookup → Render section component
    → Footer (from Menu records, location=FOOTER + SiteSettings)
    → QuickLinksFAB (floating quick links)
```

#### Key Files

| File | Purpose |
|---|---|
| `app/(website)/layout.tsx` | Website layout shell — theme, fonts, navbar, footer |
| `app/(website)/[[...slug]]/page.tsx` | Catch-all page route — fetches page + sections from DB |
| `lib/website/resolve-section-data.ts` | Resolves `dataSource` fields by calling DAL functions |
| `lib/tenant/context.ts` | `getChurchId()` — reads `x-tenant-id` header or env var |
| `components/website/sections/registry.tsx` | Maps SectionType enum → React component |
| `components/website/sections/section-wrapper.tsx` | Wraps each section with padding, theme, animation |
| `components/website/theme/theme-provider.tsx` | Injects CSS custom properties from ThemeCustomization |
| `components/website/font-loader.tsx` | Generates `<link>` or `@font-face` for tenant fonts |

### 12.2 Data Flow: How Sections Receive Data

There are **two categories** of sections:

#### A. Static Sections (Content from JSONB)

These sections render directly from the `PageSection.content` JSON column. No additional data fetching needed.

```
PageSection.content (JSONB) → SectionWrapper → Component(content, colorScheme, ...)
```

**Examples**: HeroBanner, QuoteBanner, CTABanner, ActionCardGrid, DirectoryList, MediaText, TextImageHero, FormSection, FAQSection, PillarsSection, TimelineSection, etc.

#### B. Dynamic Sections (Content + Data Resolution)

These sections have a `dataSource` field in their JSONB content. The `resolveSectionData()` function reads this field, calls the appropriate DAL function, and merges the result into the content before passing to the component.

```
PageSection.content = { heading: "...", dataSource: "latest-message" }
  ↓ resolveSectionData(churchId, sectionType, content)
  ↓ Calls getLatestMessage(churchId) from DAL
  ↓ Returns { content: { ...content, sermon: { title, speaker, ... } } }
  ↓ Component receives fully-populated content object
```

**Supported `dataSource` values:**

| dataSource | DAL Function | Used By |
|---|---|---|
| `latest-message` | `getLatestMessage()` | SpotlightMedia |
| `featured-events` | `getFeaturedEvents()` | HighlightCards |
| `upcoming-events` | `getUpcomingEvents()` | EventCalendar, UpcomingEvents |
| `ministry-events` | `getUpcomingEvents()` + filter | Ministry pages |
| `latest-videos` | `getVideos()` | MediaGrid |
| `all-messages` | _(self-fetching RSC)_ | AllMessages |
| `all-events` | _(self-fetching RSC)_ | AllEvents |
| `all-bible-studies` | `getBibleStudies()` | AllBibleStudies |
| `all-videos` | `getVideos()` | AllVideos |
| `latest-daily-bread` | `getTodaysDailyBread()` | DailyBreadFeature |

#### C. Self-Fetching Server Components

`AllMessages` and `AllEvents` are async Server Components that receive `churchId` and fetch their own data internally. They don't use `resolveSectionData()`.

### 12.3 Section Registry

The registry (`components/website/sections/registry.tsx`) maps every `SectionType` enum value to a React component:

```typescript
const SECTION_REGISTRY: Record<SectionType, ComponentType> = {
  HERO_BANNER: HeroBannerSection,
  MEDIA_TEXT: MediaTextSection,
  SPOTLIGHT_MEDIA: SpotlightMediaSection,
  // ... 35+ entries
}
```

### 12.4 Section Component Prop Interface

All section components in the root project follow a **standardized prop interface**:

```typescript
interface SectionProps {
  content: Record<string, unknown>  // JSONB content, section-specific shape
  colorScheme?: 'LIGHT' | 'DARK'   // From PageSection.colorScheme
  enableAnimations?: boolean         // From PageSection.enableAnimations
  churchId?: string                  // For self-fetching components
  resolvedData?: Record<string, unknown>  // From resolveSectionData()
}
```

**vs. laubf-test (source of truth) pattern:**

```typescript
interface SectionProps {
  settings: {
    id: string
    visible: boolean
    colorScheme: 'light' | 'dark'
    enableAnimations: boolean
    content: { /* section-specific fields */ }
  }
  // Some sections also receive data arrays:
  events?: Event[]
  messages?: Message[]
}
```

The root project flattens the `settings` wrapper — `content` is passed directly, and `colorScheme` / `enableAnimations` are separate props. The `SectionWrapper` handles `visible`, `paddingY`, and `containerWidth`.

### 12.5 Navbar Architecture & Edge Cases

The navbar is the most complex layout component. It uses a **mega menu** pattern with multiple structural elements per dropdown.

#### Navigation Data Structure

```
Navigation
├── Dropdowns (3): "Our Church", "Ministries", "Resources"
│   ├── Sections (2-4 per dropdown): grouped columns of links
│   │   ├── title: string (section header, e.g., "About")
│   │   ├── items[]: { label, href, description?, icon?, isExternal? }
│   │   ├── compact?: boolean (for Quick Links section — 2-col grid)
│   │   ├── columns?: number (grid column count override)
│   │   ├── footerLink?: { label, href } (bottom link per section)
│   │   └── width?: string (CSS width override)
│   ├── featuredCard?: { image, title, description, href }
│   ├── overviewLink?: { label, description, href }
│   └── offsetX?: number (dropdown horizontal position offset)
├── Direct Links (1): "Giving" (no dropdown)
├── CTA Button: "I'm New" (right side)
└── Member Login Link: small text link
```

#### Database Mapping (MenuItem Model)

| laubf-test Field | MenuItem Column | Notes |
|---|---|---|
| dropdown.label | `label` | Top-level item (parentId=null) |
| section.title | `groupLabel` | On child items, groups them visually |
| item.label | `label` | Child item |
| item.href | `href` | Navigation URL |
| item.description | `description` | Shown under label in wide columns |
| item.icon | `iconName` | Lucide icon name string |
| item.isExternal | `isExternal` | Shows external arrow icon |
| featuredCard.image | `featuredImage` | On parent item |
| featuredCard.title | `featuredTitle` | On parent item |
| featuredCard.description | `featuredDescription` | On parent item |
| featuredCard.href | `featuredHref` | On parent item |
| overviewLink | stored as special child | `sortOrder: 999` convention |
| compact mode | via `groupLabel` convention | e.g., groupLabel starts with "compact:" |

#### Edge Cases & Scalability

**Fewer items than LA UBF:**
- A church with 1 dropdown + 2 direct links → mega menu degrades to simple dropdown
- Minimum viable nav: logo + 3 direct links + CTA button

**More items than LA UBF:**
- Additional dropdowns (4+) → horizontal scroll or "More" overflow menu on desktop
- Deep nesting (3+ levels) → not supported; flatten to 2 levels

**Mobile adaptation:**
- All dropdowns → accordion sections in mobile drawer
- Featured cards → hidden on mobile
- CTA button → shown in mobile drawer footer

#### Logo Behavior

- **Over hero section** (not scrolled): Light/inverted logo (`logoInvertedUrl`)
- **Scrolled past hero**: Dark logo (`logoUrl`) with white background navbar
- **Transition**: Smooth opacity crossfade on scroll threshold

### 12.6 Color System

#### Color Palette (CSS Variables)

```css
/* Blacks */
--color-black-1: #111111    /* Primary dark bg */
--color-black-2: #1A1A1A    /* Secondary dark bg */
--color-black-3: #2A2A2A    /* Tertiary dark */

/* Whites */
--color-white-0: #FFFFFF    /* Pure white */
--color-white-1: #FAFAFA    /* Off-white bg */
--color-white-1-5: #F5F5F5  /* Light gray bg */
--color-white-2: #E5E5E5    /* Muted text on dark */
--color-white-3: #999999    /* Secondary text on dark */

/* Brand */
--color-brand-1: #2563EB    /* Primary brand (blue) */
--color-brand-2: #1E3A5F    /* Dark brand / navy */

/* Semantic */
--color-surface-page: var(--color-white-1)
--color-surface-dark: var(--color-black-1)
--color-border-light: #E5E5E5
```

#### Section Color Schemes

Each `PageSection` has a `colorScheme` field (`LIGHT` or `DARK`). The `SectionWrapper` applies the corresponding theme:

- **LIGHT**: white background, dark text
- **DARK**: black-1 background, white text

### 12.7 Animation System

**AnimateOnScroll** — The primary animation wrapper uses Intersection Observer:

```tsx
<AnimateOnScroll animation="fade-up" staggerIndex={0} staggerBaseMs={100}>
  <div>Content fades up when scrolled into view</div>
</AnimateOnScroll>
```

**Animations available**: `fade-up`, `fade-left`, `fade-right`, `scale-up`, `fade-in`

**CSS Keyframe Animations** (defined in `globals.css`):
- `dropdown-in` — navbar dropdown entrance
- `hero-fade-up` / `hero-fade-in` — hero section entrance
- `scale-in` — scale from 95% to 100%
- `slide-in-left` / `slide-in-right` — horizontal slides
- `pulse-glow` — accent glow effect

**Motion Library** — Some sections use `motion/react` (from Framer Motion) for physics-based animations (MediaText, Statement, DirectoryList).

### 12.8 Font System Summary

| CSS Variable | Font | Source | Usage |
|---|---|---|---|
| `--font-sans` | Helvetica Neue | Custom `@font-face` (3 weights: 400, 500, 700) | Body text, UI elements |
| `--font-serif` | DM Serif Display | Google Fonts (weight: 400, italic) | Heading accents, display |
| `--font-display` | DM Serif Display | Same as serif | Hero headings |
| `--font-script` | Strude | Custom `@font-face` | Script/decorative headings |

See `docs/website-rendering/08-font-system.md` for the full font architecture.

### 12.9 Typography Scale

| Utility | Mobile | Desktop | Font | Usage |
|---|---|---|---|---|
| `.text-h1` | 32px/110% | 48px/110% | sans, 700 | Page headings |
| `.text-h2` | 24px/120% | 36px/120% | sans, 700 | Section headings |
| `.text-h3` | 18px/130% | 24px/130% | sans, 600 | Subsection headings |
| `.text-h4` | 16px/140% | 18px/140% | sans, 600 | Card headings |
| `.text-body-1` | 16px/160% | 18px/160% | sans, 400 | Primary body |
| `.text-body-2` | 14px/160% | 16px/160% | sans, 400 | Secondary body |
| `.text-body-3` | 13px/150% | 14px/150% | sans, 400 | Small body |
| `.text-hero-accent` | 28px/120% | 40px/120% | serif (italic) | Hero accent lines |
| `.text-display-heading` | 40px/100% | 80px/100% | serif (italic) | Display headings |
| `.text-script-heading` | 28px/120% | 40px/120% | script | Decorative headings |

### 12.10 Container Utilities

| Utility | Width | Max Width | Padding |
|---|---|---|---|
| `.container-standard` | 85% | 1200px | auto margins |
| `.container-narrow` | 85% | 840px | auto margins |
| `.container-nav` | 100% → 90% (lg) | 1140px | 1.25rem → 0 (lg) |

### 12.11 Section Catalog Summary (42 Section Types)

See `docs/website-rendering/09-section-component-guide.md` for the full catalog with CMS field specifications, comment header format, and migration instructions.

| Category | Sections | Count |
|---|---|---|
| **Hero & Banner** | HeroBanner, PageHero, TextImageHero, MinistryHero, EventsHero, QuoteBanner | 6 |
| **Content Grids** | HighlightCards, ActionCardGrid, MediaGrid, AllMessages, AllBibleStudies, AllVideos, AllEvents, DailyBreadFeature | 8 |
| **Feature & Showcase** | SpotlightMedia, MediaText, Timeline, Pillars, FeatureBreakdown, Statement, AboutDescription | 7 |
| **Events & Schedule** | UpcomingEvents, EventCalendar, QuickLinks, RecurringMeetings, RecurringSchedule, MinistrySchedule | 6 |
| **Directory & Gallery** | DirectoryList, PhotoGallery, FormSection, PathwayCard, CampusCardGrid | 5 |
| **Team & Ministry** | MeetTeam, MinistryIntro, Newcomer, CTABanner | 4 |
| **Navigation** | Footer, LocationDetail, Navbar (placeholder) | 3 |
| **Generic / Custom** | CustomHtml, CustomEmbed | 2 |

| Type | Sections | Data Source |
|---|---|---|
| **Static** (JSONB only) | 28 sections | Content edited in CMS page builder |
| **Dynamic** (dataSource) | 6 sections | `resolveSectionData()` fetches from DAL |
| **Self-fetching RSC** | 2 sections | AllMessages, AllEvents fetch own data |
| **Layout** | 2 sections | Navbar, Footer rendered in layout |
| **Generic** | 2 sections | CustomHtml, CustomEmbed for arbitrary content |
| **Placeholder** | 2 sections | Navbar (layout-handled), DailyBreadFeature (unimplemented) |
