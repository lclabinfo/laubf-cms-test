# 04. Multi-Tenant Architecture

## Multi-Tenant Architecture Document

---

## 1. Architecture Overview

### 1.1 Multi-Tenancy Strategy Comparison

| Strategy | Isolation Level | Cost | Maintenance | Scalability | Selection |
|----------|----------------|------|-------------|-------------|-----------|
| Separate DB per Tenant | Highest | High | Complex | Limited | - |
| Separate Schema per Tenant | High | Medium | Medium | Medium | - |
| **Shared Schema + RLS** | Medium | Low | Simple | High | **Selected** |

### 1.2 Selection Rationale

**Shared Database, Shared Schema with Row-Level Security** approach selected:

- **Cost Efficiency**: Single DB instance serves thousands of tenants
- **Operational Simplicity**: Single schema allows batch migration deployment
- **Scalability**: Easy horizontal scaling (read replicas)
- **Security**: PostgreSQL RLS ensures data isolation

---

## 2. Domain Structure

### 2.1 Domain Types

| Domain Type | Example | Purpose |
|-------------|---------|---------|
| Platform Main | digitalchurch.com | Marketing, pricing, signup |
| Platform Admin | admin.digitalchurch.com | SaaS management |
| Church Subdomain | firstbaptist.digitalchurch.com | Church website |
| Custom Domain | www.firstbaptist.org | Church custom domain |
| API | api.digitalchurch.com | Public API |

### 2.2 Domain Resolution Priority

```
1. Custom Domain (Highest Priority)
   └── Direct lookup in CustomDomain table
   └── DNS verification and SSL certificate required

2. Subdomain
   └── Extract from hostname (e.g., firstbaptist.digitalchurch.com)
   └── Match against Tenant.subdomain field

3. Platform Domain
   └── Route to platform marketing/admin pages
   └── No tenant context
```

---

## 3. Request Processing Flow

### 3.1 Complete Flow

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
│  - Validate module access                │
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
│  - Gate features by active modules       │
└─────────────────────────────────────────┘
```

### 3.2 Middleware Routing Logic

```typescript
// middleware.ts core logic

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const hostInfo = analyzeHost(hostname);

  switch (hostInfo.type) {
    case 'platform-admin':
      // Verify platform admin authentication
      return handlePlatformAdminRequest(request);

    case 'platform':
      // Set platform context
      return handlePlatformRequest(request);

    case 'tenant':
      // Set tenant context + module gating
      return handleTenantRequest(request, hostInfo);

    default:
      // 404 or redirect to main site
      return handleUnknownDomain(request, hostname);
  }
}
```

---

## 4. Tenant Context Management

### 4.1 AsyncLocalStorage-based Context

```typescript
// lib/tenant/context.ts

import { AsyncLocalStorage } from 'async_hooks';

interface TenantContext {
  tenantId: string;
  userId?: string;
  userRole?: string;
  activeModules?: string[];  // List of active module slugs
  isImpersonating?: boolean;
}

const tenantStorage = new AsyncLocalStorage<TenantContext>();

// Execute function within tenant context
export function runWithTenant<T>(context: TenantContext, fn: () => T): T {
  return tenantStorage.run(context, fn);
}

// Get current tenant ID
export function getCurrentTenantId(): string | null {
  return tenantStorage.getStore()?.tenantId ?? null;
}

// Check if tenant has active module
export function hasActiveModule(moduleSlug: string): boolean {
  const context = tenantStorage.getStore();
  return context?.activeModules?.includes(moduleSlug) ?? false;
}

// Require tenant ID (throws if not present)
export function requireCurrentTenantId(): string {
  const tenantId = getCurrentTenantId();
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return tenantId;
}
```

### 4.2 API Route Wrapper

```typescript
// lib/tenant/middleware-context.ts

export function withTenantContext<T>(
  handler: (req: NextRequest, context: TenantContext) => Promise<T>
) {
  return async (req: NextRequest): Promise<T> => {
    const tenantId = req.headers.get('x-tenant-id');
    const activeModules = req.headers.get('x-active-modules')?.split(',') || [];

    if (!tenantId) {
      throw new Error('Tenant ID required');
    }

    const context: TenantContext = {
      tenantId,
      userId: req.headers.get('x-user-id') ?? undefined,
      userRole: req.headers.get('x-user-role') ?? undefined,
      activeModules,
    };

    return runWithTenantAsync(context, () => handler(req, context));
  };
}
```

---

## 5. Data Isolation

### 5.1 Row-Level Security (PostgreSQL)

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
-- ... Apply to all tenant-scoped tables

-- Create RLS Policy
CREATE POLICY tenant_isolation_users ON users
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Session variable setting function
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.tenant_id', p_tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.2 Prisma Extension

```typescript
// lib/db/tenant-client.ts

export const tenantPrisma = prisma.$extends({
  query: {
    $allOperations({ model, operation, args, query }) {
      const tenantModels = ['User', 'Member', 'Sermon', 'Event', 'Donation', ...];

      if (!tenantModels.includes(model as string)) {
        return query(args);
      }

      const tenantId = getCurrentTenantId();
      if (!tenantId) {
        throw new Error('Tenant context required');
      }

      // Read operations: Add tenant_id filter
      if (['findMany', 'findFirst', 'count'].includes(operation)) {
        args.where = { ...args.where, tenantId };
      }

      // Create operations: Auto-add tenant_id
      if (['create', 'createMany'].includes(operation)) {
        args.data = { ...args.data, tenantId };
      }

      // Update/Delete operations: Add tenant_id filter
      if (['update', 'delete'].includes(operation)) {
        args.where = { ...args.where, tenantId };
      }

      return query(args);
    },
  },
});
```

### 5.3 Isolation Layer Summary

| Layer | Implementation | Purpose |
|-------|----------------|---------|
| **Network** | Domain-based routing | Tenant traffic separation |
| **Application** | AsyncLocalStorage + middleware | Per-request context |
| **Database** | RLS + Prisma Extension | Automatic query filtering |
| **Storage** | Path prefix (/{tenant_id}/...) | File isolation |
| **Cache** | Key namespace (tenant:{id}:...) | Cache pollution prevention |

---

## 6. Custom Domain Support

### 6.1 Domain Addition Process

```
1. Domain Input
   └── User enters www.mychurch.org

2. Verification Token Generation
   └── Generate random token: abc123xyz

3. DNS Setup Instructions
   └── TXT Record: _digitalchurch-verify.mychurch.org = abc123xyz
   └── CNAME Record: www.mychurch.org → cname.digitalchurch.com

4. Verification Check
   └── Query DNS TXT record
   └── Confirm token match

5. SSL Provisioning
   └── Cloudflare automatic certificate issuance

6. Activation
   └── verified = true
   └── Begin processing traffic for domain
```

### 6.2 DNS Verification Service

```typescript
// lib/tenant/custom-domains.ts

export async function verifyCustomDomain(customDomainId: string) {
  const customDomain = await prisma.customDomain.findUnique({
    where: { id: customDomainId },
  });

  // Query TXT records
  const txtRecords = await dns.resolveTxt(
    `_digitalchurch-verify.${customDomain.domain}`
  );

  // Verify token
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

    // Invalidate cache
    await invalidateTenantCache(customDomain.tenantId);

    return { success: true };
  }

  return { success: false, error: 'Verification record not found' };
}
```

---

## 7. Caching Strategy

### 7.1 Multi-Layer Cache

```
┌─────────────────────────────────────────────────────────────────┐
│                        CACHE LAYERS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: In-Memory Cache (LRU)                                 │
│  ─────────────────────────────                                  │
│  • Per-instance local cache                                      │
│  • TTL: 5 minutes                                                │
│  • Capacity: 1,000 entries                                       │
│                                                                  │
│  Layer 2: Redis Cache                                            │
│  ────────────────────                                           │
│  • Shared cache across instances                                 │
│  • TTL: 5-60 minutes                                             │
│  • Key format: tenant:{id}:{type}                               │
│                                                                  │
│  Layer 3: Next.js Cache                                          │
│  ──────────────────────                                         │
│  • unstable_cache / ISR                                          │
│  • Tags: ['tenant', 'template', 'modules']                      │
│  • revalidate: 300                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Cache Invalidation (Redis Pub/Sub)

```typescript
// lib/cache/cache-invalidation.ts

const INVALIDATION_CHANNEL = 'cache:invalidation';

// Publish invalidation message
export async function broadcastInvalidation(
  type: 'tenant' | 'template' | 'module' | 'all',
  options?: { tenantId?: string; tags?: string[] }
) {
  const message = {
    type,
    tenantId: options?.tenantId,
    tags: options?.tags,
    timestamp: Date.now(),
    originInstanceId: INSTANCE_ID,
  };

  // Immediate local cache invalidation
  handleInvalidation(message);

  // Broadcast to other instances
  await publisher.publish(INVALIDATION_CHANNEL, JSON.stringify(message));
}

// Usage examples
// After tenant settings change
await broadcastInvalidation('tenant', { tenantId });

// After module activation/deactivation
await broadcastInvalidation('module', {
  tenantId,
  tags: [`modules-${tenantId}`, `tenant-${tenantId}`],
});
```

---

## 8. Resource Limits and Feature Gating

### 8.1 Resource Limit Check

```typescript
// lib/tenant/limits.ts

type ResourceType = 'users' | 'sermons' | 'events' | 'storage' | ...;

export async function checkResourceLimit(
  tenantId: string,
  resourceType: ResourceType
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true, modules: { include: { module: true } } },
  });

  // If plan-based, apply plan limits
  if (tenant.subscriptionType === 'LEGACY_PLAN' && tenant.plan) {
    const limit = tenant.plan.limits[resourceType];
    const current = await countResource(tenantId, resourceType);
    return { allowed: current < limit || limit === -1, current, limit };
  }

  // If module-based, apply module limits
  const relevantModule = tenant.modules.find(m =>
    m.module.limits?.[resourceType] !== undefined
  );

  if (relevantModule) {
    const limit = relevantModule.module.limits[resourceType];
    const current = await countResource(tenantId, resourceType);
    return { allowed: current < limit || limit === -1, current, limit };
  }

  return { allowed: true, current: 0, limit: -1 };
}
```

### 8.2 Module Feature Gating

```typescript
// lib/modules/gates.ts

// Check module access
export async function checkModuleAccess(
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

  return !!tenantModule;
}

// React component gate
export function ModuleGate({ module, children, fallback }: ModuleGateProps) {
  const { hasAccess } = useModuleAccess(module);

  if (hasAccess) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <UpgradePrompt
      module={module}
      message={`Activate the ${module} module to use this feature.`}
    />
  );
}
```

---

## 9. Template System Integration

### 9.1 Template Loading

```typescript
// lib/template/loader.ts

export const getTemplateConfig = unstable_cache(
  async (tenantId: string): Promise<TemplateConfig | null> => {
    const customization = await prisma.templateCustomization.findFirst({
      where: { tenantId },
    });

    const baseConfig = await loadTemplateFromFile(customization.templateId);

    // Merge tenant customizations
    return deepMerge(baseConfig, {
      customizations: customization.customizations,
      theme: customization.customizations?.theme || {},
    });
  },
  ['template-config'],
  { tags: ['template'], revalidate: 300 }
);
```

### 9.2 CSS Variable Generation

```typescript
// lib/template/css-injector.ts

export function generateCSSVariables(config: TemplateConfig): string {
  return `
    :root {
      /* Colors */
      --color-primary: ${config.theme.colors.primary};
      --color-secondary: ${config.theme.colors.secondary};
      --color-accent: ${config.theme.colors.accent};

      /* Fonts */
      --font-heading: '${config.theme.fonts.heading}', sans-serif;
      --font-body: '${config.theme.fonts.body}', sans-serif;

      /* Border Radius */
      --radius: ${config.theme.borderRadius};
    }
  `;
}
```

---

## 10. Security Considerations

### 10.1 Checklist

- [ ] All DB queries include tenant_id
- [ ] Verify tenant context in API endpoints
- [ ] Include tenant_id in file upload paths
- [ ] Prefix cache keys with tenant_id
- [ ] Include tenant claim in session tokens
- [ ] Record tenant context in audit logs
- [ ] Explicitly block cross-tenant access
- [ ] Verify module access permissions

### 10.2 Audit Logging

```typescript
// lib/audit/logger.ts

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
    },
  });
}
```

---

## 11. Error Handling

### 11.1 Tenant Not Found

```tsx
// app/(errors)/not-found/page.tsx

export default function TenantNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="mt-4 text-xl">Church Not Found</p>
        <p className="mt-2 text-gray-500">
          The requested church website does not exist or has been deleted.
        </p>
        <Link href="https://digitalchurch.com" className="mt-8 btn-primary">
          Go to Digital Church Platform
        </Link>
      </div>
    </div>
  );
}
```

### 11.2 Account Suspended

```tsx
// app/(errors)/suspended/page.tsx

export default function AccountSuspended() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Account Suspended</h1>
        <p className="mt-4">
          This church account has been suspended. Please contact our support team.
        </p>
        <Link href="mailto:support@digitalchurch.com" className="mt-8 btn-primary">
          Contact Support
        </Link>
      </div>
    </div>
  );
}
```

---

## 12. Best Practices

1. **Always Validate Tenant Context** - Never assume context exists
2. **Aggressive Caching** - Optimize performance with multi-layer caching
3. **Log Everything** - Audit cross-tenant operations
4. **Test Isolation** - Regular data isolation verification
5. **Monitor Usage** - Track per-tenant resource consumption
6. **Design for Scale** - Consider horizontal scaling from day one
7. **Module Gating** - Check module activation before all feature access

---

**Document Version**: 3.0 Enterprise Edition
**Last Updated**: December 2024
