# Database Scaling Plan

---

## Current Schema Audit Summary

- **46 models**, **32 enums** (CLAUDE.md says 32/22 — outdated)
- **41/46 models** have `churchId` (properly multi-tenant scoped)
- **5 global models**: User, Account, Session, BibleVerse, Theme
- **3 LA UBF-specific models**: Message (heavy sermon focus), BibleStudy (curriculum), DailyBread (devotional)
- **No Row-Level Security** — isolation is application-only
- **No superadmin models** — can't manage platform
- **Incomplete billing** — only Subscription model, missing invoices/usage

---

## New Models Needed

### Tier 1: Platform Management (P0)

```
PlatformAdmin (new)
  - Extends User with isPlatformAdmin flag
  - OR: Add isPlatformAdmin Boolean to User model

SupportTicket (new)
  id, churchId, userId, subject, description, status (OPEN/IN_PROGRESS/RESOLVED/CLOSED),
  priority (LOW/NORMAL/HIGH/URGENT), category (BUG/FEATURE_REQUEST/QUESTION/BILLING),
  assignedTo (FK to User), createdAt, updatedAt, resolvedAt

SupportMessage (new)
  id, ticketId, authorId, content (text), isInternal (Boolean), createdAt

UsageMetric (new)
  id, churchId, metric (STORAGE_BYTES/API_CALLS/PAGE_VIEWS/ADMIN_USERS),
  value (BigInt), period (date), createdAt
```

### Tier 2: Billing Enhancement (P0)

```
Extend existing Subscription model:
  + trialEndsAt DateTime?
  + canceledAt DateTime?

Invoice (new) — or just use Stripe's invoice objects via API
  id, churchId, stripeInvoiceId, amount, currency, status, paidAt, periodStart, periodEnd

PaymentMethod (new) — or just use Stripe Customer Portal
  id, churchId, stripePaymentMethodId, type, last4, expiresAt, isDefault
```

**Note:** For billing, lean heavily on Stripe. Don't replicate Stripe's data in your DB unless you need it for dashboard queries. Use Stripe API for invoice history, payment methods, etc. Only store subscription status locally for feature gating.

### Tier 3: Feature Flags (P1)

```
Option A: JSON field on Church model (simple, recommended)
  Church.featureFlags Json @default("{}")

Option B: Dedicated table (complex, for marketplace)
  Feature: id, name, slug, description, category, isDefault
  PlanFeature: planTier, featureId, limit (int?)
  ChurchFeature: churchId, featureId, enabled, customLimit
```

**Recommendation:** Option A. Store a `FeatureFlags` JSON object on the Church model. Derive defaults from `plan` tier. Allow per-church overrides for enterprise clients. This avoids N+1 queries and complex join logic.

### Tier 4: Template System (P1)

The existing `Theme` + `ThemeCustomization` models already handle visual theming. For website templates (page structure), extend:

```
WebsiteTemplate (new)
  id, name, slug, description, previewImageUrl, category,
  defaultPages (JSON — array of page definitions with sections),
  defaultTheme (JSON — color/font defaults),
  isActive, sortOrder, createdAt

Extend Church:
  + websiteTemplateId String? (FK to WebsiteTemplate)
```

---

## Row-Level Security Implementation

### Why
Currently, a single bug that forgets `churchId` in a query leaks data across tenants. RLS provides a database-enforced safety net.

### How

**Step 1: Create a migration that enables RLS on all tenant-scoped tables.**

For each table with `churchId`:
```sql
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON "Message"
  USING ("churchId"::text = current_setting('app.current_church_id', TRUE));
```

**Step 2: Set the session variable before every query.**

In `lib/db/client.ts`, wrap the Prisma client:
```typescript
// Before each request, set the church context
await prisma.$executeRaw`
  SELECT set_config('app.current_church_id', ${churchId}::text, TRUE)
`
```

**Step 3: Admin bypass for superadmin queries.**
```sql
CREATE POLICY admin_bypass_policy ON "Message"
  USING (current_setting('app.bypass_rls', TRUE) = 'on');
```

**When to implement:** P0, before any production multi-tenant deployment.

---

## Index Optimization for Scale

### Current state: Good
Most tables already have `@@index([churchId, ...])` composite indexes. Key ones:
- `Message: @@index([churchId, dateFor(sort: Desc)])`
- `Event: @@index([churchId, status, dateStart])`
- `Person: @@index([churchId, lastName, firstName])`

### Add for scale
```prisma
// Faster tenant listing for superadmin
@@index([status]) on Church

// Faster subscription queries
@@index([subscriptionStatus]) on Church

// Support ticket queries
@@index([churchId, status, createdAt(sort: Desc)]) on SupportTicket
@@index([status, priority]) on SupportTicket  // For superadmin triage

// Usage metrics
@@index([churchId, metric, period]) on UsageMetric
```

### Future: Table partitioning
If any single table exceeds ~50M rows, consider LIST partitioning by `churchId`. Most likely candidates: `AuditLog`, `UsageMetric`, `MediaAsset`. PostgreSQL handles this transparently — queries with `WHERE churchId = X` only scan the relevant partition.

---

## Migration Strategy (Single-Tenant to Multi-Tenant)

### Phase 1: Schema additions (non-breaking)
Add new models (`SupportTicket`, `UsageMetric`, etc.) and new fields (`Church.featureFlags`, `User.isPlatformAdmin`). These don't affect existing data.

### Phase 2: RLS enablement (careful)
Enable RLS on all tables. Test thoroughly — a misconfigured RLS policy can make ALL data invisible. Use a staging environment with production data copy.

### Phase 3: Seed default data
- Create platform admin user
- Create default subscription plans
- Create default website templates
- Set LA UBF's feature flags to match current behavior

### Phase 4: Onboarding flow
New churches create an account → Prisma creates Church + ChurchMember + SiteSettings + ThemeCustomization + default Pages from template.
