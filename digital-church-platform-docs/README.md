# Digital Church Platform - Documentation

> Enterprise-grade Multi-Tenant SaaS Platform for Churches

**Version**: 3.0 Enterprise Edition
**Last Updated**: December 2024
**Architecture**: Multi-Tenant SaaS + Modular Solutions

---

## Document Structure

### Overview (Executive & Non-Technical)

High-level summaries for stakeholders, business requirements, and feature overviews.

| Language | Description |
|----------|-------------|
| [English](./1-overview/en/00-index.md) | Executive summary, business requirements, feature overview |
| [한국어](./1-overview/ko/00-index.md) | 경영진 요약, 비즈니스 요구사항, 기능 개요 |

---

### Architecture (Technical Leadership)

System design, data models, and technical architecture decisions.

| Document | Description |
|----------|-------------|
| [01-system-overview.md](./2-architecture/01-system-overview.md) | Platform architecture, tech stack, key features |
| [02-database-schema.md](./2-architecture/02-database-schema.md) | Complete PostgreSQL database design |
| [03-multi-tenant.md](./2-architecture/03-multi-tenant.md) | Multi-tenancy implementation, tenant isolation |
| [04-authentication.md](./2-architecture/04-authentication.md) | Auth system, roles, security |
| [05-api-design.md](./2-architecture/05-api-design.md) | REST API design, webhooks |
| [06-modular-solutions.md](./2-architecture/06-modular-solutions.md) | Modular subscription model, AI creative modules |

---

### Specifications (Development Team)

Detailed feature specifications and implementation guides.

| Document | Description |
|----------|-------------|
| [01-platform-admin.md](./3-specifications/01-platform-admin.md) | SaaS platform management console |
| [02-tenant-onboarding.md](./3-specifications/02-tenant-onboarding.md) | Church registration and setup wizard |
| [03-billing-subscriptions.md](./3-specifications/03-billing-subscriptions.md) | Plans, subscriptions, payment processing |
| [04-church-admin-cms.md](./3-specifications/04-church-admin-cms.md) | Church admin dashboard and CMS |
| [05-template-system.md](./3-specifications/05-template-system.md) | Multi-template design system |
| [06-page-builder.md](./3-specifications/06-page-builder.md) | Visual page builder and sections |
| [07-giving-donations.md](./3-specifications/07-giving-donations.md) | Online giving, recurring donations, campaigns |
| [08-member-management.md](./3-specifications/08-member-management.md) | People database, congregation management |
| [09-events-calendar.md](./3-specifications/09-events-calendar.md) | Event management, registration, check-in |
| [10-sermons-media.md](./3-specifications/10-sermons-media.md) | Sermon library and media management |
| [11-communication.md](./3-specifications/11-communication.md) | Email, SMS, push notifications |
| [12-groups-ministries.md](./3-specifications/12-groups-ministries.md) | Small groups and ministry management |
| [13-mobile-apps.md](./3-specifications/13-mobile-apps.md) | Native mobile application features |
| [14-live-streaming.md](./3-specifications/14-live-streaming.md) | Live streaming integration |

---

### Operations (DevOps & SRE)

Deployment, infrastructure, and operational guides.

| Document | Description |
|----------|-------------|
| [01-deployment.md](./4-operations/01-deployment.md) | Infrastructure, CI/CD, DevOps |

---

### Decisions (Architecture Decision Records)

Record of significant architectural decisions and their rationale.

| ADR | Title | Status |
|-----|-------|--------|
| - | *No ADRs yet* | - |

> **Note**: Use [ADR template](https://adr.github.io/) for new architecture decisions.

---

## Quick Navigation

```
/
├── 1-overview/         # Executive summaries (en/ko)
│   ├── en/
│   └── ko/
├── 2-architecture/     # System design (6 docs)
├── 3-specifications/   # Feature specs (14 docs)
├── 4-operations/       # Deployment & ops (1 doc)
└── 5-decisions/        # ADRs
```

---

## Document Conventions

### Status Indicators

| Status | Meaning |
|--------|---------|
| `draft` | Work in progress, not ready for review |
| `review` | Ready for technical review |
| `approved` | Reviewed and approved for implementation |
| `deprecated` | No longer maintained |

### Audience Tags

- **executive**: Business stakeholders, non-technical
- **architect**: Technical leadership, system designers
- **developer**: Implementation team
- **devops**: Operations, infrastructure team

---

## Contributing

1. Follow the existing document structure
2. Add YAML frontmatter to new documents
3. Update this README when adding new documents
4. Create ADRs for significant architecture decisions

---

**Maintained by**: Platform Team
**Contact**: platform-team@example.com
