import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { MemberRole } from '@/lib/generated/prisma/client'

type AuthResult =
  | { authorized: true; userId: string; churchId: string; role: MemberRole }
  | { authorized: false; response: NextResponse }

/**
 * Role hierarchy: OWNER > ADMIN > EDITOR > VIEWER
 * Each level includes all permissions of levels below it.
 */
const ROLE_LEVEL: Record<MemberRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
}

/**
 * Checks for a valid session and verifies the user has at least the required role.
 * Returns the user's identity on success, or a JSON error response on failure.
 *
 * Usage in API routes:
 * ```ts
 * const authResult = await requireApiAuth('EDITOR')
 * if (!authResult.authorized) return authResult.response
 * const { userId, churchId, role } = authResult
 * ```
 */
export async function requireApiAuth(minimumRole: MemberRole = 'VIEWER'): Promise<AuthResult> {
  const session = await auth()

  if (!session?.user?.id || !session.churchId) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      ),
    }
  }

  const userLevel = ROLE_LEVEL[session.role] ?? 0
  const requiredLevel = ROLE_LEVEL[minimumRole] ?? 0

  if (userLevel < requiredLevel) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 },
      ),
    }
  }

  return {
    authorized: true,
    userId: session.user.id,
    churchId: session.churchId,
    role: session.role,
  }
}
