/**
 * Website Snapshot — Export & Restore website builder data
 *
 * Exports or restores ONLY website-builder-related data:
 *   - SiteSettings
 *   - Theme + ThemeCustomization
 *   - Menus + MenuItems (with parent-child hierarchy)
 *   - Pages + PageSections (with parent-child page hierarchy)
 *
 * Content tables (messages, events, people, etc.) are NOT touched.
 *
 * Usage:
 *   npx tsx scripts/website-snapshot.mts export              # Export to timestamped file
 *   npx tsx scripts/website-snapshot.mts export my-backup    # Export to named file
 *   npx tsx scripts/website-snapshot.mts restore <file>      # Restore from file (DRY RUN)
 *   npx tsx scripts/website-snapshot.mts restore <file> --apply  # Actually restore
 *   npx tsx scripts/website-snapshot.mts list                # List available snapshots
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const mod = await import('../lib/generated/prisma/client.ts')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

const SNAPSHOTS_DIR = path.resolve(__dirname, '../prisma/backups/website-snapshots')

// ============================================================
// Resolve church
// ============================================================
const slug = process.env.CHURCH_SLUG || 'la-ubf'
const church = await prisma.church.findUnique({ where: { slug } })
if (!church) {
  console.error(`Church not found: ${slug}`)
  process.exit(1)
}
const churchId = church.id

// ============================================================
// CLI parsing
// ============================================================
const args = process.argv.slice(2)
const command = args[0]

if (!command || !['export', 'restore', 'list'].includes(command)) {
  console.log(`
Website Snapshot — Export & Restore website builder data

Usage:
  npx tsx scripts/website-snapshot.mts export [name]           Export current state
  npx tsx scripts/website-snapshot.mts restore <file> [--apply]  Restore from snapshot
  npx tsx scripts/website-snapshot.mts list                    List available snapshots
`)
  await pool.end()
  process.exit(0)
}

// ============================================================
// EXPORT
// ============================================================
async function exportSnapshot(name?: string) {
  console.log(`Exporting website data for ${church!.name}...\n`)

  // 1. Site Settings
  const siteSettings = await prisma.siteSettings.findFirst({ where: { churchId } })
  console.log(`  SiteSettings: ${siteSettings ? 'found' : 'MISSING'}`)

  // 2. Theme + Customization
  const themeCustomization = await prisma.themeCustomization.findFirst({
    where: { churchId },
    include: { theme: true },
  })
  console.log(`  Theme: ${themeCustomization?.theme?.name ?? 'MISSING'}`)
  console.log(`  ThemeCustomization: ${themeCustomization ? 'found' : 'MISSING'}`)

  // 3. Menus + Items
  const menus = await prisma.menu.findMany({
    where: { churchId },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
        include: { children: { orderBy: { sortOrder: 'asc' } } },
      },
    },
    orderBy: { location: 'asc' },
  })
  const totalMenuItems = menus.reduce(
    (sum, m) => sum + m.items.length + m.items.reduce((s, i) => s + (i.children?.length ?? 0), 0),
    0,
  )
  console.log(`  Menus: ${menus.length} (${totalMenuItems} items)`)

  // 4. Pages + Sections
  const pages = await prisma.page.findMany({
    where: { churchId, deletedAt: null },
    include: { sections: { orderBy: { sortOrder: 'asc' } } },
    orderBy: [{ sortOrder: 'asc' }],
  })
  const totalSections = pages.reduce((sum, p) => sum + p.sections.length, 0)
  console.log(`  Pages: ${pages.length} (${totalSections} sections)`)

  // Build the snapshot object — strip DB-generated fields (id, churchId, timestamps)
  const snapshot = {
    _meta: {
      format: 'website-snapshot-v1',
      church: church!.name,
      churchSlug: church!.slug,
      exportedAt: new Date().toISOString(),
      counts: {
        pages: pages.length,
        sections: totalSections,
        menus: menus.length,
        menuItems: totalMenuItems,
      },
    },

    siteSettings: siteSettings
      ? stripFields(siteSettings, ['id', 'churchId', 'createdAt', 'updatedAt'])
      : null,

    theme: themeCustomization?.theme
      ? stripFields(themeCustomization.theme, ['id', 'createdAt', 'updatedAt'])
      : null,

    themeCustomization: themeCustomization
      ? stripFields(themeCustomization, [
          'id',
          'churchId',
          'themeId',
          'createdAt',
          'updatedAt',
          'theme',
        ])
      : null,

    menus: menus.map((menu) => ({
      name: menu.name,
      slug: menu.slug,
      location: menu.location,
      items: menu.items
        .filter((item) => !item.parentId) // top-level only
        .map((item) => ({
          ...stripFields(item, [
            'id',
            'menuId',
            'parentId',
            'createdAt',
            'updatedAt',
            'children',
          ]),
          children: (item.children ?? []).map((child) =>
            stripFields(child, ['id', 'menuId', 'parentId', 'createdAt', 'updatedAt', 'children']),
          ),
        })),
    })),

    pages: pages.map((page) => {
      // If page has a parent, store parentSlug so we can re-link on restore
      const parentPage = page.parentId ? pages.find((p) => p.id === page.parentId) : null
      return {
        ...stripFields(page, [
          'id',
          'churchId',
          'parentId',
          'createdAt',
          'updatedAt',
          'createdBy',
          'updatedBy',
          'deletedAt',
          'sections',
        ]),
        parentSlug: parentPage?.slug ?? null,
        sections: page.sections.map((section) =>
          stripFields(section, [
            'id',
            'churchId',
            'pageId',
            'createdAt',
            'updatedAt',
            'createdBy',
            'updatedBy',
          ]),
        ),
      }
    }),
  }

  // Write to file
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true })
  const timestamp = new Date().toISOString().slice(0, 10)
  const filename = name ? `${name}.json` : `${timestamp}-website-snapshot.json`
  const filepath = path.join(SNAPSHOTS_DIR, filename)

  fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2))
  console.log(`\nExported to: ${path.relative(process.cwd(), filepath)}`)
  console.log(`Size: ${(fs.statSync(filepath).size / 1024).toFixed(1)} KB`)
}

// ============================================================
// RESTORE (dry run by default)
// ============================================================
async function restoreSnapshot(file: string, apply: boolean) {
  // Resolve file path
  let filepath = file
  if (!fs.existsSync(filepath)) {
    filepath = path.join(SNAPSHOTS_DIR, file)
  }
  if (!fs.existsSync(filepath)) {
    filepath = path.join(SNAPSHOTS_DIR, `${file}.json`)
  }
  if (!fs.existsSync(filepath)) {
    console.error(`Snapshot not found: ${file}`)
    console.log(`\nAvailable snapshots:`)
    listSnapshots()
    await pool.end()
    process.exit(1)
  }

  const raw = fs.readFileSync(filepath, 'utf-8')
  const snapshot = JSON.parse(raw)

  // Validate format
  if (snapshot._meta?.format !== 'website-snapshot-v1') {
    console.error(`Invalid snapshot format. Expected 'website-snapshot-v1', got '${snapshot._meta?.format}'`)
    await pool.end()
    process.exit(1)
  }

  console.log(`Snapshot: ${path.basename(filepath)}`)
  console.log(`Exported: ${snapshot._meta.exportedAt}`)
  console.log(`Church: ${snapshot._meta.church}`)
  console.log(`Contents: ${snapshot._meta.counts.pages} pages, ${snapshot._meta.counts.sections} sections, ${snapshot._meta.counts.menus} menus`)
  console.log('')

  if (!apply) {
    console.log('DRY RUN — showing what would happen. Add --apply to execute.\n')
  }

  // Count current data
  const currentPages = await prisma.page.count({ where: { churchId, deletedAt: null } })
  const currentSections = await prisma.pageSection.count({ where: { churchId } })
  const currentMenus = await prisma.menu.count({ where: { churchId } })

  console.log('Current state:')
  console.log(`  ${currentPages} pages, ${currentSections} sections, ${currentMenus} menus`)
  console.log('')
  console.log('After restore:')
  console.log(`  ${snapshot._meta.counts.pages} pages, ${snapshot._meta.counts.sections} sections, ${snapshot._meta.counts.menus} menus`)
  console.log('')

  if (!apply) {
    console.log('Operations that would execute:')
    console.log('  1. Delete all PageSections for this church')
    console.log('  2. Delete all Pages for this church')
    console.log('  3. Delete all MenuItems for this church')
    console.log('  4. Delete all Menus for this church')
    console.log('  5. Delete ThemeCustomization for this church')
    console.log('  6. Upsert SiteSettings')
    console.log('  7. Upsert Theme (global, by slug)')
    console.log('  8. Create ThemeCustomization')
    console.log(`  9. Create ${snapshot.menus?.length ?? 0} menus with items`)
    console.log(`  10. Create ${snapshot.pages?.length ?? 0} pages with sections`)
    console.log(`  11. Re-link parent pages by slug`)
    console.log('')
    console.log('To execute: npx tsx scripts/website-snapshot.mts restore ' + path.basename(filepath) + ' --apply')
    return
  }

  // ---- APPLY ----
  console.log('Restoring...\n')

  // 1. Clean existing website data (order matters for FK constraints)
  console.log('  Cleaning existing website data...')
  const delSections = await prisma.pageSection.deleteMany({ where: { churchId } })
  console.log(`    Deleted ${delSections.count} sections`)

  const delPages = await prisma.page.deleteMany({ where: { churchId } })
  console.log(`    Deleted ${delPages.count} pages`)

  const existingMenus = await prisma.menu.findMany({ where: { churchId }, select: { id: true } })
  if (existingMenus.length > 0) {
    const menuIds = existingMenus.map((m) => m.id)
    const delItems = await prisma.menuItem.deleteMany({ where: { menuId: { in: menuIds } } })
    console.log(`    Deleted ${delItems.count} menu items`)
  }
  const delMenus = await prisma.menu.deleteMany({ where: { churchId } })
  console.log(`    Deleted ${delMenus.count} menus`)

  const delCustom = await prisma.themeCustomization.deleteMany({ where: { churchId } })
  console.log(`    Deleted ${delCustom.count} theme customizations`)

  // Don't delete SiteSettings — upsert instead
  console.log('')

  // 2. Site Settings
  if (snapshot.siteSettings) {
    console.log('  Restoring SiteSettings...')
    await prisma.siteSettings.upsert({
      where: { churchId },
      update: snapshot.siteSettings,
      create: { churchId, ...snapshot.siteSettings },
    })
    console.log('    Done')
  }

  // 3. Theme (global, not church-scoped)
  let themeId: string | null = null
  if (snapshot.theme) {
    console.log(`  Restoring Theme (${snapshot.theme.name})...`)
    const theme = await prisma.theme.upsert({
      where: { slug: snapshot.theme.slug },
      update: stripFields(snapshot.theme, ['slug']),
      create: snapshot.theme,
    })
    themeId = theme.id
    console.log('    Done')
  }

  // 4. ThemeCustomization
  if (snapshot.themeCustomization && themeId) {
    console.log('  Restoring ThemeCustomization...')
    await prisma.themeCustomization.create({
      data: { churchId, themeId, ...snapshot.themeCustomization },
    })
    console.log('    Done')
  }

  // 5. Menus + Items
  if (snapshot.menus) {
    console.log(`  Restoring ${snapshot.menus.length} menus...`)
    for (const menuData of snapshot.menus) {
      const menu = await prisma.menu.create({
        data: {
          churchId,
          name: menuData.name,
          slug: menuData.slug,
          location: menuData.location,
        },
      })

      for (const item of menuData.items ?? []) {
        const { children, ...itemFields } = item
        const parent = await prisma.menuItem.create({
          data: { menuId: menu.id, ...itemFields },
        })

        for (const child of children ?? []) {
          await prisma.menuItem.create({
            data: { menuId: menu.id, parentId: parent.id, ...child },
          })
        }
      }
      console.log(`    ${menuData.location}: ${menuData.name} (${menuData.items?.length ?? 0} items)`)
    }
  }

  // 6. Pages + Sections (two passes: create pages, then link parents)
  if (snapshot.pages) {
    console.log(`  Restoring ${snapshot.pages.length} pages...`)

    // Map slug -> created page ID for parent linking
    const slugToId = new Map<string, string>()

    // Pass 1: Create all pages + sections (without parentId)
    for (const pageData of snapshot.pages) {
      const { sections, parentSlug, ...pageFields } = pageData
      const page = await prisma.page.create({
        data: {
          churchId,
          ...pageFields,
          publishedAt: pageFields.publishedAt ? new Date(pageFields.publishedAt) : new Date(),
        },
      })
      slugToId.set(page.slug, page.id)

      for (let i = 0; i < (sections ?? []).length; i++) {
        const s = sections[i]
        await prisma.pageSection.create({
          data: {
            churchId,
            pageId: page.id,
            sectionType: s.sectionType,
            label: s.label ?? null,
            sortOrder: s.sortOrder ?? i,
            visible: s.visible ?? true,
            colorScheme: s.colorScheme ?? 'LIGHT',
            paddingY: s.paddingY ?? 'DEFAULT',
            containerWidth: s.containerWidth ?? 'STANDARD',
            enableAnimations: s.enableAnimations ?? true,
            content: s.content ?? {},
          },
        })
      }
      console.log(`    ${pageFields.slug || '(home)'}: ${(sections ?? []).length} sections`)
    }

    // Pass 2: Link parent pages
    let linked = 0
    for (const pageData of snapshot.pages) {
      if (pageData.parentSlug) {
        const parentId = slugToId.get(pageData.parentSlug)
        const childId = slugToId.get(pageData.slug)
        if (parentId && childId) {
          await prisma.page.update({
            where: { id: childId },
            data: { parentId },
          })
          linked++
        }
      }
    }
    if (linked > 0) {
      console.log(`    Linked ${linked} child pages to parents`)
    }
  }

  console.log('\nRestore complete!')
}

// ============================================================
// LIST
// ============================================================
function listSnapshots() {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    console.log('No snapshots directory found.')
    return
  }

  const files = fs.readdirSync(SNAPSHOTS_DIR).filter((f) => f.endsWith('.json')).sort().reverse()
  if (files.length === 0) {
    console.log('No snapshots found.')
    return
  }

  console.log(`\nAvailable snapshots (${SNAPSHOTS_DIR}):\n`)
  for (const file of files) {
    const filepath = path.join(SNAPSHOTS_DIR, file)
    const size = (fs.statSync(filepath).size / 1024).toFixed(1)
    try {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'))
      const meta = data._meta
      console.log(
        `  ${file} (${size} KB) — ${meta?.counts?.pages ?? '?'} pages, ${meta?.counts?.sections ?? '?'} sections — ${meta?.exportedAt ?? 'unknown date'}`,
      )
    } catch {
      console.log(`  ${file} (${size} KB) — could not read metadata`)
    }
  }
}

// ============================================================
// Utility
// ============================================================
function stripFields(obj: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const copy = { ...obj }
  for (const f of fields) {
    delete copy[f]
  }
  return copy
}

// ============================================================
// Run
// ============================================================
try {
  if (command === 'export') {
    await exportSnapshot(args[1])
  } else if (command === 'restore') {
    if (!args[1]) {
      console.error('Please specify a snapshot file to restore from.')
      console.log('Run: npx tsx scripts/website-snapshot.mts list')
      process.exit(1)
    }
    const apply = args.includes('--apply')
    await restoreSnapshot(args[1], apply)
  } else if (command === 'list') {
    listSnapshots()
  }
} finally {
  await pool.end()
}
