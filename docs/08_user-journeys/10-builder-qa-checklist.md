# Website Builder QA Checklist

> **Date:** March 18, 2026 (updated end of day)
> **Scope:** Full QA for all builder work — shared components, dirty tracking, navigation editor, iframe canvas, section editors, public website rendering
> **Commits covered:** `d062a02` through `a3b542f`

---

## A. Section Editors — Basic Functionality

### A1. Open & edit each editor category
- [ ] **Hero Banner** → heading, subheading, 2 buttons, background image, video URL
- [ ] **Quote Banner** (content) → overline, heading, verse text, reference
- [ ] **Action Card Grid** (cards) → heading, cards with images, CTA visible toggle
- [ ] **Meet Team** (ministry) → overline, heading, team members with image picker (NOT raw URL text input)
- [ ] **Highlight Cards** (data-driven) → heading, subheading, CTA, event count, sort order, auto-hide toggles
- [ ] **Spotlight Media** → heading input + blue "Content auto-populated" banner (NOT manual sermon fields)
- [ ] **FAQ Section** (interactive) → heading, toggle, add/remove/reorder questions
- [ ] **Footer** (layout) → description, social links as **Select dropdown**, address lines, logo picker
- [ ] **Custom Embed** → URL input, title, aspect ratio selector with **styled shadcn Buttons** (not raw HTML)
- [ ] **Recurring Schedule** → heading, subtitle, meetings with 7-day toggle selector

### A2. Live preview
- [ ] Edit a heading in the right drawer → canvas (iframe) updates in real-time
- [ ] Change an image → canvas shows new image
- [ ] Toggle color scheme Light→Dark → canvas section background changes
- [ ] Changes persist across editor close/reopen (without saving)

### A3. Right drawer scrolling
- [ ] Open **Ministry Schedule** or **Footer** editor (many fields)
- [ ] Scroll drawer → all fields reachable, nothing clipped
- [ ] Header (section name + close button) stays pinned at top
- [ ] Scroll position resets when switching to a different section

---

## B. Array Editors — Edge Cases

### B1. Basic CRUD
- [ ] Add 3 FAQ items → all render with correct indices (1, 2, 3)
- [ ] Delete item 2 → remaining items re-index to (1, 2)
- [ ] Delete all items → empty state shows (dashed border, icon, message)
- [ ] Add item when at empty state → works, shows item 1

### B2. Reordering (state preservation)
- [ ] Add 3 FAQ items with distinct content ("AAA", "BBB", "CCC")
- [ ] Move item 2 up → order becomes ("BBB", "AAA", "CCC") — content follows the item, not the position
- [ ] Move item 3 up twice → becomes first — content still matches
- [ ] **After reorder, type in a field** → the text goes into the correct item (not a different one due to key mismatch)

### B3. GripVertical icon visibility
- [ ] FAQ/Timeline/Photo Gallery (reorderable) → GripVertical icon shows on each item
- [ ] Footer social links / form options (NOT reorderable) → GripVertical icon does NOT show

### B4. Social links (Footer + Ministry Hero)
- [ ] Platform field is a **Select dropdown** (Instagram, Facebook, YouTube, Twitter, Email, Website)
- [ ] NOT a free-text input
- [ ] Add link → select platform → enter URL → renders correctly
- [ ] Remove link → works

### B5. Address lines (Footer + Location Detail)
- [ ] Add multiple lines → each editable
- [ ] Remove a line → correct line removed
- [ ] Add after removing all → works

---

## C. Dirty Tracking & Save

### C1. Selective save (Network tab verification)
- [ ] Edit 1 section heading → Save → Network shows **1 section PATCH** (not 10+)
- [ ] Edit 2 sections → Save → Network shows **2 section PATCHes**
- [ ] Edit only page title → Save → only page PATCH, no section PATCHes, no reorder PUT
- [ ] Drag-reorder only → Save → only reorder PUT, no section PATCHes
- [ ] Edit nothing → Cmd+S → **zero API calls** (early return)

### C2. Dirty state correctness
- [ ] Edit section → isDirty = true (Save button enabled, dot indicator)
- [ ] Save → isDirty = false (Save button disabled or shows "Saved")
- [ ] Edit section A → Save → Edit section B → Save → only B is sent (A was cleared after first save)
- [ ] Edit, save, then edit the **same section again** → it becomes dirty again

### C3. Undo/redo + dirty interaction
- [ ] Edit section → Cmd+Z → isDirty still true (state differs from DB)
- [ ] Edit → Cmd+Z → Save → sends all sections (safe fallback after undo)
- [ ] Edit → Save → Cmd+Z → isDirty becomes true again
- [ ] Redo after undo → isDirty still true

### C4. Delete + dirty interaction
- [ ] Edit section A, then delete section B → Save → only section A is PATCHed (B was removed from dirty set)
- [ ] Delete the section you were editing → right drawer closes, section removed from dirty set
- [ ] Add new section via picker → Save immediately → new section should NOT get redundant PATCH (already created via POST)

### C5. Auto-save
- [ ] Edit a section → wait 30 seconds → auto-save fires (check Network)
- [ ] Auto-save sends only dirty sections (not all)
- [ ] After auto-save → isDirty = false, Save button shows "Saved" briefly
- [ ] Manual save during auto-save countdown → cancels the timer, saves immediately

### C6. Race condition
- [ ] Rapidly click Save 3 times → only 1 save fires (isSaving guard)
- [ ] Edit during auto-save in-flight → auto-save completes, new edit starts new dirty cycle

---

## D. Navigation Editor

### D1. Opening the editor
- [ ] Click Navigation icon in left sidebar → left drawer shows navigation tree
- [ ] Tree shows all top-level nav items matching public website
- [ ] Expand "Our Church" → shows sections (About, Connect, Quick Links) with items

### D2. Item types render correctly
- [ ] **Folder dropdown** (Our Church) → Folder icon + "dropdown" badge
- [ ] **Page + dropdown** (Ministries) → FileText icon + "page + dropdown" badge + "Landing page /ministries" indicator
- [ ] **External link** (Daily Bread & Prayer) → ExternalLink icon + "external" badge + schedule metadata ("Mon-Fri @ 6 AM")
- [ ] **Page** (Events) → FileText icon, no badge
- [ ] **Standalone page** (Giving) → no chevron, not expandable

### D3. DnD reordering
- [ ] Drag a top-level item to new position → saves immediately via API → public site navbar reflects new order
- [ ] Drag a child item within same section → reorders correctly
- [ ] After reorder, **content stays with the correct item** (no state confusion)

### D4. CRUD operations
- [ ] Add new top-level item → prompt for label → appears in tree
- [ ] Add item to a section (+ Add item) → new item appears
- [ ] Add new section (+ Add section) → section heading appears
- [ ] Rename section (... menu → Rename) → updates all items' groupLabel
- [ ] Delete section → all items in section removed
- [ ] Delete top-level item with children → children also deleted

### D5. Item editor (right drawer)
- [ ] Click a page item → right drawer shows page editor (label, page selector, description, visible toggle)
- [ ] Click an external link → shows URL, schedule meta, open-in-new-tab toggle
- [ ] Click a top-level item → shows label, type toggle (folder vs page+dropdown)
- [ ] Toggle folder → page+dropdown → landing page selector appears
- [ ] Toggle page+dropdown → folder → href is cleared
- [ ] Save changes → tree refreshes with updated data
- [ ] Close editor → right drawer closes cleanly

### D6. Navbar settings
- [ ] Click navbar in canvas → NavSettingsForm opens in right drawer
- [ ] Scroll behavior dropdown → changes persist to DB
- [ ] Solid color dropdown → changes reflect on public site
- [ ] Sticky toggle → public site navbar toggles sticky/relative
- [ ] CTA visible toggle → shows/hides CTA label + link fields
- [ ] CTA label/link changes → public site CTA button updates

### D7. State isolation
- [ ] Edit a nav item → then click a section on canvas → nav editor closes, section editor opens (not both)
- [ ] Edit a section → then click Navigation tool → section editor closes
- [ ] Navigate to different page → nav editor state resets (not showing stale item)
- [ ] Escape key while nav item editor is open → closes nav editor (not section editor)

### D8. Hidden pages
- [ ] Hidden pages section shows pages not referenced by any menu item
- [ ] Verify pages like "Privacy Policy" appear here (if they exist)

### D9. CTA section
- [ ] CTA section shows current button label + target URL
- [ ] CTA visible defaults to **false** (not true)

---

## E. Iframe Canvas

### E1. Responsive preview
- [ ] Desktop mode → sections render at full width with correct media query breakpoints
- [ ] Tablet mode (768px) → sections reflow to tablet layout (verify `md:` breakpoints fire)
- [ ] Mobile mode (375px) → sections show mobile layout (hamburger menu, stacked columns)

### E2. Iframe ↔ builder communication
- [ ] Select section on canvas (click in iframe) → selection border appears, toolbar shows
- [ ] Edit section in right drawer → iframe content updates in real-time
- [ ] Add section via picker → iframe shows new section immediately
- [ ] Delete section → iframe removes it
- [ ] Reorder sections (DnD) → iframe reflects new order
- [ ] Device mode switch → iframe resizes, sections reflow

### E3. Iframe scroll
- [ ] Canvas scrolls vertically within the iframe (not the whole page)
- [ ] Scroll position maintained when switching device modes? (nice-to-have, not critical)

### E4. Theme scoping
- [ ] Builder chrome (topbar, sidebar, drawers) uses CMS design system
- [ ] Iframe content uses website theme (different fonts, colors)
- [ ] No style bleeding between builder and iframe

---

## F. Page Management

### F1. Page tree
- [ ] Pages drawer shows all pages with hierarchy
- [ ] Click a page → builder loads that page's sections
- [ ] Active page is highlighted

### F2. Page navigation with unsaved changes
- [ ] Edit sections → click different page → "Unsaved changes" dialog
- [ ] "Discard" → navigates, dirty state reset, all nav/section editors closed
- [ ] "Cancel" → stays on current page
- [ ] Browser back/forward with unsaved changes → beforeunload warning

### F3. Add page
- [ ] Add Page modal opens → enter title → page created
- [ ] New page appears in page tree
- [ ] Navigate to new page → empty canvas

### F4. Delete page
- [ ] Delete page → confirm dialog → page removed from tree
- [ ] If currently viewing deleted page → redirect to homepage or first page

### F5. Page settings
- [ ] Open page settings → edit title, slug → saves correctly
- [ ] Publish/unpublish toggle works

---

## G. Public Website Sync

### G1. Section changes reflect on public site
- [ ] Edit section content in builder → Save → open public site in new tab → changes visible
- [ ] Change color scheme → Save → public site shows new scheme
- [ ] Toggle section visibility off → Save → public site hides section

### G2. Navigation changes reflect on public site
- [ ] Reorder nav items in builder → public site navbar shows new order
- [ ] Add/remove nav items → public site updates
- [ ] Change external link schedule metadata → public site dropdown shows updated schedule
- [ ] Edit CTA button → public site navbar CTA updates

### G3. scheduleMeta rendering
- [ ] Dropdown menu: external links show scheduleMeta in smaller text below description
- [ ] Mobile menu: external links show scheduleMeta
- [ ] QuickLinksFAB: quick links show scheduleMeta
- [ ] Items WITHOUT scheduleMeta → no extra line rendered (no "undefined" or empty space)

### G4. Navbar settings on public site
- [ ] scrollBehavior "transparent-to-solid" → navbar transparent on hero, solid on scroll
- [ ] scrollBehavior "always-solid" → navbar always has solid background
- [ ] scrollBehavior "always-transparent" → navbar stays transparent
- [ ] solidColor "white" → white background when solid
- [ ] solidColor "dark" → dark background when solid
- [ ] solidColor "primary" → brand color background when solid
- [ ] sticky true → navbar sticks to top on scroll
- [ ] sticky false → navbar scrolls away with content

---

## H. Keyboard Shortcuts — Full Matrix

### H1. Save
- [ ] Cmd+S with dirty state → saves
- [ ] Cmd+S without dirty state → no-op
- [ ] Cmd+S while typing in input field → should NOT save (browser default behavior for text input)
- [ ] Cmd+S while focused on a Button → should save

### H2. Undo/Redo
- [ ] Cmd+Z after edit → undoes
- [ ] Cmd+Z with no history → no-op
- [ ] Cmd+Shift+Z after undo → redoes
- [ ] Cmd+Z while typing in input → should NOT fire undo (browser handles text undo)
- [ ] Cmd+Z while typing in textarea → same, should NOT fire builder undo

### H3. Escape priority chain
- [ ] Escape with nav item editor open → closes nav item editor only
- [ ] Escape with nav settings open → closes nav settings
- [ ] Escape with section editor open → closes section editor
- [ ] Escape with section selected (no editor) → deselects section
- [ ] Escape with drawer open (no selection) → closes drawer
- [ ] Double-Escape → closes nested items in order

---

## I. Edge Cases — Not Yet Audited

### I1. Concurrent browser tabs
- [ ] Open builder in Tab A and Tab B for the same page
- [ ] Edit section in Tab A → Save → Tab B is stale
- [ ] Edit different section in Tab B → Save → should NOT overwrite Tab A's changes (dirty tracking only sends Tab B's edits)
- [ ] Edit SAME section in both tabs → save both → last save wins (expected behavior)

### I2. Empty states
- [ ] Page with zero sections → empty canvas state, "Add Section" button visible
- [ ] Navigation with zero menu items → empty nav editor with "+ Add item" button
- [ ] Footer editor with zero social links → empty state in social links
- [ ] New section added with default content → renders sensibly (not blank)

### I3. Very long content
- [ ] Heading with 200+ characters → doesn't break canvas layout
- [ ] Description with 2000+ characters → textarea scrollable, canvas handles overflow
- [ ] 20+ FAQ items → array editor scrollable, no performance degradation
- [ ] Page with 30+ sections → builder still responsive, DnD still works

### I4. Rapid operations
- [ ] Add 5 sections quickly (click picker, select, repeat) → all 5 appear in correct positions
- [ ] Delete 3 sections quickly → all 3 removed, no stale references
- [ ] Rapid undo/redo (Cmd+Z Cmd+Z Cmd+Z Cmd+Shift+Z Cmd+Shift+Z) → state is consistent
- [ ] Edit → Save → immediately edit again → dirty tracking resets correctly

### I5. Image picker edge cases
- [ ] Open image picker → select image → picker closes, image shows in editor
- [ ] Open image picker → cancel without selecting → no change
- [ ] Replace existing image → old image replaced in editor and canvas
- [ ] Remove image (X button) → image field empty, canvas reflects

### I6. Nav editor + section editor conflicts
- [ ] Open nav item editor → click a section on canvas → nav editor closes, section editor opens
- [ ] Open section editor → click Navigation tool → section editor closes, nav editor appears
- [ ] Open nav item editor → press Escape → nav editor closes → press Escape again → appropriate next action (deselect or close drawer)
- [ ] Open nav settings → navigate to different page → nav settings closes + resets

### I7. Network failures
- [ ] Save with network down → error toast, isDirty stays true
- [ ] Add nav item with network down → error toast, tree doesn't show phantom item
- [ ] Reorder nav items with network down → optimistic update reverts? (or stays but shows error)
- [ ] Auto-save fires with network down → error toast, retries on next cycle

### I8. Browser navigation
- [ ] Edit without saving → click browser Back → beforeunload warning
- [ ] Edit without saving → close tab → beforeunload warning
- [ ] Save → click browser Back → no warning (clean state)
- [ ] Deep-link to builder page (paste URL) → loads correct page

### I9. Data integrity after multiple operations
- [ ] Edit section A → Save → Reorder sections → Save → Edit section B → Save → all 3 operations persisted correctly
- [ ] Add section → edit it → reorder → save → verify section is in correct position with correct content on public site
- [ ] Delete section → undo → save → section should be restored (if undo captured the add/delete correctly)

### I10. Mobile/tablet device (builder itself, not preview)
- [ ] The builder likely doesn't work well on small screens (it's a desktop admin tool)
- [ ] Verify it at least doesn't crash on iPad-width viewport
- [ ] Drawers shouldn't overlap or break the layout

---

## J. Security Spot Checks

### J1. API auth
- [ ] Open browser DevTools → copy a menu PATCH request → replay without auth cookie → should get 401/403
- [ ] Try PATCHing a menu item with `menuId` in the body → field should be ignored (allowlist)
- [ ] Try PUT reorder with item IDs from a different menu → should silently no-op (ownership check)

### J2. Content injection
- [ ] Enter `<script>alert(1)</script>` as a section heading → should render as text on public site, not execute
- [ ] Enter `javascript:alert(1)` as a nav item href → should not execute when clicked
- [ ] Custom HTML section with `<script>` tag → warning banner shown in editor (expected behavior — intentional feature)

---

## Not Testable Yet (Planned)

| Feature | Status |
|---------|--------|
| Presence awareness banner ("David is editing") | Planned, not implemented |
| Section consolidation (41→24 with variants) | Future, documented in `section-catalog/` |
| Color palette system (beyond Light/Dark) | Planned for Phase 1 Day 3 |
