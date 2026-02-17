
export interface Attachment {
    name: string
    size: string
    type: string
}

export interface StudyTab {
    id: string
    title: string
    content: string
}

export interface Series {
    id: string
    name: string
    imageUrl?: string
}

export interface Entry {
  id: string
  title: string
  date: string
  speaker: string
  passage: string
  seriesIds: string[]
  
  // Universal Status
  status: "published" | "draft" | "scheduled" | "archived"
  
  // Sermon Data
  videoUrl?: string
  description?: string
  transcript?: string
  views: number
  thumbnailMethod?: "youtube" | "upload" | "ai"
  
  // Study Data
  studyTabs: StudyTab[]
  attachments: Attachment[]
  downloads: number
}

export const mockSeries: Series[] = [
    { id: "s1", name: "Faith Foundations", imageUrl: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=300&auto=format&fit=crop" },
    { id: "s2", name: "Easter 2024", imageUrl: "https://images.unsplash.com/photo-1529310098912-b3a63d1ead6b?q=80&w=300&auto=format&fit=crop" },
    { id: "s3", name: "Guest Series", imageUrl: "https://images.unsplash.com/photo-1544427920-c49cc113ff6e?q=80&w=300&auto=format&fit=crop" }
];

export const mockEntries: Entry[] = [
  {
    id: "1",
    title: "Walking in Faith",
    date: "2024-03-10",
    speaker: "Pastor John Doe",
    passage: "Hebrews 11:1-6",
    seriesIds: ["s1"],
    
    status: "published",
    
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "A sermon about faith and how to walk in it daily.",
    transcript: "00:00 Welcome everyone...\n00:30 Let's turn to Hebrews 11...",
    views: 1250,
    
    studyTabs: [
        { id: "t1", title: "Questions", content: "1. What is faith?\n2. How do we walk in it?" },
        { id: "t2", title: "Answers", content: "Leader's Guide for Hebrews 11..." }
    ],
    attachments: [{ name: "Handout.pdf", size: "1.2 MB", type: "pdf" }],
    downloads: 45
  },
  {
    id: "2",
    title: "The Power of Prayer",
    date: "2024-03-03",
    speaker: "Pastor John Doe",
    passage: "James 5:13-18",
    seriesIds: ["s1"],
    
    status: "published",
    
    videoUrl: "https://www.youtube.com/watch?v=xyz123",
    views: 980,
    
    studyTabs: [
        { id: "t1", title: "Questions", content: "" },
        { id: "t2", title: "Answers", content: "" }
    ],
    attachments: [],
    downloads: 0
  },
  {
    id: "3",
    title: "Understanding Grace",
    date: "2024-02-25",
    speaker: "Guest Speaker Jane Smith",
    passage: "Romans 3:21-26",
    seriesIds: ["s3"],
    
    status: "draft",
    views: 0,
    
    studyTabs: [
        { id: "t1", title: "Questions", content: "" },
        { id: "t2", title: "Answers", content: "Grace is essential..." }
    ],
    attachments: [],
    downloads: 120
  },
  {
    id: "4",
    title: "Easter Service Prep",
    date: "2024-03-31",
    speaker: "Pastor John Doe",
    passage: "Matthew 28",
    seriesIds: ["s2"],
    
    status: "scheduled",
    videoUrl: "",
    views: 0,
    
    studyTabs: [
        { id: "t1", title: "Questions", content: "Draft questions..." },
        { id: "t2", title: "Answers", content: "" }
    ],
    attachments: [],
    downloads: 0
  }
]

export const addEntry = (entry: Entry) => {
    mockEntries.unshift(entry);
}

export const addSeries = (series: Series) => {
    mockSeries.push(series);
}

export const updateSeries = (id: string, updates: Partial<Series>) => {
    const index = mockSeries.findIndex(s => s.id === id);
    if (index !== -1) {
        mockSeries[index] = { ...mockSeries[index], ...updates };
    }
}

export const deleteSeries = (id: string) => {
    const index = mockSeries.findIndex(s => s.id === id);
    if (index !== -1) {
        mockSeries.splice(index, 1);
    }
}

// LEGACY EXPORTS (Maintained to prevent build errors in dormant files)
export interface Sermon {
  id: string
  title: string
  speaker: string
  date: string
  passage: string
  series: string
  status: "published" | "draft" | "scheduled" | "hidden"
  views: number
  featured: boolean
  source?: "manual" | "youtube_playlist"
  sourcePlaylistName?: string
  videoUrl?: string
  description?: string
  transcript?: string
  bibleStudyId?: string
}

export interface Study {
  id: string
  title: string
  passage: string
  author: string
  series?: string
  status: "published" | "draft" | "archived"
  lastModified: string
  downloads: number
  linkedSermonId?: string
  guideContent?: string
  questionsContent?: string
}

export const mockSermons: Sermon[] = [];
export const mockStudies: Study[] = [];

export const addSermon = (sermon: Sermon) => {
    mockSermons.unshift(sermon);
}

export const addStudy = (study: Study) => {
    mockStudies.unshift(study);
}
