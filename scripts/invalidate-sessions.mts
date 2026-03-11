/**
 * Invalidate all user sessions by bumping the church's sessionVersion.
 * All active JWTs will re-fetch permissions on their next request.
 *
 * Usage: npx tsx scripts/invalidate-sessions.mts
 */
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client.ts')
const prisma = new mod.PrismaClient({ adapter })

const slug = process.env.CHURCH_SLUG || 'la-ubf'
const church = await prisma.church.findUnique({ where: { slug } })
if (!church) { console.log(`Church "${slug}" not found`); process.exit(1) }

const updated = await prisma.church.update({
  where: { id: church.id },
  data: { sessionVersion: { increment: 1 } },
  select: { sessionVersion: true },
})

console.log(`Sessions invalidated for "${slug}". Version: ${church.sessionVersion} → ${updated.sessionVersion}`)
console.log('All users will have their permissions refreshed on their next page load.')

await prisma.$disconnect()
await pool.end()
