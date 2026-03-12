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
      // Initial sign-in: load church + membership + permissions
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
                sessionVersion: true,
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
          token.sessionVersion = membership.church.sessionVersion
          token.role = membership.role
          token.memberStatus = membership.status

          // OWNER always gets ALL permissions — never limited by DB-stored role
          if (membership.role === 'OWNER') {
            const { ALL_PERMISSIONS, DEFAULT_ROLES } = await import('@/lib/permissions')
            const ownerDef = DEFAULT_ROLES.OWNER
            token.roleId = membership.customRole?.id
            token.roleName = ownerDef.name
            token.rolePriority = ownerDef.priority
            token.permissions = ALL_PERMISSIONS
          } else if (membership.customRole) {
            token.roleId = membership.customRole.id
            token.roleName = membership.customRole.name
            token.rolePriority = membership.customRole.priority
            token.permissions = membership.customRole.permissions
          } else if (membership.role) {
            const { DEFAULT_ROLES } = await import('@/lib/permissions')
            const defaultRole = DEFAULT_ROLES[membership.role]
            if (defaultRole) {
              token.roleName = defaultRole.name
              token.rolePriority = defaultRole.priority
              token.permissions = defaultRole.permissions
            }
          }
          token.permissionsRefreshedAt = Date.now()
        }
      }

      // Users without church access: periodically check if a membership was created
      // (e.g., admin approved an access request or invited them while they're on /cms/no-access)
      if (token.userId && !token.churchId) {
        const NO_CHURCH_CHECK_MS = 30 * 1000 // Check every 30 seconds
        const now = Date.now()
        const lastCheck = (token.permissionsRefreshedAt as number) || 0
        if (now - lastCheck > NO_CHURCH_CHECK_MS) {
          const membership = await prisma.churchMember.findFirst({
            where: { userId: token.userId as string },
            include: {
              church: {
                select: { id: true, slug: true, name: true, sessionVersion: true },
              },
              customRole: {
                select: { id: true, name: true, slug: true, priority: true, permissions: true },
              },
            },
            orderBy: { joinedAt: 'asc' },
          })
          if (membership) {
            token.churchId = membership.church.id
            token.churchSlug = membership.church.slug
            token.churchName = membership.church.name
            token.sessionVersion = membership.church.sessionVersion
            token.role = membership.role
            token.memberStatus = membership.status
            if (membership.role === 'OWNER') {
              const { ALL_PERMISSIONS, DEFAULT_ROLES } = await import('@/lib/permissions')
              const ownerDef = DEFAULT_ROLES.OWNER
              token.roleId = membership.customRole?.id
              token.roleName = ownerDef.name
              token.rolePriority = ownerDef.priority
              token.permissions = ALL_PERMISSIONS
            } else if (membership.customRole) {
              token.roleId = membership.customRole.id
              token.roleName = membership.customRole.name
              token.rolePriority = membership.customRole.priority
              token.permissions = membership.customRole.permissions
            } else if (membership.role) {
              const { DEFAULT_ROLES } = await import('@/lib/permissions')
              const defaultRole = DEFAULT_ROLES[membership.role]
              if (defaultRole) {
                token.roleName = defaultRole.name
                token.rolePriority = defaultRole.priority
                token.permissions = defaultRole.permissions
              }
            }
          }
          token.permissionsRefreshedAt = now
        }
      }

      // Refresh permissions when:
      // 1. Member is PENDING (always re-check so onboarding completion takes effect immediately)
      // 2. sessionVersion changed (admin bumped it — immediate effect)
      // 3. Periodic fallback every 5 minutes
      if (token.userId && token.churchId) {
        const PERMISSIONS_REFRESH_MS = 5 * 60 * 1000
        const now = Date.now()
        const lastRefresh = (token.permissionsRefreshedAt as number) || 0
        const timeExpired = now - lastRefresh > PERMISSIONS_REFRESH_MS
        const isPending = token.memberStatus === 'PENDING'

        // Lightweight version check — single int field, no joins
        let versionChanged = false
        if (!timeExpired && !isPending) {
          const church = await prisma.church.findUnique({
            where: { id: token.churchId as string },
            select: { sessionVersion: true },
          })
          versionChanged = church != null && church.sessionVersion !== (token.sessionVersion ?? 0)
        }

        if (timeExpired || versionChanged || isPending) {
          const membership = await prisma.churchMember.findFirst({
            where: { userId: token.userId as string, churchId: token.churchId as string },
            include: {
              church: { select: { sessionVersion: true } },
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
          })
          if (membership) {
            token.role = membership.role
            token.memberStatus = membership.status
            token.sessionVersion = membership.church.sessionVersion
            // OWNER always gets ALL permissions — never limited by DB-stored role
            if (membership.role === 'OWNER') {
              const { ALL_PERMISSIONS, DEFAULT_ROLES } = await import('@/lib/permissions')
              const ownerDef = DEFAULT_ROLES.OWNER
              token.roleId = membership.customRole?.id
              token.roleName = ownerDef.name
              token.rolePriority = ownerDef.priority
              token.permissions = ALL_PERMISSIONS
            } else if (membership.customRole) {
              token.roleId = membership.customRole.id
              token.roleName = membership.customRole.name
              token.rolePriority = membership.customRole.priority
              token.permissions = membership.customRole.permissions
            } else if (membership.role) {
              const { DEFAULT_ROLES } = await import('@/lib/permissions')
              const defaultRole = DEFAULT_ROLES[membership.role]
              if (defaultRole) {
                token.roleName = defaultRole.name
                token.rolePriority = defaultRole.priority
                token.permissions = defaultRole.permissions
              }
            }
          } else {
            // Membership was deleted or user was removed — clear church context
            // so the dashboard layout redirects to login/no-access
            token.churchId = undefined
            token.churchSlug = undefined
            token.churchName = undefined
            token.role = undefined
            token.roleId = undefined
            token.roleName = undefined
            token.rolePriority = undefined
            token.permissions = []
            token.memberStatus = undefined
          }
          token.permissionsRefreshedAt = now
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
        // Refresh name/avatar from DB so profile edits take effect without re-login
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.userId },
            select: { firstName: true, lastName: true, avatarUrl: true },
          })
          if (freshUser) {
            extSession.user.name = [freshUser.firstName, freshUser.lastName].filter(Boolean).join(' ') || null
            extSession.user.image = freshUser.avatarUrl
          } else {
            // User was deleted from DB — clear session so middleware redirects to login
            extSession.user.id = ''
          }
        } catch {
          // Best-effort — fall through to cached token values
        }
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
