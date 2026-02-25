# Website Admin CMS UI — Implementation Tracker

> **Created**: Feb 24, 2026
> **Last Updated**: Feb 24, 2026
> **Status**: COMPLETE

## Overview

This document tracks the implementation of all website-related admin CMS pages under `/cms/website/`. The backend infrastructure (database models, DAL functions, seed data) is complete. This work implements the admin UI and any missing API routes.

---

## Priority Order (P0 → P1)

### Phase 1: API Routes (Foundation) — P0
All admin pages need API routes to function.

| # | Route | Method | Purpose | Status |
|---|-------|--------|---------|--------|
| 1.1 | `/api/v1/pages` | GET | List all pages | ✅ DONE |
| 1.2 | `/api/v1/pages` | POST | Create page | ✅ DONE |
| 1.3 | `/api/v1/pages/[slug]` | GET | Get page + sections | ✅ DONE |
| 1.4 | `/api/v1/pages/[slug]` | PATCH | Update page metadata | ✅ DONE |
| 1.5 | `/api/v1/pages/[slug]` | DELETE | Soft-delete page | ✅ DONE |
| 1.6 | `/api/v1/pages/[slug]/sections` | POST | Add section | ✅ DONE |
| 1.7 | `/api/v1/pages/[slug]/sections` | PUT | Reorder sections | ✅ DONE |
| 1.8 | `/api/v1/pages/[slug]/sections/[id]` | PATCH | Update section | ✅ DONE |
| 1.9 | `/api/v1/pages/[slug]/sections/[id]` | DELETE | Remove section | ✅ DONE |
| 1.10 | `/api/v1/theme` | GET | Get theme + customization | ✅ DONE |
| 1.11 | `/api/v1/theme` | PATCH | Update theme customization | ✅ DONE |
| 1.12 | `/api/v1/menus` | GET | List all menus | ✅ DONE |
| 1.13 | `/api/v1/menus/[id]/items` | POST | Add menu item | ✅ DONE |
| 1.14 | `/api/v1/menus/[id]/items/[itemId]` | PATCH | Update menu item | ✅ DONE |
| 1.15 | `/api/v1/menus/[id]/items/[itemId]` | DELETE | Delete menu item | ✅ DONE |
| 1.16 | `/api/v1/menus/[id]/items` | PUT | Reorder items | ✅ DONE |
| 1.17 | `/api/v1/domains` | GET | List custom domains | ✅ DONE |
| 1.18 | `/api/v1/domains` | POST | Add custom domain | ✅ DONE |
| 1.19 | `/api/v1/domains/[id]` | DELETE | Remove custom domain | ✅ DONE |
| 1.20 | `/api/v1/site-settings` | GET/PATCH | Site settings | ✅ DONE |

### Phase 2: Pages Manager — P0
The core page management interface.

| # | Feature | Status |
|---|---------|--------|
| 2.1 | Pages list (DataTable with title, slug, type, status, last modified) | ✅ DONE |
| 2.2 | Create page dialog/form (title, slug, layout, page type) | ✅ DONE |
| 2.3 | Edit page metadata (title, slug, SEO fields, homepage toggle) | ✅ DONE |
| 2.4 | Publish/unpublish toggle | ✅ DONE |
| 2.5 | Delete page (soft delete with confirmation) | ✅ DONE |
| 2.6 | Set as homepage action | ✅ DONE |
| 2.7 | Page sections list (ordered, with section type labels) | ✅ DONE |
| 2.8 | Add section to page (section type gallery/picker) | ✅ DONE |
| 2.9 | Reorder sections (move up/down buttons) | ✅ DONE |
| 2.10 | Remove section from page | ✅ DONE |
| 2.11 | Edit section display settings (colorScheme, paddingY, containerWidth, visible, animations) | ✅ DONE |
| 2.12 | Section content editor (basic JSONB editing for now) | ✅ DONE |

### Phase 3: Site Settings — P0
Global church website configuration.

| # | Feature | Status |
|---|---------|--------|
| 3.1 | General settings (site name, tagline, description) | ✅ DONE |
| 3.2 | Logo & favicon upload/preview | ✅ DONE |
| 3.3 | Contact info (email, phone, address) | ✅ DONE |
| 3.4 | Social media links (7 platforms) | ✅ DONE |
| 3.5 | Service times editor (structured JSON) | ✅ DONE |
| 3.6 | Feature toggles (enable/disable site features) | ✅ DONE |
| 3.7 | SEO settings (analytics IDs) | ✅ DONE |
| 3.8 | Maintenance mode toggle | ✅ DONE |

### Phase 4: Theme Customizer — P0
Visual customization interface.

| # | Feature | Status |
|---|---------|--------|
| 4.1 | Color palette editor (primary, secondary, accent colors) | ✅ DONE |
| 4.2 | Font selector (heading + body font pairings) | ✅ DONE |
| 4.3 | Font size base adjustment | ✅ DONE |
| 4.4 | Custom CSS editor (advanced, collapsible) | ✅ DONE |
| 4.5 | Save/reset customization | ✅ DONE |

### Phase 5: Navigation Editor — P1
Menu management interface.

| # | Feature | Status |
|---|---------|--------|
| 5.1 | Menu list (header, footer, mobile) with tabs | ✅ DONE |
| 5.2 | Menu items list (ordered, with hierarchy) | ✅ DONE |
| 5.3 | Add menu item (label, href, icon, external flag) | ✅ DONE |
| 5.4 | Edit menu item inline or modal | ✅ DONE |
| 5.5 | Delete menu item | ✅ DONE |
| 5.6 | Reorder menu items (move up/down) | ✅ DONE |
| 5.7 | Nested items (parent-child relationship) | ✅ DONE |

### Phase 6: Domain Manager — P1
Custom domain setup.

| # | Feature | Status |
|---|---------|--------|
| 6.1 | Show default subdomain (read-only) | ✅ DONE |
| 6.2 | Add custom domain form | ✅ DONE |
| 6.3 | DNS verification instructions | ✅ DONE |
| 6.4 | Verification status display | ✅ DONE |
| 6.5 | Delete custom domain | ✅ DONE |

---

## Architecture Decisions

- **State management**: Client-side fetching via `fetch()` + `useState`/`useEffect` (same pattern as events)
- **Forms**: shadcn/ui components (Input, Select, Switch, etc.)
- **Tables**: TanStack React Table (same as events, messages)
- **Section editor**: JSON editor for section content (v1), rich form builder (future)
- **Color picker**: Use CSS `input[type=color]` with preview swatch (simple, no external lib)
- **Font selector**: Curated dropdown of Google Font pairings (no autocomplete needed for v1)
- **Menu editor**: Simple list with move up/down buttons (v1), drag-drop (future)
- **API pattern**: Follow existing `/api/v1/events/` pattern exactly

## Files Created/Modified

### API Routes
- `app/api/v1/pages/route.ts` — GET, POST
- `app/api/v1/pages/[slug]/route.ts` — GET, PATCH, DELETE
- `app/api/v1/pages/[slug]/sections/route.ts` — POST, PUT
- `app/api/v1/pages/[slug]/sections/[id]/route.ts` — PATCH, DELETE
- `app/api/v1/theme/route.ts` — GET, PATCH
- `app/api/v1/menus/route.ts` — GET
- `app/api/v1/menus/[id]/items/route.ts` — POST, PUT
- `app/api/v1/menus/[id]/items/[itemId]/route.ts` — PATCH, DELETE
- `app/api/v1/domains/route.ts` — GET, POST
- `app/api/v1/domains/[id]/route.ts` — DELETE

### CMS Pages
- `app/cms/(dashboard)/website/pages/page.tsx` — Pages manager
- `app/cms/(dashboard)/website/pages/[slug]/page.tsx` — Page editor (sections)
- `app/cms/(dashboard)/website/theme/page.tsx` — Theme customizer
- `app/cms/(dashboard)/website/navigation/page.tsx` — Navigation editor
- `app/cms/(dashboard)/website/domains/page.tsx` — Domain manager
- `app/cms/(dashboard)/website/settings/page.tsx` — Site settings

### Components
- `components/cms/website/pages/section-picker-dialog.tsx` — Section type gallery with 7 categories
- `components/cms/website/pages/section-editor-dialog.tsx` — Display settings + JSON content editor

### DAL Updates
- `lib/dal/pages.ts` — Added getPageForAdmin, createPageSection, updatePageSection, deletePageSection, reorderPageSections
- `lib/dal/menus.ts` — Added getMenuWithItems, createMenuItem, updateMenuItem, deleteMenuItem, reorderMenuItems
- `lib/dal/theme.ts` — Added updateThemeCustomization
- `lib/dal/domains.ts` — New file: getDomains, createDomain, deleteDomain

### Sidebar Navigation Update
- Added "Settings" under Website group in `components/cms/app-sidebar.tsx`

---

## Future Improvements (v2)

- Rich form fields per section type (replace JSON textarea with structured forms)
- Drag-drop for section reordering (currently move up/down buttons)
- Drag-drop for menu item reordering
- Live theme preview panel
- DNS verification polling endpoint for domains
- Template picker for theme selection
- Image upload integration for site settings (logo, favicon)
