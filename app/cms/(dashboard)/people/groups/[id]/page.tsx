"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { GroupsProvider } from "@/lib/groups-context"
import { GroupDetail } from "@/components/cms/people/group-detail"

function GroupDetailContent() {
  const params = useParams<{ id: string }>()
  return (
    <GroupsProvider>
      <GroupDetail groupId={params.id} />
    </GroupsProvider>
  )
}

export default function GroupDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <GroupDetailContent />
    </Suspense>
  )
}
