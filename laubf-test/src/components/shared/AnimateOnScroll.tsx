/**
 * AnimateOnScroll – Reusable wrapper that triggers CSS animations when
 * the element scrolls into view via Intersection Observer.
 *
 * Animation variants:
 *   fade-up   – fade in + slide up 24px (default)
 *   fade-in   – fade in only
 *   fade-left – fade in + slide from left
 *   fade-right – fade in + slide from right
 *   scale-up  – fade in + scale from 0.95
 *   none      – no animation (useful for conditional bypass)
 *
 * Stagger support: pass `staggerIndex` to auto-add stagger delay.
 *
 * Usage:
 *   <AnimateOnScroll animation="fade-up">
 *     <MyContent />
 *   </AnimateOnScroll>
 */
"use client";

import { useScrollReveal, staggerDelay } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";

export type AnimationVariant =
  | "fade-up"
  | "fade-in"
  | "fade-left"
  | "fade-right"
  | "scale-up"
  | "none";

interface AnimateOnScrollProps {
  children: React.ReactNode;
  animation?: AnimationVariant;
  className?: string;
  /** Index for stagger delay in lists/grids */
  staggerIndex?: number;
  /** Base stagger delay in ms between items */
  staggerBaseMs?: number;
  /** Intersection Observer threshold */
  threshold?: number;
  /** Whether animations are enabled (default true) */
  enabled?: boolean;
  /** Element tag to render */
  as?: keyof React.JSX.IntrinsicElements;
}

// CSS class map for initial (hidden) state
const hiddenClasses: Record<AnimationVariant, string> = {
  "fade-up": "opacity-0 translate-y-6",
  "fade-in": "opacity-0",
  "fade-left": "opacity-0 -translate-x-6",
  "fade-right": "opacity-0 translate-x-6",
  "scale-up": "opacity-0 scale-[0.95]",
  none: "",
};

// CSS class for revealed (visible) state
const visibleClasses: Record<AnimationVariant, string> = {
  "fade-up": "opacity-100 translate-y-0",
  "fade-in": "opacity-100",
  "fade-left": "opacity-100 translate-x-0",
  "fade-right": "opacity-100 translate-x-0",
  "scale-up": "opacity-100 scale-100",
  none: "",
};

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
  const { ref, isVisible } = useScrollReveal({ threshold });

  // If animations disabled, render children directly
  if (!enabled || animation === "none") {
    return <Tag className={className}>{children}</Tag>;
  }

  const delay =
    staggerIndex !== undefined ? staggerDelay(staggerIndex, staggerBaseMs) : {};

  const Component = Tag as React.ElementType;

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
  );
}
