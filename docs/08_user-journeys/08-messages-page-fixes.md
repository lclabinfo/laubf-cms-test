# Messages Page Fixes — Implementation Plan

**Date:** 2026-03-03
**Status:** In Progress

---

## Overview

Comprehensive fixes across the Messages CMS pages: table/list view, editor, video tab, transcript editor, Bible study tab, and filter/column configuration.

---

## 1. Table / Page Fixes

### 1.1 Weird dot next to the "..." actions button
**File:** `components/cms/messages/columns.tsx` (line 54-57)
**Issue:** A stray visual dot appears next to the MoreHorizontal (…) icon button on the right edge of each table row.
**Root cause:** The `<Button variant="ghost" size="icon-sm">` wrapping `<MoreHorizontal>` may have a stray list-style bullet from table cell rendering, or an unintended pseudo-element from the button/dropdown trigger styles.

**Brainstormed approaches:**
- **A) Add `list-style: none` / check for stray `::before`/`::after` pseudo-elements** — Inspect the rendered output for any CSS pseudo-elements adding the dot. Quick CSS fix.
- **B) Ensure the actions column cell has `className="text-right"` or explicit styling** — The actions column definition (line 303) has no `cell` wrapper styling. Adding proper cell alignment may eliminate the dot.
- **C) Check if the dot is from the `<span className="sr-only">Open menu</span>`** — If the sr-only styling is broken, it could render a visible period/dot. Verify sr-only class works correctly.

**Chosen approach:** B + A — Add proper cell styling and inspect for pseudo-elements. The most common cause in TanStack table is missing cell padding/alignment configuration.

### 1.2 Series tab — Remove image thumbnails
**Files:** `components/cms/messages/series/card-grid.tsx`, `components/cms/messages/series/list-view.tsx`
**Issue:** Series cards show image thumbnails, but there's no real value in series images. Should show a clean card with just name + icon.

**Brainstormed approaches:**
- **A) Remove image area entirely, show icon placeholder** — Clean card with just series name, count, and a subtle icon (e.g., `Library` or `FolderOpen`). No upload UI.
- **B) Replace image with selectable icon** — Let users pick from a set of Lucide icons for their series. Icon selector dropdown.
- **C) Remove image area, add optional icon field for later** — Remove the image display now, keep the data model field. Later add icon selection.

**Chosen approach:** C — Remove the image thumbnail display from card-grid and list-view. Show a subtle icon (e.g., `Library`) as default. Keep the imageUrl field in the data model for future use. Remove the image upload component from the series detail page. This is the least-effort change that delivers the user's request.

---

## 2. Editor Fixes

### 2.1 Verify exit-without-saving warning
**File:** `components/cms/messages/entry/entry-form.tsx` (lines 284-290, 858-880)
**Issue:** Need to verify the unsaved changes warning triggers correctly on: back button, Cancel button, browser back, and tab/window close.

**Brainstormed approaches:**
- **A) Add `beforeunload` browser event listener** — Catches browser back/tab close. Combined with existing `isDirty` + `cancelConfirmOpen` dialog for in-app navigation.
- **B) Use Next.js `useRouter` events / route change interception** — Intercept route changes before they happen. More robust for SPA navigation.
- **C) Add both `beforeunload` AND fix the back button handler** — Currently the back `<Link>` uses `asChild` on a `<Button>` wrapping `<Link href="/cms/messages">`. This means clicking the arrow navigates immediately without checking `isDirty`. Need to intercept.

**Chosen approach:** C — The back button at line 348-351 is a raw `<Link>` that bypasses the dirty check entirely. Fix this to call `handleCancel()` instead. Also add `beforeunload` event listener for browser-level protection. Both are needed for complete coverage.

---

## 3. Bible Study Fixes

### 3.1 Attachments not showing in CMS
**File:** `components/cms/messages/entry/entry-form.tsx` (lines 751-816)
**Issue:** Attachments that exist in the database (imported from legacy data with URLs) show on the public site but don't appear in the CMS editor. The CMS attachment upload creates objects with `{ id, name, size, type }` but no `url`. Legacy data has `{ id, name, url }` format.

**Brainstormed approaches:**
- **A) Fix attachment display to show URL-based attachments** — When an attachment has a `url` field, show it as a download link. When it only has `name`/`size`, show as a pending upload placeholder.
- **B) Normalize attachment data on load** — When loading a message into the editor, ensure all attachments have consistent shape. Map legacy `url`-based attachments to include `size` and `type` from the URL.
- **C) Show all attachments regardless of shape, with download links for those with URLs** — Most pragmatic. Display name + download button if URL exists, or name + size if newly uploaded.

**Chosen approach:** A + C — Ensure the attachment list in the CMS editor renders correctly for both legacy (URL-based) and new (upload-based) attachments. Add download/open link for attachments that have URLs.

---

## 4. Video Fixes

### 4.1 Progressive video editor
**File:** `components/cms/messages/entry/video-tab.tsx`
**Issue:** Currently shows all fields (URL, description, duration, audio URL, transcript, live transcript) at once. Should be progressive: show only "Enter Video URL" first, then reveal the rest after URL is verified.

**Brainstormed approaches:**
- **A) Conditional rendering based on `checked` state** — Only show description, transcript, etc. after URL is verified. Simple boolean gate.
- **B) Accordion/stepper pattern** — Step 1: Enter URL. Step 2: Metadata. Step 3: Transcript. More structured but heavier.
- **C) Fade-in animation on verified** — Show URL field always, other fields animate in after verification. Subtle and clean.

**Chosen approach:** A — Use the existing `checked` state (and verify `videoUrl` prop on mount) to conditionally render everything below the URL input. When no URL is set, show only the URL field with a helpful message. When URL is verified, reveal the rest with a clean transition.

### 4.2 Transcript editor restructuring
**Files:** `components/cms/messages/entry/video-tab.tsx`, `components/cms/messages/entry/transcript-editor.tsx`
**Issue:** Multiple problems:
1. "Timestamped Segments" is wrong naming — should be "Live Captions"
2. Separate "Live Transcript (Auto-generated)" textarea at bottom of video-tab.tsx should be removed
3. The tab order should be: "Message Transcript" (full text, the raw tab) first, "Live Captions" (timestamped segments) second
4. Use inline pill-style shadcn tabs instead of current line tabs

**Brainstormed approaches:**
- **A) Restructure in-place** — Rename tabs, reorder, remove the separate live transcript textarea, merge the `liveTranscript` state into the transcript editor's segments.
- **B) Rewrite transcript editor as two-panel layout** — Left panel: message transcript (full text). Right panel: live captions (timestamped). Side-by-side on desktop.
- **C) Keep single tabbed editor, just rename and reorder** — Minimal change, cleanest. The "Live Captions" tab shows timestamped segments, the "Message Transcript" tab shows full text.

**Chosen approach:** C — Rename "Timestamped Segments" → "Live Captions", rename "Full Transcript" → "Message Transcript", reorder so Message Transcript is first tab, remove the separate `liveTranscript` textarea from video-tab.tsx, and switch to inline pill-style tabs (`variant="pill"` or custom inline styling). The `liveTranscript` data will be derived from/stored as the timestamped segments.

### 4.3 Delete Duration & Audio URL fields
**Files:** `components/cms/messages/entry/video-tab.tsx`, `components/cms/messages/entry/entry-form.tsx`
**Issue:** Duration and Audio URL fields should be removed from the video editor UI.

**Brainstormed approaches:**
- **A) Remove UI only, keep state** — Remove the input fields but keep the state variables for backward compatibility with existing data.
- **B) Remove UI and state completely** — Full cleanup including removing from `buildMessageData()`, `snapshotFields()`, and props.
- **C) Remove UI, keep data model** — Remove from the editor but keep in the data types so existing data isn't lost.

**Chosen approach:** A — Remove the input fields and labels from the video-tab.tsx UI. Keep the state in entry-form.tsx and the data model intact so existing data isn't lost. Remove the props from VideoTab interface. The fields can be auto-populated later via YouTube API import.

### 4.4 YouTube API .env variable
**File:** `.env.example` (new file)
**Issue:** Need to create `.env.example` with all environment variables documented, including `YOUTUBE_API_KEY`.

**Chosen approach:** Create `.env.example` with all variables from the audit, properly commented and organized by category.

### 4.5 AI captions .env variable
**File:** `.env.example` (same as above)
**Issue:** Azure OpenAI variables need to be documented in `.env.example`.

**Chosen approach:** Include all Azure OpenAI variables in the `.env.example` file.

---

## 5. Filter/Column Issues

### 5.1 Rename "Date" column for clarity
**File:** `components/cms/messages/columns.tsx`
**Issue:** Two date columns ("Message Date" and "Posted") could be confusing. The header says "Message Date" but column label in toolbar says "Date".

**Brainstormed approaches:**
- **A) Rename the column header to "Delivered"** — Clearly distinguishes from "Posted". Short and clear.
- **B) Keep "Message Date" header, update column visibility label** — Ensure the column dropdown label matches the header text.
- **C) Rename to "Date Delivered" and "Date Posted"** — Both columns get explicit names with "Date" prefix.

**Chosen approach:** B — The column header already says "Message Date" (line 190). Update the `columnLabels` map in `toolbar.tsx` to change `date: "Date"` to `date: "Message Date"` for consistency. This is the minimal fix.

### 5.2 Hide "Date Posted" from default columns
**Files:** `components/cms/messages/columns.tsx`, `app/cms/(dashboard)/messages/page.tsx`
**Issue:** The "Posted" column takes up space and isn't essential for default view. Should be hidden by default.

**Brainstormed approaches:**
- **A) Add `publishedAt` to default hidden columns** — In the page.tsx column visibility state, add `publishedAt: false`.
- **B) Remove the column entirely** — Too aggressive, some users may want it.
- **C) Hide by default but keep in column visibility dropdown** — User can toggle it on if needed.

**Chosen approach:** A/C — Add `publishedAt: false` to the `columnVisibility` state initialization alongside the existing `status: false`. The column remains available in the visibility dropdown.

### 5.3 Filter pills UI/UX improvement
**File:** `components/cms/messages/toolbar.tsx` (lines 203-242)
**Issue:** Filter badges are visually off and have small click targets. The `<button>` inside the badge for the X close is too small.

**Brainstormed approaches:**
- **A) Increase badge padding and X button hit target** — Add `min-h-[28px]` to badges, make X button `p-1` with larger click area.
- **B) Use a dedicated FilterPill component** — Encapsulate the filter badge + close button pattern in a reusable component with proper sizing.
- **C) Switch to shadcn `Tag` or `Chip` component pattern** — More standard chip pattern with better built-in close button sizing.

**Chosen approach:** A — Increase the click target on filter badge close buttons. Add `p-0.5` to the X button wrapper, ensure badges have `h-7 px-2.5` for proper sizing, and add `gap-1.5` between text and close icon.

### 5.4 Verify chip/badge scaling
**File:** `components/ui/badge.tsx`
**Issue:** Need to verify that badge component sizing is consistent and scales properly at different viewports.

**Chosen approach:** Review the badge component's size variants and ensure consistent sizing. This is a verification task — check that badges render at proper scale across the messages table.

---

## Implementation Checklist

### Team Assignment
- **Agent 1 (Table & Columns):** Items 1.1, 1.2, 5.1, 5.2, 5.3, 5.4
- **Agent 2 (Editor & Video):** Items 2.1, 4.1, 4.2, 4.3
- **Agent 3 (Bible Study & Env):** Items 3.1, 4.4, 4.5
- **Documentation Agent:** Track progress below

### Progress Tracker

| # | Item | Status | Agent | Notes |
|---|------|--------|-------|-------|
| 1.1 | Fix dot next to actions button | DONE | table-series-agent | Wrapped cell in `<div className="flex justify-end">` |
| 1.2 | Remove series image thumbnails | DONE | table-series-agent | Card-grid, list-view, series detail page all updated. Library icon replaces images. |
| 2.1 | Verify exit-without-saving warning | DONE | editor-video-agent | Back button changed to onClick={handleCancel}. Added beforeunload listener. |
| 3.1 | Fix CMS attachment display | DONE | attachments-env-agent | Attachments with URLs now show download link. "External file" label for URL-only attachments. |
| 4.1 | Progressive video editor | DONE | editor-video-agent | Content hidden until URL verified. Empty state with Video icon shown when no URL. |
| 4.2 | Restructure transcript editor | DONE | editor-video-agent | Tabs renamed: "Message Transcript" (first) + "Live Captions" (second). Pill-style tabs. Live Transcript textarea removed. |
| 4.3 | Remove Duration & Audio URL | DONE | editor-video-agent | UI removed from video-tab. Props cleaned up. State kept in entry-form for backward compat. |
| 4.4 | Create .env.example (YouTube) | DONE | attachments-env-agent | YOUTUBE_API_KEY included with setup instructions. |
| 4.5 | Create .env.example (Azure AI) | DONE | attachments-env-agent | All 4 Azure OpenAI vars included with setup instructions. |
| 5.1 | Rename date column label | DONE | filters-columns-agent | `publishedAt` label changed to "Date Posted" in column dropdown. |
| 5.2 | Hide Date Posted by default | DONE | filters-columns-agent | Added `publishedAt: false` to default columnVisibility state. |
| 5.3 | Fix filter pills UI/click targets | DONE | filters-columns-agent | Badges now h-7 px-2.5 text-xs. Close buttons have p-1 padding. transition-colors added. |
| 5.4 | Verify badge/chip scaling | DONE | filters-columns-agent | Verified badge component has proper size variants. |

### Review Checklist (Second Pass) — Completed 2026-03-03
- [x] All table columns render correctly — actions cell wrapped in flex justify-end
- [x] Series cards show clean icon-only design — Library icon, no image area
- [x] Back button triggers unsaved changes warning — onClick={handleCancel} instead of Link
- [x] Browser back/close triggers beforeunload warning — useEffect listener added
- [x] Attachments with URLs display correctly in CMS — ExternalLink button for URL-based attachments
- [x] Video tab shows only URL input until verified — conditional rendering with empty state
- [x] Transcript tabs renamed and reordered correctly — "Message Transcript" first, "Live Captions" second
- [x] Duration & Audio URL fields removed from UI — props cleaned, state kept for backward compat
- [x] .env.example contains all required variables — 15 variables across 7 categories
- [x] Filter pills have proper click targets — h-7 px-2.5 badges, p-1 close buttons
- [x] All badges scale consistently — verified in badge component
- [x] No TypeScript errors (tsc --noEmit passed)
- [x] No new lint errors (all existing errors in pre-existing scripts only)
- [x] Unused imports cleaned up (useMemo, Link removed from entry-form.tsx)
- [x] Stale tab name reference fixed in transcript help text ("Message Transcript" instead of "Full Text")
