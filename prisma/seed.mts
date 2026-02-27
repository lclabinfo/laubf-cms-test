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
  {
    slug: "do-you-truly-love-me",
    title: "Do You Truly Love Me More Than These?",
    book: "John",
    passage: "John 21:1-25",
    datePosted: "2026-04-10",
    dateFor: "2026-04-12",
    series: "Sunday Message",
    messenger: "P. Kevin Albright",
    keyVerseRef: "John 21:15",
    keyVerseText: `When they had finished eating, Jesus said to Simon Peter, \u201CSimon son of John, do you truly love me more than these?\u201D \u201CYes, Lord,\u201D he said, \u201Cyou know that I love you.\u201D Jesus said, \u201CFeed my lambs.\u201D`,
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
    bibleText: `<h4>John 21:1-25 (ESV)</h4>
<p>1 Afterward Jesus appeared again to his disciples, by the Sea of Tiberias. It happened this way: 2 Simon Peter, Thomas (called Didymus), Nathanael from Cana in Galilee, the sons of Zebedee, and two other disciples were together. 3 \u201CI\u2019m going out to fish,\u201D Simon Peter told them, and they said, \u201CWe\u2019ll go with you.\u201D So they went out and got into the boat, but that night they caught nothing.</p>
<p>4 Early in the morning, Jesus stood on the shore, but the disciples did not realize that it was Jesus. 5 He called out to them, \u201CFriends, haven\u2019t you any fish?\u201D \u201CNo,\u201D they answered. 6 He said, \u201CThrow your net on the right side of the boat and you will find some.\u201D When they did, they were unable to haul the net in because of the large number of fish.</p>
<p>7 Then the disciple whom Jesus loved said to Peter, \u201CIt is the Lord!\u201D As soon as Simon Peter heard him say, \u201CIt is the Lord,\u201D he wrapped his outer garment around him (for he had taken it off) and jumped into the water. 8 The other disciples followed in the boat, towing the net full of fish, for they were not far from shore, about a hundred yards. 9 When they landed, they saw a fire of burning coals there with fish on it, and some bread. 10 Jesus said to them, \u201CBring some of the fish you have just caught.\u201D</p>
<p>11 Simon Peter climbed aboard and dragged the net ashore. It was full of large fish, 153, but even with so many the net was not torn. 12 Jesus said to them, \u201CCome and have breakfast.\u201D None of the disciples dared ask him, \u201CWho are you?\u201D They knew it was the Lord. 13 Jesus came, took the bread and gave it to them, and did the same with the fish. 14 This was now the third time Jesus appeared to his disciples after he was raised from the dead.</p>
<p>15 When they had finished eating, Jesus said to Simon Peter, \u201CSimon son of John, do you truly love me more than these?\u201D \u201CYes, Lord,\u201D he said, \u201Cyou know that I love you.\u201D Jesus said, \u201CFeed my lambs.\u201D 16 Again Jesus said, \u201CSimon son of John, do you truly love me?\u201D He answered, \u201CYes, Lord, you know that I love you.\u201D Jesus said, \u201CTake care of my sheep.\u201D 17 The third time he said to him, \u201CSimon son of John, do you love me?\u201D Peter was hurt because Jesus asked him the third time, \u201CDo you love me?\u201D He said, \u201CLord, you know all things; you know that I love you.\u201D Jesus said, \u201CFeed my sheep.\u201D</p>
<p>18 Very truly I tell you, when you were younger you dressed yourself and went where you wanted; but when you are old you will stretch out your hands, and someone else will dress you and lead you where you do not want to go.\u201D 19 Jesus said this to indicate the kind of death by which Peter would glorify God. Then he said to him, \u201CFollow me!\u201D</p>
<p>20 Peter turned and saw that the disciple whom Jesus loved was following them. (This was the one who had leaned back against Jesus at the supper and had said, \u201CLord, who is going to betray you?\u201D) 21 When Peter saw him, he asked, \u201CLord, what about him?\u201D 22 Jesus answered, \u201CIf I want him to remain alive until I return, what is that to you? You must follow me.\u201D 23 Because of this, the rumor spread among the brothers that this disciple would not die. But Jesus did not say that he would not die; he only said, \u201CIf I want him to remain alive until I return, what is that to you?\u201D</p>
<p>24 This is the disciple who testifies to these things and who wrote them down. We know that his testimony is true. 25 Jesus did many other things as well. If every one of them were written down, I suppose that even the whole world would not have room for the books that would be written.</p>`,
    questions: `<h3>Read verses 1-6</h3>
<ul>
<li>Where and to whom did the risen Jesus appear again? (1-2, 14; Mt 26:32)</li>
<li>What did Peter and the disciples want to do and what was the result? (3)</li>
<li>How might they have felt when they caught nothing? How did Jesus help to restore them after their failure? (4-6)</li>
</ul>
<h3>Read verses 7-14</h3>
<ul>
<li>Who recognized Jesus first? (7a; Lk 5:1-11)</li>
<li>What did Peter and the other disciples do? (7b-8)</li>
<li>How did Jesus serve the disciples? (9-13)</li>
<li>How successful was their fishing? (11)</li>
<li>How might they have felt when Jesus served them? (12-13)</li>
</ul>
<h3>Read verses 15-17</h3>
<ul>
<li>After eating, to whom did Jesus speak and why? (15)</li>
<li>What did Jesus ask Peter? (15-17)</li>
<li>What did he mean by, \u201CDo you truly love me more than these\u201D?</li>
<li>Why did Jesus ask Peter three times? What was Peter\u2019s response and Jesus\u2019 command each time? (15-17)</li>
</ul>
<h3>Read verses 18-25</h3>
<ul>
<li>What will happen to Peter when he is old? (18,19a)</li>
<li>What did Jesus say to Peter? (19b)</li>
<li>Why did Peter ask about John? (20-21)</li>
<li>What was Jesus\u2019 answer? (22-23)</li>
<li>How did the author conclude? (24-25)</li>
</ul>`,
    answers: `<h3>Verses 1-6</h3>
<p>Jesus appeared by the Sea of Tiberias to seven disciples. Peter said he was going fishing and the others followed. They caught nothing all night. Jesus called from shore and told them to cast the net on the right side. They caught an enormous number of fish.</p>
<p>The disciples did not know what to do, so they did what was necessary. In taking this initiative they put themselves in a place where Christ met them. When we are uncertain what to do, we should simply do our duty and God will guide.</p>
<h3>Verses 7-14</h3>
<p>It was the Beloved Disciple (John) who recognized the stranger on the shore. Peter wrapped his outer garment around him and jumped into the water. Jesus had already prepared a charcoal fire with bread and fish for them. He knew the disciples were very hungry after a long night of work. He served them breakfast\u2014another sign of his grace and provision.</p>
<h3>Verses 15-17</h3>
<p>Jesus asked Peter three times \u201CDo you love me?\u201D corresponding to Peter\u2019s three denials. Each time Peter affirmed his love, Jesus commanded him to feed/care for his sheep. The key qualification for this task is a true love for Jesus.</p>
<p>Peter\u2019s pride was cut to the quick. The light was shining in the darkness of Peter\u2019s heart, bringing life. Without such brokenness we are full of self and unable to hear the guidance of the Chief Shepherd.</p>
<h3>Verses 18-25</h3>
<p>Jesus contrasts Peter\u2019s youth with what is coming. He has been able to go wherever he wanted, but when he is old, someone else will lead him where he does not want to go. This indicated the kind of death by which Peter would glorify God.</p>
<p>The call to follow is personal. We follow based on his love and calling, not based on other people.</p>`,
    transcript: `<p><strong>Then he said to him, \u201CFollow me!\u201D</strong></p>
<p>Today\u2019s passage is our final Easter/resurrection message. It is also the final chapter of John\u2019s gospel. What is the concluding message of the gospel? We see that God has loved us; he became flesh, he taught us, he suffered and died for us, and now calls us to follow him, to love him and feed his sheep.</p>
<p><strong>First, we can learn about the kind of love Jesus has; Jesus invited his disciples to breakfast (1-14).</strong></p>
<p>Jesus appeared \u201Cagain\u201D to his disciples at the sea of Tiberias, which is the sea of Galilee. They had gone there because Jesus told them he would meet them in Galilee after he had risen. But they really didn\u2019t know what they were doing. Peter said he was going out to fish and the others followed him. They fished all night but caught nothing.</p>
<p>Then Jesus appeared. He called out from shore, \u201CFriends, haven\u2019t you any fish?\u201D He told them to throw their net on the right side of the boat. When they did, they were unable to haul the net in because of the large number of fish. John recognized Jesus right away because what happened was just like what happened when he had first called them.</p>
<p>When they got to shore, Jesus had already prepared a fire with fish and bread. He served them breakfast. This was the third time he appeared to his disciples after he was raised from the dead.</p>
<p><strong>Second, Jesus asked Peter if he truly loved him (15-17).</strong></p>
<p>After breakfast, Jesus asked Simon Peter, \u201CDo you truly love me more than these?\u201D He asked three times, corresponding to Peter\u2019s three denials. Peter was hurt because Jesus asked him the third time. But this was a necessary surgery to heal Peter\u2019s heart.</p>
<p>Each time Peter affirmed his love, Jesus gave him a command: \u201CFeed my lambs,\u201D \u201CTake care of my sheep,\u201D \u201CFeed my sheep.\u201D Jesus showed Peter how to express his love: by caring for others.</p>
<p><strong>Third, follow me (18-25).</strong></p>
<p>Jesus finished by saying, \u201CFollow me!\u201D Following Jesus involves denying ourselves and doing what we do not want to do. The call to follow is personal. We follow based on his love and calling, not based on other people.</p>
<p>This passage shows us that Jesus loved us and calls us, and his love is the same. His love did not change although theirs had faltered. He wants us to accept his love and follow him, caring for his sheep with the same level of his love.</p>`,
    attachments: [
      { name: "John 21 Study Guide.pdf", url: "/files/bible-studies/john-21-study-guide.pdf", type: "PDF" },
      { name: "John 21 Study Guide.docx", url: "/files/bible-studies/john-21-study-guide.docx", type: "DOCX" },
      { name: "John 21 Message Transcript.docx", url: "/files/bible-studies/john-21-transcript.docx", type: "DOCX" },
    ],
  },
  {
    slug: "the-lord-is-my-shepherd",
    title: "The Lord is My Shepherd",
    book: "Psalms",
    passage: "Psalms 23:1-6",
    datePosted: "2026-02-20",
    dateFor: "2026-02-22",
    series: "Sunday Message",
    messenger: "P. Samuel Lee",
    keyVerseRef: "Psalms 23:1",
    keyVerseText: "The Lord is my shepherd, I lack nothing.",
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
    bibleText: `<h4>Psalms 23:1-6 (ESV)</h4>
<p>1 The Lord is my shepherd; I shall not want. 2 He makes me lie down in green pastures. He leads me beside still waters. 3 He restores my soul. He leads me in paths of righteousness for his name\u2019s sake.</p>
<p>4 Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me.</p>
<p>5 You prepare a table before me in the presence of my enemies; you anoint my head with oil; my cup overflows. 6 Surely goodness and mercy shall follow me all the days of my life, and I shall dwell in the house of the Lord forever.</p>`,
    questions: `<h3>Look at verse 1</h3>
<ul>
<li>What does it mean that the Lord is my shepherd?</li>
<li>What does \u201CI lack nothing\u201D really mean in the context of our daily lives?</li>
</ul>
<h3>Look at verses 2-3</h3>
<ul>
<li>Where does the shepherd lead his sheep and why?</li>
<li>What does it mean that he restores my soul?</li>
</ul>
<h3>Look at verses 4-6</h3>
<ul>
<li>What is the valley of the shadow of death?</li>
<li>Why does the psalmist fear no evil?</li>
<li>What is the significance of the prepared table?</li>
</ul>`,
    answers: `<h3>Verse 1</h3>
<p>The Lord as shepherd means he personally cares for and guides each of us. \u201CI shall not want\u201D does not mean we will have everything we desire, but that we will have everything we need. When the Lord is our shepherd, we can trust that he provides for all our true needs.</p>
<h3>Verses 2-3</h3>
<p>He leads us to green pastures and quiet waters \u2014 places of nourishment and peace. These are not places we find on our own; the shepherd leads us there. \u201CHe restores my soul\u201D means he renews our inner life when we are weary, discouraged, or spiritually dry. He leads us in right paths \u2014 not for our merit, but for his name\u2019s sake.</p>
<h3>Verses 4-6</h3>
<p>The valley of the shadow of death represents the darkest, most frightening experiences of life. Yet even there, we fear no evil because the shepherd is with us. His rod protects from enemies; his staff guides and rescues. The prepared table shows that God provides abundantly even in the midst of adversity. The overflowing cup represents abundant blessings. Goodness and mercy follow us \u2014 not occasionally, but all the days of our life.</p>`,
    transcript: `<p><strong>The Lord is my shepherd, I lack nothing.</strong></p>
<p>Psalm 23 is perhaps the most beloved psalm. David, a former shepherd himself, describes God as the perfect shepherd who provides, protects, and guides.</p>
<p><strong>First, the shepherd provides (1-3).</strong></p>
<p>David begins with a bold confession: \u201CThe Lord is my shepherd.\u201D This is deeply personal. He does not say \u201CThe Lord is a shepherd\u201D but \u201Cmy shepherd.\u201D When we make this personal confession, we can also say \u201CI shall not want.\u201D The shepherd provides green pastures for nourishment, still waters for refreshment, and right paths for direction. He restores our soul when we are broken.</p>
<p><strong>Second, the shepherd protects (4).</strong></p>
<p>Even in the darkest valley, we need not fear because the shepherd is with us. His rod and staff \u2014 instruments of protection and guidance \u2014 comfort us. The key is not the absence of danger but the presence of the shepherd.</p>
<p><strong>Third, the shepherd blesses abundantly (5-6).</strong></p>
<p>God prepares a table in the presence of our enemies. He anoints our head with oil. Our cup overflows. These images speak of God\u2019s generous, abundant provision. And the psalm ends with the promise that goodness and mercy will follow us all the days of our life, and we will dwell in God\u2019s house forever.</p>`,
    attachments: [
      { name: "Psalm 23 Study Guide.pdf", url: "/files/bible-studies/psalm-23-study-guide.pdf", type: "PDF" },
      { name: "Psalm 23 Study Guide.docx", url: "/files/bible-studies/psalm-23-study-guide.docx", type: "DOCX" },
    ],
  },
  {
    slug: "blessed-are-the-poor-in-spirit",
    title: "The Sermon on the Mount: Blessed Are the Poor in Spirit",
    book: "Matthew",
    passage: "Matthew 5:1-12",
    datePosted: "2026-02-13",
    dateFor: "2026-02-15",
    series: "Sunday Message",
    messenger: "P. David Kim",
    keyVerseRef: "Matthew 5:3",
    keyVerseText: "Blessed are the poor in spirit, for theirs is the kingdom of heaven.",
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
    bibleText: `<h4>Matthew 5:1-12 (ESV)</h4>
<p>1 Seeing the crowds, he went up on the mountain, and when he sat down, his disciples came to him. 2 And he opened his mouth and taught them, saying:</p>
<p>3 \u201CBlessed are the poor in spirit, for theirs is the kingdom of heaven.</p>
<p>4 Blessed are those who mourn, for they shall be comforted.</p>
<p>5 Blessed are the meek, for they shall inherit the earth.</p>
<p>6 Blessed are those who hunger and thirst for righteousness, for they shall be satisfied.</p>
<p>7 Blessed are the merciful, for they shall receive mercy.</p>
<p>8 Blessed are the pure in heart, for they shall see God.</p>
<p>9 Blessed are the peacemakers, for they shall be called sons of God.</p>
<p>10 Blessed are those who are persecuted for righteousness\u2019 sake, for theirs is the kingdom of heaven.</p>
<p>11 Blessed are you when others revile you and persecute you and utter all kinds of evil against you falsely on my account. 12 Rejoice and be glad, for your reward is great in heaven, for so they persecuted the prophets who were before you.\u201D</p>`,
    questions: `<h3>Look at verses 1-2</h3>
<ul>
<li>Where did Jesus go and what did he do?</li>
<li>Who were his audience?</li>
</ul>
<h3>Look at verses 3-6</h3>
<ul>
<li>What does it mean to be \u201Cpoor in spirit\u201D?</li>
<li>Why are those who mourn blessed?</li>
<li>What does it mean to hunger and thirst for righteousness?</li>
</ul>
<h3>Look at verses 7-12</h3>
<ul>
<li>What does it mean to be pure in heart?</li>
<li>Why are peacemakers called sons of God?</li>
<li>How should we respond when persecuted for righteousness?</li>
</ul>`,
    answers: `<h3>Verses 1-2</h3>
<p>Jesus went up on a mountain and sat down to teach. His disciples came to him, though crowds were also present. The mountain setting echoes Moses receiving the law on Mount Sinai. Jesus, as the new Moses, gives the new law of the kingdom.</p>
<h3>Verses 3-6</h3>
<p>\u201CPoor in spirit\u201D means recognizing our spiritual bankruptcy before God. It is the opposite of spiritual pride. Those who mourn are blessed because they will be comforted by God. This mourning includes grief over sin and the brokenness of the world. To hunger and thirst for righteousness means to desperately desire to live rightly before God, like a starving person desires food.</p>
<h3>Verses 7-12</h3>
<p>The pure in heart are those whose inner motives are sincere before God. Peacemakers are those who work to reconcile broken relationships. They are called sons of God because they reflect God\u2019s own character as the great Reconciler. When persecuted, we should rejoice because our reward in heaven is great, and we share in the experience of the prophets before us.</p>`,
    transcript: `<p><strong>Blessed are the poor in spirit, for theirs is the kingdom of heaven.</strong></p>
<p>The Sermon on the Mount is the greatest sermon ever preached. In it, Jesus describes the character of citizens of the kingdom of heaven. The Beatitudes are not a checklist of virtues to achieve, but a description of the transforming work of God\u2019s grace in a believer\u2019s life.</p>
<p><strong>First, the inward qualities of kingdom citizens (3-6).</strong></p>
<p>Jesus begins with \u201Cpoor in spirit\u201D \u2014 those who recognize their spiritual need. This is the gateway to the kingdom. Those who mourn grieve over sin. The meek are not weak but are strong people under God\u2019s control. Those who hunger and thirst for righteousness have an intense desire for God\u2019s kingdom values.</p>
<p><strong>Second, the outward qualities of kingdom citizens (7-9).</strong></p>
<p>The merciful show compassion. The pure in heart have undivided loyalty to God. The peacemakers actively work for reconciliation. These qualities flow naturally from the inward transformation described in verses 3-6.</p>
<p><strong>Third, the cost and reward of kingdom living (10-12).</strong></p>
<p>Following Jesus brings persecution. But Jesus says we should rejoice because our reward is great in heaven. The prophets before us also suffered. Our suffering connects us to a great lineage of faith.</p>`,
    attachments: [
      { name: "Matthew 5 Study Guide.pdf", url: "/files/bible-studies/matthew-5-study-guide.pdf", type: "PDF" },
      { name: "Matthew 5 Message Transcript.docx", url: "/files/bible-studies/matthew-5-transcript.docx", type: "DOCX" },
    ],
  },
  {
    slug: "more-than-conquerors",
    title: "More Than Conquerors",
    book: "Romans",
    passage: "Romans 8:31-39",
    datePosted: "2026-02-06",
    dateFor: "2026-02-08",
    series: "Sunday Message",
    messenger: "P. William Larsen",
    keyVerseRef: "Romans 8:37",
    keyVerseText: "No, in all these things we are more than conquerors through him who loved us.",
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
    bibleText: `<h4>Romans 8:31-39 (ESV)</h4>
<p>31 What then shall we say to these things? If God is for us, who can be against us? 32 He who did not spare his own Son but gave him up for us all, how will he not also with him graciously give us all things? 33 Who shall bring any charge against God\u2019s elect? It is God who justifies. 34 Who is to condemn? Christ Jesus is the one who died\u2014more than that, who was raised\u2014who is at the right hand of God, who indeed is interceding for us.</p>
<p>35 Who shall separate us from the love of Christ? Shall tribulation, or distress, or persecution, or famine, or nakedness, or danger, or sword? 36 As it is written, \u201CFor your sake we are being killed all the day long; we are regarded as sheep to be slaughtered.\u201D</p>
<p>37 No, in all these things we are more than conquerors through him who loved us. 38 For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come, nor powers, 39 nor height nor depth, nor anything else in all creation, will be able to separate us from the love of God in Christ Jesus our Lord.</p>`,
    questions: `<h3>Look at verses 31-34</h3>
<ul>
<li>What does Paul mean by \u201CIf God is for us, who can be against us?\u201D</li>
<li>How does God\u2019s giving of his own Son prove his love?</li>
<li>Who can bring a charge against us or condemn us? Why?</li>
</ul>
<h3>Look at verses 35-39</h3>
<ul>
<li>What are the things that cannot separate us from the love of Christ?</li>
<li>What does it mean to be \u201Cmore than conquerors\u201D?</li>
<li>How comprehensive is the list in verses 38-39?</li>
</ul>`,
    answers: `<h3>Verses 31-34</h3>
<p>\u201CIf God is for us, who can be against us?\u201D is not saying no one will oppose us, but that no opposition can ultimately prevail against us. God proved he is for us by not sparing his own Son. Since God gave us the greatest gift (Jesus), we can trust him to provide everything else we need. No one can bring a charge against us because God himself has justified us. No one can condemn us because Christ died for us, was raised, and now intercedes for us at God\u2019s right hand.</p>
<h3>Verses 35-39</h3>
<p>Paul lists seven forms of suffering that might seem to separate us from Christ\u2019s love, but none of them can. \u201CMore than conquerors\u201D means we don\u2019t just barely survive \u2014 we triumph overwhelmingly through Christ\u2019s love. The list in verses 38-39 covers every possible category: death and life, supernatural powers, time (present and future), space (height and depth), and \u201Canything else in all creation.\u201D Nothing in all existence can separate us from God\u2019s love in Christ Jesus.</p>`,
    transcript: `<p><strong>More than conquerors through him who loved us.</strong></p>
<p>Romans 8 is the pinnacle of Paul\u2019s letter to the Romans. After explaining the problem of sin and the solution of grace, Paul reaches a triumphant conclusion.</p>
<p><strong>First, God is for us (31-34).</strong></p>
<p>Paul asks a series of rhetorical questions. If God is for us, who can be against us? God proved he is for us by giving his own Son. This is the ultimate proof of God\u2019s love. And since he gave us the greatest gift, he will surely give us all things. No one can accuse us because God has declared us righteous. No one can condemn us because Christ died, rose, and intercedes for us.</p>
<p><strong>Second, nothing can separate us from God\u2019s love (35-39).</strong></p>
<p>Paul lists every possible hardship \u2014 tribulation, distress, persecution, famine, nakedness, danger, sword. None of them can separate us from Christ\u2019s love. In fact, in all these things we are more than conquerors. We don\u2019t just survive; we triumph. Paul concludes with one of the most comprehensive statements in all of Scripture: neither death nor life, nor angels nor rulers, nor present nor future, nor powers, nor height nor depth, nor anything in all creation can separate us from the love of God in Christ Jesus our Lord.</p>`,
    attachments: [
      { name: "Romans 8 Study Guide.pdf", url: "/files/bible-studies/romans-8-study-guide.pdf", type: "PDF" },
      { name: "Romans 8 Study Guide.docx", url: "/files/bible-studies/romans-8-study-guide.docx", type: "DOCX" },
      { name: "Romans 8 Message Transcript.docx", url: "/files/bible-studies/romans-8-transcript.docx", type: "DOCX" },
    ],
  },
  {
    slug: "remain-in-my-love",
    title: "Remain in My Love",
    book: "John",
    passage: "John 15:9-17",
    datePosted: "2026-01-30",
    dateFor: "2026-02-01",
    series: "Sunday Message",
    messenger: "P. Kevin Albright",
    keyVerseRef: "John 15:12",
    keyVerseText: "My command is this: Love each other as I have loved you.",
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
    bibleText: `<h4>John 15:9-17 (ESV)</h4>
<p>9 As the Father has loved me, so have I loved you. Abide in my love. 10 If you keep my commandments, you will abide in my love, just as I have kept my Father\u2019s commandments and abide in his love. 11 These things I have spoken to you, that my joy may be in you, and that your joy may be full.</p>
<p>12 \u201CThis is my commandment, that you love one another as I have loved you. 13 Greater love has no one than this, that someone lay down his life for his friends. 14 You are my friends if you do what I command you. 15 No longer do I call you servants, for the servant does not know what his master is doing; but I have called you friends, for all that I have heard from my Father I have made known to you.</p>
<p>16 You did not choose me, but I chose you and appointed you that you should go and bear fruit and that your fruit should abide, so that whatever you ask the Father in my name, he may give it to you. 17 These things I command you, so that you will love one another.\u201D</p>`,
    questions: `<h3>Look at verses 9-11</h3>
<ul>
<li>How has Jesus loved us?</li>
<li>What is the condition for remaining in his love?</li>
<li>Why did Jesus tell us these things?</li>
</ul>
<h3>Look at verses 12-17</h3>
<ul>
<li>What is Jesus\u2019 command?</li>
<li>What is the greatest love?</li>
<li>What does Jesus call us and why?</li>
</ul>`,
    answers: `<h3>Verses 9-11</h3>
<p>Jesus loved us as the Father loved him \u2014 unconditionally and sacrificially. We remain in his love by keeping his commands. This is not earning his love, but living in the awareness and experience of it. Jesus told us these things so that his joy would be in us and our joy would be full. True joy comes from abiding in Christ\u2019s love.</p>
<h3>Verses 12-17</h3>
<p>Jesus\u2019 command is to love one another as he has loved us. The greatest expression of love is laying down one\u2019s life for friends. Jesus elevated his disciples from servants to friends \u2014 servants don\u2019t know the master\u2019s plans, but friends are trusted with the master\u2019s heart. We did not choose Jesus; he chose us. He appointed us to bear lasting fruit and to love one another.</p>`,
    transcript: `<p><strong>Remain in my love.</strong></p>
<p>In John 15, Jesus uses the imagery of the vine and branches. Here in verses 9-17, he focuses on the theme of love \u2014 his love for us, and our love for one another.</p>
<p><strong>First, abide in my love (9-11).</strong></p>
<p>Jesus says, \u201CAs the Father has loved me, so have I loved you.\u201D The love of God flows from Father to Son to us. We are invited to abide in this love. The condition is keeping his commandments \u2014 not as a burden, but as a natural response to being loved. The purpose is joy: \u201Cthat my joy may be in you, and that your joy may be full.\u201D</p>
<p><strong>Second, love one another (12-15).</strong></p>
<p>The command is clear: love each other as Jesus loved us. The measure of love is self-sacrifice \u2014 \u201Cgreater love has no one than this, that someone lay down his life for his friends.\u201D Jesus calls us friends, not servants. He has shared everything with us from the Father.</p>
<p><strong>Third, chosen to bear fruit (16-17).</strong></p>
<p>We did not choose Jesus; he chose us and appointed us to bear fruit that lasts. The foundation and goal of everything is love for one another.</p>`,
    attachments: [
      { name: "John 15 Study Guide.pdf", url: "/files/bible-studies/john-15-study-guide.pdf", type: "PDF" },
      { name: "John 15 Study Guide.docx", url: "/files/bible-studies/john-15-study-guide.docx", type: "DOCX" },
    ],
  },
  {
    slug: "the-call-of-abram",
    title: "The Call of Abram",
    book: "Genesis",
    passage: "Genesis 12:1-9",
    datePosted: "2026-01-23",
    dateFor: "2026-01-25",
    series: "Sunday Message",
    messenger: "P. Abraham Kim",
    keyVerseRef: "Genesis 12:2",
    keyVerseText: "I will make you into a great nation, and I will bless you; I will make your name great, and you will be a blessing.",
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
    bibleText: `<h4>Genesis 12:1-9 (ESV)</h4>
<p>1 Now the Lord said to Abram, \u201CGo from your country and your kindred and your father\u2019s house to the land that I will show you. 2 And I will make of you a great nation, and I will bless you and make your name great, so that you will be a blessing. 3 I will bless those who bless you, and him who dishonors you I will curse, and in you all the families of the earth shall be blessed.\u201D</p>
<p>4 So Abram went, as the Lord had told him, and Lot went with him. Abram was seventy-five years old when he departed from Haran. 5 And Abram took Sarai his wife, and Lot his brother\u2019s son, and all their possessions that they had gathered, and the people that they had acquired in Haran, and they set out to go to the land of Canaan. When they came to the land of Canaan, 6 Abram passed through the land to the place at Shechem, to the oak of Moreh. At that time the Canaanites were in the land.</p>
<p>7 Then the Lord appeared to Abram and said, \u201CTo your offspring I will give this land.\u201D So he built there an altar to the Lord, who had appeared to him. 8 From there he moved to the hill country on the east of Bethel and pitched his tent, with Bethel on the west and Ai on the east. And there he built an altar to the Lord and called upon the name of the Lord. 9 And Abram journeyed on, still going toward the Negeb.</p>`,
    questions: `<h3>Look at verses 1-3</h3>
<ul>
<li>What did God command Abram to do?</li>
<li>What promises did God make to Abram?</li>
<li>What is the significance of \u201CAll peoples on earth will be blessed through you\u201D?</li>
</ul>
<h3>Look at verses 4-9</h3>
<ul>
<li>How did Abram respond to God\u2019s call?</li>
<li>What did Abram do when he arrived in Canaan?</li>
</ul>`,
    answers: `<h3>Verses 1-3</h3>
<p>God commanded Abram to leave his country, his people, and his father\u2019s household. This was a call to leave behind everything familiar and secure. God made seven promises: a great nation, blessing, a great name, being a blessing, blessing those who bless him, cursing those who dishonor him, and all peoples being blessed through him. The promise that all families of the earth would be blessed through Abram points to the coming of Jesus Christ, through whom salvation comes to all nations.</p>
<h3>Verses 4-9</h3>
<p>Abram obeyed. At 75 years old, he left Haran and went to Canaan as God directed. When he arrived, God appeared again and promised the land to his offspring. Abram\u2019s response was to build altars and call on the name of the Lord. Building altars was an act of worship and a declaration of faith. Abram lived as a pilgrim, journeying through the land, trusting God\u2019s promise even though the Canaanites still occupied the land.</p>`,
    transcript: `<p><strong>The call of Abram.</strong></p>
<p>Genesis 12 marks a turning point in the Bible. After the stories of creation, the fall, the flood, and the tower of Babel, God now calls one man, Abram, through whom he will work to bless all nations.</p>
<p><strong>First, God\u2019s command and promise (1-3).</strong></p>
<p>God told Abram to leave everything \u2014 his country, his kindred, his father\u2019s house. This was not easy. But with the command came an extraordinary promise: God would make him a great nation, bless him, make his name great, and through him bless all families of the earth. The promise of blessing to all nations finds its ultimate fulfillment in Jesus Christ.</p>
<p><strong>Second, Abram\u2019s obedience (4-9).</strong></p>
<p>The response was simple and beautiful: \u201CSo Abram went, as the Lord had told him.\u201D At seventy-five years old, he left everything behind and set out for an unknown land. When he arrived in Canaan, he built altars to the Lord. His life became a journey of faith, worship, and obedience. He teaches us that faith is not understanding everything but trusting God enough to obey.</p>`,
    attachments: [
      { name: "Genesis 12 Study Guide.pdf", url: "/files/bible-studies/genesis-12-study-guide.pdf", type: "PDF" },
      { name: "Genesis 12 Study Guide.docx", url: "/files/bible-studies/genesis-12-study-guide.docx", type: "DOCX" },
    ],
  },
  {
    slug: "the-day-of-pentecost",
    title: "The Day of Pentecost",
    book: "Acts",
    passage: "Acts 2:1-21",
    datePosted: "2026-01-16",
    dateFor: "2026-01-18",
    series: "Sunday Message",
    messenger: "P. Samuel Lee",
    keyVerseRef: "Acts 2:17",
    keyVerseText: "In the last days, God says, I will pour out my Spirit on all people. Your sons and daughters will prophesy, your young men will see visions, your old men will dream dreams.",
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
    bibleText: `<h4>Acts 2:1-21 (ESV)</h4>
<p>1 When the day of Pentecost arrived, they were all together in one place. 2 And suddenly there came from heaven a sound like a mighty rushing wind, and it filled the entire house where they were sitting. 3 And divided tongues as of fire appeared to them and rested on each one of them. 4 And they were all filled with the Holy Spirit and began to speak in other tongues as the Spirit gave them utterance.</p>
<p>5 Now there were dwelling in Jerusalem Jews, devout men from every nation under heaven. 6 And at this sound the multitude came together, and they were bewildered, because each one was hearing them speak in his own language. 7 And they were amazed and astonished, saying, \u201CAre not all these who are speaking Galileans? 8 And how is it that we hear, each of us in his own native language? 9 Parthians and Medes and Elamites and residents of Mesopotamia, Judea and Cappadocia, Pontus and Asia, 10 Phrygia and Pamphylia, Egypt and the parts of Libya belonging to Cyrene, and visitors from Rome, 11 both Jews and proselytes, Cretans and Arabians\u2014we hear them telling in our own tongues the mighty works of God.\u201D 12 And all were amazed and perplexed, saying to one another, \u201CWhat does this mean?\u201D 13 But others mocking said, \u201CThey are filled with new wine.\u201D</p>
<p>14 But Peter, standing with the eleven, lifted up his voice and addressed them: \u201CMen of Judea and all who dwell in Jerusalem, let this be known to you, and give ear to my words. 15 For these people are not drunk, as you suppose, since it is only the third hour of the day. 16 But this is what was uttered through the prophet Joel:</p>
<p>17 \u201CAnd in the last days it shall be, God declares, that I will pour out my Spirit on all flesh, and your sons and your daughters shall prophesy, and your young men shall see visions, and your old men shall dream dreams; 18 even on my male servants and female servants in those days I will pour out my Spirit, and they shall prophesy. 19 And I will show wonders in the heavens above and signs on the earth below, blood, and fire, and vapor of smoke; 20 the sun shall be turned to darkness and the moon to blood, before the day of the Lord comes, the great and magnificent day. 21 And it shall come to pass that everyone who calls upon the name of the Lord shall be saved.\u201D</p>`,
    questions: `<h3>Look at verses 1-4</h3>
<ul>
<li>What happened on the day of Pentecost?</li>
<li>What were the signs of the Holy Spirit\u2019s coming?</li>
</ul>
<h3>Look at verses 5-13</h3>
<ul>
<li>Who was present and how did they react?</li>
<li>What did the crowd think was happening?</li>
</ul>
<h3>Look at verses 14-21</h3>
<ul>
<li>How did Peter explain the event?</li>
<li>What Old Testament prophecy did he quote?</li>
</ul>`,
    answers: `<h3>Verses 1-4</h3>
<p>The Holy Spirit came with the sound of a mighty rushing wind and tongues of fire resting on each person. They were all filled with the Holy Spirit and began to speak in other tongues. The wind symbolizes the Spirit\u2019s power; the fire symbolizes purification and God\u2019s presence. Speaking in tongues enabled the disciples to proclaim God\u2019s works to people of every language.</p>
<h3>Verses 5-13</h3>
<p>Devout Jews from every nation were in Jerusalem for the feast. They were amazed to hear Galileans speaking in their native languages about God\u2019s mighty works. Some were perplexed; others mocked, saying the disciples were drunk. The list of nations shows the universal scope of God\u2019s work.</p>
<h3>Verses 14-21</h3>
<p>Peter stood up and explained that this was the fulfillment of Joel\u2019s prophecy. God was pouring out his Spirit on all people \u2014 sons and daughters, young and old, servants and free. The prophecy concludes with the promise that \u201Ceveryone who calls on the name of the Lord shall be saved.\u201D This is the birth of the church and the beginning of God\u2019s mission to all nations.</p>`,
    transcript: `<p><strong>The Day of Pentecost.</strong></p>
<p>Acts 2 describes the birth of the church. The Holy Spirit came upon the disciples, empowering them to be witnesses.</p>
<p><strong>First, the coming of the Holy Spirit (1-4).</strong></p>
<p>On the day of Pentecost, the disciples were together in one place. Suddenly a sound like a mighty wind filled the house, and tongues of fire rested on each of them. They were filled with the Holy Spirit and began to speak in other languages. This was the fulfillment of Jesus\u2019 promise that the Spirit would come and empower them.</p>
<p><strong>Second, the crowd\u2019s reaction (5-13).</strong></p>
<p>Jews from every nation heard the disciples speaking in their own languages. They were amazed and bewildered. Some asked sincerely, \u201CWhat does this mean?\u201D Others mocked. This is always the response to the work of the Spirit \u2014 some are drawn and some resist.</p>
<p><strong>Third, Peter\u2019s explanation (14-21).</strong></p>
<p>Peter stood up boldly \u2014 this was the same Peter who had denied Jesus three times. Now filled with the Spirit, he proclaimed that this was the fulfillment of Joel\u2019s prophecy. God is pouring out his Spirit on all people. And the great promise is this: everyone who calls on the name of the Lord shall be saved.</p>`,
    attachments: [
      { name: "Acts 2 Study Guide.pdf", url: "/files/bible-studies/acts-2-study-guide.pdf", type: "PDF" },
      { name: "Acts 2 Message Transcript.docx", url: "/files/bible-studies/acts-2-transcript.docx", type: "DOCX" },
    ],
  },
  {
    slug: "saved-by-grace-through-faith",
    title: "Saved by Grace Through Faith",
    book: "Ephesians",
    passage: "Ephesians 2:1-10",
    datePosted: "2026-01-09",
    dateFor: "2026-01-11",
    series: "Sunday Message",
    messenger: "P. David Kim",
    keyVerseRef: "Ephesians 2:8-9",
    keyVerseText: "For it is by grace you have been saved, through faith\u2014and this is not from yourselves, it is the gift of God\u2014not by works, so that no one can boast.",
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
    bibleText: `<h4>Ephesians 2:1-10 (ESV)</h4>
<p>1 And you were dead in the trespasses and sins 2 in which you once walked, following the course of this world, following the prince of the power of the air, the spirit that is now at work in the sons of disobedience\u2014 3 among whom we all once lived in the passions of our flesh, carrying out the desires of the body and the mind, and were by nature children of wrath, like the rest of mankind.</p>
<p>4 But God, being rich in mercy, because of the great love with which he loved us, 5 even when we were dead in our trespasses, made us alive together with Christ\u2014by grace you have been saved\u2014 6 and raised us up with him and seated us with him in the heavenly places in Christ Jesus, 7 so that in the coming ages he might show the immeasurable riches of his grace in kindness toward us in Christ Jesus.</p>
<p>8 For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, 9 not a result of works, so that no one may boast. 10 For we are his workmanship, created in Christ Jesus for good works, which God prepared beforehand, that we should walk in them.</p>`,
    questions: `<h3>Look at verses 1-3</h3>
<ul>
<li>How does Paul describe our former condition?</li>
<li>What does it mean to be \u201Cdead in transgressions\u201D?</li>
</ul>
<h3>Look at verses 4-7</h3>
<ul>
<li>What motivated God to save us?</li>
<li>What did God do for us through Christ?</li>
</ul>
<h3>Look at verses 8-10</h3>
<ul>
<li>How are we saved?</li>
<li>What is the purpose of our salvation?</li>
</ul>`,
    answers: `<h3>Verses 1-3</h3>
<p>Paul describes our former condition as spiritual death. We were dead in trespasses and sins, following the ways of the world, the devil, and our own sinful nature. \u201CDead in transgressions\u201D means we were completely unable to save ourselves, just as a dead person cannot make themselves alive. We were by nature children of wrath \u2014 this applied to everyone without exception.</p>
<h3>Verses 4-7</h3>
<p>\u201CBut God\u201D \u2014 these two words change everything. What motivated God was his rich mercy and great love. Even when we were dead in sin, God made us alive with Christ, raised us up, and seated us with Christ in heavenly places. This is entirely by grace. God did this to display the immeasurable riches of his grace for all ages to come.</p>
<h3>Verses 8-10</h3>
<p>We are saved by grace through faith, not by works. Salvation is God\u2019s gift so no one can boast. Yet we are created for good works \u2014 works God prepared in advance. Grace and works are not opposed: grace saves us, and grace empowers us to do the good works God planned for us.</p>`,
    transcript: `<p><strong>Saved by grace through faith.</strong></p>
<p>Ephesians 2 contains the clearest summary of the gospel in Paul\u2019s letters. By grace you have been saved through faith \u2014 and this is not from yourselves, it is the gift of God.</p>
<p><strong>First, our hopeless condition (1-3).</strong></p>
<p>Paul paints a dark picture of our former state. We were dead in trespasses and sins. Not sick, not struggling \u2014 dead. We followed the world, the devil, and our own sinful desires. We were objects of wrath. This is the bad news that makes the good news so good.</p>
<p><strong>Second, God\u2019s rich mercy (4-7).</strong></p>
<p>\u201CBut God\u201D \u2014 the most important two words in the Bible. Rich in mercy, great in love, God made us alive with Christ even when we were dead. He raised us up and seated us with Christ. This is past, present, and future grace all at once. And God did this to show the coming ages the incredible riches of his grace.</p>
<p><strong>Third, saved for a purpose (8-10).</strong></p>
<p>By grace, through faith, not by works. This is God\u2019s gift. But verse 10 shows the other side: we are God\u2019s masterpiece, created in Christ Jesus for good works that God prepared beforehand. We are saved not by good works but for good works. Grace is both the foundation and the fuel of the Christian life.</p>`,
    attachments: [
      { name: "Ephesians 2 Study Guide.pdf", url: "/files/bible-studies/ephesians-2-study-guide.pdf", type: "PDF" },
      { name: "Ephesians 2 Study Guide.docx", url: "/files/bible-studies/ephesians-2-study-guide.docx", type: "DOCX" },
      { name: "Ephesians 2 Message Transcript.docx", url: "/files/bible-studies/ephesians-2-transcript.docx", type: "DOCX" },
    ],
  },
  {
    slug: "not-of-the-world",
    title: "Not Of The World",
    book: "John",
    passage: "John 17:14-26",
    datePosted: "2026-01-02",
    dateFor: "2026-01-04",
    series: "Sunday Message",
    messenger: "P. William Larsen",
    keyVerseRef: "John 17:14",
    keyVerseText: "I have given them your word, and the world has hated them because they are not of the world, just as I am not of the world.",
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
    bibleText: `<h4>John 17:14-26 (ESV)</h4>
<p>14 I have given them your word, and the world has hated them because they are not of the world, just as I am not of the world. 15 I do not ask that you take them out of the world, but that you keep them from the evil one. 16 They are not of the world, just as I am not of the world. 17 Sanctify them in the truth; your word is truth. 18 As you sent me into the world, so I have sent them into the world. 19 And for their sake I consecrate myself, that they also may be sanctified in truth.</p>
<p>20 I do not ask for these only, but also for those who will believe in me through their word, 21 that they may all be one, just as you, Father, are in me, and I in you, that they also may be in us, so that the world may believe that you have sent me. 22 The glory that you have given me I have given to them, that they may be one even as we are one, 23 I in them and you in me, that they may become perfectly one, so that the world may know that you sent me and loved them even as you loved me.</p>
<p>24 Father, I desire that they also, whom you have given me, may be with me where I am, to see my glory that you have given me because you loved me before the foundation of the world. 25 O righteous Father, even though the world does not know you, I know you, and these know that you have sent me. 26 I made known to them your name, and I will continue to make it known, that the love with which you have loved me may be in them, and I in them.\u201D</p>`,
    questions: `<h3>V14-19</h3>
<ul>
<li>What has Jesus given us? How does the world treat those who follow Jesus\u2019s words and why?</li>
<li>What did Jesus not ask God for? Instead, what did he ask God to do for his disciples and why?</li>
<li>What purpose does Jesus have for sending us into the world?</li>
</ul>
<h3>V20-23</h3>
<ul>
<li>For whom did Jesus also ask God for these things?</li>
<li>Why does Jesus want all believers to be united as one?</li>
</ul>
<h3>V24-26</h3>
<ul>
<li>What does Jesus desire and why?</li>
<li>What did Jesus make known to his disciples, and why does he continue to make it known?</li>
</ul>`,
    answers: `<h3>Verses 14-19</h3>
<p>Jesus gave them God\u2019s word. The world hates them because they are not of the world \u2014 their values, priorities, and allegiance have changed. Jesus does not pray to take them out of the world but to protect them from the evil one. He wants them sanctified \u2014 set apart \u2014 in truth, which is God\u2019s word. Just as the Father sent Jesus into the world, Jesus sends us into the world with a mission: to be agents of truth and grace.</p>
<h3>Verses 20-23</h3>
<p>Jesus prays not only for his immediate disciples but for all future believers \u2014 including us. He prays that we may be one, just as the Father and Son are one. The purpose of our unity is so that the world may believe and know that God sent Jesus. Our oneness is a powerful witness to the world. The glory Jesus received from the Father, he gave to us, so we might be perfectly united.</p>
<h3>Verses 24-26</h3>
<p>Jesus\u2019 deepest desire is that we be with him and see his glory. He wants us to know the Father\u2019s love and to have that same love dwelling in us. Jesus has made the Father\u2019s name known and will continue to do so, so that God\u2019s love fills us and Christ himself is in us.</p>`,
    transcript: `<p><strong>Not of the world.</strong></p>
<p>John 17 is Jesus\u2019 high priestly prayer. In this portion, Jesus prays for his disciples and all future believers.</p>
<p><strong>First, protection and sanctification (14-19).</strong></p>
<p>Jesus has given us God\u2019s word, and because of this, the world hates us. But Jesus does not ask God to take us out of the world. Instead, he asks for protection from the evil one and sanctification through truth. God\u2019s word is truth, and it sets us apart. We are sent into the world with a purpose \u2014 not to escape it but to be God\u2019s witnesses in it.</p>
<p><strong>Second, unity for witness (20-23).</strong></p>
<p>Jesus prays for all who will believe through the disciples\u2019 testimony \u2014 that includes us today. His prayer is for unity. Not organizational unity, but the deep spiritual oneness that mirrors the unity between Father and Son. This unity is the most powerful witness to the world that God sent Jesus.</p>
<p><strong>Third, the ultimate desire (24-26).</strong></p>
<p>Jesus\u2019 greatest desire is that we be with him and see his glory. He wants the Father\u2019s love to be in us and he himself to dwell in us. This is the goal of redemption: to bring us into the eternal love relationship between Father and Son.</p>`,
    attachments: [
      { name: "John 17 Study Guide.pdf", url: "/files/bible-studies/john-17-study-guide.pdf", type: "PDF" },
      { name: "John 17 Study Guide.docx", url: "/files/bible-studies/john-17-study-guide.docx", type: "DOCX" },
    ],
  },
  {
    slug: "his-steadfast-love-endures-forever",
    title: "His Steadfast Love Endures Forever",
    book: "Psalms",
    passage: "Psalms 136:1-26",
    datePosted: "2025-12-12",
    dateFor: "2025-12-14",
    series: "Sunday Message",
    messenger: "Paul Kim",
    keyVerseRef: "Psalms 136:1",
    keyVerseText: "Give thanks to the Lord, for he is good, for his steadfast love endures forever.",
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
    bibleText: `<h4>Psalms 136:1-26 (ESV)</h4>
<p>1 Give thanks to the Lord, for he is good, for his steadfast love endures forever. 2 Give thanks to the God of gods, for his steadfast love endures forever. 3 Give thanks to the Lord of lords, for his steadfast love endures forever;</p>
<p>4 to him who alone does great wonders, for his steadfast love endures forever; 5 to him who by understanding made the heavens, for his steadfast love endures forever; 6 to him who spread out the earth above the waters, for his steadfast love endures forever; 7 to him who made the great lights, for his steadfast love endures forever; 8 the sun to rule over the day, for his steadfast love endures forever; 9 the moon and stars to rule over the night, for his steadfast love endures forever;</p>
<p>10 to him who struck down the firstborn of Egypt, for his steadfast love endures forever; 11 and brought Israel out from among them, for his steadfast love endures forever; 12 with a strong hand and an outstretched arm, for his steadfast love endures forever; 13 to him who divided the Red Sea in two, for his steadfast love endures forever; 14 and made Israel pass through the midst of it, for his steadfast love endures forever; 15 but overthrew Pharaoh and his host in the Red Sea, for his steadfast love endures forever;</p>
<p>16 to him who led his people through the wilderness, for his steadfast love endures forever; 17 to him who struck down great kings, for his steadfast love endures forever; 18 and killed mighty kings, for his steadfast love endures forever; 19 Sihon, king of the Amorites, for his steadfast love endures forever; 20 and Og, king of Bashan, for his steadfast love endures forever; 21 and gave their land as a heritage, for his steadfast love endures forever; 22 a heritage to Israel his servant, for his steadfast love endures forever.</p>
<p>23 It is he who remembered us in our low estate, for his steadfast love endures forever; 24 and rescued us from our foes, for his steadfast love endures forever; 25 he who gives food to all flesh, for his steadfast love endures forever. 26 Give thanks to the God of heaven, for his steadfast love endures forever.</p>`,
    questions: `<h3>Look at verses 1-3</h3>
<ul>
<li>Why should we give thanks to the Lord?</li>
<li>What titles are given to God and what do they mean?</li>
</ul>
<h3>Look at verses 4-9</h3>
<ul>
<li>What does God\u2019s work of creation reveal about him?</li>
</ul>
<h3>Look at verses 10-22</h3>
<ul>
<li>What events from Israel\u2019s history does the psalmist recount?</li>
<li>What is the refrain and why is it repeated?</li>
</ul>
<h3>Look at verses 23-26</h3>
<ul>
<li>How does the psalm apply personally to us?</li>
<li>What is the significance of the ending?</li>
</ul>`,
    answers: `<h3>Verses 1-3</h3>
<p>The Lord is good, the God of gods and Lord of lords. His creation reveals his power and wisdom. These titles establish God\u2019s absolute sovereignty over all other powers and authorities.</p>
<h3>Verses 4-9</h3>
<p>God\u2019s creation \u2014 the heavens, earth, sun, moon, and stars \u2014 reveals his understanding, power, and care. Each act of creation is an expression of his steadfast love.</p>
<h3>Verses 10-22</h3>
<p>The psalmist recounts the Exodus: striking down Egypt\u2019s firstborn, bringing Israel out, dividing the Red Sea, leading through the wilderness, defeating kings, and giving the land as an inheritance. Each event demonstrates God\u2019s faithful love in action. The refrain \u201CHis steadfast love endures forever\u201D is repeated 26 times to emphasize that God\u2019s love is constant, unchanging, and eternal.</p>
<h3>Verses 23-26</h3>
<p>The psalm becomes personal: \u201CHe remembered us in our low estate.\u201D God notices us when we are at our lowest. He rescues and provides for all. The psalm ends as it began \u2014 with thanksgiving to the God of heaven whose love endures forever.</p>`,
    transcript: `<p><strong>His steadfast love endures forever.</strong></p>
<p>Psalm 136 is a psalm of thanksgiving. The psalmist invites God\u2019s people to give thanks to the Lord because he is good and his steadfast love endures forever.</p>
<p><strong>First, God the Creator (1-9).</strong></p>
<p>The psalm begins by calling us to give thanks. God is the God of gods and Lord of lords. He made the heavens, spread out the earth, and set the sun, moon, and stars in place. Every act of creation is motivated by his steadfast love.</p>
<p><strong>Second, God the Redeemer (10-22).</strong></p>
<p>The psalmist recounts the great story of the Exodus \u2014 striking Egypt, parting the Red Sea, leading through the wilderness, defeating kings, giving the Promised Land. Each event shows God\u2019s powerful, faithful love in action. The refrain echoes 26 times: his steadfast love endures forever.</p>
<p><strong>Third, God our Provider (23-26).</strong></p>
<p>The psalm concludes personally: God remembered us in our lowest moments, rescued us from our enemies, and gives food to all living things. He is not a distant God but a near and caring one. Give thanks to the God of heaven, for his steadfast love endures forever.</p>`,
    attachments: [
      { name: "Psalm 136 Study Guide.pdf", url: "/files/bible-studies/psalm-136-study-guide.pdf", type: "PDF" },
      { name: "Psalm 136 Message Transcript.docx", url: "/files/bible-studies/psalm-136-transcript.docx", type: "DOCX" },
    ],
  },
  {
    slug: "to-worship-him",
    title: "To Worship Him: Joy for a Broken World",
    book: "Matthew",
    passage: "Matthew 2:1-12",
    datePosted: "2025-12-05",
    dateFor: "2025-12-07",
    series: "Advent 2025",
    messenger: "Theo Woessner",
    keyVerseRef: "Matthew 2:11",
    keyVerseText: "On coming to the house, they saw the child with his mother Mary, and they bowed down and worshiped him. Then they opened their treasures and presented him with gifts of gold, frankincense and myrrh.",
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
    bibleText: `<h4>Matthew 2:1-12 (ESV)</h4>
<p>1 Now after Jesus was born in Bethlehem of Judea in the days of Herod the king, behold, wise men from the east came to Jerusalem, 2 saying, \u201CWhere is he who has been born king of the Jews? For we saw his star when it rose and have come to worship him.\u201D 3 When Herod the king heard this, he was troubled, and all Jerusalem with him; 4 and assembling all the chief priests and scribes of the people, he inquired of them where the Christ was to be born. 5 They told him, \u201CIn Bethlehem of Judea, for so it is written by the prophet:</p>
<p>6 \u201CAnd you, O Bethlehem, in the land of Judah, are by no means least among the rulers of Judah; for from you shall come a ruler who will shepherd my people Israel.\u201D</p>
<p>7 Then Herod summoned the wise men secretly and ascertained from them what time the star had appeared. 8 And he sent them to Bethlehem, saying, \u201CGo and search diligently for the child, and when you have found him, bring me word, that I too may come and worship him.\u201D 9 After listening to the king, they went on their way. And behold, the star that they had seen when it rose went before them until it came to rest over the place where the child was. 10 When they saw the star, they rejoiced exceedingly with great joy.</p>
<p>11 And going into the house, they saw the child with Mary his mother, and they fell down and worshiped him. Then, opening their treasures, they offered him gifts, gold and frankincense and myrrh. 12 And being warned in a dream not to return to Herod, they departed to their own country by another way.</p>`,
    questions: `<h3>Look at verses 1-6</h3>
<ul>
<li>Who came to Jerusalem and why?</li>
<li>How did King Herod respond to the news?</li>
<li>What does Herod\u2019s reaction reveal about him?</li>
</ul>
<h3>Look at verses 7-12</h3>
<ul>
<li>What did Herod tell the wise men? What were his true intentions?</li>
<li>What did the Magi do when they found Jesus?</li>
<li>What is the significance of the gifts they brought?</li>
</ul>`,
    answers: `<h3>Verses 1-6</h3>
<p>The Magi came from the East, following a star, to worship the newborn King of the Jews. Herod was disturbed because he saw Jesus as a threat to his power. All Jerusalem was troubled with him. Herod consulted the chief priests and scribes, who quoted Micah 5:2 \u2014 the Christ was to be born in Bethlehem. Herod\u2019s reaction reveals his insecurity and desire to eliminate any rival to his throne.</p>
<h3>Verses 7-12</h3>
<p>Herod secretly summoned the wise men and told them to report back so he could \u201Cworship\u201D too \u2014 but his real intent was to kill the child. The star led the wise men to Jesus, and when they found him, they fell down and worshiped. They offered gifts: gold (kingship), frankincense (deity), and myrrh (suffering and death). Warned in a dream, they returned home by another route. The gifts prophetically point to who Jesus is: King, God, and Savior who would suffer for us.</p>`,
    transcript: `<p><strong>To Worship Him: Joy for a Broken World.</strong></p>
<p>In Advent we prepare our hearts for Christmas. Today we look at the Magi who traveled far to worship Jesus, bringing joy to a broken world.</p>
<p><strong>First, the search for the King (1-6).</strong></p>
<p>Wise men from the East saw a star and came to Jerusalem seeking the newborn King of the Jews. Their journey was long and costly. Herod was troubled \u2014 he feared any rival to his throne. The religious leaders knew the Scriptures pointed to Bethlehem but did not go themselves. Sometimes those closest to the truth are farthest from responding to it.</p>
<p><strong>Second, worship and joy (7-12).</strong></p>
<p>The star led the Magi to Jesus. When they saw it, they \u201Crejoiced exceedingly with great joy.\u201D They fell down and worshiped. They opened their treasures: gold for a king, frankincense for God, myrrh for one who would suffer and die. True worship involves giving our best to Jesus. The Magi teach us that seeking Jesus with all our heart leads to overwhelming joy, even in a broken world.</p>`,
    attachments: [
      { name: "Advent Week 3 Study Guide.pdf", url: "/files/bible-studies/advent-week-3-study-guide.pdf", type: "PDF" },
      { name: "Advent Week 3 Message Transcript.docx", url: "/files/bible-studies/advent-week-3-transcript.docx", type: "DOCX" },
    ],
  },
  {
    slug: "prepare-the-way",
    title: "Prepare the Way for the Lord",
    book: "Mark",
    passage: "Mark 1:1-8",
    datePosted: "2025-11-28",
    dateFor: "2025-11-30",
    series: "Advent 2025",
    messenger: "David Kim",
    keyVerseRef: "Mark 1:3",
    keyVerseText: "A voice of one calling in the wilderness, \u2018Prepare the way for the Lord, make straight paths for him.\u2019",
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
    bibleText: `<h4>Mark 1:1-8 (ESV)</h4>
<p>1 The beginning of the gospel of Jesus Christ, the Son of God.</p>
<p>2 As it is written in Isaiah the prophet, \u201CBehold, I send my messenger before your face, who will prepare your way, 3 the voice of one crying in the wilderness: \u2018Prepare the way of the Lord, make his paths straight,\u2019\u201D</p>
<p>4 John appeared, baptizing in the wilderness and proclaiming a baptism of repentance for the forgiveness of sins. 5 And all the country of Judea and all Jerusalem were going out to him and were being baptized by him in the river Jordan, confessing their sins. 6 Now John was clothed with camel\u2019s hair and wore a leather belt around his waist and ate locusts and wild honey. 7 And he preached, saying, \u201CAfter me comes he who is mightier than I, the strap of whose sandals I am not worthy to stoop down and untie. 8 I have baptized you with water, but he will baptize you with the Holy Spirit.\u201D</p>`,
    questions: `<h3>Look at verses 1-3</h3>
<ul>
<li>How does Mark begin his gospel?</li>
<li>What Old Testament prophecy does he quote?</li>
</ul>
<h3>Look at verses 4-8</h3>
<ul>
<li>Who was John the Baptist and what was his message?</li>
<li>How did John describe the one coming after him?</li>
<li>What is the difference between John\u2019s baptism and Jesus\u2019 baptism?</li>
</ul>`,
    answers: `<h3>Verses 1-3</h3>
<p>Mark begins with a bold declaration: this is the beginning of the gospel of Jesus Christ, the Son of God. He immediately quotes Isaiah\u2019s prophecy about a messenger who would prepare the way for the Lord. This connects Jesus to the long-awaited fulfillment of God\u2019s promises. The messenger is John the Baptist.</p>
<h3>Verses 4-8</h3>
<p>John appeared in the wilderness, preaching repentance and baptizing for the forgiveness of sins. Crowds from all over Judea and Jerusalem came to him. His simple lifestyle (camel\u2019s hair, locusts, wild honey) showed his radical dedication to God\u2019s mission. John described the coming one as far mightier \u2014 so great that John was not worthy even to untie his sandals. John baptized with water (an outward sign), but Jesus would baptize with the Holy Spirit (an inward transformation).</p>`,
    transcript: `<p><strong>Prepare the way for the Lord.</strong></p>
<p>Mark\u2019s gospel begins with urgency. There is no genealogy, no birth narrative \u2014 Mark plunges straight into the action with John the Baptist preparing the way for Jesus.</p>
<p><strong>First, the beginning of the gospel (1-3).</strong></p>
<p>Mark declares this is \u201Cthe beginning of the gospel of Jesus Christ, the Son of God.\u201D He quotes Isaiah\u2019s prophecy about a voice crying in the wilderness to prepare the Lord\u2019s way. Advent is about preparation \u2014 making our hearts ready for the coming King.</p>
<p><strong>Second, John the Baptist\u2019s ministry (4-8).</strong></p>
<p>John came baptizing and preaching repentance. His lifestyle was radical: camel\u2019s hair clothing, locusts and honey. People came from everywhere, confessing their sins. John\u2019s humility is remarkable: the one coming after him is so much greater that John is not worthy to be his servant. John baptized with water, but Jesus would baptize with the Holy Spirit. This Advent, let us prepare the way for the Lord in our hearts through repentance and humility.</p>`,
    attachments: [
      { name: "Advent Week 2 Study Guide.pdf", url: "/files/bible-studies/advent-week-2-study-guide.pdf", type: "PDF" },
      { name: "Advent Week 2 Study Guide.docx", url: "/files/bible-studies/advent-week-2-study-guide.docx", type: "DOCX" },
    ],
  },
  {
    slug: "christ-is-all",
    title: "Christ is All, and is in All",
    book: "Colossians",
    passage: "Colossians 3:1-17",
    datePosted: "2025-11-21",
    dateFor: "2025-11-23",
    series: "Sunday Message",
    messenger: "Sarah Park",
    keyVerseRef: "Colossians 3:11",
    keyVerseText: "Here there is no Gentile or Jew, circumcised or uncircumcised, barbarian, Scythian, slave or free, but Christ is all, and is in all.",
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
    bibleText: `<h4>Colossians 3:1-17 (ESV)</h4>
<p>1 If then you have been raised with Christ, seek the things that are above, where Christ is, seated at the right hand of God. 2 Set your minds on things that are above, not on things that are on earth. 3 For you have died, and your life is hidden with Christ in God. 4 When Christ who is your life appears, then you also will appear with him in glory.</p>
<p>5 Put to death therefore what is earthly in you: sexual immorality, impurity, passion, evil desire, and covetousness, which is idolatry. 6 On account of these the wrath of God is coming. 7 In these you too once walked, when you were living in them. 8 But now you must put them all away: anger, wrath, malice, slander, and obscene talk from your mouth. 9 Do not lie to one another, seeing that you have put off the old self with its practices 10 and have put on the new self, which is being renewed in knowledge after the image of its creator. 11 Here there is not Greek and Jew, circumcised and uncircumcised, barbarian, Scythian, slave, free; but Christ is all, and in all.</p>
<p>12 Put on then, as God\u2019s chosen ones, holy and beloved, compassionate hearts, kindness, humility, meekness, and patience, 13 bearing with one another and, if one has a complaint against another, forgiving each other; as the Lord has forgiven you, so you also must forgive. 14 And above all these put on love, which binds everything together in perfect harmony. 15 And let the peace of Christ rule in your hearts, to which indeed you were called in one body. And be thankful. 16 Let the word of Christ dwell in you richly, teaching and admonishing one another in all wisdom, singing psalms and hymns and spiritual songs, with thankfulness in your hearts to God. 17 And whatever you do, in word or deed, do everything in the name of the Lord Jesus, giving thanks to God the Father through him.</p>`,
    questions: `<h3>Look at verses 1-4</h3>
<ul>
<li>What should we set our hearts and minds on?</li>
<li>What does it mean that our life is hidden with Christ in God?</li>
</ul>
<h3>Look at verses 5-11</h3>
<ul>
<li>What should we put to death and take off?</li>
<li>What is the new self?</li>
</ul>
<h3>Look at verses 12-17</h3>
<ul>
<li>What should we clothe ourselves with?</li>
<li>What is the \u201Cperfect bond of unity\u201D?</li>
</ul>`,
    answers: `<h3>Verses 1-4</h3>
<p>We should set our minds on things above because our life is now hidden with Christ. This means our true identity is in Christ, not in worldly status or achievements. When Christ appears in glory, we will appear with him. Living with an eternal perspective transforms how we handle daily life.</p>
<h3>Verses 5-11</h3>
<p>We put off the old self with its practices and put on the new self, being renewed in knowledge after the image of its creator. The old self includes sexual immorality, impurity, greed, anger, malice, slander, and lying. In the new self, all human distinctions are overcome \u2014 Christ is all and in all.</p>
<h3>Verses 12-17</h3>
<p>As God\u2019s chosen people, we clothe ourselves with compassion, kindness, humility, gentleness, and patience. We bear with each other and forgive as the Lord forgave us. Above all, we put on love, which is the perfect bond of unity. We let Christ\u2019s peace rule our hearts, his word dwell in us richly, and do everything in Jesus\u2019 name with thanksgiving.</p>`,
    transcript: `<p><strong>Christ is all, and is in all.</strong></p>
<p>Paul calls the Colossians to live out their new identity in Christ by setting their minds on things above and putting on the virtues of Christ.</p>
<p><strong>First, the new perspective (1-4).</strong></p>
<p>Since we have been raised with Christ, we are to seek things above. Our life is hidden with Christ in God. This gives us an entirely new perspective on life. We no longer define ourselves by earthly standards but by our union with Christ.</p>
<p><strong>Second, put off the old, put on the new (5-11).</strong></p>
<p>Paul lists the sins we must put to death: sexual immorality, impurity, greed, anger, malice, slander, lying. These belonged to our old self. The new self is being renewed in the image of its creator. In Christ, all human divisions are overcome \u2014 Christ is all and in all.</p>
<p><strong>Third, clothe yourselves in Christ\u2019s virtues (12-17).</strong></p>
<p>As God\u2019s chosen ones, we put on compassion, kindness, humility, gentleness, patience, forgiveness, and above all, love. Let Christ\u2019s peace rule in your hearts. Let his word dwell in you richly. Whatever you do, do it in Jesus\u2019 name. This is the picture of a life fully transformed by the gospel.</p>`,
    attachments: [
      { name: "Colossians 3 Study Guide.pdf", url: "/files/bible-studies/colossians-3-study-guide.pdf", type: "PDF" },
      { name: "Colossians 3 Study Guide.docx", url: "/files/bible-studies/colossians-3-study-guide.docx", type: "DOCX" },
      { name: "Colossians 3 Message Transcript.docx", url: "/files/bible-studies/colossians-3-transcript.docx", type: "DOCX" },
    ],
  },
  {
    slug: "set-your-minds-on-things-above",
    title: "Set Your Minds on Things Above",
    book: "Colossians",
    passage: "Colossians 3:1-4",
    datePosted: "2025-11-14",
    dateFor: "2025-11-16",
    series: "Sunday Message",
    messenger: "John Doe",
    keyVerseRef: "Colossians 3:2",
    keyVerseText: "Set your minds on things that are above, not on things that are on earth.",
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
    bibleText: `<h4>Colossians 3:1-4 (ESV)</h4>
<p>1 If then you have been raised with Christ, seek the things that are above, where Christ is, seated at the right hand of God. 2 Set your minds on things that are above, not on things that are on earth. 3 For you have died, and your life is hidden with Christ in God. 4 When Christ who is your life appears, then you also will appear with him in glory.</p>`,
    questions: `<h3>Look at verses 1-2</h3>
<ul>
<li>What is the condition: \u201CSince you have been raised with Christ\u201D?</li>
<li>What does it mean practically to set our hearts on things above?</li>
</ul>
<h3>Look at verses 3-4</h3>
<ul>
<li>What does it mean that we have died and our life is hidden with Christ?</li>
<li>What promise does verse 4 hold?</li>
</ul>`,
    answers: `<h3>Verses 1-2</h3>
<p>The condition \u201Csince you have been raised with Christ\u201D refers to our spiritual union with Christ through faith and baptism. Because we have been raised with him, we are to seek and set our minds on things above \u2014 where Christ is, seated at God\u2019s right hand. Practically, this means prioritizing eternal realities over temporary earthly concerns: pursuing God\u2019s kingdom, growing in faith, loving others, and keeping an eternal perspective in daily decisions.</p>
<h3>Verses 3-4</h3>
<p>\u201CYou have died\u201D means our old self died with Christ. Our true life is now hidden with Christ in God \u2014 secure, protected, and not yet fully revealed. The world may not see who we truly are, but when Christ appears in glory, our true identity will be revealed with him. Verse 4 holds the promise of future glory: we will share in Christ\u2019s glory when he returns. This hope sustains us through every difficulty.</p>`,
    transcript: `<p><strong>Set your minds on things above.</strong></p>
<p>These four verses are the foundation for everything that follows in Colossians 3. Paul gives us the reason and the method for Christian living.</p>
<p><strong>First, seek things above (1-2).</strong></p>
<p>\u201CIf you have been raised with Christ\u201D \u2014 this is the starting point. Our new life begins with what God has done. Because we are raised with Christ, we seek things above. This is not escapism but a radical reorientation of priorities. We set our minds on eternal realities: God\u2019s word, God\u2019s kingdom, God\u2019s purposes.</p>
<p><strong>Second, hidden with Christ (3-4).</strong></p>
<p>We have died with Christ, and our life is now hidden with him in God. This means our identity is secure in Christ, regardless of circumstances. The world may not understand us, but our life is kept safe in God. And the best is yet to come: when Christ appears, we will appear with him in glory. This future hope transforms how we live today.</p>`,
    attachments: [
      { name: "Colossians 3:1-4 Study Guide.pdf", url: "/files/bible-studies/colossians-3-1-4-study-guide.pdf", type: "PDF" },
    ],
  },
  {
    slug: "watered-the-flock",
    title: "Watered The Flock",
    book: "Exodus",
    passage: "Exodus 2:11-22",
    datePosted: "2024-01-22",
    dateFor: "2024-01-24",
    series: "Sunday Message",
    messenger: "P. Abraham Kim",
    keyVerseRef: "Exodus 2:17",
    keyVerseText: "The shepherds came and drove them away, but Moses stood up and saved them, and watered their flock.",
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
    bibleText: `<h4>Exodus 2:11-22 (ESV)</h4>
<p>11 One day, when Moses had grown up, he went out to his people and looked on their burdens, and he saw an Egyptian beating a Hebrew, one of his people. 12 He looked this way and that, and seeing no one, he struck down the Egyptian and hid him in the sand.</p>
<p>13 When he went out the next day, behold, two Hebrews were struggling together. And he said to the man in the wrong, \u201CWhy do you strike your companion?\u201D 14 He answered, \u201CWho made you a prince and a judge over us? Do you mean to kill me as you killed the Egyptian?\u201D Then Moses was afraid, and thought, \u201CSurely the thing is known.\u201D</p>
<p>15 When Pharaoh heard of it, he sought to kill Moses. But Moses fled from Pharaoh and stayed in the land of Midian. And he sat down by a well. 16 Now the priest of Midian had seven daughters, and they came and drew water and filled the troughs to water their father\u2019s flock. 17 The shepherds came and drove them away, but Moses stood up and saved them, and watered their flock.</p>
<p>18 When they came home to their father Reuel, he said, \u201CHow is it that you have come home so soon today?\u201D 19 They said, \u201CAn Egyptian delivered us out of the hand of the shepherds and even drew water for us and watered the flock.\u201D 20 He said to his daughters, \u201CThen where is he? Why have you left the man? Call him, that he may eat bread.\u201D 21 And Moses was content to dwell with the man, and he gave Moses his daughter Zipporah. 22 She gave birth to a son, and he called his name Gershom, for he said, \u201CI have been a sojourner in a foreign land.\u201D</p>`,
    questions: `<h3>Look at verses 11-12</h3>
<ul>
<li>When Moses grew up, where did he go? What did he see?</li>
<li>What did he do when he saw this? Why do you think he did this?</li>
</ul>
<h3>Look at verses 13-14</h3>
<ul>
<li>What did Moses encounter the next day?</li>
<li>How did the man in the wrong respond to Moses?</li>
</ul>
<h3>Look at verses 15-17</h3>
<ul>
<li>Who else heard about what Moses did and how did he respond?</li>
<li>What happened at the well?</li>
</ul>
<h3>Reflection</h3>
<ul>
<li>Contrast the well and watering the flocks vs. striking down the Egyptian. What do you think Moses learned?</li>
</ul>`,
    answers: `<h3>Verses 11-12</h3>
<p>Moses went out to his people and saw their burdens. He struck down an Egyptian who was beating a Hebrew. Moses had a heart for his people, but he acted in his own strength and with violence. He looked around to make sure no one was watching, showing he knew his action was wrong. His zeal was right, but his method was wrong.</p>
<h3>Verses 13-14</h3>
<p>The next day, a Hebrew man rejected Moses\u2019 authority, saying, \u201CWho made you a prince and judge over us?\u201D Moses realized his deed was known and he was afraid. His attempt to help his people had failed and backfired.</p>
<h3>Verses 15-17</h3>
<p>Pharaoh sought to kill Moses, so he fled to Midian. At a well, Moses helped Reuel\u2019s daughters and watered their flock when shepherds drove them away. This time Moses helped in a different way \u2014 not with violence but with humble service.</p>
<h3>Reflection</h3>
<p>Striking the Egyptian represents human strength and anger. Watering the flock represents humble service and shepherding. God was training Moses through the experience in Midian, teaching him that human strength cannot achieve God\u2019s righteousness. God shapes us through the ordinary tasks of daily life, preparing us for his greater purposes.</p>`,
    transcript: `<p><strong>Watered the flock.</strong></p>
<p>Moses tried to help his people with his own strength by striking down the Egyptian. But God trained him through the experience of shepherding at the well in Midian, teaching him that human strength cannot achieve God\u2019s righteousness.</p>
<p><strong>First, Moses\u2019 failed attempt (11-14).</strong></p>
<p>Moses had grown up in Pharaoh\u2019s palace, but he went out to see his people\u2019s burdens. When he saw an Egyptian beating a Hebrew, he killed the Egyptian and hid him. The next day, he tried to mediate between two Hebrews, but was rejected. His deed was known. Moses learned that human power and violence cannot bring justice or deliverance.</p>
<p><strong>Second, Moses at the well (15-17).</strong></p>
<p>Moses fled to Midian and sat by a well. When shepherds drove away the priest\u2019s daughters, Moses stood up, helped them, and watered their flock. This is a beautiful contrast to striking the Egyptian. At the well, Moses served humbly and helped the vulnerable. God was reshaping Moses from a man of action into a shepherd.</p>
<p><strong>Third, a new beginning (18-22).</strong></p>
<p>Moses settled with Reuel\u2019s family and married Zipporah. He named his son Gershom, meaning \u201Ca sojourner in a foreign land.\u201D In this season of apparent exile, God was preparing Moses for his great calling. Sometimes God\u2019s training ground looks like a detour, but it is preparation for his purpose.</p>`,
    attachments: [
      { name: "Exodus 2 Study Guide.pdf", url: "/files/bible-studies/exodus-2-study-guide.pdf", type: "PDF" },
      { name: "Exodus 2 Study Guide.docx", url: "/files/bible-studies/exodus-2-study-guide.docx", type: "DOCX" },
      { name: "Supplemental Map.png", url: "/files/bible-studies/exodus-2-map.png", type: "IMAGE" },
    ],
  },
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
  {
    slug: "the-lord-is-my-shepherd",
    title: "The Lord Is My Shepherd",
    date: "2026-02-02",
    passage: "Psalm 23:1-6",
    keyVerse: "The Lord is my shepherd; I shall not want. — Psalm 23:1",
    author: "P. Abraham Kim",
    body: "<p>Psalm 23 is perhaps the most beloved passage in all of Scripture. In six short verses, David paints a portrait of God's intimate care — leading, restoring, protecting, and accompanying his people through every season of life.</p><p>The image of a shepherd was deeply familiar to David from his youth. A good shepherd knows each sheep by name, seeks the lost, and defends the flock at personal cost. David saw his own life as lived under exactly this kind of care.</p><p>\"I shall not want\" is not a claim of perfect circumstances, but of perfect provision. Even walking through the valley of the shadow of death, the shepherd's rod and staff bring comfort. The goodness and mercy that follow us are not occasional visitors — they are constant companions.</p><p><strong>Prayer:</strong> Lord, you are my shepherd. Help me to trust your leading even when the path is uncertain. Thank you that I shall not want.</p><p><strong>One Word:</strong> The Lord is my shepherd</p>",
    bibleText: "<h4>Psalm 23:1-6 (ESV)</h4><p><sup>1</sup>The Lord is my shepherd; I shall not want.</p><p><sup>2</sup>He makes me lie down in green pastures. He leads me beside still waters.</p><p><sup>3</sup>He restores my soul. He leads me in paths of righteousness for his name's sake.</p><p><sup>4</sup>Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me.</p><p><sup>5</sup>You prepare a table before me in the presence of my enemies; you anoint my head with oil; my cup overflows.</p><p><sup>6</sup>Surely goodness and mercy shall follow me all the days of my life, and I shall dwell in the house of the Lord forever.</p>",
  },
  {
    slug: "blessed-are-the-poor-in-spirit",
    title: "Blessed Are the Poor in Spirit",
    date: "2026-02-03",
    passage: "Matthew 5:1-12",
    keyVerse: "Blessed are the poor in spirit, for theirs is the kingdom of heaven. — Matthew 5:3",
    author: "P. John Lee",
    body: "<p>Jesus opens the Sermon on the Mount with a series of beatitudes — blessings pronounced over those the world considers least blessed. The first and foundational beatitude is poverty of spirit: the recognition of our own spiritual bankruptcy before God.</p><p>To be poor in spirit is not to be weak or lacking in character. It is to see ourselves clearly — as creatures in need of a Creator, as sinners in need of a Savior. This is the starting point of all genuine discipleship.</p><p>The remarkable promise attached to this poverty is staggering: \"theirs is the kingdom of heaven.\" Not \"theirs will be\" but \"theirs is\" — present tense. The kingdom belongs to those who come empty-handed.</p><p><strong>Prayer:</strong> Father, strip away my self-sufficiency. Make me poor in spirit that I may receive your kingdom.</p><p><strong>One Word:</strong> Blessed are the poor in spirit</p>",
    bibleText: "<h4>Matthew 5:1-12 (ESV)</h4><p><sup>1</sup>Seeing the crowds, he went up on the mountain, and when he sat down, his disciples came to him.</p><p><sup>2</sup>And he opened his mouth and taught them, saying:</p><p><sup>3</sup>\"Blessed are the poor in spirit, for theirs is the kingdom of heaven.</p><p><sup>4</sup>Blessed are those who mourn, for they shall be comforted.</p><p><sup>5</sup>Blessed are the meek, for they shall inherit the earth.</p><p><sup>6</sup>Blessed are those who hunger and thirst for righteousness, for they shall be satisfied.</p><p><sup>7</sup>Blessed are the merciful, for they shall receive mercy.</p><p><sup>8</sup>Blessed are the pure in heart, for they shall see God.</p><p><sup>9</sup>Blessed are the peacemakers, for they shall be called sons of God.</p><p><sup>10</sup>Blessed are those who are persecuted for righteousness' sake, for theirs is the kingdom of heaven.</p><p><sup>11</sup>Blessed are you when others revile you and persecute you and utter all kinds of evil against you falsely on my account.</p><p><sup>12</sup>Rejoice and be glad, for your reward is great in heaven, for so they persecuted the prophets who were before you.\"</p>",
  },
  {
    slug: "you-are-the-light-of-the-world",
    title: "You Are the Light of the World",
    date: "2026-02-04",
    passage: "Matthew 5:13-16",
    keyVerse: "You are the light of the world. A city set on a hill cannot be hidden. — Matthew 5:14",
    author: "P. David Yoon",
    body: "<p>Immediately after pronouncing the beatitudes, Jesus speaks identity over his disciples: \"You are the salt of the earth. You are the light of the world.\" These are declarative statements, not commands. Before Jesus tells us what to do, he tells us what we are.</p><p>Salt in the ancient world was a preservative and a flavor agent. Light is not for its own benefit but for those around it. Jesus calls his people to a life that blesses and illuminates the communities in which they live.</p><p>Importantly, Jesus says let your light shine — not make your light shine. A lamp doesn't strain to give light; it simply burns. Our calling is to remain connected to the source and to stop hiding what God has already lit within us.</p><p><strong>Prayer:</strong> Lord, let my life be a genuine light in my neighborhood, workplace, and campus. Let others see your goodness through me.</p><p><strong>One Word:</strong> Let your light shine before others</p>",
    bibleText: "<h4>Matthew 5:13-16 (ESV)</h4><p><sup>13</sup>\"You are the salt of the earth, but if salt has lost its taste, how shall its saltiness be restored? It is no longer good for anything except to be thrown out and trampled under people's feet.</p><p><sup>14</sup>You are the light of the world. A city set on a hill cannot be hidden.</p><p><sup>15</sup>Nor do people light a lamp and put it under a basket, but on a stand, and it gives light to all in the house.</p><p><sup>16</sup>In the same way, let your light shine before others, so that they may see your good works and give glory to your Father who is in heaven.\"</p>",
  },
  {
    slug: "come-to-me-all-who-are-weary",
    title: "Come to Me, All Who Are Weary",
    date: "2026-02-05",
    passage: "Matthew 11:28-30",
    keyVerse: "Come to me, all who labor and are heavy laden, and I will give you rest. — Matthew 11:28",
    author: "P. Abraham Kim",
    body: "<p>In the middle of a chapter filled with debate and accusation, Jesus pauses and utters one of the most tender invitations in Scripture. \"Come to me.\" Not to a program, not to a set of rules — to a person. To Jesus himself.</p><p>The promise of rest is not the absence of difficulty, but the gift of a different kind of burden. Jesus's yoke is easy and his burden is light — not because the Christian life requires nothing, but because it is lived in partnership with the One who carries the weight with us.</p><p>The Greek word for \"rest\" here carries the sense of refreshment, of being restored. Jesus invites the burned-out, the overworked, the spiritually exhausted to come. The only qualification is weariness. Anyone who is heavy laden qualifies.</p><p><strong>Prayer:</strong> Jesus, I come to you today — tired, in need of rest. Teach me your gentleness and give me the rest only you can provide.</p><p><strong>One Word:</strong> Come to me and I will give you rest</p>",
    bibleText: "<h4>Matthew 11:28-30 (ESV)</h4><p><sup>28</sup>Come to me, all who labor and are heavy laden, and I will give you rest.</p><p><sup>29</sup>Take my yoke upon you, and learn from me, for I am gentle and lowly in heart, and you will find rest for your souls.</p><p><sup>30</sup>For my yoke is easy, and my burden is light.\"</p>",
  },
  {
    slug: "for-god-so-loved-the-world",
    title: "For God So Loved the World",
    date: "2026-02-06",
    passage: "John 3:14-21",
    keyVerse: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life. — John 3:16",
    author: "P. John Lee",
    body: "<p>John 3:16 is sometimes so familiar it has lost its force. But read again in context — spoken to Nicodemus, a Pharisee who came to Jesus by night — the verse is explosive. The God of the universe loves not just Israel, not just the righteous, but the world.</p><p>The measure of this love is staggering: God gave his only Son. Not advice. Not a system. Not a prophet. His Son. The costliness of the gift reveals the depth of the love.</p><p>The condition is simply belief — not moral perfection, not religious pedigree, but trust in the one who was lifted up, as Moses lifted up the serpent in the wilderness. This is the gospel in miniature: look to Jesus and live.</p><p><strong>Prayer:</strong> Father, thank you for your love that gave everything. Help me to truly believe and to help others see your light.</p><p><strong>One Word:</strong> God so loved the world</p>",
    bibleText: "<h4>John 3:14-21 (ESV)</h4><p><sup>14</sup>And as Moses lifted up the serpent in the wilderness, so must the Son of Man be lifted up,</p><p><sup>15</sup>that whoever believes in him may have eternal life.</p><p><sup>16</sup>For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.</p><p><sup>17</sup>For God did not send his Son into the world to condemn the world, but in order that the world might be saved through him.</p><p><sup>18</sup>Whoever believes in him is not condemned, but whoever does not believe is condemned already, because he has not believed in the name of the only Son of God.</p><p><sup>19</sup>And this is the judgment: the light has come into the world, and people loved the darkness rather than the light because their works were evil.</p><p><sup>20</sup>For everyone who does wicked things hates the light and does not come to the light, lest his works should be exposed.</p><p><sup>21</sup>But whoever does what is true comes to the light, so that it may be clearly seen that his works have been carried out in God.</p>",
  },
  {
    slug: "i-am-the-vine",
    title: "I Am the Vine",
    date: "2026-02-07",
    passage: "John 15:1-11",
    keyVerse: "I am the vine; you are the branches. Whoever abides in me and I in him, he it is that bears much fruit, for apart from me you can do nothing. — John 15:5",
    author: "P. David Yoon",
    body: "<p>In the upper room, just hours before his arrest, Jesus speaks of vines and branches, of pruning and abiding. It is an image of intimate, organic union — not the relationship of a builder to a project, but of a vine to the branch that grows from it.</p><p>The key word in this passage is \"abide\" — repeated ten times in eleven verses. To abide is to remain, to stay, to make one's home. Christian fruitfulness is not the result of greater effort or better strategy; it is the natural overflow of remaining connected to the source.</p><p>The warning is stark: apart from Jesus, we can do nothing. Not a little — nothing. But the promise is equally stark: those who abide bear much fruit. Pruning is painful, but its purpose is greater fruitfulness, not punishment.</p><p><strong>Prayer:</strong> Lord Jesus, help me to abide in you today — in your word, in prayer, in community. Let my life bear fruit that lasts.</p><p><strong>One Word:</strong> Abide in me</p>",
    bibleText: "<h4>John 15:1-11 (ESV)</h4><p><sup>1</sup>\"I am the true vine, and my Father is the vinedresser.</p><p><sup>2</sup>Every branch in me that does not bear fruit he takes away, and every branch that does bear fruit he prunes, that it may bear more fruit.</p><p><sup>3</sup>Already you are clean because of the word that I have spoken to you.</p><p><sup>4</sup>Abide in me, and I in you. As the branch cannot bear fruit by itself, unless it abides in the vine, neither can you, unless you abide in me.</p><p><sup>5</sup>I am the vine; you are the branches. Whoever abides in me and I in him, he it is that bears much fruit, for apart from me you can do nothing.</p><p><sup>6</sup>If anyone does not abide in me he is thrown away like a branch and withers; and the branches are gathered, thrown into the fire, and burned.</p><p><sup>7</sup>If you abide in me, and my words abide in you, ask whatever you wish, and it will be done for you.</p><p><sup>8</sup>By this my Father is glorified, that you bear much fruit and so prove to be my disciples.</p><p><sup>9</sup>As the Father has loved me, so have I loved you. Abide in my love.</p><p><sup>10</sup>If you keep my commandments, you will abide in my love, just as I have kept my Father's commandments and abide in his love.</p><p><sup>11</sup>These things I have spoken to you, that my joy may be in you, and that your joy may be full.\"</p>",
  },
  {
    slug: "love-is-patient-love-is-kind",
    title: "Love Is Patient, Love Is Kind",
    date: "2026-02-08",
    passage: "1 Corinthians 13:1-13",
    keyVerse: "Love is patient and kind; love does not envy or boast; it is not arrogant or rude. — 1 Corinthians 13:4",
    author: "P. Abraham Kim",
    body: "<p>Writing to a church torn by factions, pride, and spiritual competition, Paul inserts his great hymn to love at the center of his argument. Without love, the most spectacular gifts — tongues of angels, prophetic powers, faith to move mountains — count for nothing.</p><p>Paul describes love not as a feeling but as a pattern of behavior: patient, kind, not envious, not boastful, not irritable. These are not ideals for perfect people; they are descriptions of what love does in difficult community — among competitive, proud, difficult people like the Corinthians, and like us.</p><p>The chapter ends with a triad: faith, hope, love — but the greatest is love. Love is greatest because it is the nature of God himself (1 John 4:8), and it is the one thing that abides even into eternity when faith becomes sight and hope becomes possession.</p><p><strong>Prayer:</strong> Father, grow in me the patience and kindness that are the marks of your love. Make me an agent of genuine love in my community.</p><p><strong>One Word:</strong> Love never fails</p>",
    bibleText: "<h4>1 Corinthians 13:1-13 (ESV)</h4><p><sup>1</sup>If I speak in the tongues of men and of angels, but have not love, I am a noisy gong or a clanging cymbal.</p><p><sup>2</sup>And if I have prophetic powers, and understand all mysteries and all knowledge, and if I have all faith, so as to remove mountains, but have not love, I am nothing.</p><p><sup>3</sup>If I give away all I have, and if I deliver up my body to be burned, but have not love, I gain nothing.</p><p><sup>4</sup>Love is patient and kind; love does not envy or boast; it is not arrogant</p><p><sup>5</sup>or rude. It does not insist on its own way; it is not irritable or resentful;</p><p><sup>6</sup>it does not rejoice at wrongdoing, but rejoices with the truth.</p><p><sup>7</sup>Love bears all things, believes all things, hopes all things, endures all things.</p><p><sup>8</sup>Love never ends. As for prophecies, they will pass away; as for tongues, they will cease; as for knowledge, it will pass away.</p><p><sup>9</sup>For we know in part and we prophesy in part,</p><p><sup>10</sup>but when the perfect comes, the partial will pass away.</p><p><sup>11</sup>When I was a child, I spoke like a child, I thought like a child, I reasoned like a child. When I became a man, I gave up childlike ways.</p><p><sup>12</sup>For now we see in a mirror dimly, but then face to face. Now I know in part; then I shall know fully, even as I have been fully known.</p><p><sup>13</sup>So now faith, hope, and love abide, these three; but the greatest of these is love.</p>",
  },
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
        questions: bs.questions || null,
        answers: bs.answers || null,
        transcript: bs.transcript || null,
        bibleText: bs.bibleText || null,
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

  // ── 6b. Create Bible Study Attachments ─────────────────────
  console.log('Creating bible study attachments...')
  let attachmentCount = 0
  for (const bs of BIBLE_STUDIES) {
    const studyId = bibleStudyMap.get(bs.slug)
    if (!studyId || !bs.attachments) continue
    for (let i = 0; i < bs.attachments.length; i++) {
      const att = bs.attachments[i]
      await prisma.bibleStudyAttachment.create({
        data: {
          bibleStudyId: studyId,
          name: att.name,
          url: att.url,
          type: att.type as any,
          fileSize: att.type === 'PDF' ? 245000 : att.type === 'DOCX' ? 185000 : att.type === 'IMAGE' ? 520000 : 150000,
          sortOrder: i,
        },
      })
      attachmentCount++
    }
  }
  console.log(`  Created ${attachmentCount} bible study attachments`)

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
        bibleText: (db as { bibleText?: string }).bibleText ?? null,
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

  // ── CAMPUS DETAIL PAGES ──────────────────────────────────
  // Shared content for campus detail pages
  const sharedCampusFaq = (campusName: string) => ({
    heading: 'Frequently Asked Questions',
    showIcon: true,
    items: [
      { question: 'Where and when do campus groups meet?', answer: "Campus Bible study groups meet at various times throughout the week depending on the campus. Most groups meet once or twice a week. Fill out the contact form above and we\u2019ll connect you with the group nearest to you." },
      { question: 'Do I need to bring anything?', answer: "Just bring yourself! We provide study materials and Bibles. Feel free to bring your own Bible if you have one." },
      { question: `Is this only for ${campusName} students?`, answer: `While our group is based at ${campusName}, anyone is welcome to join. You don\u2019t have to be a current student to attend.` },
      { question: 'What denomination is UBF?', answer: "UBF is a non-denominational evangelical Christian organization. We focus on Bible study and discipleship across all Christian traditions." },
      { question: 'How can I get involved beyond Bible study?', answer: "There are many ways to get involved! Join us for fellowship meals, outreach events, conferences, and worship services. Talk to a group leader to learn more." },
    ],
  })

  const sharedCampusOtherGrid = {
    decorativeImages: [
      { src: '/images/compressed/ministries/join-campus-ministry-section/compressed-1.jpg', alt: 'Campus group photo' },
      { src: '/images/compressed/ministries/join-campus-ministry-section/compressed-2.jpg', alt: 'Bible study outdoors' },
      { src: '/images/compressed/ministries/join-campus-ministry-section/compressed-3.png', alt: 'Fellowship event' },
    ],
    heading: 'Check out other campuses',
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
  }

  // --- LBCC ---
  await createPageWithSections(
    {
      slug: 'ministries/campus/lbcc',
      title: 'LBCC Campus Ministry',
      pageType: 'CAMPUS',
      parentId: ministriesPage.id,
      metaDescription: 'LA UBF campus ministry at Long Beach City College \u2014 Bible study and fellowship for LBCC students.',
      sortOrder: 20,
    },
    [
      {
        sectionType: 'MINISTRY_HERO',
        label: 'LBCC Hero',
        colorScheme: 'LIGHT',
        content: {
          overline: 'CAMPUS MINISTRY',
          heading: 'LBCC\nTrue Vine Club',
          headingStyle: 'sans',
          ctaButton: { label: 'Start Bible Study', href: 'https://startbiblestudy.org/lbcc', visible: true },
          socialLinks: [
            { platform: 'Email', href: 'mailto:fishformen123@gmail.com' },
            { platform: 'Instagram', href: 'https://instagram.com/lbcc.ubf' },
            { platform: 'Facebook', href: 'https://www.facebook.com/lbcctruevine/' },
            { platform: 'Website', href: 'https://lbcctruevine.org/' },
          ],
          heroImage: { src: '/images/compressed/ministries/lbcc/compressed-lbcc-truevineclub.jpg', alt: 'LBCC True Vine Club campus ministry' },
        },
      },
      {
        sectionType: 'MINISTRY_INTRO',
        label: 'LBCC Intro',
        colorScheme: 'LIGHT',
        content: {
          overline: 'INTRODUCTION',
          heading: 'About the Ministry',
          description: '\u201CI am the true vine, and my Father is the gardener.\u201D (John 15:1)\n\nLBCC True Vine is our campus ministry club at LBCC. We try to help each student to study the Bible, that through Bible study he or she may come to know God personally, and also come to know himself or herself, and find the clear purpose and meaning of life in our Lord Jesus Christ. We have group Bible studies at LBCC LAC Campus.',
        },
      },
      {
        sectionType: 'MINISTRY_SCHEDULE',
        label: 'LBCC Schedule',
        colorScheme: 'DARK',
        content: {
          heading: 'Join Us',
          description: 'Whether you\u2019re a believer or just curious, you\u2019re welcome here.',
          scheduleLabel: 'WHEN & WHERE',
          scheduleEntries: [
            { day: 'Tuesdays', time: '12:00 PM - 1:00 PM', location: 'College Center' },
            { day: 'Thursdays', time: '5:00 PM - 6:00 PM', location: 'College Center' },
          ],
          buttons: [
            { label: 'Start Bible Study', href: 'https://startbiblestudy.org/lbcc', variant: 'primary' },
            { label: 'Visit our website', href: 'https://lbcctruevine.org/', variant: 'secondary' },
          ],
        },
      },
      {
        sectionType: 'MEET_TEAM',
        label: 'LBCC Team',
        colorScheme: 'LIGHT',
        content: {
          overline: 'LBCC TRUE VINE CLUB',
          heading: 'Meet Our Team',
          members: [
            { name: 'William Larsen', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05222.jpg', alt: 'William Larsen' } },
            { name: 'Troy Segale', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05299.jpg', alt: 'Troy Segale' } },
            { name: 'Joey Fishman', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC01195.jpg', alt: 'Joey Fishman' } },
          ],
        },
      },
      {
        sectionType: 'FAQ_SECTION',
        label: 'LBCC FAQ',
        colorScheme: 'LIGHT',
        containerWidth: 'NARROW',
        content: sharedCampusFaq('LBCC'),
      },
      {
        sectionType: 'CAMPUS_CARD_GRID',
        label: 'Other Campuses',
        colorScheme: 'LIGHT',
        content: sharedCampusOtherGrid,
      },
    ],
  )
  console.log('  Created LBCC campus page')

  // --- CSULB ---
  await createPageWithSections(
    {
      slug: 'ministries/campus/csulb',
      title: 'CSULB Campus Ministry',
      pageType: 'CAMPUS',
      parentId: ministriesPage.id,
      metaDescription: 'LA UBF campus ministry at Cal State Long Beach \u2014 Bible study and fellowship for CSULB students.',
      sortOrder: 21,
    },
    [
      {
        sectionType: 'MINISTRY_HERO',
        label: 'CSULB Hero',
        colorScheme: 'LIGHT',
        content: {
          overline: 'CAMPUS MINISTRY',
          heading: 'CSULB\nTrue Vine Club',
          headingStyle: 'sans',
          ctaButton: { label: 'Start Bible Study', href: 'https://startbiblestudy.org/csulb', visible: true },
          socialLinks: [
            { platform: 'Instagram', href: 'https://www.instagram.com/truevine_csulb/' },
          ],
          heroImage: { src: '/images/compressed/ministries/csulb/compressed-hero.jpg', alt: 'CSULB True Vine Club campus ministry' },
        },
      },
      {
        sectionType: 'MINISTRY_INTRO',
        label: 'CSULB Intro',
        colorScheme: 'LIGHT',
        content: {
          overline: 'INTRODUCTION',
          heading: 'About the Ministry',
          description: 'Coming soon.',
        },
      },
      {
        sectionType: 'MINISTRY_SCHEDULE',
        label: 'CSULB Schedule',
        colorScheme: 'DARK',
        content: {
          heading: 'Join Us',
          description: 'Whether you\u2019re a believer or just curious, you\u2019re welcome here.',
          scheduleLabel: 'WHEN & WHERE',
          scheduleEntries: [
            { day: 'Wednesdays', time: '7:00 PM - 8:00 PM', location: 'Student Union 2nd fl' },
          ],
          buttons: [
            { label: 'Start Bible Study', href: 'https://startbiblestudy.org/csulb', variant: 'primary' },
            { label: 'Visit our website', href: 'https://csulbnavigators.org/', variant: 'secondary' },
          ],
        },
      },
      {
        sectionType: 'MEET_TEAM',
        label: 'CSULB Team',
        colorScheme: 'LIGHT',
        content: {
          overline: 'CSULB TRUE VINE CLUB',
          heading: 'Meet Our Team',
          members: [
            { name: 'Robert Fishman', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05222.jpg', alt: 'Robert Fishman' } },
            { name: 'Jorge Lau', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05299.jpg', alt: 'Jorge Lau' } },
          ],
        },
      },
      {
        sectionType: 'FAQ_SECTION',
        label: 'CSULB FAQ',
        colorScheme: 'LIGHT',
        containerWidth: 'NARROW',
        content: sharedCampusFaq('CSULB'),
      },
      {
        sectionType: 'CAMPUS_CARD_GRID',
        label: 'Other Campuses',
        colorScheme: 'LIGHT',
        content: sharedCampusOtherGrid,
      },
    ],
  )
  console.log('  Created CSULB campus page')

  // --- CSUF ---
  await createPageWithSections(
    {
      slug: 'ministries/campus/csuf',
      title: 'CSUF Campus Ministry',
      pageType: 'CAMPUS',
      parentId: ministriesPage.id,
      metaDescription: 'LA UBF campus ministry at Cal State Fullerton \u2014 Bible study and fellowship for CSUF students.',
      sortOrder: 22,
    },
    [
      {
        sectionType: 'MINISTRY_HERO',
        label: 'CSUF Hero',
        colorScheme: 'LIGHT',
        content: {
          overline: 'CAMPUS MINISTRY',
          heading: 'CSUF',
          headingStyle: 'sans',
          ctaButton: { label: 'Start Bible Study', href: 'https://startbiblestudy.org/csuf', visible: true },
          socialLinks: [
            { platform: 'Instagram', href: 'https://instagram.com/fullertonbiblefellowship' },
          ],
          heroImage: { src: '', alt: 'CSUF campus ministry' },
        },
      },
      {
        sectionType: 'MINISTRY_INTRO',
        label: 'CSUF Intro',
        colorScheme: 'LIGHT',
        content: {
          overline: 'INTRODUCTION',
          heading: 'About the Ministry',
          description: 'Coming soon.',
        },
      },
      {
        sectionType: 'MINISTRY_SCHEDULE',
        label: 'CSUF Schedule',
        colorScheme: 'DARK',
        content: {
          heading: 'Join Us',
          description: 'Whether you\u2019re a believer or just curious, you\u2019re welcome here.',
          scheduleLabel: 'WHEN & WHERE',
          scheduleEntries: [
            { day: 'Thursdays', time: '11:30 AM', location: 'A table in front of Health Center' },
          ],
          buttons: [
            { label: 'Start Bible Study', href: 'https://startbiblestudy.org/csuf', variant: 'primary' },
          ],
        },
      },
      {
        sectionType: 'MEET_TEAM',
        label: 'CSUF Team',
        colorScheme: 'LIGHT',
        content: {
          overline: 'CSUF',
          heading: 'Meet Our Team',
          members: [
            { name: 'Daniel Shim', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05222.jpg', alt: 'Daniel Shim' } },
            { name: 'Joseph Cho', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05299.jpg', alt: 'Joseph Cho' } },
          ],
        },
      },
      {
        sectionType: 'FAQ_SECTION',
        label: 'CSUF FAQ',
        colorScheme: 'LIGHT',
        containerWidth: 'NARROW',
        content: sharedCampusFaq('CSUF'),
      },
      {
        sectionType: 'CAMPUS_CARD_GRID',
        label: 'Other Campuses',
        colorScheme: 'LIGHT',
        content: sharedCampusOtherGrid,
      },
    ],
  )
  console.log('  Created CSUF campus page')

  // --- UCLA ---
  await createPageWithSections(
    {
      slug: 'ministries/campus/ucla',
      title: 'UCLA Campus Ministry',
      pageType: 'CAMPUS',
      parentId: ministriesPage.id,
      metaDescription: 'LA UBF campus ministry at UCLA \u2014 Bible study and fellowship for UCLA students.',
      sortOrder: 23,
    },
    [
      {
        sectionType: 'MINISTRY_HERO',
        label: 'UCLA Hero',
        colorScheme: 'LIGHT',
        content: {
          overline: 'CAMPUS MINISTRY',
          heading: 'UCLA',
          headingStyle: 'sans',
          ctaButton: { label: 'Start Bible Study', href: 'https://startbiblestudy.org/ucla', visible: true },
          socialLinks: [],
          heroImage: { src: '', alt: 'UCLA campus ministry' },
        },
      },
      {
        sectionType: 'MINISTRY_INTRO',
        label: 'UCLA Intro',
        colorScheme: 'LIGHT',
        content: {
          overline: 'INTRODUCTION',
          heading: 'About the Ministry',
          description: 'Coming soon.',
        },
      },
      {
        sectionType: 'MINISTRY_SCHEDULE',
        label: 'UCLA Schedule',
        colorScheme: 'DARK',
        content: {
          heading: 'Join Us',
          description: 'Whether you\u2019re a believer or just curious, you\u2019re welcome here.',
          scheduleLabel: 'WHEN & WHERE',
          scheduleEntries: [],
          buttons: [
            { label: 'Start Bible Study', href: 'https://startbiblestudy.org/ucla', variant: 'primary' },
          ],
        },
      },
      {
        sectionType: 'MEET_TEAM',
        label: 'UCLA Team',
        colorScheme: 'LIGHT',
        content: {
          overline: 'UCLA',
          heading: 'Meet Our Team',
          members: [
            { name: 'Peace Oh', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05222.jpg', alt: 'Peace Oh' } },
          ],
        },
      },
      {
        sectionType: 'FAQ_SECTION',
        label: 'UCLA FAQ',
        colorScheme: 'LIGHT',
        containerWidth: 'NARROW',
        content: sharedCampusFaq('UCLA'),
      },
      {
        sectionType: 'CAMPUS_CARD_GRID',
        label: 'Other Campuses',
        colorScheme: 'LIGHT',
        content: sharedCampusOtherGrid,
      },
    ],
  )
  console.log('  Created UCLA campus page')

  // --- USC ---
  await createPageWithSections(
    {
      slug: 'ministries/campus/usc',
      title: 'USC Campus Ministry',
      pageType: 'CAMPUS',
      parentId: ministriesPage.id,
      metaDescription: 'LA UBF campus ministry at USC \u2014 Bible study and fellowship for USC students.',
      sortOrder: 24,
    },
    [
      {
        sectionType: 'MINISTRY_HERO',
        label: 'USC Hero',
        colorScheme: 'LIGHT',
        content: {
          overline: 'CAMPUS MINISTRY',
          heading: 'USC',
          headingStyle: 'sans',
          ctaButton: { label: 'Start Bible Study', href: 'https://startbiblestudy.org/usc', visible: true },
          socialLinks: [],
          heroImage: { src: '', alt: 'USC campus ministry' },
        },
      },
      {
        sectionType: 'MINISTRY_INTRO',
        label: 'USC Intro',
        colorScheme: 'LIGHT',
        content: {
          overline: 'INTRODUCTION',
          heading: 'About the Ministry',
          description: 'Coming soon.',
        },
      },
      {
        sectionType: 'MINISTRY_SCHEDULE',
        label: 'USC Schedule',
        colorScheme: 'DARK',
        content: {
          heading: 'Join Us',
          description: 'Whether you\u2019re a believer or just curious, you\u2019re welcome here.',
          scheduleLabel: 'WHEN & WHERE',
          scheduleEntries: [
            { day: 'Mondays', time: '1:00 PM - 2:00 PM', location: 'Leavey Library' },
          ],
          buttons: [
            { label: 'Start Bible Study', href: 'https://startbiblestudy.org/usc', variant: 'primary' },
          ],
        },
      },
      {
        sectionType: 'MEET_TEAM',
        label: 'USC Team',
        colorScheme: 'LIGHT',
        content: {
          overline: 'USC',
          heading: 'Meet Our Team',
          members: [
            { name: 'David Park', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05222.jpg', alt: 'David Park' } },
          ],
        },
      },
      {
        sectionType: 'FAQ_SECTION',
        label: 'USC FAQ',
        colorScheme: 'LIGHT',
        containerWidth: 'NARROW',
        content: sharedCampusFaq('USC'),
      },
      {
        sectionType: 'CAMPUS_CARD_GRID',
        label: 'Other Campuses',
        colorScheme: 'LIGHT',
        content: sharedCampusOtherGrid,
      },
    ],
  )
  console.log('  Created USC campus page')

  // --- CSUDH ---
  await createPageWithSections(
    {
      slug: 'ministries/campus/csudh',
      title: 'CSUDH Campus Ministry',
      pageType: 'CAMPUS',
      parentId: ministriesPage.id,
      metaDescription: 'LA UBF campus ministry at Cal State Dominguez Hills \u2014 Bible study and fellowship for CSUDH students.',
      sortOrder: 25,
    },
    [
      {
        sectionType: 'MINISTRY_HERO',
        label: 'CSUDH Hero',
        colorScheme: 'LIGHT',
        content: {
          overline: 'CAMPUS MINISTRY',
          heading: 'CSUDH',
          headingStyle: 'sans',
          ctaButton: { label: 'Start Bible Study', href: 'https://startbiblestudy.org/csudh', visible: true },
          socialLinks: [],
          heroImage: { src: '', alt: 'CSUDH campus ministry' },
        },
      },
      {
        sectionType: 'MINISTRY_INTRO',
        label: 'CSUDH Intro',
        colorScheme: 'LIGHT',
        content: {
          overline: 'INTRODUCTION',
          heading: 'About the Ministry',
          description: 'Coming soon.',
        },
      },
      {
        sectionType: 'MINISTRY_SCHEDULE',
        label: 'CSUDH Schedule',
        colorScheme: 'DARK',
        content: {
          heading: 'Join Us',
          description: 'Whether you\u2019re a believer or just curious, you\u2019re welcome here.',
          scheduleLabel: 'WHEN & WHERE',
          scheduleEntries: [],
          buttons: [
            { label: 'Start Bible Study', href: 'https://startbiblestudy.org/csudh', variant: 'primary' },
          ],
        },
      },
      {
        sectionType: 'MEET_TEAM',
        label: 'CSUDH Team',
        colorScheme: 'LIGHT',
        content: {
          overline: 'CSUDH',
          heading: 'Meet Our Team',
          members: [
            { name: 'Augustine Kim', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05222.jpg', alt: 'Augustine Kim' } },
            { name: 'Paul Lim', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05299.jpg', alt: 'Paul Lim' } },
            { name: 'Moses Han', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC01195.jpg', alt: 'Moses Han' } },
          ],
        },
      },
      {
        sectionType: 'FAQ_SECTION',
        label: 'CSUDH FAQ',
        colorScheme: 'LIGHT',
        containerWidth: 'NARROW',
        content: sharedCampusFaq('CSUDH'),
      },
      {
        sectionType: 'CAMPUS_CARD_GRID',
        label: 'Other Campuses',
        colorScheme: 'LIGHT',
        content: sharedCampusOtherGrid,
      },
    ],
  )
  console.log('  Created CSUDH campus page')

  // --- CCC (Cerritos Community College) ---
  await createPageWithSections(
    {
      slug: 'ministries/campus/ccc',
      title: 'CCC Campus Ministry',
      pageType: 'CAMPUS',
      parentId: ministriesPage.id,
      metaDescription: 'LA UBF campus ministry at Cerritos Community College \u2014 Bible study and fellowship for CCC students.',
      sortOrder: 26,
    },
    [
      {
        sectionType: 'MINISTRY_HERO',
        label: 'CCC Hero',
        colorScheme: 'LIGHT',
        content: {
          overline: 'CAMPUS MINISTRY',
          heading: 'Cerritos College',
          headingStyle: 'sans',
          ctaButton: { label: 'Start Bible Study', href: 'https://startbiblestudy.org/ccc', visible: true },
          socialLinks: [],
          heroImage: { src: '', alt: 'Cerritos College campus ministry' },
        },
      },
      {
        sectionType: 'MINISTRY_INTRO',
        label: 'CCC Intro',
        colorScheme: 'LIGHT',
        content: {
          overline: 'INTRODUCTION',
          heading: 'About the Ministry',
          description: 'Coming soon.',
        },
      },
      {
        sectionType: 'MINISTRY_SCHEDULE',
        label: 'CCC Schedule',
        colorScheme: 'DARK',
        content: {
          heading: 'Join Us',
          description: 'Whether you\u2019re a believer or just curious, you\u2019re welcome here.',
          scheduleLabel: 'WHEN & WHERE',
          scheduleEntries: [],
          buttons: [
            { label: 'Start Bible Study', href: 'https://startbiblestudy.org/ccc', variant: 'primary' },
          ],
        },
      },
      {
        sectionType: 'MEET_TEAM',
        label: 'CCC Team',
        colorScheme: 'LIGHT',
        content: {
          overline: 'CERRITOS COLLEGE',
          heading: 'Meet Our Team',
          members: [
            { name: 'Paul Lim', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05222.jpg', alt: 'Paul Lim' } },
          ],
        },
      },
      {
        sectionType: 'FAQ_SECTION',
        label: 'CCC FAQ',
        colorScheme: 'LIGHT',
        containerWidth: 'NARROW',
        content: sharedCampusFaq('Cerritos College'),
      },
      {
        sectionType: 'CAMPUS_CARD_GRID',
        label: 'Other Campuses',
        colorScheme: 'LIGHT',
        content: sharedCampusOtherGrid,
      },
    ],
  )
  console.log('  Created CCC campus page')

  // --- Mt. SAC ---
  await createPageWithSections(
    {
      slug: 'ministries/campus/mt-sac',
      title: 'Mt. SAC Campus Ministry',
      pageType: 'CAMPUS',
      parentId: ministriesPage.id,
      metaDescription: 'LA UBF campus ministry at Mt. San Antonio College \u2014 Bible study and fellowship for Mt. SAC students.',
      sortOrder: 27,
    },
    [
      {
        sectionType: 'MINISTRY_HERO',
        label: 'Mt. SAC Hero',
        colorScheme: 'LIGHT',
        content: {
          overline: 'CAMPUS MINISTRY',
          heading: 'MT. SAC',
          headingStyle: 'sans',
          ctaButton: { label: 'Start Bible Study', href: 'https://startbiblestudy.org/mt-sac', visible: true },
          socialLinks: [],
          heroImage: { src: '', alt: 'Mt. SAC campus ministry' },
        },
      },
      {
        sectionType: 'MINISTRY_INTRO',
        label: 'Mt. SAC Intro',
        colorScheme: 'LIGHT',
        content: {
          overline: 'INTRODUCTION',
          heading: 'About the Ministry',
          description: 'Coming soon.',
        },
      },
      {
        sectionType: 'MINISTRY_SCHEDULE',
        label: 'Mt. SAC Schedule',
        colorScheme: 'DARK',
        content: {
          heading: 'Join Us',
          description: 'Whether you\u2019re a believer or just curious, you\u2019re welcome here.',
          scheduleLabel: 'WHEN & WHERE',
          scheduleEntries: [],
          buttons: [
            { label: 'Start Bible Study', href: 'https://startbiblestudy.org/mt-sac', variant: 'primary' },
          ],
        },
      },
      {
        sectionType: 'MEET_TEAM',
        label: 'Mt. SAC Team',
        colorScheme: 'LIGHT',
        content: {
          overline: 'MT. SAC',
          heading: 'Meet Our Team',
          members: [
            { name: 'Jason Koch', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05222.jpg', alt: 'Jason Koch' } },
          ],
        },
      },
      {
        sectionType: 'FAQ_SECTION',
        label: 'Mt. SAC FAQ',
        colorScheme: 'LIGHT',
        containerWidth: 'NARROW',
        content: sharedCampusFaq('Mt. SAC'),
      },
      {
        sectionType: 'CAMPUS_CARD_GRID',
        label: 'Other Campuses',
        colorScheme: 'LIGHT',
        content: sharedCampusOtherGrid,
      },
    ],
  )
  console.log('  Created Mt. SAC campus page')

  // --- Golden West ---
  await createPageWithSections(
    {
      slug: 'ministries/campus/golden-west',
      title: 'Golden West Campus Ministry',
      pageType: 'CAMPUS',
      parentId: ministriesPage.id,
      metaDescription: 'LA UBF campus ministry at Golden West College \u2014 Bible study and fellowship for Golden West students.',
      sortOrder: 28,
    },
    [
      {
        sectionType: 'MINISTRY_HERO',
        label: 'Golden West Hero',
        colorScheme: 'LIGHT',
        content: {
          overline: 'CAMPUS MINISTRY',
          heading: 'Golden West',
          headingStyle: 'sans',
          ctaButton: { label: 'Start Bible Study', href: 'https://startbiblestudy.org/golden-cc', visible: true },
          socialLinks: [],
          heroImage: { src: '', alt: 'Golden West College campus ministry' },
        },
      },
      {
        sectionType: 'MINISTRY_INTRO',
        label: 'Golden West Intro',
        colorScheme: 'LIGHT',
        content: {
          overline: 'INTRODUCTION',
          heading: 'About the Ministry',
          description: 'Coming soon.',
        },
      },
      {
        sectionType: 'MINISTRY_SCHEDULE',
        label: 'Golden West Schedule',
        colorScheme: 'DARK',
        content: {
          heading: 'Join Us',
          description: 'Whether you\u2019re a believer or just curious, you\u2019re welcome here.',
          scheduleLabel: 'WHEN & WHERE',
          scheduleEntries: [],
          buttons: [
            { label: 'Start Bible Study', href: 'https://startbiblestudy.org/golden-cc', variant: 'primary' },
          ],
        },
      },
      {
        sectionType: 'MEET_TEAM',
        label: 'Golden West Team',
        colorScheme: 'LIGHT',
        content: {
          overline: 'GOLDEN WEST COLLEGE',
          heading: 'Meet Our Team',
          members: [
            { name: 'Frank Holman', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05222.jpg', alt: 'Frank Holman' } },
          ],
        },
      },
      {
        sectionType: 'FAQ_SECTION',
        label: 'Golden West FAQ',
        colorScheme: 'LIGHT',
        containerWidth: 'NARROW',
        content: sharedCampusFaq('Golden West College'),
      },
      {
        sectionType: 'CAMPUS_CARD_GRID',
        label: 'Other Campuses',
        colorScheme: 'LIGHT',
        content: sharedCampusOtherGrid,
      },
    ],
  )
  console.log('  Created Golden West campus page')

  // --- Cypress ---
  await createPageWithSections(
    {
      slug: 'ministries/campus/cypress',
      title: 'Cypress Campus Ministry',
      pageType: 'CAMPUS',
      parentId: ministriesPage.id,
      metaDescription: 'LA UBF campus ministry at Cypress College \u2014 Bible study and fellowship for Cypress students.',
      sortOrder: 29,
    },
    [
      {
        sectionType: 'MINISTRY_HERO',
        label: 'Cypress Hero',
        colorScheme: 'LIGHT',
        content: {
          overline: 'CAMPUS MINISTRY',
          heading: 'Cypress College',
          headingStyle: 'sans',
          ctaButton: { label: 'Start Bible Study', href: 'https://startbiblestudy.org/cypress', visible: true },
          socialLinks: [],
          heroImage: { src: '', alt: 'Cypress College campus ministry' },
        },
      },
      {
        sectionType: 'MINISTRY_INTRO',
        label: 'Cypress Intro',
        colorScheme: 'LIGHT',
        content: {
          overline: 'INTRODUCTION',
          heading: 'About the Ministry',
          description: 'Coming soon.',
        },
      },
      {
        sectionType: 'MINISTRY_SCHEDULE',
        label: 'Cypress Schedule',
        colorScheme: 'DARK',
        content: {
          heading: 'Join Us',
          description: 'Whether you\u2019re a believer or just curious, you\u2019re welcome here.',
          scheduleLabel: 'WHEN & WHERE',
          scheduleEntries: [],
          buttons: [
            { label: 'Start Bible Study', href: 'https://startbiblestudy.org/cypress', variant: 'primary' },
          ],
        },
      },
      {
        sectionType: 'MEET_TEAM',
        label: 'Cypress Team',
        colorScheme: 'LIGHT',
        content: {
          overline: 'CYPRESS COLLEGE',
          heading: 'Meet Our Team',
          members: [
            { name: 'David Cho', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05222.jpg', alt: 'David Cho' } },
          ],
        },
      },
      {
        sectionType: 'FAQ_SECTION',
        label: 'Cypress FAQ',
        colorScheme: 'LIGHT',
        containerWidth: 'NARROW',
        content: sharedCampusFaq('Cypress College'),
      },
      {
        sectionType: 'CAMPUS_CARD_GRID',
        label: 'Other Campuses',
        colorScheme: 'LIGHT',
        content: sharedCampusOtherGrid,
      },
    ],
  )
  console.log('  Created Cypress campus page')

  // --- Cal Poly Pomona ---
  await createPageWithSections(
    {
      slug: 'ministries/campus/cal-poly-pomona',
      title: 'Cal Poly Pomona Campus Ministry',
      pageType: 'CAMPUS',
      parentId: ministriesPage.id,
      metaDescription: 'LA UBF campus ministry at Cal Poly Pomona \u2014 Bible study and fellowship for CPP students.',
      sortOrder: 30,
    },
    [
      {
        sectionType: 'MINISTRY_HERO',
        label: 'Cal Poly Pomona Hero',
        colorScheme: 'LIGHT',
        content: {
          overline: 'CAMPUS MINISTRY',
          heading: 'Cal Poly Pomona',
          headingStyle: 'sans',
          ctaButton: { label: 'Start Bible Study', href: 'https://startbiblestudy.org/cal-poly-pomona', visible: true },
          socialLinks: [],
          heroImage: { src: '', alt: 'Cal Poly Pomona campus ministry' },
        },
      },
      {
        sectionType: 'MINISTRY_INTRO',
        label: 'Cal Poly Pomona Intro',
        colorScheme: 'LIGHT',
        content: {
          overline: 'INTRODUCTION',
          heading: 'About the Ministry',
          description: 'Coming soon.',
        },
      },
      {
        sectionType: 'MINISTRY_SCHEDULE',
        label: 'Cal Poly Pomona Schedule',
        colorScheme: 'DARK',
        content: {
          heading: 'Join Us',
          description: 'Whether you\u2019re a believer or just curious, you\u2019re welcome here.',
          scheduleLabel: 'WHEN & WHERE',
          scheduleEntries: [],
          buttons: [
            { label: 'Start Bible Study', href: 'https://startbiblestudy.org/cal-poly-pomona', variant: 'primary' },
          ],
        },
      },
      {
        sectionType: 'MEET_TEAM',
        label: 'Cal Poly Pomona Team',
        colorScheme: 'LIGHT',
        content: {
          overline: 'CAL POLY POMONA',
          heading: 'Meet Our Team',
          members: [
            { name: 'Andrew Cuevas', role: '', bio: 'Bio here', image: { src: '/pics-temp/DSC05222.jpg', alt: 'Andrew Cuevas' } },
          ],
        },
      },
      {
        sectionType: 'FAQ_SECTION',
        label: 'Cal Poly Pomona FAQ',
        colorScheme: 'LIGHT',
        containerWidth: 'NARROW',
        content: sharedCampusFaq('Cal Poly Pomona'),
      },
      {
        sectionType: 'CAMPUS_CARD_GRID',
        label: 'Other Campuses',
        colorScheme: 'LIGHT',
        content: sharedCampusOtherGrid,
      },
    ],
  )
  console.log('  Created Cal Poly Pomona campus page')

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

  // ============================================================
  // People & Member Management
  // ============================================================
  console.log('\nSeeding people & member management...')

  // --- People ---
  const peopleData = [
    { slug: 'james-park', firstName: 'James', lastName: 'Park', preferredName: 'Jim', gender: 'MALE', maritalStatus: 'MARRIED', dateOfBirth: '1975-03-15', email: 'james.park@email.com', phone: '213-555-0101', mobilePhone: '213-555-0102', city: 'Los Angeles', state: 'CA', zipCode: '90012', country: 'US', membershipStatus: 'MEMBER', membershipDate: '2005-06-01', baptismDate: '2004-12-25', salvationDate: '2003-08-15', source: 'Church Plant' },
    { slug: 'sarah-park', firstName: 'Sarah', lastName: 'Park', gender: 'FEMALE', maritalStatus: 'MARRIED', dateOfBirth: '1978-07-22', email: 'sarah.park@email.com', phone: '213-555-0103', mobilePhone: '213-555-0104', city: 'Los Angeles', state: 'CA', zipCode: '90012', country: 'US', membershipStatus: 'MEMBER', membershipDate: '2006-01-15', baptismDate: '2005-06-12', salvationDate: '2004-03-20', source: 'Church Plant' },
    { slug: 'daniel-park', firstName: 'Daniel', lastName: 'Park', gender: 'MALE', dateOfBirth: '2005-11-03', city: 'Los Angeles', state: 'CA', zipCode: '90012', country: 'US', membershipStatus: 'REGULAR_ATTENDEE', source: 'Born into church family' },
    { slug: 'grace-park', firstName: 'Grace', lastName: 'Park', gender: 'FEMALE', dateOfBirth: '2008-04-18', city: 'Los Angeles', state: 'CA', zipCode: '90012', country: 'US', membershipStatus: 'REGULAR_ATTENDEE', source: 'Born into church family' },
    { slug: 'michael-kim', firstName: 'Michael', lastName: 'Kim', preferredName: 'Mike', gender: 'MALE', maritalStatus: 'MARRIED', dateOfBirth: '1980-01-10', email: 'michael.kim@email.com', phone: '213-555-0201', mobilePhone: '213-555-0202', city: 'Pasadena', state: 'CA', zipCode: '91101', country: 'US', membershipStatus: 'MEMBER', membershipDate: '2010-09-01', baptismDate: '2009-04-12', salvationDate: '2008-11-30', source: 'Invited by friend' },
    { slug: 'jennifer-kim', firstName: 'Jennifer', lastName: 'Kim', preferredName: 'Jen', gender: 'FEMALE', maritalStatus: 'MARRIED', dateOfBirth: '1982-05-28', email: 'jennifer.kim@email.com', phone: '213-555-0203', city: 'Pasadena', state: 'CA', zipCode: '91101', country: 'US', membershipStatus: 'MEMBER', membershipDate: '2011-03-15', baptismDate: '2010-12-25', salvationDate: '2010-06-01', source: 'Married into church' },
    { slug: 'ethan-kim', firstName: 'Ethan', lastName: 'Kim', gender: 'MALE', dateOfBirth: '2012-09-14', city: 'Pasadena', state: 'CA', zipCode: '91101', country: 'US', membershipStatus: 'REGULAR_ATTENDEE', source: 'Born into church family' },
    { slug: 'david-lee', firstName: 'David', lastName: 'Lee', gender: 'MALE', maritalStatus: 'MARRIED', dateOfBirth: '1970-12-05', email: 'david.lee@email.com', phone: '626-555-0301', mobilePhone: '626-555-0302', city: 'Glendale', state: 'CA', zipCode: '91201', country: 'US', membershipStatus: 'MEMBER', membershipDate: '2000-01-01', baptismDate: '1998-12-25', salvationDate: '1997-06-15', source: 'Founding member' },
    { slug: 'hannah-lee', firstName: 'Hannah', lastName: 'Lee', gender: 'FEMALE', maritalStatus: 'MARRIED', dateOfBirth: '1972-08-19', email: 'hannah.lee@email.com', phone: '626-555-0303', city: 'Glendale', state: 'CA', zipCode: '91201', country: 'US', membershipStatus: 'MEMBER', membershipDate: '2001-06-01', baptismDate: '2000-12-25', salvationDate: '1999-09-01', source: 'Founding member' },
    { slug: 'joshua-lee', firstName: 'Joshua', lastName: 'Lee', gender: 'MALE', maritalStatus: 'SINGLE', dateOfBirth: '1998-02-14', email: 'joshua.lee@email.com', mobilePhone: '626-555-0304', city: 'Glendale', state: 'CA', zipCode: '91201', country: 'US', membershipStatus: 'MEMBER', membershipDate: '2018-06-01', baptismDate: '2017-04-16', salvationDate: '2016-08-20', source: 'Grew up in church' },
    { slug: 'rachel-lee', firstName: 'Rachel', lastName: 'Lee', gender: 'FEMALE', maritalStatus: 'SINGLE', dateOfBirth: '2001-06-30', email: 'rachel.lee@email.com', mobilePhone: '626-555-0305', city: 'Glendale', state: 'CA', zipCode: '91201', country: 'US', membershipStatus: 'REGULAR_ATTENDEE', source: 'Grew up in church' },
    { slug: 'kevin-cho', firstName: 'Kevin', lastName: 'Cho', gender: 'MALE', maritalStatus: 'SINGLE', dateOfBirth: '1995-04-25', email: 'kevin.cho@email.com', mobilePhone: '310-555-0401', city: 'Santa Monica', state: 'CA', zipCode: '90401', country: 'US', membershipStatus: 'MEMBER', membershipDate: '2020-01-15', baptismDate: '2019-12-25', salvationDate: '2019-03-10', source: 'Campus outreach' },
    { slug: 'amy-chen', firstName: 'Amy', lastName: 'Chen', gender: 'FEMALE', maritalStatus: 'SINGLE', dateOfBirth: '1997-10-12', email: 'amy.chen@email.com', mobilePhone: '310-555-0501', city: 'West Los Angeles', state: 'CA', zipCode: '90025', country: 'US', membershipStatus: 'REGULAR_ATTENDEE', source: 'Campus outreach' },
    { slug: 'peter-wong', firstName: 'Peter', lastName: 'Wong', gender: 'MALE', maritalStatus: 'SINGLE', dateOfBirth: '2000-01-20', email: 'peter.wong@email.com', mobilePhone: '213-555-0601', city: 'Downtown LA', state: 'CA', zipCode: '90015', country: 'US', membershipStatus: 'VISITOR', source: 'Online search' },
    { slug: 'jessica-yun', firstName: 'Jessica', lastName: 'Yun', gender: 'FEMALE', maritalStatus: 'SINGLE', dateOfBirth: '1999-08-08', email: 'jessica.yun@email.com', mobilePhone: '213-555-0701', city: 'Koreatown', state: 'CA', zipCode: '90005', country: 'US', membershipStatus: 'VISITOR', source: 'Friend invitation' },
    { slug: 'william-choi', firstName: 'William', lastName: 'Choi', gender: 'MALE', maritalStatus: 'DIVORCED', dateOfBirth: '1985-11-15', email: 'william.choi@email.com', phone: '818-555-0801', city: 'Burbank', state: 'CA', zipCode: '91502', country: 'US', membershipStatus: 'INACTIVE', membershipDate: '2015-03-01', baptismDate: '2014-12-25', salvationDate: '2014-06-01', source: 'Community event', notes: 'Moved to another city, may return.' },
    { slug: 'sophia-han', firstName: 'Sophia', lastName: 'Han', gender: 'FEMALE', maritalStatus: 'WIDOWED', dateOfBirth: '1955-03-08', email: 'sophia.han@email.com', phone: '213-555-0901', city: 'Los Angeles', state: 'CA', zipCode: '90012', country: 'US', membershipStatus: 'MEMBER', membershipDate: '1999-01-01', baptismDate: '1998-04-12', salvationDate: '1997-01-01', source: 'Founding member' },
    { slug: 'andrew-jung', firstName: 'Andrew', lastName: 'Jung', gender: 'MALE', maritalStatus: 'SINGLE', dateOfBirth: '2002-07-04', email: 'andrew.jung@email.com', mobilePhone: '213-555-1001', city: 'Los Angeles', state: 'CA', zipCode: '90007', country: 'US', membershipStatus: 'REGULAR_ATTENDEE', source: 'USC campus ministry' },
    { slug: 'emily-song', firstName: 'Emily', lastName: 'Song', gender: 'FEMALE', maritalStatus: 'SINGLE', dateOfBirth: '2003-12-01', email: 'emily.song@email.com', mobilePhone: '213-555-1101', city: 'Los Angeles', state: 'CA', zipCode: '90007', country: 'US', membershipStatus: 'VISITOR', source: 'USC campus ministry' },
    { slug: 'mark-kwon', firstName: 'Mark', lastName: 'Kwon', gender: 'MALE', maritalStatus: 'MARRIED', dateOfBirth: '1968-09-20', email: 'mark.kwon@email.com', phone: '626-555-1201', city: 'Alhambra', state: 'CA', zipCode: '91801', country: 'US', membershipStatus: 'MEMBER', membershipDate: '2008-06-01', baptismDate: '2007-12-25', salvationDate: '2007-03-15', source: 'Referred by David Lee' },
  ]

  const personRecords: Record<string, string> = {}
  for (const p of peopleData) {
    const person = await prisma.person.upsert({
      where: { churchId_slug: { churchId, slug: p.slug } },
      update: {},
      create: {
        churchId,
        slug: p.slug,
        firstName: p.firstName,
        lastName: p.lastName,
        preferredName: p.preferredName ?? null,
        gender: p.gender as 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | undefined,
        maritalStatus: p.maritalStatus as 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED' | 'OTHER' | undefined,
        dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null,
        email: p.email ?? null,
        phone: p.phone ?? null,
        mobilePhone: p.mobilePhone ?? null,
        city: p.city ?? null,
        state: p.state ?? null,
        zipCode: p.zipCode ?? null,
        country: p.country ?? null,
        membershipStatus: p.membershipStatus as 'VISITOR' | 'REGULAR_ATTENDEE' | 'MEMBER' | 'INACTIVE' | 'ARCHIVED',
        membershipDate: p.membershipDate ? new Date(p.membershipDate) : null,
        baptismDate: p.baptismDate ? new Date(p.baptismDate) : null,
        salvationDate: p.salvationDate ? new Date(p.salvationDate) : null,
        source: p.source ?? null,
        notes: p.notes ?? null,
      },
    })
    personRecords[p.slug] = person.id
  }
  console.log(`  Created ${Object.keys(personRecords).length} people`)

  // --- Households ---
  const parkHousehold = await prisma.household.create({
    data: {
      churchId,
      name: 'Park Family',
      address: { street: '123 Temple St', city: 'Los Angeles', state: 'CA', zipCode: '90012' },
      primaryContactId: personRecords['james-park'],
    },
  })

  for (const [slug, role] of [['james-park', 'HEAD'], ['sarah-park', 'SPOUSE'], ['daniel-park', 'CHILD'], ['grace-park', 'CHILD']] as const) {
    await prisma.householdMember.create({
      data: { householdId: parkHousehold.id, personId: personRecords[slug], role },
    })
  }

  const kimHousehold = await prisma.household.create({
    data: {
      churchId,
      name: 'Kim Family',
      address: { street: '456 Colorado Blvd', city: 'Pasadena', state: 'CA', zipCode: '91101' },
      primaryContactId: personRecords['michael-kim'],
    },
  })

  for (const [slug, role] of [['michael-kim', 'HEAD'], ['jennifer-kim', 'SPOUSE'], ['ethan-kim', 'CHILD']] as const) {
    await prisma.householdMember.create({
      data: { householdId: kimHousehold.id, personId: personRecords[slug], role },
    })
  }

  const leeHousehold = await prisma.household.create({
    data: {
      churchId,
      name: 'Lee Family',
      address: { street: '789 Brand Blvd', city: 'Glendale', state: 'CA', zipCode: '91201' },
      primaryContactId: personRecords['david-lee'],
    },
  })

  for (const [slug, role] of [['david-lee', 'HEAD'], ['hannah-lee', 'SPOUSE'], ['joshua-lee', 'CHILD'], ['rachel-lee', 'CHILD']] as const) {
    await prisma.householdMember.create({
      data: { householdId: leeHousehold.id, personId: personRecords[slug], role },
    })
  }
  console.log('  Created 3 households with family members')

  // --- Person Groups ---
  const sundayBibleStudy = await prisma.personGroup.create({
    data: {
      churchId,
      name: 'Sunday Bible Study',
      slug: 'sunday-bible-study',
      description: 'Weekly Sunday Bible Study for all members.',
      groupType: 'SMALL_GROUP',
      meetingSchedule: 'Sundays 10:00 AM',
      meetingLocation: 'Main Hall',
      isOpen: true,
      status: 'ACTIVE',
    },
  })

  const youngAdults = await prisma.personGroup.create({
    data: {
      churchId,
      name: 'Young Adults Fellowship',
      slug: 'young-adults-fellowship',
      description: 'Fellowship group for college-age and young professionals.',
      groupType: 'SMALL_GROUP',
      meetingSchedule: 'Fridays 7:00 PM',
      meetingLocation: 'Fellowship Hall',
      isOpen: true,
      capacity: 30,
      status: 'ACTIVE',
    },
  })

  const worshipTeam = await prisma.personGroup.create({
    data: {
      churchId,
      name: 'Worship Team',
      slug: 'worship-team',
      description: 'Music and worship ministry team.',
      groupType: 'SERVING_TEAM',
      meetingSchedule: 'Saturdays 3:00 PM (rehearsal)',
      meetingLocation: 'Sanctuary',
      isOpen: false,
      status: 'ACTIVE',
    },
  })

  const welcomeTeam = await prisma.personGroup.create({
    data: {
      churchId,
      name: 'Welcome Team',
      slug: 'welcome-team',
      description: 'Greeting and hospitality team for Sunday services.',
      groupType: 'SERVING_TEAM',
      meetingSchedule: 'Sundays 9:30 AM',
      meetingLocation: 'Church Lobby',
      isOpen: true,
      status: 'ACTIVE',
    },
  })

  // Add members to groups
  const sundayBibleStudyMembers: [string, 'LEADER' | 'CO_LEADER' | 'MEMBER'][] = [
    ['james-park', 'LEADER'], ['sarah-park', 'MEMBER'], ['michael-kim', 'CO_LEADER'],
    ['jennifer-kim', 'MEMBER'], ['david-lee', 'MEMBER'], ['hannah-lee', 'MEMBER'],
    ['kevin-cho', 'MEMBER'], ['sophia-han', 'MEMBER'], ['mark-kwon', 'MEMBER'],
  ]
  for (const [slug, role] of sundayBibleStudyMembers) {
    await prisma.personGroupMember.create({
      data: { groupId: sundayBibleStudy.id, personId: personRecords[slug], role },
    })
  }

  const youngAdultsMembers: [string, 'LEADER' | 'CO_LEADER' | 'MEMBER'][] = [
    ['kevin-cho', 'LEADER'], ['amy-chen', 'CO_LEADER'], ['joshua-lee', 'MEMBER'],
    ['rachel-lee', 'MEMBER'], ['andrew-jung', 'MEMBER'], ['emily-song', 'MEMBER'],
    ['peter-wong', 'MEMBER'], ['jessica-yun', 'MEMBER'],
  ]
  for (const [slug, role] of youngAdultsMembers) {
    await prisma.personGroupMember.create({
      data: { groupId: youngAdults.id, personId: personRecords[slug], role },
    })
  }

  const worshipTeamMembers: [string, 'LEADER' | 'CO_LEADER' | 'MEMBER'][] = [
    ['michael-kim', 'LEADER'], ['rachel-lee', 'MEMBER'], ['kevin-cho', 'MEMBER'], ['amy-chen', 'MEMBER'],
  ]
  for (const [slug, role] of worshipTeamMembers) {
    await prisma.personGroupMember.create({
      data: { groupId: worshipTeam.id, personId: personRecords[slug], role },
    })
  }

  const welcomeTeamMembers: [string, 'LEADER' | 'CO_LEADER' | 'MEMBER'][] = [
    ['sarah-park', 'LEADER'], ['jennifer-kim', 'MEMBER'], ['sophia-han', 'MEMBER'], ['hannah-lee', 'MEMBER'],
  ]
  for (const [slug, role] of welcomeTeamMembers) {
    await prisma.personGroupMember.create({
      data: { groupId: welcomeTeam.id, personId: personRecords[slug], role },
    })
  }
  console.log('  Created 4 groups with members assigned')

  // --- Custom Field Definitions ---
  const emergencyContactField = await prisma.customFieldDefinition.create({
    data: {
      churchId,
      name: 'Emergency Contact',
      slug: 'emergency-contact',
      fieldType: 'TEXT',
      section: 'Emergency',
      isRequired: false,
      isVisible: true,
      sortOrder: 1,
    },
  })

  const emergencyPhoneField = await prisma.customFieldDefinition.create({
    data: {
      churchId,
      name: 'Emergency Phone',
      slug: 'emergency-phone',
      fieldType: 'TEXT',
      section: 'Emergency',
      isRequired: false,
      isVisible: true,
      sortOrder: 2,
    },
  })

  const allergiesField = await prisma.customFieldDefinition.create({
    data: {
      churchId,
      name: 'Allergies / Medical Notes',
      slug: 'allergies-medical-notes',
      fieldType: 'TEXT',
      section: 'Medical',
      isRequired: false,
      isVisible: false,
      sortOrder: 3,
    },
  })

  const tshirtSizeField = await prisma.customFieldDefinition.create({
    data: {
      churchId,
      name: 'T-Shirt Size',
      slug: 'tshirt-size',
      fieldType: 'DROPDOWN',
      options: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
      section: 'General',
      isRequired: false,
      isVisible: true,
      sortOrder: 4,
    },
  })

  await prisma.customFieldDefinition.create({
    data: {
      churchId,
      name: 'Spiritual Gifts',
      slug: 'spiritual-gifts',
      fieldType: 'MULTI_SELECT',
      options: ['Teaching', 'Leadership', 'Hospitality', 'Mercy', 'Evangelism', 'Worship', 'Administration', 'Encouragement', 'Giving', 'Service'],
      section: 'Spiritual',
      isRequired: false,
      isVisible: true,
      sortOrder: 5,
    },
  })
  console.log('  Created 5 custom field definitions')

  // Set some custom field values
  await prisma.customFieldValue.create({ data: { personId: personRecords['james-park'], fieldDefinitionId: emergencyContactField.id, value: 'Sarah Park' } })
  await prisma.customFieldValue.create({ data: { personId: personRecords['james-park'], fieldDefinitionId: emergencyPhoneField.id, value: '213-555-0103' } })
  await prisma.customFieldValue.create({ data: { personId: personRecords['james-park'], fieldDefinitionId: tshirtSizeField.id, value: 'L' } })
  await prisma.customFieldValue.create({ data: { personId: personRecords['michael-kim'], fieldDefinitionId: emergencyContactField.id, value: 'Jennifer Kim' } })
  await prisma.customFieldValue.create({ data: { personId: personRecords['michael-kim'], fieldDefinitionId: emergencyPhoneField.id, value: '213-555-0203' } })
  await prisma.customFieldValue.create({ data: { personId: personRecords['kevin-cho'], fieldDefinitionId: allergiesField.id, value: 'Peanut allergy' } })
  await prisma.customFieldValue.create({ data: { personId: personRecords['kevin-cho'], fieldDefinitionId: tshirtSizeField.id, value: 'M' } })
  console.log('  Created custom field values')

  // --- Person Tags ---
  const tagAssignments: [string, string[]][] = [
    ['james-park', ['shepherd', 'bible-teacher', 'leader']],
    ['sarah-park', ['fellowship-coordinator', 'leader']],
    ['michael-kim', ['worship-leader', 'musician', 'leader']],
    ['jennifer-kim', ['hospitality']],
    ['david-lee', ['elder', 'shepherd', 'leader']],
    ['hannah-lee', ['prayer-warrior', 'hospitality']],
    ['kevin-cho', ['campus-minister', 'leader']],
    ['amy-chen', ['campus-worker']],
    ['sophia-han', ['intercessor', 'elder']],
    ['mark-kwon', ['deacon', 'leader']],
    ['joshua-lee', ['youth-leader']],
    ['andrew-jung', ['new-believer']],
    ['peter-wong', ['newcomer']],
    ['jessica-yun', ['newcomer']],
    ['emily-song', ['newcomer']],
  ]

  for (const [slug, tags] of tagAssignments) {
    for (const tagName of tags) {
      await prisma.personTag.create({
        data: { personId: personRecords[slug], tagName },
      })
    }
  }
  console.log('  Created person tags')

  // --- Communication Preferences ---
  const commPrefs: [string, 'EMAIL' | 'SMS' | 'PHONE' | 'MAIL', string, boolean][] = [
    ['james-park', 'EMAIL', 'general', true],
    ['james-park', 'EMAIL', 'events', true],
    ['james-park', 'SMS', 'general', true],
    ['sarah-park', 'EMAIL', 'general', true],
    ['sarah-park', 'EMAIL', 'events', true],
    ['michael-kim', 'EMAIL', 'general', true],
    ['michael-kim', 'SMS', 'general', false],
    ['kevin-cho', 'EMAIL', 'general', true],
    ['kevin-cho', 'EMAIL', 'events', true],
    ['kevin-cho', 'SMS', 'general', true],
    ['amy-chen', 'EMAIL', 'general', true],
    ['amy-chen', 'SMS', 'general', true],
    ['david-lee', 'EMAIL', 'general', true],
    ['david-lee', 'PHONE', 'general', true],
    ['sophia-han', 'PHONE', 'general', true],
    ['sophia-han', 'MAIL', 'general', true],
  ]

  for (const [slug, channel, category, isOptedIn] of commPrefs) {
    await prisma.communicationPreference.create({
      data: { personId: personRecords[slug], channel, category, isOptedIn },
    })
  }
  console.log('  Created communication preferences')

  // --- Person Role Definitions (system + custom) ---
  const speakerRole = await prisma.personRoleDefinition.create({
    data: { churchId, name: 'Speaker', slug: 'speaker', description: 'Sermon and Bible study speakers', isSystem: true, color: '#6366f1', icon: 'mic', sortOrder: 1 },
  })
  const pastorRole = await prisma.personRoleDefinition.create({
    data: { churchId, name: 'Pastor', slug: 'pastor', description: 'Church pastors and shepherds', isSystem: true, color: '#8b5cf6', icon: 'shield', sortOrder: 2 },
  })
  const elderRole = await prisma.personRoleDefinition.create({
    data: { churchId, name: 'Elder', slug: 'elder', description: 'Church elders involved in governance', isSystem: true, color: '#a855f7', icon: 'crown', sortOrder: 3 },
  })
  const deaconRole = await prisma.personRoleDefinition.create({
    data: { churchId, name: 'Deacon', slug: 'deacon', description: 'Church deacons serving the congregation', isSystem: true, color: '#ec4899', icon: 'heart-handshake', sortOrder: 4 },
  })
  const worshipLeaderRole = await prisma.personRoleDefinition.create({
    data: { churchId, name: 'Worship Leader', slug: 'worship-leader', description: 'Music and worship ministry leaders', isSystem: true, color: '#f59e0b', icon: 'music', sortOrder: 5 },
  })
  const bibleStudyLeaderRole = await prisma.personRoleDefinition.create({
    data: { churchId, name: 'Bible Study Leader', slug: 'bible-study-leader', description: 'Leaders who facilitate Bible study groups', isSystem: false, color: '#10b981', icon: 'book-open', sortOrder: 6 },
  })
  console.log('  Created 6 role definitions (5 system + 1 custom)')

  // --- Create Person records for existing Speakers and assign Speaker role ---
  // Map speaker names to their existing Person records or create new ones
  const speakerPersonData: { name: string; slug: string; title?: string; bio?: string }[] = [
    { name: 'P. William', slug: 'p-william', title: 'Senior Pastor', bio: 'Pastor William has served as the senior shepherd of LA UBF since its founding. He leads the Sunday worship service and weekly Bible study.' },
    { name: 'P. Kevin Albright', slug: 'p-kevin-albright', title: 'Campus Pastor', bio: 'Pastor Kevin Albright serves as a campus missionary and Bible teacher, reaching college students across the LA area.' },
    { name: 'P. Abraham Kim', slug: 'p-abraham-kim', title: 'Associate Pastor', bio: 'Pastor Abraham Kim is an associate pastor who frequently speaks at conferences and special events.' },
    { name: 'Msn. Daniel Park', slug: 'msn-daniel-park', title: 'Missionary' },
    { name: 'Msn. Sarah Kim', slug: 'msn-sarah-kim', title: 'Missionary' },
    { name: 'Msn. Joshua Lee', slug: 'msn-joshua-lee', title: 'Missionary' },
    { name: 'Msn. Grace Yoon', slug: 'msn-grace-yoon', title: 'Missionary' },
    { name: 'Msn. Joseph Ahn', slug: 'msn-joseph-ahn', title: 'Missionary' },
    { name: 'Msn. Hannah Cho', slug: 'msn-hannah-cho', title: 'Missionary' },
    { name: 'Msn. David Lim', slug: 'msn-david-lim', title: 'Missionary' },
    { name: 'Msn. Ruth Kim', slug: 'msn-ruth-kim', title: 'Missionary' },
  ]

  for (const sp of speakerPersonData) {
    // Parse first/last name from display name
    const parts = sp.name.replace(/^(P\.|Msn\.)\s*/, '').trim().split(' ')
    const firstName = parts[0]
    const lastName = parts.slice(1).join(' ') || parts[0]

    // Check if this person already exists (e.g., Joshua Lee might match the existing joshua-lee person record)
    const existingPerson = await prisma.person.findUnique({
      where: { churchId_slug: { churchId, slug: sp.slug } },
    })

    let speakerPersonId: string
    if (existingPerson) {
      // Update with title/bio
      await prisma.person.update({
        where: { id: existingPerson.id },
        data: { title: sp.title, bio: sp.bio },
      })
      speakerPersonId = existingPerson.id
    } else {
      const newPerson = await prisma.person.create({
        data: {
          churchId,
          slug: sp.slug,
          firstName,
          lastName,
          title: sp.title,
          bio: sp.bio,
          membershipStatus: 'MEMBER',
          source: 'Speaker seed data',
        },
      })
      speakerPersonId = newPerson.id
      personRecords[sp.slug] = newPerson.id
    }

    // Assign Speaker role
    await prisma.personRoleAssignment.create({
      data: { personId: speakerPersonId, roleId: speakerRole.id, title: sp.title },
    })
  }
  console.log('  Created speaker Person records and assigned Speaker role')

  // --- Assign Pastor role ---
  // P. William is a pastor — find or use the person record
  const pWilliam = personRecords['p-william']
  if (pWilliam) {
    await prisma.personRoleAssignment.create({
      data: { personId: pWilliam, roleId: pastorRole.id, title: 'Senior Pastor' },
    })
  }
  const pKevin = personRecords['p-kevin-albright']
  if (pKevin) {
    await prisma.personRoleAssignment.create({
      data: { personId: pKevin, roleId: pastorRole.id, title: 'Campus Pastor' },
    })
  }
  console.log('  Assigned Pastor role to 2 people')

  // --- Assign Elder role ---
  if (personRecords['david-lee']) {
    await prisma.personRoleAssignment.create({
      data: { personId: personRecords['david-lee'], roleId: elderRole.id },
    })
  }
  if (personRecords['mark-kwon']) {
    await prisma.personRoleAssignment.create({
      data: { personId: personRecords['mark-kwon'], roleId: elderRole.id },
    })
  }
  if (personRecords['sophia-han']) {
    await prisma.personRoleAssignment.create({
      data: { personId: personRecords['sophia-han'], roleId: elderRole.id },
    })
  }
  console.log('  Assigned Elder role to 3 people')

  // --- Assign Deacon role ---
  if (personRecords['mark-kwon']) {
    await prisma.personRoleAssignment.create({
      data: { personId: personRecords['mark-kwon'], roleId: deaconRole.id },
    })
  }
  console.log('  Assigned Deacon role to 1 person')

  // --- Assign Worship Leader role ---
  if (personRecords['michael-kim']) {
    await prisma.personRoleAssignment.create({
      data: { personId: personRecords['michael-kim'], roleId: worshipLeaderRole.id, title: 'Lead Worship' },
    })
  }
  console.log('  Assigned Worship Leader role to 1 person')

  // --- Assign Bible Study Leader role ---
  if (personRecords['james-park']) {
    await prisma.personRoleAssignment.create({
      data: { personId: personRecords['james-park'], roleId: bibleStudyLeaderRole.id },
    })
  }
  if (personRecords['kevin-cho']) {
    await prisma.personRoleAssignment.create({
      data: { personId: personRecords['kevin-cho'], roleId: bibleStudyLeaderRole.id },
    })
  }
  if (personRecords['michael-kim']) {
    await prisma.personRoleAssignment.create({
      data: { personId: personRecords['michael-kim'], roleId: bibleStudyLeaderRole.id },
    })
  }
  console.log('  Assigned Bible Study Leader role to 3 people')

  // ============================================================
  // Test User (for development login)
  // ============================================================
  const bcrypt = await import('bcryptjs')
  const testEmail = process.env.AUTH_TEST_EMAIL || 'admin@laubf.org'
  const testPassword = process.env.AUTH_TEST_PASSWORD || 'laubf-admin-2024'
  const passwordHash = await bcrypt.hash(testPassword, 12)

  const testUser = await prisma.user.upsert({
    where: { email: testEmail },
    update: { passwordHash },
    create: {
      email: testEmail,
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      emailVerified: true,
    },
  })

  await prisma.churchMember.upsert({
    where: { churchId_userId: { churchId, userId: testUser.id } },
    update: { role: 'OWNER' },
    create: {
      churchId,
      userId: testUser.id,
      role: 'OWNER',
    },
  })
  console.log(`  Created test user: ${testEmail}`)

  // --- Person Notes (requires test user as author) ---
  if (personRecords['james-park']) {
    await prisma.personNote.createMany({
      data: [
        {
          churchId,
          personId: personRecords['james-park'],
          authorId: testUser.id,
          noteType: 'GENERAL',
          content: 'James has been a faithful member for over 20 years. He leads the Sunday Bible Study and shepherds several younger members.',
          isPinned: true,
          isPrivate: false,
        },
        {
          churchId,
          personId: personRecords['james-park'],
          authorId: testUser.id,
          noteType: 'PASTORAL',
          content: 'Met with James for pastoral counseling. He is seeking guidance on how to better mentor the young adults in the fellowship.',
          isPinned: false,
          isPrivate: true,
        },
        {
          churchId,
          personId: personRecords['kevin-cho'],
          authorId: testUser.id,
          noteType: 'FOLLOW_UP',
          content: 'Kevin expressed interest in leading a campus Bible study at UCLA. Follow up to discuss training and support.',
          isPinned: true,
          isPrivate: false,
        },
        {
          churchId,
          personId: personRecords['peter-wong'],
          authorId: testUser.id,
          noteType: 'FOLLOW_UP',
          content: 'Peter visited for the first time last Sunday. He is a student at USC. Sent welcome email and invited to young adults fellowship.',
          isPinned: false,
          isPrivate: false,
        },
        {
          churchId,
          personId: personRecords['jessica-yun'],
          authorId: testUser.id,
          noteType: 'GENERAL',
          content: 'Jessica was invited by Amy Chen. She seems interested in learning more about the Bible. Connected her with the young adults group.',
          isPinned: false,
          isPrivate: false,
        },
        {
          churchId,
          personId: personRecords['william-choi'],
          authorId: testUser.id,
          noteType: 'PASTORAL',
          content: 'William moved to San Francisco for work. He is looking for a church community there. Provided him with some church recommendations.',
          isPinned: false,
          isPrivate: true,
        },
        {
          churchId,
          personId: personRecords['sophia-han'],
          authorId: testUser.id,
          noteType: 'PRAYER',
          content: 'Sister Sophia requested prayer for her health. She has been dealing with knee pain and difficulty walking to church.',
          isPinned: true,
          isPrivate: false,
        },
        {
          churchId,
          personId: personRecords['andrew-jung'],
          authorId: testUser.id,
          noteType: 'FOLLOW_UP',
          content: 'Andrew completed the new believers class. He is eager to be baptized. Schedule baptism preparation meetings.',
          isPinned: false,
          isPrivate: false,
        },
      ],
    })
    console.log('  Created person notes')
  }

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
