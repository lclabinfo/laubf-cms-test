# 04. 멀티테넌트 아키텍처

## Multi-Tenant Architecture Document

---

## 1. 아키텍처 개요

### 1.1 멀티테넌시 전략 비교

| 전략 | 격리 수준 | 비용 | 유지보수 | 확장성 | 선택 |
|------|----------|------|---------|--------|------|
| 테넌트별 별도 DB | 최고 | 높음 | 복잡 | 제한적 | - |
| 테넌트별 별도 스키마 | 높음 | 중간 | 중간 | 중간 | - |
| **공유 스키마 + RLS** | 중간 | 낮음 | 간단 | 높음 | **선택** |

### 1.2 선택 근거

**Shared Database, Shared Schema with Row-Level Security** 방식 선택:

- **비용 효율성**: 단일 DB 인스턴스로 수천 개 테넌트 서비스
- **운영 단순성**: 단일 스키마로 마이그레이션 일괄 적용
- **확장성**: 수평적 확장 용이 (읽기 복제본)
- **보안**: PostgreSQL RLS로 데이터 격리 보장

---

## 2. 도메인 구조

### 2.1 도메인 유형

| 도메인 유형 | 예시 | 용도 |
|------------|------|------|
| Platform Main | digitalchurch.com | 마케팅, 가격, 가입 |
| Platform Admin | admin.digitalchurch.com | SaaS 관리 |
| Church Subdomain | firstbaptist.digitalchurch.com | 교회 웹사이트 |
| Custom Domain | www.firstbaptist.org | 교회 커스텀 도메인 |
| API | api.digitalchurch.com | 공개 API |

### 2.2 도메인 해석 우선순위

```
1. Custom Domain (최우선)
   └── CustomDomain 테이블에서 직접 조회
   └── DNS 검증 및 SSL 인증서 필요

2. Subdomain
   └── 호스트명에서 추출 (예: firstbaptist.digitalchurch.com)
   └── Tenant.subdomain 필드 매칭

3. Platform Domain
   └── 플랫폼 마케팅/관리자 페이지로 라우팅
   └── 테넌트 컨텍스트 없음
```

---

## 3. 요청 처리 흐름

### 3.1 전체 흐름

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

### 3.2 미들웨어 라우팅 로직

```typescript
// middleware.ts 핵심 로직

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const hostInfo = analyzeHost(hostname);

  switch (hostInfo.type) {
    case 'platform-admin':
      // 플랫폼 관리자 인증 확인
      return handlePlatformAdminRequest(request);

    case 'platform':
      // 플랫폼 컨텍스트 설정
      return handlePlatformRequest(request);

    case 'tenant':
      // 테넌트 컨텍스트 설정 + 모듈 게이팅
      return handleTenantRequest(request, hostInfo);

    default:
      // 404 또는 메인 사이트로 리다이렉트
      return handleUnknownDomain(request, hostname);
  }
}
```

---

## 4. 테넌트 컨텍스트 관리

### 4.1 AsyncLocalStorage 기반 컨텍스트

```typescript
// lib/tenant/context.ts

import { AsyncLocalStorage } from 'async_hooks';

interface TenantContext {
  tenantId: string;
  userId?: string;
  userRole?: string;
  activeModules?: string[];  // 활성화된 모듈 slug 목록
  isImpersonating?: boolean;
}

const tenantStorage = new AsyncLocalStorage<TenantContext>();

// 테넌트 컨텍스트 내에서 함수 실행
export function runWithTenant<T>(context: TenantContext, fn: () => T): T {
  return tenantStorage.run(context, fn);
}

// 현재 테넌트 ID 가져오기
export function getCurrentTenantId(): string | null {
  return tenantStorage.getStore()?.tenantId ?? null;
}

// 현재 테넌트의 활성 모듈 확인
export function hasActiveModule(moduleSlug: string): boolean {
  const context = tenantStorage.getStore();
  return context?.activeModules?.includes(moduleSlug) ?? false;
}

// 테넌트 ID 필수 (없으면 에러)
export function requireCurrentTenantId(): string {
  const tenantId = getCurrentTenantId();
  if (!tenantId) {
    throw new Error('Tenant context required');
  }
  return tenantId;
}
```

### 4.2 API 라우트 래퍼

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

## 5. 데이터 격리

### 5.1 Row-Level Security (PostgreSQL)

```sql
-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
-- ... 모든 테넌트 스코프 테이블에 적용

-- RLS 정책 생성
CREATE POLICY tenant_isolation_users ON users
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- 세션 변수 설정 함수
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

      // Read 작업: tenant_id 필터 추가
      if (['findMany', 'findFirst', 'count'].includes(operation)) {
        args.where = { ...args.where, tenantId };
      }

      // Create 작업: tenant_id 자동 추가
      if (['create', 'createMany'].includes(operation)) {
        args.data = { ...args.data, tenantId };
      }

      // Update/Delete 작업: tenant_id 필터 추가
      if (['update', 'delete'].includes(operation)) {
        args.where = { ...args.where, tenantId };
      }

      return query(args);
    },
  },
});
```

### 5.3 격리 레이어 요약

| 레이어 | 구현 | 목적 |
|--------|------|------|
| **Network** | 도메인 기반 라우팅 | 테넌트 트래픽 분리 |
| **Application** | AsyncLocalStorage + 미들웨어 | 요청별 컨텍스트 |
| **Database** | RLS + Prisma Extension | 쿼리 자동 필터링 |
| **Storage** | 경로 접두사 (/{tenant_id}/...) | 파일 격리 |
| **Cache** | 키 네임스페이스 (tenant:{id}:...) | 캐시 오염 방지 |

---

## 6. 커스텀 도메인 지원

### 6.1 도메인 추가 프로세스

```
1. 도메인 입력
   └── 사용자가 www.mychurch.org 입력

2. 검증 토큰 생성
   └── 랜덤 토큰 생성: abc123xyz

3. DNS 설정 안내
   └── TXT 레코드: _digitalchurch-verify.mychurch.org = abc123xyz
   └── CNAME 레코드: www.mychurch.org → cname.digitalchurch.com

4. 검증 확인
   └── DNS TXT 레코드 조회
   └── 토큰 일치 확인

5. SSL 프로비저닝
   └── Cloudflare 자동 인증서 발급

6. 활성화
   └── verified = true
   └── 도메인으로 트래픽 처리 시작
```

### 6.2 DNS 검증 서비스

```typescript
// lib/tenant/custom-domains.ts

export async function verifyCustomDomain(customDomainId: string) {
  const customDomain = await prisma.customDomain.findUnique({
    where: { id: customDomainId },
  });

  // TXT 레코드 조회
  const txtRecords = await dns.resolveTxt(
    `_digitalchurch-verify.${customDomain.domain}`
  );

  // 토큰 검증
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

    // 캐시 무효화
    await invalidateTenantCache(customDomain.tenantId);

    return { success: true };
  }

  return { success: false, error: 'Verification record not found' };
}
```

---

## 7. 캐싱 전략

### 7.1 다중 레이어 캐시

```
┌─────────────────────────────────────────────────────────────────┐
│                        CACHE LAYERS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: In-Memory Cache (LRU)                                 │
│  ─────────────────────────────                                  │
│  • 인스턴스별 로컬 캐시                                          │
│  • TTL: 5분                                                      │
│  • 용량: 1,000 항목                                              │
│                                                                  │
│  Layer 2: Redis Cache                                            │
│  ────────────────────                                           │
│  • 인스턴스 간 공유 캐시                                         │
│  • TTL: 5-60분                                                   │
│  • 키 형식: tenant:{id}:{type}                                  │
│                                                                  │
│  Layer 3: Next.js Cache                                          │
│  ──────────────────────                                         │
│  • unstable_cache / ISR                                          │
│  • Tags: ['tenant', 'template', 'modules']                      │
│  • revalidate: 300                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 캐시 무효화 (Redis Pub/Sub)

```typescript
// lib/cache/cache-invalidation.ts

const INVALIDATION_CHANNEL = 'cache:invalidation';

// 무효화 메시지 발행
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

  // 로컬 캐시 즉시 무효화
  handleInvalidation(message);

  // 다른 인스턴스에 브로드캐스트
  await publisher.publish(INVALIDATION_CHANNEL, JSON.stringify(message));
}

// 사용 예시
// 테넌트 설정 변경 후
await broadcastInvalidation('tenant', { tenantId });

// 모듈 활성화/비활성화 후
await broadcastInvalidation('module', {
  tenantId,
  tags: [`modules-${tenantId}`, `tenant-${tenantId}`],
});
```

---

## 8. 리소스 제한 및 기능 게이팅

### 8.1 리소스 제한 체크

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

  // Plan 기반이면 Plan 제한 적용
  if (tenant.subscriptionType === 'LEGACY_PLAN' && tenant.plan) {
    const limit = tenant.plan.limits[resourceType];
    const current = await countResource(tenantId, resourceType);
    return { allowed: current < limit || limit === -1, current, limit };
  }

  // 모듈 기반이면 모듈 제한 적용
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

### 8.2 모듈 기능 게이팅

```typescript
// lib/modules/gates.ts

// 모듈 접근 확인
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

// React 컴포넌트 게이트
export function ModuleGate({ module, children, fallback }: ModuleGateProps) {
  const { hasAccess } = useModuleAccess(module);

  if (hasAccess) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <UpgradePrompt
      module={module}
      message={`${module} 모듈을 활성화하여 이 기능을 사용하세요.`}
    />
  );
}
```

---

## 9. 템플릿 시스템 통합

### 9.1 템플릿 로딩

```typescript
// lib/template/loader.ts

export const getTemplateConfig = unstable_cache(
  async (tenantId: string): Promise<TemplateConfig | null> => {
    const customization = await prisma.templateCustomization.findFirst({
      where: { tenantId },
    });

    const baseConfig = await loadTemplateFromFile(customization.templateId);

    // 테넌트 커스터마이징 병합
    return deepMerge(baseConfig, {
      customizations: customization.customizations,
      theme: customization.customizations?.theme || {},
    });
  },
  ['template-config'],
  { tags: ['template'], revalidate: 300 }
);
```

### 9.2 CSS 변수 생성

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

## 10. 보안 고려사항

### 10.1 체크리스트

- [ ] 모든 DB 쿼리에 tenant_id 포함
- [ ] API 엔드포인트에서 테넌트 컨텍스트 검증
- [ ] 파일 업로드 경로에 tenant_id 포함
- [ ] 캐시 키에 tenant_id 접두사
- [ ] 세션 토큰에 tenant claim 포함
- [ ] 감사 로그에 테넌트 컨텍스트 기록
- [ ] 크로스 테넌트 접근 명시적 차단
- [ ] 모듈 접근 권한 검증

### 10.2 감사 로깅

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

## 11. 에러 처리

### 11.1 테넌트 미발견

```tsx
// app/(errors)/not-found/page.tsx

export default function TenantNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="mt-4 text-xl">교회를 찾을 수 없습니다</p>
        <p className="mt-2 text-gray-500">
          요청하신 교회 웹사이트가 존재하지 않거나 삭제되었습니다.
        </p>
        <Link href="https://digitalchurch.com" className="mt-8 btn-primary">
          Digital Church Platform으로 이동
        </Link>
      </div>
    </div>
  );
}
```

### 11.2 계정 정지

```tsx
// app/(errors)/suspended/page.tsx

export default function AccountSuspended() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">계정이 정지되었습니다</h1>
        <p className="mt-4">
          이 교회 계정이 정지되었습니다. 지원팀에 문의해주세요.
        </p>
        <Link href="mailto:support@digitalchurch.com" className="mt-8 btn-primary">
          지원팀 문의
        </Link>
      </div>
    </div>
  );
}
```

---

## 12. 베스트 프랙티스

1. **항상 테넌트 컨텍스트 검증** - 컨텍스트 존재를 가정하지 않음
2. **공격적인 캐싱** - 다중 레이어 캐싱으로 성능 최적화
3. **모든 것을 로깅** - 크로스 테넌트 작업 감사
4. **격리 테스트** - 정기적인 데이터 격리 검증
5. **사용량 모니터링** - 테넌트별 리소스 소비 추적
6. **확장 설계** - 첫날부터 수평적 확장 고려
7. **모듈 게이팅** - 모든 기능 접근 전 모듈 활성화 확인

---

**Document Version**: 3.0 Enterprise Edition
**Last Updated**: December 2024
