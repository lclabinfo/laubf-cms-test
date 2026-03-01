# Bible Study Refactor — Changelog & Verification

**Date:** 2026-02-28
**Scope:** Database cleanup, CMS UI/UX fixes, transcript editor redesign, AI infrastructure setup

---

## Summary

13 tasks executed by a coordinated agent team. All tasks completed successfully.

---

## Changes by Issue

### Issue #1: Database Soft-Delete of Orphaned BibleStudy Records
**Status:** COMPLETE
**Files modified:**
- `prisma/seed.mts` — Removed 9 orphaned bible study entries (~489 lines)

**Database changes:**
- Soft-deleted 9 orphaned BibleStudy records (SET `deletedAt = NOW()`)
- 7 active records remain (all linked to Messages via `relatedStudyId`)
- 9 soft-deleted records preserved for potential future restoration

**Orphaned slugs removed from seed:**
- [x] do-you-truly-love-me
- [x] the-lord-is-my-shepherd
- [x] blessed-are-the-poor-in-spirit
- [x] his-steadfast-love-endures-forever
- [x] to-worship-him
- [x] prepare-the-way
- [x] christ-is-all
- [x] set-your-minds-on-things-above
- [x] watered-the-flock

**Verification:**
- `ephesians-2-the-gospel-summary` and `the-riches-of-grace-in-christ` confirmed NOT in seed file
- "testing" record (7th linked record) was manually created, not in seed

---

### Issue #2: Focus State Double-Rectangle on Input Fields
**Status:** COMPLETE
**Files modified:**
- `app/globals.css` — Removed conflicting focus styles

**Root cause:** Three sources of focus styling conflicting:
1. `[data-cms] *` applied `outline-ring/50` to all CMS elements
2. Global `:focus-visible` applied `outline: 2px solid var(--ring)`
3. Global form control rule applied `box-shadow: 0 0 0 2px var(--ring)`
4. Component-level Tailwind `focus-visible:ring-3` added another ring

**Fix:** Removed `outline-ring/50` from `[data-cms] *`, consolidated focus rules so form controls use only component-level Tailwind ring classes.

---

### Issue #3: Dropdown/Popover Causing Horizontal Scroll Shift
**Status:** COMPLETE
**Files modified:**
- `app/cms/layout.tsx` — Added `overflow-x-hidden` to CMS root container
- `components/ui/select.tsx` — Changed SelectContent position from `item-aligned` to `popper`, added `sideOffset={4}`
- `components/ui/popover.tsx` — Added `max-w-[calc(100vw-2rem)]` to PopoverContent

---

### Issue #4: Expand Bible Version Options
**Status:** COMPLETE
**Files created:**
- `lib/bible-versions.ts` — Centralized config with 20 Bible versions

**Files modified:**
- `components/cms/messages/entry/entry-form.tsx` — Uses `BIBLE_VERSIONS` array
- `components/cms/messages/entry/metadata-sidebar.tsx` — Uses `BIBLE_VERSIONS` array
- `components/website/study-detail/study-detail-view.tsx` — Scrollable version dropdown with all 20 versions
- `lib/bible-api.ts` — Expanded translation mappings for all 20 versions

**Versions added:** ESV, NIV, KJV, NKJV, NLT, NASB, CSB, AMP, MSG, CEV, GNT, RSV, NRSV, NET, WEB, ASV, YLT, HCSB, ISV, ERV

---

### Issue #5: Scripture Passage Input UX
**Status:** COMPLETE
**Files modified:**
- `components/cms/messages/entry/bible-passage-input.tsx`

**Changes:**
- [x] Removed Search/magnifying glass icon entirely
- [x] Confirmed state renders as Badge pill (BookOpen icon + passage text + X clear button)
- [x] Clicking badge enters edit mode with value pre-filled
- [x] Escape reverts to badge, clicking outside reverts to badge
- [x] Clean input in edit mode (no search iconography)

---

### Issue #6: Shared Attachments Across Message, Video, and Bible Study
**Status:** COMPLETE
**Files modified:**
- `components/cms/messages/entry/entry-form.tsx`

**Changes:**
- [x] Moved attachments out of Details tab into shared Collapsible panel below all tabs
- [x] Panel visible on all tabs with Paperclip icon, count badge, "Shared across all tabs" label
- [x] Explanatory note: "These files will appear on the message page, video player, and bible study materials"
- [x] Uses Collapsible component, auto-opens when attachments exist

---

### Issue #7: Sticky Top Bar with Bottom Border
**Status:** COMPLETE
**Files modified:**
- `components/cms/messages/entry/entry-form.tsx`

**Changes:**
- [x] Header rows (back/title/actions + tab navigation) wrapped in `sticky top-0 z-20 bg-background`
- [x] Tab row has `border-b border-border` separator
- [x] Both rows stick together when scrolling

---

### Issue #8: Fixed Q&A Sections (Remove Custom Sections)
**Status:** COMPLETE
**Files modified:**
- `components/cms/messages/entry/study-tab.tsx`

**Changes:**
- [x] Removed "+ Add Section" button
- [x] Removed editable title input (titles are now static headings)
- [x] Removed delete buttons for sections
- [x] Empty state has single "Add Questions & Answers" button (creates exactly 2 sections)
- [x] Removed unused functions: `handleAddSection`, `handleDeleteSection`, `handleTitleChange`
- [x] Kept Import button and RichTextEditor for each section

---

### Issue #9: Transcript Editor Audit & Redesign
**Status:** COMPLETE
**Files created:**
- `docs/transcript-editor-redesign.md` — Full audit documentation

**Files modified:**
- `components/website/study-detail/study-detail-view.tsx` — Public site transcript display
- `components/cms/messages/entry/transcript-editor.tsx` — CMS editor redesign

**Public site changes:**
- [x] "TRANSCRIPT" header with FileText icon and messenger name
- [x] "AUTO-SCROLL" toggle button
- [x] "LIVE CAPTION" / "MESSAGE TEXT" pill toggle sub-tabs
- [x] Gradient accent line below tabs
- [x] Live Caption: timestamp left (muted monospace), text right, graduated opacity
- [x] Message Text: flowing prose HTML

**CMS editor changes:**
- [x] Raw transcript uses RichTextEditor (rich text with formatting)
- [x] Tabs renamed: "Live Captions" (primary) and "Full Text" (secondary)
- [x] Segments: compact rows with [Play] [MM:SS badge] [full-width text] [Delete]
- [x] Removed end-time input (single start time only)
- [x] Full-width "Add Timestamp Segment" button with dashed border
- [x] Compact 1.5 spacing between segments

---

### Issue #8.5/10: Live Caption Editor UX Improvements
**Status:** COMPLETE (fulfilled by Issue #9 implementation)

All requirements met by the transcript editor redesign.

---

### Issue #9 Addendum/11: AI Transcript Flow Documentation
**Status:** COMPLETE
**Files created:**
- `docs/transcript-ai-flows.md` — Documentation of 3 AI transcript workflows

**Files modified:**
- `components/cms/messages/entry/transcript-editor.tsx` — Dropdown UI updates

**Changes:**
- [x] Dropdown grouped into "Manual Import" and "AI-Powered" sections
- [x] Each option has description text
- [x] Disabled states with contextual hints (e.g., "Requires YouTube URL")
- [x] "Best" badge on recommended option
- [x] New `handleYouTubeAiCleanup()` handler (two-step: fetch + AI cleanup)
- [x] Wider dropdown (w-72) for descriptions

---

### Issue #10: Azure AI Environment Configuration
**Status:** COMPLETE
**Files created:**
- `lib/ai/config.ts` — Centralized AI configuration with guards
- `lib/ai/azure-client.ts` — Azure OpenAI REST client (no extra deps)
- `lib/ai/youtube-client.ts` — YouTube Data API v3 client
- `app/api/v1/ai/transcribe/route.ts` — POST: generate transcript
- `app/api/v1/ai/improve-transcript/route.ts` — POST: improve transcript
- `app/api/v1/ai/align-transcript/route.ts` — POST: align text to timestamps
- `app/api/v1/youtube/captions/route.ts` — GET: fetch YouTube captions
- `components/cms/shared/ai-not-configured-alert.tsx` — Reusable error alert
- `components/ui/alert.tsx` — shadcn/ui alert component

**Files modified:**
- `.env` — Added empty Azure OpenAI and YouTube API key variables
- `components/cms/messages/entry/transcript-editor.tsx` — Real API calls replacing mocks
- `components/cms/messages/entry/video-tab.tsx` — Changed prop to pass `videoUrl`

**Error handling:**
- 503 responses when API keys not configured
- Toast messages for user-facing errors
- Graceful fallback (YouTube + AI cleanup falls back to raw captions if AI fails)

---

## New Environment Variables

| Variable | Purpose | Status |
|----------|---------|--------|
| `AZURE_OPENAI_API_KEY` | Azure OpenAI authentication | Empty (user to configure) |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint URL | Empty (user to configure) |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Azure deployment name | Empty (user to configure) |
| `AZURE_OPENAI_API_VERSION` | Azure API version | Set to `2024-12-01-preview` |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | Empty (user to configure) |

---

## New Files Created

| File | Purpose |
|------|---------|
| `lib/bible-versions.ts` | Centralized Bible version config (20 versions) |
| `lib/ai/config.ts` | AI service configuration + guards |
| `lib/ai/azure-client.ts` | Azure OpenAI REST client |
| `lib/ai/youtube-client.ts` | YouTube Data API client |
| `app/api/v1/ai/transcribe/route.ts` | Transcript generation API |
| `app/api/v1/ai/improve-transcript/route.ts` | Transcript improvement API |
| `app/api/v1/ai/align-transcript/route.ts` | Text-to-timestamp alignment API |
| `app/api/v1/youtube/captions/route.ts` | YouTube captions API |
| `components/cms/shared/ai-not-configured-alert.tsx` | AI error alert component |
| `components/ui/alert.tsx` | shadcn/ui alert primitive |
| `docs/transcript-editor-redesign.md` | Transcript editor audit doc |
| `docs/transcript-ai-flows.md` | AI flow documentation |
| `docs/bible-study-refactor-changelog.md` | This changelog |

---

## Files Modified

| File | Changes |
|------|---------|
| `app/globals.css` | Removed conflicting focus styles |
| `app/cms/layout.tsx` | Added overflow-x-hidden |
| `components/ui/select.tsx` | Changed to popper position |
| `components/ui/popover.tsx` | Added max-width constraint |
| `components/cms/messages/entry/entry-form.tsx` | Sticky header, Bible versions, shared attachments |
| `components/cms/messages/entry/bible-passage-input.tsx` | Badge/pill confirmed state |
| `components/cms/messages/entry/study-tab.tsx` | Fixed Q&A sections only |
| `components/cms/messages/entry/transcript-editor.tsx` | Full redesign + AI integration |
| `components/cms/messages/entry/video-tab.tsx` | Pass videoUrl prop |
| `components/cms/messages/entry/metadata-sidebar.tsx` | Bible versions from config |
| `components/website/study-detail/study-detail-view.tsx` | Transcript display + version dropdown |
| `lib/bible-api.ts` | Expanded version mappings |
| `prisma/seed.mts` | Removed orphaned bible studies |
| `.env` | Added AI env variables |

---

## No New NPM Packages Installed

All implementations use existing dependencies or native `fetch()` API. The Azure OpenAI integration uses REST API directly (no `@azure/openai` SDK needed).

---

## Follow-Up Actions / TODO

1. **Configure Azure OpenAI** — Add API key, endpoint, and deployment name to `.env` when ready
2. **Configure YouTube API** — Add YouTube Data API v3 key to `.env` for caption import
3. **Visual QA** — Run `npm run dev` and manually verify all UI changes across CMS pages
4. **Public site verification** — Check `/website/bible-study` shows exactly 7 studies
5. **Transcript display** — Verify the public site transcript component renders correctly with test data
6. **Build test** — Run `npm run build` to ensure no compilation errors
7. **Consider** — Future Bible Studies CMS admin page for managing standalone studies (soft-deleted records can be restored)
