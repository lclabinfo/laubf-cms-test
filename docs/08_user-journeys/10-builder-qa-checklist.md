# Website Builder QA Checklist

> **Date:** March 18, 2026
> **Scope:** UX journeys to verify after today's builder infrastructure changes
> **Commits covered:** `d062a02` through `9aa8f58` (concurrent editing strategy, shared component library, dirty tracking, editor fixes, dead code cleanup)

---

## 1. Section Editor — Open & Edit

These verify the shared component library migration didn't break any editor.

- [ ] Open builder → select any **Hero Banner** section → click Edit → right drawer opens with fields (heading, subheading, buttons, background image, video URL)
- [ ] Edit the heading → canvas updates instantly (live preview)
- [ ] Change background image via image picker → MediaPickerDialog opens, select image, preview shows in editor
- [ ] Close editor → re-open → changes are still there (not reverted)
- [ ] Repeat for at least one section from each editor category:
  - [ ] **Content:** Quote Banner or CTA Banner
  - [ ] **Cards:** Action Card Grid or Pathway Card
  - [ ] **Ministry:** Meet Team or Ministry Schedule
  - [ ] **Data-driven:** Highlight Cards (should show event filter controls, not just heading)
  - [ ] **Spotlight Media:** should show heading input + "Content auto-populated from CMS" info banner (NOT manual sermon fields)
  - [ ] **Interactive:** FAQ Section — add/remove/reorder questions
  - [ ] **Layout:** Footer — social links should be a **dropdown** (not free text), address lines editable
  - [ ] **Custom:** Custom Embed — aspect ratio selector should use styled buttons (not raw HTML buttons)

## 2. Section Editor — Right Drawer Scrolling

- [ ] Open a section with many fields (e.g., **Ministry Schedule** or **Footer**)
- [ ] Scroll down in the right drawer — all fields should be reachable
- [ ] The drawer header (section name + close button) should stay fixed at top while content scrolls
- [ ] No content should be clipped or hidden below the viewport

## 3. Array Editors — Add / Remove / Reorder

- [ ] Open **FAQ Section** editor → add 3 questions
- [ ] Click move-up/move-down arrows → items swap correctly, content stays with the right item (no state loss)
- [ ] Delete the middle item → remaining items re-index correctly
- [ ] Empty state shows dashed border with message when all items removed
- [ ] The GripVertical icon should **only appear** on reorderable arrays (FAQ, timeline, photo gallery) — NOT on non-reorderable ones

## 4. Dirty Tracking — Selective Save

- [ ] Open builder → edit **one section's heading** → click Save
- [ ] Check browser Network tab: should see **1 section PATCH** (not 10-15 PATCHes for all sections)
- [ ] If you only edited text (no reorder, no title change): should NOT see page PATCH or reorder PUT
- [ ] Edit page **title** in topbar → Save → should see page PATCH but no section PATCHes
- [ ] **Reorder** sections via drag → Save → should see reorder PUT but no section PATCHes (unless sections were also edited)
- [ ] Edit nothing → press Cmd+S → should do nothing (no API calls)

## 5. Dirty Tracking — Undo/Redo Interaction

- [ ] Edit a section → Cmd+Z (undo) → Save → should save everything (all sections marked dirty after undo, which is the safe fallback)
- [ ] Edit section A → Save → Edit section B → Cmd+Z → only section B should be dirty
- [ ] Undo after save → isDirty should be true again (Save button re-enables)

## 6. Save — Error Handling

- [ ] Disconnect network → try to Save → should show error toast, Save button should re-enable
- [ ] isDirty should remain true after failed save (so user can retry)

## 7. Page Navigation

- [ ] Edit a section (don't save) → click a different page in the page tree → "Unsaved changes" dialog should appear
- [ ] Click "Discard" → navigates to new page, dirty state is reset
- [ ] Navigate to new page → edit → navigate back → dirty state is fresh (not carried from previous page)

## 8. Section Picker + Add/Delete

- [ ] Click "+" between sections → section picker opens
- [ ] Pick a section type → new section appears on canvas at correct position
- [ ] The new section should NOT trigger a redundant PATCH on next save (it was already created via POST)
- [ ] Delete a section → confirm dialog → section removed → next Save should NOT try to PATCH the deleted section's ID

## 9. Flat Registry — All 41 Section Types

Verify every section type has a working editor (not the JSON fallback):

- [ ] Open builder → add each section type from the picker → click Edit → should see a structured form (NOT raw JSON textarea)
- [ ] Quick spot-check: the section count in the picker should show all types organized by category

## 10. Display Settings (All Sections)

- [ ] Select any section → open editor → switch to Display tab
- [ ] Color Scheme toggle (Light/Dark) → canvas updates
- [ ] Padding selector (None/Compact/Default/Spacious) → canvas updates
- [ ] Container Width selector → canvas updates
- [ ] Visibility toggle → section shows/hides on canvas
- [ ] Animations toggle works

## 11. Auto-Save

- [ ] Edit a section → wait 30 seconds → should auto-save (check Network tab)
- [ ] Auto-save should only send dirty sections (not all)
- [ ] After auto-save → isDirty should be false, Save button should show "Saved"

## 12. Keyboard Shortcuts

- [ ] **Cmd+S** → saves (only dirty sections)
- [ ] **Cmd+Z** → undo
- [ ] **Cmd+Shift+Z** → redo
- [ ] **Escape** → deselects section / closes drawer
- [ ] Shortcuts should NOT fire when typing in an input/textarea field

---

## Not Testable Yet (Planned but Not Implemented)

| Feature | Status |
|---------|--------|
| Presence awareness banner ("David is editing") | Planned for Phase 1 Day 4 |
| Iframe canvas (responsive preview) | Architecture planned, not implemented |
| Section consolidation (41→24 with variants) | Future work, documented in `section-catalog/` |
