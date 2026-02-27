"use client"

import { Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PersonDetail } from "./types"

function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

type Props = {
  person: PersonDetail
}

export function ProfileActivity({ person }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="size-4" />
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          <div>
            <dt className="text-muted-foreground text-sm">Created</dt>
            <dd className="text-sm font-medium">{formatDateTime(person.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Last Updated</dt>
            <dd className="text-sm font-medium">{formatDateTime(person.updatedAt)}</dd>
          </div>
          {person.source && (
            <div>
              <dt className="text-muted-foreground text-sm">Source</dt>
              <dd className="text-sm font-medium">{person.source}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  )
}
