"use client"

import { useState, useMemo } from "react"
import SectionContainer from "@/components/website/shared/section-container"
import Link from "next/link"

interface SimpleMessage {
  id: string
  slug: string
  title: string
  passage: string
  speaker: string
  series: string
  dateFor: string
  description: string
  youtubeId: string
  thumbnailUrl: string
  duration: string
  rawTranscript?: string | null
  liveTranscript?: string | null
}

type TabView = "all" | "series"
type ViewMode = "card" | "list"

const INITIAL_COUNT = 9
const LOAD_MORE_COUNT = 9

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface Props {
  messages: SimpleMessage[]
  heading: string
}

export default function AllMessagesClient({ messages, heading }: Props) {
  const [tab, setTab] = useState<TabView>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("card")
  const [search, setSearch] = useState("")
  const [seriesFilter, setSeriesFilter] = useState<string>("all")
  const [speakerFilter, setSpeakerFilter] = useState<string>("all")
  const [displayCount, setDisplayCount] = useState(INITIAL_COUNT)

  /* ── Derived data ── */
  const seriesList = useMemo(() => {
    const seriesMap = new Map<string, { name: string; count: number; lastDate: string }>()
    messages.forEach((m) => {
      if (!m.series) return
      const existing = seriesMap.get(m.series)
      if (existing) {
        existing.count++
        if (m.dateFor > existing.lastDate) existing.lastDate = m.dateFor
      } else {
        seriesMap.set(m.series, { name: m.series, count: 1, lastDate: m.dateFor })
      }
    })
    return Array.from(seriesMap.values()).sort((a, b) => b.lastDate.localeCompare(a.lastDate))
  }, [messages])

  const speakerList = useMemo(() => {
    const speakers = new Set<string>()
    messages.forEach((m) => { if (m.speaker) speakers.add(m.speaker) })
    return Array.from(speakers).sort()
  }, [messages])

  /* ── Filtering ── */
  const filteredMessages = useMemo(() => {
    let result = messages
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.speaker.toLowerCase().includes(q) ||
          m.passage.toLowerCase().includes(q)
      )
    }
    if (seriesFilter !== "all") {
      result = result.filter((m) => m.series === seriesFilter)
    }
    if (speakerFilter !== "all") {
      result = result.filter((m) => m.speaker === speakerFilter)
    }
    return result
  }, [messages, search, seriesFilter, speakerFilter])

  const visibleMessages = filteredMessages.slice(0, displayCount)
  const hasMore = displayCount < filteredMessages.length

  const resetFilters = () => {
    setSearch("")
    setSeriesFilter("all")
    setSpeakerFilter("all")
    setDisplayCount(INITIAL_COUNT)
  }

  return (
    <SectionContainer colorScheme="light" className="pt-0 py-30">
      {/* Tabs */}
      <div className="flex items-center gap-6 mb-6 border-b border-white-2">
        {[
          { key: "all" as const, label: "All Messages" },
          { key: "series" as const, label: "Series" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key)
              resetFilters()
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

      {/* All Messages Tab */}
      {tab === "all" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setDisplayCount(INITIAL_COUNT) }}
              placeholder="Search messages, speakers, passages..."
              className="flex-1 min-w-[200px] rounded-full border border-white-2 bg-white-0 px-5 py-3 text-body-2 text-black-1 placeholder:text-black-3 focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
            <select
              value={seriesFilter}
              onChange={(e) => { setSeriesFilter(e.target.value); setDisplayCount(INITIAL_COUNT) }}
              className="rounded-full border border-white-2 bg-white-0 px-4 py-3 text-body-2 text-black-1 focus:outline-none focus:ring-2 focus:ring-accent-blue"
            >
              <option value="all">All Series</option>
              {seriesList.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
            <select
              value={speakerFilter}
              onChange={(e) => { setSpeakerFilter(e.target.value); setDisplayCount(INITIAL_COUNT) }}
              className="rounded-full border border-white-2 bg-white-0 px-4 py-3 text-body-2 text-black-1 focus:outline-none focus:ring-2 focus:ring-accent-blue"
            >
              <option value="all">All Speakers</option>
              {speakerList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* View mode toggles */}
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

          {/* Messages display */}
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <p className="text-body-1 text-black-2">
                No messages found matching your criteria.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 text-accent-blue text-[14px] font-medium hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : viewMode === "card" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleMessages.map((message) => (
                <MessageCard key={message.id} message={message} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-white-2/50">
              {visibleMessages.map((message) => (
                <MessageListItem key={message.id} message={message} />
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
                Load More Messages
              </button>
            </div>
          )}
        </>
      )}

      {/* Series Tab */}
      {tab === "series" && (
        <>
          <h2 className="text-h2 text-black-1 mb-8">Series</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {seriesList.map((s) => (
              <button
                key={s.name}
                onClick={() => {
                  setTab("all")
                  setSeriesFilter(s.name)
                  setSearch("")
                  setSpeakerFilter("all")
                  setDisplayCount(INITIAL_COUNT)
                }}
                className="group relative rounded-[20px] bg-white-0 p-7 min-h-[180px] flex flex-col text-left cursor-pointer transition-all hover:shadow-[0px_8px_16px_0px_rgba(0,0,0,0.06)]"
              >
                <div className="mb-4">
                  <div className="bg-white-1-5 inline-flex items-center p-[8px] rounded-[8px]">
                    <svg className="size-[16px] text-black-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-[20px] font-medium text-black-1 tracking-[-0.4px] mb-2">
                  {s.name}
                </h3>
                <p className="text-[13px] text-black-3 mb-4">
                  {s.count} {s.count === 1 ? "Message" : "Messages"} · Last updated {formatDate(s.lastDate)}
                </p>
                <p className="mt-auto text-[12px] font-semibold text-accent-blue tracking-[0.24px] uppercase">
                  VIEW COLLECTION
                </p>
                <div
                  aria-hidden="true"
                  className="absolute border border-white-2-5 inset-0 pointer-events-none rounded-[20px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.04)] transition-shadow group-hover:shadow-[0px_8px_16px_0px_rgba(0,0,0,0.06)]"
                />
              </button>
            ))}
          </div>
        </>
      )}
    </SectionContainer>
  )
}

/* ── Message Card ── */

function MessageCard({ message }: { message: SimpleMessage }) {
  return (
    <Link
      href={`/messages/${message.slug}`}
      className="group relative flex flex-col rounded-[20px] bg-white-0 overflow-hidden transition-all hover:shadow-[0px_8px_16px_0px_rgba(0,0,0,0.06)]"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-black-1 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={message.thumbnailUrl || `https://img.youtube.com/vi/${message.youtubeId}/maxresdefault.jpg`}
          alt={message.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center justify-center rounded-full bg-white-1/90 size-14">
            <svg viewBox="0 0 24 24" fill="none" className="size-6 ml-0.5 text-black-1">
              <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-5">
        {message.series && (
          <span className="bg-white-1-5 self-start px-[8px] py-[4px] rounded-[6px] text-[11px] font-medium text-black-3 tracking-[0.22px]">
            {message.series}
          </span>
        )}
        <h3 className="text-[18px] font-medium text-black-1 tracking-[-0.3px] line-clamp-2">
          {message.title}
        </h3>
        <div className="flex items-center gap-2 text-[13px] text-black-3">
          <span>{message.speaker}</span>
          <span>&bull;</span>
          <span>{formatDate(message.dateFor)}</span>
        </div>
        {message.passage && (
          <span className="text-[13px] text-black-3">{message.passage}</span>
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

/* ── Message List Item ── */

function MessageListItem({ message }: { message: SimpleMessage }) {
  return (
    <Link
      href={`/messages/${message.slug}`}
      className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 py-5 transition-colors hover:bg-white-1-5 -mx-4 px-4 rounded-[12px]"
    >
      {/* Mini thumbnail — desktop only */}
      <div className="relative w-[120px] aspect-video rounded-[8px] overflow-hidden bg-black-1 shrink-0 hidden sm:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://img.youtube.com/vi/${message.youtubeId}/mqdefault.jpg`}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center justify-center rounded-full bg-white-0/80 size-7">
            <svg viewBox="0 0 24 24" fill="none" className="size-3 ml-0.5 text-black-1">
              <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          {message.series && (
            <span className="bg-white-2 px-[8px] py-[4px] rounded-[6px] text-[11px] font-medium text-black-3 tracking-[0.22px] shrink-0">
              {message.series}
            </span>
          )}
          <span className="text-[13px] text-black-3 whitespace-nowrap">
            {formatDate(message.dateFor)}
          </span>
        </div>
        <h3 className="text-[18px] font-medium text-black-1 mb-1 sm:truncate">
          {message.title}
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
          <span className="text-[14px] text-black-3">{message.speaker}</span>
          {message.passage && (
            <span className="text-[14px] text-black-3">{message.passage}</span>
          )}
        </div>
      </div>

      <svg className="size-5 text-black-3 transition-transform group-hover:translate-x-1 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Link>
  )
}
