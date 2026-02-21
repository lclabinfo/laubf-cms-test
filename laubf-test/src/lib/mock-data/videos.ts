import type { Video } from "@/lib/types/video";

/**
 * Mock video data — sorted by datePublished descending (newest first).
 * In production this comes from YouTube Data API / CMS.
 */
export const MOCK_VIDEOS: Video[] = [
  {
    id: "vid-1",
    slug: "nayac-2026-promo",
    title: "2026 North American Young Adult Conference (NAYAC) Promo",
    youtubeId: "IIEB_svkXRc",
    category: "Promo",
    datePublished: "2026-01-15",
    duration: "2:15",
    description:
      "Get ready for NAYAC 2026! Join hundreds of young adults from across North America for a weekend of worship, fellowship, and God's word.",
  },
  {
    id: "vid-2",
    slug: "christmas-recitation-2025",
    title: "MERRY CHRISTMAS! 2025 UBF Christmas Recitation on Luke 1",
    youtubeId: "NiYsr_oIRus",
    category: "Event Recap",
    datePublished: "2025-12-25",
    duration: "8:12",
    description:
      "A special Christmas recitation of Luke 1 featuring members from LA UBF. Celebrating the birth of our Lord Jesus Christ through Scripture and community.",
  },
  {
    id: "vid-3",
    slug: "instagram-bio-verse",
    title: "What Verse Is in Your Instagram Bio?",
    youtubeId: "w49sFWHs5vI",
    category: "Special Feature",
    datePublished: "2025-11-08",
    duration: "5:30",
    description:
      "We asked members of our community what Bible verse they have in their Instagram bio and why it's meaningful to them. Hear their stories!",
  },
  {
    id: "vid-4",
    slug: "daily-bread-quiet-time",
    title: "Daily Bread: How I Do My Quiet Time",
    youtubeId: "LmYwdnwdK-k",
    category: "Daily Bread",
    datePublished: "2025-10-14",
    duration: "0:58",
    description:
      "A quick look at how one of our members spends time with God through Daily Bread devotionals each morning.",
    isShort: true,
  },
  {
    id: "vid-5",
    slug: "testimony-gods-faithfulness",
    title: "Testimony: God's Faithfulness in College",
    youtubeId: "evUrqDOpAoE",
    category: "Testimony",
    datePublished: "2025-09-20",
    duration: "0:48",
    description:
      "A student shares their testimony of how God remained faithful throughout their college journey and led them to a community of believers.",
    isShort: true,
  },
  {
    id: "vid-6",
    slug: "describe-ubf-in-3-words",
    title: "Describe UBF in 3 Words",
    youtubeId: "WqeW4HtM06M",
    category: "Special Feature",
    datePublished: "2025-08-05",
    duration: "3:45",
    description:
      "We asked members from University Bible Fellowship to describe UBF in just three words. Their answers might surprise you!",
  },
];
