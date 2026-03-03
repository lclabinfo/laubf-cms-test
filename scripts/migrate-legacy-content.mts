/**
 * Migrate legacy content: laubfmaterial + videolist → Message + BibleStudy + BibleStudyAttachment
 *
 * This script:
 * 1. Wipes ALL existing Messages, BibleStudies, MessageSeries, BibleStudyAttachments
 * 2. Parses laubfmaterial SQL dump (1,637 study material records)
 * 3. Parses videolist SQL dump (315 video records)
 * 4. Matches videos to materials by title+date+passage
 * 5. Creates Message + BibleStudy pairs with attachments
 * 6. Links to speakers and series
 *
 * Usage: npx tsx scripts/migrate-legacy-content.mts
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client.ts')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

// ── Helpers ─────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 80)
}

function normalizePassage(p: string): string {
  return p.replace(/~/g, '-').replace(/\s+/g, ' ').trim()
}

// ── Book code mapping ───────────────────────────────────────────────

const BNUM_TO_BOOK: Record<number, string> = {
  101: 'GENESIS', 102: 'EXODUS', 103: 'LEVITICUS', 104: 'NUMBERS',
  105: 'DEUTERONOMY', 106: 'JOSHUA', 107: 'JUDGES', 108: 'RUTH',
  109: 'FIRST_SAMUEL', 110: 'SECOND_SAMUEL', 111: 'FIRST_KINGS',
  112: 'SECOND_KINGS', 113: 'FIRST_CHRONICLES', 114: 'SECOND_CHRONICLES',
  115: 'EZRA', 116: 'NEHEMIAH', 117: 'ESTHER', 118: 'JOB',
  119: 'PSALMS', 120: 'PROVERBS', 121: 'ECCLESIASTES',
  122: 'SONG_OF_SOLOMON', 123: 'ISAIAH', 124: 'JEREMIAH',
  125: 'LAMENTATIONS', 126: 'EZEKIEL', 127: 'DANIEL', 128: 'HOSEA',
  129: 'JOEL', 130: 'AMOS', 131: 'OBADIAH', 132: 'JONAH',
  133: 'MICAH', 134: 'NAHUM', 135: 'HABAKKUK', 136: 'ZEPHANIAH',
  137: 'HAGGAI', 138: 'ZECHARIAH', 139: 'MALACHI',
  140: 'MATTHEW', 141: 'MARK', 142: 'LUKE', 143: 'JOHN',
  144: 'ACTS', 145: 'ROMANS', 146: 'FIRST_CORINTHIANS',
  147: 'SECOND_CORINTHIANS', 148: 'GALATIANS', 149: 'EPHESIANS',
  150: 'PHILIPPIANS', 151: 'COLOSSIANS', 152: 'FIRST_THESSALONIANS',
  153: 'SECOND_THESSALONIANS', 154: 'FIRST_TIMOTHY',
  155: 'SECOND_TIMOTHY', 156: 'TITUS', 157: 'PHILEMON',
  158: 'HEBREWS', 159: 'JAMES', 160: 'FIRST_PETER',
  161: 'SECOND_PETER', 162: 'FIRST_JOHN', 163: 'SECOND_JOHN',
  164: 'THIRD_JOHN', 165: 'JUDE', 166: 'REVELATION',
}

// ── Speaker name consolidation ──────────────────────────────────────

const SPEAKER_CONSOLIDATION: Record<string, string> = {
  'William': 'William Larsen',
  'William Larsen': 'William Larsen',
  'John Kwon': 'John Kwon',
  'John': 'John Kwon',
  'David Park': 'David Park',
  'David Park ': 'David Park',
  'Paul Lim': 'Paul Lim',
  'Dr. Paul Lim': 'Paul Lim',
  'Paul': 'Paul Lim',
  'Robert': 'Robert Fishman',
  'Robert Fishman': 'Robert Fishman',
  'David Min': 'David Min',
  'Paul Im': 'Paul Im',
  'John Baik': 'John Baik',
  'Jason Koch': 'Jason Koch',
  'Moses Yoon': 'Moses Yoon',
  'Troy Segale': 'Troy Segale',
  'Ron Ward': 'Ron Ward',
  'Augustine Kim': 'Augustine Kim',
  'Juan Perez': 'Juan Perez',
  'Terry Lopez': 'Terry Lopez',
  'Frank Holman': 'Frank Holman',
  'Daniel Shim': 'Daniel Shim',
  'Peace Oh': 'Peace Oh',
  'Andrew Cuevas': 'Andrew Cuevas',
  'Isiah Pulido': 'Isiah Pulido',
  'James Park': 'James Park',
  'Timothy Cho': 'Timothy Cho',
  'Joshua Lopez': 'Joshua Lopez',
  'Mark C Yang': 'Mark Yang',
}

// ── mtype → Series slug mapping ─────────────────────────────────────

const MTYPE_TO_SERIES: Record<string, string> = {
  'Sunday': 'sunday-service',
  'Conference': 'conference',
  'CBF': 'cbf',
  'JBF': 'jbf',
  'Prayer': 'prayer-meeting',
  'Bible note from Wednesday group': 'wednesday-bible-study',
  'Genesis': 'special-studies',
  'Genesis 2018': 'special-studies',
  'LBCC GBS': 'special-studies',
  'World Mission': 'special-studies',
  '9 Step': 'special-studies',
  '16 STEPS BIBLE STUDY': 'special-studies',
}

const VIDEOTYPE_TO_SERIES: Record<string, string> = {
  'Sunday': 'sunday-service',
  'Wednesday': 'wednesday-bible-study',
  'Events': 'events',
}

// ── SQL Parsing ─────────────────────────────────────────────────────

interface MaterialRecord {
  no: number
  bcode: number
  title: string
  mtype: string
  mdate: string
  passage: string
  bname: string
  fromChapter: number
  toChapter: number
  doctype1: string | null
  doctype2: string | null
  doctype3: string | null
  doctype4: string | null
  filename1: string | null
  filename2: string | null
  filename3: string | null
  filename4: string | null
  fileurl1: string | null
  fileurl2: string | null
  fileurl3: string | null
  fileurl4: string | null
  msgurl: string | null
}

interface VideoRecord {
  no: number
  videonum: string
  title: string
  videotype: string
  mdate: string
  messenger: string
  passage: string
  bname: string
  fromChapter: number
  toChapter: number
}

function parseSqlValues(line: string): string[][] {
  const valuesIdx = line.indexOf('VALUES ')
  if (valuesIdx === -1) return []
  const valuesStr = line.substring(valuesIdx + 7)

  const records: string[][] = []
  let i = 0

  while (i < valuesStr.length) {
    if (valuesStr[i] !== '(') { i++; continue }
    i++

    const fields: string[] = []
    let field = ''
    let inString = false

    while (i < valuesStr.length) {
      const ch = valuesStr[i]

      if (inString) {
        if (ch === '\\' && i + 1 < valuesStr.length) {
          field += valuesStr[i + 1]
          i += 2
          continue
        }
        if (ch === "'" && i + 1 < valuesStr.length && valuesStr[i + 1] === "'") {
          field += "'"
          i += 2
          continue
        }
        if (ch === "'") {
          inString = false
          i++
          continue
        }
        field += ch
        i++
      } else {
        if (ch === "'") { inString = true; i++; continue }
        if (ch === ',') { fields.push(field.trim()); field = ''; i++; continue }
        if (ch === ')') { fields.push(field.trim()); i++; break }
        field += ch
        i++
      }
    }
    if (fields.length > 0) records.push(fields)
  }

  return records
}

function parseNull(v: string): string | null {
  if (v === 'NULL' || v === '' || v === "''") return null
  return v
}

function parseMaterials(content: string): MaterialRecord[] {
  const results: MaterialRecord[] = []
  for (const line of content.split('\n')) {
    if (!line.startsWith('INSERT INTO')) continue
    for (const fields of parseSqlValues(line)) {
      if (fields.length < 22) continue
      results.push({
        no: parseInt(fields[0]),
        bcode: parseInt(fields[1]) || 0,
        title: fields[2] || '',
        mtype: fields[3] || '',
        mdate: fields[4] || '',
        passage: fields[5] || '',
        bname: fields[6] || '',
        fromChapter: parseInt(fields[7]) || 0,
        toChapter: parseInt(fields[8]) || 0,
        doctype1: parseNull(fields[9]),
        doctype2: parseNull(fields[10]),
        doctype3: parseNull(fields[11]),
        doctype4: parseNull(fields[12]),
        filename1: parseNull(fields[13]),
        filename2: parseNull(fields[14]),
        filename3: parseNull(fields[15]),
        filename4: parseNull(fields[16]),
        fileurl1: parseNull(fields[17]),
        fileurl2: parseNull(fields[18]),
        fileurl3: parseNull(fields[19]),
        fileurl4: parseNull(fields[20]),
        msgurl: parseNull(fields[21]),
      })
    }
  }
  return results
}

function parseVideos(content: string): VideoRecord[] {
  const results: VideoRecord[] = []
  for (const line of content.split('\n')) {
    if (!line.startsWith('INSERT INTO')) continue
    for (const fields of parseSqlValues(line)) {
      if (fields.length < 10) continue
      results.push({
        no: parseInt(fields[0]),
        videonum: fields[1] || '',
        title: fields[2] || '',
        videotype: fields[3] || '',
        mdate: fields[5] || '',
        messenger: fields[6] || '',
        passage: fields[7] || '',
        bname: fields[8] || '',
        fromChapter: parseInt(fields[9]) || 0,
        toChapter: parseInt(fields[10] ?? '0') || 0,
      })
    }
  }
  return results
}

function parseYoutubeId(videonum: string): string | null {
  if (!videonum) return null
  // Full YouTube URL patterns
  const urlMatch = videonum.match(/(?:youtu\.be\/|youtube\.com\/(?:live\/|watch\?v=))([a-zA-Z0-9_-]{11})/)
  if (urlMatch) return urlMatch[1]
  // Short YouTube ID (11 chars, alphanumeric + _ -)
  if (/^[a-zA-Z0-9_-]{11}$/.test(videonum)) return videonum
  // Vimeo numeric IDs — not YouTube
  if (/^\d+$/.test(videonum)) return null
  return null
}

function getVimeoUrl(videonum: string): string | null {
  if (/^\d{6,}$/.test(videonum)) return `https://vimeo.com/${videonum}`
  return null
}

function getAttachmentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  if (ext === 'pdf') return 'PDF'
  if (ext === 'docx') return 'DOCX'
  if (ext === 'doc') return 'DOC'
  if (ext === 'rtf') return 'RTF'
  return 'OTHER'
}

function parseDate(mdate: string): Date {
  // Format: YYYY/MM/DD
  const parts = mdate.split('/')
  if (parts.length === 3) {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  }
  return new Date()
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  // Resolve church
  const church = await prisma.church.findFirst({ where: { slug: 'la-ubf' } })
  if (!church) throw new Error('Church la-ubf not found')
  const churchId = church.id
  console.log(`Church: ${church.name} (${churchId})`)

  // ── Step 1: Wipe existing content ──
  console.log('\n=== Step 1: Wiping existing content ===')
  const delAttach = await prisma.bibleStudyAttachment.deleteMany({})
  console.log(`  Deleted ${delAttach.count} BibleStudyAttachments`)
  const delMS = await prisma.messageSeries.deleteMany({})
  console.log(`  Deleted ${delMS.count} MessageSeries`)
  // Must unlink Messages from BibleStudies before deleting
  await prisma.message.updateMany({ where: { churchId }, data: { relatedStudyId: null } })
  const delBS = await prisma.bibleStudy.deleteMany({ where: { churchId } })
  console.log(`  Deleted ${delBS.count} BibleStudies`)
  const delMsg = await prisma.message.deleteMany({ where: { churchId } })
  console.log(`  Deleted ${delMsg.count} Messages`)

  // ── Step 2: Parse SQL dumps ──
  console.log('\n=== Step 2: Parsing SQL dumps ===')
  const matContent = readFileSync(join(process.cwd(), '00_old_laubf_db_dump/laubf_laubfmaterial.sql'), 'utf-8')
  const materials = parseMaterials(matContent)
  console.log(`  Parsed ${materials.length} laubfmaterial records`)

  const vidContent = readFileSync(join(process.cwd(), '00_old_laubf_db_dump/laubf_videolist.sql'), 'utf-8')
  const videos = parseVideos(vidContent)
  console.log(`  Parsed ${videos.length} videolist records`)

  // ── Step 3: Build speaker lookup ──
  console.log('\n=== Step 3: Building speaker lookup ===')
  const speakers = await prisma.speaker.findMany({ where: { churchId } })
  const speakerByName = new Map<string, string>()
  for (const s of speakers) {
    speakerByName.set(s.name.toLowerCase(), s.id)
  }
  console.log(`  Found ${speakers.length} speakers in database`)

  function resolveSpeakerId(name: string): string | null {
    const consolidated = SPEAKER_CONSOLIDATION[name.trim()] || name.trim()
    return speakerByName.get(consolidated.toLowerCase()) || null
  }

  // ── Step 4: Build series lookup ──
  console.log('\n=== Step 4: Building series lookup ===')
  const seriesList = await prisma.series.findMany({ where: { churchId } })
  const seriesBySlug = new Map<string, string>()
  for (const s of seriesList) {
    seriesBySlug.set(s.slug, s.id)
  }
  console.log(`  Found ${seriesList.length} series in database`)

  // ── Step 5: Match videos to materials ──
  console.log('\n=== Step 5: Matching videos to materials ===')
  const videoByKey = new Map<string, VideoRecord>()
  for (const v of videos) {
    // Key by normalized title + date
    const key = `${v.title.toLowerCase().trim()}|${v.mdate.trim()}`
    videoByKey.set(key, v)
  }

  let matchCount = 0
  const matchedVideoKeys = new Set<string>()

  // ── Step 6: Create Messages from laubfmaterial ──
  console.log('\n=== Step 6: Creating Messages from laubfmaterial ===')
  const slugCounts = new Map<string, number>()
  let created = 0
  let skipped = 0

  for (const mat of materials) {
    if (!mat.title.trim()) { skipped++; continue }

    // Generate unique slug
    let baseSlug = slugify(`${mat.title}-${mat.mdate.replace(/\//g, '-')}`)
    if (!baseSlug) baseSlug = `study-${mat.no}`
    const count = slugCounts.get(baseSlug) || 0
    slugCounts.set(baseSlug, count + 1)
    const slug = count > 0 ? `${baseSlug}-${count + 1}` : baseSlug

    // Map bcode to BibleBook
    const book = BNUM_TO_BOOK[mat.bcode] || null
    const passage = normalizePassage(mat.passage)
    const dateFor = parseDate(mat.mdate)

    // Find matching video
    const videoKey = `${mat.title.toLowerCase().trim()}|${mat.mdate.trim()}`
    const video = videoByKey.get(videoKey)
    if (video) {
      matchCount++
      matchedVideoKeys.add(videoKey)
    }

    // Parse YouTube ID from video
    const youtubeId = video ? parseYoutubeId(video.videonum) : null
    const vimeoUrl = video && !youtubeId ? getVimeoUrl(video.videonum) : null
    const hasVideo = !!(youtubeId || vimeoUrl)

    // Resolve speaker from video's messenger field
    const speakerId = video ? resolveSpeakerId(video.messenger) : null

    // Resolve series
    const seriesSlug = MTYPE_TO_SERIES[mat.mtype] || (video ? VIDEOTYPE_TO_SERIES[video.videotype] : null) || null
    const seriesId = seriesSlug ? seriesBySlug.get(seriesSlug) : null

    // Determine if this has study materials
    const hasQuestionDoc = [mat.doctype1, mat.doctype2, mat.doctype3, mat.doctype4].some(d => d === 'Question')
    const hasNoteDoc = [mat.doctype1, mat.doctype2, mat.doctype3, mat.doctype4].some(d => d === 'Note')
    const hasStudy = hasQuestionDoc || hasNoteDoc

    // Create BibleStudy first (if we have a book)
    let relatedStudyId: string | null = null
    if (book && hasStudy) {
      const study = await prisma.bibleStudy.create({
        data: {
          churchId,
          slug: `study-${slug}`,
          title: mat.title.trim(),
          book: book as any,
          passage: passage || `${mat.bname} ${mat.fromChapter}`,
          datePosted: dateFor,
          dateFor,
          speakerId,
          seriesId,
          hasQuestions: hasQuestionDoc,
          hasAnswers: false,
          hasTranscript: false,
          status: 'PUBLISHED',
          publishedAt: dateFor,
        },
      })
      relatedStudyId = study.id

      // Create BibleStudyAttachments for each file slot
      const slots = [
        { doctype: mat.doctype1, filename: mat.filename1, fileurl: mat.fileurl1 },
        { doctype: mat.doctype2, filename: mat.filename2, fileurl: mat.fileurl2 },
        { doctype: mat.doctype3, filename: mat.filename3, fileurl: mat.fileurl3 },
        { doctype: mat.doctype4, filename: mat.filename4, fileurl: mat.fileurl4 },
      ]

      let sortOrder = 0
      for (const slot of slots) {
        if (slot.filename && slot.fileurl) {
          await prisma.bibleStudyAttachment.create({
            data: {
              bibleStudyId: study.id,
              name: slot.filename,
              url: slot.fileurl,
              type: getAttachmentType(slot.filename) as any,
              legacySourceId: mat.no,
              sortOrder: sortOrder++,
            },
          })
        }
      }
    }

    // Create Message
    await prisma.message.create({
      data: {
        churchId,
        slug,
        title: mat.title.trim(),
        passage: passage || null,
        dateFor,
        speakerId,
        youtubeId,
        videoUrl: vimeoUrl,
        hasVideo,
        hasStudy,
        status: 'PUBLISHED',
        publishedAt: dateFor,
        relatedStudyId,
      },
    })

    // Link to series
    if (seriesId) {
      await prisma.messageSeries.create({
        data: {
          messageId: (await prisma.message.findFirst({ where: { churchId, slug } }))!.id,
          seriesId,
          sortOrder: 0,
        },
      }).catch(() => {}) // Skip if duplicate
    }

    created++
    if (created % 200 === 0) {
      console.log(`  Created ${created}/${materials.length} messages...`)
    }
  }

  console.log(`  Created ${created} messages from laubfmaterial (skipped ${skipped})`)
  console.log(`  Matched ${matchCount} videos to materials`)

  // ── Step 7: Create Messages from unmatched videos ──
  console.log('\n=== Step 7: Creating Messages from unmatched videos ===')
  let unmatchedCreated = 0

  for (const video of videos) {
    const videoKey = `${video.title.toLowerCase().trim()}|${video.mdate.trim()}`
    if (matchedVideoKeys.has(videoKey)) continue

    if (!video.title.trim()) continue

    const youtubeId = parseYoutubeId(video.videonum)
    const vimeoUrl = !youtubeId ? getVimeoUrl(video.videonum) : null

    let baseSlug = slugify(`${video.title}-${video.mdate.replace(/\//g, '-')}`)
    if (!baseSlug) baseSlug = `video-${video.no}`
    const count = slugCounts.get(baseSlug) || 0
    slugCounts.set(baseSlug, count + 1)
    const slug = count > 0 ? `${baseSlug}-${count + 1}` : baseSlug

    const passage = normalizePassage(video.passage)
    const dateFor = parseDate(video.mdate)
    const speakerId = resolveSpeakerId(video.messenger)
    const seriesSlug = VIDEOTYPE_TO_SERIES[video.videotype] || null
    const seriesId = seriesSlug ? seriesBySlug.get(seriesSlug) : null

    await prisma.message.create({
      data: {
        churchId,
        slug,
        title: video.title.trim(),
        passage: passage || null,
        dateFor,
        speakerId,
        youtubeId,
        videoUrl: vimeoUrl,
        hasVideo: !!(youtubeId || vimeoUrl),
        hasStudy: false,
        status: 'PUBLISHED',
        publishedAt: dateFor,
      },
    })

    if (seriesId) {
      const msg = await prisma.message.findFirst({ where: { churchId, slug } })
      if (msg) {
        await prisma.messageSeries.create({
          data: { messageId: msg.id, seriesId, sortOrder: 0 },
        }).catch(() => {})
      }
    }

    unmatchedCreated++
  }

  console.log(`  Created ${unmatchedCreated} messages from unmatched videos`)

  // ── Step 8: Final counts ──
  console.log('\n=== Final Counts ===')
  const msgCount = await prisma.message.count({ where: { churchId } })
  const bsCount = await prisma.bibleStudy.count({ where: { churchId } })
  const attCount = await prisma.bibleStudyAttachment.count()
  const msCount = await prisma.messageSeries.count()
  console.log(`  Messages: ${msgCount}`)
  console.log(`  BibleStudies: ${bsCount}`)
  console.log(`  BibleStudyAttachments: ${attCount}`)
  console.log(`  MessageSeries links: ${msCount}`)

  // Spot check
  const latest = await prisma.message.findFirst({ where: { churchId }, orderBy: { dateFor: 'desc' } })
  console.log(`\n  Latest message: "${latest?.title}" (${latest?.dateFor})`)
  const oldest = await prisma.message.findFirst({ where: { churchId }, orderBy: { dateFor: 'asc' } })
  console.log(`  Oldest message: "${oldest?.title}" (${oldest?.dateFor})`)

  const withVideo = await prisma.message.count({ where: { churchId, hasVideo: true } })
  console.log(`  Messages with video: ${withVideo}`)
  const withStudy = await prisma.message.count({ where: { churchId, hasStudy: true } })
  console.log(`  Messages with study: ${withStudy}`)

  await prisma.$disconnect()
  await pool.end()
  console.log('\nDone!')
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
