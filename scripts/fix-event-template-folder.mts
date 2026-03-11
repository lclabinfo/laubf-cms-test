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

// Ensure "Events" folder exists
const eventsFolder = await prisma.mediaFolder.upsert({
  where: { churchId_name: { churchId, name: 'Events' } },
  update: {},
  create: { churchId, name: 'Events' },
})
console.log('Events folder:', eventsFolder.id)

// Move assets from "event-templates" to "Events"
const moved = await prisma.mediaAsset.updateMany({
  where: { churchId, folder: 'event-templates' },
  data: { folder: 'Events' },
})
console.log(`Moved ${moved.count} assets from "event-templates" to "Events"`)

// Delete the old empty folder
const deleted = await prisma.mediaFolder.deleteMany({
  where: { churchId, name: 'event-templates' },
})
console.log(`Deleted ${deleted.count} old "event-templates" folder(s)`)

await prisma.$disconnect()
await pool.end()
