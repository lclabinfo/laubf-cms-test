# Development Status & Roadmap

## Unified Project Status, Phase Specifications, and Implementation Prompts

> **Last updated**: February 24, 2026
>
> This document consolidates the database implementation roadmap, website rendering development phases, and all AI-ready implementation prompts into a single reference. It replaces the previously separate documents at `docs/database/04-implementation-roadmap.md`, `docs/database/05-ai-optimized-next-steps.md`, `docs/website-rendering/04-development-phases.md`, and `docs/website-rendering/05-ai-optimized-next-steps.md`.

---

## Section 1: Project Status Dashboard

| Phase | Name | Status | Notes |
|---|---|---|---|
| DB 1.1 | Prisma Schema | COMPLETE | 32 models, 22 enums, Prisma 7.4.1 |
| DB 1.2 | Migration + Client | COMPLETE | Init migration applied, client singleton at `lib/db/client.ts` |
| DB 1.3 | Seed Script | COMPLETE | 28 messages, 11 events, 15 bible studies, 6 videos, 1 daily bread, 11 speakers, 3 series, 5 ministries, 12 campuses |
| DB 2.1 | DAL Modules | COMPLETE | 15 modules in `lib/dal/` (messages, events, bible-studies, videos, daily-bread, speakers, series, ministries, campuses, site-settings, pages, menus, theme, types, index) |
| DB 3.1 | API Routes | COMPLETE | 15 REST route files across 10 content types at `app/api/v1/` |
| DB 4.1 | CMS Integration | COMPLETE | Context providers fetch from API, CMS list/create/edit/delete all wired to DB |
| DB 5.1 | Public Website (laubf-test) | COMPLETE | = Website Phase A. Prisma + DAL in laubf-test, all 13 pages use DB |
| DB 6.1 | Authentication | NOT STARTED | CRITICAL BLOCKER. No login, session, or protected routes. Schema has User/Session/ChurchMember tables ready |
| DB 7.1 | Multi-Tenancy | NOT STARTED | = Website Phase D. Middleware, tenant resolution, data isolation |
| DB 8.1 | Website Builder Data | COMPLETE | = Website Phase B (seed portion). 14 pages seeded with PageSections, menus, theme |
| DB 9.1 | Production Readiness | NOT STARTED | = Website Phase F. Deployment config, monitoring, health checks |
| Web A.1 | Prisma in laubf-test | COMPLETE | DB client, church ID helper, 14 read-only DAL modules |
| Web A.2 | Replace Mock Data | COMPLETE | All 13 page files converted, adapter layer at `src/lib/adapters.ts` |
| Web B.1 | Route Group + Registry | COMPLETE | `(website)` route group, section registry (40 entries), ThemeProvider, FontLoader, SectionWrapper, catch-all page route, 6 initial sections + 7 shared components migrated |
| Web B.2 | Section Migration | COMPLETE (40/42) | 40 real section components migrated (including CUSTOM_HTML and CUSTOM_EMBED added during migration). 2 placeholders remain: NAVBAR (handled by layout component), DAILY_BREAD_FEATURE (no source implementation exists in laubf-test) |
| Web B.3 | Seed Data | COMPLETE | 14 pages with sections, Theme + ThemeCustomization, SiteSettings, Header + Footer menus with items |
| Web C (v1) | Website Builder Admin (list-based) | COMPLETE | 20 API endpoints, 6 admin pages with full CRUD: pages manager, section editor (picker + JSON), theme customizer, navigation editor, domain manager, site settings. See `docs/00_dev-notes/website-admin-implementation.md` |
| Web C (v2) | Full-Screen Builder (canvas-based) | IN PROGRESS | Builder layout + entry page exist at `app/cms/website/builder/`. 48 tasks across 9 phases. @dnd-kit, motion, sonner installed. See `docs/00_dev-notes/website-builder-plan.md` and `docs/00_dev-notes/website-builder-status.md` |
| Web D | Multi-Tenant Middleware | NOT STARTED | = DB 7.1. Requires Auth (DB 6.1) first |
| Web E | Caching & Performance | NOT STARTED | `unstable_cache` wrappers, tag-based invalidation |
| Web F | Production Deployment | NOT STARTED | = DB 9.1. Azure VM, Caddy, Cloudflare, monitoring |

---

## Section 2: Phase Cross-Reference Map

The database and website rendering docs describe overlapping phases from different perspectives. This map resolves the overlap.

| Database Phase | Website Phase | Scope | Which Doc Is More Detailed |
|---|---|---|---|
| DB 5.1: Public Website Integration | Web A: Single-Tenant Rendering | Prisma in laubf-test, replace mock data with DAL | Website rendering docs |
| DB 7.1: Multi-Tenancy | Web D: Multi-Tenant Middleware | middleware.ts, tenant resolution, domain routing | Both equally detailed |
| DB 8.1: Website Builder Foundation | Web B: Section Migration + Registry | Section registry, page seeding, SectionRenderer | Website rendering docs |
| DB 9.1: Production Readiness | Web F: Production Deployment | Deployment, monitoring, DNS | Database docs (infra), Website docs (Caddy/Cloudflare) |
| DB 6.1: Auth | (no website equivalent) | NextAuth, login page, session management | Database docs only |
| (no DB equivalent) | Web C: Website Builder Admin | CMS admin UI for pages, sections, menus, theme | Website rendering docs only |
| (no DB equivalent) | Web E: Caching & Performance | unstable_cache, revalidateTag, CDN | Website rendering docs only |

**Rule of thumb**: When both doc sets cover the same work, the website rendering docs are more detailed on the rendering pipeline and component architecture. The database docs are more detailed on schema design, DAL patterns, and API route implementation.

---

## Section 3: What's Next (Recommended Order)

Based on dependency analysis and the current project state, here is the recommended implementation order:

### 1. Section Migration Cleanup (Optional, Low Priority)
**Status**: 40/42 section types have real components. 2 remain as placeholders.
- **NAVBAR**: Handled by `components/website/layout/website-navbar.tsx` in the layout, not rendered as a section. Placeholder is correct behavior.
- **DAILY_BREAD_FEATURE**: No source implementation exists in laubf-test. Decision needed: build a new component or remove the SectionType from the enum.

**Recommendation**: Leave as-is for now. These placeholders do not block any downstream work.

### 2. Authentication -- COMPLETE
**Phase**: DB 6.1
**Status**: Implemented at `lib/auth/` (config, require-auth, types, edge-config). Session-based auth protects `/cms/*` routes.

### 3. Website Builder Admin v1 -- COMPLETE
**Phase**: Web C (v1)
**Status**: All CRUD operations functional. 20 API endpoints, 6 admin pages. See `docs/00_dev-notes/website-admin-implementation.md`.

### 4. Full-Screen Website Builder v2 -- IN PROGRESS
**Phase**: Web C (v2)
**Why next**: The v1 list-based editor works but lacks the WYSIWYG canvas and structured section editors described in the PRD and Figma prototype. The full-screen builder provides the professional editing experience.
**Effort**: 10-15 days (48 tasks across 9 phases)
**Dependencies**: Web C v1 (COMPLETE), Auth (COMPLETE)
**Tracking**: `docs/00_dev-notes/website-builder-plan.md` (master plan), `docs/00_dev-notes/website-builder-status.md` (task tracker)

### 5. Deploy LA UBF (Single-Tenant Production)
**Phase**: Web F / DB 9.1
**Why next**: Get the first real church live. Single-tenant deployment does not require multi-tenancy middleware.
**Effort**: 3-5 days
**Dependencies**: Auth (COMPLETE), functional website builder (Web C v1 COMPLETE, v2 optional)
**Note**: Could deploy with v1 editor while v2 builder is completed in parallel.

### 6. Multi-Tenant Middleware (Phase D)
**Phase**: Web D / DB 7.1
**Why next**: Enable additional churches to use the platform.
**Effort**: 2-3 days
**Dependencies**: Auth (COMPLETE)

### 7. Caching & Performance (Phase E)
**Phase**: Web E
**Why next**: Optimize for production traffic before scaling.
**Effort**: 1-2 days
**Dependencies**: Web B.1 (COMPLETE). Can run in parallel with Phase D.

### 8. Production Scale
**Phases**: Church onboarding flow, Redis caching, billing integration, advanced features
**Dependencies**: Multi-tenancy (Phase D), caching (Phase E)

**Critical path**: ~~Auth -> Website Builder Admin -> Deploy~~ Auth DONE, v1 Builder DONE -> Full-Screen Builder v2 (in progress) -> Deploy -> Multi-Tenant -> Scale

---

## Section 4: Detailed Phase Specifications

This section provides task breakdowns for all incomplete phases.

---

### Phase: Authentication (DB 6.1)

**Status**: NOT STARTED
**Effort**: M (2-3 days)
**Dependencies**: DB 4.1 (CMS wired to API) -- COMPLETE
**Priority**: P1 -- CRITICAL BLOCKER

#### Tasks

1. **Install NextAuth.js v5** (`next-auth@beta`, `@auth/prisma-adapter`, `bcryptjs`)
2. **Create auth configuration** at `lib/auth/config.ts`:
   - Prisma adapter with existing `prisma` client
   - Credentials provider (email + password)
   - JWT session strategy
   - Include `churchId` and `role` in JWT token and session
   - On sign-in, look up user's `ChurchMember` for churchId and role
3. **Create auth route handler** at `app/api/auth/[...nextauth]/route.ts`
4. **Create auth middleware** at `middleware.ts`:
   - Protect all `/cms/*` routes (redirect to `/login` if unauthenticated)
   - Protect all `/api/v1/*` routes (return 401 if no valid session)
   - Allow public routes without auth
5. **Create login page** at `app/login/page.tsx`:
   - Email + password form using shadcn/ui (Input, Button, Card)
   - Error handling, redirect to `/cms/dashboard` on success
6. **Seed a test admin user**:
   - Email: `admin@laubf.org`, Password: `admin123` (hashed with bcrypt)
   - `ChurchMember` with role `OWNER` for LA UBF
7. **Update API routes** to use authenticated session:
   - Create `lib/api/auth.ts` helper for `getAuthenticatedOrg()`
   - Replace hardcoded `getChurchId()` with session-based church ID
8. **Add session provider** to CMS layout:
   - Wrap children in `SessionProvider`
   - Show current user info in sidebar
   - Add logout button

#### Key Files Affected
- `lib/auth/config.ts` (new)
- `app/api/auth/[...nextauth]/route.ts` (new)
- `app/login/page.tsx` (new)
- `middleware.ts` (new or update)
- `lib/api/auth.ts` (new)
- `lib/api/get-church-id.ts` (modify to use session)
- `app/cms/layout.tsx` (add SessionProvider)
- `prisma/seed.mts` (add admin user)
- All `app/api/v1/*/route.ts` files (add auth check)

#### Acceptance Criteria
- Accessing `/cms/dashboard` without auth redirects to `/login`
- Login with `admin@laubf.org` / `admin123` succeeds
- After login, session contains `churchId` and `role`
- API routes return 401 without valid session
- Logout works and clears the session
- CMS sidebar shows logged-in user info

---

### Phase: Website Builder Admin v1 (Web C v1) -- COMPLETE

**Status**: COMPLETE
**Implementation tracker**: `docs/00_dev-notes/website-admin-implementation.md`

All 20 API endpoints and 6 admin pages are functional. See the implementation tracker for the complete feature list.

---

### Phase: Full-Screen Website Builder v2 (Web C v2) -- IN PROGRESS

**Status**: IN PROGRESS (Phase 1 partially started, Phases 2-9 not started)
**Effort**: L (10-15 days, 48 tasks across 9 phases)
**Dependencies**: Web C v1 (COMPLETE), Auth (COMPLETE)
**Priority**: P0-P1

**Master plan**: `docs/00_dev-notes/website-builder-plan.md`
**Task tracker**: `docs/00_dev-notes/website-builder-status.md`

#### What Exists
- Builder layout at `app/cms/website/builder/layout.tsx` (full-screen, auth check)
- Builder entry page at `app/cms/website/builder/page.tsx` (redirect to homepage)
- Dependencies: @dnd-kit/core ^6.3.1, motion ^12.34.3, sonner ^2.0.7

#### Phases
1. **Layout & Navigation Shell (P0)** -- builder shell, sidebar, drawer, topbar, routing
2. **Canvas & Section Rendering (P0)** -- WYSIWYG canvas, section selection, drag-and-drop
3. **Section Picker Modal (P0)** -- search, category, preview, add-to-page flow
4. **Pages & Menu Drawer (P0)** -- page tree, add page wizard, page settings
5. **Section Editors (P0)** -- modal-based type-specific editors (42 section types)
6. **Design Panel (P1)** -- in-builder theme customization
7. **Data Backup & Seed (P0)** -- export/restore LA UBF data
8. **CMS Admin Integration (P1)** -- wire pages list to builder, deprecate v1
9. **Polish & Edge Cases (P1)** -- unsaved changes, keyboard shortcuts, undo/redo

#### Acceptance Criteria
- Full-screen builder opens from pages list
- Canvas renders live section previews using actual section components
- Sections can be selected, edited, reordered (drag-and-drop), added, and deleted
- Page tree allows switching between pages
- Device preview shows desktop/tablet/mobile layouts
- All changes persist to database via existing API routes

---

### Phase: Multi-Tenant Middleware (Web D / DB 7.1)

**Status**: NOT STARTED
**Effort**: M (2-3 days)
**Dependencies**: Auth (DB 6.1) REQUIRED
**Priority**: P2

#### Tasks

1. **Create `middleware.ts`** at project root:
   - Three routing scenarios:
     - Platform domain (`lclab.io`, `www.lclab.io`): route to `(marketing)` route group
     - Church subdomain (`grace.lclab.io`) or custom domain (`gracechurch.org`): resolve to church_id, set `x-tenant-id` header
     - Development (localhost): support `?church=la-ubf` query param, subdomain on localhost, fallback to `CHURCH_SLUG` env var
   - For `/cms/*` paths: verify user belongs to resolved church
   - For all other paths: route to `(website)` route group

2. **Create `lib/tenant/resolve.ts`**:
   - `resolveChurchId(hostname: string)` -> string | null
   - Custom domain lookup: query `CustomDomain` table
   - Subdomain extraction from `*.lclab.io`
   - Return null for unknown hostnames

3. **Update `lib/tenant/context.ts`**:
   - `getChurchId()` reads from `x-tenant-id` header (set by middleware)
   - Falls back to env var for single-tenant

4. **Create Prisma tenant extension** at `lib/db/extensions/tenant.ts`:
   - Auto-inject `churchId` on all queries for tenant-scoped models
   - Auto-filter by `deletedAt IS NULL` for soft deletes

5. **Update `(website)/layout.tsx`** to use `getChurchId()` from tenant context

6. **Update API routes** to read church_id from middleware header

7. **Create second test church** in seed:
   - Name: "Grace Community Church", slug: "grace"
   - Minimal content: 1 speaker, 1 series, 3 messages, 2 events
   - Different SiteSettings and ThemeCustomization

#### Key Files Affected
- `middleware.ts` (new or major update)
- `lib/tenant/resolve.ts` (new)
- `lib/tenant/context.ts` (update)
- `lib/db/extensions/tenant.ts` (new)
- `lib/db/tenant.ts` (new)
- `app/(website)/layout.tsx` (update)
- `prisma/seed.mts` (add second church)
- All `app/api/v1/*/route.ts` files (use resolved church_id)

#### Acceptance Criteria
- `la-ubf.localhost:3000` shows LA UBF content
- `grace.localhost:3000` shows Grace Church content (different theme)
- No data leaks between tenants
- CMS admin at `la-ubf.localhost:3000/cms` only shows LA UBF data
- Unknown subdomains show 404
- `npm run build` succeeds

---

### Phase: Caching & Performance (Web E)

**Status**: NOT STARTED
**Effort**: M (1-2 days)
**Dependencies**: Web B.1 (COMPLETE)
**Priority**: P2

#### Tasks

1. **Create cache wrappers** at `lib/cache/website.ts`:
   - Wrap all DAL functions used by the public website with `unstable_cache`
   - Cache tags per church + entity type:
     - `getSiteSettings` -> tag: `church:{id}:site-settings`, revalidate: 3600
     - `getThemeWithCustomization` -> tag: `church:{id}:theme`, revalidate: 3600
     - `getMenuByLocation` -> tag: `church:{id}:menus`, revalidate: 1800
     - `getPageBySlug` -> tag: `church:{id}:pages`, revalidate: 600
     - `getMessages` -> tag: `church:{id}:messages`, revalidate: 300
     - `getEvents`, `getUpcomingEvents` -> tag: `church:{id}:events`, revalidate: 300
     - All other content queries -> tag: `church:{id}:content`, revalidate: 300

2. **Update website layout and page route** to use cached DAL functions

3. **Create cache invalidation helper** at `lib/cache/invalidate.ts`:
   - `invalidateChurchCache(churchId, entity)` calls `revalidateTag()`
   - Content changes also invalidate page rendering tags

4. **Add invalidation calls** to all CMS write API routes (POST, PATCH, DELETE)

5. **Configure Cloudflare Cache Rules** for public pages (production only)

#### Cache Strategy
Use on-demand revalidation (`revalidateTag`) as the primary mechanism. The `revalidate` parameter on `unstable_cache` is a fallback TTL. No Redis needed for 1-10 churches -- Next.js built-in cache is sufficient.

| Data | Strategy | TTL |
|---|---|---|
| Site settings | `unstable_cache` + tag | Until CMS change |
| Theme | `unstable_cache` + tag | Until CMS change |
| Menu structure | `unstable_cache` + tag | Until CMS change |
| Page sections | `unstable_cache` + tag | Until CMS change |
| Messages/events/content | `unstable_cache` + tag | Until CMS change |
| Full page (CDN) | `stale-while-revalidate` | 5 min |

#### Key Files Affected
- `lib/cache/website.ts` (new)
- `lib/cache/invalidate.ts` (new)
- `app/(website)/layout.tsx` (use cached functions)
- `app/(website)/[[...slug]]/page.tsx` (use cached functions)
- All `app/api/v1/*/route.ts` files (add invalidation calls)

#### Acceptance Criteria
- Website pages load with cached data
- Publishing a sermon in CMS appears on `/messages` within seconds
- Updating theme colors reflected on next page load
- Cache keys are tenant-namespaced
- `npm run build` succeeds

---

### Phase: Production Deployment (Web F / DB 9.1)

**Status**: NOT STARTED
**Effort**: M (3-5 days)
**Dependencies**: Auth (DB 6.1), Website Builder Admin (Web C)
**Priority**: P3

#### Tasks

1. **Set up PostgreSQL on Azure VM** (or Azure Database for PostgreSQL)
2. **Run migration + seed** on production database
3. **Deploy Next.js** (standalone output) with PM2 + Caddy on Azure VM
4. **Configure Cloudflare DNS** + wildcard SSL for `*.lclab.io`
5. **Configure subdomain**: `laubf.lclab.io`
6. **Configure custom domain**: `laubf.org` with Caddy On-Demand TLS (if ready)
7. **Set up error tracking** (Sentry)
8. **Set up uptime monitoring**
9. **Import real LA UBF content** (sermons, events from existing sources)
10. **QA pass** on all pages with real content

#### Deployment Architecture
- **Azure VM** (B2s, ~$30/month): PostgreSQL + Next.js + Caddy
- **Cloudflare** (free tier): CDN, DDoS protection, wildcard DNS (`*.lclab.io`)
- **Caddy**: HTTPS (automatic Let's Encrypt via DNS-01 challenge), reverse proxy to Next.js
- See `docs/website-rendering/06-hosting-domain-strategy.md` for full architecture

#### Environment Variables (Production)
```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXTAUTH_SECRET=<secure-secret>
NEXTAUTH_URL=https://lclab.io
PLATFORM_DOMAIN=lclab.io
CHURCH_SLUG=la-ubf
REDIS_URL=<optional>
SENTRY_DSN=<optional>
```

#### Key Files Affected
- `next.config.ts` (add `output: 'standalone'`)
- `.env.example` (new, all required env vars documented)
- `app/api/health/route.ts` (new)
- `package.json` (update scripts: `db:migrate`, `db:seed`, `postinstall`)

#### Acceptance Criteria
- `laubf.lclab.io` serves the LA UBF website with real content
- CMS admin accessible and functional
- HTTPS working with valid certificates
- Error tracking reports errors to Sentry
- Uptime monitoring sends alerts
- Performance acceptable (< 3s LCP)

---

## Section 5: AI-Ready Implementation Prompts

Copy-paste-ready prompts organized by the recommended implementation order from Section 3. Only includes prompts for phases that are NOT yet complete.

---

### Prompt 1: Authentication (DB 6.1)

**Effort**: M (2-3 days)
**Dependencies**: DB 4.1 (CMS wired to API) -- COMPLETE

> Add authentication to the CMS admin using NextAuth.js v5 (Auth.js). The User and Session models already exist in the Prisma schema.
>
> **1. Install NextAuth**:
> ```
> cd /Users/davidlim/Desktop/laubf-cms-test
> npm install next-auth@beta @auth/prisma-adapter
> ```
>
> **2. Create auth configuration** at `lib/auth/config.ts`:
> - Use the Prisma adapter with our existing `prisma` client
> - Configure Credentials provider (email + password)
> - Use JWT session strategy
> - Include `churchId` and `role` in the JWT token and session
> - On sign-in, look up the user's `ChurchMember` to get their churchId and role
>
> **3. Create auth route handler** at `app/api/auth/[...nextauth]/route.ts`
>
> **4. Create auth middleware** at `middleware.ts` (or update existing if present):
> - Protect all `/cms/*` routes -- redirect to `/login` if not authenticated
> - Protect all `/api/v1/*` routes -- return 401 if no valid session
> - Allow public routes (`/`, `/about`, `/events`, etc.) without auth
>
> **5. Create login page** at `app/login/page.tsx`:
> - Email and password form
> - Use the existing shadcn/ui components (Input, Button, Card)
> - Handle errors (invalid credentials, account locked, etc.)
> - Redirect to `/cms/dashboard` on successful login
>
> **6. Create a registration/user creation seed** -- Update the seed script to create a test admin user:
> - Email: "admin@laubf.org"
> - Password: "admin123" (hashed with bcrypt)
> - ChurchMember with role OWNER for the LA UBF org
> - Install bcrypt: `npm install bcryptjs @types/bcryptjs`
>
> **7. Update API routes** to use the authenticated session:
> - Replace the hardcoded `getChurchId()` helper with session-based org ID
> - Create `lib/api/auth.ts` helper:
>   ```typescript
>   import { auth } from '@/lib/auth/config'
>   export async function getAuthenticatedOrg() {
>     const session = await auth()
>     if (!session?.user?.churchId) throw new Error('Unauthorized')
>     return { churchId: session.user.churchId, userId: session.user.id, role: session.user.role }
>   }
>   ```
>
> **8. Add session provider** to the CMS layout at `app/cms/layout.tsx`:
> - Wrap children in SessionProvider
> - Show current user info in the sidebar/header
> - Add logout button
>
> **Important constraints:**
> - Do NOT add auth to the public website (`laubf-test/`) -- it stays public
> - Do NOT add auth to the `(website)` route group -- public website is unauthenticated
> - Use bcryptjs (not bcrypt) for password hashing -- it works in Edge runtime
> - Store NEXTAUTH_SECRET in `.env`
> - The login page should match the existing CMS design language
> - Read `prisma/schema.prisma` to understand the User, Session, and ChurchMember models
> - Read `app/cms/layout.tsx` to understand the existing CMS layout structure

**Verification checklist:**
- [ ] Accessing `/cms/dashboard` without auth redirects to `/login`
- [ ] Login with admin@laubf.org / admin123 succeeds
- [ ] After login, session contains churchId and role
- [ ] API routes at `/api/v1/*` return 401 without valid session
- [ ] API routes work with valid session and use session's churchId
- [ ] Logout works and clears the session
- [ ] Login page handles invalid credentials gracefully
- [ ] CMS sidebar shows logged-in user info

---

### Prompt 2: Website Builder Admin -- API Routes

**Effort**: M (2-3 days)
**Dependencies**: DB 3.1 (API Routes -- COMPLETE), DB 2.1 (DAL -- COMPLETE)

> Create API routes for the website builder at `/Users/davidlim/Desktop/laubf-cms-test/app/api/v1/`. These routes support the page management, section editing, navigation editing, and theme customization admin UIs.
>
> **Read these files first:**
> - `lib/dal/pages.ts` -- existing page DAL functions
> - `lib/dal/menus.ts` -- existing menu DAL functions
> - `lib/dal/theme.ts` -- existing theme DAL functions
> - `prisma/schema.prisma` -- Page, PageSection, Menu, MenuItem, Theme, ThemeCustomization models
> - `docs/database/03-website-schema.md` -- JSONB content structures for each SectionType
>
> **Create these API route files:**
>
> ```
> app/api/v1/
> ├── pages/
> │   ├── route.ts              GET (list all pages) + POST (create page)
> │   └── [slug]/
> │       ├── route.ts          GET (page with sections) + PATCH (update metadata) + DELETE
> │       └── sections/
> │           ├── route.ts      POST (add section) + PUT (reorder all sections)
> │           └── [id]/route.ts PATCH (update section content) + DELETE (remove section)
> ├── menus/
> │   ├── route.ts              GET (list menus)
> │   └── [slug]/route.ts       GET (menu with items) + PATCH (update menu structure)
> └── theme/
>     └── route.ts              GET (theme customization) + PATCH (update theme)
> ```
>
> **Each route handler should:**
> 1. Extract churchId (from auth session once Auth is implemented, or fall back to `getChurchId()` helper for now)
> 2. Parse and validate request body
> 3. Call the appropriate DAL function
> 4. Return standardized JSON responses matching the existing API pattern:
>    - Success: `{ success: true, data: { ... } }`
>    - Error: `{ success: false, error: { code: "NOT_FOUND", message: "..." } }`
>
> **Special handling for section reorder (PUT `/api/v1/pages/[slug]/sections`):**
> - Accepts an array of `{ id, sortOrder }` pairs
> - Updates all sections' sortOrder in a single transaction
>
> **Important constraints:**
> - Follow the same patterns used in existing routes at `app/api/v1/messages/route.ts`
> - Use the DAL functions, don't write raw Prisma queries in route handlers
> - Return appropriate HTTP status codes (201 for create, 200 for update, 204 for delete)

---

### Prompt 3: Website Builder Admin -- Page Management UI

**Effort**: L (3-4 days)
**Dependencies**: Website Builder API Routes (Prompt 2)

> Build the page management admin UI at `/Users/davidlim/Desktop/laubf-cms-test/app/cms/website/pages/`.
>
> **Read these files first:**
> - `app/cms/website/pages/page.tsx` -- current stub (just a heading)
> - `app/cms/messages/page.tsx` -- example of a working CMS list page (for pattern reference)
> - `components/cms/messages/columns.tsx` -- example of DataTable columns (for pattern reference)
> - `docs/database/03-website-schema.md` -- Page model, SectionType enum, JSONB structures
>
> **Build the pages list** at `app/cms/website/pages/page.tsx`:
> - Fetch all pages from `GET /api/v1/pages`
> - Display in a DataTable with columns: Title, Slug, Page Type, Status, Sections Count, Last Updated
> - Add "New Page" button that opens a create dialog
> - Add row actions: Edit, View (opens public URL), Publish/Unpublish, Delete
> - Use the existing shadcn/ui DataTable pattern from the messages page
>
> **Build the page editor** at `app/cms/website/pages/[slug]/edit/page.tsx`:
> - Fetch page with sections from `GET /api/v1/pages/[slug]`
> - Left panel: Page metadata form (title, slug, SEO fields, status)
> - Main panel: Section list in sortOrder
>   - Each section shows: type badge, preview/summary of content, action buttons
>   - "Add Section" button opens a gallery of available SectionType values
>   - Drag-and-drop reordering (use `@dnd-kit/sortable` or similar)
>   - Click on a section to open its editor in a Sheet/Dialog
>   - Delete section with confirmation
>   - Toggle visibility (isVisible field)
> - Section editor: Type-specific form based on SectionType
>   - Start with forms for the 10 most common types (HERO_BANNER, MEDIA_TEXT, CTA_BANNER, FAQ_SECTION, ALL_MESSAGES, ALL_EVENTS, SPOTLIGHT_MEDIA, HIGHLIGHT_CARDS, UPCOMING_EVENTS, PAGE_HERO)
>   - For other types, show a JSON editor as fallback
>
> **Important constraints:**
> - Use shadcn/ui components exclusively (Dialog, Sheet, Button, Input, Select, etc.)
> - Match the existing CMS design language (see other `/cms/*` pages)
> - Forms should validate before submission
> - Show loading states during API calls
> - Show toast notifications on success/error
> - The section editor forms should produce JSONB that matches the structures in `docs/database/03-website-schema.md` section 4

---

### Prompt 4: Website Builder Admin -- Navigation & Theme Editors

**Effort**: M (3-4 days)
**Dependencies**: Website Builder API Routes (Prompt 2)

> Build the navigation editor and theme customizer admin UIs.
>
> **Navigation Editor** at `app/cms/website/navigation/page.tsx`:
>
> Read `app/cms/website/navigation/page.tsx` (current stub) and `docs/database/03-website-schema.md` section 5 (Menu Data Mapping).
>
> Build:
> - Fetch menus from `GET /api/v1/menus`
> - Show HEADER and FOOTER menus as tabs
> - Tree view of menu items (support nesting via parentId)
> - Each item shows: label, link, icon, badge
> - Add new item button
> - Edit item inline or in a side sheet
> - Drag-and-drop reordering within and between levels
> - Delete item with confirmation
> - Save button calls `PATCH /api/v1/menus/[slug]` with the full menu structure
>
> **Theme Customizer** at `app/cms/website/theme/page.tsx`:
>
> Read `app/cms/website/theme/page.tsx` (current stub) and `prisma/schema.prisma` (ThemeCustomization model).
>
> Build:
> - Fetch current theme from `GET /api/v1/theme`
> - Color pickers for: primary, secondary, accent colors (oklch values)
> - Font selector: dropdown with curated Google Fonts pairings for heading + body
> - Spacing controls: border radius (slider), section padding defaults
> - Logo upload field (URL input for now)
> - Save button calls `PATCH /api/v1/theme` with updated customization
> - Live preview panel showing how changes would look (optional, nice-to-have)
>
> **Important constraints:**
> - Use shadcn/ui components
> - Match existing CMS design patterns
> - Navigation editor must handle the nested structure (items can have children via parentId)

---

### Prompt 5: Multi-Tenant Middleware (Web D / DB 7.1)

**Effort**: M (2-3 days)
**Dependencies**: Auth (DB 6.1) REQUIRED

> Implement multi-tenant routing middleware for the root project at `/Users/davidlim/Desktop/laubf-cms-test/`.
>
> **Read the architecture docs first**:
> - `/docs/website-rendering/01-architecture.md` sections 6 (isolation) and 8 (app architecture)
> - `/docs/website-rendering/02-implementation.md` section 2 (middleware)
> - `/docs/database/01-architecture.md` sections 2 (tenant flow) and 6 (RLS)
>
> **1. Create `middleware.ts`** at the project root:
>
> The middleware must handle three routing scenarios:
>
> a) **Platform domain** (`lclab.io`, `www.lclab.io`):
>    -> Route to `(marketing)` route group (or a landing page for now)
>
> b) **Church subdomain** (`grace.lclab.io`) or **custom domain** (`gracechurch.org`):
>    -> Resolve to church_id
>    -> Set `x-tenant-id` header
>    -> For `/cms/*` paths: route to `(admin)` route group
>    -> For all other paths: route to `(website)` route group
>
> c) **Development** (localhost):
>    -> Support `?church=la-ubf` query parameter override
>    -> Support subdomain on localhost (`la-ubf.localhost:3000`)
>    -> Fall back to `CHURCH_SLUG` env var
>
> **2. Create `lib/tenant/resolve.ts`**:
> - `resolveChurchId(hostname: string)` -> string | null
> - Custom domain lookup: query `CustomDomain` table (cache result in-memory for the request)
> - Subdomain extraction from `*.lclab.io`
> - Return null for unknown hostnames
>
> **3. Update `lib/tenant/context.ts`** (already exists):
> - `getChurchId()` reads from `x-tenant-id` header
> - Falls back to env var for single-tenant
> - Throws if no context found
>
> **4. Create Prisma tenant extension** at `lib/db/extensions/tenant.ts`:
> - Auto-inject `churchId` on all queries for tenant-scoped models
> - Auto-filter by `deletedAt IS NULL` for soft deletes
>
> **5. Update `(website)/layout.tsx`** to use `getChurchId()` from tenant context
>
> **6. Update API routes** to read church_id from middleware header instead of hardcoded env var
>
> **7. For local development**, update `.env`:
> ```
> PLATFORM_DOMAIN=localhost:3000
> CHURCH_SLUG=la-ubf
> ```
>
> **8. Create a second test church** in the seed script:
> - Name: "Grace Community Church", slug: "grace"
> - Minimal content: 1 speaker, 1 series, 3 messages, 2 events
> - SiteSettings with different name/colors
> - ThemeCustomization with different primary color
>
> **Important constraints:**
> - The middleware must work in the Edge runtime (no Node.js-only APIs)
> - For database lookups in middleware, use a lightweight approach (e.g., Prisma with edge adapter, or a simple fetch to an internal API route)
> - If Edge + Prisma is problematic, use an internal `/api/internal/resolve-tenant` route that the middleware calls
> - Do NOT use AsyncLocalStorage in middleware -- use headers for tenant propagation
> - Keep backward compatibility -- existing single-tenant behavior must still work
> - Do NOT modify the Prisma schema

**Verification checklist:**
- [ ] `la-ubf.localhost:3000` shows LA UBF website
- [ ] `grace.localhost:3000` shows Grace Church website (different content, different theme)
- [ ] `/cms` routes are accessible and show correct church's data
- [ ] API routes use the resolved church_id
- [ ] Unknown subdomains show 404 or redirect
- [ ] Platform domain shows marketing/landing page
- [ ] No data leaks between tenants
- [ ] `npm run build` succeeds

---

### Prompt 6: Caching & Performance (Web E)

**Effort**: M (1-2 days)
**Dependencies**: Web B.1 (COMPLETE)

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
> - `getSiteSettings` -> tag: `church:{id}:site-settings`, revalidate: 3600
> - `getThemeWithCustomization` -> tag: `church:{id}:theme`, revalidate: 3600
> - `getMenuByLocation` -> tag: `church:{id}:menus`, revalidate: 1800
> - `getPageBySlug` -> tag: `church:{id}:pages`, revalidate: 600
> - `getMessages` -> tag: `church:{id}:messages`, revalidate: 300
> - `getEvents`, `getUpcomingEvents`, etc. -> tag: `church:{id}:events`, revalidate: 300
> - All other content queries -> tag: `church:{id}:content`, revalidate: 300
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
> - `POST /api/v1/messages` -> `invalidateChurchCache(churchId, 'messages')`
> - `PATCH /api/v1/messages/[slug]` -> `invalidateChurchCache(churchId, 'messages')`
> - `DELETE /api/v1/messages/[slug]` -> `invalidateChurchCache(churchId, 'messages')`
> - Same pattern for events, bible-studies, videos, daily-bread, speakers, series
> - `PATCH /api/v1/site-settings` -> `invalidateChurchCache(churchId, 'site-settings')`
> - `PATCH /api/v1/theme` -> `invalidateChurchCache(churchId, 'theme')`
> - Menu changes -> `invalidateChurchCache(churchId, 'menus')`
> - Page/section changes -> `invalidateChurchCache(churchId, 'pages')`
>
> **Important constraints:**
> - `unstable_cache` is the correct API for Next.js 16 (it may be renamed to `cache` in future versions)
> - Cache tags must be tenant-namespaced to prevent cross-tenant cache pollution
> - The `revalidate` parameter is a fallback TTL -- on-demand invalidation via tags is the primary mechanism
> - Do NOT add Redis yet -- Next.js's built-in cache is sufficient for 1-10 churches
> - Test that content changes in the CMS are reflected on the public website within seconds

**Verification checklist:**
- [ ] Website pages load with cached data (check Next.js cache headers)
- [ ] Publishing a sermon in CMS appears on `/messages` within seconds
- [ ] Updating theme colors reflected on next page load
- [ ] Editing site settings -> footer/navbar update
- [ ] Cache keys are tenant-namespaced (no cross-church contamination)
- [ ] `npm run build` succeeds

---

### Prompt 7: Production Deployment (Web F / DB 9.1)

**Effort**: M (3-5 days)
**Dependencies**: Auth (DB 6.1), Website Builder (Web C)

> Prepare the project for production deployment on an Azure VM (B2s) with Caddy reverse proxy, PostgreSQL, and Cloudflare CDN. See `docs/website-rendering/06-hosting-domain-strategy.md` for the deployment architecture.
>
> **1. Create environment configuration**:
>
> Create `.env.example` at the root with all required environment variables:
> ```
> # Database
> DATABASE_URL="postgresql://..."
> DIRECT_URL="postgresql://..."
>
> # Auth
> NEXTAUTH_SECRET="generate-a-secure-secret"
> NEXTAUTH_URL="https://your-domain.com"
>
> # Tenant
> PLATFORM_DOMAIN="lclab.io"
> CHURCH_SLUG="la-ubf"
>
> # Optional
> REDIS_URL=""
> SENTRY_DSN=""
> ```
>
> **2. Update `package.json` scripts**:
> ```json
> {
>   "scripts": {
>     "dev": "next dev",
>     "build": "prisma generate && next build",
>     "start": "next start",
>     "lint": "eslint",
>     "db:push": "prisma db push",
>     "db:migrate": "prisma migrate deploy",
>     "db:seed": "prisma db seed",
>     "db:studio": "prisma studio",
>     "postinstall": "prisma generate"
>   }
> }
> ```
>
> **3. Configure Next.js standalone output** in `next.config.ts`:
> - Set `output: 'standalone'` for self-hosted deployment
> - The standalone build includes only the files needed for production
> - Deployed via PM2 process manager behind Caddy reverse proxy
>
> **4. Add error tracking** (optional but recommended):
> ```
> npm install @sentry/nextjs
> ```
> - Create `sentry.client.config.ts` and `sentry.server.config.ts`
> - Wrap the Next.js config with Sentry
>
> **5. Create health check endpoint** at `app/api/health/route.ts`:
> - Check database connectivity
> - Return status with response time
>
> **6. Configure DNS and hosting** (per `docs/website-rendering/06-hosting-domain-strategy.md`):
> - Wildcard A record: `*.lclab.io` -> Azure VM IP (Cloudflare proxied)
> - Apex A record: `lclab.io` -> Azure VM IP (Cloudflare proxied)
> - Caddy handles HTTPS with wildcard Let's Encrypt certificate via DNS-01 challenge
>
> **7. Set up monitoring**:
> - Sentry for error tracking
> - UptimeRobot or similar for availability
>
> **8. Import real LA UBF content** from existing sources:
> - Historical sermons (YouTube IDs, titles, dates, speakers)
> - Upcoming events
> - Bible study materials
>
> **Important constraints:**
> - Do NOT include any actual secrets in committed files
> - `.env.example` should have placeholder values only
> - Ensure `prisma generate` runs as part of the build
> - No secrets committed to git

**Verification checklist:**
- [ ] `.env.example` documents all required environment variables
- [ ] `npm run build` succeeds and includes Prisma generation
- [ ] Health check endpoint returns correct status
- [ ] Build works without a running database
- [ ] No secrets committed to git
- [ ] `laubf.lclab.io` serves the website (post-deployment)
- [ ] CMS admin accessible and functional (post-deployment)
- [ ] HTTPS working with valid certificates (post-deployment)

---

## Section 6: Completed Work Reference

Summary of completed phases for historical context.

### DB 1.1: Prisma Schema (COMPLETE)
- Installed Prisma 7.4.1 in root project
- Created `prisma/schema.prisma` with 32 models and 22 enums
- Created `prisma.config.ts` for Prisma 7.x configuration
- `.env` configured with `DATABASE_URL` and `DIRECT_URL`
- Validated with `npx prisma validate`

### DB 1.2: Migration + Client (COMPLETE)
- Applied initial migration (`20260223222632_init/migration.sql`)
- Created Prisma client singleton at `lib/db/client.ts` (uses `@prisma/adapter-pg` with `pg` Pool)
- Created type re-exports at `lib/db/types.ts`
- Created barrel export at `lib/db/index.ts`
- PostgreSQL 18 running natively (not Docker)

### DB 1.3: Seed Script (COMPLETE)
- Created `prisma/seed.mts` (ESM format)
- Seeds LA UBF church with: 28 messages, 11 events, 15 bible studies, 6 videos, 1 daily bread, 11 speakers, 3 series, 5 ministries, 12 campuses
- Idempotent (safe to re-run)
- Package.json configured: `"seed": "npx tsx prisma/seed.mts"`

### DB 2.1: DAL Modules (COMPLETE)
- Created 15 DAL modules at `lib/dal/`: messages, events, bible-studies, videos, daily-bread, speakers, series, ministries, campuses, site-settings, pages, menus, theme, types, index
- Every function takes `churchId` as first parameter
- All queries filter by `deletedAt: null` and default to `status: 'PUBLISHED'` for reads
- Includes pagination support for list endpoints
- Relations included via Prisma `include`

### DB 3.1: API Routes (COMPLETE)
- Created 15 route files at `app/api/v1/` across 10 content types
- Standardized JSON responses: `{ success, data, pagination }` for lists, `{ success, data }` for single, `{ success: false, error: { code, message } }` for errors
- `lib/api/get-church-id.ts` helper resolves `CHURCH_SLUG` env var to church UUID
- All routes support GET, POST, PATCH, DELETE as appropriate
- Verified manually with curl

### DB 4.1: CMS Integration (COMPLETE)
- Updated `lib/messages-context.tsx` and `lib/events-context.tsx` to fetch from API
- CMS list pages load data from database
- Create/edit/delete operations persist to database via API
- Speaker and series dropdowns populated from database
- Loading and error states added
- Optimistic updates for better UX

### Web A.1: Prisma in laubf-test (COMPLETE)
- Installed Prisma in `laubf-test/` project
- Generated client at `src/lib/generated/prisma/`
- DB client singleton at `src/lib/db/client.ts`
- Church ID helper at `src/lib/get-church-id.ts`
- 14 read-only DAL modules at `src/lib/dal/`

### Web A.2: Replace Mock Data (COMPLETE)
- All 13 page files in laubf-test use DAL calls
- Adapter layer at `src/lib/adapters.ts` transforms Prisma types to component-expected shapes
- Zero references to mock data remain in page files

### Web B.1: Route Group + Registry (COMPLETE)
- Created `(website)` route group with `app/(website)/layout.tsx` and `app/(website)/[[...slug]]/page.tsx`
- Section registry at `components/website/sections/registry.tsx` maps all 42 SectionType enum values
- ThemeProvider at `components/website/theme/theme-provider.tsx` injects CSS variables from DB
- FontLoader RSC for Google Fonts and custom font loading
- SectionWrapper handles colorScheme, padding, containerWidth
- Tenant context at `lib/tenant/context.ts` resolves `CHURCH_SLUG` -> church UUID
- `lib/dal/theme.ts` for `getThemeWithCustomization()`
- 6 initial sections migrated: hero-banner, media-text, spotlight-media, cta-banner, all-messages, all-events
- 7 shared components migrated: animate-on-scroll, cta-button, overline-label, section-container, section-header, theme-tokens, video-thumbnail

### Web B.2: Section Migration (COMPLETE -- 40/42)
- 40 real section components migrated to `components/website/sections/` (including 2 generic sections added during migration: CUSTOM_HTML, CUSTOM_EMBED)
- 23 shared component files at `components/website/shared/` (21 .tsx + 2 .ts)
- 2 SectionType values remain as placeholders: NAVBAR (handled by layout), DAILY_BREAD_FEATURE (no source exists)
- SectionType enum has 42 total values
- All sections updated with root project import paths
- Dynamic sections (all-messages, all-events, all-bible-studies, all-videos, upcoming-events, event-calendar, recurring-meetings, recurring-schedule, spotlight-media, highlight-cards) are async RSCs calling DAL

### Web B.3: Seed Data (COMPLETE)
- Seed creates 14 pages: Home, About, Messages, Events, Bible Study, Videos, Daily Bread, Ministries, 4 ministry subpages (College, Adults, Children, High School), I'm New, Giving
- Each page has appropriate PageSection records with JSONB content
- Theme + ThemeCustomization seeded with LA UBF brand values
- SiteSettings seeded with LA UBF contact info
- Header + Footer menus seeded with menu items matching current navigation
- Website design system CSS ported to root `app/globals.css`
- `motion` package added to root project

### Web C: Website Builder Admin (STUBS ONLY -- IN PROGRESS)
- 4 page routes created at `app/cms/website/`: pages, navigation, theme, domains
- All are empty stubs (heading + description only)
- No API routes created for pages/menus/theme CRUD
- No functional UI implemented

---

## Appendix A: Implementation Priority Matrix

| Priority | Task | Dependencies | Effort |
|---|---|---|---|
| **P0** | Install Prisma + write schema | None | 2-3 days | COMPLETE |
| **P0** | Run migration + seed LA UBF data | Schema | 1-2 days | COMPLETE |
| **P0** | Create DAL modules | Migration | 2-3 days | COMPLETE |
| **P0** | API routes | DAL | 3-4 days | COMPLETE |
| **P0** | CMS integration | API | 3-5 days | COMPLETE |
| **P0** | Public website mock data replacement | DAL | 3-5 days | COMPLETE |
| **P0** | Section registry + migration | Phase A | 7-10 days | COMPLETE |
| **P1** | Authentication (NextAuth) | CMS integration | 2-3 days | NOT STARTED |
| **P1** | Website Builder Admin UI | Section registry | 10-15 days | STUBS ONLY |
| **P2** | Multi-tenant middleware | Auth | 2-3 days | NOT STARTED |
| **P2** | Caching layer | Phase B.1 | 1-2 days | NOT STARTED |
| **P3** | Production deployment | Auth + Builder | 3-5 days | NOT STARTED |
| **P3** | Media upload pipeline | MediaAsset table | 3-5 days | NOT STARTED |
| **P4** | Church onboarding flow | Multi-tenant | 3-4 days | NOT STARTED |
| **P4** | Redis caching (at scale) | Multi-tenant | 2-3 days | NOT STARTED |
| **P4** | Custom domain support | Deployment | 2-3 days | NOT STARTED |

---

## Appendix B: Additional Engineering Considerations

These are future engineering tasks that don't have dedicated phases yet but are documented for planning.

### Content Versioning
For the website builder, add version history to PageSection:
```prisma
model PageSectionVersion {
  id            String   @id @default(uuid()) @db.Uuid
  sectionId     String   @db.Uuid
  content       Json     @db.JsonB
  settings      Json     @db.JsonB
  version       Int
  createdAt     DateTime @default(now())
  createdBy     String?  @db.Uuid
  section       PageSection @relation(fields: [sectionId], references: [id])
  @@index([sectionId, version(sort: Desc)])
}
```

### Scheduled Publishing
The `ContentStatus` enum includes `SCHEDULED`. Implement a cron job to auto-publish content when `dateFor <= CURRENT_DATE`. Invalidate cache for affected orgs.

### Full-Text Search
PostgreSQL's built-in `tsvector` is sufficient at this scale. Add search vectors with weighted columns (title: A, description: B, passage: C). For cross-content search, consider Meilisearch at scale.

### Media Upload Pipeline
```
User uploads file -> API route -> Validate (type, size) ->
  -> Generate unique key: {church_id}/{folder}/{uuid}.{ext}
  -> Upload to S3/R2/Vercel Blob
  -> If image: generate thumbnail (sharp)
  -> Create MediaAsset row
  -> Return CDN URL
```
Recommended: Vercel Blob for simplicity, Cloudflare R2 for cost at scale.

### Webhook System for Cache Invalidation
When CMS content changes, invalidate Redis cache, revalidate ISR pages via `revalidateTag`, and log audit trail.

### Rate Limiting by Tenant
```typescript
const RATE_LIMITS = {
  FREE:         { api: 100,  uploads: 10,  storage: 500_000_000 },
  STARTER:      { api: 1000, uploads: 50,  storage: 2_000_000_000 },
  GROWTH:       { api: 5000, uploads: 200, storage: 10_000_000_000 },
  PROFESSIONAL: { api: 20000, uploads: 500, storage: 50_000_000_000 },
  ENTERPRISE:   { api: -1,   uploads: -1,  storage: -1 },
}
```

### Database Maintenance
Schedule regular PostgreSQL maintenance: weekly ANALYZE, monthly VACUUM ANALYZE, quarterly purge of soft-deleted records (>90 days) and old audit logs (>1 year).

### Data Export & Portability
Churches should be able to export all their content as JSON for portability.

### Zod Validation Schemas
Not yet implemented. Each content type needs create/update validation schemas. Estimated 2-3 days of work for all 10+ content types.

---

## Appendix C: Phase Dependency Graph

```
DB 1.1: Schema ─── COMPLETE
  └── DB 1.2: Migration ─── COMPLETE
       └── DB 1.3: Seed ─── COMPLETE
            ├── DB 2.1: DAL ─── COMPLETE
            │    ├── DB 3.1: API Routes ─── COMPLETE
            │    │    └── DB 4.1: CMS Integration ─── COMPLETE
            │    │         └── DB 6.1: Auth ─── NOT STARTED ◄── NEXT
            │    │              ├── DB 7.1 / Web D: Multi-Tenant
            │    │              └── DB 9.1 / Web F: Production
            │    └── DB 5.1 / Web A: Public Website ─── COMPLETE
            │         └── DB 8.1 / Web B: Section Registry ─── COMPLETE
            │              └── Web C: Builder Admin ─── STUBS ONLY
            │              └── Web E: Caching
            └── (seeds also feed Web B.3: Seed Data ─── COMPLETE)
```

**Critical path to production**: Auth (DB 6.1) -> Website Builder Admin (Web C) -> Production Deploy (Web F)

**Parallelizable work**: Web C (Builder Admin) can start now alongside Auth. Web E (Caching) is independent of Auth.

---

## Appendix D: Fidelity Guide

### Completed Phases (A-B): Full Fidelity
The 38 section components already exist and are styled. The job was to preserve their styling while swapping mock data for real data. No new UI design was needed.

### Website Builder Admin (Phase C): Prototype Fidelity
Build at functional prototype level:
- Use shadcn/ui components throughout
- Focus on correct CRUD operations
- Basic responsive layout
- Don't spend time on polish, animations, or edge case UX
- The builder admin is for church admins, not end users -- utilitarian is acceptable

### Multi-Tenant + Caching (Phases D-E): Infrastructure Only
No frontend changes. Backend/infrastructure phases.

### Production (Phase F): Production Fidelity
Before launch, do a visual QA pass:
- All section components render correctly with real content
- Responsive breakpoints work
- Theme tokens apply correctly
- Navigation works on mobile
- SEO metadata is correct
- Performance acceptable (< 3s LCP)

---

## Appendix E: Effort Summary

| Phase | Calendar Days | Status | Can Parallelize With |
|---|---|---|---|
| DB 1.1-1.3: Foundation | 4-6 | COMPLETE | -- |
| DB 2.1: DAL | 2-3 | COMPLETE | -- |
| DB 3.1: API Routes | 3-4 | COMPLETE | -- |
| DB 4.1: CMS Integration | 3-5 | COMPLETE | Phase A |
| Web A: Single-Tenant | 4-6 | COMPLETE | Phase 4.1 |
| Web B: Section Migration | 7-10 | COMPLETE | -- |
| DB 6.1: Auth | 2-3 | NOT STARTED | Web C |
| Web C: Builder Admin | 10-15 | STUBS ONLY | Auth |
| Web D: Multi-Tenant | 2-3 | NOT STARTED | Web C (after auth) |
| Web E: Caching | 1-2 | NOT STARTED | Web D |
| Web F: Production | 3-5 | NOT STARTED | -- |
| **Remaining total** | **18-28** | | |

With parallelization of Auth + Builder Admin, the remaining critical path is approximately **15-22 working days**.
