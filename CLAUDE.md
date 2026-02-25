# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server (http://localhost:3000)
- `npm run build` — Production build
- `npm run lint` — Run ESLint (flat config with Next.js core-web-vitals + TypeScript rules)
- `npx shadcn add <component>` — Add shadcn/ui components
- `npx prisma db seed` — Seed database (idempotent)
- `npx prisma studio` — Browse database in browser
- `npx prisma migrate dev --name <name>` — Create migration after schema changes

## Architecture

Next.js 16 app using the App Router with React 19, TypeScript, and Tailwind CSS v4.

**UI stack:** shadcn/ui (radix-nova style) with Radix UI primitives, styled via Tailwind CSS variables defined in `app/globals.css`. Icons from `lucide-react`. Utility function `cn()` in `lib/utils.ts` merges class names via `clsx` + `tailwind-merge`.

**Path alias:** `@/*` maps to the project root (e.g., `@/components/ui/button`).

**Key directories:**
- `app/cms/` — CMS admin pages (messages, events, media, people, etc.)
- `app/api/v1/` — REST API routes (15 files across 10 content types)
- `components/ui/` — shadcn/ui primitives (auto-generated, editable)
- `components/cms/` — CMS-specific components
- `lib/dal/` — Data access layer (15 modules, all take `churchId` as first param)
- `lib/db/` — Prisma client singleton + type re-exports
- `lib/generated/prisma/` — Generated Prisma client (do not edit)
- `lib/api/get-church-id.ts` — Resolves `CHURCH_SLUG` env var to church UUID via DB lookup
- `lib/tenant/context.ts` — `getChurchId()` for `(website)` route group (reads `x-tenant-id` header, falls back to env var)
- `lib/dal/theme.ts` — `getThemeWithCustomization(churchId)` for ThemeProvider
- `lib/website/resolve-section-data.ts` — Resolves dynamic section data from DAL for PageSections with `dataSource`
- `app/(website)/` — Public website route group (layout + catch-all page)
- `components/website/sections/` — 42 section type entries in registry (40 real + 2 placeholders), section-wrapper
- `components/website/layout/` — Website layout components (website-navbar, website-footer, dropdown-menu, mobile-menu, quick-links-fab, icon-map)
- `components/website/theme/` — ThemeProvider (CSS variable injection from ThemeCustomization)
- `components/website/font-loader.tsx` — FontLoader RSC (Google Fonts vs custom font split)
- `components/website/shared/` — 23 migrated shared components (theme-tokens, animate-on-scroll, section-container, section-header, cta-button, overline-label, video-thumbnail, event-card, event-badge, event-list-item, event-grid-card, event-calendar-grid, filter-pill, filter-toolbar, message-card, bible-study-card, image-card, video-card, video-modal, arrow-button, type-pill, icons, use-scroll-reveal)
- `prisma/schema.prisma` — 32 models, 22 enums
- `prisma/seed.mts` — Seed script (LA UBF church data)
- `laubf-test/` — Original public website (separate Next.js app, migration source — being retired in favor of root `(website)` route group)
  - `laubf-test/src/lib/db/client.ts` — Prisma client singleton (Phase A.1)
  - `laubf-test/src/lib/get-church-id.ts` — Church ID resolver from `CHURCH_SLUG` env var
  - `laubf-test/src/lib/dal/` — Read-only DAL (14 modules, mirrors root `lib/dal/`)
  - `laubf-test/src/lib/generated/prisma/` — Generated Prisma client
  - `laubf-test/src/components/sections/` — 38 original section components (migration source for Phase B, now migrated to root)
- `docs/` — Living PRD, database schema, and website rendering docs

**Database:** Prisma 7.4.1 with PostgreSQL 18 (native, not Docker). Prisma client imports from `@/lib/generated/prisma/client` (not `@prisma/client`). Config in `prisma.config.ts`. Env vars: `DATABASE_URL`, `DIRECT_URL`, `CHURCH_SLUG=la-ubf`.

**Multi-tenant model:** Single shared database. Every tenant-scoped table has `churchId`. All DAL functions take `churchId` as first param. For single-tenant MVP, `CHURCH_SLUG` env var resolves to church UUID via DB lookup (`lib/api/get-church-id.ts`). No `CHURCH_ID` env var exists — always resolve by slug.

**Two-app structure (transitional):** Root project = CMS admin + API + public website (via `(website)` route group). `laubf-test/` = original public website (separate Next.js app, now superseded by root project's `(website)` route group — retained as reference but being retired). Target state: fully consolidated single app with route groups `(website)`, `(admin)`, `(marketing)`.

**Styling:** Tailwind v4 via PostCSS (`@tailwindcss/postcss`). Theme colors use CSS custom properties with oklch values. Dark mode via `.dark` class with `@custom-variant dark (&:is(.dark *))`.

**Fonts:** Inter (--font-sans), Geist (--font-geist-sans), Geist Mono (--font-geist-mono) loaded via `next/font/google`.

## Design System & Consistency

**shadcn/ui is the primary design system for this project.** All UI components should use shadcn/ui primitives (`components/ui/`) or be composed from them. Do not introduce alternative component libraries. When building new features:
- Check if a shadcn/ui component exists for the pattern (`npx shadcn add <component>`).
- Use the shadcn MCP tool to search for components and examples when available.
- Follow existing component conventions in `components/ui/`.
- Reference `docs/00_dev-notes/design-tokens.md` for color, typography, and spacing values.

**Section components (`laubf-test/src/components/sections/`)** are the source of truth for public website design. When migrating sections to the root project, preserve spacing, typography, colors, and layout exactly. These sections serve as the first website template for the platform — design accuracy is the highest priority. Each section file has a comment header describing its purpose and content structure. See `docs/03_website-rendering/09-section-component-guide.md` for the complete catalog (42 section types), comment header format, migration process, and static vs. dynamic classification.

**Theming & customization:** Public website styling is driven by CSS custom properties injected via `ThemeProvider`. Section components must use theme variables (e.g., `var(--font-heading)`, `var(--color-primary)`) so each church can customize their site. Individual section overrides (e.g., per-section color scheme, padding) come from `PageSection` fields (`colorScheme`, `paddingY`, `containerWidth`), not hardcoded values.

**Fonts:** The platform uses Google Fonts as the primary font source. Each church selects heading + body font pairings via `ThemeCustomization`. Some churches (e.g., LA UBF) have custom fonts — the font loading system must support both Google Fonts and self-hosted custom fonts per tenant. See `docs/03_website-rendering/08-font-system.md` for the full font architecture.

## Product Requirements (PRDs)

The following PRD documents define the product scope and feature priorities. **Always reference the relevant PRD before implementing a new feature** to ensure alignment with product goals and priority levels (P0/P1/P2).

| Document | Scope |
|---|---|
| `docs/01_prd/00-primary-user-profile.md` | Target user persona, constraints, mental model, and user stories. |
| `docs/01_prd/01-prd-cms.md` | CMS content workflows — sermons, Bible studies, events, ministries, announcements, media, prayer, church profile. |
| `docs/01_prd/02-prd-website-builder.md` | Website Builder — templates, themes, page management, publishing, domain/SEO, homepage. |
| `docs/01_prd/03-prd-system.md` | System capabilities — roles & permissions, content health, analytics, billing, onboarding, activity log. |

**When implementing a new feature:**
1. Check the relevant PRD to confirm the feature's priority level and requirements.
2. After implementing a feature, update the PRD to reflect its current status (e.g., mark as implemented, note any deviations).

**When adding new features not yet in a PRD:**
1. Add the feature to the appropriate PRD document with a priority level before or during implementation.

These PRDs are living documents — keep them current as the product evolves.

## Technical Documentation

Two doc sets govern implementation. **Read the relevant docs before starting any phase work.**

| Doc Set | Path | Covers |
|---|---|---|
| **Database** | `docs/02_database/01-03` | Schema design, field mappings, visual guide |
| **Website Rendering** | `docs/03_website-rendering/01-03, 06-09` | Rendering architecture, implementation guide, CMS↔website connection, hosting/domain strategy, caching, font system, section migration guide |
| **Development Status** | `docs/00_dev-notes/development-status.md` | Unified status dashboard, phase specs, cross-reference map, AI prompts (consolidates former database/04-05 and website-rendering/04-05) |
| **Implementation Roadmap** | `docs/implementation-roadmap.md` | Phase ordering, critical path, what to build next |

**Current project state (Feb 24, 2026):**
- **Database Phases 1-4: COMPLETE** — Prisma schema, migration, seed, DAL, API routes, CMS integration all done.
- **Website Phase A: COMPLETE** — Prisma + DAL in laubf-test, all pages read from DB (zero mock data imports).
- **Website Phase B.1: COMPLETE** — `(website)` route group, section registry (42 entries), ThemeProvider, FontLoader, navbar, footer, SectionWrapper, catch-all page route, tenant context, design system CSS ported.
- **Website Phase B.2: COMPLETE** — 40/42 section types have real implementations. 2 intentional placeholders remain: NAVBAR (handled by layout), DAILY_BREAD_FEATURE (no source exists). 23 shared components migrated.
- **Website Phase B.3: COMPLETE** — Seeded 14 pages with PageSections, 2 menus with items, Theme + ThemeCustomization, SiteSettings.
- **Website Phase C: DATA MODEL COMPLETE, ADMIN UI NOT IMPLEMENTED** — Database models (Page, PageSection, Menu, MenuItem, Theme, ThemeCustomization) and seed data exist. DAL modules for pages, menus, and theme are complete. Admin pages at `/cms/website/*` are stubs only (10-line placeholder pages with just a heading). No website builder API routes, no page builder UI, no section editor, no menu editor, no theme customizer exists yet.
- **Authentication: NOT STARTED** — Critical blocker for production deployment. Schema exists (User, Session, ChurchMember) but no implementation.
- **Phases D-F: NOT STARTED** — Multi-tenant middleware, caching, production deployment.

**Where to find status, roadmap, and AI-ready prompts:**
- `docs/00_dev-notes/development-status.md` — Unified status dashboard, phase specifications, cross-reference map, and copy-paste implementation prompts for all remaining phases.
- `docs/implementation-roadmap.md` — Phase ordering rationale, critical path, and what to build next.

## Figma Prototype Reference

The `figma-cms-2:11:26/` directory contains a Vite-based export of the current Figma CMS prototype. **Use this as a UX and flow benchmark only** — it represents the intended user flows, page structure, navigation patterns, and information hierarchy.

**Do:**
- Reference it to understand intended page flows, screen sequences, and feature scope.
- Use it to verify that implemented features match the intended UX patterns.
- Check it when unsure about what a CMS page should contain or how screens connect.

**Do not:**
- Copy its visual styling, colors, spacing, or component markup into the codebase.
- Use its component implementations — the project uses shadcn/ui, not the Figma prototype's UI code.
- Treat it as the source of truth for visual design. shadcn/ui + the design tokens in `docs/00_dev-notes/design-tokens.md` govern all UI decisions.

The prototype is more up-to-date than the PRDs on specific feature details and flows. When there is a conflict between the prototype's UX and the PRD, flag it and prefer the prototype's flow unless the PRD explicitly overrides it.
