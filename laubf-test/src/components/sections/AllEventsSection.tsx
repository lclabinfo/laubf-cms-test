/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   heading: string -- section heading (e.g. "All Events")
 * -- Data --
 *   events: Event[] -- all events from database
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: heading fades up on scroll.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: all_events_sections (id, heading, visible, color_scheme)
 * Events fetched from events table with client-side filtering
 */
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SectionContainer from "@/components/shared/SectionContainer";
import EventListItem from "@/components/shared/EventListItem";
import FilterToolbar from "@/components/shared/FilterToolbar";
import { themeTokens } from "@/lib/theme";
import type { AllEventsSectionProps } from "@/lib/types/sections";
import type { Event } from "@/lib/types/events";
import {
  filterEvents,
  getEventBadge,
  toEventListItemData,
  MINISTRY_LABELS,
  CAMPUS_LABELS,
  type EventFilters,
  type MinistryTag,
  type CampusTag,
} from "@/lib/types/events";
import EventCalendarGrid from "@/components/shared/EventCalendarGrid";
import type { EventType } from "@/lib/types/shared";
import {
  IconGrid,
  IconListView,
  IconCalendar,
} from "@/components/layout/icons";
import EventGridCard from "@/components/shared/EventGridCard";

type TabView = "event" | "meeting" | "program";
type ViewMode = "card" | "list" | "calendar";

const VALID_TABS: TabView[] = ["event", "meeting", "program"];
const INITIAL_COUNT = 9;
const LOAD_MORE_COUNT = 9;

export default function AllEventsSection(props: {
  settings: AllEventsSectionProps;
  events: Event[];
  initialTab?: TabView;
}) {
  const { settings, events } = props;
  const t = themeTokens[settings.colorScheme];

  const searchParams = useSearchParams();
  const router = useRouter();

  /* ── Derive tab from URL so navbar clicks always sync ── */
  const urlTab = searchParams.get("tab");
  const activeTab: TabView =
    VALID_TABS.includes(urlTab as TabView) ? (urlTab as TabView) : (props.initialTab ?? "event");

  /* ── State ── */
  const [tab, setTab] = useState<TabView>(activeTab);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<EventFilters>({});
  const [displayCount, setDisplayCount] = useState(INITIAL_COUNT);
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  /* ── Sync tab when URL changes (e.g. navbar click while already on page) ── */
  useEffect(() => {
    if (activeTab !== tab) {
      setTab(activeTab);
      setFilters({});
      setSearch("");
      setDisplayCount(INITIAL_COUNT);
    }
  }, [activeTab]);

  /* ── URL sync ── */
  const updateTabInUrl = useCallback(
    (newTab: TabView) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", newTab);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  /* ── Filtering & Sorting ── */
  const filteredEvents = useMemo(() => {
    const typeFilter: EventFilters = {
      ...filters,
      search: search || undefined,
      type: tab as EventType,
    };
    const filtered = filterEvents(events, typeFilter);
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") {
        cmp = a.dateStart.localeCompare(b.dateStart);
      } else {
        cmp = a.title.localeCompare(b.title);
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [events, filters, search, tab, sortField, sortDirection]);

  const visibleEvents = filteredEvents.slice(0, displayCount);
  const hasMore = displayCount < filteredEvents.length;

  function updateFilter<K extends keyof EventFilters>(
    key: K,
    value: EventFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setDisplayCount(INITIAL_COUNT);
  }

  const tabs: { key: TabView; label: string; mobileLabel?: string }[] = [
    { key: "event", label: "Events" },
    { key: "meeting", label: "Meetings" },
    { key: "program", label: "Programs" },
  ];

  return (
    <SectionContainer settings={settings} className="pt-0 py-30">
      {/* Filter toolbar */}
      <FilterToolbar
        tabs={{
          options: tabs,
          active: tab,
          onChange: (key) => {
            const newTab = key as TabView;
            setTab(newTab);
            updateTabInUrl(newTab);
            setFilters({});
            setSearch("");
            setDisplayCount(INITIAL_COUNT);
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
            setSearch(v);
            setDisplayCount(INITIAL_COUNT);
          },
          placeholder: "Search events, meetings, programs...",
        }}
        filters={[
          {
            id: "ministry",
            label: "Ministry",
            value: filters.ministry ?? "all",
            options: [
              { value: "all", label: "All Ministries" },
              ...Object.entries(MINISTRY_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            ],
            onChange: (v) =>
              updateFilter(
                "ministry",
                v === "all" ? undefined : (v as MinistryTag),
              ),
          },
          {
            id: "campus",
            label: "Campus",
            value: filters.campus ?? "all",
            options: [
              { value: "all", label: "All Campuses" },
              ...Object.entries(CAMPUS_LABELS)
                .filter(([k]) => k !== "all")
                .map(([value, label]) => ({ value, label })),
            ],
            onChange: (v) =>
              updateFilter("campus", v === "all" ? undefined : (v as CampusTag)),
          },
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
            setSortField(value);
            setSortDirection(dir);
          },
        }}
        onReset={() => {
          setSearch("");
          setFilters({});
          setDisplayCount(INITIAL_COUNT);
        }}
        className="mb-8"
      />

      {/* Events display */}
      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <p className={`text-body-1 ${t.textSecondary}`}>
            No events found matching your criteria.
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
        <CardView events={visibleEvents} />
      ) : viewMode === "list" ? (
        <ListView events={visibleEvents} />
      ) : (
        <EventCalendarGrid events={filteredEvents} />
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
  );
}

/* ── Card View ── */

function CardView({ events }: { events: Event[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {events.map((event) => (
        <EventGridCard key={event.slug} event={event} />
      ))}
    </div>
  );
}

/* ── List View ── */

function ListView({ events }: { events: Event[] }) {
  return (
    <div className="flex flex-col">
      {events.map((event) => {
        const data = toEventListItemData(event);
        return <EventListItem key={event.slug} data={data} />;
      })}
    </div>
  );
}
