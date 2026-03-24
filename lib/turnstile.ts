/**
 * Cloudflare Turnstile server-side verification.
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface TurnstileResult {
  success: boolean
  error?: string
}

/**
 * Verifies a Turnstile token server-side.
 * Returns { success: true } if valid, or skips verification if Turnstile is not configured.
 */
export async function verifyTurnstile(token: string | null | undefined, ip?: string): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY

  // If Turnstile is not configured, skip verification (dev mode)
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Turnstile] Not configured — skipping verification (dev mode)')
    }
    return { success: true }
  }

  if (!token) {
    return { success: false, error: 'Please complete the verification challenge.' }
  }

  try {
    const body: Record<string, string> = {
      secret,
      response: token,
    }
    if (ip) body.remoteip = ip

    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (data.success) {
      return { success: true }
    }

    console.error('[Turnstile] Verification failed:', data['error-codes'])
    return { success: false, error: 'Verification failed. Please try again.' }
  } catch (error) {
    console.error('[Turnstile] Verification error:', error)
    // Fail closed — rate limiting still protects against brute force
    return { success: false, error: 'Verification service unavailable. Please try again.' }
  }
}
