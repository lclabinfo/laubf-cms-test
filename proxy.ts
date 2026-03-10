import NextAuth from 'next-auth'
import { edgeAuthConfig } from '@/lib/auth/edge-config'
import { NextRequest, NextResponse } from 'next/server'

const { auth } = NextAuth(edgeAuthConfig)

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'

/**
 * Combined proxy handling:
 * 1. Domain routing — rewrites church subdomain requests to /website/...
 * 2. Auth gating — protects /cms/* and /api/v1/* routes via Auth.js
 */
export async function proxy(req: NextRequest) {
  const hostname = req.headers.get('host') || ''
  const { pathname } = req.nextUrl

  // --- Domain routing (subdomain → /website rewrite) ---

  // Skip domain routing for: static assets, API, CMS, direct /website access (dev)
  const skipDomainRouting =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/cms') ||
    pathname.startsWith('/website') ||
    pathname === '/favicon.ico'

  if (!skipDomainRouting) {
    const isDev = hostname.includes('localhost') || hostname.includes('127.0.0.1')
    const isAdmin = hostname.startsWith('admin.')

    // Church subdomain (e.g. laubf.lclab.io): rewrite to /website/...
    if (!isDev && !isAdmin && hostname.endsWith(`.${ROOT_DOMAIN}`)) {
      const slug = hostname.replace(`.${ROOT_DOMAIN}`, '')
      const websitePath = pathname === '/' ? '/website' : `/website${pathname}`
      const url = req.nextUrl.clone()
      url.pathname = websitePath

      const response = NextResponse.rewrite(url)
      response.headers.set('x-tenant-slug', slug)
      return response
    }
  }

  // --- Auth gating (CMS + API routes) ---

  if (pathname.startsWith('/cms') || pathname.startsWith('/api/v1')) {
    return auth(req as any)
  }

  // Everything else: pass through
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
