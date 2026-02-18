"use client"

import { ImageIcon } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SeriesActions } from "./series-actions"
import type { Series } from "@/lib/messages-data"

interface SeriesWithCount extends Series {
  count: number
}

interface SeriesCardGridProps {
  series: SeriesWithCount[]
  onEdit: (series: Series) => void
  onManageMessages: (series: Series) => void
  onDelete: (series: Series) => void
}

export function SeriesCardGrid({ series, onEdit, onManageMessages, onDelete }: SeriesCardGridProps) {
  if (series.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
        <p className="text-muted-foreground text-sm">No series found.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {series.map((s) => (
        <Card key={s.id} className="group relative transition-colors hover:bg-muted/50">
          <div className="relative mx-4 mt-0 aspect-video rounded-md bg-muted flex items-center justify-center overflow-hidden">
            {s.imageUrl ? (
              <img src={s.imageUrl} alt={s.name} className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-8 text-muted-foreground/50" />
            )}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <SeriesActions
                onEdit={() => onEdit(s)}
                onManageMessages={() => onManageMessages(s)}
                onDelete={() => onDelete(s)}
              />
            </div>
          </div>
          <CardHeader>
            <CardTitle>{s.name}</CardTitle>
            <CardDescription>
              <Badge variant="secondary" className="text-xs">
                {s.count} {s.count === 1 ? "message" : "messages"}
              </Badge>
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
