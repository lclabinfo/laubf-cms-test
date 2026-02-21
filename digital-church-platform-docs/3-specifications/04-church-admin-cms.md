# Church Admin CMS & Dashboard

## Overview

The Church Admin CMS is the central hub for church administrators to manage all aspects of their digital presence. Built with template-awareness at its core, the CMS provides a comprehensive content management system that adapts to each church's selected template while maintaining a consistent administrative experience. This document covers the complete church-side administrative functionality.

**Document Version**: 3.0 Enterprise Edition
**Last Updated**: December 2024

---

## Table of Contents

1. [CMS Architecture](#cms-architecture)
2. [Admin Dashboard](#admin-dashboard)
3. [Menu Management](#menu-management)
4. [Content Management](#content-management)
5. [Sermon Management](#sermon-management)
6. [Event Management](#event-management)
7. [Media Library](#media-library)
8. [Settings & Configuration](#settings--configuration)
9. [Role-Based Access](#role-based-access)
10. [Implementation](#implementation)

---

## CMS Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Church Admin CMS (Template-Aware)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │    Dashboard    │  │     Content     │  │     Media       │              │
│  │   (Analytics)   │  │   Management    │  │    Library      │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                        │
│  ┌────────┴────────┐  ┌────────┴────────┐  ┌────────┴────────┐              │
│  │      Menu       │  │     Sermon      │  │     Event       │              │
│  │   Management    │  │   Management    │  │   Management    │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
│           │                    │                    │                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                   Template Configuration Layer                       │    │
│  │  • Section variants    • Theme colors    • Component styling         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Database Layer (Tenant-Scoped)                   │    │
│  │  • Posts    • Sermons    • Events    • Pages    • Media    • Menus   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
app/admin/
├── layout.tsx                    # Admin layout with sidebar
├── page.tsx                      # Dashboard
├── sermons/
│   ├── page.tsx                  # Sermon listing
│   ├── new/page.tsx              # Create sermon
│   └── [id]/
│       ├── page.tsx              # View sermon
│       └── edit/page.tsx         # Edit sermon
├── events/
│   ├── page.tsx                  # Event listing
│   ├── new/page.tsx              # Create event
│   └── [id]/page.tsx             # Event detail/edit
├── posts/
│   ├── page.tsx                  # Post listing
│   ├── new/page.tsx              # Create post
│   ├── categories/page.tsx       # Category management
│   └── [id]/page.tsx             # Post detail/edit
├── ministries/
│   ├── page.tsx                  # Ministry listing
│   └── [id]/page.tsx             # Ministry detail
├── members/
│   ├── page.tsx                  # Member listing
│   ├── new/page.tsx              # Invite member
│   └── [id]/page.tsx             # Member detail
├── media/
│   ├── page.tsx                  # Media library
│   └── upload/page.tsx           # Upload interface
├── menus/
│   └── page.tsx                  # Menu management
├── pages/
│   ├── page.tsx                  # Page listing
│   └── [id]/page.tsx             # Page builder
├── forms/
│   ├── page.tsx                  # Form listing
│   └── [id]/
│       ├── page.tsx              # Form builder
│       └── responses/page.tsx    # Form responses
├── settings/
│   ├── page.tsx                  # General settings
│   ├── profile/page.tsx          # Church profile
│   ├── theme/page.tsx            # Theme customization
│   ├── domain/page.tsx           # Domain settings
│   ├── integrations/page.tsx     # Third-party integrations
│   └── billing/page.tsx          # Billing & subscription
└── analytics/
    └── page.tsx                  # Analytics dashboard
```

### Admin Layout

```typescript
// app/admin/layout.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getTenantContext } from '@/lib/tenant/context';
import { getTenantPlan } from '@/lib/tenant/plan';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { PlanLimitBanner } from '@/components/admin/PlanLimitBanner';
import { TemplateProvider } from '@/contexts/TemplateContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Authentication check
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }

  // Tenant check
  const tenant = await getTenantContext();
  if (!tenant) {
    redirect('/not-found');
  }

  // Role check
  const allowedRoles = ['ADMIN', 'SUPERUSER', 'MINISTRY_LEADER', 'CONTENT_MANAGER'];
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/');
  }

  // Get plan information
  const plan = await getTenantPlan(tenant.id);

  return (
    <TemplateProvider tenantId={tenant.id}>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar Navigation */}
        <AdminSidebar
          tenant={tenant}
          user={session.user}
          plan={plan}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <AdminHeader
            tenant={tenant}
            user={session.user}
          />

          {/* Plan Limit Warning Banner */}
          {plan && <PlanLimitBanner plan={plan} tenantId={tenant.id} />}

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <AdminBreadcrumb />
            {children}
          </main>
        </div>
      </div>
    </TemplateProvider>
  );
}
```

---

## Admin Dashboard

### Dashboard Overview

```typescript
// app/admin/page.tsx
import { Suspense } from 'react';
import { getTenantContext } from '@/lib/tenant/context';
import { StatsCards } from '@/components/admin/dashboard/StatsCards';
import { RecentSermons } from '@/components/admin/dashboard/RecentSermons';
import { UpcomingEvents } from '@/components/admin/dashboard/UpcomingEvents';
import { RecentPosts } from '@/components/admin/dashboard/RecentPosts';
import { QuickActions } from '@/components/admin/dashboard/QuickActions';
import { ActivityFeed } from '@/components/admin/dashboard/ActivityFeed';
import { StorageUsage } from '@/components/admin/dashboard/StorageUsage';
import { GivingOverview } from '@/components/admin/dashboard/GivingOverview';
import { Skeleton } from '@/components/ui/skeleton';

export default async function AdminDashboard() {
  const tenant = await getTenantContext();

  if (!tenant) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's what's happening at {tenant.name}.</p>
        </div>
        <QuickActions />
      </div>

      {/* Statistics Cards */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards tenantId={tenant.id} />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 Width */}
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<CardSkeleton />}>
            <GivingOverview tenantId={tenant.id} />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <RecentSermons tenantId={tenant.id} />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <UpcomingEvents tenantId={tenant.id} />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <RecentPosts tenantId={tenant.id} />
          </Suspense>
        </div>

        {/* Right Column - 1/3 Width */}
        <div className="space-y-6">
          <Suspense fallback={<CardSkeleton />}>
            <StorageUsage tenantId={tenant.id} />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <ActivityFeed tenantId={tenant.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  );
}

function CardSkeleton() {
  return <Skeleton className="h-80" />;
}
```

### Statistics Cards Component

```typescript
// components/admin/dashboard/StatsCards.tsx
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Calendar, FileText, Users, DollarSign, Eye } from 'lucide-react';

interface StatsCardsProps {
  tenantId: string;
}

export async function StatsCards({ tenantId }: StatsCardsProps) {
  // Fetch all stats in parallel
  const [
    sermonsCount,
    eventsCount,
    postsCount,
    membersCount,
    monthlyDonations,
    monthlyPageViews,
  ] = await Promise.all([
    prisma.sermon.count({
      where: { tenantId, deletedAt: null },
    }),
    prisma.event.count({
      where: {
        tenantId,
        deletedAt: null,
        startDate: { gte: new Date() },
      },
    }),
    prisma.post.count({
      where: { tenantId, deletedAt: null, status: 'PUBLISHED' },
    }),
    prisma.user.count({
      where: { tenantId, deletedAt: null },
    }),
    getMonthlyDonations(tenantId),
    getMonthlyPageViews(tenantId),
  ]);

  const stats = [
    {
      label: 'Total Members',
      value: membersCount.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changePositive: true,
    },
    {
      label: 'Monthly Giving',
      value: `$${monthlyDonations.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+8%',
      changePositive: true,
    },
    {
      label: 'Total Sermons',
      value: sermonsCount.toLocaleString(),
      icon: Video,
      color: 'bg-purple-500',
      change: '+3',
      changePositive: true,
    },
    {
      label: 'Upcoming Events',
      value: eventsCount.toLocaleString(),
      icon: Calendar,
      color: 'bg-orange-500',
      change: eventsCount.toString(),
      changePositive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <span
                className={`text-sm font-medium ${
                  stat.changePositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function getMonthlyDonations(tenantId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const result = await prisma.donation.aggregate({
    where: {
      tenantId,
      status: 'COMPLETED',
      createdAt: { gte: startOfMonth },
    },
    _sum: { amount: true },
  });

  return result._sum.amount?.toNumber() || 0;
}

async function getMonthlyPageViews(tenantId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);

  const result = await prisma.tenantUsage.findFirst({
    where: {
      tenantId,
      metricName: 'page_views',
      periodStart: { gte: startOfMonth },
    },
  });

  return result?.metricValue || 0;
}
```

### Quick Actions Component

```typescript
// components/admin/dashboard/QuickActions.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Plus, Video, Calendar, FileText, Users, Gift } from 'lucide-react';

export function QuickActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Quick Add
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/admin/sermons/new">
            <Video className="h-4 w-4 mr-2" />
            New Sermon
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/events/new">
            <Calendar className="h-4 w-4 mr-2" />
            New Event
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/posts/new">
            <FileText className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/members/new">
            <Users className="h-4 w-4 mr-2" />
            Invite Member
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/giving/campaigns/new">
            <Gift className="h-4 w-4 mr-2" />
            New Campaign
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Menu Management

### Menu System Architecture

```
Home
About
├── Our History
├── Our Staff
├── What We Believe
└── Location & Directions
Ministries
├── Worship
├── Youth Ministry
├── Children's Ministry
├── Men's Ministry
├── Women's Ministry
└── Small Groups
Sermons
Events
├── Upcoming Events
├── Calendar
└── Event Registration
Give
Contact
```

### Menu Types

| Type | Description | Use Case |
|------|-------------|----------|
| `PAGE` | Links to content page | Standard navigation |
| `DROPDOWN` | Contains child items | Category menus |
| `EXTERNAL_LINK` | Links to external URL | External resources |
| `MINISTRY_PAGE` | Ministry content | Ministry sections |
| `SYSTEM_PAGE` | System-generated | Contact, Search |
| `DIVIDER` | Visual separator | Menu organization |

### Menu Management Component

```typescript
// app/admin/menus/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Settings, Eye } from 'lucide-react';
import { MenuForm } from './MenuForm';
import { SortableMenuItem } from './SortableMenuItem';
import { useToast } from '@/components/ui/use-toast';

interface Menu {
  id: string;
  title: string;
  slug: string;
  menuType: string;
  sortOrder: number;
  isVisible: boolean;
  parentId: string | null;
  children: Menu[];
  page?: { id: string; status: string };
  _count?: { contentSections: number };
}

export default function MenuManagementPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchMenus();
  }, []);

  async function fetchMenus() {
    const response = await fetch('/api/admin/menus');
    const data = await response.json();
    setMenus(data.menus);
    setLoading(false);
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = menus.findIndex((m) => m.id === active.id);
    const newIndex = menus.findIndex((m) => m.id === over.id);

    const reorderedMenus = [...menus];
    const [removed] = reorderedMenus.splice(oldIndex, 1);
    reorderedMenus.splice(newIndex, 0, removed);

    // Optimistic update
    setMenus(reorderedMenus.map((m, i) => ({ ...m, sortOrder: i })));

    try {
      await fetch('/api/admin/menus/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: reorderedMenus.map((menu, index) => ({
            id: menu.id,
            parentId: menu.parentId,
            sortOrder: index,
          })),
        }),
      });

      toast({ title: 'Menu order updated successfully' });
    } catch (error) {
      setMenus(menus); // Revert on error
      toast({
        title: 'Error',
        description: 'Failed to update menu order',
        variant: 'destructive',
      });
    }
  };

  const handleMenuSave = async (menuData: any) => {
    try {
      const url = editingMenu
        ? `/api/admin/menus/${editingMenu.id}`
        : '/api/admin/menus';
      const method = editingMenu ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuData),
      });

      if (!response.ok) throw new Error('Failed to save');

      const savedMenu = await response.json();

      if (editingMenu) {
        setMenus((prev) => prev.map((m) => (m.id === savedMenu.id ? savedMenu : m)));
      } else {
        setMenus((prev) => [...prev, savedMenu]);
      }

      setIsFormOpen(false);
      setEditingMenu(null);
      toast({ title: editingMenu ? 'Menu updated' : 'Menu created' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save menu',
        variant: 'destructive',
      });
    }
  };

  const handleMenuDelete = async (menuId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      await fetch(`/api/admin/menus/${menuId}`, { method: 'DELETE' });
      setMenus((prev) => prev.filter((m) => m.id !== menuId));
      toast({ title: 'Menu deleted' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete menu',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading menus...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">
            Organize your website navigation structure
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/" target="_blank">
              <Eye className="w-4 h-4 mr-2" />
              Preview Site
            </a>
          </Button>
          <Button
            onClick={() => {
              setEditingMenu(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* Menu Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Menu</CardTitle>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(e) => setActiveId(e.active.id as string)}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={menus.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {menus.map((menu) => (
                  <SortableMenuItem
                    key={menu.id}
                    menu={menu}
                    depth={0}
                    isExpanded={expandedIds.has(menu.id)}
                    onToggleExpand={() => {
                      setExpandedIds((prev) => {
                        const next = new Set(prev);
                        next.has(menu.id) ? next.delete(menu.id) : next.add(menu.id);
                        return next;
                      });
                    }}
                    onEdit={() => {
                      setEditingMenu(menu);
                      setIsFormOpen(true);
                    }}
                    onDelete={() => handleMenuDelete(menu.id)}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeId && (
                <div className="bg-white border rounded-lg p-3 shadow-lg">
                  {menus.find((m) => m.id === activeId)?.title}
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {menus.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No menu items yet.</p>
              <p className="text-sm">Click "Add Menu Item" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Menu Form Dialog */}
      <MenuForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        menu={editingMenu}
        menus={menus}
        onSave={handleMenuSave}
      />
    </div>
  );
}
```

### Menu API Routes

```typescript
// app/api/admin/menus/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant/context';

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenant = await getTenantContext();

  const menus = await prisma.menu.findMany({
    where: {
      tenantId: tenant.id,
      parentId: null, // Top-level only
    },
    include: {
      children: {
        where: { isVisible: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          children: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
      page: {
        select: { id: true, title: true, status: true },
      },
      _count: {
        select: { contentSections: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  return NextResponse.json({ menus });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session || !['ADMIN', 'SUPERUSER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenant = await getTenantContext();
  const body = await request.json();

  // Generate slug from title
  const slug = body.slug || generateSlug(body.title);

  // Check for duplicate slug
  const existing = await prisma.menu.findFirst({
    where: { tenantId: tenant.id, slug },
  });

  if (existing) {
    return NextResponse.json(
      { error: 'A menu with this slug already exists' },
      { status: 400 }
    );
  }

  // Get next sort order
  const maxOrder = await prisma.menu.aggregate({
    where: { tenantId: tenant.id, parentId: body.parentId || null },
    _max: { sortOrder: true },
  });

  const menu = await prisma.menu.create({
    data: {
      tenantId: tenant.id,
      parentId: body.parentId || null,
      title: body.title,
      slug,
      menuType: body.menuType || 'PAGE',
      url: body.url,
      icon: body.icon,
      headerImage: body.headerImage,
      description: body.description,
      sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      isVisible: body.isVisible ?? true,
      openInNewTab: body.openInNewTab ?? false,
    },
    include: {
      children: true,
      page: true,
    },
  });

  // Create associated page if menu type is PAGE
  if (menu.menuType === 'PAGE') {
    await prisma.page.create({
      data: {
        tenantId: tenant.id,
        menuId: menu.id,
        title: menu.title,
        slug: menu.slug,
        status: 'DRAFT',
      },
    });
  }

  return NextResponse.json(menu, { status: 201 });
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
```

---

## Content Management

### Post Types

| Type | Use Case | Example |
|------|----------|---------|
| `ARTICLE` | General articles | "The History of Our Church" |
| `ANNOUNCEMENT` | Church announcements | "Easter Service Times" |
| `BLOG` | Pastor's blog | "Weekly Devotional" |
| `NEWS` | Church news | "Building Project Update" |
| `RESOURCE` | Downloads | "Small Group Guide" |

### Post Management Component

```typescript
// app/admin/posts/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { Plus, Filter } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant/context';
import { Button } from '@/components/ui/button';
import { PostsTable } from '@/components/admin/posts/PostsTable';
import { PostFilters } from '@/components/admin/posts/PostFilters';

interface PageProps {
  searchParams: {
    page?: string;
    status?: string;
    type?: string;
    search?: string;
  };
}

export default async function PostsPage({ searchParams }: PageProps) {
  const tenant = await getTenantContext();
  const page = parseInt(searchParams.page || '1');
  const limit = 20;

  const where: any = {
    tenantId: tenant.id,
    deletedAt: null,
  };

  if (searchParams.status) {
    where.status = searchParams.status;
  }

  if (searchParams.type) {
    where.postType = searchParams.type;
  }

  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search, mode: 'insensitive' } },
      { content: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, name: true } },
        ministry: { select: { id: true, name: true } },
        _count: { select: { attachments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Posts</h1>
          <p className="text-gray-500">
            Manage articles, announcements, and news
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <PostFilters currentFilters={searchParams} />

      {/* Posts Table */}
      <PostsTable
        posts={posts}
        total={total}
        page={page}
        limit={limit}
      />
    </div>
  );
}
```

### Rich Text Editor Component

```typescript
// components/admin/RichTextEditor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b p-2 flex gap-1 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-gray-200' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-gray-200' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-gray-200' : ''}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={addLink}>
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={addImage}>
          <ImageIcon className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[300px] focus:outline-none"
      />
    </div>
  );
}
```

---

## Sermon Management

### Sermon Database Schema

```prisma
model Sermon {
  id            String       @id @default(uuid())
  tenantId      String
  title         String
  slug          String
  description   String?      @db.Text
  scripture     String?
  speakerId     String?
  seriesId      String?

  // Media
  videoUrl      String?
  audioUrl      String?
  thumbnailUrl  String?

  // Metadata
  sermonDate    DateTime
  duration      Int?         // Duration in seconds
  status        ContentStatus @default(DRAFT)
  isFeatured    Boolean      @default(false)
  viewCount     Int          @default(0)

  // Attachments
  notesUrl      String?
  outlineUrl    String?

  // Timestamps
  publishedAt   DateTime?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  deletedAt     DateTime?

  // Relations
  tenant        Tenant       @relation(fields: [tenantId], references: [id])
  speaker       User?        @relation(fields: [speakerId], references: [id])
  series        SermonSeries? @relation(fields: [seriesId], references: [id])
  attachments   SermonAttachment[]

  @@unique([tenantId, slug])
  @@index([tenantId, status, sermonDate])
}

model SermonSeries {
  id            String    @id @default(uuid())
  tenantId      String
  title         String
  slug          String
  description   String?   @db.Text
  thumbnailUrl  String?
  startDate     DateTime?
  endDate       DateTime?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  sermons       Sermon[]

  @@unique([tenantId, slug])
}
```

### Sermon Form Component

```typescript
// app/admin/sermons/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MediaPicker } from '@/components/admin/MediaPicker';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/components/ui/use-toast';
import { Video, Music, Upload, Save, Eye } from 'lucide-react';

const sermonSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  scripture: z.string().optional(),
  speakerId: z.string().optional(),
  seriesId: z.string().optional(),
  sermonDate: z.date(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  audioUrl: z.string().url().optional().or(z.literal('')),
  thumbnailUrl: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});

type SermonFormValues = z.infer<typeof sermonSchema>;

export default function NewSermonPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const form = useForm<SermonFormValues>({
    resolver: zodResolver(sermonSchema),
    defaultValues: {
      title: '',
      description: '',
      scripture: '',
      sermonDate: new Date(),
      status: 'DRAFT',
    },
  });

  const onSubmit = async (data: SermonFormValues) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/sermons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create sermon');

      const sermon = await response.json();
      toast({ title: 'Sermon created successfully' });
      router.push(`/admin/sermons/${sermon.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create sermon',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">New Sermon</h1>
          <p className="text-gray-500">Add a new sermon to your library</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={form.handleSubmit((data) => onSubmit({ ...data, status: 'DRAFT' }))}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={form.handleSubmit((data) => onSubmit({ ...data, status: 'PUBLISHED' }))}
            disabled={saving}
          >
            <Eye className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sermon Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter sermon title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter sermon description"
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scripture"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scripture Reference</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., John 3:16-17" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Media */}
              <Card>
                <CardHeader>
                  <CardTitle>Media</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Video className="h-4 w-4 inline mr-2" />
                          Video URL
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="YouTube or Vimeo URL"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="audioUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Music className="h-4 w-4 inline mr-2" />
                          Audio URL
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Audio file URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Publish Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="sermonDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sermon Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            onSelect={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="speakerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Speaker</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select speaker" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* Populated from API */}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seriesId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sermon Series</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select series" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* Populated from API */}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Thumbnail</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="thumbnailUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <MediaPicker
                            value={field.value}
                            onChange={field.onChange}
                            type="image"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
```

---

## Event Management

### Event Types

| Type | Description | Example |
|------|-------------|---------|
| `SERVICE` | Regular worship | Sunday Service |
| `SPECIAL` | Special events | Easter Celebration |
| `MEETING` | Church meetings | Board Meeting |
| `COMMUNITY` | Community events | Food Drive |
| `CLASS` | Educational | Bible Study |
| `YOUTH` | Youth events | Youth Retreat |

### Event Schema

```prisma
model Event {
  id              String       @id @default(uuid())
  tenantId        String
  title           String
  slug            String
  description     String?      @db.Text
  location        String?

  // Timing
  startDate       DateTime
  endDate         DateTime?
  allDay          Boolean      @default(false)
  timezone        String       @default("America/Chicago")

  // Recurrence
  isRecurring     Boolean      @default(false)
  recurrenceRule  String?      // iCal RRULE format
  recurrenceEnd   DateTime?

  // Registration
  isRegistrationEnabled Boolean @default(false)
  maxParticipants Int?
  registrationDeadline DateTime?
  registrationFee Decimal?     @db.Decimal(10, 2)

  // Media
  featuredImage   String?

  // Status
  eventType       EventType    @default(SERVICE)
  status          ContentStatus @default(DRAFT)
  isFeatured      Boolean      @default(false)

  // Relations
  ministryId      String?

  // Timestamps
  publishedAt     DateTime?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  deletedAt       DateTime?

  tenant          Tenant       @relation(fields: [tenantId], references: [id])
  ministry        Ministry?    @relation(fields: [ministryId], references: [id])
  registrations   EventRegistration[]

  @@unique([tenantId, slug])
  @@index([tenantId, status, startDate])
}
```

---

## Media Library

### Media Library Component

```typescript
// app/admin/media/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Grid,
  List,
  Search,
  Trash2,
  Download,
  Image,
  Video,
  FileText,
  Music,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface MediaFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: string;
}

export default function MediaLibraryPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'images' | 'videos' | 'documents'>('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchMedia = async () => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('type', filter);
    if (search) params.set('search', search);

    const response = await fetch(`/api/admin/media?${params}`);
    const data = await response.json();
    setFiles(data.files);
  };

  useEffect(() => {
    fetchMedia();
  }, [filter, search]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const formData = new FormData();
        formData.append('file', file);

        await fetch('/api/admin/media/upload', {
          method: 'POST',
          body: formData,
        });

        setUploadProgress(((i + 1) / acceptedFiles.length) * 100);
      }

      toast({ title: `${acceptedFiles.length} file(s) uploaded successfully` });
      fetchMedia();
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Some files failed to upload',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov'],
      'audio/*': ['.mp3', '.wav', '.ogg'],
      'application/pdf': ['.pdf'],
    },
  });

  const handleDelete = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} file(s)?`)) return;

    try {
      await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      toast({ title: 'Files deleted' });
      setSelectedFiles(new Set());
      fetchMedia();
    } catch (error) {
      toast({
        title: 'Delete failed',
        variant: 'destructive',
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image')) return Image;
    if (type.startsWith('video')) return Video;
    if (type.startsWith('audio')) return Music;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="text-gray-500">
            Manage images, videos, and documents
          </p>
        </div>
        <div className="flex gap-2">
          {selectedFiles.size > 0 && (
            <Button
              variant="destructive"
              onClick={() => handleDelete(Array.from(selectedFiles))}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedFiles.size})
            </Button>
          )}
        </div>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Drop files here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-1">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-gray-400">
                  Images, videos, audio, and PDF files supported
                </p>
              </div>
            )}
          </div>

          {uploading && (
            <div className="mt-4">
              <Progress value={uploadProgress} />
              <p className="text-sm text-center mt-2 text-gray-500">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex border rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* File Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file) => {
            const Icon = getFileIcon(file.fileType);
            const isSelected = selectedFiles.has(file.id);

            return (
              <div
                key={file.id}
                onClick={() => {
                  setSelectedFiles((prev) => {
                    const next = new Set(prev);
                    next.has(file.id) ? next.delete(file.id) : next.add(file.id);
                    return next;
                  });
                }}
                className={`
                  relative group cursor-pointer rounded-lg border overflow-hidden
                  ${isSelected ? 'ring-2 ring-blue-500' : ''}
                `}
              >
                {file.fileType.startsWith('image') ? (
                  <img
                    src={file.fileUrl}
                    alt={file.fileName}
                    className="w-full aspect-square object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center bg-gray-100">
                    <Icon className="h-12 w-12 text-gray-400" />
                  </div>
                )}

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete([file.id]);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-2">
                  <p className="text-xs truncate">{file.fileName}</p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-3">File</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Size</th>
                  <th className="text-left p-3">Uploaded</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => {
                  const Icon = getFileIcon(file.fileType);
                  return (
                    <tr key={file.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 flex items-center gap-3">
                        <Icon className="h-5 w-5 text-gray-400" />
                        <span className="truncate max-w-xs">{file.fileName}</span>
                      </td>
                      <td className="p-3 text-gray-500">{file.fileType}</td>
                      <td className="p-3 text-gray-500">{formatFileSize(file.size)}</td>
                      <td className="p-3 text-gray-500">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete([file.id])}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

## Settings & Configuration

### Church Settings Page

```typescript
// app/admin/settings/page.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralSettings } from '@/components/admin/settings/GeneralSettings';
import { ProfileSettings } from '@/components/admin/settings/ProfileSettings';
import { ThemeSettings } from '@/components/admin/settings/ThemeSettings';
import { DomainSettings } from '@/components/admin/settings/DomainSettings';
import { IntegrationSettings } from '@/components/admin/settings/IntegrationSettings';
import { getTenantContext } from '@/lib/tenant/context';

export default async function SettingsPage() {
  const tenant = await getTenantContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500">Configure your church website</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="profile">Church Profile</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="domain">Domain</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings tenant={tenant} />
        </TabsContent>

        <TabsContent value="profile">
          <ProfileSettings tenant={tenant} />
        </TabsContent>

        <TabsContent value="theme">
          <ThemeSettings tenant={tenant} />
        </TabsContent>

        <TabsContent value="domain">
          <DomainSettings tenant={tenant} />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationSettings tenant={tenant} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Role-Based Access

### Admin Roles

| Role | Description | Permissions |
|------|-------------|------------|
| `SUPERUSER` | Church owner | Full access to all features |
| `ADMIN` | Church administrator | Manage content, members, settings |
| `CONTENT_MANAGER` | Content creator | Create/edit content only |
| `MINISTRY_LEADER` | Ministry leader | Manage assigned ministry |
| `VOLUNTEER` | Volunteer | Limited content access |
| `MEMBER` | Regular member | View-only access |

### Permission Middleware

```typescript
// lib/middleware/permission.ts
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

const roleHierarchy = [
  'GUEST',
  'MEMBER',
  'VOLUNTEER',
  'MINISTRY_LEADER',
  'CONTENT_MANAGER',
  'ADMIN',
  'SUPERUSER',
];

export async function checkPermission(
  requiredRoles: string[]
): Promise<{
  authorized: boolean;
  session: any;
  response?: NextResponse;
}> {
  const session = await getServerSession();

  if (!session?.user) {
    return {
      authorized: false,
      session: null,
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  const userRoleIndex = roleHierarchy.indexOf(session.user.role);
  const hasPermission = requiredRoles.some(
    (role) => roleHierarchy.indexOf(role) <= userRoleIndex
  );

  if (!hasPermission) {
    return {
      authorized: false,
      session,
      response: NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, session };
}
```

---

## Implementation

### API Routes Pattern

```typescript
// app/api/admin/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenant/context';
import { checkPermission } from '@/lib/middleware/permission';

// GET - List resources
export async function GET(request: NextRequest) {
  const { authorized, session, response } = await checkPermission([
    'CONTENT_MANAGER',
    'ADMIN',
    'SUPERUSER',
  ]);

  if (!authorized) return response;

  const tenant = await getTenantContext();
  const { searchParams } = new URL(request.url);

  // Implement list logic with filters, pagination
  // ...

  return NextResponse.json({ items, total, page, limit });
}

// POST - Create resource
export async function POST(request: NextRequest) {
  const { authorized, session, response } = await checkPermission([
    'CONTENT_MANAGER',
    'ADMIN',
    'SUPERUSER',
  ]);

  if (!authorized) return response;

  const tenant = await getTenantContext();
  const body = await request.json();

  // Implement create logic
  // ...

  return NextResponse.json(item, { status: 201 });
}
```

### Admin Sidebar Navigation

```typescript
// components/admin/AdminSidebar.tsx
const menuItems = [
  { label: 'Dashboard', href: '/admin', icon: Home },
  { label: 'Sermons', href: '/admin/sermons', icon: Video },
  { label: 'Events', href: '/admin/events', icon: Calendar },
  { label: 'Posts', href: '/admin/posts', icon: FileText },
  { label: 'Ministries', href: '/admin/ministries', icon: Building },
  { label: 'Members', href: '/admin/members', icon: Users, roles: ['ADMIN', 'SUPERUSER'] },
  { label: 'Media', href: '/admin/media', icon: Image },
  { label: 'Menu', href: '/admin/menus', icon: Menu, roles: ['ADMIN', 'SUPERUSER'] },
  { label: 'Giving', href: '/admin/giving', icon: DollarSign },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart, roles: ['ADMIN', 'SUPERUSER'] },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: ['ADMIN', 'SUPERUSER'],
    children: [
      { label: 'General', href: '/admin/settings' },
      { label: 'Profile', href: '/admin/settings/profile' },
      { label: 'Theme', href: '/admin/settings/theme' },
      { label: 'Domain', href: '/admin/settings/domain' },
      { label: 'Billing', href: '/admin/settings/billing' },
    ],
  },
];
```

---

**Document Version**: 3.0 Enterprise Edition
**Last Updated**: December 2024
**Next Document**: [08-template-system.md](./08-template-system.md)
