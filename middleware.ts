import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  // --- CMS routes (except login and no-access) ---
  if (pathname.startsWith('/cms') && !pathname.startsWith('/cms/login') && !pathname.startsWith('/cms/no-access')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/cms/login', req.nextUrl.origin)
      loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search)
      return NextResponse.redirect(loginUrl)
    }

    // Authenticated but no church membership
    if (!req.auth?.churchId) {
      return NextResponse.redirect(new URL('/cms/no-access', req.nextUrl.origin))
    }
  }

  // --- API v1 routes ---
  if (pathname.startsWith('/api/v1')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!req.auth?.churchId) {
      return NextResponse.json(
        { error: 'No church membership found' },
        { status: 403 }
      )
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // CMS routes (except login, no-access, and static assets)
    '/cms/:path*',
    // API v1 routes
    '/api/v1/:path*',
  ],
}
