export type TranscriptSegment = {
  id: string
  startTime: string // "00:01:23"
  endTime: string   // "00:01:45"
  text: string
}

export type StudySection = {
  id: string
  title: string
  content: string
}

export type Attachment = {
  id: string
  name: string
  size: string       // formatted display string
  type: string
  url?: string       // R2 public URL (set after upload)
  r2Key?: string     // R2 object key (for deletion)
  fileSize?: number  // raw bytes (for quota tracking)
}

export type Message = {
  id: string
  slug: string
  title: string
  videoTitle?: string
  passage: string
  bibleVersion?: string
  speaker: string
  speakerId?: string
  seriesId: string | null
  /** The date the message/sermon was delivered (e.g. Sunday service date) */
  date: string
  /** When the entry was first published */
  publishedAt?: string
  /** When the entry was archived (null = not archived) */
  archivedAt?: string | null
  hasVideo: boolean
  hasStudy: boolean
  /** Whether the video content is published on the public site */
  videoPublished: boolean
  /** Whether the bible study content is published on the public site */
  studyPublished: boolean
  /** Whether video content exists (URL/youtubeId set), regardless of publish state */
  hasVideoContent: boolean
  /** Whether study content exists (studySections with content), regardless of publish state */
  hasStudyContent: boolean
  // Detail fields (populated when editing)
  videoUrl?: string
  videoDescription?: string
  youtubeId?: string
  thumbnailUrl?: string
  duration?: string
  audioUrl?: string
  rawTranscript?: string
  liveTranscript?: string
  transcriptSegments?: TranscriptSegment[]
  studySections?: StudySection[]
  attachments?: Attachment[]
}

export type Series = {
  id: string
  name: string
  imageUrl?: string
  messageCount: number
}
