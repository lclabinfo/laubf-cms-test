/**
 * Run all deploy-data scripts in the correct order.
 *
 * This is the single command to bring a fresh database (after seed)
 * up to date with all current website and structural changes.
 *
 * Order matters:
 *   1. Church profile (no dependencies)
 *   2. Reference data — ministries, campuses (needed by events + pages)
 *   3. People data — speakers, groups, custom fields
 *   4. Recurring events (depends on ministries)
 *   5. Website data — theme, settings, menus, pages (depends on nothing content-wise)
 *   6. Verify everything is in place
 *
 * Usage: npx tsx scripts/deploy-data/deploy-all.mts
 */
import { execSync } from 'child_process'
import { join } from 'path'

const dir = import.meta.dirname

const scripts = [
  { name: 'Church Profile', file: 'apply-church-profile.mts' },
  { name: 'Reference Data', file: 'apply-reference-data.mts' },
  { name: 'People Data', file: 'apply-people-data.mts' },
  { name: 'Recurring Events', file: 'apply-recurring-events.mts' },
  { name: 'Website Seed (reset)', file: 'reset-website-seed.mts' },
  { name: 'Verification', file: 'verify-deploy.mts' },
]

console.log('═══════════════════════════════════════════')
console.log('  DEPLOY ALL DATA')
console.log('═══════════════════════════════════════════\n')

for (const script of scripts) {
  console.log(`\n┌─ ${script.name} ─────────────────────────`)
  console.log(`│  Running ${script.file}...`)
  console.log('└──────────────────────────────────────────\n')

  try {
    execSync(`npx tsx ${join(dir, script.file)}`, {
      stdio: 'inherit',
      env: process.env,
    })
  } catch (err) {
    console.error(`\n❌ Failed at: ${script.name}`)
    process.exit(1)
  }

  console.log('')
}

console.log('═══════════════════════════════════════════')
console.log('  ALL DEPLOY SCRIPTS COMPLETED')
console.log('═══════════════════════════════════════════')
