/**
 * Resolves internal hrefs by prepending the website base path.
 *
 * Menu items and section content store hrefs as bare paths (e.g., '/about',
 * '/ministries/college') but the public website lives under the '/website'
 * route in development. In production (subdomain access via proxy rewrite),
 * no prefix is needed because the proxy transparently rewrites
 * `laubf.lclab.io/events` → internal `/website/events`.
 *
 * Set `NEXT_PUBLIC_WEBSITE_BASE` to control the prefix:
 *   - Dev (default): '/website'  → links become /website/events
 *   - Production:    ''          → links become /events
 *
 * Skips: external URLs (http/https/mailto/tel), anchor links (#), and
 * hrefs that already include the website base prefix.
 */

const WEBSITE_BASE = process.env.NEXT_PUBLIC_WEBSITE_BASE ?? '/website'

export function resolveHref(href: string | null | undefined): string {
  if (!href) return WEBSITE_BASE || '/'

  // Already prefixed (only relevant when WEBSITE_BASE is non-empty)
  if (WEBSITE_BASE && (href.startsWith(WEBSITE_BASE + '/') || href === WEBSITE_BASE)) return href

  // External URLs, mailto, tel — pass through
  if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return href

  // Anchor links — pass through
  if (href.startsWith('#')) return href

  // Internal path: prepend base
  // Handle query params: /events?tab=event → /website/events?tab=event (dev)
  //                      /events?tab=event → /events?tab=event (prod)
  const path = href.startsWith('/') ? href : `/${href}`
  return `${WEBSITE_BASE}${path}`
}

/** The raw website base path, for use outside of href resolution */
export const WEBSITE_BASE_PATH = WEBSITE_BASE
