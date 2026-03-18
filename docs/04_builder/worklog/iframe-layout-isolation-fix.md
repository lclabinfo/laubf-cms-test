# Iframe Preview Layout Isolation — Root Cause & Fix

> **Date:** March 18, 2026
> **Status:** Proposed — awaiting approval
> **Blocks:** Iframe canvas migration (all responsive rendering)

---

## 1. The Bug

The builder's iframe preview is broken in three ways:

1. **Hero section blank / content clipped** — The hero uses `min-h-screen` and renders a video, but the content is invisible
2. **Page unscrollable** — Content below the fold is inaccessible
3. **Agentation toolbar renders inside preview** — Dev-only overlay appears inside the iframe

All three have the **same root cause**: Next.js layout nesting.

---

## 2. Root Cause: Next.js Layout Nesting

In Next.js App Router, layouts are **always nested** — a child route's layout adds to the parent, it never replaces it. Our passthrough `preview/layout.tsx` that returns `<>{children}</>` does absolutely nothing useful because the parent layouts still wrap the content.

**Current layout nesting for the preview iframe route:**

```
app/layout.tsx                          ← html/body + Agentation (dev-only)
  app/cms/layout.tsx                    ← SessionProvider + CmsThemeProvider + <div data-cms min-h-screen>
    app/cms/website/builder/layout.tsx  ← auth + <div h-screen w-screen overflow-hidden> + Toaster
      preview/layout.tsx                ← passthrough (useless)
        preview/[pageId]/page.tsx       ← our preview content
```

The builder layout at `app/cms/website/builder/layout.tsx` wraps **every route** under `builder/`, including the preview. Its `h-screen w-screen overflow-hidden` div:

- **`overflow-hidden`** — clips ALL content beyond the viewport height. The hero section renders but is invisible. Scrolling is impossible.
- **`h-screen`** — constrains the iframe document to exactly one viewport height.
- **Toaster** — renders a duplicate toast provider inside the iframe.

The CMS layout at `app/cms/layout.tsx` adds:
- **`data-cms`** — scopes CMS design tokens, which can conflict with `data-website` scoped tokens
- **SessionProvider + CmsThemeProvider** — unnecessary overhead inside the preview

The root layout at `app/layout.tsx` adds:
- **Agentation** — dev-mode debug toolbar, renders inside the iframe

**The passthrough layout cannot fix this.** In Next.js, there is no mechanism to "skip" or "replace" a parent layout. This is confirmed by the Next.js team in [GitHub Discussion #47686](https://github.com/vercel/next.js/discussions/47686) — the official answer is to use **route groups**.

---

## 3. How Other Website Builders Handle This

We researched five production website builders to understand how the industry handles iframe preview isolation:

### Webstudio (open-source, most documented)

> "Webstudio uses an iframe with postMessage as a communication layer combined with Nanostore subscriptions and JSON patches to sync states and data between the Builder and Canvas."
>
> "Iframes are used only in the builder, and Shadow DOM is not suitable for encapsulating an entire document."

— [Webstudio Architecture Overview](https://webstudio.is/blog/webstudios-architecture-an-overview)

**Pattern:** The iframe renders the website preview. The builder UI (panels, toolbar, settings) is the parent frame. The two communicate via postMessage. The iframe is a **completely separate rendering context** — no builder chrome wraps it.

### Beaver Builder (WordPress, 1M+ installs)

> "The iframe UI works by using two 'windows.' One is the browser window you use to view the builder (the parent window). The other is an iframe window used to render the page content for you to edit."
>
> "Responsive iFrame User Interface displays the layout that you are editing for accurate previews on a variety of devices."

— [Beaver Builder iframe UI Docs](https://docs.wpbeaverbuilder.com/beaver-builder/developer/iframe-ui/)

**Pattern:** Two-window architecture. The parent window contains builder chrome. The iframe renders the actual page content. The iframe is sized to the target device width for responsive preview. No builder chrome wraps the iframe content.

### Shopify Theme Editor

> "The theme editor is a tool that lets merchants customize the content and appearance of their store, and preview changes in real time."

— [Shopify Theme Editor Docs](https://shopify.dev/docs/storefronts/themes/tools/online-editor)

**Pattern:** The preview pane renders the actual storefront (either the live URL or a development server at `127.0.0.1:9292`). The editor sidebar is separate. The storefront preview has no editor chrome wrapping it — it's the real storefront with theme editor integration hooks.

### Framer

> "Everything you build in Framer is a live website. What you see on the canvas is what gets published."

— [Framer Features](https://www.framer.com/features/design/)

**Pattern:** WYSIWYG canvas IS the live site. No separate preview route needed because the canvas renders the actual website. Editor panels (layers, properties) are separate from the canvas area.

### Webflow

> "Designer Extensions are single-page applications that run within the Webflow interface through a secure iframe."

— [Webflow Designer API Docs](https://developers.webflow.com/apps/docs/designer-extensions)

**Pattern:** The designer canvas is its own rendering context. Extensions run in separate iframes. Device preview allows dragging across breakpoints. The canvas and editor panels are separate rendering contexts.

### Common Pattern

**Every builder separates the preview rendering context from the editor chrome.** The preview must be a clean rendering environment with:
- No editor chrome (toolbars, sidebars, modals) wrapping it
- No editor CSS (overflow constraints, fixed heights) affecting it
- Its own viewport for responsive media queries
- Full document scrolling capability

Our iframe approach is correct. The bug is that our preview route hasn't achieved the separation — the builder layout still wraps it.

---

## 4. Clarification: URLs and Page Navigation

**Important:** This fix does NOT change any user-facing URLs. Let me clarify what's what:

| URL | Who sees it | Purpose | Changes? |
|-----|-------------|---------|----------|
| `/cms/website/builder` | User (browser) | Builder entry, redirects to first page | **No** |
| `/cms/website/builder/[pageId]` | User (browser) | Builder editor for a specific page | **No** |
| `/cms/website/builder/preview/[pageId]` | Nobody (iframe src) | Preview rendering inside iframe | **No** |

When the user clicks a different page in the page tree:
- The **browser URL** changes from `/cms/website/builder/page-A` to `/cms/website/builder/page-B` — this is existing behavior, unchanged
- The **iframe src** changes internally — this is invisible to the user

The route group we're creating (`(editor)`) does not affect URLs at all. It only changes which `layout.tsx` files wrap which routes. This is a file-system organizational change, not a URL structure change.

---

## 5. Proposed Fix: Route Group Isolation

### The Approach

Split the builder directory into a route group for the editor (with chrome) and a plain directory for the preview (without chrome):

```
app/cms/website/builder/
  layout.tsx                  ← AUTH ONLY: session check, redirect if not logged in
  (editor)/                   ← route group: wraps editor pages with builder chrome
    layout.tsx                ← CHROME: h-screen, overflow-hidden, Toaster
    [pageId]/page.tsx         ← builder editor page
    page.tsx                  ← entry redirect (homepage detection)
  preview/
    layout.tsx                ← MINIMAL: reset CMS styles, hide Agentation
    [pageId]/page.tsx         ← iframe preview page
```

### Layout nesting AFTER fix

**For the editor** (what the user sees in their browser):
```
root → CMS → builder(auth) → (editor)(chrome) → page
```
Identical to current behavior. `h-screen`, `overflow-hidden`, Toaster all present.

**For the preview iframe** (what renders inside the iframe):
```
root → CMS → builder(auth) → preview(minimal) → page
```
No builder chrome. No `overflow-hidden`. No Toaster. Just auth + minimal reset + website content.

### Why Route Groups (the Next.js-endorsed pattern)

Route groups are Next.js's official solution for exactly this problem. From the [Next.js docs](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups):

> "Route groups can be used to opt specific route segments into a layout... without affecting the URL path."

This is not a workaround — it's the designed mechanism for layout isolation in the App Router.

---

## 6. Exact File Changes

### Files to create

**`app/cms/website/builder/(editor)/layout.tsx`** — Builder chrome (moved from current `layout.tsx`)
```tsx
import { Toaster } from "sonner"

export default function BuilderEditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground">
      {children}
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
```

### Files to rewrite

**`app/cms/website/builder/layout.tsx`** — Auth only (strip chrome)
```tsx
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function BuilderLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/cms/login")
  if (!session.churchId) redirect("/cms/no-access")
  return <>{children}</>
}
```

**`app/cms/website/builder/preview/layout.tsx`** — Minimal with CMS style resets
```tsx
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        [data-cms] { min-height: auto !important; overflow: visible !important; background: transparent !important; }
        body { margin: 0; overflow-x: hidden; }
        [data-agentation], .agentation-toolbar { display: none !important; }
      `}} />
      {children}
    </>
  )
}
```

### Files to move (no code changes)

| From | To |
|------|-----|
| `app/cms/website/builder/[pageId]/page.tsx` | `app/cms/website/builder/(editor)/[pageId]/page.tsx` |
| `app/cms/website/builder/page.tsx` | `app/cms/website/builder/(editor)/page.tsx` |

### Files to edit

**`components/cms/website/builder/builder-canvas.tsx`** — Add `allow="autoplay"` to iframe
```tsx
<iframe
  key={iframeKey}
  ref={iframeRef}
  src={`/cms/website/builder/preview/${pageId}`}
  allow="autoplay"        // ← ADD THIS
  className="w-full border-0"
  ...
/>
```

### Summary

| Action | Count | Risk |
|--------|-------|------|
| Create new files | 1 (`(editor)/layout.tsx`) | None — new file |
| Rewrite files | 2 (`builder/layout.tsx`, `preview/layout.tsx`) | Low — simpler than before |
| Move files | 2 (`[pageId]/page.tsx`, `page.tsx`) | None — just directory move |
| Edit files | 1 (`builder-canvas.tsx`) | None — one attribute |
| **Total** | **6 operations** | **Low** |

No logic changes. No component changes. No URL changes. Just file organization and layout splitting.

---

## 7. What This Fixes

| Issue | Root Cause | How This Fixes It |
|-------|-----------|------------------|
| Hero section blank | `overflow-hidden` on builder layout clips content | Preview no longer wrapped by builder layout |
| Page unscrollable | `h-screen overflow-hidden` constrains iframe document | Preview has no height/overflow constraints |
| Agentation in preview | Root layout injects globally | Preview layout hides it via CSS |
| Duplicate Toaster | Builder layout includes Toaster | Preview doesn't inherit builder layout |
| CMS styles in preview | `data-cms` div wraps preview | Preview layout resets CMS styles |
| Video won't autoplay | Missing `allow="autoplay"` on iframe | Added to iframe element |

---

## 8. What This Does NOT Change

- All user-facing URLs — identical
- Builder editor behavior — identical (same layout chrome)
- Iframe protocol / postMessage — no changes
- Section components — no changes
- Editor components — no changes
- builder-shell, builder-preview-client, iframe-protocol — no changes
- Auth protection — both editor and preview are still behind auth
