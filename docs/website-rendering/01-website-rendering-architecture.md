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
│   └── sections/          ← 38 section components
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
├── (admin)/               ← CMS dashboard
│   ├── dashboard/
│   ├── messages/
│   ├── events/
│   ├── website/           ← Page builder, theme, navigation editors
│   └── ...
├── api/v1/                ← Shared API routes
└── middleware.ts           ← Tenant resolution + route group selection
```

### Migration Path

The consolidation from two apps to one happens during the **Website Rendering Integration Phase** (see doc 07). The approach:

1. **Phase A**: Get the single-tenant MVP working — root CMS + laubf-test public site, both reading from the same database, no route groups needed yet.
2. **Phase B**: Move public website components (`sections/`, layouts, theme) from `laubf-test/` into the root project under `components/website/` and `app/(website)/`. Retire `laubf-test/` as a standalone app.
3. **Phase C**: Add middleware for tenant resolution and route group separation.

Phase A is where we are heading now. Phase B happens after the website builder admin is ready. Phase C enables multi-tenancy.

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

3. **No visual drag-and-drop editor (for MVP).** The section editor is a list-based UI: add section, pick type from gallery, fill in the fields, reorder with drag-and-drop. No canvas, no inline editing. This dramatically reduces implementation complexity.

4. **CMS content pages are immutable in structure.** The Messages page always renders `SPOTLIGHT_MEDIA → ALL_MESSAGES`. The admin can configure display options (grid vs. list, items per page), but they can't remove or rearrange those sections. This prevents "I accidentally deleted my sermons page" support tickets.

---

## 11. Key Takeaway

The "website builder" doesn't mean each church gets custom code. It means each church gets a **custom configuration** that the shared rendering engine interprets. The database schema (Pages, PageSections, ThemeCustomization, Menus) is the website builder's storage layer. The section component registry is the rendering layer. Together, they produce unique websites from shared code.

The template-based approach means we ship a polished, professional website to every church from day one — then give them safe knobs to customize it. The CMS handles the daily content work; the builder handles the occasional design work. Both share the same rendering engine.
