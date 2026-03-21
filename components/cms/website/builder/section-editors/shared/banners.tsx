"use client"

import { Database, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SectionType } from "@/lib/db/types"

/** CMS module name + link for each data-driven section type */
const CMS_MODULES: Partial<Record<SectionType, { module: string; href: string }>> = {
  ALL_MESSAGES: { module: "Messages", href: "/cms/messages" },
  ALL_EVENTS: { module: "Events", href: "/cms/events" },
  ALL_BIBLE_STUDIES: { module: "Bible Studies", href: "/cms/bible-studies" },
  ALL_VIDEOS: { module: "Media", href: "/cms/media" },
  UPCOMING_EVENTS: { module: "Events", href: "/cms/events" },
  EVENT_CALENDAR: { module: "Events", href: "/cms/events" },
  RECURRING_MEETINGS: { module: "Events", href: "/cms/events" },
  RECURRING_SCHEDULE: { module: "Events", href: "/cms/events" },
  MEDIA_GRID: { module: "Media", href: "/cms/media" },
  QUICK_LINKS: { module: "Events", href: "/cms/events" },
  DAILY_BREAD_FEATURE: { module: "Daily Bread", href: "/cms/daily-bread" },
  SPOTLIGHT_MEDIA: { module: "Messages", href: "/cms/messages" },
  HIGHLIGHT_CARDS: { module: "Events", href: "/cms/events" },
  MEET_TEAM: { module: "People", href: "/cms/people" },
  DIRECTORY_LIST: { module: "People", href: "/cms/people" },
  CAMPUS_CARD_GRID: { module: "Campuses", href: "/cms/people/ministries" },
}

export interface DataDrivenBannerProps {
  sectionType?: SectionType
}

export function DataDrivenBanner({ sectionType }: DataDrivenBannerProps) {
  const cmsModule = sectionType ? CMS_MODULES[sectionType] : null

  return (
    <div className="rounded-lg border border-blue-500/20 bg-blue-950/30 p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-blue-200">
          Data-Driven Section
        </p>
        {cmsModule && (
          <div className="flex items-center gap-1.5 text-[11px] text-blue-300/70">
            <Database className="size-3" />
            <span>CMS</span>
            <span className="text-blue-300/40">/</span>
            <span className="text-blue-200 font-medium">{cmsModule.module}</span>
          </div>
        )}
      </div>
      {cmsModule && (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs border-blue-500/20 text-blue-200 hover:bg-blue-900/40 hover:text-blue-100"
          asChild
        >
          <a href={cmsModule.href} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3 mr-1.5" />
            Manage {cmsModule.module}
          </a>
        </Button>
      )}
    </div>
  )
}
