import type { SectionType } from "@/lib/db/types"

// ---------------------------------------------------------------------------
// Section Catalog – comprehensive data file for the Section Picker Modal
// ---------------------------------------------------------------------------

export type SectionCategory =
  | "heroes"
  | "content"
  | "cards"
  | "data"
  | "ministry"
  | "interactive"
  | "layout"
  | "custom"

export interface SectionCategoryMeta {
  id: SectionCategory
  label: string
  icon: string // Lucide icon name
}

export const SECTION_CATEGORIES: SectionCategoryMeta[] = [
  { id: "heroes", label: "Heroes", icon: "PanelTop" },
  { id: "content", label: "Content", icon: "Type" },
  { id: "cards", label: "Cards & Grids", icon: "LayoutGrid" },
  { id: "data", label: "Lists & Data", icon: "Database" },
  { id: "ministry", label: "Ministry", icon: "Users" },
  { id: "interactive", label: "Interactive", icon: "MousePointerClick" },
  { id: "layout", label: "Layout", icon: "PanelBottom" },
  { id: "custom", label: "Custom", icon: "Code" },
]

export interface SectionCatalogItem {
  type: SectionType
  label: string
  description: string
  icon: string // Lucide icon name
  category: SectionCategory
  isDataDriven: boolean
  defaultContent: Record<string, unknown>
}

export const SECTION_CATALOG: SectionCatalogItem[] = [
  // ---------------------------------------------------------------------------
  // Heroes (5)
  // ---------------------------------------------------------------------------
  {
    type: "HERO_BANNER",
    label: "Hero Banner",
    description:
      "Full-screen banner with heading, subheading, background image or video, and CTA buttons.",
    icon: "Image",
    category: "heroes",
    isDataDriven: false,
    defaultContent: {
      heading: { line1: "Welcome", line2: "to Our Church" },
      subheading: "A place where faith meets community.",
      primaryButton: { label: "Learn More", href: "/about", visible: true },
      secondaryButton: { label: "Visit Us", href: "/visit", visible: true },
      backgroundImage: { src: "", alt: "Hero background" },
    },
  },
  {
    type: "PAGE_HERO",
    label: "Page Hero",
    description:
      "Centered hero with overline label, heading, CTA buttons, and floating orbit images.",
    icon: "Sparkles",
    category: "heroes",
    isDataDriven: false,
    defaultContent: {
      overline: "Welcome",
      heading: "Your Heading Here",
      primaryButton: { label: "Get Started", href: "#", visible: true },
      secondaryButton: { label: "Learn More", href: "#", visible: false },
      floatingImages: [],
    },
  },
  {
    type: "TEXT_IMAGE_HERO",
    label: "Text & Image Hero",
    description:
      "Split layout hero with overline, heading, description text, and a wide image below.",
    icon: "SplitSquareHorizontal",
    category: "heroes",
    isDataDriven: false,
    defaultContent: {
      overline: "Section Label",
      headingLine1: "Your Heading",
      headingAccent: "",
      description: "Add a description to introduce your page or section.",
      image: { src: "", alt: "Hero image" },
      textAlign: "left",
    },
  },
  {
    type: "EVENTS_HERO",
    label: "Events Hero",
    description: "Simple hero with heading and subtitle, designed for event listing pages.",
    icon: "Calendar",
    category: "heroes",
    isDataDriven: false,
    defaultContent: {
      heading: "Events",
      subtitle: "Find out what's happening in our community.",
    },
  },
  {
    type: "MINISTRY_HERO",
    label: "Ministry Hero",
    description:
      "Centered hero with overline, heading, CTA button, social links, and optional banner image.",
    icon: "Heart",
    category: "heroes",
    isDataDriven: false,
    defaultContent: {
      overline: "Ministry Name",
      heading: "Welcome to Our Ministry",
      headingStyle: "display",
      ctaButton: { label: "Join Us", href: "#", visible: true },
      socialLinks: [],
      heroImage: { src: "", alt: "Ministry banner" },
    },
  },

  // ---------------------------------------------------------------------------
  // Content (8)
  // ---------------------------------------------------------------------------
  {
    type: "MEDIA_TEXT",
    label: "Media & Text",
    description:
      "Two-column layout with rotating image carousel and text content with overline, heading, body, and CTA.",
    icon: "Columns2",
    category: "content",
    isDataDriven: false,
    defaultContent: {
      overline: "Section Label",
      heading: "Your Heading Here",
      body: "Add descriptive text about your content here.",
      button: { label: "Learn More", href: "#", visible: true },
      images: [],
    },
  },
  {
    type: "MEDIA_GRID",
    label: "Media Grid",
    description:
      "Grid of video thumbnails with heading and optional CTA link. Supports video modal playback.",
    icon: "Grid3x3",
    category: "content",
    isDataDriven: true,
    defaultContent: {
      heading: "Latest Videos",
      ctaLabel: "View All",
      ctaHref: "/videos",
      videos: [],
    },
  },
  {
    type: "SPOTLIGHT_MEDIA",
    label: "Spotlight Media",
    description:
      "Featured spotlight for a single sermon or media item with large video thumbnail.",
    icon: "PlayCircle",
    category: "content",
    isDataDriven: true,
    defaultContent: {
      sectionHeading: "Latest Message",
      sermon: {
        title: "Message Title",
        speaker: "Speaker Name",
        date: "January 1, 2026",
        series: "Series Name",
        thumbnailUrl: null,
        videoUrl: "",
      },
    },
  },
  {
    type: "PHOTO_GALLERY",
    label: "Photo Gallery",
    description:
      "Infinite horizontal scrolling photo carousel with heading. Auto-scrolls and pauses on hover.",
    icon: "GalleryHorizontalEnd",
    category: "content",
    isDataDriven: false,
    defaultContent: {
      heading: "Gallery",
      images: [],
    },
  },
  {
    type: "QUOTE_BANNER",
    label: "Quote Banner",
    description:
      "Dark-themed banner with overline, script heading, verse text, and reference attribution.",
    icon: "Quote",
    category: "content",
    isDataDriven: false,
    defaultContent: {
      overline: "Scripture",
      heading: "Verse of the Week",
      verse: {
        text: "Add your quote or verse text here.",
        reference: "Book Chapter:Verse",
      },
    },
  },
  {
    type: "CTA_BANNER",
    label: "Call to Action",
    description:
      "Dark full-width banner with overline, heading, body text, and primary/secondary CTA buttons.",
    icon: "Megaphone",
    category: "content",
    isDataDriven: false,
    defaultContent: {
      overline: "Get Involved",
      heading: "Ready to Take the Next Step?",
      body: "Join us and become part of our growing community.",
      primaryButton: { label: "Get Started", href: "#", visible: true },
      secondaryButton: { label: "Learn More", href: "#", visible: false },
      backgroundImage: null,
    },
  },
  {
    type: "ABOUT_DESCRIPTION",
    label: "About Description",
    description:
      "Centered layout with logo, heading, description text, and optional video embed.",
    icon: "Info",
    category: "content",
    isDataDriven: false,
    defaultContent: {
      logoSrc: "",
      heading: "About Us",
      description:
        "Add a description about your organization here.",
      videoUrl: "",
      videoTitle: "",
    },
  },
  {
    type: "STATEMENT",
    label: "Statement",
    description:
      "Two-column scroll-tracked layout with a sticky lead-in and paragraphs that highlight on scroll.",
    icon: "AlignLeft",
    category: "content",
    isDataDriven: false,
    defaultContent: {
      overline: "Our Mission",
      heading: "What We Believe",
      leadIn: "Our Vision",
      showIcon: false,
      paragraphs: [
        { text: "Add your first statement or value here.", isBold: false },
        { text: "Add your second statement or value here.", isBold: false },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Cards & Grids (6)
  // ---------------------------------------------------------------------------
  {
    type: "ACTION_CARD_GRID",
    label: "Action Card Grid",
    description:
      "Left-aligned heading with a 2x2 grid of image cards, each with title, description, and link.",
    icon: "LayoutGrid",
    category: "cards",
    isDataDriven: false,
    defaultContent: {
      heading: { line1: "Get", line2: "Involved", line3: "Today" },
      subheading: "Explore the ways you can connect and grow.",
      ctaButton: { label: "See All", href: "#" },
      cards: [],
    },
  },
  {
    type: "HIGHLIGHT_CARDS",
    label: "Highlight Cards",
    description:
      "Featured event cards in a 1 large + 2 small stacked layout with heading and CTA.",
    icon: "Star",
    category: "cards",
    isDataDriven: true,
    defaultContent: {
      heading: "Upcoming Highlights",
      subheading: "",
      ctaLabel: "View All Events",
      ctaHref: "/events",
      featuredEvents: [],
    },
  },
  {
    type: "FEATURE_BREAKDOWN",
    label: "Feature Breakdown",
    description:
      "Acronym-style breakdown with large first-letter highlights, description text, and CTA button.",
    icon: "ListOrdered",
    category: "cards",
    isDataDriven: false,
    defaultContent: {
      heading: "What We Stand For",
      acronymLines: ["Faith", "Unity", "Love"],
      description: "Describe your organization's core values or features here.",
      button: { label: "Learn More", href: "#", visible: true },
    },
  },
  {
    type: "PATHWAY_CARD",
    label: "Pathway Cards",
    description:
      "Centered heading with icon-based pathway cards, each with title, description, and CTA button.",
    icon: "Signpost",
    category: "cards",
    isDataDriven: false,
    defaultContent: {
      heading: "Your Next Step",
      description: "Choose a pathway that fits where you are.",
      cards: [
        {
          icon: "book-open",
          title: "Bible Study",
          description: "Explore the Word of God together.",
          buttonLabel: "Join a Study",
          buttonHref: "/bible-study",
          buttonVariant: "primary",
        },
      ],
    },
  },
  {
    type: "PILLARS",
    label: "Pillars",
    description:
      "Alternating image-and-text layout showcasing core pillars or values with optional CTAs.",
    icon: "Columns3",
    category: "cards",
    isDataDriven: false,
    defaultContent: {
      overline: "Our Pillars",
      heading: "What Drives Us",
      items: [
        {
          title: "First Pillar",
          description: "Describe this pillar or value.",
          images: [],
          button: { label: "Learn More", href: "#" },
        },
      ],
    },
  },
  {
    type: "NEWCOMER",
    label: "Newcomer Welcome",
    description:
      "Centered welcome section with icon, heading, description, CTA button, and optional image.",
    icon: "UserPlus",
    category: "cards",
    isDataDriven: false,
    defaultContent: {
      heading: "New Here?",
      description: "We would love to meet you! Here is how to get started.",
      buttonLabel: "Plan Your Visit",
      buttonHref: "/visit",
      image: null,
    },
  },

  // ---------------------------------------------------------------------------
  // Lists & Data (8)
  // ---------------------------------------------------------------------------
  {
    type: "ALL_MESSAGES",
    label: "All Messages",
    description:
      "Searchable, sortable grid of all sermon messages with speaker, series, and date.",
    icon: "MessageSquare",
    category: "data",
    isDataDriven: true,
    defaultContent: {
      heading: "Messages",
    },
  },
  {
    type: "ALL_EVENTS",
    label: "All Events",
    description:
      "Full listing of all events with search, filters by type, and pagination.",
    icon: "CalendarDays",
    category: "data",
    isDataDriven: true,
    defaultContent: {
      heading: "Events",
    },
  },
  {
    type: "ALL_BIBLE_STUDIES",
    label: "Bible Studies",
    description:
      "Searchable grid of Bible study materials with passage, series, and resource indicators.",
    icon: "BookOpen",
    category: "data",
    isDataDriven: true,
    defaultContent: {
      heading: "Bible Studies",
    },
  },
  {
    type: "ALL_VIDEOS",
    label: "All Videos",
    description:
      "Searchable video grid with category filter, sort options, and modal playback.",
    icon: "Video",
    category: "data",
    isDataDriven: true,
    defaultContent: {
      heading: "Videos",
    },
  },
  {
    type: "UPCOMING_EVENTS",
    label: "Upcoming Events",
    description:
      "Grid of upcoming events with overline heading, event cards, and CTA button.",
    icon: "CalendarCheck",
    category: "data",
    isDataDriven: true,
    defaultContent: {
      overline: "What's Coming Up",
      heading: "Upcoming Events",
      ctaButton: { label: "View All Events", href: "/events" },
    },
  },
  {
    type: "EVENT_CALENDAR",
    label: "Event Calendar",
    description:
      "Interactive calendar with list/month view toggle, type filters, and month navigation.",
    icon: "CalendarRange",
    category: "data",
    isDataDriven: true,
    defaultContent: {
      heading: "Schedule",
      ctaButtons: [],
    },
  },
  {
    type: "RECURRING_MEETINGS",
    label: "Recurring Meetings",
    description:
      "Styled list of recurring meetings with type pills, schedule, time, and join buttons.",
    icon: "Repeat",
    category: "data",
    isDataDriven: true,
    defaultContent: {
      heading: "Weekly Meetings",
      maxVisible: 4,
      viewAllHref: "/events",
    },
  },
  {
    type: "RECURRING_SCHEDULE",
    label: "Recurring Schedule",
    description:
      "Card grid of weekly meetings showing day-of-week pills, time badges, and locations.",
    icon: "Clock",
    category: "data",
    isDataDriven: false,
    defaultContent: {
      heading: "Weekly Schedule",
      subtitle: "Join us throughout the week.",
      meetings: [
        {
          title: "Sunday Worship",
          description: "Join us for worship and fellowship.",
          time: "10:00 AM",
          days: ["Sun"],
          location: "Main Campus",
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Ministry (6)
  // ---------------------------------------------------------------------------
  {
    type: "MINISTRY_INTRO",
    label: "Ministry Intro",
    description:
      "Ministry introduction with overline, heading, description, and optional side image.",
    icon: "BookHeart",
    category: "ministry",
    isDataDriven: false,
    defaultContent: {
      overline: "About This Ministry",
      heading: "Ministry Name",
      description: "Describe this ministry, its mission, and how people can get involved.",
      image: null,
    },
  },
  {
    type: "MINISTRY_SCHEDULE",
    label: "Ministry Schedule",
    description:
      "Two-column layout with ministry details, schedule entries or image, and CTA buttons.",
    icon: "CalendarClock",
    category: "ministry",
    isDataDriven: false,
    defaultContent: {
      heading: "Meeting Times",
      description: "Join us at our regular meeting times.",
      scheduleEntries: [
        { day: "Sunday", time: "10:00 AM", location: "Main Building" },
      ],
      buttons: [
        { label: "Get Directions", href: "#", variant: "secondary" },
      ],
    },
  },
  {
    type: "CAMPUS_CARD_GRID",
    label: "Campus Cards",
    description:
      "Grid of campus cards with decorative photos, heading, and optional bottom CTA.",
    icon: "Building2",
    category: "ministry",
    isDataDriven: false,
    defaultContent: {
      overline: "Our Locations",
      heading: "Find a Campus",
      description: "We have multiple locations to serve you.",
      campuses: [],
      decorativeImages: [],
    },
  },
  {
    type: "DIRECTORY_LIST",
    label: "Directory List",
    description:
      "Parallax directory of linked items (e.g., campuses) with hover effects and CTA section.",
    icon: "List",
    category: "ministry",
    isDataDriven: false,
    defaultContent: {
      heading: "Our Directory",
      items: [],
      image: { src: "", alt: "Directory image" },
      ctaHeading: "Want to learn more?",
      ctaButton: { label: "Contact Us", href: "/contact" },
    },
  },
  {
    type: "MEET_TEAM",
    label: "Meet the Team",
    description:
      "Team member cards with photo placeholder, name (first + last initial), role, and bio.",
    icon: "UsersRound",
    category: "ministry",
    isDataDriven: false,
    defaultContent: {
      overline: "Our Team",
      heading: "Meet the Team",
      members: [
        {
          name: "John Doe",
          role: "Pastor",
          bio: "",
          image: null,
        },
      ],
    },
  },
  {
    type: "LOCATION_DETAIL",
    label: "Location Detail",
    description:
      "Two-column layout with service time, address, directions CTA, and location image.",
    icon: "MapPin",
    category: "ministry",
    isDataDriven: false,
    defaultContent: {
      overline: "Visit Us",
      timeLabel: "Service Time",
      timeValue: "Sunday 10:00 AM",
      locationLabel: "Address",
      address: ["123 Main Street", "City, State 12345"],
      directionsUrl: "#",
      directionsLabel: "Get Directions",
      images: [],
    },
  },

  // ---------------------------------------------------------------------------
  // Interactive (3)
  // ---------------------------------------------------------------------------
  {
    type: "FORM_SECTION",
    label: "Contact Form",
    description:
      "Contact form with name, email, phone, interest checkboxes, campus selector, and comments.",
    icon: "FileEdit",
    category: "interactive",
    isDataDriven: false,
    defaultContent: {
      overline: "Get In Touch",
      heading: "Contact Us",
      description: "Fill out the form below and we will get back to you.",
      interestOptions: [
        { label: "Visiting", value: "visiting" },
        { label: "Bible Study", value: "bible-study" },
        { label: "Other", value: "other" },
      ],
      campusOptions: [],
      bibleTeacherLabel:
        "I am interested in becoming a Bible teacher.",
      submitLabel: "Submit",
      successMessage: "Thank you! We received your message.",
    },
  },
  {
    type: "FAQ_SECTION",
    label: "FAQ",
    description:
      "Accordion-style FAQ section with expandable question/answer pairs and optional icon.",
    icon: "HelpCircle",
    category: "interactive",
    isDataDriven: false,
    defaultContent: {
      heading: "Frequently Asked Questions",
      showIcon: true,
      items: [
        {
          question: "What time are your services?",
          answer: "Our main service is every Sunday at 10:00 AM.",
        },
        {
          question: "Where are you located?",
          answer: "We are located at 123 Main Street, City, State 12345.",
        },
      ],
    },
  },
  {
    type: "TIMELINE_SECTION",
    label: "Timeline",
    description:
      "Vertical timeline with image or video on the left and chronological items on the right.",
    icon: "GitBranchPlus",
    category: "interactive",
    isDataDriven: false,
    defaultContent: {
      overline: "Sunday Service",
      heading: "What to Expect",
      description: "Here is how our typical Sunday unfolds.",
      items: [
        {
          time: "10:00 AM",
          title: "Welcome & Worship",
          description: "We begin with a time of singing and prayer.",
        },
        {
          time: "10:30 AM",
          title: "Message",
          description: "A sermon based on a passage from the Bible.",
        },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Layout (3)
  // ---------------------------------------------------------------------------
  {
    type: "FOOTER",
    label: "Footer",
    description:
      "Site footer with brand column, navigation links, social icons, and contact information.",
    icon: "PanelBottom",
    category: "layout",
    isDataDriven: false,
    defaultContent: {
      description: "A brief description of your church or organization.",
      socialLinks: [],
      columns: [
        {
          heading: "About",
          links: [
            { label: "Our Story", href: "/about" },
            { label: "Contact", href: "/contact" },
          ],
        },
      ],
      contactInfo: {
        address: ["123 Main Street", "City, State 12345"],
        phone: "(555) 123-4567",
        email: "info@example.com",
      },
    },
  },
  {
    type: "QUICK_LINKS",
    label: "Quick Links",
    description:
      "Horizontal scrolling carousel of meeting cards with type pills, schedules, and join buttons.",
    icon: "Link",
    category: "layout",
    isDataDriven: true,
    defaultContent: {
      heading: "Quick Links",
      subtitle: "Access your most important links at a glance.",
    },
  },
  {
    type: "DAILY_BREAD_FEATURE",
    label: "Daily Bread",
    description:
      "Daily devotional feature section (coming soon).",
    icon: "Wheat",
    category: "layout",
    isDataDriven: true,
    defaultContent: {
      heading: "Daily Bread",
    },
  },

  // ---------------------------------------------------------------------------
  // Custom (2)
  // ---------------------------------------------------------------------------
  {
    type: "CUSTOM_HTML",
    label: "Custom HTML",
    description:
      "Embed raw HTML content directly into the page. Use for custom widgets or integrations.",
    icon: "Code",
    category: "custom",
    isDataDriven: false,
    defaultContent: {
      html: "<div style=\"padding: 2rem; text-align: center;\"><p>Your custom HTML content goes here.</p></div>",
    },
  },
  {
    type: "CUSTOM_EMBED",
    label: "Custom Embed",
    description:
      "Embed external content via URL (YouTube, Google Maps, forms, etc.) in a responsive iframe.",
    icon: "ExternalLink",
    category: "custom",
    isDataDriven: false,
    defaultContent: {
      embedUrl: "",
      title: "Embedded Content",
      aspectRatio: "16/9",
    },
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get a catalog item by SectionType */
export function getCatalogItem(type: SectionType): SectionCatalogItem | undefined {
  return SECTION_CATALOG.find((item) => item.type === type)
}

/** Get all items for a given category */
export function getCatalogItemsByCategory(category: SectionCategory): SectionCatalogItem[] {
  return SECTION_CATALOG.filter((item) => item.category === category)
}

/** Flat map of SectionType -> label for quick lookups */
export const SECTION_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  SECTION_CATALOG.map((item) => [item.type, item.label]),
)
