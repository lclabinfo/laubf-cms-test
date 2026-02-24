"use client"

import { useScrollReveal, staggerDelay } from "./use-scroll-reveal"
import { cn } from "@/lib/utils"

export type AnimationVariant =
  | "fade-up"
  | "fade-in"
  | "fade-left"
  | "fade-right"
  | "scale-up"
  | "none"

interface AnimateOnScrollProps {
  children: React.ReactNode
  animation?: AnimationVariant
  className?: string
  staggerIndex?: number
  staggerBaseMs?: number
  threshold?: number
  enabled?: boolean
  as?: keyof React.JSX.IntrinsicElements
}

const hiddenClasses: Record<AnimationVariant, string> = {
  "fade-up": "opacity-0 translate-y-6",
  "fade-in": "opacity-0",
  "fade-left": "opacity-0 -translate-x-6",
  "fade-right": "opacity-0 translate-x-6",
  "scale-up": "opacity-0 scale-[0.95]",
  none: "",
}

const visibleClasses: Record<AnimationVariant, string> = {
  "fade-up": "opacity-100 translate-y-0",
  "fade-in": "opacity-100",
  "fade-left": "opacity-100 translate-x-0",
  "fade-right": "opacity-100 translate-x-0",
  "scale-up": "opacity-100 scale-100",
  none: "",
}

export default function AnimateOnScroll({
  children,
  animation = "fade-up",
  className,
  staggerIndex,
  staggerBaseMs = 80,
  threshold = 0.15,
  enabled = true,
  as: Tag = "div",
}: AnimateOnScrollProps) {
  const { ref, isVisible } = useScrollReveal({ threshold })

  if (!enabled || animation === "none") {
    return <Tag className={className}>{children}</Tag>
  }

  const delay =
    staggerIndex !== undefined ? staggerDelay(staggerIndex, staggerBaseMs) : {}

  const Component = Tag as React.ElementType

  return (
    <Component
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isVisible ? visibleClasses[animation] : hiddenClasses[animation],
        className
      )}
      style={{
        ...delay,
        transitionDelay: isVisible
          ? (delay as Record<string, string>)["--stagger-delay"] ?? "0ms"
          : "0ms",
      }}
    >
      {children}
    </Component>
  )
}
