"use client"

import { Fragment } from "react"
import Link from "next/link"
import Image from "next/image"
import { SquareArrowOutUpRight, ArrowUpRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { getLucideIcon } from "./icon-map"

/* ── Data types matching the database MenuItem model ── */

export interface MenuChildItem {
  id: string
  label: string
  href: string | null
  description: string | null
  iconName: string | null
  openInNewTab: boolean
  isExternal: boolean
  groupLabel: string | null
  featuredImage: string | null
  featuredTitle: string | null
  featuredDescription: string | null
  featuredHref: string | null
  sortOrder: number
  isVisible: boolean
}

export interface MenuItemData {
  id: string
  label: string
  href: string | null
  description: string | null
  iconName: string | null
  openInNewTab: boolean
  isExternal: boolean
  groupLabel: string | null
  featuredImage: string | null
  featuredTitle: string | null
  featuredDescription: string | null
  featuredHref: string | null
  sortOrder: number
  isVisible: boolean
  children: MenuChildItem[]
}

/* ── Derived types for the dropdown ── */

interface DropdownSection {
  title: string
  compact: boolean
  columns: number
  items: MenuChildItem[]
  /** Footer link for the section (not used currently but available) */
  footerLink?: { label: string; href: string } | null
}

interface OverviewLink {
  label: string
  description: string
  href: string
}

interface FeaturedCard {
  image: string
  imageAlt: string
  title: string
  description: string
  href: string
}

interface DropdownMenuProps {
  item: MenuItemData
  onClose: () => void
}

/**
 * Build dropdown sections from database children by grouping on `groupLabel`.
 * The "Quick Links" group gets compact mode. An item with `featuredTitle`
 * is treated as an overview link (bottom bar), not a section item.
 */
function buildDropdownData(item: MenuItemData) {
  const sections: DropdownSection[] = []
  let overviewLink: OverviewLink | null = null
  let featuredCard: FeaturedCard | null = null

  // Separate overview link items from regular items
  const regularChildren: MenuChildItem[] = []
  for (const child of item.children) {
    // An item with featuredTitle + featuredHref AND sortOrder >= 99
    // is treated as an overview link (displayed at the bottom of the dropdown)
    if (child.featuredTitle && child.featuredHref && child.sortOrder >= 99) {
      overviewLink = {
        label: child.featuredTitle,
        description: child.featuredDescription || "",
        href: child.featuredHref,
      }
    } else {
      regularChildren.push(child)
    }
  }

  // Check parent-level featured card
  if (item.featuredImage && item.featuredTitle && item.featuredHref) {
    featuredCard = {
      image: item.featuredImage,
      imageAlt: item.featuredTitle,
      title: item.featuredTitle,
      description: item.featuredDescription || "",
      href: item.featuredHref,
    }
  }

  // Group remaining children by groupLabel
  const groupMap = new Map<string, MenuChildItem[]>()
  for (const child of regularChildren) {
    const key = child.groupLabel || ""
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)!.push(child)
  }

  for (const [title, items] of groupMap) {
    const isQuickLinks = title.toLowerCase() === "quick links"
    const isCampus = title.toLowerCase().includes("campus")
    sections.push({
      title,
      compact: isQuickLinks,
      columns: isCampus ? 2 : 1,
      items,
    })
  }

  return { sections, overviewLink, featuredCard }
}

/* ── Section column ── */

function SectionColumn({
  section,
  onClose,
}: {
  section: DropdownSection
  onClose: () => void
}) {
  const isGrid = section.columns > 1

  return (
    <div className={cn("flex flex-col gap-1.5 shrink-0", isGrid ? "w-auto" : "w-56")}>
      {/* Section title */}
      {section.title && (
        <div className="px-1.5">
          <p className="text-base font-medium leading-[1.2] text-black-3 tracking-[-0.03em]">
            {section.title}
          </p>
        </div>
      )}

      {/* Items */}
      <div
        className={cn(
          isGrid ? "grid grid-cols-2 auto-rows-min" : "flex flex-col",
        )}
      >
        {section.items.map((child) => {
          const Icon = getLucideIcon(child.iconName)
          return (
            <Link
              key={child.id}
              href={child.href || "/"}
              target={child.isExternal || child.openInNewTab ? "_blank" : undefined}
              rel={child.isExternal || child.openInNewTab ? "noopener noreferrer" : undefined}
              onClick={onClose}
              className={cn(
                "flex items-center rounded-lg transition-colors hover:bg-white-1-5 group/item",
                section.compact
                  ? "gap-3 px-3 py-2.5 min-h-0"
                  : "gap-4 min-w-[200px] min-h-[62px] px-4 py-3",
              )}
            >
              {!section.compact && Icon && (
                <Icon
                  className="size-6 text-black-1 shrink-0"
                  strokeWidth={1.5}
                />
              )}
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span
                  className={cn(
                    "font-medium leading-tight text-black-1 tracking-[-0.03em]",
                    section.compact ? "text-[14px]" : "text-base",
                  )}
                >
                  {child.label}
                </span>
                {child.description && (
                  <span
                    className={cn(
                      "font-normal leading-none text-black-3 tracking-[-0.03em] line-clamp-1",
                      section.compact ? "text-[12px]" : "text-[14px]",
                    )}
                  >
                    {child.description}
                  </span>
                )}
              </div>
              {(child.isExternal || child.openInNewTab) && (
                <SquareArrowOutUpRight
                  className={cn(
                    "size-[16px] text-black-3 shrink-0 ml-auto",
                    section.compact &&
                      "opacity-0 transition-opacity duration-150 group-hover/item:opacity-100",
                  )}
                  strokeWidth={1.5}
                />
              )}
            </Link>
          )
        })}
      </div>

      {/* Footer link */}
      {section.footerLink && (
        <Link
          href={section.footerLink.href}
          onClick={onClose}
          className="flex items-center justify-between px-6 py-5 mt-3 bg-white-1-5 border border-white-2-5 rounded-lg transition-colors hover:bg-white-2"
        >
          <span className="text-base font-medium leading-[1.2] text-black-2 tracking-[-0.03em]">
            {section.footerLink.label}
          </span>
          <div className="border border-black-3 rounded-full p-2">
            <ArrowUpRight className="size-3 text-black-3" strokeWidth={2} />
          </div>
        </Link>
      )}
    </div>
  )
}

/* ── Dropdown menu ── */

export default function DropdownMenu({ item, onClose }: DropdownMenuProps) {
  const { sections, overviewLink, featuredCard } = buildDropdownData(item)

  if (sections.length === 0 && !overviewLink && !featuredCard) {
    return null
  }

  return (
    <div className="bg-white-1 border border-white-2 rounded-xl shadow-[0px_12px_20px_0px_rgba(0,0,0,0.03)] py-6 px-5 w-max animate-dropdown-in flex flex-col gap-5">
      <div className="flex gap-5 items-stretch">
        {sections.map((section, i) => (
          <Fragment key={section.title || i}>
            {i > 0 && (
              <div className="w-0.5 self-stretch bg-white-2 rounded-full shrink-0" />
            )}
            <SectionColumn section={section} onClose={onClose} />
          </Fragment>
        ))}

        {/* Featured card */}
        {featuredCard && (
          <>
            <div className="w-0.5 self-stretch bg-white-2 rounded-full shrink-0" />
            <Link
              href={featuredCard.href}
              onClick={onClose}
              className="relative flex flex-col items-start justify-end w-[260px] shrink-0 px-6 py-7 rounded-xl overflow-hidden group"
            >
              <Image
                src={featuredCard.image}
                alt={featuredCard.imageAlt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[44%] to-black-1/70 to-[69%]" />
              <div className="relative flex flex-col gap-2 min-w-[200px]">
                <div className="flex items-end gap-1.5">
                  <p className="text-2xl font-medium text-white-1 tracking-[-0.03em] leading-[1.2] whitespace-pre-line">
                    {featuredCard.title}
                  </p>
                  <ArrowUpRight
                    className="size-7 text-white-1"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-base font-normal text-white-2 tracking-[-0.02em] leading-[1.4]">
                  {featuredCard.description}
                </p>
              </div>
            </Link>
          </>
        )}
      </div>

      {/* Overview link at bottom of dropdown */}
      {overviewLink && (
        <Link
          href={overviewLink.href}
          onClick={onClose}
          className="flex items-center justify-between px-4 py-3.5 bg-white-1-5 border border-white-2-5 rounded-xl transition-colors hover:bg-white-2 group/overview"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-base font-medium leading-[1.2] text-black-1 tracking-[-0.03em]">
              {overviewLink.label}
            </span>
            <span className="text-base font-normal leading-none text-black-3 tracking-[-0.03em]">
              {overviewLink.description}
            </span>
          </div>
          <div className="border border-black-3 rounded-full p-2 transition-colors group-hover/overview:border-black-1">
            <ArrowUpRight className="size-3 text-black-3 group-hover/overview:text-black-1" strokeWidth={2} />
          </div>
        </Link>
      )}
    </div>
  )
}
