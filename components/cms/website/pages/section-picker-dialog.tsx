"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

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
  MAP_SECTION: "Map",
  GIVING_WIDGET: "Giving Widget",
  CUSTOM_HTML: "Custom HTML",
}

interface SectionCategory {
  label: string
  types: string[]
}

const sectionCategories: SectionCategory[] = [
  {
    label: "Heroes",
    types: ["HERO_BANNER", "PAGE_HERO", "TEXT_IMAGE_HERO", "EVENTS_HERO", "MINISTRY_HERO"],
  },
  {
    label: "Content",
    types: ["MEDIA_TEXT", "MEDIA_GRID", "SPOTLIGHT_MEDIA", "PHOTO_GALLERY", "QUOTE_BANNER", "CTA_BANNER", "ABOUT_DESCRIPTION", "STATEMENT"],
  },
  {
    label: "Cards & Grids",
    types: ["ACTION_CARD_GRID", "HIGHLIGHT_CARDS", "FEATURE_BREAKDOWN", "PATHWAY_CARD", "PILLARS", "NEWCOMER"],
  },
  {
    label: "Lists & Data",
    types: ["ALL_MESSAGES", "ALL_EVENTS", "ALL_BIBLE_STUDIES", "ALL_VIDEOS", "UPCOMING_EVENTS", "EVENT_CALENDAR", "RECURRING_MEETINGS", "RECURRING_SCHEDULE"],
  },
  {
    label: "Ministry",
    types: ["MINISTRY_INTRO", "MINISTRY_SCHEDULE", "CAMPUS_CARD_GRID", "DIRECTORY_LIST", "MEET_TEAM", "LOCATION_DETAIL"],
  },
  {
    label: "Interactive",
    types: ["FORM_SECTION", "FAQ_SECTION", "TIMELINE_SECTION", "DAILY_BREAD_FEATURE"],
  },
  {
    label: "Layout",
    types: ["NAVBAR", "FOOTER", "CUSTOM_HTML"],
  },
]

interface SectionPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (sectionType: string) => void
}

export function SectionPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: SectionPickerDialogProps) {
  function handleSelect(sectionType: string) {
    onSelect(sectionType)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
          <DialogDescription>
            Choose a section type to add to your page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {sectionCategories.map((category) => (
            <div key={category.label} className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {category.label}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {category.types.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleSelect(type)}
                    className={cn(
                      "rounded-lg border border-border bg-card p-3 text-left text-sm font-medium",
                      "hover:bg-accent hover:text-accent-foreground transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    {sectionTypeLabels[type] ?? type}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { sectionTypeLabels }
