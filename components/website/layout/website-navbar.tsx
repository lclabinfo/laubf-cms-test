"use client"

import { useState, useCallback, useRef, useEffect, type RefObject } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { resolveHref } from "@/lib/website/resolve-href"
import { IconHamburger } from "@/components/website/shared/icons"
import DropdownMenu from "./dropdown-menu"
import MobileMenu from "./mobile-menu"
import CTAButton from "@/components/website/shared/cta-button"
import type { MenuItemData } from "./dropdown-menu"
import type { Prisma } from "@/lib/generated/prisma/client"

/* ── Props ── */

type MenuWithItems = Prisma.MenuGetPayload<{
  include: {
    items: {
      include: { children: true }
    }
  }
}>

interface WebsiteNavbarProps {
  menu: MenuWithItems | null
  logoUrl: string | null
  logoDarkUrl?: string | null
  logoAlt: string | null
  siteName: string
  ctaLabel?: string | null
  ctaHref?: string | null
  ctaVisible?: boolean
  memberLoginLabel?: string | null
  memberLoginHref?: string | null
  memberLoginVisible?: boolean
}

/* ── Scroll hook (hero-aware) ── */

function useNavbarScroll() {
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      const heroEl = document.getElementById("hero-section")
      if (!heroEl) {
        setIsScrolled(true)
        return
      }
      const rect = heroEl.getBoundingClientRect()
      const heroHeight = rect.height
      const visibleHeight =
        Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)
      const visibilityRatio = Math.max(0, visibleHeight / heroHeight)
      setIsScrolled(visibilityRatio < 0.97)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [pathname])

  return isScrolled
}

/* ── Dropdown trigger with auto-clamped positioning ── */

function NavDropdownTrigger({
  item,
  isScrolled,
  isActive,
  onOpen,
  onToggle,
  onMouseLeave,
  onClose,
}: {
  item: MenuItemData
  isScrolled: boolean
  isActive: boolean
  onOpen: () => void
  onToggle: () => void
  onMouseLeave: () => void
  onClose: () => void
}) {
  const triggerRef = useRef<HTMLDivElement>(null)

  const triggerClasses = cn(
    "flex items-center gap-1.5 pl-3 pr-2 py-3 rounded-xl text-nav transition-colors duration-150",
    isScrolled
      ? cn(
          "text-black-1",
          isActive ? "bg-white-1-5" : "hover:bg-white-1-5",
        )
      : cn(
          "text-white-1",
          isActive ? "bg-white-0/10" : "hover:bg-white-0/10",
        ),
  )

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onMouseLeave}
    >
      {item.href ? (
        <Link href={resolveHref(item.href)} className={triggerClasses}>
          {item.label}
          <ChevronDown
            className={cn(
              "size-[18px] transition-transform duration-200",
              isActive && "rotate-180",
            )}
            strokeWidth={2}
          />
        </Link>
      ) : (
        <button onClick={onToggle} className={triggerClasses}>
          {item.label}
          <ChevronDown
            className={cn(
              "size-[18px] transition-transform duration-200",
              isActive && "rotate-180",
            )}
            strokeWidth={2}
          />
        </button>
      )}
      {isActive && (
        <AutoClampedDropdown triggerRef={triggerRef}>
          <DropdownMenu item={item} onClose={onClose} />
        </AutoClampedDropdown>
      )}
    </div>
  )
}

/* ── Auto-clamped dropdown wrapper ── */

function AutoClampedDropdown({
  triggerRef,
  children,
}: {
  triggerRef: RefObject<HTMLDivElement | null>
  children: React.ReactNode
}) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [offsetX, setOffsetX] = useState("-50%")

  useEffect(() => {
    const trigger = triggerRef.current
    const dropdown = dropdownRef.current
    if (!trigger || !dropdown) return

    const triggerRect = trigger.getBoundingClientRect()
    const dropdownWidth = dropdown.offsetWidth
    const triggerCenter = triggerRect.left + triggerRect.width / 2
    const viewportWidth = window.innerWidth

    // Where the dropdown left edge would be if centered
    const idealLeft = triggerCenter - dropdownWidth / 2
    const idealRight = triggerCenter + dropdownWidth / 2
    const margin = 16 // min distance from viewport edge

    if (idealLeft < margin) {
      // Would overflow left — shift right
      const shift = triggerCenter - margin
      const pct = (shift / dropdownWidth) * 100
      setOffsetX(`-${Math.max(0, pct).toFixed(1)}%`)
    } else if (idealRight > viewportWidth - margin) {
      // Would overflow right — shift left
      const shift = viewportWidth - margin - triggerCenter
      const pct = 100 - (shift / dropdownWidth) * 100
      setOffsetX(`-${Math.min(100, pct).toFixed(1)}%`)
    } else {
      setOffsetX("-50%")
    }
  }, [triggerRef])

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-1/2 z-[100] pt-1"
      style={{ transform: `translateX(${offsetX})` }}
    >
      {children}
    </div>
  )
}

/* ── Navbar ── */

export function WebsiteNavbar({
  menu,
  logoUrl,
  logoDarkUrl,
  logoAlt,
  siteName,
  ctaLabel = "I\u2019m new",
  ctaHref = "/im-new",
  ctaVisible = true,
  memberLoginLabel = "Member Login",
  memberLoginHref = "/member-login",
  memberLoginVisible = false,
}: WebsiteNavbarProps) {
  const isScrolled = useNavbarScroll()
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openDropdown = useCallback((id: string) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setActiveDropdown(id)
  }, [])

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => {
      setActiveDropdown(null)
    }, 150)
  }, [])

  const closeDropdown = useCallback(() => {
    setActiveDropdown(null)
  }, [])

  const openMobileMenu = useCallback(() => setMobileMenuOpen(true), [])
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), [])

  const allItems: MenuItemData[] = (menu?.items ?? []).filter(
    (item) => item.isVisible,
  ) as MenuItemData[]

  // Separate items with children (dropdown triggers) from direct links
  const dropdownItems = allItems.filter((item) => item.children.length > 0)
  const directItems = allItems.filter((item) => item.children.length === 0)

  // Determine which logo to show
  const lightLogo = logoUrl // Used over hero (with brightness-0 invert)
  const darkLogo = logoDarkUrl || logoUrl // Used when scrolled

  return (
    <>
      <header
        className={cn(
          "sticky top-0 left-0 right-0 z-50 transition-all duration-300 ease-smooth overflow-y-visible",
          isScrolled
            ? "bg-white-1 border-b border-white-2-5 shadow-[0px_12px_20px_0px_rgba(0,0,0,0.03)]"
            : "",
        )}
      >
        {/* Top gradient overlay when over hero */}
        {!isScrolled && (
          <div
            className="absolute inset-x-0 top-0 z-0 h-[200px] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.2) 60%, transparent 100%)",
            }}
          />
        )}

        <div className="container-nav relative z-10 flex items-center justify-between transition-[padding] duration-300 ease-smooth py-1.5">
          {/* Logo */}
          <Link href={resolveHref("/")} className="relative shrink-0">
            {lightLogo ? (
              isScrolled ? (
                <Image
                  src={darkLogo!}
                  alt={logoAlt || siteName}
                  width={57}
                  height={48}
                  unoptimized
                  className="object-contain"
                />
              ) : (
                <Image
                  src={lightLogo}
                  alt={logoAlt || siteName}
                  width={57}
                  height={48}
                  unoptimized
                  className="brightness-0 invert"
                />
              )
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
          <nav className="hidden lg:flex items-center gap-5">
            {dropdownItems.map((item) => (
              <NavDropdownTrigger
                key={item.id}
                item={item}
                isScrolled={isScrolled}
                isActive={activeDropdown === item.id}
                onOpen={() => openDropdown(item.id)}
                onToggle={() =>
                  setActiveDropdown((prev) =>
                    prev === item.id ? null : item.id,
                  )
                }
                onMouseLeave={scheduleClose}
                onClose={closeDropdown}
              />
            ))}
            {directItems.map((item) => (
              <Link
                key={item.id}
                href={resolveHref(item.href)}
                className={cn(
                  "pl-3 pr-2 py-4 rounded-xl text-nav transition-colors duration-150",
                  isScrolled
                    ? "text-black-1 hover:bg-white-1-5"
                    : "text-white-1 hover:bg-white-0/10",
                )}
                {...(item.isExternal || item.openInNewTab
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop right side */}
          <div className="hidden lg:flex items-center gap-3">
            {memberLoginVisible && memberLoginHref && (
              <Link
                href={resolveHref(memberLoginHref)}
                className={cn(
                  "text-nav px-2 py-4 transition-opacity hover:opacity-80",
                  isScrolled ? "text-black-1" : "text-white-1",
                )}
              >
                {memberLoginLabel}
              </Link>
            )}
            {ctaVisible && ctaLabel && ctaHref && (
              <CTAButton
                label={ctaLabel}
                href={ctaHref}
                variant="primary"
                size="nav"
                theme={isScrolled ? "light" : "dark"}
              />
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={openMobileMenu}
            className={cn(
              "lg:hidden p-2",
              isScrolled ? "text-black-1" : "text-white-1",
            )}
            aria-label="Open menu"
          >
            <IconHamburger width={28} height={28} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={closeMobileMenu}
        items={allItems}
        logoUrl={darkLogo || null}
        logoAlt={logoAlt}
        siteName={siteName}
        ctaLabel={ctaVisible && ctaLabel ? ctaLabel : undefined}
        ctaHref={ctaVisible && ctaHref ? ctaHref : undefined}
      />
    </>
  )
}
