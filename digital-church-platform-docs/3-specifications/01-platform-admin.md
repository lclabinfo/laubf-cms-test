# Platform Administration Console

## Document Version: 3.0 Enterprise Edition

## Overview

The Platform Administration Console is the SaaS management interface for Digital Church Platform operators. It provides comprehensive tools for managing tenants (churches), subscription plans, billing, analytics, support, and system health monitoring.

---

## Table of Contents

1. [Dashboard Overview](#dashboard-overview)
2. [Tenant Management](#tenant-management)
3. [Plan & Subscription Management](#plan--subscription-management)
4. [Billing & Revenue](#billing--revenue)
5. [Analytics Dashboard](#analytics-dashboard)
6. [Support Ticket System](#support-ticket-system)
7. [System Monitoring](#system-monitoring)
8. [Platform Settings](#platform-settings)

---

## Directory Structure

```
app/platform/
├── layout.tsx                    # Platform admin layout
├── page.tsx                      # Main dashboard
├── tenants/
│   ├── page.tsx                  # Tenant list
│   ├── new/page.tsx              # Create tenant
│   └── [id]/
│       ├── page.tsx              # Tenant detail
│       ├── settings/page.tsx     # Tenant settings
│       ├── billing/page.tsx      # Billing history
│       └── activity/page.tsx     # Activity log
├── plans/
│   ├── page.tsx                  # Plan list
│   ├── new/page.tsx              # Create plan
│   └── [id]/page.tsx             # Edit plan
├── users/
│   ├── page.tsx                  # All users
│   └── [id]/page.tsx             # User detail
├── billing/
│   ├── page.tsx                  # Billing dashboard
│   ├── invoices/page.tsx         # Invoices
│   └── subscriptions/page.tsx    # Subscriptions
├── analytics/
│   ├── page.tsx                  # Analytics overview
│   ├── revenue/page.tsx          # Revenue analytics
│   └── usage/page.tsx            # Usage analytics
├── support/
│   ├── page.tsx                  # Support tickets
│   └── [id]/page.tsx             # Ticket detail
├── settings/
│   ├── page.tsx                  # General settings
│   ├── email/page.tsx            # Email configuration
│   ├── security/page.tsx         # Security settings
│   └── integrations/page.tsx     # Third-party integrations
└── system/
    ├── page.tsx                  # System status
    ├── logs/page.tsx             # System logs
    └── maintenance/page.tsx      # Maintenance mode
```

---

## Dashboard Overview

### Main Dashboard

The platform dashboard provides a real-time overview of key metrics:

```typescript
// app/platform/page.tsx
import { Suspense } from 'react';
import { PlatformStats } from '@/components/platform/dashboard/PlatformStats';
import { RevenueChart } from '@/components/platform/dashboard/RevenueChart';
import { TenantGrowthChart } from '@/components/platform/dashboard/TenantGrowthChart';
import { RecentTenants } from '@/components/platform/dashboard/RecentTenants';
import { SystemHealth } from '@/components/platform/dashboard/SystemHealth';
import { RecentActivity } from '@/components/platform/dashboard/RecentActivity';
import { Skeleton } from '@/components/ui/skeleton';

export default async function PlatformDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-500">Overview of your platform performance</p>
      </div>

      {/* Key Metrics */}
      <Suspense fallback={<StatsSkeleton />}>
        <PlatformStats />
      </Suspense>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <TenantGrowthChart />
        </Suspense>
      </div>

      {/* Activity & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<CardSkeleton />}>
            <RecentTenants />
          </Suspense>
        </div>
        <div className="space-y-6">
          <Suspense fallback={<CardSkeleton />}>
            <SystemHealth />
          </Suspense>
          <Suspense fallback={<CardSkeleton />}>
            <RecentActivity />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
```

### Key Metrics Cards

| Metric | Description | Target |
|--------|-------------|--------|
| Total Churches | All registered tenants | Growth tracking |
| Active Churches | Currently active subscriptions | >90% of total |
| Monthly Revenue | Current month billing | MoM growth |
| Growth Rate | Tenant acquisition rate | >10% MoM |
| Churn Rate | Cancellation rate | <5% monthly |
| ARPU | Average Revenue Per User | Increasing |

### Platform Stats Component

```typescript
// components/platform/dashboard/PlatformStats.tsx
import { prisma } from '@/lib/db/client';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

export async function PlatformStats() {
  const [
    totalTenants,
    activeTenants,
    trialTenants,
    totalUsers,
    monthlyRevenue,
    previousMonthRevenue,
    newTenantsThisMonth,
    newTenantsLastMonth,
  ] = await Promise.all([
    prisma.tenant.count({ where: { deletedAt: null } }),
    prisma.tenant.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    prisma.tenant.count({ where: { status: 'TRIAL', deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    calculateMonthlyRevenue(0),
    calculateMonthlyRevenue(1),
    countNewTenants(0),
    countNewTenants(1),
  ]);

  const revenueGrowth = previousMonthRevenue > 0
    ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    : 0;

  const tenantGrowth = newTenantsLastMonth > 0
    ? ((newTenantsThisMonth - newTenantsLastMonth) / newTenantsLastMonth) * 100
    : 0;

  const stats = [
    {
      label: 'Total Churches',
      value: formatNumber(totalTenants),
      subtext: `${activeTenants} active, ${trialTenants} trial`,
      icon: Building2,
      color: 'bg-blue-500',
      trend: tenantGrowth,
    },
    {
      label: 'Total Users',
      value: formatNumber(totalUsers),
      subtext: 'Across all churches',
      icon: Users,
      color: 'bg-green-500',
      trend: 8,
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(monthlyRevenue),
      subtext: 'This month',
      icon: DollarSign,
      color: 'bg-purple-500',
      trend: revenueGrowth,
    },
    {
      label: 'New This Month',
      value: formatNumber(newTenantsThisMonth),
      subtext: 'Church signups',
      icon: TrendingUp,
      color: 'bg-orange-500',
      trend: tenantGrowth,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(stat => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.trend >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {Math.abs(stat.trend).toFixed(1)}%
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function calculateMonthlyRevenue(monthsAgo: number): Promise<number> {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const result = await prisma.payment.aggregate({
    where: {
      status: 'SUCCEEDED',
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: { amount: true },
  });

  return result._sum.amount || 0;
}

async function countNewTenants(monthsAgo: number): Promise<number> {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return prisma.tenant.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });
}
```

---

## Tenant Management

### Tenant List Page

```typescript
// app/platform/tenants/page.tsx
import Link from 'next/link';
import { Plus, Download, Filter } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { Button } from '@/components/ui/button';
import { TenantTable } from '@/components/platform/tenants/TenantTable';
import { TenantFilters } from '@/components/platform/tenants/TenantFilters';
import { SearchInput } from '@/components/common/SearchInput';

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
    plan?: string;
    sort?: string;
  };
}

export default async function TenantsPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page || '1');
  const limit = 20;

  const where: any = { deletedAt: null };

  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: 'insensitive' } },
      { subdomain: { contains: searchParams.search, mode: 'insensitive' } },
      { customDomain: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  if (searchParams.status) {
    where.status = searchParams.status;
  }

  if (searchParams.plan) {
    where.planId = searchParams.plan;
  }

  const [tenants, total, plans, stats] = await Promise.all([
    prisma.tenant.findMany({
      where,
      include: {
        plan: { select: { id: true, name: true, tier: true } },
        subscription: { select: { status: true, currentPeriodEnd: true } },
        _count: {
          select: {
            users: true,
            sermons: true,
            events: true,
            donations: true,
          },
        },
      },
      orderBy: getOrderBy(searchParams.sort),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.tenant.count({ where }),
    prisma.plan.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { displayOrder: 'asc' },
    }),
    getTenantStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Churches</h1>
          <p className="text-gray-500">
            {total} total churches • {stats.active} active • {stats.trial} trial
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link href="/platform/tenants/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Church
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <TenantFilters plans={plans} currentFilters={searchParams} />

      {/* Table */}
      <TenantTable
        tenants={tenants}
        total={total}
        page={page}
        limit={limit}
      />
    </div>
  );
}

function getOrderBy(sort?: string) {
  switch (sort) {
    case 'name':
      return { name: 'asc' as const };
    case 'created':
      return { createdAt: 'desc' as const };
    case 'users':
      return { users: { _count: 'desc' as const } };
    default:
      return { createdAt: 'desc' as const };
  }
}

async function getTenantStats() {
  const [active, trial, suspended] = await Promise.all([
    prisma.tenant.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    prisma.tenant.count({ where: { status: 'TRIAL', deletedAt: null } }),
    prisma.tenant.count({ where: { status: 'SUSPENDED', deletedAt: null } }),
  ]);
  return { active, trial, suspended };
}
```

### Tenant Detail Page

```typescript
// app/platform/tenants/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ExternalLink,
  Settings,
  Ban,
  RefreshCcw,
  Users,
  FileText,
  Calendar,
  DollarSign,
  Activity,
} from 'lucide-react';
import { TenantOverview } from '@/components/platform/tenants/TenantOverview';
import { TenantUsage } from '@/components/platform/tenants/TenantUsage';
import { TenantMembers } from '@/components/platform/tenants/TenantMembers';
import { TenantBilling } from '@/components/platform/tenants/TenantBilling';
import { TenantActivity } from '@/components/platform/tenants/TenantActivity';
import { formatDate } from '@/lib/utils';

interface PageProps {
  params: { id: string };
}

export default async function TenantDetailPage({ params }: PageProps) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: params.id },
    include: {
      plan: true,
      subscription: true,
      customDomains: true,
      templateCustomization: true,
      _count: {
        select: {
          users: true,
          sermons: true,
          events: true,
          ministries: true,
          groups: true,
          donations: true,
          media: true,
        },
      },
    },
  });

  if (!tenant) {
    notFound();
  }

  const tenantUrl = tenant.customDomains.find(d => d.verified)?.domain
    ? `https://${tenant.customDomains.find(d => d.verified)?.domain}`
    : `https://${tenant.subdomain}.digitalchurch.com`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
            <StatusBadge status={tenant.status} />
          </div>
          <div className="flex items-center gap-2 mt-1 text-gray-500">
            <span>{tenant.subdomain}.digitalchurch.com</span>
            <a
              href={tenantUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="flex gap-2">
          {tenant.status === 'ACTIVE' && (
            <Button variant="outline" className="text-yellow-600 border-yellow-300">
              <Ban className="h-4 w-4 mr-2" />
              Suspend
            </Button>
          )}
          {tenant.status === 'SUSPENDED' && (
            <Button variant="outline" className="text-green-600 border-green-300">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reactivate
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/platform/tenants/${tenant.id}/settings`}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Users" value={tenant._count.users} />
        <StatCard icon={FileText} label="Sermons" value={tenant._count.sermons} />
        <StatCard icon={Calendar} label="Events" value={tenant._count.events} />
        <StatCard icon={Users} label="Groups" value={tenant._count.groups} />
        <StatCard icon={DollarSign} label="Donations" value={tenant._count.donations} />
        <StatCard icon={Activity} label="Ministries" value={tenant._count.ministries} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <TenantOverview tenant={tenant} />
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <TenantUsage tenant={tenant} />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <TenantMembers tenantId={tenant.id} />
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <TenantBilling tenantId={tenant.id} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <TenantActivity tenantId={tenant.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    TRIAL: 'bg-blue-100 text-blue-800',
    SUSPENDED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };

  return (
    <Badge className={variants[status] || variants.CANCELLED}>
      {status}
    </Badge>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Icon className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <p className="text-lg font-semibold">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Tenant Actions

| Action | Description | Confirmation Required |
|--------|-------------|----------------------|
| Suspend | Temporarily disable account | Yes |
| Reactivate | Re-enable suspended account | No |
| Delete | Permanently remove (soft delete) | Yes + Type confirmation |
| Reset Password | Send password reset to admin | Yes |
| Impersonate | Login as tenant admin | Audit logged |
| Change Plan | Upgrade/downgrade subscription | Yes |
| Export Data | Download tenant data | No |

---

## Plan & Subscription Management

### Plan Editor

```typescript
// app/platform/plans/[id]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/client';
import { PlanForm } from '@/components/platform/plans/PlanForm';

interface PageProps {
  params: { id: string };
}

export default async function EditPlanPage({ params }: PageProps) {
  const plan = params.id === 'new'
    ? null
    : await prisma.plan.findUnique({
        where: { id: params.id },
        include: { features: true },
      });

  if (params.id !== 'new' && !plan) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {plan ? 'Edit Plan' : 'Create Plan'}
        </h1>
        <p className="text-gray-500">
          Configure plan features, limits, and pricing
        </p>
      </div>

      <PlanForm plan={plan} />
    </div>
  );
}
```

### Plan Configuration

```typescript
// components/platform/plans/PlanForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const planSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tier: z.enum(['STARTER', 'GROWTH', 'PRO', 'ENTERPRISE']),
  description: z.string(),
  monthlyPrice: z.number().min(0),
  yearlyPrice: z.number().min(0),
  maxUsers: z.number().min(-1),
  maxStorageMb: z.number().min(-1),
  maxSermons: z.number().min(-1),
  maxEvents: z.number().min(-1),
  maxMinistries: z.number().min(-1),
  maxGroups: z.number().min(-1),
  customDomain: z.boolean(),
  whiteLabel: z.boolean(),
  analytics: z.boolean(),
  apiAccess: z.boolean(),
  liveStreaming: z.boolean(),
  mobileApp: z.boolean(),
  prioritySupport: z.boolean(),
  smsNotifications: z.boolean(),
  isActive: z.boolean(),
  displayOrder: z.number(),
});

type PlanFormData = z.infer<typeof planSchema>;

interface PlanFormProps {
  plan?: PlanFormData & { id: string } | null;
}

export function PlanForm({ plan }: PlanFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: plan || {
      name: '',
      tier: 'STARTER',
      description: '',
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxUsers: 10,
      maxStorageMb: 1024,
      maxSermons: 50,
      maxEvents: 20,
      maxMinistries: 5,
      maxGroups: 10,
      customDomain: false,
      whiteLabel: false,
      analytics: false,
      apiAccess: false,
      liveStreaming: false,
      mobileApp: false,
      prioritySupport: false,
      smsNotifications: false,
      isActive: true,
      displayOrder: 0,
    },
  });

  const onSubmit = async (data: PlanFormData) => {
    setIsSubmitting(true);
    try {
      const url = plan
        ? `/api/platform/plans/${plan.id}`
        : '/api/platform/plans';
      const method = plan ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push('/platform/plans');
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Plan Name</Label>
              <Input id="name" {...form.register('name')} />
            </div>
            <div>
              <Label htmlFor="tier">Tier</Label>
              <Select
                value={form.watch('tier')}
                onValueChange={(v) => form.setValue('tier', v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STARTER">Starter</SelectItem>
                  <SelectItem value="GROWTH">Growth</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register('description')} />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthlyPrice">Monthly Price ($)</Label>
              <Input
                id="monthlyPrice"
                type="number"
                step="0.01"
                {...form.register('monthlyPrice', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="yearlyPrice">Yearly Price ($)</Label>
              <Input
                id="yearlyPrice"
                type="number"
                step="0.01"
                {...form.register('yearlyPrice', { valueAsNumber: true })}
              />
              <p className="text-xs text-gray-500 mt-1">
                {form.watch('monthlyPrice') > 0 && (
                  <>
                    {Math.round((1 - form.watch('yearlyPrice') / (form.watch('monthlyPrice') * 12)) * 100)}% discount
                  </>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Limits</CardTitle>
          <p className="text-sm text-gray-500">Use -1 for unlimited</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="maxUsers">Max Users</Label>
              <Input
                id="maxUsers"
                type="number"
                {...form.register('maxUsers', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="maxStorageMb">Storage (MB)</Label>
              <Input
                id="maxStorageMb"
                type="number"
                {...form.register('maxStorageMb', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="maxSermons">Max Sermons</Label>
              <Input
                id="maxSermons"
                type="number"
                {...form.register('maxSermons', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="maxEvents">Max Events</Label>
              <Input
                id="maxEvents"
                type="number"
                {...form.register('maxEvents', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="maxMinistries">Max Ministries</Label>
              <Input
                id="maxMinistries"
                type="number"
                {...form.register('maxMinistries', { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="maxGroups">Max Groups</Label>
              <Input
                id="maxGroups"
                type="number"
                {...form.register('maxGroups', { valueAsNumber: true })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'customDomain', label: 'Custom Domain' },
              { name: 'whiteLabel', label: 'White Label (Remove Branding)' },
              { name: 'analytics', label: 'Advanced Analytics' },
              { name: 'apiAccess', label: 'API Access' },
              { name: 'liveStreaming', label: 'Live Streaming' },
              { name: 'mobileApp', label: 'Mobile App' },
              { name: 'prioritySupport', label: 'Priority Support' },
              { name: 'smsNotifications', label: 'SMS Notifications' },
            ].map(feature => (
              <div key={feature.name} className="flex items-center justify-between">
                <Label htmlFor={feature.name}>{feature.label}</Label>
                <Switch
                  id={feature.name}
                  checked={form.watch(feature.name as any)}
                  onCheckedChange={(v) => form.setValue(feature.name as any, v)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
        </Button>
      </div>
    </form>
  );
}
```

### Default Plan Tiers

| Feature | Starter | Growth | Pro | Enterprise |
|---------|---------|--------|-----|------------|
| Monthly Price | $29 | $79 | $149 | Custom |
| Users | 25 | 100 | 500 | Unlimited |
| Storage | 5 GB | 25 GB | 100 GB | Unlimited |
| Sermons | 50 | 200 | Unlimited | Unlimited |
| Events | 20 | 100 | Unlimited | Unlimited |
| Custom Domain | No | Yes | Yes | Yes |
| White Label | No | No | Yes | Yes |
| Analytics | Basic | Standard | Advanced | Advanced |
| API Access | No | No | Yes | Yes |
| Live Streaming | No | No | Yes | Yes |
| Mobile App | No | Yes | Yes | Yes |
| Support | Email | Priority | Dedicated | Dedicated |

---

## Billing & Revenue

### Revenue Dashboard

```typescript
// app/platform/billing/page.tsx
import { prisma } from '@/lib/db/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RevenueChart } from '@/components/platform/billing/RevenueChart';
import { RevenueMetrics } from '@/components/platform/billing/RevenueMetrics';
import { UpcomingRenewals } from '@/components/platform/billing/UpcomingRenewals';
import { FailedPayments } from '@/components/platform/billing/FailedPayments';
import { TopPlans } from '@/components/platform/billing/TopPlans';

export default async function BillingDashboard() {
  const [
    mrr,
    arr,
    totalRevenue,
    failedPayments,
    upcomingRenewals,
  ] = await Promise.all([
    calculateMRR(),
    calculateARR(),
    calculateTotalRevenue(),
    getFailedPayments(),
    getUpcomingRenewals(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Revenue</h1>
        <p className="text-gray-500">Financial overview and payment management</p>
      </div>

      {/* Key Metrics */}
      <RevenueMetrics mrr={mrr} arr={arr} totalRevenue={totalRevenue} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <TopPlans />
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Failed Payments ({failedPayments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <FailedPayments payments={failedPayments} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Renewals (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <UpcomingRenewals renewals={upcomingRenewals} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Key Revenue Metrics

| Metric | Calculation | Display |
|--------|-------------|---------|
| MRR | Sum of monthly subscriptions | Currency |
| ARR | MRR * 12 | Currency |
| ARPU | MRR / Active Tenants | Currency |
| Churn Rate | (Lost MRR / Start MRR) * 100 | Percentage |
| LTV | ARPU / Churn Rate | Currency |
| CAC | Marketing Spend / New Customers | Currency |

---

## Analytics Dashboard

### Platform Analytics

```typescript
// app/platform/analytics/page.tsx
import { Suspense } from 'react';
import { TenantGrowthChart } from '@/components/platform/analytics/TenantGrowthChart';
import { UsageHeatmap } from '@/components/platform/analytics/UsageHeatmap';
import { FeatureAdoption } from '@/components/platform/analytics/FeatureAdoption';
import { GeographicDistribution } from '@/components/platform/analytics/GeographicDistribution';
import { ChurnAnalysis } from '@/components/platform/analytics/ChurnAnalysis';
import { EngagementMetrics } from '@/components/platform/analytics/EngagementMetrics';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-gray-500">Insights into platform growth and usage</p>
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <TenantGrowthChart />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <ChurnAnalysis />
        </Suspense>
      </div>

      {/* Usage Patterns */}
      <Suspense fallback={<ChartSkeleton />}>
        <UsageHeatmap />
      </Suspense>

      {/* Feature & Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <FeatureAdoption />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <EngagementMetrics />
        </Suspense>
      </div>

      {/* Geographic Distribution */}
      <Suspense fallback={<ChartSkeleton />}>
        <GeographicDistribution />
      </Suspense>
    </div>
  );
}
```

### Analytics Metrics

| Category | Metrics |
|----------|---------|
| Growth | New signups, Conversion rate, Trial-to-paid, Churn |
| Usage | DAU/MAU, Feature usage, API calls, Storage used |
| Engagement | Login frequency, Content creation, User activity |
| Financial | MRR, ARR, ARPU, LTV, Expansion revenue |

---

## Support Ticket System

### Ticket Management

```typescript
// app/platform/support/page.tsx
import { prisma } from '@/lib/db/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketList } from '@/components/platform/support/TicketList';
import { TicketStats } from '@/components/platform/support/TicketStats';

interface PageProps {
  searchParams: {
    status?: string;
    priority?: string;
    page?: string;
  };
}

export default async function SupportPage({ searchParams }: PageProps) {
  const status = searchParams.status || 'open';
  const page = parseInt(searchParams.page || '1');
  const limit = 20;

  const where: any = {};

  if (status === 'open') {
    where.status = { in: ['OPEN', 'IN_PROGRESS'] };
  } else if (status !== 'all') {
    where.status = status.toUpperCase();
  }

  if (searchParams.priority) {
    where.priority = searchParams.priority.toUpperCase();
  }

  const [tickets, total, stats] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true, subdomain: true } },
        user: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supportTicket.count({ where }),
    getTicketStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-500">Manage customer support requests</p>
      </div>

      <TicketStats stats={stats} />

      <Tabs defaultValue={status}>
        <TabsList>
          <TabsTrigger value="open">Open ({stats.open})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({stats.inProgress})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={status} className="mt-6">
          <TicketList tickets={tickets} total={total} page={page} limit={limit} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function getTicketStats() {
  const [open, inProgress, resolved, avgResponseTime] = await Promise.all([
    prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
    calculateAverageResponseTime(),
  ]);
  return { open, inProgress, resolved, avgResponseTime };
}
```

### Ticket Priorities

| Priority | Response SLA | Resolution SLA |
|----------|-------------|----------------|
| Critical | 1 hour | 4 hours |
| High | 4 hours | 24 hours |
| Medium | 24 hours | 72 hours |
| Low | 48 hours | 1 week |

---

## System Monitoring

### System Health Dashboard

```typescript
// app/platform/system/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemStatus } from '@/components/platform/system/SystemStatus';
import { DatabaseMetrics } from '@/components/platform/system/DatabaseMetrics';
import { CacheMetrics } from '@/components/platform/system/CacheMetrics';
import { QueueMetrics } from '@/components/platform/system/QueueMetrics';
import { ErrorLogs } from '@/components/platform/system/ErrorLogs';
import { PerformanceMetrics } from '@/components/platform/system/PerformanceMetrics';

export default function SystemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
        <p className="text-gray-500">Monitor system performance and health</p>
      </div>

      {/* Overall Status */}
      <SystemStatus />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DatabaseMetrics />
        <CacheMetrics />
        <QueueMetrics />
      </div>

      {/* Performance */}
      <PerformanceMetrics />

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorLogs limit={10} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### System Metrics

| Component | Metrics | Threshold |
|-----------|---------|-----------|
| Database | Connections, Query time, Pool usage | <80% pool |
| Cache | Hit rate, Memory, Evictions | >90% hit rate |
| Queue | Pending jobs, Failed jobs, Processing time | <100 pending |
| API | Response time, Error rate, Requests/sec | <200ms avg |
| Storage | Used space, Upload rate | <90% capacity |

---

## Platform Settings

### Configuration Categories

| Category | Settings |
|----------|----------|
| General | Platform name, Logo, Contact email, Timezone |
| Email | SMTP config, Templates, Sender name |
| Security | Password policy, 2FA requirements, Session timeout |
| Payments | Stripe keys, Processing fees, Payout schedule |
| Integrations | Third-party APIs, Webhooks, OAuth apps |
| Notifications | Alert thresholds, Admin notifications |

### Maintenance Mode

```typescript
// app/platform/system/maintenance/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function MaintenancePage() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [message, setMessage] = useState(
    'We are currently performing scheduled maintenance. We will be back shortly.'
  );

  const handleToggle = async (enabled: boolean) => {
    const response = await fetch('/api/platform/system/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, message }),
    });

    if (response.ok) {
      setIsEnabled(enabled);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Mode</h1>
        <p className="text-gray-500">
          Enable maintenance mode to prevent access during updates
        </p>
      </div>

      {isEnabled && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Maintenance Mode Active</AlertTitle>
          <AlertDescription>
            All tenant sites are currently showing the maintenance page.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Maintenance Mode</p>
              <p className="text-sm text-gray-500">
                Show maintenance page to all visitors
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggle}
            />
          </div>

          <div>
            <label className="block font-medium mb-2">
              Maintenance Message
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            onClick={() => handleToggle(isEnabled)}
            disabled={!message}
          >
            Save Message
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Security Best Practices

### Access Control

1. **Authentication**: All platform admin routes require authentication
2. **Authorization**: Only PLATFORM_ADMIN role can access
3. **Audit Logging**: All actions are logged with timestamp and user
4. **Session Management**: Automatic timeout after inactivity
5. **2FA**: Required for all platform administrators

### Data Protection

1. **Encryption**: All sensitive data encrypted at rest
2. **HTTPS**: All traffic encrypted in transit
3. **Backups**: Automated daily backups with encryption
4. **Data Isolation**: Strict tenant data separation
5. **Access Logging**: All data access is logged

---

**Document Version**: 3.0 Enterprise Edition
**Last Updated**: December 2024
**Maintained By**: Digital Church Platform Team
