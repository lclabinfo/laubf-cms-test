"use client"

import type { SectionType } from "@/lib/db/types"

// Hero editors
import {
  HeroBannerEditor,
  PageHeroEditor,
  TextImageHeroEditor,
  EventsHeroEditor,
  MinistryHeroEditor,
} from "./hero-editor"

// Content editors
import {
  MediaTextEditor,
  QuoteBannerEditor,
  CTABannerEditor,
  AboutDescriptionEditor,
  StatementEditor,
  SpotlightMediaEditor,
} from "./content-editor"

// Cards editors
import {
  ActionCardGridEditor,
  FeatureBreakdownEditor,
  PathwayCardEditor,
  PillarsEditor,
  NewcomerEditor,
} from "./cards-editor"

// Data-driven section editors
import { DataSectionEditor } from "./data-section-editor"

// Ministry editors
import {
  MinistryIntroEditor,
  MinistryScheduleEditor,
  CampusCardGridEditor,
  MeetTeamEditor,
  LocationDetailEditor,
  DirectoryListEditor,
} from "./ministry-editor"

// Custom editors
import { CustomHtmlEditor, CustomEmbedEditor } from "./custom-editor"

// Standalone editors
import { FAQEditor } from "./faq-editor"
import { TimelineEditor } from "./timeline-editor"
import { FormEditor } from "./form-editor"
import { FooterEditor } from "./footer-editor"
import { PhotoGalleryEditor } from "./photo-gallery-editor"
import { ScheduleEditor } from "./schedule-editor"

// Fallback
import { JsonEditor } from "./json-editor"

/**
 * Common props for all section-type-specific editors.
 * Each editor receives the raw content JSON object and emits
 * an updated content JSON via onChange.
 */
export interface SectionEditorProps {
  sectionType: SectionType
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

/**
 * Props for sub-editors that don't need sectionType.
 * Most sub-editors only need content + onChange.
 */
type SubEditorProps = {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

type SubEditorComponent = React.ComponentType<SubEditorProps>

/**
 * Flat registry mapping each SectionType to its editor component.
 * To add a new section editor, add one entry here — no other file changes needed.
 */
const SECTION_EDITORS: Partial<Record<SectionType, SubEditorComponent>> = {
  // Hero sections
  HERO_BANNER: HeroBannerEditor,
  PAGE_HERO: PageHeroEditor,
  TEXT_IMAGE_HERO: TextImageHeroEditor,
  EVENTS_HERO: EventsHeroEditor,
  MINISTRY_HERO: MinistryHeroEditor,

  // Content sections
  MEDIA_TEXT: MediaTextEditor,
  QUOTE_BANNER: QuoteBannerEditor,
  CTA_BANNER: CTABannerEditor,
  ABOUT_DESCRIPTION: AboutDescriptionEditor,
  STATEMENT: StatementEditor,
  SPOTLIGHT_MEDIA: SpotlightMediaEditor,

  // Cards sections
  ACTION_CARD_GRID: ActionCardGridEditor,
  FEATURE_BREAKDOWN: FeatureBreakdownEditor,
  PATHWAY_CARD: PathwayCardEditor,
  PILLARS: PillarsEditor,
  NEWCOMER: NewcomerEditor,

  // Ministry sections
  MINISTRY_INTRO: MinistryIntroEditor,
  MINISTRY_SCHEDULE: MinistryScheduleEditor,
  CAMPUS_CARD_GRID: CampusCardGridEditor,
  MEET_TEAM: MeetTeamEditor,
  LOCATION_DETAIL: LocationDetailEditor,
  DIRECTORY_LIST: DirectoryListEditor,

  // Custom sections
  CUSTOM_HTML: CustomHtmlEditor,
  CUSTOM_EMBED: CustomEmbedEditor,

  // Standalone sections
  FAQ_SECTION: FAQEditor,
  TIMELINE_SECTION: TimelineEditor,
  FORM_SECTION: FormEditor,
  FOOTER: FooterEditor,
  PHOTO_GALLERY: PhotoGalleryEditor,
  RECURRING_SCHEDULE: ScheduleEditor,
}

/**
 * Data-driven section types that use the DataSectionEditor wrapper
 * (adds DataSourceBanner + footer note around the inner editor).
 */
const DATA_SECTION_TYPES: Set<SectionType> = new Set([
  "ALL_MESSAGES",
  "ALL_EVENTS",
  "ALL_BIBLE_STUDIES",
  "ALL_VIDEOS",
  "UPCOMING_EVENTS",
  "EVENT_CALENDAR",
  "RECURRING_MEETINGS",
  "MEDIA_GRID",
  "QUICK_LINKS",
  "DAILY_BREAD_FEATURE",
  "HIGHLIGHT_CARDS",
])

/**
 * Renders the appropriate section editor for a given section type.
 * Falls back to the raw JSON editor for section types that don't
 * have a dedicated editor yet.
 */
export function SectionContentEditor({
  sectionType,
  content,
  onChange,
}: SectionEditorProps) {
  // Data-driven sections use the DataSectionEditor wrapper
  if (DATA_SECTION_TYPES.has(sectionType)) {
    return (
      <DataSectionEditor
        sectionType={sectionType}
        content={content}
        onChange={onChange}
      />
    )
  }

  // Look up the editor in the flat registry
  const Editor = SECTION_EDITORS[sectionType]
  if (Editor) {
    return <Editor content={content} onChange={onChange} />
  }

  // Fallback: raw JSON editor
  return <JsonEditor content={content} onChange={onChange} />
}

/**
 * Returns true if the given section type has a dedicated
 * structured editor (not just the JSON fallback).
 */
export function hasStructuredEditor(sectionType: SectionType): boolean {
  return sectionType in SECTION_EDITORS || DATA_SECTION_TYPES.has(sectionType)
}
