"use client"

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react"
import { events as initialEvents, type ChurchEvent } from "./events-data"

interface EventsContextValue {
  events: ChurchEvent[]
  addEvent: (data: Omit<ChurchEvent, "id">) => ChurchEvent
  updateEvent: (id: string, data: Partial<Omit<ChurchEvent, "id">>) => void
  deleteEvent: (id: string) => void
}

const EventsContext = createContext<EventsContextValue | null>(null)

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<ChurchEvent[]>(initialEvents)

  const addEvent = useCallback((data: Omit<ChurchEvent, "id">) => {
    const newEvent: ChurchEvent = {
      ...data,
      id: `e${Date.now()}`,
    }
    setEvents((prev) => [newEvent, ...prev])
    return newEvent
  }, [])

  const updateEvent = useCallback((id: string, data: Partial<Omit<ChurchEvent, "id">>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...data } : e))
    )
  }, [])

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const value = useMemo(
    () => ({ events, addEvent, updateEvent, deleteEvent }),
    [events, addEvent, updateEvent, deleteEvent]
  )

  return <EventsContext value={value}>{children}</EventsContext>
}

export function useEvents() {
  const ctx = useContext(EventsContext)
  if (!ctx) throw new Error("useEvents must be used within EventsProvider")
  return ctx
}
