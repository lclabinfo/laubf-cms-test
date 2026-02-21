# 01. Platform Overview

## Digital Church Platform - Complete Architecture Guide

---

## 1. Platform Vision

### Mission Statement
Empower churches of all sizes with enterprise-grade digital tools at accessible pricing, enabling them to expand their reach, deepen engagement, and streamline operations.

### Core Value Propositions

1. **All-in-One Solution**: Website, giving, member management, events, communication, and mobile apps in a single platform
2. **Church-First Design**: Built specifically for church workflows and ministry needs
3. **Scalable Architecture**: From small community churches to mega-churches with thousands of members
4. **Flexible Pricing**: Choose from tiered plans OR build your own à la carte module bundle
5. **Modern Technology**: Cloud-native, mobile-first, secure by design
6. **Modular Architecture**: Pick only the solutions your church needs - pay for what you use

---

## 2. Platform Components

### 2.1 Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PLATFORM LAYER (SaaS Provider)                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Tenant    │  │    Plan     │  │   Billing   │  │   System    │            │
│  │ Management  │  │ Management  │  │   Engine    │  │  Analytics  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                                  │
│  Platform URL: platform.digitalchurch.com                                        │
│  Access: PLATFORM_ADMIN only                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CHURCH ADMIN LAYER (CMS)                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Template   │  │    Page     │  │   Member    │  │   Giving    │            │
│  │  Manager    │  │  Builder    │  │   Manager   │  │  Dashboard  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Event     │  │   Sermon    │  │ Communication│ │    Group    │            │
│  │  Manager    │  │   Library   │  │   Center    │  │   Manager   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                                  │
│  Church URL: [church].digitalchurch.com/admin OR admin.customdomain.com         │
│  Access: SUPERUSER, ADMIN, CONTENT_MANAGER, MINISTRY_LEADER                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PUBLIC WEBSITE LAYER (End Users)                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Homepage   │  │   Sermons   │  │   Events    │  │   Giving    │            │
│  │  & Pages    │  │   & Media   │  │  Calendar   │  │   Portal    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Member    │  │   Group     │  │   Contact   │  │   Mobile    │            │
│  │   Portal    │  │   Finder    │  │   & Info    │  │    App      │            │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                                  │
│  Public URL: [church].digitalchurch.com OR customdomain.com                     │
│  Access: Public (some features require login)                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Feature Matrix by Plan

| Feature | Starter | Growth | Pro | Enterprise |
|---------|---------|--------|-----|------------|
| **Pricing** | Free | $49/mo | $149/mo | Custom |
| **Website** | |||
| Custom Subdomain | ✅ | ✅ | ✅ | ✅ |
| Custom Domain | ❌ | ✅ | ✅ | ✅ |
| Templates | 1 | 5 | All | All + Custom |
| Pages | 10 | 50 | Unlimited | Unlimited |
| **Member Management** | |||
| Members | 100 | 500 | 2,000 | Unlimited |
| Admin Users | 2 | 5 | 20 | Unlimited |
| Custom Fields | 5 | 15 | Unlimited | Unlimited |
| **Giving** | |||
| Processing Fee | 3.0% | 2.5% | 2.0% | Negotiated |
| Recurring Donations | ✅ | ✅ | ✅ | ✅ |
| Text-to-Give | ❌ | ✅ | ✅ | ✅ |
| Crypto/Stock | ❌ | ❌ | ✅ | ✅ |
| **Events** | |||
| Events/Year | 24 | 100 | Unlimited | Unlimited |
| Registrations | 100/event | 500/event | Unlimited | Unlimited |
| Child Check-in | ❌ | ✅ | ✅ | ✅ |
| **Communication** | |||
| Emails/Month | 1,000 | 10,000 | 50,000 | Unlimited |
| SMS | ❌ | 500/mo | 5,000/mo | Custom |
| Push Notifications | ❌ | ✅ | ✅ | ✅ |
| **Media** | |||
| Storage | 5 GB | 50 GB | 500 GB | Custom |
| Sermons | 50 | 500 | Unlimited | Unlimited |
| Live Streaming | ❌ | ❌ | ✅ | ✅ |
| **Mobile App** | |||
| PWA | ✅ | ✅ | ✅ | ✅ |
| Native App | ❌ | ❌ | ✅ | White-label |
| **Support** | |||
| Support Level | Community | Email | Priority | Dedicated |
| SLA | None | 48h | 24h | 4h |

### 2.3 Alternative: Modular Subscription (À La Carte)

Churches can also choose to build their own custom bundle instead of selecting a plan:

| Module | Monthly Price | Description |
|--------|---------------|-------------|
| Website | $19/mo | Custom subdomain, pages, SEO |
| Mobile App | $29/mo | PWA + branded native app |
| Giving | $39/mo | Online donations, recurring, campaigns |
| Members | $29/mo | Member database, directory, profiles |
| Events | $19/mo | Calendar, registration, ticketing |
| Groups | $19/mo | Small groups, ministries, communication |
| Streaming | $49/mo | Live streaming, on-demand video |
| Check-in | $24/mo | Child check-in, volunteer scheduling |

**Bundle Discounts**:
- 3+ modules: 10% off
- 5+ modules: 15% off
- All 8 modules: 25% off

**Module Dependencies**:
- Mobile App requires Website module
- Check-in requires Members module
- Streaming requires Website module

> 📘 See [21-modular-solutions.md](./21-modular-solutions.md) for complete modular architecture details.

---

## 3. User Roles & Permissions

### 3.1 Platform-Level Roles

| Role | Scope | Permissions |
|------|-------|-------------|
| **PLATFORM_ADMIN** | Platform | Full access to all tenants, billing, system config |
| **PLATFORM_SUPPORT** | Platform | View tenants, handle support tickets, limited admin |

### 3.2 Church-Level Roles

| Role | Scope | Key Permissions |
|------|-------|-----------------|
| **SUPERUSER** | Church | All permissions + billing + danger zone |
| **ADMIN** | Church | User management, settings, all content |
| **CONTENT_MANAGER** | Church | Create/edit content, events, sermons |
| **MINISTRY_LEADER** | Ministry | Manage assigned ministry/group |
| **VOLUNTEER** | Assigned | Check-in, attendance, assigned tasks |
| **MEMBER** | Personal | Profile, giving history, group participation |
| **GUEST** | Public | View public content, RSVP to events |

### 3.3 Permission Matrix

```typescript
const PERMISSIONS = {
  // Content Management
  'content:create': ['CONTENT_MANAGER', 'ADMIN', 'SUPERUSER'],
  'content:edit': ['CONTENT_MANAGER', 'ADMIN', 'SUPERUSER'],
  'content:delete': ['ADMIN', 'SUPERUSER'],
  'content:publish': ['CONTENT_MANAGER', 'ADMIN', 'SUPERUSER'],

  // Member Management
  'members:view': ['MINISTRY_LEADER', 'VOLUNTEER', 'CONTENT_MANAGER', 'ADMIN', 'SUPERUSER'],
  'members:create': ['ADMIN', 'SUPERUSER'],
  'members:edit': ['ADMIN', 'SUPERUSER'],
  'members:delete': ['SUPERUSER'],
  'members:export': ['ADMIN', 'SUPERUSER'],

  // Giving
  'giving:view_reports': ['ADMIN', 'SUPERUSER'],
  'giving:manage_campaigns': ['ADMIN', 'SUPERUSER'],
  'giving:process_refunds': ['SUPERUSER'],

  // Events
  'events:create': ['MINISTRY_LEADER', 'CONTENT_MANAGER', 'ADMIN', 'SUPERUSER'],
  'events:manage': ['MINISTRY_LEADER', 'ADMIN', 'SUPERUSER'],
  'events:checkin': ['VOLUNTEER', 'MINISTRY_LEADER', 'ADMIN', 'SUPERUSER'],

  // Settings
  'settings:view': ['ADMIN', 'SUPERUSER'],
  'settings:edit': ['ADMIN', 'SUPERUSER'],
  'settings:billing': ['SUPERUSER'],
  'settings:danger_zone': ['SUPERUSER'],

  // Template Management
  'template:preview': ['CONTENT_MANAGER', 'ADMIN', 'SUPERUSER'],
  'template:customize': ['ADMIN', 'SUPERUSER'],
  'template:change': ['SUPERUSER'],
};
```

---

## 4. Technical Architecture

### 4.1 System Architecture Diagram

```
                                    ┌──────────────────┐
                                    │    Cloudflare    │
                                    │   CDN + WAF      │
                                    └────────┬─────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
         ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
         │   Web Server     │    │   API Server     │    │   Media Server   │
         │   (Next.js)      │    │   (Next.js API)  │    │   (Mux/AWS)      │
         │   Vercel/AWS     │    │   Serverless     │    │                  │
         └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
                  │                       │                        │
                  │              ┌────────┴────────┐               │
                  │              │                 │               │
                  ▼              ▼                 ▼               ▼
         ┌──────────────────────────────────────────────────────────────────┐
         │                        Service Layer                              │
         │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐│
         │  │  Auth   │  │ Tenant  │  │ Payment │  │  Email  │  │  Queue  ││
         │  │ Service │  │ Service │  │ Service │  │ Service │  │ Service ││
         │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘│
         └────────────────────────────────────────────────────────────────────┘
                                         │
                  ┌──────────────────────┼──────────────────────┐
                  │                      │                      │
                  ▼                      ▼                      ▼
         ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
         │   PostgreSQL     │   │      Redis       │   │     AWS S3       │
         │   (Primary DB)   │   │   (Cache/Queue)  │   │   (File Store)   │
         │   Neon/Supabase  │   │    Upstash       │   │   Cloudflare R2  │
         └──────────────────┘   └──────────────────┘   └──────────────────┘
```

### 4.2 Technology Stack

#### Frontend
```yaml
Framework: Next.js 15 (App Router)
Language: TypeScript 5.x
UI Library:
  - shadcn/ui (Base components)
  - Radix UI (Primitives)
  - Tailwind CSS (Styling)
State Management:
  - React Query (Server state)
  - Zustand (Client state)
Forms: React Hook Form + Zod
Rich Text: TipTap / Lexical
Drag & Drop: dnd-kit
Charts: Recharts
Maps: Mapbox GL
```

#### Backend
```yaml
Runtime: Node.js 20 LTS
Framework: Next.js API Routes
ORM: Prisma 5.x
Database: PostgreSQL 16
Cache: Redis 7.x (Upstash)
Queue: BullMQ
Search: Meilisearch / Typesense
File Storage: AWS S3 / Cloudflare R2
```

#### External Services
```yaml
Authentication: NextAuth.js v4
Payments: Stripe
Email: SendGrid / Resend
SMS: Twilio
Push Notifications: Firebase Cloud Messaging
Video Streaming: Mux / AWS IVS
Analytics: Mixpanel / PostHog
Error Tracking: Sentry
Monitoring: Datadog / Grafana
```

#### Infrastructure
```yaml
Hosting: Vercel (Serverless) / AWS (Custom)
CDN: Cloudflare
DNS: Cloudflare
SSL: Cloudflare (Automatic)
Database Hosting: Neon / Supabase / AWS RDS
CI/CD: GitHub Actions
Containers: Docker (optional)
```

---

## 5. Multi-Tenant Strategy

### 5.1 Tenant Isolation Model

We use a **Shared Database, Shared Schema** approach with Row-Level Security:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                       tenants                               │ │
│  │  id | subdomain | domain | name | plan_id | status         │ │
│  │  1  | grace     | null   | Grace Church | 2 | ACTIVE       │ │
│  │  2  | hope      | hope.org | Hope Church | 3 | ACTIVE      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              │ tenant_id (foreign key)          │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  users | members | events | sermons | donations | ...      │ │
│  │  All tables have tenant_id column for isolation            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Tenant Resolution Flow

```
Request: https://grace.digitalchurch.com/events
                           │
                           ▼
                ┌─────────────────────┐
                │   Middleware        │
                │   1. Extract host   │
                │   2. Parse subdomain│
                │   3. Lookup tenant  │
                └──────────┬──────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
    ┌─────────────────────┐   ┌─────────────────────┐
    │  Tenant Found       │   │  Tenant Not Found   │
    │  - Inject context   │   │  - 404 or redirect  │
    │  - Load template    │   │    to main site     │
    │  - Continue         │   │                     │
    └─────────────────────┘   └─────────────────────┘
```

### 5.3 Data Isolation Guarantees

1. **Query Level**: All queries automatically filtered by `tenant_id`
2. **API Level**: Tenant context validated on every request
3. **Cache Level**: Cache keys prefixed with `tenant:{id}:`
4. **File Level**: Storage paths include tenant ID: `/{tenant_id}/media/...`
5. **Search Level**: Search indices partitioned by tenant

---

## 6. Security Architecture

### 6.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        Security Layers                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: Network Security                                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ • Cloudflare WAF (OWASP rules, rate limiting)               ││
│  │ • DDoS protection                                            ││
│  │ • SSL/TLS (minimum TLS 1.2)                                  ││
│  │ • IP reputation filtering                                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Layer 2: Application Security                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ • Input validation (Zod schemas)                            ││
│  │ • SQL injection prevention (Prisma ORM)                     ││
│  │ • XSS protection (Content Security Policy)                  ││
│  │ • CSRF protection (NextAuth.js)                             ││
│  │ • Rate limiting (per tenant, per user)                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Layer 3: Authentication & Authorization                         │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ • JWT-based sessions (30-day expiry)                        ││
│  │ • Role-based access control (RBAC)                          ││
│  │ • Multi-factor authentication (TOTP)                        ││
│  │ • Password policies (min 8 chars, complexity)               ││
│  │ • Session invalidation on security events                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Layer 4: Data Security                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ • Encryption at rest (AES-256)                              ││
│  │ • Encryption in transit (TLS 1.3)                           ││
│  │ • PII data masking in logs                                  ││
│  │ • Tenant data isolation                                      ││
│  │ • Automated backups (daily, 30-day retention)               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Layer 5: Compliance                                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ • PCI DSS (via Stripe)                                      ││
│  │ • GDPR compliance tools                                      ││
│  │ • Audit logging                                              ││
│  │ • Data retention policies                                    ││
│  │ • Right to deletion (GDPR)                                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 PCI Compliance Strategy

For payment processing, we use Stripe to handle all sensitive payment data:

1. **No PAN Storage**: Card numbers never touch our servers
2. **Tokenization**: Stripe Elements for secure card input
3. **Webhooks**: Secure webhook validation for events
4. **Audit Trail**: All payment actions logged

---

## 7. Performance Targets

### 7.1 Service Level Objectives (SLOs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Availability | 99.9% | Monthly uptime |
| Page Load (TTFB) | < 200ms | P95 |
| API Response | < 100ms | P95 |
| Time to Interactive | < 3s | P95 (3G) |
| Error Rate | < 0.1% | Per day |
| Apdex Score | > 0.95 | Weekly |

### 7.2 Scalability Targets

| Resource | Per Tenant | Platform Total |
|----------|------------|----------------|
| Concurrent Users | 10,000 | 1,000,000 |
| API Requests/sec | 1,000 | 100,000 |
| File Storage | 1 TB | 100 TB |
| Database Records | 10M | 1B |
| Monthly Donations | $1M | $100M |

---

## 8. Development Workflow

### 8.1 Environment Setup

```bash
# Clone repository
git clone https://github.com/your-org/digital-church-platform.git
cd digital-church-platform

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# Setup database
npx prisma migrate dev
npx prisma db seed

# Start development
npm run dev
```

### 8.2 Project Structure

```
digital-church-platform/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth pages (login, register)
│   ├── (public)/               # Public church website
│   ├── admin/                  # Church admin CMS
│   ├── platform/               # Platform admin
│   └── api/                    # API routes
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── common/                 # Shared components
│   ├── admin/                  # Admin-specific
│   ├── platform/               # Platform-specific
│   └── sections/               # Page section components
├── lib/
│   ├── auth/                   # Authentication utilities
│   ├── db/                     # Database client & utilities
│   ├── email/                  # Email templates & sending
│   ├── payments/               # Stripe integration
│   ├── template/               # Template system
│   └── utils/                  # General utilities
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Database migrations
│   └── seed.ts                 # Seed data
├── templates/                  # Template definitions
│   ├── default/
│   ├── modern/
│   └── classic/
├── contexts/                   # React contexts
├── hooks/                      # Custom hooks
├── types/                      # TypeScript types
└── public/                     # Static assets
```

---

## 9. Next Steps

Proceed to the following documents for detailed implementation guides:

1. **[02-database-schema.md](./02-database-schema.md)** - Complete database design
2. **[03-multi-tenant-architecture.md](./03-multi-tenant-architecture.md)** - Tenant isolation details
3. **[04-platform-admin.md](./04-platform-admin.md)** - Platform administration

---

**Document Version**: 3.0 Enterprise Edition
**Last Updated**: December 2024
**Maintained By**: Digital Church Platform Team
