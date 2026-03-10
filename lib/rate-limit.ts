/**
 * Simple in-memory sliding window rate limiter.
 * Swap to Upstash (@upstash/ratelimit) for production multi-server deployment.
 *
 * WARNING: This is per-process only. On Vercel (serverless) or multi-instance
 * deployments, each instance has its own Map. Use Upstash Redis for those.
 */

const MAX_MAP_SIZE = 10_000
const hits = new Map<string, { count: number; resetAt: number }>()

// Periodic cleanup of expired entries (every 5 min)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of hits) {
      if (now > record.resetAt) hits.delete(key)
    }
  }, 5 * 60 * 1000)
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now()

  // Prevent unbounded memory growth from attacker-generated keys
  if (hits.size > MAX_MAP_SIZE) {
    // Emergency flush of expired entries
    for (const [k, record] of hits) {
      if (now > record.resetAt) hits.delete(k)
    }
    // If still over limit after cleanup, clear everything
    if (hits.size > MAX_MAP_SIZE) {
      hits.clear()
    }
  }

  const record = hits.get(key)

  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs
    hits.set(key, { count: 1, resetAt })
    return { success: true, remaining: limit - 1, resetAt }
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, resetAt: record.resetAt }
  }

  record.count++
  return { success: true, remaining: limit - record.count, resetAt: record.resetAt }
}
