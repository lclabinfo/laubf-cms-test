"use client"

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from "react"
import {
  generateSlug,
  type ChurchEvent,
  type CostType,
  type EventContact,
  type EventType,
  type Recurrence,
  type LocationType,
  type RecurrenceEndType,
  type MinistryTag,
  type CampusTag,
} from "./events-data"
import type { ContentStatus } from "./status"

/** Handle both old String[] format and new {name,label}[] format from DB */
function normalizeContacts(raw: unknown): EventContact[] | undefined {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return undefined
  return raw.map((item) => {
    if (typeof item === "string") return { name: item }
    if (typeof item === "object" && item !== null && "name" in item) return item as EventContact
    return { name: String(item) }
  })
}

interface EventsContextValue {
  events: ChurchEvent[]
  loading: boolean
  error: string | null
  addEvent: (data: Omit<ChurchEvent, "id">) => ChurchEvent
  updateEvent: (id: string, data: Partial<Omit<ChurchEvent, "id">>) => void
  deleteEvent: (id: string) => void
}

const EventsContext = createContext<EventsContextValue | null>(null)

// --- Enum mappers ---

const statusFromApi: Record<string, ContentStatus> = {
  PUBLISHED: "published",
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  ARCHIVED: "archived",
}

const statusToApi: Record<string, string> = {
  published: "PUBLISHED",
  draft: "DRAFT",
  scheduled: "SCHEDULED",
  archived: "ARCHIVED",
}

const eventTypeFromApi: Record<string, EventType> = {
  EVENT: "event",
  MEETING: "meeting",
  PROGRAM: "program",
}

const eventTypeToApi: Record<string, string> = {
  event: "EVENT",
  meeting: "MEETING",
  program: "PROGRAM",
}

const recurrenceFromApi: Record<string, Recurrence> = {
  NONE: "none",
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
  WEEKDAY: "weekday",
  CUSTOM: "custom",
}

const recurrenceToApi: Record<string, string> = {
  none: "NONE",
  daily: "DAILY",
  weekly: "WEEKLY",
  monthly: "MONTHLY",
  yearly: "YEARLY",
  weekday: "WEEKDAY",
  custom: "CUSTOM",
}

const locationTypeFromApi: Record<string, LocationType> = {
  IN_PERSON: "in-person",
  ONLINE: "online",
  HYBRID: "hybrid",
}

const locationTypeToApi: Record<string, string> = {
  "in-person": "IN_PERSON",
  online: "ONLINE",
  hybrid: "HYBRID",
}

const monthlyTypeToApi: Record<string, string> = {
  "day-of-month": "DAY_OF_MONTH",
  "day-of-week": "DAY_OF_WEEK",
}

const recurrenceEndTypeFromApi: Record<string, RecurrenceEndType> = {
  NEVER: "never",
  ON_DATE: "on-date",
  AFTER: "after",
}

const recurrenceEndTypeToApi: Record<string, string> = {
  never: "NEVER",
  "on-date": "ON_DATE",
  after: "AFTER",
}

/** Convert "6:00 AM" or "7:30 PM" to "06:00" or "19:30" for <input type="time"> */
function to24h(time: string | null | undefined): string {
  if (!time) return ""
  // Already in 24h format (e.g. "06:00" or "19:30")
  if (/^\d{1,2}:\d{2}$/.test(time.trim())) return time.trim().padStart(5, "0")
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return time
  let hours = parseInt(match[1])
  const minutes = match[2]
  const period = match[3].toUpperCase()
  if (period === "PM" && hours !== 12) hours += 12
  if (period === "AM" && hours === 12) hours = 0
  return `${hours.toString().padStart(2, "0")}:${minutes}`
}

// --- Adapter: API response -> CMS ChurchEvent type ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apiEventToCms(apiEvt: any): ChurchEvent {
  return {
    id: apiEvt.id,
    slug: apiEvt.slug,
    title: apiEvt.title,
    type: eventTypeFromApi[apiEvt.type] ?? "event",
    date: apiEvt.dateStart ? new Date(apiEvt.dateStart).toISOString().slice(0, 10) : "",
    endDate: apiEvt.dateEnd ? new Date(apiEvt.dateEnd).toISOString().slice(0, 10) : (apiEvt.dateStart ? new Date(apiEvt.dateStart).toISOString().slice(0, 10) : ""),
    startTime: to24h(apiEvt.startTime),
    endTime: to24h(apiEvt.endTime),
    recurrence: recurrenceFromApi[apiEvt.recurrence] ?? "none",
    recurrenceDays: (apiEvt.recurrenceDays ?? []).map((d: string) => d.toLowerCase()),
    recurrenceEndType: recurrenceEndTypeFromApi[apiEvt.recurrenceEndType] ?? "never",
    recurrenceEndDate: apiEvt.recurrenceEndDate ? new Date(apiEvt.recurrenceEndDate).toISOString().slice(0, 10) : undefined,
    customRecurrence: apiEvt.customRecurrence ?? undefined,
    locationType: locationTypeFromApi[apiEvt.locationType] ?? "in-person",
    location: apiEvt.location ?? "",
    meetingUrl: apiEvt.meetingUrl ?? undefined,
    ministry: (apiEvt.ministry?.slug as MinistryTag) ?? "church-wide",
    campus: (apiEvt.campus?.slug as CampusTag) ?? undefined,
    status: statusFromApi[apiEvt.status] ?? "draft",
    isFeatured: apiEvt.isFeatured ?? false,
    address: apiEvt.address ?? undefined,
    locationInstructions: apiEvt.locationInstructions ?? undefined,
    monthlyType: apiEvt.monthlyRecurrenceType === "DAY_OF_WEEK" ? "day-of-week" : apiEvt.monthlyRecurrenceType === "DAY_OF_MONTH" ? "day-of-month" : undefined,
    shortDescription: apiEvt.shortDescription ?? undefined,
    description: apiEvt.description ?? undefined,
    welcomeMessage: apiEvt.welcomeMessage ?? undefined,
    contacts: normalizeContacts(apiEvt.contacts),
    coverImage: apiEvt.coverImage ?? undefined,
    imageAlt: apiEvt.imageAlt ?? undefined,
    links: (apiEvt.eventLinks ?? []).map((l: { label: string; href: string; external?: boolean }) => ({
      label: l.label,
      href: l.href,
      external: l.external ?? false,
    })),
    // Cost & Registration
    costType: (apiEvt.costType?.toLowerCase() as CostType) ?? "free",
    costAmount: apiEvt.costAmount ?? undefined,
    registrationRequired: apiEvt.registrationRequired ?? false,
    registrationUrl: apiEvt.registrationUrl ?? undefined,
    maxParticipants: apiEvt.maxParticipants ?? undefined,
    registrationDeadline: apiEvt.registrationDeadline ? new Date(apiEvt.registrationDeadline).toISOString().slice(0, 10) : undefined,
  }
}

function cmsEventToApiCreate(data: Omit<ChurchEvent, "id">) {
  return {
    slug: data.slug || generateSlug(data.title),
    title: data.title,
    type: eventTypeToApi[data.type] ?? "EVENT",
    dateStart: new Date(data.date + "T00:00:00").toISOString(),
    dateEnd: data.endDate ? new Date(data.endDate + "T00:00:00").toISOString() : null,
    startTime: data.startTime || null,
    endTime: data.endTime || null,
    locationType: locationTypeToApi[data.locationType] ?? "IN_PERSON",
    location: data.location || null,
    meetingUrl: data.meetingUrl || null,
    shortDescription: data.shortDescription || null,
    description: data.description || null,
    welcomeMessage: data.welcomeMessage || null,
    contacts: data.contacts ?? [],
    coverImage: data.coverImage || null,
    imageAlt: data.imageAlt || null,
    isFeatured: data.isFeatured ?? false,
    address: data.address || null,
    locationInstructions: data.locationInstructions || null,
    monthlyRecurrenceType: data.monthlyType ? (monthlyTypeToApi[data.monthlyType] ?? data.monthlyType) : undefined,
    isRecurring: data.recurrence !== "none",
    recurrence: recurrenceToApi[data.recurrence] ?? "NONE",
    recurrenceDays: data.recurrenceDays ?? [],
    recurrenceEndType: recurrenceEndTypeToApi[data.recurrenceEndType] ?? "NEVER",
    recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate + "T00:00:00").toISOString() : null,
    customRecurrence: data.customRecurrence || null,
    status: statusToApi[data.status] ?? "DRAFT",
    // Send ministry/campus slugs for server-side resolution to UUIDs
    ministrySlug: data.ministry && data.ministry !== "church-wide" ? data.ministry : null,
    campusSlug: data.campus && data.campus !== "all" ? data.campus : null,
    // Links: send as array
    links: data.links ?? [],
    // Cost & Registration
    costType: data.costType?.toUpperCase() || "FREE",
    costAmount: data.costAmount || null,
    registrationRequired: data.registrationRequired ?? false,
    registrationUrl: data.registrationUrl || null,
    maxParticipants: data.maxParticipants ?? null,
    registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline + "T00:00:00").toISOString() : null,
  }
}

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<ChurchEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Ref to read current events without stale closures
  const eventsRef = useRef(events)
  eventsRef.current = events

  // Fetch events from API on mount
  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch("/api/v1/events?pageSize=100&status=")
        if (!res.ok) throw new Error("Failed to fetch events")

        const json = await res.json()
        if (cancelled) return

        setEvents((json.data ?? []).map(apiEventToCms))
      } catch (err) {
        if (!cancelled) {
          console.error("EventsProvider fetch error:", err)
          setError(err instanceof Error ? err.message : "Failed to load events")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  const addEvent = useCallback((data: Omit<ChurchEvent, "id">) => {
    const slug = data.slug || generateSlug(data.title)
    const tempEvent: ChurchEvent = {
      ...data,
      id: `e${Date.now()}`,
      slug,
    }
    setEvents((prev) => [tempEvent, ...prev])

    // Fire API call in background (keepalive prevents cancellation on navigation)
    fetch("/api/v1/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cmsEventToApiCreate(data)),
      keepalive: true,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to create event (${res.status})`)
        return res.json()
      })
      .then((json) => {
        if (json.success && json.data) {
          setEvents((prev) =>
            prev.map((e) => (e.id === tempEvent.id ? apiEventToCms(json.data) : e))
          )
        }
      })
      .catch((err) => {
        console.error("addEvent error:", err)
        // Rollback: remove temp event
        setEvents((prev) => prev.filter((e) => e.id !== tempEvent.id))
      })

    return tempEvent
  }, [])

  const updateEvent = useCallback((id: string, data: Partial<Omit<ChurchEvent, "id">>) => {
    // Read current state from ref (not stale closure)
    const snapshot = eventsRef.current.find((e) => e.id === id)
    if (!snapshot?.slug) return

    // Optimistic update
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)))

    // Build API payload from CMS fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {}
    if (data.title !== undefined) {
      payload.title = data.title
      payload.slug = generateSlug(data.title)
    }
    if (data.type !== undefined) payload.type = eventTypeToApi[data.type] ?? "EVENT"
    if (data.date !== undefined) payload.dateStart = new Date(data.date + "T00:00:00").toISOString()
    if (data.endDate !== undefined) payload.dateEnd = data.endDate ? new Date(data.endDate + "T00:00:00").toISOString() : null
    if (data.startTime !== undefined) payload.startTime = data.startTime
    if (data.endTime !== undefined) payload.endTime = data.endTime
    if (data.locationType !== undefined) payload.locationType = locationTypeToApi[data.locationType] ?? "IN_PERSON"
    if (data.location !== undefined) payload.location = data.location || null
    if (data.meetingUrl !== undefined) payload.meetingUrl = data.meetingUrl || null
    if (data.shortDescription !== undefined) payload.shortDescription = data.shortDescription || null
    if (data.description !== undefined) payload.description = data.description || null
    if (data.welcomeMessage !== undefined) payload.welcomeMessage = data.welcomeMessage || null
    if (data.contacts !== undefined) payload.contacts = data.contacts ?? []
    if (data.coverImage !== undefined) payload.coverImage = data.coverImage || null
    if (data.imageAlt !== undefined) payload.imageAlt = data.imageAlt || null
    if (data.isFeatured !== undefined) payload.isFeatured = data.isFeatured
    if (data.address !== undefined) payload.address = data.address || null
    if (data.locationInstructions !== undefined) payload.locationInstructions = data.locationInstructions || null
    if (data.monthlyType !== undefined) payload.monthlyRecurrenceType = data.monthlyType ? (monthlyTypeToApi[data.monthlyType] ?? data.monthlyType) : null
    if (data.recurrence !== undefined) {
      payload.recurrence = recurrenceToApi[data.recurrence] ?? "NONE"
      payload.isRecurring = data.recurrence !== "none"
    }
    if (data.recurrenceDays !== undefined) payload.recurrenceDays = data.recurrenceDays
    if (data.recurrenceEndType !== undefined) payload.recurrenceEndType = recurrenceEndTypeToApi[data.recurrenceEndType] ?? "NEVER"
    if (data.recurrenceEndDate !== undefined) payload.recurrenceEndDate = data.recurrenceEndDate ? new Date(data.recurrenceEndDate + "T00:00:00").toISOString() : null
    if (data.customRecurrence !== undefined) payload.customRecurrence = data.customRecurrence || null
    if (data.status !== undefined) payload.status = statusToApi[data.status] ?? "DRAFT"
    if (data.ministry !== undefined) {
      payload.ministrySlug = data.ministry && data.ministry !== "church-wide" ? data.ministry : null
    }
    if (data.campus !== undefined) {
      payload.campusSlug = data.campus && data.campus !== "all" ? data.campus : null
    }
    if (data.links !== undefined) payload.links = data.links ?? []
    if (data.costType !== undefined) payload.costType = data.costType?.toUpperCase() || "FREE"
    if (data.costAmount !== undefined) payload.costAmount = data.costAmount || null
    if (data.registrationRequired !== undefined) payload.registrationRequired = data.registrationRequired
    if (data.registrationUrl !== undefined) payload.registrationUrl = data.registrationUrl || null
    if (data.maxParticipants !== undefined) payload.maxParticipants = data.maxParticipants ?? null
    if (data.registrationDeadline !== undefined) payload.registrationDeadline = data.registrationDeadline ? new Date(data.registrationDeadline + "T00:00:00").toISOString() : null

    // Fire fetch OUTSIDE state updater — guaranteed to execute
    // keepalive ensures the request completes even if the page navigates away
    fetch(`/api/v1/events/${snapshot.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to update event (${res.status})`)
        return res.json()
      })
      .then((json) => {
        if (json.success && json.data) {
          setEvents((p) =>
            p.map((e) => (e.id === id ? apiEventToCms(json.data) : e))
          )
        }
      })
      .catch((err) => {
        console.error("updateEvent error:", err)
        // Rollback to snapshot
        setEvents((p) => p.map((e) => (e.id === id ? snapshot : e)))
      })
  }, [])

  const deleteEvent = useCallback((id: string) => {
    let deleted: ChurchEvent | undefined
    setEvents((prev) => {
      deleted = prev.find((e) => e.id === id)
      return prev.filter((e) => e.id !== id)
    })

    if (deleted?.slug) {
      fetch(`/api/v1/events/${deleted.slug}`, { method: "DELETE" })
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to delete event (${res.status})`)
        })
        .catch((err) => {
          console.error("deleteEvent error:", err)
          // Rollback: re-add deleted event
          if (deleted) {
            setEvents((prev) => [deleted!, ...prev])
          }
        })
    }
  }, [])

  const value = useMemo(
    () => ({ events, loading, error, addEvent, updateEvent, deleteEvent }),
    [events, loading, error, addEvent, updateEvent, deleteEvent]
  )

  return <EventsContext value={value}>{children}</EventsContext>
}

export function useEvents() {
  const ctx = useContext(EventsContext)
  if (!ctx) throw new Error("useEvents must be used within EventsProvider")
  return ctx
}
