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
