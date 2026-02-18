"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  CalendarIcon,
  Globe,
  MapPin,
  MessageSquare,
  Repeat,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
  type ChurchEvent,
  type EventType,
  type LocationType,
  type Recurrence,
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

export function EventForm({ mode, event }: EventFormProps) {
  const router = useRouter()
  const { addEvent, updateEvent } = useEvents()

  // Basic info
  const [title, setTitle] = useState(event?.title ?? "")

  // Date & time
  const [startDate, setStartDate] = useState(event?.date ?? today)
  const [endDate, setEndDate] = useState(event?.endDate ?? today)
  const [startTime, setStartTime] = useState(event?.startTime ?? "10:00")
  const [endTime, setEndTime] = useState(event?.endTime ?? "11:00")
  const [recurrence, setRecurrence] = useState<Recurrence>(event?.recurrence ?? "none")
  const [customRecurrence, setCustomRecurrence] = useState<CustomRecurrence | undefined>(
    event?.customRecurrence
  )
  const [customRecurrenceOpen, setCustomRecurrenceOpen] = useState(false)

  // Location
  const [locationType, setLocationType] = useState<LocationType>(event?.locationType ?? "in-person")
  const [location, setLocation] = useState(event?.location ?? "")

  // Content
  const [description, setDescription] = useState(event?.description ?? "")
  const [welcomeMessage, setWelcomeMessage] = useState(event?.welcomeMessage ?? "")

  // Sidebar state
  const [status, setStatus] = useState<ContentStatus>(event?.status ?? "draft")
  const [eventType, setEventType] = useState<EventType>(event?.type ?? "event")
  const [ministry, setMinistry] = useState(event?.ministry ?? "")
  const [contacts, setContacts] = useState<string[]>(event?.contacts ?? [])
  const [coverImage, setCoverImage] = useState(event?.coverImage ?? "")

  const isValid = title.trim().length >= 2 && startDate && startTime && endTime && location.trim()
  const statusConfig = statusDisplay[status]

  function handleRecurrenceChange(value: string) {
    const rec = value as Recurrence
    if (rec === "custom") {
      setCustomRecurrenceOpen(true)
      return
    }
    setRecurrence(rec)
    setCustomRecurrence(undefined)
  }

  function handleCustomRecurrenceSubmit(value: CustomRecurrence) {
    setRecurrence("custom")
    setCustomRecurrence(value)
  }

  function handleStartDateChange(value: string) {
    setStartDate(value)
    // Auto-sync end date if it's before the new start date
    if (value > endDate) setEndDate(value)
  }

  function handleSave() {
    if (!isValid) return

    const eventData: Omit<ChurchEvent, "id"> = {
      title: title.trim(),
      type: eventType,
      date: startDate,
      endDate,
      startTime,
      endTime,
      recurrence,
      customRecurrence: recurrence === "custom" ? customRecurrence : undefined,
      locationType,
      location: location.trim(),
      ministry,
      status,
      isPinned: event?.isPinned ?? false,
      description: description || undefined,
      welcomeMessage: welcomeMessage || undefined,
      contacts: contacts.length > 0 ? contacts : undefined,
      coverImage: coverImage || undefined,
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

      {/* Title */}
      <div>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          className="text-lg font-medium h-12"
          aria-label="Event title"
        />
        {title.trim().length > 0 && title.trim().length < 2 && (
          <p className="text-xs text-destructive mt-1">Title must be at least 2 characters</p>
        )}
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 gap-6 min-h-0">
        {/* Main content */}
        <div className="flex-1 min-w-0 overflow-y-auto space-y-6">
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
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
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
              <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* Recurrence */}
              <div className="space-y-2">
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
                  {locationType === "in-person" ? "Address" : "Meeting Link"}
                </Label>
                <div className="relative">
                  {locationType === "in-person" ? (
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  ) : (
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  )}
                  <Input
                    id="location-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={
                      locationType === "in-person"
                        ? "e.g. Main Sanctuary, Room 201"
                        : "e.g. https://zoom.us/j/..."
                    }
                    className="pl-9"
                  />
                </div>
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event details, agenda, and notes..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Rich text editor will be integrated — currently plain text.
                </p>
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
        </div>

        {/* Sidebar */}
        <EventSidebar
          status={status}
          onStatusChange={setStatus}
          eventType={eventType}
          onEventTypeChange={setEventType}
          ministry={ministry}
          onMinistryChange={setMinistry}
          contacts={contacts}
          onContactsChange={setContacts}
          coverImage={coverImage}
          onCoverImageChange={setCoverImage}
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
