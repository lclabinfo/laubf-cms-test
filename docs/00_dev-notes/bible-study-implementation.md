# Bible Study Pages — Implementation Tracker

> **Started**: February 24, 2026
> **Status**: COMPLETE (pending visual verification)
> **Goal**: Public website bible study detail pages pulling real data from PostgreSQL

---

## Overview

Bible study materials are a core template feature — every church using the platform gets the same study detail page layout (with minor content variations). This is NOT a website builder section — it's a dedicated route with a fixed template.

Each CMS Message entry that has `hasStudy: true` and a linked `BibleStudy` record should display as a navigable study page on the public website at `/bible-study/[slug]`.

---

## Feature Scope

### Bible Study Detail Page (`/bible-study/[slug]`)

A two-panel study workspace with 4 resource tabs:

| Tab | Content | Source Field |
|-----|---------|-------------|
| **Bible** | Scripture passage text | `bibleText` (HTML) |
| **Questions** | Study questions by verse section | `questions` (HTML) |
| **Answers** | Study guide / answer key | `answers` (HTML) |
| **Message** | Sermon transcript | `transcript` (HTML) |

**Desktop Features:**
- Resizable split-pane layout (drag handle, 25-75% bounds)
- Any two tabs can be viewed simultaneously (left + right pane)
- Close right pane button
- Font size controls (+/- buttons, 80-150% range)
- Bible version toggle (ESV/NIV)
- BibleGateway external link
- "Watch Message" button (YouTube link)
- Attachments dropdown (PDF/DOCX downloads)
- Key verse blockquote in Questions/Answers tabs

**Mobile Features:**
- Vertical scroll with scroll-spy tab highlighting
- Header auto-hide on scroll down
- All 4 sections stacked vertically

### Bible Study Listing Page (`/bible-study`)

A filterable grid of all published bible studies:
- Search by title, passage, series
- Sort by date, title, book
- Load more pagination (9 at a time)
- Resource indicators (questions, answers, transcript icons)

---

## Implementation Tasks

### 1. Database & Seed Data
| Task | Status | Notes |
|------|--------|-------|
| Prisma schema (BibleStudy, BibleStudyAttachment) | DONE | Already exists with all fields |
| DAL module (lib/dal/bible-studies.ts) | DONE | CRUD + filtering + pagination |
| API routes (/api/v1/bible-studies) | DONE | GET/POST/PATCH/DELETE |
| Seed: Populate content fields (questions, answers, bibleText, transcript) | DONE | 15 studies with full HTML content |
| Seed: Add keyVerseRef + keyVerseText | DONE | All studies have key verse data |
| Seed: Add BibleStudyAttachment records | DONE | 34 attachments (PDF/DOCX/IMAGE) |
| Re-run seed to populate database | DONE | Seed verified idempotent |

### 2. Types & Shared Code
| Task | Status | Notes |
|------|--------|-------|
| BibleStudyDetail type (lib/types/bible-study.ts) | DONE | Interfaces for detail + attachments |
| BibleBook display name mapping | DONE | Canonical source: lib/website/bible-book-labels.ts |

### 3. Public Website Routes
| Task | Status | Notes |
|------|--------|-------|
| /bible-study listing page (app/(website)/bible-study/page.tsx) | DONE | Server component with hero + filterable grid |
| /bible-study/[slug] detail page (app/(website)/bible-study/[slug]/page.tsx) | DONE | Server component with generateMetadata |

### 4. Frontend Components
| Task | Status | Notes |
|------|--------|-------|
| StudyDetailView client component | DONE | Ported from laubf-test StudyDetailPage.tsx |
| 4 resource tabs (Bible, Questions, Answers, Message) | DONE | Part of StudyDetailView |
| Resizable split-pane layout | DONE | Drag handle, 25-75% bounds |
| Font size controls | DONE | +/- buttons, 80-150% range |
| Bible version toggle (ESV/NIV) | DONE | With BibleGateway external links |
| Mobile scroll-spy | DONE | Vertical scroll with tab highlighting |
| Attachments dropdown | DONE | PDF/DOCX downloads |
| Key verse blockquote | DONE | In Questions/Answers tabs |

### 5. Data Integration
| Task | Status | Notes |
|------|--------|-------|
| Server component data fetching (getChurchId → DAL) | DONE | Both listing + detail pages |
| Prisma enum → display string mapping | DONE | Uses bibleBookLabel() from bible-book-labels.ts |
| AllBibleStudiesSection data from DB | DONE | Already working via resolve-section-data.ts |

### 6. Verification
| Task | Status | Notes |
|------|--------|-------|
| TypeScript compilation (npx tsc --noEmit) | DONE | Clean — no errors |
| Next.js build (npx next build) | DONE | Both routes build successfully |
| Re-seed database (npx prisma db seed) | DONE | Idempotent, all content populated |
| Visual verification against laubf-test | PENDING | After build passes |

---

## Architecture

```
Route Structure:
app/(website)/
├── layout.tsx                    ← Shared website layout (navbar, footer, theme)
├── [[...slug]]/page.tsx          ← Catch-all for CMS pages
├── bible-study/
│   ├── page.tsx                  ← Listing page (server component)
│   └── [slug]/
│       └── page.tsx              ← Detail page (server component)

Component Structure:
components/website/
├── sections/
│   └── all-bible-studies.tsx     ← Already migrated (used by listing page)
├── shared/
│   └── bible-study-card.tsx      ← Already migrated (used by section)
└── study-detail/
    └── study-detail-view.tsx     ← NEW: Main detail component (client)

Data Flow:
lib/
├── dal/bible-studies.ts          ← getBibleStudies(), getBibleStudyBySlug()
├── tenant/context.ts             ← getChurchId()
└── types/bible-study.ts          ← NEW: Frontend types + enum mapping

Database:
prisma/
├── schema.prisma                 ← BibleStudy + BibleStudyAttachment models
└── seed.mts                      ← UPDATED: Full content for studies
```

---

## Data Flow

```
1. User visits /bible-study/do-you-truly-love-me
2. Next.js resolves to app/(website)/bible-study/[slug]/page.tsx
3. Server component calls:
   - getChurchId() → resolves CHURCH_SLUG env var to UUID
   - getBibleStudyBySlug(churchId, "do-you-truly-love-me")
4. Prisma query returns BibleStudy + Speaker + Series + Attachments
5. Server component maps Prisma data → BibleStudyDetail props
6. Client component StudyDetailView renders the study workspace
```

---

## Source Reference

The laubf-test implementation serves as the source of truth:

| File | Lines | Purpose |
|------|-------|---------|
| `laubf-test/src/components/study-detail/StudyDetailPage.tsx` | 813 | Main detail component |
| `laubf-test/src/components/sections/AllBibleStudiesSection.tsx` | 532 | Filterable listing |
| `laubf-test/src/lib/types/bible-study.ts` | ~100 | Type definitions |
| `laubf-test/src/lib/mock-data/bible-studies.ts` | 666 | Mock content data |
| `laubf-test/src/app/bible-study/[slug]/page.tsx` | ~30 | Detail route |
| `laubf-test/src/app/bible-study/page.tsx` | ~30 | Listing route |

---

## Agent Team

| Agent | Responsibility | Files |
|-------|---------------|-------|
| **Seed Data Agent** | Populate bible study content, attachments in seed.mts | prisma/seed.mts |
| **Frontend Agent** | Port StudyDetailPage, create detail route, types | components/website/study-detail/, app/(website)/bible-study/[slug]/, lib/types/ |
| **Listing Page Agent** | Create /bible-study listing route | app/(website)/bible-study/page.tsx |
| **Coordinator** (main) | Documentation, integration, verification, build | docs/, verification |
