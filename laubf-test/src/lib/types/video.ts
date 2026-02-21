/* ── Video Types ── */

export type VideoCategory =
  | "Event Recap"
  | "Worship"
  | "Testimony"
  | "Special Feature"
  | "Daily Bread"
  | "Promo";

export interface Video {
  id: string;
  slug: string;
  title: string;

  /** YouTube video ID for embedding and thumbnail */
  youtubeId: string;
  /** Content category */
  category: VideoCategory;
  /** The date the video was published (ISO format "YYYY-MM-DD") */
  datePublished: string;
  /** Duration string (e.g. "3:45") */
  duration: string;
  /** Short description of the video */
  description: string;
  /** Whether this is a YouTube Short (vertical format) */
  isShort?: boolean;
}

/* ── Filter Types ── */

export interface VideoFilters {
  search?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}

/* ── Filter Helper ── */

export function filterVideos(
  videos: Video[],
  filters: VideoFilters,
): Video[] {
  return videos.filter((v) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        v.title.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.category && v.category !== filters.category) return false;
    if (filters.dateFrom && v.datePublished < filters.dateFrom) return false;
    if (filters.dateTo && v.datePublished > filters.dateTo) return false;
    return true;
  });
}

/** Derive unique categories from video list */
export function deriveCategories(videos: Video[]): string[] {
  const cats = new Set<string>();
  for (const v of videos) {
    cats.add(v.category);
  }
  return Array.from(cats).sort();
}
