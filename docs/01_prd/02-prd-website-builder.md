# PRD: Website Builder & Template System

> Living document. Update as features are implemented or requirements evolve.
> See also: [Primary User Profile](./primary-user-profile.md) | [CMS PRD](./prd-cms.md)

---

## Current Implementation Status

> **Last updated**: February 24, 2026

### Summary

The Website Builder is being implemented as a **full-screen visual builder** with a live canvas preview, replacing the initial list-based page editor (Phase C v1). The builder renders actual section components in a WYSIWYG canvas and provides structured editing via modals.

### What Exists Today

| Area | Status | Notes |
|---|---|---|
| **Database models** | COMPLETE | Page, PageSection, Menu, MenuItem, Theme, ThemeCustomization, SiteSettings, Domain |
| **API routes (all CRUD)** | COMPLETE | 20 endpoints for pages, sections, menus, theme, domains, site settings |
| **DAL modules** | COMPLETE | pages, menus, theme, domains, site-settings with read/write functions |
| **Seed data** | COMPLETE | 14 pages with sections, 2 menus, theme, site settings (LA UBF) |
| **Section components** | COMPLETE (40/42) | 40 real implementations, 2 intentional placeholders (NAVBAR, DAILY_BREAD_FEATURE) |
| **Section registry** | COMPLETE | Maps SectionType enum to React components |
| **Public website rendering** | COMPLETE | Catch-all route, ThemeProvider, FontLoader, SectionWrapper |
| **CMS page editor (v1)** | COMPLETE | List-based editor at `/cms/website/pages/[slug]` with section picker, JSON editor, move up/down |
| **Theme customizer (v1)** | COMPLETE | Color pickers, font selector, font size, custom CSS |
| **Navigation editor (v1)** | COMPLETE | Menu items CRUD with hierarchy, reorder |
| **Domain manager** | COMPLETE | Custom domain add/remove, DNS instructions |
| **Site settings** | COMPLETE | General, logo, contact, social, service times, SEO, maintenance |
| **Builder layout** | IN PROGRESS | Full-screen layout at `app/cms/website/builder/layout.tsx` with auth check |
| **Builder entry page** | IN PROGRESS | Redirect logic at `app/cms/website/builder/page.tsx` |
| **Builder [pageId] route** | NOT STARTED | Data loading + BuilderShell |
| **Builder components** | NOT STARTED | Shell, sidebar, drawer, canvas, topbar, section picker, editors |
| **Drag-and-drop** | NOT STARTED | @dnd-kit installed but not wired |

### Builder Approach

The full-screen builder follows the Figma prototype (`figma-cms-2:11:26/`) and is modeled after Shopify's section-based editor:

- **Full-screen experience** -- hides CMS sidebar, dedicated builder layout at `app/cms/website/builder/`
- **Live canvas preview** -- renders actual `SectionRenderer` components wrapped in interactive chrome (selection, hover, floating toolbar)
- **Section-based editing** -- sections are the atomic unit; admins compose pages from 42 section types across 7 categories
- **Modal editors** -- section content is edited in modal forms, not inline on the canvas
- **Template-governed** -- CMS content pages (messages, events, etc.) have protected section structures
- **Device preview** -- desktop/tablet/mobile viewport switching in the canvas

### Implementation Plan Reference

The detailed implementation plan with 9 phases and 48 tasks is at:
- **Master plan**: `docs/00_dev-notes/website-builder-plan.md`
- **Status tracker**: `docs/00_dev-notes/website-builder-status.md`
- **Architecture doc**: `docs/00_dev-notes/website-builder-plan.md` (Architecture section + Key Design Decisions)

### Priority Legend

- **[P0]** -- MVP. Critical for launch.
- **[P1]** -- Important for a delightful experience.
- **[P2]** -- Nice-to-have / future enhancement.

### Design Principles

1. **Template-governed by default.** CMS content types (sermons, events, etc.) have dedicated template-driven pages that admins cannot accidentally break.
2. **Safe customization.** Customization is gated behind intentional actions -- admins opt in to design changes rather than stumbling into them.
3. **Section-based editing, not pixel-level.** Custom pages use predefined blocks (text, media, cards, etc.) that snap together without layout anxiety.
4. **Progressive complexity.** Start with a template. Add custom pages when ready. Never require it.

---

## 1. Templates & Themes

### 1.1 Template Selection

- [P0] Admins can choose from a curated library of church website templates during onboarding. **[PLANNED -- Phase 4.5 AddPageModal template gallery]**
- [P0] Each template includes pre-configured pages for core content types (home, sermons, events, ministries, about, contact). **[PARTIAL -- seed data creates default pages, template gallery not built]**
- [P0] Templates are fully functional out of the box -- a church can launch with only content changes, zero design decisions. **[PARTIAL -- seed data provides working defaults]**
- [P1] Admins can preview templates with their own church data before committing.
- [P1] Admins can switch templates after launch without losing content (content is decoupled from presentation).
- [P2] Community or premium template marketplace.

### 1.2 Theme Customization

- [P0] Admins can customize the site's global color palette from predefined presets. **[IMPLEMENTED -- v1 theme customizer at `/cms/website/theme`]**
- [P0] Admins can upload and set a church logo (appears in header, favicon, etc.). **[IMPLEMENTED -- site settings at `/cms/website/settings`]**
- [P0] Admins can select from curated font pairings (heading + body). **[IMPLEMENTED -- v1 theme customizer]**
- [P1] Admins can customize individual color tokens (primary, secondary, accent) beyond presets. **[IMPLEMENTED -- v1 theme customizer]**
- [P1] Admins can toggle between light and dark mode defaults.
- [P2] Admins can create and save custom theme presets.

### 1.3 Global Elements

- [P0] Admins can configure the site header: logo, navigation links, and optional CTA button. **[IMPLEMENTED -- navigation editor at `/cms/website/navigation`]**
- [P0] Admins can configure the site footer: church info, links, social media icons, copyright. **[IMPLEMENTED -- navigation editor + site settings]**
- [P0] Header and footer update automatically when church profile data changes (address, phone, service times). **[IMPLEMENTED -- data-driven from DB]**
- [P1] Admins can choose from multiple header/footer layout variants.
- [P2] Custom header/footer HTML or embed support. **[PARTIAL -- CUSTOM_HTML section type exists]**

---

## 2. Page Management

### 2.1 Template-Governed Pages (CMS Content Types)

- [P0] Sermon, Bible study, event, ministry, announcement, and prayer pages are generated automatically from CMS data. **[IMPLEMENTED -- dynamic sections auto-populate from DB]**
- [P0] These pages cannot be accidentally broken by admins -- layout is template-driven. **[PARTIAL -- pageType field exists, enforcement in builder not yet built]**
- [P0] Admins can control visibility (show/hide a content type's page from navigation). **[IMPLEMENTED -- page publish/unpublish, section visibility toggle]**
- [P1] Admins can choose from layout variants per content type (e.g., sermon list as grid vs. list view).
- [P1] Admins can reorder how content is displayed within each page's template (e.g., featured sermon position). **[IMPLEMENTED -- section reordering in v1 editor]**
- [P2] Per-content-type template overrides (advanced).

### 2.2 Custom Pages

- [P0] Admins can create new custom pages (e.g., "New Here?", "Give", "Volunteer"). **[IMPLEMENTED -- create page in v1 pages manager]**
- [P0] Custom pages use a section-based block editor -- admins add, remove, and reorder predefined blocks. **[IMPLEMENTED -- v1 editor; full builder IN PROGRESS]**
- [P0] Available blocks for MVP: **[IMPLEMENTED -- 42 section types exceed this list]**
  - Rich text (heading + body) -- STATEMENT, ABOUT_DESCRIPTION
  - Image / image gallery -- PHOTO_GALLERY, MEDIA_GRID
  - Video embed (YouTube) -- SPOTLIGHT_MEDIA, ALL_VIDEOS
  - Call-to-action button -- CTA_BANNER
  - Card grid (linked cards with image, title, description) -- ACTION_CARD_GRID, HIGHLIGHT_CARDS
  - Contact form -- FORM_SECTION
  - Embed / iframe -- CUSTOM_EMBED, CUSTOM_HTML
- [P0] Each block has constrained styling options (alignment, spacing) -- no free-form positioning. **[IMPLEMENTED -- colorScheme, paddingY, containerWidth per section]**
- [P1] Additional blocks: **[IMPLEMENTED -- all exist as section types]**
  - Testimonial -- QUOTE_BANNER
  - FAQ accordion -- FAQ_SECTION
  - Staff/leadership grid -- MEET_TEAM
  - Map embed -- LOCATION_DETAIL
  - Countdown timer
  - Donation / giving widget
- [P1] Admins can save a custom page layout as a reusable template.
- [P2] Admins can duplicate existing custom pages. **[PLANNED -- Phase 4.4 context menu]**
- [P2] Block-level visibility toggles (show/hide without deleting). **[IMPLEMENTED -- `visible` field on PageSection]**

### 2.3 Page Structure & Navigation

- [P0] Admins can view all site pages in a centralized page list. **[IMPLEMENTED -- DataTable at `/cms/website/pages`]**
- [P0] Admins can reorder pages in the site navigation. **[IMPLEMENTED -- menu item reordering in navigation editor]**
- [P0] Admins can nest pages under parent pages (one level of nesting). **[IMPLEMENTED -- parentId on Page model, menu item hierarchy]**
- [P0] Admins can set a page as the homepage. **[IMPLEMENTED -- isHomepage toggle in page editor]**
- [P0] Admins can add external links to the navigation menu. **[IMPLEMENTED -- isExternal flag on MenuItem]**
- [P1] Admins can manage multiple navigation menus (e.g., header nav, footer nav). **[IMPLEMENTED -- Header + Footer menus with tab UI]**
- [P1] Admins can set custom URL slugs for pages. **[IMPLEMENTED -- editable slug in page metadata]**
- [P2] Admins can create navigation mega-menus or grouped dropdowns. **[IMPLEMENTED -- groupLabel, featured card fields on MenuItem]**

---

## 3. Publishing & Preview

### 3.1 Preview

- [P0] Admins can preview any page (template-governed or custom) before publishing. **[PARTIAL -- public website renders all pages; builder canvas will show live preview]**
- [P0] Preview shows the page as it would appear to a public visitor. **[PLANNED -- builder canvas uses actual SectionRenderer components]**
- [P1] Admins can preview on different device sizes (desktop, tablet, mobile). **[PLANNED -- Phase 2.7 DevicePreview in builder topbar]**
- [P2] Admins can share preview links with other team members before publishing.

### 3.2 Publishing Workflow

- [P0] Custom pages support draft and published states. **[IMPLEMENTED -- isPublished on Page model]**
- [P0] Admins can unpublish a page without deleting it. **[IMPLEMENTED -- publish/unpublish in page editor]**
- [P0] Publishing a page immediately makes it visible on the live site and in navigation. **[IMPLEMENTED -- catch-all route filters by isPublished]**
- [P1] Admins can schedule page publication for a future date.
- [P1] Admins receive a confirmation prompt before publishing changes that affect navigation or the homepage.
- [P2] Version history -- admins can view and revert to previous page versions.

---

## 4. Domain & SEO

### 4.1 Domain Management

- [P0] Each church site is accessible on a default subdomain (e.g., `churchname.lclab.io`). **[PLANNED -- requires multi-tenant middleware Phase D]**
- [P0] Admins can connect a custom domain with guided setup instructions. **[IMPLEMENTED -- domain manager at `/cms/website/domains`]**
- [P0] SSL certificates are provisioned automatically for custom domains. **[PLANNED -- requires Caddy On-Demand TLS in Phase F]**
- [P1] Admins can manage DNS records from within the CMS (or view clear instructions per registrar). **[IMPLEMENTED -- DNS instructions in domain manager]**
- [P2] Support for multiple domains / domain redirects.

### 4.2 SEO Basics

- [P0] Each page has auto-generated meta titles and descriptions based on content. **[IMPLEMENTED -- generateMetadata in catch-all route]**
- [P0] The site generates a sitemap automatically.
- [P0] Open Graph tags are generated automatically for social sharing previews. **[IMPLEMENTED -- OG tags from page metadata]**
- [P1] Admins can customize meta titles and descriptions per page. **[IMPLEMENTED -- metaTitle, metaDescription, noIndex on Page model]**
- [P1] Admins can set a custom Open Graph image per page. **[IMPLEMENTED -- ogImageUrl on Page model]**
- [P1] The system generates structured data (JSON-LD) for church information (LocalBusiness, Event schemas).
- [P2] Admins can manage 301 redirects.
- [P2] SEO audit / content health score per page.

---

## 5. Homepage

### 5.1 Homepage Layout

- [P0] The homepage is template-driven with a curated layout that auto-populates from CMS content: **[IMPLEMENTED -- seeded with 10 sections]**
  - Hero section (church name, tagline, CTA) -- HERO_BANNER
  - Latest sermon -- SPOTLIGHT_MEDIA (dataSource: latest-message)
  - Upcoming events -- HIGHLIGHT_CARDS (dataSource: featured-events)
  - Recent announcements -- CTA_BANNER
  - Quick links (new here, give, connect) -- ACTION_CARD_GRID
- [P0] Admins can edit hero content (tagline, background image, CTA text/link). **[IMPLEMENTED -- v1 section editor (JSON); structured form in builder Phase 5]**
- [P0] Admins can show/hide homepage sections. **[IMPLEMENTED -- visible toggle on PageSection]**
- [P1] Admins can reorder homepage sections. **[IMPLEMENTED -- section reordering in v1 editor; drag-and-drop in builder Phase 2]**
- [P1] Admins can choose from multiple hero layout variants (image background, video background, split layout). **[PARTIAL -- HERO_BANNER, PAGE_HERO, TEXT_IMAGE_HERO exist as separate section types]**
- [P2] Admins can add custom blocks to the homepage alongside auto-populated sections. **[IMPLEMENTED -- section picker allows adding any section type]**

---

## 6. Full-Screen Website Builder (New)

> This section describes the full-screen builder that supersedes the v1 list-based page editor. See `docs/00_dev-notes/website-builder-plan.md` for the detailed implementation plan.

### 6.1 Builder Shell

- [P0] Full-screen editing experience that hides the CMS sidebar.
- [P0] Top bar with page title, device preview toggle, save button, publish/unpublish button.
- [P0] Left sidebar with tool icons: Add Section, Pages & Menu, Design, Media.
- [P0] Animated left drawer that opens/closes for each tool.
- [P0] Central canvas area rendering live section previews.
- [P0] Back button to return to CMS pages list.

### 6.2 Canvas & Section Interaction

- [P0] Canvas renders actual section components via SectionRenderer (WYSIWYG fidelity).
- [P0] Section hover state: dashed blue border.
- [P0] Section selected state: solid blue border with shadow.
- [P0] Floating toolbar on selected section: drag handle, edit, delete.
- [P0] Plus buttons between sections for adding new sections.
- [P0] Drag-and-drop section reordering via @dnd-kit.
- [P1] Device preview modes: desktop (100%), tablet (768px), mobile (375px).

### 6.3 Section Editors

- [P0] Modal-based editing for each section type (replaces raw JSON editor).
- [P0] Structured forms with appropriate field types per section category.
- [P0] Display settings tab: color scheme, padding, container width, animations, visibility.
- [P0] Save to API with optimistic canvas update.

### 6.4 Page Management in Builder

- [P0] Page tree in left drawer showing all pages with status badges.
- [P0] Click page to switch canvas context.
- [P0] Add page wizard (3-step: type, template, configure).
- [P0] Page settings modal (title, slug, SEO, layout, homepage toggle).
- [P1] Page duplication and deletion from context menu.
- [P1] Page reordering in tree.

### 6.5 Design Panel

- [P1] Typography controls: font pairings, base font size.
- [P1] Color controls: primary, accent, background tone.
- [P1] Spacing controls: scale selector, corner radius.
- [P1] Live preview of theme changes on canvas.

---

## Non-goals (Website Builder)

- We are **not** building a fully free-form, pixel-level website builder.
- We are **not** exposing CSS, grid, or breakpoint controls.
- We are **not** requiring admins to understand templates, components, or design tokens.
- Template-governed pages (sermons, events, etc.) remain template-governed -- admins customize content, not layout.
- We are **not** building inline editing on the canvas -- section content is edited in modal forms.
