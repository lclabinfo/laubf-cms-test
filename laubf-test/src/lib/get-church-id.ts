import { prisma } from '@/lib/db/client'

let cachedChurchId: string | null = null

export async function getChurchId(): Promise<string> {
  if (cachedChurchId) return cachedChurchId
  const slug = process.env.CHURCH_SLUG || 'la-ubf'
  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) throw new Error(`Church not found: ${slug}`)
  cachedChurchId = church.id
  return church.id
}
