# Navigation Bar Editor — Specification

> **Date:** March 18, 2026 (spec) / March 20, 2026 (last updated)
> **Owner:** David Lim
> **Status:** IMPLEMENTED -- navigation editor with flat-tree DnD reparenting is complete. See `navigation-editor-architecture.md` for technical implementation details.
> **Location in builder:** Left sidebar "Pages & Navigation" panel, Navigation section

---

## What This Is

An editor within the website builder that lets admins configure the public-facing navigation bar. It manages the structure, ordering, and linking of all top-level menu items, their dropdown contents, and special elements like the CTA button.

---

## Item Types

| Type | Icon | Badge | Description |
|---|---|---|---|
| **Folder dropdown** | `Folder` | `dropdown` | Top-level nav label that only opens a dropdown. Has no landing page. (e.g. "Our Church", "Resources") |
| **Page + dropdown** | `FileText` + `ChevronDown` | `page + dropdown` | Top-level item that is both navigable AND opens a dropdown. (e.g. "Ministries" → `/ministries` + mega menu) |
| **Page** | `FileText` | — | A standard navigable page within a dropdown section. (e.g. "Events", "Who We Are") |
| **External link** | `ExternalLink` | `external` | Points to an outside URL. May carry schedule metadata. (e.g. "Daily Bread & Prayer", "Sunday Livestream") |
| **Featured item** | `Star` | `featured` | A promoted/highlighted item within a dropdown, rendered as a footer card in the mega menu. (e.g. "Ministry Overview") |
| **CTA button** | `Link` | `shortcut` | Pinned to right edge of navbar. Points to an existing page. Singleton. (e.g. "I'm New" → `/im-new`) |
| **Hidden page** | `EyeOff` | `hidden` | Hosted and accessible by URL but not in the navigation. (e.g. "Privacy Policy") |

---

## Structural Rules

1. **Top-level items** are ordered left-to-right in the navbar. Admins can drag to reorder.
2. **Dropdowns contain sections.** Each section has a heading (e.g. "About", "Connect", "Quick Links") and an ordered list of items. Sections map to columns in the public mega-menu.
3. **Sections contain items.** Items can be pages, external links, or featured items. Items are drag-reorderable within and across sections.
4. **A page can exist in the nav AND be referenced elsewhere.** "I'm New" lives under Our Church → About as a page, but is also the CTA target. The CTA is a separate config — it doesn't create a page.
5. **Pages can exist outside the nav entirely.** Hidden pages are hosted at a URL but don't show in any dropdown or top-level menu. They're still editable and manageable.
6. **The CTA button is a singleton shortcut.** One CTA slot, always pinned right. It targets any existing page (whether in nav or hidden). Changing the CTA target does not restructure the nav.

---

## Data Model

### NavItem (menu item node)
```typescript
NavItem {
  id: string
  label: string
  type: "folder-dropdown" | "page-dropdown" | "page" | "external-link" | "featured"
  url?: string                  // for pages and external links
  description?: string          // subtitle shown in dropdown (e.g. "Our mission & vision")
  meta?: string                 // schedule string for external links (e.g. "Mon-Fri @ 6 AM")
  sections?: Section[]          // only for dropdown types
}
```

### Section (group within a dropdown)
```typescript
Section {
  id: string
  label: string                 // section heading (e.g. "About", "Campus Ministries")
  items: NavItem[]              // ordered list of child items
}
```

### CTAConfig (singleton)
```typescript
CTAConfig {
  label: string                 // button text (e.g. "I'm New")
  targetPageId: string          // reference to an existing page
  targetUrl: string             // resolved URL
}
```

### HiddenPage
```typescript
HiddenPage {
  id: string
  label: string
  url: string
}
```

---

## Current Navigation Structure (LA UBF)

```
Navbar
├── Our Church                          [folder-dropdown]
│   ├── §About
│   │   ├── Who We Are                  [page → /about]
│   │   └── I'm New                     [page → /im-new]
│   ├── §Connect
│   │   ├── Events                      [page → /events]
│   │   ├── Meetings                    [page → /meetings]
│   │   └── Programs                    [page → /programs]
│   └── §Quick Links
│       ├── Daily Bread & Prayer        [external-link, Mon-Fri @ 6 AM]
│       ├── Evening Prayer              [external-link, Every Day @ 7:30 PM]
│       ├── Men's Bible Study           [external-link, Sat @ 8 AM]
│       └── Sunday Livestream           [external-link, Sun @ 11 AM]
│
├── Ministries                          [page-dropdown → /ministries]
│   ├── §Ministry Groups
│   │   ├── College & Young Adults      [page]
│   │   ├── Adults                      [page]
│   │   ├── Middle & High School        [page]
│   │   └── Children                    [page]
│   ├── §Campus Ministries
│   │   └── (11 campus pages)
│   └── §Featured
│       └── Ministry Overview           [featured → /ministries]
│
├── Resources                           [folder-dropdown]
│   ├── §The Word
│   │   ├── Messages                    [page]
│   │   ├── Bible Study                 [page]
│   │   └── Videos                      [page]
│   └── §Featured
│       └── Explore Resources           [featured]
│
├── Giving                              [page → /giving]
│
├── CTA: "I'm New"                      [shortcut → /im-new]
│
└── Hidden pages
    ├── Privacy Policy                  [/privacy]
    └── Terms of Service                [/terms]
```

---

## Editor Capabilities

### Must Support
- Drag-to-reorder top-level items, sections, and items within sections
- Add / rename / delete top-level items, sections, and child items
- Toggle a top-level item between folder-dropdown and page-dropdown
- Set item type (page, external link, featured)
- Configure the CTA target (pick from any existing page)
- Manage hidden pages (add, remove, edit URL)
- Type-specific icons (Lucide React) for visual distinction at a glance
- Edit featured card fields (image, title, description, href) for overview links

### Display Requirements
- Folder-dropdown vs page-dropdown must be immediately distinguishable (different icon + badge)
- External links show schedule metadata inline when present
- CTA is clearly separated from nav structure — it's a config, not a page
- Hidden pages are visually dimmed but still accessible
- Badges for item types: "dropdown", "page + dropdown", "external", "featured", "shortcut"
- Descriptions shown inline in muted text (e.g. "Our mission & vision")

---

## How This Maps to the Current Database

| Spec Concept | Database Field(s) |
|---|---|
| Top-level item | MenuItem with `parentId: null` |
| Folder-dropdown | MenuItem with no `href`, has children |
| Page-dropdown | MenuItem with `href` AND has children |
| Section heading | `groupLabel` on child MenuItems |
| Page item | MenuItem with `href`, `isExternal: false` |
| External link | MenuItem with `href`, `isExternal: true`, `openInNewTab: true` |
| Schedule metadata | Not currently stored — needs new field or uses `description` |
| Featured item | MenuItem with `featuredTitle/Description/Href`, `sortOrder >= 99` |
| CTA button | `SiteSettings.navCtaLabel/Href/Visible` (NOT in menu) |
| Hidden page | Page with `isPublished: true` but no corresponding MenuItem |
| Item description | `MenuItem.description` |

### Schema Changes Needed

1. **No new models required.** The existing `MenuItem` model supports all concepts.
2. **Optional:** Add `scheduleMeta: String?` to MenuItem for external link schedule display (currently could use `description` but that's shown differently in the mega-menu).
3. **Optional:** Add `itemType: String?` to MenuItem for explicit type tracking (currently inferred from field combinations).

---

## Reference UI

The editor follows a tree-based panel design (see attached screenshot). Key visual patterns:
- Dark background panel with tree structure
- Collapsible top-level items with chevron
- Section headings in uppercase muted text with "..." menu
- Each item shows: drag handle, type icon, label, metadata/badge (right-aligned)
- "+ Add item" links at bottom of each section
- "+ Add section" link at bottom of each dropdown
- Landing page indicator for page-dropdown items (eye icon + URL)
