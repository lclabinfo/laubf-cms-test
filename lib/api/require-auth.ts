import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import type { MemberRole } from '@/lib/generated/prisma/client'
import type { Permission } from '@/lib/permissions'

type AuthResult =
  | {
      authorized: true
      userId: string
      churchId: string
      permissions: string[]
      rolePriority: number
      roleName: string
      role: MemberRole
    }
  | { authorized: false; response: NextResponse }

/**
 * Checks for a valid session and verifies the user has the required permission(s).
 * Returns the user's identity on success, or a JSON error response on failure.
 *
 * Usage in API routes:
 * ```ts
 * const authResult = await requireApiAuth('messages.edit_all')
 * if (!authResult.authorized) return authResult.response
 * const { userId, churchId, permissions } = authResult
 * ```
 */
export async function requireApiAuth(
  requiredPermission?: Permission | Permission[],
): Promise<AuthResult> {
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

  // Block inactive/pending members from making API calls
  if (session.memberStatus !== 'ACTIVE') {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Account is not active' } },
        { status: 403 },
      ),
    }
  }

  if (requiredPermission) {
    const required = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission]
    const userPerms = new Set(session.permissions ?? [])
    const hasAll = required.every((p) => userPerms.has(p))

    if (!hasAll) {
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
          { status: 403 },
        ),
      }
    }
  }

  return {
    authorized: true,
    userId: session.user.id,
    churchId: session.churchId,
    permissions: session.permissions ?? [],
    rolePriority: session.rolePriority ?? 0,
    roleName: session.roleName ?? 'Unknown',
    role: session.role, // Keep for backwards compat
  }
}
