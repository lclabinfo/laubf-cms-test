# Editor Drawer Organization

> **Created**: March 20, 2026
> **Status**: Implemented
> **Purpose**: Defines how section editor fields are organized into accordion panels in the right drawer.

---

## Principle

The right drawer uses an **accordion layout** to organize editor fields by purpose. Only one panel is open at a time. The active panel fills all available vertical space with its own internal scroll. Content opens by default. Switching panels is instant — click a header to switch.

## Panels

Every section editor has 3 top-level accordion panels:

### 1. Content (open by default)

The primary editing surface: headings, descriptions, images, videos, buttons. Section-specific editors may include sub-collapsibles (e.g., a "Layout" group inside the hero editor) using `EditorSection`.

### 2. Style

Visual presentation: color scheme, vertical padding, container width. These are "set once during setup" fields. Shared implementation across all sections.

### 3. Advanced

Power-user settings: animations toggle, visibility toggle, section label (admin-only), JSON editor toggle, delete section button. Shared implementation across all sections.

## Visual Structure

```
+-----------------------------+
|  Edit Hero Banner        X  |  <- fixed header (title + close)
+-----------------------------+
| > Content                   |  <- active panel header (highlighted)
| +-------------------------+ |
| | [Overline input]        | |  <- scrollable content area
| | [Heading Line 1]        | |     fills all available height
| | [Heading Line 2]        | |
| | [Subheading textarea]   | |
| | [Media: Image | Video]  | |
| | [Buttons]               | |
| | > Layout (sub-group)    | |  <- collapsible within Content
| +-------------------------+ |
| > Style                     |  <- collapsed panel header
| > Advanced                  |  <- collapsed panel header
+-----------------------------+
```

When "Style" is clicked, Content collapses and Style fills the space:

```
+-----------------------------+
|  Edit Hero Banner        X  |
+-----------------------------+
| > Content                   |  <- collapsed
| > Style                     |  <- now active
| +-------------------------+ |
| | [Color Scheme picker]   | |  <- scrollable, fills space
| | [Vertical Padding]      | |
| | [Container Width]       | |
| +-------------------------+ |
| > Advanced                  |  <- collapsed
+-----------------------------+
```

## Layout Details

### Flex column structure

The drawer is a flex column (`h-full flex flex-col`):
- Fixed header (title bar, 56px)
- Accordion fills remaining space (`flex-1 min-h-0 flex flex-col`)
  - Panel headers are `shrink-0` (always visible, stacked)
  - Active panel content is `flex-1 min-h-0` with `ScrollArea`

### Only one panel open at a time

Opening a panel closes the previously open one. This prevents the drawer from becoming an overwhelming scroll of 15+ fields. The user focuses on one concern at a time.

### Internal scrolling per panel

Each panel's content has its own `ScrollArea`. The outer drawer does NOT scroll — only the active panel's content scrolls. Panel headers always stay visible at their positions.

## Implementation

### SectionEditorInline (builder-right-drawer.tsx)

The accordion is built directly in `SectionEditorInline` using:
- `activePanel` state (`"content" | "style" | "advanced"`, defaults to `"content"`)
- `PanelHeader` component (button with chevron, highlight on active)
- Each panel conditionally renders its content wrapped in `ScrollArea`

### EditorSection component (shared/editor-section.tsx)

Used for **sub-collapsibles within a panel** (not the top-level accordion). For example, the hero editor wraps its layout fields in `<EditorSection title="Layout">` inside the Content panel. Uses shadcn `Collapsible` + `ChevronRight`.

### Per-editor convention

Section editors (e.g., `HeroBannerEditor`) should:
- Render content fields directly (these appear in the Content panel)
- Wrap layout-specific fields in `<EditorSection title="Layout">` for sub-collapsing
- NOT render style or advanced fields (handled by the shared accordion)

## Which Fields Go Where

| Section Type | Content | Layout (sub-group in Content) | Style | Advanced |
|---|---|---|---|---|
| Hero Banner | heading, subheading, overline, media, buttons | layout variant, arrangement, text position | color, padding, width | animations, visibility, label |
| Text Image Hero | overline, heading, description, image | text alignment | color, padding, width | animations, visibility, label |
| Ministry Hero | overline, heading, CTA, image | heading style | color, padding, width | animations, visibility, label |
| CTA Banner | heading, description, button | -- | color, padding, width | animations, visibility, label |
| Media Text | heading, description, images, button | image position, text align | color, padding, width | animations, visibility, label |
| Data-driven | heading, CTA, count limit | -- | color, padding, width | animations, visibility, label |

## Design Decisions

- **Accordion, not independent collapsibles.** Only one panel open at a time prevents information overload and ensures the active panel has maximum space.
- **No outer scroll.** Panel headers are always visible. Only the active panel's content scrolls internally. This means you can always switch panels without scrolling to find them.
- **Content opens by default.** The 80% use case. User starts editing immediately.
- **Layout is a sub-collapsible inside Content**, not a top-level panel. It's section-specific (many sections don't have layout options) and closely related to content editing.
- **No localStorage persistence.** Panels reset to Content each time a section is opened. Predictable for infrequent users.
