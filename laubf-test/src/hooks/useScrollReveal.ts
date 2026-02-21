/**
 * useScrollReveal – Intersection Observer hook for scroll-triggered animations.
 *
 * Returns a ref to attach to the target element plus an `isVisible` boolean
 * that flips to `true` once the element enters the viewport.
 *
 * Respects `prefers-reduced-motion` — when the user prefers reduced motion,
 * `isVisible` is always `true` so elements render without animation.
 *
 * @param options.threshold  Visibility ratio to trigger (default 0.15)
 * @param options.triggerOnce  If true, stays visible after first reveal (default true)
 * @param options.rootMargin  IntersectionObserver rootMargin (default "0px 0px -40px 0px")
 */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseScrollRevealOptions {
  threshold?: number;
  triggerOnce?: boolean;
  rootMargin?: string;
}

export function useScrollReveal({
  threshold = 0.15,
  triggerOnce = true,
  rootMargin = "0px 0px -40px 0px",
}: UseScrollRevealOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) observer.unobserve(element);
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, triggerOnce, rootMargin]);

  return { ref, isVisible };
}

/**
 * useStaggerChildren – returns stagger delay style for the nth child.
 * Each child gets a CSS custom property `--stagger-delay` that
 * can be consumed by the `animate-reveal-*` CSS classes.
 */
export function staggerDelay(index: number, baseMs = 80, maxMs = 600) {
  const delay = Math.min(index * baseMs, maxMs);
  return { "--stagger-delay": `${delay}ms` } as React.CSSProperties;
}
