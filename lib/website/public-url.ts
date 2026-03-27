/**
 * Returns the public-facing base URL for the website (no trailing slash).
 *
 * Priority:
 *   1. NEXT_PUBLIC_SITE_URL  — the canonical public domain (e.g. https://laubf.lclab.io)
 *   2. NEXT_PUBLIC_WEBSITE_URL with /website suffix stripped
 *   3. Empty string (relative URLs)
 *
 * Used for:
 *   - og:url / canonical link tags
 *   - Share URLs passed to client components
 *   - Any server-side code that needs the public origin
 */
export function getPublicBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '')
  }
  if (process.env.NEXT_PUBLIC_WEBSITE_URL) {
    return process.env.NEXT_PUBLIC_WEBSITE_URL.replace(/\/website\/?$/, '').replace(/\/+$/, '')
  }
  return ''
}
