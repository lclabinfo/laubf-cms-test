/**
 * Adapters: Convert Prisma DAL types to UI component types.
 *
 * These functions bridge the gap between the database model shapes
 * (from DAL queries) and the UI type interfaces consumed by section
 * components. Page files call these to map DB records before passing
 * them as props.
 */

import type { MessageWithRelations, MessageDetail } from '@/lib/dal/messages'
import type { EventWithRelations, EventDetail } from '@/lib/dal/events'
import type { BibleStudyWithRelations } from '@/lib/dal/bible-studies'
import type { VideoRecord } from '@/lib/dal/videos'
import type { DailyBreadRecord } from '@/lib/dal/daily-bread'
import type { CampusRecord } from '@/lib/dal/campuses'
import type { BibleBook as PrismaBibleBook } from '@/lib/generated/prisma/client'

import type { Message } from '@/lib/types/message'
import type { Event as UIEvent } from '@/lib/types/events'
import type { Video } from '@/lib/types/video'
import type { BibleStudy, BibleBook } from '@/lib/types/bible-study'
import type { DailyBread } from '@/lib/types/daily-bread'

/* -- Helpers -- */

function isoDate(d: Date | string): string {
  if (typeof d === 'string') return d
  return d.toISOString().split('T')[0]
}

/* -- Messages -- */

export function toUIMessage(m: MessageWithRelations | MessageDetail): Message {
  const detail = m as MessageDetail
  return {
    id: m.id,
    slug: m.slug,
    title: m.title,
    youtubeId: m.youtubeId ?? '',
    speaker: m.speaker?.name ?? '',
    series: m.messageSeries[0]?.series.name ?? 'Sunday Message',
    passage: m.passage ?? '',
    dateFor: isoDate(m.dateFor),
    description: m.description ?? '',
    rawTranscript: m.rawTranscript ?? '',
    liveTranscript: m.liveTranscript ?? undefined,
    relatedStudyId: detail.relatedStudy?.slug ?? undefined,
    duration: m.duration ?? undefined,
  }
}

/* -- Events -- */

export function toUIEvent(e: EventWithRelations | EventDetail): UIEvent {
  const detail = e as EventDetail
  const timeStr = [e.startTime, e.endTime].filter(Boolean).join(' - ') || ''

  return {
    slug: e.slug,
    title: e.title,
    type: e.type.toLowerCase() as UIEvent['type'],
    dateStart: isoDate(e.dateStart),
    dateEnd: e.dateEnd ? isoDate(e.dateEnd) : undefined,
    time: timeStr,
    location: e.location ?? '',
    description: e.shortDescription ?? e.description ?? '',
    body: e.description ?? '',
    image: {
      src: e.coverImage ?? '',
      alt: e.imageAlt ?? e.title,
      objectPosition: e.imagePosition ?? undefined,
    },
    tags: [],
    ministry: (e.ministry?.slug ?? 'church-wide') as UIEvent['ministry'],
    campus: (e.campus?.slug ?? undefined) as UIEvent['campus'],
    isRecurring: e.isRecurring,
    meetingUrl: e.meetingUrl ?? undefined,
    registrationUrl: e.registrationUrl ?? undefined,
    links: detail.eventLinks?.map((l) => ({
      label: l.label,
      href: l.href,
      external: l.external,
    })),
    isFeatured: e.isFeatured,
    badge: e.badge ?? undefined,
    recurrenceSchedule: e.recurrenceSchedule ?? undefined,
  }
}

/* -- Videos -- */

export function toUIVideo(v: VideoRecord): Video {
  return {
    id: v.id,
    slug: v.slug,
    title: v.title,
    youtubeId: v.youtubeId ?? '',
    category: (v.category?.replace(/_/g, ' ')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ') ?? 'Special Feature') as Video['category'],
    datePublished: isoDate(v.datePublished),
    duration: v.duration ?? '0:00',
    description: v.description ?? '',
    isShort: v.isShort,
  }
}

/* -- Bible Studies -- */

const BIBLE_BOOK_MAP: Record<PrismaBibleBook, BibleBook> = {
  GENESIS: 'Genesis',
  EXODUS: 'Exodus',
  LEVITICUS: 'Leviticus',
  NUMBERS: 'Numbers',
  DEUTERONOMY: 'Deuteronomy',
  JOSHUA: 'Joshua',
  JUDGES: 'Judges',
  RUTH: 'Ruth',
  FIRST_SAMUEL: '1 Samuel',
  SECOND_SAMUEL: '2 Samuel',
  FIRST_KINGS: '1 Kings',
  SECOND_KINGS: '2 Kings',
  FIRST_CHRONICLES: '1 Chronicles',
  SECOND_CHRONICLES: '2 Chronicles',
  EZRA: 'Ezra',
  NEHEMIAH: 'Nehemiah',
  ESTHER: 'Esther',
  JOB: 'Job',
  PSALMS: 'Psalms',
  PROVERBS: 'Proverbs',
  ECCLESIASTES: 'Ecclesiastes',
  SONG_OF_SOLOMON: 'Song of Solomon',
  ISAIAH: 'Isaiah',
  JEREMIAH: 'Jeremiah',
  LAMENTATIONS: 'Lamentations',
  EZEKIEL: 'Ezekiel',
  DANIEL: 'Daniel',
  HOSEA: 'Hosea',
  JOEL: 'Joel',
  AMOS: 'Amos',
  OBADIAH: 'Obadiah',
  JONAH: 'Jonah',
  MICAH: 'Micah',
  NAHUM: 'Nahum',
  HABAKKUK: 'Habakkuk',
  ZEPHANIAH: 'Zephaniah',
  HAGGAI: 'Haggai',
  ZECHARIAH: 'Zechariah',
  MALACHI: 'Malachi',
  MATTHEW: 'Matthew',
  MARK: 'Mark',
  LUKE: 'Luke',
  JOHN: 'John',
  ACTS: 'Acts',
  ROMANS: 'Romans',
  FIRST_CORINTHIANS: '1 Corinthians',
  SECOND_CORINTHIANS: '2 Corinthians',
  GALATIANS: 'Galatians',
  EPHESIANS: 'Ephesians',
  PHILIPPIANS: 'Philippians',
  COLOSSIANS: 'Colossians',
  FIRST_THESSALONIANS: '1 Thessalonians',
  SECOND_THESSALONIANS: '2 Thessalonians',
  FIRST_TIMOTHY: '1 Timothy',
  SECOND_TIMOTHY: '2 Timothy',
  TITUS: 'Titus',
  PHILEMON: 'Philemon',
  HEBREWS: 'Hebrews',
  JAMES: 'James',
  FIRST_PETER: '1 Peter',
  SECOND_PETER: '2 Peter',
  FIRST_JOHN: '1 John',
  SECOND_JOHN: '2 John',
  THIRD_JOHN: '3 John',
  JUDE: 'Jude',
  REVELATION: 'Revelation',
}

export function toUIBibleStudy(s: BibleStudyWithRelations): BibleStudy {
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    book: BIBLE_BOOK_MAP[s.book] ?? s.book,
    passage: s.passage ?? '',
    datePosted: isoDate(s.datePosted),
    dateFor: isoDate(s.dateFor),
    series: s.series?.name ?? 'Sunday Message',
    messenger: s.speaker?.name ?? undefined,
    keyVerse: s.keyVerseRef
      ? { verse: s.keyVerseRef, text: s.keyVerseText ?? '' }
      : undefined,
    questions: s.questions ?? '',
    answers: s.answers ?? undefined,
    transcript: s.transcript ?? undefined,
    bibleText: s.bibleText ?? undefined,
    attachments: (s.attachments ?? []).map((a) => ({
      name: a.name,
      url: a.url,
      type: a.type.toLowerCase() as BibleStudy['attachments'][0]['type'],
    })),
    hasQuestions: s.hasQuestions,
    hasAnswers: s.hasAnswers,
    hasTranscript: s.hasTranscript,
  }
}

/* -- Daily Bread -- */

export function toUIDailyBread(d: DailyBreadRecord): DailyBread {
  return {
    id: d.id,
    slug: d.slug,
    title: d.title,
    date: isoDate(d.date),
    passage: d.passage ?? '',
    keyVerse: d.keyVerse ?? '',
    body: d.body ?? '',
    bibleText: d.bibleText ?? '',
    author: d.author ?? '',
    tags: [],
    audioUrl: d.audioUrl ?? undefined,
  }
}

/* -- Campuses -- */

export function toUICampusItem(c: CampusRecord) {
  return {
    id: c.slug,
    abbreviation: c.shortName ?? c.name,
    fullName: c.name,
    href: `/ministries/campus/${c.slug}`,
  }
}
