/**
 * CORRECTED fix for published messages:
 *
 * Previous run incorrectly set hasVideo=false for YouTube messages (which have
 * youtubeId but null videoUrl). This script restores them.
 *
 * Steps:
 * 1. Restore hasVideo=true for all messages with a valid youtubeId
 * 2. Re-publish messages that have youtubeId and were demoted to DRAFT
 * 3. Only set hasVideo=false for messages with NO youtubeId AND NO videoUrl
 * 4. Only demote to DRAFT if truly no content (no video, no study)
 */
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const mod = await import('../lib/generated/prisma/client.ts')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  if (DRY_RUN) console.log('=== DRY RUN MODE — no changes will be made ===\n')

  // ─── Step 1: Restore hasVideo=true for all messages with youtubeId ───
  const youtubeWithBadFlag = await prisma.message.count({
    where: {
      youtubeId: { not: null },
      hasVideo: false,
    },
  })
  console.log(`[Step 1] Messages with youtubeId but hasVideo=false: ${youtubeWithBadFlag}`)

  if (youtubeWithBadFlag > 0 && !DRY_RUN) {
    const result = await prisma.message.updateMany({
      where: {
        youtubeId: { not: null },
        hasVideo: false,
      },
      data: { hasVideo: true },
    })
    console.log(`  → Restored hasVideo=true for ${result.count} YouTube messages`)
  }

  // ─── Step 2: Re-publish YouTube messages that were wrongly demoted ───
  const demotedYouTube = await prisma.message.count({
    where: {
      youtubeId: { not: null },
      status: "DRAFT",
      publishedAt: { not: null }, // was previously published
    },
  })
  console.log(`[Step 2] YouTube messages wrongly demoted to DRAFT: ${demotedYouTube}`)

  if (demotedYouTube > 0 && !DRY_RUN) {
    const result = await prisma.message.updateMany({
      where: {
        youtubeId: { not: null },
        status: "DRAFT",
        publishedAt: { not: null },
      },
      data: { status: "PUBLISHED" },
    })
    console.log(`  → Re-published ${result.count} YouTube messages`)
  }

  // ─── Step 3: Fix hasVideo flag for messages with truly NO video ───
  // Only clear hasVideo if there's no youtubeId AND no videoUrl
  const trulyNoVideo = await prisma.message.count({
    where: {
      hasVideo: true,
      youtubeId: null,
      OR: [{ videoUrl: null }, { videoUrl: "" }],
    },
  })
  console.log(`[Step 3] Messages with hasVideo=true but no youtubeId and no videoUrl: ${trulyNoVideo}`)

  if (trulyNoVideo > 0 && !DRY_RUN) {
    const result = await prisma.message.updateMany({
      where: {
        hasVideo: true,
        youtubeId: null,
        OR: [{ videoUrl: null }, { videoUrl: "" }],
      },
      data: { hasVideo: false },
    })
    console.log(`  → Set hasVideo=false for ${result.count} messages`)
  }

  // ─── Step 4: Demote PUBLISHED messages that truly have no content ───
  // No video (no youtubeId AND no videoUrl) AND no study
  const trulyNoContent = await prisma.message.count({
    where: {
      status: "PUBLISHED",
      hasVideo: false,
      hasStudy: false,
      youtubeId: null,
      OR: [{ videoUrl: null }, { videoUrl: "" }],
    },
  })
  console.log(`[Step 4] PUBLISHED messages with truly no video AND no study: ${trulyNoContent}`)

  if (trulyNoContent > 0 && !DRY_RUN) {
    const result = await prisma.message.updateMany({
      where: {
        status: "PUBLISHED",
        hasVideo: false,
        hasStudy: false,
        youtubeId: null,
        OR: [{ videoUrl: null }, { videoUrl: "" }],
      },
      data: { status: "DRAFT" },
    })
    console.log(`  → Set ${result.count} messages to DRAFT`)
  }

  // ─── Verification ───
  if (!DRY_RUN) {
    const ytNoFlag = await prisma.message.count({
      where: { youtubeId: { not: null }, hasVideo: false },
    })
    const videoUrlNoFlag = await prisma.message.count({
      where: { videoUrl: { not: null }, hasVideo: false },
    })
    const flagNoSource = await prisma.message.count({
      where: { hasVideo: true, youtubeId: null, videoUrl: null },
    })
    const publishedNoContent = await prisma.message.count({
      where: { status: "PUBLISHED", hasVideo: false, hasStudy: false },
    })
    const totalPublished = await prisma.message.count({
      where: { status: "PUBLISHED" },
    })
    const totalWithVideo = await prisma.message.count({
      where: { hasVideo: true },
    })

    console.log(`\n--- Verification ---`)
    console.log(`youtubeId present but hasVideo=false: ${ytNoFlag} (should be 0)`)
    console.log(`videoUrl present but hasVideo=false: ${videoUrlNoFlag} (should be 0)`)
    console.log(`hasVideo=true but no youtubeId/videoUrl: ${flagNoSource} (should be 0)`)
    console.log(`PUBLISHED with no content: ${publishedNoContent} (should be 0)`)
    console.log(`Total PUBLISHED messages: ${totalPublished}`)
    console.log(`Total with hasVideo=true: ${totalWithVideo}`)
  }

  console.log('\nDone.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
