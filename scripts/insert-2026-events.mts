import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client.ts')
const prisma = new mod.PrismaClient({ adapter })

const church = await prisma.church.findUnique({ where: { slug: 'la-ubf' } })
if (!church) { console.log('Church not found'); process.exit(1) }
const churchId = church.id

const ministries = await prisma.ministry.findMany({ where: { churchId } })
const ministryMap = new Map(ministries.map(m => [m.slug, m.id]))

const events = [
  { slug: 'spring-bible-academy-2026', title: 'Spring Bible Academy', type: 'EVENT', dateStart: '2026-03-05', dateEnd: '2026-03-06', location: 'LA UBF Main Center', shortDescription: 'A 2-day intensive Bible academy for deeper study and training.', ministryId: ministryMap.get('church-wide') || null, isRecurring: false, isFeatured: true },
  { slug: 'spring-bible-conference-2026', title: 'Spring Bible Conference', type: 'EVENT', dateStart: '2026-04-03', dateEnd: '2026-04-05', location: 'LA UBF Main Center', shortDescription: 'Our annual Spring Bible Conference — 3 days of worship, study, and fellowship.', ministryId: ministryMap.get('church-wide') || null, isRecurring: false, isFeatured: true },
  { slug: 'world-mission-conference-2026', title: 'World Mission Conference', type: 'EVENT', dateStart: '2026-05-17', dateEnd: '2026-05-22', location: 'TBD', shortDescription: 'A 6-day conference focused on world mission and the Great Commission.', ministryId: ministryMap.get('church-wide') || null, isRecurring: false, isFeatured: true },
  { slug: 'na-young-adult-conference-2026', title: 'NA Young Adult Conference', type: 'EVENT', dateStart: '2026-05-29', dateEnd: '2026-06-01', location: 'TBD', shortDescription: 'North America Young Adult Conference — 4 days of fellowship, worship, and Bible study for young adults.', ministryId: ministryMap.get('young-adult') || null, isRecurring: false, isFeatured: true },
  { slug: 'jbf-hbf-conference-2026', title: 'JBF/HBF Conference', type: 'EVENT', dateStart: '2026-07-17', dateEnd: '2026-07-19', location: 'TBD', shortDescription: 'A 3-day conference for middle and high school students.', ministryId: ministryMap.get('high-school') || null, isRecurring: false, isFeatured: false },
  { slug: 'summer-bible-conference-2026', title: 'Summer Bible Conference', type: 'EVENT', dateStart: '2026-07-24', dateEnd: '2026-07-26', location: 'TBD', shortDescription: 'Our annual Summer Bible Conference — 3 days of worship, study, and fellowship.', ministryId: ministryMap.get('church-wide') || null, isRecurring: false, isFeatured: true },
]

let created = 0
for (const evt of events) {
  const existing = await prisma.event.findUnique({ where: { churchId_slug: { churchId, slug: evt.slug } } })
  if (existing) { console.log('  Already exists:', evt.slug); continue }
  await prisma.event.create({
    data: {
      churchId,
      slug: evt.slug,
      title: evt.title,
      type: evt.type as any,
      dateStart: new Date(evt.dateStart),
      dateEnd: evt.dateEnd ? new Date(evt.dateEnd) : null,
      location: evt.location,
      shortDescription: evt.shortDescription,
      ministryId: evt.ministryId,
      isFeatured: evt.isFeatured,
      isRecurring: evt.isRecurring,
      recurrence: 'NONE' as any,
      recurrenceDays: [],
      status: 'PUBLISHED' as any,
      publishedAt: new Date(),
    },
  })
  created++
  console.log('  Created:', evt.title)
}
console.log(`Done. Created ${created} events.`)

await prisma.$disconnect()
await pool.end()
