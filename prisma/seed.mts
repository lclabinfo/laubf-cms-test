import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const mod = await import('../lib/generated/prisma/client.ts')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

// ============================================================
// Helper: slugify
// ============================================================
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ============================================================
// Helper: Bible book name to BibleBook enum
// ============================================================
const BIBLE_BOOK_MAP: Record<string, string> = {
  'genesis': 'GENESIS',
  'exodus': 'EXODUS',
  'leviticus': 'LEVITICUS',
  'numbers': 'NUMBERS',
  'deuteronomy': 'DEUTERONOMY',
  'joshua': 'JOSHUA',
  'judges': 'JUDGES',
  'ruth': 'RUTH',
  '1 samuel': 'FIRST_SAMUEL',
  '2 samuel': 'SECOND_SAMUEL',
  '1 kings': 'FIRST_KINGS',
  '2 kings': 'SECOND_KINGS',
  '1 chronicles': 'FIRST_CHRONICLES',
  '2 chronicles': 'SECOND_CHRONICLES',
  'ezra': 'EZRA',
  'nehemiah': 'NEHEMIAH',
  'esther': 'ESTHER',
  'job': 'JOB',
  'psalms': 'PSALMS',
  'psalm': 'PSALMS',
  'proverbs': 'PROVERBS',
  'ecclesiastes': 'ECCLESIASTES',
  'song of solomon': 'SONG_OF_SOLOMON',
  'isaiah': 'ISAIAH',
  'jeremiah': 'JEREMIAH',
  'lamentations': 'LAMENTATIONS',
  'ezekiel': 'EZEKIEL',
  'daniel': 'DANIEL',
  'hosea': 'HOSEA',
  'joel': 'JOEL',
  'amos': 'AMOS',
  'obadiah': 'OBADIAH',
  'jonah': 'JONAH',
  'micah': 'MICAH',
  'nahum': 'NAHUM',
  'habakkuk': 'HABAKKUK',
  'zephaniah': 'ZEPHANIAH',
  'haggai': 'HAGGAI',
  'zechariah': 'ZECHARIAH',
  'malachi': 'MALACHI',
  'matthew': 'MATTHEW',
  'mark': 'MARK',
  'luke': 'LUKE',
  'john': 'JOHN',
  'acts': 'ACTS',
  'romans': 'ROMANS',
  '1 corinthians': 'FIRST_CORINTHIANS',
  '2 corinthians': 'SECOND_CORINTHIANS',
  'galatians': 'GALATIANS',
  'ephesians': 'EPHESIANS',
  'philippians': 'PHILIPPIANS',
  'colossians': 'COLOSSIANS',
  '1 thessalonians': 'FIRST_THESSALONIANS',
  '2 thessalonians': 'SECOND_THESSALONIANS',
  '1 timothy': 'FIRST_TIMOTHY',
  '2 timothy': 'SECOND_TIMOTHY',
  'titus': 'TITUS',
  'philemon': 'PHILEMON',
  'hebrews': 'HEBREWS',
  'james': 'JAMES',
  '1 peter': 'FIRST_PETER',
  '2 peter': 'SECOND_PETER',
  '1 john': 'FIRST_JOHN',
  '2 john': 'SECOND_JOHN',
  '3 john': 'THIRD_JOHN',
  'jude': 'JUDE',
  'revelation': 'REVELATION',
}

function toBibleBookEnum(book: string): string {
  const key = book.toLowerCase().trim()
  const mapped = BIBLE_BOOK_MAP[key]
  if (!mapped) throw new Error(`Unknown Bible book: "${book}"`)
  return mapped
}

// ============================================================
// Helper: Video category to VideoCategory enum
// ============================================================
const VIDEO_CATEGORY_MAP: Record<string, string> = {
  'event recap': 'EVENT_RECAP',
  'worship': 'WORSHIP',
  'testimony': 'TESTIMONY',
  'special feature': 'SPECIAL_FEATURE',
  'daily bread': 'DAILY_BREAD',
  'promo': 'PROMO',
  'other': 'OTHER',
}

function toVideoCategoryEnum(category: string): string {
  const mapped = VIDEO_CATEGORY_MAP[category.toLowerCase().trim()]
  if (!mapped) return 'OTHER'
  return mapped
}

// ============================================================
// Helper: Event type to EventType enum
// ============================================================
function toEventTypeEnum(type: string): string {
  const upper = type.toUpperCase()
  if (['MEETING', 'EVENT', 'PROGRAM'].includes(upper)) return upper
  return 'EVENT'
}

// ============================================================
// Helper: Recurrence type to Recurrence enum
// ============================================================
function toRecurrenceEnum(type?: string): string {
  if (!type) return 'NONE'
  const map: Record<string, string> = {
    'daily': 'DAILY',
    'weekly': 'WEEKLY',
    'biweekly': 'WEEKLY',
    'monthly': 'MONTHLY',
    'yearly': 'YEARLY',
  }
  return map[type.toLowerCase()] || 'NONE'
}

// ============================================================
// Mock data (inline to avoid import path issues with tsx)
// ============================================================

// --- Messages ---
const MESSAGES = [
  { slug: "as-the-spirit-gave-them-utterance", title: "As The Spirit Gave Them Utterance", youtubeId: "U-vvxbOHQEM", speaker: "P. William", series: "Sunday Message", passage: "Acts 2:1-47", dateFor: "2026-02-08", relatedStudySlug: "more-than-conquerors", description: "On the day of Pentecost, the Holy Spirit came upon the disciples and they spoke in other tongues — the birth of the church and the beginning of the gospel mission to all nations.", rawTranscript: "<p>Today we study Acts chapter 2, the day of Pentecost.</p>", liveTranscript: "<p>[Auto-generated] Good morning everyone.</p>", duration: "1:24:33" },
  { slug: "the-rich-man-and-lazarus", title: "The Rich Man and Lazarus", youtubeId: "_RweYgsz6ts", speaker: "P. William", series: "Sunday Message", passage: "Luke 16:13-31", dateFor: "2026-02-01", relatedStudySlug: "remain-in-my-love", description: "Jesus tells the parable of the rich man and Lazarus.", rawTranscript: "<p>In Luke 16, Jesus teaches about wealth.</p>", liveTranscript: "<p>[Auto-generated] Good morning church family.</p>", duration: "1:33:27" },
  { slug: "the-shrewd-manager", title: "The Shrewd Manager", youtubeId: "f7jyTGQvpPo", speaker: "P. William", series: "Sunday Message", passage: "Luke 16:1-13", dateFor: "2026-01-25", relatedStudySlug: "the-call-of-abram", description: "Jesus tells the surprising parable of the shrewd manager.", rawTranscript: "<p>The parable of the shrewd manager.</p>", duration: "1:38:04" },
  { slug: "the-cost-of-being-a-disciple", title: "The Cost of Being a Disciple", youtubeId: "7xn8gf3BnJE", speaker: "P. William", series: "Sunday Message", passage: "Luke 14:12-35", dateFor: "2026-01-18", relatedStudySlug: "the-day-of-pentecost", description: "Jesus teaches about the cost of discipleship.", rawTranscript: "<p>In Luke 14, Jesus teaches discipleship.</p>", liveTranscript: "<p>[Auto-generated] Good morning everyone.</p>", duration: "1:44:51" },
  { slug: "god-and-money", title: "God and Money", youtubeId: "t7kdrujgwXY", speaker: "P. William", series: "Sunday Message", passage: "Luke 12:13-34", dateFor: "2026-01-11", relatedStudySlug: "saved-by-grace-through-faith", description: "Jesus warns against greed and anxiety.", rawTranscript: "<p>Someone in the crowd asked Jesus.</p>", duration: "1:27:53" },
  { slug: "not-of-this-world", title: "Not of This World", youtubeId: "Xm_-hOsaDzw", speaker: "P. William", series: "Sunday Message", passage: "John 17:13-26", dateFor: "2026-01-04", relatedStudySlug: "not-of-the-world", description: "In his high priestly prayer, Jesus prays for his disciples.", rawTranscript: "<p>In the second half of Jesus' high priestly prayer.</p>", liveTranscript: "<p>[Auto-generated] Good morning everyone.</p>", duration: "1:30:48" },
  { slug: "new-years-worship-service", title: "New Year's Worship Service", youtubeId: "SEeOTr3NAr0", speaker: "P. William", series: "Sunday Message", passage: "Isaiah 43:18-19", dateFor: "2026-01-01", description: "A special New Year's Day worship service.", rawTranscript: "<p>As we begin a new year.</p>", liveTranscript: "<p>[Auto-generated] Happy New Year everyone!</p>", duration: "2:42:51" },
  { slug: "eternal-life", title: "Eternal Life", youtubeId: "nXnKFnkpTUk", speaker: "P. William", series: "Sunday Message", passage: "John 17:1-13", dateFor: "2025-12-28", description: "Jesus begins his high priestly prayer.", rawTranscript: "<p>John 17 contains Jesus' most intimate prayer.</p>", duration: "1:19:01" },
  { slug: "favor-with-god", title: "Favor with God", youtubeId: "WrOgB3-UjlM", speaker: "P. William", series: "Sunday Message", passage: "Luke 1:26-45", dateFor: "2025-12-25", description: "A Christmas worship service message on the angel Gabriel's announcement to Mary.", rawTranscript: "<p>On this Christmas Day.</p>", liveTranscript: "<p>[Auto-generated] Merry Christmas everyone!</p>", duration: "2:29:42" },
  { slug: "your-prayer-has-been-heard", title: "Your Prayer Has Been Heard", youtubeId: "O1oAoyIH_qQ", speaker: "P. William", series: "Sunday Message", passage: "Luke 1:1-25", dateFor: "2025-12-21", description: "The angel appears to Zechariah in the temple.", rawTranscript: "<p>Luke begins his Gospel with Zechariah.</p>", liveTranscript: "<p>[Auto-generated] Good morning church.</p>", duration: "1:32:36" },
  { slug: "take-heart", title: "Take Heart", youtubeId: "uBow9c2qUIU", speaker: "P. William", series: "Sunday Message", passage: "John 16:25-33", dateFor: "2025-12-14", description: "Jesus concludes his farewell discourse with a promise of peace and victory.", rawTranscript: "<p>As Jesus concludes his farewell discourse.</p>", duration: "1:19:15" },
  { slug: "you-will-see-me", title: "You Will See Me", youtubeId: "pVEniec0Gus", speaker: "P. William", series: "Sunday Message", passage: "John 16:16-24", dateFor: "2025-12-07", description: "Jesus tells his confused disciples that their grief will turn to joy.", rawTranscript: "<p>Jesus says to his disciples.</p>", liveTranscript: "<p>[Auto-generated] Good morning everyone.</p>", duration: "1:24:05" },
  { slug: "thanksgiving-worship-service", title: "Thanksgiving Worship Service", youtubeId: "Ir2exCpgYhs", speaker: "P. William", series: "Sunday Message", passage: "Psalm 100:1-5", dateFor: "2025-11-27", description: "A special Thanksgiving worship service.", rawTranscript: "<p>On this Thanksgiving.</p>", duration: "2:43:14" },
  { slug: "praise-is-fitting", title: "Praise Is Fitting", youtubeId: "q3-hbS2dcw4", speaker: "P. William", series: "Sunday Message", passage: "Psalm 147:1-20", dateFor: "2025-11-23", description: "A meditation on Psalm 147.", rawTranscript: "<p>Praise the Lord.</p>", duration: "1:32:28" },
  { slug: "to-your-advantage", title: "To Your Advantage", youtubeId: "BaWV8VXZsWM", speaker: "P. William", series: "Sunday Message", passage: "John 16:4-15", dateFor: "2025-11-16", description: "Jesus tells his disciples it is to their advantage that he goes away.", rawTranscript: "<p>The disciples were filled with grief.</p>", duration: "1:35:09" },
  { slug: "not-of-the-world-message", title: "Not of the World", youtubeId: "i7Mnn-yxajg", speaker: "P. William", series: "Sunday Message", passage: "John 15:18-16:4", dateFor: "2025-11-09", description: "Jesus prepares his disciples for the world's hatred.", rawTranscript: "<p>If the world hates you.</p>", liveTranscript: "<p>[Auto-generated] Good morning church.</p>", duration: "1:24:24" },
  { slug: "treasure-in-heaven-day-2", title: "Treasure in Heaven — Day 2", youtubeId: "UM4iDeDTyrk", speaker: "P. Abraham Kim", series: "Conference", passage: "Matthew 6:19-24", dateFor: "2025-11-02", description: "Day 2 of the fall conference on storing up treasures in heaven.", rawTranscript: "<p>On the second day of our conference.</p>", duration: "2:11:02" },
  { slug: "treasure-in-heaven-day-1", title: "Treasure in Heaven — Day 1", youtubeId: "P-VvW0XEUIY", speaker: "P. Kevin Albright", series: "Conference", passage: "Matthew 6:19-24", dateFor: "2025-11-01", description: "Day 1 of the fall conference.", rawTranscript: "<p>Welcome to our fall conference.</p>", liveTranscript: "<p>[Auto-generated] Welcome everyone to our fall conference.</p>", duration: "1:48:27" },
  { slug: "called-you-friends", title: "Called You Friends", youtubeId: "gBYXD72LiA0", speaker: "P. William", series: "Sunday Message", passage: "John 15:1-17", dateFor: "2025-10-26", description: "Jesus calls his disciples friends.", rawTranscript: "<p>I am the true vine.</p>", duration: "1:24:50" },
  { slug: "peace-i-leave-with-you", title: "Peace I Leave with You", youtubeId: "wqmMCf8gNWE", speaker: "P. William", series: "Sunday Message", passage: "John 14:15-31", dateFor: "2025-10-19", description: "Jesus promises the Holy Spirit.", rawTranscript: "<p>If you love me, keep my commands.</p>", liveTranscript: "<p>[Auto-generated] Good morning everyone.</p>", duration: "1:35:50" },
  { slug: "the-father", title: "The Father", youtubeId: "9t-TZ2MMftA", speaker: "P. William", series: "Sunday Message", passage: "John 14:1-14", dateFor: "2025-10-12", description: "Jesus comforts his troubled disciples.", rawTranscript: "<p>Do not let your hearts be troubled.</p>", duration: "1:16:09" },
  { slug: "to-be-content", title: "To Be Content", youtubeId: "HvztmRXJ3Bc", speaker: "P. William", series: "Sunday Message", passage: "Philippians 4:10-23", dateFor: "2025-10-05", description: "Paul shares the secret of contentment.", rawTranscript: "<p>Paul writes from prison.</p>", liveTranscript: "<p>[Auto-generated] Good morning everyone.</p>", duration: "1:24:40" },
  { slug: "friday-worship", title: "Friday Worship", youtubeId: "dd4hcojPKeU", speaker: "P. William", series: "Sunday Message", passage: "Philippians 4:4-9", dateFor: "2025-10-03", description: "A special Friday worship gathering.", rawTranscript: "<p>Rejoice in the Lord always.</p>", duration: "1:31:35" },
  { slug: "god-of-peace", title: "God of Peace", youtubeId: "ta6rfdHSYgA", speaker: "P. William", series: "Sunday Message", passage: "Philippians 4:1-9", dateFor: "2025-09-28", description: "Paul urges the Philippians to stand firm.", rawTranscript: "<p>Paul urges his dear friends.</p>", duration: "1:20:10" },
  { slug: "the-upward-call-of-god", title: "The Upward Call of God", youtubeId: "9aI23VPBxd4", speaker: "P. William", series: "Sunday Message", passage: "Philippians 3:11-4:1", dateFor: "2025-09-21", description: "Paul presses on toward the goal.", rawTranscript: "<p>Not that I have already obtained.</p>", liveTranscript: "<p>[Auto-generated] Good morning church family.</p>", duration: "1:16:40" },
  { slug: "the-surpassing-worth-of-knowing-christ", title: "The Surpassing Worth of Knowing Christ", youtubeId: "xHhY2wGT0EI", speaker: "P. William", series: "Sunday Message", passage: "Philippians 3:1-11", dateFor: "2025-09-14", description: "Paul counts everything as loss.", rawTranscript: "<p>Paul had every reason to boast.</p>", duration: "1:20:38" },
  { slug: "timothy-and-epaphroditus", title: "Timothy and Epaphroditus", youtubeId: "WqGml4EyWnE", speaker: "P. William", series: "Sunday Message", passage: "Philippians 2:19-30", dateFor: "2025-09-07", description: "Paul commends Timothy and Epaphroditus.", rawTranscript: "<p>Paul commends two faithful co-workers.</p>", duration: "1:17:04" },
  { slug: "shine-as-lights", title: "Shine as Lights", youtubeId: "teYt1H5k2xg", speaker: "P. William", series: "Sunday Message", passage: "Philippians 2:12-18", dateFor: "2025-08-31", description: "Paul calls believers to work out their salvation and shine as lights.", rawTranscript: "<p>Therefore, my dear friends.</p>", liveTranscript: "<p>[Auto-generated] Good morning everyone.</p>", duration: "1:18:58" },
]

// --- Bible Studies ---
const BIBLE_STUDIES = [
  { slug: "do-you-truly-love-me", title: "Do You Truly Love Me More Than These?", book: "John", passage: "John 21:1-25", datePosted: "2026-04-10", dateFor: "2026-04-12", series: "Sunday Message", messenger: "P. Kevin Albright", keyVerseRef: "John 21:15", keyVerseText: "When they had finished eating, Jesus said to Simon Peter...", hasQuestions: true, hasAnswers: true, hasTranscript: true },
  { slug: "the-lord-is-my-shepherd", title: "The Lord is My Shepherd", book: "Psalms", passage: "Psalms 23:1-6", datePosted: "2026-02-20", dateFor: "2026-02-22", series: "Sunday Message", messenger: "P. Samuel Lee", keyVerseRef: "Psalms 23:1", keyVerseText: "The Lord is my shepherd, I lack nothing.", hasQuestions: true, hasAnswers: true, hasTranscript: true },
  { slug: "blessed-are-the-poor-in-spirit", title: "The Sermon on the Mount: Blessed Are the Poor in Spirit", book: "Matthew", passage: "Matthew 5:1-12", datePosted: "2026-02-13", dateFor: "2026-02-15", series: "Sunday Message", messenger: "P. David Kim", keyVerseRef: "Matthew 5:3", keyVerseText: "Blessed are the poor in spirit, for theirs is the kingdom of heaven.", hasQuestions: true, hasAnswers: true, hasTranscript: true },
  { slug: "more-than-conquerors", title: "More Than Conquerors", book: "Romans", passage: "Romans 8:31-39", datePosted: "2026-02-06", dateFor: "2026-02-08", series: "Sunday Message", messenger: "P. William Larsen", keyVerseRef: "Romans 8:37", keyVerseText: "No, in all these things we are more than conquerors through him who loved us.", hasQuestions: true, hasAnswers: true, hasTranscript: true },
  { slug: "remain-in-my-love", title: "Remain in My Love", book: "John", passage: "John 15:9-17", datePosted: "2026-01-30", dateFor: "2026-02-01", series: "Sunday Message", messenger: "P. Kevin Albright", keyVerseRef: "John 15:12", keyVerseText: "My command is this: Love each other as I have loved you.", hasQuestions: true, hasAnswers: true, hasTranscript: true },
  { slug: "the-call-of-abram", title: "The Call of Abram", book: "Genesis", passage: "Genesis 12:1-9", datePosted: "2026-01-23", dateFor: "2026-01-25", series: "Sunday Message", messenger: "P. Abraham Kim", keyVerseRef: "Genesis 12:2", keyVerseText: "I will make you into a great nation, and I will bless you.", hasQuestions: true, hasAnswers: true, hasTranscript: true },
  { slug: "the-day-of-pentecost", title: "The Day of Pentecost", book: "Acts", passage: "Acts 2:1-21", datePosted: "2026-01-16", dateFor: "2026-01-18", series: "Sunday Message", messenger: "P. Samuel Lee", keyVerseRef: "Acts 2:17", keyVerseText: "In the last days, God says, I will pour out my Spirit on all people.", hasQuestions: true, hasAnswers: true, hasTranscript: true },
  { slug: "saved-by-grace-through-faith", title: "Saved by Grace Through Faith", book: "Ephesians", passage: "Ephesians 2:1-10", datePosted: "2026-01-09", dateFor: "2026-01-11", series: "Sunday Message", messenger: "P. David Kim", keyVerseRef: "Ephesians 2:8-9", keyVerseText: "For it is by grace you have been saved, through faith.", hasQuestions: true, hasAnswers: true, hasTranscript: true },
  { slug: "not-of-the-world", title: "Not Of The World", book: "John", passage: "John 17:14-26", datePosted: "2026-01-02", dateFor: "2026-01-04", series: "Sunday Message", messenger: "P. William Larsen", keyVerseRef: "John 17:14", keyVerseText: "I have given them your word, and the world has hated them.", hasQuestions: true, hasAnswers: true, hasTranscript: true },
  { slug: "his-steadfast-love-endures-forever", title: "His Steadfast Love Endures Forever", book: "Psalms", passage: "Psalms 136:1-26", datePosted: "2025-12-12", dateFor: "2025-12-14", series: "Sunday Message", messenger: "Paul Kim", keyVerseRef: "Psalms 136:1", keyVerseText: "Give thanks to the Lord, for he is good.", hasQuestions: true, hasAnswers: true, hasTranscript: true },
  { slug: "to-worship-him", title: "To Worship Him: Joy for a Broken World", book: "Matthew", passage: "Matthew 2:1-12", datePosted: "2025-12-05", dateFor: "2025-12-07", series: "Advent 2025", messenger: "Theo Woessner", keyVerseRef: "Matthew 2:11", keyVerseText: "On coming to the house, they saw the child with his mother Mary.", hasQuestions: true, hasAnswers: true, hasTranscript: true },
  { slug: "prepare-the-way", title: "Prepare the Way for the Lord", book: "Mark", passage: "Mark 1:1-8", datePosted: "2025-11-28", dateFor: "2025-11-30", series: "Advent 2025", messenger: "David Kim", keyVerseRef: "Mark 1:3", keyVerseText: "A voice of one calling in the wilderness.", hasQuestions: true, hasAnswers: true, hasTranscript: true },
  { slug: "christ-is-all", title: "Christ is All, and is in All", book: "Colossians", passage: "Colossians 3:1-17", datePosted: "2025-11-21", dateFor: "2025-11-23", series: "Sunday Message", messenger: "Sarah Park", keyVerseRef: "Colossians 3:11", keyVerseText: "Christ is all, and is in all.", hasQuestions: true, hasAnswers: true, hasTranscript: true },
  { slug: "set-your-minds-on-things-above", title: "Set Your Minds on Things Above", book: "Colossians", passage: "Colossians 3:1-4", datePosted: "2025-11-14", dateFor: "2025-11-16", series: "Sunday Message", messenger: "John Doe", keyVerseRef: "Colossians 3:2", keyVerseText: "Set your minds on things that are above.", hasQuestions: true, hasAnswers: true, hasTranscript: true },
  { slug: "watered-the-flock", title: "Watered The Flock", book: "Exodus", passage: "Exodus 2:11-22", datePosted: "2024-01-22", dateFor: "2024-01-24", series: "Sunday Message", messenger: "P. Abraham Kim", keyVerseRef: "Exodus 2:17", keyVerseText: "Moses stood up and saved them, and watered their flock.", hasQuestions: true, hasAnswers: true, hasTranscript: true },
]

// --- Videos ---
const VIDEOS = [
  { slug: "nayac-2026-promo", title: "2026 North American Young Adult Conference (NAYAC) Promo", youtubeId: "IIEB_svkXRc", category: "Promo", datePublished: "2026-01-15", duration: "2:15", description: "Get ready for NAYAC 2026!", isShort: false },
  { slug: "christmas-recitation-2025", title: "MERRY CHRISTMAS! 2025 UBF Christmas Recitation on Luke 1", youtubeId: "NiYsr_oIRus", category: "Event Recap", datePublished: "2025-12-25", duration: "8:12", description: "A special Christmas recitation of Luke 1.", isShort: false },
  { slug: "instagram-bio-verse", title: "What Verse Is in Your Instagram Bio?", youtubeId: "w49sFWHs5vI", category: "Special Feature", datePublished: "2025-11-08", duration: "5:30", description: "We asked members what Bible verse they have in their Instagram bio.", isShort: false },
  { slug: "daily-bread-quiet-time", title: "Daily Bread: How I Do My Quiet Time", youtubeId: "LmYwdnwdK-k", category: "Daily Bread", datePublished: "2025-10-14", duration: "0:58", description: "A quick look at how one member spends time with God.", isShort: true },
  { slug: "testimony-gods-faithfulness", title: "Testimony: God's Faithfulness in College", youtubeId: "evUrqDOpAoE", category: "Testimony", datePublished: "2025-09-20", duration: "0:48", description: "A student shares their testimony.", isShort: true },
  { slug: "describe-ubf-in-3-words", title: "Describe UBF in 3 Words", youtubeId: "WqeW4HtM06M", category: "Special Feature", datePublished: "2025-08-05", duration: "3:45", description: "We asked members to describe UBF in three words.", isShort: false },
]

// --- Daily Bread ---
const DAILY_BREADS = [
  { slug: "kiss-the-son", title: "Kiss The Son", date: "2026-02-09", passage: "Psalm 2:1-12", keyVerse: "12", author: "P. Abraham Kim", body: "<p>The kings of this world rule as if they could control the world. But in reality, the One enthroned in heaven has power over all things.</p><p>The author advises us to \"kiss the Son\" (12). Let us fear his greatness and rejoice in his victory over death.</p><p><strong>Prayer:</strong> Father, thank you for giving us your Son Jesus.</p><p><strong>One Word:</strong> Kiss the Son, Jesus</p>" },
]

// --- Events (trimmed for seed) ---
const EVENTS = [
  { slug: "friday-night-bible-study", title: "Friday Night Bible Study", type: "meeting", dateStart: "2026-01-30", startTime: "7:00 PM", endTime: "9:00 PM", location: "LA UBF Main Center", description: "Weekly Bible study for young adults.", ministry: "young-adult", campus: "all", isRecurring: false, isFeatured: true, meetingUrl: "https://zoom.us/j/1234567890" },
  { slug: "sunday-livestream", title: "Sunday Livestream", type: "meeting", dateStart: "2026-02-01", startTime: "11:00 AM", location: "LA UBF Main Center / YouTube Live", description: "Join our Sunday worship service in person or watch the livestream.", ministry: "church-wide", campus: "all", isRecurring: true, meetingUrl: "https://www.youtube.com/@LAUBF/streams", recurrenceType: "weekly", recurrenceDays: ["SUN"], recurrenceSchedule: "Every Sunday" },
  { slug: "new-year-prayer-meeting-2026", title: "New Year Prayer Meeting", type: "event", dateStart: "2026-01-01", startTime: "10:00 AM", endTime: "12:00 PM", location: "LA UBF Main Center", description: "Begin 2026 in prayer.", ministry: "church-wide", isRecurring: false },
  { slug: "csulb-welcome-week-spring-2026", title: "CSULB Welcome Week Outreach", type: "event", dateStart: "2026-02-12", dateEnd: "2026-02-14", startTime: "10:00 AM", endTime: "2:00 PM", location: "CSULB Student Union Lawn", description: "Spring semester welcome week.", ministry: "young-adult", campus: "csulb", isRecurring: false, isFeatured: true },
  { slug: "easter-celebration-2026", title: "Easter Celebration Service", type: "event", dateStart: "2026-03-01", startTime: "10:00 AM", endTime: "12:30 PM", location: "LA UBF Main Center", description: "Celebrate the resurrection of Jesus Christ.", ministry: "church-wide", isRecurring: false, isFeatured: true },
  { slug: "daily-bread-meeting", title: "Daily Bread & Prayer Meeting", type: "meeting", dateStart: "2026-02-01", startTime: "6:00 AM", location: "LA UBF Main Center", description: "Start your morning in the Word.", ministry: "church-wide", isRecurring: true, meetingUrl: "https://us02web.zoom.us/j/86540458764", recurrenceType: "weekly", recurrenceDays: ["MON", "TUE", "WED", "THU", "FRI"], recurrenceSchedule: "Mon-Fri @ 6 AM" },
  { slug: "mens-bible-study", title: "Men's Bible Study", type: "meeting", dateStart: "2026-02-01", startTime: "8:00 AM", location: "LA UBF Main Center", description: "A weekly gathering for men to study Scripture.", ministry: "church-wide", isRecurring: true, recurrenceType: "weekly", recurrenceDays: ["SAT"], recurrenceSchedule: "Sat @ 8 AM" },
  { slug: "evening-prayer-meeting", title: "Evening Prayer Meeting", type: "meeting", dateStart: "2026-02-01", startTime: "7:30 PM", location: "LA UBF Main Center", description: "A daily evening prayer meeting.", ministry: "church-wide", isRecurring: true, meetingUrl: "https://meet.google.com/pgm-trah-moc", recurrenceType: "daily", recurrenceDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"], recurrenceSchedule: "Every Day @ 7:30 PM" },
  { slug: "winter-bible-academy-2026", title: "Winter Bible Academy", type: "program", dateStart: "2026-01-09", dateEnd: "2026-01-11", startTime: "9:00 AM", endTime: "4:00 PM", location: "LA UBF Main Center", description: "A three-day intensive study of the Book of Romans.", ministry: "church-wide", isRecurring: false, isFeatured: true, registrationUrl: "https://forms.google.com/winter-bible-academy-2026" },
  { slug: "ya-discipleship-program-spring-2026", title: "Young Adult Discipleship Program", type: "program", dateStart: "2026-02-21", dateEnd: "2026-05-16", startTime: "10:00 AM", endTime: "12:00 PM", location: "LA UBF Main Center", description: "A 12-week discipleship track for young adults.", ministry: "young-adult", campus: "all", isRecurring: false, registrationUrl: "https://forms.google.com/ya-discipleship-2026" },
  { slug: "vacation-bible-school-2026", title: "Vacation Bible School", type: "program", dateStart: "2026-06-22", dateEnd: "2026-06-26", startTime: "9:00 AM", endTime: "12:30 PM", location: "LA UBF Main Center", description: "A week-long summer program for children ages 5-12.", ministry: "children", isRecurring: false, isFeatured: true, registrationUrl: "https://forms.google.com/vbs-2026" },
]

// --- Ministry labels ---
const MINISTRIES: { slug: string; name: string }[] = [
  { slug: "young-adult", name: "Young Adult" },
  { slug: "adult", name: "Adult" },
  { slug: "children", name: "Children" },
  { slug: "high-school", name: "Middle & High School" },
  { slug: "church-wide", name: "Church-wide" },
]

// --- Campus labels ---
const CAMPUSES: { slug: string; name: string; shortName?: string }[] = [
  { slug: "lbcc", name: "LBCC", shortName: "LBCC" },
  { slug: "csulb", name: "CSULB", shortName: "CSULB" },
  { slug: "csuf", name: "CSUF", shortName: "CSUF" },
  { slug: "ucla", name: "UCLA", shortName: "UCLA" },
  { slug: "usc", name: "USC", shortName: "USC" },
  { slug: "csudh", name: "CSUDH", shortName: "CSUDH" },
  { slug: "ccc", name: "CCC", shortName: "CCC" },
  { slug: "mt-sac", name: "Mt. SAC", shortName: "Mt. SAC" },
  { slug: "golden-west", name: "Golden West", shortName: "GWC" },
  { slug: "cypress", name: "Cypress", shortName: "Cypress" },
  { slug: "cal-poly-pomona", name: "Cal Poly Pomona", shortName: "CPP" },
  { slug: "all", name: "All Campuses", shortName: "All" },
]

// ============================================================
// MAIN SEED FUNCTION
// ============================================================
async function main() {
  console.log('Clearing existing data...')

  // Delete in reverse dependency order
  // Website builder tables first
  await prisma.menuItem.deleteMany()
  await prisma.menu.deleteMany()
  await prisma.pageSection.deleteMany()
  await prisma.page.deleteMany()
  await prisma.themeCustomization.deleteMany()
  await prisma.theme.deleteMany()
  await prisma.siteSettings.deleteMany()
  // CMS content tables
  await prisma.messageSeries.deleteMany()
  await prisma.bibleStudyAttachment.deleteMany()
  await prisma.eventLink.deleteMany()
  await prisma.contentTag.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.message.deleteMany()
  await prisma.bibleStudy.deleteMany()
  await prisma.event.deleteMany()
  await prisma.video.deleteMany()
  await prisma.dailyBread.deleteMany()
  await prisma.speaker.deleteMany()
  await prisma.series.deleteMany()
  await prisma.ministry.deleteMany()
  await prisma.campus.deleteMany()
  await prisma.church.deleteMany()

  // ── 1. Create Church ──────────────────────────────────────
  console.log('Creating LA UBF church...')
  const church = await prisma.church.create({
    data: {
      name: 'LA UBF',
      slug: 'la-ubf',
      email: 'info@laubf.org',
      address: '1020 S. Anaheim Blvd',
      city: 'Anaheim',
      state: 'CA',
      zipCode: '92805',
      country: 'US',
      timezone: 'America/Los_Angeles',
      locale: 'en-US',
      youtubeUrl: 'https://www.youtube.com/@LAUBF',
      websiteUrl: 'https://laubf.org',
    },
  })
  const churchId = church.id

  // ── 2. Create Speakers ────────────────────────────────────
  console.log('Creating speakers...')
  const speakerNames = new Set<string>()
  for (const m of MESSAGES) speakerNames.add(m.speaker)
  for (const b of BIBLE_STUDIES) speakerNames.add(b.messenger)

  const speakerMap = new Map<string, string>() // name -> id
  for (const name of speakerNames) {
    const speaker = await prisma.speaker.create({
      data: {
        churchId,
        name,
        slug: slugify(name),
      },
    })
    speakerMap.set(name, speaker.id)
  }
  console.log(`  Created ${speakerMap.size} speakers`)

  // ── 3. Create Series ──────────────────────────────────────
  console.log('Creating series...')
  const seriesNames = new Set<string>()
  for (const m of MESSAGES) seriesNames.add(m.series)
  for (const b of BIBLE_STUDIES) seriesNames.add(b.series)

  const seriesMap = new Map<string, string>() // name -> id
  for (const name of seriesNames) {
    const s = await prisma.series.create({
      data: {
        churchId,
        name,
        slug: slugify(name),
      },
    })
    seriesMap.set(name, s.id)
  }
  console.log(`  Created ${seriesMap.size} series`)

  // ── 4. Create Ministries ──────────────────────────────────
  console.log('Creating ministries...')
  const ministryMap = new Map<string, string>() // slug -> id
  for (const m of MINISTRIES) {
    const ministry = await prisma.ministry.create({
      data: {
        churchId,
        name: m.name,
        slug: m.slug,
      },
    })
    ministryMap.set(m.slug, ministry.id)
  }
  console.log(`  Created ${ministryMap.size} ministries`)

  // ── 5. Create Campuses ────────────────────────────────────
  console.log('Creating campuses...')
  const campusMap = new Map<string, string>() // slug -> id
  for (const c of CAMPUSES) {
    const campus = await prisma.campus.create({
      data: {
        churchId,
        name: c.name,
        slug: c.slug,
        shortName: c.shortName,
      },
    })
    campusMap.set(c.slug, campus.id)
  }
  console.log(`  Created ${campusMap.size} campuses`)

  // ── 6. Create Bible Studies (before Messages, for relatedStudyId) ─
  console.log('Creating bible studies...')
  const bibleStudyMap = new Map<string, string>() // slug -> id
  for (const bs of BIBLE_STUDIES) {
    const study = await prisma.bibleStudy.create({
      data: {
        churchId,
        slug: bs.slug,
        title: bs.title,
        book: toBibleBookEnum(bs.book) as any,
        passage: bs.passage,
        datePosted: new Date(bs.datePosted),
        dateFor: new Date(bs.dateFor),
        seriesId: seriesMap.get(bs.series) || null,
        speakerId: speakerMap.get(bs.messenger) || null,
        keyVerseRef: bs.keyVerseRef,
        keyVerseText: bs.keyVerseText,
        hasQuestions: bs.hasQuestions,
        hasAnswers: bs.hasAnswers,
        hasTranscript: bs.hasTranscript,
        status: 'PUBLISHED',
        publishedAt: new Date(bs.datePosted),
      },
    })
    bibleStudyMap.set(bs.slug, study.id)
  }
  console.log(`  Created ${bibleStudyMap.size} bible studies`)

  // ── 7. Create Messages ────────────────────────────────────
  console.log('Creating messages...')
  let messageCount = 0
  for (const msg of MESSAGES) {
    const relatedStudyId = msg.relatedStudySlug
      ? bibleStudyMap.get(msg.relatedStudySlug) || null
      : null

    const hasVideo = !!msg.youtubeId
    const thumbnailUrl = msg.youtubeId
      ? `https://img.youtube.com/vi/${msg.youtubeId}/maxresdefault.jpg`
      : null

    await prisma.message.create({
      data: {
        churchId,
        slug: msg.slug,
        title: msg.title,
        passage: msg.passage,
        speakerId: speakerMap.get(msg.speaker) || null,
        dateFor: new Date(msg.dateFor),
        description: msg.description,
        videoUrl: msg.youtubeId ? `https://www.youtube.com/watch?v=${msg.youtubeId}` : null,
        youtubeId: msg.youtubeId,
        thumbnailUrl,
        duration: msg.duration,
        rawTranscript: msg.rawTranscript,
        liveTranscript: msg.liveTranscript || null,
        hasVideo,
        hasStudy: !!relatedStudyId,
        relatedStudyId,
        status: 'PUBLISHED',
        publishedAt: new Date(msg.dateFor),
      },
    })

    // Create MessageSeries join record
    const seriesId = seriesMap.get(msg.series)
    if (seriesId) {
      const createdMsg = await prisma.message.findUnique({
        where: { churchId_slug: { churchId, slug: msg.slug } },
      })
      if (createdMsg) {
        await prisma.messageSeries.create({
          data: {
            messageId: createdMsg.id,
            seriesId,
            sortOrder: messageCount,
          },
        })
      }
    }

    messageCount++
  }
  console.log(`  Created ${messageCount} messages`)

  // ── 8. Create Events ──────────────────────────────────────
  console.log('Creating events...')
  let eventCount = 0
  for (const evt of EVENTS) {
    await prisma.event.create({
      data: {
        churchId,
        slug: evt.slug,
        title: evt.title,
        type: toEventTypeEnum(evt.type) as any,
        dateStart: new Date(evt.dateStart),
        dateEnd: evt.dateEnd ? new Date(evt.dateEnd) : null,
        startTime: evt.startTime || null,
        endTime: evt.endTime || null,
        location: evt.location,
        shortDescription: evt.description,
        ministryId: evt.ministry ? ministryMap.get(evt.ministry) || null : null,
        campusId: evt.campus ? campusMap.get(evt.campus) || null : null,
        isFeatured: evt.isFeatured || false,
        isRecurring: evt.isRecurring,
        recurrence: toRecurrenceEnum(evt.recurrenceType) as any,
        recurrenceDays: evt.recurrenceDays || [],
        recurrenceSchedule: evt.recurrenceSchedule || null,
        meetingUrl: evt.meetingUrl || null,
        registrationUrl: evt.registrationUrl || null,
        status: 'PUBLISHED',
        publishedAt: new Date(evt.dateStart),
      },
    })
    eventCount++
  }
  console.log(`  Created ${eventCount} events`)

  // ── 9. Create Videos ──────────────────────────────────────
  console.log('Creating videos...')
  for (const vid of VIDEOS) {
    await prisma.video.create({
      data: {
        churchId,
        slug: vid.slug,
        title: vid.title,
        youtubeId: vid.youtubeId,
        category: toVideoCategoryEnum(vid.category) as any,
        datePublished: new Date(vid.datePublished),
        duration: vid.duration,
        description: vid.description,
        thumbnailUrl: `https://img.youtube.com/vi/${vid.youtubeId}/maxresdefault.jpg`,
        isShort: vid.isShort || false,
        status: 'PUBLISHED',
        publishedAt: new Date(vid.datePublished),
      },
    })
  }
  console.log(`  Created ${VIDEOS.length} videos`)

  // ── 10. Create Daily Breads ───────────────────────────────
  console.log('Creating daily breads...')
  for (const db of DAILY_BREADS) {
    await prisma.dailyBread.create({
      data: {
        churchId,
        slug: db.slug,
        title: db.title,
        date: new Date(db.date),
        passage: db.passage,
        keyVerse: db.keyVerse,
        body: db.body,
        author: db.author,
        status: 'PUBLISHED',
        publishedAt: new Date(db.date),
      },
    })
  }
  console.log(`  Created ${DAILY_BREADS.length} daily breads`)

  // ============================================================
  // 11. WEBSITE BUILDER TABLES
  // ============================================================

  // ── 11a. Theme ─────────────────────────────────────────────
  console.log('Creating theme...')
  const theme = await prisma.theme.create({
    data: {
      name: 'Modern Church',
      slug: 'modern-church',
      isDefault: true,
      isActive: true,
      defaultTokens: {
        primaryColor: '#1a1a2e',
        secondaryColor: '#e94560',
        backgroundColor: '#ffffff',
        textColor: '#333333',
        headingColor: '#1a1a2e',
        headingFont: 'DM Serif Display',
        bodyFont: 'Helvetica Neue',
        baseFontSize: 16,
        borderRadius: '0.5rem',
      },
    },
  })
  console.log(`  Created theme: ${theme.name}`)

  // ── 11b. ThemeCustomization ────────────────────────────────
  console.log('Creating theme customization...')
  await prisma.themeCustomization.create({
    data: {
      churchId,
      themeId: theme.id,
      primaryColor: '#0D0D0D',
      secondaryColor: '#3667B1',
      backgroundColor: '#FAFAFA',
      textColor: '#0D0D0D',
      headingColor: '#0D0D0D',
      // headingFont and bodyFont left null — LA UBF uses the CSS defaults
      // (DM Serif Display for headings, Helvetica Neue for body) defined in
      // globals.css.  Setting null lets ThemeProvider skip overriding --font-serif
      // and --font-sans, preserving the next/font-optimized font stacks.
      baseFontSize: 16,
      borderRadius: '0.5rem',
      tokenOverrides: {
        // LA UBF brand colors
        brandPrimary: '#3667B1',
        brandSecondary: '#061B4F',
        accentGreen: '#009966',
        accentBlue: '#155DFC',
        accentOrange: '#FF6900',
        // Surface colors
        surfacePage: '#FAFAFA',
        surfaceDark: '#0D0D0D',
        // Neutrals
        black1: '#0D0D0D',
        black2: '#313131',
        black3: '#676767',
        white0: '#FFFFFF',
        white1: '#FAFAFA',
        white2: '#E8E8E8',
        // Fonts
        fontSans: '"Helvetica Neue", "Helvetica", "Arial", ui-sans-serif, system-ui, sans-serif',
        fontSerif: '"DM Serif Display", ui-serif, Georgia, serif',
        fontDisplay: '"DM Serif Display", ui-serif, Georgia, serif',
        fontScript: '"strude", cursive',
        // Custom fonts
        customFonts: [
          { family: 'Helvetica Neue', url: '/fonts/helvetica-neue/HelveticaNeueRoman.otf', weight: '400', format: 'opentype' },
          { family: 'Helvetica Neue', url: '/fonts/helvetica-neue/HelveticaNeueMedium.otf', weight: '500', format: 'opentype' },
          { family: 'Helvetica Neue', url: '/fonts/helvetica-neue/HelveticaNeueBold.otf', weight: '700', format: 'opentype' },
          { family: 'strude', url: '/fonts/strude/strude.ttf', weight: '400', format: 'truetype' },
        ],
        // Google fonts
        googleFonts: [
          { family: 'DM Serif Display', weight: '400', style: 'italic' },
        ],
      },
    },
  })
  console.log('  Created theme customization for LA UBF')

  // ── 11c. SiteSettings ──────────────────────────────────────
  console.log('Creating site settings...')
  await prisma.siteSettings.create({
    data: {
      churchId,
      siteName: 'LA UBF',
      tagline: 'Los Angeles University Bible Fellowship',
      description:
        'LA UBF (Los Angeles University Bible Fellowship) is a Bible-centered community raising lifelong disciples on college campuses and beyond.',
      logoUrl: '/logo/laubf-logo.svg',
      logoAlt: 'LA UBF',
      faviconUrl: '/favicon.ico',
      contactEmail: 'laubf.downey@gmail.com',
      contactPhone: '(562) 396-6350',
      contactAddress: '11625 Paramount Blvd\nDowney, CA 90241',
      instagramUrl: 'https://instagram.com/la.ubf',
      facebookUrl: 'https://facebook.com/losangelesubf',
      youtubeUrl: 'https://youtube.com/@laubf',
      serviceTimes: [
        { day: 'Sunday', time: '11:00 AM', label: 'Sunday Worship Service' },
        { day: 'Monday-Friday', time: '6:00 AM', label: 'Daily Bread & Prayer Meeting' },
        { day: 'Daily', time: '7:30 PM', label: 'Evening Prayer Meeting' },
        { day: 'Saturday', time: '8:00 AM', label: "Men's Bible Study" },
      ],
      enableSearch: true,
      enableGiving: false,
      enableBlog: false,
    },
  })
  console.log('  Created site settings')

  // ── 11d. Menus ─────────────────────────────────────────────
  console.log('Creating menus...')

  // --- HEADER menu ---
  const headerMenu = await prisma.menu.create({
    data: {
      churchId,
      name: 'Main Navigation',
      slug: 'main-navigation',
      location: 'HEADER',
    },
  })

  // Top-level: Our Church (dropdown)
  const ourChurchItem = await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      label: 'Our Church',
      sortOrder: 0,
      groupLabel: 'About',
    },
  })
  // Our Church > About section
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: ourChurchItem.id,
      label: 'Who We Are',
      description: 'Our mission & vision',
      href: '/about',
      iconName: 'info',
      groupLabel: 'About',
      sortOrder: 0,
    },
  })
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: ourChurchItem.id,
      label: "I'm New",
      description: 'Plan your visit',
      href: '/im-new',
      iconName: 'map-pin',
      groupLabel: 'About',
      sortOrder: 1,
    },
  })
  // Our Church > Connect section
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: ourChurchItem.id,
      label: 'Events',
      href: '/events?tab=event',
      iconName: 'calendar',
      groupLabel: 'Connect',
      sortOrder: 2,
    },
  })
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: ourChurchItem.id,
      label: 'Meetings',
      href: '/events?tab=meeting',
      iconName: 'users',
      groupLabel: 'Connect',
      sortOrder: 3,
    },
  })
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: ourChurchItem.id,
      label: 'Programs',
      href: '/events?tab=program',
      iconName: 'book-open',
      groupLabel: 'Connect',
      sortOrder: 4,
    },
  })
  // Our Church > Quick Links section
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: ourChurchItem.id,
      label: 'Daily Bread & Prayer',
      description: 'Mon-Fri @ 6 AM',
      href: 'https://us02web.zoom.us/j/86540458764?pwd=ZDVUUjZDOVZ4WlJFc1VvNVlzd2tkQT09',
      iconName: 'book-open',
      isExternal: true,
      openInNewTab: true,
      groupLabel: 'Quick Links',
      sortOrder: 5,
    },
  })
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: ourChurchItem.id,
      label: 'Evening Prayer',
      description: 'Every Day @ 7:30 PM',
      href: 'https://meet.google.com/pgm-trah-moc',
      iconName: 'hand-heart',
      isExternal: true,
      openInNewTab: true,
      groupLabel: 'Quick Links',
      sortOrder: 6,
    },
  })
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: ourChurchItem.id,
      label: "Men's Bible Study",
      description: 'Sat @ 8 AM',
      href: 'https://zoom.us',
      iconName: 'users',
      isExternal: true,
      openInNewTab: true,
      groupLabel: 'Quick Links',
      sortOrder: 7,
    },
  })
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: ourChurchItem.id,
      label: 'Sunday Livestream',
      description: 'Sun @ 11 AM',
      href: 'https://www.youtube.com/@LAUBF/streams',
      iconName: 'radio',
      isExternal: true,
      openInNewTab: true,
      groupLabel: 'Quick Links',
      sortOrder: 8,
    },
  })

  // Top-level: Ministries (dropdown)
  const ministriesItem = await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      label: 'Ministries',
      href: '/ministries',
      sortOrder: 1,
    },
  })
  // Ministries > Ministry Groups
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: ministriesItem.id,
      label: 'College & Young Adults',
      href: '/ministries/college',
      iconName: 'graduation-cap',
      groupLabel: 'Ministry Groups',
      sortOrder: 0,
    },
  })
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: ministriesItem.id,
      label: 'Adults',
      href: '/ministries/adults',
      iconName: 'users',
      groupLabel: 'Ministry Groups',
      sortOrder: 1,
    },
  })
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: ministriesItem.id,
      label: 'Middle & High School (JBF & HBF)',
      href: '/ministries/high-school',
      iconName: 'landmark',
      groupLabel: 'Ministry Groups',
      sortOrder: 2,
    },
  })
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: ministriesItem.id,
      label: 'Children (BBF & CBF)',
      href: '/ministries/children',
      iconName: 'baby',
      groupLabel: 'Ministry Groups',
      sortOrder: 3,
    },
  })
  // Ministries > Campus ministries
  const campusSlugs = [
    { label: 'LBCC', desc: 'Long Beach City College', slug: 'lbcc' },
    { label: 'CSULB', desc: 'Cal State Long Beach', slug: 'csulb' },
    { label: 'CSUF', desc: 'Cal State Fullerton', slug: 'csuf' },
    { label: 'UCLA', desc: 'University of California, Los Angeles', slug: 'ucla' },
    { label: 'USC', desc: 'University of Southern California', slug: 'usc' },
    { label: 'CSUDH', desc: 'Cal State Dominguez Hills', slug: 'csudh' },
    { label: 'CCC', desc: 'Cerritos Community College', slug: 'ccc' },
    { label: 'MT. SAC', desc: 'Mt. San Antonio College', slug: 'mt-sac' },
    { label: 'Golden West', desc: 'Golden West College', slug: 'golden-west' },
    { label: 'Cypress College', slug: 'cypress' },
    { label: 'Cal Poly Pomona', slug: 'cal-poly-pomona' },
  ]
  for (let i = 0; i < campusSlugs.length; i++) {
    const c = campusSlugs[i]
    await prisma.menuItem.create({
      data: {
        menuId: headerMenu.id,
        parentId: ministriesItem.id,
        label: c.label,
        description: c.desc || undefined,
        href: `/ministries/campus/${c.slug}`,
        iconName: 'map-pin',
        groupLabel: 'Campus Ministries',
        sortOrder: 10 + i,
      },
    })
  }
  // Ministries overview link
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: ministriesItem.id,
      label: 'Ministry Overview',
      description: 'Learn about the ministries that shape our community',
      href: '/ministries',
      featuredTitle: 'Ministry Overview',
      featuredDescription: 'Learn about the ministries that shape our community',
      featuredHref: '/ministries',
      sortOrder: 99,
    },
  })

  // Top-level: Resources (dropdown)
  const resourcesItem = await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      label: 'Resources',
      sortOrder: 2,
    },
  })
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: resourcesItem.id,
      label: 'Messages',
      href: '/messages',
      iconName: 'video',
      groupLabel: 'The Word',
      sortOrder: 0,
    },
  })
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: resourcesItem.id,
      label: 'Bible Studies',
      href: '/bible-study',
      iconName: 'book-open',
      groupLabel: 'The Word',
      sortOrder: 1,
    },
  })
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: resourcesItem.id,
      label: 'Daily Bread',
      href: '/daily-bread',
      iconName: 'book-text',
      groupLabel: 'The Word',
      sortOrder: 2,
    },
  })
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      parentId: resourcesItem.id,
      label: 'Videos',
      href: '/videos',
      iconName: 'monitor-play',
      groupLabel: 'Media',
      sortOrder: 3,
    },
  })

  // Top-level: Giving (direct link)
  await prisma.menuItem.create({
    data: {
      menuId: headerMenu.id,
      label: 'Giving',
      href: '/giving',
      sortOrder: 3,
    },
  })

  // --- FOOTER menu ---
  const footerMenu = await prisma.menu.create({
    data: {
      churchId,
      name: 'Footer Navigation',
      slug: 'footer-navigation',
      location: 'FOOTER',
    },
  })

  // Footer > Explore column
  const exploreLinks = [
    { label: 'About Us', href: '/about' },
    { label: "I'm New", href: '/im-new' },
    { label: 'Ministries', href: '/ministries' },
    { label: 'Events', href: '/events' },
    { label: 'Messages', href: '/messages' },
    { label: 'Giving', href: '/giving' },
  ]
  for (let i = 0; i < exploreLinks.length; i++) {
    await prisma.menuItem.create({
      data: {
        menuId: footerMenu.id,
        label: exploreLinks[i].label,
        href: exploreLinks[i].href,
        groupLabel: 'EXPLORE',
        sortOrder: i,
      },
    })
  }

  // Footer > Resources column
  const resourceLinks = [
    { label: 'UBF HQ', href: 'https://ubf.org/' },
    { label: 'Chicago UBF', href: 'https://www.chicagoubf.org/' },
    { label: 'Korea UBF', href: 'https://www.ubf.kr/' },
    { label: 'UBF HQ YouTube', href: 'https://www.youtube.com/user/ubfwebdev' },
    { label: 'LA UBF YouTube', href: 'https://www.youtube.com/channel/UCj419CtzNGrJ-1vtT2-DCQw' },
    { label: 'Daily Bread YouTube', href: 'https://www.youtube.com/c/ubfdailybread' },
  ]
  for (let i = 0; i < resourceLinks.length; i++) {
    await prisma.menuItem.create({
      data: {
        menuId: footerMenu.id,
        label: resourceLinks[i].label,
        href: resourceLinks[i].href,
        isExternal: true,
        openInNewTab: true,
        groupLabel: 'RESOURCES',
        sortOrder: 10 + i,
      },
    })
  }

  console.log('  Created header and footer menus with items')

  // ── 11e. Pages + PageSections ──────────────────────────────
  console.log('Creating pages and sections...')

  // Helper to create a page with sections
  async function createPageWithSections(
    pageData: {
      slug: string
      title: string
      isHomepage?: boolean
      pageType?: string
      layout?: string
      parentId?: string
      metaDescription?: string
      sortOrder?: number
    },
    sections: Array<{
      sectionType: string
      label?: string
      colorScheme?: string
      paddingY?: string
      containerWidth?: string
      content: Record<string, unknown>
    }>,
  ) {
    const page = await prisma.page.create({
      data: {
        churchId,
        slug: pageData.slug,
        title: pageData.title,
        isHomepage: pageData.isHomepage || false,
        isPublished: true,
        publishedAt: new Date(),
        pageType: (pageData.pageType || 'STANDARD') as any,
        layout: (pageData.layout || 'FULL_WIDTH') as any,
        parentId: pageData.parentId || null,
        metaDescription: pageData.metaDescription || null,
        sortOrder: pageData.sortOrder || 0,
      },
    })
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i]
      await prisma.pageSection.create({
        data: {
          churchId,
          pageId: page.id,
          sectionType: s.sectionType as any,
          label: s.label || null,
          sortOrder: i,
          colorScheme: (s.colorScheme || 'LIGHT') as any,
          paddingY: (s.paddingY || 'DEFAULT') as any,
          containerWidth: (s.containerWidth || 'STANDARD') as any,
          content: s.content,
        },
      })
    }
    return page
  }

  // ── HOMEPAGE ───────────────────────────────────────────────
  await createPageWithSections(
    {
      slug: '',
      title: 'Home',
      isHomepage: true,
      layout: 'FULL_WIDTH',
      metaDescription: 'LA UBF (Los Angeles University Bible Fellowship) is a Bible-centered community raising lifelong disciples on college campuses and beyond.',
    },
    [
      {
        sectionType: 'HERO_BANNER',
        label: 'Hero',
        colorScheme: 'DARK',
        content: {
          heading: { line1: 'Welcome to', line2: 'LA UBF' },
          subheading: "Where people find their community.\nWhere disciples are raised.\nWhere the Word of God is lived.",
          primaryButton: { label: "I'm new", href: '/im-new', visible: true },
          secondaryButton: { label: 'Upcoming events', href: '/events', visible: true },
          backgroundImage: { src: '/videos/compressed-hero-vid.mp4', alt: 'LA UBF community gathering' },
        },
      },
      {
        sectionType: 'MEDIA_TEXT',
        label: 'Who We Are',
        colorScheme: 'DARK',
        content: {
          overline: 'WHO WE ARE',
          heading: 'Christian Ministry for College Students',
          body: 'LA UBF (Los Angeles University Bible Fellowship) is an international, non-denominational evangelical church. We serve college students from diverse backgrounds, helping them to grow in faith, build community, and find purpose through the Word of God.',
          button: { label: 'More about us', href: '/about', visible: true },
          images: [
            { src: '/images/compressed/home/rotatingwheel/compressed-bible-study.png', alt: 'Bible study' },
            { src: '/images/compressed/home/rotatingwheel/compressed-campus-ministry-list.png', alt: 'Campus ministry' },
            { src: '/images/compressed/home/rotatingwheel/compressed-campus-ministry.jpg', alt: 'Campus ministry' },
            { src: '/images/compressed/home/rotatingwheel/compressed-event-christmas.png', alt: 'Christmas event' },
            { src: '/images/compressed/home/rotatingwheel/compressed-fellowship.jpg', alt: 'Fellowship' },
            { src: '/images/compressed/home/rotatingwheel/compressed-sunday-worship.jpg', alt: 'Sunday worship' },
          ],
        },
      },
      {
        sectionType: 'HIGHLIGHT_CARDS',
        label: 'Featured Events',
        colorScheme: 'LIGHT',
        content: {
          heading: 'Featured Events',
          subheading: "Highlights of what's happening in our community.",
          ctaLabel: 'View All Events',
          ctaHref: '/events',
          dataSource: 'featured-events',
        },
      },
      {
        sectionType: 'EVENT_CALENDAR',
        label: 'Schedule',
        colorScheme: 'LIGHT',
        content: {
          heading: 'Schedule',
          filters: ['ALL', 'Events', 'Meetings', 'Programs'],
          ctaButtons: [
            { label: '2026 LA UBF Calendar', href: 'https://laubf.org/calendar?month=2', icon: true },
            { label: 'View all events', href: '/events' },
          ],
          dataSource: 'upcoming-events',
        },
      },
      {
        sectionType: 'QUOTE_BANNER',
        label: 'Spiritual Direction',
        colorScheme: 'DARK',
        content: {
          overline: '2026 SPIRITUAL DIRECTION',
          heading: 'Not of the World',
          verse: {
            text: '16 They are not of the world, just as I am not of the world. 17 Sanctify them in the truth; your word is truth. 18 As you sent me into the world, so I have sent them into the world.',
            reference: 'John 17:16-18',
          },
        },
      },
      {
        sectionType: 'ACTION_CARD_GRID',
        label: 'Next Steps',
        colorScheme: 'LIGHT',
        content: {
          heading: { line1: 'Your', line2: 'Next Steps', line3: 'at LA UBF' },
          subheading: 'Explore different ways to connect, grow in faith, and be part of our community.',
          ctaButton: { label: 'Plan your visit', href: '/im-new' },
          cards: [
            { id: 'ns-1', title: 'Sunday Worship', description: 'Join us every Sunday for worship, teaching, and fellowship with believers.', imageUrl: '/images/compressed/home/compressed-sunday-worship.jpg', imageAlt: 'Sunday worship service' },
            { id: 'ns-2', title: 'College Campus Ministries', description: 'Connect with other students on your campus for Bible study and community.', imageUrl: '/images/compressed/home/compressed-campus-ministry.jpg', imageAlt: 'Campus ministry gathering' },
            { id: 'ns-3', title: 'Personal Bible Studies', description: 'Study the Bible one-on-one with a mentor at a time that works for you.', imageUrl: '/images/compressed/home/compressed-bible-study.png', imageAlt: 'One-on-one Bible study' },
            { id: 'ns-4', title: 'Fellowship', description: 'Build lasting friendships through shared meals, activities, and life together.', imageUrl: '/images/compressed/home/compressed-fellowship.jpg', imageAlt: 'Fellowship dinner' },
          ],
        },
      },
      {
        sectionType: 'DIRECTORY_LIST',
        label: 'Campus Ministries',
        colorScheme: 'LIGHT',
        content: {
          heading: 'Our Campus Ministries',
          items: [
            { id: 'lbcc', name: 'LBCC', active: true, href: '/ministries/campus/lbcc' },
            { id: 'csulb', name: 'CSULB', href: '/ministries/campus/csulb' },
            { id: 'csuf', name: 'CSUF', href: '/ministries/campus/csuf' },
            { id: 'ucla', name: 'UCLA', href: '/ministries/campus/ucla' },
            { id: 'usc', name: 'USC', href: '/ministries/campus/usc' },
            { id: 'csudh', name: 'CSUDH', href: '/ministries/campus/csudh' },
            { id: 'ccc', name: 'CCC', href: '/ministries/campus/ccc' },
            { id: 'mt-sac', name: 'MT. SAC', href: '/ministries/campus/mt-sac' },
            { id: 'golden-west', name: 'GOLDEN WEST', href: '/ministries/campus/golden-west' },
            { id: 'cypress', name: 'CYPRESS', href: '/ministries/campus/cypress' },
            { id: 'cal-poly-pomona', name: 'CAL POLY POMONA', href: '/ministries/campus/cal-poly-pomona' },
          ],
          image: { src: '/images/compressed/home/compressed-campus-ministry-list.png', alt: 'Campus ministry students' },
          ctaHeading: "Don't see your campus?",
          ctaButton: { label: 'Let us know your interest', href: '/im-new' },
        },
      },
      {
        sectionType: 'SPOTLIGHT_MEDIA',
        label: "This Week's Message",
        colorScheme: 'DARK',
        content: {
          sectionHeading: "This Week\u2019s Message",
          dataSource: 'latest-message',
        },
      },
      {
        sectionType: 'MEDIA_GRID',
        label: 'Featured Videos',
        colorScheme: 'DARK',
        content: {
          heading: 'Featured Videos',
          ctaLabel: 'View All Videos',
          ctaHref: '/videos',
          dataSource: 'latest-videos',
          count: 3,
        },
      },
      {
        sectionType: 'CTA_BANNER',
        label: 'Visit Us',
        colorScheme: 'DARK',
        content: {
          overline: 'New Here?',
          heading: 'Visit us this Sunday',
          body: 'All are welcome. Come connect with us and get to know our community.',
          primaryButton: { label: 'Plan your visit', href: '/im-new', visible: true },
          secondaryButton: { label: 'See our ministries', href: '/ministries', visible: true },
          backgroundImage: { src: '/images/compressed/home/compressed-visit-us.jpg', alt: 'LA UBF community' },
        },
      },
    ],
  )
  console.log('  Created homepage with 10 sections')

  // ── ABOUT PAGE ─────────────────────────────────────────────
  await createPageWithSections(
    {
      slug: 'about',
      title: 'About',
      metaDescription: 'Learn about LA UBF \u2014 our mission, values, and community of faith on college campuses across Los Angeles.',
      sortOrder: 1,
    },
    [
      {
        sectionType: 'TEXT_IMAGE_HERO',
        label: 'Who We Are Hero',
        colorScheme: 'LIGHT',
        content: {
          overline: 'WHO WE ARE',
          headingLine1: 'Christian Ministry for',
          headingAccent: 'College Students +',
          description: 'Our main focus is to study the Bible and grow in the grace and knowledge of Jesus Christ as his disciples.',
          image: { src: '/images/compressed/who%20we%20are/compressed-header.jpg', alt: 'LA UBF community gathering' },
        },
      },
      {
        sectionType: 'ABOUT_DESCRIPTION',
        label: 'About UBF',
        colorScheme: 'DARK',
        content: {
          logoSrc: '/logo/laubf-logo-blue.svg',
          heading: 'About UBF',
          description: 'University Bible Fellowship (UBF) is an international evangelical church (non-denominational) dedicated to Christ and his kingdom. Our main focus is to study the Bible, grow in the grace and knowledge of our Lord and Savior Jesus Christ, and live according to his teachings as his disciples. We especially pray to reach college students and help them grow as his lifelong disciples. Our goal is to obey our Lord\u2019s commands to love one another and to go and make disciples of all nations (Jn 13:34; Mt 28:18-20). We pray that God may continue to call and raise lay missionaries through us and send them to the ends of the earth (Ac 1:8).',
          videoUrl: 'https://www.youtube.com/embed/WqeW4HtM06M',
          videoTitle: 'Describe UBF in 3 Words',
        },
      },
      {
        sectionType: 'PILLARS',
        label: 'The 3 Pillars',
        colorScheme: 'DARK',
        content: {
          overline: 'WHAT WE DO',
          heading: 'The 3 Pillars of LA UBF',
          items: [
            { title: 'Bible Study', description: 'We help students study the Bible so they may come to know God personally, understand themselves, and find purpose in Jesus Christ. Bible studies are offered one-to-one with a mentor or in small groups centered around campuses and shared interests.', images: [{ src: '/images/compressed/who%20we%20are/compressed-bible%20study.jpg', alt: 'Bible study session' }] },
            { title: 'Discipleship', description: 'We walk with students as they grow as disciples of Jesus through shared life and discipleship training. Our goal is to equip students to mature in faith and become disciple makers who help others follow Christ.', images: [{ src: '/images/compressed/who%20we%20are/compressed-discipleship.jpg', alt: 'Discipleship gathering' }] },
            { title: 'Fellowship', description: 'Fellowship is an essential part of our faith as we support and encourage one another in community. We share fellowship through Sunday worship, activities, and retreats as we grow together in Christ.', images: [{ src: '/images/compressed/who%20we%20are/compressed-fellowship.jpg', alt: 'Fellowship meal' }] },
          ],
        },
      },
      {
        sectionType: 'STATEMENT',
        label: 'Statement of Faith',
        colorScheme: 'LIGHT',
        content: {
          overline: 'STATEMENT OF FAITH',
          heading: 'What We Believe',
          showIcon: true,
          leadIn: 'We believe that',
          paragraphs: [
            { text: 'there is one God in three Persons: God the Father, God the Son, and God the Holy Spirit.', isBold: true },
            { text: 'God created the heavens and the earth and all other things in the universe; that He is the Sovereign Ruler of all things; that the Sovereign God reveals Himself; we believe in his redemptive work and in his final judgment.', isBold: false },
            { text: 'the Bible is inspired by God; that it is the truth; that it is the final authority in faith and practice.', isBold: false },
            { text: 'since the fall of Adam, all people have been under the bondage and power of sin and are deserving of the judgment and wrath of God.', isBold: false },
            { text: 'Jesus Christ, who is God and man, through his atoning, sacrificial death on the cross for our sins and his resurrection, is the only way of salvation; he alone saves us from sin and judgment and purifies us from the contamination of the world caused by sin', isBold: false },
          ],
        },
      },
      {
        sectionType: 'NEWCOMER',
        label: 'Newcomer CTA',
        colorScheme: 'DARK',
        content: {
          heading: 'Are you a newcomer?',
          description: 'We know that visiting a new church can be intimidating. Learn more about our church and how you can take your next steps at LA UBF.',
          buttonLabel: "I\u2019m new",
          buttonHref: '/im-new',
          image: { src: '/images/compressed/home/compressed-sunday-worship.jpg', alt: 'Sunday worship at LA UBF' },
        },
      },
    ],
  )
  console.log('  Created about page')

  // ── MESSAGES PAGE ──────────────────────────────────────────
  await createPageWithSections(
    {
      slug: 'messages',
      title: 'Messages',
      metaDescription: 'Watch and listen to Sunday messages, Bible teachings, and sermon series from LA UBF.',
      sortOrder: 2,
    },
    [
      {
        sectionType: 'SPOTLIGHT_MEDIA',
        label: "This Week's Message",
        colorScheme: 'DARK',
        paddingY: 'COMPACT',
        content: {
          sectionHeading: "This Week\u2019s Message",
          dataSource: 'latest-message',
        },
      },
      {
        sectionType: 'ALL_MESSAGES',
        label: 'All Messages',
        colorScheme: 'LIGHT',
        paddingY: 'NONE',
        content: {
          heading: 'All Messages',
          dataSource: 'all-messages',
        },
      },
    ],
  )
  console.log('  Created messages page')

  // ── EVENTS PAGE ────────────────────────────────────────────
  await createPageWithSections(
    {
      slug: 'events',
      title: 'Events',
      metaDescription: 'Browse upcoming events, meetings, and programs at LA UBF.',
      sortOrder: 3,
    },
    [
      {
        sectionType: 'EVENTS_HERO',
        label: 'Events Hero',
        colorScheme: 'DARK',
        paddingY: 'COMPACT',
        content: {
          heading: 'Get Involved',
          subtitle: 'Join us on our next gathering \u2014 whether it be bible study, conference, or fellowship.',
        },
      },
      {
        sectionType: 'ALL_EVENTS',
        label: 'All Events',
        colorScheme: 'LIGHT',
        paddingY: 'NONE',
        content: {
          heading: 'All Events',
          dataSource: 'all-events',
        },
      },
    ],
  )
  console.log('  Created events page')

  // ── BIBLE STUDY PAGE ───────────────────────────────────────
  await createPageWithSections(
    {
      slug: 'bible-study',
      title: 'Bible Study',
      metaDescription: 'Explore Bible study resources, series, and materials from LA UBF.',
      sortOrder: 4,
    },
    [
      {
        sectionType: 'EVENTS_HERO',
        label: 'Bible Study Hero',
        colorScheme: 'DARK',
        paddingY: 'COMPACT',
        content: {
          heading: 'Bible Study Resources',
          subtitle: 'Deep dive into the Word of God with our weekly bible study materials and questions.',
        },
      },
      {
        sectionType: 'ALL_BIBLE_STUDIES',
        label: 'All Bible Studies',
        colorScheme: 'LIGHT',
        paddingY: 'NONE',
        content: {
          heading: 'All Bible studies',
          dataSource: 'all-bible-studies',
        },
      },
    ],
  )
  console.log('  Created bible study page')

  // ── VIDEOS PAGE ────────────────────────────────────────────
  await createPageWithSections(
    {
      slug: 'videos',
      title: 'Videos',
      metaDescription: 'Watch videos from LA UBF \u2014 worship services, testimonies, and special events.',
      sortOrder: 5,
    },
    [
      {
        sectionType: 'EVENTS_HERO',
        label: 'Videos Hero',
        colorScheme: 'DARK',
        paddingY: 'COMPACT',
        content: {
          heading: 'Videos',
          subtitle: 'Testimonies, event recaps, worship sessions, and special features from our community.',
        },
      },
      {
        sectionType: 'ALL_VIDEOS',
        label: 'All Videos',
        colorScheme: 'LIGHT',
        paddingY: 'NONE',
        content: {
          heading: 'All Videos',
          dataSource: 'all-videos',
        },
      },
    ],
  )
  console.log('  Created videos page')

  // ── DAILY BREAD PAGE ───────────────────────────────────────
  await createPageWithSections(
    {
      slug: 'daily-bread',
      title: 'Daily Bread',
      metaDescription: "Today\u2019s Daily Bread devotional \u2014 Bible passage, reflection, and prayer from LA UBF.",
      sortOrder: 6,
    },
    [
      {
        sectionType: 'DAILY_BREAD_FEATURE',
        label: 'Daily Bread',
        colorScheme: 'LIGHT',
        content: {
          dataSource: 'latest-daily-bread',
        },
      },
    ],
  )
  console.log('  Created daily bread page')

  // ── MINISTRIES PAGE ────────────────────────────────────────
  const ministriesPage = await createPageWithSections(
    {
      slug: 'ministries',
      title: 'Ministries',
      metaDescription: "Explore LA UBF ministries \u2014 campus, college, young adult, high school, and children's programs.",
      sortOrder: 7,
    },
    [
      {
        sectionType: 'TEXT_IMAGE_HERO',
        label: 'Ministries Hero',
        colorScheme: 'LIGHT',
        content: {
          overline: 'WHO WE ARE',
          headingLine1: 'Our Ministries',
          description: 'At LA UBF, we believe that spiritual growth happens best in community. Whether you are a student, a working professional, or a parent, there is a place for you here.',
          image: { src: '/images/compressed/ministries/compressed-congregation.jpg', alt: 'LA UBF community gathering' },
          textAlign: 'center',
        },
      },
      {
        sectionType: 'PILLARS',
        label: 'Age Groups',
        colorScheme: 'DARK',
        content: {
          overline: 'MINISTRIES',
          heading: 'Age Groups',
          items: [
            { title: 'Young Adults', description: 'A community of college students and young professionals growing together through campus Bible studies, fellowship, and shared worship.', images: [{ src: '/images/compressed/ministries/compressed-young%20adults.jpg', alt: 'Young adults Bible study' }], button: { label: 'Learn more', href: '/ministries/college' } },
            { title: 'Adults', description: 'Adults from many walks of life\u2014campus leaders, Bible teachers, parents, and missionaries\u2014growing in faith through personal and group Bible study, conferences, and outreach.', images: [{ src: '/images/compressed/ministries/compressed-adults.webp', alt: 'Adult fellowship' }], button: { label: 'Learn more', href: '/ministries/adults' } },
            { title: 'Middle & High School\n(HBF / JBF)', description: 'Our youth ministries for middle and high school students, with engaging Bible studies, fun fellowship activities, and a supportive community during these formative years.', images: [{ src: '/images/compressed/ministries/compressed-middle%20n%20high.jpg', alt: 'HBF JBF students' }], button: { label: 'Learn more', href: '/ministries/high-school' } },
            { title: 'Children (CBF)', description: "A safe, engaging, and age-appropriate environment where children can learn about God\u2019s Word and build friendships while growing in faith.", images: [{ src: '/images/compressed/ministries/compressed-children.webp', alt: 'Children Bible fellowship' }], button: { label: 'Learn more', href: '/ministries/children' } },
          ],
        },
      },
      {
        sectionType: 'CAMPUS_CARD_GRID',
        label: 'Join a Campus Ministry',
        colorScheme: 'LIGHT',
        content: {
          overline: 'Are you a college student?',
          heading: 'Join a Campus Ministry',
          description: 'We have bible study clubs all across different college campuses. Join us for weekly group bible studies and get to know each other through fellowship.',
          decorativeImages: [
            { src: '/images/compressed/ministries/join-campus-ministry-section/compressed-1.jpg', alt: 'Campus group photo' },
            { src: '/images/compressed/ministries/join-campus-ministry-section/compressed-2.jpg', alt: 'Bible study outdoors' },
            { src: '/images/compressed/ministries/join-campus-ministry-section/compressed-3.png', alt: 'Fellowship event' },
          ],
          campuses: [
            { id: 'lbcc', abbreviation: 'LBCC', fullName: 'Long Beach City College', href: '/ministries/campus/lbcc' },
            { id: 'csulb', abbreviation: 'CSULB', fullName: 'Cal State Long Beach', href: '/ministries/campus/csulb' },
            { id: 'csuf', abbreviation: 'CSUF', fullName: 'Cal State Fullerton', href: '/ministries/campus/csuf' },
            { id: 'ucla', abbreviation: 'UCLA', fullName: 'University of California, Los Angeles', href: '/ministries/campus/ucla' },
            { id: 'usc', abbreviation: 'USC', fullName: 'University of Southern California', href: '/ministries/campus/usc' },
            { id: 'csudh', abbreviation: 'CSUDH', fullName: 'Cal State Dominguez Hills', href: '/ministries/campus/csudh' },
            { id: 'ccc', abbreviation: 'CCC', fullName: 'Cerritos Community College', href: '/ministries/campus/ccc' },
            { id: 'mt-sac', abbreviation: 'MT. SAC', fullName: 'Mt. San Antonio College', href: '/ministries/campus/mt-sac' },
            { id: 'golden-west', abbreviation: 'GWC', fullName: 'Golden West College', href: '/ministries/campus/golden-west' },
            { id: 'cypress', abbreviation: '', fullName: 'Cypress College', href: '/ministries/campus/cypress' },
            { id: 'cal-poly-pomona', abbreviation: '', fullName: 'Cal Poly Pomona', href: '/ministries/campus/cal-poly-pomona' },
          ],
          ctaHeading: "Don\u2019t see your campus?",
          ctaButton: { label: 'Let us know your interest', href: '/im-new#plan-visit' },
        },
      },
      {
        sectionType: 'NEWCOMER',
        label: 'Newcomer CTA',
        colorScheme: 'DARK',
        content: {
          heading: 'Are you a newcomer?',
          description: 'We know that visiting a new church can be intimidating. Learn more about our church and how you can take your next steps at LA UBF.',
          buttonLabel: "I\u2019m new",
          buttonHref: '/im-new',
          image: { src: '/images/compressed/home/compressed-sunday-worship.jpg', alt: 'Sunday worship at LA UBF' },
        },
      },
    ],
  )
  console.log('  Created ministries page')

  // Shared campus card grid content
  const sharedCampusGrid = {
    decorativeImages: [
      { src: '/images/compressed/ministries/join-campus-ministry-section/compressed-1.jpg', alt: 'Campus group photo' },
      { src: '/images/compressed/ministries/join-campus-ministry-section/compressed-2.jpg', alt: 'Bible study outdoors' },
      { src: '/images/compressed/ministries/join-campus-ministry-section/compressed-3.png', alt: 'Fellowship event' },
    ],
    heading: 'Join a Campus Ministry',
    description: 'We have Bible study groups meeting on campuses across Southern California. Find a group near you and start studying the Bible with fellow students.',
    campuses: [
      { id: 'lbcc', abbreviation: 'LBCC', fullName: 'Long Beach City College', href: '/ministries/campus/lbcc' },
      { id: 'csulb', abbreviation: 'CSULB', fullName: 'Cal State Long Beach', href: '/ministries/campus/csulb' },
      { id: 'csuf', abbreviation: 'CSUF', fullName: 'Cal State Fullerton', href: '/ministries/campus/csuf' },
      { id: 'ucla', abbreviation: 'UCLA', fullName: 'University of California, Los Angeles', href: '/ministries/campus/ucla' },
      { id: 'usc', abbreviation: 'USC', fullName: 'University of Southern California', href: '/ministries/campus/usc' },
      { id: 'csudh', abbreviation: 'CSUDH', fullName: 'Cal State Dominguez Hills', href: '/ministries/campus/csudh' },
      { id: 'ccc', abbreviation: 'CCC', fullName: 'Cerritos Community College', href: '/ministries/campus/ccc' },
      { id: 'mt-sac', abbreviation: 'MT. SAC', fullName: 'Mt. San Antonio College', href: '/ministries/campus/mt-sac' },
      { id: 'golden-west', abbreviation: 'GWC', fullName: 'Golden West College', href: '/ministries/campus/golden-west' },
      { id: 'cypress', abbreviation: '', fullName: 'Cypress College', href: '/ministries/campus/cypress' },
      { id: 'cal-poly-pomona', abbreviation: '', fullName: 'Cal Poly Pomona', href: '/ministries/campus/cal-poly-pomona' },
    ],
    ctaHeading: "Don\u2019t see your campus?",
    ctaButton: { label: 'Contact Us', href: '#plan-visit' },
  }

  // Shared newcomer content
  const sharedNewcomer = {
    heading: 'Are you a newcomer?',
    description: 'We know that visiting a new church can be intimidating. Learn more about our church and how you can take your next steps at LA UBF.',
    buttonLabel: "I\u2019m new",
    buttonHref: '/im-new',
    image: { src: '/images/compressed/home/compressed-sunday-worship.jpg', alt: 'Sunday worship at LA UBF' },
  }

  // Shared form content
  const sharedFormContent = {
    overline: 'Plan Your Visit',
    heading: 'Let us help you start',
    description: "Let us know you\u2019re coming and we\u2019ll save a seat for you! We can also help match you with a Bible teacher or answer any questions about our ministries.",
    interestOptions: [
      { label: 'Sunday Service', value: 'sunday-service' },
      { label: 'College Campus Group', value: 'college-group' },
      { label: 'Personal Bible Study', value: 'personal-bible-study' },
      { label: 'Group Bible Study', value: 'group-bible-study' },
      { label: 'Giving', value: 'giving' },
      { label: 'Other', value: 'other' },
    ],
    campusOptions: [
      { label: 'LBCC', value: 'lbcc' },
      { label: 'CSULB', value: 'csulb' },
      { label: 'CSUF', value: 'csuf' },
      { label: 'UCLA', value: 'ucla' },
      { label: 'USC', value: 'usc' },
      { label: 'CSUDH', value: 'csudh' },
      { label: 'Cerritos Community College', value: 'ccc' },
      { label: 'Mt. San Antonio College', value: 'mt-sac' },
      { label: 'Golden West College', value: 'golden-west' },
      { label: 'Cypress College', value: 'cypress' },
      { label: 'Cal Poly Pomona', value: 'cal-poly-pomona' },
    ],
    bibleTeacherLabel: "I\u2019d like to be matched with a personal bible teacher for bible studies or spiritual guidance",
    submitLabel: 'Submit',
    successMessage: "Thank you! We\u2019ve received your message and will get back to you soon.",
  }

  // ── COLLEGE / YOUNG ADULT MINISTRY ─────────────────────────
  await createPageWithSections(
    {
      slug: 'ministries/college',
      title: 'College Ministry',
      pageType: 'MINISTRY',
      parentId: ministriesPage.id,
      metaDescription: 'LA UBF college ministry \u2014 Bible study, fellowship, and discipleship for university students.',
      sortOrder: 8,
    },
    [
      {
        sectionType: 'MINISTRY_HERO',
        label: 'College Hero',
        colorScheme: 'LIGHT',
        content: {
          overline: 'MINISTRY',
          heading: 'Young Adult / College',
          headingStyle: 'sans',
          heroImage: { src: '/images/compressed/ministries/compressed-young%20adults.jpg', alt: 'Young adult and college ministry group' },
        },
      },
      {
        sectionType: 'MINISTRY_INTRO',
        label: 'College Intro',
        colorScheme: 'LIGHT',
        content: {
          overline: 'INTRODUCTION',
          heading: 'Young Adult Ministry (YAM)',
          description: "The Young Adult Ministry (YAM) at LA UBF is a vibrant community of college students and young professionals growing together in faith. Through campus Bible study groups, fellowship activities, and shared worship, we create a space where young adults can explore God\u2019s Word, build meaningful friendships, and discover their calling. Whether you\u2019re on campus or in the workforce, you\u2019ll find a welcoming community here.",
          image: { src: '/images/compressed/ministries/young%20adults/compressed-yam.png', alt: 'Young adult ministry fellowship' },
        },
      },
      {
        sectionType: 'PILLARS',
        label: 'What We Do',
        colorScheme: 'DARK',
        content: {
          overline: '',
          heading: 'What We Do',
          items: [
            { title: 'Fellowship', description: 'Our young adult fellowship is a space to build authentic friendships and grow together. From shared meals to group outings, we create opportunities for meaningful connection and community among college students and young professionals.', images: [{ src: '/images/compressed/ministries/young%20adults/compressed-fellowship.png', alt: 'Young adult fellowship' }] },
            { title: 'Discipleship Training', description: "Through personal and group Bible study, we help young adults develop a strong foundation in God\u2019s Word. Our discipleship training equips students to grow as leaders, mentors, and faithful followers of Christ.", images: [{ src: '/pics-temp/DSC05299.jpg', alt: 'Discipleship training' }] },
            { title: 'Serving Opportunities', description: "We believe in learning by serving. Young adults have the opportunity to serve through campus outreach, community events, conferences, and supporting the church\u2019s mission locally and beyond.", images: [{ src: '/images/compressed/ministries/young%20adults/compressed-serving.jpg', alt: 'Serving opportunities' }] },
          ],
        },
      },
      {
        sectionType: 'PHOTO_GALLERY',
        label: 'Photo Gallery',
        colorScheme: 'LIGHT',
        content: {
          heading: 'Snippets from the Ministry',
          images: [
            { src: '/images/compressed/ministries/young%20adults/carousel/compressed-1.jpg', alt: 'YAM moment 1' },
            { src: '/images/compressed/ministries/young%20adults/carousel/compressed-2.jpg', alt: 'YAM moment 2' },
            { src: '/images/compressed/ministries/young%20adults/carousel/compressed-3.jpg', alt: 'YAM moment 3' },
            { src: '/images/compressed/ministries/young%20adults/carousel/compressed-4.jpg', alt: 'YAM moment 4' },
            { src: '/images/compressed/ministries/young%20adults/carousel/compressed-5.jpg', alt: 'YAM moment 5' },
            { src: '/images/compressed/ministries/young%20adults/carousel/compressed-6.jpg', alt: 'YAM moment 6' },
            { src: '/images/compressed/ministries/young%20adults/carousel/compressed-7.jpg', alt: 'YAM moment 7' },
            { src: '/images/compressed/ministries/young%20adults/carousel/compressed-8.jpg', alt: 'YAM moment 8' },
            { src: '/images/compressed/ministries/young%20adults/carousel/compressed-9.jpg', alt: 'YAM moment 9' },
            { src: '/images/compressed/ministries/young%20adults/carousel/compressed-10.jpg', alt: 'YAM moment 10' },
          ],
        },
      },
      {
        sectionType: 'CAMPUS_CARD_GRID',
        label: 'Campus Ministry',
        colorScheme: 'LIGHT',
        content: sharedCampusGrid,
      },
      {
        sectionType: 'MEET_TEAM',
        label: 'Meet Our Team',
        colorScheme: 'LIGHT',
        content: {
          overline: 'YOUNG ADULT MINISTRY',
          heading: 'Meet Our Team',
          members: [
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05222.jpg', alt: 'Leader name' } },
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05299.jpg', alt: 'Leader name' } },
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC01195.jpg', alt: 'Leader name' } },
          ],
        },
      },
      {
        sectionType: 'UPCOMING_EVENTS',
        label: 'Upcoming Events',
        colorScheme: 'DARK',
        content: {
          overline: 'YOUNG ADULT MINISTRY',
          heading: 'Upcoming Events',
          ctaButton: { label: 'View all events', href: '/events' },
          dataSource: 'ministry-events',
          ministrySlug: 'young-adult',
        },
      },
      {
        sectionType: 'NEWCOMER',
        label: 'Newcomer CTA',
        colorScheme: 'DARK',
        content: sharedNewcomer,
      },
    ],
  )
  console.log('  Created college ministry page')

  // ── ADULTS MINISTRY ────────────────────────────────────────
  await createPageWithSections(
    {
      slug: 'ministries/adults',
      title: 'Adults Ministry',
      pageType: 'MINISTRY',
      parentId: ministriesPage.id,
      metaDescription: 'LA UBF young adults ministry \u2014 community and spiritual growth for young professionals.',
      sortOrder: 9,
    },
    [
      {
        sectionType: 'MINISTRY_HERO',
        label: 'Adults Hero',
        colorScheme: 'LIGHT',
        content: {
          overline: 'MINISTRY',
          heading: 'Adult',
          headingStyle: 'sans',
          heroImage: { src: '/images/compressed/ministries/compressed-adults.webp', alt: 'Adult ministry worship service' },
        },
      },
      {
        sectionType: 'MINISTRY_INTRO',
        label: 'Adults Intro',
        colorScheme: 'LIGHT',
        content: {
          overline: 'INTRODUCTION',
          heading: 'Adult Ministry',
          description: "Our adult ministry brings together people from many walks of life, including campus leaders, Bible teachers, parents, missionaries, and members growing in faith. Within the adult ministry, there are opportunities for personal and group Bible study, special conferences, campus outreach, and opportunities to support the church\u2019s mission in various mission fields and beyond. Join us for Sunday worship to learn more about how you can find your place at LA UBF.",
          image: { src: '/images/compressed/ministries/adults/compressed-introduction.jpg', alt: 'Adult ministry group photo' },
        },
      },
      {
        sectionType: 'PILLARS',
        label: 'What We Do',
        colorScheme: 'DARK',
        content: {
          overline: '',
          heading: 'What We Do',
          items: [
            { title: 'Growing in Faith', description: "Adult ministry includes opportunities for Bible study, prayer, and spiritual growth to be built up and be established in God\u2019s grace, devotionals, and shared learning, adults grow together in the Word.", images: [{ src: '/images/compressed/ministries/adults/compressed-growing.jpg', alt: 'Growing in faith' }] },
            { title: 'Raising Disciples', description: "Many adults learn to grow in leadership, mentoring, teaching personal Bible studies, or guiding others in faith. Teaching helps to grow in understanding by sharing God\u2019s Word with others. Key to our ministry is raising others as lifelong disciples of Christ.", images: [{ src: '/images/compressed/ministries/adults/compressed-disciples.jpg', alt: 'Raising disciples' }] },
            { title: 'Serving & Mission', description: "Adults take part and serve together through short-term and long-term service opportunities, seasonal conferences, campus outreach, and opportunities to support the church\u2019s mission in various mission fields and beyond.", images: [{ src: '/images/compressed/ministries/adults/compressed-serving.jpg', alt: 'Serving and mission' }] },
            { title: 'Community & Fellowship', description: 'Adult ministry is also a place to build relationships through simple shared meals as a church, joyful worship, time spent together at various studies, and fellowship time together as a church community.', images: [{ src: '/pics-temp/DSC01195.jpg', alt: 'Community fellowship' }] },
          ],
        },
      },
      {
        sectionType: 'MEET_TEAM',
        label: 'Meet Our Team',
        colorScheme: 'LIGHT',
        content: {
          overline: 'ADULT',
          heading: 'Meet Our Team',
          members: [
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05222.jpg', alt: 'Leader name' } },
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05299.jpg', alt: 'Leader name' } },
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC01195.jpg', alt: 'Leader name' } },
          ],
        },
      },
      {
        sectionType: 'UPCOMING_EVENTS',
        label: 'Upcoming Events',
        colorScheme: 'DARK',
        content: {
          overline: 'ADULT MINISTRY',
          heading: 'Upcoming Events',
          ctaButton: { label: 'View all events', href: '/events' },
          dataSource: 'ministry-events',
          ministrySlug: 'adult',
        },
      },
      {
        sectionType: 'NEWCOMER',
        label: 'Newcomer CTA',
        colorScheme: 'DARK',
        content: sharedNewcomer,
      },
    ],
  )
  console.log('  Created adults ministry page')

  // ── HIGH SCHOOL MINISTRY ───────────────────────────────────
  await createPageWithSections(
    {
      slug: 'ministries/high-school',
      title: 'High School Ministry',
      pageType: 'MINISTRY',
      parentId: ministriesPage.id,
      metaDescription: 'LA UBF high school ministry \u2014 faith, friendship, and Bible study for teens.',
      sortOrder: 10,
    },
    [
      {
        sectionType: 'MINISTRY_HERO',
        label: 'High School Hero',
        colorScheme: 'LIGHT',
        content: {
          overline: 'MINISTRY',
          heading: 'Middle & High School',
          headingStyle: 'sans',
          heroImage: { src: '/images/compressed/ministries/middle%20n%20high/compressed-header.jpg', alt: 'Middle and high school ministry group photo' },
        },
      },
      {
        sectionType: 'MINISTRY_INTRO',
        label: 'High School Intro',
        colorScheme: 'LIGHT',
        content: {
          overline: 'INTRODUCTION',
          heading: 'JBF & HBF',
          description: "JBF (Junior Bible Fellowship) and HBF (High School Bible Fellowship) are our youth ministries for middle school and high school students. Through engaging Bible studies, fun fellowship activities, and a supportive community, we help young people build a strong foundation of faith during these formative years.",
          image: { src: '/images/compressed/ministries/middle%20n%20high/compressed-introduction.jpg', alt: 'JBF and HBF youth ministry' },
        },
      },
      {
        sectionType: 'PILLARS',
        label: 'What We Do',
        colorScheme: 'DARK',
        content: {
          overline: '',
          heading: 'What We Do',
          items: [
            { title: 'Praise Night', description: "Praise Night is a time for our youth to come together in worship through music, prayer, and fellowship. It\u2019s an uplifting experience where students can express their faith and grow closer to God and each other.", images: [{ src: '/images/compressed/ministries/middle%20n%20high/compressed-praise%20night.jpg', alt: 'Youth praise night' }] },
            { title: 'Fellowship', description: 'Fellowship activities give our youth the opportunity to build friendships, have fun, and strengthen their bonds within the church community through games, outings, and shared experiences.', images: [{ src: '/images/compressed/ministries/middle%20n%20high/compressed-fellowship.jpg', alt: 'Youth fellowship' }] },
            { title: 'Youth Conference', description: "Our annual Youth Conference brings together students for an immersive experience of worship, Bible study, and community. It\u2019s a highlight of the year where young people are inspired and challenged in their faith.", images: [{ src: '/images/compressed/ministries/middle%20n%20high/compressed-jbfhbf%20conference.jpg', alt: 'Youth conference' }] },
          ],
        },
      },
      {
        sectionType: 'PHOTO_GALLERY',
        label: 'Photo Gallery',
        colorScheme: 'LIGHT',
        content: {
          heading: 'Snippets from the Ministry',
          images: [
            { src: '/images/compressed/ministries/middle%20n%20high/compressed-header.jpg', alt: 'Youth ministry moment 1' },
            { src: '/images/compressed/ministries/middle%20n%20high/compressed-introduction.jpg', alt: 'Youth ministry moment 2' },
            { src: '/images/compressed/ministries/middle%20n%20high/compressed-praise%20night.jpg', alt: 'Youth ministry moment 3' },
            { src: '/images/compressed/ministries/middle%20n%20high/compressed-fellowship.jpg', alt: 'Youth ministry moment 4' },
            { src: '/images/compressed/ministries/middle%20n%20high/compressed-jbfhbf%20conference.jpg', alt: 'Youth ministry moment 5' },
          ],
        },
      },
      {
        sectionType: 'MEET_TEAM',
        label: 'Meet Our Team',
        colorScheme: 'LIGHT',
        content: {
          overline: 'JBF & HBF',
          heading: 'Meet Our Team',
          members: [
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05222.jpg', alt: 'Leader name' } },
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05299.jpg', alt: 'Leader name' } },
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC01195.jpg', alt: 'Leader name' } },
          ],
        },
      },
      {
        sectionType: 'UPCOMING_EVENTS',
        label: 'Upcoming Events',
        colorScheme: 'DARK',
        content: {
          overline: 'YOUTH MINISTRY',
          heading: 'Upcoming Events',
          ctaButton: { label: 'View all events', href: '/events' },
          dataSource: 'ministry-events',
          ministrySlug: 'high-school',
        },
      },
      {
        sectionType: 'NEWCOMER',
        label: 'Newcomer CTA',
        colorScheme: 'DARK',
        content: sharedNewcomer,
      },
    ],
  )
  console.log('  Created high school ministry page')

  // ── CHILDREN MINISTRY ──────────────────────────────────────
  await createPageWithSections(
    {
      slug: 'ministries/children',
      title: "Children's Ministry",
      pageType: 'MINISTRY',
      parentId: ministriesPage.id,
      metaDescription: "LA UBF children's ministry \u2014 nurturing young hearts in faith and community.",
      sortOrder: 11,
    },
    [
      {
        sectionType: 'MINISTRY_HERO',
        label: 'Children Hero',
        colorScheme: 'LIGHT',
        content: {
          overline: 'MINISTRY',
          heading: 'Children',
          headingStyle: 'sans',
          heroImage: { src: '/images/compressed/ministries/compressed-children.webp', alt: 'Children ministry group photo' },
        },
      },
      {
        sectionType: 'MINISTRY_INTRO',
        label: 'Children Intro',
        colorScheme: 'LIGHT',
        content: {
          overline: 'INTRODUCTION',
          heading: 'CBF',
          description: "CBF (Children\u2019s Bible Fellowship) is our ministry for children, where they can learn about God\u2019s Word in a safe, engaging, and age-appropriate environment while building friendships and growing in faith.",
          image: { src: '/images/compressed/ministries/children/compressed-introduction.png', alt: 'Children bible fellowship' },
        },
      },
      {
        sectionType: 'MINISTRY_SCHEDULE',
        label: "Children's Sunday Service",
        colorScheme: 'DARK',
        content: {
          heading: "Children\u2019s\nSunday Service",
          headingStyle: 'script',
          timeValue: 'Every Sunday\n@ 1:30 PM (after lunch)',
          address: ['11625 Paramount Blvd,', 'Downey, CA 90241'],
          directionsUrl: 'https://maps.google.com/?q=11625+Paramount+Blvd+Downey+CA+90241',
          image: { src: '/images/compressed/ministries/children/compressed-service.png', alt: 'Children sunday service' },
        },
      },
      {
        sectionType: 'PILLARS',
        label: 'What We Do',
        colorScheme: 'DARK',
        content: {
          overline: '',
          heading: 'What We Do',
          items: [
            { title: 'Singspiration', description: "Singspiration is a time for children to sing, dance, and share music\u2019s simple joy. It helps them learn about God\u2019s love through song, building worship skills early on.", images: [{ src: '/images/compressed/ministries/children/compressed-singspiration.jpg', alt: 'Children singspiration' }] },
            { title: "Children\u2019s Bible Class", description: "In Children\u2019s Bible Class, kids learn about the Bible through lessons designed to be fun, interactive, and easy to understand for their age.", images: [{ src: '/images/compressed/ministries/children/compressed-class.jpg', alt: 'Children bible class' }] },
            { title: 'Child Care During Sunday Service', description: 'We also offer child care during the Sunday worship service, providing a safe and engaging space for children so parents can attend the adult service with peace of mind.', images: [{ src: '/images/compressed/ministries/children/compressed-child%20care.jpg', alt: 'Child care during service' }] },
          ],
        },
      },
      {
        sectionType: 'MEET_TEAM',
        label: 'Meet Our Team',
        colorScheme: 'LIGHT',
        content: {
          overline: 'CBF',
          heading: 'Meet Our Team',
          members: [
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05222.jpg', alt: 'Leader name' } },
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05299.jpg', alt: 'Leader name' } },
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC01195.jpg', alt: 'Leader name' } },
          ],
        },
      },
      {
        sectionType: 'UPCOMING_EVENTS',
        label: 'Upcoming Events',
        colorScheme: 'DARK',
        content: {
          overline: "CHILDREN'S MINISTRY",
          heading: 'Upcoming Events',
          ctaButton: { label: 'View all events', href: '/events' },
          dataSource: 'ministry-events',
          ministrySlug: 'children',
        },
      },
      {
        sectionType: 'NEWCOMER',
        label: 'Newcomer CTA',
        colorScheme: 'DARK',
        content: sharedNewcomer,
      },
    ],
  )
  console.log('  Created children ministry page')

  // ── I'M NEW PAGE ───────────────────────────────────────────
  await createPageWithSections(
    {
      slug: 'im-new',
      title: "I'm New",
      metaDescription: "New to LA UBF? Plan your visit, learn what to expect, and find ways to connect with our community.",
      sortOrder: 12,
    },
    [
      {
        sectionType: 'PAGE_HERO',
        label: "I'm New Hero",
        colorScheme: 'LIGHT',
        content: {
          overline: 'New here?',
          heading: "We\u2019re glad you\u2019re here.",
          primaryButton: { label: 'Plan Your Visit', href: '#plan-visit', visible: true },
          secondaryButton: { label: 'FREQUENTLY ASKED QUESTIONS', href: '#faq', visible: true },
          floatingImages: [
            { src: "/images/compressed/i'm%20new/header%20photos/compressed-baptism.jpg", alt: 'Baptism', width: 219, height: 146 },
            { src: "/images/compressed/i'm%20new/header%20photos/compressed-beach%20camp.jpg", alt: 'Beach camp', width: 186, height: 133 },
            { src: "/images/compressed/i'm%20new/header%20photos/compressed-face%20paint.jpg", alt: 'Community event', width: 311, height: 249 },
            { src: "/images/compressed/i'm%20new/header%20photos/compressed-josh.jpg", alt: 'Fellowship', width: 133, height: 106 },
            { src: "/images/compressed/i'm%20new/header%20photos/compressed-sports.jpg", alt: 'Sports fellowship', width: 216, height: 144 },
            { src: "/images/compressed/i'm%20new/header%20photos/compressed-worship.jpg", alt: 'Worship service', width: 288, height: 199 },
          ],
        },
      },
      {
        sectionType: 'FEATURE_BREAKDOWN',
        label: 'What is UBF',
        colorScheme: 'DARK',
        content: {
          heading: 'What is \u201cUBF\u201d?',
          acronymLines: ['University', 'Bible', 'Fellowship'],
          description: "University Bible Fellowship (UBF) is an international, non-denominational evangelical church centered on Bible study and discipleship. We especially serve college students, raising lifelong disciples of Jesus Christ who love one another and take part in God\u2019s global mission.",
          button: { label: 'More about us', href: '/about', visible: true },
        },
      },
      {
        sectionType: 'PATHWAY_CARD',
        label: 'How to Get Started',
        colorScheme: 'LIGHT',
        content: {
          heading: 'How to Get Started at LA UBF',
          description: 'We know visiting a new church can feel intimidating. We want to make your first experience as seamless and welcoming as possible. Here are the best ways to connect with our community.',
          cards: [
            { icon: 'book-open', title: 'Join us on Sunday', description: 'Experience our main worship service, gathered in fellowship to praise, study the Word, and grow in faith together through worship.', buttonLabel: 'Service Info', buttonHref: '#what-to-expect', buttonVariant: 'primary' },
            { icon: 'graduation-cap', title: 'Are you a College Student?', description: 'Join one of our campus ministries to attend group Bible studies, connect with other students, and grow spiritually during college.', buttonLabel: 'View Our Campuses', buttonHref: '#campus-ministry', buttonVariant: 'primary' },
            { icon: 'calendar', title: 'Not sure where to start?', description: "Start with an upcoming event\u2014an easy way to meet people and explore what LA UBF is all about at your own pace.", buttonLabel: 'View all events', buttonHref: '/events', buttonVariant: 'secondary' },
          ],
        },
      },
      {
        sectionType: 'TIMELINE_SECTION',
        label: 'What to Expect on Sunday',
        colorScheme: 'DARK',
        content: {
          overline: 'SUNDAY SERVICE',
          heading: 'What to Expect on Sunday',
          imageSrc: '/images/compressed/home/compressed-visit-us.jpg',
          imageAlt: 'LA UBF church building',
          items: [
            { time: '10:00 am', title: 'Bible Studies & Gathering', description: "Personal Bible studies take place before worship. Let us know you\u2019re interested and we\u2019ll help you connect." },
            { time: '11:00 am', title: 'Worship Service', description: 'Join us for Sunday worship with a special song, a worship message, and praise together.' },
            { time: '12:30 pm', title: 'Lunch & Fellowship', description: 'Stay after service for lunch and fellowship, with food prepared by our community and time to connect.' },
          ],
        },
      },
      {
        sectionType: 'LOCATION_DETAIL',
        label: 'When & Where',
        colorScheme: 'DARK',
        content: {
          overline: 'WHEN & WHERE',
          timeLabel: 'Time',
          timeValue: 'Every Sunday\n@ 11 AM',
          locationLabel: 'Location',
          address: ['11625 Paramount Blvd,', 'Downey, CA 90241'],
          directionsUrl: 'https://maps.google.com/?q=11625+Paramount+Blvd+Downey+CA+90241',
          directionsLabel: 'Get Directions',
          images: [{ src: "/images/compressed/i'm%20new/compressed-laubf-location.png", alt: 'LA UBF building exterior' }],
        },
      },
      {
        sectionType: 'CAMPUS_CARD_GRID',
        label: 'Campus Ministry',
        colorScheme: 'LIGHT',
        content: {
          overline: 'Are you a college student?',
          heading: 'Join a Campus Ministry',
          description: 'We have bible study clubs all across different college campuses. Join us for weekly group bible studies and get to know each other through fellowship.',
          decorativeImages: [
            { src: '/images/compressed/ministries/join-campus-ministry-section/compressed-1.jpg', alt: 'Campus group photo' },
            { src: '/images/compressed/ministries/join-campus-ministry-section/compressed-2.jpg', alt: 'Bible study outdoors' },
            { src: '/images/compressed/ministries/join-campus-ministry-section/compressed-3.png', alt: 'Fellowship event' },
          ],
          campuses: [
            { id: 'lbcc', abbreviation: 'LBCC', fullName: 'Long Beach City College', href: '/ministries/campus/lbcc' },
            { id: 'csulb', abbreviation: 'CSULB', fullName: 'Cal State Long Beach', href: '/ministries/campus/csulb' },
            { id: 'csuf', abbreviation: 'CSUF', fullName: 'Cal State Fullerton', href: '/ministries/campus/csuf' },
            { id: 'ucla', abbreviation: 'UCLA', fullName: 'University of California, Los Angeles', href: '/ministries/campus/ucla' },
            { id: 'usc', abbreviation: 'USC', fullName: 'University of Southern California', href: '/ministries/campus/usc' },
            { id: 'csudh', abbreviation: 'CSUDH', fullName: 'Cal State Dominguez Hills', href: '/ministries/campus/csudh' },
            { id: 'ccc', abbreviation: 'CCC', fullName: 'Cerritos Community College', href: '/ministries/campus/ccc' },
            { id: 'mt-sac', abbreviation: 'MT. SAC', fullName: 'Mt. San Antonio College', href: '/ministries/campus/mt-sac' },
            { id: 'golden-west', abbreviation: 'GWC', fullName: 'Golden West College', href: '/ministries/campus/golden-west' },
            { id: 'cypress', abbreviation: '', fullName: 'Cypress College', href: '/ministries/campus/cypress' },
            { id: 'cal-poly-pomona', abbreviation: '', fullName: 'Cal Poly Pomona', href: '/ministries/campus/cal-poly-pomona' },
          ],
          ctaHeading: "Don\u2019t see your campus?",
          ctaButton: { label: 'Let us know your interest', href: '#plan-visit' },
        },
      },
      {
        sectionType: 'FORM_SECTION',
        label: 'Plan Your Visit',
        colorScheme: 'DARK',
        content: sharedFormContent,
      },
      {
        sectionType: 'FAQ_SECTION',
        label: 'FAQ',
        colorScheme: 'LIGHT',
        containerWidth: 'NARROW',
        content: {
          heading: 'Frequently Asked Questions',
          showIcon: true,
          items: [
            { question: 'Where and when do campus groups meet?', answer: "Campus Bible study groups meet at various times throughout the week depending on the campus. Most groups meet once or twice a week. Fill out the contact form above and we\u2019ll connect you with the group nearest to you." },
            { question: 'What should I expect on my first Sunday visit?', answer: "Our Sunday worship service is about 90 minutes and includes praise, prayer, and a sermon. Dress is casual\u2014come as you are. You\u2019re welcome to sit anywhere, and someone from our welcome team will be happy to help you get settled." },
            { question: 'Do I need to know the Bible to attend?', answer: 'Not at all! Many of our members started with little or no Bible knowledge. Our studies are designed to be accessible to everyone, and our leaders are happy to walk alongside you at your own pace.' },
            { question: 'Is there parking available at the church?', answer: 'Yes, we have a free parking lot on-site. Street parking is also available on the surrounding blocks. If the lot is full, our parking team can help direct you.' },
            { question: 'How can I get connected beyond Sunday service?', answer: "We\u2019d love for you to join a small group Bible study, attend one of our fellowship events, or serve on a ministry team. Fill out the contact form on this page and we\u2019ll help you find the best next step." },
          ],
        },
      },
    ],
  )
  console.log("  Created I'm New page")

  // ── GIVING PAGE ────────────────────────────────────────────
  await createPageWithSections(
    {
      slug: 'giving',
      title: 'Giving',
      metaDescription: 'Support the mission of LA UBF through generous giving.',
      sortOrder: 13,
    },
    [
      {
        sectionType: 'PAGE_HERO',
        label: 'Giving Hero',
        colorScheme: 'LIGHT',
        content: {
          overline: 'GIVING',
          heading: 'Giving',
        },
      },
      {
        sectionType: 'STATEMENT',
        label: 'Giving Info',
        colorScheme: 'LIGHT',
        content: {
          heading: 'Giving',
          paragraphs: [
            { text: 'This page is coming soon.', isBold: false },
          ],
        },
      },
    ],
  )
  console.log('  Created giving page')

  console.log('\nSeed complete!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
