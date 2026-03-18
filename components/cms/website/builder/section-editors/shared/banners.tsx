"use client"

import { Database } from "lucide-react"
import type { SectionType } from "@/lib/db/types"

const DATA_SOURCE_LABELS: Partial<Record<SectionType, string>> = {
  ALL_MESSAGES: "Messages from the CMS Messages module",
  ALL_EVENTS: "Events from the CMS Events module",
  ALL_BIBLE_STUDIES: "Bible studies from the CMS Bible Studies module",
  ALL_VIDEOS: "Videos from the CMS Media module",
  UPCOMING_EVENTS: "Upcoming events from the CMS Events module",
  EVENT_CALENDAR:
    "Events displayed in calendar format from the CMS Events module",
  RECURRING_MEETINGS: "Recurring meeting times from the CMS Events module",
  MEDIA_GRID: "Videos from the CMS Media module",
  QUICK_LINKS: "Quick links populated from recurring meetings",
  DAILY_BREAD_FEATURE: "Daily devotional content",
  SPOTLIGHT_MEDIA: "Latest sermon from the CMS Messages module",
  HIGHLIGHT_CARDS: "Featured events from the CMS Events module",
}

export interface DataDrivenBannerProps {
  sectionType?: SectionType
  description?: string
}

export function DataDrivenBanner({
  sectionType,
  description,
}: DataDrivenBannerProps) {
  const defaultDescription =
    (sectionType && DATA_SOURCE_LABELS[sectionType]) ?? "Data loaded from the CMS database"

  return (
    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
      <Database className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
          Data-Driven Section
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          {description ?? defaultDescription}. Content is automatically
          populated from your CMS data. You can customize the section heading
          and display options below.
        </p>
      </div>
    </div>
  )
}
