# CMS Dashboard Research

> Research conducted Feb 25, 2026. Covers competitor analysis, church admin pain points, UX best practices, content health patterns, and quick action patterns.

---

## Key Insight

Most church CMS platforms focus on giving/attendance dashboards. **Content freshness tracking is the differentiator** — it prevents the "stale church website" problem that plagues most churches. The design principle: "the goal is momentum, not perfection" (The Unstuck Group).

---

## 1. Competitor Dashboard Analysis

### Church-Specific Platforms

| Platform | Dashboard Focus | Key Widgets | Notable Pattern |
|---|---|---|---|
| **Tithe.ly** | Giving metrics | Total giving, donors, avg donation, fund breakdowns | Nightly refresh with manual widget refresh |
| **Planning Center** | Personal ministry hub | 20 customizable widgets, schedule breakdown, workflow cards | "Everything you're coordinating in one place" |
| **Subsplash** | Multi-channel publish | Push notifications, media upload, engagement metrics | One-click publish to website + app + TV + podcast |
| **Faithlife Sites** | Auto-synced content | Calendar, sermons, newsletters auto-populate from group data | Content edits in group → auto-update website |
| **Nucleus** | Page management | Custom presets, brand standardization, granular permissions | Per-section permission ("just the youth page") |
| **Clover Sites** | Easy/Advanced modes | Forms, prayers, events, media | Two editing modes for different skill levels |

### General CMS/Builders

| Platform | Key Dashboard Widgets | Quick Actions | Notable |
|---|---|---|---|
| **WordPress** | At a Glance (counts), Activity feed, Quick Draft, Site Health | Inline draft creation, drag-rearrange widgets | Quick Draft = "capture idea in 10 seconds" |
| **Squarespace** | Analytics (date range), setup checklists, email tools, tutorials | Customize Home button, context-sensitive checklists | Checklists vary by business type |
| **Wix** | Site sessions, form submissions, sales/bookings | "More Actions" icon, global search, intent-based menu | Menu grouped by "action and intent" |
| **Webflow** | Traffic, top pages, bounce rate, referrers | Analyze Mode (real-time in editor), clickmaps | Analytics overlaid on actual designs |
| **Ghost** | Members (free/paid), MRR, open/click rates, activity feed | Auto-save, scheduling, tag management | Laser-focused on creator/publisher workflow |
| **Strapi** | Last Edited, Entries Overview, Assigned Entries, Releases | Guided tour, direct links from widgets | Resizable/reorderable widgets via Widget API |

### Content Platforms

| Platform | Key Feature | Notable |
|---|---|---|
| **HubSpot CMS** | Built-in analytics per page, revenue attribution | Every page comes with analytics — zero config |
| **Contentful/Kontent.ai** | "Unchanged published items" (90+ days), "Unchanged unpublished" (30+ days) | Mission Control dashboard for content operations |

---

## 2. Church Admin Pain Points

From multiple research sources (LifeWay, Subsplash, ChurchesAdmin, The Unstuck Group):

1. **Tool fatigue** — Too many separate tools that don't talk to each other. Giving in one, events in another, people in a third.
2. **Single gatekeeper bottleneck** — One webmaster. When busy/on vacation, site languishes with outdated info.
3. **Time sink** — Pastors spend too much time on admin tasks, reducing ministry focus.
4. **Not knowing if the site works** — "Is our website reaching new visitors or missing opportunities?"
5. **Stale content decay** — Service times, events, news need constant attention. Content silently goes stale.
6. **Fear of breaking things** — Non-technical users avoid edits they're unsure about.

### What Pastors Need When They Log In

1. Quick overview of church activity (contributions, attendance, events)
2. Upcoming events — what's this week? what needs prep?
3. Content freshness — what's stale? what needs updating before Sunday?
4. Recent activity — who edited what, when?
5. Follow-up tasks — visitors to contact, prayers to address
6. Quick creation — post sermon, add event, upload media

---

## 3. Dashboard UX Best Practices (2025)

### Design Principles

1. **Visual hierarchy** — Most important KPI in top-left corner. Primary metrics largest visually.
2. **7-8 element limit** — Brain processes ~9 items at once. Keep to 5-8 widgets max.
3. **Actionable, not informational** — Every metric answers "so what?" and suggests next step.
4. **Progressive disclosure** — Hide advanced features behind toggles/expandable sections.
5. **Fast load times** — Users expect <2-3 seconds. Lazy-load non-critical sections.
6. **Consistency** — Same colors, font styles, chart types across views.
7. **Icons reduce clutter** — Especially effective for non-technical audiences.

### Patterns for Non-Technical Users

- Natural language over technical jargon
- Clear CTAs near insights ("Edit" button next to stale content)
- Tooltips for additional context on demand
- Empty states as onboarding opportunities (guided setup when no data)
- Green/Yellow/Red traffic-light coloring for urgency (universally understood)

---

## 4. Content Health/Freshness Patterns

### How Other Platforms Track Staleness

| Platform | Approach |
|---|---|
| **Cascade CMS** | Dedicated stale content dashboard with pie chart. Configurable thresholds (30/60/90 days). Export CSV, send notifications. |
| **Kontent.ai** | "Unchanged published items" widget (90+ days). "Unchanged unpublished items" (30+ days). Content operations dashboard. |
| **Brightspot CMS** | Proactive Site Health Framework. Extensible alerts. Actions directly from notifications. |
| **WordPress plugins** | Color-coded freshness (green/yellow/red). Weekly email digests. Auto-detect outdated posts. |

### Media Freshness Signals

- Images tracked by last-modified dates and usage analytics
- Low engagement = losing relevance
- Photos on site for X months without update → flag for review
- CMS should track: when media was uploaded, when last used, how many pages reference it

### Auto-Archiving Patterns

1. **Expiration dates** — Set during creation, auto-archive after expiry
2. **Time-based rules** — "If not viewed for 180 days OR not updated for 365 days, archive"
3. **Quarantine before deletion** — Review staging area before permanent removal
4. **Version control** — Preserve historical content, allow restoration

---

## 5. Quick Action Patterns

### Most Effective Patterns

| Pattern | Example | Platform |
|---|---|---|
| **Prominent "Create New"** | Big button above the fold | Every CMS |
| **Contextual actions near data** | "Edit" next to stale item | Cascade, Brightspot |
| **Command palette** | Cmd+K to search/create | Notion, Linear, Vercel |
| **Quick Draft** | Inline content capture on dashboard | WordPress |
| **Recently Edited** | Resume last 3-5 items | Strapi, Planning Center |
| **Role-based shortcuts** | Pastor sees "New Sermon", Media admin sees "Upload" | Subsplash, Nucleus |

---

## 6. Recommended Dashboard Widgets

### P0 — Must Have (V1)

| Widget | Description | Inspired By |
|---|---|---|
| **Quick Actions** | 3-4 buttons: New Message, New Event, Upload Media, Edit Pages | WordPress Quick Draft, Wix |
| **Content Health Summary** | Color-coded cards per content type (Fresh/Stale/Expired) | Cascade CMS, Kontent.ai |
| **Upcoming Events** | Next 5 events with yellow flag for missing info | Planning Center |
| **Recent Activity** | Last 10 edits: who, what, when | WordPress Activity, Strapi |
| **At a Glance** | Total pages, messages, events, media. Published/draft counts. | WordPress At a Glance |

### P1 — Important

| Widget | Description |
|---|---|
| **Stale Content Alerts** | Expandable list with inline Edit/Archive actions |
| **This Week's Calendar** | Visual timeline of scheduled/published content |
| **Recently Edited** | Last 3-5 items current user was working on |
| **Setup Checklist** | For new accounts — guided onboarding with progress |

### P2 — Nice to Have

| Widget | Description |
|---|---|
| **Site Visitors** | Simple line chart (7/30 day trend) |
| **Most Viewed Pages** | Top 5 by views |
| **Content Freshness Score** | Per-type percentage ("Sermons: 92% fresh") |
| **Customizable Layout** | Drag to rearrange, toggle widget visibility |

---

## Sources

- [Tithe.ly Dashboard](https://help.tithe.ly/hc/en-us/articles/7279421228439)
- [Planning Center Home](https://www.planningcenter.com/home)
- [Subsplash ChMS](https://www.subsplash.com/product/church-management-software)
- [Faithlife Sites](https://faithlife.com/products/sites/communications)
- [Nucleus Church](https://www.nucleus.church/)
- [WordPress Dashboard](https://wordpress.org/documentation/article/dashboard-screen/)
- [Squarespace Dashboard](https://support.squarespace.com/hc/en-us/articles/115010428047)
- [Wix Dashboard](https://support.wix.com/en/article/about-your-wix-dashboard)
- [Ghost Dashboard](https://ghost.org/help/dashboard/)
- [Strapi Admin Panel](https://docs.strapi.io/cms/features/admin-panel)
- [Cascade CMS Stale Content](https://www.hannonhill.com/cascadecms/latest/content-management/reports/stale-content-report.html)
- [Kontent.ai Content Freshness](https://kontent.ai/blog/why-you-should-automate-the-unpublishing-of-outdated-content/)
- [Dashboard Design Best Practices 2025](https://www.brand.dev/blog/dashboard-design-best-practices)
- [Admin Dashboard UX 2025](https://medium.com/@CarlosSmith24/admin-dashboard-ui-ux-best-practices-for-2025-8bdc6090c57d)
- [Church Technology Guide 2025](https://theleadpastor.com/church-management/technology-in-church/)
- [7 Best Practices Church Websites](https://research.lifeway.com/2025/04/24/7-best-practices-for-an-effective-church-website/)
- [Building a Ministry Dashboard](https://theunstuckgroup.com/building-ministry-dashboard-actually-use/)
