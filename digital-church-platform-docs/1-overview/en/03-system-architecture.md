# 03. System Architecture

## Overview

Digital Church Platform is built on a modern 3-tier architecture that ensures scalability, security, and maintainability. This document describes the overall system structure and technology stack.

---

## 1. Architecture Overview

### 3-Tier Architecture

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
│  │   Event     │  │   Sermon    │  │Communication│  │    Group    │            │
│  │  Manager    │  │   Library   │  │   Center    │  │   Manager   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                                  │
│  Church URL: [church].digitalchurch.com/admin                                    │
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

---

## 2. Technology Stack

### Frontend

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 15.x | App Router, React Server Components |
| **Language** | TypeScript | 5.x | Type safety |
| **UI Library** | shadcn/ui | latest | Component system |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS |
| **State (Server)** | TanStack Query | 5.x | Server state management |
| **State (Client)** | Zustand | 4.x | Client state management |
| **Forms** | React Hook Form | 7.x | Form handling |
| **Validation** | Zod | 3.x | Schema validation |
| **Rich Text** | TipTap | 2.x | WYSIWYG editor |
| **Drag & Drop** | dnd-kit | latest | Drag and drop |
| **Charts** | Recharts | 2.x | Data visualization |

### Backend

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Runtime** | Node.js | 20 LTS | Server runtime |
| **Framework** | Next.js API Routes | 15.x | API server |
| **ORM** | Prisma | 5.x | Database ORM |
| **Database** | PostgreSQL | 16.x | Primary database |
| **Cache** | Redis (Upstash) | 7.x | Caching, sessions |
| **Queue** | BullMQ | 5.x | Job queue |
| **Search** | Meilisearch | latest | Full-text search |

### Infrastructure (Azure)

| Category | Service | Purpose |
|----------|---------|---------|
| **Hosting** | Azure App Service | Web application hosting |
| **Functions** | Azure Functions | Serverless compute |
| **CDN** | Azure CDN / Cloudflare | Content delivery |
| **Database** | Azure Database for PostgreSQL | Managed PostgreSQL |
| **Cache** | Azure Cache for Redis | Managed Redis |
| **Storage** | Azure Blob Storage | File storage |
| **Container** | Azure Container Apps | Container orchestration |

### External Services

| Category | Service | Purpose |
|----------|---------|---------|
| **Authentication** | NextAuth.js | Auth framework |
| **Payments** | Stripe | Payment processing |
| **Email** | SendGrid | Email delivery |
| **SMS** | Twilio | SMS messaging |
| **Push Notifications** | Firebase Cloud Messaging | Push notifications |
| **Video Streaming** | Mux / Azure Media Services | Video delivery |
| **AI Services** | Azure OpenAI API | AI features (GPT, etc.) |
| **Analytics** | PostHog | Product analytics |
| **Error Tracking** | Sentry | Error monitoring |

---

## 3. System Architecture Diagram

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
         │ Azure App Service│    │  Azure Functions │    │Azure Media Svc   │
         │   (Next.js)      │    │   (Background)   │    │   (Streaming)    │
         └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
                  │                       │                        │
                  │              ┌────────┴────────┐               │
                  │              │                 │               │
                  ▼              ▼                 ▼               ▼
         ┌──────────────────────────────────────────────────────────────────┐
         │                        Service Layer                              │
         │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐│
         │  │  Auth   │  │ Tenant  │  │ Payment │  │  Email  │  │   AI    ││
         │  │ Service │  │ Service │  │ Service │  │ Service │  │ Service ││
         │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘│
         └────────────────────────────────────────────────────────────────────┘
                                         │
                  ┌──────────────────────┼──────────────────────┐
                  │                      │                      │
                  ▼                      ▼                      ▼
         ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
         │  Azure Database  │   │   Azure Cache    │   │   Azure Blob     │
         │  for PostgreSQL  │   │    for Redis     │   │    Storage       │
         └──────────────────┘   └──────────────────┘   └──────────────────┘
```

---

## 4. Modular Architecture

### Module System Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MODULE SYSTEM ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        MODULE CATALOG                                  │  │
│  │                                                                        │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │  │
│  │  │ Website │ │  Giving │ │ Members │ │ Events  │ │ Groups  │        │  │
│  │  │  $29    │ │  $39    │ │  $29    │ │  $19    │ │  $19    │        │  │
│  │  │ (Core)  │ │         │ │         │ │         │ │         │        │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │  │
│  │                                                                        │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │  │
│  │  │Mobile   │ │Streaming│ │Check-in │ │AI Shorts│ │AI Social│        │  │
│  │  │App $49  │ │  $59    │ │  $29    │ │  $49    │ │  $39    │        │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     DEPENDENCY MANAGER                                 │  │
│  │                                                                        │  │
│  │  website ──┬──► members ──► check-in                                  │  │
│  │            ├──► events                                                 │  │
│  │            ├──► groups ──► giving (soft)                              │  │
│  │            ├──► giving                                                 │  │
│  │            ├──► streaming                                              │  │
│  │            ├──► mobile-app                                             │  │
│  │            ├──► ai-shorts                                              │  │
│  │            └──► ai-social                                              │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      MODULE GATE                                       │  │
│  │                                                                        │  │
│  │  Route Level   │  Component Level   │  API Level                      │  │
│  │  /giving/*     │  <ModuleGate>      │  withModuleRequired()           │  │
│  │  /groups/*     │  useModuleAccess   │  API middleware                 │  │
│  │  /check-in/*   │                    │                                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Module Dependencies

| Module | Hard Dependencies | Soft Dependencies |
|--------|-------------------|-------------------|
| Website | - | - |
| Members | Website | - |
| Events | Website | Members |
| Groups | Website | Members |
| Giving | Website | Members |
| Check-in | Website, Members | - |
| Mobile App | Website | - |
| Streaming | Website | - |
| AI Shorts | Website | Streaming |
| AI Social | Website | Events, Groups |

---

## 5. Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: Edge Security                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  • Cloudflare WAF (DDoS, SQL Injection, XSS)                ││
│  │  • Rate Limiting                                             ││
│  │  • SSL/TLS 1.3                                               ││
│  │  • Bot Protection                                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│  Layer 2: Application Security                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  • NextAuth.js Authentication                                ││
│  │  • JWT Token Management                                      ││
│  │  • RBAC (Role-Based Access Control)                         ││
│  │  • CSRF Protection                                           ││
│  │  • Input Validation (Zod)                                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│  Layer 3: Data Security                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  • Row-Level Security (PostgreSQL RLS)                      ││
│  │  • Tenant Isolation                                          ││
│  │  • Encryption at Rest (AES-256)                             ││
│  │  • Encryption in Transit (TLS)                              ││
│  │  • PII Data Masking                                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│  Layer 4: Compliance                                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  • SOC 2 Type II Ready                                       ││
│  │  • GDPR Compliance                                           ││
│  │  • PCI DSS (via Stripe)                                      ││
│  │  • Audit Logging                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### User Roles & Permissions

| Role | Scope | Key Permissions |
|------|-------|-----------------|
| **PLATFORM_ADMIN** | Platform | Full access to all tenants |
| **SUPERUSER** | Church | All permissions including billing |
| **ADMIN** | Church | User management, all content |
| **CONTENT_MANAGER** | Church | Create/edit content, events |
| **MINISTRY_LEADER** | Ministry | Manage assigned groups |
| **VOLUNTEER** | Assigned | Check-in, attendance |
| **MEMBER** | Personal | Profile, giving, groups |

---

## 6. Caching Strategy

### Multi-Layer Caching

```
┌─────────────────────────────────────────────────────────────────┐
│                       CACHING LAYERS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: CDN Cache (Cloudflare)                                │
│  ├── Static Assets: Images, CSS, JS (TTL: 1 year)              │
│  ├── Public Pages: Homepage, About (TTL: 5 min)                 │
│  └── API Responses: Read-only data (TTL: 1 min)                 │
│                                                                  │
│  Layer 2: Application Cache (Azure Cache for Redis)            │
│  ├── Tenant Config: Settings, modules (TTL: 5 min)              │
│  ├── User Sessions: Auth state (TTL: 24 hours)                  │
│  ├── Template Data: Parsed templates (TTL: 10 min)              │
│  └── Module Access: Active modules (TTL: 5 min)                 │
│                                                                  │
│  Layer 3: Query Cache (TanStack Query)                          │
│  ├── Server State: API responses (staleTime: varies)            │
│  ├── Optimistic Updates: Immediate UI feedback                  │
│  └── Background Refetch: Keep data fresh                        │
│                                                                  │
│  Layer 4: Database Cache (PostgreSQL)                           │
│  ├── Query Plan Cache: Prepared statements                      │
│  ├── Buffer Pool: Hot data in memory                            │
│  └── Connection Pool: Reuse connections                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Cache Keys

| Pattern | Example | TTL |
|---------|---------|-----|
| `tenant:{id}:config` | tenant:abc123:config | 5 min |
| `tenant:{id}:modules` | tenant:abc123:modules | 5 min |
| `user:{id}:session` | user:xyz789:session | 24 hrs |
| `template:{id}:parsed` | template:t1:parsed | 10 min |

---

## 7. Project Structure

```
digital-church/
├── apps/
│   ├── web/                    # Next.js main app
│   │   ├── app/
│   │   │   ├── (public)/       # Public pages
│   │   │   ├── (auth)/         # Auth pages
│   │   │   ├── admin/          # Church admin
│   │   │   ├── platform/       # Platform admin
│   │   │   └── api/            # API routes
│   │   ├── components/
│   │   │   ├── ui/             # Base UI components
│   │   │   ├── features/       # Feature components
│   │   │   └── layouts/        # Layout components
│   │   ├── lib/
│   │   │   ├── auth/           # Auth utilities
│   │   │   ├── tenant/         # Tenant context
│   │   │   ├── modules/        # Module system
│   │   │   └── api/            # API clients
│   │   └── styles/
│   │
│   └── mobile/                 # React Native app
│
├── packages/
│   ├── database/               # Prisma schema
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   │
│   ├── config/                 # Shared config
│   ├── ui/                     # Shared UI
│   └── utils/                  # Shared utilities
│
├── services/
│   ├── ai/                     # AI services (Azure OpenAI)
│   ├── email/                  # Email service (SendGrid)
│   └── payment/                # Payment service (Stripe)
│
└── infrastructure/
    ├── terraform/              # Azure infrastructure
    └── docker/                 # Container configs
```

---

## 8. API Design

### API Conventions

| Aspect | Convention |
|--------|------------|
| **Base URL** | `/api/v1` |
| **Format** | JSON |
| **Auth** | Bearer token (JWT) |
| **Versioning** | URL path (`/v1`, `/v2`) |
| **Errors** | RFC 7807 Problem Details |

### RESTful Endpoints

```
/api/v1
├── /tenants                    # Tenant management
├── /auth                       # Authentication
├── /members                    # Member management
├── /donations                  # Giving
├── /events                     # Events
├── /groups                     # Groups
├── /sermons                    # Sermons
├── /pages                      # Website pages
├── /media                      # Media files
└── /ai                         # AI services
    ├── /shorts                 # AI Shorts
    └── /social                 # AI Social
```

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Format

```json
{
  "success": false,
  "error": {
    "type": "validation_error",
    "title": "Invalid Request",
    "status": 400,
    "detail": "Email field is required",
    "instance": "/api/v1/members"
  }
}
```

---

## 9. AI Service Architecture

### Azure OpenAI Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI SERVICE ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     AI Shorts Creator                        ││
│  │                                                              ││
│  │  Video Upload → Azure Media Services                         ││
│  │       │                                                      ││
│  │       ▼                                                      ││
│  │  Transcription → Azure Speech-to-Text                        ││
│  │       │                                                      ││
│  │       ▼                                                      ││
│  │  Highlight Detection → Azure OpenAI (GPT-4)                  ││
│  │       │                                                      ││
│  │       ▼                                                      ││
│  │  Clip Generation → FFmpeg Processing                         ││
│  │       │                                                      ││
│  │       ▼                                                      ││
│  │  Caption/Subtitle → Azure OpenAI                             ││
│  │       │                                                      ││
│  │       ▼                                                      ││
│  │  Template Rendering → Output to Blob Storage                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     AI Social Studio                         ││
│  │                                                              ││
│  │  Content Input → Sermon text, Event data                     ││
│  │       │                                                      ││
│  │       ▼                                                      ││
│  │  Content Analysis → Azure OpenAI (GPT-4)                     ││
│  │       │                                                      ││
│  │       ▼                                                      ││
│  │  Caption Generation → Azure OpenAI                           ││
│  │       │                                                      ││
│  │       ▼                                                      ││
│  │  Image Generation → Azure OpenAI (DALL-E 3)                  ││
│  │       │                                                      ││
│  │       ▼                                                      ││
│  │  Template Composition → Canvas/Sharp                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Scalability

### Horizontal Scaling

| Component | Scaling Strategy |
|-----------|-----------------|
| **Web Servers** | Azure App Service auto-scale |
| **API Servers** | Azure Functions consumption plan |
| **Database** | Read replicas, connection pooling |
| **Cache** | Azure Cache for Redis clustering |
| **Storage** | Azure Blob hot/cool tiering |

### Performance Targets

| Metric | Target |
|--------|--------|
| Page Load (LCP) | < 2.5s |
| API Response | < 200ms |
| Time to Interactive | < 3s |
| Uptime | 99.9% |
| Concurrent Users | 10,000+ per tenant |

---

**Document Version**: 3.0 Enterprise Edition
**Related Documents**:
- [04-multi-tenant-architecture.md](./04-multi-tenant-architecture.md) - Multi-tenancy details
- [07-implementation-guide.md](./07-implementation-guide.md) - Implementation guide
