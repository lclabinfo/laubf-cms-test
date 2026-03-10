import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client.ts')
const prisma = new mod.PrismaClient({ adapter })

const event = await prisma.event.findFirst({
  where: { id: '7963bfba-5aff-4891-ae53-bb200076a8c4' },
  select: { id: true, title: true, slug: true, coverImage: true },
})
console.log('Event:', JSON.stringify(event, null, 2))

await prisma.$disconnect()
pool.end()
