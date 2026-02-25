"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
  MEDIA_GRID: "Videos from the CMS Media module",
  QUICK_LINKS: "Quick links populated from recurring meetings",
  DAILY_BREAD_FEATURE: "Daily devotional content",
  SPOTLIGHT_MEDIA: "Latest sermon from the CMS Messages module",
  HIGHLIGHT_CARDS: "Featured events from the CMS Events module",
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

// --- Simple heading-only sections (ALL_MESSAGES, ALL_EVENTS, ALL_BIBLE_STUDIES, ALL_VIDEOS) ---

function SimpleDataEditor({
  content,
  onChange,
  ctaLabelPlaceholder,
  ctaHrefPlaceholder,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
  ctaLabelPlaceholder?: string
  ctaHrefPlaceholder?: string
}) {
  const heading = (content.heading as string) ?? ""
  const ctaLabel = (content.ctaLabel as string) ?? ""
  const ctaHref = (content.ctaHref as string) ?? ""

  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Section Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Section heading"
        />
      </div>

      {(ctaLabelPlaceholder || ctaHrefPlaceholder) && (
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
              placeholder={ctaLabelPlaceholder ?? "View All"}
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
              placeholder={ctaHrefPlaceholder ?? "/page"}
            />
          </div>
        </div>
      )}
    </>
  )
}

// --- Upcoming Events ---

function UpcomingEventsEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const overline = (content.overline as string) ?? ""
  const heading = (content.heading as string) ?? ""
  const ctaButton = (content.ctaButton as {
    label: string
    href: string
  }) ?? { label: "", href: "" }

  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Overline</Label>
        <Input
          value={overline}
          onChange={(e) => onChange({ ...content, overline: e.target.value })}
          placeholder="What's Coming Up"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Section Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Upcoming Events"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">CTA Button</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Button Label
            </Label>
            <Input
              value={ctaButton.label}
              onChange={(e) =>
                onChange({
                  ...content,
                  ctaButton: { ...ctaButton, label: e.target.value },
                })
              }
              placeholder="View All Events"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Button Link
            </Label>
            <Input
              value={ctaButton.href}
              onChange={(e) =>
                onChange({
                  ...content,
                  ctaButton: { ...ctaButton, href: e.target.value },
                })
              }
              placeholder="/events"
            />
          </div>
        </div>
      </div>
    </>
  )
}

// --- Event Calendar ---

function EventCalendarEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const heading = (content.heading as string) ?? ""

  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Section Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Schedule"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        CTA buttons for the calendar header are configured in the JSON content.
      </p>
    </>
  )
}

// --- Recurring Meetings ---

function RecurringMeetingsEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const heading = (content.heading as string) ?? ""
  const maxVisible = (content.maxVisible as number) ?? 4
  const viewAllHref = (content.viewAllHref as string) ?? ""

  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Section Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Weekly Meetings"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Max Visible Items
          </Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={maxVisible}
            onChange={(e) =>
              onChange({
                ...content,
                maxVisible: parseInt(e.target.value) || 4,
              })
            }
            placeholder="4"
          />
          <p className="text-xs text-muted-foreground">
            Number of meetings to show before &quot;View All&quot;
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            View All Link
          </Label>
          <Input
            value={viewAllHref}
            onChange={(e) =>
              onChange({ ...content, viewAllHref: e.target.value })
            }
            placeholder="/events"
          />
        </div>
      </div>
    </>
  )
}

// --- Quick Links ---

function QuickLinksEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const heading = (content.heading as string) ?? ""
  const subtitle = (content.subtitle as string) ?? ""

  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Section Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Quick Links"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Subtitle</Label>
        <Input
          value={subtitle}
          onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
          placeholder="Access your most important links at a glance."
        />
      </div>
    </>
  )
}

// --- Daily Bread ---

function DailyBreadEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const heading = (content.heading as string) ?? ""

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">Section Heading</Label>
      <Input
        value={heading}
        onChange={(e) => onChange({ ...content, heading: e.target.value })}
        placeholder="Daily Bread"
      />
    </div>
  )
}

// --- Main export ---

export function DataSectionEditor({
  sectionType,
  content,
  onChange,
}: DataSectionEditorProps) {
  return (
    <div className="space-y-6">
      <DataSourceBanner sectionType={sectionType} />

      {sectionType === "UPCOMING_EVENTS" && (
        <UpcomingEventsEditor content={content} onChange={onChange} />
      )}

      {sectionType === "EVENT_CALENDAR" && (
        <EventCalendarEditor content={content} onChange={onChange} />
      )}

      {sectionType === "RECURRING_MEETINGS" && (
        <RecurringMeetingsEditor content={content} onChange={onChange} />
      )}

      {sectionType === "QUICK_LINKS" && (
        <QuickLinksEditor content={content} onChange={onChange} />
      )}

      {sectionType === "DAILY_BREAD_FEATURE" && (
        <DailyBreadEditor content={content} onChange={onChange} />
      )}

      {sectionType === "ALL_MESSAGES" && (
        <SimpleDataEditor
          content={content}
          onChange={onChange}
          ctaLabelPlaceholder="View All"
          ctaHrefPlaceholder="/messages"
        />
      )}

      {sectionType === "ALL_EVENTS" && (
        <SimpleDataEditor
          content={content}
          onChange={onChange}
          ctaLabelPlaceholder="View All"
          ctaHrefPlaceholder="/events"
        />
      )}

      {sectionType === "ALL_BIBLE_STUDIES" && (
        <SimpleDataEditor
          content={content}
          onChange={onChange}
          ctaLabelPlaceholder="View All"
          ctaHrefPlaceholder="/bible-study"
        />
      )}

      {sectionType === "ALL_VIDEOS" && (
        <SimpleDataEditor
          content={content}
          onChange={onChange}
          ctaLabelPlaceholder="View All"
          ctaHrefPlaceholder="/videos"
        />
      )}

      {sectionType === "MEDIA_GRID" && (
        <SimpleDataEditor
          content={content}
          onChange={onChange}
          ctaLabelPlaceholder="View All"
          ctaHrefPlaceholder="/videos"
        />
      )}

      <p className="text-xs text-muted-foreground">
        The data displayed in this section is managed through the CMS content
        modules. To add or edit the underlying content, use the relevant CMS
        section (Messages, Events, Bible Studies, etc.).
      </p>
    </div>
  )
}
