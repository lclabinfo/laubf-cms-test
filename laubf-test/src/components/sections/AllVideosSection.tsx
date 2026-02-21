/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   heading: string -- section heading (e.g. "All Videos")
 * -- Data --
 *   videos: Video[] -- all videos from database
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: heading fades up on scroll.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: all_videos_sections (id, heading, visible, color_scheme)
 * Videos fetched from videos table with client-side filtering
 */
"use client";

import { useState, useMemo } from "react";
import SectionContainer from "@/components/shared/SectionContainer";
import FilterToolbar from "@/components/shared/FilterToolbar";
import VideoCard from "@/components/shared/VideoCard";
import VideoModal from "@/components/shared/VideoModal";
import { themeTokens } from "@/lib/theme";
import type { AllVideosSectionProps } from "@/lib/types/sections";
import type { Video, VideoFilters } from "@/lib/types/video";
import { filterVideos, deriveCategories } from "@/lib/types/video";
const INITIAL_COUNT = 9;
const LOAD_MORE_COUNT = 9;

export default function AllVideosSection(props: {
  settings: AllVideosSectionProps;
  videos: Video[];
}) {
  const { settings, videos } = props;
  const t = themeTokens[settings.colorScheme];

  /* ── State ── */
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<VideoFilters>({});
  const [displayCount, setDisplayCount] = useState(INITIAL_COUNT);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  /* ── Derived data ── */
  const categoryList = useMemo(() => deriveCategories(videos), [videos]);

  const categoryOptions = useMemo(
    () => categoryList.map((c) => ({ value: c, label: c })),
    [categoryList],
  );

  /* ── Filtering & Sorting ── */
  const filteredVideos = useMemo(() => {
    const filtered = filterVideos(videos, { ...filters, search: search || undefined });
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") {
        cmp = a.datePublished.localeCompare(b.datePublished);
      } else {
        cmp = a.title.localeCompare(b.title);
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [videos, filters, search, sortField, sortDirection]);

  const visibleVideos = filteredVideos.slice(0, displayCount);
  const hasMore = displayCount < filteredVideos.length;

  function updateFilter<K extends keyof VideoFilters>(
    key: K,
    value: VideoFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setDisplayCount(INITIAL_COUNT);
  }

  const tabs = [
    { key: "all", label: "All Videos" },
  ];

  return (
    <SectionContainer settings={settings} className="pt-0 py-30">
      <FilterToolbar
        tabs={{
          options: tabs,
          active: "all",
          onChange: () => {
            setFilters({});
            setSearch("");
            setDisplayCount(INITIAL_COUNT);
          },
        }}
        search={{
          value: search,
          onChange: (v) => {
            setSearch(v);
            setDisplayCount(INITIAL_COUNT);
          },
          placeholder: "Search videos...",
        }}
        filters={[
          {
            id: "category",
            label: "Category",
            value: filters.category ?? "all",
            options: [
              { value: "all", label: "All Categories" },
              ...categoryOptions,
            ],
            onChange: (v) =>
              updateFilter("category", v === "all" ? undefined : v),
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

      {/* Videos grid */}
      {filteredVideos.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <p className={`text-body-1 ${t.textSecondary}`}>
            No videos found matching your criteria.
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => setSelectedVideo(video)}
            />
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
            Load More Videos
          </button>
        </div>
      )}

      {/* Video modal */}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </SectionContainer>
  );
}
