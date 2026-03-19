"use client"

import { useState, useCallback, useRef, useEffect, useLayoutEffect, type RefObject } from "react"
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
  /** Scroll behavior: "transparent-to-solid" (default), "always-solid", or "always-transparent" */
  scrollBehavior?: string | null
  /** Background color when solid: "white" (default) or a custom color */
  solidColor?: string | null
  /** Whether the navbar is sticky (default true) */
  sticky?: boolean
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

/* ── Shared dropdown panel ── */

/**
 * Single persistent dropdown container that morphs between nav items.
 * Instead of mounting/unmounting separate dropdowns, this keeps one container
 * alive and transitions its position, size, and content.
 */
function SharedDropdownPanel({
  items,
  activeId,
  triggerRefs,
  navRef,
  onClose,
  onHoverIn,
  onHoverOut,
}: {
  items: MenuItemData[]
  activeId: string | null
  triggerRefs: RefObject<Map<string, HTMLDivElement>>
  navRef: RefObject<HTMLElement | null>
  onClose: () => void
  onHoverIn: () => void
  onHoverOut: () => void
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [leftPos, setLeftPos] = useState(0)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [isOpen, setIsOpen] = useState(false)
  const [hasEverOpened, setHasEverOpened] = useState(false)
  const [displayedId, setDisplayedId] = useState<string | null>(null)
  const prevActiveId = useRef<string | null>(null)
  const itemOrder = useRef<string[]>([])
  // Skip position/size transition on very first open
  const isFirstOpen = useRef(true)

  useEffect(() => {
    itemOrder.current = items.map((i) => i.id)
  }, [items])

  const getDirection = useCallback(
    (from: string | null, to: string | null): "left" | "right" | "none" => {
      if (!from || !to) return "none"
      const order = itemOrder.current
      const fromIdx = order.indexOf(from)
      const toIdx = order.indexOf(to)
      if (fromIdx === -1 || toIdx === -1) return "none"
      return toIdx > fromIdx ? "right" : "left"
    },
    [],
  )

  const [slideDir, setSlideDir] = useState<"left" | "right" | "none">("none")

  useEffect(() => {
    if (activeId) {
      setIsOpen(true)
      setHasEverOpened(true)
      setSlideDir(getDirection(prevActiveId.current, activeId))
      setDisplayedId(activeId)
    } else {
      setIsOpen(false)
    }
    prevActiveId.current = activeId
  }, [activeId, getDirection])

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setDisplayedId(null)
        setHasEverOpened(false)
        isFirstOpen.current = true
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Measure content and calculate position after each content swap
  useLayoutEffect(() => {
    if (!displayedId) return

    const trigger = triggerRefs.current.get(displayedId)
    const nav = navRef.current
    const content = contentRef.current
    if (!trigger || !nav || !content) return

    // Measure content at its natural size (w-max makes it unconstrained)
    const contentWidth = content.offsetWidth
    const contentHeight = content.offsetHeight

    const triggerRect = trigger.getBoundingClientRect()
    const navRect = nav.getBoundingClientRect()
    const headerRect = content.closest("header")?.getBoundingClientRect()
    const headerLeft = headerRect?.left ?? 0
    const triggerCenter = triggerRect.left + triggerRect.width / 2
    const navCenter = navRect.left + navRect.width / 2
    const viewportWidth = window.innerWidth
    const margin = 16

    // Bias towards nav center
    const pullStrength = 0.7
    const maxShiftPx = 200
    const rawShift = (navCenter - triggerCenter) * pullStrength
    const cappedShift = Math.max(-maxShiftPx, Math.min(maxShiftPx, rawShift))
    const adjustedCenter = triggerCenter + cappedShift

    let left = adjustedCenter - contentWidth / 2
    if (left < margin) left = margin
    if (left + contentWidth > viewportWidth - margin) {
      left = viewportWidth - margin - contentWidth
    }

    setLeftPos(left - headerLeft)
    setSize({ width: contentWidth, height: contentHeight })

    // After first position is set, enable transitions for subsequent changes
    if (isFirstOpen.current) {
      // Force a reflow so the initial position is applied without transition
      content.getBoundingClientRect()
      requestAnimationFrame(() => {
        isFirstOpen.current = false
      })
    }
  }, [displayedId, triggerRefs, navRef])

  const activeItem = items.find((i) => i.id === displayedId)

  if (!hasEverOpened) return null

  const easing = "cubic-bezier(0.16, 1, 0.3, 1)"
  const shouldTransition = !isFirstOpen.current

  return (
    <div
      className={cn(
        "absolute z-[100] pt-1",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
      style={{
        top: "100%",
        left: leftPos,
        opacity: isOpen ? 1 : 0,
        transition: shouldTransition
          ? `left 300ms ${easing}, opacity 200ms ease`
          : "opacity 200ms ease",
      }}
      onMouseEnter={onHoverIn}
      onMouseLeave={onHoverOut}
    >
      {/* Shell: animates width + height, clips content during transition */}
      <div
        className="overflow-hidden rounded-xl bg-white-1 border border-white-2 shadow-[0px_12px_20px_0px_rgba(0,0,0,0.03)]"
        style={{
          width: size.width || "auto",
          height: size.height || "auto",
          transition: shouldTransition
            ? `width 300ms ${easing}, height 300ms ${easing}`
            : "none",
        }}
      >
        {/* Content renders at natural size (w-max), measured by useLayoutEffect */}
        <div ref={contentRef} className="w-max">
          {activeItem && (
            <div
              key={displayedId}
              className={cn(
                "animate-in fade-in duration-150",
                slideDir === "right" && "slide-in-from-right-2",
                slideDir === "left" && "slide-in-from-left-2",
              )}
            >
              <DropdownContent item={activeItem} onClose={onClose} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Dropdown content without the outer container styling (no border/shadow/rounded).
 * The SharedDropdownPanel provides the container shell.
 */
function DropdownContent({ item, onClose }: { item: MenuItemData; onClose: () => void }) {
  return <DropdownMenu item={item} onClose={onClose} bare />
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
  scrollBehavior = "transparent-to-solid",
  solidColor,
  sticky = true,
}: WebsiteNavbarProps) {
  const scrolledFromHero = useNavbarScroll()
  // Derive the effective "isScrolled" state based on the scroll behavior setting
  const isScrolled =
    scrollBehavior === "always-solid"
      ? true
      : scrollBehavior === "always-transparent"
        ? false
        : scrolledFromHero
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const navRef = useRef<HTMLElement>(null)

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const openDropdown = useCallback(
    (id: string) => {
      cancelClose()
      setActiveDropdown(id)
    },
    [cancelClose],
  )

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

  // Register trigger ref
  const setTriggerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      triggerRefs.current.set(id, el)
    } else {
      triggerRefs.current.delete(id)
    }
  }, [])

  return (
    <>
      <header
        className={cn(
          "left-0 right-0 z-50 transition-all duration-300 ease-smooth overflow-y-visible",
          sticky ? "sticky top-0" : "relative",
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
          <nav ref={navRef} className="hidden lg:flex items-center">
            {dropdownItems.map((item) => {
              const isActive = activeDropdown === item.id
              const triggerClasses = cn(
                "flex items-center gap-1.5 px-5 py-3 rounded-xl text-nav transition-colors duration-150",
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
                  key={item.id}
                  ref={(el) => setTriggerRef(item.id, el)}
                  onMouseEnter={() => openDropdown(item.id)}
                  onMouseLeave={scheduleClose}
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
                    <button
                      onClick={() =>
                        setActiveDropdown((prev) =>
                          prev === item.id ? null : item.id,
                        )
                      }
                      className={triggerClasses}
                    >
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
                </div>
              )
            })}
            {directItems.map((item) => (
              <Link
                key={item.id}
                href={resolveHref(item.href)}
                className={cn(
                  "px-5 py-4 rounded-xl text-nav transition-colors duration-150",
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

        {/* Shared dropdown panel — single container that morphs between items */}
        <SharedDropdownPanel
          items={dropdownItems}
          activeId={activeDropdown}
          triggerRefs={triggerRefs}
          navRef={navRef}
          onClose={closeDropdown}
          onHoverIn={cancelClose}
          onHoverOut={scheduleClose}
        />
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
