"use client"

import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react"
import {
  generateSlug,
  type ChurchEvent,
  type EventType,
  type Recurrence,
  type LocationType,
  type RecurrenceEndType,
  type MinistryTag,
  type CampusTag,
} from "./events-data"
import type { ContentStatus } from "./status"

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
}

const locationTypeToApi: Record<string, string> = {
  "in-person": "IN_PERSON",
  online: "ONLINE",
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
    startTime: apiEvt.startTime ?? "00:00",
    endTime: apiEvt.endTime ?? "00:00",
    recurrence: recurrenceFromApi[apiEvt.recurrence] ?? "none",
    recurrenceDays: apiEvt.recurrenceDays ?? [],
    recurrenceEndType: recurrenceEndTypeFromApi[apiEvt.recurrenceEndType] ?? "never",
    recurrenceEndDate: apiEvt.recurrenceEndDate ? new Date(apiEvt.recurrenceEndDate).toISOString().slice(0, 10) : undefined,
    customRecurrence: apiEvt.customRecurrence ?? undefined,
    locationType: locationTypeFromApi[apiEvt.locationType] ?? "in-person",
    location: apiEvt.location ?? "",
    meetingUrl: apiEvt.meetingUrl ?? undefined,
    ministry: (apiEvt.ministry?.slug as MinistryTag) ?? "church-wide",
    campus: (apiEvt.campus?.slug as CampusTag) ?? undefined,
    status: statusFromApi[apiEvt.status] ?? "draft",
    isPinned: apiEvt.isPinned ?? false,
    shortDescription: apiEvt.shortDescription ?? undefined,
    description: apiEvt.description ?? undefined,
    welcomeMessage: apiEvt.welcomeMessage ?? undefined,
    contacts: apiEvt.contacts ?? undefined,
    coverImage: apiEvt.coverImage ?? undefined,
    imageAlt: apiEvt.imageAlt ?? undefined,
    tags: [], // TODO: Fetch tags from ContentTag join table
    registrationUrl: apiEvt.registrationUrl ?? undefined,
    links: (apiEvt.eventLinks ?? []).map((l: { label: string; href: string; external?: boolean }) => ({
      label: l.label,
      href: l.href,
      external: l.external ?? false,
    })),
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
    registrationUrl: data.registrationUrl || null,
    isPinned: data.isPinned ?? false,
    isFeatured: false,
    isRecurring: data.recurrence !== "none",
    recurrence: recurrenceToApi[data.recurrence] ?? "NONE",
    recurrenceDays: data.recurrenceDays ?? [],
    recurrenceEndType: recurrenceEndTypeToApi[data.recurrenceEndType] ?? "NEVER",
    recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate + "T00:00:00").toISOString() : null,
    customRecurrence: data.customRecurrence || null,
    status: statusToApi[data.status] ?? "DRAFT",
    // TODO: Map ministry/campus slug to ministryId/campusId via lookup
  }
}

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<ChurchEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    const tempEvent: ChurchEvent = {
      ...data,
      id: `e${Date.now()}`,
    }
    setEvents((prev) => [tempEvent, ...prev])

    // Fire API call in background
    fetch("/api/v1/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cmsEventToApiCreate(data)),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setEvents((prev) =>
            prev.map((e) => (e.id === tempEvent.id ? apiEventToCms(json.data) : e))
          )
        }
      })
      .catch(console.error)

    return tempEvent
  }, [])

  const updateEvent = useCallback((id: string, data: Partial<Omit<ChurchEvent, "id">>) => {
    // Optimistic update
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...data } : e))
    )
    // TODO: Call PATCH /api/v1/events/[slug] when slug is tracked
  }, [])

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
    // TODO: Call DELETE /api/v1/events/[slug] when slug is tracked
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
