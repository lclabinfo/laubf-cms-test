# 07. 구현 가이드

## 개요

Digital Church Platform 구현을 위한 기술 스택, 개발 환경, 구현 단계, 배포 전략을 정의합니다.

---

## 1. 기술 스택

### Frontend

| 카테고리 | 기술 | 버전 | 목적 |
|---------|------|------|------|
| **Framework** | Next.js | 15.x | App Router, RSC |
| **Language** | TypeScript | 5.x | 타입 안전성 |
| **UI Library** | shadcn/ui | latest | 컴포넌트 시스템 |
| **CSS** | Tailwind CSS | 3.x | 유틸리티 스타일링 |
| **State (Server)** | TanStack Query | 5.x | 서버 상태 관리 |
| **State (Client)** | Zustand | 4.x | 클라이언트 상태 |
| **Forms** | React Hook Form | 7.x | 폼 관리 |
| **Validation** | Zod | 3.x | 스키마 검증 |
| **Rich Text** | TipTap | 2.x | WYSIWYG 에디터 |
| **Drag & Drop** | dnd-kit | latest | 드래그 앤 드롭 |
| **Charts** | Recharts | 2.x | 데이터 시각화 |

### Backend

| 카테고리 | 기술 | 버전 | 목적 |
|---------|------|------|------|
| **Runtime** | Node.js | 20 LTS | 서버 런타임 |
| **Framework** | Next.js API Routes | 15.x | API 서버 |
| **ORM** | Prisma | 5.x | 데이터베이스 ORM |
| **Database** | PostgreSQL | 16.x | 주 데이터베이스 |
| **Cache** | Redis (Upstash) | 7.x | 캐싱, 세션 |
| **Queue** | BullMQ | 5.x | 작업 큐 |
| **Search** | Meilisearch | latest | 전문 검색 |

### Infrastructure

| 카테고리 | 기술 | 목적 |
|---------|------|------|
| **Hosting** | Vercel | 서버리스 배포 |
| **CDN** | Cloudflare | CDN, WAF |
| **Database** | Neon / Supabase | PostgreSQL 호스팅 |
| **Storage** | AWS S3 / Cloudflare R2 | 파일 스토리지 |
| **CI/CD** | GitHub Actions | 자동화 파이프라인 |

### External Services

| 카테고리 | 서비스 | 목적 |
|---------|--------|------|
| **Authentication** | NextAuth.js | 인증 |
| **Payments** | Stripe | 결제 처리 |
| **Email** | SendGrid / Resend | 이메일 발송 |
| **SMS** | Twilio | SMS 발송 |
| **Push** | Firebase Cloud Messaging | 푸시 알림 |
| **Video** | Mux | 비디오 스트리밍 |
| **Analytics** | PostHog | 제품 분석 |
| **Monitoring** | Sentry | 에러 추적 |

---

## 2. 프로젝트 구조

```
digital-church/
├── apps/
│   ├── web/                    # Next.js 메인 앱
│   │   ├── app/
│   │   │   ├── (public)/       # 공개 페이지 (교회 웹사이트)
│   │   │   ├── (auth)/         # 인증 페이지
│   │   │   ├── admin/          # 교회 관리자 대시보드
│   │   │   ├── platform/       # 플랫폼 관리자
│   │   │   └── api/            # API Routes
│   │   ├── components/
│   │   ├── lib/
│   │   └── styles/
│   │
│   └── mobile/                 # React Native 앱 (Expo)
│       ├── app/
│       ├── components/
│       └── lib/
│
├── packages/
│   ├── database/               # Prisma 스키마 & 클라이언트
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed/
│   │   └── src/
│   │
│   ├── config/                 # 공유 설정
│   │   ├── tsconfig/
│   │   └── eslint/
│   │
│   ├── ui/                     # 공유 UI 컴포넌트
│   │   └── src/
│   │
│   └── utils/                  # 공유 유틸리티
│       └── src/
│
├── tools/
│   ├── scripts/                # 빌드/배포 스크립트
│   └── generators/             # 코드 생성기
│
├── docs/                       # 설계 문서
├── .github/                    # GitHub Actions
├── turbo.json                  # Turborepo 설정
├── package.json
└── pnpm-workspace.yaml
```

---

## 3. 개발 환경 설정

### 사전 요구사항

```bash
# Node.js 20 LTS
node -v  # v20.x.x

# pnpm (권장 패키지 매니저)
npm install -g pnpm

# Docker (로컬 데이터베이스용)
docker -v
```

### 환경 변수

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

# Storage
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET=""
AWS_REGION="us-east-1"

# Email
SENDGRID_API_KEY=""

# SMS
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
```

### 로컬 개발 시작

```bash
# 저장소 클론
git clone https://github.com/your-org/digital-church.git
cd digital-church

# 의존성 설치
pnpm install

# 로컬 데이터베이스 실행
docker compose up -d

# 데이터베이스 마이그레이션
pnpm db:migrate

# 시드 데이터 삽입
pnpm db:seed

# 개발 서버 시작
pnpm dev
```

---

## 4. 구현 단계

### Phase 1: Foundation (8주)

**목표**: 핵심 인프라 및 멀티테넌트 기반 구축

| 주차 | 작업 | 산출물 |
|------|------|--------|
| 1-2 | 프로젝트 셋업 | Monorepo, CI/CD, 개발 환경 |
| 2-3 | 데이터베이스 설계 | Prisma 스키마, 마이그레이션 |
| 3-4 | 멀티테넌트 구현 | 테넌트 해석, RLS, 컨텍스트 |
| 4-5 | 인증 시스템 | NextAuth, 역할 기반 권한 |
| 5-6 | 플랫폼 관리자 | 테넌트 관리, 기본 UI |
| 6-7 | 온보딩 플로우 | 교회 등록, 초기 설정 |
| 7-8 | 모듈 시스템 | 모듈 카탈로그, 의존성 검증 |

**마일스톤**: 테넌트 생성, 기본 로그인, 모듈 선택 가능

### Phase 2: Core Modules (12주)

**목표**: Website, Giving, Members, Events 모듈 완성

| 주차 | 작업 | 산출물 |
|------|------|--------|
| 1-3 | Website 모듈 | 템플릿 시스템, 페이지 빌더 |
| 3-5 | Giving 모듈 | Stripe 연동, 헌금 폼, 정기 헌금 |
| 5-8 | Members 모듈 | 성도 프로필, 가족 관리, 검색 |
| 8-10 | Events 모듈 | 이벤트 생성, 캘린더, 등록 |
| 10-12 | 통합 테스트 | E2E 테스트, 성능 최적화 |

**마일스톤**: 4대 핵심 모듈 MVP 완성

### Phase 3: Growth Modules (10주)

**목표**: Groups, Mobile App, Streaming 모듈 완성

| 주차 | 작업 | 산출물 |
|------|------|--------|
| 1-3 | Groups 모듈 | 그룹 관리, 멤버십, 커뮤니케이션 |
| 3-6 | Mobile App | Expo 앱, 코어 기능, 푸시 알림 |
| 6-8 | Streaming 모듈 | 라이브 스트리밍, VOD |
| 8-10 | 결제 고도화 | 모듈별 구독, 번들 할인 |

**마일스톤**: 성장 모듈 완성, 앱스토어 배포

### Phase 4: Premium Features (8주)

**목표**: Check-in, AI 모듈 완성

| 주차 | 작업 | 산출물 |
|------|------|--------|
| 1-3 | Check-in 모듈 | 셀프 체크인, 이름표 인쇄 |
| 3-6 | AI Shorts | 하이라이트 감지, 클립 생성 |
| 6-8 | AI Social | 콘텐츠 자동 생성, 템플릿 |

**마일스톤**: 전체 모듈 완성

### Phase 5: Polish & Scale (지속적)

**목표**: 최적화, 보안 강화, 스케일링

| 작업 | 설명 |
|------|------|
| 성능 최적화 | 쿼리 최적화, 캐싱 전략 |
| 보안 강화 | SOC 2 준비, 보안 감사 |
| 국제화 | 다국어 지원 확대 |
| 분석 고도화 | 고급 리포팅, 예측 분석 |

---

## 5. 배포 전략

### 환경 구성

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

### CI/CD 파이프라인

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
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 데이터베이스 마이그레이션

```bash
# 마이그레이션 생성
pnpm prisma migrate dev --name migration_name

# 프로덕션 마이그레이션
pnpm prisma migrate deploy

# 스키마 검증
pnpm prisma validate
```

### 무중단 배포

```
Blue-Green Deployment Strategy
─────────────────────────────────

1. Blue (현재)                2. Green (신규)
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

## 6. 테스팅 전략

### 테스트 피라미드

```
                    ┌───────┐
                    │  E2E  │  ← 10%
                   ┌┴───────┴┐
                   │ Integration │  ← 30%
                  ┌┴───────────┴┐
                  │    Unit     │  ← 60%
                  └─────────────┘
```

### 테스트 도구

| 유형 | 도구 | 목적 |
|------|------|------|
| Unit | Vitest | 함수/컴포넌트 단위 테스트 |
| Integration | Testing Library | React 컴포넌트 통합 테스트 |
| E2E | Playwright | 브라우저 E2E 테스트 |
| API | Supertest | API 엔드포인트 테스트 |

### 테스트 명령어

```bash
# 단위 테스트
pnpm test

# 테스트 커버리지
pnpm test:coverage

# E2E 테스트
pnpm test:e2e

# E2E (UI 모드)
pnpm test:e2e:ui
```

---

## 7. 모니터링 & 운영

### 모니터링 스택

| 영역 | 도구 | 목적 |
|------|------|------|
| 에러 추적 | Sentry | 런타임 에러 모니터링 |
| 성능 | Vercel Analytics | 웹 성능 지표 |
| 로그 | Axiom / Datadog | 중앙화 로깅 |
| 알림 | PagerDuty / Slack | 장애 알림 |
| 업타임 | Better Uptime | 서비스 가용성 |

### 성능 기준

| 지표 | 목표 | 측정 도구 |
|------|------|----------|
| LCP | < 2.5초 | Lighthouse, Vercel |
| FID | < 100ms | Web Vitals |
| CLS | < 0.1 | Web Vitals |
| TTFB | < 600ms | Vercel Analytics |
| API 응답 | < 200ms | Custom APM |

### 알림 정책

| 심각도 | 조건 | 알림 채널 | 응답 시간 |
|--------|------|----------|----------|
| Critical | 서비스 다운 | PagerDuty + SMS | 즉시 |
| High | 에러율 > 5% | Slack #alerts | 15분 내 |
| Medium | 성능 저하 | Slack #monitoring | 1시간 내 |
| Low | 경고 | 대시보드 | 다음 영업일 |

---

## 8. 보안 체크리스트

### 인증 & 권한

- [ ] 비밀번호 해싱 (bcrypt, 10+ rounds)
- [ ] JWT/세션 토큰 만료 설정
- [ ] RBAC 권한 검증
- [ ] 테넌트 격리 (RLS)
- [ ] 2FA 지원

### 데이터 보호

- [ ] 전송 중 암호화 (TLS 1.3)
- [ ] 저장 시 암호화 (AES-256)
- [ ] PII 데이터 마스킹
- [ ] 정기 백업

### API 보안

- [ ] Rate Limiting
- [ ] CORS 설정
- [ ] CSRF 토큰
- [ ] 입력 검증 (Zod)
- [ ] SQL Injection 방지 (Prisma)

### 인프라 보안

- [ ] WAF 활성화 (Cloudflare)
- [ ] DDoS 방어
- [ ] 비밀 키 관리 (Vault)
- [ ] 정기 보안 감사

---

## 9. 문서화

### 문서 유형

| 유형 | 도구 | 목적 |
|------|------|------|
| API 문서 | OpenAPI/Swagger | REST API 명세 |
| 컴포넌트 문서 | Storybook | UI 컴포넌트 카탈로그 |
| 개발자 문서 | Docusaurus | 개발자 가이드 |
| 운영 문서 | Notion/Confluence | 내부 운영 매뉴얼 |

### 코드 문서화

```typescript
/**
 * 테넌트 모듈 접근 권한을 확인합니다.
 *
 * @param tenantId - 테넌트 ID
 * @param moduleSlug - 모듈 식별자 (e.g., 'giving', 'members')
 * @returns 모듈이 활성화되어 있으면 true
 * @throws {ModuleNotActiveError} 모듈이 비활성 상태일 때
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

## 10. 팀 구성 권장사항

### 최소 팀 구성 (Phase 1-2)

| 역할 | 인원 | 책임 |
|------|------|------|
| Tech Lead | 1 | 아키텍처, 코드 리뷰, 기술 결정 |
| Full-stack Developer | 2 | 프론트엔드/백엔드 개발 |
| DevOps Engineer | 1 (파트타임) | 인프라, CI/CD |

### 확장 팀 (Phase 3-4)

| 역할 | 인원 | 책임 |
|------|------|------|
| Tech Lead | 1 | 아키텍처, 기술 결정 |
| Frontend Developer | 2 | 웹/모바일 UI |
| Backend Developer | 2 | API, 데이터베이스 |
| Mobile Developer | 1 | React Native 앱 |
| QA Engineer | 1 | 테스트, 품질 관리 |
| DevOps Engineer | 1 | 인프라, 모니터링 |
| Designer | 1 | UI/UX 디자인 |

---

**Document Version**: 3.0 Enterprise Edition
**Related Documents**:
- [03-system-architecture.md](./03-system-architecture.md) - 시스템 아키텍처
- [04-multi-tenant-architecture.md](./04-multi-tenant-architecture.md) - 멀티테넌트 구현
- [05-modular-solutions.md](./05-modular-solutions.md) - 모듈형 솔루션
