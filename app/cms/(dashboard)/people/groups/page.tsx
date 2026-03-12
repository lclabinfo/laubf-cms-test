"use client"

import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { GroupsView } from "@/components/cms/people/groups-view"

export default function PeopleGroupsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <GroupsView />
    </Suspense>
  )
}
