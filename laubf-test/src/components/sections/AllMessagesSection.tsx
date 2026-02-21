/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   heading: string -- section heading (e.g. "All Messages")
 * -- Data --
 *   messages: Message[] -- all messages from database
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: heading fades up on scroll.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: all_messages_sections (id, heading, visible, color_scheme)
 * Messages fetched from messages table with client-side filtering
 *
 * TABS: All Messages | Series
 */
"use client";

import { useState, useMemo } from "react";
import SectionContainer from "@/components/shared/SectionContainer";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import FilterToolbar from "@/components/shared/FilterToolbar";
import MessageCard from "@/components/shared/MessageCard";
import { themeTokens } from "@/lib/theme";
import type { AllMessagesSectionProps } from "@/lib/types/sections";
import type { Message, MessageFilters } from "@/lib/types/message";
import {
  filterMessages,
  deriveSeries,
  deriveSpeakers,
} from "@/lib/types/message";
import {
  IconGrid,
  IconListView,
  IconFolder,
  IconBookOpen,
  IconUser,
  IconVideo,
  IconFileText,
  IconChevronRight,
} from "@/components/layout/icons";
import Link from "next/link";

type TabView = "all" | "series";
type ViewMode = "card" | "list";

const INITIAL_COUNT = 9;
const LOAD_MORE_COUNT = 9;

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AllMessagesSection(props: {
  settings: AllMessagesSectionProps;
  messages: Message[];
}) {
  const { settings, messages } = props;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;

  /* ── State ── */
  const [tab, setTab] = useState<TabView>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<MessageFilters>({});
  const [displayCount, setDisplayCount] = useState(INITIAL_COUNT);
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  /* ── Derived data ── */
  const seriesList = useMemo(() => deriveSeries(messages), [messages]);
  const speakerList = useMemo(() => deriveSpeakers(messages), [messages]);

  const seriesOptions = useMemo(
    () => seriesList.map((s) => ({ value: s.name, label: s.name })),
    [seriesList],
  );

  const speakerOptions = useMemo(
    () => speakerList.map((s) => ({ value: s, label: s })),
    [speakerList],
  );

  /* ── Filtering & Sorting ── */
  const filteredMessages = useMemo(() => {
    const filtered = filterMessages(messages, { ...filters, search: search || undefined });
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") {
        cmp = a.dateFor.localeCompare(b.dateFor);
      } else if (sortField === "speaker") {
        cmp = a.speaker.localeCompare(b.speaker);
      } else {
        cmp = a.title.localeCompare(b.title);
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [messages, filters, search, sortField, sortDirection]);

  const visibleMessages = filteredMessages.slice(0, displayCount);
  const hasMore = displayCount < filteredMessages.length;

  function updateFilter<K extends keyof MessageFilters>(
    key: K,
    value: MessageFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setDisplayCount(INITIAL_COUNT);
  }

  /** Switch to "all" tab with a specific filter pre-applied */
  function switchToAllWithFilter(key: keyof MessageFilters, value: string) {
    setTab("all");
    setFilters({ [key]: value });
    setSearch("");
    setDisplayCount(INITIAL_COUNT);
  }

  const tabs: { key: TabView; label: string }[] = [
    { key: "all", label: "All Messages" },
    { key: "series", label: "Series" },
  ];

  return (
    <SectionContainer settings={settings} className="pt-0 py-30">
      {/* ── Toolbar with tabs + filters ── */}
      <FilterToolbar
        tabs={{
          options: tabs,
          active: tab,
          onChange: (key) => {
            setTab(key as TabView);
            setFilters({});
            setSearch("");
            setDisplayCount(INITIAL_COUNT);
          },
        }}
        viewModes={tab === "all" ? {
          options: [
            { value: "card", label: "Card", icon: <IconGrid className="size-4" /> },
            { value: "list", label: "List", icon: <IconListView className="size-4" /> },
          ],
          active: viewMode,
          onChange: (v) => setViewMode(v as ViewMode),
        } : undefined}
        search={tab === "all" ? {
          value: search,
          onChange: (v) => {
            setSearch(v);
            setDisplayCount(INITIAL_COUNT);
          },
          placeholder: "Search messages, speakers, passages...",
        } : undefined}
        filters={tab === "all" ? [
          {
            id: "series",
            label: "Series",
            value: filters.series ?? "all",
            options: [
              { value: "all", label: "All Series" },
              ...seriesOptions,
            ],
            onChange: (v) =>
              updateFilter("series", v === "all" ? undefined : v),
          },
          {
            id: "speaker",
            label: "Speaker",
            value: filters.speaker ?? "all",
            options: [
              { value: "all", label: "All Speakers" },
              ...speakerOptions,
            ],
            onChange: (v) =>
              updateFilter("speaker", v === "all" ? undefined : v),
          },
        ] : undefined}
        dateRange={tab === "all" ? {
          fromLabel: "From",
          toLabel: "To",
          fromValue: filters.dateFrom ?? "",
          toValue: filters.dateTo ?? "",
          onFromChange: (v) => updateFilter("dateFrom", v || undefined),
          onToChange: (v) => updateFilter("dateTo", v || undefined),
        } : undefined}
        sort={tab === "all" ? {
          options: [
            { value: "date", label: "Date (Newest)", direction: "desc" },
            { value: "date", label: "Date (Oldest)", direction: "asc" },
            { value: "title", label: "Title (A-Z)", direction: "asc" },
            { value: "title", label: "Title (Z-A)", direction: "desc" },
            { value: "speaker", label: "Speaker (A-Z)", direction: "asc" },
            { value: "speaker", label: "Speaker (Z-A)", direction: "desc" },
          ],
          active: sortField,
          direction: sortDirection,
          onChange: (value, dir) => {
            setSortField(value);
            setSortDirection(dir);
          },
        } : undefined}
        onReset={tab === "all" ? () => {
          setSearch("");
          setFilters({});
          setDisplayCount(INITIAL_COUNT);
        } : undefined}
        className="mb-8"
      />

      {/* ── All Messages Tab ── */}
      {tab === "all" && (
        <>
          {/* Messages display */}
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <p className={`text-body-1 ${t.textSecondary}`}>
                No messages found matching your criteria.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setFilters({});
                  setDisplayCount(INITIAL_COUNT);
                }}
                className="mt-4 text-accent-blue text-[14px] font-medium hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : viewMode === "card" ? (
            <CardGrid messages={visibleMessages} />
          ) : (
            <MessageListView messages={visibleMessages} />
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

      {/* ── Series Tab ── */}
      {tab === "series" && (
        <>
          <AnimateOnScroll animation="fade-up" enabled={animate}>
            <h2 className={`text-h2 ${t.textPrimary} mb-8`}>Series</h2>
          </AnimateOnScroll>
          <SeriesGrid
            series={seriesList}
            onSeriesClick={(name) => switchToAllWithFilter("series", name)}
          />
        </>
      )}
    </SectionContainer>
  );
}

/* ── Card Grid ── */

function CardGrid({ messages }: { messages: Message[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {messages.map((message) => (
        <MessageCard key={message.id} message={message} />
      ))}
    </div>
  );
}

/* ── List View ── */

function MessageListView({ messages }: { messages: Message[] }) {
  return (
    <div className="flex flex-col divide-y divide-white-2/50">
      {messages.map((message) => (
        <Link
          key={message.id}
          href={`/messages/${message.slug}`}
          className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 py-5 transition-colors hover:bg-white-1-5 -mx-4 px-4 rounded-[12px]"
        >
          {/* Mini YouTube thumbnail — desktop only */}
          <div className="relative w-[120px] aspect-video rounded-[8px] overflow-hidden bg-black-1 shrink-0 hidden sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://img.youtube.com/vi/${message.youtubeId}/mqdefault.jpg`}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center justify-center rounded-full bg-white-0/80 size-7">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="size-3 ml-0.5 text-black-1"
                >
                  <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-white-2 px-[8px] py-[4px] rounded-[6px] text-[11px] font-medium text-black-3 tracking-[0.22px] shrink-0">
                {message.series}
              </span>
              <span className="text-[13px] text-black-3 whitespace-nowrap">
                {formatDate(message.dateFor)}
              </span>
            </div>
            <h3 className="text-[18px] font-medium text-black-1 mb-1 sm:truncate">
              {message.title}
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <div className="flex items-center gap-2">
                <IconUser className="size-[14px] text-black-3 shrink-0" />
                <span className="text-[14px] text-black-3">{message.speaker}</span>
              </div>
              <div className="flex items-center gap-2">
                <IconBookOpen className="size-[14px] text-black-3 shrink-0" />
                <span className="text-[14px] text-black-3">{message.passage}</span>
              </div>
            </div>
          </div>

          {/* Icons + arrow — bottom row on mobile, right column on desktop */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <div className="flex gap-1.5">
              <div className="bg-white-1-5 p-[6px] rounded-[6px]">
                <IconVideo className="size-[14px] text-black-2" />
              </div>
              {message.liveTranscript && (
                <div className="bg-white-1-5 p-[6px] rounded-[6px]">
                  <IconFileText className="size-[14px] text-black-2" />
                </div>
              )}
            </div>
            <IconChevronRight className="size-5 text-black-3 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ── Series Grid ── */

function SeriesGrid({
  series,
  onSeriesClick,
}: {
  series: { name: string; slug: string; messageCount: number; lastUpdated: string }[];
  onSeriesClick: (name: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {series.map((s) => (
        <SeriesCard key={s.slug} series={s} onClick={() => onSeriesClick(s.name)} />
      ))}
    </div>
  );
}

function SeriesCard({
  series,
  onClick,
}: {
  series: { name: string; slug: string; messageCount: number; lastUpdated: string };
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative rounded-[20px] bg-white-0 p-7 min-h-[180px] flex flex-col text-left cursor-pointer transition-all hover:shadow-[0px_8px_16px_0px_rgba(0,0,0,0.06)]"
    >
      {/* Folder icon */}
      <div className="mb-4">
        <div className="bg-white-1-5 inline-flex items-center p-[8px] rounded-[8px]">
          <IconFolder className="size-[16px] text-black-2" />
        </div>
      </div>

      {/* Series name */}
      <h3 className="text-[20px] font-medium text-black-1 tracking-[-0.4px] mb-2">
        {series.name}
      </h3>

      {/* Meta */}
      <p className="text-[13px] text-black-3 mb-4">
        {series.messageCount} {series.messageCount === 1 ? "Message" : "Messages"} · Last
        updated {series.lastUpdated}
      </p>

      {/* View collection link */}
      <p className="mt-auto text-[12px] font-semibold text-accent-blue tracking-[0.24px] uppercase">
        VIEW COLLECTION
      </p>

      {/* Border overlay */}
      <div
        aria-hidden="true"
        className="absolute border border-white-2-5 inset-0 pointer-events-none rounded-[20px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.04)] transition-shadow group-hover:shadow-[0px_8px_16px_0px_rgba(0,0,0,0.06)]"
      />
    </button>
  );
}
