"use client"

import { useEffect, useRef, useCallback } from "react"

const POLL_INTERVAL_MS = 15_000
const POST_SAVE_PAUSE_MS = 5_000

interface UseBackgroundSyncOptions {
  pageSlug: string
  pageId: string
  isDirty: boolean
  isSaving: boolean
  enabled?: boolean
  onSync: (freshPage: Record<string, unknown>) => void
}

/**
 * Periodically polls the server for fresh page data so idle users see
 * changes saved by other users.
 *
 * - Skips polling when isDirty or isSaving (don't overwrite in-progress edits)
 * - Pauses when the tab is hidden (document.visibilityState === 'hidden')
 * - Pauses for 5s after a save completes (to avoid racing with post-save refetch)
 * - Only calls onSync when the server data actually changed
 */
export function useBackgroundSync({
  pageSlug,
  pageId,
  isDirty,
  isSaving,
  enabled = true,
  onSync,
}: UseBackgroundSyncOptions) {
  const onSyncRef = useRef(onSync)
  onSyncRef.current = onSync

  // Keep fresh refs so the async poll() can re-check after await
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty
  const isSavingRef = useRef(isSaving)
  isSavingRef.current = isSaving

  // Track the last fetched data to avoid unnecessary re-renders
  const lastHashRef = useRef<string>("")

  // Pause polling after a save to avoid racing with post-save refetch
  const pauseUntilRef = useRef<number>(0)

  // Expose a function to pause polling (called after save completes)
  const pauseAfterSave = useCallback(() => {
    pauseUntilRef.current = Date.now() + POST_SAVE_PAUSE_MS
  }, [])

  // Track previous isSaving to detect save completion
  const wasSavingRef = useRef(isSaving)
  useEffect(() => {
    if (wasSavingRef.current && !isSaving) {
      // Save just completed — pause polling
      pauseUntilRef.current = Date.now() + POST_SAVE_PAUSE_MS
    }
    wasSavingRef.current = isSaving
  }, [isSaving])

  useEffect(() => {
    if (!enabled) return

    const pathId = pageSlug || pageId

    let timerId: ReturnType<typeof setTimeout> | null = null
    let abortController: AbortController | null = null

    async function poll() {
      // Skip if dirty, saving, paused, or tab hidden
      if (
        isDirty ||
        isSaving ||
        Date.now() < pauseUntilRef.current ||
        document.visibilityState === "hidden"
      ) {
        scheduleNext()
        return
      }

      abortController = new AbortController()
      try {
        const res = await fetch(`/api/v1/pages/${pathId}`, {
          signal: abortController.signal,
        })
        if (!res.ok) {
          scheduleNext()
          return
        }
        const { data } = await res.json()

        // Re-check dirty/saving after await — the user may have started
        // editing or saving between the fetch start and response arrival.
        if (isDirtyRef.current || isSavingRef.current) {
          scheduleNext()
          return
        }

        // Only sync if data actually changed
        const hash = JSON.stringify({
          sections: data.sections,
          title: data.title,
        })
        if (hash !== lastHashRef.current) {
          lastHashRef.current = hash
          onSyncRef.current(data)
        }
      } catch {
        // Silently ignore — retry next interval
      }
      scheduleNext()
    }

    function scheduleNext() {
      timerId = setTimeout(poll, POLL_INTERVAL_MS)
    }

    // Initialize the hash from whatever state we start with (avoid
    // a false-positive sync on the very first poll)
    // We leave lastHashRef as "" on mount so the first poll that returns
    // data will sync it (which is correct — the user may have stale data).

    // Handle visibility change: when tab becomes visible, poll immediately
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        // Cancel the current scheduled poll and poll immediately
        if (timerId) {
          clearTimeout(timerId)
          timerId = null
        }
        poll()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Start polling
    scheduleNext()

    return () => {
      if (timerId) clearTimeout(timerId)
      if (abortController) abortController.abort()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [pageSlug, pageId, isDirty, isSaving, enabled])

  return { pauseAfterSave }
}
