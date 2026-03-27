import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const mod = await import('../lib/generated/prisma/client.ts')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

async function main() {
  const msgs = await prisma.message.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, title: true, videoUrl: true, hasVideo: true, hasStudy: true, status: true, youtubeId: true },
    orderBy: { dateFor: "desc" },
  })

  const withVideo = msgs.filter(m => m.videoUrl)
  const withoutVideo = msgs.filter(m => m.videoUrl === null || m.videoUrl === "")
  const hasVideoBadFlag = msgs.filter(m => m.hasVideo && (m.videoUrl === null || m.videoUrl === ""))
  const withStudy = msgs.filter(m => m.hasStudy)
  const neitherVideoNorStudy = msgs.filter(m => (m.videoUrl === null || m.videoUrl === "") && m.hasStudy === false)

  console.log(`\nTotal PUBLISHED messages: ${msgs.length}`)
  console.log(`With videoUrl: ${withVideo.length}`)
  console.log(`Without videoUrl: ${withoutVideo.length}`)
  console.log(`With hasVideo=true but no videoUrl: ${hasVideoBadFlag.length}`)
  console.log(`With hasStudy=true: ${withStudy.length}`)
  console.log(`Neither video nor study: ${neitherVideoNorStudy.length}`)

  console.log(`\n--- Published messages WITHOUT videoUrl ---`)
  for (const m of withoutVideo) {
    console.log(`  ${m.title.substring(0, 50).padEnd(50)} | hasVideo=${String(m.hasVideo).padEnd(5)} | hasStudy=${String(m.hasStudy).padEnd(5)} | youtubeId=${m.youtubeId || "null"}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
