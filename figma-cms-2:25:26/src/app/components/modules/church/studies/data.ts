
export interface Study {
  id: string;
  book: string;
  reference: string;
  title: string;
  date: string;
  series: string;
  hasVideo: boolean;
  hasTranscript: boolean;
  isUpcoming?: boolean;
  pdfUrl?: string;
  videoUrl?: string;
  transcriptUrl?: string;
}

export const mockStudies: Study[] = [
  {
    id: "s1",
    book: "John",
    reference: "John 21:1-25",
    title: "Do You Truly Love Me More Than These?",
    date: "2026-04-12",
    series: "John",
    hasVideo: false,
    hasTranscript: true,
    isUpcoming: true,
  },
  {
    id: "s2",
    book: "John",
    reference: "John 17:14-26",
    title: "Not Of The World",
    date: "2026-01-04",
    series: "John",
    hasVideo: false,
    hasTranscript: false,
  },
  {
    id: "s3",
    book: "Psalms",
    reference: "Psalm 136:1-26",
    title: "HIS STEADFAST LOVE ENDURES FOREVER",
    date: "2025-12-14",
    series: "Psalms",
    hasVideo: true,
    hasTranscript: true,
  },
  {
    id: "s4",
    book: "Matthew",
    reference: "Matthew 2:1-12",
    title: "To Worship Him: Joy for a Broken World",
    date: "2025-12-07",
    series: "Advent 2025",
    hasVideo: true,
    hasTranscript: true,
  },
  {
    id: "s5",
    book: "Mark",
    reference: "Mark 1:1-8",
    title: "Prepare the Way for the Lord",
    date: "2025-11-30",
    series: "Advent 2025",
    hasVideo: true,
    hasTranscript: true,
  },
  {
    id: "s6",
    book: "Colossians",
    reference: "Colossians 3:1-17",
    title: "Christ is All, and is in All",
    date: "2025-11-23",
    series: "Colossians",
    hasVideo: true,
    hasTranscript: true,
  },
  {
    id: "s7",
    book: "Colossians",
    reference: "Colossians 3:1-4",
    title: "Set Your Minds on Things Above",
    date: "2025-11-16",
    series: "Colossians",
    hasVideo: true,
    hasTranscript: true,
  },
  {
    id: "s8",
    book: "Exodus",
    reference: "Exodus 2:11-22",
    title: "Watered The Flock",
    date: "2024-01-24",
    series: "Exodus",
    hasVideo: true,
    hasTranscript: true,
  }
];

export interface BibleStudyPageData {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  bannerImage: string;
}

export const mockPageData: BibleStudyPageData = {
  heroTitle: "Study Guides",
  heroSubtitle: "Discipleship Tools",
  heroDescription: "Deep dive into the Word of God with our weekly bible study materials and questions.",
  bannerImage: "https://images.unsplash.com/photo-1473177104440-ffee2f376098?auto=format&fit=crop&q=80"
};
