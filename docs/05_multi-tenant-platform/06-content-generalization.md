# Content Model Generalization

How to make the LA UBF-specific CMS work for any church.

---

## The Problem

Three models are heavily LA UBF-specific:

| Model | LA UBF Fields | Why It's Specific |
|-------|--------------|-------------------|
| **Message** | `passage`, `bibleVersion`, `transcriptSegments`, `studySections`, `relatedStudyId` | Deep sermon + bible study integration. Most churches just want "title, speaker, video URL, date." |
| **BibleStudy** | `book` (all 66 books), `questions`, `answers`, `transcript`, `keyVerseRef` | Full inductive bible study curriculum. Not a standard format. |
| **DailyBread** | All fields | "Daily Bread" is a specific devotional format. Most churches don't have this. |

---

## Strategy: Optional Modules, Not Schema Removal

**Don't** remove these models or simplify them. LA UBF needs them. Instead:

1. **Make them optional modules** that churches enable/disable via feature flags
2. **Add configurable labels** so churches can rename "Messages" → "Sermons" → "Teachings"
3. **Keep the rich schema** — churches that want it get a powerful tool; those that don't never see it

### Feature Flags for Content Modules

```typescript
// lib/features.ts
type ContentModuleFlags = {
  modules: {
    messages: boolean       // Sermon/message management
    bibleStudies: boolean   // Bible study curriculum
    dailyBread: boolean     // Daily devotional
    events: boolean         // Event management
    announcements: boolean  // Church bulletins
    prayerRequests: boolean // Prayer request intake
    blog: boolean           // Blog/news posts
    mediaLibrary: boolean   // File/image management
  }
}
```

### Plan-Based Defaults

| Module | Free | Starter | Pro | Enterprise |
|--------|------|---------|-----|------------|
| Messages | Yes | Yes | Yes | Yes |
| Events | Yes | Yes | Yes | Yes |
| Announcements | Yes | Yes | Yes | Yes |
| Bible Studies | No | No | Yes | Yes |
| Daily Bread | No | No | No | Yes (custom) |
| Prayer Requests | No | Yes | Yes | Yes |
| Blog | No | No | Yes | Yes |
| Media Library | No | Yes | Yes | Yes |

---

## Configurable Labels

Churches should be able to rename content types in their CMS. Store as JSON on Church:

```typescript
type ContentLabels = {
  messages: { singular: string; plural: string; icon: string }
  bibleStudies: { singular: string; plural: string; icon: string }
  events: { singular: string; plural: string; icon: string }
  announcements: { singular: string; plural: string; icon: string }
}

// Defaults (generic):
const DEFAULT_LABELS: ContentLabels = {
  messages: { singular: 'Sermon', plural: 'Sermons', icon: 'BookOpen' },
  bibleStudies: { singular: 'Bible Study', plural: 'Bible Studies', icon: 'BookMarked' },
  events: { singular: 'Event', plural: 'Events', icon: 'Calendar' },
  announcements: { singular: 'Announcement', plural: 'Announcements', icon: 'Megaphone' },
}

// LA UBF overrides:
const LAUBF_LABELS: ContentLabels = {
  messages: { singular: 'Message', plural: 'Messages', icon: 'BookOpen' },
  bibleStudies: { singular: 'Bible Study', plural: 'Bible Studies', icon: 'BookMarked' },
  // ... etc
}
```

Usage in CMS sidebar and page titles:
```tsx
// Instead of hardcoded "Messages"
<SidebarItem label={labels.messages.plural} icon={labels.messages.icon} />
```

---

## CMS Sidebar: Dynamic Module List

Current sidebar is hardcoded. Make it dynamic based on enabled modules:

```typescript
const CMS_MODULES = [
  { key: 'dashboard', label: 'Dashboard', href: '/cms', icon: 'LayoutDashboard', alwaysShow: true },
  { key: 'churchProfile', label: 'Church Profile', href: '/cms/church-profile', icon: 'Church', alwaysShow: true },
  { key: 'messages', label: (l) => l.messages.plural, href: '/cms/messages', icon: 'BookOpen', flag: 'modules.messages' },
  { key: 'events', label: (l) => l.events.plural, href: '/cms/events', icon: 'Calendar', flag: 'modules.events' },
  { key: 'bibleStudies', label: (l) => l.bibleStudies.plural, href: '/cms/bible-studies', icon: 'BookMarked', flag: 'modules.bibleStudies' },
  { key: 'announcements', label: (l) => l.announcements.plural, href: '/cms/announcements', icon: 'Megaphone', flag: 'modules.announcements' },
  { key: 'media', label: 'Media', href: '/cms/media', icon: 'Image', flag: 'modules.mediaLibrary' },
  { key: 'people', label: 'People', href: '/cms/people/members', icon: 'Users', alwaysShow: true },
  // Website section always shows
  { key: 'builder', label: 'Page Builder', href: '/cms/website/builder', icon: 'Paintbrush', alwaysShow: true },
  // ... etc
]

function getVisibleModules(flags: FeatureFlags, labels: ContentLabels) {
  return CMS_MODULES.filter(m =>
    m.alwaysShow || (m.flag && canAccessFeature(flags, m.flag))
  ).map(m => ({
    ...m,
    label: typeof m.label === 'function' ? m.label(labels) : m.label,
  }))
}
```

---

## What Stays Generic (No Changes Needed)

These models work for any church as-is:

| Model | Why It's Already Generic |
|-------|------------------------|
| Event | Standard CRUD with calendar, registration, recurrence |
| Speaker | Just name + bio + photo — works for any speaker/pastor/leader |
| Series | Grouping mechanism — works for sermon series, study series, etc. |
| Ministry | Organizational units — every church has these |
| Campus | Multi-location support |
| Person / Household | Standard CRM |
| Page / PageSection | Generic page builder |
| Theme / ThemeCustomization | Visual theming |
| SiteSettings | Website configuration |
| Menu / MenuItem | Navigation |
| MediaAsset | File storage |
| Announcement | Bulletins |
| ContactSubmission | Contact forms |
| AuditLog | Activity tracking |

---

## Migration Path for Existing LA UBF Data

When transitioning to multi-tenant, LA UBF becomes just another tenant:

1. **No data migration needed** — everything already has `churchId`
2. Set LA UBF's `featureFlags` to enable all modules (including bibleStudies, dailyBread)
3. Set LA UBF's `contentLabels` to their custom names
4. LA UBF continues working exactly as before — zero regression

New churches start with default labels and module set based on their plan tier.
