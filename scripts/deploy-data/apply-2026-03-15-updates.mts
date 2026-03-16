/**
 * Apply DB updates from 2026-03-15 morning session.
 *
 * Changes:
 *   1. Add anchorId to 4 sections on the I'm New page (for button scroll targets)
 *   2. Set default OG image on SiteSettings (congregation photo)
 *   3. Set OG image on I'm New page (Sunday worship photo)
 *
 * This script is IDEMPOTENT — safe to run multiple times.
 * It only updates specific fields and does not delete/recreate anything.
 *
 * Usage: npx tsx scripts/deploy-data/apply-2026-03-15-updates.mts
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

const CDN = 'https://pub-91add7d8455848c9a871477af3249f9e.r2.dev/la-ubf/initial-setup'

// ============================================================
// Resolve church ID
// ============================================================
const slug = process.env.CHURCH_SLUG || 'la-ubf'
const church = await prisma.church.findUnique({ where: { slug } })
if (!church) {
  console.error(`Church not found: ${slug}`)
  process.exit(1)
}
const churchId = church.id
console.log(`Church: ${church.name} (${churchId})\n`)

// ============================================================
// 1. Add anchorId to I'm New page sections
// ============================================================
console.log('── Updating I\'m New page section anchor IDs ──')

const imNewPage = await prisma.page.findFirst({
  where: { churchId, slug: 'im-new' },
  include: { sections: { orderBy: { sortOrder: 'asc' } } },
})

if (!imNewPage) {
  console.warn('  ⚠ I\'m New page not found — skipping anchor IDs')
} else {
  const anchorMap: Record<string, string> = {
    'TIMELINE_SECTION': 'what-to-expect',
    'CAMPUS_CARD_GRID': 'campus-ministry',
    'FORM_SECTION': 'plan-visit',
    'FAQ_SECTION': 'faq',
  }

  for (const section of imNewPage.sections) {
    const anchorId = anchorMap[section.sectionType]
    if (!anchorId) continue

    const content = section.content as Record<string, unknown>
    if (content.anchorId === anchorId) {
      console.log(`  ✓ ${section.label} — already has anchorId "${anchorId}"`)
      continue
    }

    await prisma.pageSection.update({
      where: { id: section.id },
      data: { content: { ...content, anchorId } },
    })
    console.log(`  ✓ ${section.label} — set anchorId "${anchorId}"`)
  }
}

// ============================================================
// 2. Set default OG image on SiteSettings
// ============================================================
console.log('\n── Updating SiteSettings OG image ──')

const ogImageUrl = `${CDN}/compressed-congregation.jpg`

const siteSettings = await prisma.siteSettings.findFirst({ where: { churchId } })
if (!siteSettings) {
  console.warn('  ⚠ SiteSettings not found — skipping')
} else if (siteSettings.ogImageUrl === ogImageUrl) {
  console.log(`  ✓ Already set`)
} else {
  await prisma.siteSettings.update({
    where: { id: siteSettings.id },
    data: { ogImageUrl },
  })
  console.log(`  ✓ Set ogImageUrl → ${ogImageUrl}`)
}

// ============================================================
// 3. Set OG image on I'm New page
// ============================================================
console.log('\n── Updating I\'m New page OG image ──')

const imNewOgImage = `${CDN}/images-home-compressed-sunday-worship.jpg`

if (!imNewPage) {
  console.warn('  ⚠ I\'m New page not found — skipping')
} else if (imNewPage.ogImageUrl === imNewOgImage) {
  console.log(`  ✓ Already set`)
} else {
  await prisma.page.update({
    where: { id: imNewPage.id },
    data: { ogImageUrl: imNewOgImage },
  })
  console.log(`  ✓ Set ogImageUrl → ${imNewOgImage}`)
}

// ============================================================
// Done
// ============================================================
console.log('\n✅ All updates applied.')
await prisma.$disconnect()
await pool.end()
