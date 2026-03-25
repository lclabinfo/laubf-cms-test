/**
 * One-off script to update the Admin role's permissions in the database
 * to match the updated DEFAULT_ROLES.ADMIN definition in lib/permissions.ts.
 *
 * Also bumps sessionVersion so all active sessions re-fetch permissions.
 *
 * Usage: npx tsx scripts/update-admin-permissions.mts
 */
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { DEFAULT_ROLES } from '../lib/permissions.ts'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client.ts')
const prisma = new mod.PrismaClient({ adapter })

const slug = process.env.CHURCH_SLUG || 'la-ubf'
const church = await prisma.church.findUnique({ where: { slug } })
if (!church) { console.log(`Church "${slug}" not found`); process.exit(1) }

// Find the Admin role for this church
const adminRole = await prisma.role.findFirst({
  where: { churchId: church.id, slug: 'admin' },
})

if (!adminRole) {
  console.log('Admin role not found in database. Nothing to update.')
  await prisma.$disconnect()
  await pool.end()
  process.exit(0)
}

const oldPerms = adminRole.permissions as string[]
const newPerms = DEFAULT_ROLES.ADMIN.permissions as string[]

const added = newPerms.filter(p => !oldPerms.includes(p))
const removed = oldPerms.filter(p => !newPerms.includes(p))

console.log(`\nAdmin role found: "${adminRole.name}" (id: ${adminRole.id})`)
console.log(`Current permissions: ${oldPerms.length}`)
console.log(`New permissions:     ${newPerms.length}`)

if (added.length > 0) {
  console.log(`\n+ Adding ${added.length} permissions:`)
  added.forEach(p => console.log(`  + ${p}`))
}
if (removed.length > 0) {
  console.log(`\n- Removing ${removed.length} permissions:`)
  removed.forEach(p => console.log(`  - ${p}`))
}

if (added.length === 0 && removed.length === 0) {
  console.log('\nNo changes needed — permissions already match.')
  await prisma.$disconnect()
  await pool.end()
  process.exit(0)
}

// Update the role and bump sessionVersion in one transaction
const [updatedRole, updatedChurch] = await prisma.$transaction([
  prisma.role.update({
    where: { id: adminRole.id },
    data: { permissions: newPerms },
    select: { permissions: true },
  }),
  prisma.church.update({
    where: { id: church.id },
    data: { sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  }),
])

console.log(`\nAdmin role updated successfully.`)
console.log(`Permissions: ${oldPerms.length} → ${(updatedRole.permissions as string[]).length}`)
console.log(`Session version: ${church.sessionVersion} → ${updatedChurch.sessionVersion}`)
console.log('All users will re-fetch permissions on their next page load.')

await prisma.$disconnect()
await pool.end()
