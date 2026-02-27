# Codebase Audit Report — February 27, 2026

Comprehensive 9-agent audit covering CMS, Website Builder, and Public Website. Each area was analyzed by specialized agents reading through dozens of files.

> **Commit range:** 9 commits over Feb 25–27 (~7,000+ lines changed)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [CMS Admin](#2-cms-admin)
   - [Dashboard](#21-dashboard)
   - [Messages & Events](#22-messages--events)
   - [Media & Settings](#23-media--settings)
3. [Website Builder](#3-website-builder)
   - [Shell & Canvas](#31-shell--canvas)
   - [Section Picker & Editors](#32-section-picker--editors)
   - [API & Data Flow](#33-api--data-flow)
4. [Public Website](#4-public-website)
   - [Routing & Layout](#41-routing--layout)
   - [Section Components](#42-section-components)
   - [DAL & API](#43-dal--api)
5. [Cross-Cutting Concerns](#5-cross-cutting-concerns)
6. [Priority Matrix](#6-priority-matrix)

---

## 1. Executive Summary

### What's Working Well
- **Builder core** is production-ready — drag-and-drop, real section rendering, scoped theme CSS
- **DAL architecture** is solid — proper multi-tenant isolation (churchId everywhere), no N+1 queries
- **Section component library** is 85% high-quality — 40/42 real implementations, good responsive design and theme support
- **Website admin pages** (pages manager, page builder, nav editor, theme manager, site settings) all work with real APIs
- **Soft delete consistency** — content tables properly use `deletedAt` pattern

### Critical Issues Found
| # | Area | Issue | Impact |
|---|------|-------|--------|
| 1 | CMS | Delete buttons do nothing (messages + events tables) | Users cannot delete content |
| 2 | CMS | ✅ ~~Series CRUD is broken — no API routes for update/delete~~ | Series management unusable |
| 3 | CMS | Media page has zero backend API — all data in-memory only | Data lost on every refresh |
| 4 | CMS | Media selector dialog broken (empty arrays) | Events can't pick cover images |
| 5 | Builder | Section delete is hard delete with no recovery | Accidental deletes are permanent |
| 6 | Builder | Partial saves go undetected — "Page saved" even on failures | Silent data loss |
| 7 | Builder | Auto-save failures are silent | Users think changes saved when they aren't |
| 8 | Website | Missing `/im-new` and `/member-login` pages (hardcoded hrefs, 404) | Navbar CTA buttons broken |
| 9 | Website | `custom-html.tsx` — unsanitized user HTML injection (XSS) | Security vulnerability |
| 10 | Website | `highlight-cards.tsx` — hardcoded event URL path | Breaks dynamic routing |
| 11 | Website | Footer logo hardcoded to LA UBF | Multi-tenant broken |
| 12 | DAL | 3 missing delete functions (campuses, ministries, daily-bread) | Incomplete CRUD |
| 13 | DAL | 4 missing API route files (speakers, series, ministries, campuses individual routes) | CMS cannot edit reference data |

---

## 2. CMS Admin

### 2.1 Dashboard

**Agent: CMS Agent 1**

#### Broken Links in Recent Activity
- Messages and events in "Recent Activity" use `slug` in href but detail routes expect `id` → **404 errors**
- Pages links go to the pages list, not the individual page editor (missing slug in query param)

#### Dead Sidebar Links
4 links under the "App" group return 404:
- Notifications
- Announcements
- Mobile
- Integrations

These should either be built or removed from the sidebar to avoid confusion.

#### Misleading Health Cards
- Media health shows **"Needs attention"** for new churches with 0 videos
- This is misleading — 0 videos is expected for a new church, not an error

---

### 2.2 Messages & Events

**Agent: CMS Agent 2**

#### Delete Buttons Are Dead
- Both messages and events table rows have delete buttons with **no `onClick` handlers**
- Clicking delete does absolutely nothing — no confirmation dialog, no API call, no feedback

#### Series CRUD is Broken
- `updateSeries()` — DAL function exists but **no API route**
- `deleteSeries()` — DAL function exists but **no API route**
- Series-message assignment — **TODO stub with no implementation**
- Users can create series but cannot edit, delete, or assign messages to them

#### Event Tags Never Persist
- Tags are hardcoded to `[]` in event creation
- The `ContentTag` join table is never queried
- Tags entered in the CMS UI are silently lost on save

#### Duplicate Buttons Are Dead
- Both event and message tables have "Duplicate" buttons with **no handlers**
- No click handler, no API call

#### No Confirmation Dialogs
- No confirmation before destructive actions (even if delete worked)
- No error toasts on failed operations

---

### 2.3 Media & Settings

**Agent: CMS Agent 3**

#### Media Page Has Zero Backend
- The entire media page (`/cms/media`) stores data **in-memory only**
- All media uploads, folders, tags are lost on page refresh
- No API routes exist for media CRUD
- This is the single largest functional gap in the CMS

#### Media Selector Dialog Broken
- The media selector (used when picking cover images for events, etc.) shows empty results
- Backed by empty arrays — no connection to any data source

#### People Pages Are Stubs
- Directory, Groups, and Members pages under `/cms/people/` are placeholder stubs
- No real functionality implemented

#### Website Admin Pages ✓
All 5 website admin pages work correctly with real APIs:
- Pages manager
- Page builder
- Navigation editor
- Theme manager
- Site settings

---

## 3. Website Builder

### 3.1 Shell & Canvas

**Agent: Builder Agent 1**

#### Status: Production-Ready ✓
- Core drag-and-drop works correctly
- Real section rendering with scoped theme CSS variables
- Navbar preview in builder
- Selection UX with outline-based borders (z-index fix applied)
- Section reordering via drag overlay

#### Minor Issue
- Navbar settings persistence is a known TODO (changes lost on reload)

---

### 3.2 Section Picker & Editors

**Agent: Builder Agent 2**

#### Section Picker Works Well ✓
All 3 modes functional:
- Dialog mode
- Sidebar mode
- Popover mode

#### Only 16/42 Sections Have Dedicated Editors (38%)
- Remaining 26 sections fall back to raw JSON editing
- Users editing Hero or CTA sections get a nice form; users editing FAQ or Timeline get JSON
- This is a significant UX gap for non-technical users

#### Navbar Settings Not Persisted
- Navbar editor exists but changes are not saved to the database
- Changes are lost on page reload

#### Page Duplicate is a TODO Stub
- "Duplicate page" button exists in UI but handler is `// TODO`

#### No Delete Confirmation Dialog
- Section/page deletes happen immediately with no "Are you sure?" dialog
- In-memory undo exists but is lost on refresh — risky UX

#### Modal Editor Display Tab is Empty
- The "Display" tab in the modal section editor renders nothing
- Only the right drawer renders `DisplaySettings` correctly

---

### 3.3 API & Data Flow

**Agent: Builder Agent 3**

#### Hard Deletes with No Recovery
- Section delete is a **permanent hard delete** — no soft-delete, no trash
- In-memory undo exists but is lost on page refresh
- If user accidentally deletes a section and refreshes, it's gone forever

#### Partial Saves Go Undetected
- If 3 out of 5 section save API calls fail, the user still sees a **"Page saved" success toast**
- No indication that some sections weren't saved
- Silent data loss scenario

#### Auto-Save Failures Are Silent
- 30-second auto-save timer fires API calls in the background
- If the API call fails, no error toast or visual indicator
- User closes tab thinking changes are saved → data lost

#### No Content Schema Validation
- No validation on any section content API endpoint
- Malformed JSON is accepted and stored in the database
- Can cause runtime crashes when the public website tries to render the section

#### Sequential Save Creates Race Conditions
- Save operation sends: page PATCH → section reorder → N section patches
- These are sequential but not transactional
- If the connection drops mid-save, some sections are saved and others aren't
- No rollback mechanism

---

## 4. Public Website

### 4.1 Routing & Layout

**Agent: Website Agent 1**

#### Missing Pages Cause 404s
Two hardcoded navbar hrefs point to pages that don't exist:
- `/website/im-new` → CTA button → **404**
- `/website/member-login` → Member login link → **404**

**Location:** `app/website/layout.tsx` lines 59, 62

#### CTA Label/Href Are Hardcoded (Not CMS-Driven)
```tsx
ctaLabel={siteSettings?.enableMemberLogin ? "I'm new" : "I'm new"}
```
- Always shows "I'm new" regardless of setting
- Href is hardcoded, not configurable via CMS
- Violates "zero-code" CMS philosophy

#### No Error Boundary on Website Layout
- If `getChurchId()`, `getSiteSettings()`, `getMenuByLocation()`, `FontLoader`, or `ThemeProvider` fails, the entire site breaks
- No `error.tsx` file exists in `app/website/` to catch and display a friendly error
- No user-friendly fallback

#### Data Resolution Has No Error Handling
`lib/website/resolve-section-data.ts` (lines 49–301):
- Calls many DAL functions with **no try/catch blocks**
- If any DAL function throws, the entire page render fails
- Should wrap each data source resolution in try/catch with graceful fallback

#### Inconsistent Data Resolution Patterns
- Some data sources merge results into `content` (spread pattern)
- Others return as separate `resolvedData` object
- No documentation of which pattern is used where
- Makes component integration fragile

#### Custom CSS Injected Without Sanitization
`components/website/theme/theme-provider.tsx` lines 38–40:
- Custom CSS from the database is injected via `dangerouslySetInnerHTML`
- No sanitization of the CSS input
- Admins could inject malicious CSS or break the page layout

#### Quick Links FAB Always Opens New Tabs
`components/website/layout/quick-links-fab.tsx`:
- All links force `target="_blank"`, even internal ones
- Internal links like `/website/about` shouldn't open in a new tab
- Should check if link is external before setting target

#### Footer Social Links Are Hardcoded SVGs
- Manually hardcoded SVG icons for each social platform
- If a new social platform is added, code must be updated
- Not using lucide-react icons like the rest of the project

#### Font Loader Fails Silently
- If `getThemeWithCustomization()` returns null, returns null with no warning
- No fonts load — page renders with system fonts only
- No error logged for debugging

---

### 4.2 Section Components

**Agent: Website Agent 2**

#### Registry Status
- **42 section types registered** in `registry.tsx`
- **40 real implementations**
- **2 intentional placeholders:** NAVBAR (handled by layout), DAILY_BREAD_FEATURE (has real implementation despite docs saying otherwise)

#### Critical Bugs

**Hardcoded Event URL Path**
`components/website/sections/highlight-cards.tsx` line 51:
```tsx
href: `/website/events/${e.slug}`,
```
Should use `resolveHref()` like all other sections. Breaks dynamic routing.

**Hardcoded Footer Logo**
`components/website/sections/footer.tsx` line 42:
```tsx
src="/logo/laubf-logo.svg"
```
Non-LA UBF tenants will show the wrong logo.

**Unsanitized HTML Injection (XSS)**
`components/website/sections/custom-html.tsx` line 21:
```tsx
<div dangerouslySetInnerHTML={{ __html: content.html }} />
```
User-provided HTML rendered without sanitization. Should use DOMPurify.

Also at risk: `daily-bread-feature.tsx` lines 347, 518, 529 — database content rendered via `dangerouslySetInnerHTML`.

#### Missing Error Handling in Server Components
- `all-messages.tsx`, `all-events.tsx`, `all-bible-studies.tsx` use `Promise.all()` without try/catch
- If any DAL call fails, the entire section crashes with no fallback

#### Form Section Has No Submission
`form-section.tsx`:
- Form data is collected in state but **never submitted anywhere**
- Success message shows but no actual action occurs
- Needs API endpoint integration

#### Accessibility Gaps
| Issue | Severity | Files |
|-------|----------|-------|
| Missing alt text validation on images | MEDIUM | Multiple sections |
| Hardcoded SVG icons without aria-label | LOW | directory-list.tsx, others |
| Carousel has no pause for screen readers | MEDIUM | photo-gallery.tsx |
| No `prefers-reduced-motion` support | LOW | media-text.tsx carousel |

#### TypeScript Typing
- Registry uses `React.ComponentType<any>` — loses type safety
- `SectionRenderer` accepts `Record<string, unknown>` for content and resolvedData
- Runtime errors possible if malformed content is passed

#### `dangerouslySetInnerHTML` Usage (6 instances)
| File | Line | Source | Risk |
|------|------|--------|------|
| `custom-html.tsx` | 21 | User input (CMS) | **CRITICAL** |
| `daily-bread-feature.tsx` | 347, 518, 529 | Database content | MEDIUM |
| `photo-gallery.tsx` | 73 | Internal CSS (keyframes) | LOW |
| `page-hero.tsx` | 84 | Internal CSS (keyframes) | LOW |

#### Overall Assessment
The section library is **85% high-quality** with good responsive design, theme variable usage, and architecture. The 40 real implementations are well-structured. Main concerns are the 3 critical bugs and missing error handling in dynamic sections.

---

### 4.3 DAL & API

**Agent: Website Agent 3**

#### DAL Module Quality ✓
All 16 DAL modules:
- ✅ Properly take `churchId` as first parameter
- ✅ No N+1 query patterns
- ✅ Use proper Prisma includes for related data
- ✅ Consistent pagination via `paginationArgs()` helper
- ✅ Zero TODO/FIXME/HACK comments
- ✅ All field references match current Prisma schema

#### Missing Delete Functions (3 modules)
| Module | Missing Function | Pattern Violation |
|--------|-----------------|-------------------|
| `lib/dal/campuses.ts` | `deleteCampus()` | All other modules have delete |
| `lib/dal/ministries.ts` | `deleteMinistry()` | All other modules have delete |
| `lib/dal/daily-bread.ts` | `deleteDailyBread()` | All other modules have delete |

#### Missing API Routes for Reference Data
| Content Type | GET list | POST | GET/:id | PATCH/:id | DELETE/:id |
|--------------|----------|------|---------|-----------|------------|
| Speakers | ✅ | ✅ | ❌ | ❌ | ❌ |
| Series | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ministries | ✅ | ✅ | ❌ | ❌ | ❌ |
| Campuses | ✅ | ✅ | ❌ | ❌ | ❌ |
| Daily Bread | ✅ | ✅ | ❌ | ❌ | ❌ |

DAL functions exist for some of these operations but no API routes expose them.

#### No Authorization Checks in API Routes
- All routes assume any authenticated user can CRUD all content
- No role-based access control (OWNER/ADMIN/EDITOR/VIEWER)
- `getChurchId()` provides implicit multi-tenant isolation but no role checking
- **Acceptable for MVP** but must be addressed before multi-tenant launch

#### Input Validation Is Basic
- Presence checks only (title, slug required)
- No length limits, format validation (email, URL), or enum value checks
- Some routes don't validate enum values (e.g., EventType, EventStatus)

#### Cache Revalidation Is Over-Broad
- Single message update triggers `revalidatePath('/website', 'layout')` — revalidates ALL website pages
- At scale (100+ pages), this becomes expensive
- Acceptable for MVP but should be targeted per-route

#### No HTTP Cache-Control Headers
- Public read endpoints don't set Cache-Control headers
- Browser/CDN cannot cache API responses
- Acceptable for auth-gated routes, but public website data should be cacheable

---

## 5. Cross-Cutting Concerns

### Security
| Issue | Severity | Location |
|-------|----------|----------|
| XSS via `custom-html.tsx` | CRITICAL | `components/website/sections/custom-html.tsx:21` |
| XSS via `daily-bread-feature.tsx` | MEDIUM | `components/website/sections/daily-bread-feature.tsx:347,518,529` |
| Unsanitized custom CSS injection | MEDIUM | `components/website/theme/theme-provider.tsx:38-40` |
| No RBAC on API routes | MEDIUM | All `app/api/v1/` routes |
| No input length/format validation | LOW | All POST/PATCH routes |

### Data Integrity
| Issue | Severity | Location |
|-------|----------|----------|
| Hard deletes for sections (no recovery) | HIGH | `app/api/v1/pages/[pageId]/sections/` |
| Partial saves silently succeed | HIGH | Builder save flow |
| Auto-save failures are silent | HIGH | Builder auto-save |
| Event tags never persist (hardcoded []) | MEDIUM | Event creation flow |
| No content schema validation on section API | MEDIUM | Section PATCH endpoints |

### UX Gaps
| Issue | Severity | Location |
|-------|----------|----------|
| Delete buttons do nothing | HIGH | Messages & events tables |
| 26/42 sections have no editor (JSON fallback) | MEDIUM | Builder section editors |
| No confirmation dialogs for destructive actions | MEDIUM | CMS + Builder |
| 4 dead sidebar links (404) | LOW | CMS sidebar "App" group |
| Page duplicate is a TODO stub | LOW | Builder page list |

---

## 6. Priority Matrix

### P0 — Must Fix (Blocking functionality)

1. ✅ **Wire up delete handlers** for messages and events tables
2. ✅ **Add series CRUD API routes** (update, delete, message assignment)
3. ✅ **Fix media page** — needs real API backend or clear "coming soon" state
4. ✅ **Fix media selector dialog** — events need to pick cover images
5. ✅ **Add error handling to `resolveSectionData()`** — page crashes on DAL errors
6. ✅ **Fix hardcoded navbar hrefs** — `/im-new` and `/member-login` don't exist
7. ✅ **Sanitize `custom-html.tsx`** — XSS vulnerability via user-provided HTML

### P1 — Should Fix (Quality/reliability)

8. ✅ **Add soft-delete for sections** or at minimum a confirmation dialog before delete
9. ✅ **Fix partial save detection** — show which sections failed to save
10. ✅ **Fix auto-save error handling** — show toast on failure
11. ✅ **Fix `highlight-cards.tsx` hardcoded URL** — use `resolveHref()`
12. ✅ **Fix footer logo** — should come from SiteSettings, not hardcoded path
13. ✅ **Add missing DAL delete functions** (campuses, ministries, daily-bread)
14. ✅ **Add missing API routes** for speakers, series, ministries, campuses individual CRUD
15. ✅ **Add `error.tsx` boundary** to `app/website/` for graceful failures
16. ✅ **Fix dashboard Recent Activity links** — use correct id/slug format
17. ✅ **Make CTA label/href CMS-configurable** instead of hardcoded
18. ✅ **Add error handling** to server components (all-messages, all-events, all-bible-studies)

### P2 — Nice to Fix (Polish/optimization)

19. Fix event tags persistence (ContentTag join table)
20. Add confirmation dialogs for all destructive actions
21. Build more section-specific editors (currently 16/42)
22. Fix Quick Links FAB to respect internal vs external links
23. Add content schema validation to section API endpoints
24. Fix dashboard media health card for new churches
25. ~~Remove or build the 4 dead sidebar links~~ ✅ DONE — removed App & Giving groups, moved People under Contents with reduced opacity
26. ✅ Sanitize `daily-bread-feature.tsx` dangerouslySetInnerHTML
27. Sanitize custom CSS in ThemeProvider
28. Add accessibility improvements (aria-labels, prefers-reduced-motion)
29. Implement page duplicate functionality
30. Fix modal editor Display tab (empty in modal, works in drawer)
31. Add HTTP cache headers to public-facing API routes
32. Make cache revalidation more targeted (per-route instead of full layout)
33. Strengthen input validation (length limits, format checks, enum validation)
34. Add RBAC to API routes (before multi-tenant launch)
35. Fix `form-section.tsx` to actually submit form data

---

*Report generated by 9-agent parallel audit on Feb 27, 2026. Each agent read 20–60 files across the codebase.*
