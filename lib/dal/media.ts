import { prisma } from '@/lib/db'

// ---------------------------------------------------------------------------
// List / Search
// ---------------------------------------------------------------------------

export async function listMedia(
  churchId: string,
  opts?: {
    folder?: string
    mimeTypePrefix?: string   // e.g. "image/" for all images
    search?: string           // filename contains (case-insensitive)
    cursor?: string           // ISO date string for cursor pagination
    limit?: number
  }
) {
  const limit = opts?.limit ?? 50
  const where: Record<string, unknown> = {
    churchId,
    deletedAt: null,
  }
  if (opts?.folder) where.folder = opts.folder
  if (opts?.mimeTypePrefix) where.mimeType = { startsWith: opts.mimeTypePrefix }
  if (opts?.search) where.filename = { contains: opts.search, mode: 'insensitive' }
  if (opts?.cursor) where.createdAt = { lt: new Date(opts.cursor) }

  const items = await prisma.mediaAsset.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
  })

  const hasMore = items.length > limit
  if (hasMore) items.pop()

  return {
    items,
    hasMore,
    nextCursor: hasMore && items.length > 0
      ? items[items.length - 1].createdAt.toISOString()
      : null,
  }
}

// ---------------------------------------------------------------------------
// Single record
// ---------------------------------------------------------------------------

export async function getMediaAsset(churchId: string, id: string) {
  return prisma.mediaAsset.findFirst({
    where: { id, churchId, deletedAt: null },
  })
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createMediaAsset(churchId: string, data: {
  id?: string
  filename: string
  url: string
  mimeType: string
  fileSize: number
  width?: number | null
  height?: number | null
  alt?: string | null
  folder?: string
  createdBy?: string | null
}) {
  return prisma.mediaAsset.create({
    data: {
      ...(data.id && { id: data.id }),
      churchId,
      filename: data.filename,
      url: data.url,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      width: data.width ?? null,
      height: data.height ?? null,
      alt: data.alt ?? null,
      folder: data.folder || '/',
      createdBy: data.createdBy ?? null,
    },
  })
}

// ---------------------------------------------------------------------------
// Update metadata
// ---------------------------------------------------------------------------

export async function updateMediaAsset(churchId: string, id: string, data: {
  alt?: string | null
  folder?: string
  filename?: string
}) {
  // Verify ownership before updating
  const existing = await prisma.mediaAsset.findFirst({
    where: { id, churchId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) return null

  return prisma.mediaAsset.update({
    where: { id },
    data,
  })
}

// ---------------------------------------------------------------------------
// Soft delete
// ---------------------------------------------------------------------------

export async function deleteMediaAsset(churchId: string, id: string) {
  const existing = await prisma.mediaAsset.findFirst({
    where: { id, churchId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) return null

  return prisma.mediaAsset.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

// ---------------------------------------------------------------------------
// Hard delete (for trash cleanup — also deletes R2 object)
// ---------------------------------------------------------------------------

export async function hardDeleteMediaAsset(churchId: string, id: string) {
  const existing = await prisma.mediaAsset.findFirst({
    where: { id, churchId },
    select: { id: true },
  })
  if (!existing) return null

  return prisma.mediaAsset.delete({
    where: { id },
  })
}

// ---------------------------------------------------------------------------
// Folders (virtual — stored in MediaAsset.folder column)
// ---------------------------------------------------------------------------

export async function getDistinctFolders(churchId: string): Promise<string[]> {
  const results = await prisma.mediaAsset.findMany({
    where: { churchId, deletedAt: null },
    select: { folder: true },
    distinct: ['folder'],
    orderBy: { folder: 'asc' },
  })
  return results.map(r => r.folder)
}

// ---------------------------------------------------------------------------
// Bulk operations
// ---------------------------------------------------------------------------

export async function bulkMoveToFolder(churchId: string, ids: string[], folder: string) {
  return prisma.mediaAsset.updateMany({
    where: { id: { in: ids }, churchId, deletedAt: null },
    data: { folder },
  })
}

export async function bulkSoftDelete(churchId: string, ids: string[]) {
  return prisma.mediaAsset.updateMany({
    where: { id: { in: ids }, churchId, deletedAt: null },
    data: { deletedAt: new Date() },
  })
}
