# 21. Modular Solutions Architecture

## Overview

A modular architecture that allows churches to selectively subscribe to only the solutions they need.
Adopts a hybrid approach alongside the existing Plan-based tier system.

### Core Solution Modules

| Module ID | Name | Description | Base Price |
|-----------|------|-------------|------------|
| `website` | Church Website | Church website (Core - Required) | $29/mo |
| `mobile-app` | Smartphone App | iOS/Android native app | $49/mo |
| `giving` | Online Giving | Donations and giving system | $39/mo |
| `members` | Member Management | Church member management system | $29/mo |
| `events` | Event Registration | Event registration/reservation system | $19/mo |
| `groups` | Small Groups | Small group management | $19/mo |
| `streaming` | Live Streaming | Live worship streaming | $59/mo |
| `check-in` | Child Check-in | Child check-in system | $29/mo |
| `ai-shorts` | AI Shorts Creator | AI-powered sermon short-form video generator | $49/mo |
| `ai-social` | AI Social Studio | AI-powered social media content creator | $39/mo |

---

## Database Schema

### Module Catalog

```prisma
// Solution Module Catalog
model SolutionModule {
  id              String    @id @default(uuid())
  slug            String    @unique  // website, mobile-app, giving, etc.
  name            String
  description     String

  // Pricing Policy
  basePrice       Decimal   @db.Decimal(10, 2)
  currency        String    @default("USD")
  billingCycle    BillingCycle @default(MONTHLY)

  // Module Metadata
  category        ModuleCategory
  icon            String?
  features        Json      // Detailed feature list per module
  limits          Json?     // Module-specific limits (storage, API calls, etc.)

  // Status
  isCore          Boolean   @default(false)  // Required module flag
  isActive        Boolean   @default(true)
  sortOrder       Int       @default(0)

  // Relations
  dependencies    ModuleDependency[] @relation("DependentModule")
  dependents      ModuleDependency[] @relation("RequiredModule")
  tenantModules   TenantModule[]
  addons          ModuleAddon[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([category])
  @@index([isActive])
}

enum ModuleCategory {
  CORE          // Core (Website)
  ENGAGEMENT    // Engagement (App, Events, Groups)
  FINANCE       // Finance (Giving)
  MANAGEMENT    // Management (Members, Check-in)
  MEDIA         // Media (Streaming)
  AI_CREATIVE   // AI Creative (Shorts, Social Media)
}

enum BillingCycle {
  MONTHLY
  YEARLY
}

// Module Dependencies
model ModuleDependency {
  id              String    @id @default(uuid())

  dependentId     String    // Module that depends
  dependent       SolutionModule @relation("DependentModule", fields: [dependentId], references: [id])

  requiredId      String    // Required module
  required        SolutionModule @relation("RequiredModule", fields: [requiredId], references: [id])

  isHard          Boolean   @default(true)  // true: required, false: recommended

  @@unique([dependentId, requiredId])
}

// Module Add-ons
model ModuleAddon {
  id              String    @id @default(uuid())
  moduleId        String
  module          SolutionModule @relation(fields: [moduleId], references: [id])

  slug            String
  name            String
  description     String
  price           Decimal   @db.Decimal(10, 2)

  // Add-on Type
  addonType       AddonType
  value           Int?      // Quantity type: additional storage (GB), additional users, etc.

  isActive        Boolean   @default(true)

  @@unique([moduleId, slug])
}

enum AddonType {
  STORAGE         // Additional storage
  USERS           // Additional users
  API_CALLS       // API call volume
  FEATURE         // Additional features
  SUPPORT         // Premium support
}
```

### Tenant-Module Relationship

```prisma
// Per-Tenant Module Subscription
model TenantModule {
  id              String    @id @default(uuid())
  tenantId        String
  tenant          Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  moduleId        String
  module          SolutionModule @relation(fields: [moduleId], references: [id])

  // Subscription Status
  status          ModuleStatus @default(ACTIVE)

  // Price (after discounts)
  price           Decimal   @db.Decimal(10, 2)
  discountPercent Int       @default(0)  // Bundle discount, etc.

  // Subscription Period
  activatedAt     DateTime  @default(now())
  expiresAt       DateTime?

  // Payment Info
  stripeItemId    String?   // Stripe Subscription Item ID

  // Module-specific Settings
  config          Json?     // Custom settings per module

  // Add-ons
  addons          TenantModuleAddon[]

  // Usage Tracking
  usage           ModuleUsage[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([tenantId, moduleId])
  @@index([tenantId])
  @@index([status])
}

enum ModuleStatus {
  PENDING         // Awaiting activation
  ACTIVE          // Active
  SUSPENDED       // Suspended (payment failure, etc.)
  CANCELLED       // Cancelled
  TRIAL           // Trial period
}

// Tenant Module Add-on Subscription
model TenantModuleAddon {
  id              String    @id @default(uuid())
  tenantModuleId  String
  tenantModule    TenantModule @relation(fields: [tenantModuleId], references: [id], onDelete: Cascade)

  addonId         String
  quantity        Int       @default(1)
  price           Decimal   @db.Decimal(10, 2)

  createdAt       DateTime  @default(now())
}

// Module Usage Tracking
model ModuleUsage {
  id              String    @id @default(uuid())
  tenantModuleId  String
  tenantModule    TenantModule @relation(fields: [tenantModuleId], references: [id], onDelete: Cascade)

  period          DateTime  // Monthly aggregation

  // Usage Metrics
  storageUsedMB   Int       @default(0)
  apiCalls        Int       @default(0)
  activeUsers     Int       @default(0)
  customMetrics   Json?     // Custom metrics per module

  @@unique([tenantModuleId, period])
  @@index([period])
}
```

### Extended Tenant Model

```prisma
model Tenant {
  id              String    @id @default(uuid())

  // ... existing fields ...

  // Plan (legacy support)
  planId          String?
  plan            Plan?     @relation(fields: [planId], references: [id])

  // Modular subscription (new approach)
  modules         TenantModule[]

  // Subscription type
  subscriptionType SubscriptionType @default(MODULAR)

  // ... existing relations ...
}

enum SubscriptionType {
  LEGACY_PLAN     // Legacy Plan-based
  MODULAR         // Modular subscription
  HYBRID          // Hybrid (Plan + additional modules)
}
```

---

## Module Dependencies

### Dependency Map

```
┌─────────────────────────────────────────────────────────────┐
│                      CORE MODULE                            │
│                       [Website]                             │
│                          │                                  │
│           ┌──────────────┼──────────────┐                  │
│           │              │              │                  │
│           ▼              ▼              ▼                  │
│    ┌──────────┐   ┌──────────┐   ┌──────────┐             │
│    │ Members  │   │  Events  │   │  Groups  │             │
│    └────┬─────┘   └────┬─────┘   └────┬─────┘             │
│         │              │              │                    │
│         │              │              │                    │
│         ▼              ▼              │                    │
│    ┌──────────┐   ┌──────────┐        │                   │
│    │ Check-in │   │  Giving  │◄───────┘                   │
│    └──────────┘   └──────────┘                            │
│                                                            │
│    ┌──────────────────────────────────┐                   │
│    │         Mobile App               │                   │
│    │   (mirrors enabled modules)      │                   │
│    └──────────────────────────────────┘                   │
│                                                            │
│    ┌──────────────────────────────────┐                   │
│    │        Live Streaming            │                   │
│    │        (standalone)              │                   │
│    └──────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Rules

```typescript
// lib/modules/dependencies.ts

export const MODULE_DEPENDENCIES: Record<string, string[]> = {
  'website': [],                    // Core - no dependencies
  'members': ['website'],           // Requires Website
  'events': ['website'],            // Requires Website
  'groups': ['website'],            // Requires Website
  'giving': ['website'],            // Requires Website
  'check-in': ['website', 'members'], // Requires Website + Members
  'mobile-app': ['website'],        // Requires Website
  'streaming': ['website'],         // Requires Website
  'ai-shorts': ['website'],         // Requires Website (uses sermon media)
  'ai-social': ['website'],         // Requires Website (uses church content)
};

export const SOFT_DEPENDENCIES: Record<string, string[]> = {
  'giving': ['members'],            // Members recommended (donor tracking)
  'events': ['members'],            // Members recommended (attendee management)
  'groups': ['members'],            // Members recommended (group member management)
  'ai-shorts': ['streaming'],       // Streaming recommended (live sermon source)
  'ai-social': ['events', 'groups'], // Events/Groups recommended (more content sources)
};

export function validateModuleSelection(
  selectedModules: string[]
): { valid: boolean; missingDependencies: string[]; recommendations: string[] } {
  const missingDependencies: string[] = [];
  const recommendations: string[] = [];

  for (const module of selectedModules) {
    // Hard dependencies
    const required = MODULE_DEPENDENCIES[module] || [];
    for (const dep of required) {
      if (!selectedModules.includes(dep)) {
        missingDependencies.push(dep);
      }
    }

    // Soft dependencies (recommendations)
    const recommended = SOFT_DEPENDENCIES[module] || [];
    for (const rec of recommended) {
      if (!selectedModules.includes(rec) && !recommendations.includes(rec)) {
        recommendations.push(rec);
      }
    }
  }

  return {
    valid: missingDependencies.length === 0,
    missingDependencies: [...new Set(missingDependencies)],
    recommendations: [...new Set(recommendations)],
  };
}
```

---

## Pricing & Billing

### Bundle Discounts

```typescript
// lib/modules/pricing.ts

export const BUNDLE_DISCOUNTS = {
  // 3+ modules: 10% discount
  'bundle-3': {
    minModules: 3,
    discountPercent: 10,
  },
  // 5+ modules: 15% discount
  'bundle-5': {
    minModules: 5,
    discountPercent: 15,
  },
  // All modules: 25% discount
  'bundle-all': {
    minModules: 8,
    discountPercent: 25,
  },
};

export const YEARLY_DISCOUNT = 20; // 20% discount for annual billing

export interface PricingCalculation {
  modules: Array<{
    slug: string;
    basePrice: number;
    discountedPrice: number;
  }>;
  subtotal: number;
  bundleDiscount: number;
  yearlyDiscount: number;
  total: number;
  savings: number;
}

export function calculatePricing(
  selectedModules: SolutionModule[],
  billingCycle: 'monthly' | 'yearly'
): PricingCalculation {
  const subtotal = selectedModules.reduce((sum, m) => sum + Number(m.basePrice), 0);

  // Bundle discount
  let bundleDiscountPercent = 0;
  for (const bundle of Object.values(BUNDLE_DISCOUNTS)) {
    if (selectedModules.length >= bundle.minModules) {
      bundleDiscountPercent = Math.max(bundleDiscountPercent, bundle.discountPercent);
    }
  }
  const bundleDiscount = subtotal * (bundleDiscountPercent / 100);

  // Yearly discount
  const afterBundle = subtotal - bundleDiscount;
  const yearlyDiscount = billingCycle === 'yearly'
    ? afterBundle * (YEARLY_DISCOUNT / 100)
    : 0;

  const total = afterBundle - yearlyDiscount;

  return {
    modules: selectedModules.map(m => ({
      slug: m.slug,
      basePrice: Number(m.basePrice),
      discountedPrice: Number(m.basePrice) * (1 - bundleDiscountPercent / 100),
    })),
    subtotal,
    bundleDiscount,
    yearlyDiscount,
    total: billingCycle === 'yearly' ? total * 12 : total,
    savings: subtotal - total,
  };
}
```

### Stripe Integration

```typescript
// lib/stripe/module-subscription.ts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createModularSubscription(
  tenantId: string,
  customerId: string,
  modules: Array<{ moduleId: string; priceId: string }>,
  billingCycle: 'monthly' | 'yearly'
) {
  // Add each module as a separate subscription item
  const items = modules.map(m => ({
    price: m.priceId,
  }));

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items,
    metadata: {
      tenantId,
      type: 'modular',
    },
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });

  return subscription;
}

export async function addModuleToSubscription(
  subscriptionId: string,
  priceId: string,
  moduleId: string
) {
  const subscriptionItem = await stripe.subscriptionItems.create({
    subscription: subscriptionId,
    price: priceId,
    metadata: { moduleId },
  });

  return subscriptionItem;
}

export async function removeModuleFromSubscription(
  subscriptionItemId: string
) {
  await stripe.subscriptionItems.del(subscriptionItemId, {
    proration_behavior: 'create_prorations',
  });
}
```

---

## Module Selection UI

### Onboarding Module Selection Step

```tsx
// components/onboarding/ModuleSelectionStep.tsx

'use client';

import { useState, useEffect } from 'react';
import { Check, Info, AlertCircle } from 'lucide-react';
import { validateModuleSelection, calculatePricing } from '@/lib/modules';

interface Module {
  id: string;
  slug: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  icon: string;
  isCore: boolean;
  features: string[];
}

interface ModuleSelectionStepProps {
  modules: Module[];
  onSelect: (modules: string[]) => void;
  initialSelection?: string[];
}

export function ModuleSelectionStep({
  modules,
  onSelect,
  initialSelection = ['website'],
}: ModuleSelectionStepProps) {
  const [selected, setSelected] = useState<string[]>(initialSelection);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [validation, setValidation] = useState<ReturnType<typeof validateModuleSelection>>();

  useEffect(() => {
    const result = validateModuleSelection(selected);
    setValidation(result);

    if (result.valid) {
      onSelect(selected);
    }
  }, [selected, onSelect]);

  const selectedModules = modules.filter(m => selected.includes(m.slug));
  const pricing = calculatePricing(selectedModules, billingCycle);

  const toggleModule = (slug: string) => {
    const module = modules.find(m => m.slug === slug);
    if (module?.isCore) return; // Core modules cannot be deselected

    setSelected(prev =>
      prev.includes(slug)
        ? prev.filter(s => s !== slug)
        : [...prev, slug]
    );
  };

  const groupedModules = modules.reduce((acc, module) => {
    const category = module.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">Select Solutions</h2>
        <p className="text-gray-600 mt-2">
          Choose only the solutions your church needs. You can add or change them anytime.
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              billingCycle === 'monthly'
                ? 'bg-white shadow text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              billingCycle === 'yearly'
                ? 'bg-white shadow text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="ml-1 text-xs text-green-600">20% off</span>
          </button>
        </div>
      </div>

      {/* Module Categories */}
      <div className="space-y-6">
        {Object.entries(groupedModules).map(([category, categoryModules]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {getCategoryLabel(category)}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryModules.map(module => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  selected={selected.includes(module.slug)}
                  onToggle={() => toggleModule(module.slug)}
                  disabled={module.isCore}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Validation Messages */}
      {validation && !validation.valid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Required modules are missing</p>
              <p className="text-sm text-red-600 mt-1">
                Please add the following modules: {validation.missingDependencies.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {validation?.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Recommended Modules</p>
              <p className="text-sm text-blue-600 mt-1">
                For a better experience, we recommend: {validation.recommendations.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Summary */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold mb-4">Estimated Cost</h3>

        <div className="space-y-2">
          {pricing.modules.map(m => (
            <div key={m.slug} className="flex justify-between text-sm">
              <span>{modules.find(mod => mod.slug === m.slug)?.name}</span>
              <span>${m.discountedPrice.toFixed(2)}/mo</span>
            </div>
          ))}
        </div>

        <div className="border-t mt-4 pt-4 space-y-2">
          {pricing.bundleDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Bundle Discount</span>
              <span>-${pricing.bundleDiscount.toFixed(2)}</span>
            </div>
          )}
          {pricing.yearlyDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Annual Billing Discount</span>
              <span>-${pricing.yearlyDiscount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="border-t mt-4 pt-4">
          <div className="flex justify-between font-semibold text-lg">
            <span>Total Cost</span>
            <span>
              ${pricing.total.toFixed(2)}
              <span className="text-sm font-normal text-gray-500">
                /{billingCycle === 'yearly' ? 'year' : 'month'}
              </span>
            </span>
          </div>
          {pricing.savings > 0 && (
            <p className="text-sm text-green-600 mt-1">
              You save ${pricing.savings.toFixed(2)}!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Module Card Component
function ModuleCard({
  module,
  selected,
  onToggle,
  disabled,
}: {
  module: Module;
  selected: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <div
      onClick={disabled ? undefined : onToggle}
      className={`
        relative rounded-lg border-2 p-4 transition cursor-pointer
        ${selected
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 hover:border-gray-300'
        }
        ${disabled ? 'cursor-not-allowed opacity-75' : ''}
      `}
    >
      {/* Selection Indicator */}
      <div className={`
        absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center
        ${selected ? 'bg-primary-500 text-white' : 'bg-gray-200'}
      `}>
        {selected && <Check className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="pr-8">
        <div className="text-2xl mb-2">{module.icon}</div>
        <h4 className="font-semibold">{module.name}</h4>
        <p className="text-sm text-gray-600 mt-1">{module.description}</p>

        {/* Price */}
        <div className="mt-3">
          <span className="font-bold text-lg">${module.basePrice}</span>
          <span className="text-gray-500 text-sm">/mo</span>
        </div>

        {/* Features Preview */}
        <ul className="mt-3 space-y-1">
          {module.features.slice(0, 3).map((feature, i) => (
            <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>

        {/* Core Badge */}
        {module.isCore && (
          <span className="inline-block mt-3 px-2 py-1 text-xs bg-gray-200 rounded">
            Required Module
          </span>
        )}
      </div>
    </div>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    CORE: 'Core',
    ENGAGEMENT: 'Engagement',
    FINANCE: 'Finance',
    MANAGEMENT: 'Management',
    MEDIA: 'Media',
  };
  return labels[category] || category;
}
```

---

## Admin Module Management

### Tenant Settings - Modules

```tsx
// app/admin/[tenant]/settings/modules/page.tsx

import { prisma } from '@/lib/prisma';
import { ModuleManagement } from '@/components/admin/ModuleManagement';

export default async function ModulesSettingsPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: params.tenant },
    include: {
      modules: {
        include: {
          module: true,
          addons: true,
        },
      },
    },
  });

  const allModules = await prisma.solutionModule.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Solution Module Management</h1>

      <ModuleManagement
        tenant={tenant}
        allModules={allModules}
        activeModules={tenant.modules}
      />
    </div>
  );
}
```

```tsx
// components/admin/ModuleManagement.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Settings } from 'lucide-react';

export function ModuleManagement({
  tenant,
  allModules,
  activeModules,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const activeModuleSlugs = activeModules.map(m => m.module.slug);

  const handleAddModule = async (moduleId: string) => {
    setLoading(moduleId);
    try {
      await fetch(`/api/admin/${tenant.slug}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId }),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to add module:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleRemoveModule = async (tenantModuleId: string) => {
    if (!confirm('Are you sure you want to remove this module? Related data will be preserved.')) {
      return;
    }

    setLoading(tenantModuleId);
    try {
      await fetch(`/api/admin/${tenant.slug}/modules/${tenantModuleId}`, {
        method: 'DELETE',
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to remove module:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Active Modules */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Active Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeModules.map(tm => (
            <div
              key={tm.id}
              className="bg-white rounded-lg border p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="font-medium">{tm.module.name}</h3>
                <p className="text-sm text-gray-500">
                  ${Number(tm.price).toFixed(2)}/mo
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/admin/${tenant.slug}/settings/modules/${tm.id}`)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <Settings className="w-5 h-5" />
                </button>
                {!tm.module.isCore && (
                  <button
                    onClick={() => handleRemoveModule(tm.id)}
                    disabled={loading === tm.id}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Available Modules */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Available Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allModules
            .filter(m => !activeModuleSlugs.includes(m.slug))
            .map(module => (
              <div
                key={module.id}
                className="bg-gray-50 rounded-lg border border-dashed p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium">{module.name}</h3>
                  <p className="text-sm text-gray-500">
                    ${Number(module.basePrice).toFixed(2)}/mo
                  </p>
                </div>
                <button
                  onClick={() => handleAddModule(module.id)}
                  disabled={loading === module.id}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
```

---

## API Routes

### Module Management APIs

```typescript
// app/api/admin/[tenant]/modules/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateModuleSelection } from '@/lib/modules/dependencies';
import { addModuleToSubscription } from '@/lib/stripe/module-subscription';

export async function POST(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  try {
    const { moduleId } = await request.json();

    const tenant = await prisma.tenant.findUnique({
      where: { slug: params.tenant },
      include: {
        modules: { include: { module: true } },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const module = await prisma.solutionModule.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Validate dependencies
    const currentModules = tenant.modules.map(m => m.module.slug);
    const newSelection = [...currentModules, module.slug];
    const validation = validateModuleSelection(newSelection);

    if (!validation.valid) {
      return NextResponse.json({
        error: 'Missing dependencies',
        missingDependencies: validation.missingDependencies,
      }, { status: 400 });
    }

    // Add to Stripe subscription
    const stripeItem = await addModuleToSubscription(
      tenant.stripeSubscriptionId!,
      module.stripePriceId!,
      module.id
    );

    // Create tenant module
    const tenantModule = await prisma.tenantModule.create({
      data: {
        tenantId: tenant.id,
        moduleId: module.id,
        price: module.basePrice,
        status: 'ACTIVE',
        stripeItemId: stripeItem.id,
      },
      include: { module: true },
    });

    return NextResponse.json(tenantModule);
  } catch (error) {
    console.error('Failed to add module:', error);
    return NextResponse.json({ error: 'Failed to add module' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tenant: string } }
) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: params.tenant },
    include: {
      modules: {
        include: {
          module: true,
          addons: true,
          usage: {
            orderBy: { period: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  return NextResponse.json(tenant.modules);
}
```

---

## Module-Aware Feature Gates

### Feature Gate Hook

```typescript
// hooks/useModuleAccess.ts

import { useQuery } from '@tanstack/react-query';

interface ModuleAccess {
  hasAccess: boolean;
  module: string;
  status: 'active' | 'trial' | 'suspended' | 'none';
  expiresAt?: Date;
}

export function useModuleAccess(moduleSlug: string): ModuleAccess {
  const { data: modules } = useQuery({
    queryKey: ['tenant-modules'],
    queryFn: () => fetch('/api/modules').then(r => r.json()),
  });

  const module = modules?.find(m => m.module.slug === moduleSlug);

  if (!module) {
    return { hasAccess: false, module: moduleSlug, status: 'none' };
  }

  return {
    hasAccess: module.status === 'ACTIVE' || module.status === 'TRIAL',
    module: moduleSlug,
    status: module.status.toLowerCase(),
    expiresAt: module.expiresAt ? new Date(module.expiresAt) : undefined,
  };
}
```

### Feature Gate Component

```tsx
// components/ModuleGate.tsx

'use client';

import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Lock } from 'lucide-react';
import Link from 'next/link';

interface ModuleGateProps {
  module: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ModuleGate({ module, children, fallback }: ModuleGateProps) {
  const { hasAccess, status } = useModuleAccess(module);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6 text-center">
      <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="font-semibold text-lg mb-2">
        This feature requires an additional module
      </h3>
      <p className="text-gray-600 mb-4">
        Activate the {module} module to use this feature.
      </p>
      <Link
        href="/admin/settings/modules"
        className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
      >
        Add Module
      </Link>
    </div>
  );
}
```

### Usage Example

```tsx
// app/admin/[tenant]/giving/page.tsx

import { ModuleGate } from '@/components/ModuleGate';
import { GivingDashboard } from '@/components/giving/Dashboard';

export default function GivingPage() {
  return (
    <ModuleGate module="giving">
      <GivingDashboard />
    </ModuleGate>
  );
}
```

### Server-Side Runtime Module Check

The client-side checks are for UX; server-side validation is required for security. Use middleware for API routes and server components.

```typescript
// lib/modules/runtime-check.ts
import { prisma } from '@/lib/db/client';
import { getCurrentTenantId } from '@/lib/tenant/context';
import { NextRequest, NextResponse } from 'next/server';

// Custom error class for module access violations
export class ModuleNotActiveError extends Error {
  public readonly moduleSlug: string;
  public readonly statusCode = 403;

  constructor(moduleSlug: string) {
    super(`Module '${moduleSlug}' is not active for this tenant`);
    this.name = 'ModuleNotActiveError';
    this.moduleSlug = moduleSlug;
  }
}

/**
 * Check if a module is active for the current tenant.
 * Throws ModuleNotActiveError if not active.
 */
export async function requireModule(moduleSlug: string): Promise<void> {
  const tenantId = getCurrentTenantId();

  if (!tenantId) {
    throw new Error('Tenant context required');
  }

  const tenantModule = await prisma.tenantModule.findFirst({
    where: {
      tenantId,
      module: { slug: moduleSlug },
      status: { in: ['ACTIVE', 'TRIAL'] },
    },
    include: {
      module: true,
    },
  });

  if (!tenantModule) {
    throw new ModuleNotActiveError(moduleSlug);
  }

  // Check if trial has expired
  if (tenantModule.status === 'TRIAL' && tenantModule.expiresAt) {
    if (new Date() > tenantModule.expiresAt) {
      throw new ModuleNotActiveError(moduleSlug);
    }
  }
}

/**
 * Check if a module is active (returns boolean instead of throwing).
 */
export async function isModuleActive(
  tenantId: string,
  moduleSlug: string
): Promise<boolean> {
  const tenantModule = await prisma.tenantModule.findFirst({
    where: {
      tenantId,
      module: { slug: moduleSlug },
      status: { in: ['ACTIVE', 'TRIAL'] },
    },
  });

  if (!tenantModule) return false;

  if (tenantModule.status === 'TRIAL' && tenantModule.expiresAt) {
    return new Date() <= tenantModule.expiresAt;
  }

  return true;
}

/**
 * Get all active modules for a tenant.
 */
export async function getActiveModules(tenantId: string): Promise<string[]> {
  const modules = await prisma.tenantModule.findMany({
    where: {
      tenantId,
      status: { in: ['ACTIVE', 'TRIAL'] },
    },
    include: {
      module: { select: { slug: true } },
    },
  });

  return modules
    .filter(tm => {
      if (tm.status === 'TRIAL' && tm.expiresAt) {
        return new Date() <= tm.expiresAt;
      }
      return true;
    })
    .map(tm => tm.module.slug);
}
```

### API Route Middleware

```typescript
// lib/modules/api-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireModule, ModuleNotActiveError } from './runtime-check';

type ApiHandler = (req: NextRequest, ...args: any[]) => Promise<NextResponse>;

/**
 * Middleware that requires a specific module to be active.
 * Use this to protect API routes that belong to specific modules.
 */
export function withModuleRequired(moduleSlug: string) {
  return function (handler: ApiHandler): ApiHandler {
    return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
      try {
        await requireModule(moduleSlug);
        return handler(req, ...args);
      } catch (error) {
        if (error instanceof ModuleNotActiveError) {
          return NextResponse.json(
            {
              error: 'Module not active',
              code: 'MODULE_NOT_ACTIVE',
              module: error.moduleSlug,
              message: `The '${error.moduleSlug}' module is required for this operation. Please activate it in your subscription settings.`,
            },
            { status: 403 }
          );
        }
        throw error;
      }
    };
  };
}

// Usage example:
// export const POST = withModuleRequired('giving')(async (req) => {
//   // This code only runs if 'giving' module is active
//   const donation = await createDonation(req);
//   return NextResponse.json(donation);
// });
```

### Multi-Module Route Protection

```typescript
// lib/modules/route-config.ts

/**
 * Map API routes to required modules.
 * Used by middleware to automatically check module access.
 */
export const MODULE_ROUTE_MAP: Record<string, string> = {
  // Giving module routes
  '/api/donations': 'giving',
  '/api/donations/[id]': 'giving',
  '/api/funds': 'giving',
  '/api/campaigns': 'giving',
  '/api/recurring-donations': 'giving',

  // Members module routes
  '/api/members': 'members',
  '/api/members/[id]': 'members',
  '/api/families': 'members',

  // Events module routes
  '/api/events': 'events',
  '/api/events/[id]': 'events',
  '/api/registrations': 'events',

  // Groups module routes
  '/api/groups': 'groups',
  '/api/groups/[id]': 'groups',
  '/api/group-memberships': 'groups',

  // Check-in module routes
  '/api/checkins': 'check-in',
  '/api/checkins/[id]': 'check-in',

  // Streaming module routes
  '/api/streams': 'streaming',
  '/api/streams/[id]': 'streaming',

  // AI Shorts module routes
  '/api/ai/shorts': 'ai-shorts',
  '/api/ai/shorts/[id]': 'ai-shorts',

  // AI Social module routes
  '/api/ai/social': 'ai-social',
  '/api/ai/social/[id]': 'ai-social',
};

/**
 * Get required module for a given route pattern.
 */
export function getRequiredModule(pathname: string): string | null {
  // Exact match first
  if (MODULE_ROUTE_MAP[pathname]) {
    return MODULE_ROUTE_MAP[pathname];
  }

  // Pattern match (handle dynamic segments)
  for (const [pattern, module] of Object.entries(MODULE_ROUTE_MAP)) {
    const regex = new RegExp(
      '^' + pattern.replace(/\[.*?\]/g, '[^/]+') + '$'
    );
    if (regex.test(pathname)) {
      return module;
    }
  }

  return null;
}
```

---

## Module Data Retention Policy

When a module is deactivated, the associated data must be handled carefully to prevent data loss while respecting user decisions and storage limits.

### Data Retention Schema

```prisma
// Module Data Retention Tracking
model ModuleDataRetention {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  moduleSlug      String    @map("module_slug")

  // Deactivation Info
  deactivatedAt   DateTime  @map("deactivated_at")
  deactivatedBy   String?   @map("deactivated_by")  // user_id

  // Retention Period
  retentionEndsAt DateTime  @map("retention_ends_at")  // 30 days after deactivation

  // Data Summary
  dataSummary     Json      @map("data_summary")  // { records: 100, storageBytes: 1024000 }

  // Export Info
  exportedAt      DateTime? @map("exported_at")
  exportUrl       String?   @map("export_url")  // Temporary download link
  exportExpiresAt DateTime? @map("export_expires_at")

  // Final Status
  status          RetentionStatus @default(ACTIVE)
  purgedAt        DateTime? @map("purged_at")

  @@unique([tenantId, moduleSlug])
  @@map("module_data_retentions")
  @@index([tenantId])
  @@index([retentionEndsAt])
  @@index([status])
}

enum RetentionStatus {
  ACTIVE          // Data is retained, can be restored
  EXPORTED        // Data has been exported
  PURGE_SCHEDULED // Scheduled for purging
  PURGED          // Data has been permanently deleted
  RESTORED        // Module was reactivated, data restored
}
```

### Module Deactivation Service

```typescript
// lib/modules/deactivation-service.ts
import { prisma } from '@/lib/db/client';
import { invalidateModuleCacheGlobal } from '@/lib/cache/cache-invalidation';

const RETENTION_DAYS = 30;  // 30-day grace period

export interface DeactivationResult {
  success: boolean;
  retentionEndsAt: Date;
  dataSummary: {
    module: string;
    recordCount: number;
    storageBytes: number;
  };
}

/**
 * Deactivate a module for a tenant with data retention.
 */
export async function deactivateModule(
  tenantId: string,
  moduleSlug: string,
  userId: string
): Promise<DeactivationResult> {
  // Get data summary before deactivation
  const dataSummary = await getModuleDataSummary(tenantId, moduleSlug);

  const retentionEndsAt = new Date();
  retentionEndsAt.setDate(retentionEndsAt.getDate() + RETENTION_DAYS);

  // Transaction: Update module status and create retention record
  await prisma.$transaction(async (tx) => {
    // Update tenant module status
    await tx.tenantModule.updateMany({
      where: {
        tenantId,
        module: { slug: moduleSlug },
      },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });

    // Create or update retention record
    await tx.moduleDataRetention.upsert({
      where: {
        tenantId_moduleSlug: { tenantId, moduleSlug },
      },
      create: {
        tenantId,
        moduleSlug,
        deactivatedAt: new Date(),
        deactivatedBy: userId,
        retentionEndsAt,
        dataSummary,
        status: 'ACTIVE',
      },
      update: {
        deactivatedAt: new Date(),
        deactivatedBy: userId,
        retentionEndsAt,
        dataSummary,
        status: 'ACTIVE',
        purgedAt: null,
      },
    });

    // Log audit event
    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'MODULE_DEACTIVATED',
        resource: 'module',
        resourceId: moduleSlug,
        newValues: { retentionEndsAt, dataSummary },
      },
    });
  });

  // Invalidate caches
  await invalidateModuleCacheGlobal(tenantId);

  return {
    success: true,
    retentionEndsAt,
    dataSummary: {
      module: moduleSlug,
      ...dataSummary,
    },
  };
}

/**
 * Reactivate a module and restore data access.
 */
export async function reactivateModule(
  tenantId: string,
  moduleSlug: string,
  userId: string
): Promise<{ success: boolean; restored: boolean }> {
  const retention = await prisma.moduleDataRetention.findUnique({
    where: {
      tenantId_moduleSlug: { tenantId, moduleSlug },
    },
  });

  // Check if data was already purged
  if (retention?.status === 'PURGED') {
    return { success: true, restored: false };
  }

  await prisma.$transaction(async (tx) => {
    // Reactivate module
    await tx.tenantModule.updateMany({
      where: {
        tenantId,
        module: { slug: moduleSlug },
      },
      data: {
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    // Update retention status
    if (retention) {
      await tx.moduleDataRetention.update({
        where: { id: retention.id },
        data: { status: 'RESTORED' },
      });
    }

    // Log audit event
    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'MODULE_ACTIVATED',
        resource: 'module',
        resourceId: moduleSlug,
      },
    });
  });

  await invalidateModuleCacheGlobal(tenantId);

  return { success: true, restored: retention?.status === 'ACTIVE' };
}

/**
 * Get data summary for a module.
 */
async function getModuleDataSummary(
  tenantId: string,
  moduleSlug: string
): Promise<{ recordCount: number; storageBytes: number }> {
  // Module-specific data counting logic
  const summaries: Record<string, () => Promise<{ recordCount: number; storageBytes: number }>> = {
    'giving': async () => ({
      recordCount: await prisma.donation.count({ where: { tenantId } }),
      storageBytes: 0,  // Donations are mostly DB records
    }),
    'members': async () => ({
      recordCount: await prisma.member.count({ where: { tenantId } }),
      storageBytes: 0,
    }),
    'events': async () => ({
      recordCount: await prisma.event.count({ where: { tenantId } }),
      storageBytes: 0,
    }),
    'ai-shorts': async () => {
      const clips = await prisma.aIShortClip.findMany({
        where: { tenantId },
        select: { fileSize: true },
      });
      return {
        recordCount: clips.length,
        storageBytes: clips.reduce((sum, c) => sum + (c.fileSize || 0), 0),
      };
    },
    'ai-social': async () => {
      const contents = await prisma.aISocialContent.count({ where: { tenantId } });
      return { recordCount: contents, storageBytes: 0 };
    },
  };

  const summarizer = summaries[moduleSlug];
  return summarizer ? summarizer() : { recordCount: 0, storageBytes: 0 };
}
```

### Data Export Service

```typescript
// lib/modules/data-export-service.ts
import { prisma } from '@/lib/db/client';
import { uploadToStorage, generateSignedUrl } from '@/lib/storage';

const EXPORT_EXPIRY_HOURS = 72;  // Export links valid for 72 hours

/**
 * Export module data for download before purging.
 */
export async function exportModuleData(
  tenantId: string,
  moduleSlug: string
): Promise<{ exportUrl: string; expiresAt: Date }> {
  // Get retention record
  const retention = await prisma.moduleDataRetention.findUnique({
    where: {
      tenantId_moduleSlug: { tenantId, moduleSlug },
    },
  });

  if (!retention || retention.status === 'PURGED') {
    throw new Error('No data available for export');
  }

  // Export data based on module
  const exportData = await gatherModuleExportData(tenantId, moduleSlug);

  // Upload to temporary storage
  const filename = `${tenantId}/${moduleSlug}/export-${Date.now()}.json`;
  await uploadToStorage(filename, JSON.stringify(exportData, null, 2));

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + EXPORT_EXPIRY_HOURS);

  const exportUrl = await generateSignedUrl(filename, EXPORT_EXPIRY_HOURS * 60 * 60);

  // Update retention record
  await prisma.moduleDataRetention.update({
    where: { id: retention.id },
    data: {
      exportedAt: new Date(),
      exportUrl,
      exportExpiresAt: expiresAt,
      status: 'EXPORTED',
    },
  });

  return { exportUrl, expiresAt };
}

async function gatherModuleExportData(
  tenantId: string,
  moduleSlug: string
): Promise<any> {
  const exporters: Record<string, () => Promise<any>> = {
    'giving': async () => ({
      donations: await prisma.donation.findMany({
        where: { tenantId },
        include: { fund: true, member: true },
      }),
      funds: await prisma.fund.findMany({ where: { tenantId } }),
      campaigns: await prisma.campaign.findMany({ where: { tenantId } }),
      recurringDonations: await prisma.recurringDonation.findMany({
        where: { tenantId },
      }),
    }),
    'members': async () => ({
      members: await prisma.member.findMany({
        where: { tenantId },
        include: { family: true },
      }),
      families: await prisma.family.findMany({ where: { tenantId } }),
    }),
    // Add more module exporters as needed
  };

  const exporter = exporters[moduleSlug];
  return exporter ? exporter() : {};
}
```

### Scheduled Data Purge Job

```typescript
// jobs/purge-expired-module-data.ts
import { prisma } from '@/lib/db/client';

/**
 * Cron job to purge expired module data.
 * Run daily to check for retention periods that have ended.
 */
export async function purgeExpiredModuleData(): Promise<void> {
  const expiredRetentions = await prisma.moduleDataRetention.findMany({
    where: {
      status: { in: ['ACTIVE', 'EXPORTED'] },
      retentionEndsAt: { lt: new Date() },
    },
  });

  for (const retention of expiredRetentions) {
    try {
      await purgeModuleData(retention.tenantId, retention.moduleSlug);

      await prisma.moduleDataRetention.update({
        where: { id: retention.id },
        data: {
          status: 'PURGED',
          purgedAt: new Date(),
        },
      });

      console.log(
        `Purged data for tenant ${retention.tenantId}, module ${retention.moduleSlug}`
      );
    } catch (error) {
      console.error(
        `Failed to purge data for tenant ${retention.tenantId}, module ${retention.moduleSlug}:`,
        error
      );
    }
  }
}

async function purgeModuleData(
  tenantId: string,
  moduleSlug: string
): Promise<void> {
  // Module-specific purge logic
  const purgers: Record<string, () => Promise<void>> = {
    'giving': async () => {
      // Note: Keep donation records for tax/legal compliance
      // Only delete processing details, not donation history
      await prisma.recurringDonation.deleteMany({
        where: { tenantId, status: 'CANCELLED' },
      });
    },
    'ai-shorts': async () => {
      // Delete AI-generated clips and associated media files
      const clips = await prisma.aIShortClip.findMany({
        where: { tenantId },
        select: { id: true, outputUrl: true },
      });

      // Delete from storage
      for (const clip of clips) {
        if (clip.outputUrl) {
          await deleteFromStorage(clip.outputUrl);
        }
      }

      await prisma.aIShortClip.deleteMany({ where: { tenantId } });
    },
    'ai-social': async () => {
      await prisma.aISocialContent.deleteMany({ where: { tenantId } });
    },
  };

  const purger = purgers[moduleSlug];
  if (purger) {
    await purger();
  }
}
```

---

## AI Creative Module Usage Quotas

AI modules (AI Shorts, AI Social) use external APIs (OpenAI, Replicate) with associated costs. Implement usage quotas to manage costs and provide predictable billing.

### AI Usage Schema

```prisma
// AI Module Usage Tracking
model AIUsageQuota {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  moduleSlug      String    @map("module_slug")  // ai-shorts, ai-social

  // Monthly Quotas
  monthlyLimit    Int       @map("monthly_limit")      // Included in subscription
  additionalQuota Int       @default(0) @map("additional_quota")  // Purchased add-on
  usedThisMonth   Int       @default(0) @map("used_this_month")

  // Reset Tracking
  periodStart     DateTime  @map("period_start")
  periodEnd       DateTime  @map("period_end")

  // Cost Tracking
  estimatedCost   Decimal   @default(0) @db.Decimal(10, 4) @map("estimated_cost")

  // Alerts
  alertAt75Sent   Boolean   @default(false) @map("alert_at_75_sent")
  alertAt90Sent   Boolean   @default(false) @map("alert_at_90_sent")
  alertAt100Sent  Boolean   @default(false) @map("alert_at_100_sent")

  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@unique([tenantId, moduleSlug, periodStart])
  @@map("ai_usage_quotas")
  @@index([tenantId])
  @@index([periodEnd])
}

// Individual AI Operation Tracking
model AIUsageRecord {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  moduleSlug      String    @map("module_slug")
  userId          String    @map("user_id")

  // Operation Details
  operationType   String    @map("operation_type")  // generate_short, create_caption, etc.
  inputTokens     Int?      @map("input_tokens")
  outputTokens    Int?      @map("output_tokens")
  processingTime  Int?      @map("processing_time")  // seconds

  // Cost
  estimatedCost   Decimal   @db.Decimal(10, 4) @map("estimated_cost")

  // Reference
  resourceId      String?   @map("resource_id")  // AI Short Clip ID or Social Content ID
  resourceType    String?   @map("resource_type")

  // Status
  status          String    @default("completed")  // completed, failed, refunded
  errorMessage    String?   @map("error_message")

  createdAt       DateTime  @default(now()) @map("created_at")

  @@map("ai_usage_records")
  @@index([tenantId, createdAt])
  @@index([moduleSlug])
}
```

### AI Quota Service

```typescript
// lib/ai/quota-service.ts
import { prisma } from '@/lib/db/client';
import { sendEmail } from '@/lib/email';

// Default quotas per plan (operations per month)
export const AI_QUOTAS = {
  'ai-shorts': {
    default: 10,       // Free tier: 10 shorts/month
    standard: 30,      // Standard: 30 shorts/month
    premium: 100,      // Premium: 100 shorts/month
    unlimited: -1,     // Unlimited plan
  },
  'ai-social': {
    default: 50,       // Free tier: 50 posts/month
    standard: 200,     // Standard: 200 posts/month
    premium: 1000,     // Premium: 1000 posts/month
    unlimited: -1,     // Unlimited plan
  },
};

// Estimated cost per operation (USD)
const COST_PER_OPERATION = {
  'ai-shorts': 0.50,   // ~$0.50 per short (video generation + transcription)
  'ai-social': 0.02,   // ~$0.02 per social post (text generation)
};

export class AIQuotaExceededError extends Error {
  constructor(
    public readonly moduleSlug: string,
    public readonly used: number,
    public readonly limit: number
  ) {
    super(`AI quota exceeded for ${moduleSlug}: ${used}/${limit}`);
    this.name = 'AIQuotaExceededError';
  }
}

/**
 * Check if tenant has available quota for an AI operation.
 */
export async function checkQuota(
  tenantId: string,
  moduleSlug: string
): Promise<{ available: boolean; remaining: number; limit: number }> {
  const quota = await getOrCreateQuota(tenantId, moduleSlug);

  const totalLimit = quota.monthlyLimit + quota.additionalQuota;

  // -1 means unlimited
  if (totalLimit === -1) {
    return { available: true, remaining: -1, limit: -1 };
  }

  const remaining = totalLimit - quota.usedThisMonth;

  return {
    available: remaining > 0,
    remaining,
    limit: totalLimit,
  };
}

/**
 * Consume quota for an AI operation.
 */
export async function consumeQuota(
  tenantId: string,
  moduleSlug: string,
  userId: string,
  operationType: string,
  resourceId?: string
): Promise<void> {
  const { available, remaining, limit } = await checkQuota(tenantId, moduleSlug);

  if (!available) {
    throw new AIQuotaExceededError(moduleSlug, limit - remaining + 1, limit);
  }

  const estimatedCost = COST_PER_OPERATION[moduleSlug] || 0;

  await prisma.$transaction(async (tx) => {
    // Record the usage
    await tx.aIUsageRecord.create({
      data: {
        tenantId,
        moduleSlug,
        userId,
        operationType,
        estimatedCost,
        resourceId,
        resourceType: moduleSlug === 'ai-shorts' ? 'AIShortClip' : 'AISocialContent',
      },
    });

    // Update quota
    const quota = await tx.aIUsageQuota.findFirst({
      where: {
        tenantId,
        moduleSlug,
        periodEnd: { gt: new Date() },
      },
    });

    if (quota) {
      const newUsed = quota.usedThisMonth + 1;
      const totalLimit = quota.monthlyLimit + quota.additionalQuota;
      const usagePercent = (newUsed / totalLimit) * 100;

      await tx.aIUsageQuota.update({
        where: { id: quota.id },
        data: {
          usedThisMonth: newUsed,
          estimatedCost: { increment: estimatedCost },
          // Send alerts at thresholds
          alertAt75Sent: usagePercent >= 75 || quota.alertAt75Sent,
          alertAt90Sent: usagePercent >= 90 || quota.alertAt90Sent,
          alertAt100Sent: usagePercent >= 100 || quota.alertAt100Sent,
        },
      });

      // Send alert emails
      await sendQuotaAlerts(tenantId, moduleSlug, usagePercent, newUsed, totalLimit, quota);
    }
  });
}

/**
 * Get or create monthly quota record.
 */
async function getOrCreateQuota(
  tenantId: string,
  moduleSlug: string
): Promise<any> {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  let quota = await prisma.aIUsageQuota.findFirst({
    where: {
      tenantId,
      moduleSlug,
      periodStart,
    },
  });

  if (!quota) {
    // Get tenant's subscription tier to determine limit
    const tenantModule = await prisma.tenantModule.findFirst({
      where: {
        tenantId,
        module: { slug: moduleSlug },
        status: { in: ['ACTIVE', 'TRIAL'] },
      },
    });

    const monthlyLimit = AI_QUOTAS[moduleSlug]?.default || 10;

    quota = await prisma.aIUsageQuota.create({
      data: {
        tenantId,
        moduleSlug,
        monthlyLimit,
        periodStart,
        periodEnd,
      },
    });
  }

  return quota;
}

/**
 * Send quota usage alert emails.
 */
async function sendQuotaAlerts(
  tenantId: string,
  moduleSlug: string,
  usagePercent: number,
  used: number,
  limit: number,
  quota: any
): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { email: true, name: true },
  });

  if (!tenant?.email) return;

  const moduleName = moduleSlug === 'ai-shorts' ? 'AI Shorts' : 'AI Social';

  if (usagePercent >= 75 && !quota.alertAt75Sent) {
    await sendEmail({
      to: tenant.email,
      subject: `${moduleName} Usage Alert: 75% of quota used`,
      template: 'ai-quota-alert',
      data: {
        churchName: tenant.name,
        moduleName,
        usagePercent: 75,
        used,
        limit,
      },
    });
  }

  if (usagePercent >= 90 && !quota.alertAt90Sent) {
    await sendEmail({
      to: tenant.email,
      subject: `${moduleName} Usage Alert: 90% of quota used`,
      template: 'ai-quota-alert',
      data: {
        churchName: tenant.name,
        moduleName,
        usagePercent: 90,
        used,
        limit,
      },
    });
  }

  if (usagePercent >= 100 && !quota.alertAt100Sent) {
    await sendEmail({
      to: tenant.email,
      subject: `${moduleName} Quota Exceeded`,
      template: 'ai-quota-exceeded',
      data: {
        churchName: tenant.name,
        moduleName,
        used,
        limit,
      },
    });
  }
}
```

### AI Quota Dashboard Component

```tsx
// components/ai/QuotaUsageCard.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle } from 'lucide-react';

interface QuotaUsageCardProps {
  moduleSlug: 'ai-shorts' | 'ai-social';
}

export function QuotaUsageCard({ moduleSlug }: QuotaUsageCardProps) {
  const { data: quota } = useQuery({
    queryKey: ['ai-quota', moduleSlug],
    queryFn: () => fetch(`/api/ai/quota/${moduleSlug}`).then(r => r.json()),
  });

  if (!quota) return null;

  const usagePercent = quota.limit === -1
    ? 0
    : Math.round((quota.used / quota.limit) * 100);

  const isWarning = usagePercent >= 75;
  const isCritical = usagePercent >= 90;

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">
          {moduleSlug === 'ai-shorts' ? 'AI Shorts' : 'AI Social'} Usage
        </h3>
        {isCritical && (
          <AlertTriangle className="w-5 h-5 text-red-500" />
        )}
      </div>

      <div className="space-y-2">
        <Progress
          value={usagePercent}
          className={isCritical ? 'bg-red-100' : isWarning ? 'bg-yellow-100' : ''}
        />
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            {quota.used} / {quota.limit === -1 ? '∞' : quota.limit} used
          </span>
          <span>{usagePercent}%</span>
        </div>
      </div>

      {quota.limit !== -1 && quota.remaining <= 5 && (
        <div className="mt-3 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
          Only {quota.remaining} operations remaining this month.
          <a href="/admin/settings/billing" className="underline ml-1">
            Upgrade for more
          </a>
        </div>
      )}
    </div>
  );
}
```

---

## Updated Onboarding Flow

### Onboarding Steps (Updated)

```typescript
// lib/onboarding/steps.ts

export const ONBOARDING_STEPS = [
  {
    id: 'church-info',
    title: 'Church Information',
    description: 'Enter your basic information',
  },
  {
    id: 'module-selection',  // NEW
    title: 'Select Solutions',
    description: 'Choose the solutions you need',
  },
  {
    id: 'payment',
    title: 'Payment Information',
    description: 'Register your payment method',
  },
  {
    id: 'setup-wizard',
    title: 'Initial Setup',
    description: 'Configure your selected modules',
  },
  {
    id: 'welcome',
    title: 'Get Started',
    description: 'Start using your church platform',
  },
];
```

### Provisioning Service (Updated)

```typescript
// lib/provisioning/service.ts

import { prisma } from '@/lib/prisma';
import { createModularSubscription } from '@/lib/stripe/module-subscription';

interface ProvisioningConfig {
  tenant: {
    name: string;
    slug: string;
    email: string;
  };
  selectedModules: string[];  // Module slugs
  billingCycle: 'monthly' | 'yearly';
  paymentMethodId: string;
}

export async function provisionTenant(config: ProvisioningConfig) {
  const { tenant: tenantData, selectedModules, billingCycle, paymentMethodId } = config;

  // 1. Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: tenantData.name,
      slug: tenantData.slug,
      email: tenantData.email,
      subscriptionType: 'MODULAR',
      status: 'PROVISIONING',
    },
  });

  // 2. Create Stripe customer
  const customer = await stripe.customers.create({
    email: tenant.email,
    name: tenant.name,
    metadata: { tenantId: tenant.id },
  });

  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customer.id,
  });

  // 3. Get module details
  const modules = await prisma.solutionModule.findMany({
    where: { slug: { in: selectedModules } },
  });

  // 4. Create Stripe subscription
  const subscription = await createModularSubscription(
    tenant.id,
    customer.id,
    modules.map(m => ({
      moduleId: m.id,
      priceId: billingCycle === 'yearly' ? m.stripeYearlyPriceId : m.stripeMonthlyPriceId,
    })),
    billingCycle
  );

  // 5. Create tenant modules
  const subscriptionItems = subscription.items.data;

  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];
    const stripeItem = subscriptionItems[i];

    await prisma.tenantModule.create({
      data: {
        tenantId: tenant.id,
        moduleId: module.id,
        price: module.basePrice,
        status: 'ACTIVE',
        stripeItemId: stripeItem.id,
      },
    });
  }

  // 6. Update tenant status
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      status: 'ACTIVE',
    },
  });

  // 7. Initialize module-specific resources
  for (const module of modules) {
    await initializeModule(tenant.id, module.slug);
  }

  return tenant;
}

async function initializeModule(tenantId: string, moduleSlug: string) {
  switch (moduleSlug) {
    case 'website':
      await initializeWebsiteModule(tenantId);
      break;
    case 'members':
      await initializeMembersModule(tenantId);
      break;
    case 'giving':
      await initializeGivingModule(tenantId);
      break;
    // ... other modules
  }
}
```

---

## Use Case Examples

### Example 1: Small Church (Website + Giving)

```typescript
const smallChurchConfig = {
  tenant: {
    name: 'Grace Church',
    slug: 'grace-church',
    email: 'admin@gracechurch.org',
  },
  selectedModules: ['website', 'giving'],
  billingCycle: 'monthly',
};

// Estimated cost: $29 (Website) + $39 (Giving) = $68/mo
```

### Example 2: Medium Church (Website + App + Members + Events)

```typescript
const mediumChurchConfig = {
  tenant: {
    name: 'Love Church',
    slug: 'love-church',
    email: 'admin@lovechurch.org',
  },
  selectedModules: ['website', 'mobile-app', 'members', 'events'],
  billingCycle: 'yearly',
};

// Estimated cost: $29 + $49 + $29 + $19 = $126/mo
// Bundle discount (4 modules, 10%): -$12.60
// Annual billing discount (20%): -$22.68
// Final: $90.72/mo ($1,088.64/year)
```

### Example 3: Large Church (All Modules)

```typescript
const largeChurchConfig = {
  tenant: {
    name: 'Great Light Church',
    slug: 'great-light-church',
    email: 'admin@greatlightchurch.org',
  },
  selectedModules: [
    'website',
    'mobile-app',
    'giving',
    'members',
    'events',
    'groups',
    'streaming',
    'check-in'
  ],
  billingCycle: 'yearly',
};

// Estimated cost: $29 + $49 + $39 + $29 + $19 + $19 + $59 + $29 = $272/mo
// Bundle discount (all modules, 25%): -$68
// Annual billing discount (20%): -$40.80
// Final: $163.20/mo ($1,958.40/year)
```

---

## Migration Strategy

### Legacy Plan to Modular Migration

```typescript
// scripts/migrate-to-modular.ts

import { prisma } from '@/lib/prisma';

const PLAN_TO_MODULES_MAP: Record<string, string[]> = {
  'starter': ['website'],
  'growth': ['website', 'members', 'giving', 'events'],
  'pro': ['website', 'members', 'giving', 'events', 'mobile-app', 'groups'],
  'enterprise': ['website', 'members', 'giving', 'events', 'mobile-app', 'groups', 'streaming', 'check-in'],
};

export async function migrateTenantToModular(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant?.plan) {
    throw new Error('Tenant has no plan to migrate');
  }

  const moduleSlugs = PLAN_TO_MODULES_MAP[tenant.plan.slug] || ['website'];
  const modules = await prisma.solutionModule.findMany({
    where: { slug: { in: moduleSlugs } },
  });

  // Create tenant modules
  await prisma.$transaction(async (tx) => {
    for (const module of modules) {
      await tx.tenantModule.create({
        data: {
          tenantId: tenant.id,
          moduleId: module.id,
          price: 0, // Grandfathered pricing
          status: 'ACTIVE',
        },
      });
    }

    // Update tenant subscription type
    await tx.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionType: 'HYBRID', // Keep plan for grandfathered features
      },
    });
  });

  return { migrated: true, modules: moduleSlugs };
}
```

---

## Summary

### Key Design Decisions

1. **Hybrid Approach**: Support both existing Plan system and new modular system
2. **Core Module**: Website is a required module, included by default for all churches
3. **Dependency Management**: Automatic validation of module dependencies
4. **Bundle Pricing**: Discounts applied for multiple module selections
5. **Stripe Integration**: Each module managed as a separate subscription item
6. **Feature Gates**: Access control per module

### Benefits

- **Flexibility**: Customized solutions based on church size and needs
- **Scalability**: Easy to add/remove modules as needed
- **Cost Efficiency**: Pay only for features you use
- **Growth Support**: Natural upgrade path as churches grow

---

## AI Creative Modules

### Overview

AI-powered creative tools that automate content creation for churches, enabling them to maximize their digital presence with minimal effort.

### Module: AI Shorts Creator (`ai-shorts`)

**Purpose**: Automatically transform sermon recordings into engaging short-form videos optimized for TikTok, YouTube Shorts, Instagram Reels, and Facebook Reels.

**Key Features**:

| Feature | Description |
|---------|-------------|
| **Smart Clip Detection** | AI analyzes sermons to identify impactful moments, key quotes, and emotional highlights |
| **Auto-Captioning** | Real-time transcription with stylized caption overlays |
| **Multi-Platform Export** | Optimized aspect ratios (9:16, 1:1, 16:9) for each platform |
| **Template Library** | Professional motion graphics templates with church branding |
| **Background Music** | Royalty-free music library with auto-sync |
| **Bulk Generation** | Generate multiple clips from a single sermon automatically |
| **Scheduling** | Auto-schedule posts across connected social accounts |
| **Analytics** | Track performance of clips across platforms |

**Processing Pipeline**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AI Shorts Creator Pipeline                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │    Sermon    │ →  │  AI Analysis │ →  │   Highlight  │              │
│  │    Input     │    │   & Scoring  │    │   Detection  │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│         │                   │                   │                       │
│         ▼                   ▼                   ▼                       │
│  • Video file        • Speech-to-text    • Key moments                 │
│  • Live stream       • Sentiment         • Quotable quotes             │
│  • YouTube URL       • Topic extraction  • Emotional peaks             │
│  • Mux playback      • Engagement score  • Story arcs                  │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │    Clip      │ →  │   Content    │ →  │   Platform   │              │
│  │  Generation  │    │  Enhancement │    │   Delivery   │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│         │                   │                   │                       │
│         ▼                   ▼                   ▼                       │
│  • Auto-trim         • Captions         • TikTok                       │
│  • Aspect ratio      • Motion graphics  • YouTube Shorts               │
│  • Transitions       • Music overlay    • Instagram Reels              │
│  • B-roll insert     • Branding         • Facebook Reels               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Module: AI Social Studio (`ai-social`)

**Purpose**: Create professional social media content (images, carousels, videos, stories) from church materials using AI-powered design automation.

**Key Features**:

| Feature | Description |
|---------|-------------|
| **Quote Graphics** | Generate shareable quote images from sermons and scripture |
| **Event Promotion** | Auto-create event announcements with details and branding |
| **Carousel Creator** | Multi-slide posts for teaching content and announcements |
| **Story Templates** | Animated story templates for Instagram/Facebook |
| **Announcement Videos** | Text-to-video announcements with voiceover |
| **Weekly Digest** | Auto-generated weekly church highlights |
| **Holiday Content** | Seasonal template library with AI customization |
| **Brand Consistency** | Maintain church branding across all generated content |

**Content Generation Types**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     AI Social Studio Content Types                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                        INPUT SOURCES                               │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │  • Sermon transcripts       • Event details                       │ │
│  │  • Scripture passages       • Announcement text                   │ │
│  │  • Ministry updates         • Member testimonials                 │ │
│  │  • Church photos            • Weekly schedules                    │ │
│  │  • Staff bios               • Prayer requests                     │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                │                                        │
│                                ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                      AI PROCESSING                                 │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │  • Content analysis         • Image generation (DALL-E/Midjourney)│ │
│  │  • Copy writing             • Video composition                   │ │
│  │  • Brand matching           • Format optimization                 │ │
│  │  • Hashtag generation       • Accessibility compliance            │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                │                                        │
│                                ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                       OUTPUT FORMATS                               │ │
│  ├───────────────────────────────────────────────────────────────────┤ │
│  │                                                                    │ │
│  │  IMAGES              VIDEOS              STORIES           DOCS   │ │
│  │  ├─ Quote cards      ├─ Announcements    ├─ Instagram     ├─ PDF │ │
│  │  ├─ Event flyers     ├─ Teasers          ├─ Facebook      ├─ PPT │ │
│  │  ├─ Carousels        ├─ Countdowns       └─ TikTok        └─ Web │ │
│  │  ├─ Thumbnails       └─ Highlights                                │ │
│  │  └─ Headers                                                        │ │
│  │                                                                    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## AI Creative Modules Database Schema

### AI Shorts Schema

```prisma
// AI Short-form Video Generation
model AIShortClip {
  id              String        @id @default(uuid())
  tenantId        String        @map("tenant_id")
  tenant          Tenant        @relation(fields: [tenantId], references: [id])

  // Source Content
  sermonId        String?       @map("sermon_id")
  sermon          Sermon?       @relation(fields: [sermonId], references: [id])
  sourceVideoUrl  String?       @map("source_video_url")
  sourceType      SourceType    @map("source_type")

  // Clip Details
  title           String
  description     String?       @db.Text
  startTime       Int           @map("start_time") // seconds
  endTime         Int           @map("end_time")   // seconds
  duration        Int           // seconds

  // AI Analysis
  aiScore         Float?        @map("ai_score") // 0-100 engagement prediction
  highlightType   HighlightType @map("highlight_type")
  detectedTopics  String[]      @map("detected_topics") @default([])
  keyQuote        String?       @map("key_quote") @db.Text
  sentiment       String?       // positive, inspiring, challenging, etc.

  // Generated Content
  transcript      String?       @db.Text
  captionStyle    CaptionStyle  @default(STANDARD) @map("caption_style")

  // Output Versions
  outputs         AIShortOutput[]

  // Template & Styling
  templateId      String?       @map("template_id")
  template        AIShortTemplate? @relation(fields: [templateId], references: [id])
  musicTrackId    String?       @map("music_track_id")
  brandingApplied Boolean       @default(true) @map("branding_applied")

  // Status
  status          ProcessingStatus @default(PENDING)
  processingError String?       @map("processing_error")

  // Publishing
  isApproved      Boolean       @default(false) @map("is_approved")
  approvedBy      String?       @map("approved_by")
  approvedAt      DateTime?     @map("approved_at")
  scheduledPosts  AIScheduledPost[]

  // Analytics
  totalViews      Int           @default(0) @map("total_views")
  totalShares     Int           @default(0) @map("total_shares")
  totalLikes      Int           @default(0) @map("total_likes")

  // Timestamps
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  @@map("ai_short_clips")
  @@index([tenantId])
  @@index([sermonId])
  @@index([status])
  @@index([createdAt])
}

enum SourceType {
  SERMON_VIDEO
  SERMON_AUDIO
  LIVE_STREAM
  UPLOADED_VIDEO
  YOUTUBE_URL
}

enum HighlightType {
  KEY_QUOTE
  EMOTIONAL_MOMENT
  TEACHING_POINT
  ILLUSTRATION
  CALL_TO_ACTION
  SCRIPTURE_READING
  TESTIMONY
  WORSHIP_MOMENT
}

enum CaptionStyle {
  STANDARD
  BOLD
  ANIMATED
  KARAOKE
  MINIMAL
}

enum ProcessingStatus {
  PENDING
  ANALYZING
  GENERATING
  RENDERING
  COMPLETED
  FAILED
}

// Output versions for different platforms
model AIShortOutput {
  id              String        @id @default(uuid())
  clipId          String        @map("clip_id")
  clip            AIShortClip   @relation(fields: [clipId], references: [id], onDelete: Cascade)

  // Platform Configuration
  platform        SocialPlatform
  aspectRatio     String        @map("aspect_ratio") // 9:16, 1:1, 16:9
  resolution      String        // 1080x1920, 1080x1080, etc.

  // Generated Files
  videoUrl        String?       @map("video_url")
  thumbnailUrl    String?       @map("thumbnail_url")
  fileSize        Int?          @map("file_size") // bytes

  // Status
  status          ProcessingStatus @default(PENDING)

  createdAt       DateTime      @default(now()) @map("created_at")

  @@map("ai_short_outputs")
  @@unique([clipId, platform])
  @@index([clipId])
}

enum SocialPlatform {
  TIKTOK
  YOUTUBE_SHORTS
  INSTAGRAM_REELS
  FACEBOOK_REELS
  TWITTER
  LINKEDIN
}

// Short-form video templates
model AIShortTemplate {
  id              String        @id @default(uuid())
  tenantId        String?       @map("tenant_id") // null = global template

  name            String
  description     String?
  category        String        // worship, teaching, testimony, etc.
  previewUrl      String?       @map("preview_url")

  // Template Configuration
  config          Json          // motion graphics, transitions, etc.
  captionStyle    CaptionStyle  @default(STANDARD) @map("caption_style")

  // Customization
  isCustomizable  Boolean       @default(true) @map("is_customizable")
  colorScheme     String[]      @map("color_scheme") @default([])

  isActive        Boolean       @default(true) @map("is_active")
  isPremium       Boolean       @default(false) @map("is_premium")
  sortOrder       Int           @default(0) @map("sort_order")

  // Relations
  clips           AIShortClip[]

  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  @@map("ai_short_templates")
  @@index([tenantId])
  @@index([category])
}
```

### AI Social Studio Schema

```prisma
// AI Social Media Content Generation
model AISocialContent {
  id              String        @id @default(uuid())
  tenantId        String        @map("tenant_id")
  tenant          Tenant        @relation(fields: [tenantId], references: [id])

  // Content Details
  title           String
  contentType     SocialContentType @map("content_type")
  category        String?       // sermon, event, announcement, etc.

  // Source Material
  sourceText      String?       @map("source_text") @db.Text
  sourceSermonId  String?       @map("source_sermon_id")
  sourceEventId   String?       @map("source_event_id")
  sourceImages    String[]      @map("source_images") @default([])

  // AI Generated Content
  generatedCopy   String?       @map("generated_copy") @db.Text
  generatedHashtags String[]    @map("generated_hashtags") @default([])
  generatedAltText String?      @map("generated_alt_text")

  // Generated Assets
  assets          AISocialAsset[]

  // Template & Branding
  templateId      String?       @map("template_id")
  template        AISocialTemplate? @relation(fields: [templateId], references: [id])
  brandPresetId   String?       @map("brand_preset_id")

  // Status
  status          ProcessingStatus @default(PENDING)
  processingError String?       @map("processing_error")

  // Approval
  isApproved      Boolean       @default(false) @map("is_approved")
  approvedBy      String?       @map("approved_by")
  approvedAt      DateTime?     @map("approved_at")
  scheduledPosts  AIScheduledPost[]

  // Analytics
  totalImpressions Int          @default(0) @map("total_impressions")
  totalEngagements Int          @default(0) @map("total_engagements")

  // Timestamps
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  @@map("ai_social_contents")
  @@index([tenantId])
  @@index([contentType])
  @@index([createdAt])
}

enum SocialContentType {
  QUOTE_GRAPHIC
  EVENT_FLYER
  CAROUSEL
  STORY
  VIDEO_ANNOUNCEMENT
  WEEKLY_DIGEST
  SCRIPTURE_GRAPHIC
  COUNTDOWN
  TESTIMONIAL
  HOLIDAY_SPECIAL
}

// Generated assets for social content
model AISocialAsset {
  id              String        @id @default(uuid())
  contentId       String        @map("content_id")
  content         AISocialContent @relation(fields: [contentId], references: [id], onDelete: Cascade)

  // Asset Details
  assetType       AssetType     @map("asset_type")
  format          String        // jpg, png, mp4, gif
  width           Int
  height          Int
  fileSize        Int?          @map("file_size")

  // URLs
  url             String
  thumbnailUrl    String?       @map("thumbnail_url")

  // Carousel/Sequence
  sequenceOrder   Int?          @map("sequence_order")

  // Metadata
  altText         String?       @map("alt_text")

  createdAt       DateTime      @default(now()) @map("created_at")

  @@map("ai_social_assets")
  @@index([contentId])
}

enum AssetType {
  IMAGE
  VIDEO
  ANIMATED_GIF
  CAROUSEL_SLIDE
}

// Social media templates
model AISocialTemplate {
  id              String        @id @default(uuid())
  tenantId        String?       @map("tenant_id") // null = global

  name            String
  description     String?
  contentType     SocialContentType @map("content_type")
  category        String?       // seasonal, minimal, bold, etc.
  previewUrl      String?       @map("preview_url")

  // Template Configuration
  config          Json          // layout, fonts, colors, animations
  dimensions      Json          // {width, height, aspectRatio}

  // Platform Optimization
  platforms       SocialPlatform[] @default([])

  isActive        Boolean       @default(true) @map("is_active")
  isPremium       Boolean       @default(false) @map("is_premium")
  sortOrder       Int           @default(0) @map("sort_order")

  // Relations
  contents        AISocialContent[]

  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  @@map("ai_social_templates")
  @@index([tenantId])
  @@index([contentType])
}

// Unified scheduling for all AI content
model AIScheduledPost {
  id              String        @id @default(uuid())
  tenantId        String        @map("tenant_id")

  // Content Reference (one of these)
  shortClipId     String?       @map("short_clip_id")
  shortClip       AIShortClip?  @relation(fields: [shortClipId], references: [id])
  socialContentId String?       @map("social_content_id")
  socialContent   AISocialContent? @relation(fields: [socialContentId], references: [id])

  // Publishing Details
  platform        SocialPlatform
  scheduledAt     DateTime      @map("scheduled_at")
  publishedAt     DateTime?     @map("published_at")

  // Platform-specific Config
  caption         String?       @db.Text
  hashtags        String[]      @default([])
  platformPostId  String?       @map("platform_post_id") // ID from platform after posting

  // Status
  status          PostStatus    @default(SCHEDULED)
  error           String?

  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  @@map("ai_scheduled_posts")
  @@index([tenantId])
  @@index([scheduledAt])
  @@index([status])
}

enum PostStatus {
  DRAFT
  SCHEDULED
  PUBLISHING
  PUBLISHED
  FAILED
  CANCELLED
}

// Church brand presets for AI generation
model ChurchBrandPreset {
  id              String        @id @default(uuid())
  tenantId        String        @unique @map("tenant_id")

  // Brand Colors
  primaryColor    String        @map("primary_color")
  secondaryColor  String        @map("secondary_color")
  accentColor     String?       @map("accent_color")
  backgroundColor String?       @map("background_color")

  // Typography
  headingFont     String?       @map("heading_font")
  bodyFont        String?       @map("body_font")

  // Logo & Assets
  logoUrl         String?       @map("logo_url")
  logoMarkUrl     String?       @map("logo_mark_url") // Icon only version
  watermarkUrl    String?       @map("watermark_url")

  // Style Preferences
  stylePreference String?       @map("style_preference") // modern, traditional, minimal, bold
  toneOfVoice     String?       @map("tone_of_voice") // friendly, formal, inspiring

  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  @@map("church_brand_presets")
}
```

---

## AI Creative Services

### AI Shorts Service

```typescript
// lib/services/ai-shorts-service.ts

import { prisma } from '@/lib/prisma';
import { OpenAI } from 'openai';
import { MuxService } from './mux-service';
import { TranscriptService } from './transcript-service';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ClipSuggestion {
  startTime: number;
  endTime: number;
  score: number;
  highlightType: string;
  keyQuote?: string;
  topic: string;
}

export class AIShortsService {
  constructor(private tenantId: string) {}

  private muxService = new MuxService();
  private transcriptService = new TranscriptService();

  /**
   * Analyze a sermon and detect highlight moments for short-form clips
   */
  async analyzeSermon(sermonId: string): Promise<ClipSuggestion[]> {
    const sermon = await prisma.sermon.findFirst({
      where: { id: sermonId, tenantId: this.tenantId },
    });

    if (!sermon) throw new Error('Sermon not found');

    // Get or generate transcript
    let transcript = sermon.transcript;
    if (!transcript) {
      const result = await this.transcriptService.transcribe(
        sermon.audioUrl || sermon.videoUrl!
      );
      transcript = result.text;
    }

    // Use AI to analyze transcript and identify highlights
    const analysis = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert at identifying engaging moments in sermons that would make great short-form video clips (30-90 seconds).
          Analyze the transcript and identify:
          1. KEY_QUOTE - Memorable, quotable statements
          2. EMOTIONAL_MOMENT - Moments of inspiration or conviction
          3. TEACHING_POINT - Clear, concise teaching explanations
          4. ILLUSTRATION - Stories or examples that illustrate a point
          5. CALL_TO_ACTION - Compelling calls to respond
          6. SCRIPTURE_READING - Powerful scripture presentations

          For each highlight, provide approximate timestamps (in seconds), a score (0-100) for viral potential, and the key quote if applicable.`,
        },
        {
          role: 'user',
          content: `Analyze this sermon transcript and identify the best moments for short-form clips:\n\n${transcript}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const highlights = JSON.parse(analysis.choices[0].message.content || '{}');
    return highlights.clips || [];
  }

  /**
   * Generate short-form clip from sermon segment
   */
  async generateClip(params: {
    sermonId: string;
    startTime: number;
    endTime: number;
    highlightType: string;
    templateId?: string;
    platforms: string[];
  }) {
    const sermon = await prisma.sermon.findFirst({
      where: { id: params.sermonId, tenantId: this.tenantId },
      include: { speaker: true },
    });

    if (!sermon?.videoPlaybackId) {
      throw new Error('Sermon must have video for clip generation');
    }

    // Create clip record
    const clip = await prisma.aIShortClip.create({
      data: {
        tenantId: this.tenantId,
        sermonId: params.sermonId,
        sourceType: 'SERMON_VIDEO',
        title: `${sermon.title} - Clip`,
        startTime: params.startTime,
        endTime: params.endTime,
        duration: params.endTime - params.startTime,
        highlightType: params.highlightType as any,
        templateId: params.templateId,
        status: 'ANALYZING',
      },
    });

    // Queue clip generation for each platform
    for (const platform of params.platforms) {
      await this.queueClipGeneration(clip.id, platform as any);
    }

    return clip;
  }

  /**
   * Queue clip rendering for a specific platform
   */
  private async queueClipGeneration(clipId: string, platform: string) {
    // Create output record
    await prisma.aIShortOutput.create({
      data: {
        clipId,
        platform: platform as any,
        aspectRatio: this.getAspectRatioForPlatform(platform),
        resolution: this.getResolutionForPlatform(platform),
        status: 'PENDING',
      },
    });

    // In production, this would queue to a background job processor
    // await clipRenderingQueue.add({ clipId, platform });
  }

  private getAspectRatioForPlatform(platform: string): string {
    switch (platform) {
      case 'TIKTOK':
      case 'YOUTUBE_SHORTS':
      case 'INSTAGRAM_REELS':
      case 'FACEBOOK_REELS':
        return '9:16';
      case 'TWITTER':
      case 'LINKEDIN':
        return '16:9';
      default:
        return '9:16';
    }
  }

  private getResolutionForPlatform(platform: string): string {
    switch (platform) {
      case 'TIKTOK':
      case 'YOUTUBE_SHORTS':
      case 'INSTAGRAM_REELS':
      case 'FACEBOOK_REELS':
        return '1080x1920';
      case 'TWITTER':
      case 'LINKEDIN':
        return '1920x1080';
      default:
        return '1080x1920';
    }
  }

  /**
   * Get all clips for a tenant
   */
  async getClips(filters: {
    sermonId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = filters;

    const where: any = { tenantId: this.tenantId };
    if (filters.sermonId) where.sermonId = filters.sermonId;
    if (filters.status) where.status = filters.status;

    const [clips, total] = await Promise.all([
      prisma.aIShortClip.findMany({
        where,
        include: {
          sermon: { select: { id: true, title: true, thumbnail: true } },
          outputs: true,
          template: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.aIShortClip.count({ where }),
    ]);

    return { data: clips, total, page, limit };
  }

  /**
   * Approve clip for publishing
   */
  async approveClip(clipId: string, userId: string) {
    return prisma.aIShortClip.update({
      where: { id: clipId },
      data: {
        isApproved: true,
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });
  }

  /**
   * Schedule clip for publishing
   */
  async schedulePost(params: {
    clipId: string;
    platform: string;
    scheduledAt: Date;
    caption?: string;
    hashtags?: string[];
  }) {
    return prisma.aIScheduledPost.create({
      data: {
        tenantId: this.tenantId,
        shortClipId: params.clipId,
        platform: params.platform as any,
        scheduledAt: params.scheduledAt,
        caption: params.caption,
        hashtags: params.hashtags || [],
        status: 'SCHEDULED',
      },
    });
  }
}
```

### AI Social Studio Service

```typescript
// lib/services/ai-social-service.ts

import { prisma } from '@/lib/prisma';
import { OpenAI } from 'openai';
import Replicate from 'replicate';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export interface ContentGenerationParams {
  contentType: string;
  sourceText?: string;
  sermonId?: string;
  eventId?: string;
  templateId?: string;
  platforms: string[];
}

export class AISocialService {
  constructor(private tenantId: string) {}

  /**
   * Generate social media content from source material
   */
  async generateContent(params: ContentGenerationParams) {
    // Get brand preset for styling
    const brandPreset = await prisma.churchBrandPreset.findUnique({
      where: { tenantId: this.tenantId },
    });

    // Create content record
    const content = await prisma.aISocialContent.create({
      data: {
        tenantId: this.tenantId,
        title: `Generated ${params.contentType}`,
        contentType: params.contentType as any,
        sourceText: params.sourceText,
        sourceSermonId: params.sermonId,
        sourceEventId: params.eventId,
        templateId: params.templateId,
        status: 'ANALYZING',
      },
    });

    try {
      // Generate copy based on content type
      const copy = await this.generateCopy(params, brandPreset);

      // Generate visual assets
      const assets = await this.generateAssets(params, brandPreset, copy);

      // Update content with generated material
      await prisma.aISocialContent.update({
        where: { id: content.id },
        data: {
          generatedCopy: copy.text,
          generatedHashtags: copy.hashtags,
          generatedAltText: copy.altText,
          status: 'COMPLETED',
        },
      });

      // Create asset records
      for (const asset of assets) {
        await prisma.aISocialAsset.create({
          data: {
            contentId: content.id,
            assetType: asset.type as any,
            format: asset.format,
            width: asset.width,
            height: asset.height,
            url: asset.url,
            thumbnailUrl: asset.thumbnailUrl,
            sequenceOrder: asset.sequenceOrder,
            altText: copy.altText,
          },
        });
      }

      return content;
    } catch (error) {
      await prisma.aISocialContent.update({
        where: { id: content.id },
        data: {
          status: 'FAILED',
          processingError: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  /**
   * Generate copy text using AI
   */
  private async generateCopy(
    params: ContentGenerationParams,
    brandPreset: any
  ) {
    const toneOfVoice = brandPreset?.toneOfVoice || 'friendly and inspiring';

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a social media expert for churches. Generate engaging copy that is ${toneOfVoice}.
          Create content that resonates with a faith community while being accessible to newcomers.
          Include relevant hashtags and alt text for accessibility.`,
        },
        {
          role: 'user',
          content: `Generate ${params.contentType} content from this material:\n\n${params.sourceText}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  /**
   * Generate visual assets using AI
   */
  private async generateAssets(
    params: ContentGenerationParams,
    brandPreset: any,
    copy: any
  ) {
    const assets: any[] = [];

    // Determine dimensions based on content type
    const dimensions = this.getDimensionsForContentType(params.contentType);

    // Generate image using DALL-E or Stable Diffusion
    const imagePrompt = this.buildImagePrompt(params.contentType, copy.text, brandPreset);

    // Using Replicate (Stable Diffusion) for image generation
    const output = await replicate.run(
      'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      {
        input: {
          prompt: imagePrompt,
          width: dimensions.width,
          height: dimensions.height,
          num_outputs: params.contentType === 'CAROUSEL' ? 5 : 1,
        },
      }
    );

    // Process outputs
    if (Array.isArray(output)) {
      output.forEach((url, index) => {
        assets.push({
          type: params.contentType === 'CAROUSEL' ? 'CAROUSEL_SLIDE' : 'IMAGE',
          format: 'png',
          width: dimensions.width,
          height: dimensions.height,
          url,
          sequenceOrder: index,
        });
      });
    }

    return assets;
  }

  private getDimensionsForContentType(contentType: string) {
    switch (contentType) {
      case 'QUOTE_GRAPHIC':
      case 'SCRIPTURE_GRAPHIC':
        return { width: 1080, height: 1080 }; // Square for Instagram
      case 'EVENT_FLYER':
        return { width: 1080, height: 1350 }; // 4:5 for Instagram
      case 'STORY':
        return { width: 1080, height: 1920 }; // 9:16 for Stories
      case 'CAROUSEL':
        return { width: 1080, height: 1080 };
      default:
        return { width: 1200, height: 630 }; // Open Graph standard
    }
  }

  private buildImagePrompt(
    contentType: string,
    text: string,
    brandPreset: any
  ): string {
    const style = brandPreset?.stylePreference || 'modern and clean';
    const colors = brandPreset?.primaryColor
      ? `using ${brandPreset.primaryColor} as the primary color`
      : 'with warm, inviting colors';

    return `Create a ${style} ${contentType.toLowerCase()} graphic for a church.
    The design should be ${colors}.
    Theme: ${text.substring(0, 100)}.
    Professional, high-quality, suitable for social media.
    No text in the image (text will be overlaid separately).`;
  }

  /**
   * Create quote graphic from sermon
   */
  async createQuoteGraphic(sermonId: string, quote?: string) {
    const sermon = await prisma.sermon.findFirst({
      where: { id: sermonId, tenantId: this.tenantId },
    });

    if (!sermon) throw new Error('Sermon not found');

    // If no quote provided, extract one using AI
    const quoteToUse = quote || await this.extractBestQuote(sermon.transcript || sermon.description || '');

    return this.generateContent({
      contentType: 'QUOTE_GRAPHIC',
      sourceText: quoteToUse,
      sermonId,
      platforms: ['INSTAGRAM', 'FACEBOOK'],
    });
  }

  /**
   * Create event announcement
   */
  async createEventAnnouncement(eventId: string) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId: this.tenantId },
    });

    if (!event) throw new Error('Event not found');

    const eventText = `
      Event: ${event.title}
      Date: ${event.startDate}
      Location: ${event.location || 'TBD'}
      Description: ${event.description || ''}
    `;

    return this.generateContent({
      contentType: 'EVENT_FLYER',
      sourceText: eventText,
      eventId,
      platforms: ['INSTAGRAM', 'FACEBOOK'],
    });
  }

  private async extractBestQuote(text: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Extract the most impactful, shareable quote from this text. Return only the quote.',
        },
        { role: 'user', content: text },
      ],
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Get all social content for a tenant
   */
  async getContent(filters: {
    contentType?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = filters;

    const where: any = { tenantId: this.tenantId };
    if (filters.contentType) where.contentType = filters.contentType;
    if (filters.status) where.status = filters.status;

    const [contents, total] = await Promise.all([
      prisma.aISocialContent.findMany({
        where,
        include: {
          assets: true,
          template: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.aISocialContent.count({ where }),
    ]);

    return { data: contents, total, page, limit };
  }
}
```

---

## AI Creative API Endpoints

### AI Shorts API

```typescript
// app/api/admin/ai/shorts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AIShortsService } from '@/lib/services/ai-shorts-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      sermonId: searchParams.get('sermonId') || undefined,
      status: searchParams.get('status') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const service = new AIShortsService(session.user.tenantId);
    const result = await service.getClips(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching clips:', error);
    return NextResponse.json({ error: 'Failed to fetch clips' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const service = new AIShortsService(session.user.tenantId);

    // Check if this is an analysis request or clip generation
    if (body.action === 'analyze') {
      const suggestions = await service.analyzeSermon(body.sermonId);
      return NextResponse.json({ suggestions });
    }

    // Generate clip
    const clip = await service.generateClip({
      sermonId: body.sermonId,
      startTime: body.startTime,
      endTime: body.endTime,
      highlightType: body.highlightType,
      templateId: body.templateId,
      platforms: body.platforms || ['YOUTUBE_SHORTS', 'INSTAGRAM_REELS'],
    });

    return NextResponse.json(clip, { status: 201 });
  } catch (error) {
    console.error('Error generating clip:', error);
    return NextResponse.json({ error: 'Failed to generate clip' }, { status: 500 });
  }
}
```

### AI Social API

```typescript
// app/api/admin/ai/social/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AISocialService } from '@/lib/services/ai-social-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      contentType: searchParams.get('contentType') || undefined,
      status: searchParams.get('status') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const service = new AISocialService(session.user.tenantId);
    const result = await service.getContent(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const service = new AISocialService(session.user.tenantId);

    // Route to appropriate generator
    let content;
    switch (body.contentType) {
      case 'QUOTE_GRAPHIC':
        content = await service.createQuoteGraphic(body.sermonId, body.quote);
        break;
      case 'EVENT_FLYER':
        content = await service.createEventAnnouncement(body.eventId);
        break;
      default:
        content = await service.generateContent({
          contentType: body.contentType,
          sourceText: body.sourceText,
          sermonId: body.sermonId,
          eventId: body.eventId,
          templateId: body.templateId,
          platforms: body.platforms || ['INSTAGRAM', 'FACEBOOK'],
        });
    }

    return NextResponse.json(content, { status: 201 });
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
```

---

## Updated Use Case Examples

### Example 4: Media-Focused Church (Website + Streaming + AI Shorts)

```typescript
const mediaChurchConfig = {
  tenant: {
    name: 'New Life Media Church',
    slug: 'new-life-media',
    email: 'admin@newlifemedia.org',
  },
  selectedModules: ['website', 'streaming', 'ai-shorts'],
  billingCycle: 'yearly',
};

// Estimated cost: $29 + $59 + $49 = $137/mo
// Bundle discount (3 modules, 10%): -$13.70
// Annual billing discount (20%): -$24.66
// Final: $98.64/mo ($1,183.68/year)
```

### Example 5: Social Media Active Church (Website + Events + Groups + AI Social)

```typescript
const socialChurchConfig = {
  tenant: {
    name: 'Connect Church',
    slug: 'connect-church',
    email: 'admin@connectchurch.org',
  },
  selectedModules: ['website', 'events', 'groups', 'ai-social'],
  billingCycle: 'monthly',
};

// Estimated cost: $29 + $19 + $19 + $39 = $106/mo
// Bundle discount (4 modules, 10%): -$10.60
// Final: $95.40/mo
```

### Example 6: Full AI-Powered Church (All Modules Including AI)

```typescript
const aiPoweredChurchConfig = {
  tenant: {
    name: 'Future Church',
    slug: 'future-church',
    email: 'admin@futurechurch.org',
  },
  selectedModules: [
    'website',
    'mobile-app',
    'giving',
    'members',
    'events',
    'groups',
    'streaming',
    'check-in',
    'ai-shorts',
    'ai-social'
  ],
  billingCycle: 'yearly',
};

// Estimated cost: $29 + $49 + $39 + $29 + $19 + $19 + $59 + $29 + $49 + $39 = $360/mo
// Bundle discount (all 10 modules, 25%): -$90
// Annual billing discount (20%): -$54
// Final: $216/mo ($2,592/year)
```
