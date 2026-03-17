# Messages Editor Refactor: 3-Tab Layout + Expandable Table Rows + Publish Dialog

## Context

Read `docs/messages-editor-spec.md` for the full data model and content relationships. The core constraint: a Message is one entity with two content types (Video + Bible Study) that share metadata but may be published independently.

**Tech stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Radix primitives), TanStack React Table, TipTap rich text editor. State management via React Context (`lib/messages-context.tsx`) with optimistic updates. API routes at `/api/v1/messages` and `/api/v1/series`.

## What We're Changing (Flow/Layout Only — NOT Visual Design)

We're refactoring the messages editor page layout and the messages list table. **Keep all existing UI components, styling, design tokens, and visual patterns intact.** This is a structural/flow change, not a redesign.

### Current Structure (what exists now)

- **Messages list** (`/cms/messages`) — `app/cms/(dashboard)/messages/page.tsx`
  - Data table with columns: select, title (with passage subtitle), speaker, series, message date, posted, status, resources (two small icons — video/study), actions
  - Column definitions in `components/cms/messages/columns.tsx` (`createColumns()` factory)
  - Toolbar in `components/cms/messages/toolbar.tsx` (search, filters popover, column visibility, bulk actions)
  - Tabs: "All Messages" | "Series"

- **Message editor** (`/cms/messages/[id]` or `/cms/messages/new`) — `app/cms/(dashboard)/messages/[id]/page.tsx` and `app/cms/(dashboard)/messages/new/page.tsx`
  - Main form: `components/cms/messages/entry/entry-form.tsx`
  - Layout: header bar → title input → description textarea → content publishing summary → two-column layout (main content with Video|Bible Study tabs on left, metadata sidebar on right)
  - Single "Publish" / "Save Changes" button — no per-content-type publish control
  - Title + Description sit above the Video|Bible Study tabs in the main column
  - Metadata sidebar (280px fixed): `components/cms/messages/entry/metadata-sidebar.tsx`
  - Video tab: `components/cms/messages/entry/video-tab.tsx`
  - Bible Study tab: `components/cms/messages/entry/study-tab.tsx`
  - Transcript editor nested inside video tab: `components/cms/messages/entry/transcript-editor.tsx`

- **Context/state:** `lib/messages-context.tsx` — fetches from `/api/v1/messages`, provides `addMessage()`, `updateMessage()`, `deleteMessage()` with optimistic updates and rollback

- **Data model (Prisma):** Single `Message` model with one `status` field (`ContentStatus` enum: DRAFT, SCHEDULED, PUBLISHED, ARCHIVED), boolean flags `hasVideo` / `hasStudy`, no per-content publish state. Study content stored as `studySections` JSONB, video fields are flat columns.

### New Structure (what to build)

#### 1. Messages List — Add Expandable Rows + Split Status Columns

**Replace the single "Resources" column** (currently column id `resources`, 100px, showing Video + BookOpen icons with tooltips) with **two separate columns: "Video" and "Study"**, each showing a status badge:
- `Live` (green/success variant) — content exists and message is published
- `Draft` (amber/warning variant) — content exists but message not published
- `Empty` (gray/secondary variant) — no content for this type

Derive these states from existing fields: `hasVideo`/`hasStudy` booleans + `status` field. No new DB fields needed for display.

**Add expandable rows.** Each row gets a chevron toggle on the left side (before the checkbox column). When expanded, show a detail panel below the row containing two side-by-side cards:

- **Video card**: colored dot (blue `text-blue-600` if `hasVideo`, muted otherwise), "Video" label, status badge, one-line summary (e.g. "YouTube · 1:24:33" or "No video content"), and a clickable "Edit video →" link
- **Bible Study card**: same pattern with purple dot (`text-purple-600`), shows section count or "No study material", and "Edit study →" link

**The "Edit video →" and "Edit study →" links** navigate to `/cms/messages/[id]?tab=video` or `?tab=study` to deep-link into the corresponding editor tab (see below).

Clicking the row title still navigates to the editor, defaulting to the Details tab.

**Files to modify:**
- `components/cms/messages/columns.tsx` — replace `resources` column with `video` + `study` columns, add expandable row support
- `app/cms/(dashboard)/messages/page.tsx` — wire up row expansion in the DataTable

#### 2. Message Editor — Replace 2-Column Layout with 3-Tab Layout

**Remove the right sidebar entirely** (`MetadataSidebar` component). All metadata fields that were in the sidebar move into a new "Details" tab.

**Remove the Title + Description area** that currently sits above the tabs (lines ~231-257 in entry-form.tsx). Title moves into the Details tab as the first field.

**Remove the "Content publishing summary"** badges (the "Will be published with: Video / Bible Study" section). This info moves into the Details tab's Content Overview cards.

**The editor layout becomes:** sticky header bar (back button, message title, status badge, action buttons) → tab bar → tab content area (single column, max-width ~800px, centered).

**Three tabs in the tab bar** (use existing shadcn `Tabs` with `variant="line"`):

1. **Details** — all shared metadata fields (moved from `MetadataSidebar`):
   - Title (large input, auto-focused on create)
   - Speaker (`SpeakerSelect` combobox — `components/cms/messages/entry/speaker-select.tsx`)
   - Message Date (`DatePicker`)
   - Status selector (`Select` dropdown)
   - Scheduled Post Date + Time (conditional, only when status = "scheduled")
   - Series (`SeriesSelect` combobox — `components/cms/messages/entry/series-select.tsx`)
   - Scripture Passage (`BiblePassageInput` — `components/cms/messages/entry/bible-passage-input.tsx`)
   - Bible Version (`Select`)
   - Description (`Textarea`)
   - Attachments (upload + file list)
   - **Content Overview** section at the bottom: two side-by-side cards linking to Video and Study tabs (showing whether each has content, with "Go to Video tab →" / "Go to Bible Study tab →" links)

2. **Video** — everything from the current `VideoTab` component (`components/cms/messages/entry/video-tab.tsx`): Video URL input with platform detection badges, video preview embed, Video Description, Duration, Audio URL, Transcript section (with Raw/Synced sub-tabs via `TranscriptEditor`). **Keep all existing components and behavior — just re-parent.**

3. **Bible Study** — everything from the current `StudyTab` component (`components/cms/messages/entry/study-tab.tsx`): section management (add/rename/delete sections), section sub-tabs, TipTap rich text editor per section, import tools. **Keep all existing components and behavior — just re-parent.**

**Tab bar behavior:**
- Persistent at top below the header, always visible (use existing `TabsList variant="line"`)
- Active tab gets bottom border indicator (already built into shadcn Tabs line variant)
- Each tab shows a small content indicator: dot for Video (if `hasVideo`), section count badge for Bible Study (if `hasStudy`)
- Deep-linking: the editor reads a `tab` search param (`details`, `video`, `study`) from `useSearchParams()` so the table's shortcut links work. Default to `details` if no param.

**Files to modify:**
- `components/cms/messages/entry/entry-form.tsx` — restructure from 2-column to 3-tab layout, move metadata fields from sidebar into Details tab, add `useSearchParams()` for tab routing
- `components/cms/messages/entry/metadata-sidebar.tsx` — decompose: fields move into the Details tab section of entry-form. This component may be deleted or kept as a sub-component.
- `components/cms/messages/entry/video-tab.tsx` — no changes needed, just re-parented
- `components/cms/messages/entry/study-tab.tsx` — no changes needed, just re-parented

#### 3. Publish Flow — Replace Single Button with Publish Dialog

**Replace the current single "Publish" / "Save Changes" button** in the header with two buttons:

- **"Save Draft"** — saves without publishing (sets status to Draft)
- **"Publish..."** — opens a modal dialog for selective content publishing

**The Publish Dialog** (new component, e.g. `components/cms/messages/entry/publish-dialog.tsx`):

- Built with shadcn `AlertDialog` or `Dialog`
- Title: "Publish [message title]"
- Description: "Choose which content to make live on the public site."
- **Video toggle row**: icon (`Video` from lucide), "Video" label, one-line summary of content (e.g. "YouTube · 1:24:33" or "No video content"), and a `Switch` toggle. Switch is disabled (grayed out, not clickable) if no video content exists (`!hasVideo`).
- **Bible Study toggle row**: same pattern with `BookOpen` icon. Disabled if no study sections exist (`!hasStudy`).
- **Summary text block**: dynamically shows "Video will be published" / "Video not included" for each content type. Shows a warning if nothing is selected.
- Cancel and "Publish Selected" buttons. "Publish Selected" is disabled if neither toggle is on.

**Per-content publish state:** The current Prisma schema has a single `status` field and no per-content publish booleans. Two options:

- **Option A (minimal, recommended for now):** Derive display-only publish state from `hasVideo`/`hasStudy` + `status`. The dialog controls which content types have data when publishing. If a toggle is off, that content type's data is cleared or the flag is set to false. The message-level `status` remains the source of truth.
- **Option B (if needed later):** Add `videoPublished: Boolean @default(false)` and `studyPublished: Boolean @default(false)` to the Prisma schema. Requires a migration.

Start with Option A — no schema changes.

#### 4. New Message Flow

When creating a new message (`/cms/messages/new`):
- Open the editor with the Details tab active and title field auto-focused (already the pattern in `entry-form.tsx`)
- Show an info banner (shadcn `Alert` component): "Creating a new message. Fill in the details below, then switch to the Video or Bible Study tab to add content."
- Video and Study tabs are accessible immediately (they show empty states with "Add" CTAs — this already works)
- The publish dialog properly disables toggles for content types that haven't been added yet

## Implementation Notes

- **Don't change the data model or API** unless going with Option B. The message entity still has one status field.
- **Reuse all existing form components** — `SpeakerSelect`, `SeriesSelect`, `BiblePassageInput`, `DatePicker`, `VideoTab`, `StudyTab`, `TranscriptEditor`, TipTap editor. We're just moving them between containers.
- **The tab state should be URL-driven** via `useSearchParams()` so browser back/forward works and the table shortcuts can deep-link.
- **Keep optimistic saves** behavior from `lib/messages-context.tsx` as-is.
- **The expandable table rows** should use TanStack Table's built-in row expansion API (`getCanExpand`, `getIsExpanded`, `toggleExpanded`). Follow existing data table patterns in the project.
- **Validation logic** (`getPublishValidationIssues()` in entry-form.tsx) should still work the same way. Publish dialog adds the per-content selection step before the existing validation runs.
- **Layout wraps in MessagesProvider** via `app/cms/(dashboard)/messages/layout.tsx` — no changes needed there.

## Files to Modify (verified paths)

| File | Change |
|---|---|
| `components/cms/messages/columns.tsx` | Replace `resources` column with `video` + `study` status columns |
| `app/cms/(dashboard)/messages/page.tsx` | Add expandable row support to DataTable |
| `components/cms/messages/entry/entry-form.tsx` | Restructure from 2-column to 3-tab, move metadata into Details tab, add search param tab routing |
| `components/cms/messages/entry/metadata-sidebar.tsx` | Decompose into Details tab fields (may delete file) |
| `components/cms/messages/entry/publish-dialog.tsx` | **New file** — publish dialog with per-content toggles |
| `components/cms/messages/toolbar.tsx` | Minor: update if bulk action buttons need adjustment |

## Reference

See `approach-c-tabbed.jsx` in the project root for the intended interaction flow and tab structure. It's a self-contained React prototype — use it as a **behavioral reference only**, not as code to copy. The actual implementation must use shadcn/ui components, Tailwind CSS, and existing project patterns.
