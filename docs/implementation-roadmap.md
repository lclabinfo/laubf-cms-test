# Implementation Roadmap

## What to Build Next After Phases A-C, and Why

> **Last updated**: February 2026
> **Current state**: Database Phases 1.1-4.1 complete (Prisma schema, migration, seed, DAL, API routes, CMS integration). Public website (`laubf-test/`) runs on mock data. No auth, no middleware, no multi-tenancy, no `app/(website)/` route group.

---

## What Phases A-C Deliver

| Phase | What It Does | Result |
|---|---|---|
| **A**: Single-Tenant Rendering | Replace mock data in `laubf-test/` with PostgreSQL queries | Public website renders real CMS content |
| **B**: Component Migration | Move 38 section components into root project, create `app/(website)/[[...slug]]` catch-all, section registry | One unified app, data-driven page rendering, `laubf-test/` can be retired |
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
- Add Redis only if running multiple processes/servers (see `docs/website-rendering/07-caching-explained.md`)

**What you already get for free** (no work needed):
- Next.js built-in filesystem + in-memory cache (works on self-hosted)
- Cloudflare free tier caches static assets (JS, CSS, images, fonts) globally
- Browser caching via Next.js automatic `Cache-Control` headers

---

## The Revised Critical Path

```
Current state (DB + CMS integration done)
  │
  ▼
Phase A: Single-Tenant Rendering .............. 5-7 days
  │
  ▼
Phase B: Component Migration + Registry ....... 7-10 days
  │
  ▼
Phase C: Website Builder Admin ................ 10-15 days (overlaps B after B6)
  │
  ▼
Auth (Database Phase 6.1) .................... 3-5 days ← GATE
  │
  ▼
Phase F (partial): Deploy LA UBF ............. 3-5 days
  │
  ════════════════════════════════════════════
  ║  LA UBF IS LIVE — real users, real data  ║
  ════════════════════════════════════════════
  │
  ▼ (when church #2 is ready)
Phase D: Multi-Tenant Middleware .............. 3-5 days
  │
  ▼ (when traffic justifies it)
Phase E: Caching & Performance ............... 3-5 days
```

**Total to first launch**: ~28-42 working days (Phases A + B + C + Auth + F)
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
| Phase A-F detailed steps | `docs/website-rendering/04-development-phases.md` |
| Agent prompts for each phase | `docs/website-rendering/05-ai-optimized-next-steps.md` |
| Database phases (including Auth 6.1) | `docs/database/05-ai-optimized-next-steps.md` |
| Hosting & domain setup | `docs/website-rendering/06-hosting-and-domain-strategy.md` |
| Caching strategy | `docs/website-rendering/07-caching-explained.md` |
| Schema visual guide | `docs/database/06-schema-visual-guide.md` |
