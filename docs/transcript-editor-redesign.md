# Transcript Editor Redesign

## Current State Analysis

### CMS Transcript Editor (`components/cms/messages/entry/transcript-editor.tsx`)

The transcript editor provides two modes via tabs:

1. **Raw Transcript** tab: A plain `<Textarea>` for pasting/typing full transcript text. No formatting support.
2. **Synced Transcript** tab: A list of segments, each showing:
   - A numbered badge (#1, #2, etc.)
   - Start time and end time inputs (both `HH:MM:SS` format)
   - A `<Textarea>` for the segment text
   - A delete button (on hover)

An "Import / Generate" dropdown provides:
- Upload text file (raw mode)
- AI Auto-Align to timestamps (raw mode, converts raw text to segments)
- Upload caption file .SRT/.VTT (synced mode)
- Import from YouTube (synced mode, requires video URL)
- Generate AI Transcript (synced mode, requires video URL)

A "Download" dropdown exports as .TXT or .SRT.

### Public Website Transcript Display (`components/website/study-detail/study-detail-view.tsx`)

The transcript is rendered in the "Message" tab of the study detail split-pane view. It currently shows:
- A "Message Transcript" heading with optional "Message by {messenger}" subtitle
- Optional download link for DOCX transcript attachment
- The transcript rendered as raw HTML via `dangerouslySetInnerHTML`
- A dashed-border empty state when no transcript exists

---

## Problems Identified

### CMS Editor Issues

1. **No rich text support in Raw mode**: The raw transcript textarea is plain text only. Users cannot add formatting (bold, italic, headings) which limits the quality of the published transcript.

2. **Confusing dual-tab UX**: "Raw" vs "Synced" tabs present equal weight to two modes, but most users want synced segments as the primary view. The naming is unclear to non-technical users.

3. **Redundant end-time input**: Each segment shows both start and end time inputs. End time is typically auto-calculated from the next segment's start time, making the end time input unnecessary clutter.

4. **Oversized segment cards**: Each segment takes too much vertical space with a multi-line textarea and full-width time inputs. This makes it hard to scan and edit many segments.

5. **Small "Add Segment" button**: The add button is a small outline button that's easy to miss at the bottom of the list.

6. **No play/preview**: No way to preview how a timestamp will look or play from a specific time.

### Public Display Issues

1. **Raw HTML dump**: The transcript is rendered as raw HTML with no structured layout. No timestamps, no visual rhythm.

2. **No timestamp display**: Even when synced segments exist, the public view shows a flat text block.

3. **No transcript navigation**: No auto-scroll toggle, no sub-tabs for "Live Caption" vs "Message Text" views.

4. **Poor visual hierarchy**: Missing header with icon, no accent bar, no toggle controls.

5. **Monotone text**: All text segments look identical with no visual variation or graduated opacity.

---

## Proposed Redesign

### Public Website Transcript Display

**Header area:**
- "TRANSCRIPT" header with a FileText icon on the left
- "AUTO-SCROLL" toggle switch on the right

**Sub-tabs (pill toggle):**
- "LIVE CAPTION" and "MESSAGE TEXT" pills
- Colored accent line (gradient bar using primary color) below tabs

**Segment list (Live Caption mode):**
- Each row: timestamp on left (e.g., "0:00", "0:05") in muted gray, monospace
- Text content on right, larger font size
- Generous vertical spacing between segments
- Graduated opacity: first segments fully opaque, subsequent ones slightly lighter

**Message Text mode:**
- Show the raw transcript as flowing prose (no timestamps)

### CMS Transcript Editor

**a) Raw Transcript:**
- Replace plain `<Textarea>` with `<RichTextEditor>` component for formatting support

**b) Synced Transcript segments:**
- Each segment row: `[Play icon] [MM:SS badge] [full-width text input] [Delete button]`
- Show only start time (end time auto-calculated from next segment)
- Compact vertical spacing between segments
- Timestamp as a small inline badge-like element
- "Add Timestamp Segment" button spans full container width with dashed border

**c) Flow simplification:**
- Default to synced segments view (primary)
- "Import/Generate" dropdown accessible from both views
- Raw text as a secondary toggle, not equal-weight tab

---

## Implementation Checklist

### Documentation
- [x] Create `docs/transcript-editor-redesign.md`

### Public Website (`study-detail-view.tsx`)
- [x] Add "TRANSCRIPT" header with FileText icon
- [x] Add "AUTO-SCROLL" toggle (visual only, no scroll logic needed yet)
- [x] Add "LIVE CAPTION" / "MESSAGE TEXT" pill toggle
- [x] Add colored accent line below tabs
- [x] Redesign segment list with timestamps on left, text on right
- [x] Add graduated opacity effect on text segments
- [x] Support both live caption (timestamped) and message text (prose) views

### CMS Editor (`transcript-editor.tsx`)
- [x] Replace raw transcript `<Textarea>` with `<RichTextEditor>`
- [x] Remove end-time input from segments (auto-calculate)
- [x] Add play icon to each segment row
- [x] Redesign timestamp as small inline badge
- [x] Make text input full-width in each segment row
- [x] Make "Add Timestamp Segment" button full-width with dashed border
- [x] Compact vertical spacing between segments
- [x] Simplify tab labeling for clearer hierarchy
