export type MessageStatus = "published" | "draft" | "scheduled" | "archived"

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
}

export type Message = {
  id: string
  title: string
  passage: string
  speaker: string
  seriesIds: string[]
  /** The date the message/sermon was delivered (e.g. Sunday service date) */
  date: string
  /** When the entry was or will be posted (ISO datetime for scheduled, date for published) */
  publishedAt?: string
  status: MessageStatus
  hasVideo: boolean
  hasStudy: boolean
  // Detail fields (populated when editing)
  videoUrl?: string
  videoDescription?: string
  rawTranscript?: string
  transcriptSegments?: TranscriptSegment[]
  studySections?: StudySection[]
  attachments?: Attachment[]
}

export type Series = {
  id: string
  name: string
  imageUrl?: string
}

export const series: Series[] = [
  { id: "s1", name: "Gospel of John" },
  { id: "s2", name: "Psalms of Hope" },
  { id: "s3", name: "Acts: The Early Church" },
  { id: "s4", name: "Romans Deep Dive" },
]

export const messages: Message[] = [
  {
    id: "m1",
    title: "The Word Became Flesh",
    passage: "John 1:1-14",
    speaker: "Pastor David",
    seriesIds: ["s1"],
    date: "2026-02-15",
    publishedAt: "2026-02-15T09:00:00",
    status: "published",
    hasVideo: true,
    hasStudy: true,
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoDescription: "Pastor David walks through the prologue of John's Gospel, exploring the theology of the incarnation and what it means that the Word became flesh and dwelt among us.",
    rawTranscript: "Good morning everyone. Today we're looking at John chapter 1, verses 1 through 14. This is one of the most profound passages in all of Scripture. In the beginning was the Word, and the Word was with God, and the Word was God. John opens his Gospel not with a birth narrative, but with a theological declaration that echoes Genesis 1. The Word, the Logos, existed before creation itself.",
    transcriptSegments: [
      { id: "ts1", startTime: "00:00:05", endTime: "00:00:15", text: "Good morning everyone. Today we're looking at John chapter 1, verses 1 through 14." },
      { id: "ts2", startTime: "00:00:15", endTime: "00:00:25", text: "This is one of the most profound passages in all of Scripture." },
      { id: "ts3", startTime: "00:00:25", endTime: "00:00:42", text: "In the beginning was the Word, and the Word was with God, and the Word was God." },
      { id: "ts4", startTime: "00:00:42", endTime: "00:01:00", text: "John opens his Gospel not with a birth narrative, but with a theological declaration that echoes Genesis 1." },
      { id: "ts5", startTime: "00:01:00", endTime: "00:01:15", text: "The Word, the Logos, existed before creation itself." },
    ],
    studySections: [
      { id: "ss1", title: "Questions", content: "1. What does John mean by \"the Word\" (Logos) in verse 1?\n2. How does John 1:1 connect to Genesis 1:1?\n3. What is the significance of \"the Word became flesh\" (v.14)?\n4. How does the concept of \"grace and truth\" apply to our daily lives?\n5. Discuss what it means that \"to all who received him, he gave the right to become children of God\" (v.12)." },
      { id: "ss2", title: "Answers", content: "1. The \"Word\" (Logos) refers to Jesus Christ as the eternal, divine expression of God. In Greek philosophy, Logos meant the rational principle governing the universe, but John gives it a personal dimension.\n2. Both passages begin with \"In the beginning,\" establishing that the Word was present at creation and is indeed the Creator.\n3. The incarnation is the central miracle of Christianity — God taking on human nature to dwell among humanity.\n4. Grace and truth are complementary: God's unmerited favor comes with the reality of who He is and what He requires.\n5. Receiving Christ means believing in His name, which grants the right to enter God's family — not by human effort but by divine birth." },
    ],
    attachments: [
      { id: "a1", name: "John 1 Study Guide.pdf", size: "245 KB", type: "application/pdf" },
      { id: "a2", name: "Sermon Outline.pdf", size: "128 KB", type: "application/pdf" },
    ],
  },
  {
    id: "m2",
    title: "The First Disciples",
    passage: "John 1:35-51",
    speaker: "Pastor David",
    seriesIds: ["s1"],
    date: "2026-02-08",
    publishedAt: "2026-02-08T09:00:00",
    status: "published",
    hasVideo: true,
    hasStudy: false,
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoDescription: "A look at how Jesus called His first disciples and what it means to follow Him today.",
  },
  {
    id: "m3",
    title: "Water Into Wine",
    passage: "John 2:1-12",
    speaker: "Pastor Sarah",
    seriesIds: ["s1"],
    date: "2026-02-22",
    publishedAt: "2026-02-21T18:00:00",
    status: "scheduled",
    hasVideo: false,
    hasStudy: true,
    studySections: [
      { id: "ss3", title: "Questions", content: "1. Why did Jesus attend the wedding at Cana?\n2. What is the significance of the water jars used for ceremonial washing?\n3. How does this miracle reveal Jesus' glory?\n4. What does Mary's response teach us about faith?" },
      { id: "ss4", title: "Answers", content: "1. Jesus' presence at the wedding shows His care for everyday human celebrations and relationships.\n2. The jars for ceremonial washing being filled with wine symbolizes the new covenant replacing old rituals.\n3. This first sign reveals Jesus' divine power and authority over nature.\n4. Mary trusted Jesus even when she didn't know how He would act — a model of faith for us." },
    ],
  },
  {
    id: "m4",
    title: "The Lord Is My Shepherd",
    passage: "Psalm 23",
    speaker: "Pastor David",
    seriesIds: ["s2"],
    date: "2026-01-25",
    publishedAt: "2026-01-25T09:00:00",
    status: "published",
    hasVideo: true,
    hasStudy: true,
  },
  {
    id: "m5",
    title: "A Song of Ascent",
    passage: "Psalm 121",
    speaker: "Pastor Sarah",
    seriesIds: ["s2"],
    date: "2026-01-18",
    publishedAt: "2026-01-18T09:00:00",
    status: "published",
    hasVideo: true,
    hasStudy: false,
  },
  {
    id: "m6",
    title: "Hope in the Depths",
    passage: "Psalm 130",
    speaker: "Elder James",
    seriesIds: ["s2"],
    date: "2026-01-11",
    status: "archived",
    hasVideo: false,
    hasStudy: true,
  },
  {
    id: "m7",
    title: "The Day of Pentecost",
    passage: "Acts 2:1-21",
    speaker: "Pastor David",
    seriesIds: ["s3"],
    date: "2026-02-01",
    publishedAt: "2026-02-01T09:00:00",
    status: "published",
    hasVideo: true,
    hasStudy: true,
  },
  {
    id: "m8",
    title: "Peter's Sermon",
    passage: "Acts 2:22-41",
    speaker: "Elder James",
    seriesIds: ["s3"],
    date: "2026-01-04",
    status: "draft",
    hasVideo: false,
    hasStudy: false,
  },
  {
    id: "m9",
    title: "Life in Community",
    passage: "Acts 2:42-47",
    speaker: "Pastor Sarah",
    seriesIds: ["s3"],
    date: "2025-12-28",
    publishedAt: "2025-12-28T09:00:00",
    status: "published",
    hasVideo: true,
    hasStudy: true,
  },
  {
    id: "m10",
    title: "Justified by Faith",
    passage: "Romans 3:21-31",
    speaker: "Pastor David",
    seriesIds: ["s4"],
    date: "2025-12-21",
    publishedAt: "2025-12-21T09:00:00",
    status: "published",
    hasVideo: true,
    hasStudy: false,
  },
  {
    id: "m11",
    title: "Peace with God",
    passage: "Romans 5:1-11",
    speaker: "Pastor David",
    seriesIds: ["s4"],
    date: "2025-12-14",
    status: "draft",
    hasVideo: false,
    hasStudy: true,
  },
  {
    id: "m12",
    title: "More Than Conquerors",
    passage: "Romans 8:31-39",
    speaker: "Elder James",
    seriesIds: ["s4"],
    date: "2025-12-07",
    publishedAt: "2025-12-07T09:00:00",
    status: "published",
    hasVideo: true,
    hasStudy: true,
  },
]
