import { prisma } from '@/lib/db'

// Temporary: resolve church from env for single-tenant MVP
// Will be replaced by auth + tenant middleware later
export async function getChurchId(): Promise<string> {
  const slug = process.env.CHURCH_SLUG || 'la-ubf'
  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) throw new Error(`Church not found: ${slug}`)
  return church.id
}
