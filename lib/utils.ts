import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * Extended tailwind-merge that recognizes website design system typography
 * utilities (text-h1, text-nav, text-button-1, etc.) as font-size classes
 * so they don't get stripped when merged with text-color classes like
 * text-black-1 or text-white-1.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-h1",
        "text-h2",
        "text-h3",
        "text-h4",
        "text-body-1",
        "text-body-2",
        "text-body-3",
        "text-button-1",
        "text-button-2",
        "text-nav",
        "text-pill",
        "text-overline",
        "text-hero-accent",
        "text-display-heading",
        "text-script-heading",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
