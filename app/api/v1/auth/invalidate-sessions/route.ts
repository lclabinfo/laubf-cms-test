/**
 * POST /api/v1/auth/invalidate-sessions
 *
 * Bumps the church's sessionVersion, forcing all active JWTs to
 * re-fetch permissions from the DB on their next request.
 * Requires users.edit_roles permission (OWNER/ADMIN).
 */

import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api/require-auth'
import { prisma } from '@/lib/db'

export async function POST() {
  const authResult = await requireApiAuth('users.edit_roles')
  if (!authResult.authorized) return authResult.response

  const { churchId } = authResult
  const updated = await prisma.church.update({
    where: { id: churchId },
    data: { sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  })

  return NextResponse.json({
    success: true,
    message: `All sessions invalidated. New version: ${updated.sessionVersion}`,
  })
}
