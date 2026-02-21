# Billing & Subscriptions

## Overview

The billing and subscriptions system powers the SaaS revenue model for the Digital Church Platform. Built on Stripe's infrastructure, it provides comprehensive subscription management, payment processing, invoicing, and revenue analytics. This document covers the complete billing architecture from plan configuration to payment webhooks.

**Document Version**: 3.1 Enterprise Edition
**Last Updated**: December 2024

---

## Table of Contents

1. [Subscription Plans](#subscription-plans)
2. [Modular Subscription Model](#modular-subscription-model)
3. [Pricing Strategy](#pricing-strategy)
4. [Stripe Integration](#stripe-integration)
5. [Subscription Lifecycle](#subscription-lifecycle)
6. [Payment Processing](#payment-processing)
7. [Invoicing System](#invoicing-system)
8. [Usage-Based Billing](#usage-based-billing)
9. [Revenue Analytics](#revenue-analytics)
10. [Billing Portal](#billing-portal)
11. [Webhooks & Events](#webhooks--events)
12. [Dunning & Recovery](#dunning--recovery)
    - [Grace Period Policy](#grace-period-policy)
    - [Grace Period Service](#grace-period-service)
    - [Grace Period Middleware](#grace-period-middleware)
    - [Pro-ration Tracking](#pro-ration-tracking)
    - [Dunning Service](#dunning-service)
13. [Implementation](#implementation)

---

## Subscription Plans

### Plan Tiers

```typescript
// types/billing.ts
export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  tier: 'starter' | 'growth' | 'pro' | 'enterprise';
  priceMonthly: number;
  priceYearly: number;
  features: PlanFeatures;
  limits: PlanLimits;
  availableTemplates: string[];
  stripePriceIdMonthly: string;
  stripePriceIdYearly: string;
  isActive: boolean;
  displayOrder: number;
  metadata: Record<string, any>;
}

export interface PlanFeatures {
  customDomain: boolean;
  sslCertificate: boolean;
  removeWatermark: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
  advancedAnalytics: boolean;
  customBranding: boolean;
  multipleAdmins: boolean;
  mobileApp: boolean;
  liveStreaming: boolean;
  textToGive: boolean;
  kioskMode: boolean;
  recurringGiving: boolean;
  pledgeManagement: boolean;
  bulkImport: boolean;
  customReports: boolean;
  ssoIntegration: boolean;
  dedicatedSupport: boolean;
}

export interface PlanLimits {
  members: number;           // -1 for unlimited
  admins: number;
  storage: number;           // in GB
  monthlyPageViews: number;  // -1 for unlimited
  sermons: number;
  events: number;
  emailsPerMonth: number;
  smsCredits: number;
  mediaLibrarySize: number;  // in GB
  apiRequestsPerDay: number;
  customPages: number;
  ministryGroups: number;
}
```

### Plan Configuration

```typescript
// config/plans.ts
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    slug: 'starter',
    description: 'Perfect for small churches getting started online',
    tier: 'starter',
    priceMonthly: 29,
    priceYearly: 290, // ~17% discount
    features: {
      customDomain: false,
      sslCertificate: true,
      removeWatermark: false,
      prioritySupport: false,
      apiAccess: false,
      advancedAnalytics: false,
      customBranding: false,
      multipleAdmins: false,
      mobileApp: false,
      liveStreaming: false,
      textToGive: false,
      kioskMode: false,
      recurringGiving: true,
      pledgeManagement: false,
      bulkImport: false,
      customReports: false,
      ssoIntegration: false,
      dedicatedSupport: false,
    },
    limits: {
      members: 200,
      admins: 2,
      storage: 5,
      monthlyPageViews: 10000,
      sermons: 50,
      events: 20,
      emailsPerMonth: 1000,
      smsCredits: 100,
      mediaLibrarySize: 5,
      apiRequestsPerDay: 0,
      customPages: 5,
      ministryGroups: 5,
    },
    availableTemplates: ['chicago-ubf', 'modern-church'],
    stripePriceIdMonthly: 'price_starter_monthly',
    stripePriceIdYearly: 'price_starter_yearly',
    isActive: true,
    displayOrder: 1,
    metadata: {
      popular: false,
      recommended: false,
    },
  },
  {
    id: 'growth',
    name: 'Growth',
    slug: 'growth',
    description: 'For growing churches with expanding digital needs',
    tier: 'growth',
    priceMonthly: 79,
    priceYearly: 790,
    features: {
      customDomain: true,
      sslCertificate: true,
      removeWatermark: true,
      prioritySupport: false,
      apiAccess: true,
      advancedAnalytics: true,
      customBranding: true,
      multipleAdmins: true,
      mobileApp: true,
      liveStreaming: false,
      textToGive: true,
      kioskMode: false,
      recurringGiving: true,
      pledgeManagement: true,
      bulkImport: true,
      customReports: false,
      ssoIntegration: false,
      dedicatedSupport: false,
    },
    limits: {
      members: 1000,
      admins: 5,
      storage: 25,
      monthlyPageViews: 50000,
      sermons: -1,
      events: -1,
      emailsPerMonth: 5000,
      smsCredits: 500,
      mediaLibrarySize: 25,
      apiRequestsPerDay: 10000,
      customPages: 20,
      ministryGroups: 20,
    },
    availableTemplates: ['chicago-ubf', 'modern-church', 'grace-community', 'hillsong-style'],
    stripePriceIdMonthly: 'price_growth_monthly',
    stripePriceIdYearly: 'price_growth_yearly',
    isActive: true,
    displayOrder: 2,
    metadata: {
      popular: true,
      recommended: true,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    slug: 'pro',
    description: 'Full-featured solution for established churches',
    tier: 'pro',
    priceMonthly: 149,
    priceYearly: 1490,
    features: {
      customDomain: true,
      sslCertificate: true,
      removeWatermark: true,
      prioritySupport: true,
      apiAccess: true,
      advancedAnalytics: true,
      customBranding: true,
      multipleAdmins: true,
      mobileApp: true,
      liveStreaming: true,
      textToGive: true,
      kioskMode: true,
      recurringGiving: true,
      pledgeManagement: true,
      bulkImport: true,
      customReports: true,
      ssoIntegration: false,
      dedicatedSupport: false,
    },
    limits: {
      members: 5000,
      admins: 15,
      storage: 100,
      monthlyPageViews: 200000,
      sermons: -1,
      events: -1,
      emailsPerMonth: 25000,
      smsCredits: 2500,
      mediaLibrarySize: 100,
      apiRequestsPerDay: 50000,
      customPages: -1,
      ministryGroups: -1,
    },
    availableTemplates: ['*'], // All templates
    stripePriceIdMonthly: 'price_pro_monthly',
    stripePriceIdYearly: 'price_pro_yearly',
    isActive: true,
    displayOrder: 3,
    metadata: {
      popular: false,
      recommended: false,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Custom solutions for large multi-site churches',
    tier: 'enterprise',
    priceMonthly: 0, // Custom pricing
    priceYearly: 0,
    features: {
      customDomain: true,
      sslCertificate: true,
      removeWatermark: true,
      prioritySupport: true,
      apiAccess: true,
      advancedAnalytics: true,
      customBranding: true,
      multipleAdmins: true,
      mobileApp: true,
      liveStreaming: true,
      textToGive: true,
      kioskMode: true,
      recurringGiving: true,
      pledgeManagement: true,
      bulkImport: true,
      customReports: true,
      ssoIntegration: true,
      dedicatedSupport: true,
    },
    limits: {
      members: -1,
      admins: -1,
      storage: -1,
      monthlyPageViews: -1,
      sermons: -1,
      events: -1,
      emailsPerMonth: -1,
      smsCredits: -1,
      mediaLibrarySize: -1,
      apiRequestsPerDay: -1,
      customPages: -1,
      ministryGroups: -1,
    },
    availableTemplates: ['*'],
    stripePriceIdMonthly: '',
    stripePriceIdYearly: '',
    isActive: true,
    displayOrder: 4,
    metadata: {
      popular: false,
      recommended: false,
      contactSales: true,
    },
  },
];
```

---

## Modular Subscription Model

In addition to plan-based subscriptions, churches can choose an à la carte approach where they select individual modules. This provides maximum flexibility for churches with specific needs.

### Available Modules

| Module | Monthly Price | Stripe Price ID | Description |
|--------|---------------|-----------------|-------------|
| Website | $19 | `price_module_website` | Custom subdomain, pages, SEO |
| Mobile App | $29 | `price_module_mobile` | PWA + branded native app |
| Giving | $39 | `price_module_giving` | Online donations, recurring, campaigns |
| Members | $29 | `price_module_members` | Member database, directory, profiles |
| Events | $19 | `price_module_events` | Calendar, registration, ticketing |
| Groups | $19 | `price_module_groups` | Small groups, ministries, communication |
| Streaming | $49 | `price_module_streaming` | Live streaming, on-demand video |
| Check-in | $24 | `price_module_checkin` | Child check-in, volunteer scheduling |

### Bundle Discounts

```typescript
// config/module-pricing.ts
export const BUNDLE_DISCOUNTS = {
  3: 0.10,  // 10% off for 3+ modules
  5: 0.15,  // 15% off for 5+ modules
  8: 0.25,  // 25% off for all modules
};

export function calculateModularPrice(
  selectedModules: Array<{ basePrice: number }>
): { baseTotal: number; discount: number; finalTotal: number } {
  const baseTotal = selectedModules.reduce(
    (sum, module) => sum + module.basePrice,
    0
  );

  let discountPercent = 0;
  const moduleCount = selectedModules.length;

  if (moduleCount >= 8) discountPercent = BUNDLE_DISCOUNTS[8];
  else if (moduleCount >= 5) discountPercent = BUNDLE_DISCOUNTS[5];
  else if (moduleCount >= 3) discountPercent = BUNDLE_DISCOUNTS[3];

  const discount = baseTotal * discountPercent;
  const finalTotal = baseTotal - discount;

  return { baseTotal, discount, finalTotal };
}
```

### Module Dependencies

```typescript
// config/module-dependencies.ts
export const MODULE_DEPENDENCIES: Record<string, string[]> = {
  'mobile-app': ['website'],     // Mobile App requires Website
  'checkin': ['members'],        // Check-in requires Members
  'streaming': ['website'],      // Streaming requires Website
};

export function validateModuleSelection(selectedSlugs: string[]): {
  valid: boolean;
  missingDependencies: Array<{ module: string; requires: string }>;
} {
  const missing: Array<{ module: string; requires: string }> = [];

  for (const slug of selectedSlugs) {
    const dependencies = MODULE_DEPENDENCIES[slug] || [];
    for (const dep of dependencies) {
      if (!selectedSlugs.includes(dep)) {
        missing.push({ module: slug, requires: dep });
      }
    }
  }

  return {
    valid: missing.length === 0,
    missingDependencies: missing,
  };
}
```

### Modular Stripe Subscription

For modular subscriptions, we create a Stripe subscription with multiple line items (one per module):

```typescript
// services/modular-subscription.service.ts
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { calculateModularPrice } from '@/config/module-pricing';

export class ModularSubscriptionService {
  /**
   * Create modular subscription with multiple items
   */
  async createModularSubscription(
    tenantId: string,
    moduleIds: string[],
    paymentMethodId?: string
  ): Promise<{ subscription: any; clientSecret?: string }> {
    // Get modules
    const modules = await prisma.solutionModule.findMany({
      where: { id: { in: moduleIds } },
    });

    // Validate dependencies
    const slugs = modules.map(m => m.slug);
    const validation = validateModuleSelection(slugs);
    if (!validation.valid) {
      throw new Error(
        `Missing dependencies: ${validation.missingDependencies
          .map(d => `${d.module} requires ${d.requires}`)
          .join(', ')}`
      );
    }

    // Calculate pricing
    const pricing = calculateModularPrice(modules.map(m => ({ basePrice: Number(m.basePrice) })));

    // Get or create customer
    const customer = await this.getOrCreateCustomer(tenantId);

    // Attach payment method
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });
      await stripe.customers.update(customer.id, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    // Create subscription items (one per module)
    const items = modules.map(module => ({
      price: module.stripePriceId!,
      metadata: {
        moduleId: module.id,
        moduleSlug: module.slug,
      },
    }));

    // Apply bundle discount as a coupon
    let couponId: string | undefined;
    if (pricing.discount > 0) {
      const discountPercent = Math.round((pricing.discount / pricing.baseTotal) * 100);
      const coupon = await stripe.coupons.create({
        percent_off: discountPercent,
        duration: 'forever',
        name: `Bundle Discount (${modules.length} modules)`,
      });
      couponId = coupon.id;
    }

    // Create Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customer.id,
      items,
      coupon: couponId,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        tenantId,
        subscriptionType: 'MODULAR',
      },
    });

    // Update tenant
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionType: 'MODULAR',
        stripeSubscriptionId: stripeSubscription.id,
      },
    });

    // Create TenantModule records
    for (const module of modules) {
      const item = stripeSubscription.items.data.find(
        i => i.price.id === module.stripePriceId
      );

      await prisma.tenantModule.create({
        data: {
          tenantId,
          moduleId: module.id,
          price: module.basePrice,
          discountPercent: pricing.discount > 0
            ? new Prisma.Decimal((pricing.discount / pricing.baseTotal) * 100)
            : null,
          stripeItemId: item?.id,
          status: 'ACTIVE',
        },
      });
    }

    // Get client secret for payment
    const invoice = stripeSubscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;

    return {
      subscription: stripeSubscription,
      clientSecret: paymentIntent?.client_secret || undefined,
    };
  }

  /**
   * Add module to existing subscription
   */
  async addModule(
    tenantId: string,
    moduleId: string
  ): Promise<any> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    if (!tenant.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    const module = await prisma.solutionModule.findUniqueOrThrow({
      where: { id: moduleId },
    });

    // Add to Stripe subscription
    const item = await stripe.subscriptionItems.create({
      subscription: tenant.stripeSubscriptionId,
      price: module.stripePriceId!,
      metadata: {
        moduleId: module.id,
        moduleSlug: module.slug,
      },
    });

    // Create TenantModule record
    await prisma.tenantModule.create({
      data: {
        tenantId,
        moduleId,
        price: module.basePrice,
        stripeItemId: item.id,
        status: 'ACTIVE',
      },
    });

    // Recalculate bundle discount
    await this.recalculateBundleDiscount(tenantId);

    return item;
  }

  /**
   * Remove module from subscription
   */
  async removeModule(
    tenantId: string,
    moduleId: string
  ): Promise<void> {
    const tenantModule = await prisma.tenantModule.findFirst({
      where: { tenantId, moduleId, status: 'ACTIVE' },
      include: { module: true },
    });

    if (!tenantModule) {
      throw new Error('Module not found on subscription');
    }

    // Check if other modules depend on this
    const dependentModules = await prisma.tenantModule.findMany({
      where: { tenantId, status: 'ACTIVE' },
      include: {
        module: {
          include: { dependencies: true },
        },
      },
    });

    for (const tm of dependentModules) {
      const hasDependency = tm.module.dependencies.some(
        d => d.requiresModuleId === moduleId
      );
      if (hasDependency) {
        throw new Error(
          `Cannot remove ${tenantModule.module.name}: ${tm.module.name} depends on it`
        );
      }
    }

    // Remove from Stripe
    if (tenantModule.stripeItemId) {
      await stripe.subscriptionItems.del(tenantModule.stripeItemId);
    }

    // Update local record
    await prisma.tenantModule.update({
      where: { id: tenantModule.id },
      data: {
        status: 'CANCELLED',
        deactivatedAt: new Date(),
      },
    });

    // Recalculate bundle discount
    await this.recalculateBundleDiscount(tenantId);
  }

  /**
   * Recalculate bundle discount after module changes
   */
  private async recalculateBundleDiscount(tenantId: string): Promise<void> {
    const activeModules = await prisma.tenantModule.findMany({
      where: { tenantId, status: 'ACTIVE' },
      include: { module: true },
    });

    const pricing = calculateModularPrice(
      activeModules.map(tm => ({ basePrice: Number(tm.module.basePrice) }))
    );

    // Update or create coupon on subscription
    // Implementation depends on Stripe coupon strategy
  }

  private async getOrCreateCustomer(tenantId: string): Promise<Stripe.Customer> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    if (tenant.stripeCustomerId) {
      return stripe.customers.retrieve(tenant.stripeCustomerId) as Promise<Stripe.Customer>;
    }

    const customer = await stripe.customers.create({
      email: tenant.contactEmail,
      name: tenant.name,
      metadata: { tenantId },
    });

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { stripeCustomerId: customer.id },
    });

    return customer;
  }
}
```

### Hybrid Model Support

Churches can also use a hybrid model: start with a plan and add extra modules on top.

```typescript
// Hybrid subscription: Plan + Additional Modules
export async function createHybridSubscription(
  tenantId: string,
  planId: string,
  additionalModuleIds: string[]
): Promise<any> {
  // Create plan subscription first
  const planSubscription = await subscriptionService.createSubscription({
    tenantId,
    planId,
    billingPeriod: 'MONTHLY',
  });

  // Add additional modules as subscription items
  for (const moduleId of additionalModuleIds) {
    await modularService.addModule(tenantId, moduleId);
  }

  // Update tenant subscription type
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { subscriptionType: 'HYBRID' },
  });

  return planSubscription;
}
```

> 📘 See [21-modular-solutions.md](./21-modular-solutions.md) for complete modular architecture, UI components, and feature gates.

---

## Pricing Strategy

### Competitive Analysis

| Feature | Tithely | Pushpay | Subsplash | **Digital Church** |
|---------|---------|---------|-----------|-------------------|
| Starting Price | Free (3.5% + $0.30) | $149/mo | $99/mo | **$29/mo** |
| Processing Fee | 3.5% + $0.30 | 2.9% + $0.30 | 2.3% + $0.30 | **2.0% + $0.25** |
| Custom Domain | Extra | Included | Included | **Growth+** |
| Mobile App | AI Builder | Premium | Included | **Growth+** |
| Live Streaming | Basic | None | Advanced | **Pro+** |
| Member Limit | Varies | 5000 | Varies | **Tiered** |

### Processing Fees by Plan

```typescript
// config/processing-fees.ts
export const PROCESSING_FEES = {
  starter: {
    percentage: 2.9,
    fixed: 0.30,
    achPercentage: 0.8,
    achFixed: 0.25,
  },
  growth: {
    percentage: 2.5,
    fixed: 0.30,
    achPercentage: 0.8,
    achFixed: 0.25,
  },
  pro: {
    percentage: 2.2,
    fixed: 0.25,
    achPercentage: 0.8,
    achFixed: 0.25,
  },
  enterprise: {
    percentage: 2.0,
    fixed: 0.25,
    achPercentage: 0.5,
    achFixed: 0.20,
  },
};

export function calculateProcessingFee(
  amount: number,
  plan: string,
  paymentMethod: 'card' | 'ach'
): number {
  const fees = PROCESSING_FEES[plan] || PROCESSING_FEES.starter;

  if (paymentMethod === 'ach') {
    return (amount * fees.achPercentage / 100) + fees.achFixed;
  }

  return (amount * fees.percentage / 100) + fees.fixed;
}
```

---

## Stripe Integration

### Stripe Configuration

```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
  appInfo: {
    name: 'Digital Church Platform',
    version: '3.0.0',
    url: 'https://digitalchurch.com',
  },
});

// Helper to get connected account for tenant donations
export function getStripeForTenant(stripeAccountId?: string) {
  if (stripeAccountId) {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
      stripeAccount: stripeAccountId,
    });
  }
  return stripe;
}
```

### Product & Price Sync

```typescript
// services/stripe-sync.service.ts
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export class StripeSyncService {
  /**
   * Sync all plans to Stripe
   */
  async syncPlansToStripe(): Promise<void> {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
    });

    for (const plan of plans) {
      // Create or update product
      const product = await this.upsertProduct(plan);

      // Create or update prices
      const monthlyPrice = await this.upsertPrice(
        product.id,
        plan.priceMonthly,
        'month',
        `${plan.slug}-monthly`
      );

      const yearlyPrice = await this.upsertPrice(
        product.id,
        plan.priceYearly,
        'year',
        `${plan.slug}-yearly`
      );

      // Update plan with Stripe IDs
      await prisma.subscriptionPlan.update({
        where: { id: plan.id },
        data: {
          stripeProductId: product.id,
          stripePriceIdMonthly: monthlyPrice.id,
          stripePriceIdYearly: yearlyPrice.id,
        },
      });
    }
  }

  private async upsertProduct(plan: any): Promise<Stripe.Product> {
    const productData = {
      name: `Digital Church - ${plan.name}`,
      description: plan.description,
      metadata: {
        planId: plan.id,
        tier: plan.tier,
      },
    };

    if (plan.stripeProductId) {
      return stripe.products.update(plan.stripeProductId, productData);
    }

    return stripe.products.create({
      ...productData,
      id: `prod_${plan.slug}`,
    });
  }

  private async upsertPrice(
    productId: string,
    amount: number,
    interval: 'month' | 'year',
    lookupKey: string
  ): Promise<Stripe.Price> {
    // Check for existing active price
    const existingPrices = await stripe.prices.list({
      product: productId,
      active: true,
      lookup_keys: [lookupKey],
    });

    if (existingPrices.data.length > 0) {
      const existing = existingPrices.data[0];

      // If price changed, archive old and create new
      if (existing.unit_amount !== amount * 100) {
        await stripe.prices.update(existing.id, { active: false });
      } else {
        return existing;
      }
    }

    return stripe.prices.create({
      product: productId,
      unit_amount: amount * 100,
      currency: 'usd',
      recurring: { interval },
      lookup_key: lookupKey,
      transfer_lookup_key: true,
    });
  }
}
```

### Customer Management

```typescript
// services/stripe-customer.service.ts
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export class StripeCustomerService {
  /**
   * Create or retrieve Stripe customer for tenant
   */
  async getOrCreateCustomer(tenantId: string): Promise<Stripe.Customer> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      include: {
        billingContact: true,
      },
    });

    if (tenant.stripeCustomerId) {
      return stripe.customers.retrieve(tenant.stripeCustomerId) as Promise<Stripe.Customer>;
    }

    const customer = await stripe.customers.create({
      email: tenant.billingContact?.email || tenant.contactEmail,
      name: tenant.name,
      metadata: {
        tenantId: tenant.id,
        subdomain: tenant.subdomain,
      },
      address: tenant.billingContact ? {
        line1: tenant.billingContact.address,
        city: tenant.billingContact.city,
        state: tenant.billingContact.state,
        postal_code: tenant.billingContact.postalCode,
        country: tenant.billingContact.country,
      } : undefined,
    });

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { stripeCustomerId: customer.id },
    });

    return customer;
  }

  /**
   * Update customer billing information
   */
  async updateCustomer(
    tenantId: string,
    data: {
      email?: string;
      name?: string;
      address?: Stripe.AddressParam;
      paymentMethod?: string;
    }
  ): Promise<Stripe.Customer> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    if (!tenant.stripeCustomerId) {
      return this.getOrCreateCustomer(tenantId);
    }

    const updateData: Stripe.CustomerUpdateParams = {};

    if (data.email) updateData.email = data.email;
    if (data.name) updateData.name = data.name;
    if (data.address) updateData.address = data.address;
    if (data.paymentMethod) {
      updateData.invoice_settings = {
        default_payment_method: data.paymentMethod,
      };
    }

    return stripe.customers.update(tenant.stripeCustomerId, updateData);
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethod(
    tenantId: string,
    paymentMethodId: string,
    setDefault: boolean = true
  ): Promise<Stripe.PaymentMethod> {
    const customer = await this.getOrCreateCustomer(tenantId);

    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    if (setDefault) {
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    return paymentMethod;
  }

  /**
   * List customer payment methods
   */
  async listPaymentMethods(tenantId: string): Promise<Stripe.PaymentMethod[]> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    if (!tenant.stripeCustomerId) {
      return [];
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: tenant.stripeCustomerId,
      type: 'card',
    });

    return paymentMethods.data;
  }
}
```

---

## Subscription Lifecycle

### Subscription States

```
                    ┌──────────────┐
                    │   Created    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
        ┌──────────►│   Trialing   │◄──────────┐
        │           └──────┬───────┘           │
        │                  │                   │
        │           ┌──────▼───────┐           │
        │           │    Active    │───────────┤
        │           └──────┬───────┘           │
        │                  │                   │
        │    ┌─────────────┼─────────────┐     │
        │    │             │             │     │
        │  ┌─▼──┐    ┌─────▼─────┐   ┌───▼──┐  │
        │  │Past│    │  Paused   │   │Cancel│  │
        │  │Due │    │           │   │ling  │  │
        │  └─┬──┘    └─────┬─────┘   └───┬──┘  │
        │    │             │             │     │
        │    │       ┌─────▼─────┐       │     │
        │    └──────►│ Cancelled │◄──────┘     │
        │            └─────┬─────┘             │
        │                  │                   │
        │            ┌─────▼─────┐             │
        └────────────│  Expired  │─────────────┘
                     └───────────┘
```

### Subscription Service

```typescript
// services/subscription.service.ts
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { StripeCustomerService } from './stripe-customer.service';
import { EmailService } from './email.service';
import {
  SubscriptionStatus,
  BillingPeriod,
} from '@prisma/client';

export interface CreateSubscriptionInput {
  tenantId: string;
  planId: string;
  billingPeriod: BillingPeriod;
  paymentMethodId?: string;
  couponCode?: string;
  trialDays?: number;
}

export interface UpdateSubscriptionInput {
  planId?: string;
  billingPeriod?: BillingPeriod;
  cancelAtPeriodEnd?: boolean;
}

export class SubscriptionService {
  private customerService = new StripeCustomerService();
  private emailService = new EmailService();

  /**
   * Create new subscription
   */
  async createSubscription(input: CreateSubscriptionInput): Promise<{
    subscription: any;
    clientSecret?: string;
  }> {
    const { tenantId, planId, billingPeriod, paymentMethodId, couponCode, trialDays } = input;

    // Get plan
    const plan = await prisma.subscriptionPlan.findUniqueOrThrow({
      where: { id: planId },
    });

    // Get or create customer
    const customer = await this.customerService.getOrCreateCustomer(tenantId);

    // Attach payment method if provided
    if (paymentMethodId) {
      await this.customerService.attachPaymentMethod(tenantId, paymentMethodId);
    }

    // Get price ID
    const priceId = billingPeriod === 'YEARLY'
      ? plan.stripePriceIdYearly
      : plan.stripePriceIdMonthly;

    // Create subscription params
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        tenantId,
        planId,
      },
    };

    // Add trial if specified
    if (trialDays && trialDays > 0) {
      subscriptionParams.trial_period_days = trialDays;
    }

    // Add coupon if provided
    if (couponCode) {
      subscriptionParams.coupon = couponCode;
    }

    // Create Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create(subscriptionParams);

    // Calculate period dates
    const currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);

    // Create local subscription record
    const subscription = await prisma.tenantSubscription.create({
      data: {
        tenantId,
        planId,
        stripeSubscriptionId: stripeSubscription.id,
        status: this.mapStripeStatus(stripeSubscription.status),
        billingPeriod,
        currentPeriodStart,
        currentPeriodEnd,
        trialEndsAt: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
      include: {
        plan: true,
      },
    });

    // Update tenant plan
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { planId },
    });

    // Get client secret for payment if needed
    const invoice = stripeSubscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;

    return {
      subscription,
      clientSecret: paymentIntent?.client_secret || undefined,
    };
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    tenantId: string,
    input: UpdateSubscriptionInput
  ): Promise<any> {
    const subscription = await prisma.tenantSubscription.findFirst({
      where: { tenantId, status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
      include: { plan: true },
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const updateParams: Stripe.SubscriptionUpdateParams = {};

    // Handle plan change
    if (input.planId && input.planId !== subscription.planId) {
      const newPlan = await prisma.subscriptionPlan.findUniqueOrThrow({
        where: { id: input.planId },
      });

      const billingPeriod = input.billingPeriod || subscription.billingPeriod;
      const priceId = billingPeriod === 'YEARLY'
        ? newPlan.stripePriceIdYearly
        : newPlan.stripePriceIdMonthly;

      // Get current subscription items
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      updateParams.items = [{
        id: stripeSubscription.items.data[0].id,
        price: priceId,
      }];

      updateParams.proration_behavior = 'create_prorations';
    }

    // Handle cancellation
    if (input.cancelAtPeriodEnd !== undefined) {
      updateParams.cancel_at_period_end = input.cancelAtPeriodEnd;
    }

    // Update Stripe subscription
    const updatedStripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      updateParams
    );

    // Update local record
    const updatedSubscription = await prisma.tenantSubscription.update({
      where: { id: subscription.id },
      data: {
        planId: input.planId || subscription.planId,
        billingPeriod: input.billingPeriod || subscription.billingPeriod,
        cancelAtPeriodEnd: updatedStripeSubscription.cancel_at_period_end,
        status: this.mapStripeStatus(updatedStripeSubscription.status),
      },
      include: { plan: true },
    });

    // Update tenant plan if changed
    if (input.planId) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { planId: input.planId },
      });
    }

    return updatedSubscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    tenantId: string,
    immediately: boolean = false
  ): Promise<any> {
    const subscription = await prisma.tenantSubscription.findFirst({
      where: { tenantId, status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    if (immediately) {
      // Cancel immediately
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

      await prisma.tenantSubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

      // Downgrade to free tier or suspend
      await this.handleSubscriptionCancellation(tenantId);
    } else {
      // Cancel at period end
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      await prisma.tenantSubscription.update({
        where: { id: subscription.id },
        data: { cancelAtPeriodEnd: true },
      });
    }

    // Send cancellation email
    await this.emailService.sendSubscriptionCancellation(tenantId);

    return prisma.tenantSubscription.findUnique({
      where: { id: subscription.id },
      include: { plan: true },
    });
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(tenantId: string): Promise<any> {
    const subscription = await prisma.tenantSubscription.findFirst({
      where: {
        tenantId,
        cancelAtPeriodEnd: true,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
    });

    if (!subscription) {
      throw new Error('No subscription pending cancellation found');
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    return prisma.tenantSubscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: false },
    });
  }

  /**
   * Handle subscription expiration/cancellation
   */
  private async handleSubscriptionCancellation(tenantId: string): Promise<void> {
    // Update tenant status
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspendReason: 'Subscription cancelled',
      },
    });

    // Disable custom domain
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { customDomainEnabled: false },
    });
  }

  /**
   * Map Stripe status to local status
   */
  private mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      'active': 'ACTIVE',
      'trialing': 'TRIALING',
      'past_due': 'PAST_DUE',
      'canceled': 'CANCELLED',
      'unpaid': 'PAST_DUE',
      'incomplete': 'PENDING',
      'incomplete_expired': 'EXPIRED',
      'paused': 'PAUSED',
    };

    return statusMap[stripeStatus] || 'PENDING';
  }
}
```

---

## Payment Processing

### Payment Service

```typescript
// services/payment.service.ts
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export interface CreatePaymentInput {
  tenantId: string;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export class PaymentService {
  /**
   * Create payment intent
   */
  async createPaymentIntent(input: CreatePaymentInput): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: input.tenantId },
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(input.amount * 100),
      currency: input.currency || 'usd',
      customer: tenant.stripeCustomerId || undefined,
      description: input.description,
      metadata: {
        tenantId: input.tenantId,
        ...input.metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Record payment attempt
    await prisma.payment.create({
      data: {
        tenantId: input.tenantId,
        stripePaymentIntentId: paymentIntent.id,
        amount: input.amount,
        currency: input.currency || 'usd',
        status: 'PENDING',
        description: input.description,
        metadata: input.metadata,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Confirm payment
   */
  async confirmPayment(paymentIntentId: string): Promise<any> {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    await prisma.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntentId },
      data: {
        status: this.mapPaymentStatus(paymentIntent.status),
        paidAt: paymentIntent.status === 'succeeded' ? new Date() : null,
        failureReason: paymentIntent.last_payment_error?.message,
      },
    });

    return prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    });
  }

  /**
   * Refund payment
   */
  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<any> {
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { id: paymentId },
    });

    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: payment.stripePaymentIntentId,
      reason: reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer',
    };

    if (amount) {
      refundParams.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundParams);

    // Create refund record
    await prisma.refund.create({
      data: {
        paymentId,
        stripeRefundId: refund.id,
        amount: refund.amount / 100,
        reason: reason || 'requested_by_customer',
        status: refund.status,
      },
    });

    // Update payment status
    if (!amount || amount >= payment.amount) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' },
      });
    } else {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'PARTIALLY_REFUNDED' },
      });
    }

    return prisma.payment.findUnique({
      where: { id: paymentId },
      include: { refunds: true },
    });
  }

  private mapPaymentStatus(stripeStatus: string): string {
    const statusMap: Record<string, string> = {
      'succeeded': 'SUCCEEDED',
      'processing': 'PROCESSING',
      'requires_payment_method': 'FAILED',
      'requires_confirmation': 'PENDING',
      'requires_action': 'PENDING',
      'canceled': 'CANCELLED',
    };

    return statusMap[stripeStatus] || 'PENDING';
  }
}
```

---

## Invoicing System

### Invoice Service

```typescript
// services/invoice.service.ts
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export class InvoiceService {
  /**
   * List invoices for tenant
   */
  async listInvoices(tenantId: string, limit: number = 10): Promise<any[]> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    if (!tenant.stripeCustomerId) {
      return [];
    }

    const invoices = await stripe.invoices.list({
      customer: tenant.stripeCustomerId,
      limit,
    });

    return invoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount: invoice.amount_due / 100,
      amountPaid: invoice.amount_paid / 100,
      currency: invoice.currency,
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
      paidAt: invoice.status_transitions.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : null,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      lines: invoice.lines.data.map(line => ({
        description: line.description,
        amount: line.amount / 100,
        quantity: line.quantity,
      })),
    }));
  }

  /**
   * Get upcoming invoice
   */
  async getUpcomingInvoice(tenantId: string): Promise<any | null> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    if (!tenant.stripeCustomerId) {
      return null;
    }

    try {
      const invoice = await stripe.invoices.retrieveUpcoming({
        customer: tenant.stripeCustomerId,
      });

      return {
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        periodStart: new Date(invoice.period_start * 1000),
        periodEnd: new Date(invoice.period_end * 1000),
        lines: invoice.lines.data.map(line => ({
          description: line.description,
          amount: line.amount / 100,
          quantity: line.quantity,
        })),
      };
    } catch (error) {
      // No upcoming invoice
      return null;
    }
  }

  /**
   * Pay invoice manually
   */
  async payInvoice(invoiceId: string): Promise<any> {
    const invoice = await stripe.invoices.pay(invoiceId);

    return {
      id: invoice.id,
      status: invoice.status,
      paidAt: invoice.status_transitions.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : null,
    };
  }

  /**
   * Send invoice reminder
   */
  async sendReminder(invoiceId: string): Promise<void> {
    await stripe.invoices.sendInvoice(invoiceId);
  }

  /**
   * Void invoice
   */
  async voidInvoice(invoiceId: string): Promise<any> {
    const invoice = await stripe.invoices.voidInvoice(invoiceId);

    return {
      id: invoice.id,
      status: invoice.status,
    };
  }
}
```

---

## Usage-Based Billing

### Usage Tracking

```typescript
// services/usage-tracking.service.ts
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export interface UsageMetric {
  name: string;
  value: number;
  unit: string;
  limit: number;
  percentage: number;
}

export class UsageTrackingService {
  /**
   * Record usage for a tenant
   */
  async recordUsage(
    tenantId: string,
    metricName: string,
    value: number
  ): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    await prisma.tenantUsage.upsert({
      where: {
        tenantId_metricName_periodStart: {
          tenantId,
          metricName,
          periodStart,
        },
      },
      update: {
        metricValue: { increment: value },
      },
      create: {
        tenantId,
        metricName,
        metricValue: value,
        periodStart,
        periodEnd,
      },
    });
  }

  /**
   * Get current usage for tenant
   */
  async getCurrentUsage(tenantId: string): Promise<UsageMetric[]> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      include: { plan: true },
    });

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get counts from database
    const [
      memberCount,
      sermonCount,
      eventCount,
      mediaSize,
      pageViewCount,
      emailCount,
    ] = await Promise.all([
      prisma.user.count({ where: { tenantId, deletedAt: null } }),
      prisma.sermon.count({ where: { tenantId, deletedAt: null } }),
      prisma.event.count({ where: { tenantId, deletedAt: null } }),
      this.getMediaStorageSize(tenantId),
      this.getMetricValue(tenantId, 'page_views', periodStart),
      this.getMetricValue(tenantId, 'emails_sent', periodStart),
    ]);

    const limits = tenant.plan.limits as any;

    return [
      {
        name: 'Members',
        value: memberCount,
        unit: 'members',
        limit: limits.members,
        percentage: limits.members > 0 ? (memberCount / limits.members) * 100 : 0,
      },
      {
        name: 'Sermons',
        value: sermonCount,
        unit: 'sermons',
        limit: limits.sermons,
        percentage: limits.sermons > 0 ? (sermonCount / limits.sermons) * 100 : 0,
      },
      {
        name: 'Events',
        value: eventCount,
        unit: 'events',
        limit: limits.events,
        percentage: limits.events > 0 ? (eventCount / limits.events) * 100 : 0,
      },
      {
        name: 'Storage',
        value: mediaSize,
        unit: 'GB',
        limit: limits.storage,
        percentage: limits.storage > 0 ? (mediaSize / limits.storage) * 100 : 0,
      },
      {
        name: 'Page Views',
        value: pageViewCount,
        unit: 'views/month',
        limit: limits.monthlyPageViews,
        percentage: limits.monthlyPageViews > 0
          ? (pageViewCount / limits.monthlyPageViews) * 100
          : 0,
      },
      {
        name: 'Emails Sent',
        value: emailCount,
        unit: 'emails/month',
        limit: limits.emailsPerMonth,
        percentage: limits.emailsPerMonth > 0
          ? (emailCount / limits.emailsPerMonth) * 100
          : 0,
      },
    ];
  }

  /**
   * Check if tenant can perform action based on limits
   */
  async checkLimit(
    tenantId: string,
    resource: string
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    const usage = await this.getCurrentUsage(tenantId);
    const metric = usage.find(u => u.name.toLowerCase() === resource.toLowerCase());

    if (!metric) {
      return { allowed: true, current: 0, limit: -1 };
    }

    // -1 means unlimited
    if (metric.limit === -1) {
      return { allowed: true, current: metric.value, limit: -1 };
    }

    return {
      allowed: metric.value < metric.limit,
      current: metric.value,
      limit: metric.limit,
    };
  }

  /**
   * Report usage to Stripe for metered billing
   */
  async reportStripeUsage(
    tenantId: string,
    subscriptionItemId: string,
    quantity: number
  ): Promise<void> {
    await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
      quantity,
      timestamp: Math.floor(Date.now() / 1000),
      action: 'set',
    });
  }

  private async getMediaStorageSize(tenantId: string): Promise<number> {
    const result = await prisma.media.aggregate({
      where: { tenantId },
      _sum: { size: true },
    });

    // Convert bytes to GB
    return (result._sum.size || 0) / (1024 * 1024 * 1024);
  }

  private async getMetricValue(
    tenantId: string,
    metricName: string,
    periodStart: Date
  ): Promise<number> {
    const usage = await prisma.tenantUsage.findFirst({
      where: { tenantId, metricName, periodStart },
    });

    return usage?.metricValue || 0;
  }
}
```

---

## Revenue Analytics

### Revenue Dashboard Data

```typescript
// services/revenue-analytics.service.ts
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  totalRevenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  ltv: number;
  growth: {
    mrr: number;
    subscribers: number;
    revenue: number;
  };
}

export interface RevenueByPlan {
  planId: string;
  planName: string;
  subscribers: number;
  mrr: number;
  percentage: number;
}

export class RevenueAnalyticsService {
  /**
   * Get key revenue metrics
   */
  async getRevenueMetrics(): Promise<RevenueMetrics> {
    const [
      currentMRR,
      previousMRR,
      totalRevenue,
      activeSubscribers,
      previousSubscribers,
      churnedThisMonth,
    ] = await Promise.all([
      this.calculateMRR(),
      this.calculateMRR(this.getLastMonth()),
      this.getTotalRevenue(),
      this.getActiveSubscriberCount(),
      this.getActiveSubscriberCount(this.getLastMonth()),
      this.getChurnedSubscriberCount(),
    ]);

    const mrrGrowth = previousMRR > 0
      ? ((currentMRR - previousMRR) / previousMRR) * 100
      : 0;

    const subscriberGrowth = previousSubscribers > 0
      ? ((activeSubscribers - previousSubscribers) / previousSubscribers) * 100
      : 0;

    const churnRate = previousSubscribers > 0
      ? (churnedThisMonth / previousSubscribers) * 100
      : 0;

    const arpu = activeSubscribers > 0
      ? currentMRR / activeSubscribers
      : 0;

    // Simple LTV calculation (ARPU / Churn Rate)
    const ltv = churnRate > 0 ? (arpu * 12) / (churnRate / 100) : arpu * 24;

    return {
      mrr: currentMRR,
      arr: currentMRR * 12,
      totalRevenue,
      averageRevenuePerUser: arpu,
      churnRate,
      ltv,
      growth: {
        mrr: mrrGrowth,
        subscribers: subscriberGrowth,
        revenue: mrrGrowth, // Simplified
      },
    };
  }

  /**
   * Get revenue breakdown by plan
   */
  async getRevenueByPlan(): Promise<RevenueByPlan[]> {
    const subscriptions = await prisma.tenantSubscription.groupBy({
      by: ['planId'],
      where: { status: 'ACTIVE' },
      _count: true,
    });

    const plans = await prisma.subscriptionPlan.findMany();
    const planMap = new Map(plans.map(p => [p.id, p]));

    let totalMRR = 0;
    const breakdown: RevenueByPlan[] = [];

    for (const sub of subscriptions) {
      const plan = planMap.get(sub.planId);
      if (!plan) continue;

      // Calculate MRR for this plan's subscribers
      const monthlyEquivalent = await this.calculatePlanMRR(sub.planId);
      totalMRR += monthlyEquivalent;

      breakdown.push({
        planId: plan.id,
        planName: plan.name,
        subscribers: sub._count,
        mrr: monthlyEquivalent,
        percentage: 0, // Calculate after total
      });
    }

    // Calculate percentages
    return breakdown.map(b => ({
      ...b,
      percentage: totalMRR > 0 ? (b.mrr / totalMRR) * 100 : 0,
    }));
  }

  /**
   * Get revenue over time
   */
  async getRevenueTimeSeries(
    startDate: Date,
    endDate: Date,
    interval: 'day' | 'week' | 'month' = 'month'
  ): Promise<Array<{ date: string; revenue: number; subscribers: number }>> {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCEEDED',
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    // Group by interval
    const grouped = new Map<string, { revenue: number; subscribers: Set<string> }>();

    for (const payment of payments) {
      const key = this.formatDateKey(payment.createdAt, interval);
      const existing = grouped.get(key) || { revenue: 0, subscribers: new Set() };
      existing.revenue += payment.amount;
      grouped.set(key, existing);
    }

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      subscribers: data.subscribers.size,
    }));
  }

  private async calculateMRR(asOf?: Date): Promise<number> {
    const where: any = { status: 'ACTIVE' };

    if (asOf) {
      where.createdAt = { lte: asOf };
    }

    const subscriptions = await prisma.tenantSubscription.findMany({
      where,
      include: { plan: true },
    });

    return subscriptions.reduce((total, sub) => {
      const monthlyAmount = sub.billingPeriod === 'YEARLY'
        ? sub.plan.priceYearly / 12
        : sub.plan.priceMonthly;
      return total + monthlyAmount;
    }, 0);
  }

  private async calculatePlanMRR(planId: string): Promise<number> {
    const subscriptions = await prisma.tenantSubscription.findMany({
      where: { planId, status: 'ACTIVE' },
      include: { plan: true },
    });

    return subscriptions.reduce((total, sub) => {
      const monthlyAmount = sub.billingPeriod === 'YEARLY'
        ? sub.plan.priceYearly / 12
        : sub.plan.priceMonthly;
      return total + monthlyAmount;
    }, 0);
  }

  private async getTotalRevenue(): Promise<number> {
    const result = await prisma.payment.aggregate({
      where: { status: 'SUCCEEDED' },
      _sum: { amount: true },
    });

    return result._sum.amount || 0;
  }

  private async getActiveSubscriberCount(asOf?: Date): Promise<number> {
    const where: any = { status: 'ACTIVE' };

    if (asOf) {
      where.createdAt = { lte: asOf };
    }

    return prisma.tenantSubscription.count({ where });
  }

  private async getChurnedSubscriberCount(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return prisma.tenantSubscription.count({
      where: {
        status: 'CANCELLED',
        cancelledAt: { gte: startOfMonth },
      },
    });
  }

  private getLastMonth(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  }

  private formatDateKey(date: Date, interval: string): string {
    switch (interval) {
      case 'day':
        return date.toISOString().split('T')[0];
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'month':
      default:
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  }
}
```

---

## Billing Portal

### Stripe Billing Portal

```typescript
// services/billing-portal.service.ts
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export class BillingPortalService {
  /**
   * Create billing portal session
   */
  async createPortalSession(
    tenantId: string,
    returnUrl: string
  ): Promise<string> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    if (!tenant.stripeCustomerId) {
      throw new Error('No billing account found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  /**
   * Create checkout session for plan upgrade/change
   */
  async createCheckoutSession(
    tenantId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    });

    const sessionParams: any = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { tenantId },
    };

    if (tenant.stripeCustomerId) {
      sessionParams.customer = tenant.stripeCustomerId;
    } else {
      sessionParams.customer_email = tenant.contactEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return session.url!;
  }
}
```

### Billing UI Components

```typescript
// components/billing/BillingDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CreditCard,
  Receipt,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

interface BillingDashboardProps {
  tenantId: string;
}

export function BillingDashboard({ tenantId }: BillingDashboardProps) {
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, [tenantId]);

  async function fetchBillingData() {
    const [subRes, usageRes, invoiceRes] = await Promise.all([
      fetch(`/api/billing/subscription`),
      fetch(`/api/billing/usage`),
      fetch(`/api/billing/invoices`),
    ]);

    setSubscription(await subRes.json());
    setUsage(await usageRes.json());
    setInvoices(await invoiceRes.json());
    setLoading(false);
  }

  async function openBillingPortal() {
    const res = await fetch('/api/billing/portal', { method: 'POST' });
    const { url } = await res.json();
    window.open(url, '_blank');
  }

  if (loading) {
    return <div>Loading billing information...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Plan</CardTitle>
            <Button onClick={openBillingPortal}>
              Manage Billing <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{subscription?.plan?.name}</h3>
              <p className="text-gray-500">
                ${subscription?.plan?.priceMonthly}/month
                {subscription?.billingPeriod === 'YEARLY' && ' (billed annually)'}
              </p>
            </div>
            <div className="text-right">
              <Badge variant={subscription?.status === 'ACTIVE' ? 'success' : 'warning'}>
                {subscription?.status}
              </Badge>
              {subscription?.cancelAtPeriodEnd && (
                <p className="text-sm text-yellow-600 mt-1">
                  Cancels at period end
                </p>
              )}
            </div>
          </div>

          {subscription?.trialEndsAt && new Date(subscription.trialEndsAt) > new Date() && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Trial ends on {new Date(subscription.trialEndsAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Usage This Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usage.map((metric) => (
              <div key={metric.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <span className="text-sm text-gray-500">
                    {metric.value.toLocaleString()} / {metric.limit === -1 ? '∞' : metric.limit.toLocaleString()} {metric.unit}
                  </span>
                </div>
                <Progress
                  value={metric.limit === -1 ? 0 : metric.percentage}
                  className={metric.percentage > 80 ? 'bg-red-100' : ''}
                />
                {metric.percentage > 80 && metric.limit !== -1 && (
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Approaching limit
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {invoices.slice(0, 5).map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{invoice.number}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">${invoice.amount.toFixed(2)}</span>
                  <Badge
                    variant={invoice.status === 'paid' ? 'success' : 'warning'}
                  >
                    {invoice.status}
                  </Badge>
                  {invoice.invoicePdf && (
                    <a
                      href={invoice.invoicePdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Webhooks & Events

### Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/services/email.service';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const emailService = new EmailService();

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.upcoming':
        await handleUpcomingInvoice(event.data.object as Stripe.Invoice);
        break;

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook: ${error}`);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata.tenantId;

  if (!tenantId) {
    console.error('No tenantId in subscription metadata');
    return;
  }

  const planId = subscription.metadata.planId;

  await prisma.tenantSubscription.upsert({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    create: {
      tenantId,
      planId,
      stripeSubscriptionId: subscription.id,
      status: mapStripeStatus(subscription.status),
      billingPeriod: subscription.items.data[0].price.recurring?.interval === 'year'
        ? 'YEARLY'
        : 'MONTHLY',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
    },
    update: {
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await prisma.tenantSubscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.tenantSubscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  });

  // Get tenant and suspend
  const sub = await prisma.tenantSubscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (sub) {
    await prisma.tenant.update({
      where: { id: sub.tenantId },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspendReason: 'Subscription ended',
      },
    });
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const sub = await prisma.tenantSubscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    include: { tenant: true },
  });

  if (sub) {
    const emailService = new EmailService();
    await emailService.sendTrialEndingReminder(sub.tenant, subscription.trial_end!);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  // Record payment
  await prisma.payment.create({
    data: {
      tenantId: invoice.metadata?.tenantId || '',
      stripePaymentIntentId: invoice.payment_intent as string,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: 'SUCCEEDED',
      paidAt: new Date(),
    },
  });

  // Update subscription status if past_due
  await prisma.tenantSubscription.updateMany({
    where: {
      stripeSubscriptionId: invoice.subscription as string,
      status: 'PAST_DUE',
    },
    data: { status: 'ACTIVE' },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  // Record failed payment
  await prisma.payment.create({
    data: {
      tenantId: invoice.metadata?.tenantId || '',
      stripePaymentIntentId: invoice.payment_intent as string,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: 'FAILED',
      failureReason: invoice.last_finalization_error?.message,
    },
  });

  // Update subscription to past_due
  await prisma.tenantSubscription.updateMany({
    where: { stripeSubscriptionId: invoice.subscription as string },
    data: { status: 'PAST_DUE' },
  });

  // Send payment failed email
  const sub = await prisma.tenantSubscription.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string },
    include: { tenant: true },
  });

  if (sub) {
    const emailService = new EmailService();
    await emailService.sendPaymentFailedNotification(sub.tenant, invoice);
  }
}

async function handleUpcomingInvoice(invoice: Stripe.Invoice) {
  // Send upcoming invoice notification
  const sub = await prisma.tenantSubscription.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string },
    include: { tenant: true },
  });

  if (sub) {
    const emailService = new EmailService();
    await emailService.sendUpcomingInvoiceNotification(sub.tenant, invoice);
  }
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  const tenantId = customer.metadata?.tenantId;

  if (tenantId) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        billingEmail: customer.email || undefined,
      },
    });
  }
}

function mapStripeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'active': 'ACTIVE',
    'trialing': 'TRIALING',
    'past_due': 'PAST_DUE',
    'canceled': 'CANCELLED',
    'unpaid': 'PAST_DUE',
    'incomplete': 'PENDING',
    'incomplete_expired': 'EXPIRED',
    'paused': 'PAUSED',
  };
  return statusMap[status] || 'PENDING';
}
```

---

## Dunning & Recovery

### Grace Period Policy

A formal grace period policy ensures churches maintain access to critical services during payment issues while protecting platform revenue.

```typescript
// lib/billing/grace-period.ts

/**
 * PAYMENT FAILURE GRACE PERIOD POLICY
 *
 * Timeline for service restrictions after payment failure:
 *
 * Day 0: Payment fails
 * - Email notification sent immediately
 * - All services continue normally
 * - Invoice status: unpaid
 *
 * Day 1-3: WARNING PHASE
 * - Daily reminder emails
 * - Banner shown in admin panel
 * - All services continue normally
 *
 * Day 4-7: RESTRICTED PHASE
 * - Admin functions limited (no new content creation)
 * - Public website remains active
 * - Giving/donations continue processing
 * - Email/SMS campaigns paused
 *
 * Day 8-14: LIMITED PHASE
 * - Admin portal read-only
 * - Public website shows maintenance banner
 * - Giving redirects to direct payment link
 * - Data export available
 *
 * Day 15-30: SUSPENDED PHASE
 * - Admin portal locked (only billing access)
 * - Public website shows suspended message
 * - All giving/donations paused
 * - Data export still available
 *
 * Day 31+: CANCELLED
 * - Account fully suspended
 * - Data retained for 90 days
 * - Reactivation requires payment + $50 reactivation fee
 */

export enum GracePeriodPhase {
  CURRENT = 'current',
  WARNING = 'warning',       // Day 1-3
  RESTRICTED = 'restricted', // Day 4-7
  LIMITED = 'limited',       // Day 8-14
  SUSPENDED = 'suspended',   // Day 15-30
  CANCELLED = 'cancelled',   // Day 31+
}

export interface GracePeriodStatus {
  phase: GracePeriodPhase;
  daysPastDue: number;
  restrictions: ServiceRestrictions;
  deadlines: {
    restrictedAt: Date | null;
    limitedAt: Date | null;
    suspendedAt: Date | null;
    cancelledAt: Date | null;
  };
  nextPhaseDate: Date | null;
  canExportData: boolean;
  amountDue: number;
  invoiceUrl: string;
}

export interface ServiceRestrictions {
  adminAccess: 'full' | 'limited' | 'readonly' | 'billing_only' | 'none';
  publicWebsite: 'full' | 'maintenance_banner' | 'suspended_message' | 'offline';
  givingEnabled: boolean;
  emailCampaigns: boolean;
  smsCampaigns: boolean;
  contentCreation: boolean;
  memberManagement: boolean;
  eventRegistration: boolean;
  apiAccess: boolean;
}

const PHASE_RESTRICTIONS: Record<GracePeriodPhase, ServiceRestrictions> = {
  [GracePeriodPhase.CURRENT]: {
    adminAccess: 'full',
    publicWebsite: 'full',
    givingEnabled: true,
    emailCampaigns: true,
    smsCampaigns: true,
    contentCreation: true,
    memberManagement: true,
    eventRegistration: true,
    apiAccess: true,
  },
  [GracePeriodPhase.WARNING]: {
    adminAccess: 'full',
    publicWebsite: 'full',
    givingEnabled: true,
    emailCampaigns: true,
    smsCampaigns: true,
    contentCreation: true,
    memberManagement: true,
    eventRegistration: true,
    apiAccess: true,
  },
  [GracePeriodPhase.RESTRICTED]: {
    adminAccess: 'limited',
    publicWebsite: 'full',
    givingEnabled: true,
    emailCampaigns: false,  // Paused
    smsCampaigns: false,    // Paused
    contentCreation: false, // No new content
    memberManagement: true,
    eventRegistration: true,
    apiAccess: true,
  },
  [GracePeriodPhase.LIMITED]: {
    adminAccess: 'readonly',
    publicWebsite: 'maintenance_banner',
    givingEnabled: true,  // Redirected to direct link
    emailCampaigns: false,
    smsCampaigns: false,
    contentCreation: false,
    memberManagement: false,
    eventRegistration: false,
    apiAccess: false,
  },
  [GracePeriodPhase.SUSPENDED]: {
    adminAccess: 'billing_only',
    publicWebsite: 'suspended_message',
    givingEnabled: false,
    emailCampaigns: false,
    smsCampaigns: false,
    contentCreation: false,
    memberManagement: false,
    eventRegistration: false,
    apiAccess: false,
  },
  [GracePeriodPhase.CANCELLED]: {
    adminAccess: 'none',
    publicWebsite: 'offline',
    givingEnabled: false,
    emailCampaigns: false,
    smsCampaigns: false,
    contentCreation: false,
    memberManagement: false,
    eventRegistration: false,
    apiAccess: false,
  },
};

export function calculateGracePeriodPhase(daysPastDue: number): GracePeriodPhase {
  if (daysPastDue <= 0) return GracePeriodPhase.CURRENT;
  if (daysPastDue <= 3) return GracePeriodPhase.WARNING;
  if (daysPastDue <= 7) return GracePeriodPhase.RESTRICTED;
  if (daysPastDue <= 14) return GracePeriodPhase.LIMITED;
  if (daysPastDue <= 30) return GracePeriodPhase.SUSPENDED;
  return GracePeriodPhase.CANCELLED;
}

export function getRestrictions(phase: GracePeriodPhase): ServiceRestrictions {
  return PHASE_RESTRICTIONS[phase];
}
```

### Grace Period Service

```typescript
// services/grace-period.service.ts
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import {
  GracePeriodPhase,
  GracePeriodStatus,
  calculateGracePeriodPhase,
  getRestrictions,
} from '@/lib/billing/grace-period';

export class GracePeriodService {
  /**
   * Get grace period status for a tenant
   */
  async getGracePeriodStatus(tenantId: string): Promise<GracePeriodStatus> {
    const subscription = await prisma.tenantSubscription.findFirst({
      where: {
        tenantId,
        status: { in: ['ACTIVE', 'PAST_DUE', 'SUSPENDED'] },
      },
    });

    if (!subscription) {
      throw new Error('No subscription found');
    }

    // Get unpaid invoice from Stripe
    const invoices = await stripe.invoices.list({
      subscription: subscription.stripeSubscriptionId,
      status: 'open',
      limit: 1,
    });

    const unpaidInvoice = invoices.data[0];

    if (!unpaidInvoice || subscription.status === 'ACTIVE') {
      return {
        phase: GracePeriodPhase.CURRENT,
        daysPastDue: 0,
        restrictions: getRestrictions(GracePeriodPhase.CURRENT),
        deadlines: {
          restrictedAt: null,
          limitedAt: null,
          suspendedAt: null,
          cancelledAt: null,
        },
        nextPhaseDate: null,
        canExportData: true,
        amountDue: 0,
        invoiceUrl: '',
      };
    }

    const dueDate = new Date(unpaidInvoice.due_date! * 1000);
    const now = new Date();
    const daysPastDue = Math.floor(
      (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const phase = calculateGracePeriodPhase(daysPastDue);

    return {
      phase,
      daysPastDue,
      restrictions: getRestrictions(phase),
      deadlines: {
        restrictedAt: new Date(dueDate.getTime() + 4 * 24 * 60 * 60 * 1000),
        limitedAt: new Date(dueDate.getTime() + 8 * 24 * 60 * 60 * 1000),
        suspendedAt: new Date(dueDate.getTime() + 15 * 24 * 60 * 60 * 1000),
        cancelledAt: new Date(dueDate.getTime() + 31 * 24 * 60 * 60 * 1000),
      },
      nextPhaseDate: this.getNextPhaseDate(dueDate, daysPastDue),
      canExportData: phase !== GracePeriodPhase.CANCELLED,
      amountDue: unpaidInvoice.amount_due / 100,
      invoiceUrl: unpaidInvoice.hosted_invoice_url || '',
    };
  }

  private getNextPhaseDate(dueDate: Date, daysPastDue: number): Date | null {
    if (daysPastDue <= 0) return new Date(dueDate.getTime() + 1 * 24 * 60 * 60 * 1000);
    if (daysPastDue <= 3) return new Date(dueDate.getTime() + 4 * 24 * 60 * 60 * 1000);
    if (daysPastDue <= 7) return new Date(dueDate.getTime() + 8 * 24 * 60 * 60 * 1000);
    if (daysPastDue <= 14) return new Date(dueDate.getTime() + 15 * 24 * 60 * 60 * 1000);
    if (daysPastDue <= 30) return new Date(dueDate.getTime() + 31 * 24 * 60 * 60 * 1000);
    return null;
  }

  /**
   * Apply service restrictions based on grace period phase
   */
  async applyRestrictions(tenantId: string): Promise<void> {
    const status = await this.getGracePeriodStatus(tenantId);

    // Update tenant restriction level
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        gracePeriodPhase: status.phase,
        serviceRestrictions: status.restrictions,
        gracePeriodEndsAt: status.deadlines.cancelledAt,
      },
    });

    // Log phase transition
    await prisma.gracePeriodLog.create({
      data: {
        tenantId,
        phase: status.phase,
        daysPastDue: status.daysPastDue,
        restrictions: status.restrictions,
        amountDue: status.amountDue,
      },
    });
  }
}
```

### Grace Period Middleware

```typescript
// middleware/grace-period.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRestrictions, GracePeriodPhase } from '@/lib/billing/grace-period';

export async function checkGracePeriodRestrictions(
  request: NextRequest,
  tenant: { gracePeriodPhase: string; serviceRestrictions: any }
): Promise<NextResponse | null> {
  const phase = tenant.gracePeriodPhase as GracePeriodPhase;
  const restrictions = tenant.serviceRestrictions || getRestrictions(phase);

  const pathname = request.nextUrl.pathname;

  // Check admin access
  if (pathname.startsWith('/admin')) {
    if (restrictions.adminAccess === 'none') {
      return NextResponse.redirect(new URL('/account-suspended', request.url));
    }

    if (restrictions.adminAccess === 'billing_only') {
      if (!pathname.startsWith('/admin/billing')) {
        return NextResponse.redirect(new URL('/admin/billing', request.url));
      }
    }

    if (restrictions.adminAccess === 'readonly') {
      // Allow GET requests only
      if (request.method !== 'GET' && !pathname.startsWith('/admin/billing')) {
        return NextResponse.json(
          { error: 'Account is in read-only mode due to payment issues' },
          { status: 403 }
        );
      }
    }
  }

  // Check API access
  if (pathname.startsWith('/api/') && !restrictions.apiAccess) {
    // Allow billing-related APIs
    if (!pathname.startsWith('/api/billing')) {
      return NextResponse.json(
        { error: 'API access suspended due to payment issues' },
        { status: 403 }
      );
    }
  }

  return null; // No restrictions applied
}
```

### Pro-ration Tracking

Track internal billing records for module additions/removals and plan changes.

```typescript
// services/proration.service.ts
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

export interface ProrationRecord {
  id: string;
  tenantId: string;
  subscriptionId: string;
  type: 'PLAN_UPGRADE' | 'PLAN_DOWNGRADE' | 'MODULE_ADD' | 'MODULE_REMOVE';
  effectiveDate: Date;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  previousAmount: number;
  newAmount: number;
  prorationAmount: number;  // Credit or charge
  daysRemaining: number;
  totalDaysInPeriod: number;
  description: string;
  stripeInvoiceId?: string;
  stripeInvoiceItemId?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export class ProrationService {
  /**
   * Calculate and record proration for plan change
   */
  async recordPlanChangeProration(
    tenantId: string,
    previousPlan: { id: string; price: number },
    newPlan: { id: string; price: number },
    effectiveDate: Date
  ): Promise<ProrationRecord> {
    const subscription = await prisma.tenantSubscription.findFirst({
      where: { tenantId, status: { in: ['ACTIVE', 'TRIALING'] } },
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const periodStart = subscription.currentPeriodStart;
    const periodEnd = subscription.currentPeriodEnd;

    // Calculate days
    const totalDays = Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysUsed = Math.ceil(
      (effectiveDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = totalDays - daysUsed;

    // Calculate proration
    const previousDailyRate = previousPlan.price / totalDays;
    const newDailyRate = newPlan.price / totalDays;

    const creditFromPrevious = previousDailyRate * daysRemaining;
    const chargeForNew = newDailyRate * daysRemaining;
    const prorationAmount = chargeForNew - creditFromPrevious;

    const isUpgrade = newPlan.price > previousPlan.price;

    // Create internal record
    const record = await prisma.prorationRecord.create({
      data: {
        tenantId,
        subscriptionId: subscription.id,
        type: isUpgrade ? 'PLAN_UPGRADE' : 'PLAN_DOWNGRADE',
        effectiveDate,
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
        previousAmount: previousPlan.price,
        newAmount: newPlan.price,
        prorationAmount,
        daysRemaining,
        totalDaysInPeriod: totalDays,
        description: `${isUpgrade ? 'Upgrade' : 'Downgrade'} from ${previousPlan.id} to ${newPlan.id}`,
        metadata: {
          previousPlanId: previousPlan.id,
          newPlanId: newPlan.id,
          creditFromPrevious,
          chargeForNew,
        },
      },
    });

    return record;
  }

  /**
   * Calculate and record proration for module changes
   */
  async recordModuleChangeProration(
    tenantId: string,
    moduleId: string,
    modulePrice: number,
    action: 'add' | 'remove',
    effectiveDate: Date
  ): Promise<ProrationRecord> {
    const subscription = await prisma.tenantSubscription.findFirst({
      where: { tenantId, status: { in: ['ACTIVE', 'TRIALING'] } },
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const periodStart = subscription.currentPeriodStart;
    const periodEnd = subscription.currentPeriodEnd;

    const totalDays = Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysUsed = Math.ceil(
      (effectiveDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = totalDays - daysUsed;

    const dailyRate = modulePrice / totalDays;
    const prorationAmount = action === 'add'
      ? dailyRate * daysRemaining
      : -(dailyRate * daysRemaining);

    const module = await prisma.solutionModule.findUnique({
      where: { id: moduleId },
    });

    const record = await prisma.prorationRecord.create({
      data: {
        tenantId,
        subscriptionId: subscription.id,
        type: action === 'add' ? 'MODULE_ADD' : 'MODULE_REMOVE',
        effectiveDate,
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
        previousAmount: action === 'add' ? 0 : modulePrice,
        newAmount: action === 'add' ? modulePrice : 0,
        prorationAmount,
        daysRemaining,
        totalDaysInPeriod: totalDays,
        description: `${action === 'add' ? 'Added' : 'Removed'} module: ${module?.name}`,
        metadata: {
          moduleId,
          moduleName: module?.name,
          moduleSlug: module?.slug,
        },
      },
    });

    return record;
  }

  /**
   * Get proration history for a tenant
   */
  async getProrationHistory(
    tenantId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      type?: string;
      limit?: number;
    }
  ): Promise<ProrationRecord[]> {
    return prisma.prorationRecord.findMany({
      where: {
        tenantId,
        ...(options?.startDate && {
          effectiveDate: { gte: options.startDate },
        }),
        ...(options?.endDate && {
          effectiveDate: { lte: options.endDate },
        }),
        ...(options?.type && { type: options.type }),
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
    });
  }

  /**
   * Generate proration summary for billing period
   */
  async generateProrationSummary(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<{
    totalCredits: number;
    totalCharges: number;
    netAmount: number;
    records: ProrationRecord[];
  }> {
    const records = await prisma.prorationRecord.findMany({
      where: {
        tenantId,
        effectiveDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      orderBy: { effectiveDate: 'asc' },
    });

    const totalCredits = records
      .filter(r => r.prorationAmount < 0)
      .reduce((sum, r) => sum + Math.abs(Number(r.prorationAmount)), 0);

    const totalCharges = records
      .filter(r => r.prorationAmount > 0)
      .reduce((sum, r) => sum + Number(r.prorationAmount), 0);

    return {
      totalCredits,
      totalCharges,
      netAmount: totalCharges - totalCredits,
      records,
    };
  }
}
```

### Proration Schema

```prisma
model ProrationRecord {
  id                  String    @id @default(uuid())
  tenantId            String    @map("tenant_id")
  tenant              Tenant    @relation(fields: [tenantId], references: [id])

  subscriptionId      String    @map("subscription_id")
  subscription        TenantSubscription @relation(fields: [subscriptionId], references: [id])

  type                String    // PLAN_UPGRADE, PLAN_DOWNGRADE, MODULE_ADD, MODULE_REMOVE

  effectiveDate       DateTime  @map("effective_date")
  billingPeriodStart  DateTime  @map("billing_period_start")
  billingPeriodEnd    DateTime  @map("billing_period_end")

  previousAmount      Decimal   @map("previous_amount") @db.Decimal(10, 2)
  newAmount           Decimal   @map("new_amount") @db.Decimal(10, 2)
  prorationAmount     Decimal   @map("proration_amount") @db.Decimal(10, 2)

  daysRemaining       Int       @map("days_remaining")
  totalDaysInPeriod   Int       @map("total_days_in_period")

  description         String
  stripeInvoiceId     String?   @map("stripe_invoice_id")
  stripeInvoiceItemId String?   @map("stripe_invoice_item_id")

  metadata            Json      @default("{}")

  createdAt           DateTime  @default(now()) @map("created_at")

  @@index([tenantId])
  @@index([subscriptionId])
  @@index([effectiveDate])
  @@index([type])
  @@map("proration_records")
}

model GracePeriodLog {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  tenant          Tenant    @relation(fields: [tenantId], references: [id])

  phase           String
  daysPastDue     Int       @map("days_past_due")
  restrictions    Json
  amountDue       Decimal   @map("amount_due") @db.Decimal(10, 2)

  createdAt       DateTime  @default(now()) @map("created_at")

  @@index([tenantId])
  @@index([createdAt])
  @@map("grace_period_logs")
}
```

### Dunning Service

```typescript
// services/dunning.service.ts
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { EmailService } from './email.service';

export class DunningService {
  private emailService = new EmailService();

  /**
   * Process failed payments and send recovery emails
   */
  async processFailedPayments(): Promise<void> {
    // Get subscriptions that are past due
    const pastDueSubscriptions = await prisma.tenantSubscription.findMany({
      where: { status: 'PAST_DUE' },
      include: {
        tenant: true,
        plan: true,
      },
    });

    for (const subscription of pastDueSubscriptions) {
      const daysPastDue = this.getDaysPastDue(subscription.currentPeriodEnd);

      // Send appropriate dunning email based on days past due
      if (daysPastDue === 1) {
        await this.sendDunningEmail(subscription, 'first');
      } else if (daysPastDue === 3) {
        await this.sendDunningEmail(subscription, 'second');
      } else if (daysPastDue === 7) {
        await this.sendDunningEmail(subscription, 'third');
      } else if (daysPastDue === 14) {
        await this.sendDunningEmail(subscription, 'final');
      } else if (daysPastDue >= 30) {
        // Cancel subscription after 30 days
        await this.cancelForNonPayment(subscription);
      }
    }
  }

  /**
   * Get days past due
   */
  private getDaysPastDue(periodEnd: Date): number {
    const now = new Date();
    const diff = now.getTime() - periodEnd.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Send dunning email
   */
  private async sendDunningEmail(
    subscription: any,
    stage: 'first' | 'second' | 'third' | 'final'
  ): Promise<void> {
    const templates = {
      first: {
        subject: 'Payment failed - Action required',
        message: 'Your recent payment failed. Please update your payment method.',
      },
      second: {
        subject: 'Second notice: Payment still pending',
        message: 'We\'ve been unable to process your payment. Your account may be suspended soon.',
      },
      third: {
        subject: 'Urgent: Account at risk of suspension',
        message: 'Your account will be suspended in 7 days if payment is not received.',
      },
      final: {
        subject: 'Final notice: Account will be suspended',
        message: 'This is your final notice. Your account will be suspended tomorrow.',
      },
    };

    await this.emailService.sendDunningEmail(
      subscription.tenant,
      templates[stage].subject,
      templates[stage].message
    );

    // Log dunning attempt
    await prisma.dunningLog.create({
      data: {
        tenantId: subscription.tenantId,
        subscriptionId: subscription.id,
        stage,
        sentAt: new Date(),
      },
    });
  }

  /**
   * Cancel subscription for non-payment
   */
  private async cancelForNonPayment(subscription: any): Promise<void> {
    // Cancel in Stripe
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);

    // Update local record
    await prisma.tenantSubscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: 'Non-payment',
      },
    });

    // Suspend tenant
    await prisma.tenant.update({
      where: { id: subscription.tenantId },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspendReason: 'Non-payment',
      },
    });

    // Send cancellation email
    await this.emailService.sendAccountSuspendedEmail(
      subscription.tenant,
      'Your account has been suspended due to non-payment.'
    );
  }
}
```

---

## Implementation

### API Routes

```typescript
// app/api/billing/subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getTenantContext } from '@/lib/tenant/context';
import { SubscriptionService } from '@/services/subscription.service';

const subscriptionService = new SubscriptionService();

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  const tenant = getTenantContext();

  const subscription = await prisma.tenantSubscription.findFirst({
    where: {
      tenantId: tenant.id,
      status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
    },
    include: { plan: true },
  });

  return NextResponse.json(subscription);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  const tenant = getTenantContext();
  const body = await request.json();

  const result = await subscriptionService.createSubscription({
    tenantId: tenant.id,
    planId: body.planId,
    billingPeriod: body.billingPeriod,
    paymentMethodId: body.paymentMethodId,
    couponCode: body.couponCode,
  });

  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession();
  const tenant = getTenantContext();
  const body = await request.json();

  const subscription = await subscriptionService.updateSubscription(
    tenant.id,
    body
  );

  return NextResponse.json(subscription);
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession();
  const tenant = getTenantContext();
  const { searchParams } = new URL(request.url);
  const immediately = searchParams.get('immediately') === 'true';

  const subscription = await subscriptionService.cancelSubscription(
    tenant.id,
    immediately
  );

  return NextResponse.json(subscription);
}
```

### Cron Jobs

```typescript
// app/api/cron/billing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DunningService } from '@/services/dunning.service';
import { UsageTrackingService } from '@/services/usage-tracking.service';

const dunningService = new DunningService();
const usageService = new UsageTrackingService();

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Process dunning
    await dunningService.processFailedPayments();

    // Reset monthly usage counters (run on 1st of month)
    const today = new Date();
    if (today.getDate() === 1) {
      // Monthly reset logic
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Billing cron error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
```

---

## Database Schema Reference

```prisma
// Billing-related models in schema.prisma

model SubscriptionPlan {
  id                    String   @id @default(uuid())
  name                  String
  slug                  String   @unique
  description           String?
  tier                  String
  priceMonthly          Decimal  @db.Decimal(10, 2)
  priceYearly           Decimal  @db.Decimal(10, 2)
  features              Json
  limits                Json
  availableTemplates    String[]
  stripeProductId       String?
  stripePriceIdMonthly  String?
  stripePriceIdYearly   String?
  isActive              Boolean  @default(true)
  displayOrder          Int      @default(0)
  metadata              Json?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  subscriptions TenantSubscription[]
  tenants       Tenant[]
}

model TenantSubscription {
  id                   String   @id @default(uuid())
  tenantId             String
  planId               String
  stripeSubscriptionId String   @unique
  status               String   @default("PENDING")
  billingPeriod        String   @default("MONTHLY")
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  trialEndsAt          DateTime?
  cancelAtPeriodEnd    Boolean  @default(false)
  cancelledAt          DateTime?
  cancelReason         String?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  tenant Tenant           @relation(fields: [tenantId], references: [id])
  plan   SubscriptionPlan @relation(fields: [planId], references: [id])

  @@index([tenantId])
  @@index([status])
}

model Payment {
  id                    String    @id @default(uuid())
  tenantId              String
  stripePaymentIntentId String?
  stripeInvoiceId       String?
  amount                Decimal   @db.Decimal(10, 2)
  currency              String    @default("usd")
  status                String
  description           String?
  paidAt                DateTime?
  failureReason         String?
  metadata              Json?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  tenant  Tenant   @relation(fields: [tenantId], references: [id])
  refunds Refund[]

  @@index([tenantId])
  @@index([status])
}

model Refund {
  id             String   @id @default(uuid())
  paymentId      String
  stripeRefundId String
  amount         Decimal  @db.Decimal(10, 2)
  reason         String?
  status         String
  createdAt      DateTime @default(now())

  payment Payment @relation(fields: [paymentId], references: [id])
}

model TenantUsage {
  id          String   @id @default(uuid())
  tenantId    String
  metricName  String
  metricValue Int
  periodStart DateTime @db.Date
  periodEnd   DateTime @db.Date
  recordedAt  DateTime @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, metricName, periodStart])
  @@index([tenantId, metricName])
}

model DunningLog {
  id             String   @id @default(uuid())
  tenantId       String
  subscriptionId String
  stage          String
  sentAt         DateTime
  createdAt      DateTime @default(now())

  @@index([tenantId])
}
```

---

**Document Version**: 3.0 Enterprise Edition
**Last Updated**: December 2024
**Next Document**: [07-church-admin-cms.md](./07-church-admin-cms.md)
