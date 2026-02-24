import { headers } from 'next/headers'

export async function getChurchId(): Promise<string> {
  const headersList = await headers()
  const churchId = headersList.get('x-tenant-id')
  if (churchId) return churchId

  // Fallback for single-tenant MVP: resolve by slug from env
  const slug = process.env.CHURCH_SLUG || 'la-ubf'
  const { prisma } = await import('@/lib/db/client')
  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) throw new Error(`Church not found: ${slug}`)
  return church.id
}
