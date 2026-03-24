# RSC Fix: Theme Tokens Split

> Fixes the production crash where 22 sections were converted to Server Components
> but still import from `theme-tokens.tsx` (a `"use client"` module).
>
> Created: 2026-03-24

---

## Root Cause

`components/website/shared/theme-tokens.tsx` is a `"use client"` module because it
contains React hooks (`useSectionTheme`, `useResolvedTheme`) and context (`SectionThemeContext`).

When we removed `"use client"` from 22 section components, they became Server Components.
Server Components cannot import runtime values from `"use client"` modules — even if those
values are plain data objects like `themeTokens`. Next.js treats the entire import as a
client boundary and the server render fails.

## Audit Results

### What `theme-tokens.tsx` exports

| Export | Type | Needs Client? |
|--------|------|--------------|
| `themeTokens` | Plain object (CSS class lookup) | No |
| `eventTypeColors` | Plain object | No |
| `EVENT_TYPE_FALLBACK_COLOR` | String constant | No |
| `isDarkScheme()` | Pure function | No |
| `SectionTheme` | TypeScript type | No (types are erased at build) |
| `ThemeTokens` | TypeScript interface | No |
| `SectionThemeContext` | React Context (`createContext`) | **Yes** |
| `useSectionTheme()` | React hook (`useContext`) | **Yes** |
| `useResolvedTheme()` | React hook (`useContext`) | **Yes** |
| `useRawSectionTheme()` | React hook (`useContext`) | **Yes** |

### Who imports what

**5 files use hooks (must stay client):**
- `shared/cta-button.tsx` — `useResolvedTheme`
- `shared/message-card.tsx` — `useSectionTheme`
- `shared/overline-label.tsx` — `useSectionTheme`
- `shared/section-header.tsx` — `useSectionTheme`
- `sections/all-messages-client.tsx` — `useSectionTheme`

**5 files use SectionThemeContext.Provider (must stay client):**
- `sections/section-wrapper.tsx` — wraps sections in context provider
- `shared/section-container.tsx` — provides context
- `sections/footer.tsx` — wraps in dark context
- `sections/photo-gallery.tsx` — wraps in color scheme context
- `sections/hero-banner.tsx` — wraps in context
- `sections/directory-list.tsx` — reads context

**All other sections** (including the 22 we converted) only import `themeTokens`,
`isDarkScheme`, types, and `eventTypeColors` — all pure data.

### Two sections that were wrongly converted

`footer.tsx` and `photo-gallery.tsx` use `SectionThemeContext.Provider` which is a React
API requiring client context. They were incorrectly converted to RSC and need `"use client"` restored.

## The Fix

### Step 1: Split theme-tokens.tsx into two files

**`components/website/shared/theme-tokens.ts`** (no `"use client"`, note `.ts` not `.tsx`):
- `themeTokens` object
- `eventTypeColors` object
- `EVENT_TYPE_FALLBACK_COLOR` constant
- `isDarkScheme()` function
- `SectionTheme` type
- `ThemeTokens` interface

**`components/website/shared/theme-context.tsx`** (`"use client"`):
- `SectionThemeContext` (createContext)
- `useSectionTheme()` hook
- `useResolvedTheme()` hook
- `useRawSectionTheme()` hook
- Re-exports types from theme-tokens.ts for convenience

### Step 2: Update imports across the codebase

**22 RSC sections** — change import from `shared/theme-tokens` to `shared/theme-tokens`
(same path but now points to `.ts` file without `"use client"`). No code changes needed
in the sections themselves since they only use the data exports.

**5 hook consumers** — change import to `shared/theme-context` for hooks:
- `shared/cta-button.tsx`
- `shared/message-card.tsx`
- `shared/overline-label.tsx`
- `shared/section-header.tsx`
- `sections/all-messages-client.tsx`

**5 context provider consumers** — change import to `shared/theme-context` for SectionThemeContext:
- `sections/section-wrapper.tsx`
- `shared/section-container.tsx`
- `sections/footer.tsx`
- `sections/photo-gallery.tsx`
- `sections/hero-banner.tsx`
- `sections/directory-list.tsx`

### Step 3: Restore "use client" on footer and photo-gallery

These two sections use `SectionThemeContext.Provider` (a React API) and were incorrectly
converted to RSC. Add `"use client"` back.

### Step 4: Delete old theme-tokens.tsx

After all imports are updated, delete the original `theme-tokens.tsx` file.

## Files Changed

| File | Change |
|------|--------|
| `shared/theme-tokens.ts` (NEW) | Pure data exports, no "use client" |
| `shared/theme-context.tsx` (NEW) | Hooks + context, "use client" |
| `shared/theme-tokens.tsx` (DELETE) | Replaced by above two files |
| `sections/footer.tsx` | Restore "use client", import from theme-context |
| `sections/photo-gallery.tsx` | Restore "use client", import from theme-context |
| ~30 section/shared files | Update import paths |

## What Does NOT Change

- No component APIs, props, or behavior change
- No visual changes to any page
- The `themeTokens` object, color schemes, and all CSS classes stay identical
- The `useSectionTheme()` hook works exactly the same
- The `SectionThemeContext` provider/consumer pattern stays the same
- The section-wrapper and section-container wrapping logic stays the same
- All 19 client sections keep `"use client"` (now 21 with footer + photo-gallery restored)
- All 20 RSC sections (was 22, minus footer and photo-gallery) remain Server Components

## Verification

After the fix:
1. `npx tsc --noEmit` — zero errors
2. `npm run build` — Turbopack build succeeds
3. Public website renders all sections correctly
4. Builder preview renders correctly
5. Color scheme switching (Light/Dark/Brand/Muted) works in builder
