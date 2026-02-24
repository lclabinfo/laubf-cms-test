"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronDown, Menu as MenuIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface MenuChildItem {
  id: string
  label: string
  href: string | null
  description: string | null
  iconName: string | null
  openInNewTab: boolean
  isExternal: boolean
  groupLabel: string | null
  sortOrder: number
}

interface MenuItemData {
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
  children: MenuChildItem[]
}

interface MenuData {
  id: string
  items: MenuItemData[]
}

interface WebsiteNavbarProps {
  menu: MenuData | null
  logoUrl: string | null
  logoAlt: string | null
  siteName: string
}

export function WebsiteNavbar({ menu, logoUrl, logoAlt, siteName }: WebsiteNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const openDropdown = useCallback((id: string) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setActiveDropdown(id)
  }, [])

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 150)
  }, [])

  const items = menu?.items ?? []

  // Separate items with children (dropdown triggers) from direct links
  const dropdownItems = items.filter((item) => item.children.length > 0)
  const directItems = items.filter((item) => item.children.length === 0)

  return (
    <>
      <header
        className={cn(
          "sticky top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-white-1 border-b border-white-2-5 shadow-[0px_12px_20px_0px_rgba(0,0,0,0.03)]"
            : "",
        )}
      >
        {/* Gradient overlay when transparent (over hero) */}
        {!isScrolled && (
          <div
            className="absolute inset-x-0 top-0 z-0 h-[200px] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.2) 60%, transparent 100%)",
            }}
          />
        )}

        <div className="container-standard relative z-10 flex items-center justify-between py-1.5">
          {/* Logo */}
          <Link href="/" className="relative shrink-0">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={logoAlt || siteName}
                width={57}
                height={48}
                unoptimized
                className={cn(
                  "object-contain",
                  !isScrolled && "brightness-0 invert",
                )}
              />
            ) : (
              <span
                className={cn(
                  "text-xl font-bold",
                  isScrolled ? "text-black-1" : "text-white-1",
                )}
              >
                {siteName}
              </span>
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {dropdownItems.map((item) => (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => openDropdown(item.id)}
                onMouseLeave={scheduleClose}
              >
                <NavLink
                  href={item.href}
                  isScrolled={isScrolled}
                  isActive={activeDropdown === item.id}
                  hasDropdown
                >
                  {item.label}
                </NavLink>
                {activeDropdown === item.id && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 z-[100] pt-1">
                    <DropdownPanel
                      items={item.children}
                      onClose={() => setActiveDropdown(null)}
                    />
                  </div>
                )}
              </div>
            ))}
            {directItems.map((item) => (
              <NavLink
                key={item.id}
                href={item.href}
                isScrolled={isScrolled}
                external={item.isExternal}
                newTab={item.openInNewTab}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={cn(
              "lg:hidden p-2",
              isScrolled ? "text-black-1" : "text-white-1",
            )}
            aria-label="Open menu"
          >
            <MenuIcon className="size-7" />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <MobileDrawer
          items={items}
          siteName={siteName}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  )
}

function NavLink({
  href,
  isScrolled,
  isActive,
  hasDropdown,
  external,
  newTab,
  children,
}: {
  href: string | null
  isScrolled: boolean
  isActive?: boolean
  hasDropdown?: boolean
  external?: boolean
  newTab?: boolean
  children: React.ReactNode
}) {
  const className = cn(
    "flex items-center gap-1 px-3 py-3 rounded-xl text-sm font-medium transition-colors duration-150",
    isScrolled
      ? cn("text-black-1", isActive ? "bg-white-1-5" : "hover:bg-white-1-5")
      : cn("text-white-1", isActive ? "bg-white-0/10" : "hover:bg-white-0/10"),
  )

  const content = (
    <>
      {children}
      {hasDropdown && (
        <ChevronDown
          className={cn(
            "size-4 transition-transform duration-200",
            isActive && "rotate-180",
          )}
          strokeWidth={2}
        />
      )}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={className}
        {...(external || newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {content}
      </Link>
    )
  }

  return <span className={className}>{content}</span>
}

function DropdownPanel({
  items,
  onClose,
}: {
  items: MenuChildItem[]
  onClose: () => void
}) {
  // Group items by groupLabel
  const groups = new Map<string, MenuChildItem[]>()
  for (const item of items) {
    const key = item.groupLabel || ""
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  }

  return (
    <div className="bg-white-1 rounded-xl shadow-lg border border-white-2-5 p-4 min-w-[220px]">
      {Array.from(groups.entries()).map(([group, groupItems]) => (
        <div key={group || "default"}>
          {group && (
            <div className="text-xs font-semibold text-black-3 uppercase tracking-wider px-3 pt-2 pb-1">
              {group}
            </div>
          )}
          {groupItems.map((item) => (
            <Link
              key={item.id}
              href={item.href || "/"}
              onClick={onClose}
              className="block px-3 py-2 rounded-lg text-sm text-black-2 hover:bg-white-1-5 hover:text-black-1 transition-colors"
              {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <span className="font-medium">{item.label}</span>
              {item.description && (
                <span className="block text-xs text-black-3 mt-0.5">
                  {item.description}
                </span>
              )}
            </Link>
          ))}
        </div>
      ))}
    </div>
  )
}

function MobileDrawer({
  items,
  siteName,
  onClose,
}: {
  items: MenuItemData[]
  siteName: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* Drawer */}
      <div className="absolute top-0 right-0 bottom-0 w-[300px] bg-white-1 overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-white-2-5">
          <span className="text-lg font-bold text-black-1">{siteName}</span>
          <button onClick={onClose} className="p-2 text-black-2" aria-label="Close menu">
            <X className="size-6" />
          </button>
        </div>
        <nav className="p-4 flex flex-col gap-1">
          {items.map((item) => (
            <MobileMenuItem key={item.id} item={item} onClose={onClose} />
          ))}
        </nav>
      </div>
    </div>
  )
}

function MobileMenuItem({
  item,
  onClose,
}: {
  item: MenuItemData
  onClose: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = item.children.length > 0

  if (!hasChildren) {
    return (
      <Link
        href={item.href || "/"}
        onClick={onClose}
        className="block px-3 py-2.5 text-sm font-medium text-black-1 rounded-lg hover:bg-white-1-5"
      >
        {item.label}
      </Link>
    )
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-black-1 rounded-lg hover:bg-white-1-5"
      >
        {item.label}
        <ChevronDown
          className={cn(
            "size-4 transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </button>
      {expanded && (
        <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-white-2-5 pl-3">
          {item.children.map((child) => (
            <Link
              key={child.id}
              href={child.href || "/"}
              onClick={onClose}
              className="block px-3 py-2 text-sm text-black-2 rounded-lg hover:bg-white-1-5"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
