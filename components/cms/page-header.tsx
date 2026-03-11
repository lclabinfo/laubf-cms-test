"use client"

import { useState, useEffect } from "react"
import { HelpCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  SpotlightTour,
  isSpotlightComplete,
  resetSpotlight,
} from "@/components/cms/tutorial/spotlight-tour"
import { SPOTLIGHT_TOURS } from "@/components/cms/tutorial/spotlight-tours"

interface PageHeaderProps {
  title: string
  description: string
  /** Spotlight tour ID to associate with this page */
  tutorialId?: string
  /** User ID for per-user tracking */
  userId?: string
  /** Optional right-side content (action buttons, etc.) */
  actions?: React.ReactNode
}

export function PageHeader({ title, description, tutorialId, userId, actions }: PageHeaderProps) {
  const [tourActive, setTourActive] = useState(false)
  const tour = tutorialId ? SPOTLIGHT_TOURS[tutorialId] : null

  // Auto-start tour on first visit (or when ?dev-tutorial=true)
  useEffect(() => {
    if (!tour || !userId) return
    const devForce =
      process.env.NODE_ENV === "development" &&
      new URLSearchParams(window.location.search).get("dev-tutorial") === "true"
    if (devForce || !isSpotlightComplete(tour.id, userId)) {
      const timer = setTimeout(() => setTourActive(true), 800)
      return () => clearTimeout(timer)
    }
  }, [tour, userId])

  function handleReplay() {
    if (tour && userId) {
      resetSpotlight(tour.id, userId)
      setTourActive(true)
    }
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {tour && userId && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground/50 hover:text-muted-foreground"
                    onClick={handleReplay}
                  >
                    <HelpCircleIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-xs">View guide</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {tour && userId && (
        <SpotlightTour
          tour={tour}
          userId={userId}
          active={tourActive}
          onEnd={() => setTourActive(false)}
        />
      )}
    </>
  )
}
