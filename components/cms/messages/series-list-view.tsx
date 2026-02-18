"use client"

import { ImageIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SeriesActions } from "./series-actions"
import type { Series } from "@/lib/messages-data"

interface SeriesWithCount extends Series {
  count: number
}

interface SeriesListViewProps {
  series: SeriesWithCount[]
  onEdit: (series: Series) => void
  onManageMessages: (series: Series) => void
  onDelete: (series: Series) => void
}

export function SeriesListView({ series, onEdit, onManageMessages, onDelete }: SeriesListViewProps) {
  if (series.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
        <p className="text-muted-foreground text-sm">No series found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {series.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-4 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
        >
          <div className="size-12 shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden">
            {s.imageUrl ? (
              <img src={s.imageUrl} alt={s.name} className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-5 text-muted-foreground/50" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{s.name}</p>
            <Badge variant="secondary" className="text-xs mt-0.5">
              {s.count} {s.count === 1 ? "message" : "messages"}
            </Badge>
          </div>
          <SeriesActions
            onEdit={() => onEdit(s)}
            onManageMessages={() => onManageMessages(s)}
            onDelete={() => onDelete(s)}
          />
        </div>
      ))}
    </div>
  )
}
