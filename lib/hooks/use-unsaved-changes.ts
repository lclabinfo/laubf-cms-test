"use client"

import { useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"

/**
 * Hook that warns the user about unsaved changes before navigating away.
 * Handles:
 * - Browser reload / tab close (beforeunload)
 * - Next.js client-side navigations (history.pushState interception)
 * - Browser back/forward (popstate)
 *
 * Returns `navigateAway(path)` — use this to intentionally leave the page
 * (e.g. "Discard Changes" button) without triggering the unsaved-changes prompt.
 */
export function useUnsavedChanges(isDirty: boolean) {
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty

  // A flag to temporarily bypass interception for intentional navigations
  const bypassRef = useRef(false)

  const router = useRouter()

  // 1. Handle browser reload / tab close
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirtyRef.current && !bypassRef.current) {
        e.preventDefault()
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  // 2. Intercept client-side navigations (Next.js uses history.pushState)
  useEffect(() => {
    // Patch pushState and replaceState to intercept SPA navigations
    const originalPushState = history.pushState.bind(history)
    const originalReplaceState = history.replaceState.bind(history)

    function interceptNavigation(
      original: typeof history.pushState,
      data: unknown,
      unused: string,
      url?: string | URL | null,
    ) {
      if (bypassRef.current) {
        original(data, unused, url)
        return
      }
      if (isDirtyRef.current && url) {
        const currentPath = window.location.pathname
        const newPath = typeof url === "string" ? new URL(url, window.location.origin).pathname : url.pathname
        // Only intercept if actually navigating to a different page
        if (currentPath !== newPath) {
          const confirmed = window.confirm(
            "You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
          )
          if (!confirmed) return
        }
      }
      original(data, unused, url)
    }

    history.pushState = function (data: unknown, unused: string, url?: string | URL | null) {
      interceptNavigation(originalPushState, data, unused, url)
    }

    history.replaceState = function (data: unknown, unused: string, url?: string | URL | null) {
      // Don't intercept replaceState — it's used for shallow updates (scroll, search params)
      originalReplaceState(data, unused, url)
    }

    // 3. Handle browser back/forward
    function handlePopState() {
      if (isDirtyRef.current && !bypassRef.current) {
        const confirmed = window.confirm(
          "You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
        )
        if (!confirmed) {
          // Push the current URL back to undo the back/forward
          originalPushState(null, "", window.location.href)
        }
      }
    }
    window.addEventListener("popstate", handlePopState)

    return () => {
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  /**
   * Navigate away intentionally, bypassing the unsaved-changes prompt.
   * Use this from "Discard Changes" buttons or after a successful save.
   */
  const navigateAway = useCallback((path: string) => {
    bypassRef.current = true
    router.push(path)
  }, [router])

  return { navigateAway }
}
