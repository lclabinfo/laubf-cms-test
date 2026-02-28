"use client"

import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { RolesView } from "@/components/cms/people/roles-view"

export default function PeopleRolesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <RolesView />
    </Suspense>
  )
}
