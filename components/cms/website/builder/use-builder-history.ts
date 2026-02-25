import { useState, useCallback } from "react"

const MAX_HISTORY = 50

/**
 * A generic undo/redo history hook for the website builder.
 *
 * Each entry is a deep-cloned snapshot of the state at the time `push()` was
 * called.  Calling `undo()` / `redo()` returns the previous / next snapshot so
 * the consumer can restore it.
 *
 * The hook does NOT hold a reference to the "current" state -- the caller owns
 * that.  The stack only stores *past* and *future* snapshots.
 */
export interface BuilderHistoryState<T> {
  /** Push a new snapshot onto the history stack. Clears any redo entries. */
  push: (state: T) => void
  /** Undo -- returns the previous snapshot, or `undefined` if at the start. */
  undo: (current: T) => T | undefined
  /** Redo -- returns the next snapshot, or `undefined` if at the end. */
  redo: (current: T) => T | undefined
  /** Whether undo is available. */
  canUndo: boolean
  /** Whether redo is available. */
  canRedo: boolean
  /** Reset history (e.g. when navigating to a new page). */
  reset: () => void
}

export function useBuilderHistory<T>(): BuilderHistoryState<T> {
  const [past, setPast] = useState<T[]>([])
  const [future, setFuture] = useState<T[]>([])

  const push = useCallback(
    (state: T) => {
      setPast((prev) => [
        ...prev.slice(-(MAX_HISTORY - 1)),
        structuredClone(state),
      ])
      setFuture([])
    },
    [],
  )

  const undo = useCallback(
    (current: T): T | undefined => {
      let result: T | undefined
      setPast((prev) => {
        if (prev.length === 0) return prev
        result = structuredClone(prev[prev.length - 1])
        return prev.slice(0, -1)
      })
      if (result !== undefined) {
        setFuture((prev) => [...prev, structuredClone(current)])
      }
      return result
    },
    [],
  )

  const redo = useCallback(
    (current: T): T | undefined => {
      let result: T | undefined
      setFuture((prev) => {
        if (prev.length === 0) return prev
        result = structuredClone(prev[prev.length - 1])
        return prev.slice(0, -1)
      })
      if (result !== undefined) {
        setPast((prev) => [...prev, structuredClone(current)])
      }
      return result
    },
    [],
  )

  const reset = useCallback(() => {
    setPast([])
    setFuture([])
  }, [])

  return {
    push,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    reset,
  }
}
