# 05. Modular Solutions Architecture

## Overview

Digital Church Platform adopts a modular architecture that allows churches to subscribe only to the solutions they need.
A hybrid approach is offered alongside the traditional plan-based tier system.

---

## Subscription Model Comparison

### Option 1: Plan-Based (Traditional Tiers)

| Plan | Monthly Price | Included Features | Target |
|------|---------------|-------------------|--------|
| **Starter** | Free ~ $29 | Website | Small churches, starting out |
| **Growth** | $79 | Website, Members, Giving, Events | Growing churches |
| **Pro** | $149 | Growth + App, Groups, Streaming | Medium-large churches |
| **Enterprise** | Custom | All features + white-label | Large churches, multi-site |

### Option 2: Modular À la Carte

| Module ID | Module Name | Description | Monthly Price |
|-----------|-------------|-------------|---------------|
| `website` | Church Website | Church website (required) | $29 |
| `mobile-app` | Smartphone App | iOS/Android native app | $49 |
| `giving` | Online Giving | Donation and giving system | $39 |
| `members` | Member Management | Member management system | $29 |
| `events` | Event Registration | Event registration/booking | $19 |
| `groups` | Small Groups | Small group management | $19 |
| `streaming` | Live Streaming | Live worship streaming | $59 |
| `check-in` | Child Check-in | Child check-in system | $29 |
| `ai-shorts` | AI Shorts Creator | AI sermon short-form video generation | $49 |
| `ai-social` | AI Social Studio | AI social media content generation | $39 |

### Option 3: Hybrid (Plan + Additional Modules)

Select a base plan and add additional modules à la carte as needed.

```
Example: Growth Plan ($79) + AI Shorts ($49) = $128/mo
```

---

## Module Categories

```
┌─────────────────────────────────────────────────────────────┐
│                     MODULE CATEGORIES                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐                                            │
│  │    CORE     │  Website (Required)                        │
│  └─────────────┘                                            │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ ENGAGEMENT  │  │   FINANCE   │  │ MANAGEMENT  │         │
│  │             │  │             │  │             │         │
│  │ • Mobile App│  │ • Giving    │  │ • Members   │         │
│  │ • Events    │  │             │  │ • Check-in  │         │
│  │ • Groups    │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  ┌─────────────┐  ┌─────────────────────────────┐          │
│  │    MEDIA    │  │        AI CREATIVE          │          │
│  │             │  │                             │          │
│  │ • Streaming │  │ • AI Shorts (Short videos)  │          │
│  │             │  │ • AI Social (SNS content)   │          │
│  └─────────────┘  └─────────────────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Module Dependencies

### Dependency Map

```
                    ┌──────────────┐
                    │   Website    │  ← Core (Required)
                    │   (Core)     │
                    └──────┬───────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Members    │   │    Events    │   │    Groups    │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                   │
       │                  │                   │
       ▼                  ▼                   │
┌──────────────┐   ┌──────────────┐           │
│   Check-in   │   │    Giving    │←──────────┘
│(Members req.)│   └──────────────┘
└──────────────┘

┌──────────────────────────────────────────────┐
│              Mobile App                       │
│        (Mirrors active modules)               │
└──────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐
│   Streaming      │  │   AI Modules     │
│   (Independent)  │  │   (Independent)  │
└──────────────────┘  └──────────────────┘
```

### Dependency Rules

| Module | Required Dependencies (Hard) | Recommended Dependencies (Soft) |
|--------|------------------------------|--------------------------------|
| Website | - | - |
| Members | Website | - |
| Events | Website | Members (attendance tracking) |
| Groups | Website | Members (group member management) |
| Giving | Website | Members (donor tracking) |
| Check-in | Website, Members | - |
| Mobile App | Website | - |
| Streaming | Website | - |
| AI Shorts | Website | Streaming (live sermons) |
| AI Social | Website | Events, Groups (content sources) |

### Dependency Validation Logic

```typescript
// Module selection validation
interface ValidationResult {
  valid: boolean;
  missingDependencies: string[];  // Required dependencies
  recommendations: string[];       // Recommended dependencies
}

// Example: Check-in selected
// - Without Members → missingDependencies: ['members']
// - valid: false

// Example: Giving selected
// - Without Members → recommendations: ['members']
// - valid: true (recommended but not required)
```

---

## Pricing Policy

### Bundle Discounts

| Condition | Discount Rate |
|-----------|---------------|
| 3+ modules | 10% |
| 5+ modules | 15% |
| All modules (8+) | 25% |

### Annual Payment Discount

- **20% additional discount** for annual payment

### Pricing Examples

#### Example 1: Small Church (Website + Giving)

```
Base price: $29 + $39 = $68/month
Bundle discount: Not applicable (2 modules)
─────────────────────────
Final price: $68/month
```

#### Example 2: Medium Church (4 modules, annual payment)

```
Selected modules: Website + Mobile App + Members + Events
Base price: $29 + $49 + $29 + $19 = $126/month

Bundle discount (10%): -$12.60
Subtotal: $113.40/month

Annual payment discount (20%): -$22.68
─────────────────────────
Final price: $90.72/month ($1,088.64/year)
Savings: $35.28/month
```

#### Example 3: Large Church (All modules, annual payment)

```
Selected modules: All 8 modules
Base price: $29 + $49 + $39 + $29 + $19 + $19 + $59 + $29 = $272/month

Bundle discount (25%): -$68
Subtotal: $204/month

Annual payment discount (20%): -$40.80
─────────────────────────
Final price: $163.20/month ($1,958.40/year)
Savings: $108.80/month
```

---

## AI Creative Modules

### AI Shorts Creator ($49/month)

Automatically generates short-form videos for TikTok, YouTube Shorts, and Instagram Reels from sermon recordings.

#### Key Features

| Feature | Description |
|---------|-------------|
| **Automatic Highlight Detection** | AI automatically identifies impactful moments from sermons |
| **Automatic Caption Generation** | Multi-language caption generation (English/Spanish/Korean, etc.) |
| **Template-Based Editing** | Templates with church branding applied |
| **Multi-Platform Optimization** | Automatic aspect ratio adjustment by platform (9:16, 1:1, 16:9) |
| **Batch Generation** | Generate multiple clips from a single sermon simultaneously |

#### Workflow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Sermon     │ →  │  AI         │ →  │  Clip       │ →  │  Social     │
│   Video     │    │  Analysis   │    │  Creation   │    │  Publish    │
│   Upload    │    │ • Transcribe│    │ • Edit      │    │ • TikTok    │
│             │    │ • Sentiment │    │ • Captions  │    │ • YouTube   │
│             │    │ • Extract   │    │ • Branding  │    │ • Instagram │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

#### Monthly Usage Limits

| Tier | Short videos/month | Est. cost/video |
|------|-------------------|-----------------|
| Basic | 10 | ~$0.50 |
| Standard | 30 | ~$0.50 |
| Premium | 100 | ~$0.50 |
| Unlimited | ∞ | Custom pricing |

### AI Social Studio ($39/month)

Automatically generates social media posts (quote graphics, event flyers, stories) from church content.

#### Key Features

| Feature | Description |
|---------|-------------|
| **Sermon Quote Graphics** | Transform key sermon phrases into visual cards |
| **Event Promotional Materials** | Auto-generate flyers/posters from event information |
| **Schedule Posts** | Convert church schedules to social-friendly formats |
| **Bible Verse Graphics** | Bible-based content like daily devotions |
| **Story Templates** | Optimized for Instagram/Facebook Stories |

#### Content Types

```
┌────────────────────────────────────────────────────────────┐
│                  AI Social Content Types                    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Quote Cards    │  │  Event Flyers   │                  │
│  │                 │  │                 │                  │
│  │ "Faith is the   │  │ ┌─────────────┐ │                  │
│  │  substance of   │  │ │Easter Service│ │                  │
│  │  things hoped"  │  │ │ April 9th   │ │                  │
│  │    - Heb 11:1   │  │ │ 10:00 AM    │ │                  │
│  └─────────────────┘  │ └─────────────┘ │                  │
│                        └─────────────────┘                  │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Story Cards    │  │  Weekly Verse   │                  │
│  │                 │  │                 │                  │
│  │  [This Week's   │  │  Verse of the   │                  │
│  │   Sermon]       │  │    Week         │                  │
│  │  "Power of Hope"│  │  John 3:16      │                  │
│  │  ↓ Learn more   │  │                 │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

#### Monthly Usage Limits

| Tier | Content/month | Est. cost/content |
|------|--------------|-------------------|
| Basic | 50 | ~$0.02 |
| Standard | 200 | ~$0.02 |
| Premium | 1,000 | ~$0.02 |
| Unlimited | ∞ | Custom pricing |

---

## AI Usage Management

### Usage Monitoring

```
┌────────────────────────────────────────────────────────────┐
│                   AI Usage Dashboard                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  AI Shorts Usage                    AI Social Usage         │
│  ┌──────────────────────┐          ┌──────────────────────┐│
│  │ ████████████░░░░ 75% │          │ ██████░░░░░░░░░ 40%  ││
│  │ 23/30 clips used     │          │ 80/200 posts used    ││
│  └──────────────────────┘          └──────────────────────┘│
│                                                             │
│  ⚠️ AI Shorts: 75% used - 7 remaining                       │
│                                                             │
│  Monthly Reset: 15 days                                     │
│  [Purchase More] [View Usage History]                       │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Usage Alerts

| Usage Rate | Alert Type | Action |
|------------|------------|--------|
| 75% | Email notification | Information only |
| 90% | Email + Dashboard warning | Recommend additional purchase |
| 100% | Email + Feature limitation | Additional purchase required |

### Additional Quota Purchase

| Additional Option | AI Shorts | AI Social |
|-------------------|-----------|-----------|
| 10-pack | $5 | $1 |
| 50-pack | $20 | $4 |
| 100-pack | $35 | $7 |

---

## Module Data Management

### Data Retention Policy

Data processing policy when a module is deactivated:

| Stage | Duration | Status | Data Access |
|-------|----------|--------|-------------|
| Deactivation | Immediate | CANCELLED | Read-only |
| Retention Period | 30 days | ACTIVE | Restorable |
| Export Period | 30 days | EXPORTED | Downloadable |
| Pending Deletion | After 30 days | PURGE_SCHEDULED | Final warning |
| Permanent Deletion | After 30 days | PURGED | Not available |

### Data Retention Flow

```
Module Deactivation
     │
     ▼
┌─────────────────────┐
│  30-Day Grace Period│  ← Immediate restoration if reactivated during this period
│  (Data Preserved)   │
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Data Export        │  ← JSON format download provided
│  Link Sent          │     (Valid for 72 hours)
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Permanent Deletion │  ← Cannot be recovered
└─────────────────────┘
```

### Module-Specific Data Processing

| Module | Processing on Deactivation | Special Considerations |
|--------|---------------------------|----------------------|
| Giving | Records preserved (legal/tax) | Donation records permanently preserved |
| Members | 30-day retention then deletion | GDPR compliance for personal data |
| AI Shorts | Generated videos deleted | Storage immediately released |
| AI Social | Generated content deleted | - |

---

## Stripe Integration

### Module-Based Subscription Items

```
┌────────────────────────────────────────────────────────────┐
│               Stripe Subscription Structure                 │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Customer (Tenant)                                          │
│  └── Subscription                                           │
│      ├── Item: Website ($29/mo)     [price_website_monthly] │
│      ├── Item: Giving ($39/mo)      [price_giving_monthly]  │
│      ├── Item: Members ($29/mo)     [price_members_monthly] │
│      └── Item: AI Shorts ($49/mo)   [price_shorts_monthly]  │
│                                                             │
│  Proration: Enabled (immediate application, pro-rated)     │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Module Add/Remove Flow

```
Module Add Request
     │
     ▼
┌─────────────────────┐
│  Dependency Check   │  ← Verify required modules
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Add Stripe Item    │  ← subscriptionItems.create()
│  (Proration applied)│
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Create TenantModule│  ← Create DB record
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Module Init        │  ← Set up default data
└─────────────────────┘
```

---

## Use Case Scenarios

### Scenario 1: New Church Starting Out

```
1. Start onboarding
2. Enter church information
3. Module selection: Website (required) + Giving
4. Register payment information
5. Complete initial setup

Cost: $68/month
```

### Scenario 2: Growing Church Expansion

```
Current: Website + Giving ($68/month)

Expansion request:
- Add Members (+$29)
- Add Events (+$19)
- Add Mobile App (+$49)

New total: $165/month
Bundle discount (10%): -$16.50
─────────────────────────
Final: $148.50/month (saved from original $165)
```

### Scenario 3: AI Feature Adoption

```
Current: Website + Members + Giving ($97/month)

Add AI modules:
- AI Shorts (+$49)
- AI Social (+$39)

New total: $185/month
Bundle discount (15% - 5 modules): -$27.75
─────────────────────────
Final: $157.25/month
```

### Scenario 4: Module Downgrade

```
Current: 5 modules ($157.25/month)

Removal request: AI Shorts

Process:
1. Removal confirmation dialog
2. Data retention notice (30 days)
3. Remove Stripe subscription item
4. Applied from next billing cycle

New total: 4 modules
Bundle discount (10%): Applied
Final: ~$125/month
```

---

## Legacy Plan Migration

### Plan → Modular Conversion Mapping

| Original Plan | Converted Modules |
|---------------|-------------------|
| Starter | Website |
| Growth | Website, Members, Giving, Events |
| Pro | Website, Members, Giving, Events, Mobile App, Groups |
| Enterprise | All modules |

### Migration Strategy

1. **Automatic Conversion**: Automatically map existing plan features to corresponding modules
2. **Price Guarantee**: 12-month price guarantee for existing customers
3. **Gradual Transition**: Apply Modular model starting with new subscribers
4. **Hybrid Support**: Allow Plan + additional module combinations

---

## Admin Dashboard Features

### Module Management Screen

```
┌────────────────────────────────────────────────────────────┐
│                  Solution Module Management                 │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Active Modules (4)                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ✓ Website          $29/mo    [Settings] [Required]   │  │
│  │ ✓ Giving           $39/mo    [Settings] [Remove]     │  │
│  │ ✓ Members          $29/mo    [Settings] [Remove]     │  │
│  │ ✓ Events           $19/mo    [Settings] [Remove]     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Available Modules                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ○ Mobile App       $49/mo    [+ Add]                 │  │
│  │ ○ Groups           $19/mo    [+ Add]                 │  │
│  │ ○ Streaming        $59/mo    [+ Add]                 │  │
│  │ ○ Check-in         $29/mo    [+ Add] ⚠️ Requires Members│
│  │ ○ AI Shorts        $49/mo    [+ Add]                 │  │
│  │ ○ AI Social        $39/mo    [+ Add]                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Current Monthly: $116                                      │
│  Bundle Discount: -$11.60 (10%)                             │
│  ─────────────────────────────────                          │
│  Total: $104.40/month                                       │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation Summary

### Core Entities

| Entity | Description |
|--------|-------------|
| SolutionModule | Module catalog (pricing, features, dependencies) |
| TenantModule | Per-tenant module subscription status |
| ModuleDependency | Module dependency relationships |
| ModuleAddon | Module-specific add-ons (storage, API calls, etc.) |
| AIUsageQuota | AI module monthly usage tracking |

### Implementation Priority

| Phase | Feature | Priority |
|-------|---------|----------|
| Phase 1 | Module catalog, dependency validation | Required |
| Phase 1 | Onboarding module selection UI | Required |
| Phase 1 | Stripe module-based subscription | Required |
| Phase 2 | Module add/remove management | Required |
| Phase 2 | Automatic bundle discount application | Required |
| Phase 3 | AI modules (Shorts, Social) | Optional |
| Phase 3 | Usage tracking and alerts | Optional |
| Phase 4 | Data retention and export | Optional |

---

**Document Version**: 3.0 Enterprise Edition
**Related Documents**:
- [03-system-architecture.md](./03-system-architecture.md) - Module integration architecture
- [04-multi-tenant-architecture.md](./04-multi-tenant-architecture.md) - Module gating
- [06-feature-modules.md](./06-feature-modules.md) - Detailed module specifications
