import type { NextAuthConfig } from 'next-auth'

// Import type augmentations
import './types'

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Edge-safe auth config — NO Prisma or Node.js imports.
 * Used by middleware (runs in Edge Runtime).
 * The full config in config.ts extends this with providers and DB callbacks.
 */
export const edgeAuthConfig: NextAuthConfig = {
  providers: [], // Providers are added in the full config (config.ts)

  session: {
    strategy: 'jwt',
    maxAge: 604800, // 7 days
  },

  cookies: {
    sessionToken: {
      name: isProduction
        ? '__Secure-authjs.session-token'
        : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
      },
    },
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

      // CMS routes require authentication (except public auth pages)
      const publicCmsPages = ['/cms/login', '/cms/signup', '/cms/no-access', '/cms/verify-email', '/cms/forgot-password', '/cms/reset-password', '/cms/accept-invite']
      if (pathname.startsWith('/cms') && !publicCmsPages.some(p => pathname.startsWith(p))) {
        return isAuthenticated
      }

      // API v1 routes require authentication (except public endpoints)
      if (pathname.startsWith('/api/v1')) {
        // Public endpoints: bible text, auth flows, form submissions
        if (pathname.startsWith('/api/v1/bible')) return true
        if (pathname.startsWith('/api/v1/auth/')) return true
        return isAuthenticated
      }

      // Everything else (website, auth routes) is public
      return true
    },
  },
}
