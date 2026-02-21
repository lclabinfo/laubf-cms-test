/*
 * CMS SETTINGS:
 * ── Content (BASIC) ──
 *   title: string — panel heading (default: "Quick Links")
 *   links[]: array of quick link items
 *     links[].label: string — display name (e.g. "Daily Bread")
 *     links[].href: string — external URL (Zoom, YouTube, etc.)
 *     links[].icon: string — lucide icon name ("book-open", "users", "radio")
 *     links[].description: string — schedule info (e.g. "Mon–Sat 6 AM")
 * ── Layout (BASIC) ──
 *   visible: boolean — show/hide the FAB globally
 *
 * BUILDER / PAGE-BUILDER:
 *   This component renders as a fixed-position overlay outside the page flow.
 *   It can be toggled on/off per-site via the `visible` prop without affecting
 *   any page layout. Links array is fully dynamic — add, remove, or reorder
 *   items from the CMS. Icon names map to lucide-react icons at render time.
 *
 * HEADLESS CMS (Sanity / Strapi / Payload):
 *   Model: quick_links_fab_settings
 *   Fields: visible (boolean), title (string, default "Quick Links"),
 *           links (array of { label: string, href: url, icon: string, description: string })
 *   Fetch in layout.tsx via server component and pass as `settings` prop.
 *
 * DB SCHEMA: quick_links_fab_settings (id, visible, title,
 *   links JSON[{label, href, icon, description}])
 */
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  BookOpen,
  Users,
  Radio,
  Church,
  Video,
  Music,
  Heart,
  HandHeart,
  ArrowUp,
  Link as LinkIcon,
  X,
  SquareArrowOutUpRight,
  type LucideIcon,
} from "lucide-react";
import type { QuickLinksFABSettings } from "@/lib/types/sections";
import { cn } from "@/lib/utils";

/* ── Icon registry: maps CMS icon name strings → lucide components ── */
const ICON_MAP: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  users: Users,
  radio: Radio,
  church: Church,
  video: Video,
  music: Music,
  heart: Heart,
  "hand-heart": HandHeart,
};

const FALLBACK_ICON = BookOpen;

/** Shared crossfade transition base for the FAB icon swap */
const CROSSFADE_BASE = "size-[22px] absolute transition-all duration-300 ease-smooth";

export default function QuickLinksFAB({
  settings,
}: {
  settings: QuickLinksFABSettings;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Track scroll position on mobile — show scroll-to-top after 300px
  useEffect(() => {
    if (!isMobile) {
      setShowScrollTop(false);
      return;
    }
    const handleScroll = () => {
      const scrolled = window.scrollY > 300;
      setShowScrollTop(scrolled);
      if (scrolled) setIsOpen(false);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile]);

  // Close on Escape (project convention — MobileMenu, VideoModal)
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  // Close on outside click (mobile only)
  useEffect(() => {
    if (!isMobile || !isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isMobile, isOpen]);

  const handleToggle = useCallback(() => {
    if (isMobile && showScrollTop) {
      setIsOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (isMobile) setIsOpen((prev) => !prev);
  }, [isMobile, showScrollTop]);

  const handleMouseEnter = useCallback(() => {
    if (!isMobile) setIsOpen(true);
  }, [isMobile]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) setIsOpen(false);
  }, [isMobile]);

  if (!settings.visible) return null;

  const { title, links } = settings.content;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 right-4 lg:bottom-8 lg:right-8 z-40 flex flex-col items-end gap-3"
      onMouseLeave={handleMouseLeave}
    >
      {/* Expanded link list */}
      <div
        className={cn(
          "flex flex-col gap-1.5 origin-bottom-right transition-all duration-300 ease-smooth",
          isOpen
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-2 scale-95 pointer-events-none",
        )}
      >
        <div className="bg-white-1 border border-white-2-5 rounded-2xl shadow-[0px_12px_24px_0px_rgba(0,0,0,0.08),0px_4px_8px_0px_rgba(0,0,0,0.04)] p-2 min-w-[240px]">
          {/* Section title — matches DropdownMenu section title */}
          <p className="px-3 pt-2 pb-1.5 text-base font-medium leading-[1.2] text-black-3 tracking-[-0.03em]">
            {title}
          </p>

          {links.map((link) => {
            const Icon = ICON_MAP[link.icon] ?? FALLBACK_ICON;
            return (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors duration-150 hover:bg-white-1-5 group"
              >
                <div className="flex items-center justify-center size-9 rounded-lg bg-white-1-5 border border-white-2 transition-colors duration-150 group-hover:bg-white-2 shrink-0">
                  <Icon
                    className="size-[18px] text-black-2"
                    strokeWidth={1.75}
                  />
                </div>
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  {/* Label — matches DropdownMenu item label */}
                  <span className="text-base font-medium leading-tight text-black-1 tracking-[-0.03em]">
                    {link.label}
                  </span>
                  {/* Description — matches DropdownMenu item description */}
                  <span className="text-sm font-normal leading-none text-black-3 tracking-[-0.03em] line-clamp-1">
                    {link.description}
                  </span>
                </div>
                {/* External arrow — matches DropdownMenu, hidden until hover */}
                <SquareArrowOutUpRight
                  className="size-[18px] text-black-3 shrink-0 ml-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  strokeWidth={1.5}
                />
              </a>
            );
          })}
        </div>
      </div>

      {/* FAB trigger */}
      <button
        onClick={handleToggle}
        onMouseEnter={handleMouseEnter}
        aria-label={
          isMobile && showScrollTop
            ? "Scroll to top"
            : isOpen
              ? "Close quick links"
              : "Open quick links"
        }
        aria-expanded={isMobile && showScrollTop ? undefined : isOpen}
        className={cn(
          "relative flex items-center justify-center size-14 rounded-full transition-all duration-300 ease-smooth",
          "bg-black-1 text-white-1",
          "shadow-[0px_10px_15px_var(--color-brand-shadow),0px_4px_6px_var(--color-brand-shadow)]",
          "hover:shadow-[0px_14px_20px_var(--color-brand-shadow),0px_6px_10px_var(--color-brand-shadow)]",
          "active:scale-95",
        )}
      >
        {/* Arrow-up icon (mobile scroll-to-top) */}
        <ArrowUp
          className={cn(
            CROSSFADE_BASE,
            isMobile && showScrollTop
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 rotate-180 scale-75",
          )}
          strokeWidth={2}
        />
        {/* Link icon (default state) */}
        <LinkIcon
          className={cn(
            CROSSFADE_BASE,
            !isMobile || !showScrollTop
              ? isOpen
                ? "opacity-0 rotate-90 scale-75"
                : "opacity-100 rotate-0 scale-100"
              : "opacity-0 rotate-90 scale-75",
          )}
          strokeWidth={2}
        />
        {/* X icon (panel open state) */}
        <X
          className={cn(
            CROSSFADE_BASE,
            !isMobile || !showScrollTop
              ? isOpen
                ? "opacity-100 rotate-0 scale-100"
                : "opacity-0 -rotate-90 scale-75"
              : "opacity-0 -rotate-90 scale-75",
          )}
          strokeWidth={2}
        />
      </button>
    </div>
  );
}
