"use client"

import { cn } from "@/lib/utils"
import {
  Layout,
  FileText,
  Image as ImageIcon,
  Grid3X3,
  List,
  Users,
  MessageSquare,
  Calendar,
  Video,
  BookOpen,
  MapPin,
  Star,
  Zap,
  Type,
  Quote,
  HelpCircle,
  Clock,
  Globe,
  Code,
  Link,
  Menu,
  Database,
  ExternalLink,
  ArrowRight,
} from "lucide-react"
import NextLink from "next/link"
import type { SectionType } from "@/lib/db/types"

/**
 * Safely extract a display string from a content field that may be
 * a plain string, an object with line1/line2, or something else entirely.
 */
function extractString(value: unknown): string {
  if (typeof value === "string") return value
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>
    // Handle {line1, line2, line3} heading pattern
    if (typeof obj.line1 === "string") {
      return [obj.line1, obj.line2, obj.line3].filter(Boolean).join(" ")
    }
    // Handle {text} pattern
    if (typeof obj.text === "string") return obj.text
  }
  return ""
}

/**
 * Extract button label from various button content shapes.
 */
function extractButton(value: unknown): { label: string; href: string } | null {
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>
    if (typeof obj.label === "string" && obj.visible !== false) {
      return { label: obj.label, href: (obj.href as string) || "#" }
    }
  }
  return null
}

/**
 * Section type labels
 */
const sectionTypeLabels: Record<string, string> = {
  HERO_BANNER: "Hero Banner",
  PAGE_HERO: "Page Hero",
  TEXT_IMAGE_HERO: "Text & Image Hero",
  EVENTS_HERO: "Events Hero",
  MINISTRY_HERO: "Ministry Hero",
  MEDIA_TEXT: "Media & Text",
  MEDIA_GRID: "Media Grid",
  SPOTLIGHT_MEDIA: "Spotlight Media",
  PHOTO_GALLERY: "Photo Gallery",
  QUOTE_BANNER: "Quote Banner",
  CTA_BANNER: "Call to Action",
  ABOUT_DESCRIPTION: "About Description",
  STATEMENT: "Statement",
  ACTION_CARD_GRID: "Action Card Grid",
  HIGHLIGHT_CARDS: "Highlight Cards",
  FEATURE_BREAKDOWN: "Feature Breakdown",
  PATHWAY_CARD: "Pathway Cards",
  PILLARS: "Pillars",
  NEWCOMER: "Newcomer Welcome",
  ALL_MESSAGES: "All Messages",
  ALL_EVENTS: "All Events",
  ALL_BIBLE_STUDIES: "Bible Studies",
  ALL_VIDEOS: "All Videos",
  UPCOMING_EVENTS: "Upcoming Events",
  EVENT_CALENDAR: "Event Calendar",
  RECURRING_MEETINGS: "Recurring Meetings",
  RECURRING_SCHEDULE: "Recurring Schedule",
  MINISTRY_INTRO: "Ministry Intro",
  MINISTRY_SCHEDULE: "Ministry Schedule",
  CAMPUS_CARD_GRID: "Campus Cards",
  DIRECTORY_LIST: "Directory List",
  MEET_TEAM: "Meet the Team",
  LOCATION_DETAIL: "Location Detail",
  FORM_SECTION: "Form",
  FAQ_SECTION: "FAQ",
  TIMELINE_SECTION: "Timeline",
  NAVBAR: "Navigation Bar",
  FOOTER: "Footer",
  DAILY_BREAD_FEATURE: "Daily Bread",
  QUICK_LINKS: "Quick Links",
  CUSTOM_HTML: "Custom HTML",
  CUSTOM_EMBED: "Custom Embed",
}

const sectionIcons: Partial<Record<SectionType, typeof Layout>> = {
  HERO_BANNER: Layout,
  PAGE_HERO: Layout,
  TEXT_IMAGE_HERO: Layout,
  EVENTS_HERO: Calendar,
  MINISTRY_HERO: Star,
  MEDIA_TEXT: FileText,
  MEDIA_GRID: Grid3X3,
  SPOTLIGHT_MEDIA: ImageIcon,
  PHOTO_GALLERY: ImageIcon,
  QUOTE_BANNER: Quote,
  CTA_BANNER: Zap,
  ABOUT_DESCRIPTION: Type,
  STATEMENT: Type,
  ACTION_CARD_GRID: Grid3X3,
  HIGHLIGHT_CARDS: Grid3X3,
  FEATURE_BREAKDOWN: List,
  PATHWAY_CARD: Grid3X3,
  PILLARS: Grid3X3,
  NEWCOMER: Star,
  ALL_MESSAGES: MessageSquare,
  ALL_EVENTS: Calendar,
  ALL_BIBLE_STUDIES: BookOpen,
  ALL_VIDEOS: Video,
  UPCOMING_EVENTS: Calendar,
  EVENT_CALENDAR: Calendar,
  RECURRING_MEETINGS: Clock,
  RECURRING_SCHEDULE: Clock,
  MINISTRY_INTRO: Star,
  MINISTRY_SCHEDULE: Calendar,
  CAMPUS_CARD_GRID: MapPin,
  DIRECTORY_LIST: Users,
  MEET_TEAM: Users,
  LOCATION_DETAIL: MapPin,
  FORM_SECTION: FileText,
  FAQ_SECTION: HelpCircle,
  TIMELINE_SECTION: Clock,
  NAVBAR: Menu,
  FOOTER: Menu,
  QUICK_LINKS: Link,
  CUSTOM_HTML: Code,
  CUSTOM_EMBED: Globe,
}

/** Height classes for preview blocks by category */
const sectionHeights: Partial<Record<SectionType, string>> = {
  HERO_BANNER: "min-h-[320px]",
  PAGE_HERO: "min-h-[200px]",
  TEXT_IMAGE_HERO: "min-h-[280px]",
  EVENTS_HERO: "min-h-[200px]",
  MINISTRY_HERO: "min-h-[280px]",
  NAVBAR: "min-h-[64px]",
  FOOTER: "min-h-[200px]",
  ALL_MESSAGES: "min-h-[300px]",
  ALL_EVENTS: "min-h-[300px]",
  ALL_BIBLE_STUDIES: "min-h-[300px]",
  ALL_VIDEOS: "min-h-[300px]",
  QUOTE_BANNER: "min-h-[240px]",
  CTA_BANNER: "min-h-[240px]",
  SPOTLIGHT_MEDIA: "min-h-[260px]",
}

// ---------------------------------------------------------------------------
// Data-driven section metadata — maps section types to their CMS data sources
// ---------------------------------------------------------------------------

interface DataSourceInfo {
  label: string
  description: string
  cmsPath: string
  icon: typeof Database
}

const DATA_SOURCE_MAP: Partial<Record<SectionType, DataSourceInfo>> = {
  ALL_MESSAGES: {
    label: "Messages",
    description: "Displays all sermon messages from CMS",
    cmsPath: "/cms/messages",
    icon: MessageSquare,
  },
  ALL_EVENTS: {
    label: "Events",
    description: "Displays all events from CMS",
    cmsPath: "/cms/events",
    icon: Calendar,
  },
  ALL_BIBLE_STUDIES: {
    label: "Bible Studies",
    description: "Displays all Bible studies from CMS",
    cmsPath: "/cms/bible-studies",
    icon: BookOpen,
  },
  ALL_VIDEOS: {
    label: "Videos",
    description: "Displays all videos from CMS",
    cmsPath: "/cms/media",
    icon: Video,
  },
  UPCOMING_EVENTS: {
    label: "Events",
    description: "Shows upcoming events from CMS",
    cmsPath: "/cms/events",
    icon: Calendar,
  },
  EVENT_CALENDAR: {
    label: "Events",
    description: "Calendar view of events from CMS",
    cmsPath: "/cms/events",
    icon: Calendar,
  },
  RECURRING_MEETINGS: {
    label: "Events",
    description: "Shows recurring meetings from CMS",
    cmsPath: "/cms/events",
    icon: Clock,
  },
  SPOTLIGHT_MEDIA: {
    label: "Messages",
    description: "Features the latest sermon from CMS",
    cmsPath: "/cms/messages",
    icon: MessageSquare,
  },
  HIGHLIGHT_CARDS: {
    label: "Events",
    description: "Shows featured event cards from CMS",
    cmsPath: "/cms/events",
    icon: Calendar,
  },
  MEDIA_GRID: {
    label: "Videos",
    description: "Shows video grid from CMS",
    cmsPath: "/cms/media",
    icon: Video,
  },
  QUICK_LINKS: {
    label: "Events",
    description: "Shows quick links from CMS events",
    cmsPath: "/cms/events",
    icon: Link,
  },
  DAILY_BREAD_FEATURE: {
    label: "Daily Bread",
    description: "Daily devotional content from CMS",
    cmsPath: "/cms",
    icon: BookOpen,
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SectionPreviewProps {
  type: SectionType
  content: Record<string, unknown>
  colorScheme: string
  label: string | null
}

export function SectionPreview({
  type,
  content,
  colorScheme,
  label,
}: SectionPreviewProps) {
  const Icon = sectionIcons[type] || Layout
  const displayLabel = label || sectionTypeLabels[type] || type
  const heightClass = sectionHeights[type] || "min-h-[160px]"
  const isDark = colorScheme === "DARK"
  const dataSource = DATA_SOURCE_MAP[type]

  // Extract content fields for richer preview
  const heading = extractString(content?.heading) ||
    extractString(content?.title) ||
    extractString(content?.sectionHeading) ||
    ""
  const headingLine1 = extractString(content?.headingLine1) || ""
  const headingAccent = extractString(content?.headingAccent) || ""
  const overline = extractString(content?.overline) || ""
  const subheading = extractString(content?.subheading) ||
    extractString(content?.subtitle) ||
    extractString(content?.description) ||
    ""
  const bodyText = extractString(content?.body) || ""
  const primaryButton = extractButton(content?.primaryButton) ||
    extractButton(content?.ctaButton) ||
    extractButton(content?.button)
  const secondaryButton = extractButton(content?.secondaryButton)

  // Background image extraction
  const backgroundImage =
    (typeof content?.backgroundImage === "object" && content?.backgroundImage !== null
      ? (content.backgroundImage as { src?: string }).src
      : typeof content?.backgroundImage === "string"
        ? content.backgroundImage
        : "") ||
    (typeof content?.heroImage === "object" && content?.heroImage !== null
      ? (content.heroImage as { src?: string }).src
      : "") ||
    (typeof content?.imageUrl === "string" ? content.imageUrl : "") ||
    ""

  // Detect if bg is a video
  const isVideo = backgroundImage.endsWith(".mp4") || backgroundImage.endsWith(".webm")

  // Quote/verse extraction
  const verse = content?.verse as { text?: string; reference?: string } | undefined

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 transition-colors",
        heightClass,
        isDark
          ? "bg-slate-900 text-slate-50"
          : "bg-background text-foreground",
      )}
      style={
        backgroundImage && !isVideo
          ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              color: "white",
            }
          : undefined
      }
    >
      {/* Video background indicator */}
      {isVideo && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 to-slate-900/60 flex items-end justify-start p-3">
          <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
            <Video className="size-3" />
            Video background
          </span>
        </div>
      )}

      {/* CMS Data Source Badge — top-right corner */}
      {dataSource && (
        <div className="absolute top-3 right-3 z-10">
          <NextLink
            href={dataSource.cmsPath}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all",
              "border shadow-sm hover:shadow-md",
              isDark || backgroundImage
                ? "bg-white/10 border-white/20 text-white/90 backdrop-blur-sm hover:bg-white/20"
                : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
            )}
            title={dataSource.description}
          >
            <Database className="size-3 shrink-0" />
            <span>Content from {dataSource.label}</span>
            <ExternalLink className="size-3 shrink-0 opacity-60" />
          </NextLink>
        </div>
      )}

      {/* Content preview */}
      <div className="flex flex-col items-center gap-2 px-8 text-center max-w-2xl z-[1]">
        {/* Section type label */}
        <div className={cn(
          "flex items-center gap-2",
          isDark || backgroundImage ? "opacity-70" : "opacity-50",
        )}>
          <Icon className="size-4" />
          <span className="text-xs font-medium uppercase tracking-wider">
            {displayLabel}
          </span>
        </div>

        {/* Overline */}
        {overline && (
          <span className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.15em]",
            isDark || backgroundImage ? "text-blue-300" : "text-blue-600",
          )}>
            {overline}
          </span>
        )}

        {/* Heading (line1 + accent pattern for TEXT_IMAGE_HERO) */}
        {headingLine1 ? (
          <h3 className={cn(
            "text-xl font-bold leading-tight",
            backgroundImage ? "text-white" : "",
          )}>
            {headingLine1}
            {headingAccent && (
              <span className={cn(
                "block",
                isDark || backgroundImage ? "text-blue-300" : "text-blue-600",
              )}>
                {headingAccent}
              </span>
            )}
          </h3>
        ) : heading ? (
          <h3 className={cn(
            "text-xl font-bold leading-tight",
            backgroundImage ? "text-white" : "",
          )}>
            {heading}
          </h3>
        ) : null}

        {/* Subheading / description */}
        {subheading && (
          <p className={cn(
            "text-sm line-clamp-2",
            backgroundImage || isDark ? "text-white/70" : "text-muted-foreground",
          )}>
            {subheading}
          </p>
        )}

        {/* Body text (for MEDIA_TEXT, CTA_BANNER) */}
        {bodyText && !subheading && (
          <p className={cn(
            "text-sm line-clamp-2",
            backgroundImage || isDark ? "text-white/70" : "text-muted-foreground",
          )}>
            {bodyText}
          </p>
        )}

        {/* Quote/Verse (for QUOTE_BANNER) */}
        {verse?.text && (
          <blockquote className={cn(
            "text-sm italic mt-1 line-clamp-3",
            isDark || backgroundImage ? "text-white/80" : "text-muted-foreground",
          )}>
            &ldquo;{verse.text}&rdquo;
            {verse.reference && (
              <cite className={cn(
                "block text-xs not-italic mt-1 font-semibold",
                isDark || backgroundImage ? "text-white/60" : "text-muted-foreground/80",
              )}>
                -- {verse.reference}
              </cite>
            )}
          </blockquote>
        )}

        {/* Button previews */}
        {(primaryButton || secondaryButton) && (
          <div className="flex items-center gap-2 mt-2">
            {primaryButton && (
              <span className={cn(
                "inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium",
                isDark || backgroundImage
                  ? "bg-white text-slate-900"
                  : "bg-slate-900 text-white",
              )}>
                {primaryButton.label}
                <ArrowRight className="size-3" />
              </span>
            )}
            {secondaryButton && (
              <span className={cn(
                "inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium border",
                isDark || backgroundImage
                  ? "border-white/40 text-white"
                  : "border-slate-300 text-slate-700",
              )}>
                {secondaryButton.label}
              </span>
            )}
          </div>
        )}

        {/* Data-driven section placeholder content */}
        {dataSource && !heading && (
          <div className="flex flex-col items-center gap-2 mt-1">
            <dataSource.icon className={cn(
              "size-8",
              isDark ? "text-slate-500" : "text-slate-300",
            )} />
            <span className={cn(
              "text-xs",
              isDark ? "text-slate-400" : "text-muted-foreground",
            )}>
              {dataSource.description}
            </span>
          </div>
        )}
      </div>

      {/* Content items count indicator */}
      {renderContentIndicator(type, content, isDark, !!backgroundImage)}

      {/* Data-driven section — bottom "Edit in CMS" bar */}
      {dataSource && (
        <div className={cn(
          "absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2",
          isDark || backgroundImage
            ? "bg-black/30 backdrop-blur-sm border-t border-white/10"
            : "bg-slate-50 border-t border-slate-200",
        )}>
          <div className="flex items-center gap-2">
            <Database className={cn(
              "size-3.5",
              isDark || backgroundImage ? "text-white/50" : "text-slate-400",
            )} />
            <span className={cn(
              "text-[11px]",
              isDark || backgroundImage ? "text-white/60" : "text-slate-500",
            )}>
              Dynamic content from <span className="font-semibold">{dataSource.label} CMS</span>
            </span>
          </div>
          <NextLink
            href={dataSource.cmsPath}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex items-center gap-1 text-[11px] font-medium transition-colors",
              isDark || backgroundImage
                ? "text-blue-300 hover:text-blue-200"
                : "text-blue-600 hover:text-blue-800",
            )}
          >
            Edit in CMS
            <ExternalLink className="size-3" />
          </NextLink>
        </div>
      )}
    </div>
  )
}

function renderContentIndicator(
  type: SectionType,
  content: Record<string, unknown>,
  isDark: boolean,
  hasBackground: boolean,
) {
  // For data-driven sections with dataSource, show a stylized placeholder grid
  if (content?.dataSource) {
    return (
      <div className="flex gap-2 mt-2 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "w-24 h-16 rounded-lg border-2 border-dashed flex items-center justify-center",
              isDark || hasBackground
                ? "border-white/20 bg-white/5"
                : "border-slate-200 bg-slate-50",
            )}
          >
            <div className={cn(
              "w-8 h-1 rounded-full",
              isDark || hasBackground ? "bg-white/20" : "bg-slate-200",
            )} />
          </div>
        ))}
      </div>
    )
  }

  // Show count of items for list/grid sections
  // Note: campuses and members are handled separately below for richer previews
  const items = content?.items || content?.cards ||
    content?.questions || content?.paragraphs ||
    content?.images || content?.scheduleEntries
  if (Array.isArray(items) && items.length > 0) {
    const maxShow = 6
    return (
      <div className="flex gap-1.5 mt-2">
        {items.slice(0, maxShow).map((item, i) => {
          // Try to show item title if available
          const itemTitle = typeof item === "object" && item !== null
            ? (item as Record<string, unknown>).title ||
              (item as Record<string, unknown>).name ||
              (item as Record<string, unknown>).question ||
              (item as Record<string, unknown>).label
            : null
          return (
            <div
              key={i}
              className={cn(
                "px-2 py-1.5 rounded text-[10px] font-medium truncate max-w-[100px]",
                isDark || hasBackground
                  ? "bg-white/10 text-white/70 border border-white/10"
                  : "bg-slate-100 text-slate-600 border border-slate-200",
              )}
              title={typeof itemTitle === "string" ? itemTitle : undefined}
            >
              {typeof itemTitle === "string" ? itemTitle : `Item ${i + 1}`}
            </div>
          )
        })}
        {items.length > maxShow && (
          <span className={cn(
            "text-[10px] self-center ml-1",
            isDark || hasBackground ? "text-white/40" : "text-slate-400",
          )}>
            +{items.length - maxShow} more
          </span>
        )}
      </div>
    )
  }

  // Show campus count for CAMPUS_CARD_GRID
  if (Array.isArray(content?.campuses) && (content.campuses as unknown[]).length > 0) {
    const campuses = content.campuses as Array<{ abbreviation?: string; fullName?: string }>
    return (
      <div className="flex flex-wrap gap-1 mt-2 justify-center max-w-md">
        {campuses.slice(0, 8).map((c, i) => (
          <span
            key={i}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-medium",
              isDark || hasBackground
                ? "bg-white/10 text-white/70"
                : "bg-slate-100 text-slate-600",
            )}
          >
            {c.abbreviation || c.fullName || `Campus ${i + 1}`}
          </span>
        ))}
        {campuses.length > 8 && (
          <span className={cn(
            "text-[10px] self-center",
            isDark || hasBackground ? "text-white/40" : "text-slate-400",
          )}>
            +{campuses.length - 8}
          </span>
        )}
      </div>
    )
  }

  // Show member count for MEET_TEAM
  if (Array.isArray(content?.members) && (content.members as unknown[]).length > 0) {
    const members = content.members as Array<{ name?: string; role?: string }>
    return (
      <div className="flex gap-2 mt-2">
        {members.slice(0, 4).map((m, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1"
          >
            <div className={cn(
              "size-8 rounded-full flex items-center justify-center text-[10px] font-bold",
              isDark || hasBackground
                ? "bg-white/15 text-white/70"
                : "bg-slate-100 text-slate-500",
            )}>
              {(m.name || "?")[0]}
            </div>
            <span className={cn(
              "text-[9px] truncate max-w-[60px]",
              isDark || hasBackground ? "text-white/50" : "text-slate-400",
            )}>
              {m.name || `Member ${i + 1}`}
            </span>
          </div>
        ))}
        {members.length > 4 && (
          <div className={cn(
            "size-8 rounded-full flex items-center justify-center text-[10px] font-bold self-start",
            isDark || hasBackground
              ? "bg-white/10 text-white/50"
              : "bg-slate-100 text-slate-400",
          )}>
            +{members.length - 4}
          </div>
        )}
      </div>
    )
  }

  return null
}
