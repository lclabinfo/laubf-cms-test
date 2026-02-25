"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EventForm } from "@/components/cms/events/entry/event-form"
import { useEvents } from "@/lib/events-context"

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { events } = useEvents()

  const event = events.find((e) => e.id === id)

  if (!event) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cms/events">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">Event Not Found</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          This event doesn&apos;t exist or has been deleted.
        </p>
      </div>
    )
  }

  return <EventForm mode="edit" event={event} />
}
