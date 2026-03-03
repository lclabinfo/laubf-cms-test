# Multi-Tenant Platform — Executive Summary

**Date:** 2026-03-03

---

## What We're Building

A multi-tenant SaaS platform where **we (the superadmin)** manage multiple churches, each with their own CMS admin, public website, and subscription. Think Squarespace for churches — one codebase, thousands of tenants, each with a customized experience.

---

## Current State vs. Target State

| Dimension | Current (LA UBF MVP) | Target (Multi-Tenant Platform) |
|-----------|---------------------|-------------------------------|
| **Tenants** | 1 church (LA UBF via `CHURCH_SLUG` env var) | 1000+ churches, self-service onboarding |
| **Admin** | Single CMS at `/cms/` | Per-church CMS + platform superadmin console |
| **Website** | One `(website)` route group | Per-tenant subdomain + custom domain |
| **Auth** | Auth.js with 4 roles (OWNER/ADMIN/EDITOR/VIEWER) | Same + PLATFORM_ADMIN role, impersonation |
| **Billing** | None | Stripe subscriptions, tiered plans, self-service portal |
| **Content model** | LA UBF-specific (Messages, BibleStudy, DailyBread) | Configurable modules per church |
| **DB isolation** | Application-level `churchId` filtering | Same + PostgreSQL Row-Level Security |
| **Hosting** | Local dev, single deployment | Vercel with wildcard domains + custom domain API |
| **Storage** | Data URLs in DB | Cloudflare R2 with CDN (already planned) |
| **Support** | None | Bug reports, support tickets, feedback system |

---

## Key Decisions

### 1. Stay in this project (monorepo)
The current project is already multi-tenant at the data layer (every table has `churchId`). Building a separate app would duplicate 90% of the code. Instead, add route groups: `(platform-admin)` for superadmin, `(marketing)` for the marketing site.

### 2. Cloudflare R2 for storage (already decided)
See `docs/04_infrastructure/media-storage-cdn-guide.md`.

### 3. Vercel for hosting (recommended)
Native wildcard subdomain support, custom domain API (Vercel SDK), edge middleware for tenant resolution, preview deployments per PR. Switch to self-hosted when costs exceed ~$500/month.

### 4. Neon for database (recommended)
Serverless PostgreSQL with branching (each PR gets its own DB branch), Vercel integration, generous free tier. Supports RLS natively.

### 5. Stripe for billing
Tier-based plans (Free / Starter $19 / Pro $49 / Enterprise custom). Stripe Customer Portal for self-service. Webhook-driven subscription management.

### 6. Shared database with RLS (no schema-per-tenant)
Current `churchId` pattern is correct. Add PostgreSQL Row-Level Security as defense-in-depth. Scale with composite indexes and (if needed) table partitioning by `churchId`.

---

## Priority Roadmap

### P0 — Foundation (must do first)
1. Platform admin role + superadmin console
2. Multi-tenant middleware (subdomain + custom domain routing)
3. PostgreSQL Row-Level Security
4. Stripe billing integration
5. Church onboarding flow (signup → create church → select template → go)

### P1 — Generalization (make it work for any church)
6. Content model generalization (configurable labels, optional modules)
7. Feature flag system (per-plan module gating)
8. Template system (multiple website templates)
9. Media library with R2 storage

### P2 — Operational (run it as a business)
10. Support ticket / bug report system
11. Usage analytics & metering
12. Impersonation (admin views church's CMS)
13. Audit logging implementation

### P3 — Growth (scale the business)
14. Marketing site & pricing page
15. Self-service Stripe Customer Portal
16. Mobile app module (React Native)
17. AI features (sermon shorts, social content)

---

## Document Index

| Doc | What It Covers |
|-----|---------------|
| `01-platform-vs-current-diff.md` | Gap analysis: platform docs vision vs. current implementation |
| `02-database-scaling-plan.md` | Schema changes, RLS, new models, migration strategy |
| `03-superadmin-system.md` | Platform admin console, church management, impersonation |
| `04-multi-tenant-routing.md` | Middleware, subdomain routing, custom domains |
| `05-billing-subscriptions.md` | Stripe integration, plans, webhooks, portal |
| `06-content-generalization.md` | Making "Messages" work for all churches, feature flags |
| `07-infrastructure-hosting.md` | Vercel, Neon, deployment, CI/CD |
| `08-implementation-phases.md` | Detailed phase breakdown with effort estimates |
