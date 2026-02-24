import { prisma } from '@/lib/db/client'
import { Prisma, type MenuLocation } from '@/lib/generated/prisma/client'

export type MenuWithItems = Prisma.MenuGetPayload<{
  include: {
    items: {
      include: { children: true }
    }
  }
}>

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
