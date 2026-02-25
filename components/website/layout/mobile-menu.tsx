"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import Image from "next/image"
import { ChevronDown, SquareArrowOutUpRight, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { getLucideIcon } from "./icon-map"
import CTAButton from "@/components/website/shared/cta-button"
import { IconHamburger, IconClose } from "@/components/website/shared/icons"
import type { MenuItemData, MenuChildItem } from "./dropdown-menu"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  items: MenuItemData[]
  logoUrl: string | null
  logoAlt: string | null
  siteName: string
  ctaLabel?: string
  ctaHref?: string
}

export default function MobileMenu({
  isOpen,
  onClose,
  items,
  logoUrl,
  logoAlt,
  siteName,
  ctaLabel,
  ctaHref,
}: MobileMenuProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const toggleSection = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id))
  }

  // Separate dropdown items (with children) from direct links
  const dropdownItems = items.filter((item) => item.children.length > 0)
  const directLinks = items.filter((item) => item.children.length === 0)

  /**
   * Build sections from children by grouping on groupLabel.
   * Items with sortOrder >= 99 and featuredTitle are treated as overview links.
   */
  function getOverviewLink(item: MenuItemData) {
    for (const child of item.children) {
      if (child.featuredTitle && child.featuredHref && child.sortOrder >= 99) {
        return {
          label: child.featuredTitle,
          description: child.featuredDescription || "",
          href: child.featuredHref,
        }
      }
    }
    return null
  }

  function getGroupedChildren(item: MenuItemData) {
    const regular = item.children.filter(
      (c) => !(c.featuredTitle && c.featuredHref && c.sortOrder >= 99),
    )
    const groups = new Map<string, MenuChildItem[]>()
    for (const child of regular) {
      const key = child.groupLabel || ""
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(child)
    }
    return groups
  }

  const menu = (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[9998] bg-black-1/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          "fixed inset-y-0 right-0 z-[9999] w-full max-w-sm bg-white-0 transition-transform duration-300 ease-smooth h-[100svh] flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white-2">
          <Link href="/" onClick={onClose}>
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={logoAlt || siteName}
                width={50}
                height={42}
                unoptimized
                className="object-contain"
              />
            ) : (
              <span className="text-lg font-bold text-black-1">{siteName}</span>
            )}
          </Link>
          <button
            onClick={onClose}
            className="p-2 text-black-1"
            aria-label="Close menu"
          >
            <IconClose width={24} height={24} />
          </button>
        </div>

        {/* Nav sections */}
        <div className="p-4 flex flex-col gap-1 flex-1 overflow-y-auto">
          {dropdownItems.map((item) => {
            const overviewLink = getOverviewLink(item)
            const groups = getGroupedChildren(item)

            return (
              <div key={item.id}>
                {/* Accordion header */}
                <button
                  onClick={() => toggleSection(item.id)}
                  className="flex items-center justify-between w-full px-4 py-4 rounded-lg text-nav text-black-1 transition-colors duration-150 hover:bg-white-1-5"
                >
                  {item.label}
                  <ChevronDown
                    className={cn(
                      "size-5 transition-transform duration-200",
                      expanded === item.id && "rotate-180",
                    )}
                    strokeWidth={2}
                  />
                </button>

                {/* Accordion content */}
                <div
                  className={cn(
                    "overflow-hidden transition-[grid-template-rows] duration-300 ease-smooth grid",
                    expanded === item.id
                      ? "grid-rows-[1fr]"
                      : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="pl-4 flex flex-col gap-0.5 pb-2">
                      {/* Direct link to hub page */}
                      {item.href && (
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-body-1 font-medium text-black-1 transition-colors duration-150 hover:bg-white-1-5"
                        >
                          {item.label} Hub
                        </Link>
                      )}

                      {/* Grouped sections */}
                      {Array.from(groups.entries()).map(([groupTitle, groupItems]) => (
                        <div key={groupTitle || "default"}>
                          {/* Section title */}
                          {groupTitle && (
                            <div className="px-4 pt-3 pb-1 text-overline text-black-3 text-[0.6875rem]">
                              {groupTitle}
                            </div>
                          )}
                          {groupItems.map((child) => {
                            const Icon = getLucideIcon(child.iconName)
                            return (
                              <Link
                                key={child.id}
                                href={child.href || "/"}
                                target={child.isExternal || child.openInNewTab ? "_blank" : undefined}
                                rel={child.isExternal || child.openInNewTab ? "noopener noreferrer" : undefined}
                                onClick={onClose}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-body-1 text-black-2 transition-colors duration-150 hover:bg-white-1-5"
                              >
                                {Icon && (
                                  <Icon
                                    className="size-5 text-black-3 shrink-0"
                                    strokeWidth={1.5}
                                  />
                                )}
                                {child.label}
                                {(child.isExternal || child.openInNewTab) && (
                                  <SquareArrowOutUpRight
                                    className="size-3.5 text-black-3 ml-auto shrink-0"
                                    strokeWidth={1.5}
                                  />
                                )}
                              </Link>
                            )
                          })}
                        </div>
                      ))}

                      {/* Overview link */}
                      {overviewLink && (
                        <Link
                          href={overviewLink.href}
                          onClick={onClose}
                          className="flex items-center justify-between mx-2 mt-2 px-4 py-4 bg-white-1-5 border border-white-2-5 rounded-lg transition-colors hover:bg-white-2"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium leading-[1.2] text-black-1 tracking-[-0.03em]">
                              {overviewLink.label}
                            </span>
                            <span className="text-xs font-normal leading-none text-black-3 tracking-[-0.03em]">
                              {overviewLink.description}
                            </span>
                          </div>
                          <div className="border border-black-3 rounded-full p-1.5 shrink-0">
                            <ArrowUpRight className="size-2.5 text-black-3" strokeWidth={2} />
                          </div>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Direct links */}
          {directLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href || "/"}
              onClick={onClose}
              className="px-4 py-4 rounded-lg text-nav text-black-1 transition-colors duration-150 hover:bg-white-1-5"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        {ctaLabel && ctaHref && (
          <div className="p-4 shrink-0 border-t border-white-2">
            <CTAButton
              label={ctaLabel}
              href={ctaHref}
              variant="primary"
              size="full"
              theme="light"
              onClick={onClose}
            />
          </div>
        )}
      </div>
    </>
  )

  // Render via portal to avoid overflow-x-hidden clipping
  if (!mounted) return null
  return createPortal(menu, document.body)
}
