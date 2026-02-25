# Implementation Roadmap

## Current Status and What to Build Next

> **Last updated**: February 24, 2026
> **Current state**: See Status Dashboard below.

---

## Phase Mapping: Database ↔ Website Rendering

The project uses two phase numbering systems. This table shows how they map:

| Database Phase | Website Phase | Description | Status |
|---|---|---|---|
| Phases 1-4 | — | Schema, migration, seed, DAL, API routes, CMS integration | **COMPLETE** |
| Phase 5.1 | Phase A | Single-tenant rendering (Prisma + DAL in laubf-test) | **COMPLETE** |
| — | Phase B.1 | Route group, registry, ThemeProvider, FontLoader, 6 sections | **COMPLETE** |
| — | Phase B.2 | Section component migration (40/42 migrated) | **COMPLETE** |
| Phase 8.1 | Phase B.3 | Section registry + page seeding | **COMPLETE** |
| — | Phase C (v1) | Website builder admin UI (list-based editor) | **COMPLETE** |
| — | Phase C (v2) | Full-screen website builder (canvas + DnD) | **IN PROGRESS** |
| Phase 6.1 | — | Authentication | **COMPLETE** |
| Phase 7.1 | Phase D | Multi-tenant middleware | **NOT STARTED** |
| — | Phase E | Caching & performance | **NOT STARTED** |
| — | Phase F | Production deployment | **NOT STARTED** |

---

## Status Dashboard

### Database (Phases 1-4): COMPLETE

- Prisma schema: 32 models, 22 enums
- Migration applied and working
- Seed script: idempotent, creates LA UBF data (14 pages, 2 menus, theme, site settings)
- DAL: 15 modules, all take `churchId` as first param
- API routes: 15 files across 10 content types
- CMS integration: context providers wired to API

### Website Phase A (Single-Tenant Rendering): COMPLETE

- Prisma + read-only DAL installed in `laubf-test/`
- All 13 page files converted from mock data to DAL calls
- Adapter layer at `laubf-test/src/lib/adapters.ts`

### Website Phase B.1 (Route Group + Infrastructure): COMPLETE

- `app/(website)/` route group with `layout.tsx` and `[[...slug]]/page.tsx`
- Section registry at `components/website/sections/registry.tsx`
- ThemeProvider, FontLoader, SectionWrapper
- Tenant context (`lib/tenant/context.ts`)
- Website navbar and footer components
- 7 shared components at `components/website/shared/`
- Website design system CSS ported to root `app/globals.css`

### Website Phase B.2 (Section Migration): COMPLETE — 40/42 sections migrated

44 files in `components/website/sections/` (including registry.tsx, section-wrapper.tsx, and 2 client component companions). SectionType enum has 42 values total.

**Remaining placeholders (2):**
- `NAVBAR` — rendered in layout, not as a per-page section (placeholder is intentional)
- `DAILY_BREAD_FEATURE` — placeholder, no source implementation exists in laubf-test

All other 40 section types have real implementations (including CUSTOM_HTML and CUSTOM_EMBED added during migration).

### Bible Study Pages (Template Feature): COMPLETE

Dedicated `/bible-study` and `/bible-study/[slug]` routes for the public website. This is a fixed template (not a website builder section) — every church gets the same study detail layout.

- **Database**: BibleStudy + BibleStudyAttachment schema, DAL, API routes — all DONE
- **Seed Data**: 15 studies with full HTML content (questions, answers, bibleText, transcript), 34 attachments — DONE
- **Frontend**: StudyDetailView client component (split panes, 4 tabs, font controls, scroll-spy, mobile responsive) — DONE
- **Listing Page**: `/bible-study` route with hero section + filterable grid — DONE
- **Detail Page**: `/bible-study/[slug]` route with server-side data fetching + generateMetadata — DONE
- **Types**: `lib/types/bible-study.ts` (BibleStudyDetail, BibleStudyAttachment interfaces) — DONE
- **Shared**: `lib/website/bible-book-labels.ts` (canonical BibleBook → display name mapping) — DONE

See `docs/00_dev-notes/bible-study-implementation.md` for task-level tracking.

### Website Phase B.3 (Page Seeding): COMPLETE

- Seed script creates 14 pages with PageSections
- 2 menus (Header, Footer) with menu items
- Theme + ThemeCustomization
- SiteSettings

### Website Phase C v1 (Website Builder Admin — List-Based): COMPLETE

The initial website builder admin UI with all core CRUD functionality:

**API routes**: 20 endpoints across pages, sections, menus, theme, domains, site settings (all DONE).
**Admin pages** (all functional):
- `/cms/website/pages` — Pages manager (DataTable with search, sort, CRUD)
- `/cms/website/pages/[slug]` — Page editor (sections list, section picker, JSON editor, display settings, reorder)
- `/cms/website/theme` — Theme customizer (colors, fonts, font size, custom CSS)
- `/cms/website/navigation` — Navigation editor (menu items CRUD, hierarchy, reorder)
- `/cms/website/domains` — Domain manager (add/remove, DNS instructions)
- `/cms/website/settings` — Site settings (general, logo, contact, social, service times, SEO, maintenance)

**Components**: Section picker dialog (7 categories), section editor dialog (display settings + JSON content).

See `docs/00_dev-notes/website-admin-implementation.md` for the full implementation tracker.

### Website Phase C v2 (Full-Screen Builder): IN PROGRESS

The full-screen website builder replaces the v1 list-based editor with a canvas-based WYSIWYG experience:

**What exists:**
- Builder layout at `app/cms/website/builder/layout.tsx` (full-screen, auth check, no CMS sidebar)
- Builder entry page at `app/cms/website/builder/page.tsx` (redirect to homepage)
- Dependencies installed: @dnd-kit/core ^6.3.1, motion ^12.34.3, sonner ^2.0.7

**What is being built (48 tasks across 9 phases):**
- BuilderShell, BuilderSidebar, BuilderDrawer, BuilderTopbar, BuilderCanvas
- Live canvas rendering actual section components with interactive overlays
- Drag-and-drop section reordering
- Section picker modal with search and preview
- Page tree with status badges
- Type-specific section editor forms (replacing JSON editor)
- Design panel for in-builder theme customization
- Device preview (desktop/tablet/mobile)

**Status**: Phase 1 partially started (layout + entry page exist). Phases 2-9 not started.

See `docs/00_dev-notes/website-builder-plan.md` for the master plan and `docs/00_dev-notes/website-builder-status.md` for task-level tracking.

### Authentication: COMPLETE

- Auth implemented at `lib/auth/` (config, require-auth, types, edge-config)
- Session-based auth protecting `/cms/*` routes
- Builder layout uses `auth()` for authentication check

### Phases D-F: NOT STARTED

- **Phase D** (Multi-Tenant Middleware): No middleware.ts, no hostname→church resolution
- **Phase E** (Caching): No cache layer, no Redis, no revalidation tags
- **Phase F** (Production Deployment): No Azure VM, no Caddy, no DNS

---

## What Phases A-C Deliver

| Phase | What It Does | Result |
|---|---|---|
| **A**: Single-Tenant Rendering | Replace mock data in `laubf-test/` with PostgreSQL queries | Public website renders real CMS content |
| **B**: Component Migration | Move section components into root project (42 section types, 40 real + 2 placeholders), create `app/(website)/[[...slug]]` catch-all, section registry | One unified app, data-driven page rendering, `laubf-test/` can be retired |
| **C (v1)**: Website Builder Admin | List-based CRUD UI for pages, sections, menus, themes at `/cms/website/` | Church admins can manage their website structure |
| **C (v2)**: Full-Screen Builder | Canvas-based WYSIWYG editor with DnD, section picker, structured editors | Professional builder experience replacing v1 editor |

After A-C (v1), the full CMS + website builder + public rendering pipeline works end-to-end for a single church. Phase C (v2) upgrades the builder to a professional full-screen experience. Auth is now complete.

---

## Recommended Order — Updated

### 1. Auth (Database Phase 6.1) — COMPLETE

Auth is implemented at `lib/auth/`. Session-based auth protects `/cms/*` routes with login/logout, role checking, and session management.

---

### 2. Full-Screen Website Builder (Phase C v2) — IN PROGRESS

**Why next**: The v1 list-based editor is functional but basic. The full-screen builder provides the professional editing experience described in the PRD and Figma prototype.

**Scope** (~10-15 days): 48 tasks across 9 phases.
See `docs/00_dev-notes/website-builder-plan.md` for the master plan.

**Key milestones**:
- Phases 1-3 (P0): Layout shell + canvas + section picker = minimum functional builder
- Phases 4-5 (P0): Page tree + section editors = full editing capability
- Phases 6-9 (P1): Design panel + integration + polish

---

### 3. Production Deployment (Phase F, Partial) — Before Multi-Tenancy

**Why**: Deploy for LA UBF as a single-tenant site before building multi-tenancy.

This is counterintuitive but practical. Every SaaS founder who waited for multi-tenancy before launching their first customer regrets it. You don't need multi-tenancy to serve church #1.

**Scope** (~3-5 days):
- Set up Azure VM (B2s) with Caddy + PM2 + PostgreSQL
- Configure `laubf.lclab.io` (one subdomain — no wildcard DNS needed yet)
- Run migration + seed on production database
- Import real LA UBF content (sermons, events from existing sources)
- Set up Sentry for error tracking
- Set up uptime monitoring
- QA pass on all pages with real content

**What this proves**:
- The entire stack works end-to-end in production (not just localhost)
- Real content looks correct in real section components
- Performance is acceptable on a real server
- SSL, DNS, and Caddy reverse proxy are configured correctly

**What this does NOT require**:
- Wildcard DNS (just one A record for `laubf.lclab.io`)
- Wildcard SSL (Caddy auto-provisions a single cert)
- Custom domain support (Caddy On-Demand TLS is a Phase D concern)
- Redis, CDN caching, or any performance optimization
- Multi-tenant middleware

---

### 3. Multi-Tenant Middleware (Phase D) — When Church #2 Arrives

**Why**: Multi-tenancy is infrastructure for future growth, not a launch requirement.

**Trigger to start**: You have a second church that wants to use the platform.

**Scope** (~3-5 days):
- Create `middleware.ts` with hostname → `church_id` resolution
- Create `lib/tenant/resolve.ts` (subdomain extraction from `*.lclab.io`, custom domain lookup)
- Upgrade DNS to wildcard (`*.lclab.io → Azure VM IP`)
- Upgrade SSL to wildcard (Caddy + Cloudflare DNS plugin)
- Prisma client extension for automatic `WHERE churchId = ?` injection
- Create second test church in seed for data isolation testing
- Verify complete isolation between churches

**Acceptance criteria**:
- `laubf.lclab.io` shows LA UBF content
- `grace.lclab.io` shows Grace Church content
- No data leaks between tenants
- CMS at `laubf.lclab.io/cms` only shows LA UBF data

---

### 4. Caching (Phase E) — Only When Needed

**Why**: Premature optimization for 1-10 churches with a few hundred weekly visitors each. PostgreSQL on the same VM has sub-5ms query latency — that's plenty.

**Trigger to start**: You observe slow page loads, database becoming a bottleneck, or you're scaling to multiple Node.js processes that need shared cache.

**Scope** (~3-5 days):
- Add `'use cache'` / `cacheTag()` to DAL functions for website queries
- Add `revalidateTag()` calls to all CMS write API routes
- Configure Cloudflare Cache Rules for static assets and ISR pages
- Add Redis only if running multiple processes/servers (see `docs/website-rendering/07-caching.md`)

**What you already get for free** (no work needed):
- Next.js built-in filesystem + in-memory cache (works on self-hosted)
- Cloudflare free tier caches static assets (JS, CSS, images, fonts) globally
- Browser caching via Next.js automatic `Cache-Control` headers

---

## The Revised Critical Path

```
COMPLETED:
  Database Phases 1-4 ........................ DONE
  Phase A: Single-Tenant Rendering ........... DONE
  Phase B.1: Route Group + Infrastructure .... DONE
  Phase B.2: Section Migration ............... 40/42 DONE (2 intentional placeholders)
  Phase B.3: Page Seeding .................... DONE
  Auth (Database Phase 6.1) .................. DONE
  Phase C v1: Website Builder Admin UI ....... DONE (list-based editor, all CRUD)

IN PROGRESS:
  Phase C v2: Full-Screen Builder ............ 10-15 days ← CURRENT
    ├── Phases 1-3 (P0, layout+canvas+picker) ← NEXT
    ├── Phases 4-5 (P0, pages+editors)
    └── Phases 6-9 (P1, design+polish)

REMAINING:
  Phase F (partial): Deploy LA UBF ........... 3-5 days

  ════════════════════════════════════════════
  ║  LA UBF IS LIVE — real users, real data  ║
  ════════════════════════════════════════════

  Phase D: Multi-Tenant Middleware ........... 3-5 days (when church #2 ready)
  Phase E: Caching & Performance ............. 3-5 days (when traffic justifies)
```

**Remaining to first launch**: ~13-20 working days (Phase C v2 + F)
**Note**: v1 editor is functional now — launch could happen with v1 if needed.
**Total to multi-tenant**: +3-5 days after launch

---

## Why This Order Over D → E → F

The original documented order (A → B → C → D → E → F) assumes a sequential waterfall where everything must be built before anything ships. In practice:

| Principle | Implication |
|---|---|
| **Auth before deployment** is a hard requirement | Can't ship an open CMS to a real church |
| **Deploy before multi-tenancy** gets you to market faster | Single-tenant is a subset of multi-tenant, not a different architecture |
| **Caching is premature optimization** for 1 church | PostgreSQL on the same VM is fast enough for hundreds of visitors |
| **Multi-tenancy is scaling work, not launch work** | You need it for church #2-10, not church #1 |
| **Real-world feedback > architecture completeness** | Ship, learn, iterate — don't build in a vacuum |

The key insight: **Phases D and E are growth infrastructure.** They add zero value until you have multiple churches or significant traffic. Delaying them costs nothing and lets you launch weeks earlier.

---

## Cross-References

| Topic | Document |
|---|---|
| Unified status, phase specs, AI prompts | `docs/00_dev-notes/development-status.md` |
| Website builder master plan | `docs/00_dev-notes/website-builder-plan.md` |
| Website builder task tracker | `docs/00_dev-notes/website-builder-status.md` |
| Website builder v1 implementation | `docs/00_dev-notes/website-admin-implementation.md` |
| Website builder PRD | `docs/01_prd/02-prd-website-builder.md` |
| Hosting & domain setup | `docs/03_website-rendering/06-hosting-domain-strategy.md` |
| Caching strategy | `docs/03_website-rendering/07-caching.md` |
| Database visual guide | `docs/02_database/01-architecture.md` (Section 15) |
| Development notes | `docs/00_dev-notes/development-notes.md` |
