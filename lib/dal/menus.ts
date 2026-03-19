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
  churchId: string,
  id: string,
  data: Prisma.MenuItemUncheckedUpdateInput,
) {
  // Verify the menu item belongs to a menu owned by this church
  const item = await prisma.menuItem.findFirst({
    where: { id, menu: { churchId } },
  })
  if (!item) throw new Error('Menu item not found')
  return prisma.menuItem.update({ where: { id }, data })
}

export async function deleteMenuItem(churchId: string, id: string) {
  // Verify the menu item belongs to a menu owned by this church
  const item = await prisma.menuItem.findFirst({
    where: { id, menu: { churchId } },
  })
  if (!item) throw new Error('Menu item not found')
  // Delete children first, then parent
  await prisma.menuItem.deleteMany({ where: { parentId: id } })
  return prisma.menuItem.delete({ where: { id } })
}

export async function reorderMenuItems(
  churchId: string,
  menuId: string,
  itemIds: string[],
) {
  // Verify the menu belongs to this church
  const menu = await prisma.menu.findFirst({
    where: { id: menuId, churchId },
  })
  if (!menu) throw new Error('Menu not found')
  const updates = itemIds.map((id, index) =>
    prisma.menuItem.update({ where: { id }, data: { sortOrder: index } }),
  )
  return prisma.$transaction(updates)
}

export async function reorderChildMenuItems(
  churchId: string,
  parentId: string,
  itemIds: string[],
) {
  // Verify parent belongs to a menu owned by this church
  const parent = await prisma.menuItem.findFirst({
    where: { id: parentId, menu: { churchId } },
  })
  if (!parent) throw new Error('Parent menu item not found')

  // Update sortOrder for each child where parentId matches
  const updates = itemIds.map((id, index) =>
    prisma.menuItem.update({
      where: { id },
      data: { sortOrder: index },
    }),
  )
  return prisma.$transaction(updates)
}
