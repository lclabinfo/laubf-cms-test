/**
 * Data Access Layer for CMS Role management (Role model).
 * These are CMS permission roles (Owner, Admin, Editor, Viewer, custom),
 * NOT PersonRoleDefinition (ministry/people roles).
 */

import { prisma } from '@/lib/db'
import { DEFAULT_ROLES } from '@/lib/permissions'

/** List all roles for a church, ordered by priority descending */
export async function listRoles(churchId: string) {
  return prisma.role.findMany({
    where: { churchId },
    orderBy: { priority: 'desc' },
    include: {
      _count: { select: { members: true } },
    },
  })
}

/** Get a single role by ID */
export async function getRole(churchId: string, roleId: string) {
  return prisma.role.findFirst({
    where: { id: roleId, churchId },
    include: {
      _count: { select: { members: true } },
    },
  })
}

/** Create a custom role */
export async function createRole(
  churchId: string,
  data: {
    name: string
    slug: string
    description?: string
    priority: number
    permissions: string[]
    color?: string
  },
) {
  return prisma.role.create({
    data: {
      churchId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      priority: data.priority,
      permissions: data.permissions,
      color: data.color,
      isSystem: false,
    },
  })
}

/** Update a role */
export async function updateRole(
  churchId: string,
  roleId: string,
  data: {
    name?: string
    slug?: string
    description?: string
    priority?: number
    permissions?: string[]
    color?: string
  },
) {
  return prisma.role.update({
    where: { id: roleId, churchId },
    data,
  })
}

/** Delete a role and reassign its members to a fallback role */
export async function deleteRole(
  churchId: string,
  roleId: string,
  fallbackRoleId: string,
) {
  // Reassign all members with this role to the fallback role
  await prisma.churchMember.updateMany({
    where: { churchId, roleId },
    data: { roleId: fallbackRoleId },
  })

  // Delete the role
  return prisma.role.delete({
    where: { id: roleId, churchId },
  })
}

/** Seed default roles for a new church (idempotent via upsert) */
export async function seedDefaultRoles(churchId: string) {
  const roles: Record<string, string> = {}
  for (const [key, def] of Object.entries(DEFAULT_ROLES)) {
    const role = await prisma.role.upsert({
      where: { churchId_slug: { churchId, slug: def.slug } },
      create: {
        churchId,
        name: def.name,
        slug: def.slug,
        description: def.description,
        priority: def.priority,
        isSystem: def.isSystem,
        permissions: def.permissions as string[],
        color: def.color,
      },
      update: {
        description: def.description,
        priority: def.priority,
        permissions: def.permissions as string[],
        color: def.color,
      },
    })
    roles[key] = role.id
  }
  return roles
}
