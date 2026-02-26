/**
 * Resolves internal hrefs by prepending the website base path.
 *
 * Menu items and section content store hrefs as bare paths (e.g., '/about',
 * '/ministries/college') but the public website lives under the '/website'
 * route group. This utility ensures all internal links resolve correctly.
 *
 * Skips: external URLs (http/https/mailto/tel), anchor links (#), and
 * hrefs that already start with '/website'.
 */

const WEBSITE_BASE = '/website'

export function resolveHref(href: string | null | undefined): string {
  if (!href) return '/'

  // Already prefixed
  if (href.startsWith(WEBSITE_BASE + '/') || href === WEBSITE_BASE) return href

  // External URLs, mailto, tel — pass through
  if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return href

  // Anchor links — pass through
  if (href.startsWith('#')) return href

  // Internal path: prepend /website
  // Handle query params: /events?tab=event → /website/events?tab=event
  const path = href.startsWith('/') ? href : `/${href}`
  return `${WEBSITE_BASE}${path}`
}
