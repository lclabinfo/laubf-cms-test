"use client"

import { EventsProvider } from "@/lib/events-context"

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <EventsProvider>{children}</EventsProvider>
}
