"use client"

import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { SectionType } from "@/lib/db/types"
import {
  EditorInput,
  EditorToggle,
  EditorSelect,
  EditorButtonGroup,
  TwoColumnGrid,
  DataDrivenBanner,
  ArrayField,
  LinkInput,
} from "./shared"


interface DataSectionEditorProps {
  sectionType: SectionType
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

// --- All Messages Editor (content panel — toolbar feature toggles) ---

function AllMessagesEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const showTabs = (content.showTabs as boolean) ?? true
  const showSearch = (content.showSearch as boolean) ?? true
  const showFilters = (content.showFilters as boolean) ?? true

  return (
    <>
      <EditorToggle
        label="Tabs (All Messages / Series)"
        description="Tab switcher between message list and series view"
        checked={showTabs}
        onCheckedChange={(checked) => onChange({ ...content, showTabs: checked })}
      />

      <EditorToggle
        label="Search Bar"
        description="Search across titles, speakers, and passages"
        checked={showSearch}
        onCheckedChange={(checked) => onChange({ ...content, showSearch: checked })}
      />

      <EditorToggle
        label="Filters"
        description="Series, speaker, year, and date range filters"
        checked={showFilters}
        onCheckedChange={(checked) => onChange({ ...content, showFilters: checked })}
      />
    </>
  )
}

// --- All Messages Layout Editor (registered separately in LAYOUT_EDITORS) ---

export function AllMessagesLayoutEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const columns = (content.columns as { desktop?: number; tablet?: number; mobile?: number }) ?? {}
  const desktopCols = columns.desktop ?? 3
  const tabletCols = columns.tablet ?? 2
  const mobileCols = columns.mobile ?? 1
  const cardGap = (content.cardGap as string) ?? "default"
  const itemsPerPage = (content.itemsPerPage as number) ?? 50

  const showDate = (content.showDate as boolean) ?? true
  const showSeriesPill = (content.showSeriesPill as boolean) ?? true
  const showSpeaker = (content.showSpeaker as boolean) ?? true
  const showPassage = (content.showPassage as boolean) ?? true
  const showDuration = (content.showDuration as boolean) ?? true

  function updateColumns(field: string, value: number) {
    onChange({
      ...content,
      columns: { ...columns, [field]: value },
    })
  }

  return (
    <>
      <EditorButtonGroup
        label="Columns (Desktop)"
        value={String(desktopCols)}
        onChange={(v) => updateColumns("desktop", parseInt(v))}
        options={[
          { value: "2", label: "2" },
          { value: "3", label: "3" },
          { value: "4", label: "4" },
        ]}
        size="sm"
      />

      <TwoColumnGrid>
        <EditorButtonGroup
          label="Tablet"
          value={String(tabletCols)}
          onChange={(v) => updateColumns("tablet", parseInt(v))}
          options={[
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
          ]}
          size="sm"
        />
        <EditorButtonGroup
          label="Mobile"
          value={String(mobileCols)}
          onChange={(v) => updateColumns("mobile", parseInt(v))}
          options={[
            { value: "1", label: "1" },
            { value: "2", label: "2" },
          ]}
          size="sm"
        />
      </TwoColumnGrid>

      <EditorSelect
        label="Card Spacing"
        value={cardGap}
        onValueChange={(v) => onChange({ ...content, cardGap: v })}
        options={[
          { value: "tight", label: "Tight" },
          { value: "default", label: "Default" },
          { value: "spacious", label: "Spacious" },
        ]}
      />

      <EditorInput
        label="Items Per Page"
        value={String(itemsPerPage)}
        onChange={(val) => onChange({ ...content, itemsPerPage: parseInt(val) || 50 })}
        placeholder="50"
        type="number"
        min={6}
        max={100}
      />

      <Separator />

      <Label className="text-sm font-medium">Card Elements</Label>

      <EditorToggle
        label="Date"
        checked={showDate}
        onCheckedChange={(checked) => onChange({ ...content, showDate: checked })}
      />
      <EditorToggle
        label="Series Pill"
        checked={showSeriesPill}
        onCheckedChange={(checked) => onChange({ ...content, showSeriesPill: checked })}
      />
      <EditorToggle
        label="Speaker"
        checked={showSpeaker}
        onCheckedChange={(checked) => onChange({ ...content, showSpeaker: checked })}
      />
      <EditorToggle
        label="Bible Passage"
        checked={showPassage}
        onCheckedChange={(checked) => onChange({ ...content, showPassage: checked })}
      />
      <EditorToggle
        label="Duration Badge"
        checked={showDuration}
        onCheckedChange={(checked) => onChange({ ...content, showDuration: checked })}
      />
    </>
  )
}

// --- Simple heading-only sections (ALL_EVENTS, ALL_BIBLE_STUDIES, ALL_VIDEOS) ---

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
        <>
          <EditorInput
            label="CTA Label (optional)"
            value={ctaLabel}
            onChange={(val) => onChange({ ...content, ctaLabel: val })}
            placeholder={ctaLabelPlaceholder ?? "View All"}
            labelSize="xs"
          />
          <LinkInput
            label="CTA Link (optional)"
            value={ctaHref}
            onChange={(val) => onChange({ ...content, ctaHref: val })}
            placeholder={ctaHrefPlaceholder ?? "/page"}
            labelSize="xs"
          />
        </>
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
  const heading = (content.heading as string) ?? ""
  const ctaButton = (content.ctaButton as {
    label: string
    href: string
  }) ?? { label: "", href: "" }
  const maxCount = (content.maxCount as number) ?? 6
  const includeRecurring = (content.includeRecurring as boolean) ?? false
  const includePast = (content.includePast as boolean) ?? false
  const pastDays = (content.pastDays as number) ?? 14

  return (
    <>
      <EditorInput
        label="Section Heading"
        value={heading}
        onChange={(val) => onChange({ ...content, heading: val })}
        placeholder="Upcoming Events"
      />

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">CTA Button</Label>
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
        <LinkInput
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
      </div>

      <Separator />

      <EditorInput
        label="Max Events"
        value={String(maxCount)}
        onChange={(val) => onChange({ ...content, maxCount: parseInt(val) || 6 })}
        placeholder="6"
        type="number"
        min={1}
        max={20}
        labelSize="xs"
      />

      <EditorToggle
        label="Include Recurring Meetings"
        description="Show recurring meetings (e.g. Bible study, prayer) alongside one-off events."
        checked={includeRecurring}
        onCheckedChange={(checked) => onChange({ ...content, includeRecurring: checked })}
        bordered
      />

      <EditorToggle
        label="Include Past Events"
        description="Show recently ended events."
        checked={includePast}
        onCheckedChange={(checked) => onChange({ ...content, includePast: checked })}
        bordered
      />

      {includePast && (
        <EditorSelect
          label="Past Events Window"
          value={String(pastDays)}
          onValueChange={(val) => onChange({ ...content, pastDays: parseInt(val) })}
          options={[
            { value: "7", label: "Last 7 days" },
            { value: "14", label: "Last 2 weeks" },
            { value: "30", label: "Last 30 days" },
          ]}
          labelSize="xs"
        />
      )}
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
  const ctaButtons = (content.ctaButtons as { label: string; href: string; icon?: boolean }[]) ?? []

  return (
    <>
      <EditorInput
        label="Section Heading"
        value={heading}
        onChange={(val) => onChange({ ...content, heading: val })}
        placeholder="Schedule"
      />

      <Separator />

      <ArrayField
        label="CTA Buttons"
        items={ctaButtons}
        onItemsChange={(updated) => onChange({ ...content, ctaButtons: updated })}
        createItem={() => ({ label: "", href: "", icon: false as boolean | undefined })}
        addLabel="Add Button"
        emptyMessage="No CTA buttons added yet."
        emptyDescription='Click "Add Button" to add a call-to-action below the calendar.'
        reorderable
        maxItems={4}
        renderItem={(item, _index, updateItem) => (
          <div className="space-y-3">
            <EditorInput
              label="Button Label"
              value={item.label}
              onChange={(val) => updateItem({ ...item, label: val })}
              placeholder="View All Events"
              labelSize="xs"
            />
            <LinkInput
              label="Button Link"
              value={item.href}
              onChange={(val) => updateItem({ ...item, href: val })}
              placeholder="/events"
              labelSize="xs"
            />
            <EditorToggle
              label="Show Arrow Icon"
              description="Display an arrow icon on the button (primary style)"
              checked={item.icon ?? false}
              onCheckedChange={(checked) => updateItem({ ...item, icon: checked })}
            />
          </div>
        )}
      />
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

      <EditorInput
        label="CTA Label (optional)"
        value={ctaLabel}
        onChange={(val) => onChange({ ...content, ctaLabel: val })}
        placeholder="View All Events"
        labelSize="xs"
      />
      <LinkInput
        label="CTA Link (optional)"
        value={ctaHref}
        onChange={(val) => onChange({ ...content, ctaHref: val })}
        placeholder="/events"
        labelSize="xs"
      />

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

// --- Spotlight Media (Latest Message) ---

function SpotlightMediaEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const sectionHeading = (content.sectionHeading as string) ?? ""

  return (
    <EditorInput
      label="Section Heading"
      value={sectionHeading}
      onChange={(val) => onChange({ ...content, sectionHeading: val })}
      placeholder="Latest Message"
    />
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
      <DataDrivenBanner sectionType={sectionType} />

      {sectionType === "SPOTLIGHT_MEDIA" && (
        <SpotlightMediaEditor content={content} onChange={onChange} />
      )}

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
        <AllMessagesEditor content={content} onChange={onChange} />
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

    </div>
  )
}
