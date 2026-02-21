/*
 * CMS SETTINGS:
 * - label: string — button text
 * - href: string — link destination
 * - visible: boolean — show/hide toggle
 * - variant: 'primary' | 'secondary' — filled or outline style
 * Auto-resolves colors from SectionThemeContext (dark bg → white fill, light bg → dark fill)
 */
"use client";

import { useResolvedTheme } from "@/lib/theme";
import type { SectionTheme } from "@/lib/theme";
import type { CTAButtonProps } from "@/lib/types/shared";
import { cn } from "@/lib/utils";
import Link from "next/link";

const sizeClasses: Record<string, string> = {
  default: "px-8 py-5 text-button-1",
  small: "px-6 py-3 text-button-2",
  nav: "px-7 py-3.5 text-button-1",
  full: "w-full py-5 text-button-1",
};

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
  const tokens = useResolvedTheme(theme);

  const base = cn(
    "group/btn inline-flex items-center justify-center",
    variant === "campus" ? "rounded-lg" : "rounded-full",
    "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
    "hover:scale-[1.03] active:scale-[0.97]",
  );

  const sizeClass = variant === "campus"
    ? "px-4 py-3 text-button-1 gap-3"
    : (sizeClasses[size] ?? sizeClasses.default);

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
          );

  const classes = cn(base, sizeClass, variantClass, className);

  const iconWrapped = icon ? (
    <span className="inline-flex transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:translate-x-0.5 group-hover/btn:rotate-[-12deg]">
      {icon}
    </span>
  ) : null;

  // Anchor links: smooth scroll instead of navigation
  if (href && href.startsWith("#")) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          const target = document.getElementById(href.slice(1));
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
        className={classes}
      >
        {label}
        {iconWrapped}
      </button>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        onClick={onClick}
        target={target}
        rel={rel}
      >
        {label}
        {iconWrapped}
      </Link>
    );
  }

  return (
    <button onClick={onClick} type={type} className={classes}>
      {label}
      {iconWrapped}
    </button>
  );
}
