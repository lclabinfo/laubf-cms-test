import { useRef, useCallback } from 'react'

export type ActionLogEntry = {
  action: string
  detail?: string
  timestamp: string
}

const MAX_ENTRIES = 20

export function useActionLogger() {
  const bufferRef = useRef<ActionLogEntry[]>([])

  const log = useCallback((action: string, detail?: string) => {
    const entry: ActionLogEntry = {
      action,
      detail,
      timestamp: new Date().toISOString(),
    }
    bufferRef.current.push(entry)
    if (bufferRef.current.length > MAX_ENTRIES) {
      bufferRef.current = bufferRef.current.slice(-MAX_ENTRIES)
    }
  }, [])

  const getHistory = useCallback((): ActionLogEntry[] => {
    return [...bufferRef.current]
  }, [])

  const clear = useCallback(() => {
    bufferRef.current = []
  }, [])

  return { log, getHistory, clear }
}
