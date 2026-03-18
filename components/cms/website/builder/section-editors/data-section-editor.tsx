"use client"

import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { SectionType } from "@/lib/db/types"
import {
  EditorInput,
  EditorToggle,
  EditorSelect,
  TwoColumnGrid,
  DataDrivenBanner,
  DATA_SOURCE_LABELS,
} from "./shared"

interface DataSectionEditorProps {
  sectionType: SectionType
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
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
      <EditorInput
        label="Section Heading"
        value={heading}
        onChange={(val) => onChange({ ...content, heading: val })}
        placeholder="Section heading"
      />

      {(ctaLabelPlaceholder || ctaHrefPlaceholder) && (
        <TwoColumnGrid>
          <EditorInput
            label="CTA Label (optional)"
            value={ctaLabel}
            onChange={(val) => onChange({ ...content, ctaLabel: val })}
            placeholder={ctaLabelPlaceholder ?? "View All"}
            labelSize="xs"
          />
          <EditorInput
            label="CTA Link (optional)"
            value={ctaHref}
            onChange={(val) => onChange({ ...content, ctaHref: val })}
            placeholder={ctaHrefPlaceholder ?? "/page"}
            labelSize="xs"
          />
        </TwoColumnGrid>
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
      <EditorInput
        label="Overline"
        value={overline}
        onChange={(val) => onChange({ ...content, overline: val })}
        placeholder="What's Coming Up"
      />

      <EditorInput
        label="Section Heading"
        value={heading}
        onChange={(val) => onChange({ ...content, heading: val })}
        placeholder="Upcoming Events"
      />

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">CTA Button</Label>
        <TwoColumnGrid>
          <EditorInput
            label="Button Label"
            value={ctaButton.label}
            onChange={(val) =>
              onChange({
                ...content,
                ctaButton: { ...ctaButton, label: val },
              })
            }
            placeholder="View All Events"
            labelSize="xs"
          />
          <EditorInput
            label="Button Link"
            value={ctaButton.href}
            onChange={(val) =>
              onChange({
                ...content,
                ctaButton: { ...ctaButton, href: val },
              })
            }
            placeholder="/events"
            labelSize="xs"
          />
        </TwoColumnGrid>
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
      <EditorInput
        label="Section Heading"
        value={heading}
        onChange={(val) => onChange({ ...content, heading: val })}
        placeholder="Schedule"
      />

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
      <EditorInput
        label="Section Heading"
        value={heading}
        onChange={(val) => onChange({ ...content, heading: val })}
        placeholder="Weekly Meetings"
      />

      <TwoColumnGrid>
        <EditorInput
          label="Max Visible Items"
          value={String(maxVisible)}
          onChange={(val) =>
            onChange({
              ...content,
              maxVisible: parseInt(val) || 4,
            })
          }
          placeholder="4"
          labelSize="xs"
          type="number"
          min={1}
          max={20}
          description='Number of meetings to show before "View All"'
        />
        <EditorInput
          label="View All Link"
          value={viewAllHref}
          onChange={(val) => onChange({ ...content, viewAllHref: val })}
          placeholder="/events"
          labelSize="xs"
        />
      </TwoColumnGrid>
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
      <EditorInput
        label="Section Heading"
        value={heading}
        onChange={(val) => onChange({ ...content, heading: val })}
        placeholder="Quick Links"
      />

      <EditorInput
        label="Subtitle"
        value={subtitle}
        onChange={(val) => onChange({ ...content, subtitle: val })}
        placeholder="Access your most important links at a glance."
      />
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
    <EditorInput
      label="Section Heading"
      value={heading}
      onChange={(val) => onChange({ ...content, heading: val })}
      placeholder="Daily Bread"
    />
  )
}

// --- Highlight Cards (Featured Events) ---

function HighlightCardsEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const heading = (content.heading as string) ?? ""
  const subheading = (content.subheading as string) ?? ""
  const ctaLabel = (content.ctaLabel as string) ?? ""
  const ctaHref = (content.ctaHref as string) ?? ""
  const count = (content.count as number) ?? 3
  const includeRecurring = (content.includeRecurring as boolean) ?? false
  const autoHidePastFeatured = (content.autoHidePastFeatured as boolean) ?? false
  const showPastEvents = (content.showPastEvents as boolean) ?? true
  const pastEventsWindow = (content.pastEventsWindow as number) ?? 14
  const sortOrder = (content.sortOrder as string) ?? "asc"

  return (
    <>
      <EditorInput
        label="Section Heading"
        value={heading}
        onChange={(val) => onChange({ ...content, heading: val })}
        placeholder="Featured Events"
      />

      <EditorInput
        label="Subheading"
        value={subheading}
        onChange={(val) => onChange({ ...content, subheading: val })}
        placeholder="Highlights of what's happening in our community."
      />

      <Separator />

      <TwoColumnGrid>
        <EditorInput
          label="CTA Label (optional)"
          value={ctaLabel}
          onChange={(val) => onChange({ ...content, ctaLabel: val })}
          placeholder="View All Events"
          labelSize="xs"
        />
        <EditorInput
          label="CTA Link (optional)"
          value={ctaHref}
          onChange={(val) => onChange({ ...content, ctaHref: val })}
          placeholder="/events"
          labelSize="xs"
        />
      </TwoColumnGrid>

      <Separator />

      <EditorInput
        label="Number of Events"
        value={String(count)}
        onChange={(val) =>
          onChange({ ...content, count: parseInt(val) || 3 })
        }
        placeholder="3"
        labelSize="xs"
        type="number"
        min={1}
        max={6}
      />

      <EditorSelect
        label="Sort Order"
        value={sortOrder}
        onValueChange={(val) => onChange({ ...content, sortOrder: val })}
        options={[
          { value: "asc", label: "Upcoming first" },
          { value: "desc", label: "Most recent first" },
        ]}
        labelSize="xs"
      />

      <Separator />

      <EditorToggle
        label="Auto-Hide Past Featured"
        description="Automatically hide manually featured events after they've passed."
        checked={autoHidePastFeatured}
        onCheckedChange={(checked) =>
          onChange({ ...content, autoHidePastFeatured: checked })
        }
        bordered
      />

      <EditorToggle
        label="Include Recurring Meetings"
        description="Show recurring meetings (e.g. Bible study, prayer) alongside one-off events."
        checked={includeRecurring}
        onCheckedChange={(checked) =>
          onChange({ ...content, includeRecurring: checked })
        }
        bordered
      />

      <EditorToggle
        label="Show Past Events"
        description="Include recently ended events in the section."
        checked={showPastEvents}
        onCheckedChange={(checked) =>
          onChange({ ...content, showPastEvents: checked })
        }
        bordered
      />

      {showPastEvents && (
        <EditorSelect
          label="Past Events Window"
          value={String(pastEventsWindow)}
          onValueChange={(val) =>
            onChange({ ...content, pastEventsWindow: parseInt(val) })
          }
          options={[
            { value: "7", label: "Last 7 days" },
            { value: "14", label: "Last 2 weeks" },
            { value: "30", label: "Last 30 days" },
            { value: "60", label: "Last 60 days" },
            { value: "90", label: "Last 90 days" },
            { value: "-1", label: "All past events" },
          ]}
          labelSize="xs"
          className="pl-1"
        />
      )}
    </>
  )
}

// --- Main export ---

export function DataSectionEditor({
  sectionType,
  content,
  onChange,
}: DataSectionEditorProps) {
  const description =
    DATA_SOURCE_LABELS[sectionType] ?? "Data loaded from the CMS database"

  return (
    <div className="space-y-6">
      <DataDrivenBanner sectionType={sectionType} description={description} />

      {sectionType === "HIGHLIGHT_CARDS" && (
        <HighlightCardsEditor content={content} onChange={onChange} />
      )}

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
