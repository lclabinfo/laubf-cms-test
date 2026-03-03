import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client.ts')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

const totalPublished = await prisma.message.count({ where: { status: "PUBLISHED" } })
const withYoutubeId = await prisma.message.count({ where: { status: "PUBLISHED", youtubeId: { not: null } } })
const withVideoUrl = await prisma.message.count({ where: { status: "PUBLISHED", videoUrl: { not: null } } })
const hasVideoTrue = await prisma.message.count({ where: { status: "PUBLISHED", hasVideo: true } })
const hasStudyTrue = await prisma.message.count({ where: { status: "PUBLISHED", hasStudy: true } })

// Problem checks
const hasVideoNoSource = await prisma.message.count({ where: { hasVideo: true, youtubeId: null, videoUrl: null } })
const ytNoFlag = await prisma.message.count({ where: { youtubeId: { not: null }, hasVideo: false } })
const publishedNoContent = await prisma.message.count({ where: { status: "PUBLISHED", hasVideo: false, hasStudy: false } })

// The 191 "neither video nor study" - what are they?
const neitherSample = await prisma.message.findMany({
  where: { status: "PUBLISHED", hasVideo: false, hasStudy: false },
  select: { title: true, youtubeId: true, videoUrl: true, passage: true },
  take: 10,
})

console.log(`=== Database State ===`)
console.log(`Total PUBLISHED: ${totalPublished}`)
console.log(`  with youtubeId: ${withYoutubeId}`)
console.log(`  with videoUrl: ${withVideoUrl}`)
console.log(`  hasVideo=true: ${hasVideoTrue}`)
console.log(`  hasStudy=true: ${hasStudyTrue}`)
console.log(``)
console.log(`=== Integrity Checks ===`)
console.log(`hasVideo=true but no youtubeId AND no videoUrl: ${hasVideoNoSource} (should be 0)`)
console.log(`youtubeId present but hasVideo=false: ${ytNoFlag} (should be 0)`)
console.log(`PUBLISHED with no video AND no study: ${publishedNoContent}`)

if (publishedNoContent > 0) {
  console.log(`\nSample of PUBLISHED with no content:`)
  for (const m of neitherSample) {
    console.log(`  ${m.title?.substring(0, 50).padEnd(50)} | yt=${m.youtubeId || "null"} | url=${m.videoUrl || "null"} | passage=${m.passage || "null"}`)
  }
}

await prisma.$disconnect()
