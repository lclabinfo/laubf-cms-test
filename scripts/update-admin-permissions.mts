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

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client.ts')
const prisma = new mod.PrismaClient({ adapter })

// Inline the Admin permissions to avoid tsx ESM import issues with lib/permissions.ts
const ADMIN_PERMISSIONS = [
  'messages.view', 'messages.create', 'messages.edit_own', 'messages.edit_all',
  'messages.delete', 'messages.publish',
  'events.view', 'events.create', 'events.edit_own', 'events.edit_all',
  'events.delete', 'events.publish',
  'media.view', 'media.upload', 'media.edit_own', 'media.edit_all',
  'media.delete', 'media.manage_folders',
  'submissions.view', 'submissions.manage',
  'storage.view',
  'people.view', 'people.create', 'people.edit', 'people.delete',
  'groups.view', 'groups.manage',
  'ministries.view', 'ministries.manage',
  'campuses.view', 'campuses.manage',
  'website.pages.view',
  'website.navigation.view', 'website.navigation.edit',
  'website.theme.view',
  'website.settings.view',
  'website.domains.view',
  'users.view', 'users.invite', 'users.edit_roles', 'users.remove',
  'users.deactivate', 'users.approve_requests',
  'roles.view', 'roles.manage',
  'church.profile.view', 'church.profile.edit',
]

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
const newPerms = ADMIN_PERMISSIONS

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
