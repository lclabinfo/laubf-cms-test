"use client"

import Link from 'next/link'
import Image from 'next/image'
import { resolveHref } from '@/lib/website/resolve-href'
import type { SiteSettings, Prisma } from '@/lib/generated/prisma/client'

type MenuWithItems = Prisma.MenuGetPayload<{
  include: {
    items: {
      include: { children: true }
    }
  }
}>

interface WebsiteFooterProps {
  menu: MenuWithItems | null
  siteSettings: SiteSettings
}

/**
 * Groups flat menu items by `groupLabel` into columns.
 * Falls back to parent→children hierarchy if groupLabels aren't present.
 */
function buildFooterColumns(menu: MenuWithItems | null) {
  if (!menu) return []

  const visibleItems = menu.items.filter(item => item.isVisible)

  // Strategy 1: If items have children (parent→child hierarchy from menu editor)
  const itemsWithChildren = visibleItems.filter(item => item.children && item.children.length > 0)
  if (itemsWithChildren.length > 0) {
    return itemsWithChildren.map(item => ({
      heading: item.label,
      links: (item.children ?? [])
        .filter(child => child.isVisible)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(child => ({
          label: child.label,
          href: child.href || '#',
          external: child.isExternal || child.openInNewTab || false,
        })),
    }))
  }

  // Strategy 2: Group flat items by groupLabel (seed data pattern)
  const grouped = new Map<string, typeof visibleItems>()
  for (const item of visibleItems) {
    const group = item.groupLabel || 'Links'
    if (!grouped.has(group)) grouped.set(group, [])
    grouped.get(group)!.push(item)
  }

  return Array.from(grouped.entries()).map(([heading, items]) => ({
    heading,
    links: items
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(item => ({
        label: item.label,
        href: item.href || '#',
        external: item.isExternal || item.openInNewTab || false,
      })),
  }))
}

export function WebsiteFooter({ menu, siteSettings }: WebsiteFooterProps) {
  const columns = buildFooterColumns(menu)

  return (
    <footer className="bg-black-1 px-4 py-20 lg:px-30">
      <div className="container-standard">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand column */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              {siteSettings.logoUrl ? (
                <Image
                  src={siteSettings.logoUrl}
                  alt={siteSettings.logoAlt || siteSettings.siteName}
                  width={80}
                  height={66}
                  unoptimized
                  className="object-contain brightness-0 invert"
                />
              ) : (
                <span className="text-h4 text-white-1">{siteSettings.siteName}</span>
              )}
              {siteSettings.tagline && (
                <p className="text-body-2 text-white-2-5 max-w-[240px]">
                  {siteSettings.tagline}
                </p>
              )}
            </div>
            {/* Social links */}
            <div className="flex gap-3">
              {siteSettings.instagramUrl && (
                <SocialLink href={siteSettings.instagramUrl} platform="instagram" />
              )}
              {siteSettings.facebookUrl && (
                <SocialLink href={siteSettings.facebookUrl} platform="facebook" />
              )}
              {siteSettings.youtubeUrl && (
                <SocialLink href={siteSettings.youtubeUrl} platform="youtube" />
              )}
              {siteSettings.twitterUrl && (
                <SocialLink href={siteSettings.twitterUrl} platform="twitter" />
              )}
              {siteSettings.tiktokUrl && (
                <SocialLink href={siteSettings.tiktokUrl} platform="tiktok" />
              )}
            </div>
          </div>

          {/* Nav columns — hidden on mobile */}
          {columns.map((col) => (
            <div key={col.heading} className="hidden sm:flex flex-col gap-3">
              <h4 className="text-button-2 text-white-2-5 uppercase">
                {col.heading}
              </h4>
              <nav className="flex flex-col">
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    href={resolveHref(link.href)}
                    className="px-2 py-1.5 text-body-2 text-white-2 transition-colors hover:text-white-1"
                    {...(link.external
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}

          {/* Contact column */}
          {(siteSettings.contactEmail || siteSettings.contactPhone || siteSettings.contactAddress) && (
            <div className="flex flex-col gap-3">
              <h4 className="text-button-2 text-white-2-5 uppercase">
                VISIT US
              </h4>
              <div className="flex flex-col gap-4">
                {siteSettings.contactAddress && (
                  <div className="flex flex-col text-body-2 text-white-2">
                    {siteSettings.contactAddress.split('\n').map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </div>
                )}
                {siteSettings.contactPhone && (
                  <a
                    href={`tel:${siteSettings.contactPhone.replace(/\D/g, '')}`}
                    className="text-body-2 text-white-2 transition-colors hover:text-white-1"
                  >
                    {siteSettings.contactPhone}
                  </a>
                )}
                {siteSettings.contactEmail && (
                  <a
                    href={`mailto:${siteSettings.contactEmail}`}
                    className="text-body-2 text-white-2 transition-colors hover:text-white-1"
                  >
                    {siteSettings.contactEmail}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}

/* ── Social icon with proper SVG ── */

function SocialLink({ href, platform }: { href: string; platform: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex size-11 items-center justify-center rounded-full bg-black-2 text-white-2 transition-colors hover:bg-black-3"
      aria-label={platform}
    >
      <SocialIcon platform={platform} />
    </a>
  )
}

function SocialIcon({ platform }: { platform: string }) {
  switch (platform) {
    case 'instagram':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'facebook':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.6c-1 .3-1.7 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.6 9.5.6 9.5.6s7.6 0 9.5-.6c1-.3 1.7-1.1 2-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.4 3.6-6.4 3.6z" />
        </svg>
      )
    case 'twitter':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.89 2.89 2.89 0 012.88-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.82a8.18 8.18 0 004.77 1.53V6.9a4.82 4.82 0 01-1-.21z" />
        </svg>
      )
    default:
      return null
  }
}
