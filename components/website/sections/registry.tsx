import type { SectionType, ColorScheme, PaddingSize, ContainerWidth } from '@/lib/db/types'

// Import migrated section components
import HeroBannerSection from './hero-banner'
import MediaTextSection from './media-text'
import AllMessagesSection from './all-messages'
import AllEventsSection from './all-events'
import SpotlightMediaSection from './spotlight-media'
import CTABannerSection from './cta-banner'

// Hero sections
import PageHeroSection from './page-hero'
import TextImageHeroSection from './text-image-hero'
import EventsHeroSection from './events-hero'
import MinistryHeroSection from './ministry-hero'

// Content sections
import MediaGridSection from './media-grid'
import PhotoGallerySection from './photo-gallery'
import QuoteBannerSection from './quote-banner'
import AboutDescriptionSection from './about-description'
import StatementSection from './statement'

// Card layouts
import ActionCardGridSection from './action-card-grid'
import HighlightCardsSection from './highlight-cards'
import FeatureBreakdownSection from './feature-breakdown'
import PathwayCardSection from './pathway-card'
import PillarsSection from './pillars'
import NewcomerSection from './newcomer'

// Lists & data
import AllBibleStudiesSection from './all-bible-studies'
import AllVideosSection from './all-videos'
import UpcomingEventsSection from './upcoming-events'
import EventCalendarSection from './event-calendar'
import RecurringMeetingsSection from './recurring-meetings'
import RecurringScheduleSection from './recurring-schedule'

// Ministry-specific
import MinistryIntroSection from './ministry-intro'
import MinistryScheduleSection from './ministry-schedule'
import CampusCardGridSection from './campus-card-grid'
import DirectoryListSection from './directory-list'
import MeetTeamSection from './meet-team'
import LocationDetailSection from './location-detail'

// Interactive
import FormSection from './form-section'
import FAQSection from './faq-section'
import TimelineSection from './timeline-section'

// Navigation & layout
import FooterSection from './footer'
import QuickLinksSection from './quick-links'

// Generic / custom
import CustomHtmlSection from './custom-html'
import CustomEmbedSection from './custom-embed'

/**
 * Placeholder component rendered for section types whose real
 * implementation has not yet been migrated.
 */
function PlaceholderSection({ type }: { type: string }) {
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 my-4 text-center">
        <p className="text-yellow-800 text-sm font-medium">
          Section: <code className="bg-yellow-100 px-1 rounded">{type}</code>
        </p>
        <p className="text-yellow-600 text-xs mt-1">
          This section component has not been migrated yet.
        </p>
      </div>
    )
  }
  return null
}

function placeholder(type: string) {
  function Placeholder() {
    return <PlaceholderSection type={type} />
  }
  Placeholder.displayName = `Placeholder_${type}`
  return Placeholder
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const SECTION_COMPONENTS: Record<SectionType, React.ComponentType<any>> = {
  // Batch 1: Previously migrated (6)
  HERO_BANNER: HeroBannerSection,
  MEDIA_TEXT: MediaTextSection,
  ALL_MESSAGES: AllMessagesSection,
  ALL_EVENTS: AllEventsSection,
  SPOTLIGHT_MEDIA: SpotlightMediaSection,
  CTA_BANNER: CTABannerSection,

  // Hero sections (4)
  PAGE_HERO: PageHeroSection,
  TEXT_IMAGE_HERO: TextImageHeroSection,
  EVENTS_HERO: EventsHeroSection,
  MINISTRY_HERO: MinistryHeroSection,

  // Content sections (5)
  MEDIA_GRID: MediaGridSection,
  PHOTO_GALLERY: PhotoGallerySection,
  QUOTE_BANNER: QuoteBannerSection,
  ABOUT_DESCRIPTION: AboutDescriptionSection,
  STATEMENT: StatementSection,

  // Card layouts (6)
  ACTION_CARD_GRID: ActionCardGridSection,
  HIGHLIGHT_CARDS: HighlightCardsSection,
  FEATURE_BREAKDOWN: FeatureBreakdownSection,
  PATHWAY_CARD: PathwayCardSection,
  PILLARS: PillarsSection,
  NEWCOMER: NewcomerSection,

  // Lists & data (6)
  ALL_BIBLE_STUDIES: AllBibleStudiesSection,
  ALL_VIDEOS: AllVideosSection,
  UPCOMING_EVENTS: UpcomingEventsSection,
  EVENT_CALENDAR: EventCalendarSection,
  RECURRING_MEETINGS: RecurringMeetingsSection,
  RECURRING_SCHEDULE: RecurringScheduleSection,

  // Ministry-specific (6)
  MINISTRY_INTRO: MinistryIntroSection,
  MINISTRY_SCHEDULE: MinistryScheduleSection,
  CAMPUS_CARD_GRID: CampusCardGridSection,
  DIRECTORY_LIST: DirectoryListSection,
  MEET_TEAM: MeetTeamSection,
  LOCATION_DETAIL: LocationDetailSection,

  // Interactive (3)
  FORM_SECTION: FormSection,
  FAQ_SECTION: FAQSection,
  TIMELINE_SECTION: TimelineSection,

  // Navigation & layout (3)
  NAVBAR: placeholder('NAVBAR'),
  FOOTER: FooterSection,
  QUICK_LINKS: QuickLinksSection,

  // Special (1) — no source implementation exists
  DAILY_BREAD_FEATURE: placeholder('DAILY_BREAD_FEATURE'),

  // Generic / custom (2)
  CUSTOM_HTML: CustomHtmlSection,
  CUSTOM_EMBED: CustomEmbedSection,
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface SectionRendererProps {
  type: SectionType
  content: Record<string, unknown>
  colorScheme: ColorScheme
  paddingY: PaddingSize
  containerWidth: ContainerWidth
  enableAnimations: boolean
  churchId: string
  resolvedData?: Record<string, unknown>
}

export function SectionRenderer({
  type,
  content,
  colorScheme,
  enableAnimations,
  churchId,
  resolvedData,
}: SectionRendererProps) {
  const Component = SECTION_COMPONENTS[type]
  if (!Component) return null

  // Map DB enum values to the component's expected colorScheme format
  const sectionColorScheme = colorScheme === 'DARK' ? 'dark' : 'light'

  return (
    <Component
      content={content}
      churchId={churchId}
      enableAnimations={enableAnimations}
      colorScheme={sectionColorScheme}
      {...resolvedData}
    />
  )
}
