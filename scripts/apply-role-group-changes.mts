/**
 * Apply role & group changes to the local DB:
 * 1. Rename Owner → "Owner (Dev)" and update permissions
 * 2. Remove website edit permissions from Admin (view-only)
 * 3. Delete the "Pastor" PersonRoleDefinition and its assignments
 * 4. Rename "Speaker" group → "Messenger"
 *
 * Usage: npx tsx scripts/apply-role-group-changes.mts
 */
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client.ts')
const prisma = new (mod.PrismaClient)({ adapter })
const { DEFAULT_ROLES } = await import('../lib/permissions.ts')

const churchSlug = process.env.CHURCH_SLUG || 'la-ubf'
const church = await prisma.church.findFirstOrThrow({ where: { slug: churchSlug } })
const churchId = church.id

console.log(`Church: ${church.name} (${churchId})\n`)

// ── 1. Update all default roles with latest permissions ──
console.log('1. Updating default roles...')
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
    update: {
      name: d.name,
      description: d.description,
      permissions: d.permissions,
    },
  })
  console.log(`  ${key}: "${role.name}" — ${d.permissions.length} permissions`)
}

// ── 2. Delete Pastor group and its assignments ──
console.log('\n2. Removing Pastor group...')
const pastorGroup = await prisma.personRoleDefinition.findFirst({
  where: { churchId, slug: 'pastor' },
})

if (pastorGroup) {
  // Delete assignments first (FK constraint)
  const deleted = await prisma.personRoleAssignment.deleteMany({
    where: { roleId: pastorGroup.id },
  })
  console.log(`  Deleted ${deleted.count} Pastor role assignments`)

  await prisma.personRoleDefinition.delete({
    where: { id: pastorGroup.id },
  })
  console.log('  Deleted Pastor group definition')
} else {
  console.log('  Pastor group not found (already removed)')
}

// ── 3. Rename "Speaker" group → "Messenger" ──
console.log('\n3. Renaming Speaker → Messenger...')
const speakerGroup = await prisma.personRoleDefinition.findFirst({
  where: { churchId, slug: 'speaker' },
})

if (speakerGroup) {
  await prisma.personRoleDefinition.update({
    where: { id: speakerGroup.id },
    data: { name: 'Messenger', slug: 'messenger', description: 'Members who deliver Sunday messages and Bible study teachings' },
  })
  console.log('  Renamed Speaker → Messenger')
} else {
  console.log('  Speaker group not found (already renamed or doesn\'t exist)')
}

// ── 4. Verify ──
console.log('\n3. Verification:')
const roles = await prisma.role.findMany({
  where: { churchId },
  orderBy: { priority: 'desc' },
  select: { name: true, slug: true, priority: true, permissions: true },
})
for (const r of roles) {
  const websiteEdit = r.permissions.filter(p => p.startsWith('website.') && (p.includes('.edit') || p.includes('.create') || p.includes('.delete') || p.includes('.manage')))
  const websiteView = r.permissions.filter(p => p.startsWith('website.') && p.includes('.view'))
  console.log(`  ${r.name} (${r.slug}, priority ${r.priority}):`)
  console.log(`    website view: ${websiteView.length}, website edit: ${websiteEdit.length}`)
}

const groups = await prisma.personRoleDefinition.findMany({
  where: { churchId },
  select: { name: true, slug: true },
})
console.log(`\n  Groups remaining: ${groups.map(g => g.name).join(', ') || '(none)'}`)

console.log('\nDone!')
await pool.end()
