/*
 * CMS SETTINGS:
 * ── Logo (BASIC) ──
 *   logo.lightSrc: string — white/inverted logo for hero overlay
 *   logo.darkSrc: string — colored logo for scrolled state
 *   logo.alt: string
 * ── CTA (BASIC) ──
 *   ctaButton: { label, href, visible }
 *   memberLogin: { label, href, visible }
 * ── Layout (ADVANCED) ──
 *   visible, colorScheme
 *
 * DB SCHEMA: navbar_settings (id, logo_light_url, logo_dark_url, logo_alt,
 *   cta_label, cta_href, cta_visible, member_login_label, member_login_href,
 *   member_login_visible, visible)
 */
"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useNavbarScroll } from "@/hooks/useNavbarScroll";
import { dropdowns, directLinks } from "./nav-data";
import { IconHamburger } from "./icons";
import DropdownMenu from "./DropdownMenu";
import MobileMenu from "./MobileMenu";
import CTAButton from "@/components/shared/CTAButton";
import type { NavbarSettings } from "@/lib/types/sections";
import { cn } from "@/lib/utils";

export default function Navbar({ settings }: { settings: NavbarSettings }) {
  const isScrolled = useNavbarScroll();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openDropdown = useCallback((id: string) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setActiveDropdown(id);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  }, []);

  const closeDropdown = useCallback(() => {
    setActiveDropdown(null);
  }, []);

  const openMobileMenu = useCallback(() => setMobileMenuOpen(true), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  if (!settings.visible) return null;

  const { content } = settings;
  return (
    <>
      <header
        className={cn(
          "sticky top-0 left-0 right-0 z-50 transition-all duration-300 ease-smooth relative overflow-y-visible",
          isScrolled
            ? "bg-white-1 border-b border-white-2-5 shadow-[0px_12px_20px_0px_rgba(0,0,0,0.03)]"
            : "",
        )}
      >
        {/* Top gradient overlay when over hero — darkens area so nav text is readable */}
        {!isScrolled && (
          <div
            className="absolute inset-x-0 top-0 z-0 h-[200px] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.2) 60%, transparent 100%)",
            }}
          />
        )}
        <div
          className={cn(
            "container-nav relative z-10 flex items-center justify-between transition-[padding] duration-300 ease-smooth py-1.5",
          )}
        >
          {/* Logo */}
          <Link href="/" className="relative shrink-0">
            {isScrolled ? (
              <Image
                src={content.logo.darkSrc}
                alt={content.logo.alt}
                width={57}
                height={48}
                unoptimized
                className="object-contain"
              />
            ) : (
              <Image
                src={content.logo.lightSrc}
                alt={content.logo.alt}
                width={57}
                height={48}
                unoptimized
                className="brightness-0 invert"
              />
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-5">
            {dropdowns.map((dropdown) => (
              <div
                key={dropdown.id}
                className="relative"
                onMouseEnter={() => openDropdown(dropdown.id)}
                onMouseLeave={scheduleClose}
              >
                {dropdown.href ? (
                  <Link
                    href={dropdown.href}
                    className={cn(
                      "flex items-center gap-1.5 pl-3 pr-2 py-3 rounded-xl text-nav transition-colors duration-150",
                      isScrolled
                        ? cn(
                            "text-black-1",
                            activeDropdown === dropdown.id
                              ? "bg-white-1-5"
                              : "hover:bg-white-1-5",
                          )
                        : cn(
                            "text-white-1",
                            activeDropdown === dropdown.id
                              ? "bg-white-0/10"
                              : "hover:bg-white-0/10",
                          ),
                    )}
                  >
                    {dropdown.label}
                    <ChevronDown
                      className={cn(
                        "size-[18px] transition-transform duration-200",
                        activeDropdown === dropdown.id && "rotate-180",
                      )}
                      strokeWidth={2}
                    />
                  </Link>
                ) : (
                  <button
                    onClick={() =>
                      setActiveDropdown((prev) =>
                        prev === dropdown.id ? null : dropdown.id,
                      )
                    }
                    className={cn(
                      "flex items-center gap-1.5 pl-3 pr-2 py-3 rounded-xl text-nav transition-colors duration-150",
                      isScrolled
                        ? cn(
                            "text-black-1",
                            activeDropdown === dropdown.id
                              ? "bg-white-1-5"
                              : "hover:bg-white-1-5",
                          )
                        : cn(
                            "text-white-1",
                            activeDropdown === dropdown.id
                              ? "bg-white-0/10"
                              : "hover:bg-white-0/10",
                          ),
                    )}
                  >
                    {dropdown.label}
                    <ChevronDown
                      className={cn(
                        "size-[18px] transition-transform duration-200",
                        activeDropdown === dropdown.id && "rotate-180",
                      )}
                      strokeWidth={2}
                    />
                  </button>
                )}
                {activeDropdown === dropdown.id && (
                  <div
                    className="absolute top-full left-1/2 z-[100] pt-1"
                    style={{ transform: `translateX(${dropdown.offsetX ?? "-50%"})` }}
                  >
                    <DropdownMenu
                      dropdown={dropdown}
                      onClose={closeDropdown}
                    />
                  </div>
                )}
              </div>
            ))}
            {directLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "pl-3 pr-2 py-4 rounded-xl text-nav transition-colors duration-150",
                  isScrolled
                    ? "text-black-1 hover:bg-white-1-5"
                    : "text-white-1 hover:bg-white-0/10",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop right side */}
          <div className="hidden lg:flex items-center gap-3">
            {content.memberLogin.visible && (
              <Link
                href={content.memberLogin.href}
                className={cn(
                  "text-nav px-2 py-4 transition-opacity hover:opacity-80",
                  isScrolled ? "text-black-1" : "text-white-1",
                )}
              >
                {content.memberLogin.label}
              </Link>
            )}
            {content.ctaButton.visible && (
              <CTAButton
                label={content.ctaButton.label}
                href={content.ctaButton.href}
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
      <MobileMenu isOpen={mobileMenuOpen} onClose={closeMobileMenu} />
    </>
  );
}
