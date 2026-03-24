/*
 * CMS SETTINGS:
 * - label: string -- button text
 * - href: string -- link destination
 * - visible: boolean -- show/hide toggle
 * - variant: 'primary' | 'secondary' -- filled or outline style
 * Auto-resolves colors from SectionThemeContext (dark bg -> white fill, light bg -> dark fill)
 */
"use client"

import { useMemo } from "react"
import { useResolvedTheme, type SectionTheme } from "./theme-context"
import { cn } from "@/lib/utils"
import { resolveHref } from "@/lib/website/resolve-href"
import Link from "next/link"

const sizeClasses: Record<string, string> = {
  default: "px-8 py-5 text-button-1",
  small: "px-6 py-3 text-button-2",
  nav: "px-7 py-3.5 text-button-1",
  full: "w-full py-5 text-button-1",
}

interface CTAButtonProps {
  label: string
  href?: string
  onClick?: (e: React.MouseEvent) => void
  variant?: "primary" | "secondary" | "campus"
  size?: "default" | "small" | "nav" | "full"
  theme?: SectionTheme
  className?: string
  icon?: React.ReactNode
  type?: "button" | "submit" | "reset"
  target?: string
  rel?: string
}

export default function CTAButton({
  label,
  href,
  onClick,
  variant = "primary",
  size = "default",
  theme,
  className,
  icon,
  type,
  target,
  rel,
}: CTAButtonProps) {
  const tokens = useResolvedTheme(theme)

  // Dynamically replace hardcoded ?month=N or &month=N with the current month
  const resolvedMonthHref = useMemo(() => {
    if (!href) return href
    return href.replace(/([?&])month=\d+/, (_match, sep) => `${sep}month=${new Date().getMonth() + 1}`)
  }, [href])

  const base = cn(
    "group/btn inline-flex items-center justify-center",
    variant === "campus" ? "rounded-lg" : "rounded-full",
    "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
    "hover:scale-[1.03] active:scale-[0.97]",
  )

  const sizeClass = variant === "campus"
    ? "px-4 py-3 text-button-1 gap-3"
    : (sizeClasses[size] ?? sizeClasses.default)

  const variantClass =
    variant === "campus"
      ? "bg-white-2 text-black-2 hover:bg-white-2-5"
      : variant === "primary"
        ? cn(
            tokens.btnPrimaryBg,
            tokens.btnPrimaryText,
            "hover:brightness-[1.15]",
          )
        : cn(
            "bg-transparent border",
            tokens.btnOutlineBorder,
            tokens.btnOutlineText,
            "hover:bg-current/[0.06]",
          )

  const classes = cn(base, sizeClass, variantClass, className)

  const iconWrapped = icon ? (
    <span className="inline-flex transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:translate-x-0.5 group-hover/btn:rotate-[-12deg]">
      {icon}
    </span>
  ) : null

  // Anchor links (same-page): smooth scroll to target section
  if (resolvedMonthHref && resolvedMonthHref.startsWith("#")) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault()
          const el = document.getElementById(resolvedMonthHref.slice(1))
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        }}
        className={classes}
      >
        {label}
        {iconWrapped}
      </button>
    )
  }

  // Cross-page anchor links (e.g., /im-new#plan-visit): navigate or smooth-scroll if already on that page
  if (resolvedMonthHref && resolvedMonthHref.includes("#") && !resolvedMonthHref.startsWith("http")) {
    const [pagePath, anchor] = resolvedMonthHref.split("#")
    const resolvedPagePath = resolveHref(pagePath)
    const fullHref = `${resolvedPagePath}#${anchor}`

    return (
      <a
        href={fullHref}
        className={classes}
        onClick={(e) => {
          // If already on the target page, prevent navigation and smooth-scroll instead
          if (typeof window !== "undefined" && window.location.pathname === resolvedPagePath) {
            e.preventDefault()
            const el = document.getElementById(anchor)
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          }
          // Otherwise, let the browser handle full navigation + anchor scroll natively
        }}
        target={target}
        rel={rel}
      >
        {label}
        {iconWrapped}
      </a>
    )
  }

  if (resolvedMonthHref) {
    const resolved = resolveHref(resolvedMonthHref)
    return (
      <Link
        href={resolved}
        className={classes}
        onClick={onClick}
        target={target}
        rel={rel}
      >
        {label}
        {iconWrapped}
      </Link>
    )
  }

  return (
    <button onClick={onClick} type={type} className={classes}>
      {label}
      {iconWrapped}
    </button>
  )
}
