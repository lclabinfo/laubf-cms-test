/**
 * migrate-attachments-to-relation.mts
 *
 * Safe migration script that ensures all attachment data lives in
 * BibleStudyAttachment (the relational table) and clears the redundant
 * Message.attachments JSON column.
 *
 * What it does:
 *   1. AUDIT — Scans every Message that has non-null `attachments` JSON.
 *      For each, checks whether matching BibleStudyAttachment records exist.
 *   2. BACKFILL — If the JSON has attachments that are MISSING from
 *      BibleStudyAttachment, creates them (so no data is lost).
 *   3. CLEAR — Sets Message.attachments to null for all migrated rows.
 *   4. REPORT — Prints a summary of what was found and what was done.
 *
 * Safety:
 *   - Dry-run by default. Pass --execute to actually write.
 *   - Wraps all writes in a transaction so it's all-or-nothing.
 *   - Never deletes BibleStudyAttachment records.
 *   - Never modifies BibleStudy or Message content fields.
 *
 * Usage:
 *   npx tsx scripts/migrate-attachments-to-relation.mts          # dry run
 *   npx tsx scripts/migrate-attachments-to-relation.mts --execute # real run
 */

import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client.ts')
const prisma = new (mod.PrismaClient)({ adapter })
const dryRun = !process.argv.includes('--execute')

interface JsonAttachment {
  id: string
  name: string
  url?: string
  type?: string
  fileSize?: number
  size?: string
  r2Key?: string
}

function resolveAttachmentType(type: string | undefined, name: string): string {
  if (type === 'QUESTION_SHEET' || type === 'ANSWER_KEY' || type === 'TRANSCRIPT' || type === 'OTHER') {
    return type
  }
  const lower = name.toLowerCase()
  if (lower.includes('question') || lower.includes('qs')) return 'QUESTION_SHEET'
  if (lower.includes('answer') || lower.includes('ak')) return 'ANSWER_KEY'
  if (lower.includes('transcript')) return 'TRANSCRIPT'
  return 'OTHER'
}

async function main() {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`  Attachment Migration: Message.attachments JSON → BibleStudyAttachment`)
  console.log(`  Mode: ${dryRun ? 'DRY RUN (pass --execute to write)' : 'EXECUTING'}`)
  console.log(`${'='.repeat(60)}\n`)

  // Step 1: Find all Messages with non-null attachments JSON
  const messagesWithJson = await prisma.message.findMany({
    where: {
      attachments: { not: null },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      attachments: true,
      relatedStudyId: true,
      relatedStudy: {
        select: {
          id: true,
          attachments: {
            select: { id: true, name: true, url: true },
          },
        },
      },
    },
  })

  console.log(`Found ${messagesWithJson.length} messages with non-null attachments JSON.\n`)

  let totalJsonAttachments = 0
  let totalAlreadyInTable = 0
  let totalMissingFromTable = 0
  let totalNoStudy = 0
  const toBackfill: { studyId: string; att: JsonAttachment; messageTitle: string }[] = []
  const toClear: string[] = []

  for (const msg of messagesWithJson) {
    const jsonAtts = Array.isArray(msg.attachments)
      ? (msg.attachments as JsonAttachment[])
      : []

    if (jsonAtts.length === 0) {
      // Empty array or non-array — just needs clearing
      toClear.push(msg.id)
      continue
    }

    totalJsonAttachments += jsonAtts.length
    console.log(`  "${msg.title}" (${msg.slug})`)
    console.log(`    JSON attachments: ${jsonAtts.length}`)

    if (!msg.relatedStudy) {
      console.log(`    WARNING: No relatedStudy linked — cannot backfill.`)
      totalNoStudy += jsonAtts.length

      // Log what would be lost
      for (const att of jsonAtts) {
        console.log(`      - "${att.name}" (${att.url ?? 'no url'}) — ORPHANED (no study)`)
      }
      toClear.push(msg.id)
      continue
    }

    const existingUrls = new Set(msg.relatedStudy.attachments.map(a => a.url))
    const existingNames = new Set(msg.relatedStudy.attachments.map(a => a.name))

    let matched = 0
    let missing = 0

    for (const att of jsonAtts) {
      // Match by URL first, then by name
      const inTable = (att.url && existingUrls.has(att.url)) || existingNames.has(att.name)

      if (inTable) {
        matched++
      } else {
        missing++
        toBackfill.push({
          studyId: msg.relatedStudy.id,
          att,
          messageTitle: msg.title,
        })
        console.log(`      MISSING: "${att.name}" (${att.url ?? 'no url'})`)
      }
    }

    totalAlreadyInTable += matched
    totalMissingFromTable += missing
    console.log(`    In BibleStudyAttachment: ${matched}, Missing: ${missing}`)
    toClear.push(msg.id)
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log(`  AUDIT SUMMARY`)
  console.log(`${'='.repeat(60)}`)
  console.log(`  Messages with JSON attachments:  ${messagesWithJson.length}`)
  console.log(`  Total JSON attachment entries:    ${totalJsonAttachments}`)
  console.log(`  Already in BibleStudyAttachment:  ${totalAlreadyInTable}`)
  console.log(`  Missing (need backfill):          ${totalMissingFromTable}`)
  console.log(`  Orphaned (no linked study):       ${totalNoStudy}`)
  console.log(`  Messages to clear JSON on:        ${toClear.length}`)
  console.log()

  if (dryRun) {
    console.log(`  DRY RUN — no changes made. Run with --execute to apply.\n`)
    await prisma.$disconnect()
    await pool.end()
    return
  }

  // Step 2 & 3: Backfill + Clear in a transaction
  console.log(`  Executing migration...\n`)

  await prisma.$transaction(async (tx) => {
    // Backfill missing attachments
    for (const { studyId, att, messageTitle } of toBackfill) {
      const attType = resolveAttachmentType(att.type, att.name)
      console.log(`    Backfilling "${att.name}" → study for "${messageTitle}"`)

      await tx.bibleStudyAttachment.create({
        data: {
          bibleStudyId: studyId,
          name: att.name,
          url: att.url ?? '',
          type: attType as any,
          fileSize: att.fileSize ?? null,
          sortOrder: 99, // append at end
        },
      })
    }

    // Clear JSON column on all processed messages
    for (const messageId of toClear) {
      await tx.message.update({
        where: { id: messageId },
        data: { attachments: null },
      })
    }
  })

  console.log(`\n  Done!`)
  console.log(`    Backfilled: ${toBackfill.length} attachments`)
  console.log(`    Cleared:    ${toClear.length} Message.attachments JSON fields`)
  console.log()

  await prisma.$disconnect()
  await pool.end()
}

main().catch(async (e) => {
  console.error('Migration failed:', e)
  await prisma.$disconnect()
  await pool.end()
  process.exit(1)
})
