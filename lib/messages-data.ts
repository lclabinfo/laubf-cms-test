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
  size: string
  type: string
  url?: string
}

export type Message = {
  id: string
  slug: string
  title: string
  passage: string
  bibleVersion?: string
  speaker: string
  speakerId?: string
  seriesId: string | null
  /** The date the message/sermon was delivered (e.g. Sunday service date) */
  date: string
  /** When the entry was first published */
  publishedAt?: string
  hasVideo: boolean
  hasStudy: boolean
  /** Whether the video content is published on the public site */
  videoPublished: boolean
  /** Whether the bible study content is published on the public site */
  studyPublished: boolean
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
}
