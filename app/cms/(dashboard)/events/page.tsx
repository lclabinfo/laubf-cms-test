"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Star, MapPin, Globe, CalendarDays, ImageIcon } from "lucide-react"
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
import { columns } from "@/components/cms/events/columns"
import { Toolbar } from "@/components/cms/events/toolbar"
import { useEvents } from "@/lib/events-context"
import { eventTypeDisplay, computeRecurrenceSchedule, ministryDisplay } from "@/lib/events-data"
import type { ChurchEvent } from "@/lib/events-data"
import { statusDisplay } from "@/lib/status"
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
  const [h, m] = time.split(":").map(Number)
  const suffix = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`
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

/* ── Calendar helper: get all dates an event falls on ── */

function getEventDates(event: ChurchEvent): Date[] {
  const dates: Date[] = []
  const start = new Date(event.date + "T00:00:00")
  const end = event.endDate ? new Date(event.endDate + "T00:00:00") : start

  const current = new Date(start)
  while (current <= end) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function EventsPage() {
  const router = useRouter()
  const { events, loading } = useEvents()
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [view, setView] = useState<"list" | "card">("list")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())

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
    data: events,
    columns,
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
      const dates = getEventDates(event)
      for (const d of dates) {
        const key = dateKey(d)
        const existing = map.get(key) ?? []
        existing.push(event)
        map.set(key, existing)
      }
    }
    return map
  }, [events])

  // Dates that have events (for calendar modifiers)
  const eventDates = useMemo(() => {
    return Array.from(eventDateMap.keys()).map((key) => {
      const [y, m, d] = key.split("-").map(Number)
      return new Date(y, m - 1, d)
    })
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
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Events</h1>
        <p className="text-muted-foreground text-sm">
          Create and manage church events, meetings, and programs.
        </p>
      </div>

      <Tabs defaultValue="list">
        <TabsList variant="line">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Toolbar
            table={table}
            globalFilter={globalFilter}
            setGlobalFilter={handleGlobalFilterChange}
            view={view}
            onViewChange={setView}
          />
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : view === "list" ? (
            <DataTable
              columns={columns}
              table={table}
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
                    modifiers={{ hasEvent: eventDates }}
                    modifiersClassNames={{
                      hasEvent: "relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-primary",
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
                                      {event.isFeatured && (
                                        <Star className="size-3.5 shrink-0 text-amber-500 fill-amber-500" />
                                      )}
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
          {/* Featured star overlay */}
          {event.isFeatured && (
            <div className="absolute top-2 left-2">
              <Star className="size-4 text-amber-500 fill-amber-500 drop-shadow" />
            </div>
          )}
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
              <Globe className="size-3 shrink-0 text-blue-500" />
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
