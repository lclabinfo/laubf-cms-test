import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function getChurchId(): Promise<string> {
  // Try to get churchId from authenticated session first
  const session = await auth()
  if (session?.churchId) {
    // Validate the session's churchId still exists in the database.
    // After a database reseed, the church UUID changes but the JWT retains the old one.
    // This check prevents stale sessions from returning a non-existent churchId.
    const churchExists = await prisma.church.findUnique({
      where: { id: session.churchId },
      select: { id: true },
    })
    if (churchExists) {
      return session.churchId
    }
    // Church no longer exists — fall through to CHURCH_SLUG lookup
    console.warn(
      `Session churchId ${session.churchId} not found in database. ` +
      `This typically happens after a database reseed. ` +
      `Falling back to CHURCH_SLUG lookup. User should log out and log back in.`
    )
  }

  // Fallback for non-authenticated contexts (scripts, cron, website routes)
  // or when session has a stale churchId after database reseed
  const slug = process.env.CHURCH_SLUG || 'la-ubf'
  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) throw new Error(`Church not found: ${slug}`)
  return church.id
}
