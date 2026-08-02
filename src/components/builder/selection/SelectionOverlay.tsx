'use client'

/**
 * SelectionOverlay — C16.4 Root Selection Overlay
 *
 * Composes all selection overlay sub-components:
 *   BoundingBox   → selection rectangle
 *   ResizeHandles → 8 corner/edge handles
 *   HoverHighlight → hover indicator
 *   QuickToolbar  → floating action toolbar
 *
 * Uses useOverlay to bridge core OverlayController with React.
 *
 * Architecture:
 *   BuilderCanvas
 *     ↓ data-section-id attributes on rendered sections
 *   SelectionOverlay (positioned absolutely on top of canvas)
 *     ↓
 *   useOverlay → OverlayController.computeOverlayState()
 *     ↓
 *   BoundingBox | ResizeHandles | HoverHighlight | QuickToolbar
 *
 * All actions flow through dispatch(command).
 */

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBuilder } from '../state/BuilderProvider'
import { ExternalSectionRect, useOverlay } from './useOverlay'
import { BoundingBox } from './BoundingBox'
import { ResizeHandles } from './ResizeHandles'
import { HoverHighlight } from './HoverHighlight'
import { QuickToolbar } from './QuickToolbar'

// ---------------------------------------------------------------------------
// SelectionOverlay
// ---------------------------------------------------------------------------

interface SelectionOverlayProps {
  /** The canvas container element ref (for DOM measurements) */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Optional external rects reported by iframe postMessage */
  externalRects?: Record<string, ExternalSectionRect> | null
}

export function SelectionOverlay({ containerRef, externalRects }: SelectionOverlayProps) {
  const overlay = useOverlay(containerRef, { externalRects })
  const { document, canvas } = useBuilder()

  // Compute toolbar data: find section index in page
  const toolbarData = useMemo(() => {
    if (!overlay.toolbarPosition || !overlay.selectedSection) return null
    if (!canvas.selectedPageId || !canvas.selectedSectionId) return null

    const page = document.pages.find(p => p.id === canvas.selectedPageId)
    if (!page) return null

    const index = page.sections.findIndex(s => s.id === canvas.selectedSectionId)
    if (index < 0) return null

    return {
      position: overlay.toolbarPosition,
      sectionId: canvas.selectedSectionId,
      pageId: canvas.selectedPageId,
      locked: overlay.selectedSection.locked,
      hidden: !overlay.selectedSection.visible,
      index,
      total: page.sections.length,
    }
  }, [
    overlay.toolbarPosition,
    overlay.selectedSection,
    canvas.selectedPageId,
    canvas.selectedSectionId,
    document.pages,
  ])

  return (
    <AnimatePresence>
      {overlay.visible && (
        <motion.div
          className="absolute inset-0 z-[100] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          {/* Hover highlight — rendered below selection */}
          {overlay.hoverRect && (
            <HoverHighlight rect={overlay.hoverRect} />
          )}

          {/* Selection bounding box */}
          {overlay.boundingRect && (
            <>
              <BoundingBox rect={overlay.boundingRect} />

              {/* Resize handles */}
              <div className="pointer-events-auto">
                <ResizeHandles
                  rect={overlay.boundingRect}
                  handles={overlay.activeHandles}
                />
              </div>
            </>
          )}

          {/* Quick toolbar */}
          {toolbarData && (
            <div className="pointer-events-auto">
              <QuickToolbar
                position={toolbarData.position}
                sectionId={toolbarData.sectionId}
                pageId={toolbarData.pageId}
                locked={toolbarData.locked}
                hidden={toolbarData.hidden}
                index={toolbarData.index}
                total={toolbarData.total}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

