/**
 * Apply church profile data to the database.
 *
 * Updates the Church record with current branding, contact info,
 * social links, worship services, and operational settings.
 *
 * This is IDEMPOTENT — safe to run multiple times.
 * Does NOT delete/recreate the church — only updates fields.
 *
 * Usage: npx tsx scripts/deploy-data/apply-church-profile.mts
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const mod = await import('../../lib/generated/prisma/client.ts')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

const slug = process.env.CHURCH_SLUG || 'la-ubf'
const church = await prisma.church.findUnique({ where: { slug } })
if (!church) {
  console.error(`Church not found: ${slug}`)
  process.exit(1)
}

console.log(`Updating church profile: ${church.name} (${church.id})\n`)

await prisma.church.update({
  where: { id: church.id },
  data: {
    name: 'LA UBF',
    email: 'laubf.downey@gmail.com',
    phone: '(562) 396-6350',
    address: '11625 Paramount Blvd',
    city: 'Downey',
    state: 'CA',
    zipCode: '90241',
    country: 'US',
    timezone: 'America/Los_Angeles',
    locale: 'en-US',
    websiteUrl: 'https://laubf.org',
    facebookUrl: 'https://facebook.com/losangelesubf',
    instagramUrl: 'https://instagram.com/la.ubf',
    youtubeUrl: 'https://www.youtube.com/channel/UC1SRAeGrnVlvoEEMZ-htVlA',
    settings: {
      description: 'LA UBF (Los Angeles University Bible Fellowship) is a Bible-centered community raising lifelong disciples on college campuses and beyond.',
      emails: [{ label: 'General', value: 'laubf.downey@gmail.com' }],
      phones: [{ label: 'Main', value: '(562) 396-6350' }],
      worshipServices: [
        { day: 'Sunday', startTime: '11:00 AM', endTime: '12:30 PM', description: 'Sunday Worship Service' },
      ],
      extraSocialLinks: [
        { platform: 'tiktok', url: 'https://www.tiktok.com/@la.ubf' },
      ],
    },
  },
})

console.log('✅ Church profile updated successfully!')
console.log('   Name, contact, address, social links, worship services')

await prisma.$disconnect()
await pool.end()
