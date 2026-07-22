'use client'

/**
 * BuilderProvider — C6.2-B
 *
 * React adapter over BuilderContext (builder-core).
 *
 * Responsibilities:
 *   - Creates a BuilderContext on mount from the provided BuilderDocument
 *   - Stores context in React state (immutable update pattern → re-render on change)
 *   - Provides dispatch() to children via hook
 *   - Manages keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)
 *   - Wires the MemoryChannel for preview sync
 *
 * ARCH NOTE: This file is the ONLY place in builder-ui that imports from builder-core.
 * All child components consume via useBuilder() hook.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  BuilderContext,
  BuilderCommand,
  BuilderDocument,
  BuilderComponentRegistry,
  CanvasState,
  HistoryStack,
  createBuilderContext,
  createBuilderComponentRegistry,
  createMemoryChannel,
  MemoryChannelPair,
} from '../../../../packages/builder-core/src/index'

// ---------------------------------------------------------------------------
// Context shape exposed to children
// ---------------------------------------------------------------------------

export interface BuilderContextValue {
  /** Current builder context (immutable snapshot) */
  ctx: BuilderContext
  /** Dispatch a command — triggers re-render with new ctx */
  dispatch: (command: BuilderCommand) => void
  /** Derived convenience: the current document */
  document: BuilderDocument
  /** Derived convenience: canvas state */
  canvas: CanvasState
  /** Derived convenience: history stack */
  history: HistoryStack<BuilderDocument>
  /** The preview channel pair (for wiring preview iframe) */
  previewChannel: MemoryChannelPair
  /** Whether the document has unsaved (unpublished) changes */
  isDirty: boolean
}

const BuilderCtx = createContext<BuilderContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface BuilderProviderProps {
  document: BuilderDocument
  registry?: BuilderComponentRegistry
  children: React.ReactNode
}

export function BuilderProvider({
  document: initialDocument,
  registry: providedRegistry,
  children,
}: BuilderProviderProps) {
  // Create the memory channel once (stable reference)
  const previewChannelRef = useRef<MemoryChannelPair>(createMemoryChannel())
  const previewChannel = previewChannelRef.current

  // Registry — use provided or create default
  const registry = useMemo(
    () => providedRegistry ?? createBuilderComponentRegistry(),
    [providedRegistry]
  )

  // BuilderContext stored in React state (immutable update → re-render)
  const [ctx, setCtx] = useState<BuilderContext>(() =>
    createBuilderContext({
      document: initialDocument,
      registry,
      preview: previewChannel.builderChannel,
    })
  )

  // dispatch — the single mutation gateway
  const dispatch = useCallback((command: BuilderCommand) => {
    setCtx(prev => prev.dispatch(command))
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac')
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey

      if (ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        dispatch({ type: 'UNDO' })
      }
      if (ctrlKey && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        dispatch({ type: 'REDO' })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [dispatch])

  // Cleanup preview channel on unmount
  useEffect(() => {
    return () => {
      previewChannel.builderChannel.destroy()
    }
  }, [previewChannel])

  const value = useMemo<BuilderContextValue>(
    () => ({
      ctx,
      dispatch,
      document: ctx.document,
      canvas: ctx.canvas,
      history: ctx.history,
      previewChannel,
      isDirty: ctx.document.isDirty,
    }),
    [ctx, dispatch, previewChannel]
  )

  return <BuilderCtx.Provider value={value}>{children}</BuilderCtx.Provider>
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useBuilder(): BuilderContextValue {
  const ctx = useContext(BuilderCtx)
  if (!ctx) {
    throw new Error('useBuilder() must be used within <BuilderProvider>')
  }
  return ctx
}

export function useBuilderDocument(): BuilderDocument {
  return useBuilder().document
}

export function useBuilderCanvas(): CanvasState {
  return useBuilder().canvas
}

export function useBuilderHistory(): {
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
} {
  const { history, dispatch } = useBuilder()
  return {
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo: () => dispatch({ type: 'UNDO' }),
    redo: () => dispatch({ type: 'REDO' }),
  }
}

export function useSelectedSection() {
  const { canvas, document } = useBuilder()
  if (!canvas.selectedSectionId || !canvas.selectedPageId) return null

  const page = document.pages.find(p => p.id === canvas.selectedPageId)
  if (!page) return null

  const pageSections = page.sections
  const targetId = canvas.selectedSectionId

  // Search recursively
  type SectionArray = typeof pageSections
  function find(nodes: SectionArray): SectionArray[0] | null {
    for (const node of nodes) {
      if (node.id === targetId) return node
      if (node.children.length > 0) {
        const found = find(node.children)
        if (found) return found
      }
    }
    return null
  }

  return find(pageSections)
}
