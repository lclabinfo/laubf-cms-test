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
  const { messages, fetchMessageById } = useMessages()

  // Check context first (synchronous, no effect needed)
  const fromContext = messages.find((m) => m.id === id)

  // Track async-fetched message separately (null = not found, undefined = loading)
  const [fetched, setFetched] = useState<Message | null | undefined>(
    fromContext ? undefined : undefined
  )

  useEffect(() => {
    if (fromContext) return // already in context, no fetch needed

    let cancelled = false
    fetchMessageById(id).then((result) => {
      if (!cancelled) setFetched(result)
    })
    return () => { cancelled = true }
  }, [id, fromContext, fetchMessageById])

  const message = fromContext ?? fetched

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
