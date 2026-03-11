import type { MemberRole } from '@/lib/generated/prisma/client'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    } & DefaultSession['user']
    churchId: string
    churchSlug: string
    churchName: string
    role: MemberRole
    roleId: string
    roleName: string
    rolePriority: number
    memberStatus: string
    permissions: string[]
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    userId?: string
    churchId?: string
    churchSlug?: string
    churchName?: string
    role?: string
    roleId?: string
    roleName?: string
    rolePriority?: number
    memberStatus?: string
    permissions?: string[]
    permissionsRefreshedAt?: number
  }
}
