# Platform Vision vs. Current Implementation — Gap Analysis

Compares the original `digital-church-platform-docs/` vision with what's actually built today, and what the recommendation is going forward.

---

## Architecture Decisions: Aligned vs. Diverged

### Aligned (keep as-is)

| Decision | Platform Docs | Current Implementation | Status |
|----------|--------------|----------------------|--------|
| Framework | Next.js 15 App Router | Next.js 16 App Router | Aligned (even newer) |
| Language | TypeScript strict | TypeScript strict | Aligned |
| UI | shadcn/ui + Radix + Tailwind | shadcn/ui + Radix + Tailwind v4 | Aligned |
| ORM | Prisma 5.x | Prisma 7.4.1 | Aligned (newer) |
| Database | PostgreSQL 16 | PostgreSQL 18 | Aligned (newer) |
| Auth | NextAuth.js v5 | Auth.js v5 (same thing) | Aligned |
| Multi-tenant data | Shared DB + `tenant_id` | Shared DB + `churchId` | Aligned |
| Rich text | TipTap | TipTap | Aligned |
| API format | REST with `{ success, data, meta }` | REST with `{ success, data }` | Aligned (minor diff) |

### Diverged (intentional or needs reconciliation)

| Area | Platform Docs Says | Current Implementation | Recommendation |
|------|-------------------|----------------------|----------------|
| **State management** | TanStack Query + Zustand | React Context + `useState` | **Keep current for now.** TanStack Query is better for cache invalidation but current Context approach works. Migrate to TanStack Query when adding real-time features. |
| **Storage** | Azure Blob Storage | None (data URLs in DB) | **Use Cloudflare R2** (already decided, see media guide). R2 beats Azure on cost and simplicity. |
| **CDN** | Azure CDN + Cloudflare | None | **R2 custom domain = built-in CDN.** No separate CDN layer needed. |
| **Cache** | Redis/Upstash + TanStack Query | None | **Add Upstash Redis** when implementing multi-tenant middleware (tenant config cache, session cache). Not needed yet. |
| **Search** | Meilisearch | PostgreSQL `tsvector` on Message | **Keep Postgres search for now.** Add Meilisearch only if search quality or performance becomes an issue (unlikely under 10K messages per church). |
| **Background jobs** | BullMQ | None | **Add when needed** (AI processing, email sending, report generation). Not blocking. |
| **Hosting** | Azure App Service | Local dev only | **Use Vercel** (better DX, native multi-tenant support, cheaper at low scale). Switch to self-hosted when costs exceed ~$500/mo. |
| **Database hosting** | Azure Database for PostgreSQL | Local PostgreSQL 18 | **Use Neon** (serverless, branching for PRs, Vercel integration). Much cheaper than Azure managed PG. |
| **Error tracking** | Sentry | None | **Add Sentry** early — it's free tier is generous and essential for production. |
| **Analytics** | PostHog | None | **Add PostHog** when marketing site launches. Free tier covers 1M events/mo. |
| **Email** | SendGrid | None | **Add when onboarding flow is built.** SendGrid or Resend. |
| **Payments** | Stripe (2.0% + $0.25) | None | **Use Stripe.** Align with platform docs pricing strategy. |
| **Mobile** | React Native + Expo | None | **Phase 4 (P3).** Not a priority for platform launch. |
| **AI** | Azure OpenAI (GPT-4, DALL-E, Speech) | Azure OpenAI (config ready, not active) | **Aligned.** Activate when AI features are prioritized. |

---

## Content Model: Major Divergence

### Platform docs vision
The platform docs describe a generic `Sermon` model:
```
Sermon: id, tenant_id, title, date, speaker, description, video_url, series_id
```
Simple, flat, works for any church.

### Current implementation
The current `Message` model is heavily LA UBF-specific:
```
Message: id, churchId, slug, title, passage, bibleVersion, dateFor, speakerId,
  videoUrl, videoDescription, youtubeId, thumbnailUrl, duration, audioUrl,
  rawTranscript, liveTranscript, transcriptSegments (JSON), studySections (JSON),
  hasVideo, hasStudy, relatedStudyId (FK to BibleStudy), searchVector (tsvector)
```

Plus two additional LA UBF-specific models:
- **BibleStudy** — Full curriculum system with `book` (all 66 Bible books), `questions`, `answers`, `transcript`, key verses
- **DailyBread** — Daily devotional with passage, key verse, body text, bible text

### Recommendation
See `06-content-generalization.md` for the full plan. TL;DR: keep the rich models but make them **optional modules** that churches can enable/disable. The `Message` model works great for churches that want sermon management — just don't force it on churches that don't need it.

---

## Schema Size: Grown Significantly

| Metric | Platform Docs | Current | Notes |
|--------|--------------|---------|-------|
| Models | ~25 (conceptual) | 46 (implemented) | Grew through people management, website builder, events |
| Enums | ~10 | 32 | Much more granular categorization |
| Tables with churchId | All | 41/46 | 5 are correctly global (User, Account, Session, BibleVerse, Theme) |

The current schema is more complete than the platform docs envisioned, which is good — less to build.

---

## Features: What's Built vs. What's Planned

### Built and working (not in platform docs scope)
These exist today but weren't detailed in the platform docs:
- Full page builder with 42 section types
- Theme customization with font pairings
- Bible verse database (11 translations)
- Person/Household/Group management with custom fields
- Contact form submissions
- Audit log schema
- Custom domain management UI

### Planned in docs but not built
| Feature | Platform Docs Priority | Current Status | When to Build |
|---------|----------------------|----------------|---------------|
| Stripe billing | Core (Phase 1) | Not started | P0 |
| Multi-tenant middleware | Core (Phase 1) | Not started | P0 |
| Platform admin console | Core (Phase 1) | Not started | P0 |
| Onboarding flow | Core (Phase 1) | Not started | P0 |
| Feature flags per plan | Core (Phase 1) | Not started | P1 |
| Giving module | Phase 2 | Not started | P2 |
| Groups module | Phase 2 | Partially (PersonGroup exists) | P2 |
| Mobile app | Phase 3 | Not started | P3 |
| Streaming module | Phase 3 | Not started | P3 |
| Check-in module | Phase 4 | Not started | P3 |
| AI Shorts | Phase 4 | Not started | P3 |
| AI Social Studio | Phase 4 | Not started | P3 |

---

## Pricing Model: Simplify From Platform Docs

The platform docs describe a complex hybrid model (tier-based + modular a la carte + bundles). For launch, simplify:

| Platform Docs | Recommendation |
|--------------|----------------|
| 4 tiers + 10 modules + bundle discounts + annual pricing | **3 tiers only** (Free / Starter $19 / Pro $49) |
| 10 separate module prices ($19-$59 each) | **All modules included per tier**, just with limits |
| Bundle discounts (10%/15%/25%) | Not needed if modules are bundled into tiers |
| Transaction fees (2.0% + $0.25) | **Add later** when giving module is built |

Why: Churches are non-technical. A simple "pick a plan" is much easier to sell than "build your own bundle." You can always add modular pricing later when you have data on what churches actually want.

---

## Technology Substitutions Summary

| Platform Docs | Replace With | Why |
|--------------|-------------|-----|
| Azure Blob Storage | **Cloudflare R2** | Zero egress, built-in CDN, S3-compatible, 30x cheaper |
| Azure CDN | **R2 custom domain** | CDN is built into R2, no separate service needed |
| Azure App Service | **Vercel** | Better DX, native multi-tenant, cheaper at low scale |
| Azure DB for PostgreSQL | **Neon** | Serverless, branching, Vercel integration, cheaper |
| Azure Cache for Redis | **Upstash Redis** | Serverless, pay-per-request, Vercel integration |
| Azure Functions | **Vercel serverless functions** | Already part of Next.js, no separate service |
| BullMQ | **Inngest or Trigger.dev** | Serverless-friendly, no Redis dependency |
| Meilisearch | **PostgreSQL tsvector** (for now) | Already implemented, good enough for <10K docs/church |
| PostHog (analytics) | **PostHog** (keep) | Good choice, generous free tier |
| Sentry (errors) | **Sentry** (keep) | Good choice, add immediately |
