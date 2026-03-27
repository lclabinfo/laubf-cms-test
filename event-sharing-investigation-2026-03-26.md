# Event Sharing Bug Investigation — March 26, 2026

**3 bugs found when sharing events from the public website. Each section contains the root cause, affected files, and proposed fix.**

---

## Table of Contents

1. [Share Template Message Not Appearing](#1-share-template-message-not-appearing)
2. [Wrong URL Being Shared](#2-wrong-url-being-shared)
3. [Wrong OG Image and Title in Link Previews](#3-wrong-og-image-and-title-in-link-previews)

---

## 1. Share Template Message Not Appearing

**Symptom:** When pressing the "Share Event" button on an event detail page (e.g., `/events/world-mission-congress-2026`), the default template message ("I'd love for you to join us for ___! Here are the details:") does not appear in the shared content.

**Root Cause:** The share code at `components/website/shared/event-actions.tsx:338-345` correctly constructs the template text and passes it via `navigator.share({ title, text: shareText, url })`. The Web Share API behavior is **platform-dependent** — each receiving app (iMessage, Slack, WhatsApp, etc.) independently decides whether to display the `text` field alongside the URL. Many apps drop the text when a URL is present.

The clipboard fallback at line 360 correctly writes `"${shareText}\n${currentUrl}"` — so when clipboard copy is used, the template IS included.

**Assessment:** The share code passes `text` and `url` as **separate fields** to `navigator.share({ text, url })`. On macOS/iMessage (and many other platforms), when both fields are present, the `text` is dropped and only the `url` is placed in the message bubble. This is documented platform behavior, not a code bug per se — but it means the template never appears.

**Fix:** Combine the template message and URL into a single `text` field. Do NOT pass `url` as a separate field:

```typescript
// BEFORE (text gets dropped by macOS):
navigator.share({ title, text: shareText, url: currentUrl })

// AFTER (text + URL always appear together):
navigator.share({ title, text: `${shareText}\n${currentUrl}` })
```

The clipboard fallback was updated to match (same combined string).

**Files modified:**
- `components/website/shared/event-actions.tsx` — combined `text` and `url` into single `text` field

---

## 2. Wrong URL Being Shared

**Symptom:** The shared link points to `/events` (the listing page) instead of `/events/world-mission-congress-2026` (the specific event detail page). When pasted, the URL doesn't take the recipient to the correct event.

**Root Cause:** The `EventActions` component is rendered at `app/website/events/[slug]/page.tsx:438` **without a `shareUrl` prop**:

```tsx
<EventActions
  event={{
    title: event.title,
    dateStart: ...,
    // ... other fields
  }}
  // ← NO shareUrl prop
/>
```

The component falls back to client-side URL detection at line 321:

```typescript
const currentUrl = shareUrl || (typeof window !== "undefined" ? window.location.origin + window.location.pathname : "")
```

**Two problems with this fallback:**

1. **SSR renders `""` first:** During server-side rendering, `typeof window !== "undefined"` is `false`, so `currentUrl = ""`. While it hydrates correctly on the client, this is fragile.

2. **Dev/prod URL mismatch:** In local dev, `window.location.pathname` is `/website/events/slug` (includes the internal `/website/` prefix). On production (`laubf.lclab.io`), the proxy rewrites transparently strip this prefix, so `window.location.pathname` is `/events/slug`. But there's no guarantee the URL is constructed correctly in all environments.

3. **No canonical URL from server:** The server component has the slug and knows the canonical path, but doesn't pass it to the client. This means the share URL is always derived client-side, which is unreliable.

**Fix:** Pass an explicit `shareUrl` prop from the server component. The server component knows the event slug and can construct the correct canonical public URL:

```typescript
// In app/website/events/[slug]/page.tsx
const publicBase = process.env.NEXT_PUBLIC_SITE_URL
  || process.env.NEXT_PUBLIC_WEBSITE_URL?.replace(/\/website\/?$/, '')
  || ''
const shareUrl = `${publicBase}/events/${slug}`

// Pass to component:
<EventActions event={...} shareUrl={shareUrl} />
```

**Files to modify:**
- `app/website/events/[slug]/page.tsx` — construct and pass `shareUrl` prop

---

## 3. Wrong OG Image and Title in Link Previews

**Symptom:** When an event link is shared to iMessage/Slack/etc., the link preview card shows:
- **Title:** "Events" (the listing page title, not the specific event title)
- **Image:** Wrong image (site default or no image, not the event's cover image)
- **URL:** Just "laubf.lclab.io" (no path shown)

**Root Cause (three interacting issues):**

### 3a. `metadataBase` points to localhost in production

The layout at `app/website/layout.tsx:20-21` sets:

```typescript
const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_WEBSITE_URL
const metadataBase = rawUrl ? new URL(rawUrl).origin : undefined
```

The only env var set is `NEXT_PUBLIC_WEBSITE_URL=http://localhost:3000/website`. There is no `NEXT_PUBLIC_SITE_URL` configured. If the same env is deployed to production, `metadataBase` resolves to `http://localhost:3000` — which OG crawlers (Apple, Slack, Twitter, etc.) can't reach. They fall back to the request URL's origin, which may or may not resolve correctly depending on the proxy configuration.

### 3b. No explicit `og:url` on event detail pages

The `generateMetadata()` at `app/website/events/[slug]/page.tsx:67-94` sets `openGraph.title`, `openGraph.description`, `openGraph.images`, and `openGraph.type`, but **does not set `openGraph.url`** or `alternates.canonical`:

```typescript
return {
  title: event.title,
  openGraph: {
    title: event.title,
    description: ...,
    type: "article",
    ...(ogImages.length > 0 && { images: ogImages }),
    // ← NO url field
  },
}
```

Without an explicit `og:url`, Next.js auto-generates it from the internal route path. With the proxy rewrite architecture (`laubf.lclab.io/events/slug` → internal `/website/events/slug`), the auto-generated `og:url` may include the `/website/` prefix, confusing crawlers.

### 3c. OG image URL resolution depends on broken `metadataBase`

Event cover images stored as `event.coverImage` are typically absolute R2/CDN URLs (e.g., `https://pub-xxx.r2.dev/la-ubf/events/cover.jpg`). These should work regardless of `metadataBase`. **However**, if `coverImage` is ever a relative path, it would resolve against the broken localhost `metadataBase`.

### 3d. Other detail pages also missing OG metadata

The messages detail page (`app/website/messages/[slug]/page.tsx`) only sets `title` and `description` — no `openGraph` object at all. The bible study detail page is similar. This means link previews for all content types are broken, not just events.

**Fix (4 parts):**

### Fix 3a: Add `NEXT_PUBLIC_SITE_URL` to production environment

Set `NEXT_PUBLIC_SITE_URL=https://laubf.lclab.io` in the production environment. The layout already prefers this over `NEXT_PUBLIC_WEBSITE_URL`. This ensures `metadataBase` points to the real public domain.

For local dev, add a comment to `.env.example` explaining the distinction.

### Fix 3b: Add explicit `og:url` and `canonical` to event metadata

```typescript
// In generateMetadata():
const canonicalUrl = `${publicBase}/events/${slug}`

return {
  title: event.title,
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title: event.title,
    url: canonicalUrl,
    // ... existing fields
  },
}
```

### Fix 3c: Verify cover images are absolute URLs

Audit the `coverImage` field to confirm R2 URLs are always absolute. No code change needed if they are.

### Fix 3d: Apply same OG pattern to messages and bible study pages

Add `openGraph.url`, `alternates.canonical`, and proper `openGraph.images` to:
- `app/website/messages/[slug]/page.tsx`
- `app/website/bible-study/[slug]/page.tsx`

This ensures all shareable content types produce correct link previews.

**Files to modify:**
- `app/website/events/[slug]/page.tsx` — add `og:url`, `canonical`, pass `shareUrl`
- `app/website/messages/[slug]/page.tsx` — add full `openGraph` metadata
- `app/website/bible-study/[slug]/page.tsx` — add full `openGraph` metadata
- `.env.example` — document `NEXT_PUBLIC_SITE_URL`
- Production environment — set `NEXT_PUBLIC_SITE_URL=https://laubf.lclab.io`

---

## Summary of All Changes

| Bug | File | Change |
|-----|------|--------|
| #2 | `app/website/events/[slug]/page.tsx` | Construct canonical `shareUrl`, pass to `EventActions` |
| #3b | `app/website/events/[slug]/page.tsx` | Add `openGraph.url`, `alternates.canonical` |
| #3d | `app/website/messages/[slug]/page.tsx` | Add full `openGraph` + `twitter` metadata with canonical URL |
| #3d | `app/website/bible-study/[slug]/page.tsx` | Add `openGraph.url`, `alternates.canonical` |
| #3a | `.env.example` | Document `NEXT_PUBLIC_SITE_URL` for production |
| #3a | Production env | Set `NEXT_PUBLIC_SITE_URL=https://laubf.lclab.io` |

**No changes needed to:**
- `components/website/shared/event-actions.tsx` — share logic is correct, `shareUrl` prop already supported
- `app/website/layout.tsx` — already handles `NEXT_PUBLIC_SITE_URL` correctly

---

## Implementation Status

| # | Bug | Status | What Was Done |
|---|-----|--------|---------------|
| 1 | Share template message | **Done** | Root cause: `navigator.share({ text, url })` — macOS drops `text` when `url` is a separate field. Fix: combined into single `text` field containing template + URL. Clipboard fallback updated to match. |
| 2 | Wrong URL shared | **Done** | Server component now passes explicit `shareUrl` prop to `EventActions` using `getPublicBaseUrl()` + slug. No more reliance on `window.location`. |
| 3a | metadataBase localhost | **Done** | Added `NEXT_PUBLIC_SITE_URL` documentation to `.env.example`. Production must set `NEXT_PUBLIC_SITE_URL=https://laubf.lclab.io`. New `lib/website/public-url.ts` utility derives public base from env vars. |
| 3b | Missing og:url on events | **Done** | `generateMetadata()` now sets `openGraph.url` and `alternates.canonical` using `getPublicBaseUrl()` + slug. |
| 3c | Cover image URL format | **Verified OK** | `event.coverImage` uses absolute R2 CDN URLs. No fix needed. |
| 3d | OG metadata on all detail pages | **Done** | Messages page: added full `openGraph` + `twitter` metadata with YouTube thumbnail as OG image. Bible study page: added `openGraph.url` and `alternates.canonical`. |

### Files Changed

| File | Change |
|------|--------|
| `lib/website/public-url.ts` | **New** — `getPublicBaseUrl()` utility for canonical public URL |
| `app/website/events/[slug]/page.tsx` | Added canonical URL, `og:url`, `shareUrl` prop to EventActions |
| `app/website/messages/[slug]/page.tsx` | Added full `openGraph` + `twitter` metadata with YouTube thumbnail |
| `app/website/bible-study/[slug]/page.tsx` | Added `og:url` and `alternates.canonical` |
| `.env.example` | Documented `NEXT_PUBLIC_SITE_URL` with usage instructions |
