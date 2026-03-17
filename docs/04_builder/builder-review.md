# Website Builder: Critical Review, Section Audit & 4-Day Plan

> Date: 2026-03-16
> Author: Claude (product design + engineering review)
> Audience: David (lead developer)

---

## Part 1: Editing Approach — Product Design Critique

### Key Insight: The Builder Is a Design Tool, Not a Content Tool

**Critical reframe:** Because the CMS handles all recurring content updates (sermons, events, bible studies, announcements, etc.), the website builder has **almost zero weekly editing traffic.** A pastor doesn't open the builder to "post this week's sermon" — they use the CMS content pages for that, and the website updates automatically via data-driven sections.

The builder is only opened for:
1. **Design changes** — switching color schemes, adjusting padding, changing section visibility (~monthly)
2. **Structural changes** — adding/removing/reordering sections, adding new pages (~quarterly)
3. **One-time content setup** — writing the "About Us" text, setting up the "I'm New" page, configuring the footer (~during onboarding, then rarely)
4. **Navigation changes** — updating menu items (~when adding new pages)

This means the builder's usage pattern is fundamentally different from Squarespace or Wix, where users edit content *through* the builder weekly. Our users edit content through the CMS and only touch the builder when they want to change *how the website looks or is structured*.

### The Current Approach: Eventbrite-Style Drawer Editor

The current builder uses a **320px right drawer** that opens when you select a section. All edits happen in form fields inside this drawer, and the canvas updates in real-time.

**Why Eventbrite gets away with it:** Eventbrite's event pages are structurally identical for every user. There's no layout variation — the editing surface and the preview are decoupled without consequence because there's nothing to "see."

**Revised assessment for our builder:** The Eventbrite-style drawer actually works *better* than I initially argued, precisely because of the low-frequency, design-focused usage pattern:

- **Users are in "design mode" not "content mode."** When someone opens the builder to change a color scheme or add a section, they're already in a deliberate, focused mindset. The spatial disconnect between drawer and canvas matters less because they're making intentional changes and checking the result — not rapid-fire typing.
- **Most edits are settings, not text.** Color scheme toggle, padding dropdown, visibility switch, container width — these are inherently form-based interactions. A drawer with dropdowns and toggles is the natural UI for this.
- **Text editing is one-time setup, not recurring.** When the pastor writes "Welcome to LA UBF" in the hero heading, that's a one-time task during initial setup. They're willing to spend 30 seconds in a form for something they'll do once.

### Where the Drawer Still Falls Short

Even with low-frequency usage, there are real UX problems:

1. **Text-layout feedback gap.** During initial setup (which is the *critical* first impression of the product), the user writes headings and descriptions without seeing how they affect layout. A heading that wraps to 3 lines on mobile isn't visible in the drawer. For a user who "fears breaking the website," this creates exactly the anxiety we want to avoid.

2. **Design setting previews.** When toggling between LIGHT and DARK color schemes, the user should see the change *instantly* without having to close the drawer or scroll the canvas. The drawer currently obscures part of the canvas (320px eaten from the right side).

3. **Section configuration during onboarding.** The first time a church sets up their website is the highest-friction moment. They're configuring 10+ sections on the homepage, writing all the text content, uploading images. This is where the drawer's form-heaviness is most painful — not because they'll do it again, but because a bad first experience kills adoption.

### What Beginners Actually Struggle With (Revised for Design-Mode Context)

For infrequent design-tool users, the friction points shift:

1. **"I don't remember how this works"** — Because they only use the builder every few weeks/months, they forget the UI. The interface must be self-explanatory every time they open it.
2. **"I changed something but I'm not sure what it did"** — Settings like `paddingY: COMPACT vs DEFAULT` are meaningless without visual feedback. They need to see the before/after.
3. **"I just want to do one thing and leave"** — They came to add a section or change a color, not to learn a builder. Minimize the steps between intent and result.
4. **"I'm scared I'll break something I set up months ago"** — The undo/redo system (already built) is critical. But also: showing a clear "last published" state they can revert to.

### Revised Recommendation: Drawer-First with Smart Enhancements

Given that this is a **low-frequency design tool** (not a high-frequency content tool), the right approach is:

#### Keep the Drawer as Primary Editor
The drawer is the correct paradigm for design settings. Don't fight it. Instead, make it excellent:
- **Live preview:** Every change in the drawer should update the canvas instantly (already works via state).
- **Canvas auto-scroll:** When opening a section's drawer, auto-scroll the canvas to center that section so the user always sees what they're editing.
- **Progressive disclosure:** Group fields into "Content" (heading, text, images) and "Design" (color, padding, width) — collapse "Design" by default so one-time setup feels simpler.
- **Field-to-canvas highlighting:** When the user focuses a form field (e.g., "Heading"), briefly highlight the corresponding element on the canvas with a subtle pulse/outline. This eliminates the "where did my change go?" problem without building full inline editing.

#### Don't Build Inline Canvas Editing (For Now)
Inline click-to-edit on the canvas is the wrong investment for this usage pattern:
- **High implementation cost** (contentEditable sync, click targeting, rich text toolbars) for a feature that would be used maybe once during setup.
- **The CMS already handles all recurring text edits** — sermon titles, event names, etc. never go through the builder.
- **Design settings can't be inline anyway** — color scheme, padding, animations are inherently form-based.

If inline editing ever becomes valuable, it would be for **onboarding/initial setup** specifically — not for ongoing use. That's a future optimization, not a launch requirement.

#### The Progressive Toolbar (Still Valuable)

David's "progressive edit bar" idea remains strong, but reframed for design-mode:

**Default state (quick actions):** When a section is selected, the floating toolbar shows:
- Light/Dark toggle (most common design change — one click)
- Visibility toggle (show/hide section)
- Edit button (opens drawer with full settings)
- Delete
- Drag handle

**Why this works:** The most frequent builder actions (toggle color scheme, hide a section) become one-click operations without opening the drawer at all. The drawer is reserved for deeper configuration.

### Competitive Reference Points (Revised)

The closest analogue is no longer Squarespace/Wix (content-editing builders). Instead:

| Product | Usage Pattern | Primary Edit | Our Similarity |
|---------|--------------|-------------|----------------|
| **Shopify theme editor** | Infrequent design changes; products managed in admin | Right sidebar with form fields + live preview | Very high — same "CMS for content, builder for design" split |
| **HubSpot page editor** | Marketing team edits pages; CRM handles data | Sidebar editor + inline for text | High — data-driven sections auto-update |
| **Notion (as CMS)** | Content in Notion; website auto-generates | Minimal builder settings | Conceptually similar — content and design are decoupled |
| **Ghost (theme settings)** | Posts in editor; theme configured separately | Settings panel with live preview | High — content workflow vs design workflow |

**Shopify's theme editor** is the strongest reference. Their "Customize" experience uses a left sidebar with form fields and the live preview on the right — almost identical to our drawer approach. They don't offer inline text editing. It works because merchants edit products in the admin and only customize the theme occasionally.

### What Changes From This Reframe

| Original Assumption | Revised Understanding | Impact on Plan |
|--------------------|----------------------|----------------|
| Users edit text in the builder weekly | Users edit text in the builder during setup only | Inline text editing is a nice-to-have, not critical |
| "Quick content changes" is the primary use case | Design/structural changes are the primary use case | Drawer with settings is the right primary UI |
| 80% of edits are text changes | 80% of edits are design toggles (color, padding, visibility) | One-click toolbar actions are more impactful than inline editing |
| Builder must compete with Squarespace UX | Builder must compete with Shopify theme editor UX | Lower UX bar — form-based is acceptable |
| Tier 1 inline + Tier 2 drawer | Toolbar quick actions + Drawer for everything else | Simpler to implement, matches actual usage |

### Honest Assessment: What Still Matters a Lot

Even though inline editing is deprioritized, these things are **critical** for the infrequent design-mode usage:

1. **Every field in the drawer must actually work and save correctly.** If a user opens the builder once a quarter and a field silently fails to save, they won't discover it until they check the live site — possibly weeks later. This is why the section audit and editor completeness work (Part 3) is the real priority.

2. **The canvas must be an accurate preview.** If the builder shows one thing and the live site shows another, the user loses trust in the tool entirely. Builder-to-website rendering parity is essential.

3. **Undo and revert must be bulletproof.** A user who only touches the builder occasionally has no memory of "what it looked like before." They need confidence that they can always go back.

4. **The onboarding/initial setup experience.** This is the ONE time the builder gets heavy use. If the first setup is painful, the user will never voluntarily return. Consider a guided setup flow (wizard-style) that walks through each page's sections — separate from the free-form builder.

---

## Part 2: Editor-First vs API-First — Critical Review

David's instinct: "It feels more natural to implement the editor logic first before the API connection."

### Analysis

**The current state:**
- API routes for sections already exist and work (POST, PATCH, DELETE, PUT reorder)
- The right drawer editor already exists with type-specific editors (hero, content, cards, etc.)
- Section components render correctly on both canvas and public website
- Auto-save (30s), undo/redo, and unsaved changes guard all work

**What "editor logic first" means in practice:**
- Audit each section's editable fields
- Build/fix the section-specific editor forms in the right drawer
- Ensure the canvas updates in real-time when editing
- Later: wire up API calls (which mostly already work)

**What "API-first" would mean:**
- Ensure every section's content schema is validated
- Ensure PATCH endpoints correctly persist all field types
- Then build the editor forms to match

**Verdict: Editor-first is correct, but for a specific reason.**

The APIs already work generically — they accept any JSON content and persist it. The validation is loose (just checks it's an object with reasonable depth/size). So the API isn't the bottleneck; it'll accept whatever you throw at it.

The real work is:
1. **Deciding what's editable** per section (design decision)
2. **Building the editor UI** for those fields (frontend work)
3. **Ensuring the section component reads the edited fields** (prop mapping)

All three are editor-side concerns. The API is just `PATCH content: { ... }` — it doesn't need to know or care about section-specific field structures. The only API work needed is if you want server-side content validation per section type (Zod schemas), which is a nice-to-have, not a blocker.

**One caveat:** If you plan to add Tier 1 inline editing (click-to-edit on canvas), that's a fundamentally different editing paradigm from the right drawer. Implementing that *alongside* the existing drawer would require careful state management. My recommendation: perfect the drawer editors first (this week), then layer inline editing on top as a follow-up sprint (next week or later).

---

## Part 3: Full Section Audit

### Section Classification

Every section falls into one of these categories:

| Category | Description | Count |
|----------|-------------|-------|
| **CMS-Connected** | Content comes from database records (messages, events, etc.) — editing happens in CMS, not builder | 11 |
| **Static Content** | Content lives in section JSONB — editing happens in builder | 27 |
| **Layout/Navigation** | Structural sections (navbar, footer, quick links) | 3 |
| **Custom/Embed** | User-provided HTML or iframe embeds | 2 |

### CMS-Connected Sections (Content Driven by CMS Database)

These sections are **not edited in the builder** — their content updates automatically when CMS records change. The builder only controls: heading text, display settings (color/padding/width), and visibility.

| # | Section Type | Data Source | What Changes via CMS | Builder-Editable |
|---|-------------|-------------|---------------------|------------------|
| 1 | ALL_MESSAGES | `getMessages()` | Publishing/editing messages | Heading |
| 2 | ALL_EVENTS | `getEvents()` | Creating/editing events | Heading |
| 3 | ALL_BIBLE_STUDIES | `getBibleStudies()` | Publishing bible studies | Heading |
| 4 | ALL_VIDEOS | `getVideos()` | Adding videos | Heading |
| 5 | SPOTLIGHT_MEDIA | `getLatestMessage()` | Publishing a new message auto-updates | Section heading |
| 6 | MEDIA_GRID | `getVideos()` | Adding/reordering videos | Heading, CTA label/link |
| 7 | HIGHLIGHT_CARDS | `getHybridFeaturedEvents()` | Featuring/un-featuring events | Heading, subheading, CTA |
| 8 | UPCOMING_EVENTS | `getUpcomingEvents()` | Creating events with future dates | Overline, heading, CTA |
| 9 | EVENT_CALENDAR | `getUpcomingEvents()` | Same as above | Heading, CTA buttons |
| 10 | RECURRING_MEETINGS | `getUpcomingEvents()` (isRecurring) | Editing recurring events | Heading, maxVisible |
| 11 | QUICK_LINKS | `getUpcomingEvents()` | Same as events | Heading, subtitle |
| — | CAMPUS_CARD_GRID | `getCampuses()` (optional) | Adding campuses in CMS | Heading, description, CTA, decorative images |
| — | DAILY_BREAD_FEATURE | `getTodaysDailyBread()` | Publishing daily bread entries | None (fully data-driven) |

**Builder work needed for CMS-connected sections:** Minimal. These sections need:
- ✅ Heading/CTA text editing (mostly already in DataSectionEditor)
- ⚠️ Audit: some sections accept extra config fields not exposed in editor (e.g., RECURRING_MEETINGS `maxVisible`, EVENT_CALENDAR `ctaButtons[]`)
- ⚠️ Empty state handling when no CMS data exists

### Static Content Sections — Detailed Audit

Each section below needs: (a) field audit, (b) editor form review, (c) prop mapping verification, (d) theme variable compliance.

---

#### HERO SECTIONS (5)

**1. HERO_BANNER**
- **Current editor:** HeroEditor — heading (2 lines), subheading, primary/secondary buttons, background image
- **Missing from editor:** Background video URL, video mobile fallback image
- **Hardcoded content:** `compressed-hero-vid.webm` Cloudflare R2 URL
- **Work needed:** Add video URL field, remove hardcoded video, ensure fallback image field exists
- **Effort:** 🟡 Medium (1-2 hours)

**2. PAGE_HERO**
- **Current editor:** HeroEditor (shared)
- **Missing from editor:** Floating images array (up to 10), overline text
- **Work needed:** Add overline field, add image array editor (add/remove/reorder floating images)
- **Effort:** 🟡 Medium (1-2 hours)

**3. TEXT_IMAGE_HERO**
- **Current editor:** HeroEditor (shared)
- **Missing from editor:** `headingAccent` (second styled heading line), `textAlign` option, description field, image
- **Work needed:** Add accent heading, text alignment radio, description textarea, image picker
- **Effort:** 🟡 Medium (1 hour)

**4. EVENTS_HERO**
- **Current editor:** HeroEditor (shared)
- **Editable fields:** heading, subtitle
- **Missing:** Nothing — this is a minimal section
- **Work needed:** Verify HeroEditor maps heading/subtitle correctly
- **Effort:** 🟢 Low (15 min verification)

**5. MINISTRY_HERO**
- **Current editor:** HeroEditor (shared)
- **Missing from editor:** Social links array (email, Instagram, Facebook, website), `headingStyle` toggle, hero image, overline
- **Work needed:** Add social links editor, heading style radio (display/sans), image picker, overline
- **Effort:** 🔴 High (2-3 hours — social links array editor is new UI)

---

#### CONTENT SECTIONS (6)

**6. MEDIA_TEXT**
- **Current editor:** ContentEditor (shared)
- **Missing from editor:** Images array (up to 14 for rotating wheel), rotation speed, overline
- **Work needed:** Add image array editor, rotation speed slider, overline field
- **Effort:** 🔴 High (2-3 hours — image array with preview)

**7. QUOTE_BANNER**
- **Current editor:** ContentEditor (shared)
- **Editable:** overline, heading, verse text, verse reference
- **Missing:** Nothing major — verify fields map correctly
- **Effort:** 🟢 Low (15 min verification)

**8. CTA_BANNER**
- **Current editor:** ContentEditor (shared)
- **Editable:** overline, heading, body, primaryButton, secondaryButton, backgroundImage
- **Missing:** Verify all button fields (label, href, visible) are exposed
- **Effort:** 🟢 Low (30 min)

**9. ABOUT_DESCRIPTION**
- **Current editor:** ContentEditor (shared)
- **Missing from editor:** Logo image picker, video URL, video title
- **Work needed:** Add logo picker, video URL input, video title
- **Effort:** 🟡 Medium (1 hour)

**10. STATEMENT**
- **Current editor:** ContentEditor (shared)
- **Missing from editor:** `leadIn` text, `showIcon` toggle, paragraphs array
- **Work needed:** Add paragraph array editor (add/remove/reorder), lead-in textarea, icon toggle
- **Effort:** 🟡 Medium (1.5 hours)

**11. SPOTLIGHT_MEDIA** (partially CMS-connected)
- **Current editor:** ContentEditor — but sermon data comes from `latest-message` dataSource
- **Builder-editable:** Section heading only
- **Work needed:** Verify heading field works, add info banner "Content from latest published message"
- **Effort:** 🟢 Low (15 min)

---

#### CARD LAYOUT SECTIONS (6)

**12. ACTION_CARD_GRID**
- **Current editor:** CardsEditor (shared)
- **Missing from editor:** Multi-line heading (3 lines), subheading, CTA button, cards array (image, title, link)
- **Work needed:** Add 3-line heading inputs, cards array editor with image pickers
- **Effort:** 🔴 High (2-3 hours)

**13. HIGHLIGHT_CARDS** (CMS-connected)
- **Builder-editable:** heading, subheading, CTA label/href
- **Work needed:** Already in DataSectionEditor, verify fields
- **Effort:** 🟢 Low (15 min)

**14. FEATURE_BREAKDOWN**
- **Current editor:** CardsEditor (shared)
- **Missing from editor:** Acronym lines array (letter + text), description, button
- **Work needed:** Add acronym array editor, description field, button config
- **Hardcoded:** LA UBF logo watermark URL — needs to be configurable or removed
- **Effort:** 🟡 Medium (1.5 hours)

**15. PATHWAY_CARD**
- **Current editor:** CardsEditor (shared)
- **Missing from editor:** Cards array (icon, title, description, button with label/href/variant)
- **Work needed:** Full card array editor with icon picker, button config per card
- **Effort:** 🔴 High (2-3 hours)

**16. PILLARS**
- **Current editor:** CardsEditor (shared)
- **Missing from editor:** Items array (title, description, images[], button)
- **Work needed:** Pillar array editor with nested image arrays per pillar
- **Effort:** 🔴 High (3-4 hours — nested arrays with images)

**17. NEWCOMER**
- **Current editor:** CardsEditor (shared)
- **Missing from editor:** Verify heading, description, button, image fields
- **Work needed:** Should be straightforward — flat content structure
- **Effort:** 🟢 Low (30 min)

---

#### MINISTRY SECTIONS (6)

**18. MINISTRY_INTRO**
- **Current editor:** MinistryEditor (shared)
- **Missing from editor:** Overline, heading, description, optional side image
- **Work needed:** Verify fields, add image picker
- **Effort:** 🟢 Low (30 min)

**19. MINISTRY_SCHEDULE**
- **Current editor:** MinistryEditor (shared)
- **Missing from editor:** Schedule entries array, time value, address array, directions URL, buttons array, image, logo, `headingStyle` toggle
- **Work needed:** Complex — schedule entry list editor, address lines, multiple buttons, images
- **Effort:** 🔴 High (3-4 hours)

**20. CAMPUS_CARD_GRID** (partially CMS-connected)
- **Current editor:** MinistryEditor (shared)
- **Builder-editable:** overline, heading, description, decorative images, CTA heading/button, manual campus list
- **CMS-connected:** Optional `all-campuses` dataSource for auto-populated list
- **Work needed:** Verify decorative images editor, campus array editor for manual mode
- **Effort:** 🟡 Medium (1.5 hours)

**21. DIRECTORY_LIST**
- **Current editor:** MinistryEditor (shared)
- **Missing from editor:** Items array (title, description, link), side image, CTA heading/button
- **Work needed:** Directory items array editor, image picker, CTA config
- **Effort:** 🟡 Medium (2 hours)

**22. MEET_TEAM**
- **Current editor:** MinistryEditor (shared)
- **Missing from editor:** Members array (name, role, bio, image)
- **Work needed:** Team member array editor with image per member
- **Effort:** 🟡 Medium (2 hours)

**23. LOCATION_DETAIL**
- **Current editor:** MinistryEditor (shared)
- **Missing from editor:** Labels, time value, address array, directions URL/label, images array
- **Work needed:** Multiple text inputs, address line editor, image array
- **Effort:** 🟡 Medium (1.5 hours)

---

#### INTERACTIVE SECTIONS (3)

**24. FAQ_SECTION**
- **Current editor:** Dedicated FaqEditor
- **Editable:** heading, showIcon toggle, items array (question, answer, answerHtml)
- **Work needed:** Verify FAQ items array editor works (add/remove/reorder). Rich text for answers?
- **Effort:** 🟡 Medium (1 hour — depends on rich text need)

**25. FORM_SECTION**
- **Current editor:** Dedicated FormEditor
- **Missing from editor:** Interest options array, campus options array, labels, success message
- **Work needed:** Array editors for dropdown options, label customization
- **Effort:** 🟡 Medium (1.5 hours)

**26. TIMELINE_SECTION**
- **Current editor:** Dedicated TimelineEditor
- **Missing from editor:** Items array (time, title, description), image/video, overline
- **Work needed:** Timeline items array editor, media picker
- **Effort:** 🟡 Medium (1.5 hours)

---

#### NAVIGATION & LAYOUT (2 editable)

**27. FOOTER**
- **Current editor:** Dedicated FooterEditor
- **Missing from editor:** Description, social links array, columns array (label + links), contact info, logo
- **Hardcoded:** Default LA UBF logo URL
- **Work needed:** Complex nested editor — social links, nav columns with link arrays, contact fields
- **Effort:** 🔴 High (3-4 hours)

**28. QUICK_LINKS** (CMS-connected)
- **Builder-editable:** heading, subtitle
- **Work needed:** Verify heading/subtitle fields in editor
- **Effort:** 🟢 Low (15 min)

---

#### CUSTOM/EMBED (2)

**29. CUSTOM_HTML**
- **Current editor:** Dedicated
- **Editable:** Raw HTML string
- **Work needed:** Verify HTML textarea editor, consider adding a code editor (Monaco/CodeMirror) — nice-to-have
- **Effort:** 🟢 Low (15 min verification, optional enhancement)

**30. CUSTOM_EMBED**
- **Current editor:** Dedicated
- **Editable:** embedUrl, title, aspectRatio
- **Work needed:** Verify fields, add aspect ratio dropdown
- **Effort:** 🟢 Low (15 min)

---

### Sections That Could Be Merged

| Candidate Merge | Sections | Rationale |
|----------------|----------|-----------|
| **Hero → Unified Hero** | HERO_BANNER, PAGE_HERO, TEXT_IMAGE_HERO, EVENTS_HERO, MINISTRY_HERO | All are hero-style top sections with heading + optional image/video. Could be one component with layout variants (full-bleed, split, minimal, floating images, social links). **However:** the visual differences are substantial enough that separate components are probably correct — just ensure the HeroEditor handles type-specific fields cleanly. |
| **Schedule → Unified Schedule** | RECURRING_SCHEDULE, MINISTRY_SCHEDULE | Both display recurring meeting times. RECURRING_SCHEDULE is simpler (day pills + time). MINISTRY_SCHEDULE has more fields (address, directions, buttons, logo). **Recommendation:** Keep separate — MINISTRY_SCHEDULE is campus-specific. |
| **CTA sections** | CTA_BANNER, NEWCOMER | Both are call-to-action with heading + description + button. NEWCOMER adds an icon and optional image. **Recommendation:** Could merge into one "CTA" section with toggleable icon/image — but low priority. |
| **Event listing** | UPCOMING_EVENTS, RECURRING_MEETINGS | Both display events. UPCOMING_EVENTS shows all upcoming; RECURRING_MEETINGS filters to recurring only. **Recommendation:** Could add a filter toggle to UPCOMING_EVENTS instead of separate section. Worth exploring. |
| **All-content pages** | ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES, ALL_VIDEOS | All follow identical pattern: heading + full-page list with search/filter. **Recommendation:** Already separate for good reason (different data schemas). Keep as-is. |

**Bottom line:** No sections need immediate merging. The section types are well-differentiated. Focus on making each editor complete rather than reducing section count.

---

### Hardcoded Content That Needs Fixing

| Section | What's Hardcoded | Fix |
|---------|-----------------|-----|
| HERO_BANNER | `compressed-hero-vid.webm` Cloudflare R2 URL | Add `backgroundVideoUrl` to content JSONB |
| FEATURE_BREAKDOWN | LA UBF logo watermark URL | Add `watermarkUrl` to content or remove watermark |
| STATEMENT | `cross.png` mask image URL | Add `maskImageUrl` to content or make optional |
| FOOTER | Default LA UBF logo URL | Already has `logoUrl` prop — just ensure seed populates it |
| DAILY_BREAD_FEATURE | UBF.org fallback URLs | Acceptable — this is a UBF-specific section |

---

### Theme Variable Compliance

All 40 sections use `SectionContainer` which applies color scheme CSS variables. However, some sections have hardcoded colors:

| Section | Issue |
|---------|-------|
| FEATURE_BREAKDOWN | Uses `bg-brand-2` — a Tailwind custom class that may not respond to theme changes |
| DIRECTORY_LIST | Forces `colorScheme: 'light'` via context — no dark mode option |
| HERO_BANNER | Forces dark theme — intentional but limits flexibility |
| QUOTE_BANNER | Forces dark theme — intentional |
| CTA_BANNER | Forces dark theme — intentional |
| FOOTER | Forces dark theme — intentional |

**Impact on template switching:** When implementing templates, sections that force a color scheme won't respond to global theme changes. This is acceptable for some (footer is always dark) but may need overrides for others.

---

## Part 4: Effort Summary & 4-Day Plan

### Development Speed Calibration

Based on git history analysis (Feb-Mar 2026):
- **Average:** 12-16 commits/day, 3,000-5,000 net lines of code/day
- **Major features** (RBAC, auth, media storage) ship in 1-2 days
- **Pattern:** Build → ship → fix cycle, with refinement commits same/next day
- **With Claude Code:** The throughput numbers already reflect AI-assisted development

**Realistic estimate per section editor:** With the existing editor infrastructure (shared editors, display settings component, builder-shell state management), building a section-specific editor form is roughly:
- 🟢 Low (verification only): 15-30 min
- 🟡 Medium (new fields, no arrays): 1-1.5 hours
- 🔴 High (array editors, nested content): 2-4 hours

### Total Effort Breakdown

| Category | Sections | Total Effort |
|----------|----------|-------------|
| 🟢 Low (verification) | EVENTS_HERO, SPOTLIGHT_MEDIA, HIGHLIGHT_CARDS, QUOTE_BANNER, NEWCOMER, MINISTRY_INTRO, QUICK_LINKS, CUSTOM_HTML, CUSTOM_EMBED, CTA_BANNER | ~3 hours |
| 🟡 Medium | TEXT_IMAGE_HERO, PAGE_HERO, HERO_BANNER, ABOUT_DESCRIPTION, STATEMENT, FEATURE_BREAKDOWN, CAMPUS_CARD_GRID, DIRECTORY_LIST, MEET_TEAM, LOCATION_DETAIL, FAQ_SECTION, FORM_SECTION, TIMELINE_SECTION | ~20 hours |
| 🔴 High | MINISTRY_HERO, MEDIA_TEXT, ACTION_CARD_GRID, PATHWAY_CARD, PILLARS, MINISTRY_SCHEDULE, FOOTER | ~20 hours |
| **Cross-cutting work** | Reusable array editor component, image array component, button config component, hardcoded content fixes, theme compliance fixes | ~4 hours |
| **Total** | | **~47 hours** |

### Reusable Components to Build First

Before tackling individual sections, build these shared editor primitives (saves massive time across all sections):

1. **ArrayFieldEditor** — Generic add/remove/reorder list with customizable item renderer (~2 hours)
2. **ButtonConfigEditor** — Label + href + variant + visible toggle (~30 min)
3. **ImageFieldEditor** — Single image with MediaPickerDialog integration (~30 min)
4. **ImageArrayEditor** — Multiple images with add/remove/reorder (~1 hour)
5. **SocialLinksEditor** — Type dropdown + URL input, add/remove (~30 min)

Total: ~4.5 hours. These primitives make every 🔴 High section become 🟡 Medium.

---

### 4-Day Plan: Tuesday March 18 – Friday March 21

**Goal:** Every section fully editable in the builder, navigation working correctly, undo/redo reliable, color palette system in place.

---

#### DAY 1 — Tuesday: Navigation, Undo/Redo, Color System + Easy Sections

**Fix Navigation Sidebar (~3-4 hours)**
- [ ] Audit the current navigation sidebar against the public website — identify what's broken / displaying wrong
- [ ] Fix menu rendering so it matches the actual site navigation (correct links, correct hierarchy, correct labels)
- [ ] Separate Quick Links from the main navbar — Quick Links (bottom-right FAB) should be its own managed list, independent of the nav menu. Rationale: Quick Links serve a different purpose (quick access to meetings/events) and shouldn't be tied to the navigation structure.
- [ ] Make sure navigation changes save and reflect on the public site

**Undo/Redo Cleanup (~1-2 hours)**
- [ ] Verify undo/redo works reliably within a single editing session (from open to save)
- [ ] Set a reasonable history limit (e.g., 50 snapshots) so memory doesn't balloon
- [ ] Ensure undo/redo captures all edit types: content changes, reordering, adding/removing sections, display setting changes
- [ ] Full version control (cross-session history, revert to published state) is deferred — note this as future work

**Color Palette System (~2-3 hours)**
- [ ] Replace the binary light/dark toggle with a color palette selector per section
- [ ] Each palette = a named set of color variations (e.g., "Light", "Dark", "Brand Primary", "Brand Accent", "Muted") that map to CSS variable overrides
- [ ] Sections pick a palette, not just light/dark — this gives more design flexibility without overwhelming the user
- [ ] Ensure all existing sections respond correctly to the new palette system (backward-compatible with current light/dark)

**Verify All Simple Sections (~2-3 hours)**
- [ ] Go through the 10 sections that should already work (EVENTS_HERO, QUOTE_BANNER, CTA_BANNER, NEWCOMER, MINISTRY_INTRO, SPOTLIGHT_MEDIA, HIGHLIGHT_CARDS, QUICK_LINKS, CUSTOM_HTML, CUSTOM_EMBED)
- [ ] For each: open editor, check every field saves, check canvas updates, check public site renders correctly
- [ ] Fix any broken field mappings

**Complete All Hero Section Editors (~3-4 hours)**
- [ ] HERO_BANNER — make background video/image configurable (currently hardcoded)
- [ ] PAGE_HERO — add floating images editing, overline text
- [ ] TEXT_IMAGE_HERO — add all fields (accent heading, text alignment, description, image)
- [ ] MINISTRY_HERO — add social links, heading style choice, hero image

**End of day:** Navigation works, undo/redo is solid, color palettes replace light/dark, ~17 sections verified or complete.

---

#### DAY 2 — Wednesday: Content + Card Sections

**Content Sections (~5-6 hours)**
- [ ] MEDIA_TEXT — make image gallery editable (add/remove/reorder images), body text, overline
- [ ] ABOUT_DESCRIPTION — add logo, video URL, description editing
- [ ] STATEMENT — make paragraph list editable (add/remove/reorder), lead-in text, icon toggle
- [ ] Remove hardcoded LA UBF URLs from FEATURE_BREAKDOWN and STATEMENT (watermark logo, mask image)

**Card Layout Sections (~5-6 hours)**
- [ ] ACTION_CARD_GRID — make cards editable (image + title + link per card), multi-line heading
- [ ] FEATURE_BREAKDOWN — acronym lines editing, description, button, configurable watermark
- [ ] PATHWAY_CARD — make cards editable (icon + title + description + button per card)
- [ ] PILLARS — make pillars editable (title + description + images + button per pillar) — this is the most complex one, nested content with multiple images per item

**End of day:** All content and card sections complete. ~23 sections done.

---

#### DAY 3 — Thursday: Ministry + Interactive + Footer + CMS Sections

**Ministry Sections (~5-6 hours)**
- [ ] MINISTRY_SCHEDULE — schedule entries, time/location details, buttons, images (most complex ministry section)
- [ ] CAMPUS_CARD_GRID — decorative images, manual campus list editing, CTA
- [ ] DIRECTORY_LIST — directory items list, side image, CTA
- [ ] MEET_TEAM — team member list (name, role, bio, photo per member)
- [ ] LOCATION_DETAIL — time/address/directions details, images

**Interactive + Layout Sections (~4-5 hours)**
- [ ] FAQ_SECTION — FAQ items list (question + answer pairs)
- [ ] FORM_SECTION — customize dropdown options, labels, success message
- [ ] TIMELINE_SECTION — timeline items list, image/video media
- [ ] FOOTER — social links, navigation columns, contact info, logo (replace hardcoded logo URL)

**CMS-Connected Section Polish (~2 hours)**
- [ ] Go through all 11 data-driven sections and verify their builder-side config fields work (headings, CTAs, display settings)
- [ ] Add clear "Content managed in CMS" labels so users know these sections auto-update
- [ ] EVENT_CALENDAR — make CTA buttons configurable
- [ ] RECURRING_MEETINGS — add "max items shown" setting

**End of day:** All 30+ section editors complete. Every section in the builder is fully editable.

---

#### DAY 4 — Friday: Testing, Theme Compliance, Polish

**End-to-End Testing (~4-5 hours)**
- [ ] Test every section type: edit in builder → save → check public website matches
- [ ] Test adding a new section of each type → verify it gets sensible default content
- [ ] Test deleting sections, reordering sections, toggling visibility
- [ ] Test undo/redo across different edit types
- [ ] Test navigation changes reflect on public site

**Color Palette & Theme Compliance (~3-4 hours)**
- [ ] Verify all sections respond correctly to palette changes (not just the old light/dark)
- [ ] Verify all sections use theme fonts (heading font, body font) — not hardcoded font families
- [ ] Fix any sections using hardcoded colors instead of theme tokens
- [ ] Test that changing global theme settings (in theme manager) flows through to every section

**Edge Cases & Polish (~3 hours)**
- [ ] Empty state handling — what does each section look like with no content?
- [ ] Long text overflow — headings that wrap to 3+ lines, descriptions that are too long
- [ ] Image aspect ratio edge cases
- [ ] Mobile preview mode accuracy
- [ ] Clean up any remaining hardcoded URLs
- [ ] Update PRD with current status

---

### What's NOT in This Week

| Item | Why Deferred |
|------|-------------|
| Inline canvas editing (click on text to edit directly) | Nice UX upgrade but not critical given the builder is used infrequently. Drawer editors must be complete first. |
| AI website generation / onboarding wizard | Requires completed section editors. Target: next week. |
| Full version control (cross-session history, revert to previous versions) | Undo/redo within a session is sufficient for now. Full version history is a separate feature. |
| Template switching | Related to theme/palette work but full template library is a bigger feature. |
| New section types | 40 types is more than enough for MVP. |
| Section merging/consolidation | All sections are actively used. Low ROI to merge right now. |

---

## Part 5: Section Grouping by Edit Source

### Builder-Only Edits (27 sections)
Content lives entirely in `PageSection.content` JSONB. All edits happen in the website builder. No CMS interaction needed.

```
HERO_BANNER, PAGE_HERO, TEXT_IMAGE_HERO, EVENTS_HERO, MINISTRY_HERO,
MEDIA_TEXT, QUOTE_BANNER, CTA_BANNER, ABOUT_DESCRIPTION, STATEMENT,
ACTION_CARD_GRID, FEATURE_BREAKDOWN, PATHWAY_CARD, PILLARS, NEWCOMER,
MINISTRY_INTRO, MINISTRY_SCHEDULE, DIRECTORY_LIST, MEET_TEAM, LOCATION_DETAIL,
RECURRING_SCHEDULE, FAQ_SECTION, FORM_SECTION, TIMELINE_SECTION,
PHOTO_GALLERY, CUSTOM_HTML, CUSTOM_EMBED
```

### CMS-Only Edits (5 sections)
Content comes entirely from CMS database records. Builder only controls heading/display settings.

```
ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES, ALL_VIDEOS, DAILY_BREAD_FEATURE
```

### Hybrid — CMS Content + Builder Config (6 sections)
Primary content from CMS, but builder controls supplementary text/layout.

```
SPOTLIGHT_MEDIA  — sermon from CMS, heading from builder
MEDIA_GRID       — videos from CMS, heading/CTA from builder
HIGHLIGHT_CARDS  — events from CMS, heading/CTA from builder
UPCOMING_EVENTS  — events from CMS, heading/overline/CTA from builder
EVENT_CALENDAR   — events from CMS, heading/CTA buttons from builder
RECURRING_MEETINGS — events from CMS, heading/maxVisible from builder
QUICK_LINKS      — events from CMS, heading/subtitle from builder
CAMPUS_CARD_GRID — optional CMS campuses OR manual list from builder
```

### Layout (2 sections — special handling)
```
FOOTER — edited in builder (complex nested content)
NAVBAR — not a PageSection (handled by website layout + navigation editor)
```

---

## Appendix: Observations on the Current Builder vs Public Website

The seed data in `prisma/seed.mts` represents the **source of truth** for what the LA UBF website currently shows. Key observations from auditing the seed data against the section components:

1. **Home page has 10 sections** — this is the most complex page and the best test case for the builder.
2. **Campus ministry pages are templated** — all 10+ campus pages follow the exact same section pattern (MINISTRY_HERO → MINISTRY_INTRO → MINISTRY_SCHEDULE → MEET_TEAM → FAQ_SECTION → CAMPUS_CARD_GRID). This validates the template concept.
3. **The "I'm New" page is the most section-diverse** — 8 different section types including interactive (FORM_SECTION, FAQ_SECTION, TIMELINE_SECTION). Best page for comprehensive editor testing.
4. **Several sections appear on multiple pages** — NEWCOMER (5 pages), PILLARS (4 pages), CAMPUS_CARD_GRID (12+ pages), UPCOMING_EVENTS (4 pages). Edits to shared section *types* don't propagate — each page has its own section instance with its own content. This is correct behavior.
5. **The GIVING page is minimal** — just PAGE_HERO + hidden STATEMENT. This suggests it's incomplete or intentionally simple.
6. **PHOTO_GALLERY is hidden on some pages** — `visible: false` on high-school ministry. The visibility toggle is already being used in production seed data.

**Important:** When auditing section rendering, use the **public website** (`laubf.lclab.io` or `localhost:3000/website/`) as the ground truth — not the builder canvas (which may have rendering differences noted in `docs/04_builder/builder-rendering.md`).

---

## Appendix B: Eventbrite-Style Editing Model — Sanity Check

### What Eventbrite Does

You see your event page as a structured form — not a canvas. Each "section" (title, date, description, images) is a discrete form block stacked vertically. You fill in fields, and the output is deterministic. There's no preview toggle because the form *is* the preview in a sense — the layout is fixed.

### Why It Feels Easy

1. **Zero design decisions.** Every field has exactly one place it appears on the page. You type a title, it goes in the title spot. There's no "where should this go" or "how will this look." The system decides layout entirely.
2. **No canvas split-attention.** You're not looking at two things (form + preview). You're looking at one thing (form) and trusting the system. This is cognitively cheaper.
3. **Completeness is obvious.** Empty fields = empty sections. You can scan the form top-to-bottom and know exactly what's missing. There's no hidden configuration.
4. **No fear of breaking anything.** Because there's no design layer, there's nothing to break. You can't accidentally make text overflow or misalign an image. The worst case is a typo.

### Pros If Applied to Our Website Builder

| Pro | Detail |
|-----|--------|
| Simpler to build | Form fields are straightforward React — no canvas rendering complexity, no click targeting, no contentEditable |
| Matches the "I don't want to design" user | Church admins don't *want* to be in a visual builder. A structured form says "just fill this in" which is less intimidating |
| Faster editing for known sections | When you know what you want to change, a labeled form field is faster than hunting for it on a canvas |
| Mobile-friendly admin | Forms work on phones/tablets. Canvas builders don't. If a pastor wants to update something from their phone, forms win |
| Naturally progressive | You can show "basic fields" collapsed and "advanced settings" behind an accordion — clean progressive disclosure |

### Cons — Where It Breaks for Our Case

| Con | Detail |
|-----|--------|
| **No visual feedback for design settings** | Eventbrite has no color schemes, padding options, or layout variants. Our builder does. Toggling "LIGHT → DARK" in a form field without seeing the result is meaningless. This is the fundamental mismatch. |
| **Text-to-layout relationship is invisible** | Eventbrite's layout is fixed — text length doesn't matter. Our sections have variable layouts (PILLARS alternates left/right, STATEMENT switches between centered and scroll-tracked based on paragraph count). The user can't predict the visual outcome from a form. |
| **Image composition is blind** | MEDIA_TEXT has a 14-image rotating wheel. PAGE_HERO has floating orbital images. Picking images in a form without seeing the composition is guesswork. |
| **Section ordering loses context** | In Eventbrite, sections have a fixed order. In our builder, the user reorders sections — but in a pure form view, they can't see how sections flow together visually (does this dark section next to that dark section look bad?). |
| **Doesn't scale to 40 section types** | Eventbrite has ~8 fixed sections. We have 40 types with wildly different content schemas. A pure form approach means 40 different form layouts the user has to learn. Eventbrite's advantage is that users only learn one form. |

### Verdict

We already have *both*. The current builder is a canvas with a drawer — which is essentially "Eventbrite form on the right, visual preview on the left." The Eventbrite model isn't an alternative to what we have; it's a subset of it.

The original concern — "you can't see the section while editing" — is a valid critique, but it matters **less than initially thought** because:
- The builder is used infrequently (design mode, not content mode)
- Most edits are settings toggles that update the canvas live
- Text content is written once during setup

**Where the form-only approach genuinely hurts:** The one scenario is **initial onboarding setup** — when someone is configuring 10 sections on the homepage for the first time and writing all the text. In that context, they need to see what they're building. A pure form without preview would make that experience feel like filling out a government form.

**Bottom line:** The instinct that Eventbrite feels easy is correct — but the ease comes from Eventbrite having zero design variability, not from the form-based UI itself. The form pattern is the right *input mechanism* (and we already have it in the drawer), but pairing it with the live canvas preview is what makes our builder work for the cases Eventbrite doesn't have to handle.
