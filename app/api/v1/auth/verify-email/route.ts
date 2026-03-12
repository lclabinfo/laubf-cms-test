import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, deriveNonce } from '@/lib/auth/tokens'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`verify-email:${ip}`, 10, 60 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.redirect(new URL('/cms/login?error=RateLimited', request.url))
  }

  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.redirect(new URL('/cms/login?error=InvalidToken', request.url))
  }

  const payload = await verifyToken(token, 'email-verification')
  if (!payload) {
    return NextResponse.redirect(new URL('/cms/login?error=InvalidToken', request.url))
  }

  try {
    // Fetch user to validate nonce and check current state
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, emailVerified: true, passwordHash: true, verificationNonce: true },
    })

    if (!user) {
      return NextResponse.redirect(new URL('/cms/login?error=InvalidToken', request.url))
    }

    // Already verified — just redirect to success
    if (user.emailVerified) {
      return NextResponse.redirect(new URL('/cms/login?verified=true', request.url))
    }

    // Validate nonce — includes verificationNonce so only the latest email works
    if (payload.nonce) {
      const expectedNonce = deriveNonce(user.passwordHash, user.emailVerified, user.verificationNonce)
      if (payload.nonce !== expectedNonce) {
        return NextResponse.redirect(new URL('/cms/verify-email?error=expired', request.url))
      }
    }

    // Mark email as verified and clear the verification nonce
    await prisma.user.update({
      where: { id: payload.sub },
      data: { emailVerified: true, verificationNonce: null },
    })

    return NextResponse.redirect(new URL('/cms/login?verified=true', request.url))
  } catch (error) {
    console.error('[VerifyEmail] Error:', error)
    return NextResponse.redirect(new URL('/cms/login?error=InvalidToken', request.url))
  }
}
