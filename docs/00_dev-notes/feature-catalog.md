# Feature Catalog & Testing Guide

> Generated 2026-03-11 — Comprehensive catalog of all user flows, features, and affordances across the CMS and public website. Use as a testing checklist and feature reference.

---

## Table of Contents

1. [Dashboard](#1-dashboard)
2. [Messages](#2-messages)
3. [Events](#3-events)
4. [Bible Studies](#4-bible-studies)
5. [Media Library](#5-media-library)
6. [People & Members](#6-people--members)
7. [Website Builder](#7-website-builder)
8. [Admin & Auth](#8-admin--auth)
9. [Public Website](#9-public-website)

---

## 1. Dashboard

### Authentication & Access
- Session check redirects unauthenticated users to `/cms/login`
- PENDING members redirected to `/cms/onboarding`
- INACTIVE members redirected to `/cms/no-access`
- Permission-based sidebar visibility (nav items hidden if user lacks required permission)

### Welcome Banner
- Personalized greeting with first name and church name
- Role-based description (admin=full access, editor=create/manage, etc.)
- 4 quick-link cards: New Message, New Event, Manage Pages, Manage People
- Dismissible via X button; persisted in localStorage per userId
- Dev override: `?dev-welcome=true` forces banner to show

### Quick Actions Bar
- 4 cards: New Message (blue), New Event (emerald), Upload Media (purple), Edit Pages (amber)
- Gradient backgrounds, hover scale/shadow effects
- Responsive: 2 cols mobile, 4 cols desktop

### Content Health Stats (3 cards)
- **Videos**: published count, health badge (green/yellow/red by freshness), draft count
- **Studies**: published count, health badge, draft count
- **Events**: upcoming count, health badge (green ≥3, yellow 1-2, red 0), past count
- Each card links to its respective CMS section

### Upcoming Events Widget
- Shows next 5 events sorted by dateStart
- Each row: date badge (month + day), title, time range, location (MapPin/Globe icon), type badge
- Warning icon if event missing location or shortDescription
- Empty state with "Create Event" CTA
- "View all" link to `/cms/events`

### Recent Activity Widget
- Last 10 items merged across messages, events, pages (sorted by updatedAt)
- Each row: type icon (BookOpen/Calendar/FileText), title, "Type · time ago", status badge
- Links to respective editor pages
- Empty state: "No recent activity"

### Tutorial/Spotlight Tour
- Auto-triggers on first dashboard visit; replayable via ? button in header
- Tour sections: quick actions, health stats, upcoming events, recent activity
- Per-user localStorage tracking; dev override: `?dev-tutorial=true`

### Sidebar Navigation
- Church header links to dashboard
- Content group: Church Profile, Bible Studies, Events, Media, Storage, Submissions (unread badge)
- People group: Members, Groups, Ministries, Campuses
- Website group: Builder, Pages (dev-only), Navigation (dev-only), Theme (dev-only), Domains, Settings
- Admin group: Users, Roles (requires `users.view`)
- Dev-only items show eye-off icon with tooltip
- Collapsible groups auto-expand based on active path
- User menu footer: initials, name, email, Account Settings link, Log Out

---

## 2. Messages

### Table View
- Columns: Checkbox, Title (with passage), Speaker, Series (badge), Message Date, Study status, Video status, Actions
- All columns toggleable via "Columns" dropdown; Speaker/publishedAt/status hidden by default
- Sort by: Message Date (default desc), Title, Speaker — clickable column headers
- Global search across title, passage, speaker name, video description (300ms debounce)
- Date range filter (from/to date pickers)
- Series filter (single selection)
- Pagination: configurable page size (10-50), First/Prev/Next/Last buttons, total count
- Row click navigates to editor
- Filter state persisted to sessionStorage

### Bulk Actions (when rows selected)
- Publish, Draft, Archive, Delete buttons (UI rendered, handlers not yet wired)
- Clear selection button
- Selection counter badge

### Per-Row Actions
- Edit (navigate to editor)
- Delete with confirmation dialog (shows title, warns permanent)

### Series Tab
- Card grid (1-4 cols responsive) and list view toggle
- Sort: most-recent, name A-Z/Z-A, most/fewest messages
- Search by series name
- Create Series dialog (name + image upload)
- Series detail page: drag-to-reorder messages, add/remove, card/list view

### Message Creation (`/cms/messages/new`)
- Creates blank form with today's date, ESV default
- Auto-focus on title field

### Message Editor — Details Tab
- Title (required, max 100 chars)
- Message Date (required, DatePicker)
- Speaker (required for publish, PeopleSelect filtered to "speaker" role)
- Series (optional, searchable combobox with inline create)
- Passage (Bible reference autocomplete with validation)
- Bible Version select
- Status dropdown: draft, published, archived
- Published At timestamp (auto-set on publish, editable for backdating)
- Attachments: upload (max 50 MB), list with preview, delete with confirmation, duplicate detection

### Message Editor — Video Tab
- Video URL input with Check URL validation (YouTube/Vimeo only)
- Platform detection badge (YouTube/Vimeo)
- Video preview thumbnail (YouTube hqdefault)
- Video Title (optional, max 100 chars, defaults to message title)
- Speaker selector
- Video Description textarea
- Duration (optional time format)
- Audio URL (optional)
- Raw Transcript textarea
- Transcript Segments (timed JSON array)
- Transcript import: upload .doc/.docx/.txt, or re-import from existing attachment

### Message Editor — Study Tab
- Tabbed sections: Questions, Answers, Transcript (sliding tab indicator)
- TipTap rich text editor per section (bold, italic, underline, strikethrough, lists, links, alignment, tables, images)
- Import: .doc (textutil), .docx (mammoth.js), .txt — with font preservation
- Overwrite confirmation if section has content
- Bible Version selector
- Attachments display with preview

### Publishing Workflow
- Publish Dialog: toggles for Video and Study independently (disabled if no content)
- Unpublish Dialog: "Keep Live" toggles (inverted)
- Validation before publish: requires title, speaker, date; video requires URL; study requires non-empty sections
- Auto-correct: if hasVideo=true but no URL, auto-sets false on save
- Save Confirmation shows what will be published/drafted

### Delete Flow
- Confirmation dialog with title and permanent deletion warning
- Soft delete (sets deletedAt)
- Unlinks associated BibleStudy
- Toast notification

---

## 3. Events

### List View
- Two tabs: List View (default) and Calendar View
- Columns: Checkbox, Title (past indicator), Type badge, Date & Time, Recurrence, Location, Ministry, Status, Actions
- Sort by date desc (featured events pinned to top)
- Search across title, location, ministry
- Filters popover: Status, Type, Recurrence, Ministry, Date range — with filter count badge
- Pagination: 10 rows/page, auto-reset on filter change
- Column visibility toggle
- Card Grid View: 3-col desktop, cover image, status/featured badges, title, date, type, ministry

### Calendar View
- Month picker with date selection
- Solid dots for one-off events, faded dots for recurring-only
- Selected date sidebar lists all events for that day
- Click event to navigate to detail

### Event Creation (`/cms/events/new`)
- Fresh form with today's date, draft status
- Auto-focus on title

### Event Form — All Sections

**Title**: max 100 chars, min 2 required

**Schedule**: Start/End Date+Time, Recurrence (None, Daily, Weekly with day picker, Monthly with day-of-month vs nth-weekday, Yearly, Weekday, Custom with interval/days/end condition)

**Location**: Type radio (In-Person/Online/Hybrid), Location Name, Address autocomplete (Nominatim API), Meeting Link (URL validation), Additional Instructions (1000 char max)

**Details**: Short Summary (100 char max), Description (TipTap rich text), Welcome Message

**Cost & Registration**: Cost Type (Free/Paid/Donation), Amount, Registration Required toggle, Registration URL, Max Participants, Registration Deadline

**Settings**: Status, Event Type, Ministry dropdown, Campus dropdown, Links (up to 3 label+URL pairs), Points of Contact (drag-and-drop reordering, search, contact frequency)

**Media**: Cover Image (2:1 ratio, upload/drag-drop/media library, max 10 MB, auto-creates Events folder), Alt Text

### Delete Flow
- Confirmation dialog with title and warning
- Optimistic removal from list, rollback on failure
- Toast with event title

### Bulk Actions
- Select counter, Publish/Draft/Archive/Delete buttons (UI present, not yet wired)

---

## 4. Bible Studies

### Overview
- Bible Studies are managed as part of the Messages editor (Study tab)
- BibleStudy records auto-synced from Message via `syncMessageStudy()`
- Separate public pages at `/bible-study` and `/bible-study/[slug]`

### Study Content Editor
- Tabbed sections: Questions, Answers, Transcript
- TipTap rich text editor per section
- Import from .doc/.docx/.txt files (with font preservation)
- Overwrite confirmation dialog
- Bible Version selector
- Content stored as TipTap JSON
- Empty section detection (paragraphs with no content = empty)

### Sync Behavior
- On save: if hasStudy=true and sections exist, creates/updates linked BibleStudy
- BibleStudy inherits: title, slug, passage, speaker, series, dateFor, bibleVersion, attachments, status
- If hasStudy=false, unlinks BibleStudy (soft-delete)
- Cache invalidation: `/website` and `/website/bible-study`

### Public Bible Study Page
- Tabbed interface: Scripture, Questions, Answers, Message
- Bible version selector dropdown
- Font size controls (shrink/enlarge with localStorage persistence)
- Copy button for scripture text
- Column layout toggle (1-col / 2-col)
- Related message video embed
- Attachments download section

---

## 5. Media Library

### Grid & List Views
- Grid view (default): 3-6 columns responsive, thumbnails, video play overlay
- List view: sortable table (Name, Format, Size, Date Added)
- View mode toggle (hidden when viewing Google Albums)
- Click item to open full-screen preview dialog

### Folder Management
- Folder tree in sidebar with drag-drop support
- Create, rename, delete folders via dialogs
- System folders (Events, Website) marked "auto" — cannot rename/delete
- Folder item counts; alphabetical ordering
- Drag items onto folders to move
- Double-click folder in grid to navigate

### Sidebar
- Smart filters: All Media, Photos, Videos, Google Albums
- Item counts per filter
- Active folder highlighted
- Drag-over highlight with primary color

### Storage Display
- "X.X GB of Y.0 GB used" with progress bar
- Bar color: green (0-75%), orange (75-90%), red (90%+)
- Warning text at ≥90%
- Link to `/cms/storage`

### File Upload
- Drag & drop or click to select
- Accepts: images (jpeg, png, webp, gif), audio (mp3), video (mp4), PDF
- Max 10 MB per file
- Upload via presigned R2 URLs
- Auto-detect image dimensions
- Multi-file upload with per-file status indicators
- Uploads to current folder context

### Video Handling
- Add Video Link dialog (YouTube/Vimeo URL, auto-detect platform)
- Auto-fetch video title from oEmbed API
- Video preview: embedded iframe player
- Direct MP4 uploads with HTML5 player
- Connect Google Album dialog (stores URL, shows in separate tab)

### Preview Dialog
- Two-column layout (55% preview, 45% metadata)
- Editable: Name, Alt Text (images), Folder (searchable combobox)
- Read-only: Type, Format, Extension, Size, Date Added, Source URL
- Download button for images
- Visit Original for videos
- Delete button
- Unsaved changes confirmation
- Usage tracking section (events and page sections referencing this media)

### Bulk Operations
- Multi-select with checkboxes (grid and list)
- Select All in list view
- Bulk actions: Move to..., Delete (with usage warning), Clear selection
- Max 100 items per bulk-delete

### Search, Sort, Filter
- Text search by filename (live, debounced)
- Type filters via sidebar (Photos, Videos)
- Folder filter via sidebar navigation
- Sort: Newest first, Oldest first, Name A-Z, Name Z-A

### Deep Linking
- `?assetId=<id>` opens specific asset preview directly

---

## 6. People & Members

### Members Table
- Search across firstName, lastName, preferredName, email, phone
- Sortable columns: name, email, membershipStatus, createdAt
- Column visibility: Name, Email, Phone, Status, Household, Groups, Roles, Date Added
- Row selection with select-all checkbox
- Click row: wide screen (1280px+) opens split-panel preview; narrow navigates to full profile
- Status filter: Visitor, Regular, Member, Inactive, Archived (multi-select badges)
- Pagination: 25 rows/page configurable
- Member count badge in header

### Bulk Operations
- Set to Member, Set to Inactive, Archive, Clear selection

### Row Actions
- View Profile, Add to Group (stub), Archive (with confirmation)

### Add Member Dialog
- 2-step wizard: Step 1 (required: firstName, lastName; optional: preferredName, email, phone, gender, DOB), Step 2 (membershipStatus, maritalStatus, city, state, zip)

### CSV Import
- 4-step: upload → preview (first 5 rows) → importing → complete
- Drag-drop or click-to-browse
- Template download with sample data
- Required columns: firstName, lastName
- Result: imported count + error list with row numbers

### Member Detail Page
- Profile header: avatar, name, status badge, email button, actions (Archive, Delete Permanently)
- Personal Info card: names, gender, DOB (with age), marital status — Edit/Save/Cancel
- Contact & Address card: email, phone, mobilePhone, city, state, zip — Edit/Save/Cancel
- Church Info card: membershipStatus, membershipDate, baptismDate, salvationDate, source — Edit/Save/Cancel
- Custom Fields card: all customFieldValues with definitions
- Communication Preferences card: by channel/category
- Tags card: all personTags
- Household card: create/join household, member list with roles (Head, Spouse, Child, Other Adult, Dependent), remove
- Groups card: add to group (search by name/type, assign role: Leader/Co-Leader/Member), remove
- Notes card: pinned first, last 20 notes

### Archive & Delete
- Archive: optional reason (appended to notes), sets ARCHIVED status, toast with undo
- Delete: hard delete with permanent confirmation

### Groups View
- Grid (3-col responsive cards) and list view toggle
- Search by name/description
- Filters: Type (Small Group, Serving Team, Ministry, Class, Administrative, Custom), Status
- Sort: Name A-Z, Newest, Most Members
- Group cards: name, type badge, status dot, description, member avatars, leaders, schedule
- Group detail page: members list, settings dialog, delete/archive

### Users/CMS Access
- Columns: Name, Email, Role, Status, Linked Member, Joined Date, Actions
- Filters: Role dropdown, Status (Active/Inactive/Pending)
- Role column: inline dropdown (permission-gated)
- Actions: Link/Unlink Member (Admin+), Deactivate/Reactivate, Remove from church (Owner only)

### Invite User Dialog
- Two tabs: Existing Member (searchable dropdown) and New Person (firstName, lastName, email)
- Role selector (excludes Owner, shows descriptions)

---

## 7. Website Builder

### Pages Manager
- Search by title and slug
- Table: title, slug, status badge, homepage star, last modified, sort order
- Create page: title, slug, type (Standard/Landing/Ministry/Campus/System), layout (Default/Full Width/Narrow)
- Edit, delete (confirmation), publish/unpublish, reorder

### Page Builder (`/cms/website/builder/[pageId]`)
- Full-screen canvas with split layout
- Left sidebar: page tree
- Right sidebar: theme injection
- Navbar preview with real data
- Section canvas with live preview
- Auto-save every 30 seconds
- Dirty state tracking, unsaved changes warning

### Page Settings
- Title, slug, page type badge, layout dropdown, homepage toggle
- SEO: meta title, meta description (160 char counter), OG image URL, canonical URL, no-index
- Publishing: published toggle, last published timestamp

### Section Management
- 42 section types across 7 categories
- Add via picker dialog, edit via modal, delete with confirmation
- Reorder via drag or up/down arrows
- Hide/show toggle (visibility)
- Display settings: Color Scheme (Light/Dark), Padding (None/Compact/Default/Spacious), Container Width (Narrow/Standard/Full), Animations toggle, Label

### Navigation Editor
- Tabbed: Header, Footer, Mobile, Sidebar
- Menu item CRUD: Label, URL, Description, Icon Name, Group Label, Open in New Tab, External Link, Parent Item, Visible
- Reorder with up/down buttons
- Nested items (one level deep in v1)
- Delete parent cascades children

### Theme Manager
- 5 color fields with picker + hex input: Primary, Secondary, Background, Text, Heading
- Typography: Heading Font (10 options), Body Font (10 options), Base Font Size (14-18px)
- 6 curated font pairings (click to apply)
- Custom CSS textarea (advanced, with risk warning)

### Site Settings
- General: Site Name, Tagline, Description
- Branding: Logo URL (with preview), Logo Alt Text, Favicon URL, OG Image URL
- Contact: Email, Phone, Address
- Form Notification Recipients: dynamic email list
- Social Media: Facebook, Instagram, YouTube, Twitter/X, TikTok, Spotify, Podcast
- Service Times: dynamic list (Day, Time, Label)
- Features: 6 toggles (Blog, Online Giving, Member Login, Prayer Requests, Announcements, Search)
- Navbar CTA: show toggle, label, link
- SEO & Analytics: Google Analytics ID, Meta Pixel ID
- Maintenance Mode: toggle, message, warning banner
- Advanced: Custom Head HTML, Custom Body HTML

### Domains
- Default subdomain display with copy button and open website link
- Custom domains: "Coming Soon" placeholder

---

## 8. Admin & Auth

### Login
- Email/Password: rate-limited (5 per 15 min per email), validates email verified
- Google OAuth: auto-creates/links User + Account, auto-verifies email
- Error messages: invalid credentials, rate limit, generic
- Forgot password link

### Signup
- First name, last name, email, password (min 8, upper+lower+number)
- Honeypot field for bots
- Email verification flow: sends link → click → auto-verify → success card
- Duplicate email: resends verification (timing-normalized)

### Password Reset
- Forgot password: enter email, rate-limited (5 per IP per hour)
- Reset: new password + confirm, token validation, strength check

### Invite Acceptance
- `/cms/accept-invite?token=...` → set name + password
- Token verification, prevents double-acceptance
- Marks ChurchMember as ACTIVE, verifies email

### Onboarding
- For PENDING members: first name, last name, phone (optional), email (read-only), church + role display
- Atomic activation: PENDING → ACTIVE
- Person record sync if linked
- Success state → redirect to dashboard

### Account Settings (`/cms/settings`)
- Edit first name, last name (syncs to linked Person)
- Avatar + role badge + email (read-only)
- Theme: Light/Dark/System
- Accent color: neutral, blue, green, violet, orange (live swatch preview)

### Roles & Permissions
- 49 permissions in 6 groups: Content, Media, People, Website, Submissions, Admin
- 4 default roles: Owner (1000), Admin (500), Editor (200), Viewer (0)
- Role list: color dot, name, system badge, member count, permission count, actions dropdown
- Row click to edit (if permitted)
- Create role: name, auto-slug, description, color (8 options), permission checkboxes by group
- Edit role: cannot change system role permissions; cannot edit roles ≥ your priority
- Duplicate role: pre-fills with "Copy of [name]", same permissions, priority reset to 100
- Delete role: reassign members dialog, cannot delete system/last non-system role
- Permission-based: `roles.view` to list, `roles.manage` to create/edit/delete

### Church Profile (`/cms/church-profile`)
- 5 collapsible sections with Edit/Save/Cancel:
  - Identity: name, description
  - Location: street, city, state, ZIP, notes
  - Contact: dynamic email/phone lists with labels
  - Worship Services: day, time, label (dynamic list)
  - Social Links: platform select + URL (known platforms sync to dedicated columns)

### Form Submissions
- Table: unread icon, name, form type, message preview, timestamp, status badge
- Row click opens Dialog modal (sm:max-w-2xl, 80vh)
- Mark read/unread toggle
- Humanized slug values (sunday-service → Sunday Service)
- Status workflow: new → reviewed → contacted → archived

### Session Management
- JWT with permissions[], rolePriority, roleName, roleId, memberStatus
- Permissions refreshed every 5 min or on sessionVersion bump
- Rate limiting on all auth endpoints
- `requireApiAuth('permission')` middleware on all protected routes
- RoleGuard component wraps permission-gated pages

---

## 9. Public Website

### Navigation
- Sticky navbar: transparent over hero, white when scrolled (300ms transition)
- Gradient overlay for text contrast over hero images
- Desktop: dropdown menus on hover with 150ms close delay, grouped by groupLabel
- Mobile: right-side drawer (full height), accordion sections, body scroll locked
- Logo: light version over hero (brightness-0 invert), dark version when scrolled
- Quick Links FAB: bottom-right, expands on hover (desktop) / click (mobile), scroll-to-top after 300px on mobile

### Page Rendering
- Catch-all route resolves homepage or slug-based pages
- Filters visible sections only
- Resolves dataSource references in parallel
- Passes colorScheme, paddingY, containerWidth, enableAnimations per section
- 404 if page not found

### Section Types (40 real + 2 placeholders)
- **Heroes** (4): HERO_BANNER, PAGE_HERO, TEXT_IMAGE_HERO, EVENTS_HERO
- **Content** (5): MEDIA_GRID, PHOTO_GALLERY, QUOTE_BANNER, ABOUT_DESCRIPTION, STATEMENT
- **Cards** (6): ACTION_CARD_GRID, HIGHLIGHT_CARDS, FEATURE_BREAKDOWN, PATHWAY_CARD, PILLARS, NEWCOMER
- **Data-Driven** (6): ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES, ALL_VIDEOS, UPCOMING_EVENTS, EVENT_CALENDAR
- **Ministry** (6): MINISTRY_INTRO, MINISTRY_SCHEDULE, MINISTRY_HERO, CAMPUS_CARD_GRID, DIRECTORY_LIST, LOCATION_DETAIL
- **Interactive** (3): FORM_SECTION, FAQ_SECTION, TIMELINE_SECTION
- **List/Spotlight** (6): SPOTLIGHT_MEDIA, CTA_BANNER, MEDIA_TEXT, QUICK_LINKS, RECURRING_MEETINGS, RECURRING_SCHEDULE
- **Layout** (2): FOOTER, CUSTOM_HTML
- **Placeholders** (2): NAVBAR (layout-managed), DAILY_BREAD_FEATURE (no source)

### Detail Pages

**Message Detail** (`/messages/[slug]`):
- Video embed (YouTube/Vimeo), no-video fallback
- Series badge, date, title, passage, speaker, duration
- Video description, attachments from BibleStudy
- Sticky sidebar: Transcript Panel (Live Caption / Message Text tabs), Study Guide Card

**Event Detail** (`/events/[slug]`):
- Cover image with featured/type/all-day badges
- Heading, short description blockquote, full description (HTML prose)
- Welcome message box, contacts section
- Sticky sidebar: date/time, location with icons, recurrence, ministry/campus tags, cost, registration, meeting URL, important links
- Breadcrumb navigation

**Bible Study Detail** (`/bible-study/[slug]`):
- Tabbed: Scripture, Questions, Answers, Message
- Version selector, font size controls, copy button, column layout toggle
- Attachments download, bible version copyright footer

### Form Submission Flow
- Interest checkboxes (with "other" text field), campus dropdown, bible teacher checkbox
- Turnstile CAPTCHA (Cloudflare), submit button (disabled until valid)
- Success state with "submit again" option

### Footer
- Brand column: logo, tagline, social links
- Nav columns: grouped by groupLabel/parent hierarchy
- Contact column: address, phone (tel:), email (mailto:)

### Theme System
- CSS variables: `--ws-color-primary/secondary/background/text/heading`
- Custom fonts: `--ws-font-body/heading`
- XSS-sanitized custom CSS injection
- FontLoader handles Google Fonts + custom fonts per tenant

### Animation System
- AnimateOnScroll wrapper (Intersection Observer, 15% threshold)
- Variants: fade-up, fade-in, fade-left, fade-right, scale-up, none
- Stagger support (80ms default delay between items)
- 700ms ease-out transition

### Responsive Behavior
- Grid layouts: 3-4 cols desktop → 1-2 tablet → 1 mobile
- Navbar: hamburger on mobile, full nav on lg+
- Event/message detail: stacked on mobile, 2-column on lg+

### SEO & Accessibility
- Dynamic metadata with OG support per page
- robots.noIndex per page
- aria-label on interactive elements, semantic HTML
- Keyboard navigation (Escape closes modals/menus)
- Focus visible on interactive elements
