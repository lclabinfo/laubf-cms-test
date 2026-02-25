import NextAuth from 'next-auth'
import { edgeAuthConfig } from '@/lib/auth/edge-config'
import { NextRequest } from 'next/server'

const { auth } = NextAuth(edgeAuthConfig)

/**
 * Middleware uses the edge-safe auth config (no Prisma/Node.js imports).
 * Auth.js's `authorized` callback in edge-config.ts handles the route checks.
 * Unauthenticated users are automatically redirected to the signIn page.
 */
export default async function middleware(req: NextRequest) {
  return auth(req as any)
}

export const config = {
  matcher: [
    '/cms/:path*',
    '/api/v1/:path*',
  ],
}
