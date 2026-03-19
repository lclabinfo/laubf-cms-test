"use client"

import { useState, useEffect, useRef, useCallback } from "react"

const HEARTBEAT_INTERVAL_MS = 30_000

export interface PresenceEditor {
  userId: string
  userName: string
}

interface UsePresenceHeartbeatOptions {
  pageId: string
  enabled?: boolean
}

export function usePresenceHeartbeat({
  pageId,
  enabled = true,
}: UsePresenceHeartbeatOptions): { otherEditors: PresenceEditor[] } {
  const [otherEditors, setOtherEditors] = useState<PresenceEditor[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pageIdRef = useRef(pageId)
  pageIdRef.current = pageId

  const sendHeartbeat = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/builder/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: pageIdRef.current }),
      })
      if (res.ok) {
        const data = await res.json()
        const editors: PresenceEditor[] = (data.editors ?? []).map(
          (e: { userId: string; userName: string }) => ({
            userId: e.userId,
            userName: e.userName,
          }),
        )
        setOtherEditors(editors)
      }
    } catch {
      // Silently fail — retry next interval
    }
  }, [])

  const cleanup = useCallback(async () => {
    try {
      await fetch("/api/v1/builder/presence", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: pageIdRef.current }),
        keepalive: true,
      })
    } catch {
      // Best-effort cleanup
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    // Immediate heartbeat on mount
    sendHeartbeat()

    // Start interval
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)

    // Pause when tab is hidden, resume when visible
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        // Resume: clear any existing interval first to prevent duplicates
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        sendHeartbeat()
        intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      cleanup()
    }
  }, [enabled, pageId, sendHeartbeat, cleanup])

  return { otherEditors }
}
