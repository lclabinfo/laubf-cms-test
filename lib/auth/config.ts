import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import type { MemberRole } from '@/lib/generated/prisma/client'

// Import type augmentations
import './types'

export const authConfig: NextAuthConfig = {
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

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.passwordHash) return null

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

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/cms/login',
  },

  callbacks: {
    async signIn({ user, account }) {
      // For Google OAuth: create or link User + Account
      if (account?.provider === 'google' && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        })

        if (!existingUser) {
          // Create a new user and link the Google account
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
          // Set the user id so the jwt callback can use it
          user.id = newUser.id
        } else {
          // User exists — link account if not already linked
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
          // Use existing user id
          user.id = existingUser.id
        }
      }

      return true
    },

    async jwt({ token, user }) {
      // On initial sign-in, user is present — look up church membership
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
          },
          orderBy: { joinedAt: 'asc' },
        })

        if (membership) {
          token.churchId = membership.church.id
          token.churchSlug = membership.church.slug
          token.churchName = membership.church.name
          token.role = membership.role
        }
      }

      return token
    },

    async session({ session, token }) {
      // Type-safe assignment from JWT token to session
      // The session object starts as DefaultSession; we extend it with our custom fields
      const extSession = session as typeof session & {
        churchId: string
        churchSlug: string
        churchName: string
        role: MemberRole
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

      return extSession
    },
  },
}
