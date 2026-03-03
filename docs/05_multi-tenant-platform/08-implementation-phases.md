# Implementation Phases

Ordered by dependency and business priority. Each phase is deployable independently.

---

## Phase 0: Pre-Requisites (current state → production-ready single tenant)

**Goal:** Get LA UBF to production as the first tenant.

| Task | Effort | Files |
|------|--------|-------|
| Media library with R2 storage | L | New: `lib/storage/`, `lib/dal/media.ts`, `app/api/v1/media/`, `app/api/v1/upload-url/` |
| Sentry error tracking | S | `next.config.ts`, `sentry.*.config.ts` |
| Production database (Neon) | S | `.env.production`, `prisma/` config |
| Deploy to Vercel | S | `vercel.json`, env vars |
| Replace data URLs with R2 uploads | M | `components/ui/rich-text-editor.tsx`, series image upload |

**Effort scale:** S = <1 day, M = 1-3 days, L = 3-5 days, XL = 1-2 weeks

---

## Phase 1: Platform Foundation (P0)

**Goal:** Superadmin can create and manage churches. Churches have separate CMS access.

### 1A: Auth & Platform Admin
| Task | Effort | Details |
|------|--------|---------|
| Add `isPlatformAdmin` to User model | S | Prisma migration |
| Create `(platform-admin)` route group | M | Layout, auth guard, sidebar |
| Superadmin dashboard page | M | KPI cards: total churches, MRR, active, signups |
| Church list page | M | Table with all churches, plan, status, actions |
| Church detail page | M | Profile, subscription, usage, members tabs |

### 1B: Multi-Tenant Middleware
| Task | Effort | Details |
|------|--------|---------|
| Create `middleware.ts` | M | Subdomain/custom domain resolution |
| Move `(website)` to `_tenants/[slug]/` | M | Rewrite-based routing |
| Tenant context from middleware headers | S | Update `lib/tenant/context.ts` |
| Cache domain lookups (Upstash KV) | S | Avoid DB query per request |
| Wildcard domain on Vercel | S | DNS + Vercel config |

### 1C: PostgreSQL Row-Level Security
| Task | Effort | Details |
|------|--------|---------|
| Write RLS migration for all 41 tenant tables | L | SQL migration |
| Prisma Client extension for session variables | M | `lib/db/multi-tenant.ts` |
| Admin bypass policy | S | For superadmin queries |
| Test with multiple tenants | M | Seed a second church, verify isolation |

### 1D: Church Onboarding
| Task | Effort | Details |
|------|--------|---------|
| Signup page on marketing site | M | Email, password, church name |
| Church creation flow | M | Create Church + ChurchMember + SiteSettings + default pages |
| Template selection step | M | Pick from 2-3 website templates |
| Welcome email | S | Resend integration |

---

## Phase 2: Billing & Feature Gating (P0-P1)

**Goal:** Churches pay for plans. Features are gated by plan tier.

| Task | Effort | Details |
|------|--------|---------|
| Stripe product/price setup | S | Create products and prices in Stripe dashboard |
| Stripe webhook handler | M | `app/api/webhooks/stripe/route.ts` |
| Checkout flow (upgrade button → Stripe) | M | `app/api/v1/billing/checkout/route.ts` |
| Customer Portal (manage subscription) | S | `app/api/v1/billing/portal/route.ts` |
| Feature flag system | M | `Church.featureFlags` JSON + `lib/features.ts` |
| Plan-based defaults | S | Default flags per PlanTier enum |
| CMS sidebar: hide disabled modules | S | Dynamic module list based on flags |
| API: reject requests for disabled modules | S | Middleware or per-route check |
| Billing page in CMS settings | M | Current plan, usage, upgrade button |
| Billing page in superadmin | M | Revenue dashboard, plan distribution |

---

## Phase 3: Content Generalization (P1)

**Goal:** CMS works for non-LA-UBF churches.

| Task | Effort | Details |
|------|--------|---------|
| Content labels system | M | `Church.contentLabels` JSON + `lib/content-labels.ts` |
| Dynamic CMS sidebar | S | Use labels + feature flags for nav items |
| Dynamic page titles | S | Replace hardcoded "Messages" with `labels.messages.plural` |
| Website template system | L | `WebsiteTemplate` model + template picker in onboarding |
| Template: "Modern Church" | L | Default pages, sections, theme for generic church |
| Template: "Community Hub" | L | Simplified template, fewer sections |
| Set LA UBF as "Classic UBF" template | S | Seed current pages/sections as a template |

---

## Phase 4: Support & Operations (P2)

**Goal:** We can support churches and track issues.

| Task | Effort | Details |
|------|--------|---------|
| Support ticket schema | S | `SupportTicket` + `SupportMessage` models |
| Support ticket API | M | CRUD routes |
| "Help & Support" in CMS sidebar | M | Submit ticket dialog |
| Superadmin ticket queue | M | List, filter, respond, assign |
| Impersonation system | M | Cookie-based, banner UI, audit logging |
| Audit log implementation | M | Middleware to log all mutations |
| Usage metrics tracking | M | `UsageMetric` model + collection triggers |

---

## Phase 5: Growth Features (P3)

**Goal:** Differentiate from competitors, grow revenue.

| Task | Effort | Details |
|------|--------|---------|
| Marketing site | L | Landing page, pricing, testimonials, signup CTA |
| Giving module (Stripe donations) | XL | Donation forms, recurring, funds, tax receipts |
| Blog/news module | L | CRUD, categories, RSS feed |
| Prayer request module | M | Public form, admin review, prayer wall |
| Announcement module | M | CRUD, scheduling, priority |
| Mobile app (React Native) | XL | Core features per enabled modules |
| AI sermon shorts | XL | Video processing, highlight detection |
| AI social content | L | Quote cards, event flyers, caption generation |

---

## Effort Summary

| Phase | Total Effort | When |
|-------|-------------|------|
| Phase 0: Production-ready | ~2 weeks | Now |
| Phase 1: Platform foundation | ~4-6 weeks | After Phase 0 |
| Phase 2: Billing & gating | ~2-3 weeks | Parallel with Phase 1C-1D |
| Phase 3: Content generalization | ~3-4 weeks | After Phase 1 |
| Phase 4: Support & operations | ~2-3 weeks | After Phase 2 |
| Phase 5: Growth features | Ongoing | After Phase 3 |

**Time to first paying customer (Phases 0-2): ~8-10 weeks**
**Time to 10 churches (add Phase 3): ~12-14 weeks**

---

## Critical Path

```
Phase 0 (production deploy)
    │
    ├── Phase 1A (platform admin) ──┐
    ├── Phase 1B (middleware)    ────┤
    └── Phase 1C (RLS)         ────┤
                                    │
                              Phase 1D (onboarding) ──► Phase 2 (billing)
                                                            │
                                                      Phase 3 (generalization)
                                                            │
                                                      Phase 4 (support)
                                                            │
                                                      Phase 5 (growth)
```

Phases 1A, 1B, and 1C can be developed in parallel. Phase 1D depends on all three. Phase 2 depends on 1D (onboarding creates the checkout trigger). Phase 3 can start as soon as a second church is onboarded for testing.
