/**
 * GET  /api/v1/member-roles — List all CMS roles for the church
 * POST /api/v1/member-roles — Create a custom CMS role
 */

import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api/require-auth'
import { listRoles, createRole } from '@/lib/dal/roles'
import { ALL_PERMISSIONS } from '@/lib/permissions'

export async function GET() {
  const authResult = await requireApiAuth('roles.view')
  if (!authResult.authorized) return authResult.response

  const { churchId } = authResult
  const roles = await listRoles(churchId)
  return NextResponse.json({ success: true, data: roles })
}

// Default priority for custom roles (between Editor=200 and Admin=500)
const CUSTOM_ROLE_PRIORITY = 100

export async function POST(req: Request) {
  const authResult = await requireApiAuth('roles.manage')
  if (!authResult.authorized) return authResult.response
  const { churchId, permissions: actorPermissions, rolePriority: actorPriority } = authResult

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid request body' } },
      { status: 400 },
    )
  }

  const { name, slug, description, permissions: rolePermissions, color } = body as {
    name?: string
    slug?: string
    description?: string
    permissions?: string[]
    color?: string
  }

  // Validate name
  if (!name || typeof name !== 'string' || name.length > 100) {
    return NextResponse.json(
      { success: false, error: { message: 'Name is required (max 100 chars)' } },
      { status: 400 },
    )
  }

  // Generate or validate slug
  const roleSlug =
    slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (!roleSlug || roleSlug.length > 100) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid slug' } },
      { status: 400 },
    )
  }

  // Validate permissions array
  if (!Array.isArray(rolePermissions)) {
    return NextResponse.json(
      { success: false, error: { message: 'Permissions must be an array' } },
      { status: 400 },
    )
  }

  const validPerms = new Set<string>(ALL_PERMISSIONS)
  const invalidPerms = rolePermissions.filter((p) => !validPerms.has(p))
  if (invalidPerms.length > 0) {
    return NextResponse.json(
      { success: false, error: { message: `Invalid permissions: ${invalidPerms.join(', ')}` } },
      { status: 400 },
    )
  }

  // Cannot assign permissions you don't have (unless system owner, priority 1000)
  if (actorPriority < 1000) {
    const actorPermSet = new Set(actorPermissions)
    const escalated = rolePermissions.filter((p) => !actorPermSet.has(p))
    if (escalated.length > 0) {
      return NextResponse.json(
        { success: false, error: { message: `Cannot assign permissions you don't have: ${escalated.join(', ')}` } },
        { status: 403 },
      )
    }
  }

  try {
    const role = await createRole(churchId, {
      name,
      slug: roleSlug,
      description: description as string | undefined,
      priority: CUSTOM_ROLE_PRIORITY,
      permissions: rolePermissions,
      color: color as string | undefined,
    })
    return NextResponse.json({ success: true, data: role }, { status: 201 })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: { message: 'A role with this slug already exists' } },
        { status: 409 },
      )
    }
    throw err
  }
}
