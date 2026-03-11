"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import {
  ArrowLeft,
  CalendarIcon,
  ExternalLink,
  FileText,
  Globe,
  Laptop,
  ImageIcon,
  Library,
  MapPin,
  Navigation,
  Plus as PlusIcon,
  Settings,
  Sparkles,
  Ticket,
  Upload,
  X,
  HelpCircleIcon,
} from "lucide-react"
import { EventContactList } from "./event-contact-list"
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
import { MediaPickerDialog } from "@/components/cms/media/media-picker-dialog"
import { useCmsSession } from "@/components/cms/cms-shell"
import {
  SpotlightTour,
  isSpotlightComplete,
  resetSpotlight,
} from "@/components/cms/tutorial/spotlight-tour"
import { SPOTLIGHT_TOURS } from "@/components/cms/tutorial/spotlight-tours"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useEvents } from "@/lib/events-context"
import { statusDisplay } from "@/lib/status"
import type { ContentStatus } from "@/lib/status"
import {
  recurrenceDisplay,
  eventTypeDisplay,
  allDays,
  dayLabels,
  type ChurchEvent,
  type CostType,
  type EventType,
  type EventContact,
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
  const { user } = useCmsSession()
  const { addEvent, updateEvent } = useEvents()

  // Tutorial tour
  const editorTour = SPOTLIGHT_TOURS["event-editor"]
  const [tourActive, setTourActive] = useState(false)

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
  const [locationInstructions, setLocationInstructions] = useState(event?.locationInstructions ?? "")
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
  const [contacts, setContacts] = useState<EventContact[]>(event?.contacts ?? [])
  const [coverImage, setCoverImage] = useState(event?.coverImage ?? "")
  const [imageAlt, setImageAlt] = useState(event?.imageAlt ?? "")
  // Cost & Registration
  const [costType, setCostType] = useState<CostType>(event?.costType ?? "free")
  const [costAmount, setCostAmount] = useState(event?.costAmount ?? "")
  const [registrationRequired, setRegistrationRequired] = useState(event?.registrationRequired ?? false)
  const [registrationUrl, setRegistrationUrl] = useState(event?.registrationUrl ?? "")
  const [maxParticipants, setMaxParticipants] = useState<number | undefined>(event?.maxParticipants)
  const [registrationDeadline, setRegistrationDeadline] = useState(event?.registrationDeadline ?? "")
  // Sidebar-absorbed local state
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false)
  const [coverDragging, setCoverDragging] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)

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

  function handleMeetingUrlChange(value: string) {
    setMeetingUrl(value)
    if (value.trim() && !URL_REGEX.test(value.trim())) {
      setMeetingUrlError("Please enter a valid URL starting with http:// or https://")
    } else {
      setMeetingUrlError(null)
    }
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

  // Image handlers — all go through the media picker
  function handleUploadImage() {
    setMediaSelectorOpen(true)
  }

  function handleGenerateAI() {
    const random = mockUnsplashImages[Math.floor(Math.random() * mockUnsplashImages.length)]
    setCoverImage(random)
  }

  function handleSelectFromLibrary() {
    setMediaSelectorOpen(true)
  }

  async function handleCoverDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setCoverDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image exceeds 10 MB limit")
      return
    }
    setCoverUploading(true)
    try {
      // Ensure Events folder exists
      fetch("/api/v1/media/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Events" }),
      }).catch(() => {})
      // Upload to R2
      const urlRes = await fetch("/api/v1/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, fileSize: file.size, context: "media" }),
      })
      const urlJson = await urlRes.json()
      if (!urlJson.success) throw new Error(urlJson.error?.message || "Upload failed")
      await fetch(urlJson.data.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
      // Get dimensions
      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new window.Image()
        img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(img.src) }
        img.onerror = () => { resolve({ w: 0, h: 0 }); URL.revokeObjectURL(img.src) }
        img.src = URL.createObjectURL(file)
      })
      // Create media record
      const createRes = await fetch("/api/v1/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, url: urlJson.data.publicUrl, mimeType: file.type, fileSize: file.size, width: dims.w || undefined, height: dims.h || undefined, folder: "Events" }),
      })
      const createJson = await createRes.json()
      if (!createJson.success) throw new Error("Failed to create media record")
      setCoverImage(createJson.data.url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setCoverUploading(false)
    }
  }

  function handleSave() {
    if (!isValid) return

    const eventData: Omit<ChurchEvent, "id"> = {
      slug: "",  // Auto-generated from title in context layer
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
      address: address.trim() || undefined,
      locationInstructions: locationInstructions.trim() || undefined,
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
      links: links.filter(l => l.label.trim() && l.href.trim()),
      // Cost & Registration
      costType,
      costAmount: costType === "paid" ? costAmount.trim() || undefined : undefined,
      registrationRequired,
      registrationUrl: registrationRequired ? registrationUrl.trim() || undefined : undefined,
      maxParticipants: registrationRequired ? maxParticipants : undefined,
      registrationDeadline: registrationRequired ? registrationDeadline || undefined : undefined,
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

  // Auto-start tour on first visit (or when ?dev-tutorial=true)
  useEffect(() => {
    if (!editorTour) return
    const devForce =
      process.env.NODE_ENV === "development" &&
      new URLSearchParams(window.location.search).get("dev-tutorial") === "true"
    if (devForce || !isSpotlightComplete(editorTour.id, user.id)) {
      const timer = setTimeout(() => setTourActive(true), 800)
      return () => clearTimeout(timer)
    }
  }, [editorTour, user.id])

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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground/50 hover:text-muted-foreground shrink-0"
                  onClick={() => {
                    resetSpotlight(editorTour.id, user.id)
                    setTourActive(true)
                  }}
                >
                  <HelpCircleIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">View guide</p>
              </TooltipContent>
            </Tooltip>
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
          <div data-tutorial="evt-form-title" className="space-y-3">
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
            <div data-tutorial="evt-section-schedule" className="px-5 py-3 border-b flex items-center gap-2">
              <CalendarIcon className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Schedule</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Start row */}
              <div className="grid grid-cols-[4rem_1fr_1fr] items-center gap-3">
                <Label className="text-sm text-muted-foreground">Start</Label>
                <DatePicker
                  value={startDate}
                  onChange={handleStartDateChange}
                  placeholder="Select date"
                />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="[&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:opacity-50"
                />
              </div>

              {/* End row */}
              <div className="grid grid-cols-[4rem_1fr_1fr] items-center gap-3">
                <Label className="text-sm text-muted-foreground">End</Label>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  min={startDate}
                  placeholder="Select date"
                />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="[&::-webkit-calendar-picker-indicator]:dark:invert [&::-webkit-calendar-picker-indicator]:opacity-50"
                />
              </div>

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
            <div data-tutorial="evt-section-location" className="px-5 py-3 border-b flex items-center gap-2">
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
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="hybrid" id="loc-hybrid" />
                  <Label htmlFor="loc-hybrid" className="font-normal flex items-center gap-1.5">
                    <Laptop className="size-3.5" />
                    Hybrid
                  </Label>
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label htmlFor="location-input">
                  Location Name
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="location-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={
                      locationType === "online"
                        ? "e.g. Zoom, Google Meet"
                        : "e.g. LA UBF Main Center, Room 201"
                    }
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Address — in-person and hybrid */}
              {(locationType === "in-person" || locationType === "hybrid") && (
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
              )}

              {/* Meeting Link — online and hybrid */}
              {(locationType === "online" || locationType === "hybrid") && (
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
              )}

              {/* Additional Instructions — shared across all location types */}
              <div className="space-y-2">
                <Label htmlFor="location-instructions">Additional Instructions</Label>
                <Textarea
                  id="location-instructions"
                  value={locationInstructions}
                  onChange={(e) => setLocationInstructions(e.target.value)}
                  placeholder="e.g. Enter through the side gate, parking in Lot B, meeting passcode: 1234"
                  rows={3}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">
                  Any extra details visitors need to find or join the event. {locationInstructions.length}/1000
                </p>
              </div>
            </div>
          </section>

          {/* 4. Details card */}
          <section className="rounded-xl border bg-card">
            <div data-tutorial="evt-section-details" className="px-5 py-3 border-b flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Details</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="short-description">Short Summary</Label>
                <Textarea
                  id="short-description"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="A brief summary for event cards and list views (1-2 sentences)..."
                  rows={2}
                  maxLength={100}
                  className="resize-none"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>A short description of the event shown on cards and list views.</span>
                  <span className="tabular-nums shrink-0">{shortDescription.length}/100</span>
                </div>
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

          {/* 5. Cost & Registration card */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <Ticket className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Cost & Registration</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Cost Type */}
              <div className="space-y-2">
                <Label htmlFor="cost-type">Cost Type</Label>
                <Select value={costType} onValueChange={(v) => setCostType(v as CostType)}>
                  <SelectTrigger id="cost-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="donation">Donation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cost Amount (shown when Paid or Donation) */}
              {(costType === "paid" || costType === "donation") && (
                <div className="space-y-2">
                  <Label htmlFor="cost-amount">
                    {costType === "donation" ? "Suggested Amount" : "Cost Amount"}
                  </Label>
                  <Input
                    id="cost-amount"
                    value={costAmount}
                    onChange={(e) => setCostAmount(e.target.value)}
                    placeholder='e.g. $10, $5-20'
                    className="text-sm"
                  />
                </div>
              )}

              <hr className="border-border" />

              {/* Registration Required */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Registration Required</Label>
                  <p className="text-xs text-muted-foreground">Require attendees to register before the event</p>
                </div>
                <Switch checked={registrationRequired} onCheckedChange={setRegistrationRequired} />
              </div>

              {/* Registration fields (shown when registration is on) */}
              {registrationRequired && (
                <div className="space-y-4 pl-0">
                  <div className="space-y-2">
                    <Label htmlFor="registration-url">Registration URL</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                      <Input
                        id="registration-url"
                        value={registrationUrl}
                        onChange={(e) => setRegistrationUrl(e.target.value)}
                        placeholder="https://forms.google.com/..."
                        className="pl-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max-participants">Max Participants</Label>
                      <Input
                        id="max-participants"
                        type="number"
                        min={1}
                        value={maxParticipants ?? ""}
                        onChange={(e) => setMaxParticipants(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="Unlimited"
                        className="text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Registration Deadline</Label>
                      <DatePicker
                        value={registrationDeadline || undefined}
                        onChange={setRegistrationDeadline}
                        placeholder="No deadline"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 6. Settings card */}
          <section className="rounded-xl border bg-card">
            <div data-tutorial="evt-section-settings" className="px-5 py-3 border-b flex items-center gap-2">
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
                <Label>Links</Label>
                {links.length === 0 ? (
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:bg-muted/50"
                  >
                    <PlusIcon className="size-4" />
                    Add registration links, forms, or resources (up to 3)
                  </button>
                ) : (
                  <div className="space-y-2">
                    {links.map((link, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1 grid grid-cols-[2fr_3fr] gap-2">
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
                    {links.length < 3 && (
                      <button
                        type="button"
                        onClick={handleAddLink}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:bg-muted/50"
                      >
                        <PlusIcon className="size-3.5" />
                        Add another link
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Points of Contact */}
              <div className="space-y-2 pt-4 border-t">
                <Label>Points of Contact</Label>
                <EventContactList values={contacts} onChange={setContacts} />
              </div>
            </div>
          </section>

          {/* 6. Media card */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <ImageIcon className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Media</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Cover Image section */}
              <div className="space-y-3">
                <Label>Cover Image</Label>
                {coverImage ? (
                  <div className="relative group rounded-lg border overflow-hidden">
                    <img
                      src={coverImage}
                      alt={imageAlt || "Event cover"}
                      className="w-full aspect-video object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <Button size="sm" variant="secondary" onClick={handleUploadImage}>
                        <Upload className="size-3.5" />
                        Replace
                      </Button>
                      <Button size="sm" variant="secondary" onClick={handleSelectFromLibrary}>
                        <Library className="size-3.5" />
                        Library
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => setCoverImage("")}>
                        <X className="size-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleUploadImage}
                    onDragOver={(e) => { e.preventDefault(); setCoverDragging(true) }}
                    onDragLeave={(e) => { e.preventDefault(); setCoverDragging(false) }}
                    onDrop={handleCoverDrop}
                    className={`w-full aspect-video rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer group ${
                      coverDragging
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-muted-foreground/50 bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted group-hover:bg-muted-foreground/10 transition-colors">
                      {coverUploading ? (
                        <span className="size-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="size-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        {coverUploading ? "Uploading..." : coverDragging ? "Drop image here" : "Click or drag to upload an image"}
                      </p>
                      {!coverUploading && !coverDragging && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          or{" "}
                          <span
                            role="button"
                            className="text-primary underline underline-offset-2 hover:text-primary/80"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectFromLibrary()
                            }}
                          >
                            choose from media library
                          </span>
                        </p>
                      )}
                    </div>
                  </button>
                )}

                {coverImage && (
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
                )}
              </div>

            </div>
          </section>

        </div>
      </div>

      {/* Media Picker Dialog */}
      <MediaPickerDialog
        open={mediaSelectorOpen}
        onOpenChange={setMediaSelectorOpen}
        folder="Events"
        onSelect={(url, alt) => {
          setCoverImage(url)
          if (alt) setImageAlt(alt)
        }}
      />

      {/* Custom Recurrence Dialog */}
      <CustomRecurrenceDialog
        open={customRecurrenceOpen}
        onOpenChange={setCustomRecurrenceOpen}
        initialValue={customRecurrence}
        onSubmit={handleCustomRecurrenceSubmit}
      />

      <SpotlightTour
        tour={editorTour}
        userId={user.id}
        active={tourActive}
        onEnd={() => setTourActive(false)}
      />
    </div>
  )
}
