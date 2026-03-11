import 'dotenv/config'
import { createReadStream } from 'fs'
import { createGunzip } from 'zlib'
import { createInterface } from 'readline'
import { join } from 'path'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const mod = await import('../lib/generated/prisma/client.ts')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

// ============================================================
// CDN base URL for initial website assets (R2 media bucket)
// ============================================================
const CDN = 'https://pub-91add7d8455848c9a871477af3249f9e.r2.dev/la-ubf/initial-setup'

// ============================================================
// R2 client for looking up real file sizes during seed
// ============================================================
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const R2_ATT_BUCKET = process.env.R2_ATTACHMENTS_BUCKET_NAME!
const R2_ATT_PUBLIC = (process.env.R2_ATTACHMENTS_PUBLIC_URL || process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '')
const R2_MEDIA_BUCKET = process.env.R2_MEDIA_BUCKET_NAME || ''
const R2_MEDIA_PREFIX = 'la-ubf/initial-setup/'
const R2_MEDIA_PUBLIC = (process.env.R2_MEDIA_PUBLIC_URL || '').replace(/\/+$/, '')

/** Batch-list all objects in R2 attachments bucket under la-ubf/ prefix.
 *  Returns a map of key → size. Uses ListObjectsV2 (~3-4 requests for ~3000 files)
 *  instead of individual HeadObject per file, saving thousands of Class B ops. */
async function getR2AttachmentSizeMap(): Promise<Map<string, number>> {
  const sizeMap = new Map<string, number>()
  if (!R2_ATT_BUCKET) return sizeMap
  const prefix = 'la-ubf/'
  try {
    let token: string | undefined
    do {
      const res = await r2.send(new ListObjectsV2Command({
        Bucket: R2_ATT_BUCKET,
        Prefix: prefix,
        ContinuationToken: token,
      }))
      for (const obj of res.Contents ?? []) {
        if (obj.Key && obj.Size !== undefined) {
          sizeMap.set(obj.Key, obj.Size)
        }
      }
      token = res.IsTruncated ? res.NextContinuationToken : undefined
    } while (token)
    console.log(`  Fetched real sizes for ${sizeMap.size} R2 attachment objects`)
  } catch (err) {
    console.warn('  ⚠ Could not fetch R2 attachment sizes, fileSize will be null:', (err as Error).message)
  }
  return sizeMap
}

/** List all objects in R2 media bucket and return a map of filename → real size. */
async function getR2MediaSizeMap(): Promise<Map<string, number>> {
  const sizeMap = new Map<string, number>()
  if (!R2_MEDIA_BUCKET) return sizeMap
  try {
    let token: string | undefined
    do {
      const res = await r2.send(new ListObjectsV2Command({
        Bucket: R2_MEDIA_BUCKET,
        Prefix: R2_MEDIA_PREFIX,
        ContinuationToken: token,
      }))
      for (const obj of res.Contents ?? []) {
        if (obj.Key && obj.Size !== undefined) {
          // Extract just the filename (after prefix)
          const filename = obj.Key.slice(R2_MEDIA_PREFIX.length)
          sizeMap.set(filename, obj.Size)
        }
      }
      token = res.IsTruncated ? res.NextContinuationToken : undefined
    } while (token)
    console.log(`  Fetched real sizes for ${sizeMap.size} R2 media objects`)
  } catch (err) {
    console.warn('  ⚠ Could not fetch R2 media sizes, using fallback estimates:', (err as Error).message)
  }
  return sizeMap
}

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
// Data from legacy LA UBF database (imported from parsed files)
// ============================================================

// --- Messages (260 entries from legacy videolist) ---
type MessageSeed = {
  legacyId: number;
  slug: string;
  title: string;
  youtubeId: string | null;
  thumbnailUrl: string | null;
  speaker: string;
  series: string;
  passage: string;
  dateFor: string;
};

const videolistMod = await import('../scripts/parsed-videolist.ts')
const MESSAGES_RAW: MessageSeed[] = videolistMod.default

// Handle 3 duplicate video slugs: append year for second occurrence
const DUPLICATE_SLUGS = new Set(['what-is-your-name', 'you-give-them-something-to-eat', 'i-am-with-you'])
const seenSlugs = new Set<string>()
const MESSAGES: MessageSeed[] = MESSAGES_RAW.map(msg => {
  if (DUPLICATE_SLUGS.has(msg.slug) && seenSlugs.has(msg.slug)) {
    const year = msg.dateFor.split('-')[0]
    return { ...msg, slug: `${msg.slug}-${year}` }
  }
  seenSlugs.add(msg.slug)
  return msg
})

// --- Bible Studies (1180 entries from legacy laubfmaterial) ---
type BibleStudySeed = {
  legacyId: number;
  slug: string;
  title: string;
  book: string | null;
  passage: string;
  dateFor: string;
  series: string;
  attachments: { name: string; url: string; type: string }[];
};

const materialMod = await import('../scripts/parsed-laubfmaterial.ts')
const BIBLE_STUDIES_RAW: BibleStudySeed[] = materialMod.default

// Filter out entries with null book (BibleBook is required)
const BIBLE_STUDIES: BibleStudySeed[] = BIBLE_STUDIES_RAW.filter(bs => bs.book !== null)

// --- Bible Study Content (extracted from DOCX/DOC files) ---
import { readFileSync } from 'fs'
const bibleStudyContent: Record<string, { questions?: string; answers?: string; transcript?: string }> =
  JSON.parse(readFileSync('scripts/bible-study-content.json', 'utf-8'))

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
    date: "2026-03-04",
    passage: "Psalm 23:1-6",
    keyVerse: "The Lord is my shepherd; I shall not want. — Psalm 23:1",
    author: "P. Abraham Kim",
    body: "<p>Psalm 23 is perhaps the most beloved passage in all of Scripture. In six short verses, David paints a portrait of God's intimate care — leading, restoring, protecting, and accompanying his people through every season of life.</p><p>The image of a shepherd was deeply familiar to David from his youth. A good shepherd knows each sheep by name, seeks the lost, and defends the flock at personal cost. David saw his own life as lived under exactly this kind of care.</p><p>\"I shall not want\" is not a claim of perfect circumstances, but of perfect provision. Even walking through the valley of the shadow of death, the shepherd's rod and staff bring comfort. The goodness and mercy that follow us are not occasional visitors — they are constant companions.</p><p><strong>Prayer:</strong> Lord, you are my shepherd. Help me to trust your leading even when the path is uncertain. Thank you that I shall not want.</p><p><strong>One Word:</strong> The Lord is my shepherd</p>",
    bibleText: "<p><sup>1</sup>The Lord is my shepherd; I shall not want.</p><p><sup>2</sup>He makes me lie down in green pastures. He leads me beside still waters.</p><p><sup>3</sup>He restores my soul. He leads me in paths of righteousness for his name's sake.</p><p><sup>4</sup>Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me.</p><p><sup>5</sup>You prepare a table before me in the presence of my enemies; you anoint my head with oil; my cup overflows.</p><p><sup>6</sup>Surely goodness and mercy shall follow me all the days of my life, and I shall dwell in the house of the Lord forever.</p>",
  },
  {
    slug: "blessed-are-the-poor-in-spirit",
    title: "Blessed Are the Poor in Spirit",
    date: "2026-03-05",
    passage: "Matthew 5:1-12",
    keyVerse: "Blessed are the poor in spirit, for theirs is the kingdom of heaven. — Matthew 5:3",
    author: "P. John Lee",
    body: "<p>Jesus opens the Sermon on the Mount with a series of beatitudes — blessings pronounced over those the world considers least blessed. The first and foundational beatitude is poverty of spirit: the recognition of our own spiritual bankruptcy before God.</p><p>To be poor in spirit is not to be weak or lacking in character. It is to see ourselves clearly — as creatures in need of a Creator, as sinners in need of a Savior. This is the starting point of all genuine discipleship.</p><p>The remarkable promise attached to this poverty is staggering: \"theirs is the kingdom of heaven.\" Not \"theirs will be\" but \"theirs is\" — present tense. The kingdom belongs to those who come empty-handed.</p><p><strong>Prayer:</strong> Father, strip away my self-sufficiency. Make me poor in spirit that I may receive your kingdom.</p><p><strong>One Word:</strong> Blessed are the poor in spirit</p>",
    bibleText: "<p><sup>1</sup>Seeing the crowds, he went up on the mountain, and when he sat down, his disciples came to him.</p><p><sup>2</sup>And he opened his mouth and taught them, saying:</p><p><sup>3</sup>\"Blessed are the poor in spirit, for theirs is the kingdom of heaven.</p><p><sup>4</sup>Blessed are those who mourn, for they shall be comforted.</p><p><sup>5</sup>Blessed are the meek, for they shall inherit the earth.</p><p><sup>6</sup>Blessed are those who hunger and thirst for righteousness, for they shall be satisfied.</p><p><sup>7</sup>Blessed are the merciful, for they shall receive mercy.</p><p><sup>8</sup>Blessed are the pure in heart, for they shall see God.</p><p><sup>9</sup>Blessed are the peacemakers, for they shall be called sons of God.</p><p><sup>10</sup>Blessed are those who are persecuted for righteousness' sake, for theirs is the kingdom of heaven.</p><p><sup>11</sup>Blessed are you when others revile you and persecute you and utter all kinds of evil against you falsely on my account.</p><p><sup>12</sup>Rejoice and be glad, for your reward is great in heaven, for so they persecuted the prophets who were before you.\"</p>",
  },
  {
    slug: "you-are-the-light-of-the-world",
    title: "You Are the Light of the World",
    date: "2026-03-06",
    passage: "Matthew 5:13-16",
    keyVerse: "You are the light of the world. A city set on a hill cannot be hidden. — Matthew 5:14",
    author: "P. David Yoon",
    body: "<p>Immediately after pronouncing the beatitudes, Jesus speaks identity over his disciples: \"You are the salt of the earth. You are the light of the world.\" These are declarative statements, not commands. Before Jesus tells us what to do, he tells us what we are.</p><p>Salt in the ancient world was a preservative and a flavor agent. Light is not for its own benefit but for those around it. Jesus calls his people to a life that blesses and illuminates the communities in which they live.</p><p>Importantly, Jesus says let your light shine — not make your light shine. A lamp doesn't strain to give light; it simply burns. Our calling is to remain connected to the source and to stop hiding what God has already lit within us.</p><p><strong>Prayer:</strong> Lord, let my life be a genuine light in my neighborhood, workplace, and campus. Let others see your goodness through me.</p><p><strong>One Word:</strong> Let your light shine before others</p>",
    bibleText: "<p><sup>13</sup>\"You are the salt of the earth, but if salt has lost its taste, how shall its saltiness be restored? It is no longer good for anything except to be thrown out and trampled under people's feet.</p><p><sup>14</sup>You are the light of the world. A city set on a hill cannot be hidden.</p><p><sup>15</sup>Nor do people light a lamp and put it under a basket, but on a stand, and it gives light to all in the house.</p><p><sup>16</sup>In the same way, let your light shine before others, so that they may see your good works and give glory to your Father who is in heaven.\"</p>",
  },
  {
    slug: "come-to-me-all-who-are-weary",
    title: "Come to Me, All Who Are Weary",
    date: "2026-03-07",
    passage: "Matthew 11:28-30",
    keyVerse: "Come to me, all who labor and are heavy laden, and I will give you rest. — Matthew 11:28",
    author: "P. Abraham Kim",
    body: "<p>In the middle of a chapter filled with debate and accusation, Jesus pauses and utters one of the most tender invitations in Scripture. \"Come to me.\" Not to a program, not to a set of rules — to a person. To Jesus himself.</p><p>The promise of rest is not the absence of difficulty, but the gift of a different kind of burden. Jesus's yoke is easy and his burden is light — not because the Christian life requires nothing, but because it is lived in partnership with the One who carries the weight with us.</p><p>The Greek word for \"rest\" here carries the sense of refreshment, of being restored. Jesus invites the burned-out, the overworked, the spiritually exhausted to come. The only qualification is weariness. Anyone who is heavy laden qualifies.</p><p><strong>Prayer:</strong> Jesus, I come to you today — tired, in need of rest. Teach me your gentleness and give me the rest only you can provide.</p><p><strong>One Word:</strong> Come to me and I will give you rest</p>",
    bibleText: "<p><sup>28</sup>Come to me, all who labor and are heavy laden, and I will give you rest.</p><p><sup>29</sup>Take my yoke upon you, and learn from me, for I am gentle and lowly in heart, and you will find rest for your souls.</p><p><sup>30</sup>For my yoke is easy, and my burden is light.\"</p>",
  },
  {
    slug: "for-god-so-loved-the-world",
    title: "For God So Loved the World",
    date: "2026-03-08",
    passage: "John 3:14-21",
    keyVerse: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life. — John 3:16",
    author: "P. John Lee",
    body: "<p>John 3:16 is sometimes so familiar it has lost its force. But read again in context — spoken to Nicodemus, a Pharisee who came to Jesus by night — the verse is explosive. The God of the universe loves not just Israel, not just the righteous, but the world.</p><p>The measure of this love is staggering: God gave his only Son. Not advice. Not a system. Not a prophet. His Son. The costliness of the gift reveals the depth of the love.</p><p>The condition is simply belief — not moral perfection, not religious pedigree, but trust in the one who was lifted up, as Moses lifted up the serpent in the wilderness. This is the gospel in miniature: look to Jesus and live.</p><p><strong>Prayer:</strong> Father, thank you for your love that gave everything. Help me to truly believe and to help others see your light.</p><p><strong>One Word:</strong> God so loved the world</p>",
    bibleText: "<p><sup>14</sup>And as Moses lifted up the serpent in the wilderness, so must the Son of Man be lifted up,</p><p><sup>15</sup>that whoever believes in him may have eternal life.</p><p><sup>16</sup>For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.</p><p><sup>17</sup>For God did not send his Son into the world to condemn the world, but in order that the world might be saved through him.</p><p><sup>18</sup>Whoever believes in him is not condemned, but whoever does not believe is condemned already, because he has not believed in the name of the only Son of God.</p><p><sup>19</sup>And this is the judgment: the light has come into the world, and people loved the darkness rather than the light because their works were evil.</p><p><sup>20</sup>For everyone who does wicked things hates the light and does not come to the light, lest his works should be exposed.</p><p><sup>21</sup>But whoever does what is true comes to the light, so that it may be clearly seen that his works have been carried out in God.</p>",
  },
  {
    slug: "i-am-the-vine",
    title: "I Am the Vine",
    date: "2026-03-09",
    passage: "John 15:1-11",
    keyVerse: "I am the vine; you are the branches. Whoever abides in me and I in him, he it is that bears much fruit, for apart from me you can do nothing. — John 15:5",
    author: "P. David Yoon",
    body: "<p>In the upper room, just hours before his arrest, Jesus speaks of vines and branches, of pruning and abiding. It is an image of intimate, organic union — not the relationship of a builder to a project, but of a vine to the branch that grows from it.</p><p>The key word in this passage is \"abide\" — repeated ten times in eleven verses. To abide is to remain, to stay, to make one's home. Christian fruitfulness is not the result of greater effort or better strategy; it is the natural overflow of remaining connected to the source.</p><p>The warning is stark: apart from Jesus, we can do nothing. Not a little — nothing. But the promise is equally stark: those who abide bear much fruit. Pruning is painful, but its purpose is greater fruitfulness, not punishment.</p><p><strong>Prayer:</strong> Lord Jesus, help me to abide in you today — in your word, in prayer, in community. Let my life bear fruit that lasts.</p><p><strong>One Word:</strong> Abide in me</p>",
    bibleText: "<p><sup>1</sup>\"I am the true vine, and my Father is the vinedresser.</p><p><sup>2</sup>Every branch in me that does not bear fruit he takes away, and every branch that does bear fruit he prunes, that it may bear more fruit.</p><p><sup>3</sup>Already you are clean because of the word that I have spoken to you.</p><p><sup>4</sup>Abide in me, and I in you. As the branch cannot bear fruit by itself, unless it abides in the vine, neither can you, unless you abide in me.</p><p><sup>5</sup>I am the vine; you are the branches. Whoever abides in me and I in him, he it is that bears much fruit, for apart from me you can do nothing.</p><p><sup>6</sup>If anyone does not abide in me he is thrown away like a branch and withers; and the branches are gathered, thrown into the fire, and burned.</p><p><sup>7</sup>If you abide in me, and my words abide in you, ask whatever you wish, and it will be done for you.</p><p><sup>8</sup>By this my Father is glorified, that you bear much fruit and so prove to be my disciples.</p><p><sup>9</sup>As the Father has loved me, so have I loved you. Abide in my love.</p><p><sup>10</sup>If you keep my commandments, you will abide in my love, just as I have kept my Father's commandments and abide in his love.</p><p><sup>11</sup>These things I have spoken to you, that my joy may be in you, and that your joy may be full.\"</p>",
  },
  {
    slug: "love-is-patient-love-is-kind",
    title: "Love Is Patient, Love Is Kind",
    date: "2026-03-10",
    passage: "1 Corinthians 13:1-13",
    keyVerse: "Love is patient and kind; love does not envy or boast; it is not arrogant or rude. — 1 Corinthians 13:4",
    author: "P. Abraham Kim",
    body: "<p>Writing to a church torn by factions, pride, and spiritual competition, Paul inserts his great hymn to love at the center of his argument. Without love, the most spectacular gifts — tongues of angels, prophetic powers, faith to move mountains — count for nothing.</p><p>Paul describes love not as a feeling but as a pattern of behavior: patient, kind, not envious, not boastful, not irritable. These are not ideals for perfect people; they are descriptions of what love does in difficult community — among competitive, proud, difficult people like the Corinthians, and like us.</p><p>The chapter ends with a triad: faith, hope, love — but the greatest is love. Love is greatest because it is the nature of God himself (1 John 4:8), and it is the one thing that abides even into eternity when faith becomes sight and hope becomes possession.</p><p><strong>Prayer:</strong> Father, grow in me the patience and kindness that are the marks of your love. Make me an agent of genuine love in my community.</p><p><strong>One Word:</strong> Love never fails</p>",
    bibleText: "<p><sup>1</sup>If I speak in the tongues of men and of angels, but have not love, I am a noisy gong or a clanging cymbal.</p><p><sup>2</sup>And if I have prophetic powers, and understand all mysteries and all knowledge, and if I have all faith, so as to remove mountains, but have not love, I am nothing.</p><p><sup>3</sup>If I give away all I have, and if I deliver up my body to be burned, but have not love, I gain nothing.</p><p><sup>4</sup>Love is patient and kind; love does not envy or boast; it is not arrogant</p><p><sup>5</sup>or rude. It does not insist on its own way; it is not irritable or resentful;</p><p><sup>6</sup>it does not rejoice at wrongdoing, but rejoices with the truth.</p><p><sup>7</sup>Love bears all things, believes all things, hopes all things, endures all things.</p><p><sup>8</sup>Love never ends. As for prophecies, they will pass away; as for tongues, they will cease; as for knowledge, it will pass away.</p><p><sup>9</sup>For we know in part and we prophesy in part,</p><p><sup>10</sup>but when the perfect comes, the partial will pass away.</p><p><sup>11</sup>When I was a child, I spoke like a child, I thought like a child, I reasoned like a child. When I became a man, I gave up childlike ways.</p><p><sup>12</sup>For now we see in a mirror dimly, but then face to face. Now I know in part; then I shall know fully, even as I have been fully known.</p><p><sup>13</sup>So now faith, hope, and love abide, these three; but the greatest of these is love.</p>",
  },
  { slug: "kiss-the-son", title: "Kiss The Son", date: "2026-03-11", passage: "Psalm 2:1-12", keyVerse: "12", author: "P. Abraham Kim", body: "<p>The kings of this world rule as if they could control the world. But in reality, the One enthroned in heaven has power over all things.</p><p>The author advises us to \"kiss the Son\" (12). Let us fear his greatness and rejoice in his victory over death.</p><p><strong>Prayer:</strong> Father, thank you for giving us your Son Jesus.</p><p><strong>One Word:</strong> Kiss the Son, Jesus</p>" },
]

// --- Events (recurring meetings only — matches Quick Links on live site) ---
const EVENTS = [
  { slug: "daily-bread-meeting", title: "Daily Bread & Prayer Meeting", type: "meeting", dateStart: "2026-02-01", startTime: "6:00 AM", endTime: "7:00 AM", location: "LA UBF Main Center", description: "Start your morning in the Word.", ministry: "church-wide", isRecurring: true, meetingUrl: "https://us02web.zoom.us/j/86540458764?pwd=ZDVUUjZDOVZ4WlJFc1VvNVlzd2tkQT09", recurrenceType: "weekly", recurrenceDays: ["MON", "TUE", "WED", "THU", "FRI"], recurrenceSchedule: "Mon-Fri @ 6 AM" },
  { slug: "evening-prayer-meeting", title: "Evening Prayer Meeting", type: "meeting", dateStart: "2026-02-01", startTime: "7:30 PM", endTime: "8:00 PM", location: "LA UBF Main Center", description: "A daily evening prayer meeting.", ministry: "church-wide", isRecurring: true, meetingUrl: "https://meet.google.com/pgm-trah-moc", recurrenceType: "daily", recurrenceDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"], recurrenceSchedule: "Every Day @ 7:30 PM" },
  { slug: "mens-bible-study", title: "Men's Bible Study", type: "meeting", dateStart: "2026-02-01", startTime: "8:00 AM", endTime: "10:00 AM", location: "LA UBF Main Center", description: "A weekly gathering for men to study Scripture.", ministry: "church-wide", isRecurring: true, recurrenceType: "weekly", recurrenceDays: ["SAT"], recurrenceSchedule: "Sat @ 8 AM" },
  { slug: "sunday-livestream", title: "Sunday Livestream", type: "meeting", dateStart: "2026-02-01", startTime: "11:00 AM", endTime: "12:30 PM", location: "LA UBF Main Center / YouTube Live", description: "Join our Sunday worship service in person or watch the livestream.", ministry: "church-wide", campus: "all", isRecurring: true, meetingUrl: "https://www.youtube.com/@LAUBF/streams", recurrenceType: "weekly", recurrenceDays: ["SUN"], recurrenceSchedule: "Sun @ 11 AM" },
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
  await prisma.role.deleteMany()
  await prisma.church.deleteMany()

  // ── 1. Create Church ──────────────────────────────────────
  console.log('Creating LA UBF church...')
  const church = await prisma.church.create({
    data: {
      name: 'LA UBF',
      slug: 'la-ubf',
      email: 'laubf.downey@gmail.com',
      phone: '(562) 396-6350',
      address: '11625 Paramount Blvd',
      city: 'Downey',
      state: 'CA',
      zipCode: '90241',
      country: 'US',
      timezone: 'America/Los_Angeles',
      locale: 'en-US',
      websiteUrl: 'https://laubf.org',
      facebookUrl: 'https://facebook.com/losangelesubf',
      instagramUrl: 'https://instagram.com/la.ubf',
      youtubeUrl: 'https://www.youtube.com/channel/UC1SRAeGrnVlvoEEMZ-htVlA',
      settings: {
        description: 'LA UBF (Los Angeles University Bible Fellowship) is a Bible-centered community raising lifelong disciples on college campuses and beyond.',
        emails: [{ label: 'General', value: 'laubf.downey@gmail.com' }],
        phones: [{ label: 'Main', value: '(562) 396-6350' }],
        worshipServices: [
          { day: 'Sunday', startTime: '11:00 AM', endTime: '12:30 PM', description: 'Sunday Worship Service' },
        ],
        extraSocialLinks: [
          { platform: 'tiktok', url: 'https://www.tiktok.com/@la.ubf' },
        ],
      },
    },
  })
  const churchId = church.id

  // ── 2. Create Speakers ────────────────────────────────────
  console.log('Creating speakers...')
  const speakerNames = new Set<string>()
  for (const m of MESSAGES) speakerNames.add(m.speaker)

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
  const SEED_SERIES = [
    'Sunday Service',
    'Wednesday Bible Study',
    'Conference',
    'Prayer Meeting',
    '16 Steps Bible Study',
  ]

  const seriesMap = new Map<string, string>() // name -> id
  for (const name of SEED_SERIES) {
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
  const archivedStudySlugs = new Set<string>() // slugs of archived studies
  const bsSeenSlugs = new Set<string>()
  for (const bs of BIBLE_STUDIES) {
    // Handle duplicate slugs
    let bsSlug = bs.slug
    if (bsSeenSlugs.has(bsSlug)) {
      const year = bs.dateFor.split('-')[0]
      bsSlug = `${bsSlug}-${year}`
      if (bsSeenSlugs.has(bsSlug)) bsSlug = `${bs.slug}-${bs.legacyId}`
    }
    bsSeenSlugs.add(bsSlug)

    // Look up extracted content for this entry
    const content = bibleStudyContent[String(bs.legacyId)]
    const questions = content?.questions || null
    const answers = content?.answers || null
    const transcript = content?.transcript || null

    // Archive studies with garbled WordPerfect content (questions field)
    const isArchived = bs.legacyId === 8773 // The Fall of Jericho — garbled questions from WP5.1 file
    const study = await prisma.bibleStudy.create({
      data: {
        churchId,
        legacyId: bs.legacyId,
        slug: bsSlug,
        title: bs.title,
        book: bs.book as any,
        passage: bs.passage,
        datePosted: new Date(bs.dateFor),
        dateFor: new Date(bs.dateFor),
        seriesId: seriesMap.get('Sunday Service') || null,
        speakerId: null,
        keyVerseRef: null,
        keyVerseText: null,
        questions,
        answers,
        transcript,
        bibleText: null,
        hasQuestions: !!questions,
        hasAnswers: !!answers,
        hasTranscript: !!transcript,
        status: isArchived ? 'ARCHIVED' : 'PUBLISHED',
        publishedAt: new Date(bs.dateFor),
      },
    })
    bibleStudyMap.set(bsSlug, study.id)
    if (isArchived) archivedStudySlugs.add(bsSlug)
    // Also map original slug for message matching
    if (bsSlug !== bs.slug && !bibleStudyMap.has(bs.slug)) {
      bibleStudyMap.set(bs.slug, study.id)
      if (isArchived) archivedStudySlugs.add(bs.slug)
    }
  }
  console.log(`  Created ${bsSeenSlugs.size} bible studies`)

  // ── 6b. Create Bible Study Attachments ─────────────────────
  console.log('Creating bible study attachments...')
  const R2_BASE = process.env.R2_ATTACHMENTS_PUBLIC_URL || process.env.R2_PUBLIC_URL || 'https://pub-59a92027daa648c8a02f226cb5873645.r2.dev'
  // Batch-fetch all attachment file sizes upfront (3-4 ListObjects requests vs thousands of HeadObject)
  const attSizeMap = await getR2AttachmentSizeMap()
  let attachmentCount = 0
  // Build legacyId -> study.id map for attachment lookup
  const legacyIdToStudyId = new Map<number, string>()
  for (const bs of BIBLE_STUDIES) {
    const sid = bibleStudyMap.get(bs.slug)
    if (sid) legacyIdToStudyId.set(bs.legacyId, sid)
  }
  for (const bs of BIBLE_STUDIES) {
    const studyId = legacyIdToStudyId.get(bs.legacyId)
    if (!studyId || !bs.attachments || bs.attachments.length === 0) continue
    for (let i = 0; i < bs.attachments.length; i++) {
      const att = bs.attachments[i]
      // Rewrite legacy URLs to R2 storage
      const filename = att.url.split('/').pop() || att.name
      const r2Key = `la-ubf/${bs.slug}/${filename}`
      const url = `${R2_BASE}/${r2Key}`
      // Derive attachment type from actual file extension
      const ext = filename.split('.').pop()?.toLowerCase() || ''
      const attType = ext === 'docx' ? 'DOCX' : ext === 'doc' ? 'DOC' : ext === 'rtf' ? 'RTF' : ext === 'pdf' ? 'PDF' : ext === 'ppt' || ext === 'pptx' ? 'OTHER' : 'DOC'
      // Look up file size from pre-fetched map
      const realSize = attSizeMap.get(r2Key) ?? null
      await prisma.bibleStudyAttachment.create({
        data: {
          bibleStudyId: studyId,
          name: att.name,
          url,
          type: attType as any,
          fileSize: realSize,
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
    // Match with bible study by slug
    const relatedStudyId = bibleStudyMap.get(msg.slug) || null
    const studyIsArchived = archivedStudySlugs.has(msg.slug)

    const hasVideo = !!msg.youtubeId
    const thumbnailUrl = msg.thumbnailUrl || (msg.youtubeId
      ? `https://img.youtube.com/vi/${msg.youtubeId}/maxresdefault.jpg`
      : null)

    const created = await prisma.message.create({
      data: {
        churchId,
        legacyId: msg.legacyId,
        slug: msg.slug,
        title: msg.title,
        passage: msg.passage,
        bibleVersion: 'ESV',
        speakerId: speakerMap.get(msg.speaker) || null,
        dateFor: new Date(msg.dateFor),
        videoUrl: msg.youtubeId ? `https://www.youtube.com/watch?v=${msg.youtubeId}` : null,
        youtubeId: msg.youtubeId,
        thumbnailUrl,
        hasVideo,
        hasStudy: !!relatedStudyId && !studyIsArchived,
        relatedStudyId,
        publishedAt: new Date(msg.dateFor),
      },
    })

    // Create MessageSeries join record — all seeded messages go under Sunday Service
    const seriesId = seriesMap.get('Sunday Service')
    if (seriesId) {
      await prisma.messageSeries.create({
        data: {
          messageId: created.id,
          seriesId,
          sortOrder: messageCount,
        },
      })
    }

    messageCount++
  }
  console.log(`  Created ${messageCount} messages`)

  // ── 7b. Create/Merge Messages for Bible Studies without Videos ──
  // Bible studies that matched a video by slug were already linked in step 7.
  // For remaining bible studies, either merge into an existing video message
  // on the same date+passage, or create a new study-only message.
  console.log('Creating/merging study-only messages...')
  const existingMessageSlugs = new Set(MESSAGES.map(m => m.slug))

  // Build lookup: "date|passage" -> message id (for video messages without a study)
  const datePsgToMsg = new Map<string, { id: string; title: string }>()
  for (const msg of MESSAGES) {
    const relatedStudyId = bibleStudyMap.get(msg.slug) || null
    if (msg.youtubeId && !relatedStudyId) {
      const key = `${msg.dateFor}|${msg.passage || ''}`
      datePsgToMsg.set(key, { id: msg.slug, title: msg.title })
    }
  }

  let studyOnlyCount = 0
  let mergedCount = 0
  for (const bs of BIBLE_STUDIES) {
    // Skip if a message already exists for this slug (linked in step 7)
    if (existingMessageSlugs.has(bs.slug)) continue
    // Skip if no bible study was created (e.g. null book filtered out)
    const relatedStudyId = bibleStudyMap.get(bs.slug)
    if (!relatedStudyId) continue

    // Try to merge into existing video message on same date + passage
    const datePsgKey = `${bs.dateFor}|${bs.passage || ''}`
    const existingVideoMsg = datePsgToMsg.get(datePsgKey)
    if (existingVideoMsg) {
      // Merge: update the video message to also have the study
      const videoMsg = await prisma.message.findUnique({
        where: { churchId_slug: { churchId, slug: existingVideoMsg.id } },
        select: { id: true, title: true },
      })
      if (videoMsg) {
        const studyArchived = archivedStudySlugs.has(bs.slug)
        const titlesMatch = videoMsg.title.trim().toLowerCase() === bs.title.trim().toLowerCase()
        await prisma.message.update({
          where: { id: videoMsg.id },
          data: {
            hasStudy: !studyArchived,
            relatedStudyId,
            // Bible study title becomes primary; video gets alternate title
            title: bs.title,
            videoTitle: titlesMatch ? null : videoMsg.title,
          },
        })
        datePsgToMsg.delete(datePsgKey) // prevent double-merge
        mergedCount++
        continue
      }
    }

    // No matching video — create a standalone study-only message
    let msgSlug = bs.slug
    const bsYear = bs.dateFor.split('-')[0]
    const existingMsg = await prisma.message.findUnique({
      where: { churchId_slug: { churchId, slug: msgSlug } },
      select: { id: true },
    })
    if (existingMsg) {
      msgSlug = `${bs.slug}-${bsYear}`
      const existingMsg2 = await prisma.message.findUnique({
        where: { churchId_slug: { churchId, slug: msgSlug } },
        select: { id: true },
      })
      if (existingMsg2) {
        msgSlug = `${bs.slug}-study-${bs.legacyId}`
      }
    }

    const studyArchived = archivedStudySlugs.has(bs.slug)
    const created = await prisma.message.create({
      data: {
        churchId,
        slug: msgSlug,
        title: bs.title,
        passage: bs.passage,
        bibleVersion: 'ESV',
        speakerId: null,
        dateFor: new Date(bs.dateFor),
        hasVideo: false,
        hasStudy: !studyArchived,
        relatedStudyId,
        publishedAt: new Date(bs.dateFor),
      },
    })

    // Add to Sunday Service series
    const sundaySeriesId = seriesMap.get('Sunday Service')
    if (sundaySeriesId) {
      await prisma.messageSeries.create({
        data: {
          messageId: created.id,
          seriesId: sundaySeriesId,
          sortOrder: messageCount + studyOnlyCount,
        },
      })
    }

    studyOnlyCount++
  }
  console.log(`  Merged ${mergedCount} studies into video messages, created ${studyOnlyCount} study-only messages`)

  // ── 7c. Merge remaining duplicates by date+passage ──────────
  // Some entries couldn't be merged in 7b because:
  // - Video already had a study linked by slug, but a different study exists for same date+passage
  // - Two study-only entries exist for same date+passage
  // Do a final pass to merge any remaining duplicates.
  console.log('Merging remaining date+passage duplicates...')
  const allMsgs = await prisma.message.findMany({
    where: { churchId, deletedAt: null },
    include: { messageSeries: true },
    orderBy: { dateFor: 'desc' },
  })
  const dpGroups = new Map<string, typeof allMsgs>()
  for (const m of allMsgs) {
    const key = m.dateFor.toISOString().slice(0, 10) + '|' + (m.passage || '')
    const arr = dpGroups.get(key) || []
    arr.push(m)
    dpGroups.set(key, arr)
  }
  let dedupeCount = 0
  for (const [, items] of dpGroups) {
    if (items.length < 2) continue
    // Sort: prefer entries with video, then with study, then with speaker
    items.sort((a, b) => {
      if (a.hasVideo !== b.hasVideo) return a.hasVideo ? -1 : 1
      if (a.hasStudy !== b.hasStudy) return a.hasStudy ? -1 : 1
      if (a.speakerId !== b.speakerId) return a.speakerId ? -1 : 1
      return 0
    })
    const keep = items[0]
    for (let i = 1; i < items.length; i++) {
      const remove = items[i]
      // Both have video = genuinely different entries (e.g. Part 1/Part 2)
      if (keep.hasVideo && remove.hasVideo) continue
      // Transfer speaker if keep doesn't have one
      const updates: Record<string, any> = {}
      if (!keep.speakerId && remove.speakerId) updates.speakerId = remove.speakerId
      if (Object.keys(updates).length > 0) {
        await prisma.message.update({ where: { id: keep.id }, data: updates })
      }
      // Transfer series
      for (const ms of remove.messageSeries) {
        const exists = keep.messageSeries.some(k => k.seriesId === ms.seriesId)
        if (!exists) {
          await prisma.messageSeries.create({
            data: { messageId: keep.id, seriesId: ms.seriesId, sortOrder: ms.sortOrder },
          })
        }
      }
      // Clean up remove
      await prisma.messageSeries.deleteMany({ where: { messageId: remove.id } })
      if (remove.relatedStudyId) {
        await prisma.message.update({ where: { id: remove.id }, data: { relatedStudyId: null, hasStudy: false } })
      }
      await prisma.message.update({ where: { id: remove.id }, data: { deletedAt: new Date() } })
      dedupeCount++
    }
  }
  console.log(`  Deduplicated ${dedupeCount} remaining entries`)

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
      logoUrl: `${CDN}/laubf-logo.svg`,
      logoDarkUrl: '/logo/laubf-logo-blue.svg',
      logoAlt: 'LA UBF',
      faviconUrl: '/favicon.ico',
      contactEmail: 'laubf.downey@gmail.com',
      contactPhone: '(562) 396-6350',
      contactAddress: '11625 Paramount Blvd, Downey, CA 90241',
      instagramUrl: 'https://instagram.com/la.ubf',
      facebookUrl: 'https://facebook.com/losangelesubf',
      youtubeUrl: 'https://www.youtube.com/channel/UC1SRAeGrnVlvoEEMZ-htVlA',
      tiktokUrl: 'https://www.tiktok.com/@la.ubf',
      serviceTimes: [
        { day: 'Sunday', time: '11:00 AM – 12:30 PM', label: 'Sunday Worship Service' },
        { day: 'Monday-Friday', time: '6:00 AM', label: 'Daily Bread & Prayer Meeting' },
        { day: 'Daily', time: '7:30 PM', label: 'Evening Prayer Meeting' },
        { day: 'Saturday', time: '8:00 AM', label: "Men's Bible Study" },
      ],
      enableSearch: true,
      enableGiving: false,
      enableBlog: false,
      navCtaLabel: "I'm New",
      navCtaHref: '/im-new',
      navCtaVisible: true,
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
    { label: 'LA UBF YouTube', href: 'https://www.youtube.com/channel/UC1SRAeGrnVlvoEEMZ-htVlA' },
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
          backgroundImage: { src: `${CDN}/compressed-hero-vid.mp4`, alt: 'LA UBF community gathering' },
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
            { src: `${CDN}/images-home-rotatingwheel-compressed-bible-study.png`, alt: 'Bible study' },
            { src: `${CDN}/images-home-rotatingwheel-compressed-campus-ministry-list.png`, alt: 'Campus ministry' },
            { src: `${CDN}/images-home-rotatingwheel-compressed-campus-ministry.jpg`, alt: 'Campus ministry' },
            { src: `${CDN}/images-home-rotatingwheel-compressed-event-christmas.png`, alt: 'Christmas event' },
            { src: `${CDN}/images-home-rotatingwheel-compressed-fellowship.jpg`, alt: 'Fellowship' },
            { src: `${CDN}/images-home-rotatingwheel-compressed-sunday-worship.jpg`, alt: 'Sunday worship' },
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
          includeRecurring: false,
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
            { id: 'ns-1', title: 'Sunday Worship', description: 'Join us every Sunday for worship, teaching, and fellowship with believers.', imageUrl: `${CDN}/images-home-compressed-sunday-worship.jpg`, imageAlt: 'Sunday worship service' },
            { id: 'ns-2', title: 'College Campus Ministries', description: 'Connect with other students on your campus for Bible study and community.', imageUrl: `${CDN}/images-home-compressed-campus-ministry.jpg`, imageAlt: 'Campus ministry gathering' },
            { id: 'ns-3', title: 'Personal Bible Studies', description: 'Study the Bible one-on-one with a mentor at a time that works for you.', imageUrl: `${CDN}/images-home-compressed-bible-study.png`, imageAlt: 'One-on-one Bible study' },
            { id: 'ns-4', title: 'Fellowship', description: 'Build lasting friendships through shared meals, activities, and life together.', imageUrl: `${CDN}/images-home-compressed-fellowship.jpg`, imageAlt: 'Fellowship dinner' },
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
          image: { src: `${CDN}/images-home-compressed-campus-ministry-list.png`, alt: 'Campus ministry students' },
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
          backgroundImage: { src: `${CDN}/compressed-visit-us.jpg`, alt: 'LA UBF community' },
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
          image: { src: `${CDN}/images-who%20we%20are-compressed-header.jpg`, alt: 'LA UBF community gathering' },
        },
      },
      {
        sectionType: 'ABOUT_DESCRIPTION',
        label: 'About UBF',
        colorScheme: 'DARK',
        content: {
          logoSrc: `${CDN}/laubf-logo-blue.svg`,
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
            { title: 'Bible Study', description: 'We help students study the Bible so they may come to know God personally, understand themselves, and find purpose in Jesus Christ. Bible studies are offered one-to-one with a mentor or in small groups centered around campuses and shared interests.', images: [{ src: `${CDN}/compressed-bible%20study.jpg`, alt: 'Bible study session' }] },
            { title: 'Discipleship', description: 'We walk with students as they grow as disciples of Jesus through shared life and discipleship training. Our goal is to equip students to mature in faith and become disciple makers who help others follow Christ.', images: [{ src: `${CDN}/compressed-discipleship.jpg`, alt: 'Discipleship gathering' }] },
            { title: 'Fellowship', description: 'Fellowship is an essential part of our faith as we support and encourage one another in community. We share fellowship through Sunday worship, activities, and retreats as we grow together in Christ.', images: [{ src: `${CDN}/images-who%20we%20are-compressed-fellowship.jpg`, alt: 'Fellowship meal' }] },
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
          image: { src: `${CDN}/images-home-compressed-sunday-worship.jpg`, alt: 'Sunday worship at LA UBF' },
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
          image: { src: `${CDN}/compressed-congregation.jpg`, alt: 'LA UBF community gathering' },
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
            { title: 'Young Adults', description: 'A community of college students and young professionals growing together through campus Bible studies, fellowship, and shared worship.', images: [{ src: `${CDN}/compressed-young%20adults.jpg`, alt: 'Young adults Bible study' }], button: { label: 'Learn more', href: '/ministries/college' } },
            { title: 'Adults', description: 'Adults from many walks of life\u2014campus leaders, Bible teachers, parents, and missionaries\u2014growing in faith through personal and group Bible study, conferences, and outreach.', images: [{ src: `${CDN}/compressed-adults.webp`, alt: 'Adult fellowship' }], button: { label: 'Learn more', href: '/ministries/adults' } },
            { title: 'Middle & High School\n(HBF / JBF)', description: 'Our youth ministries for middle and high school students, with engaging Bible studies, fun fellowship activities, and a supportive community during these formative years.', images: [{ src: `${CDN}/compressed-middle%20n%20high.jpg`, alt: 'HBF JBF students' }], button: { label: 'Learn more', href: '/ministries/high-school' } },
            { title: 'Children (CBF)', description: "A safe, engaging, and age-appropriate environment where children can learn about God\u2019s Word and build friendships while growing in faith.", images: [{ src: `${CDN}/compressed-children.webp`, alt: 'Children Bible fellowship' }], button: { label: 'Learn more', href: '/ministries/children' } },
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
            { src: `${CDN}/images-ministries-join-campus-ministry-section-compressed-1.jpg`, alt: 'Campus group photo' },
            { src: `${CDN}/images-ministries-join-campus-ministry-section-compressed-2.jpg`, alt: 'Bible study outdoors' },
            { src: `${CDN}/compressed-3.png`, alt: 'Fellowship event' },
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
          image: { src: `${CDN}/images-home-compressed-sunday-worship.jpg`, alt: 'Sunday worship at LA UBF' },
        },
      },
    ],
  )
  console.log('  Created ministries page')

  // Shared campus card grid content
  const sharedCampusGrid = {
    decorativeImages: [
      { src: `${CDN}/images-ministries-join-campus-ministry-section-compressed-1.jpg`, alt: 'Campus group photo' },
      { src: `${CDN}/images-ministries-join-campus-ministry-section-compressed-2.jpg`, alt: 'Bible study outdoors' },
      { src: `${CDN}/compressed-3.png`, alt: 'Fellowship event' },
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
    image: { src: `${CDN}/images-home-compressed-sunday-worship.jpg`, alt: 'Sunday worship at LA UBF' },
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
          heroImage: { src: `${CDN}/compressed-young%20adults.jpg`, alt: 'Young adult and college ministry group' },
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
          image: { src: `${CDN}/compressed-yam.png`, alt: 'Young adult ministry fellowship' },
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
            { title: 'Fellowship', description: 'Our young adult fellowship is a space to build authentic friendships and grow together. From shared meals to group outings, we create opportunities for meaningful connection and community among college students and young professionals.', images: [{ src: `${CDN}/compressed-fellowship.png`, alt: 'Young adult fellowship' }] },
            { title: 'Discipleship Training', description: "Through personal and group Bible study, we help young adults develop a strong foundation in God\u2019s Word. Our discipleship training equips students to grow as leaders, mentors, and faithful followers of Christ.", images: [{ src: `${CDN}/DSC05299.jpg`, alt: 'Discipleship training' }] },
            { title: 'Serving Opportunities', description: "We believe in learning by serving. Young adults have the opportunity to serve through campus outreach, community events, conferences, and supporting the church\u2019s mission locally and beyond.", images: [{ src: `${CDN}/images-ministries-young%20adults-compressed-serving.jpg`, alt: 'Serving opportunities' }] },
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
            { src: `${CDN}/images-ministries-young%20adults-carousel-compressed-1.jpg`, alt: 'YAM moment 1' },
            { src: `${CDN}/images-ministries-young%20adults-carousel-compressed-2.jpg`, alt: 'YAM moment 2' },
            { src: `${CDN}/compressed-3.jpg`, alt: 'YAM moment 3' },
            { src: `${CDN}/compressed-4.jpg`, alt: 'YAM moment 4' },
            { src: `${CDN}/compressed-5.jpg`, alt: 'YAM moment 5' },
            { src: `${CDN}/compressed-6.jpg`, alt: 'YAM moment 6' },
            { src: `${CDN}/compressed-7.jpg`, alt: 'YAM moment 7' },
            { src: `${CDN}/compressed-8.jpg`, alt: 'YAM moment 8' },
            { src: `${CDN}/compressed-9.jpg`, alt: 'YAM moment 9' },
            { src: `${CDN}/compressed-10.jpg`, alt: 'YAM moment 10' },
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
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Team member' } },
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05299.jpg`, alt: 'Team member' } },
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC01195.jpg`, alt: 'Team member' } },
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
          heroImage: { src: `${CDN}/compressed-adults.webp`, alt: 'Adult ministry worship service' },
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
          image: { src: `${CDN}/images-ministries-adults-compressed-introduction.jpg`, alt: 'Adult ministry group photo' },
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
            { title: 'Growing in Faith', description: "Adult ministry includes opportunities for Bible study, prayer, and spiritual growth to be built up and be established in God\u2019s grace, devotionals, and shared learning, adults grow together in the Word.", images: [{ src: `${CDN}/compressed-growing.jpg`, alt: 'Growing in faith' }] },
            { title: 'Raising Disciples', description: "Many adults learn to grow in leadership, mentoring, teaching personal Bible studies, or guiding others in faith. Teaching helps to grow in understanding by sharing God\u2019s Word with others. Key to our ministry is raising others as lifelong disciples of Christ.", images: [{ src: `${CDN}/compressed-disciples.jpg`, alt: 'Raising disciples' }] },
            { title: 'Serving & Mission', description: "Adults take part and serve together through short-term and long-term service opportunities, seasonal conferences, campus outreach, and opportunities to support the church\u2019s mission in various mission fields and beyond.", images: [{ src: `${CDN}/images-ministries-adults-compressed-serving.jpg`, alt: 'Serving and mission' }] },
            { title: 'Community & Fellowship', description: 'Adult ministry is also a place to build relationships through simple shared meals as a church, joyful worship, time spent together at various studies, and fellowship time together as a church community.', images: [{ src: `${CDN}/DSC01195.jpg`, alt: 'Community fellowship' }] },
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
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Team member' } },
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05299.jpg`, alt: 'Team member' } },
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC01195.jpg`, alt: 'Team member' } },
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
          heroImage: { src: `${CDN}/images-ministries-middle%20n%20high-compressed-header.jpg`, alt: 'Middle and high school ministry group photo' },
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
          image: { src: `${CDN}/images-ministries-middle%20n%20high-compressed-introduction.jpg`, alt: 'JBF and HBF youth ministry' },
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
            { title: 'Praise Night', description: "Praise Night is a time for our youth to come together in worship through music, prayer, and fellowship. It\u2019s an uplifting experience where students can express their faith and grow closer to God and each other.", images: [{ src: `${CDN}/compressed-praise%20night.jpg`, alt: 'Youth praise night' }] },
            { title: 'Fellowship', description: 'Fellowship activities give our youth the opportunity to build friendships, have fun, and strengthen their bonds within the church community through games, outings, and shared experiences.', images: [{ src: `${CDN}/images-ministries-middle%20n%20high-compressed-fellowship.jpg`, alt: 'Youth fellowship' }] },
            { title: 'Youth Conference', description: "Our annual Youth Conference brings together students for an immersive experience of worship, Bible study, and community. It\u2019s a highlight of the year where young people are inspired and challenged in their faith.", images: [{ src: `${CDN}/compressed-jbfhbf%20conference.jpg`, alt: 'Youth conference' }] },
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
            { src: `${CDN}/images-ministries-middle%20n%20high-compressed-header.jpg`, alt: 'Youth ministry moment 1' },
            { src: `${CDN}/images-ministries-middle%20n%20high-compressed-introduction.jpg`, alt: 'Youth ministry moment 2' },
            { src: `${CDN}/compressed-praise%20night.jpg`, alt: 'Youth ministry moment 3' },
            { src: `${CDN}/images-ministries-middle%20n%20high-compressed-fellowship.jpg`, alt: 'Youth ministry moment 4' },
            { src: `${CDN}/compressed-jbfhbf%20conference.jpg`, alt: 'Youth ministry moment 5' },
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
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Team member' } },
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05299.jpg`, alt: 'Team member' } },
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC01195.jpg`, alt: 'Team member' } },
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
          heroImage: { src: `${CDN}/compressed-children.webp`, alt: 'Children ministry group photo' },
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
          image: { src: `${CDN}/compressed-introduction.png`, alt: 'Children bible fellowship' },
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
          directionsUrl: 'https://maps.google.com/?q=11625+Paramount+Boulevard+Downey+CA',
          image: { src: `${CDN}/compressed-service.png`, alt: 'Children sunday service' },
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
            { title: 'Singspiration', description: "Singspiration is a time for children to sing, dance, and share music\u2019s simple joy. It helps them learn about God\u2019s love through song, building worship skills early on.", images: [{ src: `${CDN}/compressed-singspiration.jpg`, alt: 'Children singspiration' }] },
            { title: "Children\u2019s Bible Class", description: "In Children\u2019s Bible Class, kids learn about the Bible through lessons designed to be fun, interactive, and easy to understand for their age.", images: [{ src: `${CDN}/compressed-class.jpg`, alt: 'Children bible class' }] },
            { title: 'Child Care During Sunday Service', description: 'We also offer child care during the Sunday worship service, providing a safe and engaging space for children so parents can attend the adult service with peace of mind.', images: [{ src: `${CDN}/compressed-child%20care.jpg`, alt: 'Child care during service' }] },
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
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Team member' } },
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05299.jpg`, alt: 'Team member' } },
            { name: 'Leader name', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC01195.jpg`, alt: 'Team member' } },
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
      { src: `${CDN}/images-ministries-join-campus-ministry-section-compressed-1.jpg`, alt: 'Campus group photo' },
      { src: `${CDN}/images-ministries-join-campus-ministry-section-compressed-2.jpg`, alt: 'Bible study outdoors' },
      { src: `${CDN}/compressed-3.png`, alt: 'Fellowship event' },
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
          heroImage: { src: `${CDN}/compressed-lbcc-truevineclub.jpg`, alt: 'LBCC True Vine Club campus ministry' },
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
            { name: 'William Larsen', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'William Larsen' } },
            { name: 'Troy Segale', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05299.jpg`, alt: 'Troy Segale' } },
            { name: 'Joey Fishman', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC01195.jpg`, alt: 'Joey Fishman' } },
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
          heroImage: { src: `${CDN}/compressed-hero.jpg`, alt: 'CSULB True Vine Club campus ministry' },
        },
      },
      {
        sectionType: 'MINISTRY_INTRO',
        label: 'CSULB Intro',
        colorScheme: 'LIGHT',
        content: {
          overline: 'INTRODUCTION',
          heading: 'About the Ministry',
          description: 'Join our campus Bible study community. We gather regularly to study the Word of God together, build meaningful friendships, and grow as disciples of Jesus Christ.',
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
            { name: 'Robert Fishman', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Robert Fishman' } },
            { name: 'Jorge Lau', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05299.jpg`, alt: 'Jorge Lau' } },
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
          description: 'Join our campus Bible study community. We gather regularly to study the Word of God together, build meaningful friendships, and grow as disciples of Jesus Christ.',
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
            { name: 'Daniel Shim', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Daniel Shim' } },
            { name: 'Joseph Cho', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05299.jpg`, alt: 'Joseph Cho' } },
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
          description: 'Join our campus Bible study community. We gather regularly to study the Word of God together, build meaningful friendships, and grow as disciples of Jesus Christ.',
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
            { name: 'Peace Oh', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Peace Oh' } },
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
          description: 'Join our campus Bible study community. We gather regularly to study the Word of God together, build meaningful friendships, and grow as disciples of Jesus Christ.',
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
            { name: 'David Park', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'David Park' } },
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
          description: 'Join our campus Bible study community. We gather regularly to study the Word of God together, build meaningful friendships, and grow as disciples of Jesus Christ.',
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
            { name: 'Augustine Kim', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Augustine Kim' } },
            { name: 'Paul Lim', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05299.jpg`, alt: 'Paul Lim' } },
            { name: 'Moses Han', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC01195.jpg`, alt: 'Moses Han' } },
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
          description: 'Join our campus Bible study community. We gather regularly to study the Word of God together, build meaningful friendships, and grow as disciples of Jesus Christ.',
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
            { name: 'Paul Lim', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Paul Lim' } },
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
          description: 'Join our campus Bible study community. We gather regularly to study the Word of God together, build meaningful friendships, and grow as disciples of Jesus Christ.',
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
            { name: 'Jason Koch', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Jason Koch' } },
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
          description: 'Join our campus Bible study community. We gather regularly to study the Word of God together, build meaningful friendships, and grow as disciples of Jesus Christ.',
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
            { name: 'Frank Holman', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Frank Holman' } },
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
          description: 'Join our campus Bible study community. We gather regularly to study the Word of God together, build meaningful friendships, and grow as disciples of Jesus Christ.',
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
            { name: 'David Cho', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'David Cho' } },
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
          description: 'Join our campus Bible study community. We gather regularly to study the Word of God together, build meaningful friendships, and grow as disciples of Jesus Christ.',
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
            { name: 'Andrew Cuevas', role: '', bio: 'Bio here', image: { src: `${CDN}/DSC05222.jpg`, alt: 'Andrew Cuevas' } },
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
            { src: `${CDN}/compressed-baptism.jpg`, alt: 'Baptism', width: 219, height: 146 },
            { src: `${CDN}/compressed-beach%20camp.jpg`, alt: 'Beach camp', width: 186, height: 133 },
            { src: `${CDN}/compressed-face%20paint.jpg`, alt: 'Community event', width: 311, height: 249 },
            { src: `${CDN}/compressed-josh.jpg`, alt: 'Fellowship', width: 133, height: 106 },
            { src: `${CDN}/compressed-sports.jpg`, alt: 'Sports fellowship', width: 216, height: 144 },
            { src: `${CDN}/compressed-worship.jpg`, alt: 'Worship service', width: 288, height: 199 },
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
          imageSrc: `${CDN}/compressed-visit-us.jpg`,
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
          directionsUrl: 'https://maps.google.com/?q=11625+Paramount+Boulevard+Downey+CA',
          directionsLabel: 'Get Directions',
          images: [{ src: `${CDN}/compressed-laubf-location.png`, alt: 'LA UBF building exterior' }],
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
            { src: `${CDN}/images-ministries-join-campus-ministry-section-compressed-1.jpg`, alt: 'Campus group photo' },
            { src: `${CDN}/images-ministries-join-campus-ministry-section-compressed-2.jpg`, alt: 'Bible study outdoors' },
            { src: `${CDN}/compressed-3.png`, alt: 'Fellowship event' },
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

  // --- People (speakers only, extracted from message data) ---
  // All Person records are derived from actual speakers in the MESSAGES data.
  // "William" is an alias for "William Larsen"; "Paul" is ambiguous but treated as its own entry.
  const speakerPersonData: { name: string; slug: string; firstName: string; lastName: string; title?: string; bio?: string }[] = [
    { name: 'William Larsen', slug: 'william-larsen', firstName: 'William', lastName: 'Larsen', title: 'Senior Pastor', bio: 'Pastor William Larsen has served as the senior shepherd of LA UBF since its founding. He leads the Sunday worship service and weekly Bible study.' },
    { name: 'John Kwon', slug: 'john-kwon', firstName: 'John', lastName: 'Kwon', title: 'Associate Pastor' },
    { name: 'David Park', slug: 'david-park', firstName: 'David', lastName: 'Park', title: 'Associate Pastor' },
    { name: 'Robert Fishman', slug: 'robert-fishman', firstName: 'Robert', lastName: 'Fishman', title: 'Campus Minister' },
    { name: 'Ron Ward', slug: 'ron-ward', firstName: 'Ron', lastName: 'Ward', title: 'Bible Teacher' },
    { name: 'Troy Segale', slug: 'troy-segale', firstName: 'Troy', lastName: 'Segale', title: 'Campus Minister' },
    { name: 'Frank Holman', slug: 'frank-holman', firstName: 'Frank', lastName: 'Holman', title: 'Bible Teacher' },
    { name: 'David Min', slug: 'david-min', firstName: 'David', lastName: 'Min', title: 'Bible Teacher' },
    { name: 'Paul Im', slug: 'paul-im', firstName: 'Paul', lastName: 'Im', title: 'Bible Teacher' },
    { name: 'Paul Lim', slug: 'paul-lim', firstName: 'Paul', lastName: 'Lim', title: 'Bible Teacher' },
    { name: 'John Baik', slug: 'john-baik', firstName: 'John', lastName: 'Baik', title: 'Bible Teacher' },
    { name: 'Moses Yoon', slug: 'moses-yoon', firstName: 'Moses', lastName: 'Yoon', title: 'Bible Teacher' },
    { name: 'Timothy Cho', slug: 'timothy-cho', firstName: 'Timothy', lastName: 'Cho', title: 'Bible Teacher' },
    { name: 'James Park', slug: 'james-park', firstName: 'James', lastName: 'Park', title: 'Bible Teacher' },
    { name: 'Andrew Cuevas', slug: 'andrew-cuevas', firstName: 'Andrew', lastName: 'Cuevas', title: 'Bible Teacher' },
    { name: 'Joshua Lopez', slug: 'joshua-lopez', firstName: 'Joshua', lastName: 'Lopez', title: 'Bible Teacher' },
    { name: 'Juan Perez', slug: 'juan-perez', firstName: 'Juan', lastName: 'Perez', title: 'Bible Teacher' },
    { name: 'Jason Koch', slug: 'jason-koch', firstName: 'Jason', lastName: 'Koch', title: 'Bible Teacher' },
    { name: 'Isiah Pulido', slug: 'isiah-pulido', firstName: 'Isiah', lastName: 'Pulido', title: 'Bible Teacher' },
    // "William" and "Paul" are short aliases used in legacy data; they map to existing speakers
    // but are kept as Speaker records so the Speaker table matches them by name.
    // They do NOT get separate Person records (handled by Speaker table only).
  ]

  const personRecords: Record<string, string> = {}
  for (const sp of speakerPersonData) {
    const person = await prisma.person.upsert({
      where: { churchId_slug: { churchId, slug: sp.slug } },
      update: { title: sp.title, bio: sp.bio },
      create: {
        churchId,
        slug: sp.slug,
        firstName: sp.firstName,
        lastName: sp.lastName,
        title: sp.title,
        bio: sp.bio,
        membershipStatus: 'MEMBER',
        source: 'Speaker from message data',
      },
    })
    personRecords[sp.slug] = person.id
  }
  console.log(`  Created ${Object.keys(personRecords).length} people (speakers only)`)

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

  // Add speakers to Sunday Bible Study group
  const sundayBibleStudyMembers: [string, 'LEADER' | 'CO_LEADER' | 'MEMBER'][] = [
    ['william-larsen', 'LEADER'], ['john-kwon', 'CO_LEADER'], ['david-park', 'MEMBER'],
    ['robert-fishman', 'MEMBER'], ['ron-ward', 'MEMBER'], ['frank-holman', 'MEMBER'],
    ['troy-segale', 'MEMBER'], ['david-min', 'MEMBER'],
  ]
  for (const [slug, role] of sundayBibleStudyMembers) {
    await prisma.personGroupMember.create({
      data: { groupId: sundayBibleStudy.id, personId: personRecords[slug], role },
    })
  }

  const worshipTeamMembers: [string, 'LEADER' | 'CO_LEADER' | 'MEMBER'][] = [
    ['john-kwon', 'LEADER'], ['troy-segale', 'MEMBER'], ['joshua-lopez', 'MEMBER'], ['andrew-cuevas', 'MEMBER'],
  ]
  for (const [slug, role] of worshipTeamMembers) {
    await prisma.personGroupMember.create({
      data: { groupId: worshipTeam.id, personId: personRecords[slug], role },
    })
  }
  console.log('  Created 2 groups with members assigned')

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

  await prisma.customFieldDefinition.create({
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

  await prisma.customFieldDefinition.create({
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

  // Set some custom field values for speakers
  await prisma.customFieldValue.create({ data: { personId: personRecords['william-larsen'], fieldDefinitionId: emergencyContactField.id, value: 'Church Office' } })
  await prisma.customFieldValue.create({ data: { personId: personRecords['william-larsen'], fieldDefinitionId: emergencyPhoneField.id, value: '562-396-6350' } })
  console.log('  Created custom field values')

  // --- Person Tags ---
  const tagAssignments: [string, string[]][] = [
    ['william-larsen', ['shepherd', 'bible-teacher', 'leader']],
    ['john-kwon', ['shepherd', 'bible-teacher', 'leader']],
    ['david-park', ['shepherd', 'bible-teacher', 'leader']],
    ['robert-fishman', ['campus-minister', 'bible-teacher']],
    ['ron-ward', ['bible-teacher']],
    ['troy-segale', ['campus-minister', 'bible-teacher']],
    ['frank-holman', ['bible-teacher']],
    ['david-min', ['bible-teacher']],
    ['paul-im', ['bible-teacher']],
    ['paul-lim', ['bible-teacher']],
    ['john-baik', ['bible-teacher']],
    ['moses-yoon', ['bible-teacher']],
    ['timothy-cho', ['bible-teacher']],
    ['james-park', ['bible-teacher']],
    ['andrew-cuevas', ['bible-teacher']],
    ['joshua-lopez', ['bible-teacher']],
    ['juan-perez', ['bible-teacher']],
    ['jason-koch', ['bible-teacher']],
    ['isiah-pulido', ['bible-teacher']],
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
    ['william-larsen', 'EMAIL', 'general', true],
    ['john-kwon', 'EMAIL', 'general', true],
    ['david-park', 'EMAIL', 'general', true],
    ['robert-fishman', 'EMAIL', 'general', true],
    ['troy-segale', 'EMAIL', 'general', true],
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
  const bibleStudyLeaderRole = await prisma.personRoleDefinition.create({
    data: { churchId, name: 'Bible Study Leader', slug: 'bible-study-leader', description: 'Leaders who facilitate Bible study groups', isSystem: false, color: '#10b981', icon: 'book-open', sortOrder: 3 },
  })
  console.log('  Created 3 role definitions (2 system + 1 custom)')

  // --- Assign Speaker role to all speakers ---
  for (const sp of speakerPersonData) {
    await prisma.personRoleAssignment.create({
      data: { personId: personRecords[sp.slug], roleId: speakerRole.id, title: sp.title },
    })
  }
  console.log(`  Assigned Speaker role to ${speakerPersonData.length} people`)

  // --- Assign Pastor role ---
  const pWilliam = personRecords['william-larsen']
  if (pWilliam) {
    await prisma.personRoleAssignment.create({
      data: { personId: pWilliam, roleId: pastorRole.id, title: 'Senior Pastor' },
    })
  }
  const pJohnKwon = personRecords['john-kwon']
  if (pJohnKwon) {
    await prisma.personRoleAssignment.create({
      data: { personId: pJohnKwon, roleId: pastorRole.id, title: 'Associate Pastor' },
    })
  }
  const pDavidPark = personRecords['david-park']
  if (pDavidPark) {
    await prisma.personRoleAssignment.create({
      data: { personId: pDavidPark, roleId: pastorRole.id, title: 'Associate Pastor' },
    })
  }
  console.log('  Assigned Pastor role to 3 people')

  // --- Assign Bible Study Leader role ---
  for (const slug of ['william-larsen', 'john-kwon', 'robert-fishman', 'ron-ward', 'frank-holman']) {
    if (personRecords[slug]) {
      await prisma.personRoleAssignment.create({
        data: { personId: personRecords[slug], roleId: bibleStudyLeaderRole.id },
      })
    }
  }
  console.log('  Assigned Bible Study Leader role to 5 people')

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

  // Create default roles for this church
  const { DEFAULT_ROLES } = await import('../lib/permissions.ts')
  const roleMap: Record<string, string> = {}
  for (const [key, def] of Object.entries(DEFAULT_ROLES)) {
    const d = def as typeof DEFAULT_ROLES[keyof typeof DEFAULT_ROLES]
    const role = await prisma.role.upsert({
      where: { churchId_slug: { churchId, slug: d.slug } },
      create: {
        churchId,
        name: d.name,
        slug: d.slug,
        description: d.description,
        priority: d.priority,
        isSystem: d.isSystem,
        permissions: d.permissions,
      },
      update: {},
    })
    roleMap[key] = role.id
  }
  console.log(`  Created ${Object.keys(roleMap).length} default roles`)

  await prisma.churchMember.upsert({
    where: { churchId_userId: { churchId, userId: testUser.id } },
    update: { role: 'OWNER', roleId: roleMap['OWNER'] },
    create: {
      churchId,
      userId: testUser.id,
      role: 'OWNER',
      roleId: roleMap['OWNER'],
    },
  })
  console.log(`  Created test user: ${testEmail}`)

  // --- Person Notes (requires test user as author) ---
  if (personRecords['william-larsen']) {
    await prisma.personNote.createMany({
      data: [
        {
          churchId,
          personId: personRecords['william-larsen'],
          authorId: testUser.id,
          noteType: 'GENERAL',
          content: 'Pastor William has faithfully led Sunday worship and Bible study since the church was founded. He continues to shepherd and mentor younger leaders.',
          isPinned: true,
          isPrivate: false,
        },
        {
          churchId,
          personId: personRecords['john-kwon'],
          authorId: testUser.id,
          noteType: 'GENERAL',
          content: 'John serves as associate pastor and is one of the most frequent Sunday message speakers. He also leads campus outreach efforts.',
          isPinned: true,
          isPrivate: false,
        },
        {
          churchId,
          personId: personRecords['robert-fishman'],
          authorId: testUser.id,
          noteType: 'FOLLOW_UP',
          content: 'Robert is active in campus ministry. Follow up on plans for expanding Bible study groups at UCLA and USC.',
          isPinned: false,
          isPrivate: false,
        },
        {
          churchId,
          personId: personRecords['troy-segale'],
          authorId: testUser.id,
          noteType: 'GENERAL',
          content: 'Troy leads campus outreach and delivers Sunday messages regularly. He has a gift for connecting with college students.',
          isPinned: false,
          isPrivate: false,
        },
        {
          churchId,
          personId: personRecords['david-park'],
          authorId: testUser.id,
          noteType: 'PASTORAL',
          content: 'David serves as associate pastor and is involved in discipleship training for younger members.',
          isPinned: false,
          isPrivate: true,
        },
      ],
    })
    console.log('  Created person notes')
  }

  // ============================================================
  // 13. MEDIA ASSETS (R2 initial-setup files)
  // ============================================================
  console.log('Seeding media assets...')
  {
    const MEDIA_ASSETS: Array<{ path: string; mimeType: string; fileSize: number }> = [
      { path: 'images-compressed-campus-ministry.jpg', mimeType: 'image/jpeg', fileSize: 15360 },
      { path: 'compressed-cross.png', mimeType: 'image/png', fileSize: 1024 },
      { path: 'compressed-event-1.jpg', mimeType: 'image/jpeg', fileSize: 9216 },
      { path: 'compressed-event-2.jpg', mimeType: 'image/jpeg', fileSize: 8192 },
      { path: 'compressed-event-3.jpg', mimeType: 'image/jpeg', fileSize: 8192 },
      { path: 'compressed-hero-bg.jpg', mimeType: 'image/jpeg', fileSize: 28672 },
      { path: 'compressed-next-step-1.jpg', mimeType: 'image/jpeg', fileSize: 12288 },
      { path: 'compressed-next-step-2.jpg', mimeType: 'image/jpeg', fileSize: 12288 },
      { path: 'compressed-next-step-3.jpg', mimeType: 'image/jpeg', fileSize: 12288 },
      { path: 'compressed-next-step-4.jpg', mimeType: 'image/jpeg', fileSize: 12288 },
      { path: 'compressed-sermon-thumbnail.jpg', mimeType: 'image/jpeg', fileSize: 16384 },
      { path: 'compressed-video-1.jpg', mimeType: 'image/jpeg', fileSize: 6144 },
      { path: 'compressed-video-2.jpg', mimeType: 'image/jpeg', fileSize: 7168 },
      { path: 'compressed-video-3.jpg', mimeType: 'image/jpeg', fileSize: 6144 },
      { path: 'compressed-visit-us-bg.jpg', mimeType: 'image/jpeg', fileSize: 29696 },
      { path: 'compressed-who-we-are-1.jpg', mimeType: 'image/jpeg', fileSize: 7168 },
      { path: 'compressed-who-we-are-2.jpg', mimeType: 'image/jpeg', fileSize: 11264 },
      { path: 'compressed-who-we-are-3.jpg', mimeType: 'image/jpeg', fileSize: 6144 },
      { path: 'images-home-compressed-bible-study.png', mimeType: 'image/png', fileSize: 1210368 },
      { path: 'images-home-compressed-campus-ministry-list.png', mimeType: 'image/png', fileSize: 1606656 },
      { path: 'images-home-compressed-campus-ministry.jpg', mimeType: 'image/jpeg', fileSize: 290816 },
      { path: 'images-home-compressed-event-christmas.png', mimeType: 'image/png', fileSize: 772096 },
      { path: 'images-home-compressed-fellowship.jpg', mimeType: 'image/jpeg', fileSize: 1147904 },
      { path: 'images-home-compressed-sunday-worship.jpg', mimeType: 'image/jpeg', fileSize: 1155072 },
      { path: 'compressed-visit-us.jpg', mimeType: 'image/jpeg', fileSize: 987136 },
      { path: 'images-home-rotatingwheel-compressed-bible-study.png', mimeType: 'image/png', fileSize: 1210368 },
      { path: 'images-home-rotatingwheel-compressed-campus-ministry-list.png', mimeType: 'image/png', fileSize: 1606656 },
      { path: 'images-home-rotatingwheel-compressed-campus-ministry.jpg', mimeType: 'image/jpeg', fileSize: 290816 },
      { path: 'images-home-rotatingwheel-compressed-event-christmas.png', mimeType: 'image/png', fileSize: 772096 },
      { path: 'images-home-rotatingwheel-compressed-fellowship.jpg', mimeType: 'image/jpeg', fileSize: 1147904 },
      { path: 'images-home-rotatingwheel-compressed-sunday-worship.jpg', mimeType: 'image/jpeg', fileSize: 1155072 },
      { path: 'compressed-laubf-location.png', mimeType: 'image/png', fileSize: 1661952 },
      { path: 'compressed-baptism.jpg', mimeType: 'image/jpeg', fileSize: 1408000 },
      { path: 'compressed-beach camp.jpg', mimeType: 'image/jpeg', fileSize: 358400 },
      { path: 'compressed-face paint.jpg', mimeType: 'image/jpeg', fileSize: 1206272 },
      { path: 'compressed-josh.jpg', mimeType: 'image/jpeg', fileSize: 810000 },
      { path: 'compressed-sports.jpg', mimeType: 'image/jpeg', fileSize: 2439168 },
      { path: 'compressed-worship.jpg', mimeType: 'image/jpeg', fileSize: 987136 },
      { path: 'compressed-adults.webp', mimeType: 'image/webp', fileSize: 201728 },
      { path: 'compressed-children.webp', mimeType: 'image/webp', fileSize: 851968 },
      { path: 'compressed-congregation.jpg', mimeType: 'image/jpeg', fileSize: 1645568 },
      { path: 'compressed-middle n high.jpg', mimeType: 'image/jpeg', fileSize: 2979840 },
      { path: 'compressed-young adults.jpg', mimeType: 'image/jpeg', fileSize: 1289216 },
      { path: 'compressed-disciples.jpg', mimeType: 'image/jpeg', fileSize: 1841152 },
      { path: 'compressed-growing.jpg', mimeType: 'image/jpeg', fileSize: 1110016 },
      { path: 'images-ministries-adults-compressed-introduction.jpg', mimeType: 'image/jpeg', fileSize: 1094656 },
      { path: 'images-ministries-adults-compressed-serving.jpg', mimeType: 'image/jpeg', fileSize: 290816 },
      { path: 'compressed-child care.jpg', mimeType: 'image/jpeg', fileSize: 1429504 },
      { path: 'compressed-class.jpg', mimeType: 'image/jpeg', fileSize: 1615872 },
      { path: 'compressed-introduction.png', mimeType: 'image/png', fileSize: 781312 },
      { path: 'compressed-service.png', mimeType: 'image/png', fileSize: 1661952 },
      { path: 'compressed-singspiration.jpg', mimeType: 'image/jpeg', fileSize: 1002496 },
      { path: 'compressed-IMG_1407.jpg', mimeType: 'image/jpeg', fileSize: 290816 },
      { path: 'compressed-IMG_1408.jpg', mimeType: 'image/jpeg', fileSize: 216064 },
      { path: 'compressed-IMG_1409.jpg', mimeType: 'image/jpeg', fileSize: 76800 },
      { path: 'compressed-IMG_1411.jpg', mimeType: 'image/jpeg', fileSize: 332800 },
      { path: 'compressed-IMG_1413.jpg', mimeType: 'image/jpeg', fileSize: 113664 },
      { path: 'compressed-hero.jpg', mimeType: 'image/jpeg', fileSize: 318464 },
      { path: 'compressed-waving.jpg', mimeType: 'image/jpeg', fileSize: 218112 },
      { path: 'images-ministries-join-campus-ministry-section-compressed-1.jpg', mimeType: 'image/jpeg', fileSize: 318464 },
      { path: 'images-ministries-join-campus-ministry-section-compressed-2.jpg', mimeType: 'image/jpeg', fileSize: 358400 },
      { path: 'compressed-3.png', mimeType: 'image/png', fileSize: 1046528 },
      { path: 'compressed-lbcc-truevineclub.jpg', mimeType: 'image/jpeg', fileSize: 295936 },
      { path: 'images-ministries-middle n high-compressed-fellowship.jpg', mimeType: 'image/jpeg', fileSize: 1143808 },
      { path: 'images-ministries-middle n high-compressed-header.jpg', mimeType: 'image/jpeg', fileSize: 2979840 },
      { path: 'images-ministries-middle n high-compressed-introduction.jpg', mimeType: 'image/jpeg', fileSize: 1221632 },
      { path: 'compressed-jbfhbf conference.jpg', mimeType: 'image/jpeg', fileSize: 101376 },
      { path: 'compressed-praise night.jpg', mimeType: 'image/jpeg', fileSize: 748544 },
      { path: 'compressed-fellowship.png', mimeType: 'image/png', fileSize: 1606656 },
      { path: 'images-ministries-young adults-compressed-serving.jpg', mimeType: 'image/jpeg', fileSize: 1206272 },
      { path: 'compressed-yam.png', mimeType: 'image/png', fileSize: 1046528 },
      { path: 'images-ministries-young adults-carousel-compressed-1.jpg', mimeType: 'image/jpeg', fileSize: 1147904 },
      { path: 'images-ministries-young adults-carousel-compressed-2.jpg', mimeType: 'image/jpeg', fileSize: 810000 },
      { path: 'compressed-3.jpg', mimeType: 'image/jpeg', fileSize: 1551360 },
      { path: 'compressed-4.jpg', mimeType: 'image/jpeg', fileSize: 499712 },
      { path: 'compressed-5.jpg', mimeType: 'image/jpeg', fileSize: 3102720 },
      { path: 'compressed-6.jpg', mimeType: 'image/jpeg', fileSize: 1078272 },
      { path: 'compressed-7.jpg', mimeType: 'image/jpeg', fileSize: 748544 },
      { path: 'compressed-8.jpg', mimeType: 'image/jpeg', fileSize: 1145856 },
      { path: 'compressed-9.jpg', mimeType: 'image/jpeg', fileSize: 2439168 },
      { path: 'compressed-10.jpg', mimeType: 'image/jpeg', fileSize: 216064 },
      { path: 'compressed-bible study.jpg', mimeType: 'image/jpeg', fileSize: 1221632 },
      { path: 'compressed-discipleship.jpg', mimeType: 'image/jpeg', fileSize: 1841152 },
      { path: 'images-who we are-compressed-fellowship.jpg', mimeType: 'image/jpeg', fileSize: 1147904 },
      { path: 'images-who we are-compressed-header.jpg', mimeType: 'image/jpeg', fileSize: 358400 },
      { path: 'laubf-logo-blue.svg', mimeType: 'image/svg+xml', fileSize: 3072 },
      { path: 'laubf-logo-colored.png', mimeType: 'image/png', fileSize: 4096 },
      { path: 'laubf-logo.svg', mimeType: 'image/svg+xml', fileSize: 2302 },
      { path: 'DSC01195.jpg', mimeType: 'image/jpeg', fileSize: 1058816 },
      { path: 'DSC05222.jpg', mimeType: 'image/jpeg', fileSize: 2770944 },
      { path: 'DSC05299.jpg', mimeType: 'image/jpeg', fileSize: 2224128 },
      { path: 'compressed-hero-vid.mp4', mimeType: 'video/mp4', fileSize: 17378304 },
      { path: 'compressed-hero-vid.webm', mimeType: 'video/webm', fileSize: 3316736 },
    ]

    const FOLDER_NAME = 'initial-setup'

    // Ensure single folder
    await prisma.mediaFolder.upsert({
      where: { churchId_name: { churchId, name: FOLDER_NAME } },
      update: {},
      create: { churchId, name: FOLDER_NAME },
    })

    // Fetch real file sizes from R2 (single ListObjects call, not 93 HEAD requests)
    const mediaSizeMap = await getR2MediaSizeMap()

    // Create media assets (skip if URL already exists)
    const existingUrls = new Set(
      (await prisma.mediaAsset.findMany({ where: { churchId }, select: { url: true } }))
        .map(m => m.url)
    )

    let created = 0
    for (const asset of MEDIA_ASSETS) {
      const url = `${CDN}/${asset.path}`
      if (existingUrls.has(url)) continue

      // Use real R2 size if available, otherwise fall back to hardcoded estimate
      const realSize = mediaSizeMap.get(asset.path)
      const fileSize = realSize ?? asset.fileSize

      const alt = asset.path
        .replace(/^(images-|images-home-|images-home-rotatingwheel-|images-ministries-[^-]*-|images-who we are-)/, '')
        .replace(/^compressed-/, '')
        .replace(/\.[^.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase())
        .trim()

      await prisma.mediaAsset.create({
        data: {
          churchId,
          filename: asset.path,
          url,
          mimeType: asset.mimeType,
          fileSize,
          alt,
          folder: FOLDER_NAME,
        },
      })
      created++
    }
    console.log(`  Created ${created} media assets in "${FOLDER_NAME}" folder (${MEDIA_ASSETS.length - created} already existed)`)

    // ── Default Event Template Images (shared R2 prefix: defaults/event-templates/) ──
    const EVENT_TEMPLATES_FOLDER = 'event-templates'
    await prisma.mediaFolder.upsert({
      where: { churchId_name: { churchId, name: EVENT_TEMPLATES_FOLDER } },
      update: {},
      create: { churchId, name: EVENT_TEMPLATES_FOLDER },
    })

    const DEFAULT_EVENT_IMAGES = [
      { filename: 'gradient-warm-sunrise.svg', fileSize: 1054, alt: 'Template: Warm Sunrise Gradient', title: 'Event Template — Warm Sunrise' },
      { filename: 'gradient-ocean-calm.svg', fileSize: 1090, alt: 'Template: Ocean Calm Gradient', title: 'Event Template — Ocean Calm' },
      { filename: 'gradient-twilight-purple.svg', fileSize: 1120, alt: 'Template: Twilight Purple Gradient', title: 'Event Template — Twilight Purple' },
      { filename: 'gradient-forest-green.svg', fileSize: 1202, alt: 'Template: Forest Green Gradient', title: 'Event Template — Forest Green' },
      { filename: 'gradient-soft-blush.svg', fileSize: 1153, alt: 'Template: Soft Blush Gradient', title: 'Event Template — Soft Blush' },
      { filename: 'gradient-midnight-blue.svg', fileSize: 1084, alt: 'Template: Midnight Blue Gradient', title: 'Event Template — Midnight Blue' },
    ]

    const existingTemplateUrls = new Set(
      (await prisma.mediaAsset.findMany({
        where: { churchId, folder: EVENT_TEMPLATES_FOLDER },
        select: { url: true },
      })).map((m) => m.url)
    )

    let templateCreated = 0
    for (const img of DEFAULT_EVENT_IMAGES) {
      const url = R2_MEDIA_PUBLIC
        ? `${R2_MEDIA_PUBLIC}/defaults/event-templates/${img.filename}`
        : `/defaults/events/${img.filename}` // fallback for local dev without R2
      if (existingTemplateUrls.has(url)) continue

      await prisma.mediaAsset.create({
        data: {
          churchId,
          filename: img.filename,
          url,
          mimeType: 'image/svg+xml',
          fileSize: img.fileSize,
          alt: img.alt,
          title: img.title,
          folder: EVENT_TEMPLATES_FOLDER,
          width: 1200,
          height: 630,
        },
      })
      templateCreated++
    }
    console.log(`  Created ${templateCreated} event template images in "${EVENT_TEMPLATES_FOLDER}" folder`)
  }

  // ── Bible Verses (global, not church-scoped) ─────────────────
  await seedBibleVerses()

  console.log('\nSeed complete!')
}

// ================================================================
// Seed BibleVerse table from compressed TSV
// ================================================================
async function seedBibleVerses() {
  const existing = await prisma.bibleVerse.count()
  if (existing > 0) {
    console.log(`\nBibleVerse table already has ${existing} rows — skipping.`)
    return
  }

  console.log('\nSeeding Bible verses from compressed TSV...')
  const filePath = join(import.meta.dirname!, 'data', 'bible-verses.tsv.gz')

  const rows: { book: string; chapter: number; verse: number; version: string; text: string }[] = []

  await new Promise<void>((resolve, reject) => {
    const gunzip = createGunzip()
    const stream = createReadStream(filePath).pipe(gunzip)
    const rl = createInterface({ input: stream })

    rl.on('line', (line) => {
      const parts = line.split('\t')
      if (parts.length >= 5) {
        const text = parts[4]
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\')
        rows.push({
          book: parts[0],
          chapter: parseInt(parts[1]),
          verse: parseInt(parts[2]),
          version: parts[3],
          text,
        })
      }
    })

    rl.on('close', () => resolve())
    rl.on('error', reject)
    stream.on('error', reject)
  })

  console.log(`  Parsed ${rows.length} verses`)

  // Batch insert
  const BATCH_SIZE = 5000
  let inserted = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    await prisma.bibleVerse.createMany({
      data: batch.map((r) => ({
        book: r.book as any,
        chapter: r.chapter,
        verse: r.verse,
        text: r.text,
        version: r.version,
      })),
      skipDuplicates: true,
    })
    inserted += batch.length
    if (inserted % 50000 === 0 || i + BATCH_SIZE >= rows.length) {
      console.log(`  Inserted ${inserted}/${rows.length} verses...`)
    }
  }

  const total = await prisma.bibleVerse.count()
  console.log(`  Bible verses seeded: ${total} total`)
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
