"use client"

import type { SectionType } from "@/lib/db/types"
import { HeroEditor } from "./hero-editor"
import { ContentEditor } from "./content-editor"
import { CardsEditor } from "./cards-editor"
import { DataSectionEditor } from "./data-section-editor"
import { FAQEditor } from "./faq-editor"
import { CustomEditor } from "./custom-editor"
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

// Hero section types
const HERO_TYPES: SectionType[] = [
  "HERO_BANNER",
  "PAGE_HERO",
  "TEXT_IMAGE_HERO",
  "EVENTS_HERO",
  "MINISTRY_HERO",
]

// Content section types
const CONTENT_TYPES: SectionType[] = [
  "MEDIA_TEXT",
  "QUOTE_BANNER",
  "CTA_BANNER",
  "ABOUT_DESCRIPTION",
  "STATEMENT",
  "SPOTLIGHT_MEDIA",
]

// Cards section types
const CARDS_TYPES: SectionType[] = [
  "ACTION_CARD_GRID",
  "HIGHLIGHT_CARDS",
  "FEATURE_BREAKDOWN",
  "PATHWAY_CARD",
  "PILLARS",
  "NEWCOMER",
]

// Data-driven section types
const DATA_TYPES: SectionType[] = [
  "ALL_MESSAGES",
  "ALL_EVENTS",
  "ALL_BIBLE_STUDIES",
  "ALL_VIDEOS",
  "UPCOMING_EVENTS",
  "EVENT_CALENDAR",
  "RECURRING_MEETINGS",
  "RECURRING_SCHEDULE",
  "MEDIA_GRID",
]

// Custom section types
const CUSTOM_TYPES: SectionType[] = ["CUSTOM_HTML", "CUSTOM_EMBED"]

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
  // Heroes
  if (HERO_TYPES.includes(sectionType)) {
    return (
      <HeroEditor
        sectionType={sectionType}
        content={content}
        onChange={onChange}
      />
    )
  }

  // Content
  if (CONTENT_TYPES.includes(sectionType)) {
    return (
      <ContentEditor
        sectionType={sectionType}
        content={content}
        onChange={onChange}
      />
    )
  }

  // Cards
  if (CARDS_TYPES.includes(sectionType)) {
    return (
      <CardsEditor
        sectionType={sectionType}
        content={content}
        onChange={onChange}
      />
    )
  }

  // Data-driven
  if (DATA_TYPES.includes(sectionType)) {
    return (
      <DataSectionEditor
        sectionType={sectionType}
        content={content}
        onChange={onChange}
      />
    )
  }

  // FAQ
  if (sectionType === "FAQ_SECTION") {
    return <FAQEditor content={content} onChange={onChange} />
  }

  // Custom HTML / Embed
  if (CUSTOM_TYPES.includes(sectionType)) {
    return (
      <CustomEditor
        sectionType={sectionType}
        content={content}
        onChange={onChange}
      />
    )
  }

  // Fallback: raw JSON editor
  return <JsonEditor content={content} onChange={onChange} />
}

/**
 * Returns true if the given section type has a dedicated
 * structured editor (not just the JSON fallback).
 */
export function hasStructuredEditor(sectionType: SectionType): boolean {
  return (
    HERO_TYPES.includes(sectionType) ||
    CONTENT_TYPES.includes(sectionType) ||
    CARDS_TYPES.includes(sectionType) ||
    DATA_TYPES.includes(sectionType) ||
    CUSTOM_TYPES.includes(sectionType) ||
    sectionType === "FAQ_SECTION"
  )
}
