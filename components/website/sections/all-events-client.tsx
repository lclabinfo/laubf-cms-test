"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import SectionContainer from "@/components/website/shared/section-container"
import EventGridCard from "@/components/website/shared/event-grid-card"
import EventListItem from "@/components/website/shared/event-list-item"
import EventCalendarGrid from "@/components/website/shared/event-calendar-grid"
import FilterToolbar from "@/components/website/shared/filter-toolbar"
import { IconGrid, IconListView, IconCalendar } from "@/components/website/shared/icons"

interface SimpleEvent {
  id: string
  slug: string
  title: string
  description: string
  type: "event" | "meeting" | "program"
  dateStart: string
  dateEnd: string | null
  timeStart: string
  timeEnd: string
  location: string
  locationDetail: string
  ministry: string
  campus: string
  thumbnailUrl: string
  isFeatured: boolean
  isRecurring: boolean
}

type TabView = "event" | "meeting" | "program"
type ViewMode = "card" | "list" | "calendar"

interface EventFilters {
  search?: string
  type?: string
  ministry?: string
  campus?: string
  dateFrom?: string
  dateTo?: string
}

const VALID_TABS: TabView[] = ["event", "meeting", "program"]
const INITIAL_COUNT = 9
const LOAD_MORE_COUNT = 9

interface Props {
  events: SimpleEvent[]
  heading: string
}

export default function AllEventsClient({ events, heading }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  /* -- Derive tab from URL so navbar clicks always sync -- */
  const urlTab = searchParams.get("tab")
  const activeTab: TabView =
    VALID_TABS.includes(urlTab as TabView) ? (urlTab as TabView) : "event"

  /* -- State -- */
  const [tab, setTab] = useState<TabView>(activeTab)
  const [viewMode, setViewMode] = useState<ViewMode>("card")
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<EventFilters>({})
  const [displayCount, setDisplayCount] = useState(INITIAL_COUNT)
  const [sortField, setSortField] = useState("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  /* -- Sync tab when URL changes (e.g. navbar click while already on page) -- */
  useEffect(() => {
    if (activeTab !== tab) {
      setTab(activeTab)
      setFilters({})
      setSearch("")
      setDisplayCount(INITIAL_COUNT)
    }
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  /* -- URL sync -- */
  const updateTabInUrl = useCallback(
    (newTab: TabView) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("tab", newTab)
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [searchParams, router],
  )

  /* -- Derive unique ministry/campus values for filter dropdowns -- */
  const ministryOptions = useMemo(() => {
    const ministries = new Set<string>()
    events.forEach((e) => { if (e.ministry) ministries.add(e.ministry) })
    return Array.from(ministries).sort()
  }, [events])

  const campusOptions = useMemo(() => {
    const campuses = new Set<string>()
    events.forEach((e) => { if (e.campus) campuses.add(e.campus) })
    return Array.from(campuses).sort()
  }, [events])

  /* -- Filtering & Sorting -- */
  const filteredEvents = useMemo(() => {
    let result = events.filter((e) => e.type === tab)

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q)
      )
    }

    if (filters.ministry) {
      result = result.filter((e) => e.ministry === filters.ministry)
    }
    if (filters.campus) {
      result = result.filter((e) => e.campus === filters.campus)
    }
    if (filters.dateFrom) {
      result = result.filter((e) => e.dateStart >= filters.dateFrom!)
    }
    if (filters.dateTo) {
      result = result.filter((e) => e.dateStart <= filters.dateTo!)
    }

    return [...result].sort((a, b) => {
      let cmp = 0
      if (sortField === "date") {
        cmp = a.dateStart.localeCompare(b.dateStart)
      } else {
        cmp = a.title.localeCompare(b.title)
      }
      return sortDirection === "asc" ? cmp : -cmp
    })
  }, [events, filters, search, tab, sortField, sortDirection])

  const visibleEvents = filteredEvents.slice(0, displayCount)
  const hasMore = displayCount < filteredEvents.length

  function updateFilter<K extends keyof EventFilters>(
    key: K,
    value: EventFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setDisplayCount(INITIAL_COUNT)
  }

  const tabs: { key: TabView; label: string }[] = [
    { key: "event", label: "Events" },
    { key: "meeting", label: "Meetings" },
    { key: "program", label: "Programs" },
  ]

  return (
    <SectionContainer colorScheme="light" paddingY="none" className="pb-24 lg:pb-30">
      {/* Filter toolbar */}
      <FilterToolbar
        tabs={{
          options: tabs,
          active: tab,
          onChange: (key) => {
            const newTab = key as TabView
            setTab(newTab)
            updateTabInUrl(newTab)
            setFilters({})
            setSearch("")
            setDisplayCount(INITIAL_COUNT)
          },
        }}
        viewModes={{
          options: [
            { value: "card", label: "Card", icon: <IconGrid className="size-4" /> },
            { value: "list", label: "List", icon: <IconListView className="size-4" /> },
            { value: "calendar", label: "Calendar", icon: <IconCalendar className="size-4" /> },
          ],
          active: viewMode,
          onChange: (v) => setViewMode(v as ViewMode),
        }}
        search={{
          value: search,
          onChange: (v) => {
            setSearch(v)
            setDisplayCount(INITIAL_COUNT)
          },
          placeholder: "Search events, meetings, programs...",
        }}
        filters={[
          ...(ministryOptions.length > 0
            ? [
                {
                  id: "ministry",
                  label: "Ministry",
                  value: filters.ministry ?? "all",
                  options: [
                    { value: "all", label: "All Ministries" },
                    ...ministryOptions.map((m) => ({ value: m, label: m })),
                  ],
                  onChange: (v: string) =>
                    updateFilter("ministry", v === "all" ? undefined : v),
                },
              ]
            : []),
          ...(campusOptions.length > 0
            ? [
                {
                  id: "campus",
                  label: "Campus",
                  value: filters.campus ?? "all",
                  options: [
                    { value: "all", label: "All Campuses" },
                    ...campusOptions.map((c) => ({ value: c, label: c })),
                  ],
                  onChange: (v: string) =>
                    updateFilter("campus", v === "all" ? undefined : v),
                },
              ]
            : []),
        ]}
        dateRange={{
          fromLabel: "From",
          toLabel: "To",
          fromValue: filters.dateFrom ?? "",
          toValue: filters.dateTo ?? "",
          onFromChange: (v) => updateFilter("dateFrom", v || undefined),
          onToChange: (v) => updateFilter("dateTo", v || undefined),
        }}
        sort={{
          options: [
            { value: "date", label: "Date (Newest)", direction: "desc" },
            { value: "date", label: "Date (Oldest)", direction: "asc" },
            { value: "title", label: "Title (A-Z)", direction: "asc" },
            { value: "title", label: "Title (Z-A)", direction: "desc" },
          ],
          active: sortField,
          direction: sortDirection,
          onChange: (value, dir) => {
            setSortField(value)
            setSortDirection(dir)
          },
        }}
        onReset={() => {
          setSearch("")
          setFilters({})
          setDisplayCount(INITIAL_COUNT)
        }}
        className="mb-8"
      />

      {/* Events display */}
      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <p className="text-body-1 text-black-2">
            No events found matching your criteria.
          </p>
          <button
            onClick={() => {
              setSearch("")
              setFilters({})
              setDisplayCount(INITIAL_COUNT)
            }}
            className="mt-4 text-accent-blue text-[14px] font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : viewMode === "card" ? (
        <CardView events={visibleEvents} />
      ) : viewMode === "list" ? (
        <ListView events={visibleEvents} />
      ) : (
        <CalendarView events={filteredEvents} />
      )}

      {/* Load more (hidden in calendar view since calendar shows all events for the month) */}
      {hasMore && viewMode !== "calendar" && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setDisplayCount((c) => c + LOAD_MORE_COUNT)}
            className="inline-flex items-center justify-center rounded-full border border-black-1/30 px-8 py-4 text-button-1 text-black-1 transition-colors hover:bg-black-1 hover:text-white-1"
          >
            Load More Events
          </button>
        </div>
      )}
    </SectionContainer>
  )
}

/* -- Card View -- */

function CardView({ events }: { events: SimpleEvent[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {events.map((event) => (
        <EventGridCard
          key={event.id}
          event={{
            slug: event.slug,
            title: event.title,
            type: event.type,
            dateStart: toDateKey(event.dateStart),
            timeStart: event.timeStart,
            location: event.location,
            thumbnailUrl: event.thumbnailUrl || undefined,
            isFeatured: event.isFeatured,
            tags: [event.ministry, event.campus].filter(Boolean),
          }}
        />
      ))}
    </div>
  )
}

/* -- List View -- */

function ListView({ events }: { events: SimpleEvent[] }) {
  return (
    <div className="flex flex-col">
      {events.map((event) => (
        <EventListItem
          key={event.id}
          data={{
            title: event.title,
            dateStart: new Date(event.dateStart),
            dateEnd: event.dateEnd ? new Date(event.dateEnd) : undefined,
            time: formatTimeRange(event.timeStart, event.timeEnd),
            type: event.type,
            href: `/website/events/${event.slug}`,
          }}
        />
      ))}
    </div>
  )
}

/* -- Calendar View -- */

function CalendarView({ events }: { events: SimpleEvent[] }) {
  const calendarEvents = events.map((event) => ({
    slug: event.slug,
    title: event.title,
    dateStart: toDateKey(event.dateStart),
    dateEnd: event.dateEnd ? toDateKey(event.dateEnd) : undefined,
    time: formatTimeRange(event.timeStart, event.timeEnd),
    type: event.type,
    location: event.location || undefined,
    description: event.description || undefined,
  }))

  return <EventCalendarGrid events={calendarEvents} />
}

/* -- Helpers -- */

/** Convert ISO date string to YYYY-MM-DD key */
function toDateKey(dateStr: string): string {
  if (dateStr.length === 10) return dateStr // already YYYY-MM-DD
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Format time range from start/end times */
function formatTimeRange(start: string, end: string): string {
  if (!start) return ""
  if (!end) return start
  return `${start} - ${end}`
}
