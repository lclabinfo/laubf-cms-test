"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FeaturedEventsWarningProps {
  staleFeaturedCount: number
  autoHidePastFeatured: boolean
}

/**
 * Dashboard warning banner for stale featured events.
 * Shows when manually featured events have passed and auto-hide is OFF.
 */
export function FeaturedEventsWarning({
  staleFeaturedCount,
  autoHidePastFeatured,
}: FeaturedEventsWarningProps) {
  const [dismissed, setDismissed] = useState(false)

  // Only show if there are stale featured events AND auto-hide is OFF
  if (dismissed || staleFeaturedCount === 0 || autoHidePastFeatured) {
    return null
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
          {staleFeaturedCount} featured event{staleFeaturedCount === 1 ? "" : "s"} ha{staleFeaturedCount === 1 ? "s" : "ve"} passed
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
          Update your featured events or enable auto-hide in Events Settings.
        </p>
        <div className="mt-2">
          <Button variant="outline" size="sm" asChild className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-900/50">
            <Link href="/cms/events?tab=settings">
              Go to Events Settings
            </Link>
          </Button>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-md p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50 transition-colors"
        aria-label="Dismiss warning"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
