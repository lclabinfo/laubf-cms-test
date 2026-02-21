# API Design & Webhooks - Digital Church Platform

## Enterprise API Architecture for Multi-Tenant Church Platform

**Version**: 3.1 Enterprise Edition
**Last Updated**: December 2024
**API Version**: v2 (v1 deprecated)
**Base URL**: `https://api.digitalchurch.com/v2`

---

## Table of Contents

1. [Competitive Analysis](#1-competitive-analysis)
2. [API Architecture Overview](#2-api-architecture-overview)
3. [Authentication & Headers](#3-authentication--headers)
4. [RESTful Design Principles](#4-restful-design-principles)
5. [Core API Endpoints](#5-core-api-endpoints)
6. [tRPC Integration](#6-trpc-integration)
7. [Webhook System](#7-webhook-system)
8. [Rate Limiting & Throttling](#8-rate-limiting--throttling)
9. [Error Handling](#9-error-handling)
10. [Bulk Operations API](#10-bulk-operations-api) *(New)*
11. [Versioning Strategy](#11-versioning-strategy) *(Enhanced)*
12. [API Gateway & Security](#12-api-gateway--security)
13. [SDK & Client Libraries](#13-sdk--client-libraries)
14. [GraphQL Layer (Optional)](#14-graphql-layer-optional)
15. [Performance Optimization](#15-performance-optimization)
16. [API Documentation](#16-api-documentation)

---

## 1. Competitive Analysis

### API Capabilities Comparison

| Feature | Tithely | Pushpay | Subsplash | **Digital Church Platform** |
|---------|---------|---------|-----------|----------------------------|
| REST API | Basic | Full | Limited | **Comprehensive REST** |
| GraphQL | No | No | No | **Optional GraphQL Layer** |
| tRPC Support | No | No | No | **Full Type-Safe tRPC** |
| Webhooks | Limited | Good | Basic | **50+ Event Types** |
| Real-time | No | No | Limited | **WebSocket + SSE** |
| Rate Limits | Strict | Moderate | Strict | **Flexible Per-Plan** |
| SDK Libraries | JS only | JS/Swift | None | **JS/TS/Python/Go/Swift** |
| API Versioning | None | URL | None | **URL + Header** |
| Documentation | Basic | Good | Basic | **Interactive OpenAPI** |
| Sandbox | No | Yes | No | **Full Sandbox Environment** |

### Our API Advantages

1. **Type-Safe End-to-End**: tRPC integration for zero-boilerplate type safety
2. **Multi-Tenant Aware**: Automatic tenant isolation at API level
3. **Comprehensive Webhooks**: 50+ event types with retry logic
4. **Real-Time Capabilities**: WebSocket and Server-Sent Events support
5. **Flexible Authentication**: JWT, API Keys, OAuth 2.0, and mTLS
6. **Interactive Documentation**: OpenAPI 3.1 with Swagger UI

---

## 2. API Architecture Overview

### Multi-Tenant API Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              API Request                                 │
│                  (Authorization Header + X-Tenant-ID)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                           API Gateway Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Rate Limiter │→ │   WAF/DDoS   │→ │    Auth      │→ │   Routing    │ │
│  │              │  │  Protection  │  │  Validation  │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│                          Middleware Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Tenant     │→ │    RBAC      │→ │  Request     │→ │   Logging    │ │
│  │  Resolver    │  │   Checker    │  │  Validator   │  │   & Audit    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│                         API Route Handlers                               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│  │ Auth   │ │Members │ │ Events │ │Sermons │ │ Giving │ │ Media  │     │
│  │  API   │ │  API   │ │  API   │ │  API   │ │  API   │ │  API   │     │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘     │
├─────────────────────────────────────────────────────────────────────────┤
│                          Service Layer                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Business Logic | Validation | Caching | Event Publishing           │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│                           Data Layer                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  PostgreSQL  │  │    Redis     │  │    S3/R2     │  │   Webhook    │ │
│  │   (Prisma)   │  │   (Cache)    │  │   (Files)    │  │    Queue     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

```typescript
// Core API Technologies
const apiStack = {
  framework: 'Next.js 15 App Router',
  language: 'TypeScript 5.x',
  orm: 'Prisma 5.x',
  validation: 'Zod',
  authentication: 'NextAuth.js v4 + JWT',
  typeSafeRpc: 'tRPC v11',
  documentation: 'OpenAPI 3.1 + Swagger UI',
  realtime: 'Socket.io + Server-Sent Events',
  queue: 'BullMQ',
  cache: 'Redis 7.x',
};
```

---

## 3. Authentication & Headers

### Required Headers

```http
# Authentication (Required for protected endpoints)
Authorization: Bearer {jwt_token}

# Content Type
Content-Type: application/json
Accept: application/json

# Tenant Identification (Auto-detected from subdomain if not provided)
X-Tenant-ID: tenant_abc123

# API Version (Optional, defaults to latest)
X-API-Version: v1

# Request Tracking
X-Request-ID: req_xyz789

# Idempotency Key (For mutations)
X-Idempotency-Key: idem_unique123
```

### Authentication Methods

#### 1. JWT Bearer Token (Primary)

```typescript
// src/lib/api/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ApiError } from './errors';

interface AuthContext {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  tenantSlug: string;
  permissions: string[];
}

export async function authenticateRequest(
  request: NextRequest
): Promise<AuthContext> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    throw new ApiError(401, 'Authentication required', 'AUTH_REQUIRED');
  }

  return {
    userId: token.sub as string,
    email: token.email as string,
    role: token.role as string,
    tenantId: token.tenantId as string,
    tenantSlug: token.tenantSlug as string,
    permissions: token.permissions as string[] || [],
  };
}

export async function requireAuth(
  request: NextRequest
): Promise<AuthContext> {
  return authenticateRequest(request);
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<AuthContext> {
  const auth = await authenticateRequest(request);

  if (!allowedRoles.includes(auth.role)) {
    throw new ApiError(403, 'Insufficient permissions', 'FORBIDDEN');
  }

  return auth;
}

export async function requirePermission(
  request: NextRequest,
  requiredPermission: string
): Promise<AuthContext> {
  const auth = await authenticateRequest(request);

  if (!auth.permissions.includes(requiredPermission) && auth.role !== 'SUPERUSER') {
    throw new ApiError(403, 'Missing required permission', 'FORBIDDEN');
  }

  return auth;
}
```

#### 2. API Key Authentication (For Integrations)

```typescript
// src/lib/api/api-key-auth.ts
import { prisma } from '@/lib/db';
import { ApiError } from './errors';

interface ApiKeyContext {
  tenantId: string;
  keyId: string;
  name: string;
  permissions: string[];
  rateLimit: number;
}

export async function authenticateApiKey(
  apiKey: string
): Promise<ApiKeyContext> {
  const hashedKey = await hashApiKey(apiKey);

  const key = await prisma.apiKey.findFirst({
    where: {
      hashedKey,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      tenant: true,
    },
  });

  if (!key) {
    throw new ApiError(401, 'Invalid API key', 'INVALID_API_KEY');
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    tenantId: key.tenantId,
    keyId: key.id,
    name: key.name,
    permissions: key.permissions as string[],
    rateLimit: key.rateLimit,
  };
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(hashBuffer).toString('hex');
}
```

#### 3. OAuth 2.0 (For Third-Party Apps)

```typescript
// src/lib/api/oauth.ts
import { prisma } from '@/lib/db';

interface OAuthTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export async function exchangeAuthorizationCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<OAuthTokenResponse> {
  // Verify client credentials
  const client = await prisma.oauthClient.findFirst({
    where: {
      clientId,
      clientSecret,
      isActive: true,
    },
  });

  if (!client) {
    throw new Error('Invalid client credentials');
  }

  // Exchange authorization code
  const authCode = await prisma.oauthAuthorizationCode.findFirst({
    where: {
      code,
      clientId: client.id,
      redirectUri,
      expiresAt: { gt: new Date() },
      usedAt: null,
    },
    include: {
      user: true,
    },
  });

  if (!authCode) {
    throw new Error('Invalid or expired authorization code');
  }

  // Mark code as used
  await prisma.oauthAuthorizationCode.update({
    where: { id: authCode.id },
    data: { usedAt: new Date() },
  });

  // Generate tokens
  const accessToken = await generateAccessToken({
    userId: authCode.userId,
    tenantId: authCode.tenantId,
    clientId: client.id,
    scopes: authCode.scopes,
  });

  const refreshToken = await generateRefreshToken({
    userId: authCode.userId,
    tenantId: authCode.tenantId,
    clientId: client.id,
  });

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshToken,
    scope: authCode.scopes.join(' '),
  };
}
```

### Tenant Resolution Middleware

```typescript
// src/middleware/tenant.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface TenantContext {
  id: string;
  slug: string;
  name: string;
  customDomain: string | null;
  settings: Record<string, any>;
  planSlug: string;
}

export async function resolveTenant(
  request: NextRequest
): Promise<TenantContext> {
  // Check for explicit tenant header
  const tenantId = request.headers.get('x-tenant-id');
  const tenantSlug = request.headers.get('x-tenant-slug');

  if (tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: { include: { plan: true } } },
    });

    if (tenant) {
      return formatTenant(tenant);
    }
  }

  // Resolve from subdomain
  const host = request.headers.get('host') || '';
  const subdomain = extractSubdomain(host);

  if (subdomain) {
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: subdomain },
          { customDomain: host },
        ],
        status: 'ACTIVE',
      },
      include: { subscription: { include: { plan: true } } },
    });

    if (tenant) {
      return formatTenant(tenant);
    }
  }

  throw new Error('Tenant not found');
}

function extractSubdomain(host: string): string | null {
  const parts = host.split('.');
  if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'api') {
    return parts[0];
  }
  return null;
}

function formatTenant(tenant: any): TenantContext {
  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    customDomain: tenant.customDomain,
    settings: tenant.settings,
    planSlug: tenant.subscription?.plan?.slug || 'free',
  };
}
```

---

## 4. RESTful Design Principles

### HTTP Methods

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Retrieve resources | Yes | Yes |
| POST | Create new resources | No | No |
| PUT | Replace entire resource | Yes | No |
| PATCH | Partial update | No | No |
| DELETE | Remove resources | Yes | No |
| HEAD | Get headers only | Yes | Yes |
| OPTIONS | Get allowed methods | Yes | Yes |

### Resource Naming Conventions

```
Good Examples:
✅ GET    /api/v1/members                    # List members
✅ POST   /api/v1/members                    # Create member
✅ GET    /api/v1/members/{id}               # Get single member
✅ PUT    /api/v1/members/{id}               # Replace member
✅ PATCH  /api/v1/members/{id}               # Update member
✅ DELETE /api/v1/members/{id}               # Delete member
✅ GET    /api/v1/members/{id}/groups        # Get member's groups
✅ POST   /api/v1/members/{id}/groups        # Add member to group
✅ GET    /api/v1/events/{id}/registrations  # Get event registrations
✅ POST   /api/v1/donations/recurring        # Create recurring donation

Bad Examples:
❌ GET    /api/v1/getMembers
❌ POST   /api/v1/createMember
❌ GET    /api/v1/member-list
❌ POST   /api/v1/deleteMember/{id}
❌ GET    /api/v1/Members                    # Wrong case
```

### HTTP Status Codes

```typescript
// Success Codes
200 OK                 // GET, PUT, PATCH successful
201 Created            // POST successful, include Location header
202 Accepted           // Async operation accepted
204 No Content         // DELETE successful

// Client Error Codes
400 Bad Request        // Invalid input data
401 Unauthorized       // Missing or invalid authentication
403 Forbidden          // Insufficient permissions
404 Not Found          // Resource doesn't exist
405 Method Not Allowed // HTTP method not supported
409 Conflict           // Resource conflict (duplicate)
422 Unprocessable      // Validation error
429 Too Many Requests  // Rate limit exceeded

// Server Error Codes
500 Internal Server    // Unexpected server error
502 Bad Gateway        // Upstream service error
503 Service Unavailable // Temporary service issue
504 Gateway Timeout    // Upstream service timeout
```

### Standard Response Formats

```typescript
// src/lib/api/response.ts
import { NextResponse } from 'next/server';

// Success Response - Single Resource
interface SingleResourceResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// Success Response - Collection (Offset-Based Pagination)
interface CollectionResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// Success Response - Collection (Cursor-Based Pagination - Recommended for Large Datasets)
interface CursorPaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    cursor: string | null;      // Current cursor position
    nextCursor: string | null;  // Cursor for next page (null if no more)
    prevCursor: string | null;  // Cursor for previous page (null if first page)
    hasMore: boolean;           // Whether more records exist
    limit: number;              // Items per page
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// Unified Pagination Parameters
interface PaginationParams {
  limit?: number;      // Items per page (default: 20, max: 100)
  cursor?: string;     // Cursor-based pagination (recommended for large datasets)
  page?: number;       // Offset-based pagination (for smaller datasets)
  sortBy?: string;     // Field to sort by
  sortOrder?: 'asc' | 'desc';  // Sort direction
}

// Pagination Strategy Selection Guidelines
/**
 * PAGINATION STRATEGY GUIDELINES:
 *
 * Use CURSOR-BASED pagination when:
 * - Dataset is large (>10,000 records)
 * - Real-time data that changes frequently
 * - Infinite scroll UI
 * - API consumers need stable pagination
 * - Performance is critical
 *
 * Use OFFSET-BASED pagination when:
 * - Dataset is small (<10,000 records)
 * - Need to jump to specific page
 * - UI requires page numbers
 * - Exact total count is needed
 *
 * Default: Cursor-based for collections >1000 records
 */

// Error Response
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    validationErrors?: Array<{
      field: string;
      message: string;
      code: string;
    }>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

export function collectionResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  }
): NextResponse {
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}

export function errorResponse(
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, any>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status: statusCode }
  );
}
```

---

## 5. Core API Endpoints

### Authentication Endpoints

```typescript
// app/api/v1/auth/login/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { compare } from 'bcryptjs';
import { generateTokens } from '@/lib/auth/tokens';
import { successResponse, errorResponse } from '@/lib/api/response';
import { resolveTenant } from '@/middleware/tenant';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const tenant = await resolveTenant(request);
    const body = await request.json();
    const { email, password, twoFactorCode } = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        tenantId: tenant.id,
        status: 'ACTIVE',
      },
    });

    if (!user || !user.password) {
      return errorResponse(401, 'AUTH_INVALID', 'Invalid credentials');
    }

    // Verify password
    const isValid = await compare(password, user.password);
    if (!isValid) {
      // Log failed attempt
      await prisma.loginAttempt.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          successful: false,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });

      return errorResponse(401, 'AUTH_INVALID', 'Invalid credentials');
    }

    // Check 2FA
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return errorResponse(401, 'TWO_FACTOR_REQUIRED', '2FA code required');
      }

      const isValid2FA = await verify2FACode(user.id, twoFactorCode);
      if (!isValid2FA) {
        return errorResponse(401, 'INVALID_2FA', 'Invalid 2FA code');
      }
    }

    // Generate tokens
    const tokens = await generateTokens(user, tenant);

    // Log successful login
    await prisma.loginAttempt.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        successful: true,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Invalid input', {
        errors: error.errors,
      });
    }
    console.error('Login error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Login failed');
  }
}
```

### Member Endpoints

```typescript
// app/api/v1/members/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, requirePermission } from '@/lib/api/auth';
import { resolveTenant } from '@/middleware/tenant';
import { successResponse, collectionResponse, errorResponse } from '@/lib/api/response';

const memberQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
  role: z.string().optional(),
  groupId: z.string().optional(),
  ministryId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'firstName', 'lastName', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const createMemberSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().default('US'),
  }).optional(),
  membershipDate: z.string().datetime().optional(),
  role: z.enum(['GUEST', 'MEMBER', 'SMALL_GROUP_LEADER', 'MINISTRY_LEADER', 'CONTENT_MANAGER', 'ADMIN']).default('MEMBER'),
  groupIds: z.array(z.string()).optional(),
  ministryIds: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  sendWelcomeEmail: z.boolean().default(true),
});

// GET /api/v1/members
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const tenant = await resolveTenant(request);

    const { searchParams } = new URL(request.url);
    const params = memberQuerySchema.parse(Object.fromEntries(searchParams));

    const { page, limit, status, role, groupId, ministryId, search, sortBy, sortOrder } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      tenantId: tenant.id,
    };

    if (status) where.status = status;
    if (role) where.role = role;

    if (groupId) {
      where.groupMemberships = {
        some: { groupId },
      };
    }

    if (ministryId) {
      where.ministryMemberships = {
        some: { ministryId },
      };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    // Execute queries
    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          avatarUrl: true,
          membershipDate: true,
          createdAt: true,
          _count: {
            select: {
              groupMemberships: true,
              ministryMemberships: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return collectionResponse(members, { page, limit, total });
  } catch (error) {
    console.error('Error fetching members:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch members');
  }
}

// POST /api/v1/members
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, 'members:create');
    const tenant = await resolveTenant(request);

    const body = await request.json();
    const data = createMemberSchema.parse(body);

    // Check for existing member
    const existing = await prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        email: data.email.toLowerCase(),
      },
    });

    if (existing) {
      return errorResponse(409, 'MEMBER_EXISTS', 'Member with this email already exists');
    }

    // Create member
    const member = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: data.email.toLowerCase(),
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        address: data.address,
        membershipDate: data.membershipDate ? new Date(data.membershipDate) : null,
        role: data.role,
        status: 'ACTIVE',
        customFields: data.customFields || {},
        // Connect to groups
        groupMemberships: data.groupIds?.length ? {
          create: data.groupIds.map(groupId => ({
            groupId,
            role: 'MEMBER',
          })),
        } : undefined,
        // Connect to ministries
        ministryMemberships: data.ministryIds?.length ? {
          create: data.ministryIds.map(ministryId => ({
            ministryId,
            role: 'MEMBER',
          })),
        } : undefined,
      },
      include: {
        groupMemberships: {
          include: { group: { select: { id: true, name: true } } },
        },
        ministryMemberships: {
          include: { ministry: { select: { id: true, name: true } } },
        },
      },
    });

    // Send welcome email
    if (data.sendWelcomeEmail) {
      await queueWelcomeEmail(member, tenant);
    }

    // Publish event
    await publishEvent('member.created', {
      tenantId: tenant.id,
      memberId: member.id,
      createdBy: auth.userId,
    });

    return successResponse(member, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Invalid input', {
        errors: error.errors,
      });
    }
    console.error('Error creating member:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to create member');
  }
}
```

### Giving/Donation Endpoints

```typescript
// app/api/v1/donations/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/api/auth';
import { resolveTenant } from '@/middleware/tenant';
import { successResponse, collectionResponse, errorResponse } from '@/lib/api/response';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const createDonationSchema = z.object({
  amount: z.number().min(100), // Amount in cents
  currency: z.string().default('USD'),
  fundId: z.string().optional(),
  campaignId: z.string().optional(),
  paymentMethodId: z.string(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  donorInfo: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
  }).optional(),
  isAnonymous: z.boolean().default(false),
  note: z.string().max(500).optional(),
  coverFees: z.boolean().default(false),
});

// POST /api/v1/donations
export async function POST(request: NextRequest) {
  try {
    const tenant = await resolveTenant(request);
    const body = await request.json();
    const data = createDonationSchema.parse(body);

    // Get tenant's Stripe account
    const tenantStripe = await prisma.stripeAccount.findFirst({
      where: {
        tenantId: tenant.id,
        status: 'ACTIVE',
      },
    });

    if (!tenantStripe) {
      return errorResponse(400, 'STRIPE_NOT_CONFIGURED', 'Payment processing not configured');
    }

    // Calculate fees if covering
    let totalAmount = data.amount;
    let feeAmount = 0;

    if (data.coverFees) {
      // Calculate fee (2.0% + $0.25)
      feeAmount = Math.ceil((data.amount * 0.02) + 25);
      totalAmount = data.amount + feeAmount;
    }

    // Get or create Stripe customer
    let userId: string | null = null;
    try {
      const auth = await requireAuth(request);
      userId = auth.userId;
    } catch {
      // Anonymous donation
    }

    let customerId: string | undefined;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { stripeCustomer: true },
      });

      if (user?.stripeCustomer) {
        customerId = user.stripeCustomer.stripeCustomerId;
      } else if (user) {
        // Create Stripe customer
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: user.id,
            tenantId: tenant.id,
          },
        }, {
          stripeAccount: tenantStripe.stripeAccountId,
        });

        await prisma.stripeCustomer.create({
          data: {
            userId: user.id,
            tenantId: tenant.id,
            stripeCustomerId: customer.id,
          },
        });

        customerId = customer.id;
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: data.currency.toLowerCase(),
      customer: customerId,
      payment_method: data.paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        tenantId: tenant.id,
        fundId: data.fundId || '',
        campaignId: data.campaignId || '',
        isRecurring: data.isRecurring.toString(),
        userId: userId || '',
      },
      application_fee_amount: Math.ceil(totalAmount * 0.02 + 25), // Platform fee
    }, {
      stripeAccount: tenantStripe.stripeAccountId,
    });

    // Create donation record
    const donation = await prisma.donation.create({
      data: {
        tenantId: tenant.id,
        userId: userId || null,
        amount: data.amount,
        feeAmount,
        totalAmount,
        currency: data.currency,
        fundId: data.fundId,
        campaignId: data.campaignId,
        stripePaymentIntentId: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'COMPLETED' : 'PENDING',
        isAnonymous: data.isAnonymous,
        isRecurring: data.isRecurring,
        recurringInterval: data.recurringInterval,
        donorFirstName: data.donorInfo?.firstName,
        donorLastName: data.donorInfo?.lastName,
        donorEmail: data.donorInfo?.email,
        donorPhone: data.donorInfo?.phone,
        note: data.note,
      },
    });

    // Set up recurring donation if requested
    if (data.isRecurring && paymentIntent.status === 'succeeded') {
      await setupRecurringDonation(donation, data, tenantStripe);
    }

    // Publish event
    await publishEvent('donation.created', {
      tenantId: tenant.id,
      donationId: donation.id,
      amount: donation.amount,
      status: donation.status,
    });

    return successResponse({
      donation: {
        id: donation.id,
        amount: donation.amount,
        status: donation.status,
        receiptNumber: donation.receiptNumber,
      },
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
      },
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Invalid input', {
        errors: error.errors,
      });
    }
    if (error instanceof Stripe.errors.StripeError) {
      return errorResponse(400, 'PAYMENT_ERROR', error.message);
    }
    console.error('Error processing donation:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to process donation');
  }
}

// GET /api/v1/donations
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const tenant = await resolveTenant(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const fundId = searchParams.get('fundId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { tenantId: tenant.id };

    // Non-admins can only see their own donations
    if (!['ADMIN', 'SUPERUSER'].includes(auth.role)) {
      where.userId = auth.userId;
    }

    if (status) where.status = status;
    if (fundId) where.fundId = fundId;
    if (fromDate) where.createdAt = { gte: new Date(fromDate) };
    if (toDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(toDate),
      };
    }

    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        include: {
          fund: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true } },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.donation.count({ where }),
    ]);

    return collectionResponse(donations, { page, limit, total });
  } catch (error) {
    console.error('Error fetching donations:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch donations');
  }
}
```

### Event Endpoints

```typescript
// app/api/v1/events/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth, requirePermission } from '@/lib/api/auth';
import { resolveTenant } from '@/middleware/tenant';
import { successResponse, collectionResponse, errorResponse } from '@/lib/api/response';

const eventQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']).optional(),
  upcoming: z.coerce.boolean().optional(),
  past: z.coerce.boolean().optional(),
  ministryId: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  search: z.string().optional(),
  featured: z.coerce.boolean().optional(),
});

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional(),
  content: z.string().optional(), // Rich text content
  location: z.string().max(500).optional(),
  address: z.string().max(500).optional(),
  virtualUrl: z.string().url().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  allDay: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(), // RRULE format
  ministryId: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  featured: z.boolean().default(false),
  registrationEnabled: z.boolean().default(false),
  maxAttendees: z.number().min(1).optional(),
  registrationDeadline: z.string().datetime().optional(),
  requiresApproval: z.boolean().default(false),
  ticketTypes: z.array(z.object({
    name: z.string(),
    price: z.number().min(0),
    quantity: z.number().min(1).optional(),
  })).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});

// GET /api/v1/events
export async function GET(request: NextRequest) {
  try {
    const tenant = await resolveTenant(request);

    const { searchParams } = new URL(request.url);
    const params = eventQuerySchema.parse(Object.fromEntries(searchParams));

    const { page, limit, status, upcoming, past, ministryId, fromDate, toDate, search, featured } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      tenantId: tenant.id,
    };

    // Only show published events to non-authenticated users
    let auth;
    try {
      auth = await requireAuth(request);
    } catch {
      where.status = 'PUBLISHED';
    }

    if (status) where.status = status;
    if (ministryId) where.ministryId = ministryId;
    if (featured !== undefined) where.featured = featured;

    if (upcoming) {
      where.startDate = { gte: new Date() };
    }

    if (past) {
      where.endDate = { lt: new Date() };
    }

    if (fromDate) {
      where.startDate = { ...where.startDate, gte: new Date(fromDate) };
    }

    if (toDate) {
      where.endDate = { ...where.endDate, lte: new Date(toDate) };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          ministry: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { registrations: { where: { status: 'CONFIRMED' } } },
          },
        },
        orderBy: { startDate: upcoming || !past ? 'asc' : 'desc' },
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    // Transform to include registration count
    const transformedEvents = events.map(event => ({
      ...event,
      registeredCount: event._count.registrations,
      spotsRemaining: event.maxAttendees
        ? event.maxAttendees - event._count.registrations
        : null,
      _count: undefined,
    }));

    return collectionResponse(transformedEvents, { page, limit, total });
  } catch (error) {
    console.error('Error fetching events:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch events');
  }
}

// POST /api/v1/events
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, 'events:create');
    const tenant = await resolveTenant(request);

    const body = await request.json();
    const data = createEventSchema.parse(body);

    // Check slug uniqueness
    const existing = await prisma.event.findFirst({
      where: {
        tenantId: tenant.id,
        slug: data.slug,
      },
    });

    if (existing) {
      return errorResponse(409, 'SLUG_EXISTS', 'An event with this slug already exists');
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        tenantId: tenant.id,
        title: data.title,
        slug: data.slug,
        description: data.description,
        content: data.content,
        location: data.location,
        address: data.address,
        virtualUrl: data.virtualUrl,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        allDay: data.allDay,
        isRecurring: data.isRecurring,
        recurrenceRule: data.recurrenceRule,
        ministryId: data.ministryId,
        thumbnailUrl: data.thumbnailUrl,
        featured: data.featured,
        registrationEnabled: data.registrationEnabled,
        maxAttendees: data.maxAttendees,
        registrationDeadline: data.registrationDeadline
          ? new Date(data.registrationDeadline)
          : null,
        requiresApproval: data.requiresApproval,
        status: data.status,
        createdById: auth.userId,
        // Create ticket types
        ticketTypes: data.ticketTypes?.length ? {
          create: data.ticketTypes.map((ticket, index) => ({
            tenantId: tenant.id,
            name: ticket.name,
            price: ticket.price,
            quantity: ticket.quantity,
            sortOrder: index,
          })),
        } : undefined,
      },
      include: {
        ministry: { select: { id: true, name: true } },
        ticketTypes: true,
      },
    });

    // Publish event
    await publishEvent('event.created', {
      tenantId: tenant.id,
      eventId: event.id,
      createdBy: auth.userId,
    });

    return successResponse(event, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Invalid input', {
        errors: error.errors,
      });
    }
    console.error('Error creating event:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to create event');
  }
}
```

### Sermon Endpoints

```typescript
// app/api/v1/sermons/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/api/auth';
import { resolveTenant } from '@/middleware/tenant';
import { successResponse, collectionResponse, errorResponse } from '@/lib/api/response';

const sermonQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  seriesId: z.string().optional(),
  speaker: z.string().optional(),
  ministryId: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  search: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  sortBy: z.enum(['preachedAt', 'title', 'playCount']).default('preachedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const createSermonSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional(),
  content: z.string().optional(), // Transcript or notes
  scripture: z.string().max(200).optional(),
  speaker: z.string().min(1).max(100),
  seriesId: z.string().optional(),
  ministryId: z.string().optional(),
  preachedAt: z.string().datetime(),
  audioUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().min(0).optional(), // Duration in seconds
  featured: z.boolean().default(false),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
    size: z.number().optional(),
  })).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});

// GET /api/v1/sermons
export async function GET(request: NextRequest) {
  try {
    const tenant = await resolveTenant(request);

    const { searchParams } = new URL(request.url);
    const params = sermonQuerySchema.parse(Object.fromEntries(searchParams));

    const {
      page, limit, status, seriesId, speaker, ministryId,
      fromDate, toDate, search, featured, sortBy, sortOrder
    } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      tenantId: tenant.id,
      status: 'PUBLISHED', // Default to published only
    };

    // Check if user is authenticated for draft access
    try {
      const auth = await requirePermission(request, 'sermons:read');
      if (status) where.status = status;
    } catch {
      // Keep default published-only filter
    }

    if (seriesId) where.seriesId = seriesId;
    if (speaker) where.speaker = { contains: speaker, mode: 'insensitive' };
    if (ministryId) where.ministryId = ministryId;
    if (featured !== undefined) where.featured = featured;

    if (fromDate) {
      where.preachedAt = { gte: new Date(fromDate) };
    }

    if (toDate) {
      where.preachedAt = {
        ...where.preachedAt,
        lte: new Date(toDate),
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { speaker: { contains: search, mode: 'insensitive' } },
        { scripture: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [sermons, total] = await Promise.all([
      prisma.sermon.findMany({
        where,
        include: {
          series: {
            select: { id: true, title: true, slug: true },
          },
          ministry: {
            select: { id: true, name: true },
          },
          attachments: true,
          tags: {
            include: { tag: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.sermon.count({ where }),
    ]);

    return collectionResponse(sermons, { page, limit, total });
  } catch (error) {
    console.error('Error fetching sermons:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch sermons');
  }
}

// POST /api/v1/sermons
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, 'sermons:create');
    const tenant = await resolveTenant(request);

    const body = await request.json();
    const data = createSermonSchema.parse(body);

    // Check slug uniqueness
    const existing = await prisma.sermon.findFirst({
      where: {
        tenantId: tenant.id,
        slug: data.slug,
      },
    });

    if (existing) {
      return errorResponse(409, 'SLUG_EXISTS', 'A sermon with this slug already exists');
    }

    // Create sermon
    const sermon = await prisma.sermon.create({
      data: {
        tenantId: tenant.id,
        title: data.title,
        slug: data.slug,
        description: data.description,
        content: data.content,
        scripture: data.scripture,
        speaker: data.speaker,
        seriesId: data.seriesId,
        ministryId: data.ministryId,
        preachedAt: new Date(data.preachedAt),
        audioUrl: data.audioUrl,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl,
        duration: data.duration,
        featured: data.featured,
        status: data.status,
        createdById: auth.userId,
        // Create attachments
        attachments: data.attachments?.length ? {
          create: data.attachments.map(attachment => ({
            tenantId: tenant.id,
            name: attachment.name,
            url: attachment.url,
            type: attachment.type,
            size: attachment.size,
          })),
        } : undefined,
        // Create tag connections
        tags: data.tags?.length ? {
          create: data.tags.map(tagName => ({
            tag: {
              connectOrCreate: {
                where: { tenantId_name: { tenantId: tenant.id, name: tagName } },
                create: { tenantId: tenant.id, name: tagName, slug: tagName.toLowerCase().replace(/\s+/g, '-') },
              },
            },
          })),
        } : undefined,
      },
      include: {
        series: { select: { id: true, title: true, slug: true } },
        ministry: { select: { id: true, name: true } },
        attachments: true,
        tags: { include: { tag: true } },
      },
    });

    // Publish event
    await publishEvent('sermon.created', {
      tenantId: tenant.id,
      sermonId: sermon.id,
      createdBy: auth.userId,
    });

    return successResponse(sermon, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Invalid input', {
        errors: error.errors,
      });
    }
    console.error('Error creating sermon:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to create sermon');
  }
}
```

---

## 6. tRPC Integration

### tRPC Router Setup

```typescript
// src/server/trpc/root.ts
import { router } from './trpc';
import { authRouter } from './routers/auth';
import { memberRouter } from './routers/member';
import { eventRouter } from './routers/event';
import { sermonRouter } from './routers/sermon';
import { donationRouter } from './routers/donation';
import { groupRouter } from './routers/group';
import { ministryRouter } from './routers/ministry';
import { mediaRouter } from './routers/media';
import { settingsRouter } from './routers/settings';
import { analyticsRouter } from './routers/analytics';
import { webhookRouter } from './routers/webhook';

export const appRouter = router({
  auth: authRouter,
  member: memberRouter,
  event: eventRouter,
  sermon: sermonRouter,
  donation: donationRouter,
  group: groupRouter,
  ministry: ministryRouter,
  media: mediaRouter,
  settings: settingsRouter,
  analytics: analyticsRouter,
  webhook: webhookRouter,
});

export type AppRouter = typeof appRouter;
```

### tRPC Context

```typescript
// src/server/trpc/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import superjson from 'superjson';
import { ZodError } from 'zod';

interface CreateContextOptions {
  headers: Headers;
}

export const createTRPCContext = async (opts: CreateContextOptions) => {
  const session = await getServerSession(authOptions);

  // Resolve tenant from header or session
  const tenantId = opts.headers.get('x-tenant-id') || session?.user?.tenantId;

  let tenant = null;
  if (tenantId) {
    tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
  }

  return {
    prisma,
    session,
    tenant,
    headers: opts.headers,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware for authenticated routes
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceAuth);

// Middleware for tenant-scoped routes
const enforceTenant = t.middleware(({ ctx, next }) => {
  if (!ctx.tenant) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Tenant not found',
    });
  }
  return next({
    ctx: {
      ...ctx,
      tenant: ctx.tenant,
    },
  });
});

export const tenantProcedure = t.procedure.use(enforceTenant);
export const protectedTenantProcedure = protectedProcedure.use(enforceTenant);

// Middleware for role-based access
export const createRoleProcedure = (allowedRoles: string[]) => {
  return protectedTenantProcedure.use(({ ctx, next }) => {
    if (!allowedRoles.includes(ctx.session.user.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }
    return next();
  });
};

export const adminProcedure = createRoleProcedure(['ADMIN', 'SUPERUSER']);
export const contentManagerProcedure = createRoleProcedure([
  'CONTENT_MANAGER',
  'ADMIN',
  'SUPERUSER',
]);
```

### Example tRPC Router

```typescript
// src/server/trpc/routers/member.ts
import { z } from 'zod';
import { router, protectedTenantProcedure, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const memberRouter = router({
  // List members
  list: protectedTenantProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).optional(),
      groupId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, status, groupId } = input;
      const skip = (page - 1) * limit;

      const where: any = { tenantId: ctx.tenant.id };
      if (status) where.status = status;
      if (groupId) {
        where.groupMemberships = { some: { groupId } };
      }
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [members, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            avatarUrl: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        ctx.prisma.user.count({ where }),
      ]);

      return {
        members,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Get single member
  byId: protectedTenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const member = await ctx.prisma.user.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.tenant.id,
        },
        include: {
          groupMemberships: {
            include: { group: { select: { id: true, name: true } } },
          },
          ministryMemberships: {
            include: { ministry: { select: { id: true, name: true } } },
          },
        },
      });

      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        });
      }

      return member;
    }),

  // Create member
  create: adminProcedure
    .input(z.object({
      email: z.string().email(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phone: z.string().optional(),
      role: z.enum(['GUEST', 'MEMBER', 'SMALL_GROUP_LEADER', 'MINISTRY_LEADER', 'CONTENT_MANAGER', 'ADMIN']).default('MEMBER'),
      groupIds: z.array(z.string()).optional(),
      ministryIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check for existing
      const existing = await ctx.prisma.user.findFirst({
        where: {
          tenantId: ctx.tenant.id,
          email: input.email.toLowerCase(),
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Member with this email already exists',
        });
      }

      return ctx.prisma.user.create({
        data: {
          tenantId: ctx.tenant.id,
          email: input.email.toLowerCase(),
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          role: input.role,
          status: 'ACTIVE',
          groupMemberships: input.groupIds?.length ? {
            create: input.groupIds.map(groupId => ({
              groupId,
              role: 'MEMBER',
            })),
          } : undefined,
          ministryMemberships: input.ministryIds?.length ? {
            create: input.ministryIds.map(ministryId => ({
              ministryId,
              role: 'MEMBER',
            })),
          } : undefined,
        },
      });
    }),

  // Update member
  update: adminProcedure
    .input(z.object({
      id: z.string(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      phone: z.string().optional(),
      role: z.enum(['GUEST', 'MEMBER', 'SMALL_GROUP_LEADER', 'MINISTRY_LEADER', 'CONTENT_MANAGER', 'ADMIN']).optional(),
      status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const member = await ctx.prisma.user.findFirst({
        where: { id, tenantId: ctx.tenant.id },
      });

      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        });
      }

      return ctx.prisma.user.update({
        where: { id },
        data,
      });
    }),

  // Delete member
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.prisma.user.findFirst({
        where: { id: input.id, tenantId: ctx.tenant.id },
      });

      if (!member) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        });
      }

      // Soft delete
      return ctx.prisma.user.update({
        where: { id: input.id },
        data: { status: 'DELETED', deletedAt: new Date() },
      });
    }),
});
```

### tRPC Client Setup

```typescript
// src/lib/trpc/client.ts
import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '@/server/trpc/root';

export const trpc = createTRPCReact<AppRouter>();
```

```typescript
// src/lib/trpc/provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { useState } from 'react';
import superjson from 'superjson';
import { trpc } from './client';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
          headers() {
            return {
              'x-tenant-id': getTenantId(),
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

---

## 7. Webhook System

### Webhook Configuration Schema

```typescript
// prisma/schema.prisma (webhook models)

model Webhook {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name        String
  url         String
  secret      String   // For signature verification
  events      String[] // Array of event types to subscribe to

  isActive    Boolean  @default(true)
  version     String   @default("v1")

  // Headers to include in webhook requests
  headers     Json?

  // Retry configuration
  maxRetries  Int      @default(3)
  retryDelay  Int      @default(60) // seconds

  // Stats
  lastTriggeredAt DateTime?
  failureCount    Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  deliveries  WebhookDelivery[]

  @@index([tenantId])
  @@index([events])
}

model WebhookDelivery {
  id          String   @id @default(cuid())
  webhookId   String
  webhook     Webhook  @relation(fields: [webhookId], references: [id], onDelete: Cascade)

  eventType   String
  payload     Json

  // Request details
  requestHeaders  Json
  requestBody     String @db.Text

  // Response details
  responseStatus  Int?
  responseHeaders Json?
  responseBody    String? @db.Text
  duration        Int?    // milliseconds

  // Delivery status
  status      WebhookDeliveryStatus @default(PENDING)
  attempts    Int                   @default(0)
  nextRetryAt DateTime?
  error       String?

  createdAt   DateTime @default(now())
  completedAt DateTime?

  @@index([webhookId])
  @@index([status])
  @@index([eventType])
}

enum WebhookDeliveryStatus {
  PENDING
  SUCCESS
  FAILED
  RETRYING
}
```

### Webhook Event Types

```typescript
// src/lib/webhooks/events.ts

export const WEBHOOK_EVENTS = {
  // Member Events
  'member.created': 'A new member has been created',
  'member.updated': 'A member has been updated',
  'member.deleted': 'A member has been deleted',
  'member.role_changed': 'A member\'s role has changed',

  // Donation Events
  'donation.created': 'A new donation has been made',
  'donation.succeeded': 'A donation payment has succeeded',
  'donation.failed': 'A donation payment has failed',
  'donation.refunded': 'A donation has been refunded',
  'donation.recurring_created': 'A recurring donation has been set up',
  'donation.recurring_cancelled': 'A recurring donation has been cancelled',

  // Event Events
  'event.created': 'A new event has been created',
  'event.updated': 'An event has been updated',
  'event.cancelled': 'An event has been cancelled',
  'event.registration_created': 'A new event registration',
  'event.registration_cancelled': 'An event registration cancelled',
  'event.check_in': 'A check-in for an event',

  // Sermon Events
  'sermon.created': 'A new sermon has been created',
  'sermon.published': 'A sermon has been published',
  'sermon.updated': 'A sermon has been updated',

  // Group Events
  'group.created': 'A new group has been created',
  'group.member_added': 'A member added to a group',
  'group.member_removed': 'A member removed from a group',

  // Communication Events
  'email.sent': 'An email has been sent',
  'email.delivered': 'An email has been delivered',
  'email.bounced': 'An email has bounced',
  'sms.sent': 'An SMS has been sent',
  'sms.delivered': 'An SMS has been delivered',

  // Form Events
  'form.submitted': 'A form has been submitted',

  // Subscription Events (for platform admins)
  'subscription.created': 'A new subscription has been created',
  'subscription.updated': 'A subscription has been updated',
  'subscription.cancelled': 'A subscription has been cancelled',
  'subscription.payment_failed': 'A subscription payment has failed',
} as const;

export type WebhookEventType = keyof typeof WEBHOOK_EVENTS;
```

### Webhook Service

```typescript
// src/lib/webhooks/service.ts
import { prisma } from '@/lib/db';
import { Queue, Worker } from 'bullmq';
import crypto from 'crypto';
import { WebhookEventType, WEBHOOK_EVENTS } from './events';

const webhookQueue = new Queue('webhooks', {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

interface WebhookPayload {
  id: string;
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, any>;
  tenantId: string;
}

export class WebhookService {
  /**
   * Publish a webhook event
   */
  async publish(
    tenantId: string,
    event: WebhookEventType,
    data: Record<string, any>
  ): Promise<void> {
    // Find all active webhooks subscribed to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        tenantId,
        isActive: true,
        events: { has: event },
      },
    });

    if (webhooks.length === 0) return;

    // Create payload
    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      event,
      timestamp: new Date().toISOString(),
      data,
      tenantId,
    };

    // Queue deliveries for each webhook
    for (const webhook of webhooks) {
      await webhookQueue.add('deliver', {
        webhookId: webhook.id,
        payload,
      }, {
        attempts: webhook.maxRetries,
        backoff: {
          type: 'exponential',
          delay: webhook.retryDelay * 1000,
        },
      });
    }
  }

  /**
   * Create a webhook signature
   */
  createSignature(payload: string, secret: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const signaturePayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signaturePayload)
      .digest('hex');

    return `t=${timestamp},v1=${signature}`;
  }

  /**
   * Verify a webhook signature
   */
  verifySignature(
    signature: string,
    payload: string,
    secret: string,
    tolerance: number = 300 // 5 minutes
  ): boolean {
    const parts = signature.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parseInt(parts.t);
    const expectedSignature = parts.v1;

    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > tolerance) {
      return false;
    }

    // Verify signature
    const signaturePayload = `${timestamp}.${payload}`;
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(signaturePayload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(computedSignature)
    );
  }
}

// Webhook delivery worker
const webhookWorker = new Worker('webhooks', async (job) => {
  const { webhookId, payload } = job.data;

  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId },
  });

  if (!webhook || !webhook.isActive) {
    return;
  }

  const webhookService = new WebhookService();
  const body = JSON.stringify(payload);
  const signature = webhookService.createSignature(body, webhook.secret);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Webhook-ID': webhookId,
    'X-Webhook-Signature': signature,
    'X-Webhook-Event': payload.event,
    'User-Agent': 'DigitalChurchPlatform-Webhook/1.0',
    ...(webhook.headers as Record<string, string> || {}),
  };

  // Create delivery record
  const delivery = await prisma.webhookDelivery.create({
    data: {
      webhookId,
      eventType: payload.event,
      payload,
      requestHeaders: headers,
      requestBody: body,
      status: 'PENDING',
      attempts: job.attemptsMade + 1,
    },
  });

  const startTime = Date.now();

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const responseBody = await response.text();
    const duration = Date.now() - startTime;

    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        responseStatus: response.status,
        responseHeaders: Object.fromEntries(response.headers),
        responseBody,
        duration,
        status: response.ok ? 'SUCCESS' : 'FAILED',
        completedAt: new Date(),
        error: response.ok ? null : `HTTP ${response.status}`,
      },
    });

    // Update webhook stats
    await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        lastTriggeredAt: new Date(),
        failureCount: response.ok ? 0 : { increment: 1 },
      },
    });

    if (!response.ok) {
      throw new Error(`Webhook delivery failed: HTTP ${response.status}`);
    }
  } catch (error) {
    const duration = Date.now() - startTime;

    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        duration,
        status: job.attemptsMade < webhook.maxRetries ? 'RETRYING' : 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        nextRetryAt: job.attemptsMade < webhook.maxRetries
          ? new Date(Date.now() + webhook.retryDelay * 1000 * Math.pow(2, job.attemptsMade))
          : null,
      },
    });

    throw error; // Re-throw to trigger retry
  }
}, {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  concurrency: 10,
});

export const webhookService = new WebhookService();
```

### Webhook API Endpoints

```typescript
// app/api/v1/webhooks/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/api/auth';
import { resolveTenant } from '@/middleware/tenant';
import { successResponse, collectionResponse, errorResponse } from '@/lib/api/response';
import { WEBHOOK_EVENTS, WebhookEventType } from '@/lib/webhooks/events';

const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  headers: z.record(z.string()).optional(),
  maxRetries: z.number().min(0).max(10).default(3),
  retryDelay: z.number().min(10).max(3600).default(60),
});

// GET /api/v1/webhooks
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, 'webhooks:read');
    const tenant = await resolveTenant(request);

    const webhooks = await prisma.webhook.findMany({
      where: { tenantId: tenant.id },
      include: {
        _count: {
          select: {
            deliveries: { where: { status: 'FAILED' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({
      webhooks,
      availableEvents: Object.entries(WEBHOOK_EVENTS).map(([key, description]) => ({
        event: key,
        description,
      })),
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch webhooks');
  }
}

// POST /api/v1/webhooks
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, 'webhooks:create');
    const tenant = await resolveTenant(request);

    const body = await request.json();
    const data = createWebhookSchema.parse(body);

    // Validate events
    const invalidEvents = data.events.filter(
      event => !Object.keys(WEBHOOK_EVENTS).includes(event)
    );

    if (invalidEvents.length > 0) {
      return errorResponse(422, 'INVALID_EVENTS', `Invalid events: ${invalidEvents.join(', ')}`);
    }

    // Generate secret
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const webhook = await prisma.webhook.create({
      data: {
        tenantId: tenant.id,
        name: data.name,
        url: data.url,
        secret,
        events: data.events,
        headers: data.headers || {},
        maxRetries: data.maxRetries,
        retryDelay: data.retryDelay,
      },
    });

    return successResponse({
      webhook: {
        ...webhook,
        secret, // Only returned on creation
      },
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(422, 'VALIDATION_ERROR', 'Invalid input', {
        errors: error.errors,
      });
    }
    console.error('Error creating webhook:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to create webhook');
  }
}
```

### Incoming Webhook Handler (Stripe)

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { webhookService } from '@/lib/webhooks/service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const tenantId = paymentIntent.metadata.tenantId;

        // Update donation status
        await prisma.donation.updateMany({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: { status: 'COMPLETED' },
        });

        // Publish webhook event
        await webhookService.publish(tenantId, 'donation.succeeded', {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        });
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const tenantId = paymentIntent.metadata.tenantId;

        // Update donation status
        await prisma.donation.updateMany({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: { status: 'FAILED' },
        });

        // Publish webhook event
        await webhookService.publish(tenantId, 'donation.failed', {
          paymentIntentId: paymentIntent.id,
          error: paymentIntent.last_payment_error?.message,
        });
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata.tenantId;

        await webhookService.publish(tenantId, 'donation.recurring_created', {
          subscriptionId: subscription.id,
          amount: subscription.items.data[0]?.price?.unit_amount,
          interval: subscription.items.data[0]?.price?.recurring?.interval,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata.tenantId;

        // Update recurring donation status
        await prisma.recurringDonation.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: 'CANCELLED' },
        });

        await webhookService.publish(tenantId, 'donation.recurring_cancelled', {
          subscriptionId: subscription.id,
        });
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const tenantId = charge.metadata.tenantId;

        // Update donation status
        await prisma.donation.updateMany({
          where: { stripeChargeId: charge.id },
          data: { status: 'REFUNDED' },
        });

        await webhookService.publish(tenantId, 'donation.refunded', {
          chargeId: charge.id,
          amount: charge.amount_refunded,
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

---

## 8. Rate Limiting & Throttling

### Rate Limit Configuration

```typescript
// src/lib/api/rate-limit.ts
import { Redis } from 'ioredis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis(process.env.REDIS_URL!);

interface RateLimitConfig {
  requests: number;
  window: number; // seconds
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Default limits
  default: { requests: 100, window: 60 },

  // Endpoint-specific limits
  'auth/login': { requests: 10, window: 60 },
  'auth/register': { requests: 5, window: 60 },
  'auth/forgot-password': { requests: 3, window: 60 },
  'donations': { requests: 20, window: 60 },
  'media/upload': { requests: 30, window: 60 },

  // Plan-based limits (per minute)
  'plan:free': { requests: 60, window: 60 },
  'plan:starter': { requests: 120, window: 60 },
  'plan:professional': { requests: 300, window: 60 },
  'plan:enterprise': { requests: 1000, window: 60 },
};

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  planSlug?: string
): Promise<RateLimitResult> {
  // Get limit config
  const endpointLimit = RATE_LIMITS[endpoint];
  const planLimit = planSlug ? RATE_LIMITS[`plan:${planSlug}`] : null;
  const config = endpointLimit || planLimit || RATE_LIMITS.default;

  const key = `ratelimit:${identifier}:${endpoint}`;
  const now = Date.now();
  const windowStart = now - (config.window * 1000);

  // Use Redis sorted set for sliding window
  const multi = redis.multi();
  multi.zremrangebyscore(key, 0, windowStart);
  multi.zadd(key, now, `${now}-${Math.random()}`);
  multi.zcard(key);
  multi.pexpire(key, config.window * 1000);

  const results = await multi.exec();
  const requestCount = results?.[2]?.[1] as number || 0;

  const allowed = requestCount <= config.requests;
  const reset = Math.ceil((windowStart + config.window * 1000) / 1000);

  return {
    allowed,
    limit: config.requests,
    remaining: Math.max(0, config.requests - requestCount),
    reset,
    retryAfter: allowed ? undefined : Math.ceil((reset * 1000 - now) / 1000),
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

export async function rateLimitMiddleware(
  request: NextRequest,
  endpoint: string,
  planSlug?: string
): Promise<NextResponse | null> {
  const identifier =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-api-key') ||
    'anonymous';

  const result = await checkRateLimit(identifier, endpoint, planSlug);

  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: result.retryAfter,
        },
      },
      {
        status: 429,
        headers: rateLimitHeaders(result),
      }
    );
  }

  return null; // Continue processing
}
```

---

## 9. Error Handling

### Error Classes

```typescript
// src/lib/api/errors.ts

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    errors: Array<{ field: string; message: string; code: string }>
  ) {
    super(422, message, 'VALIDATION_ERROR', { validationErrors: errors });
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message, 'FORBIDDEN');
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter: number) {
    super(429, 'Too many requests', 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }
}
```

### Error Handler

```typescript
// src/lib/api/error-handler.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiError } from './errors';

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Handle known API errors
  if (error instanceof ApiError) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        validationErrors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
      },
    }, { status: 422 });
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return NextResponse.json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Resource already exists',
            details: { fields: error.meta?.target },
          },
        }, { status: 409 });

      case 'P2025':
        return NextResponse.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Resource not found',
          },
        }, { status: 404 });

      default:
        return NextResponse.json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database operation failed',
          },
        }, { status: 500 });
    }
  }

  // Handle unknown errors
  return NextResponse.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  }, { status: 500 });
}
```

### Error Code Reference

```typescript
// Error Codes Reference

// Authentication Errors (401)
AUTH_REQUIRED           // No authentication provided
AUTH_INVALID            // Invalid credentials
AUTH_EXPIRED            // Token expired
TWO_FACTOR_REQUIRED     // 2FA code needed
INVALID_2FA             // Invalid 2FA code
INVALID_API_KEY         // Invalid API key

// Authorization Errors (403)
FORBIDDEN               // Insufficient permissions
TENANT_ACCESS_DENIED    // Cannot access this tenant
RESOURCE_ACCESS_DENIED  // Cannot access this resource

// Validation Errors (422)
VALIDATION_ERROR        // Input validation failed
INVALID_FORMAT          // Invalid data format
MISSING_FIELD           // Required field missing
INVALID_VALUE           // Value out of range/invalid

// Resource Errors (404, 409)
NOT_FOUND               // Resource doesn't exist
CONFLICT                // Resource already exists
SLUG_EXISTS             // Slug already in use
MEMBER_EXISTS           // Member with email exists

// Payment Errors (400)
PAYMENT_ERROR           // Payment processing failed
STRIPE_NOT_CONFIGURED   // Stripe not set up
INVALID_AMOUNT          // Invalid donation amount

// Rate Limiting (429)
RATE_LIMIT_EXCEEDED     // Too many requests

// Server Errors (500)
INTERNAL_ERROR          // Unexpected server error
DATABASE_ERROR          // Database operation failed
EXTERNAL_SERVICE_ERROR  // Third-party service failed
```

---

## 10. Bulk Operations API

Bulk operations enable efficient processing of large datasets, essential for data migration, mass updates, and integration scenarios.

### 10.1 Bulk Operations Design Principles

```typescript
// Bulk Operation Configuration
interface BulkOperationConfig {
  maxItems: 1000;           // Maximum items per request
  maxFileSize: '50MB';      // Maximum file size for imports
  asyncThreshold: 100;      // Above this count, operations are async
  supportedFormats: ['json', 'csv', 'xlsx'];
}

// Bulk Operation Status
type BulkOperationStatus =
  | 'pending'       // Queued for processing
  | 'processing'    // Currently executing
  | 'completed'     // Successfully finished
  | 'partial'       // Completed with some failures
  | 'failed';       // Operation failed
```

### 10.2 Bulk Member Operations

```typescript
// POST /api/v1/members/bulk - Create multiple members
// app/api/v1/members/bulk/route.ts
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requirePermission } from '@/lib/api/auth';
import { successResponse, errorResponse } from '@/lib/api/response';
import { queueBulkOperation } from '@/lib/queue/bulk-operations';

const bulkCreateSchema = z.object({
  members: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    membershipStatus: z.enum(['VISITOR', 'REGULAR', 'MEMBER']).optional(),
    groups: z.array(z.string().uuid()).optional(),
    customFields: z.record(z.any()).optional(),
  })).min(1).max(1000),
  options: z.object({
    skipDuplicates: z.boolean().default(true),
    updateOnConflict: z.boolean().default(false),
    sendWelcomeEmail: z.boolean().default(false),
    validateOnly: z.boolean().default(false), // Dry run
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, 'members:write');
    const body = await request.json();
    const { members, options } = bulkCreateSchema.parse(body);

    // If more than 100 items, process asynchronously
    if (members.length > 100) {
      const operation = await queueBulkOperation({
        type: 'MEMBER_BULK_CREATE',
        tenantId: auth.tenantId,
        userId: auth.userId,
        data: { members, options },
      });

      return successResponse({
        operationId: operation.id,
        status: 'pending',
        message: `Bulk operation queued. ${members.length} members will be processed.`,
        statusUrl: `/api/v1/bulk-operations/${operation.id}`,
      }, 202);
    }

    // Synchronous processing for smaller batches
    const results = await processBulkMemberCreate(auth.tenantId, members, options);

    return successResponse({
      created: results.created,
      skipped: results.skipped,
      failed: results.failed,
      details: results.details,
    }, 201);
  } catch (error) {
    // Error handling...
  }
}

// DELETE /api/v1/members/bulk - Delete multiple members
const bulkDeleteSchema = z.object({
  memberIds: z.array(z.string().uuid()).min(1).max(1000),
  options: z.object({
    hardDelete: z.boolean().default(false), // Soft delete by default
    notifyMembers: z.boolean().default(false),
  }).optional(),
});

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requirePermission(request, 'members:delete');
    const body = await request.json();
    const { memberIds, options } = bulkDeleteSchema.parse(body);

    // Verify all members belong to tenant
    const members = await prisma.member.findMany({
      where: {
        id: { in: memberIds },
        tenantId: auth.tenantId,
      },
      select: { id: true },
    });

    const foundIds = members.map(m => m.id);
    const notFoundIds = memberIds.filter(id => !foundIds.includes(id));

    if (options?.hardDelete) {
      await prisma.member.deleteMany({
        where: {
          id: { in: foundIds },
          tenantId: auth.tenantId,
        },
      });
    } else {
      await prisma.member.updateMany({
        where: {
          id: { in: foundIds },
          tenantId: auth.tenantId,
        },
        data: {
          status: 'INACTIVE',
          deletedAt: new Date(),
        },
      });
    }

    return successResponse({
      deleted: foundIds.length,
      notFound: notFoundIds,
      hardDelete: options?.hardDelete || false,
    });
  } catch (error) {
    // Error handling...
  }
}
```

### 10.3 Data Import API

```typescript
// POST /api/v1/import - Import data from file
// app/api/v1/import/route.ts

const importSchema = z.object({
  resourceType: z.enum(['members', 'donations', 'events', 'groups']),
  format: z.enum(['csv', 'json', 'xlsx']),
  mappings: z.record(z.string()).optional(), // Column mappings
  options: z.object({
    skipFirstRow: z.boolean().default(true), // Skip header row
    skipDuplicates: z.boolean().default(true),
    updateOnConflict: z.boolean().default(false),
    validateOnly: z.boolean().default(false),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, 'data:import');
    const formData = await request.formData();

    const file = formData.get('file') as File;
    const config = JSON.parse(formData.get('config') as string);
    const { resourceType, format, mappings, options } = importSchema.parse(config);

    // Validate file
    if (!file || file.size === 0) {
      return errorResponse(400, 'FILE_REQUIRED', 'Import file is required');
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      return errorResponse(400, 'FILE_TOO_LARGE', 'File exceeds 50MB limit');
    }

    // Queue import operation
    const operation = await queueBulkOperation({
      type: 'DATA_IMPORT',
      tenantId: auth.tenantId,
      userId: auth.userId,
      data: {
        resourceType,
        format,
        mappings,
        options,
        fileKey: await uploadToStorage(file, auth.tenantId),
      },
    });

    return successResponse({
      operationId: operation.id,
      status: 'pending',
      message: `Import queued for ${resourceType}`,
      statusUrl: `/api/v1/bulk-operations/${operation.id}`,
    }, 202);
  } catch (error) {
    // Error handling...
  }
}

// GET /api/v1/export - Export data
export async function exportData(
  tenantId: string,
  resourceType: string,
  format: 'csv' | 'json' | 'xlsx',
  filters?: Record<string, any>
) {
  const operation = await queueBulkOperation({
    type: 'DATA_EXPORT',
    tenantId,
    data: { resourceType, format, filters },
  });

  return {
    operationId: operation.id,
    status: 'pending',
    downloadUrl: `/api/v1/bulk-operations/${operation.id}/download`,
  };
}
```

### 10.4 Bulk Operation Status & Progress

```typescript
// GET /api/v1/bulk-operations/{id} - Get operation status
// app/api/v1/bulk-operations/[id]/route.ts

interface BulkOperationResponse {
  id: string;
  type: string;
  status: BulkOperationStatus;
  progress: {
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
    percentage: number;
  };
  result?: {
    downloadUrl?: string;     // For exports
    summary?: {
      created: number;
      updated: number;
      skipped: number;
      failed: number;
    };
    errors?: Array<{
      row?: number;
      field?: string;
      message: string;
    }>;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  expiresAt?: string;  // Download link expiration
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request);

  const operation = await prisma.bulkOperation.findFirst({
    where: {
      id: params.id,
      tenantId: auth.tenantId,
    },
  });

  if (!operation) {
    return errorResponse(404, 'NOT_FOUND', 'Bulk operation not found');
  }

  return successResponse({
    id: operation.id,
    type: operation.type,
    status: operation.status,
    progress: operation.progress,
    result: operation.result,
    createdAt: operation.createdAt.toISOString(),
    startedAt: operation.startedAt?.toISOString(),
    completedAt: operation.completedAt?.toISOString(),
    expiresAt: operation.expiresAt?.toISOString(),
  });
}
```

### 10.5 Bulk Operations Schema

```prisma
model BulkOperation {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  tenant          Tenant    @relation(fields: [tenantId], references: [id])

  type            String    // MEMBER_BULK_CREATE, DATA_IMPORT, DATA_EXPORT, etc.
  status          String    @default("pending")

  // Progress tracking
  progress        Json      @default("{}")  // { total, processed, succeeded, failed }

  // Input data
  inputData       Json?     @map("input_data")

  // Result data
  result          Json?     // { downloadUrl, summary, errors }

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  startedAt       DateTime? @map("started_at")
  completedAt     DateTime? @map("completed_at")
  expiresAt       DateTime? @map("expires_at")

  // Created by
  createdById     String    @map("created_by_id")
  createdBy       User      @relation(fields: [createdById], references: [id])

  @@index([tenantId])
  @@index([status])
  @@index([createdAt])
  @@map("bulk_operations")
}
```

### 10.6 Bulk Operations Queue Worker

```typescript
// workers/bulk-operations.ts
import { Worker, Job } from 'bullmq';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';

const bulkOperationWorker = new Worker(
  'bulk-operations',
  async (job: Job) => {
    const { operationId } = job.data;

    // Update status to processing
    await prisma.bulkOperation.update({
      where: { id: operationId },
      data: {
        status: 'processing',
        startedAt: new Date(),
      },
    });

    try {
      const operation = await prisma.bulkOperation.findUnique({
        where: { id: operationId },
      });

      let result;

      switch (operation.type) {
        case 'MEMBER_BULK_CREATE':
          result = await processBulkMemberCreate(operation);
          break;
        case 'DATA_IMPORT':
          result = await processDataImport(operation);
          break;
        case 'DATA_EXPORT':
          result = await processDataExport(operation);
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      // Update completion
      await prisma.bulkOperation.update({
        where: { id: operationId },
        data: {
          status: result.failed > 0 ? 'partial' : 'completed',
          result,
          completedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      return result;
    } catch (error) {
      await prisma.bulkOperation.update({
        where: { id: operationId },
        data: {
          status: 'failed',
          result: { error: error.message },
          completedAt: new Date(),
        },
      });

      throw error;
    }
  },
  { connection: redis }
);

// Progress reporting helper
async function updateProgress(
  operationId: string,
  progress: { processed: number; succeeded: number; failed: number }
) {
  await prisma.bulkOperation.update({
    where: { id: operationId },
    data: {
      progress: {
        ...progress,
        percentage: Math.round((progress.processed / progress.total) * 100),
      },
    },
  });
}
```

---

## 11. Versioning Strategy

### URL-Based Versioning (Primary)

```
https://api.digitalchurch.com/v1/members
https://api.digitalchurch.com/v2/members
```

### Header-Based Versioning (Alternative)

```http
Accept: application/vnd.digitalchurch.v1+json
X-API-Version: v1
```

### Version Middleware

```typescript
// src/middleware/api-version.ts
import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED_VERSIONS = ['v1', 'v2'];
const DEFAULT_VERSION = 'v1';
const DEPRECATED_VERSIONS = ['v1']; // For sunset warnings

export function extractApiVersion(request: NextRequest): string {
  // Check URL path first
  const pathVersion = request.nextUrl.pathname.match(/\/api\/(v\d+)\//)?.[1];
  if (pathVersion && SUPPORTED_VERSIONS.includes(pathVersion)) {
    return pathVersion;
  }

  // Check header
  const headerVersion = request.headers.get('x-api-version');
  if (headerVersion && SUPPORTED_VERSIONS.includes(headerVersion)) {
    return headerVersion;
  }

  // Check Accept header
  const acceptHeader = request.headers.get('accept') || '';
  const acceptVersion = acceptHeader.match(/application\/vnd\.digitalchurch\.(v\d+)\+json/)?.[1];
  if (acceptVersion && SUPPORTED_VERSIONS.includes(acceptVersion)) {
    return acceptVersion;
  }

  return DEFAULT_VERSION;
}

export function versionHeaders(version: string): Record<string, string> {
  const headers: Record<string, string> = {
    'X-API-Version': version,
  };

  if (DEPRECATED_VERSIONS.includes(version)) {
    headers['X-API-Deprecation-Notice'] =
      `API version ${version} is deprecated and will be removed on 2025-12-31. ` +
      `Please migrate to v2.`;
    headers['Sunset'] = 'Tue, 31 Dec 2025 23:59:59 GMT';
  }

  return headers;
}
```

### 11.4 API Deprecation Policy

A formal deprecation policy ensures API consumers have sufficient time to migrate to new versions.

```typescript
// lib/api/versioning.ts

/**
 * API VERSIONING AND DEPRECATION POLICY
 *
 * Timeline for API Version Lifecycle:
 *
 * 1. ACTIVE (Current) - Full support, recommended for all new integrations
 * 2. DEPRECATED - 6 months notice before sunset, still functional
 * 3. SUNSET - 12 months after deprecation announcement, version removed
 *
 * Communication Requirements:
 * - Email notification to all API key owners 6 months before sunset
 * - API response headers include deprecation warnings
 * - Developer portal displays migration guides
 * - Monthly reminder emails during deprecation period
 */

interface ApiVersionInfo {
  version: string;
  status: 'active' | 'deprecated' | 'sunset';
  releasedAt: Date;
  deprecatedAt?: Date;
  sunsetAt?: Date;
  migrationGuide?: string;
  breakingChanges?: string[];
}

const API_VERSION_REGISTRY: ApiVersionInfo[] = [
  {
    version: 'v1',
    status: 'deprecated',
    releasedAt: new Date('2024-01-01'),
    deprecatedAt: new Date('2024-12-01'),
    sunsetAt: new Date('2025-12-31'),
    migrationGuide: 'https://docs.digitalchurch.com/api/migration/v1-to-v2',
    breakingChanges: [
      'Pagination response format changed to cursor-based',
      'Member status enum values updated',
      'Donation endpoint path changed',
    ],
  },
  {
    version: 'v2',
    status: 'active',
    releasedAt: new Date('2024-12-01'),
    migrationGuide: undefined,
    breakingChanges: undefined,
  },
];

// Get deprecation info for a version
export function getVersionInfo(version: string): ApiVersionInfo | undefined {
  return API_VERSION_REGISTRY.find(v => v.version === version);
}

// Check if version is deprecated
export function isVersionDeprecated(version: string): boolean {
  const info = getVersionInfo(version);
  return info?.status === 'deprecated';
}

// Get days until sunset
export function getDaysUntilSunset(version: string): number | null {
  const info = getVersionInfo(version);
  if (!info?.sunsetAt) return null;

  const now = new Date();
  const sunset = new Date(info.sunsetAt);
  const diffTime = sunset.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
```

### 11.5 Deprecation Notification System

```typescript
// lib/api/deprecation-notifications.ts
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

// Scheduled job to notify API key owners about deprecation
export async function notifyDeprecatedApiKeyOwners() {
  const deprecatedVersions = API_VERSION_REGISTRY.filter(
    v => v.status === 'deprecated'
  );

  for (const versionInfo of deprecatedVersions) {
    const daysUntilSunset = getDaysUntilSunset(versionInfo.version);

    // Notify at specific intervals: 180, 90, 60, 30, 14, 7, 1 days
    const notifyAt = [180, 90, 60, 30, 14, 7, 1];
    if (!daysUntilSunset || !notifyAt.includes(daysUntilSunset)) {
      continue;
    }

    // Find all API keys using this version
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        lastApiVersion: versionInfo.version,
        isActive: true,
      },
      include: {
        tenant: true,
        createdBy: true,
      },
    });

    for (const apiKey of apiKeys) {
      await sendEmail({
        to: apiKey.createdBy.email,
        subject: `Action Required: API ${versionInfo.version} Sunset in ${daysUntilSunset} days`,
        template: 'api-deprecation-notice',
        data: {
          apiKeyName: apiKey.name,
          tenantName: apiKey.tenant.name,
          version: versionInfo.version,
          sunsetDate: versionInfo.sunsetAt?.toLocaleDateString(),
          daysRemaining: daysUntilSunset,
          migrationGuide: versionInfo.migrationGuide,
          breakingChanges: versionInfo.breakingChanges,
        },
      });

      // Log notification
      await prisma.apiDeprecationNotification.create({
        data: {
          apiKeyId: apiKey.id,
          version: versionInfo.version,
          notificationType: `${daysUntilSunset}_DAYS_WARNING`,
          sentAt: new Date(),
        },
      });
    }
  }
}
```

### 11.6 Version Migration Helper

```typescript
// lib/api/version-migration.ts

/**
 * Helper utilities for API version migration
 */

// Transform v1 response to v2 format
export function transformV1ToV2Response(v1Response: any, endpoint: string): any {
  // Transform pagination from offset to cursor-based
  if (v1Response.pagination?.page !== undefined) {
    return {
      ...v1Response,
      pagination: {
        cursor: encodeCursor(v1Response.pagination.page, v1Response.pagination.limit),
        nextCursor: v1Response.pagination.hasNext
          ? encodeCursor(v1Response.pagination.page + 1, v1Response.pagination.limit)
          : null,
        prevCursor: v1Response.pagination.hasPrev
          ? encodeCursor(v1Response.pagination.page - 1, v1Response.pagination.limit)
          : null,
        hasMore: v1Response.pagination.hasNext,
        limit: v1Response.pagination.limit,
        // Keep total for backwards compatibility during migration
        _deprecatedTotal: v1Response.pagination.total,
      },
    };
  }

  return v1Response;
}

// Transform v1 request to v2 format
export function transformV1ToV2Request(v1Request: any, endpoint: string): any {
  // Transform page-based to cursor-based pagination
  if (v1Request.page !== undefined) {
    return {
      ...v1Request,
      cursor: encodeCursor(v1Request.page, v1Request.limit || 20),
      page: undefined, // Remove deprecated field
    };
  }

  return v1Request;
}

function encodeCursor(page: number, limit: number): string {
  return Buffer.from(JSON.stringify({ p: page, l: limit })).toString('base64url');
}

function decodeCursor(cursor: string): { page: number; limit: number } {
  const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString());
  return { page: decoded.p, limit: decoded.l };
}
```

### 11.7 Version Information Endpoint

```typescript
// app/api/versions/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET /api/versions - Get all API version information
export async function GET(request: NextRequest) {
  return NextResponse.json({
    current: 'v2',
    supported: ['v1', 'v2'],
    versions: API_VERSION_REGISTRY.map(v => ({
      version: v.version,
      status: v.status,
      releasedAt: v.releasedAt.toISOString(),
      deprecatedAt: v.deprecatedAt?.toISOString(),
      sunsetAt: v.sunsetAt?.toISOString(),
      migrationGuide: v.migrationGuide,
    })),
    deprecationPolicy: {
      deprecationNoticePeriod: '6 months',
      sunsetPeriod: '12 months after deprecation',
      notificationSchedule: [180, 90, 60, 30, 14, 7, 1],
      documentationUrl: 'https://docs.digitalchurch.com/api/versioning',
    },
  });
}
```

---

## 12. API Gateway & Security

### API Gateway Configuration

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from './lib/api/rate-limit';
import { extractApiVersion, versionHeaders } from './middleware/api-version';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Extract endpoint for rate limiting
  const endpoint = pathname.replace(/^\/api\/v\d+\//, '').split('/')[0];

  // Check rate limit
  const rateLimitResponse = await rateLimitMiddleware(request, endpoint);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Extract API version
  const version = extractApiVersion(request);

  // Add security headers
  const response = NextResponse.next();

  // Version headers
  const versionH = versionHeaders(version);
  Object.entries(versionH).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CORS headers for API
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers',
      'Authorization, Content-Type, X-Tenant-ID, X-API-Version, X-Request-ID, X-Idempotency-Key'
    );
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

### Request Validation Middleware

```typescript
// src/lib/api/validate.ts
import { z } from 'zod';
import { NextRequest } from 'next/server';

export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  const contentType = request.headers.get('content-type');

  let data: any;

  if (contentType?.includes('application/json')) {
    data = await request.json();
  } else if (contentType?.includes('multipart/form-data')) {
    data = Object.fromEntries(await request.formData());
  } else if (contentType?.includes('application/x-www-form-urlencoded')) {
    data = Object.fromEntries(new URLSearchParams(await request.text()));
  } else {
    data = Object.fromEntries(new URL(request.url).searchParams);
  }

  return schema.parse(data);
}
```

---

## 12. SDK & Client Libraries

### TypeScript/JavaScript SDK

```typescript
// @digitalchurch/sdk

import axios, { AxiosInstance } from 'axios';

interface SDKConfig {
  baseUrl?: string;
  apiKey?: string;
  tenantId?: string;
  version?: string;
}

export class DigitalChurchSDK {
  private client: AxiosInstance;
  private tenantId: string;

  constructor(config: SDKConfig) {
    this.tenantId = config.tenantId || '';

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.digitalchurch.com',
      headers: {
        'Authorization': config.apiKey ? `Bearer ${config.apiKey}` : undefined,
        'X-Tenant-ID': this.tenantId,
        'X-API-Version': config.version || 'v1',
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor
    this.client.interceptors.response.use(
      response => response.data,
      error => {
        if (error.response) {
          throw new ApiError(
            error.response.status,
            error.response.data.error?.message || 'Request failed',
            error.response.data.error?.code || 'UNKNOWN_ERROR',
            error.response.data.error?.details
          );
        }
        throw error;
      }
    );
  }

  // Members
  members = {
    list: (params?: MemberListParams) =>
      this.client.get('/v1/members', { params }),

    get: (id: string) =>
      this.client.get(`/v1/members/${id}`),

    create: (data: CreateMemberData) =>
      this.client.post('/v1/members', data),

    update: (id: string, data: UpdateMemberData) =>
      this.client.patch(`/v1/members/${id}`, data),

    delete: (id: string) =>
      this.client.delete(`/v1/members/${id}`),
  };

  // Events
  events = {
    list: (params?: EventListParams) =>
      this.client.get('/v1/events', { params }),

    get: (id: string) =>
      this.client.get(`/v1/events/${id}`),

    create: (data: CreateEventData) =>
      this.client.post('/v1/events', data),

    register: (eventId: string, data: EventRegistrationData) =>
      this.client.post(`/v1/events/${eventId}/register`, data),
  };

  // Donations
  donations = {
    list: (params?: DonationListParams) =>
      this.client.get('/v1/donations', { params }),

    create: (data: CreateDonationData) =>
      this.client.post('/v1/donations', data),

    createRecurring: (data: CreateRecurringDonationData) =>
      this.client.post('/v1/donations/recurring', data),
  };

  // Sermons
  sermons = {
    list: (params?: SermonListParams) =>
      this.client.get('/v1/sermons', { params }),

    get: (id: string) =>
      this.client.get(`/v1/sermons/${id}`),

    getBySlug: (slug: string) =>
      this.client.get(`/v1/sermons/slug/${slug}`),
  };

  // Webhooks
  webhooks = {
    list: () =>
      this.client.get('/v1/webhooks'),

    create: (data: CreateWebhookData) =>
      this.client.post('/v1/webhooks', data),

    delete: (id: string) =>
      this.client.delete(`/v1/webhooks/${id}`),

    verifySignature: (payload: string, signature: string, secret: string) =>
      verifyWebhookSignature(payload, signature, secret),
  };
}

// Usage example
const sdk = new DigitalChurchSDK({
  apiKey: 'your-api-key',
  tenantId: 'tenant_abc123',
});

// List members
const members = await sdk.members.list({
  page: 1,
  limit: 20,
  search: 'john',
});

// Create donation
const donation = await sdk.donations.create({
  amount: 5000, // $50.00
  fundId: 'fund_general',
  paymentMethodId: 'pm_xxx',
});
```

---

## 13. GraphQL Layer (Optional)

### GraphQL Schema

```graphql
# schema.graphql

type Query {
  # Members
  members(
    page: Int
    limit: Int
    search: String
    status: MemberStatus
  ): MemberConnection!
  member(id: ID!): Member

  # Events
  events(
    page: Int
    limit: Int
    upcoming: Boolean
    ministryId: ID
  ): EventConnection!
  event(id: ID!): Event

  # Sermons
  sermons(
    page: Int
    limit: Int
    seriesId: ID
    speaker: String
  ): SermonConnection!
  sermon(id: ID!): Sermon
  sermonBySlug(slug: String!): Sermon

  # Groups
  groups(page: Int, limit: Int): GroupConnection!
  group(id: ID!): Group

  # Analytics
  dashboardStats: DashboardStats!
}

type Mutation {
  # Members
  createMember(input: CreateMemberInput!): Member!
  updateMember(id: ID!, input: UpdateMemberInput!): Member!
  deleteMember(id: ID!): Boolean!

  # Events
  createEvent(input: CreateEventInput!): Event!
  registerForEvent(eventId: ID!, input: EventRegistrationInput!): EventRegistration!

  # Donations
  createDonation(input: CreateDonationInput!): Donation!
  createRecurringDonation(input: CreateRecurringDonationInput!): RecurringDonation!
}

type Subscription {
  # Real-time updates
  donationReceived: Donation!
  eventRegistration(eventId: ID!): EventRegistration!
  memberCreated: Member!
}

# Types
type Member {
  id: ID!
  email: String!
  firstName: String!
  lastName: String!
  fullName: String!
  phone: String
  role: UserRole!
  status: MemberStatus!
  avatarUrl: String
  groups: [Group!]!
  ministries: [Ministry!]!
  donations: [Donation!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Event {
  id: ID!
  title: String!
  slug: String!
  description: String
  location: String
  startDate: DateTime!
  endDate: DateTime!
  featured: Boolean!
  registrationEnabled: Boolean!
  maxAttendees: Int
  registeredCount: Int!
  spotsRemaining: Int
  ministry: Ministry
  registrations: [EventRegistration!]!
  createdAt: DateTime!
}

type Sermon {
  id: ID!
  title: String!
  slug: String!
  description: String
  scripture: String
  speaker: String!
  preachedAt: DateTime!
  audioUrl: String
  videoUrl: String
  thumbnailUrl: String
  duration: Int
  playCount: Int!
  series: SermonSeries
  attachments: [Attachment!]!
  tags: [Tag!]!
}

# Connections for pagination
type MemberConnection {
  edges: [MemberEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type MemberEdge {
  node: Member!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

---

## 14. Performance Optimization

### Caching Strategy

```typescript
// src/lib/api/cache.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

interface CacheOptions {
  ttl?: number; // seconds
  tags?: string[];
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function cacheSet(
  key: string,
  value: any,
  options: CacheOptions = {}
): Promise<void> {
  const { ttl = 300, tags = [] } = options;

  await redis.setex(key, ttl, JSON.stringify(value));

  // Track tags for invalidation
  for (const tag of tags) {
    await redis.sadd(`cache:tag:${tag}`, key);
  }
}

export async function cacheInvalidateByTag(tag: string): Promise<void> {
  const keys = await redis.smembers(`cache:tag:${tag}`);
  if (keys.length > 0) {
    await redis.del(...keys);
    await redis.del(`cache:tag:${tag}`);
  }
}

// API-level caching
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached) return cached;

  const result = await fn();
  await cacheSet(key, result, options);
  return result;
}
```

### Database Query Optimization

```typescript
// Efficient pagination with cursor
async function listMembersWithCursor(
  tenantId: string,
  cursor?: string,
  limit: number = 20
) {
  const cursorCondition = cursor
    ? { id: { gt: cursor } }
    : {};

  const members = await prisma.user.findMany({
    where: {
      tenantId,
      ...cursorCondition,
    },
    take: limit + 1, // Fetch one extra to check hasNext
    orderBy: { id: 'asc' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      // Only select needed fields
    },
  });

  const hasNext = members.length > limit;
  const data = hasNext ? members.slice(0, -1) : members;

  return {
    data,
    pageInfo: {
      hasNext,
      endCursor: data[data.length - 1]?.id,
    },
  };
}
```

---

## 15. API Documentation

### OpenAPI 3.1 Specification

```yaml
# openapi.yaml
openapi: 3.1.0
info:
  title: Digital Church Platform API
  version: 1.0.0
  description: |
    Enterprise API for the Digital Church Platform - a comprehensive
    multi-tenant church management and engagement solution.
  contact:
    name: API Support
    email: api-support@digitalchurch.com
  license:
    name: Proprietary
    url: https://digitalchurch.com/terms

servers:
  - url: https://api.digitalchurch.com/v1
    description: Production
  - url: https://sandbox-api.digitalchurch.com/v1
    description: Sandbox

security:
  - bearerAuth: []
  - apiKeyAuth: []

tags:
  - name: Authentication
    description: User authentication and token management
  - name: Members
    description: Church member management
  - name: Events
    description: Event management and registration
  - name: Donations
    description: Online giving and donations
  - name: Sermons
    description: Sermon library and media
  - name: Groups
    description: Small groups and ministries
  - name: Webhooks
    description: Webhook configuration and management

paths:
  /auth/login:
    post:
      tags: [Authentication]
      summary: Authenticate user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: Successful authentication
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /members:
    get:
      tags: [Members]
      summary: List members
      parameters:
        - $ref: '#/components/parameters/Page'
        - $ref: '#/components/parameters/Limit'
        - name: search
          in: query
          schema:
            type: string
        - name: status
          in: query
          schema:
            type: string
            enum: [ACTIVE, INACTIVE, PENDING]
      responses:
        '200':
          description: List of members
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MemberListResponse'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    apiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

  parameters:
    Page:
      name: page
      in: query
      schema:
        type: integer
        minimum: 1
        default: 1
    Limit:
      name: limit
      in: query
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20

  responses:
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

  schemas:
    LoginRequest:
      type: object
      required: [email, password]
      properties:
        email:
          type: string
          format: email
        password:
          type: string
        twoFactorCode:
          type: string

    Error:
      type: object
      properties:
        success:
          type: boolean
          enum: [false]
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object
```

---

## Summary

The Digital Church Platform API provides:

1. **Comprehensive REST API**: Full CRUD operations for all platform resources
2. **Type-Safe tRPC**: End-to-end type safety for TypeScript applications
3. **50+ Webhook Events**: Real-time notifications for integrations
4. **Multi-Tenant Security**: Automatic tenant isolation at every level
5. **Flexible Authentication**: JWT, API Keys, and OAuth 2.0 support
6. **Enterprise Rate Limiting**: Per-plan limits with Redis-backed sliding window
7. **Interactive Documentation**: OpenAPI 3.1 with Swagger UI
8. **SDK Libraries**: Ready-to-use TypeScript SDK with full type support

**Document Version**: 3.0 Enterprise Edition
**API Version**: v1
**Last Updated**: December 2024
