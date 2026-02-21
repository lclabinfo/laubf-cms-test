# Tenant Onboarding System

## Document Version: 3.0 Enterprise Edition

## Overview

The Tenant Onboarding System guides new churches through a streamlined registration and setup process. It includes self-service signup, payment processing, initial configuration, and a setup wizard to help churches get started quickly.

---

## Table of Contents

1. [Onboarding Flow](#onboarding-flow)
2. [Registration Process](#registration-process)
3. [Plan Selection](#plan-selection)
4. [Payment Integration](#payment-integration)
5. [Setup Wizard](#setup-wizard)
6. [Initial Configuration](#initial-configuration)
7. [Welcome Experience](#welcome-experience)

---

## Onboarding Flow

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TENANT ONBOARDING FLOW                        │
└─────────────────────────────────────────────────────────────────────┘

Step 1: Landing                Step 2: Registration
┌─────────────────┐           ┌─────────────────┐
│  Marketing Site │           │  Create Account │
│  - Features     │ ────────► │  - Email        │
│  - Pricing      │           │  - Password     │
│  - Testimonials │           │  - Church Name  │
└─────────────────┘           └─────────────────┘
                                      │
                                      ▼
Step 3: Verification          Step 4: Subscription Choice
┌─────────────────┐           ┌─────────────────┐
│  Email Verify   │           │  Choose Type    │
│  - Send code    │ ────────► │  - Plan-based   │
│  - Confirm      │           │  - À la carte   │
└─────────────────┘           └─────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
Step 4a: Plan Selection        Step 4b: Module Selection
┌─────────────────┐           ┌─────────────────┐
│  Choose Plan    │           │  Select Modules │
│  - Starter      │           │  - Website      │
│  - Growth       │           │  - Giving       │
│  - Pro          │           │  - Members      │
│  - Enterprise   │           │  - Events +more │
└─────────────────┘           └─────────────────┘
                    │                                   │
                    └─────────────────┬─────────────────┘
                                      ▼
Step 5: Payment               Step 6: Setup Wizard
┌─────────────────┐           ┌─────────────────┐
│  Payment Info   │           │  Configure      │
│  - Card/ACH     │ ────────► │  - Subdomain    │
│  - Billing addr │           │  - Template     │
│  - Trial opt    │           │  - Basic info   │
└─────────────────┘           └─────────────────┘
                                      │
                                      ▼
Step 7: Provisioning          Step 8: Welcome
┌─────────────────┐           ┌─────────────────┐
│  Create Tenant  │           │  Dashboard      │
│  - Database     │ ────────► │  - Tutorial     │
│  - Storage      │           │  - Checklist    │
│  - DNS          │           │  - Support      │
└─────────────────┘           └─────────────────┘
```

### Onboarding Steps

| Step | Name | Duration | Skip-able |
|------|------|----------|-----------|
| 1 | Landing | N/A | N/A |
| 2 | Registration | 1 min | No |
| 3 | Email Verification | 30 sec | No |
| 4 | Subscription Choice | 30 sec | No |
| 4a | Plan Selection | 1 min | If modular chosen |
| 4b | Module Selection | 2 min | If plan chosen |
| 5 | Payment | 2 min | Trial only |
| 6 | Setup Wizard | 5 min | Partially |
| 7 | Provisioning | Auto | No |
| 8 | Welcome | N/A | N/A |

> 📘 Churches choose between **Plan-based** subscription (predefined tiers) or **Modular** subscription (à la carte modules). See [21-modular-solutions.md](./21-modular-solutions.md) for details.

---

## Registration Process

### Registration Page

```typescript
// app/(marketing)/signup/page.tsx
import { Metadata } from 'next';
import { SignupForm } from '@/components/marketing/SignupForm';
import { SocialProof } from '@/components/marketing/SocialProof';

export const metadata: Metadata = {
  title: 'Start Your Free Trial | Digital Church Platform',
  description: 'Create your church website in minutes. Start your 14-day free trial today.',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Start Your Free Trial
            </h1>
            <p className="mt-2 text-gray-600">
              Create your church website in minutes. No credit card required.
            </p>
          </div>

          <SignupForm />

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>

      {/* Right Side - Social Proof */}
      <div className="hidden lg:flex flex-1 bg-blue-600 items-center justify-center p-8">
        <SocialProof />
      </div>
    </div>
  );
}
```

### Registration Form Component

```typescript
// components/marketing/SignupForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Church, Mail, Lock, User } from 'lucide-react';

const signupSchema = z.object({
  churchName: z.string()
    .min(2, 'Church name must be at least 2 characters')
    .max(100, 'Church name is too long'),
  adminName: z.string()
    .min(2, 'Name must be at least 2 characters'),
  email: z.string()
    .email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  acceptTerms: z.boolean()
    .refine(val => val === true, 'You must accept the terms'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      churchName: '',
      adminName: '',
      email: '',
      password: '',
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create account');
      }

      // Redirect to email verification
      router.push(`/signup/verify?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="churchName">Church Name</Label>
        <div className="relative">
          <Church className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="churchName"
            placeholder="First Baptist Church"
            className="pl-10"
            {...form.register('churchName')}
          />
        </div>
        {form.formState.errors.churchName && (
          <p className="text-sm text-red-600">
            {form.formState.errors.churchName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminName">Your Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="adminName"
            placeholder="John Smith"
            className="pl-10"
            {...form.register('adminName')}
          />
        </div>
        {form.formState.errors.adminName && (
          <p className="text-sm text-red-600">
            {form.formState.errors.adminName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="pastor@church.org"
            className="pl-10"
            {...form.register('email')}
          />
        </div>
        {form.formState.errors.email && (
          <p className="text-sm text-red-600">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="password"
            type="password"
            placeholder="Create a strong password"
            className="pl-10"
            {...form.register('password')}
          />
        </div>
        {form.formState.errors.password && (
          <p className="text-sm text-red-600">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="acceptTerms"
          checked={form.watch('acceptTerms')}
          onCheckedChange={(checked) =>
            form.setValue('acceptTerms', checked as boolean)
          }
        />
        <label htmlFor="acceptTerms" className="text-sm text-gray-600">
          I agree to the{' '}
          <a href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </label>
      </div>
      {form.formState.errors.acceptTerms && (
        <p className="text-sm text-red-600">
          {form.formState.errors.acceptTerms.message}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          'Start Free Trial'
        )}
      </Button>

      <p className="text-center text-xs text-gray-500">
        14-day free trial. No credit card required.
      </p>
    </form>
  );
}
```

### Registration API

```typescript
// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { hash } from 'bcryptjs';
import { generateVerificationCode } from '@/lib/utils/crypto';
import { sendVerificationEmail } from '@/lib/email/verification';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { churchName, adminName, email, password } = body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Generate subdomain from church name
    const subdomain = generateSubdomain(churchName);

    // Check if subdomain is available
    const existingTenant = await prisma.tenant.findFirst({
      where: { subdomain },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'This church name is already taken. Please choose another.' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create pending registration
    const pendingRegistration = await prisma.pendingRegistration.create({
      data: {
        churchName,
        adminName,
        email: email.toLowerCase(),
        passwordHash,
        subdomain,
        verificationCode,
        verificationExpires,
      },
    });

    // Send verification email
    await sendVerificationEmail({
      to: email,
      name: adminName,
      code: verificationCode,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
      registrationId: pendingRegistration.id,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}

function generateSubdomain(churchName: string): string {
  return churchName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 30);
}
```

---

## Plan Selection

### Plan Selection Page

```typescript
// app/(onboarding)/signup/plans/page.tsx
import { prisma } from '@/lib/db/client';
import { PlanSelector } from '@/components/onboarding/PlanSelector';
import { PlanComparison } from '@/components/onboarding/PlanComparison';

interface PageProps {
  searchParams: {
    registrationId: string;
  };
}

export default async function PlansPage({ searchParams }: PageProps) {
  const plans = await prisma.plan.findMany({
    where: { isActive: true, isPublic: true },
    orderBy: { displayOrder: 'asc' },
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Choose Your Plan
          </h1>
          <p className="mt-2 text-gray-600">
            Start with a 14-day free trial. Cancel anytime.
          </p>
        </div>

        <PlanSelector
          plans={plans}
          registrationId={searchParams.registrationId}
        />

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Compare Plans
          </h2>
          <PlanComparison plans={plans} />
        </div>
      </div>
    </div>
  );
}
```

### Plan Card Component

```typescript
// components/onboarding/PlanCard.tsx
'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  tier: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlighted: boolean;
}

interface PlanCardProps {
  plan: Plan;
  isSelected: boolean;
  billingPeriod: 'monthly' | 'yearly';
  onSelect: () => void;
}

export function PlanCard({
  plan,
  isSelected,
  billingPeriod,
  onSelect,
}: PlanCardProps) {
  const price = billingPeriod === 'monthly'
    ? plan.monthlyPrice
    : plan.yearlyPrice / 12;

  const savings = Math.round(
    ((plan.monthlyPrice * 12 - plan.yearlyPrice) / (plan.monthlyPrice * 12)) * 100
  );

  return (
    <Card
      className={cn(
        'relative cursor-pointer transition-all',
        isSelected && 'ring-2 ring-blue-500',
        plan.highlighted && 'border-blue-500'
      )}
      onClick={onSelect}
    >
      {plan.highlighted && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500">
          Most Popular
        </Badge>
      )}

      <CardHeader className="text-center pb-2">
        <h3 className="text-xl font-bold">{plan.name}</h3>
        <p className="text-sm text-gray-500">{plan.description}</p>
      </CardHeader>

      <CardContent>
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-bold">
              ${price.toFixed(0)}
            </span>
            <span className="text-gray-500 ml-1">/month</span>
          </div>
          {billingPeriod === 'yearly' && savings > 0 && (
            <p className="text-sm text-green-600 mt-1">
              Save {savings}% with yearly billing
            </p>
          )}
        </div>

        <ul className="space-y-3 mb-6">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-600">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full"
          variant={isSelected ? 'default' : 'outline'}
        >
          {isSelected ? 'Selected' : 'Select Plan'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## Module Selection (À La Carte)

For churches choosing the modular subscription model, this step replaces Plan Selection.

### Module Selection Page

```typescript
// app/(onboarding)/signup/modules/page.tsx
import { prisma } from '@/lib/db/client';
import { ModuleSelector } from '@/components/onboarding/ModuleSelector';

interface PageProps {
  searchParams: {
    registrationId: string;
  };
}

export default async function ModulesPage({ searchParams }: PageProps) {
  const modules = await prisma.solutionModule.findMany({
    where: { isActive: true },
    include: {
      dependencies: {
        include: { requiresModule: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  const bundles = await prisma.moduleBundle.findMany({
    where: { isActive: true },
    include: { modules: { include: { module: true } } },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">
            Build Your Perfect Solution
          </h1>
          <p className="mt-2 text-gray-600">
            Select only the modules your church needs. Add more anytime.
          </p>
        </div>

        <ModuleSelector
          modules={modules}
          bundles={bundles}
          registrationId={searchParams.registrationId}
        />
      </div>
    </div>
  );
}
```

### Module Selector Component

```typescript
// components/onboarding/ModuleSelector.tsx
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Module {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  basePrice: number;
  category: string;
  icon: string;
  isPopular: boolean;
  dependencies: Array<{
    requiresModule: { id: string; name: string };
  }>;
}

interface Bundle {
  id: string;
  name: string;
  description: string;
  discountPercent: number;
  modules: Array<{ module: Module }>;
}

interface ModuleSelectorProps {
  modules: Module[];
  bundles: Bundle[];
  registrationId: string;
}

export function ModuleSelector({ modules, bundles, registrationId }: ModuleSelectorProps) {
  const router = useRouter();
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Calculate pricing with bundle discounts
  const pricing = useMemo(() => {
    const baseTotal = selectedModules.reduce((sum, moduleId) => {
      const module = modules.find(m => m.id === moduleId);
      return sum + (module?.basePrice || 0);
    }, 0);

    let discount = 0;
    if (selectedModules.length >= 8) discount = 0.25;
    else if (selectedModules.length >= 5) discount = 0.15;
    else if (selectedModules.length >= 3) discount = 0.10;

    const discountAmount = baseTotal * discount;
    const finalTotal = baseTotal - discountAmount;

    return { baseTotal, discount, discountAmount, finalTotal };
  }, [selectedModules, modules]);

  // Validate dependencies
  const validateSelection = (moduleIds: string[]): string[] => {
    const errors: string[] = [];

    for (const moduleId of moduleIds) {
      const module = modules.find(m => m.id === moduleId);
      if (!module) continue;

      for (const dep of module.dependencies) {
        if (!moduleIds.includes(dep.requiresModule.id)) {
          errors.push(
            `${module.name} requires ${dep.requiresModule.name}`
          );
        }
      }
    }

    return errors;
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev => {
      const newSelection = prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId];

      setValidationErrors(validateSelection(newSelection));
      return newSelection;
    });
  };

  const applyBundle = (bundle: Bundle) => {
    const bundleModuleIds = bundle.modules.map(m => m.module.id);
    setSelectedModules(bundleModuleIds);
    setValidationErrors(validateSelection(bundleModuleIds));
  };

  const handleContinue = () => {
    if (validationErrors.length > 0 || selectedModules.length === 0) return;

    const params = new URLSearchParams({
      registrationId,
      type: 'modular',
      modules: selectedModules.join(','),
    });

    router.push(`/signup/payment?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      {/* Quick Bundles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bundles.map(bundle => (
          <Card
            key={bundle.id}
            className="cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => applyBundle(bundle)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-lg">{bundle.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-2">{bundle.description}</p>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Save {bundle.discountPercent}%
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map(module => {
          const isSelected = selectedModules.includes(module.id);
          const hasError = validationErrors.some(e => e.includes(module.name));

          return (
            <Card
              key={module.id}
              className={cn(
                'cursor-pointer transition-all',
                isSelected && 'ring-2 ring-blue-500 bg-blue-50',
                hasError && 'ring-2 ring-red-500'
              )}
              onClick={() => toggleModule(module.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{module.icon}</span>
                      <h3 className="font-semibold">{module.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {module.shortDescription}
                    </p>
                    <p className="text-lg font-bold mt-2">
                      ${module.basePrice}/mo
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                {module.isPopular && (
                  <Badge className="mt-2 bg-blue-100 text-blue-700">
                    Popular
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Missing dependencies:</span>
          </div>
          <ul className="mt-2 list-disc list-inside text-sm text-red-600">
            {validationErrors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Pricing Summary */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {selectedModules.length} modules selected
              </p>
              {pricing.discount > 0 && (
                <p className="text-sm text-green-600">
                  {(pricing.discount * 100).toFixed(0)}% bundle discount applied
                </p>
              )}
            </div>
            <div className="text-right">
              {pricing.discountAmount > 0 && (
                <p className="text-sm text-gray-500 line-through">
                  ${pricing.baseTotal.toFixed(2)}/mo
                </p>
              )}
              <p className="text-2xl font-bold">
                ${pricing.finalTotal.toFixed(2)}/mo
              </p>
            </div>
          </div>
          <Button
            className="w-full mt-4"
            size="lg"
            disabled={selectedModules.length === 0 || validationErrors.length > 0}
            onClick={handleContinue}
          >
            Continue to Payment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Subscription Type Choice

```typescript
// components/onboarding/SubscriptionTypeChoice.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Package, Puzzle } from 'lucide-react';

interface SubscriptionTypeChoiceProps {
  registrationId: string;
}

export function SubscriptionTypeChoice({ registrationId }: SubscriptionTypeChoiceProps) {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          How would you like to subscribe?
        </h1>
        <p className="mt-2 text-gray-600">
          Choose the subscription model that works best for your church
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan-based Option */}
        <Card className="cursor-pointer hover:border-blue-500 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              <CardTitle>Choose a Plan</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Select from our pre-configured plans with bundled features at discounted prices.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                Simple, predictable pricing
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                All features included in tier
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                Easy to upgrade anytime
              </li>
            </ul>
            <Button
              className="w-full"
              onClick={() => router.push(`/signup/plans?registrationId=${registrationId}`)}
            >
              View Plans
            </Button>
          </CardContent>
        </Card>

        {/* Modular Option */}
        <Card className="cursor-pointer hover:border-blue-500 transition-colors border-2 border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Puzzle className="h-8 w-8 text-purple-600" />
              <CardTitle>Build Your Own</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Pick only the modules your church needs. Pay for what you use.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                Flexible, customizable solution
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                Bundle discounts available
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                Add/remove modules anytime
              </li>
            </ul>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => router.push(`/signup/modules?registrationId=${registrationId}`)}
            >
              Select Modules
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

> 📘 See [21-modular-solutions.md](./21-modular-solutions.md) for complete modular architecture, pricing calculations, and Stripe integration details.

---

## Payment Integration

### Payment Page

```typescript
// app/(onboarding)/signup/payment/page.tsx
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { PaymentForm } from '@/components/onboarding/PaymentForm';
import { OrderSummary } from '@/components/onboarding/OrderSummary';

interface PageProps {
  searchParams: {
    registrationId: string;
    planId: string;
    billing: string;
  };
}

export default async function PaymentPage({ searchParams }: PageProps) {
  const { registrationId, planId, billing } = searchParams;

  if (!registrationId || !planId) {
    redirect('/signup');
  }

  const [registration, plan] = await Promise.all([
    prisma.pendingRegistration.findUnique({
      where: { id: registrationId },
    }),
    prisma.plan.findUnique({
      where: { id: planId },
    }),
  ]);

  if (!registration || !plan) {
    redirect('/signup');
  }

  const billingPeriod = billing === 'yearly' ? 'yearly' : 'monthly';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Complete Your Setup
          </h1>
          <p className="mt-2 text-gray-600">
            Start your 14-day free trial today
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <PaymentForm
              registrationId={registrationId}
              planId={planId}
              billingPeriod={billingPeriod}
            />
          </div>
          <div>
            <OrderSummary
              plan={plan}
              billingPeriod={billingPeriod}
              churchName={registration.churchName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Stripe Payment Form

```typescript
// components/onboarding/PaymentForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Shield } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);

interface PaymentFormProps {
  registrationId: string;
  planId: string;
  billingPeriod: 'monthly' | 'yearly';
}

export function PaymentForm({
  registrationId,
  planId,
  billingPeriod,
}: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Create SetupIntent when component mounts
  useEffect(() => {
    fetch('/api/stripe/setup-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId }),
    })
      .then(res => res.json())
      .then(data => setClientSecret(data.clientSecret));
  }, [registrationId]);

  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-500">Setting up payment...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentFormContent
        registrationId={registrationId}
        planId={planId}
        billingPeriod={billingPeriod}
      />
    </Elements>
  );
}

function PaymentFormContent({
  registrationId,
  planId,
  billingPeriod,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);
    setError(null);

    try {
      // Confirm SetupIntent
      const { error: stripeError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/signup/complete`,
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Complete registration
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          planId,
          billingPeriod,
          setupIntentId: setupIntent?.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      // Redirect to setup wizard
      router.push(`/signup/setup?tenantId=${result.tenantId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <PaymentElement />

          <Button
            type="submit"
            className="w-full"
            disabled={!stripe || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Start Free Trial'
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>Secured by Stripe. Your card won't be charged until trial ends.</span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

---

## Setup Wizard

### Setup Wizard Flow

```typescript
// app/(onboarding)/signup/setup/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SetupProgress } from '@/components/onboarding/SetupProgress';
import { SubdomainStep } from '@/components/onboarding/steps/SubdomainStep';
import { TemplateStep } from '@/components/onboarding/steps/TemplateStep';
import { BrandingStep } from '@/components/onboarding/steps/BrandingStep';
import { BasicInfoStep } from '@/components/onboarding/steps/BasicInfoStep';
import { ReviewStep } from '@/components/onboarding/steps/ReviewStep';

const STEPS = [
  { id: 'subdomain', title: 'Website Address', component: SubdomainStep },
  { id: 'template', title: 'Choose Template', component: TemplateStep },
  { id: 'branding', title: 'Branding', component: BrandingStep },
  { id: 'info', title: 'Church Info', component: BasicInfoStep },
  { id: 'review', title: 'Review', component: ReviewStep },
];

export default function SetupWizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState({
    subdomain: '',
    templateId: 'default',
    branding: {
      primaryColor: '#0ea5e9',
      secondaryColor: '#1e293b',
      logo: null,
    },
    churchInfo: {
      address: '',
      phone: '',
      serviceTime: '',
      pastor: '',
    },
  });

  const handleStepComplete = (data: Partial<typeof setupData>) => {
    setSetupData(prev => ({ ...prev, ...data }));

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    // Save setup data
    await fetch(`/api/tenants/${tenantId}/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setupData),
    });

    // Redirect to dashboard
    router.push('/admin?welcome=true');
  };

  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Progress */}
        <SetupProgress
          steps={STEPS}
          currentStep={currentStep}
        />

        {/* Step Content */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-8">
          <CurrentStepComponent
            data={setupData}
            tenantId={tenantId!}
            onComplete={handleStepComplete}
            onBack={handleBack}
            isLastStep={currentStep === STEPS.length - 1}
            onFinish={handleComplete}
          />
        </div>
      </div>
    </div>
  );
}
```

### Template Selection Step

```typescript
// components/onboarding/steps/TemplateStep.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  category: string;
  popular: boolean;
}

interface TemplateStepProps {
  data: { templateId: string };
  onComplete: (data: { templateId: string }) => void;
  onBack: () => void;
}

export function TemplateStep({ data, onComplete, onBack }: TemplateStepProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState(data.templateId);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(setTemplates);
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Choose Your Template</h2>
        <p className="text-gray-500 mt-2">
          Select a design that fits your church's style. You can customize it later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card
            key={template.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              selectedId === template.id && 'ring-2 ring-blue-500'
            )}
            onClick={() => setSelectedId(template.id)}
          >
            <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
              <img
                src={template.preview}
                alt={template.name}
                className="w-full h-full object-cover"
              />
              {template.popular && (
                <Badge className="absolute top-2 right-2 bg-blue-500">
                  Popular
                </Badge>
              )}
              {selectedId === template.id && (
                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                  <Check className="h-12 w-12 text-blue-600 bg-white rounded-full p-2" />
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold">{template.name}</h3>
              <p className="text-sm text-gray-500">{template.description}</p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewUrl(`/templates/${template.id}/preview`);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={() => onComplete({ templateId: selectedId })}>
          Continue
        </Button>
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <TemplatePreviewModal
          url={previewUrl}
          onClose={() => setPreviewUrl(null)}
        />
      )}
    </div>
  );
}
```

---

## Initial Configuration

### Provisioning Service

```typescript
// lib/onboarding/provisioning.ts
import { prisma } from '@/lib/db/client';
import { createStripeCustomer, createSubscription } from '@/lib/stripe';
import { sendWelcomeEmail } from '@/lib/email/welcome';
import { initializeStorage } from '@/lib/storage';

export interface ProvisioningResult {
  success: boolean;
  tenantId?: string;
  error?: string;
}

export async function provisionTenant(params: {
  registrationId: string;
  planId: string;
  billingPeriod: 'monthly' | 'yearly';
  paymentMethodId: string;
}): Promise<ProvisioningResult> {
  const { registrationId, planId, billingPeriod, paymentMethodId } = params;

  try {
    // Get registration data
    const registration = await prisma.pendingRegistration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Stripe customer
      const stripeCustomer = await createStripeCustomer({
        email: registration.email,
        name: registration.churchName,
        metadata: {
          churchName: registration.churchName,
          subdomain: registration.subdomain,
        },
      });

      // 2. Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: registration.churchName,
          subdomain: registration.subdomain,
          status: 'TRIAL',
          planId: plan.id,
          stripeCustomerId: stripeCustomer.id,
          settings: getDefaultSettings(),
          theme: getDefaultTheme(),
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },
      });

      // 3. Create admin user
      const user = await tx.user.create({
        data: {
          name: registration.adminName,
          email: registration.email,
          passwordHash: registration.passwordHash,
          role: 'SUPERUSER',
          tenantId: tenant.id,
          emailVerified: new Date(),
        },
      });

      // 4. Create Stripe subscription (trial)
      const stripeSubscription = await createSubscription({
        customerId: stripeCustomer.id,
        priceId: billingPeriod === 'yearly' ? plan.stripePriceYearly : plan.stripePriceMonthly,
        paymentMethodId,
        trialDays: 14,
        metadata: {
          tenantId: tenant.id,
          planId: plan.id,
        },
      });

      // 5. Create subscription record
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          stripeSubscriptionId: stripeSubscription.id,
          status: 'TRIALING',
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          billingPeriod,
        },
      });

      // 6. Create default pages
      await createDefaultPages(tx, tenant.id);

      // 7. Create default menus
      await createDefaultMenus(tx, tenant.id);

      // 8. Initialize storage folder
      await initializeStorage(tenant.id);

      // 9. Delete pending registration
      await tx.pendingRegistration.delete({
        where: { id: registrationId },
      });

      return { tenant, user };
    });

    // Send welcome email (outside transaction)
    await sendWelcomeEmail({
      to: registration.email,
      name: registration.adminName,
      churchName: registration.churchName,
      subdomain: registration.subdomain,
    });

    return {
      success: true,
      tenantId: result.tenant.id,
    };
  } catch (error) {
    console.error('Provisioning error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Provisioning failed',
    };
  }
}

async function createDefaultPages(tx: any, tenantId: string) {
  const defaultPages = [
    { slug: 'home', title: 'Home', isHomepage: true },
    { slug: 'about', title: 'About Us', isHomepage: false },
    { slug: 'sermons', title: 'Sermons', isHomepage: false },
    { slug: 'events', title: 'Events', isHomepage: false },
    { slug: 'contact', title: 'Contact', isHomepage: false },
  ];

  for (const page of defaultPages) {
    await tx.page.create({
      data: {
        tenantId,
        slug: page.slug,
        title: page.title,
        isHomepage: page.isHomepage,
        status: 'PUBLISHED',
        content: [],
      },
    });
  }
}

async function createDefaultMenus(tx: any, tenantId: string) {
  const headerMenu = await tx.menu.create({
    data: {
      tenantId,
      name: 'Header Navigation',
      location: 'HEADER',
    },
  });

  const menuItems = [
    { label: 'Home', url: '/', order: 0 },
    { label: 'About', url: '/about', order: 1 },
    { label: 'Sermons', url: '/sermons', order: 2 },
    { label: 'Events', url: '/events', order: 3 },
    { label: 'Give', url: '/give', order: 4 },
    { label: 'Contact', url: '/contact', order: 5 },
  ];

  for (const item of menuItems) {
    await tx.menuItem.create({
      data: {
        menuId: headerMenu.id,
        label: item.label,
        url: item.url,
        displayOrder: item.order,
      },
    });
  }
}

function getDefaultSettings() {
  return {
    timezone: 'America/Chicago',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'USD',
    emailNotifications: true,
    maintenanceMode: false,
  };
}

function getDefaultTheme() {
  return {
    primaryColor: '#0ea5e9',
    secondaryColor: '#1e293b',
    accentColor: '#f97316',
    logoUrl: null,
    faviconUrl: null,
    fontFamily: 'Inter',
  };
}
```

---

## Welcome Experience

### Welcome Dashboard

```typescript
// app/admin/page.tsx
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getServerTenant } from '@/lib/tenant/server-context';
import { WelcomeBanner } from '@/components/admin/WelcomeBanner';
import { SetupChecklist } from '@/components/admin/SetupChecklist';
import { QuickActions } from '@/components/admin/QuickActions';
import { DashboardStats } from '@/components/admin/DashboardStats';

interface PageProps {
  searchParams: { welcome?: string };
}

export default async function AdminDashboard({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const tenant = await getServerTenant();

  if (!tenant) {
    redirect('/');
  }

  const isNewUser = searchParams.welcome === 'true';
  const setupProgress = await getSetupProgress(tenant.id);

  return (
    <div className="space-y-6">
      {/* Welcome Banner (for new users) */}
      {isNewUser && (
        <WelcomeBanner
          churchName={tenant.name}
          userName={session.user.name || 'there'}
        />
      )}

      {/* Setup Checklist (if incomplete) */}
      {setupProgress.percentage < 100 && (
        <SetupChecklist progress={setupProgress} />
      )}

      {/* Quick Actions */}
      <QuickActions />

      {/* Dashboard Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats tenantId={tenant.id} />
      </Suspense>
    </div>
  );
}

async function getSetupProgress(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      _count: {
        select: {
          sermons: true,
          events: true,
          users: true,
          media: true,
        },
      },
      templateCustomization: true,
    },
  });

  const steps = [
    { id: 'template', label: 'Choose a template', completed: !!tenant?.templateCustomization },
    { id: 'logo', label: 'Upload your logo', completed: !!tenant?.theme?.logoUrl },
    { id: 'service', label: 'Add service times', completed: !!tenant?.settings?.serviceTime },
    { id: 'sermon', label: 'Upload a sermon', completed: (tenant?._count.sermons || 0) > 0 },
    { id: 'event', label: 'Create an event', completed: (tenant?._count.events || 0) > 0 },
    { id: 'user', label: 'Invite team members', completed: (tenant?._count.users || 0) > 1 },
    { id: 'giving', label: 'Set up giving', completed: !!tenant?.settings?.givingEnabled },
  ];

  const completedCount = steps.filter(s => s.completed).length;

  return {
    steps,
    completedCount,
    totalCount: steps.length,
    percentage: Math.round((completedCount / steps.length) * 100),
  };
}
```

### Setup Checklist Component

```typescript
// components/admin/SetupChecklist.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Check, Circle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SetupStep {
  id: string;
  label: string;
  completed: boolean;
}

interface SetupChecklistProps {
  progress: {
    steps: SetupStep[];
    completedCount: number;
    totalCount: number;
    percentage: number;
  };
}

export function SetupChecklist({ progress }: SetupChecklistProps) {
  const stepLinks: Record<string, string> = {
    template: '/admin/settings/appearance',
    logo: '/admin/settings/branding',
    service: '/admin/settings/general',
    sermon: '/admin/sermons/new',
    event: '/admin/events/new',
    user: '/admin/settings/team',
    giving: '/admin/settings/giving',
  };

  const nextIncompleteStep = progress.steps.find(s => !s.completed);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Getting Started</CardTitle>
          <span className="text-sm text-gray-500">
            {progress.completedCount} of {progress.totalCount} complete
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={progress.percentage} className="mb-6" />

        <div className="space-y-3">
          {progress.steps.map(step => (
            <Link
              key={step.id}
              href={stepLinks[step.id]}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {step.completed ? (
                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
              ) : (
                <div className="h-6 w-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <Circle className="h-3 w-3 text-gray-300" />
                </div>
              )}
              <span className={step.completed ? 'text-gray-500 line-through' : 'text-gray-900'}>
                {step.label}
              </span>
              {!step.completed && (
                <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
              )}
            </Link>
          ))}
        </div>

        {nextIncompleteStep && (
          <div className="mt-6 pt-6 border-t">
            <Button asChild>
              <Link href={stepLinks[nextIncompleteStep.id]}>
                Continue Setup
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Email Templates

### Welcome Email

```typescript
// lib/email/templates/welcome.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  churchName: string;
  adminName: string;
  subdomain: string;
  loginUrl: string;
}

export function WelcomeEmail({
  churchName,
  adminName,
  subdomain,
  loginUrl,
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Digital Church Platform!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Digital Church!</Heading>

          <Text style={text}>
            Hi {adminName},
          </Text>

          <Text style={text}>
            Congratulations! Your church website for <strong>{churchName}</strong> is now ready.
            Your 14-day free trial has started.
          </Text>

          <Section style={buttonContainer}>
            <Link href={loginUrl} style={button}>
              Go to Your Dashboard
            </Link>
          </Section>

          <Text style={text}>
            Your website URL: <Link href={`https://${subdomain}.digitalchurch.com`}>
              {subdomain}.digitalchurch.com
            </Link>
          </Text>

          <Section style={checklist}>
            <Heading as="h2" style={h2}>Quick Start Checklist:</Heading>
            <Text style={listItem}>1. Choose a template for your site</Text>
            <Text style={listItem}>2. Upload your church logo</Text>
            <Text style={listItem}>3. Add your first sermon</Text>
            <Text style={listItem}>4. Create an upcoming event</Text>
            <Text style={listItem}>5. Invite your team members</Text>
          </Section>

          <Text style={footer}>
            Need help? Reply to this email or visit our{' '}
            <Link href="https://docs.digitalchurch.com">Help Center</Link>.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
  marginBottom: '24px',
};

const h2 = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: '600',
  marginBottom: '16px',
};

const text = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '24px',
  marginBottom: '16px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#0ea5e9',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '600',
  padding: '12px 24px',
  textDecoration: 'none',
};

const checklist = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '24px',
  marginTop: '32px',
};

const listItem = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '24px',
  marginBottom: '8px',
};

const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  marginTop: '32px',
  textAlign: 'center' as const,
};
```

---

## Metrics & Analytics

### Onboarding Funnel

| Stage | Metric | Target |
|-------|--------|--------|
| Visit | Unique visitors to signup | - |
| Start | Started registration | >50% of visitors |
| Verify | Completed email verification | >80% of started |
| Plan | Selected a plan | >95% of verified |
| Payment | Added payment method | >90% of plan selected |
| Setup | Completed setup wizard | >85% of payment |
| Active | Used the platform | >70% of setup |

### Tracking Events

```typescript
// lib/analytics/onboarding.ts
import { analytics } from '@/lib/analytics';

export const OnboardingEvents = {
  // Registration
  signupStarted: () =>
    analytics.track('onboarding_signup_started'),

  signupCompleted: (registrationId: string) =>
    analytics.track('onboarding_signup_completed', { registrationId }),

  // Verification
  verificationSent: (email: string) =>
    analytics.track('onboarding_verification_sent', { email }),

  verificationCompleted: (registrationId: string) =>
    analytics.track('onboarding_verification_completed', { registrationId }),

  // Plan Selection
  planViewed: (planId: string) =>
    analytics.track('onboarding_plan_viewed', { planId }),

  planSelected: (planId: string, billingPeriod: string) =>
    analytics.track('onboarding_plan_selected', { planId, billingPeriod }),

  // Payment
  paymentStarted: () =>
    analytics.track('onboarding_payment_started'),

  paymentCompleted: (amount: number) =>
    analytics.track('onboarding_payment_completed', { amount }),

  paymentFailed: (error: string) =>
    analytics.track('onboarding_payment_failed', { error }),

  // Setup Wizard
  setupStarted: (tenantId: string) =>
    analytics.track('onboarding_setup_started', { tenantId }),

  setupStepCompleted: (step: string) =>
    analytics.track('onboarding_setup_step_completed', { step }),

  setupCompleted: (tenantId: string) =>
    analytics.track('onboarding_setup_completed', { tenantId }),

  // Trial
  trialStarted: (tenantId: string, planId: string) =>
    analytics.track('trial_started', { tenantId, planId }),

  trialConverted: (tenantId: string) =>
    analytics.track('trial_converted', { tenantId }),

  trialExpired: (tenantId: string) =>
    analytics.track('trial_expired', { tenantId }),
};
```

---

**Document Version**: 3.0 Enterprise Edition
**Last Updated**: December 2024
**Maintained By**: Digital Church Platform Team
