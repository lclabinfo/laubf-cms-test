/**
 * JWT-based auth tokens for email verification and password reset.
 * Uses AUTH_SECRET for signing — no extra secret needed.
 *
 * Token replay prevention: Each token embeds a nonce tied to the user's
 * current password hash. When the password changes (reset) or email is
 * verified, the nonce changes, invalidating all previously issued tokens.
 */

import { SignJWT, jwtVerify, errors as joseErrors } from 'jose'
import crypto from 'crypto'

type TokenPurpose = 'email-verification' | 'password-reset' | 'invitation'

interface TokenPayload {
  sub: string // userId
  purpose: TokenPurpose
  email: string
  nonce?: string // replay-prevention nonce
  role?: string // for invitation tokens
  churchId?: string // for invitation tokens
  inviterId?: string // for invitation tokens
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')
  return new TextEncoder().encode(secret)
}

const EXPIRY: Record<TokenPurpose, string> = {
  'email-verification': '30m',
  'password-reset': '1h',
  invitation: '7d',
}

/**
 * Derive a nonce from user state. When the relevant state changes,
 * the nonce changes, invalidating previously issued tokens.
 *
 * For email-verification tokens, pass the user's verificationNonce so that
 * resending a verification email invalidates all previous tokens.
 */
export function deriveNonce(
  passwordHash: string | null,
  emailVerified: boolean,
  verificationNonce?: string | null,
): string {
  const input = `${passwordHash || 'none'}:${emailVerified}:${verificationNonce || ''}`
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16)
}

export async function createToken(payload: TokenPayload): Promise<string> {
  const jwt = new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY[payload.purpose])

  return jwt.sign(getSecret())
}

export async function verifyToken(
  token: string,
  expectedPurpose: TokenPurpose,
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    const data = payload as unknown as TokenPayload

    if (data.purpose !== expectedPurpose) {
      return null // Wrong purpose — prevent cross-use
    }

    return data
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired) {
      return null // Token expired
    }
    if (error instanceof joseErrors.JWSSignatureVerificationFailed) {
      return null // Invalid signature
    }
    console.error('[Token] Verification failed:', error)
    return null
  }
}
