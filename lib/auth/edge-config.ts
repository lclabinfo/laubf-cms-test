import type { NextAuthConfig } from 'next-auth'

// Import type augmentations
import './types'

/**
 * Edge-safe auth config — NO Prisma or Node.js imports.
 * Used by middleware (runs in Edge Runtime).
 * The full config in config.ts extends this with providers and DB callbacks.
 */
export const edgeAuthConfig: NextAuthConfig = {
  providers: [], // Providers are added in the full config (config.ts)

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/cms/login',
  },

  callbacks: {
    // The authorized callback runs in middleware to check if a request is allowed.
    // It only checks if a JWT token exists — no DB calls needed.
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const isAuthenticated = !!auth

      // CMS routes require authentication (except login/no-access)
      if (pathname.startsWith('/cms') && !pathname.startsWith('/cms/login') && !pathname.startsWith('/cms/no-access')) {
        return isAuthenticated
      }

      // API v1 routes require authentication
      if (pathname.startsWith('/api/v1')) {
        return isAuthenticated
      }

      // Everything else (website, auth routes) is public
      return true
    },
  },
}
