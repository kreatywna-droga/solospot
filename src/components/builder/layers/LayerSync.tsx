'use client'

/**
 * LayerSync — C16.4 Layer Panel Sync
 *
 * Reacts to SELECTION_CHANGED events and auto-scrolls the
 * layer tree panel to the selected section.
 *
 * Architecture:
 *   SelectionEvents → LayerSync → scrollIntoView()
 *
 * LayerSync does NOT render anything — it only reacts to events.
 * It is a "controller" component (no visual output).
 */

import { useEffect, useRef } from 'react'
import { useBuilder } from '../state/BuilderProvider'

// ---------------------------------------------------------------------------
// LayerSync
// ---------------------------------------------------------------------------

interface LayerSyncProps {
  /** Ref to the layer tree scrollable container */
  containerRef?: React.RefObject<HTMLDivElement | null>
}

export function LayerSync({ containerRef }: LayerSyncProps) {
  const { canvas } = useBuilder()
  const selectedId = canvas.selectedSectionId
  const prevIdRef = useRef<string | null>(null)

  // Auto-scroll when selection changes
  useEffect(() => {
    if (!selectedId || selectedId === prevIdRef.current) return
    prevIdRef.current = selectedId

    // Small delay to let the DOM update
    const timer = setTimeout(() => {
      const container = containerRef?.current
      if (!container) return

      // Find the layer element by data attribute
      const layerEl = container.querySelector(
        `[data-layer-id="${selectedId}"]`
      ) as HTMLElement | null

      if (layerEl) {
        layerEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })

        // Highlight flash effect
        layerEl.classList.add('bg-violet-500/30')
        setTimeout(() => {
          layerEl.classList.remove('bg-violet-500/30')
        }, 600)
      }
    }, 50)

    return () => clearTimeout(timer)
  }, [selectedId, containerRef])

  // This component renders nothing
  return null
}

