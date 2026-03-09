/**
 * Update seed.mts to use flat R2 paths.
 * Reads the path mapping and replaces all occurrences in the seed file.
 */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const map = JSON.parse(readFileSync('/tmp/path-map.json', 'utf8')) as Record<string, string>
const seedPath = join(import.meta.dirname, '..', 'prisma', 'seed.mts')
let seed = readFileSync(seedPath, 'utf8')

let replacements = 0

// Sort by longest path first to avoid partial matches
const entries = Object.entries(map).sort((a, b) => b[0].length - a[0].length)

for (const [oldPath, newFilename] of entries) {
  if (oldPath === newFilename) continue

  // The seed uses both literal paths and %20-encoded paths
  const oldEncoded = oldPath.replace(/ /g, '%20')

  // Replace encoded version (used in seed template literals)
  const encodedOccurrences = seed.split(oldEncoded).length - 1
  if (encodedOccurrences > 0) {
    // Need to encode the new filename too if it has spaces
    const newEncoded = newFilename.replace(/ /g, '%20')
    seed = seed.split(oldEncoded).join(newEncoded)
    replacements += encodedOccurrences
  }

  // Replace literal version (may appear in some places)
  const literalOccurrences = seed.split(oldPath).length - 1
  if (literalOccurrences > 0) {
    seed = seed.split(oldPath).join(newFilename)
    replacements += literalOccurrences
  }
}

writeFileSync(seedPath, seed)
console.log(`Made ${replacements} replacements in seed.mts`)

// Also update component files
const componentFiles = [
  'components/website/sections/hero-banner.tsx',
  'components/website/sections/statement.tsx',
  'components/website/sections/feature-breakdown.tsx',
  'components/website/sections/footer.tsx',
]

for (const relPath of componentFiles) {
  const fullPath = join(import.meta.dirname, '..', relPath)
  let content = readFileSync(fullPath, 'utf8')
  let count = 0

  for (const [oldPath, newFilename] of entries) {
    if (oldPath === newFilename) continue
    const oldEncoded = oldPath.replace(/ /g, '%20')

    if (content.includes(oldEncoded)) {
      content = content.split(oldEncoded).join(newFilename.replace(/ /g, '%20'))
      count++
    }
    if (content.includes(oldPath)) {
      content = content.split(oldPath).join(newFilename)
      count++
    }
  }

  if (count > 0) {
    writeFileSync(fullPath, content)
    console.log(`Updated ${count} paths in ${relPath}`)
  }
}
