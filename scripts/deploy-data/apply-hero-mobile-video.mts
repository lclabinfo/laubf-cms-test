/**
 * Add mobile video to hero banner section and media library.
 *
 * Changes:
 *   1. Adds mobileVideo field to homepage HERO_BANNER content JSONB
 *   2. Adds the mobile video file to MediaAsset table
 *
 * This script is IDEMPOTENT — safe to run multiple times.
 *
 * Usage: npx tsx scripts/deploy-data/apply-hero-mobile-video.mts
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const client = await pool.connect()

const CDN = 'https://pub-91add7d8455848c9a871477af3249f9e.r2.dev/la-ubf'
const MOBILE_VIDEO_URL = `${CDN}/initial-setup/phone_dimension.webm`

try {
  // Resolve church ID
  const { rows: [church] } = await client.query(
    `SELECT id FROM "Church" WHERE slug = $1`, [process.env.CHURCH_SLUG || 'la-ubf']
  )
  if (!church) { console.error('Church not found'); process.exit(1) }
  const churchId = church.id

  // 1. Update hero banner content — write to backgroundVideo.mobileSrc (current field)
  // and clear legacy mobileVideo field
  const { rowCount: updated } = await client.query(`
    UPDATE "PageSection" ps
    SET content = jsonb_set(
      ps.content #- '{mobileVideo}',
      '{backgroundVideo,mobileSrc}',
      $1::jsonb
    )
    FROM "Page" p
    WHERE ps."pageId" = p.id
      AND p."churchId" = $2
      AND p.slug = ''
      AND ps."sectionType" = 'HERO_BANNER'
      AND ps.content ? 'backgroundVideo'
  `, [JSON.stringify(MOBILE_VIDEO_URL), churchId])
  console.log(`Hero banner: ${updated ? 'updated' : 'already up to date'}`)

  // 2. Add to media library
  const { rowCount: inserted } = await client.query(`
    INSERT INTO "MediaAsset" (id, "churchId", filename, url, "mimeType", "fileSize", alt, folder, "createdAt", "updatedAt")
    SELECT gen_random_uuid(), $1, 'phone_dimension.webm', $2, 'video/webm', 6027195, 'Hero banner mobile video', 'initial-setup', now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM "MediaAsset" WHERE url = $2)
  `, [churchId, MOBILE_VIDEO_URL])
  console.log(`Media library: ${inserted ? 'added' : 'already exists'}`)

  console.log('Done!')
} finally {
  client.release()
  await pool.end()
}
