# Builder Rendering Pipeline

## How the Website Builder Renders Section Previews

This document describes the rendering architecture of the website builder at `app/cms/website/builder/`, how it compares to the live website rendering pipeline, and the known gaps between them.

---

## 1. Two Rendering Paths, Shared Components

The platform renders website sections in two contexts:

| Context | Route | Renderer | Wrapping |
|---|---|---|---|
| **Live Website** | `app/website/[[...slug]]/page.tsx` | `SectionRenderer` (registry.tsx) | `ThemeProvider` in layout, `SectionContainer` in each component |
| **Builder Canvas** | `app/cms/website/builder/[pageId]/page.tsx` | `BuilderSectionRenderer` (builder-section-renderer.tsx) | `data-website` div with inline theme tokens, `SectionContainer` in each component |

Both paths render the **same section components** from `components/website/sections/`. The builder imports client-safe versions of server-only sections (e.g., `AllMessagesClient` instead of `AllMessages`).

---

## 2. Live Website Rendering Pipeline

```
Browser request -> Next.js App Router
  -> app/website/layout.tsx
    -> FontLoader (Google Fonts + custom @font-face per tenant)
    -> ThemeProvider (wraps children in <div data-website=""> with --ws-* CSS vars)
      -> WebsiteNavbar (from Menu records, location=HEADER)
      -> <main>{children}</main>
      -> QuickLinksFAB
      -> WebsiteFooter (from Menu records + SiteSettings)
    -> app/website/[[...slug]]/page.tsx
      -> Resolves churchId from tenant context
      -> Fetches Page by slug (or homepage)
      -> For each PageSection (sorted by sortOrder, filtered by visible):
        -> resolveSectionData() for dynamic sections
        -> SectionRenderer(type, content, colorScheme, paddingY, containerWidth, ...)
          -> Component = SECTION_COMPONENTS[type]
          -> <Component content={content} colorScheme="light" paddingY="default" containerWidth="standard" ... />
            -> SectionContainer (handles padding, background, container width internally)
```

### Key Files

| File | Purpose |
|---|---|
| `app/website/layout.tsx` | Website layout: theme, fonts, navbar, footer, QuickLinksFAB |
| `app/website/[[...slug]]/page.tsx` | Catch-all page route: fetches page + sections, renders SectionRenderer per section |
| `components/website/theme/theme-provider.tsx` | Async RSC: injects `--ws-*` CSS vars as inline styles on `<div data-website="">`, injects customCss via `<style>` tag |
| `components/website/font-loader.tsx` | Async RSC: generates `<link>` for Google Fonts and `<style>` with `@font-face` for custom fonts |
| `components/website/sections/registry.tsx` | Maps `SectionType` enum to React component, passes props in lowercase format |
| `components/website/shared/section-container.tsx` | Shared wrapper used inside each section component; applies `colorScheme` (background), `paddingY` (vertical spacing), `containerWidth` (max-width), and `SectionThemeContext` |
| `components/website/shared/theme-tokens.tsx` | `themeTokens` object mapping `"light"` / `"dark"` to Tailwind class sets; `SectionThemeContext` for React context |
| `lib/website/resolve-section-data.ts` | Resolves `dataSource` fields by calling DAL functions |

### Data Flow

1. `ThemeProvider` queries `ThemeCustomization` from DB and injects CSS custom properties (`--ws-color-primary`, `--ws-font-body`, etc.) as inline styles on a `<div data-website="">` wrapper.
2. The `[data-website]` attribute triggers global base styles from `globals.css`: font-family, color, background-color, font-smoothing.
3. `FontLoader` generates `<link>` tags for Google Fonts or `@font-face` rules for custom fonts.
4. `SectionRenderer` looks up the component from the registry and passes `colorScheme`, `paddingY`, `containerWidth` as lowercase strings.
5. Each section component wraps its content in `SectionContainer`, which applies the appropriate Tailwind classes for background, padding, and width.

---

## 3. Builder Rendering Pipeline

```
Browser request -> Next.js App Router
  -> app/cms/website/builder/layout.tsx (auth check, full-screen layout)
    -> app/cms/website/builder/[pageId]/page.tsx (RSC)
      -> Fetches page, sections, theme, menus, site settings
      -> Resolves section data via resolveSectionData()
      -> Computes websiteThemeTokens (same logic as ThemeProvider)
      -> Extracts websiteCustomCss from ThemeCustomization
      -> <FontLoader churchId={churchId} />
      -> <BuilderShell page={...} websiteThemeTokens={...} websiteCustomCss={...} navbarData={...} />
        -> BuilderCanvas (client component)
          -> <div data-website="" style={websiteThemeTokens}> (canvas container)
            -> <style>{websiteCustomCss}</style>
            -> WebsiteNavbar preview (with click interception)
            -> DndContext (drag-and-drop)
              -> For each section:
                -> SortableSection (selection border, floating toolbar, drag handle)
                  -> BuilderSectionRenderer(type, content, colorScheme, paddingY, ...)
                    -> Same section components as live site
                      -> SectionContainer (same padding, background, width)
```

### Key Files

| File | Purpose |
|---|---|
| `app/cms/website/builder/layout.tsx` | Auth guard, full-screen `h-screen w-screen` wrapper |
| `app/cms/website/builder/[pageId]/page.tsx` | RSC: fetches all data, computes theme tokens, serializes for client |
| `components/cms/website/builder/builder-shell.tsx` | Client component orchestrating all builder UI (topbar, sidebar, drawer, canvas, modals) |
| `components/cms/website/builder/builder-canvas.tsx` | Canvas rendering: `data-website` container, DnD, device mode width, navbar preview |
| `components/cms/website/builder/builder-section-renderer.tsx` | Client-safe section registry: maps SectionType to client components, handles server-only sections via client counterparts |
| `components/cms/website/builder/sortable-section.tsx` | Wraps each section with selection border, hover highlight, floating toolbar, add triggers |

### Data Flow

1. The server component (`[pageId]/page.tsx`) computes `websiteThemeTokens` using the same logic as `ThemeProvider`: reads `ThemeCustomization`, builds `--ws-*` CSS custom properties, extracts `customCss`.
2. `FontLoader` runs as an RSC and injects the same font `<link>`/`<style>` tags.
3. `BuilderCanvas` creates a `<div data-website="" style={websiteThemeTokens}>` container that scopes website base styles.
4. Custom CSS from `ThemeCustomization.customCss` is injected via a `<style>` tag inside the canvas container.
5. `BuilderSectionRenderer` maps section types to client-safe components. For server-only sections (`ALL_MESSAGES`, `ALL_EVENTS`, `ALL_BIBLE_STUDIES`), it renders their client counterparts with pre-resolved data.
6. Props are passed in the same format: `colorScheme` ("light"/"dark"), `paddingY` ("none"/"compact"/"default"/"spacious"), `containerWidth` ("standard"/"narrow"/"full").

---

## 4. Comparison: What Matches and What Differs

### What Matches (Rendering Parity)

| Aspect | Live Site | Builder | Match? |
|---|---|---|---|
| **Section components** | `components/website/sections/*` | Same components (client-safe imports) | YES |
| **SectionContainer** | Used internally by each section | Same, via same component | YES |
| **colorScheme / paddingY / containerWidth** | Passed as lowercase props | Same lowercase props | YES |
| **`[data-website]` base styles** | Applied via `ThemeProvider` div | Applied via canvas div | YES |
| **Theme CSS vars (`--ws-*`)** | Inline styles on `data-website` div | Inline styles on canvas div | YES |
| **Custom CSS injection** | `<style>` tag in `ThemeProvider` | `<style>` tag in canvas | YES |
| **Font loading** | `FontLoader` RSC in layout | `FontLoader` RSC in page | YES |
| **Theme token computation** | `ThemeProvider` reads DB | `[pageId]/page.tsx` reads same DB | YES |
| **Data resolution** | `resolveSectionData()` in page route | Same function in builder page | YES |
| **Animations** | `enableAnimations` prop | Hardcoded to `false` in builder | INTENTIONAL |

### What Differs (Known Gaps)

| Gap | Impact | Severity | Fix Path |
|---|---|---|---|
| **Responsive breakpoints** | Mobile/tablet previews do not trigger CSS media queries | HIGH | See Section 5 below |
| **Navbar position** | Live site: `position: fixed`, transparent over hero. Builder: `position: relative` (forced via `[&_header]:!relative`) | LOW | Intentional for builder usability |
| **Hero banner negative margin** | Live site: `mt-[-76px]` to slide behind navbar. Builder: neutralized via `[&>section]:!mt-0` | LOW | Intentional for builder usability |
| **Footer** | Rendered in live site layout. Not shown in builder canvas | LOW | Intentional; footer is layout-level, not section-level |
| **QuickLinksFAB** | Rendered in live site layout. Not shown in builder | LOW | Intentional |
| **Server-only sections** | Live site: async RSCs that self-fetch. Builder: client counterparts with pre-resolved data | NONE | Equivalent output, just different fetching mechanism |

---

## 5. The Responsive Preview Limitation (Media Queries vs Container Width)

### The Problem

The builder simulates device sizes by setting `maxWidth` on the canvas container:
- Desktop: `100%`
- Tablet: `768px`
- Mobile: `375px`

However, **CSS media queries respond to the browser viewport width, not the container width.** When the builder sets `maxWidth: 768px` for tablet mode, the browser viewport is still 1440px+ wide. Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) generate `@media (min-width: ...)` rules that match against the viewport, so:

- `hidden md:block` still shows the element (viewport > 768px)
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` still uses 3 columns
- `flex md:hidden` still hides the element

The same applies to custom `@media (width >= ...)` rules in `globals.css` used by typography and container utilities.

### What Does Work

The `maxWidth` constraint does affect:
- **Box model layout**: Content reflows within the narrower container. A 3-column grid at `lg:grid-cols-3` still renders 3 columns, but each column is narrower.
- **Overflow behavior**: Content that wraps or overflows at narrow widths will be visible.
- **Text wrapping**: Longer text reflows as expected.
- **Image sizing**: Responsive images within the narrower container resize correctly.
- **Relative widths**: Elements using percentage widths (`w-full`, `w-1/2`) respond to the container.

### What Does Not Work

- **Responsive visibility toggles**: `hidden md:flex` or `flex md:hidden` -- elements meant only for mobile remain hidden.
- **Responsive grid columns**: `grid-cols-1 md:grid-cols-2` -- still uses the `md:` variant on narrow canvas.
- **Responsive typography**: `text-h1` (which changes from 32px to 48px at `lg:`) -- always uses the large variant.
- **Responsive padding**: `py-24 lg:py-30` from `SectionContainer` -- always uses the `lg:` variant.

### Why Not Use Iframes?

An `<iframe>` with `width: 375px` would give accurate viewport-based media queries. However:
- **Architecture change**: The builder canvas would need to be a separate route rendered inside an iframe. This breaks the single-React-tree model, making drag-and-drop, selection state, and keyboard shortcuts significantly harder.
- **Performance**: Each iframe is a full browser context with its own DOM, styles, and scripts.
- **Communication**: Builder shell and canvas would need `postMessage` for all interactions.
- This is a valid long-term approach but not appropriate for the current phase.

### Why Not Use CSS Container Queries?

CSS `@container` queries respond to the container's width, not the viewport. We could:
1. Make the canvas container a CSS containment context (`container-type: inline-size`)
2. Replace all `@media` / Tailwind responsive prefixes with `@container` queries

However:
- **All 40+ section components** use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`). Rewriting them all is extremely invasive.
- **Global CSS utilities** (typography scale, container variants) use `@media (width >= ...)` rules.
- **Third-party components** (Framer Motion, Radix UI) may use viewport queries internally.
- This approach would also break the live website unless we use container queries everywhere, which would require the live site's `<main>` to also be a container context.

### Current Status

The builder provides a "width-constrained" preview that is **accurate for layout flow** (how content reflows at narrow widths) but **not accurate for responsive breakpoint behavior** (which elements show/hide, which grid columns are used). This is documented as a known limitation.

### Future Options

1. **Iframe-based canvas** (recommended long-term): Render a real website page inside an iframe at the target width. Use `postMessage` for builder-canvas communication. This is how most production website builders (Webflow, Wix, Framer) work.
2. **Hybrid approach**: Use the current direct-rendering for desktop mode and iframe rendering for mobile/tablet preview. This limits the iframe complexity to preview-only mode.
3. **CSS Container Queries migration**: If the industry standardizes on container queries for component libraries, migrate section components gradually. Tailwind CSS v4 has experimental `@container` support.

---

## 6. Theme Token Flow

### How `--ws-*` CSS Variables Flow to Both Contexts

```
ThemeCustomization (DB)
  |
  +--> [Live Site] ThemeProvider (RSC)
  |      -> Reads DB via getThemeWithCustomization()
  |      -> Computes --ws-color-primary, --ws-font-body, etc.
  |      -> Injects as inline styles on <div data-website="">
  |      -> Injects customCss via <style> tag
  |
  +--> [Builder] [pageId]/page.tsx (RSC)
         -> Reads DB via getThemeWithCustomization()
         -> Computes same --ws-* tokens (duplicated logic)
         -> Passes as websiteThemeTokens prop to BuilderShell
         -> Passes websiteCustomCss to BuilderShell
         -> BuilderCanvas applies as inline styles on <div data-website="">
         -> BuilderCanvas injects customCss via <style> tag
```

The token computation logic is duplicated between `ThemeProvider` and `[pageId]/page.tsx`. Both produce identical `--ws-*` custom properties. A future refactor could extract this into a shared utility (e.g., `lib/website/build-theme-tokens.ts`).

**Note:** The `--ws-*` CSS variables are currently set but not consumed by any section component or CSS rule. The section components use Tailwind utility classes (`bg-black-1`, `text-white-1`) from the `themeTokens` object in `theme-tokens.tsx`, not CSS custom properties. The `--ws-*` variables are reserved for future use when sections begin supporting per-church color customization beyond the light/dark scheme.

### `[data-website]` Base Styles

Both contexts apply the `data-website` attribute, which triggers these global CSS rules:

```css
[data-website] {
  font-family: var(--font-sans);
  color: var(--color-black-1);
  background-color: var(--color-surface-page);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

This ensures website section components render with the correct base typography and background in both the live site and builder, isolated from the CMS admin's shadcn/ui styles (which are scoped to `[data-cms]`).

---

## 7. Z-Index Architecture

The builder uses a layered z-index scheme to manage overlapping elements:

| Layer | Z-Index | Element | Purpose |
|---|---|---|---|
| Canvas content | `1` | Section content | Base layer for section components |
| Navbar preview | `5` | Navbar wrapper in canvas | Above sections but below selection UI |
| Section selection border | `60` | Inset box-shadow overlay | Highlight selected/hovered section |
| Section floating toolbar | `80` | Edit/delete/drag toolbar | Above selection border |
| Section add triggers | `80` | "+" buttons between sections | Same level as toolbar |
| Drag overlay | `100` | DragOverlay component | Above everything during drag |

### Builder Shell Layout Z-Index

| Layer | Element | Notes |
|---|---|---|
| Base | Canvas (flex-1) | Main content area |
| Above canvas | Left sidebar (60px) | Always visible |
| Above canvas | Left drawer (320px) | Animated slide-in |
| Above canvas | Right drawer (320px) | Animated slide-in for section editor |
| Modal layer | SectionPickerModal, PageSettingsModal, AddPageModal | Portal-rendered overlays |
| Alert layer | AlertDialog for unsaved changes | Portal-rendered |

The left sidebar, left drawer, and right drawer use flex layout positioning (not z-index stacking), so they never overlap the canvas -- they compress its width.

---

## 8. Section Component Compatibility

### Client vs Server Components

The live website can render both server and client components. The builder can only render client components (because `BuilderCanvas` is a `"use client"` component).

| Section Type | Live Site | Builder | Strategy |
|---|---|---|---|
| Static sections (38) | Client components (`"use client"`) | Same components | Direct import |
| `ALL_MESSAGES` | Async RSC (self-fetching) | `AllMessagesClient` | Pre-resolved data passed as props |
| `ALL_EVENTS` | Async RSC (self-fetching) | `AllEventsClient` | Pre-resolved data passed as props |
| `ALL_BIBLE_STUDIES` | Async RSC (self-fetching) | `AllBibleStudiesClient` | Pre-resolved data passed as props |
| `NAVBAR` | Rendered in layout | Rendered as canvas header | Click interception for navigation |

### Builder-Specific Adjustments

The `BuilderSectionRenderer` makes two adjustments for builder usability:

1. **Hero banner negative margin**: The live site's `HERO_BANNER` uses `mt-[-76px]` to slide behind the transparent navbar. In the builder, this is neutralized via `[&>section]:!mt-0` to prevent the section from being hidden behind the navbar preview.

2. **Disabled animations**: All sections receive `enableAnimations={false}` in the builder to prevent scroll-triggered animations from interfering with editing.

---

## 9. Font Loading Parity

Both contexts share the same `FontLoader` RSC component:

| Context | Where FontLoader Runs | How Fonts Are Available |
|---|---|---|
| **Live site** | `app/website/layout.tsx` | `<link>` and `<style>` tags in layout head |
| **Builder** | `app/cms/website/builder/[pageId]/page.tsx` | Same `<link>` and `<style>` tags in page |

The `FontLoader` generates:
- Google Fonts `<link>` tags for standard fonts
- `@font-face` `<style>` rules for custom/self-hosted fonts

Both contexts have identical font availability because they use the same RSC.

---

## 10. Summary of Rendering Parity

| Category | Parity Level | Notes |
|---|---|---|
| Section component rendering | **Full** | Same components, same props |
| Color scheme (light/dark) | **Full** | Same `SectionContainer` behavior |
| Padding and container width | **Full** | Same `SectionContainer` behavior |
| Theme CSS variables | **Full** | Same computation, same `data-website` scope |
| Custom CSS injection | **Full** | Same `<style>` tag approach |
| Font loading | **Full** | Same `FontLoader` RSC |
| Desktop layout preview | **High** | Width-constrained but full parity |
| Tablet/mobile preview | **Partial** | Width correct, but viewport-based media queries don't trigger |
| Navbar rendering | **Partial** | Same component but forced `position: relative` |
| Footer rendering | **None** | Intentionally excluded from builder |
| Scroll animations | **None** | Intentionally disabled in builder |
