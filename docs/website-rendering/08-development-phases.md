# Website Rendering — Development Phases & Fidelity Guide

## What to Build, In What Order, and at What Level of Polish

> **Context**: The CMS admin exists with working pages and API routes. The database schema and DAL are built. 38 section components exist in `laubf-test/`. The website builder admin UI does not exist yet — another agent will handle that. This document focuses on the rendering pipeline and integration work.

---

## Phase Overview

```
Phase A: Single-Tenant Rendering (you are here → next)
  ↓
Phase B: Section Component Migration
  ↓
Phase C: Website Builder Admin (separate agent)
  ↓
Phase D: Multi-Tenant Middleware
  ↓
Phase E: Caching & Performance
  ↓
Phase F: Production Deployment
```

---

## Phase A: Single-Tenant Rendering MVP

**Goal**: Get the public website rendering from the database instead of mock data, in the existing `laubf-test/` app.

**Fidelity**: Full functionality, existing styling preserved. No new UI work — just swap the data source.

**Why this comes first**: This proves the rendering pipeline works end-to-end before we invest in consolidating apps, building admin UIs, or adding multi-tenancy.

### Steps

| # | Task | Effort | Depends On |
|---|---|---|---|
| A1 | Create `getChurchId()` helper in laubf-test that reads from env var | S (1h) | Seed data |
| A2 | Install Prisma in laubf-test, point to same DB | S (2h) | Phase 1.2 (DB) |
| A3 | Create read-only DAL in laubf-test (or import from root) | M (1d) | A2 |
| A4 | Replace mock data in `/messages` page + `[slug]` detail | M (4h) | A3 |
| A5 | Replace mock data in `/events` page + `[slug]` detail | M (4h) | A3 |
| A6 | Replace mock data in `/bible-study` page + `[slug]` detail | M (4h) | A3 |
| A7 | Replace mock data in `/videos` page | S (2h) | A3 |
| A8 | Replace mock data in `/daily-bread` page | S (2h) | A3 |
| A9 | Replace mock data in homepage sections (SpotlightMedia, HighlightCards, UpcomingEvents, etc.) | L (1d) | A3 |
| A10 | Replace mock data in ministry/campus pages | M (4h) | A3 |

**Acceptance criteria**:
- All public website pages render content from PostgreSQL
- Zero visual regressions
- `npm run build` succeeds in laubf-test
- Mock data files can be safely deleted

**Note on architecture**: This phase intentionally keeps the two-app structure. The public website (laubf-test) gets its own Prisma client pointed at the same database. This creates some duplication but lets us prove the rendering pipeline without a risky app consolidation.

---

## Phase B: Section Component Migration & Registry

**Goal**: Move section components from `laubf-test/` into the root project, create the section registry and catch-all page route. This sets up the data-driven rendering architecture.

**Fidelity**: Full functionality. Components should work identically to their laubf-test versions. No visual redesign — just relocation + JSONB prop adaptation.

**Why this comes second**: Once we've proven the components work with real data (Phase A), we can safely migrate them to the consolidated architecture.

### Steps

| # | Task | Effort | Depends On |
|---|---|---|---|
| B1 | Create `components/website/sections/` directory in root project | S (1h) | — |
| B2 | Create `components/website/sections/registry.tsx` (section type → component map) | M (4h) | B1 |
| B3 | Create `components/website/sections/section-wrapper.tsx` | S (2h) | B1 |
| B4 | Migrate P0 sections (6): HeroBanner, MediaText, AllMessages, AllEvents, SpotlightMedia, CTABanner | L (2d) | B2 |
| B5 | Create `app/(website)/layout.tsx` with ThemeProvider, Navbar, Footer | M (1d) | B1, DAL |
| B6 | Create `app/(website)/[[...slug]]/page.tsx` catch-all route | M (4h) | B2, B5 |
| B7 | Create `lib/tenant/context.ts` with `getChurchId()` | S (1h) | — |
| B8 | Seed Page + PageSection records for LA UBF (all pages from doc 03 section 11) | L (1d) | DB seed |
| B9 | Migrate P1 sections (12): AllBibleStudies, AllVideos, FAQSection, FormSection, EventCalendar, RecurringMeetings, HighlightCards, UpcomingEvents, MinistryHero, CampusCardGrid, MeetTeam, MinistrySchedule | L (3d) | B4 |
| B10 | Migrate P2 sections (20): remaining components | L (3d) | B9 |
| B11 | Create Navbar/Footer from Menu + SiteSettings data | M (1d) | B5, DAL |
| B12 | Verify all pages render identically to laubf-test | M (1d) | B10 |

**Acceptance criteria**:
- `app/(website)/[[...slug]]` renders all pages from the database
- Section registry maps all 38 section types to components
- Theme CSS variables are injected from ThemeCustomization
- Navbar and footer are data-driven from Menu/SiteSettings
- Visual parity with laubf-test public site

**Section migration notes**:
- Each section component needs its TypeScript interface updated to match the JSONB structure documented in doc 03
- Dynamic sections become async RSCs that call DAL functions
- Static sections receive JSONB content as props
- The `cn()` utility, shadcn/ui imports, and lucide-react icons need to resolve correctly in the root project

---

## Phase C: Website Builder Admin

**Goal**: Build the CMS admin UI for managing pages, sections, navigation, and themes.

**Fidelity**: Working prototype — functional CRUD with basic UX. Polish comes later.

**Handled by**: Separate agent. This document provides the API contract and data model; the builder UI is a separate workstream.

### What the builder admin needs:

**Page Management** (`/cms/website/pages/`)
- List all pages with status indicators
- Create new page (title, slug, page type)
- Edit page metadata (title, slug, SEO fields)
- Publish/unpublish pages
- Delete pages (with confirmation)

**Section Editor** (`/cms/website/pages/[slug]/edit`)
- View sections in order
- Add section (pick from section type gallery)
- Edit section content (type-specific form)
- Reorder sections (drag-and-drop)
- Remove section
- Toggle section visibility
- Change section color scheme / padding / width

**Navigation Editor** (`/cms/website/navigation/`)
- View menu items in tree structure
- Add/remove/reorder menu items
- Edit labels, links, icons
- Configure dropdown groups

**Theme Customizer** (`/cms/website/theme/`)
- Color pickers for brand colors
- Font selector (curated pairings)
- Border radius and spacing controls
- Live preview panel

### API Routes needed (from doc 07 section 6):
- `POST /api/v1/pages` — create page
- `PATCH /api/v1/pages/[slug]` — update page metadata
- `POST /api/v1/pages/[slug]/sections` — add section
- `PATCH /api/v1/pages/[slug]/sections/[id]` — update section content
- `PUT /api/v1/pages/[slug]/sections` — reorder sections
- `DELETE /api/v1/pages/[slug]/sections/[id]` — remove section
- `PATCH /api/v1/theme` — update theme customization
- `PATCH /api/v1/menus/[slug]` — update menu structure

---

## Phase D: Multi-Tenant Middleware

**Goal**: Enable multiple churches to use the platform via subdomains and custom domains.

**Fidelity**: Full functionality. This is infrastructure, not UI.

**Prerequisite**: Auth (Phase 6.1 in database docs) must be in place.

### Steps

| # | Task | Effort | Depends On |
|---|---|---|---|
| D1 | Create `middleware.ts` with hostname → church_id resolution | M (4h) | Auth |
| D2 | Create `lib/tenant/resolve.ts` (custom domain + subdomain lookup) | M (4h) | D1 |
| D3 | Update `(website)/layout.tsx` to read church_id from middleware header | S (1h) | D1 |
| D4 | Update `(admin)/layout.tsx` to verify user belongs to resolved church | S (2h) | D1, Auth |
| D5 | Create Prisma client extension for automatic tenant scoping | M (4h) | D1 |
| D6 | Create second test church in seed for isolation testing | M (2h) | D5 |
| D7 | Verify complete data isolation between two churches | M (4h) | D6 |

**Acceptance criteria**:
- `la-ubf.localhost:3000` shows LA UBF content
- `grace.localhost:3000` shows Grace Church content (test org)
- No data leaks between tenants
- CMS admin at `la-ubf.localhost:3000/cms` only shows LA UBF data
- Unknown subdomains show 404

---

## Phase E: Caching & Performance

**Goal**: Optimize for production traffic levels.

**Fidelity**: Performance-focused. No UI changes.

**When to start**: After multi-tenancy works, before scaling past ~10 churches.

### Steps

| # | Task | Effort | Depends On |
|---|---|---|---|
| E1 | Add `unstable_cache` wrappers to DAL functions for website queries | M (4h) | Phase B |
| E2 | Set up cache tags per church + entity type | S (2h) | E1 |
| E3 | Add `revalidateTag()` calls to all CMS write API routes | M (4h) | E2 |
| E4 | Add Redis (Upstash) for query-level caching | M (4h) | E1 |
| E5 | Configure Cloudflare Cache Rules for public pages | S (2h) | E4 |
| E6 | Add connection pooling (PgBouncer) | M (4h) | Multi-tenant |
| E7 | Load test with simulated multi-tenant traffic | L (1d) | E6 |

**Cache TTLs by data type**:
| Data | Strategy | TTL |
|---|---|---|
| Site settings | `unstable_cache` + tag | Until CMS change |
| Theme | `unstable_cache` + tag | Until CMS change |
| Menu structure | `unstable_cache` + tag | Until CMS change |
| Page sections | `unstable_cache` + tag | Until CMS change |
| Messages/events/content | `unstable_cache` + tag | Until CMS change |
| Full page (CDN) | `stale-while-revalidate` | 5 min |

**Key principle**: Use on-demand revalidation (`revalidateTag`) over time-based TTLs. This gives instant updates when admins publish content, without the complexity of short TTLs.

---

## Phase F: Production Deployment

**Goal**: Deploy for the first real church (LA UBF).

**Fidelity**: Production-ready. Real domain, real SSL, real content.

### Steps

| # | Task | Effort | Depends On |
|---|---|---|---|
| F1 | Set up PostgreSQL on Azure VM (or Azure Database for PostgreSQL) | S (2h) | — |
| F2 | Run migration + seed on production database | S (1h) | F1 |
| F3 | Deploy Next.js (standalone) with PM2 + Caddy on Azure VM | M (4h) | F2 |
| F4 | Configure Cloudflare DNS + wildcard SSL for `*.lclab.io` | S (2h) | F3 |
| F5 | Configure subdomain: `laubf.lclab.io` | S (1h) | F4 |
| F6 | Configure custom domain: `laubf.org` with Caddy On-Demand TLS (if ready) | M (4h) | F4 |
| F7 | Set up error tracking (Sentry) | S (2h) | F3 |
| F8 | Set up uptime monitoring | S (1h) | F3 |
| F9 | Import real LA UBF content (sermons, events from existing sources) | L (2d) | F2 |
| F10 | QA pass on all pages with real content | L (1d) | F9 |

---

## Fidelity Guide: Frontend Development Stages

Since the website builder admin isn't built yet, here's how to think about frontend fidelity at each phase:

### Phase A-B: Full Fidelity (Existing Components)
The 38 section components already exist and are styled. They work. The job is to **preserve their styling** while swapping mock data for real data. No new UI design needed.

### Phase C: Prototype Fidelity (Builder Admin)
The website builder admin UI is new. Build it at **functional prototype** level:
- Use shadcn/ui components throughout
- Focus on correct CRUD operations
- Basic responsive layout
- Don't spend time on polish, animations, or edge case UX
- The builder admin is for church admins, not end users — it can be utilitarian

### Phase D-E: Infrastructure Only
No frontend changes. These are backend/infrastructure phases.

### Phase F: Production Fidelity
Before launch, do a visual QA pass:
- All section components render correctly with real content
- Responsive breakpoints work
- Theme tokens apply correctly
- Navigation works on mobile
- SEO metadata is correct
- Performance is acceptable (< 3s LCP)

---

## Effort Summary

| Phase | Calendar Days | Can Parallelize With |
|---|---|---|
| A: Single-Tenant Rendering | 5-7 days | — |
| B: Component Migration | 7-10 days | — |
| C: Builder Admin | 10-15 days | Phase B (after B6) |
| D: Multi-Tenant | 3-5 days | Phase C |
| E: Caching | 3-5 days | Phase C |
| F: Production | 3-5 days | — |
| **Total** | **31-47 days** | |

**Critical path**: A → B → (C + D + E in parallel) → F

With parallelization of Phase C (builder admin) with D/E, the critical path is approximately **25-35 working days**.
