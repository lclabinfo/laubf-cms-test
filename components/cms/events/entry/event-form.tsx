"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import {
  ArrowLeft,
  CalendarIcon,
  CalendarPlus,
  ExternalLink,
  FileText,
  Globe,
  ImageIcon,
  Library,
  MapPin,
  Navigation,
  Plus as PlusIcon,
  Settings,
  Sparkles,
  Upload,
  X,
} from "lucide-react"
import { PeopleSelect } from "@/components/cms/shared/people-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { DatePicker } from "@/components/ui/date-picker"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Toggle } from "@/components/ui/toggle"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { CustomRecurrenceDialog } from "./custom-recurrence-dialog"
import { AddressAutocomplete } from "./address-autocomplete"
import { MediaSelectorDialog } from "@/components/cms/media/media-selector-dialog"
import { useEvents } from "@/lib/events-context"
import { statusDisplay } from "@/lib/status"
import type { ContentStatus } from "@/lib/status"
import {
  recurrenceDisplay,
  eventTypeDisplay,
  allDays,
  dayLabels,
  tagSuggestions,
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
  type MonthlyRecurrenceType,
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

const URL_REGEX = /^https?:\/\/.+/

const statusOptions: ContentStatus[] = ["draft", "published", "archived"]
const eventTypes: EventType[] = ["event", "meeting", "program"]

const mockUnsplashImages = [
  "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1529070538774-1795d8de2b7b?w=800&h=400&fit=crop",
]

/** Helper: get ordinal suffix for a day number (1st, 2nd, 3rd, etc.) */
function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/** Helper: get the "Nth weekday" label for a date, e.g. "3rd Thursday" */
function getNthWeekdayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  const dayOfMonth = date.getDate()
  const nth = Math.ceil(dayOfMonth / 7)
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" })
  return `${getOrdinal(nth)} ${weekday}`
}

export function EventForm({ mode, event }: EventFormProps) {
  const router = useRouter()
  const { addEvent, updateEvent } = useEvents()

  // Dynamic ministry/campus options fetched from API
  const [ministryOptions, setMinistryOptions] = useState<{ value: MinistryTag; label: string }[]>([])
  const [campusOptions, setCampusOptions] = useState<{ value: CampusTag; label: string }[]>([])

  useEffect(() => {
    fetch("/api/v1/ministries")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setMinistryOptions(
            json.data.map((m: { slug: string; name: string }) => ({ value: m.slug as MinistryTag, label: m.name }))
          )
        }
      })
      .catch(() => {}) // silently fail — form still works with empty list

    fetch("/api/v1/campuses")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setCampusOptions(
            json.data.map((c: { slug: string; name: string; shortName?: string | null }) => ({
              value: c.slug as CampusTag,
              label: c.shortName ?? c.name,
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

  // Basic info
  const [title, setTitle] = useState(event?.title ?? "")
  const [shortDescription, setShortDescription] = useState(event?.shortDescription ?? "")

  // Date & time
  const [startDate, setStartDate] = useState(event?.date ?? today)
  const [endDate, setEndDate] = useState(event?.endDate ?? today)
  const [startTime, setStartTime] = useState(event?.startTime ?? "10:00")
  const [endTime, setEndTime] = useState(event?.endTime ?? "11:00")
  const [showEndDate, setShowEndDate] = useState(
    event ? event.endDate !== event.date : false
  )
  const [recurrence, setRecurrence] = useState<Recurrence>(event?.recurrence ?? "none")
  const [recurrenceDays, setRecurrenceDays] = useState<DayOfWeek[]>(event?.recurrenceDays ?? [])
  const [recurrenceEndType, setRecurrenceEndType] = useState<RecurrenceEndType>(event?.recurrenceEndType ?? "never")
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(event?.recurrenceEndDate ?? "")
  const [customRecurrence, setCustomRecurrence] = useState<CustomRecurrence | undefined>(
    event?.customRecurrence
  )
  const [customRecurrenceOpen, setCustomRecurrenceOpen] = useState(false)
  const [monthlyType, setMonthlyType] = useState<MonthlyRecurrenceType>(
    event?.monthlyType ?? "day-of-month"
  )

  // Location
  const [locationType, setLocationType] = useState<LocationType>(event?.locationType ?? "in-person")
  const [location, setLocation] = useState(event?.location ?? "")
  const [address, setAddress] = useState(event?.address ?? "")
  const [meetingUrl, setMeetingUrl] = useState(event?.meetingUrl ?? "")
  const [meetingUrlError, setMeetingUrlError] = useState<string | null>(null)

  // Content
  const [description, setDescription] = useState(event?.description ?? "")
  const [welcomeMessage, setWelcomeMessage] = useState(event?.welcomeMessage ?? "")

  // Links (up to 3)
  const [links, setLinks] = useState<EventLink[]>(event?.links ?? [])

  // Settings state
  const [status, setStatus] = useState<ContentStatus>(event?.status ?? "draft")
  const [eventType, setEventType] = useState<EventType>(event?.type ?? "event")
  const [ministry, setMinistry] = useState<MinistryTag>(event?.ministry ?? "church-wide")
  const [campus, setCampus] = useState<CampusTag | undefined>(event?.campus)
  const [isFeatured, setIsFeatured] = useState(event?.isFeatured ?? false)
  const [contacts, setContacts] = useState<string[]>(event?.contacts ?? [])
  const [coverImage, setCoverImage] = useState(event?.coverImage ?? "")
  const [imageAlt, setImageAlt] = useState(event?.imageAlt ?? "")
  const [tags, setTags] = useState<string[]>(event?.tags ?? [])

  // Sidebar-absorbed local state
  const [tagInput, setTagInput] = useState("")
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false)

  const isValid = title.trim().length >= 2 && startDate && startTime && endTime && location.trim()
  const statusConfig = statusDisplay[status]
  const isRecurring = recurrence !== "none"
  const showDayPicker = dayPickerRecurrences.includes(recurrence)

  // Compute monthly recurrence options based on start date
  const monthlyOptions = useMemo(() => {
    if (!startDate) return { dayOfMonth: "Monthly on the 1st", nthWeekday: "Monthly on the 1st Monday" }
    const date = new Date(startDate + "T00:00:00")
    const dayOfMonth = date.getDate()
    return {
      dayOfMonth: `Monthly on the ${getOrdinal(dayOfMonth)}`,
      nthWeekday: `Monthly on the ${getNthWeekdayLabel(startDate)}`,
    }
  }, [startDate])

  // Filter tag suggestions to only show tags not already added
  const availableSuggestions = tagSuggestions.filter(t => !tags.includes(t))

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

  function handleShowEndDate() {
    setShowEndDate(true)
  }

  function handleRemoveEndDate() {
    setShowEndDate(false)
    setEndDate(startDate)
  }

  function handleMeetingUrlChange(value: string) {
    setMeetingUrl(value)
    if (value.trim() && !URL_REGEX.test(value.trim())) {
      setMeetingUrlError("Please enter a valid URL starting with http:// or https://")
    } else {
      setMeetingUrlError(null)
    }
  }

  // Tag handlers (absorbed from sidebar)
  function handleAddTag() {
    let tag = tagInput.trim().toUpperCase()
    if (!tag) return
    if (!tag.startsWith("#")) tag = `#${tag}`
    if (tags.includes(tag)) return
    setTags([...tags, tag])
    setTagInput("")
  }

  function handleRemoveTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  function handleTagSuggestionClick(tag: string) {
    if (tags.includes(tag)) return
    setTags([...tags, tag])
  }

  // Link handlers (up to 3 links)
  function handleAddLink() {
    if (links.length >= 3) return
    setLinks([...links, { label: "", href: "", external: true }])
  }

  function handleRemoveLink(index: number) {
    setLinks(links.filter((_, i) => i !== index))
  }

  function handleLinkChange(index: number, field: keyof EventLink, value: string | boolean) {
    setLinks(links.map((l, i) => i === index ? { ...l, [field]: value } : l))
  }

  // Image handlers (absorbed from sidebar)
  function handleUploadImage() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        setCoverImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  function handleGenerateAI() {
    const random = mockUnsplashImages[Math.floor(Math.random() * mockUnsplashImages.length)]
    setCoverImage(random)
  }

  function handleSelectFromLibrary() {
    setMediaSelectorOpen(true)
  }

  function handleSave() {
    if (!isValid) return

    const eventData: Omit<ChurchEvent, "id"> = {
      slug: "",  // Auto-generated from title in context layer
      title: title.trim(),
      type: eventType,
      date: startDate,
      endDate: showEndDate ? endDate : startDate,
      startTime,
      endTime,
      recurrence,
      recurrenceDays,
      recurrenceEndType: isRecurring ? recurrenceEndType : "never",
      recurrenceEndDate: recurrenceEndType === "on-date" ? recurrenceEndDate : undefined,
      customRecurrence: recurrence === "custom" ? customRecurrence : undefined,
      locationType,
      location: location.trim(),
      address: address.trim() || undefined,
      meetingUrl: meetingUrl.trim() || undefined,
      monthlyType: recurrence === "monthly" ? monthlyType : undefined,
      ministry,
      campus: campus || undefined,
      status,
      isFeatured,
      shortDescription: shortDescription.trim() || undefined,
      description: description || undefined,
      welcomeMessage: welcomeMessage || undefined,
      contacts: contacts.length > 0 ? contacts : undefined,
      coverImage: coverImage || undefined,
      imageAlt: imageAlt.trim() || undefined,
      tags,
      links: links.filter(l => l.label.trim() && l.href.trim()),
    }

    if (mode === "create") {
      addEvent(eventData)
      toast.success("Event created")
    } else if (event) {
      updateEvent(event.id, eventData)
      toast.success("Event saved")
    }

    router.push("/cms/events")
  }

  function handleCancel() {
    router.push("/cms/events")
  }

  return (
    <div className="flex flex-col -mx-6">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background">
        <div className="flex items-center gap-3 px-6 pt-5 pb-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cms/events">
              <ArrowLeft />
            </Link>
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">
              {mode === "create" ? "New Event" : "Edit Event"}
            </h1>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!isValid}>
              Save Event
            </Button>
          </div>
        </div>
        <div className="border-b" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-4 pb-8">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* 1. Title zone (no card) */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-title" className="text-sm text-muted-foreground">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="event-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title"
                maxLength={100}
                className="text-lg font-medium h-12"
                autoFocus={mode === "create"}
              />
              <div className="flex items-center justify-between gap-2">
                <div>
                  {title.trim().length > 0 && title.trim().length < 2 && (
                    <p className="text-xs text-destructive">Title must be at least 2 characters</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground tabular-nums shrink-0">
                  {title.length}/100
                </p>
              </div>
            </div>
          </div>

          {/* 2. Schedule card */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <CalendarIcon className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Schedule</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Start Date + Start Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date <span className="text-destructive">*</span></Label>
                  <DatePicker
                    value={startDate}
                    onChange={handleStartDateChange}
                    placeholder="Select start date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time <span className="text-destructive">*</span></Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>

              {/* End Date + End Time */}
              {showEndDate ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>End Date</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-muted-foreground hover:text-foreground -mr-2"
                        onClick={handleRemoveEndDate}
                      >
                        <X className="size-3" />
                        Remove
                      </Button>
                    </div>
                    <DatePicker
                      value={endDate}
                      onChange={setEndDate}
                      min={startDate}
                      placeholder="Select end date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">End Time <span className="text-destructive">*</span></Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground -ml-2"
                      onClick={handleShowEndDate}
                    >
                      <CalendarPlus className="size-3.5" />
                      Add end date
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">End Time <span className="text-destructive">*</span></Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Recurrence */}
              <div className="space-y-3">
                <Label>Recurrence</Label>
                <Select
                  value={recurrence}
                  onValueChange={handleRecurrenceChange}
                >
                  <SelectTrigger>
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

                {/* Monthly recurrence type selector */}
                {recurrence === "monthly" && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Repeats</Label>
                    <Select
                      value={monthlyType}
                      onValueChange={(v) => setMonthlyType(v as MonthlyRecurrenceType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day-of-month">
                          {monthlyOptions.dayOfMonth}
                        </SelectItem>
                        <SelectItem value="day-of-week">
                          {monthlyOptions.nthWeekday}
                        </SelectItem>
                      </SelectContent>
                    </Select>
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

                {/* Recurrence end date */}
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

          {/* 3. Location card */}
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
                  Location Name <span className="text-destructive">*</span>
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

              {/* Getting There — in-person: address with auto Google Maps link */}
              {locationType === "in-person" && (
                <div className="space-y-3 rounded-lg bg-muted/40 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Getting There</p>
                  <div className="space-y-2">
                    <Label htmlFor="address-input">Address</Label>
                    <AddressAutocomplete
                      id="address-input"
                      value={address}
                      onChange={setAddress}
                    />
                    {address.trim() ? (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Navigation className="size-3 shrink-0" />
                        Google Maps link will be generated automatically.
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Enter an address to auto-generate a Google Maps link.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Join Details — online: meeting link */}
              {locationType === "online" && (
                <div className="space-y-3 rounded-lg bg-muted/40 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Join Details</p>
                  <div className="space-y-2">
                    <Label htmlFor="meeting-url">Meeting Link</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="meeting-url"
                        value={meetingUrl}
                        onChange={(e) => handleMeetingUrlChange(e.target.value)}
                        placeholder="e.g. https://zoom.us/j/..."
                        className={cn("pl-9", meetingUrlError && "border-destructive")}
                      />
                    </div>
                    {meetingUrlError ? (
                      <p className="text-xs text-destructive">{meetingUrlError}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Zoom, Google Meet, YouTube Live, etc.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 4. Details card */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Details</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="short-description">Short Description</Label>
                <Textarea
                  id="short-description"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="A brief summary for event cards and list views (1-2 sentences)..."
                  rows={3}
                  maxLength={250}
                />
                <p className="text-xs text-muted-foreground">
                  {shortDescription.length}/250 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <RichTextEditor
                  content={description}
                  onContentChange={setDescription}
                  placeholder="Event details, agenda, and notes..."
                  minHeight="200px"
                />
              </div>

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

          {/* 5. Settings card */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <Settings className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Settings</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Status + Event Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event-status">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
                    <SelectTrigger id="event-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => {
                        const config = statusDisplay[s]
                        return (
                          <SelectItem key={s} value={s}>
                            <div className="flex items-center gap-2">
                              <Badge variant={config.variant} className="text-[10px] px-1.5 py-0">
                                {config.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-type">Event Type</Label>
                  <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
                    <SelectTrigger id="event-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {eventTypeDisplay[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ministry + Campus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event-ministry">Ministry</Label>
                  <Select value={ministry} onValueChange={(v) => setMinistry(v as MinistryTag)}>
                    <SelectTrigger id="event-ministry">
                      <SelectValue placeholder="Select ministry" />
                    </SelectTrigger>
                    <SelectContent>
                      {ministryOptions.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-campus">Campus</Label>
                  <Select
                    value={campus ?? "__none__"}
                    onValueChange={(v) => setCampus(v === "__none__" ? undefined : v as CampusTag)}
                  >
                    <SelectTrigger id="event-campus">
                      <SelectValue placeholder="No campus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        <span className="text-muted-foreground">No campus</span>
                      </SelectItem>
                      {campusOptions.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* TODO: Re-enable Featured Event toggle once the featured curation flow is implemented.
              <div className="flex items-center justify-between">
                <div>
                  <Label>Featured Event</Label>
                  <p className="text-xs text-muted-foreground">Pin to top of events lists</p>
                </div>
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              </div>
              */}

              {/* Links (up to 3) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Links</Label>
                  {links.length < 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-foreground -mr-2"
                      onClick={handleAddLink}
                    >
                      <PlusIcon className="size-3" />
                      Add link
                    </Button>
                  )}
                </div>
                {links.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Add registration links, forms, or resources (up to 3).
                  </p>
                ) : (
                  <div className="space-y-2">
                    {links.map((link, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <Input
                            value={link.label}
                            onChange={(e) => handleLinkChange(index, "label", e.target.value)}
                            placeholder="Label (e.g. Register)"
                            className="text-sm"
                          />
                          <div className="relative">
                            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                            <Input
                              value={link.href}
                              onChange={(e) => handleLinkChange(index, "href", e.target.value)}
                              placeholder="https://..."
                              className="text-sm pl-8"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveLink(index)}
                          aria-label="Remove link"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {links.length < 3 && links.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleAddLink}
                  >
                    <PlusIcon className="size-3.5" />
                    Add another link
                  </Button>
                )}
              </div>

              {/* Points of Contact */}
              <div className="space-y-2">
                <Label>Points of Contact</Label>
                <PeopleSelect
                  mode="multi"
                  roleLabel="contact"
                  values={contacts}
                  onChange={setContacts}
                  placeholder="Add a contact..."
                />
              </div>
            </div>
          </section>

          {/* 6. Media & Tags card */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <ImageIcon className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Media & Tags</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Cover Image section */}
              <div className="space-y-3">
                <Label>Cover Image</Label>
                <div className="aspect-video rounded-lg border bg-muted/50 overflow-hidden">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={imageAlt || "Event cover"}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="size-8 mb-1" />
                      <span className="text-xs">No image selected</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="image-alt" className="text-xs">Alt Text</Label>
                  <Input
                    id="image-alt"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="Describe the image..."
                    className="text-sm h-8"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Button variant="outline" size="sm" onClick={handleUploadImage}>
                    <Upload className="size-3.5" />
                    Upload
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleGenerateAI}>
                    <Sparkles className="size-3.5" />
                    Generate AI
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSelectFromLibrary}>
                    <Library className="size-3.5" />
                    Library
                  </Button>
                  {coverImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCoverImage("")}
                    >
                      <X className="size-3.5" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              {/* Tags section */}
              <div className="space-y-3">
                <Label>Tags</Label>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="gap-1 pr-1 text-xs">
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="rounded-full hover:bg-foreground/10 p-0.5"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-1.5">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add tag..."
                    className="flex-1 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    <PlusIcon className="size-4" />
                  </Button>
                </div>

                {/* Tag suggestions */}
                {availableSuggestions.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      Suggestions
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {availableSuggestions.slice(0, 8).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer text-[10px] hover:bg-muted"
                          onClick={() => handleTagSuggestionClick(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* MediaSelectorDialog */}
      <MediaSelectorDialog
        open={mediaSelectorOpen}
        onOpenChange={setMediaSelectorOpen}
        onSelect={(items) => {
          if (items.length > 0) {
            setCoverImage(items[0].url)
          }
        }}
      />

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
