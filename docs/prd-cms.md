# PRD: CMS — Core Content Workflows

> Living document. Update as features are implemented or requirements evolve.
> See also: [Primary User Profile](./primary-user-profile.md)

---

## Overview

The CMS manages **ministry artifacts** — sermons, Bible studies, events, announcements, media, prayer topics, and ministry pages. These are church-specific content types with structured workflows. They are the highest-frequency admin tasks and the primary reason the website stays current.

The CMS is **not** a general-purpose page editor. Content types here are template-governed and workflow-driven, prioritizing speed and safety over design flexibility.

### Priority Legend

- **[P0]** — MVP. Critical for launch.
- **[P1]** — Important for a delightful experience.
- **[P2]** — Nice-to-have / future enhancement.

---

## 1. Sermons

### 1.1 Sermon Entry: Creation, Import & Metadata

- [P0] Admins can create a sermon entry with a YouTube link.
- [P0] Admins can connect to a YouTube playlist for auto-import of new sermons.
  - Import video metadata when available.
  - Import captions (with timestamps) when available.
- [P0] Admins can manually edit sermon metadata.
- [P0] Admins can add/edit metadata fields and group/filter by them:
  - Date
  - Speaker
  - Passage
  - Description
  - Tags
- [P1] Sermons support AI-generated transcripts.
- [P2] Admins can upload sermon video files directly.

### 1.2 Transcript

Supported transcript flows:
1. Import from YouTube — auto-fill both raw and synced transcript.
2. Import raw transcript — generate synced transcript from it.
3. Import `.SRT` file — automatically attach synced captions.

- [P0] Admins can upload a sermon transcript file.
- [P0] Admins can create/edit transcripts directly in the CMS.
- [P0] Admins can import transcripts from external sources (e.g., YouTube captions).
- [P0] Admins can generate an auto-transcript from the sermon video.
- [P0] Transcript changes are saved without re-uploading the video.
- [P1] Auto-sync transcript timestamps with the sermon video.
- [P1] AI-assisted transcript generation.

### 1.3 Relationships & Linking

- [P0] Sermons can be linked to a Bible study material (1:1 max). A shortcut to the linked Bible study page is displayed on the public site.
- [P1] Linking is bi-directional: sermons appear on linked Bible study pages.
- [P2] The CMS suggests related studies based on scripture or series.

### 1.4 Preview, Publishing & Access

- [P0] Sermons support draft and published states.
- [P0] Admins can preview a sermon before publishing.
- [P0] Admins can unpublish or delete sermons.
- [P0] The most recent sermon is featured by default.
- [P0] Admins can manually designate a sermon as featured.
- [P1] Admins can schedule a sermon's visibility (scheduled publishing).
- [P1] Sermons can be hidden without deleting them.
- [P2] Admins can create curated sermon collections / "message series" (e.g., Sunday Service, Winter Conference 2026).
- [P2] AI-assisted thumbnails for sermon collections.

### 1.5 Media & Assets

- [P1] Admins can upload or select a custom sermon thumbnail (YouTube default used otherwise).
- [P1] Thumbnails can be reused from the media library.
- [P2] AI-assisted sermon thumbnail generation.

### 1.6 Admin Experience & Efficiency

- [P0] Admins can view all sermons in a sortable list. Search/sort by title, speaker, passage, collection, and all metadata.
- [P1] Admins can bulk-manage sermons (e.g., update metadata).
- [P2] Admins can view basic analytics per sermon (views, clicks).

---

## 2. Bible Study Materials

> **Open question:** Should this generalize to "Documents" or "Files"? For MVP, it remains a dedicated Bible study workflow. Consider selective menu visibility per church (similar to Tithe.ly's modular ChMS approach) as a future consideration.

### 2.1 Creation & Authoring

- [P0] Admins can create Bible study materials via:
  - PDF upload
  - DOCX upload
  - Google Docs import
  - Direct authoring in the CMS editor
- [P0] Imported documents can be edited directly within the CMS.
- [P0] Admins can assign a Bible passage range — auto-rendered on the public site with a BibleGateway link.
- [P0] Admins can insert a question guide and message transcript.
- [P0] Admins can attach downloadable files within the guide (DOCX, PDF, images).
- [P1] Admins can add custom supplemental tabs beyond the default 4 (Passage, Questions, Message, Guide).
- [P1] Imported documents support basic formatting: headings, lists, spacing, images, and embedded YouTube links.
- [P1] Imported documents automatically become downloadable for site visitors.

### 2.2 Organization & Grouping

- [P0] Bible studies are automatically organized by passage (book of the Bible) on both the public site and admin page.
- [P1] Admins can create custom folders or series.
- [P1] Admins can bulk-assign studies to folders or series.
- [P2] The CMS suggests study groupings based on scripture or series patterns.

### 2.3 Relationships & Linking

- [P0] Bible studies can be linked to a sermon page or a custom YouTube link. Linked sermons surface automatically on the study page.
- [P1] Admins can auto-import message transcripts from a connected sermon.
- [P2] The CMS suggests related sermons or studies.

### 2.4 Preview, Publishing & Access

- [P0] Bible studies support draft and published states.
- [P0] Admins can preview how a study will render on the website.
- [P0] Original uploaded files are automatically downloadable.
- [P1] Studies can be unpublished or archived without deletion.
- [P2] Studies can be scheduled for future publication.

### 2.5 Admin Experience & Efficiency

- [P0] Admins can view all Bible studies in a sortable list. Search/sort/filter by title, passage, collection, and all metadata.
- [P1] Admins can bulk-manage studies (e.g., update metadata).
- [P2] Admins can view basic engagement signals (views, downloads).

---

## 3. Events & Calendar

### 3.1 Event Creation & Details

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
- [P1] Admins can set a customized welcome message (e.g., "First Time? We'd love to meet you!").

### 3.2 Calendar & Scheduling

- [P0] Events automatically populate a centralized church calendar (admin and public).
- [P0] Events appear in "upcoming" and "past" views based on date.
- [P0] Time-sensitive events automatically transition out of prominent views after completion.
- [P1] Admins can schedule when events become visible on the site.
- [P2] Admins can create custom shareable calendars (as Google Calendar links).

### 3.3 Media & Presentation

- [P0] Events display a default cover image if none is provided (or no banner at all).
- [P1] Admins can designate recurring/ongoing events as shortcut links on the events page.
- [P1] Event images can be reused from the media library.
- [P1] AI-assisted event cover image generation.
- [P2] Admins can attach photo albums to events.
- [P2] External photo service integrations (e.g., Google Photos).

### 3.4 Sharing & Distribution

- [P0] Events generate clean, shareable links.
- [P0] Events can be added to personal calendars (Google, Apple).
- [P0] Events can be filtered/searched by type, date range, ministry/campus, and location.
- [P2] Public-facing event collections (e.g., "This Week").

### 3.5 Publishing, Updates & Lifecycle

- [P0] Events support draft and published states.
- [P0] Admins can preview events before publishing.
- [P1] Admins can update event details after publishing without breaking links.
- [P1] Past events remain accessible but are visually de-emphasized.
- [P2] Events can be archived or hidden without deletion.

### 3.6 Admin Efficiency & Reliability

- [P0] Admins can view all events in a sortable, searchable list.
- [P0] Admins can quickly identify upcoming or missing events.
- [P1] Admins can duplicate events to speed up creation.
- [P2] Admins can view basic engagement signals (clicks, calendar adds).

---

## 4. Ministry / Campus Pages

> Churches can create custom pages for ministries, but we also offer: (1) a single source of truth for ministry registration in the ChMS, and (2) a template-driven ministry page that requires zero design effort.

### 4.1 Ministry Page Setup

- [P0] Admins can create, edit, and delete ministry pages.
- [P0] Admins can manage core ministry metadata:
  - Ministry name
  - Description / About us
  - Status (draft / published / archived)
- [P0] Admins can manage ministry meeting information:
  - Location
  - Schedule (days, times)
  - Meeting type
  - Links (map, Zoom, etc.)
- [P1] Admins can manage multiple meeting entries per ministry.

### 4.2 Leadership & Contact Management

- [P0] Admins can manage ministry leaders with: name, role/title, profile image, short bio, and contact/social links.
- [P0] Admins can assign leaders or roles with edit access to the ministry page.
- [P1] Leader profiles can be connected bidirectionally with the member database.
- [P1] Admins can designate a main point of contact per ministry.

### 4.3 Testimonials & Media

- [P0] Admins can manage ministry-specific testimonials.
- [P0] Admins can manage photo albums for a ministry.
- [P1] Testimonials and albums can be reused across ministries.
- [P1] Admins can attach a portrait picture per testimonial.
- [P2] Video testimonials.

### 4.4 FAQ & Supporting Information

- [P0] Admins can manage FAQs for a ministry.
- [P1] FAQ entries can be reused across multiple ministries.

### 4.5 Admin Efficiency & Scale

- [P0] Admins can view and manage all ministry pages from a centralized list.
- [P1] Admins can duplicate an existing ministry's info.
- [P2] Bulk updates across multiple ministries.
- [P2] Version history for ministry page changes (who edited what, when).

### 4.6 Template Controls

- [P0] Admins can manage template-specific fields: banner image, layout variant, color themes, fonts.
- [P0] Admins can selectively show/hide information sections on the public page.

---

## 5. Announcements

### 5.1 Creation & Editing

- [P0] Admins can create, edit, and delete announcements.
- [P0] Admins can manage announcement content using a rich text editor.
- [P0] Admins can import content from DOCX or Google Docs.
- [P0] Admins can attach files, links, images, and video links.
- [P0] Admins can save announcements as drafts.

### 5.2 Metadata & Organization

- [P0] Admins can manage announcement metadata: title, category/type, target audience, publish status, author (optionally displayed).
- [P0] Admins can search, filter, and sort announcements.
- [P1] Admins can pin or prioritize announcements.
- [P2] Bulk-edit announcement metadata.

### 5.3 Scheduling & Publishing

- [P0] Admins can schedule announcements for future publication.
- [P0] Admins can unpublish or archive announcements without deletion.
- [P0] Admins can preview announcements before publishing.
- [P2] Admins can duplicate announcements.

### 5.4 Email Notifications

- [P1] Admins can send announcement content via email.
- [P1] Admins can choose email timing: immediately or scheduled.
- [P1] Admins can select recipients: all members, specific groups or ministries.
- [P1] Admins can customize email subject lines and preview email content.
- [P2] Resend announcements or send reminders.
- [P2] Basic email delivery status tracking (sent, failed).

---

## 6. Media Library

> **Open question:** Consider whether the media library should be unified with sermon media/assets or remain separate. For MVP, it is a standalone centralized library referenced by all other content types.

### 6.1 Upload, Organization & Metadata

- [P0] Admins can upload multiple image and video files to a centralized media library.
- [P0] Admins can manage media metadata: title, description, tags/categories (including ministry association).
- [P0] Admins can organize media using tags (multiple per item).
- [P0] Admins can search, filter, and sort media by metadata.
- [P1] Admins can view where a media item is used across the website/app.
- [P1] Bulk-edit media metadata.

### 6.2 Lifecycle, Safety & Governance

- [P0] Admins can delete media with confirmation when the item has active associations.
- [P0] Admins can archive media without deleting files.
- [P0] Admins can identify unused media.
- [P1] Usage information is visible per media item.
- [P1] Media actions respect role-based permissions.
- [P2] Folder/collection-level access restrictions.
- [P2] Version history for media updates.

---

## 7. Prayer Topics

> Enable admins to manage church-wide prayer resources and oversee a member-contributed prayer wall — safely, scalably, and with minimal ongoing maintenance.

### 7.1 Prayer Content & Resources (Church-Led)

- [P0] Admins can create, edit, and manage church-wide prayer topics.
- [P0] Admins can manage centralized prayer resources: topics, key verses, prayer guides/outlines.
- [P0] Admins can import prayer content from external sources (Google Sheets, documents).
- [P0] Admins can update prayer content without reposting.
- [P1] Admins can pin or highlight church-wide prayer content.
- [P2] Organize prayer content by category or theme.
- [P2] Schedule prayer content.

### 7.2 Prayer Wall Oversight (Member-Generated Content)

- [P0] Admins can view all member-posted prayer requests.
- [P0] Admins can hide, archive, edit, or delete prayer posts.
- [P0] Admins can moderate sensitive or inappropriate content.
- [P0] Admins can mark prayer posts as urgent or resolved.
- [P2] Bulk moderation actions.

### 7.3 Permissions, Privacy & Safety

- [P0] Admins can designate which roles can post church-wide prayers and moderate the prayer wall.
- [P0] Admins can override privacy settings for moderation purposes.
- [P1] Admins can assign moderation privileges to specific users.
- [P2] Audit trail for prayer activity and moderation actions.

### 7.4 Lifecycle & Engagement

- [P0] Admins can archive and reopen prayer topics.
- [P0] Admins can view engagement indicators (e.g., number of prayers).
- [P2] Historical prayer archives.

---

## 8. Church Profile

> The church's core identity information — name, address, service times, contact info, social links, and about-us content. This data feeds the website header/footer, Google Business Profile, and any public-facing "about" pages.

### 8.1 Core Information

- [P0] Admins can manage the church's name, address, phone number, and email.
- [P0] Admins can manage service times and regular meeting schedules.
- [P0] Admins can manage social media links.
- [P0] Admins can write and edit an "About Us" description.
- [P1] Admins can upload a church logo and favicon.
- [P1] Changes to church profile data propagate automatically to all locations on the website where they appear (header, footer, contact page, etc.).
