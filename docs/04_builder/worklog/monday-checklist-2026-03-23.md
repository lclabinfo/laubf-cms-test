# Monday Checklist — March 23, 2026

> Priority-ordered list of work to complete on Monday. Items marked (P0) are blockers.

---

## (P0) Fix Hydration Error on Messages Page

- [ ] Verify `"use client"` directive on `message-card.tsx` resolves the issue
- [ ] If not, check `formatDate()` locale mismatch between server/client
- [ ] Test: hard refresh messages page on public site, no console errors

## (P0) Verify Builder/Public Site Parity

- [ ] Open builder, navigate to Messages page section
- [ ] Confirm only messages with video thumbnails appear (no book icon placeholders)
- [ ] Compare with public website `/messages` — same messages, same order
- [ ] Test: change card spacing in Layout panel, save, verify on public site

## Theme Token Migration (10 sections remaining)

Migrate hardcoded colors to `useSectionTheme()` tokens. Each section should look identical under Light, then also work under Dark/Brand/Muted.

- [ ] `all-bible-studies-client.tsx` (15 hardcoded instances — HIGH)
- [ ] `all-events-client.tsx` (1 instance — LOW)
- [ ] `all-videos.tsx` (1 instance — LOW)
- [ ] `footer.tsx` (4 instances — intentionally dark, verify)
- [ ] `quick-links.tsx` (8 instances — MEDIUM)
- [ ] `recurring-meetings.tsx` (5 instances — MEDIUM)
- [ ] `daily-bread-feature.tsx` (5 instances — MEDIUM)
- [ ] `form-section.tsx` (3 instances — LOW)
- [ ] `directory-list.tsx` (2 instances — LOW)
- [ ] `statement.tsx` (1 instance — LOW)

**Pattern for each:**
1. Add `"use client"` if missing
2. Import `useSectionTheme` + `cn`
3. Replace `text-black-1` with `t.textPrimary`, `bg-white-0` with `t.surfaceBgSubtle`, etc.
4. Verify light mode looks identical to before
5. Test dark/brand/muted in builder Style panel

## CMS-Driven Editor: Extend to Other Content Types

After ALL_MESSAGES is solid, apply the same pattern to:

- [ ] ALL_EVENTS — add layout editor (columns, card gap, card element toggles)
- [ ] ALL_BIBLE_STUDIES — add layout editor
- [ ] ALL_VIDEOS — add layout editor
- [ ] Register each in `LAYOUT_EDITORS` in `section-editors/index.tsx`

## Builder Polish

- [ ] Unlock column controls once MessageCard is responsive (test 2-col and 4-col at all breakpoints)
- [ ] Verify `itemsPerPage` actually controls load-more pagination (end-to-end test)
- [ ] Verify card element toggles (showDate, showSpeaker, etc.) actually hide/show elements on public site
- [ ] Test color scheme picker on ALL_MESSAGES: Light, Dark, Brand, Muted all render correctly

## Navigation Editor QA

- [ ] Cross-level drag-and-drop reparenting works
- [ ] Add Item / Add Section via dropdown menus
- [ ] Inline rename on section headers
- [ ] Verify changes save and reflect on public site navbar

---

## End-of-Day Goal

All CMS-driven sections show correct data in the builder canvas matching the public site. Theme tokens migrated for at least the high-priority sections (bible studies, quick links, recurring meetings). No hydration errors.
