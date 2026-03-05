import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client.ts')
const prisma = new mod.PrismaClient({ adapter })

const events = await prisma.event.findMany({
  where: { slug: { in: ['spring-family-retreat-2026', 'weekly-leaders-meeting', 'summer-bible-academy'] } },
  include: { eventLinks: true },
  orderBy: { dateStart: 'asc' },
})

console.log(`\nFound ${events.length} test events:\n`)

for (const e of events) {
  console.log('═'.repeat(70))
  console.log(`TITLE: ${e.title}`)
  console.log(`Slug: ${e.slug}`)
  console.log(`Type: ${e.type} | Status: ${e.status}`)
  console.log(`Date: ${e.dateStart?.toISOString().slice(0,10)} - ${e.dateEnd?.toISOString().slice(0,10) ?? '(no end)'}`)
  console.log(`Time: ${e.startTime} - ${e.endTime} | All Day: ${e.allDay}`)
  console.log(`Location Type: ${e.locationType}`)
  console.log(`Location: ${e.location ?? '(none)'} | Address: ${e.address ?? '(none)'}`)
  console.log(`Location Instructions: ${e.locationInstructions ?? '(none)'}`)
  console.log(`Directions URL: ${e.directionsUrl ?? '(none)'}`)
  console.log(`Lat/Lng: ${e.latitude?.toString() ?? 'N/A'} / ${e.longitude?.toString() ?? 'N/A'}`)
  console.log(`Meeting URL: ${e.meetingUrl ?? '(none)'}`)
  console.log(`Short Desc: ${e.shortDescription?.slice(0, 80) ?? '(none)'}`)
  console.log(`Description: ${e.description ? e.description.slice(0, 100) + '...' : '(none)'}`)
  console.log(`Welcome Message: ${e.welcomeMessage ? 'Yes (' + e.welcomeMessage.length + ' chars)' : '(none)'}`)
  console.log(`Cover Image: ${e.coverImage ? 'Yes' : '(none)'} | Alt: ${e.imageAlt ?? '(none)'} | Position: ${e.imagePosition ?? '(none)'}`)
  console.log(`Contacts: ${JSON.stringify(e.contacts)}`)
  console.log(`Badge: ${e.badge ?? '(none)'}`)
  console.log(`Cost: ${e.costType} ${e.costAmount ?? ''}`)
  console.log(`Registration Required: ${e.registrationRequired} | URL: ${e.registrationUrl ?? '(none)'}`)
  console.log(`Max Participants: ${e.maxParticipants ?? '(none)'} | Deadline: ${e.registrationDeadline?.toISOString() ?? '(none)'}`)
  console.log(`Featured: ${e.isFeatured} | Pinned: ${e.isPinned}`)
  console.log(`Recurring: ${e.isRecurring} | Recurrence: ${e.recurrence}`)
  console.log(`Recurrence Days: [${e.recurrenceDays.join(', ')}]`)
  console.log(`Recurrence End: ${e.recurrenceEndType} | End Date: ${e.recurrenceEndDate?.toISOString() ?? '(none)'} | End After: ${e.recurrenceEndAfter ?? '(none)'}`)
  console.log(`Recurrence Schedule: ${e.recurrenceSchedule ?? '(none)'}`)
  console.log(`EventLinks: ${e.eventLinks.length} records`)
  for (const l of e.eventLinks) {
    console.log(`  - ${l.label}: ${l.href} (external: ${l.external})`)
  }
  console.log(`Published At: ${e.publishedAt?.toISOString() ?? '(none)'}`)
  console.log(`Created At: ${e.createdAt.toISOString()}`)
  console.log(`View Count: ${e.viewCount} | Reg Count: ${e.registrationCount}`)
  console.log()
}

await prisma.$disconnect()
await pool.end()
