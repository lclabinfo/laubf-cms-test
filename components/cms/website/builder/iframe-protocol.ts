"use client"

import { useEffect, useRef } from "react"
import type { BuilderSection, NavbarData } from "./types"

export type { NavbarData } from "./types"

// ---------------------------------------------------------------------------
// Message envelope
// ---------------------------------------------------------------------------

const MESSAGE_SOURCE = "builder-preview" as const

interface MessageEnvelope {
  source: typeof MESSAGE_SOURCE
}

// ---------------------------------------------------------------------------
// Parent → Iframe messages
// ---------------------------------------------------------------------------

/** Messages sent from the parent (BuilderShell) to the iframe preview.
 *  Theme tokens, custom CSS, navbar data, churchId, and pageSlug are
 *  provided by the preview route's server component — not sent via postMessage. */
export type ParentToIframeMessage =
  | {
      type: "INIT_DATA"
      sections: BuilderSection[]
      selectedSectionId: string | null
      isNavbarEditing: boolean
    }
  | {
      type: "UPDATE_SECTIONS"
      sections: BuilderSection[]
    }
  | {
      type: "SELECT_SECTION"
      sectionId: string | null
    }
  | {
      type: "UPDATE_NAVBAR"
      isNavbarEditing: boolean
    }

// ---------------------------------------------------------------------------
// Iframe → Parent messages
// ---------------------------------------------------------------------------

/** Messages sent from the iframe preview to the parent (BuilderShell). */
export type IframeToParentMessage =
  | { type: "READY" }
  | { type: "SECTION_CLICKED"; sectionId: string }
  | { type: "SECTION_EDIT"; sectionId: string }
  | { type: "SECTION_DELETE"; sectionId: string }
  | { type: "SECTION_ADD"; afterIndex: number }
  | { type: "SECTIONS_REORDERED"; sections: BuilderSection[] }
  | { type: "NAVBAR_CLICKED" }
  | { type: "NAVBAR_LINK_CLICKED"; href: string }
  | { type: "CONTENT_HEIGHT"; height: number }
  | { type: "DESELECT" }

// ---------------------------------------------------------------------------
// Handler maps (used by listener hooks)
// ---------------------------------------------------------------------------

/** Handler callbacks for each parent → iframe message type. */
export type ParentMessageHandlers = {
  [K in ParentToIframeMessage["type"]]: (
    message: Extract<ParentToIframeMessage, { type: K }>
  ) => void
}

/** Handler callbacks for each iframe → parent message type. */
export type IframeMessageHandlers = {
  [K in IframeToParentMessage["type"]]: (
    message: Extract<IframeToParentMessage, { type: K }>
  ) => void
}

// ---------------------------------------------------------------------------
// Type-safe send functions
// ---------------------------------------------------------------------------

/**
 * Send a message from the parent frame to the iframe preview.
 * Wraps the message in the `builder-preview` envelope.
 */
export function postToIframe(
  iframe: HTMLIFrameElement,
  message: ParentToIframeMessage
): void {
  iframe.contentWindow?.postMessage(
    { source: MESSAGE_SOURCE, ...message },
    "*"
  )
}

/**
 * Send a message from the iframe preview to the parent frame.
 * Wraps the message in the `builder-preview` envelope.
 */
export function postToParent(message: IframeToParentMessage): void {
  window.parent.postMessage({ source: MESSAGE_SOURCE, ...message }, "*")
}

// ---------------------------------------------------------------------------
// Listener hooks
// ---------------------------------------------------------------------------

/**
 * Listen for messages from the parent frame inside the iframe preview.
 *
 * Filters by the `builder-preview` source envelope and dispatches to
 * the matching handler. Handlers are stored in a ref so the listener
 * does not re-register when handler identities change.
 */
export function useParentMessages(
  handlers: Partial<ParentMessageHandlers>
): void {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data as MessageEnvelope & ParentToIframeMessage
      if (!data || data.source !== MESSAGE_SOURCE) return

      const handler = handlersRef.current[
        data.type as ParentToIframeMessage["type"]
      ] as ((msg: ParentToIframeMessage) => void) | undefined
      handler?.(data)
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])
}

/**
 * Listen for messages from the iframe preview in the parent frame.
 *
 * Filters by the `builder-preview` source envelope and dispatches to
 * the matching handler. Handlers are stored in a ref so the listener
 * does not re-register when handler identities change.
 */
export function useIframeMessages(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  handlers: Partial<IframeMessageHandlers>
): void {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // Only accept messages from our iframe — reject if ref is null or source doesn't match
      if (
        !iframeRef.current ||
        event.source !== iframeRef.current.contentWindow
      ) {
        return
      }

      const data = event.data as MessageEnvelope & IframeToParentMessage
      if (!data || data.source !== MESSAGE_SOURCE) return

      const handler = handlersRef.current[
        data.type as IframeToParentMessage["type"]
      ] as ((msg: IframeToParentMessage) => void) | undefined
      handler?.(data)
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [iframeRef])
}
