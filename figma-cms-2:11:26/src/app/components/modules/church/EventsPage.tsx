"use client";

import { useState } from "react"
import { EventList } from "./events/EventList"
import { EventForm } from "./events/EventForm"
import { PageContainer, PageHeader } from "./shared/PageLayout"

interface EventsPageProps {
  setSidebarOpen?: (isOpen: boolean) => void;
}

export function EventsPage({ setSidebarOpen }: EventsPageProps) {
  const [view, setView] = useState<"list" | "create" | "edit">("list")
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const handleCreate = () => {
    setSelectedEventId(null)
    setView("create")
    if (setSidebarOpen) setSidebarOpen(false)
  }

  const handleEdit = (id: string) => {
    setSelectedEventId(id)
    setView("edit")
    if (setSidebarOpen) setSidebarOpen(false)
  }

  const handleBack = () => {
    setSelectedEventId(null)
    setView("list")
    if (setSidebarOpen) setSidebarOpen(true)
  }

  return (
    <PageContainer>
      {view === "list" && (
        <PageHeader 
          title="Events" 
          description="Manage upcoming church events, calendar, and registrations."
        />
      )}

      {view === "list" ? (
        <EventList onEdit={handleEdit} onCreate={handleCreate} />
      ) : (
        <EventForm 
          mode={view} 
          eventId={selectedEventId} 
          onCancel={handleBack} 
          onSave={handleBack} 
        />
      )}
    </PageContainer>
  )
}
