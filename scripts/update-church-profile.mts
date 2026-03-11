/**
 * One-time script to update church profile data in live DB.
 * Run with: npx tsx scripts/update-church-profile.mts
 */
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const mod = await import('../lib/generated/prisma/client.ts')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

async function main() {
  // Get church
  const church = await prisma.church.findFirst({ where: { slug: 'la-ubf' } })
  if (!church) { console.log('ERROR: Church not found'); return }
  console.log('Found church:', church.id)

  // 1. Update Church record
  const updated = await prisma.church.update({
    where: { id: church.id },
    data: {
      email: 'laubf.downey@gmail.com',
      phone: '(562) 396-6350',
      address: '11625 Paramount Blvd',
      city: 'Downey',
      state: 'CA',
      zipCode: '90241',
      facebookUrl: 'https://facebook.com/losangelesubf',
      instagramUrl: 'https://instagram.com/la.ubf',
      youtubeUrl: 'https://www.youtube.com/channel/UC1SRAeGrnVlvoEEMZ-htVlA',
    },
  })
  console.log('✓ Updated church:', updated.name, '|', updated.address, updated.city, '|', updated.email)

  // 2. Update SiteSettings
  const ss = await prisma.siteSettings.update({
    where: { churchId: church.id },
    data: {
      contactAddress: '11625 Paramount Blvd, Downey, CA 90241',
      youtubeUrl: 'https://www.youtube.com/channel/UC1SRAeGrnVlvoEEMZ-htVlA',
      tiktokUrl: 'https://www.tiktok.com/@la.ubf',
    },
  })
  console.log('✓ Updated site settings:', ss.contactAddress, '| yt:', ss.youtubeUrl, '| tiktok:', ss.tiktokUrl)

  // 3. Delete non-recurring events
  const keepSlugs = ['daily-bread-meeting', 'evening-prayer-meeting', 'mens-bible-study', 'sunday-livestream']
  const deleted = await prisma.event.deleteMany({
    where: {
      churchId: church.id,
      slug: { notIn: keepSlugs },
    },
  })
  console.log('✓ Deleted', deleted.count, 'non-recurring events')

  // 4. Update Daily Bread meeting URL to include password
  const dbMeeting = await prisma.event.updateMany({
    where: { churchId: church.id, slug: 'daily-bread-meeting' },
    data: { meetingUrl: 'https://us02web.zoom.us/j/86540458764?pwd=ZDVUUjZDOVZ4WlJFc1VvNVlzd2tkQT09' },
  })
  console.log('✓ Updated daily bread meeting URL:', dbMeeting.count, 'rows')

  // 5. Update footer menu YouTube link
  const footerMenu = await prisma.menu.findFirst({ where: { churchId: church.id, location: 'FOOTER' } })
  if (footerMenu) {
    const ytItem = await prisma.menuItem.findFirst({
      where: { menuId: footerMenu.id, label: 'LA UBF YouTube' },
    })
    if (ytItem) {
      await prisma.menuItem.update({
        where: { id: ytItem.id },
        data: { href: 'https://www.youtube.com/channel/UC1SRAeGrnVlvoEEMZ-htVlA' },
      })
      console.log('✓ Updated footer YouTube link')
    } else {
      console.log('⚠ Footer YouTube menu item not found')
    }
  } else {
    console.log('⚠ Footer menu not found')
  }

  // 6. Update PageSection content with correct address
  const sections = await prisma.pageSection.findMany({
    where: { churchId: church.id },
    select: { id: true, sectionType: true, content: true },
  })

  let sectionUpdates = 0
  for (const section of sections) {
    const contentStr = JSON.stringify(section.content)
    if (contentStr.includes('11625 Paramount Boulevard')) {
      const newContentStr = contentStr
        .replace(/11625 Paramount Boulevard,/g, '11625 Paramount Blvd,')
        .replace(/"Downey, CA"/g, '"Downey, CA 90241"')
      const newContent = JSON.parse(newContentStr)
      await prisma.pageSection.update({
        where: { id: section.id },
        data: { content: newContent },
      })
      sectionUpdates++
      console.log('  ✓ Updated section:', section.sectionType)
    }
  }
  console.log('✓ Updated', sectionUpdates, 'page sections')

  // Verify remaining events
  const events = await prisma.event.findMany({
    where: { churchId: church.id },
    select: { slug: true, title: true, isRecurring: true },
  })
  console.log('\nRemaining events:')
  for (const e of events) {
    console.log(`  - ${e.slug} (recurring: ${e.isRecurring})`)
  }

  console.log('\n✓ All updates complete!')
}

main()
  .then(() => prisma.$disconnect())
  .then(() => pool.end())
  .catch((e) => { console.error(e); process.exit(1) })
