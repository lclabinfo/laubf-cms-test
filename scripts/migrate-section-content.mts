/**
 * Content Migration Script: Update PageSection JSONB content to match
 * the current builder format.
 *
 * Prisma migrations handle schema changes (columns, tables) but NOT
 * the data inside JSONB content fields. When the builder adds new
 * content fields (backgroundVideo, mediaType, layout, etc.), existing
 * sections need their content JSON updated to include these fields.
 *
 * This script:
 * 1. Reads all PageSection rows
 * 2. For each section type, compares content against the catalog defaults
 * 3. Adds missing fields with sensible defaults (not overwriting existing data)
 * 4. Migrates legacy field patterns (e.g., video URL in backgroundImage → backgroundVideo)
 *
 * Safe to run multiple times (idempotent).
 *
 * Usage: npx tsx scripts/migrate-section-content.mts
 */

import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

interface SectionRow {
  id: string
  sectionType: string
  content: Record<string, unknown>
}

// Video file extensions
const VIDEO_EXTS = /\.(mp4|webm|mov|ogg)(\?|$)/i

function isVideoUrl(src: string): boolean {
  return VIDEO_EXTS.test(src)
}

/**
 * Migrate HERO_BANNER content:
 * - If backgroundImage.src is a video URL, move it to backgroundVideo.src
 * - Ensure backgroundVideo exists with { src, mobileSrc }
 * - Ensure mediaType is set (infer from content)
 * - Ensure layout defaults exist
 */
function migrateHeroBanner(content: Record<string, unknown>): Record<string, unknown> {
  const updated = { ...content }

  const bgImage = (updated.backgroundImage as { src?: string; alt?: string }) ?? {}
  const bgVideo = (updated.backgroundVideo as { src?: string; mobileSrc?: string }) ?? {}

  // If backgroundImage.src is a video file, migrate to backgroundVideo
  if (bgImage.src && isVideoUrl(bgImage.src) && !bgVideo.src) {
    bgVideo.src = bgImage.src
    // Keep backgroundImage for poster/fallback but clear the video URL from it
    bgImage.src = ''
  }

  // Ensure backgroundVideo exists with both fields
  updated.backgroundVideo = {
    src: bgVideo.src ?? '',
    mobileSrc: bgVideo.mobileSrc ?? '',
  }

  // Ensure backgroundImage exists
  updated.backgroundImage = {
    src: bgImage.src ?? '',
    alt: (bgImage.alt as string) ?? 'Hero background',
  }

  // Set mediaType if not present (infer from content)
  if (!updated.mediaType) {
    updated.mediaType = (updated.backgroundVideo as { src: string }).src ? 'video' : 'image'
  }

  return updated
}

/**
 * Generic migration: ensure fields from catalog defaults exist.
 * Only adds missing top-level fields — does not overwrite existing values.
 */
function ensureDefaults(
  content: Record<string, unknown>,
  defaults: Record<string, unknown>,
): Record<string, unknown> {
  const updated = { ...content }
  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (!(key in updated) || updated[key] === undefined) {
      updated[key] = defaultValue
    }
  }
  return updated
}

// Section-specific migrations
const SECTION_MIGRATIONS: Record<string, (content: Record<string, unknown>) => Record<string, unknown>> = {
  HERO_BANNER: migrateHeroBanner,
}

// Default fields to add if missing (from section-catalog.ts)
const SECTION_DEFAULTS: Record<string, Record<string, unknown>> = {
  HERO_BANNER: {
    backgroundVideo: { src: '', mobileSrc: '' },
    backgroundImage: { src: '', alt: 'Hero background' },
  },
}

async function main() {
  console.log('=== Section Content Migration ===\n')

  // Fetch all sections
  const { rows } = await pool.query<SectionRow>(
    'SELECT id, "sectionType", content FROM "PageSection" ORDER BY "sectionType"'
  )

  console.log(`Found ${rows.length} sections total.\n`)

  let updated = 0
  let skipped = 0

  for (const row of rows) {
    const { id, sectionType, content } = row

    if (!content || typeof content !== 'object') {
      console.log(`  SKIP ${sectionType} (${id.slice(0, 8)}): no content`)
      skipped++
      continue
    }

    let newContent = { ...content }
    let changed = false

    // Run section-specific migration if available
    const migrateFn = SECTION_MIGRATIONS[sectionType]
    if (migrateFn) {
      const migrated = migrateFn(newContent)
      if (JSON.stringify(migrated) !== JSON.stringify(newContent)) {
        newContent = migrated
        changed = true
      }
    }

    // Apply default fields if missing
    const defaults = SECTION_DEFAULTS[sectionType]
    if (defaults) {
      const withDefaults = ensureDefaults(newContent, defaults)
      if (JSON.stringify(withDefaults) !== JSON.stringify(newContent)) {
        newContent = withDefaults
        changed = true
      }
    }

    if (changed) {
      await pool.query(
        'UPDATE "PageSection" SET content = $1 WHERE id = $2',
        [JSON.stringify(newContent), id]
      )
      console.log(`  UPDATED ${sectionType} (${id.slice(0, 8)}): content migrated`)
      updated++
    } else {
      skipped++
    }
  }

  console.log(`\n=== Done: ${updated} updated, ${skipped} unchanged ===`)
  await pool.end()
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
