"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import { useSessionState } from "@/lib/hooks/use-session-state"
import { useRouter, useSearchParams } from "next/navigation"
import { useCmsSession } from "@/components/cms/cms-shell"
import { PageHeader } from "@/components/cms/page-header"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, MapPin, Globe, CalendarDays, ImageIcon, Settings } from "lucide-react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Calendar } from "@/components/ui/calendar"
import { createColumns } from "@/components/cms/events/columns"
import { Toolbar } from "@/components/cms/events/toolbar"
import { useEvents } from "@/lib/events-context"
import { eventTypeDisplay, computeRecurrenceSchedule, ministryDisplay } from "@/lib/events-data"
import type { ChurchEvent } from "@/lib/events-data"
import { statusDisplay } from "@/lib/status"
import { EventsSettings } from "@/components/cms/events/events-settings"
import { cn } from "@/lib/utils"

function globalFilterFn(
  row: { original: { title: string; location: string; ministry: string } },
  _columnId: string,
  filterValue: string
) {
  const search = filterValue.toLowerCase()
  const { title, location, ministry } = row.original
  return (
    title.toLowerCase().includes(search) ||
    location.toLowerCase().includes(search) ||
    ministry.toLowerCase().includes(search)
  )
}

// Hoist row model factories outside the component so they are stable references
// and don't trigger state updates during React's render phase.
const coreRowModel = getCoreRowModel()
const filteredRowModel = getFilteredRowModel()
const paginationRowModel = getPaginationRowModel()
const sortedRowModel = getSortedRowModel()

/* ── Helper formatters for card view ── */

function formatDateShort(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatDateFull(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatTime(time: string) {
  if (!time) return ""
  // Already in 12hr format (e.g. "6:00 AM")
  if (/[ap]m/i.test(time)) return time.trim()
  // 24hr format (e.g. "18:00")
  const match = time.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return time
  let h = parseInt(match[1], 10)
  const m = match[2]
  const suffix = h >= 12 ? "PM" : "AM"
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return `${h}:${m} ${suffix}`
}

function getEventDateLabel(event: ChurchEvent): string {
  const schedule = computeRecurrenceSchedule(event)
  if (schedule) return schedule

  const isMultiDay = event.endDate && event.endDate !== event.date
  if (isMultiDay) {
    return `${formatDateShort(event.date)} – ${formatDateFull(event.endDate)}`
  }

  return formatDateFull(event.date)
}

/* ── Calendar helper: get all dates an event falls on within a month ── */

const dayOfWeekIndex: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
}

function getEventDatesForMonth(event: ChurchEvent, month: Date): Date[] {
  // Visible range: first day of month to last day of month
  const rangeStart = new Date(month.getFullYear(), month.getMonth(), 1)
  const rangeEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0) // last day

  const eventStart = new Date(event.date + "T00:00:00")

  // Determine recurrence end date (if any)
  let recurrenceEnd: Date | null = null
  if (event.recurrenceEndType === "on-date" && event.recurrenceEndDate) {
    recurrenceEnd = new Date(event.recurrenceEndDate + "T00:00:00")
  }

  // Non-recurring: return dates in the start-end range that overlap with month
  if (event.recurrence === "none") {
    const dates: Date[] = []
    const end = event.endDate ? new Date(event.endDate + "T00:00:00") : eventStart
    const current = new Date(Math.max(rangeStart.getTime(), eventStart.getTime()))
    const limit = new Date(Math.min(rangeEnd.getTime(), end.getTime()))
    while (current <= limit) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  // Recurring: generate occurrences within the visible month
  const dates: Date[] = []
  const current = new Date(rangeStart)

  // Don't generate dates before the event starts
  if (current < eventStart) current.setTime(eventStart.getTime())

  // Don't generate dates after recurrence ends
  const effectiveEnd = recurrenceEnd && recurrenceEnd < rangeEnd ? recurrenceEnd : rangeEnd

  while (current <= effectiveEnd) {
    const dow = current.getDay()
    let include = false

    if (event.recurrence === "daily") {
      include = true
    } else if (event.recurrence === "weekday") {
      include = dow >= 1 && dow <= 5
    } else if (event.recurrence === "weekly") {
      if (event.recurrenceDays.length > 0) {
        include = event.recurrenceDays.some(d => dayOfWeekIndex[d] === dow)
      } else {
        // Weekly with no specific days: same day of week as start
        include = dow === eventStart.getDay()
      }
    } else if (event.recurrence === "monthly") {
      include = current.getDate() === eventStart.getDate()
    } else if (event.recurrence === "yearly") {
      include = current.getDate() === eventStart.getDate() && current.getMonth() === eventStart.getMonth()
    } else if (event.recurrence === "custom" && event.customRecurrence) {
      const cr = event.customRecurrence
      if (cr.days.length > 0) {
        include = cr.days.some(d => dayOfWeekIndex[d] === dow)
      }
      // For custom interval > 1, check week alignment
      if (include && cr.interval > 1) {
        const msPerWeek = 7 * 24 * 60 * 60 * 1000
        const weeksDiff = Math.floor((current.getTime() - eventStart.getTime()) / msPerWeek)
        include = weeksDiff % cr.interval === 0
      }
    }

    if (include) {
      dates.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }

  return dates
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function EventsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") === "settings" ? "settings" : "list"
  const { user } = useCmsSession()
  const { events, loading, deleteEvent, updateEvent, bulkAction, refetch } = useEvents()

  // Use ref for refetch so toast undo always calls latest
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch

  const undoDelete = useCallback(async (ids: string[]) => {
    try {
      const res = await fetch("/api/v1/events/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "undelete", ids }),
      })
      if (!res.ok) throw new Error("Failed to undo")
      refetchRef.current()
      toast.success("Delete undone", { description: `${ids.length} ${ids.length === 1 ? "event" : "events"} restored.` })
    } catch {
      toast.error("Failed to undo delete")
    }
  }, [])

  const handleDelete = useCallback((id: string) => {
    const event = events.find((e) => e.id === id)
    deleteEvent(id)
    toast.success("Event deleted", {
      description: event ? `"${event.title}" has been deleted.` : undefined,
      action: {
        label: "Undo",
        onClick: () => undoDelete([id]),
      },
    })
  }, [events, deleteEvent, undoDelete])

  const handlePublish = useCallback((id: string) => {
    const event = events.find((e) => e.id === id)
    updateEvent(id, { status: "published" })
    toast.success("Event published", {
      description: event ? `"${event.title}" is now visible on the website.` : undefined,
    })
  }, [events, updateEvent])

  const handleUnpublish = useCallback((id: string) => {
    const event = events.find((e) => e.id === id)
    updateEvent(id, { status: "draft" })
    toast.success("Event unpublished", {
      description: event ? `"${event.title}" has been hidden from the website.` : undefined,
    })
  }, [events, updateEvent])

  const handleArchive = useCallback((id: string) => {
    const event = events.find((e) => e.id === id)
    updateEvent(id, { status: "archived" })
    toast.success("Event archived", {
      description: event ? `"${event.title}" has been archived.` : undefined,
    })
  }, [events, updateEvent])

  const handleUnarchive = useCallback((id: string) => {
    const event = events.find((e) => e.id === id)
    updateEvent(id, { status: "draft" })
    toast.success("Event unarchived", {
      description: event ? `"${event.title}" has been restored as a draft.` : undefined,
    })
  }, [events, updateEvent])

  // Bulk handlers
  const handleBulkDelete = useCallback(async (ids: string[]) => {
    await bulkAction("delete", ids)
    toast.success(`${ids.length} ${ids.length === 1 ? "event" : "events"} deleted`, {
      action: {
        label: "Undo",
        onClick: () => undoDelete(ids),
      },
    })
  }, [bulkAction, undoDelete])

  const handleBulkArchive = useCallback(async (ids: string[]) => {
    await bulkAction("archive", ids)
    toast.success(`${ids.length} ${ids.length === 1 ? "event" : "events"} archived`)
  }, [bulkAction])

  const handleBulkPublish = useCallback(async (ids: string[]) => {
    await bulkAction("publish", ids)
    toast.success(`${ids.length} ${ids.length === 1 ? "event" : "events"} published`)
  }, [bulkAction])

  const handleBulkUnpublish = useCallback(async (ids: string[]) => {
    await bulkAction("unpublish", ids)
    toast.success(`${ids.length} ${ids.length === 1 ? "event" : "events"} unpublished`)
  }, [bulkAction])

  const handleBulkUnarchive = useCallback(async (ids: string[]) => {
    await bulkAction("unarchive", ids)
    toast.success(`${ids.length} ${ids.length === 1 ? "event" : "events"} unarchived`)
  }, [bulkAction])

  const columns = useMemo(() => createColumns({
    onDelete: handleDelete,
    onPublish: handlePublish,
    onUnpublish: handleUnpublish,
    onArchive: handleArchive,
    onUnarchive: handleUnarchive,
  }), [handleDelete, handlePublish, handleUnpublish, handleArchive, handleUnarchive])

  const [sorting, setSorting] = useSessionState<SortingState>("cms:events:sorting", [
    { id: "date", desc: true },
  ])
  const [columnFilters, setColumnFilters] = useSessionState<ColumnFiltersState>("cms:events:columnFilters", [])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useSessionState("cms:events:search", "")
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [view, setView] = useSessionState<"list" | "card">("cms:events:view", "list")
  const [dateFrom, setDateFrom] = useSessionState("cms:events:dateFrom", "")
  const [dateTo, setDateTo] = useSessionState("cms:events:dateTo", "")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())

  // Filter by date range
  const filteredByDate = useMemo(() => {
    if (!dateFrom && !dateTo) return events
    return events.filter((e) => {
      if (dateFrom && e.date < dateFrom) return false
      if (dateTo && e.date > dateTo) return false
      return true
    })
  }, [events, dateFrom, dateTo])

  // Pass events through (no featured pinning)
  const sortedEvents = filteredByDate

  // Reset page index when filters change (replaces TanStack's autoResetPageIndex
  // which uses microtasks that fire before mount in React 19 strict mode)
  const resetPageIndex = useCallback(() => {
    setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }))
  }, [])

  const handleColumnFiltersChange = useCallback(
    (updater: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => {
      setColumnFilters(updater)
      resetPageIndex()
    },
    [resetPageIndex]
  )

  const handleGlobalFilterChange = useCallback(
    (value: string) => {
      setGlobalFilter(value)
      resetPageIndex()
    },
    [resetPageIndex]
  )

  const table = useReactTable({
    data: sortedEvents,
    columns,
    getRowId: (row) => row.id,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: handleGlobalFilterChange,
    onPaginationChange: setPagination,
    globalFilterFn,
    autoResetPageIndex: false,
    getCoreRowModel: coreRowModel,
    getFilteredRowModel: filteredRowModel,
    getPaginationRowModel: paginationRowModel,
    getSortedRowModel: sortedRowModel,
  })

  // Build a map of date -> events for the calendar view
  const eventDateMap = useMemo(() => {
    const map = new Map<string, ChurchEvent[]>()
    for (const event of events) {
      const dates = getEventDatesForMonth(event, calendarMonth)
      for (const d of dates) {
        const key = dateKey(d)
        const existing = map.get(key) ?? []
        existing.push(event)
        map.set(key, existing)
      }
    }
    return map
  }, [events, calendarMonth])

  // Split dates into two sets: dates with one-off events (prominent) vs only recurring (faded)
  const { eventDatesOneOff, eventDatesRecurringOnly } = useMemo(() => {
    const oneOff: Date[] = []
    const recurringOnly: Date[] = []
    for (const [key, evts] of eventDateMap) {
      const [y, m, d] = key.split("-").map(Number)
      const date = new Date(y, m - 1, d)
      const hasOneOff = evts.some((e) => e.recurrence === "none")
      if (hasOneOff) {
        oneOff.push(date)
      } else {
        recurringOnly.push(date)
      }
    }
    return { eventDatesOneOff: oneOff, eventDatesRecurringOnly: recurringOnly }
  }, [eventDateMap])

  // Events for the selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return []
    const key = dateKey(selectedDate)
    return eventDateMap.get(key) ?? []
  }, [selectedDate, eventDateMap])

  // Filtered rows for card view (use the table's filtered row model)
  const filteredRows = table.getFilteredRowModel().rows

  return (
    <div className="pt-5 space-y-4">
      <PageHeader
        title="Events"
        description="Create and manage church events, meetings, and programs."
        tutorialId="events"
        userId={user.id}
      />

      <Tabs defaultValue={defaultTab}>
        <TabsList variant="line" data-tutorial="evt-tabs">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="size-3.5 mr-0.5" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="sticky top-0 z-10 bg-background">
            <Toolbar
              table={table}
              globalFilter={globalFilter}
              setGlobalFilter={handleGlobalFilterChange}
              view={view}
              onViewChange={setView}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              onBulkDelete={handleBulkDelete}
              onBulkArchive={handleBulkArchive}
              onBulkUnarchive={handleBulkUnarchive}
              onBulkPublish={handleBulkPublish}
              onBulkUnpublish={handleBulkUnpublish}
            />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : view === "list" ? (
            <DataTable
              columns={columns}
              table={table}
              fixedLayout
              onRowClick={(row) => router.push(`/cms/events/${row.id}`)}
            />
          ) : (
            <EventCardGrid events={filteredRows.map((r) => r.original)} />
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Calendar */}
              <Card className="flex-shrink-0">
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    modifiers={{
                      hasEvent: eventDatesOneOff,
                      hasRecurring: eventDatesRecurringOnly,
                    }}
                    modifiersClassNames={{
                      hasEvent: "relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-primary",
                      hasRecurring: "relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-muted-foreground/30",
                    }}
                    className="[--cell-size:--spacing(10)]"
                  />
                </CardContent>
              </Card>

              {/* Selected date event list */}
              <div className="flex-1 min-w-0">
                {selectedDate ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Events on{" "}
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </h3>
                    {selectedDateEvents.length === 0 ? (
                      <Card>
                        <CardContent className="py-8 text-center">
                          <p className="text-muted-foreground text-sm">No events on this date.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        {selectedDateEvents.map((event) => {
                          const config = statusDisplay[event.status]
                          return (
                            <Link
                              key={event.id}
                              href={`/cms/events/${event.id}`}
                              className="block"
                            >
                              <Card className="hover:bg-muted/50 transition-colors cursor-pointer" size="sm">
                                <CardContent className="flex items-center gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm truncate">
                                        {event.title}
                                      </span>
                                    </div>
                                    <div className="text-muted-foreground text-xs mt-0.5">
                                      {formatTime(event.startTime)} – {formatTime(event.endTime)}
                                      {" \u00B7 "}
                                      {event.location}
                                    </div>
                                  </div>
                                  <Badge variant={config.variant} className="shrink-0">
                                    {config.label}
                                  </Badge>
                                </CardContent>
                              </Card>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <CalendarDays className="size-10 text-muted-foreground/50 mb-3" />
                      <h3 className="text-sm font-medium">Select a date</h3>
                      <p className="text-muted-foreground text-xs mt-1 max-w-xs">
                        Click on a date in the calendar to see events scheduled for that day. Dates with dots have events.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <EventsSettings />
        </TabsContent>
      </Tabs>

    </div>
  )
}

/* ── Card Grid View ── */

function EventCardGrid({ events }: { events: ChurchEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground text-sm">No events found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}

function EventCard({ event }: { event: ChurchEvent }) {
  const config = statusDisplay[event.status]
  const dateLabel = getEventDateLabel(event)

  return (
    <Link href={`/cms/events/${event.id}`} className="block group">
      <Card className="h-full hover:ring-foreground/20 transition-all">
        {/* Cover image or placeholder */}
        <div className="relative aspect-[2/1] bg-muted overflow-hidden rounded-t-xl">
          {event.coverImage ? (
            <img
              src={event.coverImage}
              alt={event.imageAlt || event.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ImageIcon className="size-8 text-muted-foreground/30" />
            </div>
          )}
          {/* Status badge overlay */}
          <div className="absolute top-2 right-2">
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        </div>

        <CardContent className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm leading-snug line-clamp-2">
              {event.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3 shrink-0" />
            <span className="truncate">{dateLabel}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="shrink-0">
              {formatTime(event.startTime)} – {formatTime(event.endTime)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {event.locationType === "online" ? (
              <Globe className="size-3 shrink-0 text-info" />
            ) : (
              <MapPin className="size-3 shrink-0" />
            )}
            <span className="truncate">{event.location}</span>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <Badge variant="secondary" className="text-[10px] h-4">
              {eventTypeDisplay[event.type]}
            </Badge>
            <Badge variant="outline" className="text-[10px] h-4">
              {ministryDisplay[event.ministry] ?? event.ministry}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
