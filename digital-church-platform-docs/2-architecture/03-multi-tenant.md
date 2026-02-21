# Multi-Tenant Architecture

## Document Version: 3.0 Enterprise Edition

## Overview

The Digital Church Platform uses a **Shared Database, Shared Schema with Row-Level Security** multi-tenant architecture. This approach provides the optimal balance of data isolation, operational efficiency, and cost-effectiveness for a SaaS platform serving thousands of churches.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tenant Resolution Strategy](#tenant-resolution-strategy)
3. [Middleware Implementation](#middleware-implementation)
4. [Template Context Integration](#template-context-integration)
5. [Tenant Context Management](#tenant-context-management)
6. [Custom Domain Support](#custom-domain-support)
7. [Caching Strategy](#caching-strategy)
8. [Data Isolation](#data-isolation)
9. [Plan Limits & Feature Gating](#plan-limits--feature-gating)
10. [Security Considerations](#security-considerations)

---

## Architecture Overview

### Multi-Tenancy Strategy Comparison

| Strategy | Isolation | Cost | Maintenance | Scalability | Choice |
|----------|-----------|------|-------------|-------------|--------|
| Separate Database per Tenant | Highest | High | Complex | Limited | - |
| Separate Schema per Tenant | High | Medium | Medium | Medium | - |
| **Shared Schema + Row-Level Security** | Medium | Low | Simple | High | **Selected** |

### Request Flow

```
User Request (church.digitalchurch.com or www.firstbaptist.org)
    ↓
┌─────────────────────────────────────────┐
│           Edge Middleware                │
│  - Parse hostname                        │
│  - Identify tenant type                  │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│         Tenant Resolution                │
│  - Check custom domain mapping           │
│  - Check subdomain registry              │
│  - Validate tenant status                │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│       Template Configuration             │
│  - Load active template                  │
│  - Merge tenant customizations           │
│  - Prepare theme variables               │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│         Context Injection                │
│  - Set x-tenant-id header                │
│  - Set x-template-id header              │
│  - Inject theme CSS variables            │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│         Application Layer                │
│  - Route to appropriate page             │
│  - Apply tenant-scoped queries           │
│  - Render with template styling          │
└─────────────────────────────────────────┘
```

### Platform Domains

| Domain Type | Example | Purpose |
|-------------|---------|---------|
| Platform Main | digitalchurch.com | Marketing, pricing, signup |
| Platform Admin | admin.digitalchurch.com | SaaS administration |
| Church Subdomain | firstbaptist.digitalchurch.com | Church website |
| Custom Domain | www.firstbaptist.org | Church custom domain |
| API | api.digitalchurch.com | Public API access |

---

## Tenant Resolution Strategy

### Resolution Priority

1. **Custom Domain** (highest priority)
   - Direct lookup in `CustomDomain` table
   - Requires DNS verification and SSL certificate

2. **Subdomain**
   - Extract from hostname (e.g., `firstbaptist` from `firstbaptist.digitalchurch.com`)
   - Match against `Tenant.subdomain` field

3. **Platform Domain**
   - Routes to platform marketing/admin pages
   - No tenant context

### Domain Types

```typescript
// lib/tenant/types.ts
export interface TenantIdentification {
  type: 'platform' | 'platform-admin' | 'tenant' | 'unknown';
  subdomain?: string;
  customDomain?: string;
  isPlatformAdmin?: boolean;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  customDomain: string | null;
  status: TenantStatus;
  plan: {
    id: string;
    name: string;
    tier: PlanTier;
    features: PlanFeatures;
    limits: PlanLimits;
  };
  settings: TenantSettings;
  theme: TenantTheme;
  templateId: string;
  templateCustomizations: Record<string, any>;
}

export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED';

export interface PlanLimits {
  maxUsers: number;
  maxStorage: number;  // MB
  maxSermons: number;
  maxEvents: number;
  maxMinistries: number;
  maxGroups: number;
  customDomain: boolean;
  whiteLabel: boolean;
  analytics: boolean;
  apiAccess: boolean;
}

export interface TenantSettings {
  timezone: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  emailNotifications: boolean;
  maintenanceMode: boolean;
}

export interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  fontFamily: string;
}
```

### Tenant Resolver Service

```typescript
// lib/tenant/resolver.ts
import { prisma } from '@/lib/db/client';
import { cache } from 'react';
import type { TenantInfo, TenantIdentification } from './types';

const PLATFORM_DOMAINS = [
  'digitalchurch.com',
  'www.digitalchurch.com',
  'localhost:3000',
];

const RESERVED_SUBDOMAINS = [
  'www', 'admin', 'api', 'app', 'mail', 'smtp', 'ftp',
  'static', 'cdn', 'assets', 'demo', 'test', 'staging',
  'dev', 'blog', 'help', 'support', 'status', 'docs',
];

// React cache ensures single execution per request
export const identifyTenant = cache(async (
  hostname: string
): Promise<TenantIdentification> => {
  const normalizedHost = hostname.toLowerCase().split(':')[0];

  // Platform admin
  if (normalizedHost === 'admin.digitalchurch.com') {
    return { type: 'platform-admin', isPlatformAdmin: true };
  }

  // Platform main
  if (PLATFORM_DOMAINS.includes(normalizedHost)) {
    return { type: 'platform' };
  }

  // Custom domain check
  const tenantByDomain = await findTenantByCustomDomain(normalizedHost);
  if (tenantByDomain) {
    return { type: 'tenant', customDomain: normalizedHost };
  }

  // Subdomain check
  const subdomain = extractSubdomain(normalizedHost);
  if (subdomain && !RESERVED_SUBDOMAINS.includes(subdomain)) {
    const tenantBySubdomain = await findTenantBySubdomain(subdomain);
    if (tenantBySubdomain) {
      return { type: 'tenant', subdomain };
    }
  }

  return { type: 'unknown' };
});

function extractSubdomain(hostname: string): string | null {
  const platformDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'digitalchurch.com';

  if (hostname.endsWith(`.${platformDomain}`)) {
    return hostname.replace(`.${platformDomain}`, '');
  }

  return null;
}

async function findTenantByCustomDomain(domain: string): Promise<TenantInfo | null> {
  const customDomain = await prisma.customDomain.findFirst({
    where: {
      domain: domain.toLowerCase(),
      verified: true,
    },
    include: {
      tenant: {
        include: {
          plan: true,
          templateCustomization: true,
        },
      },
    },
  });

  if (!customDomain || customDomain.tenant.status === 'CANCELLED') {
    return null;
  }

  return mapToTenantInfo(customDomain.tenant);
}

async function findTenantBySubdomain(subdomain: string): Promise<TenantInfo | null> {
  const tenant = await prisma.tenant.findFirst({
    where: {
      subdomain: subdomain.toLowerCase(),
      status: { in: ['ACTIVE', 'TRIAL'] },
    },
    include: {
      plan: true,
      templateCustomization: true,
    },
  });

  if (!tenant) return null;

  return mapToTenantInfo(tenant);
}

function mapToTenantInfo(tenant: any): TenantInfo {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.subdomain,
    subdomain: tenant.subdomain,
    customDomain: tenant.customDomain,
    status: tenant.status,
    plan: {
      id: tenant.plan.id,
      name: tenant.plan.name,
      tier: tenant.plan.tier,
      features: tenant.plan.features as any,
      limits: {
        maxUsers: tenant.plan.maxUsers,
        maxStorage: tenant.plan.maxStorageMb,
        maxSermons: tenant.plan.maxSermons,
        maxEvents: tenant.plan.maxEvents,
        maxMinistries: tenant.plan.maxMinistries,
        maxGroups: tenant.plan.maxGroups,
        customDomain: tenant.plan.customDomain,
        whiteLabel: tenant.plan.whiteLabel,
        analytics: tenant.plan.analytics,
        apiAccess: tenant.plan.apiAccess,
      },
    },
    settings: tenant.settings || getDefaultSettings(),
    theme: tenant.theme || getDefaultTheme(),
    templateId: tenant.templateCustomization?.templateId || 'default',
    templateCustomizations: tenant.templateCustomization?.customizations || {},
  };
}

function getDefaultSettings(): TenantSettings {
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

function getDefaultTheme(): TenantTheme {
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

## Middleware Implementation

### Next.js Edge Middleware

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'digitalchurch.com';

const PLATFORM_DOMAINS = [
  'localhost',
  PLATFORM_DOMAIN,
  `www.${PLATFORM_DOMAIN}`,
  `admin.${PLATFORM_DOMAIN}`,
  `api.${PLATFORM_DOMAIN}`,
];

const RESERVED_SUBDOMAINS = [
  'www', 'admin', 'api', 'app', 'mail', 'ftp',
  'static', 'cdn', 'assets', 'demo', 'test', 'staging', 'dev',
];

const PUBLIC_PATHS = [
  '/', '/about', '/contact', '/sermons', '/events', '/ministries',
  '/login', '/register', '/forgot-password', '/reset-password',
];

const STATIC_PATTERNS = [
  '/_next', '/static', '/images', '/favicon.ico', '/robots.txt', '/sitemap.xml',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Skip static files
  if (isStaticPath(pathname)) {
    return NextResponse.next();
  }

  // Analyze host
  const hostInfo = analyzeHost(hostname);

  // Route based on host type
  switch (hostInfo.type) {
    case 'platform-admin':
      return handlePlatformAdminRequest(request);
    case 'platform':
      return handlePlatformRequest(request);
    case 'tenant':
      return handleTenantRequest(request, hostInfo);
    default:
      return handleUnknownDomain(request, hostname);
  }
}

interface HostInfo {
  type: 'platform' | 'platform-admin' | 'tenant' | 'unknown';
  subdomain?: string;
  customDomain?: string;
}

function analyzeHost(hostname: string): HostInfo {
  const normalizedHost = hostname.toLowerCase().split(':')[0];

  // Platform admin
  if (normalizedHost === `admin.${PLATFORM_DOMAIN}`) {
    return { type: 'platform-admin' };
  }

  // Platform main
  if (PLATFORM_DOMAINS.includes(normalizedHost)) {
    return { type: 'platform' };
  }

  // Subdomain (church.digitalchurch.com)
  if (normalizedHost.endsWith(`.${PLATFORM_DOMAIN}`)) {
    const subdomain = normalizedHost.replace(`.${PLATFORM_DOMAIN}`, '');
    if (!RESERVED_SUBDOMAINS.includes(subdomain)) {
      return { type: 'tenant', subdomain };
    }
  }

  // Custom domain
  return { type: 'tenant', customDomain: normalizedHost };
}

function isStaticPath(pathname: string): boolean {
  return STATIC_PATTERNS.some(pattern => pathname.startsWith(pattern));
}

async function handleTenantRequest(
  request: NextRequest,
  hostInfo: HostInfo
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Inject tenant identification headers
  if (hostInfo.subdomain) {
    response.headers.set('x-tenant-subdomain', hostInfo.subdomain);
  }
  if (hostInfo.customDomain) {
    response.headers.set('x-tenant-domain', hostInfo.customDomain);
  }
  response.headers.set('x-tenant-context', 'true');

  // Admin pages require authentication
  if (pathname.startsWith('/admin')) {
    return handleTenantAdminAuth(request, response);
  }

  // Protected API routes
  if (pathname.startsWith('/api') && !isPublicApiPath(pathname)) {
    return handleApiAuth(request, response);
  }

  return response;
}

async function handleTenantAdminAuth(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  const token = await getToken({ req: request });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const allowedRoles = ['SUPERUSER', 'ADMIN', 'CONTENT_MANAGER', 'MINISTRY_LEADER'];
  if (!allowedRoles.includes(token.role as string)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  response.headers.set('x-user-id', token.sub as string);
  response.headers.set('x-user-role', token.role as string);

  return response;
}

async function handlePlatformAdminRequest(
  request: NextRequest
): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  response.headers.set('x-platform-context', 'true');
  response.headers.set('x-platform-admin', 'true');

  // Allow login page
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return response;
  }

  const token = await getToken({ req: request });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (token.role !== 'PLATFORM_ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return response;
}

async function handlePlatformRequest(
  request: NextRequest
): Promise<NextResponse> {
  const response = NextResponse.next();
  response.headers.set('x-platform-context', 'true');
  return response;
}

async function handleUnknownDomain(
  request: NextRequest,
  hostname: string
): Promise<NextResponse> {
  console.warn(`Unknown domain: ${hostname}`);
  return NextResponse.redirect(
    new URL(`https://${PLATFORM_DOMAIN}/not-found`)
  );
}

async function handleApiAuth(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  const token = await getToken({ req: request });

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  response.headers.set('x-user-id', token.sub as string);
  response.headers.set('x-user-role', token.role as string);

  return response;
}

function isPublicApiPath(pathname: string): boolean {
  const publicPaths = ['/api/auth', '/api/public', '/api/webhooks'];
  return publicPaths.some(path => pathname.startsWith(path));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Template Context Integration

### Template Loader

```typescript
// lib/template/loader.ts
import { prisma } from '@/lib/db/client';
import { unstable_cache } from 'next/cache';
import path from 'path';
import fs from 'fs/promises';

export interface TemplateConfig {
  templateId: string;
  name: string;
  description: string;
  version: string;
  preview: string;
  theme: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      foreground: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
    borderRadius: string;
    shadows: 'none' | 'soft' | 'sharp';
  };
  layouts: {
    header: 'sticky' | 'fixed' | 'static';
    footer: 'simple' | 'multi-column' | 'minimal';
    sidebar: 'none' | 'left' | 'right';
  };
  sections: Record<string, {
    variants: string[];
    defaultVariant: string;
  }>;
  customizations?: Record<string, any>;
}

export const getTemplateConfig = unstable_cache(
  async (tenantId: string): Promise<TemplateConfig | null> => {
    const customization = await prisma.templateCustomization.findFirst({
      where: { tenantId },
    });

    if (!customization) {
      return await getDefaultTemplateConfig();
    }

    const baseConfig = await loadTemplateFromFile(customization.templateId);

    if (!baseConfig) {
      return await getDefaultTemplateConfig();
    }

    // Merge tenant customizations
    return deepMerge(baseConfig, {
      customizations: customization.customizations as Record<string, any>,
      theme: deepMerge(
        baseConfig.theme,
        (customization.customizations as any)?.theme || {}
      ),
    });
  },
  ['template-config'],
  { tags: ['template'], revalidate: 300 }
);

async function loadTemplateFromFile(templateId: string): Promise<TemplateConfig | null> {
  try {
    const templatePath = path.join(
      process.cwd(),
      'templates',
      templateId,
      'template.json'
    );
    const content = await fs.readFile(templatePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load template ${templateId}:`, error);
    return null;
  }
}

export async function getDefaultTemplateConfig(): Promise<TemplateConfig> {
  const defaultTemplate = await loadTemplateFromFile('default');

  if (!defaultTemplate) {
    return {
      templateId: 'default',
      name: 'Default Template',
      description: 'Default church website template',
      version: '1.0.0',
      preview: '/templates/default/preview.png',
      theme: {
        colors: {
          primary: '#0ea5e9',
          secondary: '#1e293b',
          accent: '#f97316',
          background: '#ffffff',
          foreground: '#0f172a',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
        },
        borderRadius: '0.5rem',
        shadows: 'soft',
      },
      layouts: {
        header: 'sticky',
        footer: 'multi-column',
        sidebar: 'none',
      },
      sections: {},
    };
  }

  return defaultTemplate;
}

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        result[key] = deepMerge(
          (target[key] as Record<string, any>) || {},
          source[key] as Record<string, any>
        ) as T[typeof key];
      } else {
        result[key] = source[key] as T[typeof key];
      }
    }
  }

  return result;
}

export async function invalidateTemplateCache(tenantId: string) {
  const { revalidateTag } = await import('next/cache');
  revalidateTag(`template-${tenantId}`);
}
```

### CSS Variable Generator

```typescript
// lib/template/css-injector.ts
import type { TemplateConfig } from './loader';

export function generateCSSVariables(config: TemplateConfig): string {
  const { theme } = config;

  return `
    :root {
      /* Colors */
      --color-primary: ${theme.colors.primary};
      --color-secondary: ${theme.colors.secondary};
      --color-accent: ${theme.colors.accent};
      --color-background: ${theme.colors.background};
      --color-foreground: ${theme.colors.foreground};

      /* Fonts */
      --font-heading: '${theme.fonts.heading}', sans-serif;
      --font-body: '${theme.fonts.body}', sans-serif;

      /* Border Radius */
      --radius: ${theme.borderRadius};
      --radius-sm: calc(${theme.borderRadius} * 0.5);
      --radius-lg: calc(${theme.borderRadius} * 1.5);
      --radius-xl: calc(${theme.borderRadius} * 2);
      --radius-full: 9999px;

      /* Shadows */
      ${generateShadowVariables(theme.shadows)}
    }
  `;
}

function generateShadowVariables(shadowType: string): string {
  const shadows = {
    none: {
      sm: 'none',
      md: 'none',
      lg: 'none',
    },
    soft: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
    sharp: {
      sm: '0 1px 3px rgba(0, 0, 0, 0.12)',
      md: '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
      lg: '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)',
    },
  };

  const selected = shadows[shadowType as keyof typeof shadows] || shadows.soft;

  return `
    --shadow-sm: ${selected.sm};
    --shadow-md: ${selected.md};
    --shadow-lg: ${selected.lg};
  `;
}
```

---

## Tenant Context Management

### AsyncLocalStorage-Based Context (Thread-Safe)

The tenant context must be thread-safe for concurrent request handling. We use Node.js AsyncLocalStorage to maintain tenant context throughout the request lifecycle without race conditions.

```typescript
// lib/tenant/context.ts
import { AsyncLocalStorage } from 'async_hooks';

interface TenantContext {
  tenantId: string;
  userId?: string;
  userRole?: string;
  isImpersonating?: boolean;
  impersonatorId?: string;
}

// Global AsyncLocalStorage instance for tenant context
const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Run a function within a tenant context.
 * All code executed within fn will have access to the tenant context.
 */
export function runWithTenant<T>(context: TenantContext, fn: () => T): T {
  return tenantStorage.run(context, fn);
}

/**
 * Run an async function within a tenant context.
 */
export async function runWithTenantAsync<T>(
  context: TenantContext,
  fn: () => Promise<T>
): Promise<T> {
  return tenantStorage.run(context, fn);
}

/**
 * Get the current tenant ID from context.
 * Returns null if not in a tenant context.
 */
export function getCurrentTenantId(): string | null {
  return tenantStorage.getStore()?.tenantId ?? null;
}

/**
 * Get the current tenant ID, throwing if not available.
 * Use this when tenant context is required.
 */
export function requireCurrentTenantId(): string {
  const tenantId = getCurrentTenantId();
  if (!tenantId) {
    throw new Error('Tenant context required but not found. Ensure this code runs within runWithTenant().');
  }
  return tenantId;
}

/**
 * Get the current user ID from context.
 */
export function getCurrentUserId(): string | null {
  return tenantStorage.getStore()?.userId ?? null;
}

/**
 * Get the full tenant context.
 */
export function getTenantContext(): TenantContext | null {
  return tenantStorage.getStore() ?? null;
}

/**
 * Check if currently in an impersonation session.
 */
export function isImpersonating(): boolean {
  return tenantStorage.getStore()?.isImpersonating ?? false;
}

/**
 * Get the impersonator's ID if in an impersonation session.
 */
export function getImpersonatorId(): string | null {
  return tenantStorage.getStore()?.impersonatorId ?? null;
}
```

### Middleware Integration with AsyncLocalStorage

```typescript
// lib/tenant/middleware-context.ts
import { NextRequest, NextResponse } from 'next/server';
import { runWithTenantAsync, TenantContext } from './context';

/**
 * Wraps an API route handler with tenant context.
 * This ensures all database operations are automatically scoped.
 */
export function withTenantContext<T>(
  handler: (req: NextRequest, context: TenantContext) => Promise<T>
) {
  return async (req: NextRequest): Promise<T> => {
    const tenantId = req.headers.get('x-tenant-id');
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');
    const impersonatorId = req.headers.get('x-impersonator-id');

    if (!tenantId) {
      throw new Error('Tenant ID required');
    }

    const context: TenantContext = {
      tenantId,
      userId: userId ?? undefined,
      userRole: userRole ?? undefined,
      isImpersonating: !!impersonatorId,
      impersonatorId: impersonatorId ?? undefined,
    };

    return runWithTenantAsync(context, () => handler(req, context));
  };
}

// Example usage in API route:
// export const GET = withTenantContext(async (req, context) => {
//   const members = await prisma.member.findMany(); // Automatically scoped
//   return NextResponse.json(members);
// });
```

### PostgreSQL Session Variable (Alternative)

For raw SQL queries and stored procedures, set the tenant context at the database session level:

```typescript
// lib/db/with-tenant-session.ts
import { PrismaClient } from '@prisma/client';
import { getCurrentTenantId } from '@/lib/tenant/context';

const prisma = new PrismaClient();

/**
 * Execute operations with PostgreSQL session-level tenant context.
 * This enables Row Level Security policies to work correctly.
 */
export async function withTenantSession<T>(
  operation: () => Promise<T>
): Promise<T> {
  const tenantId = getCurrentTenantId();

  if (!tenantId) {
    throw new Error('Tenant context required for database operations');
  }

  // Set PostgreSQL session variable for RLS
  await prisma.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

  try {
    return await operation();
  } finally {
    // Reset the session variable
    await prisma.$executeRaw`SELECT set_config('app.tenant_id', '', true)`;
  }
}

/**
 * Execute raw SQL with automatic tenant context.
 */
export async function executeRawWithTenant<T>(
  query: TemplateStringsArray,
  ...values: any[]
): Promise<T> {
  return withTenantSession(async () => {
    return prisma.$queryRaw(query, ...values) as Promise<T>;
  });
}
```

### Server Context

```typescript
// lib/tenant/server-context.ts
import { cache } from 'react';
import { headers } from 'next/headers';
import { identifyTenant } from './resolver';
import type { TenantInfo } from './types';

export const getServerTenant = cache(async (): Promise<TenantInfo | null> => {
  const headersList = headers();
  const hostname = headersList.get('host') || 'localhost';

  const result = await identifyTenant(hostname);

  if (result.type === 'tenant') {
    // Full tenant lookup
    const subdomain = headersList.get('x-tenant-subdomain');
    const domain = headersList.get('x-tenant-domain');

    // Resolve full tenant info
    return await resolveTenantDetails(subdomain, domain);
  }

  return null;
});

export const getServerTenantId = cache(async (): Promise<string | null> => {
  const tenant = await getServerTenant();
  return tenant?.id ?? null;
});

export const isPlatformAdminContext = cache(async (): Promise<boolean> => {
  const headersList = headers();
  return headersList.get('x-platform-admin') === 'true';
});

export function requireTenant(): string {
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');

  if (!tenantId) {
    throw new Error('Tenant context required but not found');
  }

  return tenantId;
}

async function resolveTenantDetails(
  subdomain: string | null,
  domain: string | null
): Promise<TenantInfo | null> {
  // Import resolver functions
  const { findTenantBySubdomain, findTenantByCustomDomain } = await import('./resolver');

  if (domain) {
    return findTenantByCustomDomain(domain);
  }

  if (subdomain) {
    return findTenantBySubdomain(subdomain);
  }

  return null;
}
```

### Client Context Provider

```typescript
// contexts/TenantContext.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { TenantInfo } from '@/lib/tenant/types';

interface TenantContextValue {
  tenant: TenantInfo | null;
  isPlatform: boolean;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  isPlatform: false,
  isLoading: true,
});

interface TenantProviderProps {
  children: ReactNode;
  tenant: TenantInfo | null;
  isPlatform?: boolean;
}

export function TenantProvider({
  children,
  tenant,
  isPlatform = false,
}: TenantProviderProps) {
  return (
    <TenantContext.Provider
      value={{ tenant, isPlatform, isLoading: false }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}

export function useTenantId(): string | null {
  const { tenant } = useTenant();
  return tenant?.id ?? null;
}

export function useTenantSettings() {
  const { tenant } = useTenant();
  return tenant?.settings ?? null;
}

export function useTenantTheme() {
  const { tenant } = useTenant();
  return tenant?.theme ?? null;
}

export function useTenantPlan() {
  const { tenant } = useTenant();
  return tenant?.plan ?? null;
}
```

---

## Custom Domain Support

### Domain Verification Service

```typescript
// lib/tenant/custom-domains.ts
import { prisma } from '@/lib/db/client';
import crypto from 'crypto';
import dns from 'dns/promises';

export interface CustomDomainResult {
  success: boolean;
  domain?: {
    id: string;
    domain: string;
    verified: boolean;
    verificationToken: string;
    verificationMethod: string;
  };
  error?: string;
}

export async function addCustomDomain(
  tenantId: string,
  domain: string,
  verificationMethod: 'dns' | 'http' = 'dns'
): Promise<CustomDomainResult> {
  // Validate domain format
  if (!isValidDomain(domain)) {
    return { success: false, error: 'Invalid domain format' };
  }

  // Check if already in use
  const existing = await prisma.customDomain.findFirst({
    where: { domain: domain.toLowerCase() },
  });

  if (existing) {
    return { success: false, error: 'Domain already in use' };
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Create domain record
  const customDomain = await prisma.customDomain.create({
    data: {
      tenantId,
      domain: domain.toLowerCase(),
      verificationToken,
      verificationMethod,
    },
  });

  return {
    success: true,
    domain: {
      id: customDomain.id,
      domain: customDomain.domain,
      verified: customDomain.verified,
      verificationToken: customDomain.verificationToken,
      verificationMethod: customDomain.verificationMethod,
    },
  };
}

export async function verifyCustomDomain(
  customDomainId: string
): Promise<{ success: boolean; error?: string }> {
  const customDomain = await prisma.customDomain.findUnique({
    where: { id: customDomainId },
  });

  if (!customDomain) {
    return { success: false, error: 'Domain not found' };
  }

  try {
    // Check TXT record
    const txtRecords = await dns.resolveTxt(
      `_digitalchurch-verify.${customDomain.domain}`
    );

    const isVerified = txtRecords.some(record =>
      record.includes(customDomain.verificationToken)
    );

    if (isVerified) {
      await prisma.customDomain.update({
        where: { id: customDomainId },
        data: {
          verified: true,
          verifiedAt: new Date(),
        },
      });

      // Invalidate tenant cache
      await invalidateTenantCache(customDomain.tenantId);

      return { success: true };
    }

    return { success: false, error: 'Verification record not found' };
  } catch (error) {
    console.error('DNS verification error:', error);
    return { success: false, error: 'DNS lookup failed' };
  }
}

function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/i;
  return domainRegex.test(domain) && domain.includes('.');
}

async function invalidateTenantCache(tenantId: string) {
  const { revalidateTag } = await import('next/cache');
  revalidateTag(`tenant-${tenantId}`);
}
```

### DNS Instructions Component

```typescript
// components/admin/DNSInstructions.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, CheckCircle, AlertCircle } from 'lucide-react';

interface DNSInstructionsProps {
  domain: string;
  verificationToken: string;
  verified: boolean;
  onVerify: () => void;
}

export function DNSInstructions({
  domain,
  verificationToken,
  verified,
  onVerify,
}: DNSInstructionsProps) {
  const records = [
    {
      type: 'TXT',
      name: `_digitalchurch-verify.${domain}`,
      value: verificationToken,
      purpose: 'Domain verification',
    },
    {
      type: 'CNAME',
      name: domain,
      value: 'cname.digitalchurch.com',
      purpose: 'Point domain to platform',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          DNS Configuration
          {verified ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {verified ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              Domain verified and active!
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert>
              <AlertDescription>
                Add the following DNS records to verify ownership:
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {records.map((record, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{record.type} Record</span>
                    <span className="text-sm text-gray-500">{record.purpose}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <code className="block bg-gray-100 p-2 rounded mt-1">
                        {record.name}
                      </code>
                    </div>
                    <div>
                      <span className="text-gray-500">Value:</span>
                      <code className="block bg-gray-100 p-2 rounded mt-1 break-all">
                        {record.value}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onVerify}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Verify DNS Records
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Caching Strategy

### Multi-Layer Cache

```typescript
// lib/cache/tenant-cache.ts
import { LRUCache } from 'lru-cache';
import { Redis } from 'ioredis';

interface CachedTenant {
  id: string;
  status: string;
  planId: string;
  templateId: string;
}

// In-memory cache (per-instance)
const memoryCache = new LRUCache<string, CachedTenant>({
  max: 1000,
  ttl: 1000 * 60 * 5, // 5 minutes
  updateAgeOnGet: true,
});

// Redis cache (shared across instances)
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const TenantCache = {
  async get(key: string): Promise<CachedTenant | null> {
    // Check memory first
    const memResult = memoryCache.get(key);
    if (memResult) return memResult;

    // Check Redis
    try {
      const redisResult = await redis.get(`tenant:${key}`);
      if (redisResult) {
        const parsed = JSON.parse(redisResult);
        memoryCache.set(key, parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Redis get error:', error);
    }

    return null;
  },

  async set(key: string, value: CachedTenant, ttl: number = 300): Promise<void> {
    memoryCache.set(key, value);

    try {
      await redis.setex(`tenant:${key}`, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  },

  async invalidate(tenantId: string): Promise<void> {
    // Find all keys for this tenant
    const patterns = [
      `subdomain:*`,
      `domain:*`,
    ];

    // Clear memory cache
    for (const [key, value] of memoryCache.entries()) {
      if (value.id === tenantId) {
        memoryCache.delete(key);
      }
    }

    // Clear Redis cache
    try {
      const keys = await redis.keys(`tenant:*`);
      for (const key of keys) {
        const value = await redis.get(key);
        if (value) {
          const parsed = JSON.parse(value);
          if (parsed.id === tenantId) {
            await redis.del(key);
          }
        }
      }
    } catch (error) {
      console.error('Redis invalidate error:', error);
    }
  },

  async clear(): Promise<void> {
    memoryCache.clear();
    try {
      const keys = await redis.keys('tenant:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  },
};
```

### Redis Pub/Sub for Multi-Instance Cache Invalidation

In a horizontally scaled environment with multiple application instances, cache invalidation must be broadcast to all instances. Use Redis Pub/Sub for real-time cache synchronization.

```typescript
// lib/cache/cache-invalidation.ts
import { Redis } from 'ioredis';
import { revalidateTag } from 'next/cache';

const INVALIDATION_CHANNEL = 'cache:invalidation';

// Publisher (for sending invalidation messages)
const publisher = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Subscriber (for receiving invalidation messages)
const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface InvalidationMessage {
  type: 'tenant' | 'template' | 'module' | 'settings' | 'all';
  tenantId?: string;
  tags?: string[];
  timestamp: number;
  originInstanceId: string;
}

// Unique instance ID for this application instance
const INSTANCE_ID = `${process.env.HOSTNAME || 'local'}-${process.pid}-${Date.now()}`;

// Local memory cache reference
let localCacheRef: LRUCache<string, any> | null = null;

export function setLocalCache(cache: LRUCache<string, any>) {
  localCacheRef = cache;
}

/**
 * Initialize the cache invalidation subscriber.
 * Call this once during application startup.
 */
export async function initCacheInvalidationSubscriber(): Promise<void> {
  await subscriber.subscribe(INVALIDATION_CHANNEL);

  subscriber.on('message', (channel, message) => {
    if (channel !== INVALIDATION_CHANNEL) return;

    try {
      const invalidation: InvalidationMessage = JSON.parse(message);

      // Skip messages from this instance (we already invalidated locally)
      if (invalidation.originInstanceId === INSTANCE_ID) {
        return;
      }

      handleInvalidation(invalidation);
    } catch (error) {
      console.error('Failed to process invalidation message:', error);
    }
  });

  console.log(`Cache invalidation subscriber initialized for instance: ${INSTANCE_ID}`);
}

/**
 * Handle incoming cache invalidation messages.
 */
function handleInvalidation(msg: InvalidationMessage): void {
  console.log(`Received cache invalidation: ${msg.type} for tenant: ${msg.tenantId || 'all'}`);

  switch (msg.type) {
    case 'tenant':
      if (msg.tenantId) {
        invalidateLocalTenantCache(msg.tenantId);
      }
      break;

    case 'template':
      if (msg.tenantId) {
        revalidateTag(`template-${msg.tenantId}`);
      }
      break;

    case 'module':
      if (msg.tenantId) {
        invalidateLocalTenantCache(msg.tenantId);
        revalidateTag(`modules-${msg.tenantId}`);
      }
      break;

    case 'settings':
      if (msg.tenantId) {
        revalidateTag(`settings-${msg.tenantId}`);
      }
      break;

    case 'all':
      if (localCacheRef) {
        localCacheRef.clear();
      }
      break;
  }

  // Revalidate any additional tags
  if (msg.tags) {
    msg.tags.forEach(tag => revalidateTag(tag));
  }
}

/**
 * Invalidate local memory cache for a specific tenant.
 */
function invalidateLocalTenantCache(tenantId: string): void {
  if (!localCacheRef) return;

  for (const [key, value] of localCacheRef.entries()) {
    if (value?.id === tenantId || key.includes(tenantId)) {
      localCacheRef.delete(key);
    }
  }
}

/**
 * Broadcast cache invalidation to all instances.
 * Also invalidates local cache immediately.
 */
export async function broadcastInvalidation(
  type: InvalidationMessage['type'],
  options?: {
    tenantId?: string;
    tags?: string[];
  }
): Promise<void> {
  const message: InvalidationMessage = {
    type,
    tenantId: options?.tenantId,
    tags: options?.tags,
    timestamp: Date.now(),
    originInstanceId: INSTANCE_ID,
  };

  // Invalidate locally first
  handleInvalidation(message);

  // Broadcast to other instances
  try {
    await publisher.publish(INVALIDATION_CHANNEL, JSON.stringify(message));
  } catch (error) {
    console.error('Failed to broadcast cache invalidation:', error);
  }
}

/**
 * Invalidate tenant cache across all instances.
 */
export async function invalidateTenantCacheGlobal(tenantId: string): Promise<void> {
  await broadcastInvalidation('tenant', { tenantId });
}

/**
 * Invalidate template cache across all instances.
 */
export async function invalidateTemplateCacheGlobal(tenantId: string): Promise<void> {
  await broadcastInvalidation('template', { tenantId });
}

/**
 * Invalidate module cache across all instances.
 */
export async function invalidateModuleCacheGlobal(tenantId: string): Promise<void> {
  await broadcastInvalidation('module', {
    tenantId,
    tags: [`modules-${tenantId}`, `tenant-${tenantId}`],
  });
}

/**
 * Clear all caches across all instances. Use sparingly.
 */
export async function clearAllCachesGlobal(): Promise<void> {
  await broadcastInvalidation('all');
}
```

### Application Startup Integration

```typescript
// app/layout.tsx or instrumentation.ts
import { initCacheInvalidationSubscriber, setLocalCache } from '@/lib/cache/cache-invalidation';
import { memoryCache } from '@/lib/cache/tenant-cache';

// Initialize on server startup
if (typeof window === 'undefined') {
  // Set local cache reference
  setLocalCache(memoryCache);

  // Initialize subscriber
  initCacheInvalidationSubscriber()
    .then(() => console.log('Cache invalidation system ready'))
    .catch(console.error);
}
```

### Usage Examples

```typescript
// After updating tenant settings
await prisma.tenant.update({
  where: { id: tenantId },
  data: { settings: newSettings },
});
await invalidateTenantCacheGlobal(tenantId);

// After changing template customization
await prisma.templateCustomization.update({
  where: { tenantId },
  data: { customizations: newCustomizations },
});
await invalidateTemplateCacheGlobal(tenantId);

// After module activation/deactivation
await prisma.tenantModule.update({
  where: { id: moduleId },
  data: { status: 'ACTIVE' },
});
await invalidateModuleCacheGlobal(tenantId);
```

---

## Data Isolation

### PostgreSQL Row Level Security (RLS) Policies

While Prisma Extension handles most cases, RLS provides defense-in-depth for raw SQL queries and edge cases. Enable RLS on all tenant-scoped tables.

```sql
-- =====================================================
-- ROW LEVEL SECURITY SETUP
-- Run this migration after table creation
-- =====================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- These policies restrict access based on session variable
-- =====================================================

-- Users table policy
CREATE POLICY tenant_isolation_users ON users
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Members table policy
CREATE POLICY tenant_isolation_members ON members
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Sermons table policy
CREATE POLICY tenant_isolation_sermons ON sermons
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Events table policy
CREATE POLICY tenant_isolation_events ON events
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Donations table policy
CREATE POLICY tenant_isolation_donations ON donations
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Ministries table policy
CREATE POLICY tenant_isolation_ministries ON ministries
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Groups table policy
CREATE POLICY tenant_isolation_groups ON groups
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Pages table policy
CREATE POLICY tenant_isolation_pages ON pages
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Media table policy
CREATE POLICY tenant_isolation_media ON media
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Communications table policy
CREATE POLICY tenant_isolation_communications ON communications
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Custom Domains table policy
CREATE POLICY tenant_isolation_custom_domains ON custom_domains
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Translations table policy
CREATE POLICY tenant_isolation_translations ON translations
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Audit Logs policy (nullable tenant_id for platform-level logs)
CREATE POLICY tenant_isolation_audit_logs ON audit_logs
  FOR ALL
  USING (
    tenant_id IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );

-- =====================================================
-- BYPASS POLICIES FOR PLATFORM ADMIN
-- Service account used by platform admin can bypass RLS
-- =====================================================

-- Create policy for platform admin operations
CREATE POLICY platform_admin_bypass ON users
  FOR ALL
  USING (current_setting('app.is_platform_admin', true)::boolean = true);

-- Apply similar bypass policies to other tables as needed
```

### RLS Helper Functions

```sql
-- Function to set tenant context for a database session
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.tenant_id', p_tenant_id::text, false);
  PERFORM set_config('app.is_platform_admin', 'false', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear tenant context
CREATE OR REPLACE FUNCTION clear_tenant_context()
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.tenant_id', '', false);
  PERFORM set_config('app.is_platform_admin', 'false', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enable platform admin bypass
CREATE OR REPLACE FUNCTION enable_platform_admin()
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.is_platform_admin', 'true', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify tenant context is set (for debugging)
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  v_tenant_id TEXT;
BEGIN
  v_tenant_id := current_setting('app.tenant_id', true);
  IF v_tenant_id IS NULL OR v_tenant_id = '' THEN
    RETURN NULL;
  END IF;
  RETURN v_tenant_id::uuid;
END;
$$ LANGUAGE plpgsql STABLE;
```

### Prisma RLS Integration

```typescript
// lib/db/rls-client.ts
import { PrismaClient } from '@prisma/client';
import { getCurrentTenantId } from '@/lib/tenant/context';

/**
 * Create a Prisma client with RLS context.
 * This sets the PostgreSQL session variable before each transaction.
 */
export function createRLSClient(): PrismaClient {
  const client = new PrismaClient();

  // Set tenant context before each transaction
  client.$use(async (params, next) => {
    const tenantId = getCurrentTenantId();

    if (tenantId) {
      // Set the session variable for RLS
      await client.$executeRawUnsafe(
        `SELECT set_config('app.tenant_id', '${tenantId}', true)`
      );
    }

    return next(params);
  });

  return client;
}

// Export singleton instance
export const rlsPrisma = createRLSClient();
```

### Tenant-Scoped Prisma Extension

```typescript
// lib/db/tenant-client.ts
import { PrismaClient } from '@prisma/client';
import { getCurrentTenantId } from '@/lib/tenant/context';

const prisma = new PrismaClient();

// Extension for automatic tenant scoping
export const tenantPrisma = prisma.$extends({
  query: {
    $allOperations({ model, operation, args, query }) {
      // Skip for non-tenant models
      const tenantModels = [
        'User', 'Member', 'Sermon', 'Event', 'Ministry',
        'Group', 'Donation', 'Page', 'Post', 'Media',
      ];

      if (!tenantModels.includes(model as string)) {
        return query(args);
      }

      const tenantId = getCurrentTenantId();

      if (!tenantId) {
        throw new Error('Tenant context required for this operation');
      }

      // Add tenant filter for read operations
      if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate'].includes(operation)) {
        args.where = {
          ...args.where,
          tenantId,
        };
      }

      // Add tenant ID for create operations
      if (['create', 'createMany'].includes(operation)) {
        if (Array.isArray(args.data)) {
          args.data = args.data.map((item: any) => ({
            ...item,
            tenantId,
          }));
        } else {
          args.data = {
            ...args.data,
            tenantId,
          };
        }
      }

      // Add tenant filter for update/delete operations
      if (['update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
        args.where = {
          ...args.where,
          tenantId,
        };
      }

      return query(args);
    },
  },
});

export type TenantPrismaClient = typeof tenantPrisma;
```

### Secure Query Pattern

```typescript
// lib/repositories/base.ts
import { tenantPrisma } from '@/lib/db/tenant-client';
import { getCurrentTenantId } from '@/lib/tenant/context';

export abstract class TenantRepository<T> {
  protected readonly model: any;

  constructor(modelName: string) {
    this.model = (tenantPrisma as any)[modelName];
  }

  protected requireTenant(): string {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new Error('Tenant context required');
    }
    return tenantId;
  }

  async findMany(options?: {
    where?: Record<string, any>;
    orderBy?: Record<string, any>;
    skip?: number;
    take?: number;
    include?: Record<string, any>;
  }): Promise<T[]> {
    const tenantId = this.requireTenant();

    return this.model.findMany({
      ...options,
      where: {
        ...options?.where,
        tenantId,
        deletedAt: null,
      },
    });
  }

  async findById(id: string, include?: Record<string, any>): Promise<T | null> {
    const tenantId = this.requireTenant();

    return this.model.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include,
    });
  }

  async create(data: Partial<T>): Promise<T> {
    const tenantId = this.requireTenant();

    return this.model.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const tenantId = this.requireTenant();

    return this.model.update({
      where: {
        id,
        tenantId,
      },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    const tenantId = this.requireTenant();

    await this.model.update({
      where: {
        id,
        tenantId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
```

---

## Plan Limits & Feature Gating

### Resource Limit Checker

```typescript
// lib/tenant/limits.ts
import { prisma } from '@/lib/db/client';

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  message?: string;
}

type ResourceType =
  | 'users'
  | 'sermons'
  | 'events'
  | 'ministries'
  | 'groups'
  | 'storage';

export async function checkResourceLimit(
  tenantId: string,
  resourceType: ResourceType
): Promise<LimitCheckResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant) {
    return { allowed: false, current: 0, limit: 0, message: 'Tenant not found' };
  }

  const limitMap: Record<ResourceType, number> = {
    users: tenant.plan.maxUsers,
    sermons: tenant.plan.maxSermons,
    events: tenant.plan.maxEvents,
    ministries: tenant.plan.maxMinistries,
    groups: tenant.plan.maxGroups,
    storage: tenant.plan.maxStorageMb,
  };

  const limit = limitMap[resourceType];

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  const current = await countResource(tenantId, resourceType);
  const allowed = current < limit;

  return {
    allowed,
    current,
    limit,
    message: allowed
      ? undefined
      : `You have reached your ${resourceType} limit (${limit}). Please upgrade your plan.`,
  };
}

async function countResource(
  tenantId: string,
  resourceType: ResourceType
): Promise<number> {
  switch (resourceType) {
    case 'users':
      return prisma.user.count({
        where: { tenantId, deletedAt: null },
      });
    case 'sermons':
      return prisma.sermon.count({
        where: { tenantId, deletedAt: null },
      });
    case 'events':
      return prisma.event.count({
        where: { tenantId, deletedAt: null },
      });
    case 'ministries':
      return prisma.ministry.count({
        where: { tenantId, deletedAt: null },
      });
    case 'groups':
      return prisma.group.count({
        where: { tenantId, deletedAt: null },
      });
    case 'storage':
      const result = await prisma.media.aggregate({
        where: { tenantId, deletedAt: null },
        _sum: { size: true },
      });
      return Math.ceil((result._sum.size || 0) / (1024 * 1024)); // bytes to MB
    default:
      return 0;
  }
}

export async function checkFeatureAccess(
  tenantId: string,
  feature: 'customDomain' | 'whiteLabel' | 'analytics' | 'apiAccess' | 'liveStreaming'
): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant) return false;

  const featureMap: Record<string, boolean> = {
    customDomain: tenant.plan.customDomain,
    whiteLabel: tenant.plan.whiteLabel,
    analytics: tenant.plan.analytics,
    apiAccess: tenant.plan.apiAccess,
    liveStreaming: tenant.plan.liveStreaming,
  };

  return featureMap[feature] ?? false;
}
```

### Feature Gate Component

```typescript
// components/FeatureGate.tsx
'use client';

import { useTenantPlan } from '@/contexts/TenantContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock, ArrowUpCircle } from 'lucide-react';
import Link from 'next/link';

interface FeatureGateProps {
  feature: 'customDomain' | 'whiteLabel' | 'analytics' | 'apiAccess' | 'liveStreaming';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({
  feature,
  children,
  fallback,
}: FeatureGateProps) {
  const plan = useTenantPlan();

  if (!plan) {
    return null;
  }

  const hasFeature = plan.features[feature];

  if (hasFeature) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Lock className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">Feature Not Available</AlertTitle>
      <AlertDescription className="text-amber-700">
        This feature is not included in your current plan ({plan.name}).
        <Link
          href="/admin/settings/billing"
          className="inline-flex items-center gap-1 ml-2 text-amber-900 underline hover:no-underline"
        >
          <ArrowUpCircle className="h-4 w-4" />
          Upgrade Now
        </Link>
      </AlertDescription>
    </Alert>
  );
}
```

---

## Security Considerations

### Tenant Isolation Layers

| Layer | Implementation | Purpose |
|-------|----------------|---------|
| Network | Domain-based routing | Separate tenant traffic |
| Application | Middleware validation | Verify tenant context |
| Database | Row-level filtering | Prevent data leakage |
| Storage | Prefixed paths | Isolate file access |
| Cache | Namespaced keys | Prevent cache pollution |

### Security Checklist

- [ ] All database queries include tenant scope
- [ ] API endpoints validate tenant context
- [ ] File uploads stored in tenant-specific paths
- [ ] Cache keys prefixed with tenant ID
- [ ] Session tokens include tenant claim
- [ ] Audit logs record tenant context
- [ ] Cross-tenant access explicitly denied
- [ ] Admin actions require elevated permissions

### Audit Logging

```typescript
// lib/audit/logger.ts
import { prisma } from '@/lib/db/client';
import { getCurrentTenantId } from '@/lib/tenant/context';

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  metadata?: Record<string, any>;
}

export async function logAuditEvent(entry: AuditEntry): Promise<void> {
  const tenantId = getCurrentTenantId();

  await prisma.auditLog.create({
    data: {
      tenantId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      userId: entry.userId,
      metadata: entry.metadata || {},
      ipAddress: getClientIP(),
      userAgent: getUserAgent(),
      createdAt: new Date(),
    },
  });
}

function getClientIP(): string {
  // Implementation depends on your setup
  return '0.0.0.0';
}

function getUserAgent(): string {
  return '';
}
```

---

## Error Pages

### Tenant Not Found

```typescript
// app/(errors)/not-found/page.tsx
import Link from 'next/link';

export default function TenantNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">Church Not Found</p>
        <p className="mt-2 text-gray-500">
          The church website you're looking for doesn't exist or has been removed.
        </p>
        <div className="mt-8">
          <Link
            href={`https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Digital Church Platform
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### Account Suspended

```typescript
// app/(errors)/suspended/page.tsx
import Link from 'next/link';

export default function AccountSuspended() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">Account Suspended</h1>
        <p className="mt-4 text-gray-600">
          This church account has been suspended. Please contact support for assistance.
        </p>
        <div className="mt-8 space-y-3">
          <Link
            href="mailto:support@digitalchurch.com"
            className="block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

## Best Practices

1. **Always Validate Tenant Context** - Never assume tenant context exists
2. **Cache Aggressively** - Use multi-layer caching for tenant data
3. **Log Everything** - Audit all cross-tenant operations
4. **Test Isolation** - Regularly verify data isolation
5. **Monitor Usage** - Track resource consumption per tenant
6. **Plan for Scale** - Design for horizontal scaling from day one

---

**Document Version**: 3.0 Enterprise Edition
**Last Updated**: December 2024
**Maintained By**: Digital Church Platform Team
