import Link from 'next/link'
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

export function WebsiteFooter({ menu, siteSettings }: WebsiteFooterProps) {
  const footerItems = menu?.items || []

  return (
    <footer className="bg-black-1 text-white-2 py-16 lg:py-20">
      <div className="container-standard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <h3 className="text-h4 text-white-1 mb-4">{siteSettings.siteName}</h3>
            {siteSettings.tagline && (
              <p className="text-body-2 text-white-3 mb-6">{siteSettings.tagline}</p>
            )}
            {/* Social links */}
            <div className="flex gap-3">
              {siteSettings.instagramUrl && (
                <SocialLink href={siteSettings.instagramUrl} label="Instagram" />
              )}
              {siteSettings.youtubeUrl && (
                <SocialLink href={siteSettings.youtubeUrl} label="YouTube" />
              )}
              {siteSettings.facebookUrl && (
                <SocialLink href={siteSettings.facebookUrl} label="Facebook" />
              )}
              {siteSettings.twitterUrl && (
                <SocialLink href={siteSettings.twitterUrl} label="Twitter" />
              )}
            </div>
          </div>

          {/* Navigation columns from menu */}
          {footerItems.filter(item => item.isVisible).map((item) => (
            <div key={item.id}>
              <h4 className="text-[13px] font-semibold text-white-3 tracking-[0.26px] uppercase mb-4">
                {item.label}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {item.children?.filter(child => child.isVisible).map((child) => (
                  <li key={child.id}>
                    <Link
                      href={child.href || '#'}
                      className="text-body-2 text-white-2 hover:text-white-1 transition-colors"
                      target={child.openInNewTab ? '_blank' : undefined}
                      rel={child.isExternal ? 'noopener noreferrer' : undefined}
                    >
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact column */}
          {(siteSettings.contactEmail || siteSettings.contactPhone || siteSettings.contactAddress) && (
            <div>
              <h4 className="text-[13px] font-semibold text-white-3 tracking-[0.26px] uppercase mb-4">
                Contact
              </h4>
              <div className="flex flex-col gap-2.5 text-body-2 text-white-2">
                {siteSettings.contactAddress && (
                  <p className="whitespace-pre-line">{siteSettings.contactAddress}</p>
                )}
                {siteSettings.contactPhone && (
                  <a href={`tel:${siteSettings.contactPhone}`} className="hover:text-white-1 transition-colors">
                    {siteSettings.contactPhone}
                  </a>
                )}
                {siteSettings.contactEmail && (
                  <a href={`mailto:${siteSettings.contactEmail}`} className="hover:text-white-1 transition-colors">
                    {siteSettings.contactEmail}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-black-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-black-3">
            &copy; {new Date().getFullYear()} {siteSettings.siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center size-10 rounded-full bg-black-1-5 text-white-2 hover:text-white-1 hover:bg-black-2 transition-colors"
      aria-label={label}
    >
      <span className="text-[13px] font-medium">{label[0]}</span>
    </a>
  )
}
