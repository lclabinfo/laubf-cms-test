# PRD: Website Builder & Template System

> Living document. Update as features are implemented or requirements evolve.
> See also: [Primary User Profile](./primary-user-profile.md) | [CMS PRD](./prd-cms.md)

---

## Overview

The Website Builder gives church admins control over how their website looks and is structured — without requiring design expertise. It provides a **template-first** approach: admins choose from curated templates, customize within safe boundaries, and manage page structure through a guided interface.

This is intentionally **not** a free-form page builder. The system separates everyday content work (handled in the CMS) from design/layout decisions (handled here). Admins should rarely need to touch the Website Builder after initial setup, except for occasional page additions or theme adjustments.

### Design Principles

1. **Template-governed by default.** CMS content types (sermons, events, etc.) have dedicated template-driven pages that admins cannot accidentally break.
2. **Safe customization.** Customization is gated behind intentional actions — admins opt in to design changes rather than stumbling into them.
3. **Section-based editing, not pixel-level.** Custom pages use predefined blocks (text, media, cards, etc.) that snap together without layout anxiety.
4. **Progressive complexity.** Start with a template. Add custom pages when ready. Never require it.

### Priority Legend

- **[P0]** — MVP. Critical for launch.
- **[P1]** — Important for a delightful experience.
- **[P2]** — Nice-to-have / future enhancement.

---

## 1. Templates & Themes

### 1.1 Template Selection

- [P0] Admins can choose from a curated library of church website templates during onboarding.
- [P0] Each template includes pre-configured pages for core content types (home, sermons, events, ministries, about, contact).
- [P0] Templates are fully functional out of the box — a church can launch with only content changes, zero design decisions.
- [P1] Admins can preview templates with their own church data before committing.
- [P1] Admins can switch templates after launch without losing content (content is decoupled from presentation).
- [P2] Community or premium template marketplace.

### 1.2 Theme Customization

- [P0] Admins can customize the site's global color palette from predefined presets.
- [P0] Admins can upload and set a church logo (appears in header, favicon, etc.).
- [P0] Admins can select from curated font pairings (heading + body).
- [P1] Admins can customize individual color tokens (primary, secondary, accent) beyond presets.
- [P1] Admins can toggle between light and dark mode defaults.
- [P2] Admins can create and save custom theme presets.

### 1.3 Global Elements

- [P0] Admins can configure the site header: logo, navigation links, and optional CTA button.
- [P0] Admins can configure the site footer: church info, links, social media icons, copyright.
- [P0] Header and footer update automatically when church profile data changes (address, phone, service times).
- [P1] Admins can choose from multiple header/footer layout variants.
- [P2] Custom header/footer HTML or embed support.

---

## 2. Page Management

### 2.1 Template-Governed Pages (CMS Content Types)

- [P0] Sermon, Bible study, event, ministry, announcement, and prayer pages are generated automatically from CMS data.
- [P0] These pages cannot be accidentally broken by admins — layout is template-driven.
- [P0] Admins can control visibility (show/hide a content type's page from navigation).
- [P1] Admins can choose from layout variants per content type (e.g., sermon list as grid vs. list view).
- [P1] Admins can reorder how content is displayed within each page's template (e.g., featured sermon position).
- [P2] Per-content-type template overrides (advanced).

### 2.2 Custom Pages

- [P0] Admins can create new custom pages (e.g., "New Here?", "Give", "Volunteer").
- [P0] Custom pages use a section-based block editor — admins add, remove, and reorder predefined blocks.
- [P0] Available blocks for MVP:
  - Rich text (heading + body)
  - Image / image gallery
  - Video embed (YouTube)
  - Call-to-action button
  - Card grid (linked cards with image, title, description)
  - Contact form
  - Embed / iframe
- [P0] Each block has constrained styling options (alignment, spacing) — no free-form positioning.
- [P1] Additional blocks:
  - Testimonial
  - FAQ accordion
  - Staff/leadership grid
  - Map embed
  - Countdown timer
  - Donation / giving widget
- [P1] Admins can save a custom page layout as a reusable template.
- [P2] Admins can duplicate existing custom pages.
- [P2] Block-level visibility toggles (show/hide without deleting).

### 2.3 Page Structure & Navigation

- [P0] Admins can view all site pages in a centralized page list.
- [P0] Admins can reorder pages in the site navigation.
- [P0] Admins can nest pages under parent pages (one level of nesting).
- [P0] Admins can set a page as the homepage.
- [P0] Admins can add external links to the navigation menu.
- [P1] Admins can manage multiple navigation menus (e.g., header nav, footer nav).
- [P1] Admins can set custom URL slugs for pages.
- [P2] Admins can create navigation mega-menus or grouped dropdowns.

---

## 3. Publishing & Preview

### 3.1 Preview

- [P0] Admins can preview any page (template-governed or custom) before publishing.
- [P0] Preview shows the page as it would appear to a public visitor.
- [P1] Admins can preview on different device sizes (desktop, tablet, mobile).
- [P2] Admins can share preview links with other team members before publishing.

### 3.2 Publishing Workflow

- [P0] Custom pages support draft and published states.
- [P0] Admins can unpublish a page without deleting it.
- [P0] Publishing a page immediately makes it visible on the live site and in navigation.
- [P1] Admins can schedule page publication for a future date.
- [P1] Admins receive a confirmation prompt before publishing changes that affect navigation or the homepage.
- [P2] Version history — admins can view and revert to previous page versions.

---

## 4. Domain & SEO

### 4.1 Domain Management

- [P0] Each church site is accessible on a default subdomain (e.g., `churchname.laubf.com`).
- [P0] Admins can connect a custom domain with guided setup instructions.
- [P0] SSL certificates are provisioned automatically for custom domains.
- [P1] Admins can manage DNS records from within the CMS (or view clear instructions per registrar).
- [P2] Support for multiple domains / domain redirects.

### 4.2 SEO Basics

- [P0] Each page has auto-generated meta titles and descriptions based on content.
- [P0] The site generates a sitemap automatically.
- [P0] Open Graph tags are generated automatically for social sharing previews.
- [P1] Admins can customize meta titles and descriptions per page.
- [P1] Admins can set a custom Open Graph image per page.
- [P1] The system generates structured data (JSON-LD) for church information (LocalBusiness, Event schemas).
- [P2] Admins can manage 301 redirects.
- [P2] SEO audit / content health score per page.

---

## 5. Homepage

### 5.1 Homepage Layout

- [P0] The homepage is template-driven with a curated layout that auto-populates from CMS content:
  - Hero section (church name, tagline, CTA)
  - Latest sermon
  - Upcoming events
  - Recent announcements
  - Quick links (new here, give, connect)
- [P0] Admins can edit hero content (tagline, background image, CTA text/link).
- [P0] Admins can show/hide homepage sections.
- [P1] Admins can reorder homepage sections.
- [P1] Admins can choose from multiple hero layout variants (image background, video background, split layout).
- [P2] Admins can add custom blocks to the homepage alongside auto-populated sections.

---

## Non-goals (Website Builder)

- We are **not** building a fully free-form, pixel-level website builder.
- We are **not** exposing CSS, grid, or breakpoint controls.
- We are **not** requiring admins to understand templates, components, or design tokens.
- Template-governed pages (sermons, events, etc.) remain template-governed — admins customize content, not layout.
