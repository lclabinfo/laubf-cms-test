"use client"

import { useState } from "react"
import { Star, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { ChurchEvent } from "@/lib/events-data"

const MAX_FEATURED = 3

export type FeaturedToggleScenario =
  | { type: "unfeature"; event: ChurchEvent }
  | { type: "feature"; event: ChurchEvent }
  | { type: "replace"; event: ChurchEvent; currentFeatured: ChurchEvent[] }

interface FeaturedToggleDialogProps {
  scenario: FeaturedToggleScenario | null
  onConfirm: (eventToFeature: ChurchEvent, eventToUnfeature?: ChurchEvent) => void
  onCancel: () => void
}

function formatDateShort(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function FeaturedToggleDialog({ scenario, onConfirm, onCancel }: FeaturedToggleDialogProps) {
  const [selectedReplace, setSelectedReplace] = useState<string | null>(null)

  if (!scenario) return null

  // Scenario A: Unfeaturing
  if (scenario.type === "unfeature") {
    return (
      <AlertDialog open onOpenChange={(open) => { if (!open) onCancel() }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-warning/10">
              <Star className="text-warning" />
            </AlertDialogMedia>
            <AlertDialogTitle>Remove from Featured?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{scenario.event.title}&rdquo; will no longer appear in the featured section. An auto-selected event will take its place.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onConfirm(scenario.event)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  // Scenario B: Featuring (under limit)
  if (scenario.type === "feature") {
    return (
      <AlertDialog open onOpenChange={(open) => { if (!open) onCancel() }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-warning/10">
              <Star className="text-warning fill-warning" />
            </AlertDialogMedia>
            <AlertDialogTitle>Feature this event?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{scenario.event.title}&rdquo; will appear in the featured section on your website.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onConfirm(scenario.event)}>
              Feature
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  // Scenario C: Featuring but at max — must replace one
  const currentFeatured = scenario.currentFeatured
  const selectedEvent = currentFeatured.find((e) => e.id === selectedReplace)

  return (
    <Dialog open onOpenChange={(open) => { if (!open) { setSelectedReplace(null); onCancel() } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Featured Events Full</DialogTitle>
          <DialogDescription>
            You already have {MAX_FEATURED} featured events. To feature &ldquo;{scenario.event.title}&rdquo;, select one to replace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 py-1">
          {currentFeatured.map((evt) => (
            <button
              key={evt.id}
              type="button"
              onClick={() => setSelectedReplace(evt.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                selectedReplace === evt.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border",
                  selectedReplace === evt.id
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/40"
                )}
              >
                {selectedReplace === evt.id && (
                  <div className="size-1.5 rounded-full bg-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Star className="size-3 shrink-0 text-warning fill-warning" />
                  <span className="text-sm font-medium truncate">{evt.title}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <CalendarDays className="size-3 shrink-0" />
                  <span>{formatDateShort(evt.date)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setSelectedReplace(null); onCancel() }}>
            Cancel
          </Button>
          <Button
            disabled={!selectedEvent}
            onClick={() => {
              if (selectedEvent) {
                onConfirm(scenario.event, selectedEvent)
                setSelectedReplace(null)
              }
            }}
          >
            Replace Selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Determines the correct scenario for toggling featured status.
 * Returns null if no dialog is needed (shouldn't happen in normal flow).
 */
export function determineFeaturedScenario(
  event: ChurchEvent,
  allEvents: ChurchEvent[],
): FeaturedToggleScenario | null {
  if (event.isFeatured) {
    return { type: "unfeature", event }
  }

  const currentFeatured = allEvents.filter((e) => e.isFeatured)
  if (currentFeatured.length < MAX_FEATURED) {
    return { type: "feature", event }
  }

  return { type: "replace", event, currentFeatured }
}
