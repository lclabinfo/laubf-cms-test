# 07. Implementation Guide

## Overview

Defines the technology stack, development environment, implementation phases, and deployment strategy for Digital Church Platform implementation.

---

## 1. Technology Stack

### Frontend

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 15.x | App Router, RSC |
| **Language** | TypeScript | 5.x | Type safety |
| **UI Library** | shadcn/ui | latest | Component system |
| **CSS** | Tailwind CSS | 3.x | Utility styling |
| **State (Server)** | TanStack Query | 5.x | Server state management |
| **State (Client)** | Zustand | 4.x | Client state |
| **Forms** | React Hook Form | 7.x | Form management |
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

### Infrastructure

| Category | Technology | Purpose |
|----------|------------|---------|
| **Hosting** | Azure App Service | Web application hosting |
| **Serverless** | Azure Functions | Serverless compute |
| **CDN** | Cloudflare / Azure CDN | CDN, WAF |
| **Database** | Azure Database for PostgreSQL | PostgreSQL hosting |
| **Cache** | Azure Cache for Redis | Managed Redis |
| **Storage** | Azure Blob Storage | File storage |
| **CI/CD** | GitHub Actions | Automation pipeline |

### External Services

| Category | Service | Purpose |
|----------|---------|---------|
| **Authentication** | NextAuth.js | Authentication |
| **Payments** | Stripe | Payment processing |
| **Email** | SendGrid | Email delivery |
| **SMS** | Twilio | SMS delivery |
| **Push** | Firebase Cloud Messaging | Push notifications |
| **Video** | Azure Media Services | Video streaming |
| **AI Services** | Azure OpenAI API | AI features (GPT, DALL-E, Speech) |
| **Analytics** | PostHog | Product analytics |
| **Monitoring** | Sentry | Error tracking |

---

## 2. Project Structure

```
digital-church/
├── apps/
│   ├── web/                    # Next.js main app
│   │   ├── app/
│   │   │   ├── (public)/       # Public pages (church website)
│   │   │   ├── (auth)/         # Authentication pages
│   │   │   ├── admin/          # Church admin dashboard
│   │   │   ├── platform/       # Platform admin
│   │   │   └── api/            # API Routes
│   │   ├── components/
│   │   ├── lib/
│   │   └── styles/
│   │
│   └── mobile/                 # React Native app (Expo)
│       ├── app/
│       ├── components/
│       └── lib/
│
├── packages/
│   ├── database/               # Prisma schema & client
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed/
│   │   └── src/
│   │
│   ├── config/                 # Shared configuration
│   │   ├── tsconfig/
│   │   └── eslint/
│   │
│   ├── ui/                     # Shared UI components
│   │   └── src/
│   │
│   └── utils/                  # Shared utilities
│       └── src/
│
├── tools/
│   ├── scripts/                # Build/deploy scripts
│   └── generators/             # Code generators
│
├── docs/                       # Design documents
├── .github/                    # GitHub Actions
├── turbo.json                  # Turborepo config
├── package.json
└── pnpm-workspace.yaml
```

---

## 3. Development Environment Setup

### Prerequisites

```bash
# Node.js 20 LTS
node -v  # v20.x.x

# pnpm (recommended package manager)
npm install -g pnpm

# Docker (for local database)
docker -v
```

### Environment Variables

```env
# .env.local

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/digitalchurch"
DIRECT_URL="postgresql://user:password@localhost:5432/digitalchurch"

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=""
AZURE_STORAGE_CONTAINER_NAME=""

# Email
SENDGRID_API_KEY=""

# SMS
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Azure OpenAI
AZURE_OPENAI_API_KEY=""
AZURE_OPENAI_ENDPOINT=""
AZURE_OPENAI_DEPLOYMENT_NAME=""
```

### Local Development Start

```bash
# Clone repository
git clone https://github.com/your-org/digital-church.git
cd digital-church

# Install dependencies
pnpm install

# Start local database
docker compose up -d

# Database migration
pnpm db:migrate

# Insert seed data
pnpm db:seed

# Start development server
pnpm dev
```

---

## 4. Implementation Phases

### Phase 1: Foundation (8 weeks)

**Goal**: Build core infrastructure and multi-tenant foundation

| Week | Task | Deliverable |
|------|------|-------------|
| 1-2 | Project setup | Monorepo, CI/CD, development environment |
| 2-3 | Database design | Prisma schema, migrations |
| 3-4 | Multi-tenant implementation | Tenant resolution, RLS, context |
| 4-5 | Authentication system | NextAuth, role-based permissions |
| 5-6 | Platform admin | Tenant management, basic UI |
| 6-7 | Onboarding flow | Church registration, initial setup |
| 7-8 | Module system | Module catalog, dependency validation |

**Milestone**: Tenant creation, basic login, module selection functional

### Phase 2: Core Modules (12 weeks)

**Goal**: Complete Website, Giving, Members, Events modules

| Week | Task | Deliverable |
|------|------|-------------|
| 1-3 | Website module | Template system, page builder |
| 3-5 | Giving module | Stripe integration, giving form, recurring giving |
| 5-8 | Members module | Member profiles, family management, search |
| 8-10 | Events module | Event creation, calendar, registration |
| 10-12 | Integration testing | E2E tests, performance optimization |

**Milestone**: 4 core modules MVP complete

### Phase 3: Growth Modules (10 weeks)

**Goal**: Complete Groups, Mobile App, Streaming modules

| Week | Task | Deliverable |
|------|------|-------------|
| 1-3 | Groups module | Group management, membership, communication |
| 3-6 | Mobile App | Expo app, core features, push notifications |
| 6-8 | Streaming module | Live streaming, VOD |
| 8-10 | Payment enhancement | Module-based subscription, bundle discounts |

**Milestone**: Growth modules complete, app store deployment

### Phase 4: Premium Features (8 weeks)

**Goal**: Complete Check-in, AI modules

| Week | Task | Deliverable |
|------|------|-------------|
| 1-3 | Check-in module | Self check-in, name tag printing |
| 3-6 | AI Shorts | Highlight detection, clip generation |
| 6-8 | AI Social | Auto content generation, templates |

**Milestone**: All modules complete

### Phase 5: Polish & Scale (Ongoing)

**Goal**: Optimization, security hardening, scaling

| Task | Description |
|------|-------------|
| Performance optimization | Query optimization, caching strategy |
| Security hardening | SOC 2 preparation, security audits |
| Internationalization | Multi-language support expansion |
| Advanced analytics | Advanced reporting, predictive analytics |

---

## 5. Deployment Strategy

### Environment Configuration

```
┌─────────────────────────────────────────────────────────────┐
│                    Deployment Environments                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Development  │  │   Staging    │  │  Production  │      │
│  │              │  │              │  │              │      │
│  │ • Local dev  │  │ • Preview    │  │ • Live       │      │
│  │ • Feature    │  │ • QA testing │  │ • Customer   │      │
│  │   branches   │  │ • PR preview │  │   facing     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│        │                   │                  │             │
│        ▼                   ▼                  ▼             │
│  localhost:3000    preview.dc.app      digitalchurch.com   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```yaml
# .github/workflows/main.yml

name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build

  deploy-preview:
    if: github.event_name == 'pull_request'
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: azure/webapps-deploy@v2
        with:
          app-name: 'digitalchurch-staging'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_STAGING }}

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: azure/webapps-deploy@v2
        with:
          app-name: 'digitalchurch-production'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_PROD }}
```

### Database Migration

```bash
# Create migration
pnpm prisma migrate dev --name migration_name

# Production migration
pnpm prisma migrate deploy

# Schema validation
pnpm prisma validate
```

### Zero-Downtime Deployment

```
Blue-Green Deployment Strategy
─────────────────────────────────

1. Blue (Current)                2. Green (New)
   ┌─────────┐                   ┌─────────┐
   │   App   │ ← Traffic         │   App   │ ← Deploy new version
   │  v1.0   │                   │  v1.1   │
   └─────────┘                   └─────────┘
       │                              │
       └──────────┬───────────────────┘
                  │
              ┌───┴───┐
              │  DB   │ (Shared, migration first)
              └───────┘

3. Switch Traffic              4. Cleanup
   ┌─────────┐                   ┌─────────┐
   │   App   │ (standby)         │   App   │ (removed)
   │  v1.0   │                   │  v1.0   │
   └─────────┘                   └─────────┘
   ┌─────────┐                   ┌─────────┐
   │   App   │ ← Traffic         │   App   │ ← Traffic
   │  v1.1   │                   │  v1.1   │
   └─────────┘                   └─────────┘
```

---

## 6. Testing Strategy

### Test Pyramid

```
                    ┌───────┐
                    │  E2E  │  ← 10%
                   ┌┴───────┴┐
                   │ Integration │  ← 30%
                  ┌┴───────────┴┐
                  │    Unit     │  ← 60%
                  └─────────────┘
```

### Testing Tools

| Type | Tool | Purpose |
|------|------|---------|
| Unit | Vitest | Function/component unit tests |
| Integration | Testing Library | React component integration tests |
| E2E | Playwright | Browser E2E tests |
| API | Supertest | API endpoint tests |

### Test Commands

```bash
# Unit tests
pnpm test

# Test coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e

# E2E (UI mode)
pnpm test:e2e:ui
```

---

## 7. Monitoring & Operations

### Monitoring Stack

| Area | Tool | Purpose |
|------|------|---------|
| Error Tracking | Sentry | Runtime error monitoring |
| Performance | Azure Application Insights | Web performance metrics |
| Logs | Azure Monitor / Axiom | Centralized logging |
| Alerts | PagerDuty / Slack | Incident alerts |
| Uptime | Better Uptime | Service availability |

### Performance Targets

| Metric | Target | Measurement Tool |
|--------|--------|-----------------|
| LCP | < 2.5s | Lighthouse, Azure Monitor |
| FID | < 100ms | Web Vitals |
| CLS | < 0.1 | Web Vitals |
| TTFB | < 600ms | Azure Application Insights |
| API Response | < 200ms | Custom APM |

### Alert Policy

| Severity | Condition | Alert Channel | Response Time |
|----------|-----------|--------------|---------------|
| Critical | Service down | PagerDuty + SMS | Immediate |
| High | Error rate > 5% | Slack #alerts | Within 15 min |
| Medium | Performance degradation | Slack #monitoring | Within 1 hour |
| Low | Warning | Dashboard | Next business day |

---

## 8. Security Checklist

### Authentication & Authorization

- [ ] Password hashing (bcrypt, 10+ rounds)
- [ ] JWT/session token expiration settings
- [ ] RBAC permission validation
- [ ] Tenant isolation (RLS)
- [ ] 2FA support

### Data Protection

- [ ] Encryption in transit (TLS 1.3)
- [ ] Encryption at rest (AES-256)
- [ ] PII data masking
- [ ] Regular backups

### API Security

- [ ] Rate Limiting
- [ ] CORS configuration
- [ ] CSRF tokens
- [ ] Input validation (Zod)
- [ ] SQL Injection prevention (Prisma)

### Infrastructure Security

- [ ] WAF enabled (Cloudflare/Azure WAF)
- [ ] DDoS protection
- [ ] Secret key management (Azure Key Vault)
- [ ] Regular security audits

---

## 9. Documentation

### Documentation Types

| Type | Tool | Purpose |
|------|------|---------|
| API Documentation | OpenAPI/Swagger | REST API specification |
| Component Documentation | Storybook | UI component catalog |
| Developer Documentation | Docusaurus | Developer guides |
| Operations Documentation | Notion/Confluence | Internal operations manual |

### Code Documentation

```typescript
/**
 * Checks tenant module access permissions.
 *
 * @param tenantId - Tenant ID
 * @param moduleSlug - Module identifier (e.g., 'giving', 'members')
 * @returns true if module is active
 * @throws {ModuleNotActiveError} When module is inactive
 *
 * @example
 * ```ts
 * const hasAccess = await isModuleActive('tenant-123', 'giving');
 * if (!hasAccess) {
 *   redirect('/upgrade');
 * }
 * ```
 */
export async function isModuleActive(
  tenantId: string,
  moduleSlug: string
): Promise<boolean> {
  // implementation
}
```

---

## 10. Team Composition Recommendations

### Minimum Team (Phase 1-2)

| Role | Count | Responsibilities |
|------|-------|------------------|
| Tech Lead | 1 | Architecture, code review, technical decisions |
| Full-stack Developer | 2 | Frontend/backend development |
| DevOps Engineer | 1 (part-time) | Infrastructure, CI/CD |

### Expanded Team (Phase 3-4)

| Role | Count | Responsibilities |
|------|-------|------------------|
| Tech Lead | 1 | Architecture, technical decisions |
| Frontend Developer | 2 | Web/mobile UI |
| Backend Developer | 2 | API, database |
| Mobile Developer | 1 | React Native app |
| QA Engineer | 1 | Testing, quality management |
| DevOps Engineer | 1 | Infrastructure, monitoring |
| Designer | 1 | UI/UX design |

---

**Document Version**: 3.0 Enterprise Edition
**Related Documents**:
- [03-system-architecture.md](./03-system-architecture.md) - System architecture
- [04-multi-tenant-architecture.md](./04-multi-tenant-architecture.md) - Multi-tenant implementation
- [05-modular-solutions.md](./05-modular-solutions.md) - Modular solutions
