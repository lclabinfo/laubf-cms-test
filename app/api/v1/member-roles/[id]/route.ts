/**
 * GET    /api/v1/member-roles/[id] — Get a single CMS role
 * PATCH  /api/v1/member-roles/[id] — Update a CMS role
 * DELETE /api/v1/member-roles/[id] — Delete a CMS role (with member reassignment)
 */

import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/api/require-auth'
import { getRole, updateRole, deleteRole, listRoles } from '@/lib/dal/roles'
import { ALL_PERMISSIONS } from '@/lib/permissions'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  const authResult = await requireApiAuth('roles.view')
  if (!authResult.authorized) return authResult.response

  const { id } = await params
  const role = await getRole(authResult.churchId, id)

  if (!role) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Role not found' } },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true, data: role })
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  const authResult = await requireApiAuth('roles.manage')
  if (!authResult.authorized) return authResult.response

  const { churchId, permissions: actorPermissions, rolePriority: actorPriority } = authResult

  const { id } = await params
  const existing = await getRole(churchId, id)
  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Role not found' } },
      { status: 404 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
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

  // Cannot edit roles at or above your priority (unless you're system owner)
  if (actorPriority < 1000 && existing.priority >= actorPriority) {
    return NextResponse.json(
      { success: false, error: { message: 'Cannot edit a role with equal or higher authority than your own' } },
      { status: 403 },
    )
  }

  // System roles: cannot change permissions (Owner always has all, Viewer is read-only)
  if (existing.isSystem && rolePermissions !== undefined) {
    return NextResponse.json(
      { success: false, error: { message: 'Cannot change permissions on a system role' } },
      { status: 403 },
    )
  }

  // Validate name if provided
  if (name !== undefined && (typeof name !== 'string' || name.length === 0 || name.length > 100)) {
    return NextResponse.json(
      { success: false, error: { message: 'Name must be 1-100 characters' } },
      { status: 400 },
    )
  }

  // Validate slug if provided
  if (slug !== undefined && (typeof slug !== 'string' || slug.length === 0 || slug.length > 100)) {
    return NextResponse.json(
      { success: false, error: { message: 'Slug must be 1-100 characters' } },
      { status: 400 },
    )
  }

  // Validate permissions if provided
  if (rolePermissions !== undefined) {
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

    // Cannot assign permissions you don't have (unless system owner)
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
  }

  // Build update data, only including provided fields
  const updateData: Parameters<typeof updateRole>[2] = {}
  if (name !== undefined) updateData.name = name
  if (slug !== undefined) updateData.slug = slug
  if (description !== undefined) updateData.description = description
  if (rolePermissions !== undefined) updateData.permissions = rolePermissions
  if (color !== undefined) updateData.color = color

  try {
    const updated = await updateRole(churchId, id, updateData)
    return NextResponse.json({ success: true, data: updated })
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

export async function DELETE(
  request: Request,
  { params }: RouteContext,
) {
  const authResult = await requireApiAuth('roles.manage')
  if (!authResult.authorized) return authResult.response

  const { churchId, rolePriority: actorPriority } = authResult

  const { id } = await params
  const existing = await getRole(churchId, id)
  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Role not found' } },
      { status: 404 },
    )
  }

  // Cannot delete system roles
  if (existing.isSystem) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Cannot delete a system role' } },
      { status: 403 },
    )
  }

  // Cannot delete roles at or above your priority
  if (actorPriority < 1000 && existing.priority >= actorPriority) {
    return NextResponse.json(
      { success: false, error: { message: 'Cannot delete a role with priority equal to or above your own' } },
      { status: 403 },
    )
  }

  // Require fallbackRoleId in body
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Request body with fallbackRoleId is required' } },
      { status: 400 },
    )
  }

  const { fallbackRoleId } = body as { fallbackRoleId?: string }
  if (!fallbackRoleId || typeof fallbackRoleId !== 'string') {
    return NextResponse.json(
      { success: false, error: { message: 'fallbackRoleId is required to reassign members' } },
      { status: 400 },
    )
  }

  // Verify fallback role exists and belongs to this church
  const fallbackRole = await getRole(churchId, fallbackRoleId)
  if (!fallbackRole) {
    return NextResponse.json(
      { success: false, error: { message: 'Fallback role not found' } },
      { status: 400 },
    )
  }

  // Cannot reassign to the role being deleted
  if (fallbackRoleId === id) {
    return NextResponse.json(
      { success: false, error: { message: 'Fallback role cannot be the same as the role being deleted' } },
      { status: 400 },
    )
  }

  // Check it's not the last non-system role
  const allRoles = await listRoles(churchId)
  const nonSystemRoles = allRoles.filter((r) => !r.isSystem)
  if (nonSystemRoles.length <= 1 && nonSystemRoles[0]?.id === id) {
    return NextResponse.json(
      { success: false, error: { message: 'Cannot delete the last non-system role' } },
      { status: 403 },
    )
  }

  await deleteRole(churchId, id, fallbackRoleId)
  return NextResponse.json({ success: true, data: { deleted: true } })
}
