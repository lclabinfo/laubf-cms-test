# Font System

## How Fonts Are Loaded, Configured, and Isolated Per Tenant

---

## 1. Current Font Setup (laubf-test Single-Tenant)

The existing public website (`laubf-test/`) uses three font families, loaded via two different mechanisms:

### Font Families

| Font | Role | Weight(s) | Loading Method |
|---|---|---|---|
| **Helvetica Neue** | Primary sans-serif (body, headings, UI) | 400 (Roman), 500 (Medium), 700 (Bold) | Self-hosted `@font-face` in `globals.css` |
| **DM Serif Display** | Display serif (hero accents, section headings) | 400 italic | `next/font/google` in `layout.tsx` |
| **Strude** | Script/decorative (special headings) | 400 | Self-hosted `@font-face` in `globals.css` |

### How Fonts Are Currently Loaded

**Self-hosted fonts** are declared in `laubf-test/src/app/globals.css` using `@font-face` rules:

```css
@font-face {
  font-family: "Helvetica Neue";
  src:
    local("Helvetica Neue"),
    local("HelveticaNeue"),
    url("/fonts/helvetica-neue/HelveticaNeueRoman.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

Font files live in `laubf-test/public/fonts/`:
- `helvetica-neue/HelveticaNeueRoman.otf`
- `helvetica-neue/HelveticaNeueMedium.otf`
- `helvetica-neue/HelveticaNeueBold.otf`
- `strude/strude.ttf`

**Google Fonts** are loaded in `laubf-test/src/app/layout.tsx` using `next/font/google`:

```typescript
import { DM_Serif_Display } from "next/font/google";

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  style: "italic",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-serif-display",
});
```

The font's CSS variable (`--font-dm-serif-display`) is injected via the `className` on `<html>`.

### CSS Variable Font Stack

In `globals.css`, the `@theme` block defines the font stacks:

```css
@theme {
  --font-sans: "Helvetica Neue", "Helvetica", "Arial", ui-sans-serif, system-ui, sans-serif;
  --font-serif: var(--font-dm-serif-display), ui-serif, Georgia, serif;
  --font-display: var(--font-dm-serif-display), ui-serif, Georgia, serif;
  --font-script: "strude", cursive;
}
```

Typography utility classes (`.text-h1`, `.text-body-1`, etc.) reference these CSS variables, so all components use the font stack indirectly.

---

## 2. Multi-Tenant Font Architecture (Target State)

In the multi-tenant platform, each church can customize their fonts through the `ThemeCustomization` table. The font system must support:

1. **Google Fonts** as the primary source (most churches)
2. **Custom/self-hosted fonts** for churches with specific brand fonts (e.g., LA UBF with Helvetica Neue)
3. **Font isolation** — each church's fonts load independently without affecting other tenants

### Database Storage

The `ThemeCustomization` model stores font preferences per church:

```prisma
model ThemeCustomization {
  // Typography overrides
  headingFont   String?   // Google Font name: "Playfair Display"
  bodyFont      String?   // Google Font name: "Inter"
  baseFontSize  Int?      // Base size in px: 16

  // All overrides as a flat map (for CSS variable injection)
  tokenOverrides Json?    // Can include custom font URLs and variables
}
```

For churches using **Google Fonts**, `headingFont` and `bodyFont` store the Google Font family name (e.g., `"Inter"`, `"Playfair Display"`). The ThemeProvider resolves these to Google Fonts API URLs at render time.

For churches using **custom/self-hosted fonts** (like LA UBF with Helvetica Neue), the font configuration is stored in `tokenOverrides` JSONB:

```json
{
  "--font-sans": "\"Helvetica Neue\", \"Helvetica\", \"Arial\", sans-serif",
  "--font-serif": "\"DM Serif Display\", Georgia, serif",
  "--custom-font-urls": [
    "/fonts/helvetica-neue/HelveticaNeueRoman.otf",
    "/fonts/helvetica-neue/HelveticaNeueMedium.otf",
    "/fonts/helvetica-neue/HelveticaNeueBold.otf"
  ]
}
```

### Theme Table Default Tokens

The `Theme` table (platform-level templates) provides default font configurations:

```json
{
  "headingFont": "DM Serif Display",
  "bodyFont": "Inter",
  "fontStacks": {
    "--font-sans": "\"Inter\", ui-sans-serif, system-ui, sans-serif",
    "--font-serif": "\"DM Serif Display\", ui-serif, Georgia, serif",
    "--font-display": "\"DM Serif Display\", ui-serif, Georgia, serif"
  }
}
```

Churches inherit these defaults from their selected theme, then override specific values via `ThemeCustomization`.

---

## 3. Implemented Font Components (Phase B.1)

Two components handle font loading in the root project. Both exist and are functional as of Phase B.1.

### ThemeProvider (`components/website/theme/theme-provider.tsx`)

Handles CSS variable injection and basic Google Fonts loading:

```typescript
// Actual implementation (simplified)
export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const customization = theme
  const defaultTokens = (theme?.theme?.defaultTokens ?? {}) as Record<string, string>

  const tokens: Record<string, string> = {
    '--color-primary': customization?.primaryColor || defaultTokens['--color-primary'] || '#1a1a2e',
    '--font-heading': customization?.headingFont || defaultTokens['--font-heading'] || 'Inter',
    '--font-body': customization?.bodyFont || defaultTokens['--font-body'] || 'Source Sans Pro',
    // ... more tokens
    ...(customization?.tokenOverrides as Record<string, string> || {}),
  }

  // Build Google Fonts URL from headingFont + bodyFont
  const googleFontsUrl = googleFonts.length > 0
    ? `https://fonts.googleapis.com/css2?${googleFonts.map(f =>
        `family=${encodeURIComponent(f)}:wght@400;500;600;700`
      ).join('&')}&display=swap`
    : null

  return (
    <div style={tokens as React.CSSProperties}>
      {googleFontsUrl && <link rel="stylesheet" href={googleFontsUrl} />}
      {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      {children}
    </div>
  )
}
```

**Key behavior:**
- Reads `ThemeCustomization` (passed as `theme` prop from the layout)
- Falls back to `Theme.defaultTokens` for any unset values
- Collects distinct Google Font family names from `headingFont` and `bodyFont`
- Generates a single Google Fonts CSS2 API URL requesting weights 400, 500, 600, 700
- Spreads `tokenOverrides` JSONB last so church-specific overrides take precedence
- Injects `customCss` as a raw `<style>` tag (for advanced customization)

### FontLoader (`components/website/font-loader.tsx`)

An async RSC that handles the split between Google Fonts and custom/self-hosted fonts:

```typescript
// Actual implementation (simplified)
export async function FontLoader({ churchId }: { churchId: string }) {
  const theme = await getThemeWithCustomization(churchId)
  const overrides = (theme.tokenOverrides ?? {}) as TokenOverrides
  const customFonts = overrides.customFonts ?? []

  // Determine which fonts are custom (have a URL defined)
  const customFamilies = new Set(customFonts.map((f) => f.family))

  // Only load from Google Fonts if the font is NOT custom
  if (headingFont && !customFamilies.has(headingFont)) googleFonts.push(headingFont)
  if (bodyFont && !customFamilies.has(bodyFont)) googleFonts.push(bodyFont)

  // Build @font-face for custom fonts
  const fontFaceCss = customFonts.map(f =>
    `@font-face {
  font-family: '${f.family}';
  src: url('${f.url}') format('woff2');
  font-weight: ${f.weight ?? '400'};
  font-style: ${f.style ?? 'normal'};
  font-display: swap;
}`).join('\n')

  return (
    <>
      {googleFontsUrl && <link rel="stylesheet" href={googleFontsUrl} />}
      {fontFaceCss && <style dangerouslySetInnerHTML={{ __html: fontFaceCss }} />}
    </>
  )
}
```

**Key behavior:**
- Fetches `ThemeCustomization` directly via DAL (`getThemeWithCustomization`)
- Checks `tokenOverrides.customFonts` array for self-hosted font descriptors
- If a font family appears in `customFonts`, it is NOT loaded from Google Fonts
- Generates `@font-face` rules for custom fonts with `font-display: swap`
- Custom font descriptor shape: `{ family: string, url: string, weight?: string, style?: string }`

### How ThemeProvider and FontLoader Relate

| Component | Responsibility | Used In |
|---|---|---|
| `ThemeProvider` | CSS variable injection, basic Google Fonts link | `(website)/layout.tsx` wraps `{children}` |
| `FontLoader` | Smart font loading (Google vs custom split), `@font-face` generation | `(website)/layout.tsx` placed in `<head>` area |

The ThemeProvider and FontLoader both generate Google Fonts links. In practice, the layout should use FontLoader for font loading (it handles the Google/custom split correctly) and ThemeProvider for CSS variable injection. The duplicate Google Fonts link in ThemeProvider is harmless (browsers deduplicate identical `<link>` tags) but should be cleaned up when the layout is finalized.

### CSS Variable Injection

The ThemeProvider injects font CSS variables on a wrapper `<div>`:

```tsx
<div style={{
  '--font-heading': 'Inter',
  '--font-body': 'Source Sans Pro',
  // ... color, spacing, border-radius tokens
}}>
  {children}
</div>
```

Typography utility classes (`.text-h1`, `.text-body-1`, etc.) reference these CSS variables, so font changes propagate automatically to all components.

---

## 4. Multi-Tenant Font Isolation

Each church's fonts are isolated at the CSS variable scope level:

```
Request: gracechurch.org/about
  → Middleware resolves church_id = "abc123"
  → Layout fetches ThemeCustomization for "abc123"
  → ThemeProvider injects CSS vars scoped to this request
  → Components render with church-specific font stack

Request: laubf.lclab.io/about
  → Middleware resolves church_id = "def456"
  → Layout fetches ThemeCustomization for "def456"
  → ThemeProvider injects different CSS vars
  → Same components, different fonts
```

Since Next.js renders each request independently as RSC (React Server Components), there is no risk of font bleed between tenants. Each SSR response includes its own set of CSS custom properties and font loading tags.

### Isolation Guarantees

- **CSS variable scope**: Font variables are injected on a wrapper `<div>` in the layout, scoping them to the page content
- **Google Fonts links**: Each response gets its own `<link>` tag for the church's specific fonts
- **Self-hosted fonts**: Font file paths are namespaced by church (e.g., `/uploads/{church-slug}/fonts/`)
- **No shared global state**: ThemeProvider reads from the database per-request; there is no module-level font cache that could leak between tenants

---

## 5. Font Pairing Recommendations

The Theme Customizer UI (Phase C) will offer curated font pairings. These are stored in the `Theme.defaultTokens` JSONB and presented as suggestions in the admin:

| Pairing Name | Heading Font | Body Font | Style |
|---|---|---|---|
| Modern Church | Inter | Inter | Clean, contemporary |
| Classic Serif | Playfair Display | Source Sans Pro | Traditional, warm |
| Bold Ministry | Montserrat | Open Sans | Strong, accessible |
| Elegant Worship | DM Serif Display | Lora | Refined, literary |
| Minimal Grace | Outfit | Outfit | Minimal, modern |
| Heritage | Merriweather | Merriweather Sans | Timeless, readable |

Churches can select a pairing or mix-and-match individual heading and body fonts from the full Google Fonts catalog. The UI groups fonts by category (serif, sans-serif, display) and shows a live preview.

---

## 6. Performance Considerations

### Font Display Strategy

All fonts use `font-display: swap` to prevent invisible text during load:
- Text renders immediately with the fallback font
- Once the custom font loads, text reflows to the custom font
- This prioritizes readability over visual stability (acceptable trade-off for content-heavy church websites)

### Preloading Critical Fonts

The ThemeProvider adds `<link rel="preload">` for the church's primary fonts:

```html
<link
  rel="preload"
  href="https://fonts.gstatic.com/s/inter/v13/..."
  as="font"
  type="font/woff2"
  crossorigin
/>
```

For Google Fonts, the `preconnect` hint is added to the layout:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

### Limiting Font Weight Loads

To minimize font payload, the ThemeProvider only requests the weights actually used:

| Weight | Usage | Required? |
|---|---|---|
| 400 (Regular) | Body text, descriptions | Always |
| 500 (Medium) | Headings, buttons, nav | Always |
| 700 (Bold) | Strong emphasis | Only if used |
| 400 italic | Display/serif accents | Only for heading font |

A typical church loads 2 font families x 2-3 weights = 4-6 font files, totaling approximately 100-200 KB (WOFF2 compressed).

### Caching

- **Google Fonts CSS**: Cached by the CDN with long TTL (fonts.googleapis.com returns aggressive cache headers)
- **Google Fonts files**: Cached by browsers for up to 1 year (fonts.gstatic.com)
- **Self-hosted fonts**: Served with `Cache-Control: public, max-age=31536000, immutable` since font files are versioned by filename
- **ThemeCustomization query**: Cached via `unstable_cache` with tag `church:{id}:theme` (revalidated on theme changes in CMS)

### Font Loading Budget

Target: fonts should not delay LCP by more than 100ms. This is achievable because:
1. Google Fonts WOFF2 files are typically 15-25 KB per weight
2. `font-display: swap` ensures text is visible immediately
3. `preconnect` eliminates DNS lookup delay
4. CDN caching means returning visitors have zero font load time

---

## 7. Migration Notes

### From laubf-test to Root Project

When section components are migrated from `laubf-test/` to `components/website/sections/` (Phase B), the font system changes as follows:

| Aspect | laubf-test (current) | Root project (target) |
|---|---|---|
| Font loading | `@font-face` in globals.css + `next/font/google` in layout.tsx | ThemeProvider injects fonts dynamically per tenant |
| Font variables | Hardcoded in `@theme` block | Injected as inline CSS from ThemeCustomization |
| Helvetica Neue | Self-hosted in `public/fonts/` | Stored as LA UBF's custom font in ThemeCustomization |
| DM Serif Display | Loaded via `next/font/google` | Loaded via Google Fonts link tag in ThemeProvider |
| Typography classes | `.text-h1` etc. reference `--font-sans` | Same classes, same variables, dynamically populated |

The section components themselves do not change — they reference the CSS variables (`--font-sans`, `--font-serif`, etc.) through the typography utility classes. Only the font loading mechanism changes from static to dynamic.

### LA UBF-Specific Configuration

LA UBF uses Helvetica Neue (a licensed font not available on Google Fonts). In the multi-tenant setup, LA UBF's ThemeCustomization will include:

```json
{
  "bodyFont": null,
  "headingFont": null,
  "tokenOverrides": {
    "--font-sans": "\"Helvetica Neue\", \"Helvetica\", \"Arial\", ui-sans-serif, system-ui, sans-serif",
    "--font-serif": "\"DM Serif Display\", ui-serif, Georgia, serif",
    "--font-display": "\"DM Serif Display\", ui-serif, Georgia, serif",
    "--font-script": "\"strude\", cursive",
    "--custom-fonts": [
      {
        "family": "Helvetica Neue",
        "variants": [
          { "weight": 400, "style": "normal", "url": "/uploads/la-ubf/fonts/HelveticaNeueRoman.otf" },
          { "weight": 500, "style": "normal", "url": "/uploads/la-ubf/fonts/HelveticaNeueMedium.otf" },
          { "weight": 700, "style": "normal", "url": "/uploads/la-ubf/fonts/HelveticaNeueBold.otf" }
        ]
      },
      {
        "family": "strude",
        "variants": [
          { "weight": 400, "style": "normal", "url": "/uploads/la-ubf/fonts/strude.ttf" }
        ]
      }
    ]
  }
}
```

The `null` values for `bodyFont` and `headingFont` signal to the ThemeProvider that this church uses custom fonts from `tokenOverrides` rather than Google Fonts.

---

## 8. File Reference

| File | Status | Purpose |
|---|---|---|
| `components/website/theme/theme-provider.tsx` | EXISTS | CSS variable injection + Google Fonts link (Phase B.1) |
| `components/website/font-loader.tsx` | EXISTS | Smart font loading: Google Fonts vs custom `@font-face` (Phase B.1) |
| `lib/dal/theme.ts` | EXISTS | `getThemeWithCustomization(churchId)` — fetches ThemeCustomization + Theme |
| `prisma/schema.prisma` (ThemeCustomization model) | EXISTS | `headingFont`, `bodyFont`, `tokenOverrides` JSONB |
| `laubf-test/src/app/globals.css` | EXISTS | laubf-test font definitions (`@font-face` + `@theme` font stacks) |
| `laubf-test/src/app/layout.tsx` | EXISTS | laubf-test Google Font loading (`next/font/google` for DM Serif Display) |
| `laubf-test/src/lib/theme.ts` | EXISTS | Theme tokens and color scheme context |
| `laubf-test/public/fonts/` | EXISTS | Self-hosted font files (Helvetica Neue, Strude) |
| `docs/database/03-website-database-schema.md` | EXISTS | ThemeCustomization model with font fields |
| `app/(website)/layout.tsx` | EXISTS | Uses ThemeProvider + FontLoader to inject fonts and theme CSS variables |
