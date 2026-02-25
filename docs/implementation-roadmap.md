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
| — | Phase C | Website builder admin UI | **DATA MODEL COMPLETE, ADMIN UI NOT IMPLEMENTED** |
| Phase 6.1 | — | Authentication | **NOT STARTED** |
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

### Website Phase B.3 (Page Seeding): COMPLETE

- Seed script creates 14 pages with PageSections
- 2 menus (Header, Footer) with menu items
- Theme + ThemeCustomization
- SiteSettings

### Website Phase C (Website Builder Admin): DATA MODEL COMPLETE, ADMIN UI NOT IMPLEMENTED

**What exists:**
- Database models for pages, sections, menus, themes, site settings (all seeded)
- `resolveSectionData()` for dynamic section data resolution
- DAL modules for pages, menus, and theme (read/write functions ready)

**What does NOT exist (stub pages only):**
- `/cms/website/pages` — 10-line stub page (title + description only)
- `/cms/website/navigation` — 10-line stub page
- `/cms/website/theme` — 10-line stub page
- `/cms/website/domains` — 10-line stub page
- No page builder UI, no section editor, no drag-and-drop, no menu editor, no theme customizer
- No website builder API routes (pages CRUD, sections CRUD, menus CRUD, theme CRUD)

**Status: The website builder admin UI is the next major feature to implement.** The data model and DAL layer are ready; the API routes and admin interface both need to be built.

### Authentication: NOT STARTED (Critical Blocker)

Schema exists (User, Session, ChurchMember tables with MemberRole enum) but no implementation:
- No login/logout pages
- No session management
- No middleware protecting `/cms/*` routes
- No password hashing

**This is the hard gate for production deployment.**

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
| **C**: Website Builder Admin | CRUD UI for pages, sections, menus, themes at `/cms/website/` | Church admins can manage their website structure |

After A-C, the full CMS + website builder + public rendering pipeline works end-to-end for a single church, with no authentication and no production deployment.

---

## Recommended Order After A-C

### 1. Auth (Database Phase 6.1) — Do This First

**Why**: This is the hard gate for everything after it.

Without auth:
- The CMS admin is wide open — anyone can edit content
- Multi-tenancy can't work (no way to verify "does this user belong to this church?")
- You can't deploy to production responsibly

**Scope** (~3-5 days):
- Session-based auth (email/password) using the existing `User`, `Session`, and `ChurchMember` tables
- Login / logout pages
- Middleware to protect `/cms/*` routes (redirect to login if no session)
- `ChurchMember` role checking (OWNER, ADMIN, EDITOR, VIEWER)
- Password hashing (bcrypt or argon2)
- Session token management (create on login, delete on logout, check expiry)

**What already exists in the schema**:
- `User` table (email, passwordHash, emailVerified, twoFactorEnabled)
- `Session` table (userId, token, expiresAt, ipAddress, userAgent)
- `ChurchMember` table (churchId, userId, role)
- `MemberRole` enum (OWNER, ADMIN, EDITOR, VIEWER)

No new tables needed — just the implementation.

---

### 2. Production Deployment (Phase F, Partial) — Before Multi-Tenancy

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

REMAINING:
  Phase B.2: Section Migration ............... DONE (40/42, 2 intentional placeholders)
  Phase C: Website Builder Admin UI .......... 10-15 days ← NEXT
  Auth (Database Phase 6.1) .................. 3-5 days ← GATE
  Phase F (partial): Deploy LA UBF ........... 3-5 days

  ════════════════════════════════════════════
  ║  LA UBF IS LIVE — real users, real data  ║
  ════════════════════════════════════════════

  Phase D: Multi-Tenant Middleware ........... 3-5 days (when church #2 ready)
  Phase E: Caching & Performance ............. 3-5 days (when traffic justifies)
```

**Remaining to first launch**: ~20-28 working days (Phase C + Auth + F)
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
| Unified status, phase specs, AI prompts | `docs/development-status.md` (consolidates former database/04-05 and website-rendering/04-05) |
| Hosting & domain setup | `docs/website-rendering/06-hosting-domain-strategy.md` |
| Caching strategy | `docs/website-rendering/07-caching.md` |
| Database visual guide | `docs/database/01-architecture.md` (Section 15) |
| Development notes | `docs/development-notes.md` |
