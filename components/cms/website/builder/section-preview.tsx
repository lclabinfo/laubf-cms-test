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
} from "lucide-react"
import type { SectionType } from "@/lib/db/types"

/**
 * Section type labels - reused from section-picker-dialog.tsx
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
  EVENTS_HERO: "min-h-[280px]",
  MINISTRY_HERO: "min-h-[280px]",
  NAVBAR: "min-h-[64px]",
  FOOTER: "min-h-[200px]",
  ALL_MESSAGES: "min-h-[400px]",
  ALL_EVENTS: "min-h-[400px]",
  ALL_BIBLE_STUDIES: "min-h-[400px]",
  ALL_VIDEOS: "min-h-[400px]",
}

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

  // Try to extract key content fields for richer preview
  const heading =
    (content?.heading as string) ||
    (content?.heading as { line1?: string })?.line1 ||
    (content?.title as string) ||
    ""
  const subheading =
    (content?.subheading as string) ||
    (content?.subtitle as string) ||
    (content?.description as string) ||
    ""
  const backgroundImage =
    (content?.backgroundImage as { src?: string })?.src ||
    (content?.backgroundImage as string) ||
    (content?.imageUrl as string) ||
    ""

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 transition-colors",
        heightClass,
        isDark
          ? "bg-slate-900 text-white"
          : "bg-white text-slate-900",
      )}
      style={
        backgroundImage
          ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              color: "white",
            }
          : undefined
      }
    >
      {/* Content preview */}
      <div className="flex flex-col items-center gap-2 px-8 text-center max-w-2xl">
        <div className="flex items-center gap-2 opacity-60">
          <Icon className="size-4" />
          <span className="text-xs font-medium uppercase tracking-wider">
            {displayLabel}
          </span>
        </div>
        {heading && (
          <h3
            className={cn(
              "text-xl font-bold leading-tight",
              backgroundImage ? "text-white" : "",
            )}
          >
            {heading}
          </h3>
        )}
        {subheading && (
          <p
            className={cn(
              "text-sm opacity-70 line-clamp-2",
              backgroundImage ? "text-white/80" : "text-muted-foreground",
            )}
          >
            {subheading}
          </p>
        )}
      </div>

      {/* Content items count indicator */}
      {renderContentIndicator(type, content)}
    </div>
  )
}

function renderContentIndicator(
  type: SectionType,
  content: Record<string, unknown>,
) {
  // Show count of items for list/grid sections
  const items = content?.items || content?.cards || content?.members || content?.questions
  if (Array.isArray(items) && items.length > 0) {
    return (
      <div className="flex gap-1.5 mt-2">
        {items.slice(0, 6).map((_, i) => (
          <div
            key={i}
            className="w-16 h-10 rounded bg-current/5 border border-current/10"
          />
        ))}
        {items.length > 6 && (
          <span className="text-xs opacity-50 self-center ml-1">
            +{items.length - 6} more
          </span>
        )}
      </div>
    )
  }
  return null
}
