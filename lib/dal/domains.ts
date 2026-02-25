import { prisma } from '@/lib/db'

export async function getDomains(churchId: string) {
  return prisma.customDomain.findMany({
    where: { churchId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createDomain(churchId: string, domain: string) {
  return prisma.customDomain.create({
    data: { churchId, domain },
  })
}

export async function deleteDomain(churchId: string, id: string) {
  return prisma.customDomain.delete({
    where: { id, churchId },
  })
}
