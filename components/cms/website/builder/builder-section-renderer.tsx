"use client"

/**
 * Builder-safe section renderer.
 *
 * Renders real website section components in the builder canvas.
 * Unlike the website registry (which includes async Server Components),
 * this only imports client-safe components. Server-only sections
 * (ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES) use their client
 * counterparts with pre-resolved data.
 */

import type { SectionType, ColorScheme, PaddingSize, ContainerWidth } from "@/lib/db/types"

// Client-safe section components (no server-side imports)
import HeroBannerSection from "@/components/website/sections/hero-banner"
import MediaTextSection from "@/components/website/sections/media-text"
import SpotlightMediaSection from "@/components/website/sections/spotlight-media"
import CTABannerSection from "@/components/website/sections/cta-banner"
import PageHeroSection from "@/components/website/sections/page-hero"
import TextImageHeroSection from "@/components/website/sections/text-image-hero"
import EventsHeroSection from "@/components/website/sections/events-hero"
import MinistryHeroSection from "@/components/website/sections/ministry-hero"
import MediaGridSection from "@/components/website/sections/media-grid"
import PhotoGallerySection from "@/components/website/sections/photo-gallery"
import QuoteBannerSection from "@/components/website/sections/quote-banner"
import AboutDescriptionSection from "@/components/website/sections/about-description"
import StatementSection from "@/components/website/sections/statement"
import ActionCardGridSection from "@/components/website/sections/action-card-grid"
import HighlightCardsSection from "@/components/website/sections/highlight-cards"
import FeatureBreakdownSection from "@/components/website/sections/feature-breakdown"
import PathwayCardSection from "@/components/website/sections/pathway-card"
import PillarsSection from "@/components/website/sections/pillars"
import NewcomerSection from "@/components/website/sections/newcomer"
import AllVideosSection from "@/components/website/sections/all-videos"
import UpcomingEventsSection from "@/components/website/sections/upcoming-events"
import EventCalendarSection from "@/components/website/sections/event-calendar"
import RecurringMeetingsSection from "@/components/website/sections/recurring-meetings"
import RecurringScheduleSection from "@/components/website/sections/recurring-schedule"
import MinistryIntroSection from "@/components/website/sections/ministry-intro"
import MinistryScheduleSection from "@/components/website/sections/ministry-schedule"
import CampusCardGridSection from "@/components/website/sections/campus-card-grid"
import DirectoryListSection from "@/components/website/sections/directory-list"
import MeetTeamSection from "@/components/website/sections/meet-team"
import LocationDetailSection from "@/components/website/sections/location-detail"
import FormSection from "@/components/website/sections/form-section"
import FAQSection from "@/components/website/sections/faq-section"
import TimelineSection from "@/components/website/sections/timeline-section"
import FooterSection from "@/components/website/sections/footer"
import QuickLinksSection from "@/components/website/sections/quick-links"
import DailyBreadFeatureSection from "@/components/website/sections/daily-bread-feature"
import CustomHtmlSection from "@/components/website/sections/custom-html"
import CustomEmbedSection from "@/components/website/sections/custom-embed"

// Client components for server-only sections (pre-resolved data)
import AllMessagesClient from "@/components/website/sections/all-messages-client"
import AllEventsClient from "@/components/website/sections/all-events-client"
import AllBibleStudiesClient from "@/components/website/sections/all-bible-studies-client"

/* eslint-disable @typescript-eslint/no-explicit-any */
const CLIENT_SECTION_COMPONENTS: Partial<Record<SectionType, React.ComponentType<any>>> = {
  HERO_BANNER: HeroBannerSection,
  MEDIA_TEXT: MediaTextSection,
  SPOTLIGHT_MEDIA: SpotlightMediaSection,
  CTA_BANNER: CTABannerSection,
  PAGE_HERO: PageHeroSection,
  TEXT_IMAGE_HERO: TextImageHeroSection,
  EVENTS_HERO: EventsHeroSection,
  MINISTRY_HERO: MinistryHeroSection,
  MEDIA_GRID: MediaGridSection,
  PHOTO_GALLERY: PhotoGallerySection,
  QUOTE_BANNER: QuoteBannerSection,
  ABOUT_DESCRIPTION: AboutDescriptionSection,
  STATEMENT: StatementSection,
  ACTION_CARD_GRID: ActionCardGridSection,
  HIGHLIGHT_CARDS: HighlightCardsSection,
  FEATURE_BREAKDOWN: FeatureBreakdownSection,
  PATHWAY_CARD: PathwayCardSection,
  PILLARS: PillarsSection,
  NEWCOMER: NewcomerSection,
  ALL_VIDEOS: AllVideosSection,
  UPCOMING_EVENTS: UpcomingEventsSection,
  EVENT_CALENDAR: EventCalendarSection,
  RECURRING_MEETINGS: RecurringMeetingsSection,
  RECURRING_SCHEDULE: RecurringScheduleSection,
  MINISTRY_INTRO: MinistryIntroSection,
  MINISTRY_SCHEDULE: MinistryScheduleSection,
  CAMPUS_CARD_GRID: CampusCardGridSection,
  DIRECTORY_LIST: DirectoryListSection,
  MEET_TEAM: MeetTeamSection,
  LOCATION_DETAIL: LocationDetailSection,
  FORM_SECTION: FormSection,
  FAQ_SECTION: FAQSection,
  TIMELINE_SECTION: TimelineSection,
  FOOTER: FooterSection,
  QUICK_LINKS: QuickLinksSection,
  DAILY_BREAD_FEATURE: DailyBreadFeatureSection,
  CUSTOM_HTML: CustomHtmlSection,
  CUSTOM_EMBED: CustomEmbedSection,
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface BuilderSectionRendererProps {
  type: SectionType
  content: Record<string, unknown>
  colorScheme: ColorScheme
  paddingY: PaddingSize
  containerWidth: ContainerWidth
  enableAnimations: boolean
  churchId: string
  resolvedData?: Record<string, unknown>
}

export function BuilderSectionRenderer({
  type,
  content,
  colorScheme,
  paddingY,
  containerWidth,
  enableAnimations,
  churchId,
  resolvedData,
}: BuilderSectionRendererProps) {
  // Async server components — render their client counterparts with resolved data
  if (type === "ALL_MESSAGES") {
    return (
      <AllMessagesClient
        messages={(resolvedData?.messages as any[]) ?? []}
        heading={(content.heading as string) || "Messages"}
      />
    )
  }
  if (type === "ALL_EVENTS") {
    return (
      <AllEventsClient
        events={(resolvedData?.events as any[]) ?? []}
        heading={(content.heading as string) || "Events"}
      />
    )
  }
  if (type === "ALL_BIBLE_STUDIES") {
    return (
      <AllBibleStudiesClient
        studies={(resolvedData?.studies as any[]) ?? []}
        heading={(content.heading as string) || "Bible Studies"}
      />
    )
  }

  // Standard client-safe components
  const Component = CLIENT_SECTION_COMPONENTS[type]
  if (!Component) {
    return (
      <div className="bg-muted/50 border border-dashed border-muted-foreground/20 rounded-lg p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Section: <code className="bg-muted px-1 rounded text-xs">{type}</code>
        </p>
      </div>
    )
  }

  const sectionColorScheme = colorScheme === "DARK" ? "dark" : "light"
  const sectionPaddingY = paddingY?.toLowerCase() as "none" | "compact" | "default" | "spacious"
  const sectionContainerWidth = containerWidth?.toLowerCase() as "standard" | "narrow" | "full"

  return (
    <Component
      content={content}
      churchId={churchId}
      enableAnimations={enableAnimations}
      colorScheme={sectionColorScheme}
      paddingY={sectionPaddingY}
      containerWidth={sectionContainerWidth}
      {...resolvedData}
    />
  )
}
