/**
 * Centralized URL helpers for domain-aware URL construction.
 * No hardcoded domains — everything reads from env vars.
 */

/** Public website URL (what visitors see in their browser) */
export function getWebsiteUrl(): string {
  return process.env.WEBSITE_URL || 'http://localhost:3000/website'
}

/** CMS admin URL */
export function getCmsUrl(): string {
  return process.env.CMS_URL || process.env.AUTH_URL || 'http://localhost:3000'
}

/** Full URL for a website page */
export function getPageUrl(slug: string): string {
  const base = getWebsiteUrl()
  if (!slug || slug === '/') return base
  return `${base}/${slug.replace(/^\//, '')}`
}

/** Default subdomain for the current church (e.g., "laubf.lclab.io") */
export function getDefaultSubdomain(): string {
  const slug = process.env.CHURCH_SLUG || 'la-ubf'
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
  if (rootDomain.includes('localhost')) {
    return `localhost:3000/website`
  }
  return `${slug}.${rootDomain}`
}
