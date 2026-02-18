"use client"

import Link from "next/link"
import { ImageIcon } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Series } from "@/lib/messages-data"

interface SeriesWithCount extends Series {
  count: number
}

interface SeriesCardGridProps {
  series: SeriesWithCount[]
}

export function SeriesCardGrid({ series }: SeriesCardGridProps) {
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
        <Link key={s.id} href={`/cms/messages/series/${s.id}`} className="group">
          <Card className="transition-colors group-hover:bg-muted/50 h-full">
            <div className="mx-4 mt-0 aspect-video rounded-md bg-muted flex items-center justify-center overflow-hidden">
              {s.imageUrl ? (
                <img src={s.imageUrl} alt={s.name} className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-8 text-muted-foreground/50" />
              )}
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
        </Link>
      ))}
    </div>
  )
}
