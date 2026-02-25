"use client";

import { useState } from "react"
import { AnnouncementList } from "./announcements/AnnouncementList"
import { AnnouncementForm } from "./announcements/AnnouncementForm"
import { AnnouncementDetails } from "./announcements/AnnouncementDetails"
import { PageContainer, PageHeader } from "./shared/PageLayout"

interface AnnouncementsPageProps {
  setSidebarOpen?: (isOpen: boolean) => void;
}

export function AnnouncementsPage({ setSidebarOpen }: AnnouncementsPageProps) {
  const [view, setView] = useState<"list" | "create" | "edit" | "details">("list")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleCreate = () => {
    setSelectedId(null)
    setView("create")
    if (setSidebarOpen) setSidebarOpen(false)
  }

  const handleDetails = (id: string) => {
      setSelectedId(id)
      setView("details")
      if (setSidebarOpen) setSidebarOpen(false)
  }

  const handleEdit = (id: string) => {
    setSelectedId(id)
    setView("edit")
    if (setSidebarOpen) setSidebarOpen(false)
  }

  const handleBack = () => {
    if (view === "edit" && selectedId) {
        setView("details")
        if (setSidebarOpen) setSidebarOpen(false) 
    } else {
        setSelectedId(null)
        setView("list")
        if (setSidebarOpen) setSidebarOpen(true)
    }
  }

  return (
    <PageContainer>
      {view === "list" && (
        <PageHeader 
            title="Announcements" 
            description="Manage news, updates, and communications for the congregation."
        />
      )}

      {view === "list" ? (
        <AnnouncementList onEdit={handleDetails} onCreate={handleCreate} />
      ) : view === "details" && selectedId ? (
          <AnnouncementDetails 
            id={selectedId} 
            onBack={handleBack} 
            onEdit={handleEdit} 
          />
      ) : (
        <AnnouncementForm 
          mode={view as "create" | "edit"} 
          id={selectedId} 
          onCancel={handleBack} 
          onSave={() => {
              if (view === "create") {
                  handleBack() // Goes to list
              } else {
                  handleBack() // Goes to details
              }
          }} 
        />
      )}
    </PageContainer>
  )
}
