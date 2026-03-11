/**
 * GET /api/v1/permissions — Return the permissions taxonomy for the UI
 */

import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api/require-auth'
import { PERMISSIONS, PERMISSION_GROUPS } from '@/lib/permissions'

export async function GET() {
  const authResult = await requireApiAuth()
  if (!authResult.authorized) return authResult.response

  return NextResponse.json({
    success: true,
    data: { permissions: PERMISSIONS, groups: PERMISSION_GROUPS },
  })
}
