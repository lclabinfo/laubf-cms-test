import type { SectionTheme } from "../theme";
import type {
  EventCardData,
  EventListItemData,
  ImageCardData,
  VideoThumbnailData,
} from "./shared";

/* ---- Shared Image (all section image props) ---- */
export interface SectionImage {
  src: string;
  alt: string;
  /** CSS object-position for focal point adjustment (e.g. "center 30%", "top"). Defaults to "center". */
  objectPosition?: string;
}

/* ---- Navbar ---- */
export interface NavbarContent {
  logo: { lightSrc: string; darkSrc: string; alt: string };
  ctaButton: { label: string; href: string; visible: boolean };
  memberLogin: { label: string; href: string; visible: boolean };
}

export interface NavbarSettings extends BaseSectionSettings {
  content: NavbarContent;
}

/* ---- Section Type Registry ---- */
export type SectionType =
  | "hero-banner"
  | "media-text"
  | "highlight-cards"
  | "event-calendar"
  | "recurring-meetings"
  | "quote-banner"
  | "action-card-grid"
  | "directory-list"
  | "spotlight-media"
  | "media-grid"
  | "cta-banner"
  | "footer"
  | "page-hero"
  | "feature-breakdown"
  | "pathway-card"
  | "timeline"
  | "location-detail"
  | "campus-card-grid"
  | "form"
  | "faq"
  | "text-image-hero"
  | "about-description"
  | "pillars"
  | "statement"
  | "ministry-hero"
  | "ministry-intro"
  | "ministry-schedule"
  | "meet-team"
  | "photo-gallery"
  | "upcoming-events"
  | "events-hero"
  | "quick-links"
  | "all-events"
  | "all-messages"
  | "all-videos";

/* ---- Base Settings ---- */
export interface BaseSectionSettings {
  id: string;
  visible: boolean;
  colorScheme: SectionTheme;
  paddingY?: "none" | "compact" | "default" | "spacious";
  containerWidth?: "standard" | "narrow" | "full";
  enableAnimations?: boolean;
}

/* ---- Hero Banner ---- */
export interface HeroBannerContent {
  heading: { line1: string; line2: string };
  subheading: string;
  primaryButton: { label: string; href: string; visible: boolean };
  secondaryButton: { label: string; href: string; visible: boolean };
  backgroundImage: SectionImage;
}

export interface HeroBannerSectionProps extends BaseSectionSettings {
  content: HeroBannerContent;
  showSubheading: boolean;
}

/* ---- Media Text ---- */
export interface MediaTextContent {
  overline: string;
  heading: string;
  body: string;
  button: { label: string; href: string; visible: boolean };
  images: SectionImage[];
  /** Seconds for one full rotation (desktop wheel). Default 40. */
  rotationSpeed?: number;
}

export interface MediaTextSectionProps extends BaseSectionSettings {
  content: MediaTextContent;
}

/* ---- Highlight Cards ---- */
export interface HighlightCardsContent {
  heading: string;
  subheading?: string;
  ctaLabel: string;
  ctaHref: string;
  featuredEvents: EventCardData[];
}

export interface HighlightCardsSectionProps extends BaseSectionSettings {
  content: HighlightCardsContent;
}

/* ---- Event Calendar ---- */
export interface EventCalendarContent {
  heading: string;
  currentMonth: string;
  filters: string[];
  events: EventListItemData[];
  ctaButtons: { label: string; href: string; icon?: boolean }[];
}

export interface EventCalendarSectionProps extends BaseSectionSettings {
  content: EventCalendarContent;
}

/* ---- Quote Banner ---- */
export interface QuoteBannerContent {
  overline: string;
  heading: string;
  verse: { text: string; reference: string };
}

export interface QuoteBannerSectionProps extends BaseSectionSettings {
  content: QuoteBannerContent;
}

/* ---- Action Card Grid ---- */
export interface ActionCardGridContent {
  heading: { line1: string; line2: string; line3: string };
  subheading: string;
  ctaButton?: { label: string; href: string };
  cards: ImageCardData[];
}

export interface ActionCardGridSectionProps extends BaseSectionSettings {
  content: ActionCardGridContent;
}

/* ---- Directory List ---- */
export interface DirectoryItemData {
  id: string;
  name: string;
  active?: boolean;
  href?: string;
}

export interface DirectoryListContent {
  heading: string;
  items: DirectoryItemData[];
  image: SectionImage;
  ctaHeading: string;
  ctaButton: { label: string; href: string };
}

export interface DirectoryListSectionProps extends BaseSectionSettings {
  content: DirectoryListContent;
}

/* ---- Spotlight Media ---- */
export interface SpotlightMediaContent {
  sectionHeading: string;
  sermon: {
    slug?: string;
    title: string;
    speaker: string;
    date: string;
    series?: string;
    thumbnailUrl: string;
    videoUrl?: string;
  };
}

export interface SpotlightMediaSectionProps extends BaseSectionSettings {
  content: SpotlightMediaContent;
}

/* ---- Media Grid ---- */
export interface MediaGridContent {
  heading: string;
  ctaLabel: string;
  ctaHref: string;
  videos: VideoThumbnailData[];
}

export interface MediaGridSectionProps extends BaseSectionSettings {
  content: MediaGridContent;
}

/* ---- CTA Banner ---- */
export interface CTABannerContent {
  overline: string;
  heading: string;
  body: string;
  primaryButton: { label: string; href: string; visible: boolean };
  secondaryButton: { label: string; href: string; visible: boolean };
  backgroundImage?: SectionImage;
}

export interface CTABannerSectionProps extends BaseSectionSettings {
  content: CTABannerContent;
}

/* ---- Footer ---- */
export interface FooterColumn {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}

export interface FooterContent {
  description: string;
  socialLinks: { platform: string; href: string }[];
  columns: FooterColumn[];
  contactInfo: { address: string[]; phone: string; email: string };
}

export interface FooterSectionProps extends BaseSectionSettings {
  content: FooterContent;
}

/* ---- Page Hero (inner pages) ---- */
export interface FloatingImage extends SectionImage {
  width: number;
  height: number;
}

export interface PageHeroContent {
  overline: string;
  heading: string;
  primaryButton: { label: string; href: string; visible: boolean };
  secondaryButton: { label: string; href: string; visible: boolean };
  floatingImages: FloatingImage[];
}

export interface PageHeroSectionProps extends BaseSectionSettings {
  content: PageHeroContent;
}

/* ---- Feature Breakdown ---- */
export interface FeatureBreakdownContent {
  heading: string;
  acronymLines: string[];
  description: string;
  button: { label: string; href: string; visible: boolean };
}

export interface FeatureBreakdownSectionProps extends BaseSectionSettings {
  content: FeatureBreakdownContent;
}

/* ---- Pathway Card ---- */
export interface PathwayCardItem {
  icon: string;
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
  buttonVariant: "primary" | "secondary";
}

export interface PathwayCardContent {
  heading: string;
  description: string;
  cards: PathwayCardItem[];
}

export interface PathwayCardSectionProps extends BaseSectionSettings {
  content: PathwayCardContent;
}

/* ---- Newcomer CTA ---- */
export interface NewcomerContent {
  heading: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
  image?: SectionImage;
}

export interface NewcomerSectionProps extends BaseSectionSettings {
  content: NewcomerContent;
}

/* ---- Timeline ---- */
export interface TimelineItem {
  time: string;
  title: string;
  description: string;
}

export interface TimelineContent {
  overline: string;
  heading: string;
  description?: string;
  videoUrl?: string;
  imageSrc?: string;
  imageAlt?: string;
  items: TimelineItem[];
}

export interface TimelineSectionProps extends BaseSectionSettings {
  content: TimelineContent;
}

/* ---- Location Detail ---- */
export interface LocationDetailContent {
  overline: string;
  timeLabel: string;
  timeValue: string;
  locationLabel: string;
  address: string[];
  directionsUrl: string;
  directionsLabel: string;
  images: SectionImage[];
}

export interface LocationDetailSectionProps extends BaseSectionSettings {
  content: LocationDetailContent;
}

/* ---- Campus Card Grid ---- */
export interface CampusCardItem {
  id: string;
  abbreviation: string;
  fullName: string;
  href?: string;
}

export interface CampusCardGridContent {
  overline?: string;
  heading: string;
  description?: string;
  decorativeImages?: SectionImage[];
  campuses: CampusCardItem[];
  ctaHeading?: string;
  ctaButton?: { label: string; href: string };
}

export interface CampusCardGridSectionProps extends BaseSectionSettings {
  content: CampusCardGridContent;
}

/* ---- Form Section ---- */
export interface FormInterestOption {
  label: string;
  value: string;
}

export interface FormContent {
  overline: string;
  heading: string;
  description: string;
  interestOptions: FormInterestOption[];
  campusOptions: { label: string; value: string }[];
  bibleTeacherLabel: string;
  submitLabel: string;
  successMessage: string;
}

export interface FormSectionProps extends BaseSectionSettings {
  content: FormContent;
}

/* ---- FAQ ---- */
export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQContent {
  heading: string;
  showIcon?: boolean;
  items: FAQItem[];
}

export interface FAQSectionProps extends BaseSectionSettings {
  content: FAQContent;
}

/* ---- Text + Image Hero (inner pages — simple variant) ---- */
export interface TextImageHeroContent {
  overline: string;
  headingLine1: string;
  headingAccent?: string;
  description: string;
  image: SectionImage;
}

export interface TextImageHeroSectionProps extends BaseSectionSettings {
  content: TextImageHeroContent;
  textAlign?: "left" | "center" | "right";
}

/* ---- About Description ---- */
export interface AboutDescriptionContent {
  logoSrc: string;
  heading: string;
  description: string;
  videoUrl?: string;
  videoTitle?: string;
}

export interface AboutDescriptionSectionProps extends BaseSectionSettings {
  content: AboutDescriptionContent;
}

/* ---- Pillars (alternating image/text) ---- */
export interface PillarItem {
  title: string;
  description: string;
  images: SectionImage[];
  button?: { label: string; href: string };
}

export interface PillarsContent {
  overline: string;
  heading: string;
  items: PillarItem[];
}

export interface PillarsSectionProps extends BaseSectionSettings {
  content: PillarsContent;
}

/* ---- Statement (faith / belief) ---- */
export interface StatementParagraph {
  text: string;
  isBold?: boolean;
}

export interface StatementContent {
  overline: string;
  heading: string;
  leadIn: string;
  paragraphs: StatementParagraph[];
  showIcon?: boolean;
}

export interface StatementSectionProps extends BaseSectionSettings {
  content: StatementContent;
}

/* ---- Ministry Hero (ministry subpages) ---- */
export interface MinistryHeroContent {
  overline?: string;
  heading: string;
  headingStyle?: "display" | "sans";
  ctaButton?: { label: string; href: string; visible: boolean };
  socialLinks?: { platform: string; href: string }[];
  heroImage?: SectionImage;
}

export interface MinistryHeroSectionProps extends BaseSectionSettings {
  content: MinistryHeroContent;
}

/* ---- Ministry Intro ---- */
export interface MinistryIntroContent {
  overline: string;
  heading: string;
  description: string;
  image?: SectionImage;
}

export interface MinistryIntroSectionProps extends BaseSectionSettings {
  content: MinistryIntroContent;
}

/* ---- Ministry Schedule ---- */
export interface ScheduleEntry {
  day: string;
  time: string;
  location: string;
}

export interface MinistryScheduleContent {
  heading: string;
  headingStyle?: "sans" | "script";
  description?: string;
  scheduleLabel?: string;
  scheduleEntries?: ScheduleEntry[];
  timeValue?: string;
  address?: string[];
  directionsUrl?: string;
  buttons?: { label: string; href: string; variant: "primary" | "secondary" }[];
  image?: SectionImage;
  logo?: SectionImage;
}

export interface MinistryScheduleSectionProps extends BaseSectionSettings {
  content: MinistryScheduleContent;
}

/* ---- Meet Team ---- */
export interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  image: SectionImage;
}

export interface MeetTeamContent {
  overline?: string;
  heading: string;
  members: TeamMember[];
}

export interface MeetTeamSectionProps extends BaseSectionSettings {
  content: MeetTeamContent;
}

/* ---- Photo Gallery ---- */
export interface PhotoGalleryContent {
  heading: string;
  images: SectionImage[];
}

export interface PhotoGallerySectionProps extends BaseSectionSettings {
  content: PhotoGalleryContent;
}

/* ---- Upcoming Events ---- */
export interface UpcomingEventItem {
  title: string;
  date: string;
  time: string;
  location: string;
  image: SectionImage;
  eventType?: string;
  badge?: string;
  tags?: string[];
}

export interface UpcomingEventsContent {
  overline?: string;
  heading: string;
  ctaButton?: { label: string; href: string };
}

export interface UpcomingEventsSectionProps extends BaseSectionSettings {
  content: UpcomingEventsContent;
}

/* ---- Events Hero (events listing page) ---- */
export interface EventsHeroContent {
  heading: string;
  subtitle: string;
}

export interface EventsHeroSectionProps extends BaseSectionSettings {
  content: EventsHeroContent;
}

/* ---- Quick Links (recurring meetings) ---- */
export interface QuickLinksContent {
  heading: string;
  subtitle?: string;
}

export interface QuickLinksSectionProps extends BaseSectionSettings {
  content: QuickLinksContent;
}

/* ---- Quick Links FAB (floating action button) ---- */
export interface QuickLinksFABItem {
  label: string;
  href: string;
  /** Lucide icon name: "book-open" | "users" | "radio" etc. */
  icon: string;
  description: string;
}

export interface QuickLinksFABContent {
  title: string;
  links: QuickLinksFABItem[];
}

export interface QuickLinksFABSettings {
  visible: boolean;
  content: QuickLinksFABContent;
}

/* ---- Recurring Schedule (weekly meetings) ---- */
export interface WeeklyMeeting {
  title: string;
  description?: string;
  time: string;
  days: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[];
  location?: string;
}

export interface RecurringScheduleContent {
  heading: string;
  subtitle?: string;
  meetings: WeeklyMeeting[];
}

export interface RecurringScheduleSectionProps extends BaseSectionSettings {
  content: RecurringScheduleContent;
}

/* ---- Recurring Meetings ---- */
export interface RecurringMeetingsContent {
  heading: string;
  /** Max items to show before "View all" overflow. Default 4. */
  maxVisible?: number;
  /** URL for "View all" link. Default "/events" */
  viewAllHref?: string;
}

export interface RecurringMeetingsSectionProps extends BaseSectionSettings {
  content: RecurringMeetingsContent;
}

/* ---- All Events (filterable grid) ---- */
export interface AllEventsContent {
  heading: string;
}

export interface AllEventsSectionProps extends BaseSectionSettings {
  content: AllEventsContent;
}

/* ---- Bible Study Hero ---- */
export interface BibleStudyHeroContent {
  heading: string;
  subtitle: string;
}

export interface BibleStudyHeroSectionProps extends BaseSectionSettings {
  content: BibleStudyHeroContent;
}

/* ---- All Bible Studies (filterable grid with tabs) ---- */
export interface AllBibleStudiesContent {
  heading: string;
}

export interface AllBibleStudiesSectionProps extends BaseSectionSettings {
  content: AllBibleStudiesContent;
}

/* ---- All Messages (filterable grid with tabs) ---- */
export interface AllMessagesContent {
  heading: string;
}

export interface AllMessagesSectionProps extends BaseSectionSettings {
  content: AllMessagesContent;
}

/* ---- All Videos (filterable grid) ---- */
export interface AllVideosContent {
  heading: string;
}

export interface AllVideosSectionProps extends BaseSectionSettings {
  content: AllVideosContent;
}
