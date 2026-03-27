# Bug Investigation Report — March 25, 2026

**10 engineers investigated 12 bugs found during the stakeholder demo. Each section contains the root cause, affected files, and a proposed fix.**

---

## Table of Contents

1. [ESV Default Not Applied / Bible Version Integration Broken](#1-esv-default-not-applied)
2. [Q&A Version Switch Not Independent](#2-qa-version-switch-not-independent)
3. [Old Bible Studies (2003+) Not Visible](#3-old-bible-studies-not-visible)
4. [Old Messages Not Visible](#4-old-messages-not-visible)
5. [Quick Links Icon Inconsistency](#5-quick-links-icon-inconsistency)
6. [Quick Links FAB Hover Not Working](#6-quick-links-fab-hover-not-working)
7. [Database / Memory / Backend Optimization](#7-database--memory--backend-optimization)
8. [Transcript Tab Missing on Bible Study Page](#8-transcript-tab-missing-on-bible-study-page)
9. [Event Share Template Message Not Appearing](#9-event-share-template-message-not-appearing)
10. [Featured Events — Remove Manual, Keep Builder Filters Only](#10-featured-events--remove-manual-keep-builder-filters-only)
11. [R2 Attachment Downloads Still Show UUID Filenames](#11-r2-attachment-downloads-still-show-uuid-filenames)
12. [Featured Events CMS ↔ Website Mismatch](#12-featured-events-cms--website-mismatch)

---

## 1. ESV Default Not Applied + Church Settings Not Flowing to Website + Version Ordering

**Symptom:** Whatever the church admin configures as the default Bible version in CMS settings is NOT being reflected on the public website (Bible study pages, Daily Bread, etc.). Additionally, disabling a version in the CMS still shows it in the website dropdown. There was also no way to reorder bible versions.

**Root Cause (three parts):**

**Part A (fixed previously):** The hardcoded fallback in `components/cms/church-profile/bible-version-settings.tsx` was NIV in 3 places. Changed to ESV.

**Part B — Default not applied:** In `study-detail-view.tsx:139`, the priority was `study.bibleVersion || churchDefaultVersion || "ESV"`. The per-study `bibleVersion` field comes from the related Message model's `bibleVersion` column, which has a schema default of `"ESV"`. This means every study with a related message had `bibleVersion: "ESV"`, which always took priority over the church admin's chosen default.

**Part C — Disabled versions still showing:** The version dropdown in `study-detail-view.tsx` iterated over the static `API_AVAILABLE_VERSIONS` constant (all 6 local versions: ESV, NIV, KJV, NLT, NASB, AMP) and completely ignored the church's `bibleVersions` enabled/disabled settings.

**Fix (March 26, 2026):**

1. **New DAL function** `getChurchBibleVersionConfig()` in `lib/dal/church.ts` — returns both `defaultVersion` and `enabledVersions` (preserving array order from the JSON settings) in a single DB query.

2. **Bible study detail page** (`app/website/bible-study/[slug]/page.tsx`) — now uses `getChurchBibleVersionConfig()` and passes both `churchDefaultVersion` and `enabledVersions` to the client component.

3. **Version priority fixed** in `study-detail-view.tsx` — changed to `churchDefaultVersion || study.bibleVersion || "ESV"`. The church admin's explicit setting now takes precedence over the per-study version (which is usually just the schema default "ESV").

4. **Enabled versions filtering** — the dropdown now builds its list from `enabledVersions` in the saved order (looking up metadata from `API_AVAILABLE_VERSIONS`), instead of showing all versions statically. Disabled versions no longer appear. If the default gets disabled, falls back to the first available version.

5. **DnD reordering in CMS** — `bible-version-settings.tsx` rebuilt with @dnd-kit (same pattern as `quick-links-editor.tsx`):
   - Default version pinned at top (filled star, non-draggable)
   - All other versions have GripVertical drag handles + star buttons to set as default
   - Disabled versions are dimmed but still draggable (for pre-positioning before enabling)
   - Setting a new default automatically moves it to position 0
   - `enabledVersions` array order = display order on the website
   - Every change (reorder, toggle, set default) auto-saves immediately

6. **Website respects custom order** — the study detail dropdown renders versions in the exact order stored in `enabledVersions`, with the default always first.

**Files modified:**
- `lib/dal/church.ts` — added `getChurchBibleVersionConfig()`
- `app/website/bible-study/[slug]/page.tsx` — passes `enabledVersions` prop
- `components/website/study-detail/study-detail-view.tsx` — filters by enabled, respects order, church default priority
- `components/cms/church-profile/bible-version-settings.tsx` — full rewrite with @dnd-kit DnD reordering

**Key principle:** The `bibleVersions` array in the church settings JSON is the single source of truth for which versions are available, in what order, and which is default. The CMS writes it, the website reads it. No hardcoded version lists on the website side.

---

## 2. Bible Version Not Independent Per Pane

**Symptom:** The study detail page has a split-pane layout (left + right). Both panes can display a "Bible" tab with a version selector dropdown. Changing the Bible version in one pane also changes it in the other pane — they share a single state. Each pane should have its own independent Bible version.

**Root Cause:** There is a **single `bibleVersion` state** in `components/website/study-detail/study-detail-view.tsx:136`:

```typescript
const [bibleVersion, setBibleVersion] = useState<string>(...)
const [fetchedBibleText, setFetchedBibleText] = useState<string | null>(null)
const [bibleTextLoading, setBibleTextLoading] = useState(false)
```

Both the left and right pane read from this same state. When either pane's version dropdown changes, it updates the shared state and both panes re-render with the new version.

**Fix:**

Refactor to per-pane state using a `Record<string, T>` pattern keyed by pane ID (e.g., `"left"`, `"right"`). This scales to any number of panes:

```typescript
// Per-pane Bible version state
const [paneVersions, setPaneVersions] = useState<Record<string, string>>({
  left: defaultVersion, right: defaultVersion
})
const [paneBibleText, setPaneBibleText] = useState<Record<string, string | null>>({})
const [paneBibleLoading, setPaneBibleLoading] = useState<Record<string, boolean>>({})
```

Update `handleVersionChange` to accept a `paneId` parameter. Update `renderContent` to pass the pane ID when rendering scripture. Each pane reads/writes only its own entry in the record.

**Files to modify:**
- `components/website/study-detail/study-detail-view.tsx` — refactor all Bible version state to per-pane Records

**Side effects:** None. The left/right tab states (`leftTab`, `rightTab`) are already independent. This makes Bible version follow the same pattern. Future-proofed for N panes.

---

## 3. Old Bible Studies (2003–mid 2025) Not Visible

**Symptom:** Only recent (~2025) Bible studies appear on the public website. Entries from mid-2025 back to 2003 are completely missing.

**Root Cause:** No pagination mechanism. The page fetched a single batch of results (originally 50) and passed them as a flat array to the client component. There was no way for the client to request additional pages. With `orderBy: dateFor desc`, only the newest batch was visible. Everything older was simply never fetched.

**Database is fine:** All 1,184 studies are PUBLISHED (1 ARCHIVED), 0 soft-deleted, dates span 2003–2026. The DAL query filters are correct.

**Fix:** Progressive background loading with page size kept at 50:

1. `app/website/bible-study/page.tsx` — passes `pagination` metadata (total, page, pageSize, totalPages) to the section component
2. `components/website/sections/all-bible-studies.tsx` — accepts and forwards pagination prop
3. `components/website/sections/all-bible-studies-client.tsx` — on mount, eagerly fetches ALL remaining pages from `/api/v1/bible-studies` in the background (pages 2–N, sequentially). Deduplication by ID prevents duplicates.
4. `lib/website/resolve-section-data.ts` — added pagination to resolved data for the page builder path

**Result:** Initial render shows 50 newest studies instantly. Within seconds, all 1,184 studies load progressively. All client-side filters (search, series, book, year) update as pages arrive.

---

## 4. Website Builder Preview Not Filtering Messages Correctly

**Symptom:** The public website correctly shows only messages with videos (`videoPublished: true` filter). However, the website **builder preview** is NOT applying this same filter — it shows messages that shouldn't be visible on the public site.

**Root Cause:** The `videoPublished: true` filter is correctly applied in `components/website/sections/all-messages.tsx` for the public website. The issue is that the builder preview iframe renders the section differently or bypasses the filter.

**Note:** A previous agent incorrectly removed the `videoPublished: true` filter from `all-messages.tsx`. This was REVERTED — the public website filter is correct and must stay.

**Fix:** Investigate how the builder preview renders the all-messages section and ensure it applies the same `videoPublished: true` filter as the public website.

**Files to investigate:**
- `components/cms/website/builder/` — builder preview rendering
- `components/website/sections/all-messages.tsx` — public website (correct, do not change)

**Side effects:** None once the builder preview matches the public website.

---

## 5. Quick Links Icon Inconsistency

**Symptom:** Quick links in the navbar dropdown show no icons, while the floating action button (FAB) at the bottom shows icons.

**Root Cause:** The navbar dropdown renders Quick Links in "compact mode" which explicitly hides icons. In `components/website/layout/dropdown-menu.tsx:185`:

```tsx
{!section.compact && Icon && (
  <Icon className="size-6 text-black-1 shrink-0" strokeWidth={1.5} />
)}
```

The `compact` flag is set to `true` for Quick Links sections (line 132: `compact: isQuickLinks`), so the icon never renders. Meanwhile, the FAB at `components/website/layout/quick-links-fab.tsx:145` always renders icons:

```tsx
<Icon className="size-[18px] text-black-2" strokeWidth={1.75} />
```

Both pull from the same data source and icon map — the rendering logic just differs.

**Fix:**

Always show icons in the dropdown, with conditional sizing for compact mode:

```tsx
// dropdown-menu.tsx:185
// FROM:
{!section.compact && Icon && (
  <Icon className="size-6 text-black-1 shrink-0" strokeWidth={1.5} />
)}

// TO:
{Icon && (
  <Icon
    className={cn(
      "shrink-0",
      section.compact ? "size-[18px] text-black-2" : "size-6 text-black-1"
    )}
    strokeWidth={section.compact ? 1.75 : 1.5}
  />
)}
```

**Files to modify:**
- `components/website/layout/dropdown-menu.tsx` — remove `!section.compact &&` guard, add conditional icon sizing

**Side effects:** Quick Links items in dropdown will now show icons (consistent with FAB). May need to adjust dropdown width if icons make items too wide.

---

## 6. Quick Links FAB — Hover Gap Makes Links Inaccessible on Desktop

**Symptom:** There is a visual gap between the Quick Links panel and the FAB button. When the user hovers the button to open the panel, then moves the mouse upward to click a link, the cursor crosses the gap — this triggers `onMouseLeave`, closing the panel before any link can be clicked. The Quick Links panel is essentially **never accessible via hover on desktop**. On mobile, hover logic previously caused issues, so mobile must be click/tap only.

**Root Cause (two issues):**

1. **Pointer-events:** The expanded panel inherited `pointer-events-none` from the container, so even if hover worked, links weren't clickable. (Fixed by previous agent — panel now gets `pointer-events-auto` when open.)

2. **Hover gap:** The flex container has a `gap` between the panel and the button. When the mouse crosses this gap, it leaves the interactive area, triggering `onMouseLeave` and closing the panel. This makes the links unreachable.

3. **Click on desktop:** The click toggle was previously gated by `if (isMobile)`, so clicking the button did nothing on desktop. (Fixed by previous agent — click now works on both platforms.)

**Fix (for the gap):**

Add a **close delay** (150ms grace period) to `onMouseLeave`. When the mouse leaves, wait 150ms before closing. If the mouse re-enters (e.g., reaches the panel) within that window, cancel the close. This is a standard dropdown menu pattern for bridging gaps.

```typescript
const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

const handleMouseEnter = useCallback(() => {
  if (isMobile) return
  if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
  setIsOpen(true)
}, [isMobile])

const handleMouseLeave = useCallback(() => {
  if (isMobile) return
  closeTimeoutRef.current = setTimeout(() => setIsOpen(false), 150)
}, [isMobile])
```

`onMouseEnter` must be on BOTH the button AND the panel so entering the panel cancels the close timeout.

**Behavior after fix:**
- **Desktop hover:** Button → panel opens → mouse crosses gap → 150ms grace → reaches panel → stays open → click link works
- **Desktop click:** Click button toggles panel open/close
- **Mobile:** Tap/click only. No hover handlers fire (gated by `isMobile`). Previous hover issues on mobile eliminated.

**Files to modify:**
- `components/website/layout/quick-links-fab.tsx` — add close delay, `onMouseEnter` on panel, cleanup timeout on unmount

**Side effects:** 150ms delay before panel closes on desktop (imperceptible to users). Mobile behavior unchanged.

---

## 7. Database / Memory / Backend Optimization

**Symptom:** ~1GB RSS memory on the production Node.js server. Heavy libraries loaded unnecessarily.

### Already Optimized (No Action Needed)
- **dnd-kit** — correctly behind `"use client"` and in `optimizePackageImports`
- **AWS SDK** — already in `serverExternalPackages`, lazy-loaded via `getClient()`
- **PM2 flags** — `--max-old-space-size=256`, `--max-semi-space-size=8`, `--optimize-for-size` already set

### Priority 1: TipTap Imported on Server Pages (saves 15-30 MB)

Three website pages import `contentToHtml` from `lib/tiptap.ts`, which pulls in the entire TipTap editor (ProseMirror plugins, extensions, etc.) into the server bundle:

- `app/website/messages/[slug]/page.tsx:7`
- `app/website/bible-study/[slug]/page.tsx:7`
- `app/website/events/[slug]/page.tsx:18`

**Fix:** Create `lib/tiptap-server.ts` with only `generateHTML` + `getParseExtensions()` (no editor plugins). Update the three page imports. Or pre-render HTML at CMS save time so TipTap is never needed on the website.

### Priority 2: Add ISR to Website Routes (saves 100-300 MB during traffic)

Every website page re-queries the database on every request. Adding ISR caching:

```typescript
// Each website page.tsx
export const revalidate = 60 // seconds
```

Then call `revalidatePath()` from CMS save handlers. Cached pages serve from disk with zero DB queries.

### Priority 3: Prisma Query Over-Fetching (saves 5-7.5 MB per request)

List queries load full records including 80 KB transcripts and 15 KB answer fields that the list UI never displays. Convert to `select`:

```typescript
// Instead of: include: { speaker: true }
// Use: select: { id: true, slug: true, title: true, speaker: { select: { firstName: true } } }
```

### Priority 4: Disable Sharp (saves 15-25 MB)

No `next/image` imports exist in the codebase. Add `images: { unoptimized: true }` to `next.config.ts`.

### Priority 5: Exclude TypeScript from Bundle (saves 20-30 MB)

Add `'typescript'` to `serverExternalPackages` in `next.config.ts`. It's pulled in as a Prisma peer dependency but never imported at runtime.

### Projected Impact

| Priority | Optimization | Savings |
|----------|-------------|---------|
| 1 | TipTap server split | 15-30 MB |
| 2 | ISR caching | 100-300 MB |
| 3 | Selective queries | 5-7.5 MB/req |
| 4 | Disable Sharp | 15-25 MB |
| 5 | Exclude TypeScript | 20-30 MB |
| **Total** | | **~380 MB (38% reduction)** |

**Files to modify:**
- `next.config.ts` — Sharp, TypeScript, ISR config
- `lib/tiptap-server.ts` — new file for server-only TipTap utils
- `app/website/*/page.tsx` — import swap + revalidate export
- `lib/dal/messages.ts`, `lib/dal/bible-studies.ts` — convert to `select`

**Side effects:** ISR means content updates have a delay (configurable, e.g., 60s). All other changes are invisible to users.

---

## 8. Transcript Tab Missing on Bible Study Page

**Symptom:** Even when a transcript exists in the CMS, the "Message" (transcript) tab doesn't appear on the public Bible study detail page.

**Root Cause:** The DAL query never fetches the transcript field. In `lib/dal/bible-studies.ts:6-14`, the `bibleStudyInclude` object only includes relations:

```typescript
const bibleStudyInclude = {
  speaker: true,
  series: true,
  attachments: { orderBy: { sortOrder: 'asc' as const } },
  relatedMessage: { select: { bibleVersion: true, slug: true, videoUrl: true, youtubeId: true } },
}
```

The `transcript`, `questions`, `answers`, and `bibleText` columns are **not selected**. When the page component at `app/website/bible-study/[slug]/page.tsx:54` tries to access `study.transcript`, it's always `undefined`. The tab visibility check at `study-detail-view.tsx:146` evaluates `!!undefined` → `false`, hiding the tab.

**Importantly:** These text fields ARE on the `BibleStudy` model in the schema (`prisma/schema.prisma:640`). Prisma `findMany`/`findUnique` returns all scalar fields by default — but if the code uses a typed include pattern that narrows the return type, the fields might be excluded from the TypeScript type even though they're in the query result.

**Fix:**

The `bibleStudyInclude` is used for both list and detail queries. For the detail page (`getBibleStudyBySlug`), ensure text fields are included. Either:

**Option A:** Prisma already returns all scalar fields by default with `include`. Verify the TypeScript type `BibleStudyWithRelations` includes `transcript`. If the type excludes it, update the type.

**Option B:** Create a separate detail-specific query that explicitly selects text fields:

```typescript
const bibleStudyDetailInclude = {
  ...bibleStudyInclude,
  // Scalar fields are included by default with `include`,
  // but we need to ensure the type reflects this
}
```

**Files to modify:**
- `lib/dal/bible-studies.ts` — verify scalar fields are returned and typed for detail queries
- Possibly `app/website/bible-study/[slug]/page.tsx` — verify `contentToHtml(study.transcript)` receives data

**Side effects:** If we're loading transcript for list queries too, that adds ~80 KB per study to list payloads. Should use `omit: { transcript: true }` for list queries (pairs with Bug #7 optimization).

---

## 9. Event Share Template Message Not Appearing

**Symptom:** When sharing an event, the pre-written template message ("I'd love for you to join us for...") doesn't appear consistently.

**Root Cause:** The share handler at `components/website/shared/event-actions.tsx:338-363` has a flow issue:

```typescript
async function handleShare() {
  const shareText = `I'd love for you to join us for ${event.title}! Here are the details:`
  const shareData = { title: event.title, text: shareText, url: currentUrl }

  if (navigator.share) {
    try {
      await navigator.share(shareData)
    } catch {
      // User cancelled — fall through to clipboard
    }
    return  // <-- BUG: Always returns, even if share() failed
  }

  // Clipboard fallback — never reached if navigator.share exists
  try {
    await navigator.clipboard.writeText(`${shareText}\n${currentUrl}`)
    setShareToast(true)
    setTimeout(() => setShareToast(false), 2000)
  } catch { }
}
```

**Three issues:**

1. **Early return after Web Share API:** The `return` on line 348 executes even when `navigator.share()` throws (the catch block falls through to it). If the user cancels the native share dialog, the function returns silently — no clipboard fallback, no toast.

2. **Platform-dependent template visibility:** The Web Share API passes `shareText` to the native OS share sheet, but whether the text appears depends on the receiving app (e.g., iMessage may show it, Twitter may strip it). Users can't tell if the template was included.

3. **No success feedback:** After a successful Web Share, there's no toast or confirmation. After clipboard copy, the toast shows, but only if the Web Share API doesn't exist on the browser.

**Fix:**

```typescript
async function handleShare() {
  const shareText = `I'd love for you to join us for ${event.title}! Here are the details:`
  const shareData = { title: event.title, text: shareText, url: currentUrl }

  if (navigator.share) {
    try {
      await navigator.share(shareData)
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2000)
      return  // Only return on SUCCESS
    } catch (error: any) {
      if (error.name === 'AbortError') return  // User cancelled — do nothing
      // Other error — fall through to clipboard
    }
  }

  // Clipboard fallback
  try {
    await navigator.clipboard.writeText(`${shareText}\n${currentUrl}`)
    setShareToast(true)
    setTimeout(() => setShareToast(false), 2000)
  } catch { }
}
```

**Files to modify:**
- `components/website/shared/event-actions.tsx` — fix `handleShare()` flow (lines 338-363)

**Side effects:** None. The fix only changes the control flow, not the share content.

---

## 10. Featured Events — Remove Manual, Keep Builder Filters Only

**Symptom:** The featured events system has two competing approaches (manual starring in CMS + automatic filter-based selection from builder settings). This creates confusion about what's actually showing on the website and makes it unclear how to toggle between manual and auto modes. The CMS and public website don't reflect the same thing.

**Decision:** Remove manual featuring entirely. The website builder's filter settings become the **single source of truth** for which events appear in the featured section.

### What Gets REMOVED (Manual Featuring)

**Files to delete:**
- `components/cms/events/featured-toggle-dialog.tsx` — the featuring/unfeaturing dialog
- `components/cms/dashboard/featured-events-warning.tsx` — "stale featured events" dashboard warning

**Files to edit (remove featured toggle UI):**

| File | What to Remove |
|------|---------------|
| `components/cms/events/entry/event-form.tsx` | `isFeatured` state, toggle button, featured dialog integration (lines 87, 248-249, 316, 324, 534, 1180-1230) |
| `components/cms/events/columns.tsx` | Star icon import and featured star button in event list (lines 6, 87, 298, 305, 345-369) |
| `app/cms/(dashboard)/events/page.tsx` | Featured dialog import, featured state/handlers, featured sort logic (lines 31, 285-308, 310-317, 344-348) |
| `app/cms/(dashboard)/dashboard/page.tsx` | FeaturedEventsWarning import and render, stale featured count query (lines 7, 270-288, 299-302) |
| `components/cms/events/events-settings.tsx` | `autoHidePastFeatured` toggle — only applies to manual featuring (lines 87, 181-183) |
| `app/api/v1/events/route.ts` | Stop accepting `isFeatured` in POST body and GET filter |

**DAL functions to remove in `lib/dal/events.ts`:**
- `getHybridFeaturedEvents()` (lines 168-263) — the hybrid manual+auto logic
- `getFeaturedEvents()` (lines 151-166) — manual-only query
- `getManualFeaturedCount()` (lines 277-285)
- `getCurrentFeaturedEventIds()` (lines 265-275)

### What Gets KEPT (Builder Filter Settings)

The website builder's section editor for highlight cards already exposes these filter settings (in `components/cms/website/builder/section-editors/data-section-editor.tsx:488-618`):

| Setting | Maps to | Description |
|---------|---------|-------------|
| `count` (1-6) | `limit` param | Max events to display |
| `sortOrder` (asc/desc) | `sortOrder` param | Upcoming first vs most recent first |
| `includeRecurring` (bool) | `includeRecurring` param | Include recurring meetings |
| `showPastEvents` (bool) | Controls `pastEventsDays` | Include recently ended events |
| `pastEventsWindow` (7-90 days) | `pastEventsDays` param | How far back to look |

### New Data Flow

```
Builder Settings (PageSection.content JSON)  ← SINGLE SOURCE OF TRUTH
         ↓
resolve-section-data.ts extracts settings
         ↓
getUpcomingEvents(churchId, limit, { includeRecurring, pastEventsDays, sortOrder })
  - Pure filter-based selection
  - No manual/auto distinction
  - Already exists and works correctly (lib/dal/events.ts:85-134)
         ↓
highlight-cards.tsx renders events (no "Featured" badge distinction)
```

**The key change in `lib/website/resolve-section-data.ts`:** Switch from `getHybridFeaturedEvents()` to `getUpcomingEvents()`, passing the builder settings as parameters. The `getUpcomingEvents()` function already accepts all the needed parameters (`limit`, `includeRecurring`, `pastEventsDays`, `sortOrder`).

### Website Rendering Change

In `components/website/sections/highlight-cards.tsx`:
- Remove `featuredMode` from the event interface
- Remove the badge logic (`featuredMode === 'manual' ? 'Featured' : undefined`)
- All events are simply filter-selected — no manual vs auto distinction

**Files to modify:**
- `lib/website/resolve-section-data.ts` — switch to `getUpcomingEvents()`
- `components/website/sections/highlight-cards.tsx` — remove `featuredMode` references

**Side effects:** The `isFeatured` column stays in the database schema (no migration needed) but becomes unused. Can be cleaned up in a future schema consolidation.

---

## 11. R2 Attachment Downloads Still Show UUID Filenames

**Symptom:** Newer Bible study file attachments download with UUID-prefixed filenames (e.g., `78f3a8c2-handout.pdf`) instead of the original filename. Older files download correctly. The previous fix and deployment script only fixed existing files — the ongoing upload pipeline was never updated.

**Root Cause:** The previous fix (commit `d3741f2`) added `Content-Disposition` support to **media asset promotion** but missed **Bible study attachment promotion**. The two pipelines are separate:

| Pipeline | File | Sets Content-Disposition? |
|----------|------|--------------------------|
| Media assets | `app/api/v1/media/route.ts:109`, `app/api/v1/media/promote/route.ts:81` | Yes — calls `moveObject(src, dest, bucket, buildContentDisposition(filename))` |
| Bible study attachments | `lib/dal/sync-message-study.ts:304` | **No** — calls `moveObject(srcKey, destKey)` without 4th argument |

The `promoteFromStaging()` function at `lib/dal/sync-message-study.ts:292-306` is the one that moves files from the R2 staging prefix to the permanent location. It calls `moveObject()` but doesn't pass the `Content-Disposition` header. The `buildContentDisposition()` utility isn't even imported in this file.

### Why Older Files Work

The deployment script (`apply-content-disposition.mts` or similar) was a one-time backfill that set `Content-Disposition` on all existing R2 objects. Files uploaded before the fix were retroactively fixed by the script. Files uploaded after the fix still go through the broken `promoteFromStaging()` path.

### Upload Pipeline (for reference)

1. **Client requests presigned URL:** `POST /api/v1/upload-url` → generates staging key: `{churchSlug}/staging/{uuid}-{sanitized-filename}`
2. **Client uploads directly to R2** via presigned PUT URL
3. **On message save:** `syncMessageStudy()` calls `syncStudyAttachments()` → `promoteFromStaging(att.url, ctx)` → `moveObject(srcKey, destKey)` **without Content-Disposition**
4. **R2 stores the file** without Content-Disposition metadata → browser uses the key (which includes UUID) as the download filename

### Fix

**3 changes in `lib/dal/sync-message-study.ts`:**

1. **Line 6 (imports):** Add `buildContentDisposition` to the import from `@/lib/storage/r2`
2. **Line 292-306 (`promoteFromStaging`):** Add `filename` parameter and pass `buildContentDisposition(filename)` as 4th arg to `moveObject()`
3. **Line 356-359 (`syncStudyAttachments`):** Pass `att.name` when calling `promoteFromStaging()`

```typescript
// BEFORE (line 304):
await moveObject(srcKey, destKey)

// AFTER:
await moveObject(srcKey, destKey, ATTACHMENT_BUCKET, buildContentDisposition(filename))
```

**Also need a one-time backfill** for files uploaded between the last deployment script run and this fix. Can reuse the same script pattern from the media promotion fix.

**Files to modify:**
- `lib/dal/sync-message-study.ts` — import `buildContentDisposition`, pass filename through promotion

**Side effects:** None. Only affects newly promoted attachments. Existing files with correct Content-Disposition are unchanged.

---

## 12. Featured Events CMS ↔ Website Mismatch

**Symptom:** What's shown as "featured" in the CMS doesn't match what appears on the public website. This is a direct consequence of the dual manual+auto system described in Bug #10.

**Root Cause:** This is resolved by Bug #10's fix. Once manual featuring is removed and the builder filter settings become the single source of truth, the website always renders exactly what the filters produce — there's no separate "featured" state in the CMS to get out of sync.

**Additional verification needed:** After implementing Bug #10's fix, verify that:
1. The builder's highlight cards preview matches the public website output
2. Changing builder settings (count, sort, recurring toggle) immediately reflects on the website
3. The events settings page (`/cms/events/settings`) either mirrors the builder settings or is removed to avoid a second source of truth

**No additional code changes beyond Bug #10.**

---

## Cross-Cutting Concerns

Several bugs interact with each other. The team flagged these dependencies:

| Bug | Affects | Note |
|-----|---------|------|
| #3 (old studies) + #8 (transcript) | Both touch `lib/dal/bible-studies.ts` | Coordinate: add text fields for detail query, use `select` for list query |
| #1 (ESV default) + #2 (pane versions) | Both in study detail view | Per-pane version init should use the church's configured default from #1 |
| #5 (icons) + #6 (hover) | Both in quick-links components | Can be fixed in one PR since they're in the same component family |
| #8 (transcript) + #7 (memory) | Loading transcript adds ~80 KB per study | Use `omit` for list queries, only include transcript in detail queries |
| #10 + #12 (featured events) | Bug #12 is resolved by #10 | Single fix eliminates both problems |
| #11 (R2 filenames) | Independent | No interaction with other bugs, safe to fix in isolation |

---

## Implementation Status

| # | Bug | Status | What Was Done |
|---|-----|--------|---------------|
| 1 | ESV default + settings flow + version ordering | **Done (v2)** | Three bugs fixed: (a) church default now takes priority over per-study version, (b) disabled versions filtered out of website dropdown, (c) DnD reordering added to CMS. New `getChurchBibleVersionConfig()` DAL returns both default + enabled list. `enabledVersions` array order = display order everywhere. @dnd-kit sortable in CMS (default pinned at top). |
| 2 | Per-pane Bible versions | **Done** | `Record<string, T>` keyed by pane ID. Each pane has independent version, Bible text cache, loading state. Scales to N panes. |
| 3 | Old Bible studies (2003-2025) missing | **Done** | Root cause: no pagination — only first page of results was ever fetched. All 1,184 studies are PUBLISHED in DB. Fix: progressive background loading (50 on initial render, then client eagerly fetches remaining pages via API). |
| 4 | Builder preview message filter | **Reverted + Done** | `videoPublished: true` restored on public website. Real bug is builder preview not applying this filter (separate investigation). |
| 5 | Quick links icons | **Done** | Icons always render in navbar dropdown with conditional compact sizing. |
| 6 | Quick links FAB hover gap | **Done (v3)** | Removed unreliable `onMouseLeave` from `pointer-events-none` container. Added invisible hover bridge (`pb-3 -mb-3`) on panel wrapper to fill the gap. 150ms close delay as safety net. Mobile = click only. |
| 7 | Memory quick wins | **Done (quick wins) + deeper fix planned** | Sharp disabled, TypeScript excluded from bundle, TipTap server split. ~50-85 MB reduction. **Root cause of 80 MB list queries identified**: `getBibleStudies()` fetches all text columns (avg 71 KB/row × 1,185 rows) for list views that only need ~128 bytes/row of metadata. Fix: Prisma `omit` on list queries — reduces payload from 80 MB → 152 KB. Full fix is part of the Message/BibleStudy table merge (see `message-biblestudy-proposed-schema.md`). |
| 8 | Transcript tab | **Done (bandaid) → proper fix in table merge** | Transcript saves to `Message.rawTranscript` (TipTap JSON) but website reads `BibleStudy.transcript` (HTML). Sync function never copied it. Bandaid fix: `syncMessageStudy()` now converts rawTranscript → HTML as fallback. **Deeper audit revealed**: 626 BibleStudy.transcript entries are stored as TipTap JSON (from legacy migration), not HTML. The website's `contentToHtml()` auto-detects and converts on every page load (~42 KB parse per request). The sync function writes HTML but legacy data is JSON — two formats in the same column. `Message.transcriptSegments` is dead (7 entries, all JSON null, zero code refs). `Message.liveTranscript` is active but empty (0 entries; UI exists for Live Captions). **Proper fix:** Table merge normalizes all content to HTML at migration time, eliminates per-request parsing, and removes the sync layer entirely. See `message-biblestudy-proposed-schema.md`. |
| 9 | Event share | **Done** | Fixed early return, added AbortError handling, added toast on successful Web Share. |
| 10+12 | Featured events | **Done** | Manual featuring removed entirely. Builder filter settings are single source of truth via `getUpcomingEvents()`. |
| 11 | R2 filenames | **Done** | `buildContentDisposition(att.name)` added to `promoteFromStaging()` in `sync-message-study.ts`. |
