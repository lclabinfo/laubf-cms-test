"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EntryForm } from "@/components/cms/messages/entry/entry-form"
import { useMessages } from "@/lib/messages-context"

export default function EditMessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { messages } = useMessages()

  const message = messages.find((m) => m.id === id)

  if (!message) {
    return (
      <div className="space-y-4">
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
