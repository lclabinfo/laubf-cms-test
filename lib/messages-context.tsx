"use client"

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react"
import {
  series as initialSeries,
  messages as initialMessages,
  type Series,
  type Message,
} from "./messages-data"

interface MessagesContextValue {
  series: Series[]
  messages: Message[]
  addSeries: (data: { name: string; imageUrl?: string }) => Series
  updateSeries: (id: string, data: { name: string; imageUrl?: string }) => void
  deleteSeries: (id: string) => void
  setSeriesMessages: (seriesId: string, messageIds: string[]) => void
  addMessage: (data: Omit<Message, "id">) => Message
  updateMessage: (id: string, data: Partial<Omit<Message, "id">>) => void
  deleteMessage: (id: string) => void
}

const MessagesContext = createContext<MessagesContextValue | null>(null)

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [series, setSeries] = useState<Series[]>(initialSeries)
  const [messages, setMessages] = useState<Message[]>(initialMessages)

  const addSeries = useCallback((data: { name: string; imageUrl?: string }) => {
    const newSeries: Series = {
      id: `s${Date.now()}`,
      name: data.name,
      imageUrl: data.imageUrl,
    }
    setSeries((prev) => [...prev, newSeries])
    return newSeries
  }, [])

  const updateSeries = useCallback((id: string, data: { name: string; imageUrl?: string }) => {
    setSeries((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: data.name, imageUrl: data.imageUrl } : s))
    )
  }, [])

  const deleteSeries = useCallback((id: string) => {
    setSeries((prev) => prev.filter((s) => s.id !== id))
    setMessages((prev) =>
      prev.map((m) =>
        m.seriesIds.includes(id)
          ? { ...m, seriesIds: m.seriesIds.filter((sid) => sid !== id) }
          : m
      )
    )
  }, [])

  const setSeriesMessages = useCallback((seriesId: string, messageIds: string[]) => {
    setMessages((prev) =>
      prev.map((m) => {
        const inSelection = messageIds.includes(m.id)
        const inSeries = m.seriesIds.includes(seriesId)
        if (inSelection && !inSeries) {
          return { ...m, seriesIds: [...m.seriesIds, seriesId] }
        }
        if (!inSelection && inSeries) {
          return { ...m, seriesIds: m.seriesIds.filter((s) => s !== seriesId) }
        }
        return m
      })
    )
  }, [])

  const addMessage = useCallback((data: Omit<Message, "id">) => {
    const newMessage: Message = {
      ...data,
      id: `m${Date.now()}`,
    }
    setMessages((prev) => [newMessage, ...prev])
    return newMessage
  }, [])

  const updateMessage = useCallback((id: string, data: Partial<Omit<Message, "id">>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...data } : m))
    )
  }, [])

  const deleteMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      series,
      messages,
      addSeries,
      updateSeries,
      deleteSeries,
      setSeriesMessages,
      addMessage,
      updateMessage,
      deleteMessage,
    }),
    [series, messages, addSeries, updateSeries, deleteSeries, setSeriesMessages, addMessage, updateMessage, deleteMessage]
  )

  return <MessagesContext value={value}>{children}</MessagesContext>
}

export function useMessages() {
  const ctx = useContext(MessagesContext)
  if (!ctx) throw new Error("useMessages must be used within MessagesProvider")
  return ctx
}
