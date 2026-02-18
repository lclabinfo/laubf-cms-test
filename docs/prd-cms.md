# PRD: CMS — Core Content Workflows

> Living document. Update as features are implemented or requirements evolve.
> See also: [Primary User Profile](./primary-user-profile.md)
> Figma prototype reference: `figma-cms-2:11:26/` (UX/flow benchmark)

---

## Overview

The CMS manages **ministry artifacts** — sermons, Bible studies, events, announcements, media, prayer topics, and ministry pages. These are church-specific content types with structured workflows. They are the highest-frequency admin tasks and the primary reason the website stays current.

The CMS is **not** a general-purpose page editor. Content types here are template-governed and workflow-driven, prioritizing speed and safety over design flexibility.

### Priority Legend

- **[P0]** — MVP. Critical for launch.
- **[P1]** — Important for a delightful experience.
- **[P2]** — Nice-to-have / future enhancement.

### Content Status Model

All publishable content types share a unified status model:

| Status | Description |
|---|---|
| **Draft** (Private) | Only admins can see. Default state for new entries. |
| **Published** (Public) | Visible to everyone on the public site. |
| **Scheduled** | Becomes public on a specific date/time. |
| **Hidden** (Archived) | Unlisted from public views but not deleted. Data preserved. |

---

## 1. Messages (Sermons & Bible Studies)

> Messages are the unified entry point for sermon videos and linked Bible study materials. In the prototype, sermons and Bible studies are managed together as a single content type ("Message") with two facets — video and study — rather than as separate modules. This reduces duplication and ensures the sermon-to-study link is a first-class relationship.

### 1.1 Message List View

#### Data Table Columns

- [P0] Messages display in a sortable data table with columns:
  - **Title** — message title + scripture passage (secondary text).
  - **Speaker** — speaker name.
  - **Series** — badge tags showing series membership (supports many-to-many).
  - **Date** — formatted as "MMM d, yyyy".
  - **Status** — color-coded badge (Published: default, Draft: secondary/gray, Scheduled: orange, Archived: muted).
  - **Resources** — dual icon indicators: blue circle if video attached, purple circle if Bible study attached, gray if absent.
  - **Actions** — three-dot dropdown menu (Edit, Delete). Visible on hover.

#### Search & Filtering

- [P0] Search bar with multi-field search across title, speaker, series names, and scripture passage. Real-time filtering.
- [P0] Filter panel (popover-based) with:
  - **Status filter** — multi-select badges (published, draft, scheduled, archived).
  - **Speaker filter** — searchable dropdown/combobox, single selection.
  - **Series filter** — searchable dropdown/combobox, single selection.
  - **Book of the Bible filter** — searchable dropdown with all 66 books, extracted from the passage field.
- [P0] Active filter count indicator.
- [P0] Reset button to clear all filters and search.

#### Sorting

- [P0] Default sort by date (newest first).
- [P0] Sortable columns: title, speaker, series, date. Click column header to toggle asc/desc.
- [P0] Visual indicator on the active sort column.

#### Selection & Bulk Actions

- [P0] Checkbox selection per row with multi-select.
- [P0] Bulk action bar appears when items are selected:
  - Set as Published
  - Set as Draft
  - Archive
  - Delete

#### List Actions

- [P0] "New Message" button (top right) to enter the creation flow.
- [P1] "Livestream Link" button that opens a dialog to input a livestream URL (e.g., YouTube Live).

#### Mobile View

- [P1] Responsive card-based grid layout instead of table on narrow viewports. Cards show: status badge, date, title (truncated), speaker, passage, and dropdown menu.

#### Empty State

- [P0] When no messages match filters: centered message "No messages found matching your filters."

### 1.2 Series Management

#### Series Tab

- [P0] "All Messages" and "Series" as two primary tabs on the Messages page.
- [P0] Series view displays a responsive card grid (1→2→3→4 columns across breakpoints).

#### Series Card

- [P0] Each series card shows:
  - Cover image (aspect-video) with fallback placeholder icon.
  - Series name.
  - Message count (e.g., "5 messages").
- [P1] Hover overlay with three-dot menu (Edit Series, Delete).
- [P1] Subtle scale animation on card hover.

#### Series CRUD

- [P0] Create series via dialog modal: series name (required) + cover image URL (optional with fallback).
- [P0] Edit series via same dialog, pre-populated.
- [P0] Delete series with confirmation dialog. Deleting a series does **not** delete its messages — they are disassociated only.

#### Series ↔ Messages Interaction

- [P0] Clicking a series card filters the message list to that series (switches to "All Messages" tab with series filter pre-applied).
- [P0] Messages support many-to-many series relationships (a message can belong to multiple series).

### 1.3 Message Create / Edit Form

#### Form Header

- [P0] Back button to return to list.
- [P0] Title display (reads from the title form field in real-time).
- [P0] Status badge (Draft, Published, etc.).
- [P1] "Unsaved changes" indicator.
- [P0] Save button.
- [P1] Undo changes button (disabled if no changes).

#### Two Main Tabs: Details | Transcript

##### Details Tab

- [P0] **Title** — text input. Placeholder: "Add a title that describes your sermon."
- [P0] **Description** — large textarea (min-height: 200px). Placeholder: "Tell viewers about your sermon."
- [P0] **Thumbnail** — three selectable options:
  1. **Upload file** — manual image upload.
  2. **YouTube auto-generated** — pulls thumbnail from the YouTube video URL.
  3. **AI auto-generated** — generates a thumbnail from sermon title and passage. Shows progress alert.
- [P0] **Metadata grid** (two columns on desktop):
  - Speaker (text input)
  - Series / Playlist (dropdown selector, supports multi-select)
  - Scripture Passage (text input, e.g., "John 3:16")
  - Tags (comma-separated text input)
- [P0] **Link Bible Study Material** — dropdown selector to attach an existing Bible study. Help text: "This will display a link to the study material on the sermon page."

##### Transcript Tab

- [P0] Rich text editor for sermon transcript.
- [P0] Manual editing and formatting.
- [P0] Import captions from YouTube button (auto-fills from linked video).
- [P1] Import from `.SRT` file.
- [P1] AI-assisted transcript generation.
- [P1] Auto-sync transcript timestamps with sermon video.

#### Right Sidebar — Video Preview & Settings

##### Video Card (sticky)

- [P0] YouTube iframe embed preview (or fallback placeholder with "Video Preview" text).
- [P0] Video link display with copy-to-clipboard button.
- [P1] Video quality badges (SD, HD).

##### Visibility Card (sticky)

- [P0] Status selector dropdown with descriptions:
  - Private (Draft) — "Only you can see this."
  - Public — "Visible to everyone."
  - Scheduled — "Public on a specific date."
  - Hidden — "Unlisted / Archive."
- [P0] Publish date picker (calendar popover).
- [P0] Feature Sermon toggle (checkbox/switch) — "Pin to top of list."

### 1.4 Message Detail View (Read-Only)

#### Header

- [P0] Back button, title (large), status badge, "Preached on [date]" subtitle.
- [P0] Edit and Delete action buttons.

#### Main Content (2-column layout, stacked on mobile)

##### Left Column (2/3)

- [P0] Video player — YouTube embed or "No video linked" fallback.
- [P0] Description section — paragraph text or "No description provided" fallback.
- [P0] Transcript preview — monospace block, max-height with scroll, or "No transcript available" fallback.

##### Right Column (1/3)

- [P0] Details metadata card: speaker, passage, series, view count.
- [P0] Linked Bible Study card — if linked: purple-tinted card with title and passage; if not: "No study linked" with "Link now" button.
- [P1] Share Sermon button (full-width, generates shareable link).

### 1.5 Bible Study Materials (Integrated with Messages)

> Bible study content is managed as part of the message entry editor, in a dedicated "Bible Study" tab alongside the "Video" tab. This keeps sermon video and study material tightly coupled.

#### Study Editor

- [P0] Two fixed sub-tabs within the study editor: **Questions** and **Answers**.
- [P0] Rich text editor per tab with formatting toolbar.
- [P0] Import buttons: Import DOCX, Google Drive.
- [P0] Admins can assign a Bible passage range — auto-rendered on the public site with a BibleGateway link.

#### Attachments

- [P0] Admins can attach downloadable files to a message (DOCX, PDF, images).
- [P0] Attachment list with per-item delete.
- [P0] Add attachment button.
- [P0] Original uploaded files are automatically downloadable on the public site.

#### Organization

- [P0] Bible studies are automatically organized by passage (book of the Bible) for filtering.
- [P1] Admins can add custom supplemental material sections beyond the default tabs.
- [P1] Imported documents support formatting: headings, lists, spacing, images, embedded YouTube.
- [P2] The CMS suggests study groupings based on scripture or series patterns.

### 1.6 Relationships & Linking

- [P0] Sermons and Bible study materials are linked within the same message entry (unified content type).
- [P0] The linked study surfaces automatically on the sermon's public page and vice versa.
- [P1] Linking is bi-directional: sermon detail page shows linked study, study page shows linked sermon.
- [P2] The CMS suggests related studies or sermons based on scripture or series.

### 1.7 Admin Experience & Efficiency

- [P0] All messages viewable in a sortable, filterable data table.
- [P0] Bulk operations: publish, draft, archive, delete.
- [P0] Multi-field search (title, speaker, series, passage).
- [P0] Advanced filtering by status, speaker, series, and Bible book.
- [P1] Mobile-responsive card layout as table fallback.
- [P2] Per-message analytics (views, clicks).

---

## 2. Events & Calendar

### 2.1 Event Creation & Details

- [P0] Admins can create events with:
  - Title
  - Date and time
  - Location / online meeting link
  - Description
  - Cover picture
  - Ministry / categories
  - Point of contact
  - Type (Event, Meeting, Program)
- [P0] Events use system-defined, template-governed pages.
- [P0] Admins can create and manage event categories.
- [P0] Admins can set recurrence rules: daily, weekly, monthly, yearly, or custom.
- [P1] Admins can set a customized welcome message (e.g., "First Time? We'd love to meet you!").
- [P1] Registration tracking for events that require sign-up.

### 2.2 Calendar & Scheduling

- [P0] Events automatically populate a centralized church calendar (admin and public).
- [P0] Events appear in "upcoming" and "past" views based on date.
- [P0] Time-sensitive events automatically transition out of prominent views after completion.
- [P1] Admins can schedule when events become visible on the site.
- [P2] Admins can create custom shareable calendars (as Google Calendar links).

### 2.3 Media & Presentation

- [P0] Events display a default cover image if none is provided (or no banner at all).
- [P1] Admins can designate recurring/ongoing events as shortcut links on the events page.
- [P1] Event images can be reused from the media library.
- [P1] AI-assisted event cover image generation.
- [P2] Admins can attach photo albums to events.
- [P2] External photo service integrations (e.g., Google Photos).

### 2.4 Sharing & Distribution

- [P0] Events generate clean, shareable links.
- [P0] Events can be added to personal calendars (Google, Apple).
- [P0] Events can be filtered/searched by type, date range, ministry/campus, and location.
- [P2] Public-facing event collections (e.g., "This Week").

### 2.5 Publishing, Updates & Lifecycle

- [P0] Events support draft and published states.
- [P0] Admins can preview events before publishing.
- [P1] Admins can update event details after publishing without breaking links.
- [P1] Past events remain accessible but are visually de-emphasized.
- [P2] Events can be archived or hidden without deletion.

### 2.6 Admin Efficiency & Reliability

- [P0] Admins can view all events in a sortable, searchable list.
- [P0] Admins can quickly identify upcoming or missing events.
- [P1] Admins can duplicate events to speed up creation.
- [P2] Admins can view basic engagement signals (clicks, calendar adds).

---

## 3. Announcements

### 3.1 Views & Navigation

- [P0] Three-view flow: **List** → **Detail** → **Edit**. Each view is a distinct screen with clear navigation between them.

### 3.2 Creation & Editing

- [P0] Admins can create, edit, and delete announcements.
- [P0] Admins can manage announcement content using a rich text editor.
- [P0] Admins can import content from DOCX or Google Docs.
- [P0] Admins can attach files, links, images, and video links.
- [P0] Admins can upload a featured/cover image per announcement.
- [P0] Admins can save announcements as drafts.

### 3.3 Metadata & Organization

- [P0] Admins can manage announcement metadata: title, category/type, target audience, publish status, author (optionally displayed).
- [P0] Admins can search, filter, and sort announcements.
- [P1] Admins can pin or prioritize announcements (pinning capability).
- [P2] Bulk-edit announcement metadata.

### 3.4 Scheduling & Publishing

- [P0] Announcements follow the unified status model: draft → scheduled → published → archived.
- [P0] Admins can schedule announcements for future publication.
- [P0] Admins can unpublish or archive announcements without deletion.
- [P0] Admins can preview announcements before publishing.
- [P2] Admins can duplicate announcements.

### 3.5 Email Notifications

- [P1] Admins can send announcement content via email.
- [P1] Admins can choose email timing: immediately or scheduled.
- [P1] Admins can select recipients: all members, specific groups or ministries.
- [P1] Admins can customize email subject lines and preview email content.
- [P2] Resend announcements or send reminders.
- [P2] Basic email delivery status tracking (sent, failed).

---

## 4. Ministry / Campus Pages

> Churches can create custom pages for ministries, but we also offer: (1) a single source of truth for ministry registration in the ChMS, and (2) a template-driven ministry page that requires zero design effort.

### 4.1 Ministry Editor — Tab Structure

- [P0] Each ministry has a multi-tab editor:
  - **Details** — name, URL slug, description, hero section configuration.
  - **Content** — meetings, leaders, testimonials, FAQs.
  - **People** — ministry leaders and members (linked to people directory).

### 4.2 Ministry Page Setup

- [P0] Admins can create, edit, and delete ministry pages.
- [P0] Admins can manage core ministry metadata:
  - Ministry name
  - URL slug
  - Description / About us
  - Hero section (image, layout)
  - Status (draft / published / archived)
- [P0] Admins can manage ministry meeting information:
  - Location
  - Schedule (days, times)
  - Meeting type
  - Links (map, Zoom, etc.)
- [P1] Admins can manage multiple meeting entries per ministry.

### 4.3 Leadership & Contact Management

- [P0] Admins can manage ministry leaders with: name, role/title, profile image, short bio, and contact/social links.
- [P0] Admins can assign leaders or roles with edit access to the ministry page.
- [P1] Leader profiles can be connected bidirectionally with the member database (People module).
- [P1] Admins can designate a main point of contact per ministry.
- [P0] Member count tracking per ministry.

### 4.4 Testimonials & Media

- [P0] Admins can manage ministry-specific testimonials.
- [P0] Admins can manage photo albums for a ministry.
- [P1] Testimonials and albums can be reused across ministries.
- [P1] Admins can attach a portrait picture per testimonial.
- [P2] Video testimonials.

### 4.5 FAQ & Supporting Information

- [P0] Admins can manage FAQs for a ministry.
- [P1] FAQ entries can be reused across multiple ministries.

### 4.6 Admin Efficiency & Scale

- [P0] Admins can view and manage all ministry pages from a centralized list.
- [P1] Admins can duplicate an existing ministry's info.
- [P2] Bulk updates across multiple ministries.
- [P2] Version history for ministry page changes (who edited what, when).

### 4.7 Template Controls

- [P0] Admins can manage template-specific fields: banner image, layout variant, color themes, fonts.
- [P0] Admins can selectively show/hide information sections on the public page.
- [P1] Ministry pages can be created directly in the website builder for churches that want more control.

---

## 5. Media Library

### 5.1 Upload, Organization & Metadata

- [P0] Admins can upload multiple image and video files to a centralized media library.
- [P0] Admins can manage media metadata: title, description, tags/categories (including ministry association).
- [P0] Admins can organize media using tags (multiple per item).
- [P0] Admins can search, filter, and sort media by metadata.
- [P1] Google Photos integration for importing from external photo libraries.
- [P1] Admins can view where a media item is used across the website/app.
- [P1] Bulk-edit media metadata.

### 5.2 Lifecycle, Safety & Governance

- [P0] Admins can delete media with confirmation when the item has active associations.
- [P0] Admins can archive media without deleting files.
- [P0] Admins can identify unused media.
- [P1] Usage information is visible per media item.
- [P1] Media actions respect role-based permissions.
- [P2] Folder/collection-level access restrictions.
- [P2] Version history for media updates.

---

## 6. Prayer Topics

> Enable admins to manage church-wide prayer resources and oversee a member-contributed prayer wall — safely, scalably, and with minimal ongoing maintenance.

### 6.1 Prayer Content & Resources (Church-Led)

- [P0] Admins can create, edit, and manage church-wide prayer topics.
- [P0] Admins can manage centralized prayer resources: topics, key verses, prayer guides/outlines.
- [P0] Admins can import prayer content from external sources (Google Sheets, documents).
- [P0] Admins can update prayer content without reposting.
- [P1] Admins can pin or highlight church-wide prayer content.
- [P2] Organize prayer content by category or theme.
- [P2] Schedule prayer content.

### 6.2 Prayer Wall Oversight (Member-Generated Content)

- [P0] Admins can view all member-posted prayer requests.
- [P0] Admins can hide, archive, edit, or delete prayer posts.
- [P0] Admins can moderate sensitive or inappropriate content.
- [P0] Admins can mark prayer posts as urgent or resolved.
- [P2] Bulk moderation actions.

### 6.3 Permissions, Privacy & Safety

- [P0] Admins can designate which roles can post church-wide prayers and moderate the prayer wall.
- [P0] Admins can override privacy settings for moderation purposes.
- [P1] Admins can assign moderation privileges to specific users.
- [P2] Audit trail for prayer activity and moderation actions.

### 6.4 Lifecycle & Engagement

- [P0] Admins can archive and reopen prayer topics.
- [P0] Admins can view engagement indicators (e.g., number of prayers).
- [P2] Historical prayer archives.

---

## 7. Church Profile (Church Settings)

> The church's core identity information. This data feeds the website header/footer, Google Business Profile, and any public-facing "about" pages. Accessed via the gear icon in the sidebar header.

### 7.1 Identity

- [P0] Admins can manage the church's name.
- [P0] Admins can write and edit an "About Us" / church description.
- [P1] Admins can upload a church logo and favicon.

### 7.2 Location

- [P0] Admins can manage the church's full address: street address, city, state, zip code, country.
- [P1] Admins can add location notes (e.g., "Enter through the side door").

### 7.3 Contact Information

- [P0] Admins can manage multiple email addresses with labels (e.g., "General", "Pastor", "Youth").
- [P0] Admins can manage multiple phone numbers with labels (e.g., "Office", "Emergency").

### 7.4 Service Schedule

- [P0] Admins can manage weekly service times with:
  - Day of week
  - Start time
  - End time
  - Description (e.g., "Sunday Worship", "Wednesday Bible Study")
- [P0] Multiple schedule entries supported.

### 7.5 Social Media

- [P0] Admins can manage standard social media links: Facebook, Instagram, YouTube, X/Twitter.
- [P1] Admins can add custom social links with custom platform name + URL pairs (e.g., "TikTok", "Podcast RSS").

### 7.6 Data Propagation

- [P1] Changes to church profile data propagate automatically to all locations on the website where they appear (header, footer, contact page, etc.).

---

## Appendix: CMS Navigation Structure

Based on the Figma prototype, the CMS sidebar groups content as follows:

| Group | Menu Items |
|---|---|
| **Contents** | Dashboard, Messages, Events, Media |
| **Website** | Pages, Navigation, Theme, Domains |
| **App** | Notifications, Announcements, Mobile App, Integrations |
| **Giving** | Donations, Payments, Reports |
| **People** | Members, Groups, Directory |

Church Profile / Church Settings is accessed via the gear icon in the sidebar header, not as a sidebar menu item.

> **Note:** The prototype's navigation includes Ministries under the Content module. In the current implementation, ministries may be surfaced under Contents or as a future addition depending on MVP scope.
