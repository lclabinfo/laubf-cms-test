"use client";

import { useState } from "react"
import { mockEntries, type Entry, addEntry } from "@/app/data/store"
import { EntryList } from "./library/EntryList"
import { EntryEditor } from "./library/EntryEditor"
import { SeriesList } from "./library/SeriesList"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"

import { PageContainer, PageHeader } from "./shared/PageLayout"

interface LibraryPageProps {
  setSidebarOpen?: (isOpen: boolean) => void;
}

export function LibraryPage({ setSidebarOpen }: LibraryPageProps) {
  const [view, setView] = useState<"list" | "edit">("list")
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [entries, setEntries] = useState<Entry[]>(mockEntries)
  const [activeTab, setActiveTab] = useState("messages")
  
  // Series State
  const [isSeriesCreateOpen, setIsSeriesCreateOpen] = useState(false)
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState<string | null>(null)

  const handleCreate = () => {
    if (activeTab === "series") {
        setIsSeriesCreateOpen(true)
    } else {
        setSelectedEntryId(null)
        setView("edit")
        if (setSidebarOpen) setSidebarOpen(false)
    }
  }

  const handleEdit = (id: string) => {
    setSelectedEntryId(id)
    setView("edit")
    if (setSidebarOpen) setSidebarOpen(false)
  }

  const handleBack = () => {
    setSelectedEntryId(null)
    setView("list")
    if (setSidebarOpen) setSidebarOpen(true)
  }

  const handleSave = (data: any) => {
      if (selectedEntryId) {
          // Update existing
          setEntries(entries.map(e => e.id === selectedEntryId ? { ...e, ...data } : e));
      } else {
          // Create new
          const newEntry: Entry = {
              id: Math.random().toString(36).substring(7),
              ...data,
              views: 0,
              downloads: 0
          };
          setEntries([newEntry, ...entries]);
          addEntry(newEntry);
      }
      setView("list");
      if (setSidebarOpen) setSidebarOpen(true)
  }

  const handleSelectSeries = (seriesId: string) => {
      setSelectedSeriesFilter(seriesId)
      setActiveTab("messages")
  }

  const selectedEntry = selectedEntryId ? entries.find(e => e.id === selectedEntryId) : undefined;

  if (view === "edit") {
    return (
        <EntryEditor 
          entry={selectedEntry} 
          onCancel={handleBack} 
          onSave={handleSave} 
        />
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Messages"
        description="Manage your sermon and bible study messages."
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
                <TabsTrigger value="messages">All Messages</TabsTrigger>
                <TabsTrigger value="series">Series</TabsTrigger>
            </TabsList>

            {/* Action button moved into individual list components for correct placement */}
          </div>

          <TabsContent value="messages" className="mt-0">
            <EntryList 
                entries={entries} 
                onEdit={handleEdit} 
                initialSeriesId={selectedSeriesFilter}
                onCreate={handleCreate}
            />
          </TabsContent>

          <TabsContent value="series" className="mt-0">
             <SeriesList 
                entries={entries} 
                isCreateOpen={isSeriesCreateOpen}
                setIsCreateOpen={setIsSeriesCreateOpen}
                onSelectSeries={handleSelectSeries}
                onCreate={() => setIsSeriesCreateOpen(true)}
             />
          </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
