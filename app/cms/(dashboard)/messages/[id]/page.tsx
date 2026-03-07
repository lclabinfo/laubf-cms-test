"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EntryForm } from "@/components/cms/messages/entry/entry-form"
import { useMessages } from "@/lib/messages-context"
import type { Message } from "@/lib/messages-data"

export default function EditMessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { fetchMessageById } = useMessages()

  // Track async-fetched message (null = not found, undefined = loading)
  const [fetched, setFetched] = useState<Message | null | undefined>(undefined)

  useEffect(() => {
    // Always fetch full detail data from the API.
    // The messages list in context uses lightweight includes that omit
    // relatedStudy and other heavy fields needed by the detail view.
    let cancelled = false
    fetchMessageById(id).then((result) => {
      if (!cancelled) setFetched(result)
    })
    return () => { cancelled = true }
  }, [id, fetchMessageById])

  const message = fetched

  if (message === undefined) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!message) {
    return (
      <div className="pt-5 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cms/messages">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">Message Not Found</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          This message doesn&apos;t exist or has been deleted.
        </p>
      </div>
    )
  }

  return <EntryForm mode="edit" message={message} />
}
