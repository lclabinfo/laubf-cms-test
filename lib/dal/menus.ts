import { prisma } from '@/lib/db'
import { Prisma, type MenuLocation } from '@/lib/generated/prisma/client'

type MenuWithItems = Prisma.MenuGetPayload<{
  include: {
    items: {
      include: { children: true }
    }
  }
}>

type MenuRecord = Prisma.MenuGetPayload<Record<string, never>>

export async function getMenuByLocation(
  churchId: string,
  location: MenuLocation,
): Promise<MenuWithItems | null> {
  return prisma.menu.findFirst({
    where: { churchId, location },
    include: {
      items: {
        where: { parentId: null },
        orderBy: { sortOrder: 'asc' },
        include: {
          children: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  })
}

export async function getMenus(churchId: string): Promise<MenuRecord[]> {
  return prisma.menu.findMany({
    where: { churchId },
    orderBy: { name: 'asc' },
  })
}

// Get menu with items for admin editing
export async function getMenuWithItems(
  churchId: string,
  menuId: string,
): Promise<MenuWithItems | null> {
  return prisma.menu.findFirst({
    where: { id: menuId, churchId },
    include: {
      items: {
        where: { parentId: null },
        orderBy: { sortOrder: 'asc' },
        include: {
          children: { orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  })
}

export async function createMenuItem(
  churchId: string,
  menuId: string,
  data: Omit<Prisma.MenuItemUncheckedCreateInput, 'menuId'>,
) {
  // Get next sort order
  const lastItem = await prisma.menuItem.findFirst({
    where: { menuId, parentId: data.parentId ?? null },
    orderBy: { sortOrder: 'desc' },
  })
  return prisma.menuItem.create({
    data: { ...data, menuId, sortOrder: (lastItem?.sortOrder ?? -1) + 1 },
  })
}

export async function updateMenuItem(
  id: string,
  data: Prisma.MenuItemUncheckedUpdateInput,
) {
  return prisma.menuItem.update({ where: { id }, data })
}

export async function deleteMenuItem(id: string) {
  // Delete children first, then parent
  await prisma.menuItem.deleteMany({ where: { parentId: id } })
  return prisma.menuItem.delete({ where: { id } })
}

export async function reorderMenuItems(menuId: string, itemIds: string[]) {
  const updates = itemIds.map((id, index) =>
    prisma.menuItem.update({ where: { id }, data: { sortOrder: index } }),
  )
  return prisma.$transaction(updates)
}
