# 17. Authentication & Authorization

## Overview

The Digital Church Platform implements a comprehensive, enterprise-grade authentication and authorization system built on NextAuth.js v4. The system supports multi-tenant isolation, role-based access control (RBAC), OAuth providers, two-factor authentication, and extensive security features designed for churches of all sizes.

---

## Competitive Analysis

| Feature | Auth0 | Firebase Auth | Clerk | **Digital Church Platform** |
|---------|-------|---------------|-------|----------------------------|
| Multi-Tenant | Enterprise | Limited | Yes | **Native Multi-Tenant** |
| Custom Branding | Premium | None | Yes | **Full Template Theming** |
| Role-Based Access | Yes | Custom Claims | Yes | **Church-Specific RBAC** |
| 2FA/MFA | Yes | Yes | Yes | **TOTP + Backup Codes** |
| Social Login | Yes | Yes | Yes | **Google, Facebook, Apple** |
| Self-Service | Limited | Basic | Yes | **Full Member Portal** |
| Pricing | Usage-based | Free tier | Per user | **Included** |
| Church Integration | None | None | None | **Ministry-Based Permissions** |

---

## Key Features

1. **Multi-Tenant Isolation**: Complete data separation per church tenant
2. **Role-Based Access**: Church-specific roles (Member, Leader, Admin, etc.)
3. **JWT Sessions**: Secure, stateless authentication with refresh tokens
4. **OAuth Integration**: Google, Facebook, Apple, and more
5. **Two-Factor Auth**: TOTP-based 2FA with backup codes
6. **Password Security**: bcrypt hashing, strength validation
7. **Email Verification**: Template-styled verification emails
8. **Session Management**: Concurrent session control and activity logging
9. **Audit Logging**: Complete authentication event tracking
10. **Biometric Support**: Mobile Face ID/Touch ID integration

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Authentication Architecture                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                          Client Applications                             ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    ││
│  │  │   Web App   │  │  Mobile App │  │  Admin CMS  │  │Platform Admin│    ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        Authentication Layer                              ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    ││
│  │  │  NextAuth   │  │    JWT      │  │   Session   │  │   OAuth     │    ││
│  │  │   Handler   │  │   Manager   │  │   Manager   │  │  Providers  │    ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        Multi-Tenant Middleware                           ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    ││
│  │  │   Tenant    │  │    RBAC     │  │    Rate     │  │   Audit     │    ││
│  │  │  Resolver   │  │   Engine    │  │   Limiter   │  │   Logger    │    ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                          Data Layer                                      ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    ││
│  │  │    User     │  │   Session   │  │  Password   │  │    Audit    │    ││
│  │  │   Store     │  │   Store     │  │   Store     │  │    Log      │    ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Database Schema

### 1.1 Core Authentication Models

```prisma
// prisma/schema.prisma

// User model with tenant association
model User {
  id                    String    @id @default(cuid())
  tenantId              String
  tenant                Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Basic info
  email                 String
  username              String?
  firstName             String?
  lastName              String?
  phone                 String?
  avatarUrl             String?

  // Authentication
  password              String?
  emailVerified         DateTime?
  phoneVerified         DateTime?

  // Role and permissions
  role                  UserRole  @default(MEMBER)
  permissions           Json?     // Custom permissions override

  // Security
  twoFactorEnabled      Boolean   @default(false)
  twoFactorSecret       String?

  // Status
  status                UserStatus @default(PENDING)
  isActive              Boolean    @default(true)

  // Tracking
  lastLoginAt           DateTime?
  lastLoginIp           String?
  failedLoginAttempts   Int       @default(0)
  lockedUntil           DateTime?

  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  // Relations
  member                Member?
  sessions              Session[]
  accounts              Account[]
  passwordResets        PasswordReset[]
  verificationTokens    VerificationToken[]
  loginAttempts         LoginAttempt[]
  auditLogs             AuditLog[]
  backupCodes           BackupCode[]

  @@unique([tenantId, email])
  @@unique([tenantId, username])
  @@index([tenantId])
  @@index([email])
  @@index([status])
}

enum UserRole {
  GUEST             // Public visitor
  MEMBER            // Verified church member
  SMALL_GROUP_LEADER // Leads small groups
  MINISTRY_LEADER   // Manages ministry
  CONTENT_MANAGER   // Content creation/editing
  ADMIN             // Church admin
  SUPERUSER         // Full tenant access
}

enum UserStatus {
  PENDING           // Awaiting email verification
  ACTIVE            // Normal active user
  SUSPENDED         // Temporarily suspended
  DEACTIVATED       // Soft deleted
}

// OAuth provider accounts
model Account {
  id                    String  @id @default(cuid())
  userId                String
  user                  User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  type                  String
  provider              String
  providerAccountId     String
  refresh_token         String? @db.Text
  access_token          String? @db.Text
  expires_at            Int?
  token_type            String?
  scope                 String?
  id_token              String? @db.Text
  session_state         String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@unique([provider, providerAccountId])
  @@index([userId])
}

// Active sessions
model Session {
  id                    String   @id @default(cuid())
  userId                String
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  sessionToken          String   @unique
  accessToken           String?  @unique
  refreshToken          String?  @unique

  // Device info
  userAgent             String?
  ipAddress             String?
  deviceType            String?  // web, mobile, tablet
  deviceName            String?

  // Location
  country               String?
  city                  String?

  // Timestamps
  expiresAt             DateTime
  lastActiveAt          DateTime @default(now())
  createdAt             DateTime @default(now())

  @@index([userId])
  @@index([sessionToken])
  @@index([expiresAt])
}

// Password reset tokens
model PasswordReset {
  id                    String   @id @default(cuid())
  userId                String
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  token                 String   @unique
  expiresAt             DateTime
  usedAt                DateTime?

  createdAt             DateTime @default(now())

  @@index([token])
  @@index([userId])
}

// Email verification tokens
model VerificationToken {
  id                    String   @id @default(cuid())
  userId                String
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  token                 String   @unique
  type                  VerificationType
  expiresAt             DateTime
  verified              Boolean  @default(false)

  createdAt             DateTime @default(now())

  @@index([token])
  @@index([userId])
}

enum VerificationType {
  EMAIL
  PHONE
  TWO_FACTOR_SETUP
}

// 2FA backup codes
model BackupCode {
  id                    String   @id @default(cuid())
  userId                String
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  code                  String   // Hashed backup code
  used                  Boolean  @default(false)
  usedAt                DateTime?

  createdAt             DateTime @default(now())

  @@index([userId])
}

// Login attempt tracking
model LoginAttempt {
  id                    String   @id @default(cuid())
  userId                String?
  user                  User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  tenantId              String?
  email                 String
  ipAddress             String
  userAgent             String?

  success               Boolean
  failureReason         String?

  createdAt             DateTime @default(now())

  @@index([email])
  @@index([ipAddress])
  @@index([tenantId])
  @@index([createdAt])
}

// Comprehensive audit logging
model AuditLog {
  id                    String   @id @default(cuid())
  tenantId              String?
  tenant                Tenant?  @relation(fields: [tenantId], references: [id], onDelete: SetNull)

  userId                String?
  user                  User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  action                AuditAction
  resource              String
  resourceId            String?

  // Details
  description           String?
  metadata              Json?
  previousValue         Json?
  newValue              Json?

  // Context
  ipAddress             String?
  userAgent             String?
  sessionId             String?

  createdAt             DateTime @default(now())

  @@index([tenantId])
  @@index([userId])
  @@index([action])
  @@index([resource])
  @@index([createdAt])
}

enum AuditAction {
  LOGIN
  LOGOUT
  LOGIN_FAILED
  PASSWORD_CHANGE
  PASSWORD_RESET
  EMAIL_VERIFIED
  TWO_FACTOR_ENABLED
  TWO_FACTOR_DISABLED
  PROFILE_UPDATED
  ROLE_CHANGED
  USER_CREATED
  USER_DELETED
  USER_SUSPENDED
  SESSION_REVOKED
  API_KEY_CREATED
  API_KEY_REVOKED
  PERMISSION_GRANTED
  PERMISSION_REVOKED
  IMPERSONATION_START
  IMPERSONATION_END
}

// Platform-level users (SaaS admins)
model PlatformUser {
  id                    String       @id @default(cuid())

  email                 String       @unique
  password              String
  firstName             String?
  lastName              String?

  role                  PlatformRole @default(PLATFORM_USER)

  twoFactorEnabled      Boolean      @default(false)
  twoFactorSecret       String?

  isActive              Boolean      @default(true)
  lastLoginAt           DateTime?

  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  @@index([email])
}

enum PlatformRole {
  PLATFORM_USER         // View only
  PLATFORM_SUPPORT      // Customer support
  PLATFORM_ADMIN        // Full admin access
  PLATFORM_SUPERUSER    // System owner
}
```

---

## 2. NextAuth.js Configuration

### 2.1 Auth Options

```typescript
// lib/auth/config.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import AppleProvider from 'next-auth/providers/apple';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // 24 hours
  },

  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login',
    verifyRequest: '/verify-email',
    newUser: '/welcome',
  },

  providers: [
    // Credentials provider
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        tenantId: { label: 'Tenant ID', type: 'hidden' },
        twoFactorCode: { label: '2FA Code', type: 'text' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const tenantId = req.headers?.['x-tenant-id'] as string || credentials.tenantId;

        if (!tenantId) {
          throw new Error('Tenant context required');
        }

        // Find user
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email.toLowerCase(),
            tenantId,
          },
          include: {
            tenant: true,
          },
        });

        if (!user) {
          await recordLoginAttempt(null, tenantId, credentials.email, false, 'User not found', req);
          throw new Error('Invalid email or password');
        }

        if (user.status !== 'ACTIVE') {
          await recordLoginAttempt(user.id, tenantId, credentials.email, false, 'Account not active', req);
          throw new Error('Account is not active');
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error('Account is temporarily locked. Try again later.');
        }

        if (!user.password) {
          throw new Error('Please use social login for this account');
        }

        // Verify password
        const isValidPassword = await compare(credentials.password, user.password);

        if (!isValidPassword) {
          await handleFailedLogin(user, tenantId, credentials.email, req);
          throw new Error('Invalid email or password');
        }

        // Check 2FA
        if (user.twoFactorEnabled) {
          if (!credentials.twoFactorCode) {
            throw new Error('TWO_FACTOR_REQUIRED');
          }

          const isValidCode = await verifyTwoFactorCode(user.id, credentials.twoFactorCode);
          if (!isValidCode) {
            throw new Error('Invalid 2FA code');
          }
        }

        // Reset failed attempts and update last login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
            lastLoginIp: getIpFromRequest(req),
          },
        });

        await recordLoginAttempt(user.id, tenantId, credentials.email, true, null, req);

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: user.tenant.slug,
          tenantName: user.tenant.name,
          avatarUrl: user.avatarUrl,
          twoFactorEnabled: user.twoFactorEnabled,
        };
      },
    }),

    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    // Facebook OAuth
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),

    // Apple OAuth
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth providers, link to existing user or create new
      if (account?.provider !== 'credentials') {
        // OAuth sign-in logic handled by adapter
        return true;
      }
      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug;
        token.tenantName = user.tenantName;
        token.avatarUrl = user.avatarUrl;
        token.twoFactorEnabled = user.twoFactorEnabled;
      }

      // Session update
      if (trigger === 'update' && session) {
        token.name = session.name ?? token.name;
        token.avatarUrl = session.avatarUrl ?? token.avatarUrl;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as UserRole;
        session.user.tenantId = token.tenantId as string;
        session.user.tenantSlug = token.tenantSlug as string;
        session.user.tenantName = token.tenantName as string;
        session.user.avatarUrl = token.avatarUrl as string | null;
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      await createAuditLog({
        userId: user.id as string,
        action: 'LOGIN',
        resource: 'USER',
        resourceId: user.id as string,
        description: `User signed in via ${account?.provider || 'credentials'}`,
        metadata: { provider: account?.provider, isNewUser },
      });
    },

    async signOut({ token }) {
      if (token?.id) {
        await createAuditLog({
          userId: token.id as string,
          action: 'LOGOUT',
          resource: 'USER',
          resourceId: token.id as string,
        });
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
};

// Helper functions
async function handleFailedLogin(user: any, tenantId: string, email: string, req: any) {
  const newAttempts = user.failedLoginAttempts + 1;
  let lockedUntil = null;

  // Lock account after 5 failed attempts
  if (newAttempts >= 5) {
    lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: newAttempts,
      lockedUntil,
    },
  });

  await recordLoginAttempt(user.id, tenantId, email, false, 'Invalid password', req);
}

async function recordLoginAttempt(
  userId: string | null,
  tenantId: string,
  email: string,
  success: boolean,
  failureReason: string | null,
  req: any
) {
  await prisma.loginAttempt.create({
    data: {
      userId,
      tenantId,
      email,
      ipAddress: getIpFromRequest(req),
      userAgent: req.headers?.['user-agent'],
      success,
      failureReason,
    },
  });
}

function getIpFromRequest(req: any): string {
  return req.headers?.['x-forwarded-for']?.split(',')[0] ||
         req.headers?.['x-real-ip'] ||
         req.socket?.remoteAddress ||
         'unknown';
}

async function verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
  const { authenticator } = await import('otplib');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true },
  });

  if (!user?.twoFactorSecret) return false;

  // Check TOTP code
  const isValidTotp = authenticator.verify({
    token: code,
    secret: user.twoFactorSecret,
  });

  if (isValidTotp) return true;

  // Check backup codes
  const backupCode = await prisma.backupCode.findFirst({
    where: {
      userId,
      used: false,
    },
  });

  if (backupCode) {
    const { compare } = await import('bcryptjs');
    const isValidBackup = await compare(code, backupCode.code);

    if (isValidBackup) {
      await prisma.backupCode.update({
        where: { id: backupCode.id },
        data: { used: true, usedAt: new Date() },
      });
      return true;
    }
  }

  return false;
}

async function createAuditLog(data: any) {
  await prisma.auditLog.create({ data });
}
```

### 2.2 Type Extensions

```typescript
// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      tenantId: string;
      tenantSlug: string;
      tenantName: string;
      avatarUrl: string | null;
      twoFactorEnabled: boolean;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    avatarUrl: string | null;
    twoFactorEnabled: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    avatarUrl: string | null;
    twoFactorEnabled: boolean;
  }
}
```

### 2.3 API Route

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

---

## 3. Role-Based Access Control

### 3.1 Role Hierarchy

```typescript
// lib/auth/permissions.ts
import { UserRole } from '@prisma/client';

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  GUEST: 0,
  MEMBER: 1,
  SMALL_GROUP_LEADER: 2,
  MINISTRY_LEADER: 3,
  CONTENT_MANAGER: 4,
  ADMIN: 5,
  SUPERUSER: 6,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  GUEST: 'Guest',
  MEMBER: 'Member',
  SMALL_GROUP_LEADER: 'Small Group Leader',
  MINISTRY_LEADER: 'Ministry Leader',
  CONTENT_MANAGER: 'Content Manager',
  ADMIN: 'Administrator',
  SUPERUSER: 'Super Administrator',
};

// Check if user role meets required role
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Check if user has any of the specified roles
export function hasAnyRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.some(role => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role]);
}
```

### 3.2 Permission System

```typescript
// lib/auth/permissions.ts (continued)

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage';

export interface Permission {
  resource: string;
  actions: PermissionAction[];
}

// Resource-based permissions per role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  GUEST: [
    { resource: 'sermons', actions: ['read'] },
    { resource: 'events', actions: ['read'] },
    { resource: 'pages', actions: ['read'] },
  ],

  MEMBER: [
    { resource: 'profile', actions: ['read', 'update'] },
    { resource: 'sermons', actions: ['read'] },
    { resource: 'events', actions: ['read'] },
    { resource: 'groups', actions: ['read'] },
    { resource: 'giving', actions: ['create', 'read'] },
    { resource: 'prayer_requests', actions: ['create', 'read'] },
    { resource: 'directory', actions: ['read'] },
  ],

  SMALL_GROUP_LEADER: [
    { resource: 'profile', actions: ['read', 'update'] },
    { resource: 'sermons', actions: ['read'] },
    { resource: 'events', actions: ['read', 'create'] },
    { resource: 'groups', actions: ['read', 'update', 'manage'] },
    { resource: 'group_members', actions: ['read', 'manage'] },
    { resource: 'giving', actions: ['create', 'read'] },
    { resource: 'prayer_requests', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'directory', actions: ['read'] },
  ],

  MINISTRY_LEADER: [
    { resource: 'profile', actions: ['read', 'update'] },
    { resource: 'sermons', actions: ['read', 'create', 'update'] },
    { resource: 'events', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'groups', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'ministries', actions: ['read', 'update', 'manage'] },
    { resource: 'volunteers', actions: ['read', 'manage'] },
    { resource: 'giving', actions: ['create', 'read'] },
    { resource: 'prayer_requests', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'directory', actions: ['read'] },
  ],

  CONTENT_MANAGER: [
    { resource: 'profile', actions: ['read', 'update'] },
    { resource: 'sermons', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'events', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'pages', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'media', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'groups', actions: ['read'] },
    { resource: 'giving', actions: ['create', 'read'] },
    { resource: 'directory', actions: ['read'] },
    { resource: 'cms', actions: ['read', 'update'] },
  ],

  ADMIN: [
    { resource: '*', actions: ['create', 'read', 'update', 'delete', 'manage'] },
  ],

  SUPERUSER: [
    { resource: '*', actions: ['create', 'read', 'update', 'delete', 'manage'] },
  ],
};

// Check if user has permission for action on resource
export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: PermissionAction
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];

  for (const permission of permissions) {
    // Wildcard permission
    if (permission.resource === '*' && permission.actions.includes(action)) {
      return true;
    }

    // Specific resource permission
    if (permission.resource === resource && permission.actions.includes(action)) {
      return true;
    }
  }

  return false;
}

// Get all permissions for a role
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
```

### 3.3 Authorization Middleware

```typescript
// lib/auth/middleware.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth/config';
import { UserRole } from '@prisma/client';
import { hasRole, hasPermission, PermissionAction } from './permissions';

// Server-side session helper
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

// Require authentication
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  return user;
}

// Require specific role
export async function requireRole(requiredRole: UserRole) {
  const user = await requireAuth();

  if (!hasRole(user.role as UserRole, requiredRole)) {
    throw new AuthorizationError('Insufficient permissions');
  }

  return user;
}

// Require permission on resource
export async function requirePermission(resource: string, action: PermissionAction) {
  const user = await requireAuth();

  if (!hasPermission(user.role as UserRole, resource, action)) {
    throw new AuthorizationError(`Permission denied: ${action} on ${resource}`);
  }

  return user;
}

// Ensure tenant access
export async function requireTenantAccess(tenantId: string) {
  const user = await requireAuth();

  if (user.tenantId !== tenantId && user.role !== 'SUPERUSER') {
    throw new AuthorizationError('No access to this tenant');
  }

  return user;
}

// API route wrapper with auth
export function withAuth(
  handler: (req: NextRequest, ctx: any, user: any) => Promise<NextResponse>,
  options?: {
    requiredRole?: UserRole;
    resource?: string;
    action?: PermissionAction;
  }
) {
  return async (req: NextRequest, ctx: any) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return NextResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
          { status: 401 }
        );
      }

      // Check role
      if (options?.requiredRole) {
        if (!hasRole(session.user.role as UserRole, options.requiredRole)) {
          return NextResponse.json(
            { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
            { status: 403 }
          );
        }
      }

      // Check resource permission
      if (options?.resource && options?.action) {
        if (!hasPermission(session.user.role as UserRole, options.resource, options.action)) {
          return NextResponse.json(
            { error: { code: 'FORBIDDEN', message: 'Permission denied' } },
            { status: 403 }
          );
        }
      }

      return handler(req, ctx, session.user);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Authentication failed' } },
        { status: 500 }
      );
    }
  };
}

// Custom error classes
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}
```

---

## 4. Password Management

### 4.1 Password Utilities

```typescript
// lib/auth/password.ts
import { hash, compare } from 'bcryptjs';
import { z } from 'zod';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

// Password strength validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .refine((pw) => /[a-z]/.test(pw), 'Password must contain a lowercase letter')
  .refine((pw) => /[A-Z]/.test(pw), 'Password must contain an uppercase letter')
  .refine((pw) => /[0-9]/.test(pw), 'Password must contain a number')
  .refine((pw) => /[^a-zA-Z0-9]/.test(pw), 'Password must contain a special character');

// Detailed password strength analysis
export function analyzePasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  // Length checks
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  if (password.length < 8) {
    feedback.push('Use at least 8 characters');
  }

  // Character type checks
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add uppercase letters');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add numbers');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add special characters');
  }

  // Common pattern checks
  const commonPatterns = [
    /^123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /(.)\1{2,}/, // Repeated characters
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common patterns');
  }

  return {
    score: Math.min(score, 7),
    feedback,
    isStrong: score >= 5 && feedback.length === 0,
  };
}
```

### 4.2 Password Reset Service

```typescript
// lib/auth/password-reset.ts
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashPassword } from './password';
import { sendEmail } from '@/lib/email';

const TOKEN_EXPIRY_HOURS = 1;

export async function initiatePasswordReset(
  email: string,
  tenantId: string
): Promise<{ success: boolean; message: string }> {
  // Find user
  const user = await prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
      tenantId,
    },
    include: {
      tenant: true,
    },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: true, message: 'If the email exists, a reset link has been sent' };
  }

  // Rate limiting check
  const recentAttempts = await prisma.passwordReset.count({
    where: {
      userId: user.id,
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000), // 1 hour
      },
    },
  });

  if (recentAttempts >= 3) {
    return { success: false, message: 'Too many reset attempts. Please try again later.' };
  }

  // Generate token
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // Send email
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: `Password Reset - ${user.tenant.name}`,
    template: 'password-reset',
    data: {
      userName: user.firstName || 'Member',
      churchName: user.tenant.name,
      resetUrl,
      expiryHours: TOKEN_EXPIRY_HOURS,
    },
  });

  return { success: true, message: 'If the email exists, a reset link has been sent' };
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  // Find valid token
  const resetToken = await prisma.passwordReset.findFirst({
    where: {
      token,
      expiresAt: { gt: new Date() },
      usedAt: null,
    },
    include: {
      user: true,
    },
  });

  if (!resetToken) {
    return { success: false, message: 'Invalid or expired reset link' };
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password and mark token as used
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    }),
    prisma.passwordReset.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate all sessions
    prisma.session.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);

  // Create audit log
  await prisma.auditLog.create({
    data: {
      tenantId: resetToken.user.tenantId,
      userId: resetToken.userId,
      action: 'PASSWORD_RESET',
      resource: 'USER',
      resourceId: resetToken.userId,
    },
  });

  return { success: true, message: 'Password has been reset successfully' };
}
```

---

## 5. Two-Factor Authentication

### 5.1 TOTP Service

```typescript
// lib/auth/two-factor.ts
import { authenticator } from 'otplib';
import { hash } from 'bcryptjs';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';

// Generate secret and QR code for setup
export async function setupTwoFactor(
  userId: string
): Promise<{
  secret: string;
  qrCode: string;
  backupCodes: string[];
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tenant: true },
  });

  if (!user) throw new Error('User not found');

  // Generate secret
  const secret = authenticator.generateSecret();

  // Generate QR code
  const otpauthUrl = authenticator.keyuri(
    user.email,
    user.tenant.name,
    secret
  );
  const qrCode = await QRCode.toDataURL(otpauthUrl);

  // Generate backup codes
  const backupCodes = await generateBackupCodes(userId);

  // Store secret (not enabled until verified)
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: secret,
      twoFactorEnabled: false,
    },
  });

  return {
    secret,
    qrCode,
    backupCodes,
  };
}

// Verify TOTP code and enable 2FA
export async function verifyAndEnableTwoFactor(
  userId: string,
  code: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, tenantId: true },
  });

  if (!user?.twoFactorSecret) {
    throw new Error('Two-factor setup not initiated');
  }

  const isValid = authenticator.verify({
    token: code,
    secret: user.twoFactorSecret,
  });

  if (!isValid) {
    return false;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId,
      userId,
      action: 'TWO_FACTOR_ENABLED',
      resource: 'USER',
      resourceId: userId,
    },
  });

  return true;
}

// Disable 2FA
export async function disableTwoFactor(
  userId: string,
  password: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, tenantId: true },
  });

  if (!user?.password) {
    throw new Error('Cannot disable 2FA for social login accounts');
  }

  // Verify password
  const { compare } = await import('bcryptjs');
  const isValidPassword = await compare(password, user.password);

  if (!isValidPassword) {
    return false;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    }),
    prisma.backupCode.deleteMany({
      where: { userId },
    }),
  ]);

  await prisma.auditLog.create({
    data: {
      tenantId: user.tenantId,
      userId,
      action: 'TWO_FACTOR_DISABLED',
      resource: 'USER',
      resourceId: userId,
    },
  });

  return true;
}

// Generate backup codes
async function generateBackupCodes(userId: string): Promise<string[]> {
  const codes: string[] = [];
  const hashedCodes: string[] = [];

  // Generate 10 backup codes
  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    codes.push(code);
    hashedCodes.push(await hash(code, 10));
  }

  // Delete old codes and create new ones
  await prisma.$transaction([
    prisma.backupCode.deleteMany({
      where: { userId },
    }),
    prisma.backupCode.createMany({
      data: hashedCodes.map(code => ({
        userId,
        code,
        used: false,
      })),
    }),
  ]);

  return codes;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

// Regenerate backup codes
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  return generateBackupCodes(userId);
}
```

---

## 6. Session Management

### 6.1 Session Service

```typescript
// lib/auth/sessions.ts
import { prisma } from '@/lib/prisma';

// Get active sessions for user
export async function getUserSessions(userId: string) {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActiveAt: 'desc' },
    select: {
      id: true,
      deviceType: true,
      deviceName: true,
      ipAddress: true,
      country: true,
      city: true,
      lastActiveAt: true,
      createdAt: true,
    },
  });

  return sessions;
}

// Revoke specific session
export async function revokeSession(
  sessionId: string,
  userId: string
): Promise<boolean> {
  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: {
      user: {
        select: { tenantId: true },
      },
    },
  });

  if (!session) return false;

  await prisma.session.delete({
    where: { id: sessionId },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      userId,
      action: 'SESSION_REVOKED',
      resource: 'SESSION',
      resourceId: sessionId,
      metadata: {
        deviceType: session.deviceType,
        ipAddress: session.ipAddress,
      },
    },
  });

  return true;
}

// Revoke all sessions except current
export async function revokeAllOtherSessions(
  userId: string,
  currentSessionId?: string
): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      userId,
      ...(currentSessionId && { id: { not: currentSessionId } }),
    },
  });

  return result.count;
}

// Update session activity
export async function updateSessionActivity(sessionToken: string) {
  await prisma.session.update({
    where: { sessionToken },
    data: { lastActiveAt: new Date() },
  });
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return result.count;
}
```

---

## 7. Rate Limiting

### 7.1 Rate Limiter

```typescript
// lib/auth/rate-limit.ts
import { prisma } from '@/lib/prisma';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxAttempts: number;   // Max attempts in window
  blockDuration?: number; // Block duration in ms after exceeding limit
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxAttempts: 5,
    blockDuration: 15 * 60 * 1000,
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxAttempts: 3,
  },
  emailVerification: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxAttempts: 5,
  },
  api: {
    windowMs: 60 * 1000,       // 1 minute
    maxAttempts: 100,
  },
};

export async function checkRateLimit(
  key: string,
  type: keyof typeof RATE_LIMITS
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const config = RATE_LIMITS[type];
  const redisKey = `ratelimit:${type}:${key}`;

  const current = await redis.incr(redisKey);

  if (current === 1) {
    await redis.pexpire(redisKey, config.windowMs);
  }

  const ttl = await redis.pttl(redisKey);
  const resetAt = new Date(Date.now() + ttl);

  return {
    allowed: current <= config.maxAttempts,
    remaining: Math.max(0, config.maxAttempts - current),
    resetAt,
  };
}

export async function isBlocked(key: string, type: string): Promise<boolean> {
  const blockKey = `blocked:${type}:${key}`;
  const blocked = await redis.get(blockKey);
  return blocked !== null;
}

export async function blockKey(key: string, type: keyof typeof RATE_LIMITS): Promise<void> {
  const config = RATE_LIMITS[type];
  if (config.blockDuration) {
    const blockKey = `blocked:${type}:${key}`;
    await redis.set(blockKey, '1', 'PX', config.blockDuration);
  }
}
```

---

## 8. Audit Logging

### 8.1 Audit Service

```typescript
// lib/auth/audit.ts
import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';

interface AuditLogInput {
  tenantId?: string;
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  description?: string;
  metadata?: Record<string, any>;
  previousValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      description: input.description,
      metadata: input.metadata ?? undefined,
      previousValue: input.previousValue ?? undefined,
      newValue: input.newValue ?? undefined,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      sessionId: input.sessionId,
    },
  });
}

// Get audit logs with filtering
export async function getAuditLogs(options: {
  tenantId: string;
  userId?: string;
  action?: AuditAction;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const {
    tenantId,
    userId,
    action,
    resource,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = options;

  const where: any = { tenantId };

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (resource) where.resource = resource;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

---

## 9. Email Verification

### 9.1 Verification Service

```typescript
// lib/auth/email-verification.ts
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const TOKEN_EXPIRY_HOURS = 24;

export async function sendVerificationEmail(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tenant: true },
  });

  if (!user) throw new Error('User not found');
  if (user.emailVerified) throw new Error('Email already verified');

  // Generate token
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      userId,
      token,
      type: 'EMAIL',
      expiresAt,
    },
  });

  // Send email
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: `Verify your email - ${user.tenant.name}`,
    template: 'email-verification',
    data: {
      userName: user.firstName || 'Member',
      churchName: user.tenant.name,
      verifyUrl,
      expiryHours: TOKEN_EXPIRY_HOURS,
    },
  });
}

export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  const verification = await prisma.verificationToken.findFirst({
    where: {
      token,
      type: 'EMAIL',
      expiresAt: { gt: new Date() },
      verified: false,
    },
    include: {
      user: true,
    },
  });

  if (!verification) {
    return { success: false, message: 'Invalid or expired verification link' };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: {
        emailVerified: new Date(),
        status: 'ACTIVE',
      },
    }),
    prisma.verificationToken.update({
      where: { id: verification.id },
      data: { verified: true },
    }),
  ]);

  await prisma.auditLog.create({
    data: {
      tenantId: verification.user.tenantId,
      userId: verification.userId,
      action: 'EMAIL_VERIFIED',
      resource: 'USER',
      resourceId: verification.userId,
    },
  });

  return { success: true, message: 'Email verified successfully' };
}
```

---

## 10. Client-Side Auth Hook

### 10.1 useAuth Hook

```typescript
// hooks/useAuth.ts
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { UserRole } from '@prisma/client';
import { hasRole, hasPermission, PermissionAction } from '@/lib/auth/permissions';

export function useAuth() {
  const { data: session, status, update } = useSession();

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  const user = session?.user ?? null;

  const checkRole = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    return hasRole(user.role as UserRole, requiredRole);
  };

  const checkPermission = (resource: string, action: PermissionAction): boolean => {
    if (!user) return false;
    return hasPermission(user.role as UserRole, resource, action);
  };

  const login = async (
    email: string,
    password: string,
    options?: {
      twoFactorCode?: string;
      callbackUrl?: string;
    }
  ) => {
    return signIn('credentials', {
      email,
      password,
      twoFactorCode: options?.twoFactorCode,
      redirect: false,
      callbackUrl: options?.callbackUrl,
    });
  };

  const loginWithGoogle = async (callbackUrl?: string) => {
    return signIn('google', { callbackUrl });
  };

  const loginWithFacebook = async (callbackUrl?: string) => {
    return signIn('facebook', { callbackUrl });
  };

  const logout = async (callbackUrl?: string) => {
    return signOut({ callbackUrl: callbackUrl || '/login' });
  };

  const updateProfile = async (data: { name?: string; avatarUrl?: string }) => {
    await update(data);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    checkRole,
    checkPermission,
    login,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    updateProfile,

    // Convenience role checks
    isAdmin: user ? hasRole(user.role as UserRole, 'ADMIN') : false,
    isSuperuser: user?.role === 'SUPERUSER',
    isContentManager: user ? hasRole(user.role as UserRole, 'CONTENT_MANAGER') : false,
    isMember: user ? hasRole(user.role as UserRole, 'MEMBER') : false,

    // Tenant info
    tenantId: user?.tenantId,
    tenantSlug: user?.tenantSlug,
    tenantName: user?.tenantName,
  };
}
```

---

## 11. Security Headers

### 11.1 Next.js Security Configuration

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: blob: https: http:;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://api.stripe.com https://*.digitalchurch.com;
      frame-src 'self' https://js.stripe.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\n/g, ''),
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## 12. Platform Admin Authentication

Platform administrators (SaaS operators) have a separate authentication flow from tenant users to ensure clear separation of concerns and security boundaries.

### 12.1 Platform vs Tenant Authentication

```typescript
// lib/auth/platform-auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { PlatformRole } from '@prisma/client';

// Separate NextAuth configuration for Platform Admin
export const platformAuthOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours (shorter for platform admins)
    updateAge: 60 * 60,   // 1 hour
  },

  pages: {
    signIn: '/platform/login',
    error: '/platform/login',
  },

  providers: [
    CredentialsProvider({
      id: 'platform-credentials',
      name: 'Platform Admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        twoFactorCode: { label: '2FA Code', type: 'text' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const platformUser = await prisma.platformUser.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!platformUser || !platformUser.isActive) {
          throw new Error('Invalid credentials');
        }

        const isValidPassword = await compare(credentials.password, platformUser.password);
        if (!isValidPassword) {
          throw new Error('Invalid credentials');
        }

        // Check 2FA if enabled
        if (platformUser.twoFactorEnabled) {
          if (!credentials.twoFactorCode) {
            throw new Error('TWO_FACTOR_REQUIRED');
          }
          const isValidCode = await verifyPlatformTwoFactor(
            platformUser.id,
            credentials.twoFactorCode
          );
          if (!isValidCode) {
            throw new Error('Invalid 2FA code');
          }
        }

        // Update last login
        await prisma.platformUser.update({
          where: { id: platformUser.id },
          data: { lastLoginAt: new Date() },
        });

        // Create platform audit log
        await createPlatformAuditLog({
          platformUserId: platformUser.id,
          action: 'PLATFORM_LOGIN',
          resource: 'PLATFORM_USER',
          resourceId: platformUser.id,
          ipAddress: getIpFromRequest(req),
        });

        return {
          id: platformUser.id,
          email: platformUser.email,
          name: `${platformUser.firstName || ''} ${platformUser.lastName || ''}`.trim(),
          role: platformUser.role,
          isPlatformUser: true, // Critical flag for distinguishing platform users
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.isPlatformUser = user.isPlatformUser;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as PlatformRole;
        session.user.isPlatformUser = token.isPlatformUser as boolean;
      }
      return session;
    },
  },
};

// Type extensions for platform auth
declare module 'next-auth' {
  interface User {
    isPlatformUser?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    isPlatformUser?: boolean;
  }
}
```

### 12.2 Platform Auth Middleware

```typescript
// lib/auth/platform-middleware.ts
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { platformAuthOptions } from './platform-auth';
import { PlatformRole } from '@prisma/client';

const PLATFORM_ROLE_HIERARCHY: Record<PlatformRole, number> = {
  PLATFORM_USER: 0,
  PLATFORM_SUPPORT: 1,
  PLATFORM_ADMIN: 2,
  PLATFORM_SUPERUSER: 3,
};

export async function requirePlatformAuth() {
  const session = await getServerSession(platformAuthOptions);

  if (!session?.user?.isPlatformUser) {
    throw new Error('Platform authentication required');
  }

  return session.user;
}

export async function requirePlatformRole(requiredRole: PlatformRole) {
  const user = await requirePlatformAuth();

  if (PLATFORM_ROLE_HIERARCHY[user.role as PlatformRole] < PLATFORM_ROLE_HIERARCHY[requiredRole]) {
    throw new Error('Insufficient platform permissions');
  }

  return user;
}

// API route wrapper for platform endpoints
export function withPlatformAuth(
  handler: (req: NextRequest, ctx: any, user: any) => Promise<NextResponse>,
  options?: { requiredRole?: PlatformRole }
) {
  return async (req: NextRequest, ctx: any) => {
    try {
      const session = await getServerSession(platformAuthOptions);

      if (!session?.user?.isPlatformUser) {
        return NextResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Platform authentication required' } },
          { status: 401 }
        );
      }

      if (options?.requiredRole) {
        const userLevel = PLATFORM_ROLE_HIERARCHY[session.user.role as PlatformRole];
        const requiredLevel = PLATFORM_ROLE_HIERARCHY[options.requiredRole];

        if (userLevel < requiredLevel) {
          return NextResponse.json(
            { error: { code: 'FORBIDDEN', message: 'Insufficient platform permissions' } },
            { status: 403 }
          );
        }
      }

      return handler(req, ctx, session.user);
    } catch (error) {
      console.error('Platform auth middleware error:', error);
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Authentication failed' } },
        { status: 500 }
      );
    }
  };
}
```

### 12.3 Session Type Detection

```typescript
// lib/auth/session-utils.ts
import { getServerSession } from 'next-auth/next';
import { authOptions } from './config';
import { platformAuthOptions } from './platform-auth';

export type SessionType = 'tenant' | 'platform' | null;

export async function detectSessionType(): Promise<SessionType> {
  // Check platform session first (more restricted)
  const platformSession = await getServerSession(platformAuthOptions);
  if (platformSession?.user?.isPlatformUser) {
    return 'platform';
  }

  // Check tenant session
  const tenantSession = await getServerSession(authOptions);
  if (tenantSession?.user) {
    return 'tenant';
  }

  return null;
}

export async function getCurrentSession() {
  const sessionType = await detectSessionType();

  if (sessionType === 'platform') {
    return {
      type: 'platform' as const,
      session: await getServerSession(platformAuthOptions),
    };
  }

  if (sessionType === 'tenant') {
    return {
      type: 'tenant' as const,
      session: await getServerSession(authOptions),
    };
  }

  return { type: null, session: null };
}
```

---

## 13. Impersonation (User Delegation)

Platform Support staff can impersonate tenant users for troubleshooting and customer support purposes. This feature includes comprehensive audit logging and session tracking.

### 13.1 Impersonation Service

```typescript
// lib/auth/impersonation.ts
import { prisma } from '@/lib/prisma';
import { createAuditLog } from './audit';
import { PlatformRole } from '@prisma/client';

// Allowed platform roles for impersonation
const IMPERSONATION_ALLOWED_ROLES: PlatformRole[] = [
  'PLATFORM_SUPPORT',
  'PLATFORM_ADMIN',
  'PLATFORM_SUPERUSER',
];

export interface ImpersonationSession {
  id: string;
  platformUserId: string;
  impersonatedUserId: string;
  impersonatedTenantId: string;
  reason: string;
  startedAt: Date;
  endedAt: Date | null;
  ipAddress: string;
  userAgent: string;
}

// Start impersonation session
export async function startImpersonation(
  platformUserId: string,
  platformUserRole: PlatformRole,
  targetUserId: string,
  reason: string,
  context: { ipAddress: string; userAgent: string }
): Promise<{
  success: boolean;
  impersonationToken?: string;
  targetUser?: any;
  error?: string;
}> {
  // Validate platform user has permission
  if (!IMPERSONATION_ALLOWED_ROLES.includes(platformUserRole)) {
    return {
      success: false,
      error: 'Insufficient permissions for impersonation',
    };
  }

  // Reason is required for audit purposes
  if (!reason || reason.trim().length < 10) {
    return {
      success: false,
      error: 'A detailed reason (minimum 10 characters) is required for impersonation',
    };
  }

  // Find target user
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      tenant: true,
    },
  });

  if (!targetUser) {
    return { success: false, error: 'Target user not found' };
  }

  // Cannot impersonate SUPERUSER
  if (targetUser.role === 'SUPERUSER') {
    return {
      success: false,
      error: 'Cannot impersonate superuser accounts',
    };
  }

  // Create impersonation session
  const impersonationSession = await prisma.impersonationSession.create({
    data: {
      platformUserId,
      impersonatedUserId: targetUserId,
      impersonatedTenantId: targetUser.tenantId,
      reason: reason.trim(),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    },
  });

  // Generate impersonation token (short-lived)
  const impersonationToken = generateImpersonationToken(impersonationSession.id);

  // Create audit log for target tenant
  await createAuditLog({
    tenantId: targetUser.tenantId,
    userId: targetUserId,
    action: 'IMPERSONATION_START',
    resource: 'USER',
    resourceId: targetUserId,
    description: `Platform support started impersonation`,
    metadata: {
      impersonationSessionId: impersonationSession.id,
      platformUserId,
      reason: reason.trim(),
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  // Create platform audit log
  await createPlatformAuditLog({
    platformUserId,
    action: 'IMPERSONATION_START',
    resource: 'USER',
    resourceId: targetUserId,
    metadata: {
      impersonationSessionId: impersonationSession.id,
      targetUserId,
      targetTenantId: targetUser.tenantId,
      targetEmail: targetUser.email,
      reason: reason.trim(),
    },
    ipAddress: context.ipAddress,
  });

  return {
    success: true,
    impersonationToken,
    targetUser: {
      id: targetUser.id,
      email: targetUser.email,
      name: `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim(),
      role: targetUser.role,
      tenantId: targetUser.tenantId,
      tenantName: targetUser.tenant.name,
      tenantSlug: targetUser.tenant.slug,
    },
  };
}

// End impersonation session
export async function endImpersonation(
  impersonationSessionId: string,
  platformUserId: string,
  context: { ipAddress: string; userAgent: string }
): Promise<{ success: boolean; error?: string }> {
  const session = await prisma.impersonationSession.findFirst({
    where: {
      id: impersonationSessionId,
      platformUserId,
      endedAt: null,
    },
    include: {
      impersonatedUser: {
        include: { tenant: true },
      },
    },
  });

  if (!session) {
    return { success: false, error: 'Impersonation session not found or already ended' };
  }

  // End the session
  await prisma.impersonationSession.update({
    where: { id: impersonationSessionId },
    data: { endedAt: new Date() },
  });

  // Create audit logs
  await createAuditLog({
    tenantId: session.impersonatedTenantId,
    userId: session.impersonatedUserId,
    action: 'IMPERSONATION_END',
    resource: 'USER',
    resourceId: session.impersonatedUserId,
    description: 'Platform support ended impersonation',
    metadata: {
      impersonationSessionId,
      platformUserId,
      duration: Date.now() - session.startedAt.getTime(),
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  await createPlatformAuditLog({
    platformUserId,
    action: 'IMPERSONATION_END',
    resource: 'USER',
    resourceId: session.impersonatedUserId,
    metadata: {
      impersonationSessionId,
      targetUserId: session.impersonatedUserId,
      targetTenantId: session.impersonatedTenantId,
      duration: Date.now() - session.startedAt.getTime(),
    },
    ipAddress: context.ipAddress,
  });

  return { success: true };
}

// Get active impersonation session
export async function getActiveImpersonation(
  platformUserId: string
): Promise<ImpersonationSession | null> {
  return prisma.impersonationSession.findFirst({
    where: {
      platformUserId,
      endedAt: null,
    },
  });
}

// Token generation helpers
function generateImpersonationToken(sessionId: string): string {
  const { sign } = require('jsonwebtoken');
  return sign(
    { sessionId, type: 'impersonation' },
    process.env.IMPERSONATION_SECRET!,
    { expiresIn: '4h' } // Short-lived token
  );
}

export function verifyImpersonationToken(token: string): { sessionId: string } | null {
  try {
    const { verify } = require('jsonwebtoken');
    const decoded = verify(token, process.env.IMPERSONATION_SECRET!) as {
      sessionId: string;
      type: string;
    };
    if (decoded.type !== 'impersonation') return null;
    return { sessionId: decoded.sessionId };
  } catch {
    return null;
  }
}
```

### 13.2 Impersonation Schema Addition

```prisma
// prisma/schema.prisma - Add to existing schema

model ImpersonationSession {
  id                    String    @id @default(uuid())

  platformUserId        String    @map("platform_user_id")
  platformUser          PlatformUser @relation(fields: [platformUserId], references: [id])

  impersonatedUserId    String    @map("impersonated_user_id")
  impersonatedUser      User      @relation(fields: [impersonatedUserId], references: [id])

  impersonatedTenantId  String    @map("impersonated_tenant_id")
  impersonatedTenant    Tenant    @relation(fields: [impersonatedTenantId], references: [id])

  reason                String    @db.Text

  startedAt             DateTime  @default(now()) @map("started_at")
  endedAt               DateTime? @map("ended_at")

  ipAddress             String    @map("ip_address")
  userAgent             String    @map("user_agent")

  @@index([platformUserId])
  @@index([impersonatedUserId])
  @@index([impersonatedTenantId])
  @@index([startedAt])
  @@map("impersonation_sessions")
}

// Add relation to PlatformUser
model PlatformUser {
  // ... existing fields ...
  impersonationSessions ImpersonationSession[]
}

// Add relation to User
model User {
  // ... existing fields ...
  impersonationSessions ImpersonationSession[]
}

// Add relation to Tenant
model Tenant {
  // ... existing fields ...
  impersonationSessions ImpersonationSession[]
}
```

### 13.3 Impersonation API Endpoints

```typescript
// app/api/platform/impersonate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withPlatformAuth } from '@/lib/auth/platform-middleware';
import { startImpersonation, endImpersonation } from '@/lib/auth/impersonation';
import { z } from 'zod';

const startImpersonationSchema = z.object({
  targetUserId: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

// POST /api/platform/impersonate - Start impersonation
export const POST = withPlatformAuth(
  async (req: NextRequest, ctx, user) => {
    try {
      const body = await req.json();
      const { targetUserId, reason } = startImpersonationSchema.parse(body);

      const result = await startImpersonation(
        user.id,
        user.role,
        targetUserId,
        reason,
        {
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
        }
      );

      if (!result.success) {
        return NextResponse.json(
          { error: { code: 'IMPERSONATION_FAILED', message: result.error } },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        impersonationToken: result.impersonationToken,
        targetUser: result.targetUser,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', details: error.errors } },
          { status: 400 }
        );
      }
      throw error;
    }
  },
  { requiredRole: 'PLATFORM_SUPPORT' }
);

// DELETE /api/platform/impersonate - End impersonation
export const DELETE = withPlatformAuth(
  async (req: NextRequest, ctx, user) => {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: { code: 'MISSING_SESSION_ID', message: 'Session ID required' } },
        { status: 400 }
      );
    }

    const result = await endImpersonation(sessionId, user.id, {
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'END_IMPERSONATION_FAILED', message: result.error } },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  },
  { requiredRole: 'PLATFORM_SUPPORT' }
);
```

### 13.4 Impersonation Banner Component

```typescript
// components/admin/ImpersonationBanner.tsx
'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ImpersonationInfo {
  isImpersonating: boolean;
  targetUser?: {
    email: string;
    name: string;
    tenantName: string;
  };
  startedAt?: Date;
  sessionId?: string;
}

export function ImpersonationBanner() {
  const [info, setInfo] = useState<ImpersonationInfo | null>(null);

  useEffect(() => {
    // Check for impersonation session
    const impersonationToken = sessionStorage.getItem('impersonationToken');
    if (impersonationToken) {
      fetchImpersonationInfo(impersonationToken).then(setInfo);
    }
  }, []);

  const handleEndImpersonation = async () => {
    if (!info?.sessionId) return;

    await fetch(`/api/platform/impersonate?sessionId=${info.sessionId}`, {
      method: 'DELETE',
    });

    sessionStorage.removeItem('impersonationToken');
    window.location.href = '/platform/dashboard';
  };

  if (!info?.isImpersonating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 py-2 px-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">
            Impersonating: {info.targetUser?.name} ({info.targetUser?.email})
          </span>
          <span className="text-amber-800">
            • {info.targetUser?.tenantName}
          </span>
        </div>
        <button
          onClick={handleEndImpersonation}
          className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 px-3 py-1 rounded text-sm font-medium"
        >
          <X className="h-4 w-4" />
          End Impersonation
        </button>
      </div>
    </div>
  );
}

async function fetchImpersonationInfo(token: string): Promise<ImpersonationInfo> {
  const response = await fetch('/api/platform/impersonate/info', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}
```

---

## 14. API Key Management

API keys allow external integrations and third-party applications to access tenant data with specific, limited scopes.

### 14.1 API Key Scopes

```typescript
// lib/auth/api-keys.ts

// Comprehensive API Key scope definitions
export enum ApiKeyScope {
  // Member scopes
  MEMBERS_READ = 'members:read',
  MEMBERS_WRITE = 'members:write',
  MEMBERS_DELETE = 'members:delete',

  // Donation scopes
  DONATIONS_READ = 'donations:read',
  DONATIONS_WRITE = 'donations:write',
  DONATIONS_EXPORT = 'donations:export',

  // Event scopes
  EVENTS_READ = 'events:read',
  EVENTS_WRITE = 'events:write',
  EVENTS_DELETE = 'events:delete',

  // Sermon scopes
  SERMONS_READ = 'sermons:read',
  SERMONS_WRITE = 'sermons:write',
  SERMONS_DELETE = 'sermons:delete',

  // Group scopes
  GROUPS_READ = 'groups:read',
  GROUPS_WRITE = 'groups:write',
  GROUPS_DELETE = 'groups:delete',
  GROUP_MEMBERS_MANAGE = 'group_members:manage',

  // Ministry scopes
  MINISTRIES_READ = 'ministries:read',
  MINISTRIES_WRITE = 'ministries:write',

  // Communication scopes
  COMMUNICATIONS_READ = 'communications:read',
  COMMUNICATIONS_SEND = 'communications:send',
  COMMUNICATIONS_SCHEDULE = 'communications:schedule',

  // Media scopes
  MEDIA_READ = 'media:read',
  MEDIA_UPLOAD = 'media:upload',
  MEDIA_DELETE = 'media:delete',

  // Analytics scopes
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_EXPORT = 'analytics:export',

  // Webhook scopes
  WEBHOOKS_READ = 'webhooks:read',
  WEBHOOKS_MANAGE = 'webhooks:manage',

  // Settings scopes (admin only)
  SETTINGS_READ = 'settings:read',
  SETTINGS_WRITE = 'settings:write',
}

// Scope groupings for easier management
export const API_KEY_SCOPE_GROUPS = {
  // Read-only access to all data
  READONLY: [
    ApiKeyScope.MEMBERS_READ,
    ApiKeyScope.DONATIONS_READ,
    ApiKeyScope.EVENTS_READ,
    ApiKeyScope.SERMONS_READ,
    ApiKeyScope.GROUPS_READ,
    ApiKeyScope.MINISTRIES_READ,
    ApiKeyScope.COMMUNICATIONS_READ,
    ApiKeyScope.MEDIA_READ,
    ApiKeyScope.ANALYTICS_READ,
  ],

  // Full member management
  MEMBER_MANAGEMENT: [
    ApiKeyScope.MEMBERS_READ,
    ApiKeyScope.MEMBERS_WRITE,
    ApiKeyScope.MEMBERS_DELETE,
    ApiKeyScope.GROUPS_READ,
    ApiKeyScope.GROUP_MEMBERS_MANAGE,
  ],

  // Giving/donation integration
  GIVING_INTEGRATION: [
    ApiKeyScope.DONATIONS_READ,
    ApiKeyScope.DONATIONS_WRITE,
    ApiKeyScope.DONATIONS_EXPORT,
    ApiKeyScope.MEMBERS_READ,
  ],

  // Event management
  EVENT_MANAGEMENT: [
    ApiKeyScope.EVENTS_READ,
    ApiKeyScope.EVENTS_WRITE,
    ApiKeyScope.EVENTS_DELETE,
    ApiKeyScope.COMMUNICATIONS_SEND,
  ],

  // Content management
  CONTENT_MANAGEMENT: [
    ApiKeyScope.SERMONS_READ,
    ApiKeyScope.SERMONS_WRITE,
    ApiKeyScope.SERMONS_DELETE,
    ApiKeyScope.MEDIA_READ,
    ApiKeyScope.MEDIA_UPLOAD,
    ApiKeyScope.MEDIA_DELETE,
  ],

  // Full admin access (use sparingly)
  ADMIN_FULL: Object.values(ApiKeyScope),
} as const;

// Scope descriptions for UI
export const API_KEY_SCOPE_DESCRIPTIONS: Record<ApiKeyScope, string> = {
  [ApiKeyScope.MEMBERS_READ]: 'Read member profiles and directory data',
  [ApiKeyScope.MEMBERS_WRITE]: 'Create and update member profiles',
  [ApiKeyScope.MEMBERS_DELETE]: 'Delete member profiles',
  [ApiKeyScope.DONATIONS_READ]: 'View donation records and history',
  [ApiKeyScope.DONATIONS_WRITE]: 'Record new donations',
  [ApiKeyScope.DONATIONS_EXPORT]: 'Export donation data for reporting',
  [ApiKeyScope.EVENTS_READ]: 'View events and registrations',
  [ApiKeyScope.EVENTS_WRITE]: 'Create and update events',
  [ApiKeyScope.EVENTS_DELETE]: 'Delete events',
  [ApiKeyScope.SERMONS_READ]: 'View sermons and series',
  [ApiKeyScope.SERMONS_WRITE]: 'Create and update sermons',
  [ApiKeyScope.SERMONS_DELETE]: 'Delete sermons',
  [ApiKeyScope.GROUPS_READ]: 'View small groups and membership',
  [ApiKeyScope.GROUPS_WRITE]: 'Create and update groups',
  [ApiKeyScope.GROUPS_DELETE]: 'Delete groups',
  [ApiKeyScope.GROUP_MEMBERS_MANAGE]: 'Add/remove group members',
  [ApiKeyScope.MINISTRIES_READ]: 'View ministries and volunteers',
  [ApiKeyScope.MINISTRIES_WRITE]: 'Create and update ministries',
  [ApiKeyScope.COMMUNICATIONS_READ]: 'View communication history',
  [ApiKeyScope.COMMUNICATIONS_SEND]: 'Send emails and notifications',
  [ApiKeyScope.COMMUNICATIONS_SCHEDULE]: 'Schedule communications',
  [ApiKeyScope.MEDIA_READ]: 'View media library',
  [ApiKeyScope.MEDIA_UPLOAD]: 'Upload media files',
  [ApiKeyScope.MEDIA_DELETE]: 'Delete media files',
  [ApiKeyScope.ANALYTICS_READ]: 'View analytics and reports',
  [ApiKeyScope.ANALYTICS_EXPORT]: 'Export analytics data',
  [ApiKeyScope.WEBHOOKS_READ]: 'View webhook configurations',
  [ApiKeyScope.WEBHOOKS_MANAGE]: 'Create and manage webhooks',
  [ApiKeyScope.SETTINGS_READ]: 'View tenant settings',
  [ApiKeyScope.SETTINGS_WRITE]: 'Modify tenant settings',
};
```

### 14.2 API Key Schema

```prisma
// prisma/schema.prisma - API Key model

model ApiKey {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  tenant          Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  name            String
  description     String?

  // Key storage (only prefix stored, full key shown once on creation)
  keyPrefix       String    @unique @map("key_prefix") // First 8 chars for identification
  keyHash         String    @map("key_hash") // SHA-256 hash of full key

  // Scopes as JSON array of ApiKeyScope values
  scopes          Json      @default("[]")

  // Restrictions
  allowedIps      String[]  @map("allowed_ips") // IP whitelist (empty = all allowed)
  allowedOrigins  String[]  @map("allowed_origins") // CORS origins
  rateLimit       Int       @default(1000) @map("rate_limit") // Requests per hour

  // Status
  isActive        Boolean   @default(true) @map("is_active")
  expiresAt       DateTime? @map("expires_at")

  // Usage tracking
  lastUsedAt      DateTime? @map("last_used_at")
  usageCount      Int       @default(0) @map("usage_count")

  // Audit
  createdById     String    @map("created_by_id")
  createdBy       User      @relation(fields: [createdById], references: [id])
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  revokedAt       DateTime? @map("revoked_at")
  revokedById     String?   @map("revoked_by_id")

  @@index([tenantId])
  @@index([keyPrefix])
  @@index([isActive])
  @@map("api_keys")
}
```

### 14.3 API Key Service

```typescript
// lib/auth/api-key-service.ts
import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { ApiKeyScope } from './api-keys';
import { createAuditLog } from './audit';

const API_KEY_PREFIX = 'dc_'; // Digital Church prefix
const KEY_LENGTH = 32;

interface CreateApiKeyInput {
  tenantId: string;
  createdById: string;
  name: string;
  description?: string;
  scopes: ApiKeyScope[];
  allowedIps?: string[];
  allowedOrigins?: string[];
  rateLimit?: number;
  expiresAt?: Date;
}

interface CreateApiKeyResult {
  id: string;
  key: string; // Full key (only returned on creation)
  keyPrefix: string;
  name: string;
  scopes: ApiKeyScope[];
  createdAt: Date;
}

// Create new API key
export async function createApiKey(
  input: CreateApiKeyInput
): Promise<CreateApiKeyResult> {
  // Generate random key
  const keyBytes = randomBytes(KEY_LENGTH);
  const fullKey = `${API_KEY_PREFIX}${keyBytes.toString('hex')}`;
  const keyPrefix = fullKey.substring(0, 12); // dc_ + first 8 hex chars
  const keyHash = createHash('sha256').update(fullKey).digest('hex');

  // Validate scopes
  const validScopes = input.scopes.filter(scope =>
    Object.values(ApiKeyScope).includes(scope)
  );

  if (validScopes.length === 0) {
    throw new Error('At least one valid scope is required');
  }

  const apiKey = await prisma.apiKey.create({
    data: {
      tenantId: input.tenantId,
      createdById: input.createdById,
      name: input.name,
      description: input.description,
      keyPrefix,
      keyHash,
      scopes: validScopes,
      allowedIps: input.allowedIps || [],
      allowedOrigins: input.allowedOrigins || [],
      rateLimit: input.rateLimit || 1000,
      expiresAt: input.expiresAt,
    },
  });

  // Create audit log
  await createAuditLog({
    tenantId: input.tenantId,
    userId: input.createdById,
    action: 'API_KEY_CREATED',
    resource: 'API_KEY',
    resourceId: apiKey.id,
    description: `API key "${input.name}" created`,
    metadata: {
      keyPrefix,
      scopes: validScopes,
      rateLimit: input.rateLimit,
    },
  });

  return {
    id: apiKey.id,
    key: fullKey, // Return full key only on creation
    keyPrefix,
    name: apiKey.name,
    scopes: validScopes,
    createdAt: apiKey.createdAt,
  };
}

// Validate API key and get associated data
export async function validateApiKey(
  key: string,
  context: { ipAddress: string; origin?: string }
): Promise<{
  valid: boolean;
  apiKey?: any;
  error?: string;
}> {
  if (!key.startsWith(API_KEY_PREFIX)) {
    return { valid: false, error: 'Invalid key format' };
  }

  const keyHash = createHash('sha256').update(key).digest('hex');
  const keyPrefix = key.substring(0, 12);

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      keyPrefix,
      keyHash,
      isActive: true,
      revokedAt: null,
    },
    include: {
      tenant: true,
    },
  });

  if (!apiKey) {
    return { valid: false, error: 'Invalid or revoked API key' };
  }

  // Check expiration
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // Check IP whitelist
  if (apiKey.allowedIps.length > 0) {
    if (!apiKey.allowedIps.includes(context.ipAddress)) {
      return { valid: false, error: 'IP address not allowed' };
    }
  }

  // Check origin whitelist
  if (apiKey.allowedOrigins.length > 0 && context.origin) {
    if (!apiKey.allowedOrigins.includes(context.origin)) {
      return { valid: false, error: 'Origin not allowed' };
    }
  }

  // Update usage statistics
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 },
    },
  });

  return { valid: true, apiKey };
}

// Check if API key has required scope
export function hasApiKeyScope(
  apiKey: { scopes: ApiKeyScope[] },
  requiredScope: ApiKeyScope
): boolean {
  return apiKey.scopes.includes(requiredScope);
}

// Check if API key has any of the required scopes
export function hasAnyApiKeyScope(
  apiKey: { scopes: ApiKeyScope[] },
  requiredScopes: ApiKeyScope[]
): boolean {
  return requiredScopes.some(scope => apiKey.scopes.includes(scope));
}

// Revoke API key
export async function revokeApiKey(
  keyId: string,
  revokedById: string,
  tenantId: string
): Promise<boolean> {
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      id: keyId,
      tenantId,
      revokedAt: null,
    },
  });

  if (!apiKey) {
    return false;
  }

  await prisma.apiKey.update({
    where: { id: keyId },
    data: {
      isActive: false,
      revokedAt: new Date(),
      revokedById,
    },
  });

  await createAuditLog({
    tenantId,
    userId: revokedById,
    action: 'API_KEY_REVOKED',
    resource: 'API_KEY',
    resourceId: keyId,
    description: `API key "${apiKey.name}" revoked`,
    metadata: { keyPrefix: apiKey.keyPrefix },
  });

  return true;
}

// List API keys for tenant
export async function listApiKeys(tenantId: string) {
  return prisma.apiKey.findMany({
    where: {
      tenantId,
      revokedAt: null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      keyPrefix: true,
      scopes: true,
      allowedIps: true,
      allowedOrigins: true,
      rateLimit: true,
      isActive: true,
      expiresAt: true,
      lastUsedAt: true,
      usageCount: true,
      createdAt: true,
      createdBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}
```

### 14.4 API Key Authentication Middleware

```typescript
// lib/auth/api-key-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, hasApiKeyScope, ApiKeyScope } from './api-key-service';
import { checkRateLimit } from './rate-limit';

export function withApiKey(
  handler: (req: NextRequest, ctx: any, apiKey: any) => Promise<NextResponse>,
  options?: {
    requiredScopes?: ApiKeyScope[];
    anyScope?: boolean; // true = any of the scopes, false = all scopes
  }
) {
  return async (req: NextRequest, ctx: any) => {
    // Extract API key from header
    const authHeader = req.headers.get('authorization');
    const apiKeyHeader = req.headers.get('x-api-key');

    let key: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      key = authHeader.substring(7);
    } else if (apiKeyHeader) {
      key = apiKeyHeader;
    }

    if (!key) {
      return NextResponse.json(
        { error: { code: 'MISSING_API_KEY', message: 'API key required' } },
        { status: 401 }
      );
    }

    // Validate key
    const validation = await validateApiKey(key, {
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
      origin: req.headers.get('origin') || undefined,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: { code: 'INVALID_API_KEY', message: validation.error } },
        { status: 401 }
      );
    }

    // Check scopes
    if (options?.requiredScopes && options.requiredScopes.length > 0) {
      const hasRequiredScopes = options.anyScope
        ? options.requiredScopes.some(scope =>
            hasApiKeyScope(validation.apiKey, scope)
          )
        : options.requiredScopes.every(scope =>
            hasApiKeyScope(validation.apiKey, scope)
          );

      if (!hasRequiredScopes) {
        return NextResponse.json(
          {
            error: {
              code: 'INSUFFICIENT_SCOPE',
              message: 'API key lacks required scopes',
              requiredScopes: options.requiredScopes,
            }
          },
          { status: 403 }
        );
      }
    }

    // Check rate limit
    const rateLimitKey = `apikey:${validation.apiKey.id}`;
    const rateLimit = await checkRateLimit(rateLimitKey, 'api');

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'API rate limit exceeded',
            retryAfter: rateLimit.resetAt.toISOString(),
          }
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
          },
        }
      );
    }

    // Add rate limit headers to response
    const response = await handler(req, ctx, validation.apiKey);
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.resetAt.toISOString());

    return response;
  };
}
```

### 14.5 API Key Usage Example

```typescript
// app/api/v1/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withApiKey } from '@/lib/auth/api-key-middleware';
import { ApiKeyScope } from '@/lib/auth/api-keys';
import { prisma } from '@/lib/prisma';

// GET /api/v1/members - List members (requires members:read scope)
export const GET = withApiKey(
  async (req: NextRequest, ctx, apiKey) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const members = await prisma.member.findMany({
      where: { tenantId: apiKey.tenantId },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        membershipStatus: true,
        joinDate: true,
        // Sensitive fields excluded by default
      },
    });

    return NextResponse.json({
      data: members,
      pagination: { page, limit },
    });
  },
  { requiredScopes: [ApiKeyScope.MEMBERS_READ] }
);

// POST /api/v1/members - Create member (requires members:write scope)
export const POST = withApiKey(
  async (req: NextRequest, ctx, apiKey) => {
    const body = await req.json();

    const member = await prisma.member.create({
      data: {
        ...body,
        tenantId: apiKey.tenantId,
      },
    });

    return NextResponse.json({ data: member }, { status: 201 });
  },
  { requiredScopes: [ApiKeyScope.MEMBERS_WRITE] }
);
```

---

## 15. Best Practices

### Security Checklist

1. **Password Security**
   - Use bcrypt with minimum 12 rounds
   - Enforce strong password requirements
   - Implement account lockout after failed attempts
   - Never store passwords in plain text

2. **Session Management**
   - Use secure, httpOnly cookies
   - Implement session timeout
   - Allow users to view and revoke sessions
   - Invalidate sessions on password change

3. **Two-Factor Authentication**
   - Offer TOTP-based 2FA
   - Provide backup codes
   - Allow 2FA recovery via verified email
   - Log 2FA enable/disable events

4. **Rate Limiting**
   - Limit login attempts
   - Rate limit password reset requests
   - Rate limit API endpoints
   - Use progressive delays

5. **Audit Logging**
   - Log all authentication events
   - Log permission changes
   - Log sensitive data access
   - Retain logs for compliance

6. **Input Validation**
   - Validate all inputs server-side
   - Sanitize user data
   - Use parameterized queries
   - Validate email formats

7. **HTTPS Only**
   - Enforce HTTPS everywhere
   - Use HSTS headers
   - Secure cookie flags
   - No mixed content

---

## Document Version

**Version**: 1.1
**Last Updated**: December 2024
**Next Review**: March 2025

### Changelog

#### v1.1 (December 2024)
- Added Platform Admin Authentication section (Section 12)
  - Separate NextAuth configuration for platform users
  - Platform auth middleware with role hierarchy
  - Session type detection utility
- Added Impersonation (User Delegation) section (Section 13)
  - Full impersonation service implementation
  - ImpersonationSession schema
  - API endpoints for start/end impersonation
  - UI banner component for impersonation indicator
- Added API Key Management section (Section 14)
  - Comprehensive ApiKeyScope enum with 28 scopes
  - Scope groupings (READONLY, MEMBER_MANAGEMENT, GIVING_INTEGRATION, etc.)
  - ApiKey schema with IP/origin restrictions
  - API key authentication middleware
