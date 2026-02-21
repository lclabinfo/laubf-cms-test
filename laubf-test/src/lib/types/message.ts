/* ── Message (Sermon) Types ── */

export interface Message {
  id: string;
  slug: string;
  title: string;

  /** YouTube video ID for embedding and thumbnail */
  youtubeId: string;
  /** Speaker name (e.g. "P. William", "P. Abraham Kim") */
  speaker: string;
  /** Series/event grouping (e.g. "Sunday Message", "Conference") */
  series: string;
  /** Bible reference (e.g. "John 21:1-25") */
  passage: string;
  /** The date the message was delivered (ISO format "YYYY-MM-DD") */
  dateFor: string;
  /** Short description of the message */
  description: string;

  /** Prepared/written transcript — rich text HTML. Always present. */
  rawTranscript: string;
  /** Auto-generated live transcript — rich text HTML. Default when available. */
  liveTranscript?: string;

  /** ID of the related bible study, if one exists */
  relatedStudyId?: string;
  /** Duration string (e.g. "45:23") */
  duration?: string;
}

/** Derived series data for the Series view */
export interface MessageSeries {
  name: string;
  slug: string;
  messageCount: number;
  lastUpdated: string;
}

/* ── Filter Types ── */

export interface MessageFilters {
  search?: string;
  series?: string;
  speaker?: string;
  dateFrom?: string;
  dateTo?: string;
}

/* ── Filter Helper ── */

export function filterMessages(
  messages: Message[],
  filters: MessageFilters,
): Message[] {
  return messages.filter((m) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        m.title.toLowerCase().includes(q) ||
        m.passage.toLowerCase().includes(q) ||
        m.series.toLowerCase().includes(q) ||
        m.speaker.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.series && m.series !== filters.series) return false;
    if (filters.speaker && m.speaker !== filters.speaker) return false;
    if (filters.dateFrom && m.dateFor < filters.dateFrom) return false;
    if (filters.dateTo && m.dateFor > filters.dateTo) return false;
    return true;
  });
}

/** Derive unique series from messages list */
export function deriveSeries(messages: Message[]): MessageSeries[] {
  const map = new Map<string, { count: number; lastDate: string }>();
  for (const m of messages) {
    const existing = map.get(m.series);
    if (!existing) {
      map.set(m.series, { count: 1, lastDate: m.dateFor });
    } else {
      existing.count++;
      if (m.dateFor > existing.lastDate) existing.lastDate = m.dateFor;
    }
  }
  return Array.from(map.entries())
    .map(([name, data]) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      messageCount: data.count,
      lastUpdated: data.lastDate,
    }))
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
}

/** Derive unique speaker names from messages */
export function deriveSpeakers(messages: Message[]): string[] {
  const speakers = new Set<string>();
  for (const m of messages) {
    speakers.add(m.speaker);
  }
  return Array.from(speakers).sort();
}
