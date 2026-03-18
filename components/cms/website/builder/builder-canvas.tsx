"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useIframeMessages, postToIframe } from "./iframe-protocol"
import type { BuilderSection, DeviceMode } from "./types"

interface BuilderCanvasProps {
  sections: BuilderSection[]
  selectedSectionId: string | null
  onSelectSection: (id: string | null) => void
  onDeselectSection: () => void
  onAddSection: (afterIndex: number) => void
  onDeleteSection: (sectionId: string) => void
  onEditSection: (sectionId: string) => void
  onReorderSections: (sections: BuilderSection[]) => void
  deviceMode: DeviceMode
  pageId: string
  onNavbarClick?: () => void
  onNavbarLinkClick?: (href: string) => void
  isNavbarEditing?: boolean
}

const deviceWidths: Record<DeviceMode, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
}

export function BuilderCanvas({
  sections,
  selectedSectionId,
  onSelectSection,
  onDeselectSection,
  onAddSection,
  onDeleteSection,
  onEditSection,
  onReorderSections,
  deviceMode,
  pageId,
  onNavbarClick,
  onNavbarLinkClick,
  isNavbarEditing,
}: BuilderCanvasProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [iframeHeight, setIframeHeight] = useState<number | null>(null)
  const [iframeError, setIframeError] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  // Track iframe-originated changes to prevent redundant echo messages
  const skipNextSectionsUpdate = useRef(false)
  const skipNextSelectionUpdate = useRef(false)
  const initSentRef = useRef(false)

  // Reset iframe state when navigating to a different page
  useEffect(() => {
    setIframeLoaded(false)
    setIframeHeight(null)
    setIframeError(false)
  }, [pageId])

  // Timeout: if iframe doesn't send READY within 10s, show error
  useEffect(() => {
    if (iframeLoaded || iframeError) return
    const timer = setTimeout(() => {
      if (!iframeLoaded) setIframeError(true)
    }, 10_000)
    return () => clearTimeout(timer)
  }, [iframeLoaded, iframeError, iframeKey])

  // -------------------------------------------------------------------------
  // Message handlers — receive events from the iframe
  // -------------------------------------------------------------------------

  const handleReady = useCallback(() => {
    setIframeLoaded(true)
    initSentRef.current = true
    if (!iframeRef.current) return
    postToIframe(iframeRef.current, {
      type: "INIT_DATA",
      sections,
      selectedSectionId,
      isNavbarEditing: isNavbarEditing ?? false,
    })
  }, [sections, selectedSectionId, isNavbarEditing])

  const handleSectionClicked = useCallback(
    (msg: { sectionId: string }) => {
      skipNextSelectionUpdate.current = true
      onSelectSection(msg.sectionId)
    },
    [onSelectSection],
  )

  const handleSectionEdit = useCallback(
    (msg: { sectionId: string }) => onEditSection(msg.sectionId),
    [onEditSection],
  )

  const handleSectionDelete = useCallback(
    (msg: { sectionId: string }) => onDeleteSection(msg.sectionId),
    [onDeleteSection],
  )

  const handleSectionAdd = useCallback(
    (msg: { afterIndex: number }) => onAddSection(msg.afterIndex),
    [onAddSection],
  )

  const handleSectionsReordered = useCallback(
    (msg: { sections: BuilderSection[] }) => {
      skipNextSectionsUpdate.current = true
      onReorderSections(msg.sections)
    },
    [onReorderSections],
  )

  const handleNavbarClicked = useCallback(
    () => onNavbarClick?.(),
    [onNavbarClick],
  )

  const handleNavbarLinkClicked = useCallback(
    (msg: { href: string }) => onNavbarLinkClick?.(msg.href),
    [onNavbarLinkClick],
  )

  const handleContentHeight = useCallback(
    (msg: { height: number }) => setIframeHeight(msg.height),
    [],
  )

  const handleDeselect = useCallback(
    () => {
      skipNextSelectionUpdate.current = true
      onDeselectSection()
    },
    [onDeselectSection],
  )

  useIframeMessages(iframeRef, {
    READY: handleReady,
    SECTION_CLICKED: handleSectionClicked,
    SECTION_EDIT: handleSectionEdit,
    SECTION_DELETE: handleSectionDelete,
    SECTION_ADD: handleSectionAdd,
    SECTIONS_REORDERED: handleSectionsReordered,
    NAVBAR_CLICKED: handleNavbarClicked,
    NAVBAR_LINK_CLICKED: handleNavbarLinkClicked,
    CONTENT_HEIGHT: handleContentHeight,
    DESELECT: handleDeselect,
  })

  // -------------------------------------------------------------------------
  // Send updates to the iframe when props change
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!iframeLoaded || !iframeRef.current) return
    // Skip the initial fire right after INIT_DATA (which already sent sections)
    if (initSentRef.current) { initSentRef.current = false; return }
    // Skip echo from iframe-originated reorder
    if (skipNextSectionsUpdate.current) { skipNextSectionsUpdate.current = false; return }
    postToIframe(iframeRef.current, { type: "UPDATE_SECTIONS", sections })
  }, [sections, iframeLoaded])

  useEffect(() => {
    if (!iframeLoaded || !iframeRef.current) return
    // Skip echo from iframe-originated click/deselect
    if (skipNextSelectionUpdate.current) { skipNextSelectionUpdate.current = false; return }
    postToIframe(iframeRef.current, { type: "SELECT_SECTION", sectionId: selectedSectionId })
  }, [selectedSectionId, iframeLoaded])

  useEffect(() => {
    if (!iframeLoaded || !iframeRef.current) return
    postToIframe(iframeRef.current, { type: "UPDATE_NAVBAR", isNavbarEditing: isNavbarEditing ?? false })
  }, [isNavbarEditing, iframeLoaded])

  return (
    <div className="flex-1 bg-muted/30 overflow-y-auto overflow-x-hidden p-4">
      {/* Device preview container */}
      <div
        className="mx-auto bg-white transition-all duration-300 ease-in-out overflow-hidden shadow-sm border relative"
        style={{
          maxWidth: deviceWidths[deviceMode],
          minHeight: "calc(100vh - 120px)",
        }}
      >
        {/* Loading / error indicator */}
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            {iframeError ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">Preview failed to load.</p>
                <button
                  className="text-sm text-primary underline underline-offset-2 hover:text-primary/80"
                  onClick={() => {
                    setIframeError(false)
                    setIframeLoaded(false)
                    setIframeKey((k) => k + 1)
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Loading preview...</div>
            )}
          </div>
        )}

        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={`/cms/website/builder/preview/${pageId}`}
          allow="autoplay"
          className="w-full border-0"
          style={{
            height: iframeHeight ? `${iframeHeight}px` : "calc(100vh - 120px)",
            minHeight: "calc(100vh - 120px)",
          }}
          title="Website Preview"
        />
      </div>
    </div>
  )
}
