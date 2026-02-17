# Design Tokens

Reference for all design tokens used across the Church CMS portal. These values are derived from the shadcn/ui setup (radix-nova style, neutral base color) configured in `components.json` and defined in `app/globals.css`.

---

## Color Palette (Neutral)

All colors use the `oklch` color space. Light and dark mode values are toggled via the `.dark` class.

### Core

| Token              | Light                  | Dark                      |
| ------------------ | ---------------------- | ------------------------- |
| `--background`     | `oklch(1 0 0)`         | `oklch(0.145 0 0)`        |
| `--foreground`     | `oklch(0.145 0 0)`     | `oklch(0.985 0 0)`        |
| `--primary`        | `oklch(0.205 0 0)`     | `oklch(0.87 0 0)`         |
| `--primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)`        |
| `--secondary`      | `oklch(0.97 0 0)`      | `oklch(0.269 0 0)`        |
| `--secondary-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)`      |
| `--muted`          | `oklch(0.97 0 0)`      | `oklch(0.269 0 0)`        |
| `--muted-foreground` | `oklch(0.556 0 0)`   | `oklch(0.708 0 0)`        |
| `--accent`         | `oklch(0.97 0 0)`      | `oklch(0.371 0 0)`        |
| `--accent-foreground` | `oklch(0.205 0 0)`  | `oklch(0.985 0 0)`        |
| `--destructive`    | `oklch(0.58 0.22 27)`  | `oklch(0.704 0.191 22.216)` |

### Surfaces

| Token                  | Light              | Dark               |
| ---------------------- | ------------------ | ------------------ |
| `--card`               | `oklch(1 0 0)`     | `oklch(0.205 0 0)` |
| `--card-foreground`    | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--popover`            | `oklch(1 0 0)`     | `oklch(0.205 0 0)` |
| `--popover-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |

### Borders & Inputs

| Token      | Light              | Dark                  |
| ---------- | ------------------ | --------------------- |
| `--border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)`  |
| `--input`  | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)`  |
| `--ring`   | `oklch(0.708 0 0)` | `oklch(0.556 0 0)`    |

### Sidebar

| Token                          | Light              | Dark               |
| ------------------------------ | ------------------ | ------------------ |
| `--sidebar`                    | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` |
| `--sidebar-foreground`         | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--sidebar-primary`            | `oklch(0.205 0 0)` | `oklch(0.488 0.243 264.376)` |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` |
| `--sidebar-accent`             | `oklch(0.97 0 0)`  | `oklch(0.269 0 0)` |
| `--sidebar-accent-foreground`  | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| `--sidebar-border`             | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` |
| `--sidebar-ring`               | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` |

### Chart Colors

| Token      | Value                          |
| ---------- | ------------------------------ |
| `--chart-1` | `oklch(0.809 0.105 251.813)` |
| `--chart-2` | `oklch(0.623 0.214 259.815)` |
| `--chart-3` | `oklch(0.546 0.245 262.881)` |
| `--chart-4` | `oklch(0.488 0.243 264.376)` |
| `--chart-5` | `oklch(0.424 0.199 265.638)` |

---

## Border Radius

Base radius: `--radius: 0.875rem` (14px)

| Token          | Value                              | Computed |
| -------------- | ---------------------------------- | -------- |
| `--radius-sm`  | `calc(var(--radius) - 4px)`        | 10px     |
| `--radius-md`  | `calc(var(--radius) - 2px)`        | 12px     |
| `--radius-lg`  | `var(--radius)`                    | 14px     |
| `--radius-xl`  | `calc(var(--radius) + 4px)`        | 18px     |
| `--radius-2xl` | `calc(var(--radius) + 8px)`        | 22px     |
| `--radius-3xl` | `calc(var(--radius) + 12px)`       | 26px     |
| `--radius-4xl` | `calc(var(--radius) + 16px)`       | 30px     |

Button default: `rounded-lg` (14px). Smaller buttons use `rounded-[min(var(--radius-md),Npx)]` to cap the radius.

---

## Typography

| Token                | Font Family     | Loader           |
| -------------------- | --------------- | ---------------- |
| `--font-sans`        | Inter           | `next/font/google` (variable on `<html>`) |
| `--font-geist-sans`  | Geist           | `next/font/google` (variable on `<body>`) |
| `--font-geist-mono`  | Geist Mono      | `next/font/google` (variable on `<body>`) |

Tailwind mapping: `--font-sans` → `font-sans`, `--font-geist-mono` → `font-mono`.

---

## Dark Mode

Activated via `.dark` class on an ancestor element. Defined with Tailwind v4 custom variant:

```css
@custom-variant dark (&:is(.dark *));
```

---

## Tailwind v4 Setup

- PostCSS plugin: `@tailwindcss/postcss`
- Animations: `tw-animate-css` (imported in globals.css)
- shadcn layer: `shadcn/tailwind.css` (imported in globals.css)

Base layer applies `border-border` and `outline-ring/50` to all elements, and `bg-background text-foreground` to `body`.

---

## Sidebar Dimensions

| Constant                | Value    |
| ----------------------- | -------- |
| `SIDEBAR_WIDTH`         | `16rem`  |
| `SIDEBAR_WIDTH_MOBILE`  | `18rem`  |
| `SIDEBAR_WIDTH_ICON`    | `3rem`   |

Collapsible modes: `offcanvas` (slides off), `icon` (collapses to icon width), `none` (always visible). Keyboard shortcut: `Cmd/Ctrl + B`.

---

## Icons

All icons sourced from `lucide-react`. Default sizing in components: `size-4` (16px). Do not mix icon libraries.

---

## Component Conventions

- **shadcn style:** `radix-nova`
- **Base color:** `neutral`
- **CSS variables:** Enabled (`cssVariables: true` in `components.json`)
- **RSC support:** Components are RSC-compatible by default; client components marked with `"use client"`
- **Path aliases:** `@/components`, `@/components/ui`, `@/lib`, `@/hooks`
- **Class merging:** Use `cn()` from `@/lib/utils` (wraps `clsx` + `tailwind-merge`)
