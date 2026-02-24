"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import SectionContainer from "@/components/website/shared/section-container"
import Link from "next/link"

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
type ViewMode = "card" | "list"

const VALID_TABS: TabView[] = ["event", "meeting", "program"]
const INITIAL_COUNT = 9
const LOAD_MORE_COUNT = 9

function formatEventDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getEventBadge(type: string) {
  const colors: Record<string, string> = {
    event: "bg-accent-blue",
    meeting: "bg-accent-green",
    program: "bg-accent-orange",
  }
  return colors[type] || "bg-black-3"
}

interface Props {
  events: SimpleEvent[]
  heading: string
}

export default function AllEventsClient({ events, heading }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const urlTab = searchParams.get("tab")
  const activeTab: TabView =
    VALID_TABS.includes(urlTab as TabView) ? (urlTab as TabView) : "event"

  const [tab, setTab] = useState<TabView>(activeTab)
  const [viewMode, setViewMode] = useState<ViewMode>("card")
  const [search, setSearch] = useState("")
  const [displayCount, setDisplayCount] = useState(INITIAL_COUNT)

  useEffect(() => {
    if (activeTab !== tab) {
      setTab(activeTab)
      setSearch("")
      setDisplayCount(INITIAL_COUNT)
    }
  }, [activeTab])

  const updateTabInUrl = (newTab: TabView) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", newTab)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  /* ── Filtering ── */
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
    return result.sort((a, b) => b.dateStart.localeCompare(a.dateStart))
  }, [events, tab, search])

  const visibleEvents = filteredEvents.slice(0, displayCount)
  const hasMore = displayCount < filteredEvents.length

  const tabs: { key: TabView; label: string }[] = [
    { key: "event", label: "Events" },
    { key: "meeting", label: "Meetings" },
    { key: "program", label: "Programs" },
  ]

  return (
    <SectionContainer colorScheme="light" className="pt-0 py-30">
      {/* Tabs */}
      <div className="flex items-center gap-6 mb-6 border-b border-white-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key)
              updateTabInUrl(t.key)
              setSearch("")
              setDisplayCount(INITIAL_COUNT)
            }}
            className={`pb-3 text-button-1 transition-colors ${
              tab === t.key
                ? "text-black-1 border-b-2 border-black-1"
                : "text-black-3 hover:text-black-2"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setDisplayCount(INITIAL_COUNT) }}
          placeholder="Search events, meetings, programs..."
          className="flex-1 min-w-[200px] rounded-full border border-white-2 bg-white-0 px-5 py-3 text-body-2 text-black-1 placeholder:text-black-3 focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />
        <div className="flex rounded-full border border-white-2 overflow-hidden">
          {(["card", "list"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2.5 text-[13px] font-medium transition-colors ${
                viewMode === mode
                  ? "bg-black-1 text-white-1"
                  : "text-black-3 hover:text-black-1"
              }`}
            >
              {mode === "card" ? "Grid" : "List"}
            </button>
          ))}
        </div>
      </div>

      {/* Events display */}
      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <p className="text-body-1 text-black-2">
            No events found matching your criteria.
          </p>
          <button
            onClick={() => { setSearch(""); setDisplayCount(INITIAL_COUNT) }}
            className="mt-4 text-accent-blue text-[14px] font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col">
          {visibleEvents.map((event) => (
            <EventListItem key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
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

/* ── Event Card ── */

function EventCard({ event }: { event: SimpleEvent }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative flex flex-col rounded-[20px] bg-white-0 overflow-hidden transition-all hover:shadow-[0px_8px_16px_0px_rgba(0,0,0,0.06)]"
    >
      {/* Thumbnail or date block */}
      {event.thumbnailUrl ? (
        <div className="relative aspect-[16/9] w-full bg-black-1 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.thumbnailUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3">
            <span className={`${getEventBadge(event.type)} text-white-0 text-pill px-3 py-1.5 rounded-full`}>
              {event.type}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white-1-5 p-5 flex items-center gap-4">
          <div className="flex flex-col items-center justify-center bg-white-0 rounded-[12px] px-4 py-3 min-w-[60px]">
            <span className="text-[24px] font-medium text-black-1 leading-none">
              {new Date(event.dateStart).getDate()}
            </span>
            <span className="text-[12px] font-medium text-black-3 uppercase">
              {new Date(event.dateStart).toLocaleDateString("en-US", { month: "short" })}
            </span>
          </div>
          <span className={`${getEventBadge(event.type)} text-white-0 text-pill px-3 py-1.5 rounded-full`}>
            {event.type}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-2 p-5">
        <h3 className="text-[18px] font-medium text-black-1 tracking-[-0.3px] line-clamp-2">
          {event.title}
        </h3>
        <span className="text-[13px] text-black-3">
          {formatEventDate(event.dateStart)}
          {event.timeStart && ` · ${event.timeStart}`}
        </span>
        {event.location && (
          <span className="text-[13px] text-black-3">{event.location}</span>
        )}
      </div>

      {/* Border overlay */}
      <div
        aria-hidden="true"
        className="absolute border border-white-2-5 inset-0 pointer-events-none rounded-[20px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.04)] transition-shadow group-hover:shadow-[0px_8px_16px_0px_rgba(0,0,0,0.06)]"
      />
    </Link>
  )
}

/* ── Event List Item ── */

function EventListItem({ event }: { event: SimpleEvent }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex items-center gap-5 py-4 px-4 -mx-4 rounded-[12px] transition-colors hover:bg-white-1-5"
    >
      {/* Date block */}
      <div className="flex flex-col items-center justify-center bg-white-1-5 rounded-[12px] px-4 py-3 min-w-[60px] shrink-0">
        <span className="text-[24px] font-medium text-black-1 leading-none">
          {new Date(event.dateStart).getDate()}
        </span>
        <span className="text-[12px] font-medium text-black-3 uppercase">
          {new Date(event.dateStart).toLocaleDateString("en-US", { month: "short" })}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`${getEventBadge(event.type)} text-white-0 text-pill px-2.5 py-1 rounded-full`}>
            {event.type}
          </span>
          {event.timeStart && (
            <span className="text-[13px] text-black-3">{event.timeStart}</span>
          )}
        </div>
        <h3 className="text-[18px] font-medium text-black-1 truncate">{event.title}</h3>
        {event.location && (
          <span className="text-[13px] text-black-3">{event.location}</span>
        )}
      </div>

      <svg className="size-5 text-black-3 transition-transform group-hover:translate-x-1 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Link>
  )
}
