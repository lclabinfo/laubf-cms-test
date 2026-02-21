# 03. 시스템 아키텍처

## System Architecture Document

---

## 1. 아키텍처 개요

### 1.1 설계 원칙

| 원칙 | 설명 |
|------|------|
| **멀티테넌트** | 단일 인프라에서 다수의 교회 서비스 |
| **모듈형** | 독립적인 기능 모듈, 선택적 활성화 |
| **클라우드 네이티브** | 서버리스, 자동 확장, 고가용성 |
| **보안 최우선** | 데이터 격리, 암호화, 접근 제어 |
| **확장 가능** | 수평적 확장, 마이크로서비스 지향 |

### 1.2 3-Tier 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PLATFORM LAYER (SaaS Provider)                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Tenant    │  │   Module    │  │   Billing   │  │   System    │            │
│  │ Management  │  │  Catalog    │  │   Engine    │  │  Analytics  │            │
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
│  │  Template   │  │    Page     │  │   Module    │  │   Giving    │            │
│  │  Manager    │  │  Builder    │  │  Settings   │  │  Dashboard  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Member    │  │   Event     │  │   Sermon    │  │    Group    │            │
│  │  Manager    │  │  Manager    │  │   Library   │  │   Manager   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                                  │
│  Church URL: [church].digitalchurch.com/admin                                    │
│  Access: SUPERUSER, ADMIN, CONTENT_MANAGER, MINISTRY_LEADER                     │
│  Feature: 활성화된 모듈만 표시                                                    │
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
│  Public URL: [church].digitalchurch.com                                          │
│  Access: Public (일부 기능은 로그인 필요)                                         │
│  Feature: 활성화된 모듈만 라우팅                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 모듈형 아키텍처

### 2.1 모듈 구조

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MODULE ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                      CORE MODULE (Required)                              │    │
│  │                         [Website - $29/mo]                               │    │
│  │   • Page Builder    • Template System    • Menu Management              │    │
│  │   • SEO             • Media Library      • Basic Analytics              │    │
│  └───────────────────────────────┬─────────────────────────────────────────┘    │
│                                  │                                               │
│           ┌──────────────────────┼──────────────────────┐                       │
│           │                      │                      │                       │
│           ▼                      ▼                      ▼                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ MANAGEMENT      │  │ ENGAGEMENT      │  │ MEDIA           │                 │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤                 │
│  │ Members ($29)   │  │ Events ($19)    │  │ Streaming ($59) │                 │
│  │ Check-in ($29)  │  │ Groups ($19)    │  └─────────────────┘                 │
│  └─────────────────┘  │ Mobile App ($49)│                                       │
│           │           └─────────────────┘                                       │
│           │                      │                                               │
│           ▼                      ▼                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ FINANCE         │  │ AI CREATIVE     │  │ COMMUNICATION   │                 │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤                 │
│  │ Giving ($39)    │  │ AI Shorts ($49) │  │ Email (Included)│                 │
│  └─────────────────┘  │ AI Social ($39) │  │ Push (Included) │                 │
│                       └─────────────────┘  │ SMS (Add-on)    │                 │
│                                            └─────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 모듈 의존성

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MODULE DEPENDENCIES                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Hard Dependencies (필수):                                                       │
│  ───────────────────────                                                        │
│  • Mobile App     → Website                                                      │
│  • Check-in       → Website + Members                                           │
│  • Streaming      → Website                                                      │
│  • AI Shorts      → Website                                                      │
│  • AI Social      → Website                                                      │
│  • Members        → Website                                                      │
│  • Events         → Website                                                      │
│  • Groups         → Website                                                      │
│  • Giving         → Website                                                      │
│                                                                                  │
│  Soft Dependencies (권장):                                                       │
│  ───────────────────────                                                        │
│  • Giving         ⟶ Members (기부자 추적)                                        │
│  • Events         ⟶ Members (참가자 관리)                                        │
│  • Groups         ⟶ Members (그룹원 관리)                                        │
│  • AI Shorts      ⟶ Streaming (설교 소스)                                        │
│  • AI Social      ⟶ Events, Groups (콘텐츠 소스)                                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 모듈 게이팅

```typescript
// 모듈 접근 제어 로직

// 1. 라우트 레벨 게이팅
// middleware.ts
if (pathname.startsWith('/admin/members') && !hasModule('members')) {
  return redirect('/admin/upgrade?module=members');
}

// 2. 컴포넌트 레벨 게이팅
<ModuleGate module="giving">
  <GivingDashboard />
</ModuleGate>

// 3. API 레벨 게이팅
// api/members/route.ts
if (!await checkModuleAccess(tenantId, 'members')) {
  return NextResponse.json({ error: 'Module not active' }, { status: 403 });
}
```

---

## 3. 기술 스택

### 3.1 프론트엔드

```yaml
Framework: Next.js 15 (App Router)
Language: TypeScript 5.x
UI Library:
  - shadcn/ui (Base components)
  - Radix UI (Primitives)
  - Tailwind CSS (Styling)
State Management:
  - TanStack Query (Server state)
  - Zustand (Client state)
Forms: React Hook Form + Zod
Rich Text: TipTap / Lexical
Drag & Drop: dnd-kit
Charts: Recharts
Maps: Mapbox GL
```

### 3.2 백엔드

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

### 3.3 외부 서비스

```yaml
Authentication: NextAuth.js v5
Payments: Stripe
Email: SendGrid / Resend
SMS: Twilio
Push Notifications: Firebase Cloud Messaging
Video Streaming: Mux / AWS IVS
AI Services: OpenAI / Anthropic
Analytics: Mixpanel / PostHog
Error Tracking: Sentry
Monitoring: Datadog / Grafana
```

### 3.4 인프라

```yaml
Hosting: Vercel (Serverless) / AWS
CDN: Cloudflare
DNS: Cloudflare
SSL: Cloudflare (Automatic)
Database Hosting: Neon / Supabase / AWS RDS
CI/CD: GitHub Actions
Containers: Docker (optional)
```

---

## 4. 시스템 아키텍처 다이어그램

### 4.1 전체 시스템 구조

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
         │   Vercel Edge    │    │   Serverless     │    │                  │
         └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
                  │                       │                        │
                  │              ┌────────┴────────┐               │
                  │              │                 │               │
                  ▼              ▼                 ▼               ▼
         ┌──────────────────────────────────────────────────────────────────┐
         │                        Service Layer                              │
         │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐│
         │  │  Auth   │  │ Tenant  │  │ Module  │  │ Payment │  │  Queue  ││
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

### 4.2 요청 처리 흐름

```
User Request (church.digitalchurch.com)
                    │
                    ▼
         ┌──────────────────┐
         │  Edge Middleware │
         │  - Parse hostname│
         │  - Identify type │
         └────────┬─────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌────────┐  ┌────────┐  ┌────────────┐
│Platform│  │ Tenant │  │   Unknown  │
│ Admin  │  │Website │  │   Domain   │
└───┬────┘  └───┬────┘  └─────┬──────┘
    │           │             │
    ▼           ▼             ▼
┌────────┐  ┌────────────┐  ┌────────┐
│Platform│  │Tenant      │  │  404   │
│Context │  │Resolution  │  │ Page   │
└───┬────┘  └─────┬──────┘  └────────┘
    │             │
    │             ▼
    │     ┌──────────────┐
    │     │ Module Check │
    │     │ - Active?    │
    │     │ - Access?    │
    │     └──────┬───────┘
    │            │
    ▼            ▼
┌─────────────────────┐
│   Render Response   │
│   - Template CSS    │
│   - Module Features │
│   - User Context    │
└─────────────────────┘
```

---

## 5. 데이터베이스 설계

### 5.1 설계 원칙

| 원칙 | 설명 |
|------|------|
| Multi-tenant by default | 모든 테이블에 `tenant_id` 포함 |
| UUID primary keys | 보안 및 분산 환경 지원 |
| Soft deletes | `deleted_at`으로 복구 가능한 삭제 |
| Audit trails | `created_at`, `updated_at`, `created_by` |
| Normalized design | 중복 최소화 |
| Indexed queries | 공통 쿼리 패턴 최적화 |

### 5.2 핵심 테이블 구조

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CORE DATA MODEL                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Platform Level (tenant_id NULL)                                                │
│  ─────────────────────────────                                                  │
│  • plans              - 구독 플랜 정의                                           │
│  • solution_modules   - 모듈 카탈로그                                            │
│  • module_dependencies- 모듈 의존성                                              │
│  • platform_users     - 플랫폼 관리자                                            │
│                                                                                  │
│  Tenant Level                                                                    │
│  ────────────                                                                   │
│  • tenants            - 교회 정보                                                │
│  • tenant_modules     - 테넌트별 모듈 구독                                       │
│  • subscriptions      - 결제 구독 정보                                           │
│  • users              - 교회 관리자/사용자                                        │
│                                                                                  │
│  Feature Level                                                                   │
│  ─────────────                                                                  │
│  • members            - 성도 정보                                                │
│  • donations          - 헌금 기록                                                │
│  • events             - 이벤트                                                   │
│  • sermons            - 설교                                                     │
│  • groups             - 소그룹                                                   │
│  • pages              - 웹페이지                                                 │
│  • media              - 미디어 파일                                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 모듈 관련 스키마

```prisma
// 모듈 카탈로그
model SolutionModule {
  id              String    @id @default(uuid())
  slug            String    @unique  // website, mobile-app, giving, etc.
  name            String
  description     String
  basePrice       Decimal   @db.Decimal(10, 2)
  category        ModuleCategory
  isCore          Boolean   @default(false)
  isActive        Boolean   @default(true)
  features        Json      // 모듈 기능 목록
  limits          Json?     // 모듈별 제한사항

  dependencies    ModuleDependency[] @relation("DependentModule")
  dependents      ModuleDependency[] @relation("RequiredModule")
  tenantModules   TenantModule[]
}

// 모듈 의존성
model ModuleDependency {
  id              String    @id @default(uuid())
  dependentId     String
  dependent       SolutionModule @relation("DependentModule", fields: [dependentId], references: [id])
  requiredId      String
  required        SolutionModule @relation("RequiredModule", fields: [requiredId], references: [id])
  isHard          Boolean   @default(true)  // true: 필수, false: 권장

  @@unique([dependentId, requiredId])
}

// 테넌트별 모듈 구독
model TenantModule {
  id              String    @id @default(uuid())
  tenantId        String
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  moduleId        String
  module          SolutionModule @relation(fields: [moduleId], references: [id])
  status          ModuleStatus @default(ACTIVE)
  price           Decimal   @db.Decimal(10, 2)
  discountPercent Int       @default(0)
  stripeItemId    String?   // Stripe Subscription Item ID
  config          Json?     // 모듈별 설정

  @@unique([tenantId, moduleId])
}

enum ModuleCategory {
  CORE          // 핵심 (Website)
  ENGAGEMENT    // 참여 (App, Events, Groups)
  FINANCE       // 재정 (Giving)
  MANAGEMENT    // 관리 (Members, Check-in)
  MEDIA         // 미디어 (Streaming)
  AI_CREATIVE   // AI (Shorts, Social)
}

enum ModuleStatus {
  PENDING
  ACTIVE
  SUSPENDED
  CANCELLED
  TRIAL
}
```

---

## 6. 보안 아키텍처

### 6.1 보안 레이어

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY LAYERS                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Layer 1: Network Security                                                       │
│  ─────────────────────────                                                      │
│  • Cloudflare WAF (OWASP rules)                                                 │
│  • DDoS protection                                                               │
│  • SSL/TLS (minimum TLS 1.2)                                                    │
│  • Rate limiting                                                                 │
│                                                                                  │
│  Layer 2: Application Security                                                   │
│  ─────────────────────────────                                                  │
│  • Input validation (Zod)                                                        │
│  • SQL injection prevention (Prisma ORM)                                        │
│  • XSS protection (CSP)                                                          │
│  • CSRF protection (NextAuth.js)                                                │
│                                                                                  │
│  Layer 3: Authentication & Authorization                                         │
│  ─────────────────────────────────────────                                      │
│  • JWT sessions                                                                  │
│  • Role-based access control (RBAC)                                             │
│  • Multi-factor authentication (TOTP)                                           │
│  • Session management                                                            │
│                                                                                  │
│  Layer 4: Data Security                                                          │
│  ─────────────────────                                                          │
│  • Encryption at rest (AES-256)                                                 │
│  • Encryption in transit (TLS 1.3)                                              │
│  • Tenant data isolation                                                         │
│  • Row-Level Security (PostgreSQL)                                              │
│                                                                                  │
│  Layer 5: Compliance                                                             │
│  ───────────────────                                                            │
│  • PCI DSS (via Stripe)                                                         │
│  • GDPR compliance                                                               │
│  • Audit logging                                                                 │
│  • Data retention policies                                                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 테넌트 격리

| 레이어 | 구현 방법 | 목적 |
|--------|----------|------|
| Network | 도메인 기반 라우팅 | 테넌트 트래픽 분리 |
| Application | 미들웨어 검증 | 테넌트 컨텍스트 확인 |
| Database | Row-Level Security | 데이터 누출 방지 |
| Storage | 접두사 경로 | 파일 접근 격리 |
| Cache | 네임스페이스 키 | 캐시 오염 방지 |

---

## 7. 성능 목표

### 7.1 SLO (Service Level Objectives)

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| Availability | 99.9% | 월간 가동 시간 |
| Page Load (TTFB) | < 200ms | P95 |
| API Response | < 100ms | P95 |
| Time to Interactive | < 3s | P95 (3G) |
| Error Rate | < 0.1% | 일간 |

### 7.2 확장성 목표

| 리소스 | 테넌트당 | 플랫폼 전체 |
|--------|---------|------------|
| 동시 사용자 | 10,000 | 1,000,000 |
| API 요청/초 | 1,000 | 100,000 |
| 파일 스토리지 | 1 TB | 100 TB |
| 데이터베이스 레코드 | 10M | 1B |
| 월간 헌금 처리 | $1M | $100M |

---

## 8. 캐싱 전략

### 8.1 다중 레이어 캐싱

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CACHING LAYERS                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Layer 1: CDN Cache (Cloudflare)                                                │
│  ────────────────────────────────                                               │
│  • Static assets (images, CSS, JS)                                              │
│  • TTL: 1 year                                                                   │
│  • Cache key: URL + tenant subdomain                                            │
│                                                                                  │
│  Layer 2: Edge Cache (Vercel)                                                   │
│  ─────────────────────────────                                                  │
│  • ISR (Incremental Static Regeneration)                                        │
│  • TTL: 60-300 seconds                                                           │
│  • Stale-while-revalidate                                                        │
│                                                                                  │
│  Layer 3: Redis Cache                                                            │
│  ────────────────────                                                           │
│  • Session data                                                                  │
│  • Tenant config                                                                 │
│  • Module access                                                                 │
│  • TTL: 5-60 minutes                                                             │
│  • Key format: tenant:{id}:module:{slug}                                        │
│                                                                                  │
│  Layer 4: React Query Cache (Client)                                            │
│  ──────────────────────────────────                                             │
│  • API responses                                                                 │
│  • Stale time: 5 minutes                                                         │
│  • Garbage collection: 10 minutes                                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 캐시 무효화

```typescript
// Redis Pub/Sub를 통한 다중 인스턴스 캐시 무효화

// 테넌트 설정 변경 시
await broadcastInvalidation('tenant', { tenantId });

// 모듈 활성화/비활성화 시
await broadcastInvalidation('module', { tenantId, tags: [`modules-${tenantId}`] });

// 템플릿 변경 시
await broadcastInvalidation('template', { tenantId });
```

---

## 9. 프로젝트 구조

```
digital-church-platform/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # 인증 페이지 (login, register)
│   ├── (public)/               # 공개 교회 웹사이트
│   │   ├── [tenant]/           # 테넌트별 동적 라우트
│   │   │   ├── page.tsx        # 홈페이지
│   │   │   ├── sermons/        # 설교 (모듈 게이팅)
│   │   │   ├── events/         # 이벤트 (모듈 게이팅)
│   │   │   └── give/           # 헌금 (모듈 게이팅)
│   ├── admin/                  # 교회 관리자 CMS
│   │   ├── [tenant]/
│   │   │   ├── dashboard/
│   │   │   ├── members/        # Members 모듈
│   │   │   ├── giving/         # Giving 모듈
│   │   │   ├── events/         # Events 모듈
│   │   │   ├── settings/
│   │   │   │   └── modules/    # 모듈 관리
│   │   │   └── ...
│   ├── platform/               # 플랫폼 관리자
│   │   ├── tenants/
│   │   ├── modules/            # 모듈 카탈로그 관리
│   │   ├── billing/
│   │   └── ...
│   └── api/                    # API 라우트
│       ├── modules/            # 모듈 관련 API
│       ├── webhooks/
│       └── ...
├── components/
│   ├── ui/                     # shadcn/ui 컴포넌트
│   ├── common/                 # 공통 컴포넌트
│   ├── admin/                  # 관리자 전용
│   ├── platform/               # 플랫폼 전용
│   ├── modules/                # 모듈별 컴포넌트
│   │   ├── giving/
│   │   ├── members/
│   │   ├── events/
│   │   └── ...
│   └── sections/               # 페이지 섹션 컴포넌트
├── lib/
│   ├── auth/                   # 인증 유틸리티
│   ├── db/                     # 데이터베이스 클라이언트
│   ├── modules/                # 모듈 관련 로직
│   │   ├── dependencies.ts     # 의존성 검증
│   │   ├── pricing.ts          # 가격 계산
│   │   └── gates.ts            # 접근 제어
│   ├── payments/               # Stripe 통합
│   ├── tenant/                 # 테넌트 관련
│   ├── template/               # 템플릿 시스템
│   └── utils/                  # 일반 유틸리티
├── prisma/
│   ├── schema.prisma           # 데이터베이스 스키마
│   ├── migrations/             # 마이그레이션
│   └── seed.ts                 # 시드 데이터
├── templates/                  # 템플릿 정의
├── hooks/                      # 커스텀 훅
│   ├── useModuleAccess.ts      # 모듈 접근 훅
│   └── ...
├── contexts/                   # React 컨텍스트
└── types/                      # TypeScript 타입
```

---

**Document Version**: 3.0 Enterprise Edition
**Last Updated**: December 2024
