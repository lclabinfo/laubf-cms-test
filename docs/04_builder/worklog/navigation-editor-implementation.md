# Navigation Editor — Implementation Plan

> **Date:** March 18, 2026
> **Prerequisite:** Read `dev-notes/navigation-editor-spec.md` for full requirements.
> **Goal:** Replace the disconnected navbar editor + CMS navigation page with a unified, tree-based navigation editor inside the website builder.

---

## 1. Current System Analysis

### What Exists

| Component | Location | Purpose | Status |
|---|---|---|---|
| `MenuItem` model | `prisma/schema.prisma` | Stores nav items with parent→child hierarchy + groupLabel sections | Solid — minimal changes needed |
| Menu DAL | `lib/dal/menus.ts` | CRUD + reorder for menu items | Works but child reordering not supported |
| Menu API routes | `app/api/v1/menus/[id]/items/` | REST endpoints with auth | Complete but missing child reorder |
| NavbarEditor | `section-editors/navbar-editor.tsx` | Edits visual settings (scroll, color, sticky) only | Settings not persisted (TODO) |
| Navigation admin page | `app/cms/(dashboard)/website/navigation/page.tsx` | Full menu CRUD outside builder | Works but not in builder, no DnD |
| PageTree | `builder/page-tree.tsx` | Shows pages + menus combined in left drawer | Navigation-aware but not an editor |
| WebsiteNavbar | `components/website/layout/website-navbar.tsx` | Public navbar rendering | Production-ready |
| DropdownMenu | `components/website/layout/dropdown-menu.tsx` | Mega-menu dropdowns | Uses groupLabel + featured items |
| QuickLinksFAB | `components/website/layout/quick-links-fab.tsx` | Floating quick links button | Hardcoded to find "Quick Links" group |

### What's Broken / Missing

1. **NavbarEditor only edits visual settings** — no menu structure editing in builder
2. **NavbarSettings not persisted** — `scrollBehavior`, `solidColor`, `sticky` are local-only (TODO at line 640 of builder-shell.tsx)
3. **No child reordering** — DAL only reorders top-level items
4. **No featured card editor UI** — `featuredImage/Title/Description/Href` only settable via seed
5. **No schedule metadata field** — external links can't store "Mon-Fri @ 6 AM" distinctly from description
6. **Quick Links not configurable** — hardcoded extraction from first group named "Quick Links"
7. **Page tree ≠ navigation editor** — PageTree shows pages, not the navigation structure users configure
8. **No hidden pages management** — pages not in nav are just absent, no explicit "hidden" list

### What Does NOT Need to Change

- `Menu` and `MenuItem` Prisma models — sufficient for all requirements
- Menu API routes — functional, just need child reorder endpoint
- Public website rendering (`website-navbar.tsx`, `dropdown-menu.tsx`, `mobile-menu.tsx`) — production-ready
- `QuickLinksFAB` extraction logic — works, just needs to be configurable

---

## 2. Architecture Decisions

### Q: Build inside the builder or as a standalone admin page?

**Inside the builder.** The navigation editor should be a tool in the builder's left sidebar (same rank as Pages, Design, Media). When the user clicks the Navigation tool icon, the left drawer shows the tree-based nav editor. This keeps all website configuration in one place.

The existing CMS navigation page (`/cms/website/navigation/`) should redirect to the builder with the nav tool open, or show a simplified version with a "Open in Builder" link.

### Q: Separate component or replace PageTree?

**Separate component.** PageTree serves a different purpose (page management + navigation). The new NavigationEditor is specifically for configuring the navbar structure. They share data (pages, menus) but have different UX goals.

### Q: Schema changes needed?

**Minimal:**
1. Add `scheduleMeta: String?` to `MenuItem` — for external link schedule display (e.g. "Mon-Fri @ 6 AM"). Currently overloading `description` which is shown differently in the mega-menu.
2. Persist NavbarSettings — either add fields to `SiteSettings` or create a new `NavbarConfig` JSON field.

### Q: How does the editor sync with the public site?

The existing pattern works: API calls → `revalidatePath('/website', 'layout')` → navbar re-renders on public site. The builder's iframe preview should also reflect changes via postMessage.

---

## 3. Implementation Jobs

### Job A: Schema & API Layer (~3 hours)

**What:** Database migration + DAL + API updates for the navigation editor.

**Tasks:**
1. Add `scheduleMeta: String?` to `MenuItem` in Prisma schema
2. Add navbar settings fields to `SiteSettings` (`navScrollBehavior`, `navSolidColor`, `navSticky`)
3. Run `npx prisma migrate dev --name add-nav-editor-fields`
4. Add `reorderChildMenuItems(churchId, parentId, itemIds)` to `lib/dal/menus.ts` — supports reordering children within a parent
5. Add `PUT /api/v1/menus/[id]/items/[itemId]/children` API route for child reordering
6. Add `getNavbarSettings(churchId)` and `updateNavbarSettings(churchId, data)` to `lib/dal/site-settings.ts`
7. Add `GET/PATCH /api/v1/site-settings/navbar` API route for navbar settings
8. Update seed data: add `scheduleMeta` to external link items (move schedule info from description)

### Job B: Navigation Tree Component (~5 hours)

**What:** The core tree UI component — `components/cms/website/builder/navigation-editor.tsx`.

**Reference:** The attached screenshot showing the dark-background tree panel with:
- Collapsible top-level items (drag handle + chevron + icon + label + badge)
- Section headings (uppercase, muted, with "..." menu)
- Items within sections (drag handle + icon + label + metadata)
- "+ Add item" and "+ Add section" links
- Landing page indicator for page-dropdown items

**Tasks:**
1. Build `NavigationEditor` component — the main tree panel
2. Build `NavTopLevelItem` — collapsible top-level item (folder or page+dropdown)
3. Build `NavSection` — section heading within a dropdown (groupLabel-based)
4. Build `NavItem` — individual item within a section (page, external link, featured)
5. Build `NavCTAConfig` — CTA button configuration (separate from tree)
6. Build `NavHiddenPages` — hidden pages list (at bottom of panel)
7. Each item shows type-appropriate icon, right-aligned badge, and inline metadata
8. Support expand/collapse for dropdowns
9. Wire all components to the menu API for persistence

**DnD requirements:**
- Top-level items: drag to reorder (horizontal order in navbar)
- Sections within a dropdown: drag to reorder
- Items within a section: drag to reorder
- Items can be dragged between sections (changes groupLabel)
- Use `@dnd-kit/core` + `@dnd-kit/sortable` (already installed)

### Job C: Item Editor Forms (~3 hours)

**What:** Right-drawer forms for editing individual nav items.

**Tasks:**
1. Build `NavItemEditor` — edit form for a single nav item (opens in right drawer when item is clicked)
   - Common fields: label, description
   - Page items: page selector (dropdown of all pages)
   - External links: URL input, openInNewTab toggle, scheduleMeta input
   - Featured items: image picker, featured title, featured description, featured href
2. Build `NavTopLevelEditor` — edit form for top-level items
   - Type toggle: folder-dropdown ↔ page-dropdown
   - If page-dropdown: page selector for landing page
3. Build `NavSectionEditor` — edit section heading (rename, delete, move)
4. Build `NavSettingsEditor` — navbar visual settings (scroll behavior, color, sticky)
   - Migrate existing NavbarEditor fields
   - Wire to new SiteSettings API for persistence
5. All forms use shared editor primitives (`EditorInput`, `EditorSelect`, `EditorToggle`, `ImagePickerField`)

### Job D: Builder Integration (~3 hours)

**What:** Wire the navigation editor into the builder shell.

**Tasks:**
1. Add "Navigation" tool to `BuilderSidebar` (compass or navigation icon)
2. When Navigation tool is active, show `NavigationEditor` in the left drawer
3. When a nav item is clicked for editing, show `NavItemEditor` in the right drawer
4. Wire navbar settings persistence — replace local-only `NavbarSettings` state with API calls
5. Update `BuilderShell` state: add `editingNavItemId`, remove old `navbarSettings` local state
6. Update builder server component (`[pageId]/page.tsx`) to fetch navbar settings from SiteSettings
7. After nav changes, send `UPDATE_NAVBAR` postMessage to iframe preview so changes are visible immediately
8. Refresh public site navbar via `revalidatePath`

### Job E: Public Website Sync (~2 hours)

**What:** Ensure public website rendering handles all new data correctly.

**Tasks:**
1. Update `WebsiteNavbar` to read `scheduleMeta` for external link display (if not using description)
2. Update `DropdownMenu` to handle any new data patterns from the editor
3. Verify `QuickLinksFAB` still works with edited nav structure
4. Verify `MobileMenu` renders correctly after nav edits
5. Test: edit nav in builder → save → check public site matches
6. Handle edge cases: empty dropdowns, single-item sections, featured-only sections

### Job F: Migration & Seed Update (~1 hour)

**What:** Update seed data to use new fields and verify backward compatibility.

**Tasks:**
1. Update `prisma/seed.mts` to use `scheduleMeta` for external links
2. Verify existing menu data renders correctly after migration (no breaking changes)
3. Test fresh seed: `npx prisma migrate reset` → seed → verify navbar

---

## 4. Agent Team Deployment Plan

### Recommended Team Structure

```
Phase 1 (sequential — schema must come first):
  Agent A (schema-api): Job A                          ~3 hours

Phase 2 (parallel — after schema is ready):
  Agent B (tree-component): Job B                      ~5 hours
  Agent C (item-editors): Job C                        ~3 hours

Phase 3 (sequential — needs B and C):
  Agent D (integration): Job D                         ~3 hours

Phase 4 (parallel — after integration):
  Agent E (public-sync): Job E                         ~2 hours
  Agent F (seed-migration): Job F                      ~1 hour

Phase 5:
  Agent G (cross-audit): Full review                   ~1 hour
```

### Agent Descriptions

**Agent A: `nav-schema-api`**
- **Scope:** Prisma schema, migration, DAL, API routes
- **Context needed:** Current schema (`prisma/schema.prisma`), DAL (`lib/dal/menus.ts`, `lib/dal/site-settings.ts`), API routes (`app/api/v1/menus/`)
- **Output:** New migration applied, child reorder DAL/API, navbar settings DAL/API
- **Must complete before:** Agents B, C

**Agent B: `nav-tree-component`**
- **Scope:** The main NavigationEditor tree component
- **Context needed:** Navigation spec (`dev-notes/navigation-editor-spec.md`), reference screenshot, existing PageTree (`page-tree.tsx`), DnD patterns from `sortable-section.tsx`
- **Output:** `components/cms/website/builder/navigation-editor.tsx` + sub-components
- **Critical:** This is the largest and most complex piece. Must match the reference UI exactly.
- **Can run parallel with:** Agent C

**Agent C: `nav-item-editors`**
- **Scope:** Right-drawer edit forms for nav items
- **Context needed:** Navigation spec, shared editor primitives (`section-editors/shared/`), existing NavbarEditor
- **Output:** `NavItemEditor`, `NavTopLevelEditor`, `NavSectionEditor`, `NavSettingsEditor`
- **Can run parallel with:** Agent B

**Agent D: `nav-builder-integration`**
- **Scope:** Wire everything into BuilderShell + BuilderSidebar + BuilderDrawer
- **Context needed:** `builder-shell.tsx`, `builder-sidebar.tsx`, `builder-drawer.tsx`, `builder-canvas.tsx`, `[pageId]/page.tsx`
- **Output:** Navigation tool in sidebar, drawer routing, right drawer routing, iframe sync
- **Depends on:** Agents B and C completing

**Agent E: `nav-public-sync`**
- **Scope:** Verify and update public website rendering
- **Context needed:** `website-navbar.tsx`, `dropdown-menu.tsx`, `mobile-menu.tsx`, `quick-links-fab.tsx`
- **Output:** Updated components if needed, verified rendering
- **Can run parallel with:** Agent F

**Agent F: `nav-seed-migration`**
- **Scope:** Update seed data, test migration
- **Context needed:** `prisma/seed.mts`, new schema
- **Output:** Updated seed with `scheduleMeta`, verified fresh seed works

**Agent G: `nav-cross-audit`**
- **Scope:** Full review of all changes
- **Checklist:** TypeScript errors, ESLint, nav structure renders correctly, DnD works, API persistence works, iframe preview updates, public site matches
- **Runs last**

---

## 5. Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| DnD complexity (nested sortable contexts) | Use `@dnd-kit` with separate `SortableContext` per level. Reference existing section DnD in builder. |
| Breaking existing navbar rendering | Zero changes to MenuItem model fields. New `scheduleMeta` field is additive. Public components handle missing fields gracefully. |
| Builder state complexity | Navigation editor state is self-contained — doesn't mix with section editing state. Separate `editingNavItemId` from `editingSectionId`. |
| iframe preview sync | Reuse existing postMessage protocol. Add `UPDATE_MENU` message type. |

---

## 6. Verification Checklist (for Agent G)

- [ ] All 7 item types render with correct icons and badges
- [ ] Top-level drag reorder works and persists
- [ ] Section drag reorder works and persists
- [ ] Item drag reorder within sections works and persists
- [ ] Item drag between sections works (changes groupLabel)
- [ ] Add/rename/delete items, sections, top-level items all persist via API
- [ ] Toggle folder-dropdown ↔ page-dropdown works
- [ ] CTA config edits persist to SiteSettings
- [ ] Navbar visual settings (scroll, color, sticky) persist to SiteSettings
- [ ] Public website navbar reflects all changes after save
- [ ] Mobile menu reflects changes
- [ ] QuickLinksFAB reflects changes
- [ ] iframe preview updates when nav changes
- [ ] Hidden pages section works
- [ ] External links show scheduleMeta
- [ ] Featured items show image/title/description
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
