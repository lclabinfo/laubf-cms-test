# Billing & Subscriptions

---

## Plan Tiers (Simplified from Platform Docs)

| | Free | Starter ($19/mo) | Pro ($49/mo) | Enterprise (custom) |
|---|---|---|---|---|
| **Pages** | 5 | 15 | Unlimited | Unlimited |
| **Storage** | 1 GB | 5 GB | 25 GB | Unlimited |
| **Admin users** | 2 | 5 | 10 | Unlimited |
| **Custom domain** | No | No | Yes | Yes |
| **Modules** | Website only | + Events, Announcements | + All modules | + All modules |
| **Remove watermark** | No | No | Yes | Yes |
| **Support** | Community | Email | Priority email | Dedicated |

Annual billing: 20% discount (effectively 2 months free).

---

## Stripe Integration

### Setup
```bash
npm install stripe @stripe/stripe-js
```

### Environment Variables
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_STARTER_ANNUAL_PRICE_ID=price_...
STRIPE_PRO_ANNUAL_PRICE_ID=price_...
```

### Key Files
```
lib/stripe/client.ts           # Stripe SDK instance
lib/stripe/plans.ts            # Plan config (price IDs, feature limits)
app/api/webhooks/stripe/route.ts  # Webhook handler
app/api/v1/billing/
  checkout/route.ts            # Create Stripe Checkout session
  portal/route.ts              # Create Stripe Customer Portal session
```

### Webhook Events to Handle

| Event | Action |
|-------|--------|
| `customer.subscription.created` | Set church plan tier + status |
| `customer.subscription.updated` | Update plan tier if changed |
| `customer.subscription.deleted` | Downgrade to Free |
| `invoice.payment_succeeded` | Clear any "past due" flags |
| `invoice.payment_failed` | Set status to PAST_DUE, notify church admin |
| `customer.subscription.trial_will_end` | Send reminder email (3 days before) |

### Checkout Flow
1. Church admin clicks "Upgrade" in CMS settings
2. Frontend calls `POST /api/v1/billing/checkout` with selected plan
3. Backend creates Stripe Checkout Session with `success_url` and `cancel_url`
4. Church admin redirected to Stripe's hosted checkout page
5. On success, Stripe sends `customer.subscription.created` webhook
6. Webhook handler updates church's `plan` and `subscriptionStatus`
7. Church admin sees updated plan in their CMS

### Feature Gating Pattern
```typescript
// lib/features.ts
export function canAccessFeature(church: Church, feature: string): boolean {
  const flags = getFeatureFlags(church) // merges plan defaults + overrides
  return getNestedValue(flags, feature) === true
}

// Usage in API routes:
if (!canAccessFeature(church, 'modules.events')) {
  return NextResponse.json({ error: 'Events module not available on your plan' }, { status: 403 })
}

// Usage in CMS sidebar:
const enabledModules = getEnabledModules(featureFlags, contentLabels)
// Only show sidebar items for enabled modules
```

---

## Subscription Lifecycle

```
Signup (Free tier)
    │
    ▼
Trial (14 days, Pro features) ──── trial_will_end webhook ──── reminder email
    │                                                              │
    ▼                                                              ▼
Convert to Paid ────────────────────────────────────── Let trial expire
    │                                                        │
    ▼                                                        ▼
Active (Starter/Pro)                              Downgrade to Free
    │
    ├── Upgrade plan ──► subscription.updated webhook
    ├── Downgrade plan ──► subscription.updated webhook
    ├── Payment fails ──► invoice.payment_failed ──► PAST_DUE ──► 3 retries
    │                                                                  │
    │                                                          All retries fail
    │                                                                  │
    │                                                                  ▼
    └── Cancel ──► subscription.deleted webhook ──────────► Free tier
```
