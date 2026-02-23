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
