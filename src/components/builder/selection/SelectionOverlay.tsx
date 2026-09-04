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

import { useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBuilder } from '../state/BuilderProvider'
import { ExternalSectionRect, useOverlay } from './useOverlay'
import { BoundingBox } from './BoundingBox'
import { ResizeHandles } from './ResizeHandles'
import { HoverHighlight } from './HoverHighlight'
import { QuickToolbar } from './QuickToolbar'

import { findNode, HandleType } from '../../../../packages/builder-core/src'

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
  const { document, canvas, dispatch } = useBuilder()
  const [resizing, setResizing] = useState<{
    handle: HandleType
    startX: number
    startY: number
    startWidth: number
    startHeight: number
    currentWidth: number
    currentHeight: number
  } | null>(null)

  // Compute toolbar data: find node in page or parent container
  const toolbarData = useMemo(() => {
    if (!overlay.toolbarPosition || !overlay.selectedSection) return null
    if (!canvas.selectedSectionId) return null

    const found = findNode(document, canvas.selectedSectionId)
    if (!found) return null

    const siblings = found.parent ? found.parent.children : found.page.sections
    const index = siblings.findIndex(s => s.id === canvas.selectedSectionId)

    return {
      position: overlay.toolbarPosition,
      sectionId: canvas.selectedSectionId,
      pageId: found.page.id,
      locked: overlay.selectedSection.locked,
      hidden: !overlay.selectedSection.visible,
      index: Math.max(0, index),
      total: Math.max(1, siblings.length),
    }
  }, [
    overlay.toolbarPosition,
    overlay.selectedSection,
    canvas.selectedSectionId,
    document,
  ])

  const handleResizeStart = useCallback((handle: HandleType, e: React.MouseEvent) => {
    if (!overlay.boundingRect || !canvas.selectedSectionId) return
    e.preventDefault()
    e.stopPropagation()

    const zoom = canvas.zoom ?? 1.0
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = overlay.boundingRect.width
    const startHeight = overlay.boundingRect.height

    setResizing({
      handle,
      startX,
      startY,
      startWidth,
      startHeight,
      currentWidth: startWidth,
      currentHeight: startHeight,
    })

    const onPointerMove = (moveEvt: PointerEvent) => {
      const deltaX = (moveEvt.clientX - startX) / zoom
      const deltaY = (moveEvt.clientY - startY) / zoom

      let w = startWidth
      let h = startHeight

      if (handle.includes('E')) w = Math.max(40, startWidth + deltaX)
      if (handle.includes('W')) w = Math.max(40, startWidth - deltaX)
      if (handle.includes('S')) h = Math.max(20, startHeight + deltaY)
      if (handle.includes('N')) h = Math.max(20, startHeight - deltaY)

      setResizing(prev => prev ? { ...prev, currentWidth: Math.round(w), currentHeight: Math.round(h) } : null)
    }

    const onPointerUp = (upEvt: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)

      const deltaX = (upEvt.clientX - startX) / zoom
      const deltaY = (upEvt.clientY - startY) / zoom

      let finalW = startWidth
      let finalH = startHeight

      if (handle.includes('E')) finalW = Math.max(40, startWidth + deltaX)
      if (handle.includes('W')) finalW = Math.max(40, startWidth - deltaX)
      if (handle.includes('S')) finalH = Math.max(20, startHeight + deltaY)
      if (handle.includes('N')) finalH = Math.max(20, startHeight - deltaY)

      const roundedW = `${Math.round(finalW)}px`
      const roundedH = `${Math.round(finalH)}px`

      const targetNodeId = canvas.selectedSectionId
      if (targetNodeId) {
        dispatch({
          type: 'SET_NODE_STYLES',
          nodeId: targetNodeId,
          styles: { width: roundedW, height: roundedH },
        })

        const found = findNode(document, targetNodeId)
        if (found) {
          dispatch({
            type: 'UPDATE_PROPS',
            pageId: found.page.id,
            sectionId: targetNodeId,
            props: { width: roundedW, height: roundedH },
          })
        }
      }

      setResizing(null)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }, [overlay.boundingRect, canvas.selectedSectionId, canvas.zoom, dispatch, document])

  const displayRect = useMemo(() => {
    if (!overlay.boundingRect) return null
    if (!resizing) return overlay.boundingRect
    return {
      ...overlay.boundingRect,
      width: resizing.currentWidth,
      height: resizing.currentHeight,
    }
  }, [overlay.boundingRect, resizing])

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
          {displayRect && (
            <>
              <BoundingBox rect={displayRect} />

              {/* Resize handles */}
              <div className="pointer-events-auto">
                <ResizeHandles
                  rect={displayRect}
                  handles={overlay.activeHandles}
                  onHandleMouseDown={handleResizeStart}
                />
              </div>

              {/* Live dimension badge during resize */}
              {resizing && (
                <div
                  style={{
                    left: displayRect.x + displayRect.width / 2,
                    top: displayRect.y + displayRect.height + 10,
                    transform: 'translateX(-50%)',
                  }}
                  className="absolute z-[120] bg-violet-600 text-white text-[11px] font-mono font-bold px-2 py-1 rounded-md shadow-xl border border-white/20 pointer-events-none whitespace-nowrap"
                >
                  {resizing.currentWidth}px × {resizing.currentHeight}px
                </div>
              )}
            </>
          )}

          {/* Quick toolbar */}
          {toolbarData && !resizing && (
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

