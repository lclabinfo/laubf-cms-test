import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api/require-auth'
import { listChurchUsers } from '@/lib/dal/users'

export async function GET() {
  const authResult = await requireApiAuth('ADMIN')
  if (!authResult.authorized) return authResult.response

  const users = await listChurchUsers(authResult.churchId)
  return NextResponse.json({ success: true, data: users })
}
