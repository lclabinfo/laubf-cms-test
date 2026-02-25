"use client";

import { useState } from "react"
import { mockMinistries, type Ministry } from "./data"
import { MinistryList } from "./MinistryList"
import { MinistryEditor } from "./MinistryEditor"
import { PageContainer, PageHeader } from "../shared/PageLayout"

interface MinistriesPageProps {
  setSidebarOpen?: (isOpen: boolean) => void;
}

export function MinistriesPage({ setSidebarOpen }: MinistriesPageProps) {
  const [view, setView] = useState<"list" | "edit">("list")
  const [selectedMinistryId, setSelectedMinistryId] = useState<string | null>(null)
  const [ministries, setMinistries] = useState<Ministry[]>(mockMinistries)

  const handleCreate = () => {
    setSelectedMinistryId(null)
    setView("edit")
    if (setSidebarOpen) setSidebarOpen(false)
  }

  const handleEdit = (id: string) => {
    setSelectedMinistryId(id)
    setView("edit")
    if (setSidebarOpen) setSidebarOpen(false)
  }

  const handleBack = () => {
    setSelectedMinistryId(null)
    setView("list")
    if (setSidebarOpen) setSidebarOpen(true)
  }

  const handleSave = (data: Partial<Ministry>) => {
      if (selectedMinistryId) {
          // Update existing
          setMinistries(ministries.map(m => m.id === selectedMinistryId ? { ...m, ...data } as Ministry : m));
      } else {
          // Create new
          const newMinistry: Ministry = {
              id: Math.random().toString(36).substring(7),
              ...data as Ministry,
              memberCount: 0,
              lastUpdated: new Date().toISOString().split('T')[0]
          };
          setMinistries([newMinistry, ...ministries]);
      }
      setView("list");
      if (setSidebarOpen) setSidebarOpen(true)
  }

  const handleDelete = (id: string) => {
      setMinistries(ministries.filter(m => m.id !== id));
  }

  const selectedMinistry = selectedMinistryId ? ministries.find(m => m.id === selectedMinistryId) : undefined;

  return (
    <PageContainer>
      {view === "list" && (
        <PageHeader 
          title="Ministries" 
          description="Manage your church ministries and their public pages."
        />
      )}

      {view === "list" ? (
        <MinistryList 
            ministries={ministries} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            onCreate={handleCreate}
        />
      ) : (
        <MinistryEditor 
          ministry={selectedMinistry} 
          onCancel={handleBack} 
          onSave={handleSave} 
        />
      )}
    </PageContainer>
  )
}
