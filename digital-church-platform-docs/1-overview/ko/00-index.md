# Digital Church Platform - 설계 문서

## 멀티테넌트 교회 웹사이트 & 관리 플랫폼

**Version**: 3.0 Enterprise Edition
**Last Updated**: December 2024
**Architecture**: Multi-Tenant SaaS + Modular Solutions

---

## Executive Summary

Digital Church Platform은 교회를 위한 종합 엔터프라이즈급 SaaS 솔루션입니다. 멀티테넌트 아키텍처 기반으로, 교회가 온라인 존재감을 확립하고, 성도를 관리하며, 헌금을 처리하고, 이벤트를 주최하고, 커뮤니티와 소통할 수 있도록 지원합니다.

### 핵심 가치 제안

| 특성 | 설명 |
|------|------|
| **올인원 솔루션** | 웹사이트, 헌금, 성도관리, 이벤트, 커뮤니케이션, 모바일앱을 단일 플랫폼에서 제공 |
| **교회 중심 설계** | 교회 워크플로우와 사역 요구사항에 최적화된 설계 |
| **확장 가능 아키텍처** | 소규모 커뮤니티 교회부터 수천 명의 대형교회까지 지원 |
| **유연한 가격 정책** | Plan 기반 또는 모듈 단위 À la carte 선택 가능 |
| **모듈형 아키텍처** | 필요한 솔루션만 선택하여 비용 최적화 |
| **AI 크리에이티브** | 설교 숏폼 영상, SNS 콘텐츠 자동 생성 |

---

## 문서 구조

### 1. 요구사항 정의

| 문서 | 설명 |
|------|------|
| [01-business-requirements.md](./01-business-requirements.md) | 비즈니스 목표, 시장 분석, 경쟁사 비교, 수익 모델 |
| [02-functional-requirements.md](./02-functional-requirements.md) | 기능 요구사항, 사용자 스토리, 핵심 기능 명세 |

### 2. 시스템 아키텍처

| 문서 | 설명 |
|------|------|
| [03-system-architecture.md](./03-system-architecture.md) | 전체 시스템 구조, 3-Tier 아키텍처, 기술 스택 |
| [04-multi-tenant-architecture.md](./04-multi-tenant-architecture.md) | 멀티테넌시 구현, 테넌트 격리, 도메인 처리 |
| [05-modular-solutions.md](./05-modular-solutions.md) | 모듈형 구독 모델, 가격 정책, AI 크리에이티브 모듈 |

### 3. 기능 모듈

| 문서 | 설명 |
|------|------|
| [06-feature-modules.md](./06-feature-modules.md) | 핵심 기능 모듈별 상세 명세 (웹사이트, 헌금, 성도관리 등) |

### 4. 구현 가이드

| 문서 | 설명 |
|------|------|
| [07-implementation-guide.md](./07-implementation-guide.md) | 기술 스택, 개발 환경, 구현 단계, 배포 전략 |

---

## 플랫폼 아키텍처 개요

```
                          ┌─────────────────────────────────────────┐
                          │         Digital Church Platform          │
                          │        (Multi-Tenant SaaS Core)          │
                          └────────────────────┬────────────────────┘
                                               │
          ┌────────────────────────────────────┼────────────────────────────────────┐
          │                                    │                                    │
          ▼                                    ▼                                    ▼
┌─────────────────────┐          ┌─────────────────────┐          ┌─────────────────────┐
│   Platform Admin    │          │    Church Admin     │          │   Public Website    │
│   (SaaS Provider)   │          │   (CMS Dashboard)   │          │   (End Users)       │
├─────────────────────┤          ├─────────────────────┤          ├─────────────────────┤
│ • Tenant Management │          │ • Content Editor    │          │ • Homepage          │
│ • Plan & Billing    │          │ • Menu Builder      │          │ • Sermons/Events    │
│ • Module Catalog    │          │ • Template Config   │          │ • Giving Portal     │
│ • System Analytics  │          │ • Module Settings   │          │ • Member Portal     │
│ • Support Tickets   │          │ • Member Management │          │ • Mobile App        │
└─────────────────────┘          └─────────────────────┘          └─────────────────────┘
```

---

## 구독 모델 비교

### Option 1: Plan 기반 (전통적 Tier)

| Plan | 가격 | 대상 |
|------|------|------|
| Starter | Free ~ $29/mo | 소규모 교회, 시작 단계 |
| Growth | $79/mo | 성장하는 교회 |
| Pro | $149/mo | 중대형 교회, 전체 기능 필요 |
| Enterprise | Custom | 대형교회, 화이트라벨 필요 |

### Option 2: 모듈형 À la carte

| 모듈 | 가격 | 설명 |
|------|------|------|
| Website | $29/mo | 교회 웹사이트 (필수) |
| Mobile App | $49/mo | iOS/Android 네이티브 앱 |
| Giving | $39/mo | 온라인 헌금 시스템 |
| Members | $29/mo | 성도 관리 시스템 |
| Events | $19/mo | 이벤트 등록/예약 |
| Groups | $19/mo | 소그룹 관리 |
| Streaming | $59/mo | 라이브 예배 스트리밍 |
| Check-in | $29/mo | 어린이 체크인 |
| AI Shorts | $49/mo | AI 설교 숏폼 생성 |
| AI Social | $39/mo | AI SNS 콘텐츠 생성 |

**번들 할인**: 3개+ (10%), 5개+ (15%), 전체 (25%)

---

## 경쟁사 비교

| Feature | Tithely | Pushpay | Subsplash | **Digital Church** |
|---------|---------|---------|-----------|-------------------|
| 시작 가격 | Free (3.5% + $0.30) | $149/mo | $99/mo | **유연한 Tier/모듈** |
| 수수료 | 3.5% + $0.30 | 2.9% + $0.30 | 2.3% + $0.30 | **2.0% + $0.25** |
| 커스텀 브랜딩 | 부분적 | 전체 | 전체 | **전체 + 템플릿** |
| 웹사이트 빌더 | 기본 | 제한적 | 양호 | **고급 CMS** |
| 모바일 앱 | AI Builder | 프리미엄 | 포함 | **포함** |
| 성도 관리 | 양호 | CCB 연동 | 기본 | **종합** |
| 라이브 스트리밍 | 기본 | 없음 | 고급 | **통합** |
| 다국어 지원 | 제한적 | 제한적 | 제한적 | **전체 i18n** |
| 모듈형 가격 | 없음 | 없음 | 없음 | **Yes** |
| AI 크리에이티브 | 없음 | 없음 | 없음 | **Yes** |

---

## 핵심 차별화 요소

### 1. 하이브리드 구독 모델
- **Plan 기반**: 기존 SaaS 방식의 티어별 가격
- **모듈형**: 필요한 기능만 선택하여 비용 최적화
- **Hybrid**: Plan + 추가 모듈 조합 가능

### 2. AI 크리에이티브 도구
- **AI Shorts Creator**: 설교 녹화에서 TikTok/YouTube Shorts/Instagram Reels용 숏폼 영상 자동 생성
- **AI Social Studio**: 교회 콘텐츠에서 SNS 게시물 (인용 그래픽, 이벤트 전단, 스토리) 자동 생성

### 3. 고급 템플릿 시스템
- 다양한 전문 템플릿
- 테넌트별 커스터마이징
- 섹션 변형
- 테마 빌더
- 버전 관리

### 4. 엔터프라이즈 보안
- SOC 2 Type II 준비
- GDPR 준수
- 역할 기반 접근 제어
- 감사 로깅
- 2FA 지원

---

## 빠른 시작

구현 순서대로 문서를 참조하세요:

1. **[01-business-requirements.md](./01-business-requirements.md)** - 비즈니스 요구사항 이해
2. **[02-functional-requirements.md](./02-functional-requirements.md)** - 기능 요구사항 확인
3. **[03-system-architecture.md](./03-system-architecture.md)** - 시스템 아키텍처 설계
4. **[05-modular-solutions.md](./05-modular-solutions.md)** - 모듈형 구독 모델 이해
5. **[07-implementation-guide.md](./07-implementation-guide.md)** - 구현 시작

---

**Document Version**: 3.0 Enterprise Edition
**Maintained By**: Digital Church Platform Team
