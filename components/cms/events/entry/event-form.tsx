"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  CalendarIcon,
  Globe,
  LinkIcon,
  MapPin,
  MessageSquare,
  Plus,
  Repeat,
  Trash2,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { DatePicker } from "@/components/ui/date-picker"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Toggle } from "@/components/ui/toggle"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EventSidebar } from "./event-sidebar"
import { CustomRecurrenceDialog } from "./custom-recurrence-dialog"
import { useEvents } from "@/lib/events-context"
import { statusDisplay } from "@/lib/status"
import type { ContentStatus } from "@/lib/status"
import {
  recurrenceDisplay,
  generateSlug,
  allDays,
  dayLabels,
  type ChurchEvent,
  type EventType,
  type EventLink,
  type LocationType,
  type MinistryTag,
  type CampusTag,
  type Recurrence,
  type RecurrenceEndType,
  type DayOfWeek,
  type CustomRecurrence,
} from "@/lib/events-data"

interface EventFormProps {
  mode: "create" | "edit"
  event?: ChurchEvent
}

const today = new Date().toISOString().slice(0, 10)

const recurrenceOptions: Recurrence[] = [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "weekday",
  "custom",
]

/** Recurrence types that should show the day-of-week picker */
const dayPickerRecurrences: Recurrence[] = ["weekly"]

export function EventForm({ mode, event }: EventFormProps) {
  const router = useRouter()
  const { addEvent, updateEvent } = useEvents()

  // Basic info
  const [title, setTitle] = useState(event?.title ?? "")
  const [slug, setSlug] = useState(event?.slug ?? "")
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [shortDescription, setShortDescription] = useState(event?.shortDescription ?? "")

  // Date & time
  const [startDate, setStartDate] = useState(event?.date ?? today)
  const [endDate, setEndDate] = useState(event?.endDate ?? today)
  const [startTime, setStartTime] = useState(event?.startTime ?? "10:00")
  const [endTime, setEndTime] = useState(event?.endTime ?? "11:00")
  const [recurrence, setRecurrence] = useState<Recurrence>(event?.recurrence ?? "none")
  const [recurrenceDays, setRecurrenceDays] = useState<DayOfWeek[]>(event?.recurrenceDays ?? [])
  const [recurrenceEndType, setRecurrenceEndType] = useState<RecurrenceEndType>(event?.recurrenceEndType ?? "never")
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(event?.recurrenceEndDate ?? "")
  const [customRecurrence, setCustomRecurrence] = useState<CustomRecurrence | undefined>(
    event?.customRecurrence
  )
  const [customRecurrenceOpen, setCustomRecurrenceOpen] = useState(false)

  // Location
  const [locationType, setLocationType] = useState<LocationType>(event?.locationType ?? "in-person")
  const [location, setLocation] = useState(event?.location ?? "")
  const [meetingUrl, setMeetingUrl] = useState(event?.meetingUrl ?? "")

  // Content
  const [description, setDescription] = useState(event?.description ?? "")
  const [welcomeMessage, setWelcomeMessage] = useState(event?.welcomeMessage ?? "")

  // Links
  const [registrationUrl, setRegistrationUrl] = useState(event?.registrationUrl ?? "")
  const [links, setLinks] = useState<EventLink[]>(event?.links ?? [])

  // Sidebar state
  const [status, setStatus] = useState<ContentStatus>(event?.status ?? "draft")
  const [eventType, setEventType] = useState<EventType>(event?.type ?? "event")
  const [ministry, setMinistry] = useState<MinistryTag>(event?.ministry ?? "church-wide")
  const [campus, setCampus] = useState<CampusTag | undefined>(event?.campus)
  const [contacts, setContacts] = useState<string[]>(event?.contacts ?? [])
  const [coverImage, setCoverImage] = useState(event?.coverImage ?? "")
  const [imageAlt, setImageAlt] = useState(event?.imageAlt ?? "")
  const [tags, setTags] = useState<string[]>(event?.tags ?? [])

  const isValid = title.trim().length >= 2 && startDate && startTime && endTime && location.trim()
  const statusConfig = statusDisplay[status]
  const isRecurring = recurrence !== "none"
  const showDayPicker = dayPickerRecurrences.includes(recurrence)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value))
    }
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true)
    setSlug(generateSlug(value))
  }

  function handleRecurrenceChange(value: string) {
    const rec = value as Recurrence
    if (rec === "custom") {
      setCustomRecurrenceOpen(true)
      return
    }
    setRecurrence(rec)
    setCustomRecurrence(undefined)

    // Auto-set recurrence days for weekday preset
    if (rec === "weekday") {
      setRecurrenceDays(["mon", "tue", "wed", "thu", "fri"])
    } else if (rec === "daily") {
      setRecurrenceDays(["sun", "mon", "tue", "wed", "thu", "fri", "sat"])
    } else if (rec === "none") {
      setRecurrenceDays([])
      setRecurrenceEndType("never")
      setRecurrenceEndDate("")
    }
  }

  function handleCustomRecurrenceSubmit(value: CustomRecurrence) {
    setRecurrence("custom")
    setCustomRecurrence(value)
    setRecurrenceDays(value.days)
    if (value.endType === "on-date" && value.endDate) {
      setRecurrenceEndType("on-date")
      setRecurrenceEndDate(value.endDate)
    }
  }

  function toggleRecurrenceDay(day: DayOfWeek) {
    setRecurrenceDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  function handleStartDateChange(value: string) {
    setStartDate(value)
    if (value > endDate) setEndDate(value)
  }

  function handleAddLink() {
    setLinks(prev => [...prev, { label: "", href: "", external: true }])
  }

  function handleUpdateLink(index: number, field: keyof EventLink, value: string | boolean) {
    setLinks(prev => prev.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    ))
  }

  function handleRemoveLink(index: number) {
    setLinks(prev => prev.filter((_, i) => i !== index))
  }

  function handleSave() {
    if (!isValid) return

    const eventData: Omit<ChurchEvent, "id"> = {
      slug: slug || generateSlug(title),
      title: title.trim(),
      type: eventType,
      date: startDate,
      endDate,
      startTime,
      endTime,
      recurrence,
      recurrenceDays,
      recurrenceEndType: isRecurring ? recurrenceEndType : "never",
      recurrenceEndDate: recurrenceEndType === "on-date" ? recurrenceEndDate : undefined,
      customRecurrence: recurrence === "custom" ? customRecurrence : undefined,
      locationType,
      location: location.trim(),
      meetingUrl: meetingUrl.trim() || undefined,
      ministry,
      campus: campus || undefined,
      status,
      isPinned: event?.isPinned ?? false,
      shortDescription: shortDescription.trim() || undefined,
      description: description || undefined,
      welcomeMessage: welcomeMessage || undefined,
      contacts: contacts.length > 0 ? contacts : undefined,
      coverImage: coverImage || undefined,
      imageAlt: imageAlt.trim() || undefined,
      tags,
      registrationUrl: registrationUrl.trim() || undefined,
      links: links.filter(l => l.label.trim() && l.href.trim()),
    }

    if (mode === "create") {
      addEvent(eventData)
    } else if (event) {
      updateEvent(event.id, eventData)
    }

    router.push("/cms/events")
  }

  function handleCancel() {
    router.push("/cms/events")
  }

  return (
    <div className="flex flex-col gap-6 flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cms/events">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              {mode === "create" ? "New Event" : "Edit Event"}
            </h1>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Save Event
          </Button>
        </div>
      </div>

      {/* Title & Slug */}
      <div className="space-y-3">
        <div>
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Event title"
            className="text-lg font-medium h-12"
            aria-label="Event title"
          />
          {title.trim().length > 0 && title.trim().length < 2 && (
            <p className="text-xs text-destructive mt-1">Title must be at least 2 characters</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground shrink-0">/events/</span>
          <Input
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="auto-generated-slug"
            className="text-sm h-8 font-mono"
            aria-label="Event slug"
          />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 gap-6 min-h-0">
        {/* Main content */}
        <div className="flex-1 min-w-0 overflow-y-auto space-y-6 p-0.5 -m-0.5">
          {/* Short Description */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b">
              <h2 className="text-sm font-semibold">Short Description</h2>
            </div>
            <div className="p-5">
              <Textarea
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A brief summary for event cards and list views (1-2 sentences)..."
                rows={3}
                maxLength={250}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                {shortDescription.length}/250 characters. Shown on event cards and search results.
              </p>
            </div>
          </section>

          {/* Date & Time */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <CalendarIcon className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Date & Time</h2>
            </div>

            <div className="p-5 space-y-4">
              {/* Start row */}
              <div className="grid grid-cols-[1fr_auto_auto] items-end gap-3">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <DatePicker
                    value={startDate}
                    onChange={handleStartDateChange}
                    placeholder="Select start date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-32"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>

              {/* End date row */}
              <div className="space-y-2">
                <Label>End Date</Label>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  min={startDate}
                  placeholder="Select end date"
                />
              </div>

              <Separator />

              {/* Recurrence */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Repeat className="size-4 text-muted-foreground" />
                  <Label>Recurrence</Label>
                </div>
                <Select
                  value={recurrence}
                  onValueChange={handleRecurrenceChange}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {recurrenceOptions.map((r) => (
                      <SelectItem key={r} value={r}>
                        {recurrenceDisplay[r] === "Custom" ? "Custom..." : recurrenceDisplay[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {recurrence === "custom" && customRecurrence && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs font-normal">
                      Every {customRecurrence.interval} week(s) on{" "}
                      {customRecurrence.days
                        .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
                        .join(", ")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCustomRecurrenceOpen(true)}
                    >
                      Edit
                    </Button>
                  </div>
                )}

                {/* Day-of-week picker for weekly recurrence */}
                {showDayPicker && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Repeats on</Label>
                    <div className="flex gap-1.5">
                      {allDays.map((day) => (
                        <Toggle
                          key={day}
                          size="sm"
                          pressed={recurrenceDays.includes(day)}
                          onPressedChange={() => toggleRecurrenceDay(day)}
                          className="size-9 rounded-full p-0 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                          aria-label={dayLabels[day].full}
                        >
                          {dayLabels[day].short}
                        </Toggle>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recurrence end date - shown for all recurring types */}
                {isRecurring && recurrence !== "custom" && (
                  <div className="space-y-2 pt-1">
                    <Label className="text-xs text-muted-foreground">Ends</Label>
                    <div className="flex items-center gap-4">
                      <RadioGroup
                        value={recurrenceEndType}
                        onValueChange={(v) => setRecurrenceEndType(v as RecurrenceEndType)}
                        className="flex gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="never" id="rec-end-never" />
                          <Label htmlFor="rec-end-never" className="font-normal text-sm">Never</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="on-date" id="rec-end-date" />
                          <Label htmlFor="rec-end-date" className="font-normal text-sm">On date</Label>
                        </div>
                      </RadioGroup>
                      {recurrenceEndType === "on-date" && (
                        <DatePicker
                          value={recurrenceEndDate}
                          onChange={setRecurrenceEndDate}
                          min={startDate}
                          placeholder="End date"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Location</h2>
            </div>

            <div className="p-5 space-y-4">
              <RadioGroup
                value={locationType}
                onValueChange={(v) => setLocationType(v as LocationType)}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="in-person" id="loc-in-person" />
                  <Label htmlFor="loc-in-person" className="font-normal flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    In-Person
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="online" id="loc-online" />
                  <Label htmlFor="loc-online" className="font-normal flex items-center gap-1.5">
                    <Globe className="size-3.5" />
                    Online
                  </Label>
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label htmlFor="location-input">
                  {locationType === "in-person" ? "Address / Venue" : "Location Name"}
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="location-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={
                      locationType === "in-person"
                        ? "e.g. LA UBF Main Center, Room 201"
                        : "e.g. Zoom, Google Meet"
                    }
                    className="pl-9"
                  />
                </div>
              </div>

              <Separator />

              {/* Meeting URL - always visible */}
              <div className="space-y-2">
                <Label htmlFor="meeting-url">Meeting URL (optional)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="meeting-url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="e.g. https://zoom.us/j/..."
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Online meeting link (Zoom, YouTube, Google Meet). Shown as a &quot;Join Online&quot; button on the event page.
                </p>
              </div>
            </div>
          </section>

          {/* Content */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <MessageSquare className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Content</h2>
            </div>

            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <Label>Description</Label>
                <RichTextEditor
                  content={description}
                  onContentChange={setDescription}
                  placeholder="Event details, agenda, and notes..."
                  minHeight="250px"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Input
                  id="welcome-message"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="A short greeting for new visitors (optional)"
                />
                <p className="text-xs text-muted-foreground">
                  Displayed to first-time visitors on the event page.
                </p>
              </div>
            </div>
          </section>

          {/* Links */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <LinkIcon className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Links</h2>
            </div>

            <div className="p-5 space-y-4">
              {/* Registration URL */}
              <div className="space-y-2">
                <Label htmlFor="registration-url">Registration URL</Label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="registration-url"
                    value={registrationUrl}
                    onChange={(e) => setRegistrationUrl(e.target.value)}
                    placeholder="e.g. https://forms.google.com/..."
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Shows a &quot;Register Now&quot; button on the event page.
                </p>
              </div>

              <Separator />

              {/* Important Links */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Important Links</Label>
                  <Button variant="outline" size="sm" onClick={handleAddLink}>
                    <Plus className="size-3.5" />
                    Add Link
                  </Button>
                </div>

                {links.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No additional links. Add links that will appear on the event detail page.
                  </p>
                )}

                {links.map((link, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 rounded-lg border bg-muted/30">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={link.label}
                        onChange={(e) => handleUpdateLink(index, "label", e.target.value)}
                        placeholder="Link label (e.g. Conference Schedule)"
                        className="h-8 text-sm"
                      />
                      <Input
                        value={link.href}
                        onChange={(e) => handleUpdateLink(index, "href", e.target.value)}
                        placeholder="https://..."
                        className="h-8 text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`link-external-${index}`}
                          checked={link.external ?? true}
                          onCheckedChange={(checked) => handleUpdateLink(index, "external", checked)}
                        />
                        <Label htmlFor={`link-external-${index}`} className="text-xs font-normal text-muted-foreground">
                          Open in new tab
                        </Label>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveLink(index)}
                      className="shrink-0"
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <EventSidebar
          status={status}
          onStatusChange={setStatus}
          eventType={eventType}
          onEventTypeChange={setEventType}
          ministry={ministry}
          onMinistryChange={setMinistry}
          campus={campus}
          onCampusChange={setCampus}
          contacts={contacts}
          onContactsChange={setContacts}
          tags={tags}
          onTagsChange={setTags}
          coverImage={coverImage}
          onCoverImageChange={setCoverImage}
          imageAlt={imageAlt}
          onImageAltChange={setImageAlt}
        />
      </div>

      {/* Custom Recurrence Dialog */}
      <CustomRecurrenceDialog
        open={customRecurrenceOpen}
        onOpenChange={setCustomRecurrenceOpen}
        initialValue={customRecurrence}
        onSubmit={handleCustomRecurrenceSubmit}
      />
    </div>
  )
}
