"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Database } from "lucide-react"
import type { SectionType } from "@/lib/db/types"

interface DataSectionEditorProps {
  sectionType: SectionType
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

const DATA_SOURCE_LABELS: Partial<Record<SectionType, string>> = {
  ALL_MESSAGES: "Messages from the CMS Messages module",
  ALL_EVENTS: "Events from the CMS Events module",
  ALL_BIBLE_STUDIES: "Bible studies from the CMS Bible Studies module",
  ALL_VIDEOS: "Videos from the CMS Media module",
  UPCOMING_EVENTS: "Upcoming events from the CMS Events module",
  EVENT_CALENDAR: "Events displayed in calendar format from the CMS Events module",
  RECURRING_MEETINGS: "Recurring meeting times from the CMS Events module",
  RECURRING_SCHEDULE: "Recurring schedule from the CMS Events module",
}

function DataSourceBanner({ sectionType }: { sectionType: SectionType }) {
  const description =
    DATA_SOURCE_LABELS[sectionType] ?? "Data loaded from the CMS database"

  return (
    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
      <Database className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
          Data-Driven Section
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          {description}. Content is automatically populated from your CMS data.
          You can customize the section heading and display options below.
        </p>
      </div>
    </div>
  )
}

export function DataSectionEditor({
  sectionType,
  content,
  onChange,
}: DataSectionEditorProps) {
  const heading = (content.heading as string) ?? ""

  // Some data sections have additional configurable fields
  const ctaLabel = (content.ctaLabel as string) ?? ""
  const ctaHref = (content.ctaHref as string) ?? ""

  const hasCtaFields = [
    "ALL_MESSAGES",
    "ALL_EVENTS",
    "ALL_BIBLE_STUDIES",
    "ALL_VIDEOS",
    "MEDIA_GRID",
  ].includes(sectionType)

  return (
    <div className="space-y-6">
      <DataSourceBanner sectionType={sectionType} />

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Section Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Section heading"
        />
      </div>

      {hasCtaFields && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              CTA Label (optional)
            </Label>
            <Input
              value={ctaLabel}
              onChange={(e) =>
                onChange({ ...content, ctaLabel: e.target.value })
              }
              placeholder="View All"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              CTA Link (optional)
            </Label>
            <Input
              value={ctaHref}
              onChange={(e) =>
                onChange({ ...content, ctaHref: e.target.value })
              }
              placeholder="/messages"
            />
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        The data displayed in this section is managed through the CMS content
        modules. To add or edit the underlying content, use the relevant CMS
        section (Messages, Events, Bible Studies, etc.).
      </p>
    </div>
  )
}
