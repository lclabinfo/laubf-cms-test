import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function getChurchId(): Promise<string> {
  // Try to get churchId from authenticated session first
  const session = await auth()
  if (session?.churchId) {
    return session.churchId
  }

  // Fallback for non-authenticated contexts (scripts, cron, website routes)
  const slug = process.env.CHURCH_SLUG || 'la-ubf'
  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) throw new Error(`Church not found: ${slug}`)
  return church.id
}
