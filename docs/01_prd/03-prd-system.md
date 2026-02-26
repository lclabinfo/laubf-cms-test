# PRD: System & Admin Capabilities

> Living document. Update as features are implemented or requirements evolve.
> See also: [Primary User Profile](./primary-user-profile.md) | [CMS PRD](./prd-cms.md) | [Website Builder PRD](./prd-website-builder.md)

---

## Overview

System capabilities are the foundational infrastructure that sits beneath the CMS and Website Builder. They cover who can do what (roles & permissions), how the system prevents content decay (content health), how admins understand site usage (analytics), and how churches manage their subscription (billing & modules).

These capabilities are largely invisible during day-to-day content work — they surface only when needed (e.g., inviting a new admin, reviewing content freshness, or upgrading a plan).

### Priority Legend

- **[P0]** — MVP. Critical for launch.
- **[P1]** — Important for a delightful experience.
- **[P2]** — Nice-to-have / future enhancement.

---

## 1. Roles & Permissions

> The system must support multiple admins safely, with minimal onboarding overhead and consistent behavior during leadership transitions.

### 1.1 Role Definitions

- [P0] The system provides predefined roles:
  - **Super Admin** — Full access. Can manage billing, roles, all content, and site settings. Typically the senior pastor or primary admin.
  - **Admin** — Full content and site management access. Cannot manage billing or roles.
  - **Editor** — Can create and edit content (sermons, events, announcements, etc.) but cannot modify site structure, templates, or settings.
  - **Viewer** — Read-only access to the CMS dashboard. Useful for board members or oversight roles.
- [P0] Each role has clearly defined permissions across CMS content types, Website Builder, and system settings.
- [P1] Admins can create custom roles with granular permission toggles per content type and feature area.
- [P2] Role templates for common church structures (e.g., "Worship Leader" with access to sermons + media only).

### 1.2 User Management

- [P0] Super Admins can invite new users via email.
- [P0] Super Admins can assign and change user roles.
- [P0] Super Admins can deactivate or remove user accounts.
- [P0] New users go through a simple onboarding flow (set password, basic profile).
- [P1] Admins can see a log of who last edited each piece of content.
- [P1] Admins can transfer Super Admin ownership to another user.
- [P2] Support for single sign-on (SSO) via Google or Microsoft accounts.

### 1.3 Ministry-Level Permissions

- [P0] Admins can assign users to specific ministries with edit access scoped to that ministry's content.
- [P0] Ministry-scoped editors can only see and edit content within their assigned ministry (e.g., Youth Ministry leader only sees youth events and announcements).
- [P1] Ministry leaders can invite additional editors to their ministry without needing Super Admin intervention.
- [P2] Permission inheritance — a user assigned to a parent ministry inherits access to child ministries.

---

## 2. Content Health & Governance

> The system should actively prevent content decay. Admins should not need to remember to clean up stale content — the system should surface it and, where possible, handle it automatically.

### 2.1 Staleness Detection

- [P0] The system flags content that hasn't been updated within a configurable timeframe (e.g., 30/60/90 days).
- [P0] Stale content is surfaced in the CMS dashboard with clear indicators.
- [P0] Announcements and events past their date are automatically de-emphasized or archived.
- [P1] Admins receive periodic digest notifications (email or in-app) summarizing stale or expiring content.
- [P1] Content health score per section (e.g., "Sermons: Fresh | Events: 2 stale | Announcements: 1 expired").
- [P2] The system suggests specific actions to resolve stale content (e.g., "This announcement expired 2 weeks ago — archive it?").

### 2.2 Automated Content Lifecycle

- [P0] Announcements support an optional expiration date — auto-archived after expiry.
- [P0] Past events are automatically moved from "upcoming" to "past" views.
- [P1] Admins can set default expiration rules per content type (e.g., all announcements expire after 2 weeks unless overridden).
- [P1] Archived content remains accessible in the admin but hidden from the public site.
- [P2] Scheduled content reviews — the system prompts admins to review specific content on a recurring schedule.

### 2.3 Publishing Safeguards

- [P0] All content changes go through draft → published states. No accidental live edits.
- [P0] Admins see a clear "You are editing a published page" indicator when modifying live content.
- [P1] Admins can preview changes against the current live version (side-by-side diff).
- [P1] The system warns when changes affect multiple pages (e.g., updating a ministry name that appears on 3 pages).
- [P2] Optional approval workflow — Editors submit for review, Admins approve before publishing.

---

## 3. CMS Dashboard & Analytics

> The dashboard is the first screen a pastor sees after login. It must answer three questions instantly: "What needs my attention?", "What's coming up?", and "Is the website healthy?" — without requiring configuration or technical knowledge. Design principle: **momentum over perfection** — 5-6 focused widgets, not 15 overwhelming ones.
>
> See also: [Dashboard Research](../00_dev-notes/dashboard-research.md) for competitor analysis, UX patterns, and design rationale.

### 3.1 Dashboard Layout & Principles

- [P0] Dashboard loads in under 2 seconds with no configuration required.
- [P0] Maximum 7-8 visible widgets at once (cognitive load limit). Default shows 5-6.
- [P0] Visual hierarchy: Quick Actions at top, then Content Health, then activity/events.
- [P0] Green/Yellow/Red traffic-light indicators for content health (universally understood by non-technical users).
- [P0] Empty states serve as onboarding — when a widget has no data, show guided setup prompts instead of blank space.
- [P1] Admins can toggle widget visibility via a "Customize Dashboard" button.
- [P2] Drag-to-rearrange widget positions. Per-user preferences saved.

### 3.2 Quick Actions Widget [P0]

> Inspired by: WordPress Quick Draft, Wix "More Actions", Squarespace setup checklists. The most frequent pastor actions must be one click away.

- [P0] Prominent action buttons above the fold (top of dashboard):
  - **New Message** — Opens message creation form.
  - **New Event** — Opens event creation form.
  - **Upload Media** — Opens media upload dialog.
  - **Edit Pages** — Opens website page builder.
- [P0] Actions are role-aware: Editors see content actions; Viewers see read-only dashboard.
- [P1] "Recently Edited" section: Last 3-5 items the current user was working on, with "Resume" links.
- [P1] Command palette (Cmd+K) for power users to search/navigate/create from anywhere in the CMS.
- [P2] Quick Draft: Inline title + notes capture on dashboard that saves as a draft message.

### 3.3 Content Health Widget [P0]

> Inspired by: Cascade CMS stale content dashboard, Kontent.ai "Unchanged items" widget, WordPress freshness plugins. This is the differentiating feature — most church CMS platforms lack content health tracking entirely.

- [P0] Color-coded summary cards for each content type:
  - **Messages**: X published, Y this month. Green if posted within last 7 days, Yellow if >14 days, Red if >30 days.
  - **Events**: X upcoming. Yellow flag for events missing key info (no location, no description, no cover image).
  - **Media**: X total items. Yellow if any photos older than configurable threshold (default 6 months) are still on homepage/hero sections.
  - **Pages**: X published. Yellow if any page not updated in 90+ days.
- [P0] Each card links to the relevant content list, pre-filtered to show items needing attention.
- [P0] Overall site health indicator: "Your site is healthy" (green) / "X items need attention" (yellow) / "X items are stale" (red).
- [P1] **Stale Content Alerts**: Expandable list below health cards showing specific items needing action, with inline "Edit" and "Archive" buttons.
- [P1] Configurable staleness thresholds per content type (Settings > Content Health).
- [P1] Media freshness tracking: Photos used in hero sections, homepage, or feature cards that haven't been updated in X months get flagged.
- [P2] Content freshness score per type (e.g., "Sermons: 92% fresh", "Events: 75%").
- [P2] Weekly email digest of stale content (sent to admins).

### 3.4 Upcoming Events Widget [P0]

> Inspired by: Planning Center schedule breakdown, Tithe.ly calendar. Pastors think in terms of "what's happening this week."

- [P0] Shows next 5 upcoming events with date, time, type badge (Event/Meeting/Program).
- [P0] Yellow indicator for events missing critical info (no location, no time, no description).
- [P0] "View All Events" link to events CMS page.
- [P1] "This Week" vs "This Month" toggle.
- [P1] Inline "Edit" action per event.
- [P2] Mini calendar visualization showing event density per day.

### 3.5 Recent Activity Widget [P0]

> Inspired by: WordPress Activity widget, Strapi Last Edited Entries, Ghost activity feed.

- [P0] Shows last 10 content actions: "[User] [action] [content type] [title] [time ago]"
  - Actions: created, edited, published, archived, deleted.
  - Content types: message, event, page, media, settings.
- [P0] Each activity item links to the content that was modified.
- [P0] Avatar/initials for the user who performed the action.
- [P1] Filterable by content type and action type.
- [P1] "View Full Activity Log" link to dedicated activity log page.
- [P2] Real-time updates (no page refresh needed).

### 3.6 At a Glance Widget [P0]

> Inspired by: WordPress "At a Glance", Strapi "Entries Overview".

- [P0] Summary counts for key content types:
  - Total Messages (published / draft)
  - Total Events (upcoming / past)
  - Total Pages (published / draft)
  - Total Media (photos / videos)
- [P0] Each count is a link to the relevant CMS list page.
- [P1] Trend indicator: up/down arrow comparing to last month.
- [P2] Sparkline mini-charts showing 30-day trend per content type.

### 3.7 Analytics Overview

- [P0] Dashboard summary widget: total site visitors (last 7 / 30 days) from Cloudflare Web Analytics or Google Analytics integration.
- [P0] Dashboard loads quickly and does not require configuration.
- [P1] Most viewed pages (top 5).
- [P1] Admins can customize which dashboard widgets are visible.
- [P2] Comparison metrics (this week vs. last week, this month vs. last month).

### 3.2 Content Analytics

- [P1] Admins can see view counts per sermon, event, and page.
- [P1] Admins can see which sermons are most watched/clicked.
- [P1] Admins can see event engagement (calendar adds, clicks).
- [P2] Admins can see download counts for Bible study materials.
- [P2] Admins can export analytics data (CSV).

### 3.3 Audience Insights

- [P1] Basic visitor demographics: device type (mobile vs. desktop), top referral sources.
- [P2] Geographic distribution of visitors.
- [P2] New vs. returning visitor breakdown.
- [P2] Integration with Google Analytics (for churches that want deeper data).

### 3.4 Reporting

- [P1] Monthly auto-generated site health report (emailed to Super Admin).
- [P2] Custom date range reports.
- [P2] Giving / donation report integration (if giving module is enabled).

---

## 4. Subscription & Module Management

> Churches should start simple and add features as they grow. The system should never force complexity upfront.

### 4.1 Plans & Billing

- [P0] The platform offers tiered subscription plans:
  - **Free / Starter** — Core CMS features, 1 admin, basic template, subdomain only.
  - **Standard** — Full CMS + Website Builder, multiple admins, custom domain, theme customization.
  - **Premium** — Everything in Standard + advanced analytics, priority support, AI-assisted features, custom roles.
- [P0] Admins can view their current plan and usage.
- [P0] Admins can upgrade or downgrade their plan.
- [P0] Billing is handled via a secure payment integration (Stripe or equivalent).
- [P1] Admins receive billing reminders before renewal.
- [P1] Admins can view billing history and download invoices.
- [P2] Annual billing discount.
- [P2] Non-profit / church discount verification flow.

### 4.2 Module Management

- [P0] Content types can be enabled or disabled per church (e.g., a church that doesn't need Bible study materials can hide that section entirely).
- [P0] Disabling a module hides it from the CMS sidebar, navigation, and public site.
- [P0] Disabled modules preserve their data — re-enabling restores everything.
- [P1] Admins can see a catalog of available modules and what each one does.
- [P1] Some modules are plan-gated (e.g., prayer wall only available on Standard+).
- [P2] Third-party integrations as installable modules (e.g., Mailchimp, Planning Center, Slack).

### 4.3 Onboarding & Setup

- [P0] New churches go through a guided onboarding flow:
  1. Church name and basic info
  2. Template selection
  3. Module selection (which content types to enable)
  4. Invite additional admins (optional)
  5. Connect custom domain (optional)
- [P0] Onboarding can be completed in under 10 minutes.
- [P0] The system provides a checklist of recommended setup steps after onboarding.
- [P1] Sample/demo content is pre-populated so the site doesn't look empty on first load.
- [P1] Contextual tooltips and help text throughout the CMS for first-time users.
- [P2] Interactive guided tour of the CMS features.

---

## 5. Notifications & Activity

### 5.1 In-App Notifications

- [P0] Admins receive in-app notifications for critical events:
  - Content flagged as stale
  - New user accepted an invitation
  - Publishing errors or failures
- [P1] Admins can configure notification preferences (which events trigger notifications).
- [P1] Notifications appear in a centralized notification center within the CMS.
- [P2] Real-time notifications (no page refresh needed).

### 5.2 Email Notifications

- [P1] Admins can opt into email digests (daily or weekly) summarizing CMS activity and content health.
- [P1] Critical alerts (site down, SSL expiring, billing failed) are always sent via email.
- [P2] Per-user email notification preferences.

### 5.3 Activity Log

- [P0] The system logs all significant actions: content created/edited/published/deleted, user added/removed, settings changed.
- [P0] Activity log is viewable by Admins and Super Admins.
- [P1] Activity log is filterable by user, content type, and action type.
- [P2] Activity log export (CSV).

---

## Non-goals (System)

- We are **not** building a full church management system (ChMS) with member check-in, small group tools, or volunteer scheduling at MVP. People management is limited to a member directory and basic contact records.
- We are **not** building a payment/donation processing system from scratch. Giving integration will use a third-party processor (Stripe, etc.).
- We are **not** building a mobile app for church members at MVP. The public-facing website is mobile-responsive, but there is no native app.
- We are **not** supporting multi-church / denomination-level management at MVP. Each church is a standalone instance.
