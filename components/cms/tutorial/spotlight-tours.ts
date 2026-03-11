import type { SpotlightTourDef } from "./spotlight-tour"

/**
 * Spotlight tour definitions for each CMS page.
 *
 * Each step targets a DOM element via `[data-tutorial="..."]` selector.
 * Pages must add matching data-tutorial attributes to their elements.
 */

export const SPOTLIGHT_TOURS: Record<string, SpotlightTourDef> = {
  // ── Dashboard ──────────────────────────────────────────────────────
  dashboard: {
    id: "dashboard",
    steps: [
      {
        target: '[data-tutorial="dash-actions"]',
        title: "Quick Actions",
        description: "Jump to common tasks — create a message, event, or upload media.",
        placement: "bottom",
      },
      {
        target: '[data-tutorial="dash-health"]',
        title: "Content Health",
        description: "See how fresh your content is. Green = recent, yellow = aging, red = stale.",
        placement: "bottom",
      },
      {
        target: '[data-tutorial="dash-events"]',
        title: "Upcoming Events",
        description: "Your next scheduled events at a glance.",
        placement: "top",
      },
      {
        target: '[data-tutorial="dash-activity"]',
        title: "Recent Activity",
        description: "Latest changes across messages, events, and pages.",
        placement: "top",
      },
    ],
  },

  // ── Messages (Bible Studies list) ──────────────────────────────────
  messages: {
    id: "messages",
    steps: [
      {
        target: '[data-tutorial="msg-new-btn"]',
        title: "Create a Message",
        description: "Each message can hold a video recording, a written bible study, or both.",
        placement: "bottom",
      },
      {
        target: '[data-tutorial="msg-toolbar"]',
        title: "Search & Filter",
        description: "Find messages by title, speaker, date range, or series.",
        placement: "bottom",
      },
      {
        target: '[data-tutorial="msg-table"]',
        title: "Messages Table",
        description: "Study and Video columns show what content is attached. Click a row to edit.",
        placement: "top",
      },
      {
        target: '[data-tutorial="msg-series-tab"]',
        title: "Series",
        description: "Group related messages into series for organized browsing on your website.",
        placement: "bottom",
      },
    ],
  },

  // ── Message Editor ─────────────────────────────────────────────────
  // Steps span multiple tabs. The parent component uses onBeforeStep
  // to switch tabs before each step. Tab mapping:
  //   0 = details, 1 = details (attachments), 2 = video, 3 = study
  "message-editor": {
    id: "message-editor",
    steps: [
      {
        target: '[data-tutorial="editor-title"]',
        title: "Message Details",
        description: "Set the title, date, speaker, and series. This info appears on your website.",
        placement: "bottom",
      },
      {
        target: '[data-tutorial="editor-attachments"]',
        title: "Attachments",
        description: "Add downloadable files (PDFs, docs) that visitors can access on your site.",
        placement: "top",
      },
      {
        target: '[data-tutorial="editor-video"]',
        title: "Video",
        description: "Paste a YouTube or Vimeo URL. Live transcription is coming soon.",
        placement: "bottom",
      },
      {
        target: '[data-tutorial="editor-study"]',
        title: "Bible Study",
        description: "Write study content in the rich editor, or upload a .doc/.docx file to auto-import.",
        placement: "top",
      },
    ],
  },

  // ── Events ─────────────────────────────────────────────────────────
  events: {
    id: "events",
    steps: [
      {
        target: '[data-tutorial="evt-new-btn"]',
        title: "Create an Event",
        description: "Add worship services, fellowships, retreats, conferences, and more.",
        placement: "bottom",
      },
      {
        target: '[data-tutorial="evt-toolbar"]',
        title: "Search & View Options",
        description: "Search events and switch between list and card views.",
        placement: "bottom",
      },
      {
        target: '[data-tutorial="evt-tabs"]',
        title: "List & Calendar",
        description: "Toggle between a sortable list and a monthly calendar overview.",
        placement: "bottom",
      },
    ],
  },

  // ── Event Editor ──────────────────────────────────────────────────
  "event-editor": {
    id: "event-editor",
    steps: [
      {
        target: '[data-tutorial="evt-form-title"]',
        title: "Event Title",
        description: "Give your event a clear name. This is what visitors see on your website.",
        placement: "bottom",
      },
      {
        target: '[data-tutorial="evt-section-schedule"]',
        title: "Schedule",
        description: "Set start/end dates, times, and optional recurrence for repeating events.",
        placement: "bottom",
      },
      {
        target: '[data-tutorial="evt-section-location"]',
        title: "Location",
        description: "Choose in-person, online, or hybrid. Add the address or meeting link.",
        placement: "top",
      },
      {
        target: '[data-tutorial="evt-section-details"]',
        title: "Details & Description",
        description: "Add a summary and rich-text description for the event page.",
        placement: "top",
      },
      {
        target: '[data-tutorial="evt-section-settings"]',
        title: "Settings & Publishing",
        description: "Set the event type, ministry, status, and contact info.",
        placement: "top",
      },
    ],
  },

  // ── Church Profile ─────────────────────────────────────────────────
  "church-profile": {
    id: "church-profile",
    steps: [
      {
        target: '[data-tutorial="prof-identity"]',
        title: "Church Identity",
        description: "Your church name and description. This appears across your website.",
        placement: "bottom",
      },
      {
        target: '[data-tutorial="prof-location"]',
        title: "Location & Contact",
        description: "Address, phone numbers, and email so visitors can find and reach you.",
        placement: "top",
      },
      {
        target: '[data-tutorial="prof-services"]',
        title: "Service Times",
        description: "Set your regular worship schedule. Shows on your website homepage.",
        placement: "top",
      },
    ],
  },

  // ── Media ──────────────────────────────────────────────────────────
  media: {
    id: "media",
    steps: [
      {
        target: '[data-tutorial="media-toolbar"]',
        title: "Upload & Manage",
        description: "Upload photos, add video links, and sort your library.",
        placement: "bottom",
      },
      {
        target: '[data-tutorial="media-sidebar"]',
        title: "Folders",
        description: "Organize media into folders. Drag and drop files between them.",
        placement: "right",
      },
      {
        target: '[data-tutorial="media-content"]',
        title: "Media Library",
        description: "Browse your files. Click any item to preview, rename, or move it.",
        placement: "left",
      },
    ],
  },

  // ── People / Members ───────────────────────────────────────────────
  people: {
    id: "people",
    steps: [
      {
        target: '[data-tutorial="ppl-toolbar"]',
        title: "Add Members",
        description: "Add members one by one or import from a CSV file.",
        placement: "bottom",
      },
      {
        target: '[data-tutorial="ppl-table"]',
        title: "Members Directory",
        description: "View and manage profiles. Click a row for details. More features coming soon.",
        placement: "top",
      },
    ],
  },

  // ── Website (Pages list) ───────────────────────────────────────────
  website: {
    id: "website",
    steps: [
      {
        target: '[data-tutorial="web-toolbar"]',
        title: "Website Pages",
        description: "Manage your site's pages. The full drag-and-drop builder is coming soon.",
        placement: "bottom",
      },
    ],
  },
}
