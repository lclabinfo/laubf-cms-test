import type { NextAuthConfig } from 'next-auth'
import { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import type { MemberRole } from '@/lib/generated/prisma/client'
import { edgeAuthConfig } from './edge-config'

class RateLimitError extends CredentialsSignin {
  code = 'RateLimited'
}

/**
 * Full auth config — extends edge-safe config with providers and DB callbacks.
 * Used by server components, API routes, and the NextAuth route handler.
 * NOT used by middleware (use edge-config.ts for that).
 */
export const authConfig: NextAuthConfig = {
  ...edgeAuthConfig,

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null

        // Rate limit by email: 5 attempts per 15 minutes
        const normalizedEmail = email.trim().toLowerCase()
        const { success } = rateLimit(`login:${normalizedEmail}`, 5, 15 * 60 * 1000)
        if (!success) throw new RateLimitError()
        // Prevent bcrypt DoS with oversized passwords
        if (password.length > 128) return null

        const user = await prisma.user.findUnique({
          where: { email: email.trim().toLowerCase() },
        })

        if (!user || !user.passwordHash) return null

        // Block unverified email accounts from logging in
        if (!user.emailVerified) return null

        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: [user.firstName, user.lastName].filter(Boolean).join(' ') || null,
          image: user.avatarUrl,
        }
      },
    }),
  ],

  callbacks: {
    ...edgeAuthConfig.callbacks,

    async signIn({ user, account }) {
      // For Google OAuth: create or link User + Account
      if (account?.provider === 'google' && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        })

        if (!existingUser) {
          try {
            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                firstName: user.name?.split(' ')[0] || '',
                lastName: user.name?.split(' ').slice(1).join(' ') || '',
                avatarUrl: user.image,
                emailVerified: true,
                accounts: {
                  create: {
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    refresh_token: account.refresh_token,
                    access_token: account.access_token,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token,
                    session_state: account.session_state as string | undefined,
                  },
                },
              },
            })
            user.id = newUser.id
          } catch (err) {
            // Handle race condition: another request created this user simultaneously
            if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'P2002') {
              const raceUser = await prisma.user.findUnique({ where: { email: user.email! } })
              if (raceUser) {
                user.id = raceUser.id
              } else {
                return false
              }
            } else {
              throw err
            }
          }
        } else {
          const hasGoogleAccount = existingUser.accounts.some(
            (a) => a.provider === 'google'
          )
          if (!hasGoogleAccount) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state as string | undefined,
              },
            })
          }
          user.id = existingUser.id
        }
      }

      return true
    },

    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id

        const membership = await prisma.churchMember.findFirst({
          where: { userId: user.id },
          include: {
            church: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
            customRole: {
              select: {
                id: true,
                name: true,
                slug: true,
                priority: true,
                permissions: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        })

        if (membership) {
          token.churchId = membership.church.id
          token.churchSlug = membership.church.slug
          token.churchName = membership.church.name
          token.role = membership.role
          token.memberStatus = membership.status

          if (membership.customRole) {
            token.roleId = membership.customRole.id
            token.roleName = membership.customRole.name
            token.rolePriority = membership.customRole.priority
            token.permissions = membership.customRole.permissions
          }
        }
      }

      // Re-check status for PENDING members so onboarding completion takes effect
      // without requiring re-sign-in. Only PENDING users incur this lightweight query.
      if (token.memberStatus === 'PENDING' && token.userId && token.churchId) {
        const current = await prisma.churchMember.findFirst({
          where: { userId: token.userId, churchId: token.churchId },
          select: { status: true },
        })
        if (current) {
          token.memberStatus = current.status
        }
      }

      return token
    },

    async session({ session, token }) {
      const extSession = session as typeof session & {
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

      if (token.userId && extSession.user) {
        extSession.user.id = token.userId
      }
      if (token.churchId) {
        extSession.churchId = token.churchId
      }
      if (token.churchSlug) {
        extSession.churchSlug = token.churchSlug
      }
      if (token.churchName) {
        extSession.churchName = token.churchName
      }
      if (token.role) {
        extSession.role = token.role as MemberRole
      }

      extSession.roleId = (token.roleId as string) ?? ''
      extSession.roleName = (token.roleName as string) ?? ''
      extSession.rolePriority = (token.rolePriority as number) ?? 0
      extSession.permissions = (token.permissions as string[]) ?? []
      extSession.memberStatus = (token.memberStatus as string) ?? 'ACTIVE'

      return extSession
    },
  },
}
