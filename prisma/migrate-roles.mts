// prisma/migrate-roles.mts
// Creates default roles for all existing churches and assigns roleId
// to all existing ChurchMember records based on their MemberRole enum.
// Idempotent — safe to run multiple times.

import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
const { DEFAULT_ROLES } = await import('../lib/permissions.ts')

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const mod = await import('../lib/generated/prisma/client.ts')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

async function main() {
  const churches = await prisma.church.findMany({ select: { id: true, name: true } })
  console.log(`Found ${churches.length} church(es)`)

  for (const church of churches) {
    console.log(`\nProcessing church: ${church.name} (${church.id})`)

    // Create default roles for this church (upsert to be idempotent)
    const roleMap: Record<string, string> = {}
    for (const [key, def] of Object.entries(DEFAULT_ROLES)) {
      const role = await prisma.role.upsert({
        where: { churchId_slug: { churchId: church.id, slug: def.slug } },
        create: {
          churchId: church.id,
          name: def.name,
          slug: def.slug,
          description: def.description,
          priority: def.priority,
          isSystem: def.isSystem,
          permissions: def.permissions,
        },
        update: {}, // Don't overwrite if already exists
      })
      roleMap[key] = role.id
    }
    console.log(`  Created/verified ${Object.keys(roleMap).length} roles`)

    // Assign roleId to all members based on their current role enum
    const members = await prisma.churchMember.findMany({
      where: { churchId: church.id, roleId: null },
      select: { id: true, role: true },
    })

    for (const member of members) {
      const roleId = roleMap[member.role]
      if (roleId) {
        await prisma.churchMember.update({
          where: { id: member.id },
          data: { roleId },
        })
      }
    }

    console.log(`  Updated ${members.length} member(s) with roleId`)
  }
}

main()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
