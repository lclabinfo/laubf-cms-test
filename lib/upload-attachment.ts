/**
 * Attachment upload/delete utilities for Bible Study file attachments.
 *
 * Attachments use the `file-attachments` R2 bucket (ATTACHMENTS_BUCKET),
 * separate from the `media` bucket used for images.
 *
 * Upload flow:
 *   1. Client gets a presigned URL via POST /api/v1/upload-url (context: "bible-study")
 *   2. Client uploads directly to R2 at a staging key: {churchSlug}/staging/{uuid}-{filename}
 *   3. On save, syncStudyAttachments() promotes staging → permanent key via moveObject()
 *
 * Deletion flow:
 *   - Individual removal: handled during save by syncStudyAttachments() (diffing incoming vs existing)
 *   - Bible study deletion: call deleteAllStudyAttachments() to hard-delete all R2 files + DB records
 *
 * There is NO automatic staging cleanup — if a user uploads a file but never saves,
 * the staging file remains in R2. A periodic cleanup job (not yet implemented) would
 * scan for staging/ keys older than 24h and delete them.
 */

import { prisma } from '@/lib/db'
import { deleteObject, keyFromUrl } from '@/lib/storage/r2'

/**
 * Delete all R2 files and DB records for a bible study's attachments.
 * Used when a bible study is deleted (soft or hard).
 *
 * R2 deletions are best-effort — DB records are always cleaned up even if
 * an R2 delete fails (to avoid orphan DB rows blocking future operations).
 */
export async function deleteAllStudyAttachments(studyId: string): Promise<{
  deleted: number
  r2Errors: number
}> {
  const attachments = await prisma.bibleStudyAttachment.findMany({
    where: { bibleStudyId: studyId },
    select: { id: true, url: true },
  })

  if (attachments.length === 0) {
    return { deleted: 0, r2Errors: 0 }
  }

  let r2Errors = 0

  // Delete R2 files first (best-effort)
  for (const att of attachments) {
    const key = keyFromUrl(att.url)
    if (key) {
      try {
        await deleteObject(key)
      } catch (err) {
        r2Errors++
        console.error(`[deleteAllStudyAttachments] Failed to delete R2 object "${key}":`, err)
      }
    }
  }

  // Delete all DB records
  await prisma.bibleStudyAttachment.deleteMany({
    where: { bibleStudyId: studyId },
  })

  return { deleted: attachments.length, r2Errors }
}

/**
 * Delete a single attachment's R2 file by its public URL.
 * Does not touch the DB — caller is responsible for DB cleanup.
 */
export async function deleteAttachmentFile(url: string): Promise<void> {
  const key = keyFromUrl(url)
  if (!key) return
  await deleteObject(key)
}
