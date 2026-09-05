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
import { Move } from 'lucide-react'
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
    isTextNode?: boolean
    startFontSize?: number
    currentFontSize?: number
  } | null>(null)

  const [moving, setMoving] = useState<{
    startX: number
    startY: number
    startTx: number
    startTy: number
    deltaX: number
    deltaY: number
  } | null>(null)

  // Refs for hot-path drag tracking (zero re-renders during pointermove)
  const dragRef = useMemo(() => ({ deltaX: 0, deltaY: 0 }), [])
  const resizeRef = useMemo(() => ({ w: 0, h: 0, fontSize: 0 }), [])
  const overlayGroupRef = useRef<HTMLDivElement>(null)
  const moveBadgeRef = useRef<HTMLSpanElement>(null)

  const selectedFound = useMemo(() => {
    if (!canvas.selectedSectionId) return null
    return findNode(document, canvas.selectedSectionId)
  }, [document, canvas.selectedSectionId])

  const isTextNode = selectedFound?.node.type === 'text' || selectedFound?.node.type === 'heading'

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

  // ---------------------------------------------------------------------------
  // Universal Canvas Move: Dragging element via Move Grip or BoundingBox edges
  // ---------------------------------------------------------------------------
  const handleMoveStart = useCallback((e: React.MouseEvent) => {
    if (!overlay.boundingRect || !canvas.selectedSectionId) return
    e.preventDefault()
    e.stopPropagation()

    const targetNodeId = canvas.selectedSectionId
    const found = findNode(document, targetNodeId)
    if (!found) return

    const isTablet = canvas.viewport.label === 'TABLET'
    const isMobile = canvas.viewport.label === 'MOBILE'
    const activeBp = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop'

    const activeStyles = activeBp === 'desktop'
      ? (found.node.styles || {})
      : { ...(found.node.styles || {}), ...((found.node.responsive as Record<string, any>)?.[activeBp] || {}) }

    const startTx = parseInt(String(activeStyles.translateX || '0px').replace('px', '')) || 0
    const startTy = parseInt(String(activeStyles.translateY || '0px').replace('px', '')) || 0

    const zoom = canvas.zoom ?? 1.0
    const startX = e.clientX
    const startY = e.clientY

    const domEl = containerRef.current?.querySelector(`[data-section-id="${targetNodeId}"], [data-node-id="${targetNodeId}"]`) as HTMLElement | null
    const baseRotate = (activeStyles as any).rotate || '0deg'
    const baseScale = (activeStyles as any).scale || 1

    dragRef.deltaX = 0
    dragRef.deltaY = 0

    // Disable CSS transitions during hot drag path for instant 120fps tracking
    const prevTransition = domEl?.style.transition || ''
    if (domEl) {
      domEl.style.transition = 'none'
      domEl.style.willChange = 'transform'
    }

    // Show badge once at start (no per-frame re-render)
    setMoving({ startX, startY, startTx, startTy, deltaX: 0, deltaY: 0 })

    let rafId: number | null = null
    let latestClientX = startX
    let latestClientY = startY

    const onPointerMove = (moveEvt: PointerEvent) => {
      latestClientX = moveEvt.clientX
      latestClientY = moveEvt.clientY

      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null
          const deltaX = (latestClientX - startX) / zoom
          const deltaY = (latestClientY - startY) / zoom
          dragRef.deltaX = deltaX
          dragRef.deltaY = deltaY

          const curTx = startTx + Math.round(deltaX)
          const curTy = startTy + Math.round(deltaY)

          // Direct 60/120fps hardware-accelerated DOM transform
          if (domEl) {
            domEl.style.transform = `translate(${curTx}px, ${curTy}px) rotate(${baseRotate}) scale(${baseScale})`
          }
          // Synchronously move the overlay box and grip with zero lag
          if (overlayGroupRef.current) {
            overlayGroupRef.current.style.transform = `translate3d(${Math.round(deltaX)}px, ${Math.round(deltaY)}px, 0px)`
          }
          if (moveBadgeRef.current) {
            moveBadgeRef.current.textContent = `X: ${curTx}px, Y: ${curTy}px`
          }
        })
      }
    }

    const onPointerUp = (upEvt: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)

      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }

      // Reset overlay transform so document state takes over
      if (overlayGroupRef.current) {
        overlayGroupRef.current.style.transform = ''
      }
      if (domEl) {
        domEl.style.transition = prevTransition
        domEl.style.willChange = ''
      }

      const deltaX = (upEvt.clientX - startX) / zoom
      const deltaY = (upEvt.clientY - startY) / zoom

      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        const finalTx = startTx + Math.round(deltaX)
        const finalTy = startTy + Math.round(deltaY)

        if (activeBp === 'tablet' || activeBp === 'mobile') {
          const currentResp = (found.node.responsive as Record<string, any>) || {}
          const currentBpStyles = currentResp[activeBp] || {}
          dispatch({
            type: 'UPDATE_NODE',
            nodeId: targetNodeId,
            updates: {
              responsive: {
                ...currentResp,
                [activeBp]: { ...currentBpStyles, translateX: `${finalTx}px`, translateY: `${finalTy}px` },
              },
            },
            pageId: found.page.id,
          } as any)
        } else {
          dispatch({
            type: 'SET_NODE_STYLES',
            nodeId: targetNodeId,
            styles: { translateX: `${finalTx}px`, translateY: `${finalTy}px` },
          })
        }
      } else {
        if (domEl) {
          domEl.style.transform = `translate(${startTx}px, ${startTy}px) rotate(${baseRotate}) scale(${baseScale})`
        }
      }

      setMoving(null)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }, [overlay.boundingRect, canvas.selectedSectionId, canvas.viewport.label, canvas.zoom, containerRef, dispatch, document, dragRef])

  // ---------------------------------------------------------------------------
  // Universal Canvas Resize: Dragging corner or edge handles
  // ---------------------------------------------------------------------------
  const handleResizeStart = useCallback((handle: HandleType, e: React.MouseEvent) => {
    if (!overlay.boundingRect || !canvas.selectedSectionId) return
    e.preventDefault()
    e.stopPropagation()

    const targetNodeId = canvas.selectedSectionId
    const found = findNode(document, targetNodeId)
    const isTextNode = found?.node.type === 'text' || found?.node.type === 'heading'
    const isTablet = canvas.viewport.label === 'TABLET'
    const isMobile = canvas.viewport.label === 'MOBILE'
    const activeBp = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop'

    const activeStyles = isTextNode && found
      ? (activeBp === 'desktop'
          ? (found.node.styles || {})
          : { ...(found.node.styles || {}), ...((found.node.responsive as Record<string, any>)?.[activeBp] || {}) })
      : {}
    const startFontSize = parseInt(String((activeStyles as any).fontSize || '16px').replace('px', '')) || 16

    const zoom = canvas.zoom ?? 1.0
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = overlay.boundingRect.width
    const startHeight = overlay.boundingRect.height

    const domEl = containerRef.current?.querySelector(`[data-section-id="${targetNodeId}"], [data-node-id="${targetNodeId}"]`) as HTMLElement | null

    resizeRef.w = startWidth
    resizeRef.h = startHeight
    resizeRef.fontSize = startFontSize

    // Disable transitions during live resize
    const prevTransition = domEl?.style.transition || ''
    if (domEl) {
      domEl.style.transition = 'none'
      domEl.style.willChange = isTextNode ? 'font-size' : 'width, height'
    }

    // Show badge once at start
    setResizing({
      handle,
      startX,
      startY,
      startWidth,
      startHeight,
      currentWidth: startWidth,
      currentHeight: startHeight,
      isTextNode,
      startFontSize,
      currentFontSize: startFontSize,
    })

    let rafId: number | null = null
    let latestClientX = startX
    let latestClientY = startY

    const onPointerMove = (moveEvt: PointerEvent) => {
      latestClientX = moveEvt.clientX
      latestClientY = moveEvt.clientY

      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null
          const deltaX = (latestClientX - startX) / zoom
          const deltaY = (latestClientY - startY) / zoom

          let w = startWidth
          let h = startHeight

          if (handle.includes('E')) w = Math.max(40, startWidth + deltaX)
          if (handle.includes('W')) w = Math.max(40, startWidth - deltaX)
          if (handle.includes('S')) h = Math.max(20, startHeight + deltaY)
          if (handle.includes('N')) h = Math.max(20, startHeight - deltaY)

          let currentFontSize = startFontSize
          if (isTextNode) {
            let ratio = 1
            if (handle.includes('E') || handle.includes('W')) {
              ratio = w / Math.max(1, startWidth)
            } else if (handle.includes('S') || handle.includes('N')) {
              ratio = h / Math.max(1, startHeight)
            } else {
              ratio = Math.max(w / Math.max(1, startWidth), h / Math.max(1, startHeight))
            }
            currentFontSize = Math.min(150, Math.max(8, Math.round(startFontSize * ratio)))
          }

          resizeRef.w = Math.round(w)
          resizeRef.h = Math.round(h)
          resizeRef.fontSize = currentFontSize

          // Direct 60fps DOM preview — zero re-renders
          if (domEl) {
            if (isTextNode) {
              domEl.style.fontSize = `${currentFontSize}px`
            } else {
              if (handle.includes('E') || handle.includes('W')) domEl.style.width = `${Math.round(w)}px`
              if (handle.includes('S') || handle.includes('N')) domEl.style.height = `${Math.round(h)}px`
            }
          }
        })
      }
    }

    const onPointerUp = (upEvt: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)

      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }

      if (domEl) {
        domEl.style.transition = prevTransition
        domEl.style.willChange = ''
      }

      const deltaX = (upEvt.clientX - startX) / zoom
      const deltaY = (upEvt.clientY - startY) / zoom

      let finalW = startWidth
      let finalH = startHeight

      if (handle.includes('E')) finalW = Math.max(40, startWidth + deltaX)
      if (handle.includes('W')) finalW = Math.max(40, startWidth - deltaX)
      if (handle.includes('S')) finalH = Math.max(20, startHeight + deltaY)
      if (handle.includes('N')) finalH = Math.max(20, startHeight - deltaY)

      if (found) {
        if (isTextNode) {
          let ratio = 1
          if (handle.includes('E') || handle.includes('W')) {
            ratio = finalW / Math.max(1, startWidth)
          } else if (handle.includes('S') || handle.includes('N')) {
            ratio = finalH / Math.max(1, startHeight)
          } else {
            ratio = Math.max(finalW / Math.max(1, startWidth), finalH / Math.max(1, startHeight))
          }
          const finalFontSize = `${Math.min(150, Math.max(8, Math.round(startFontSize * ratio)))}px`

          if (activeBp === 'tablet' || activeBp === 'mobile') {
            const currentResp = (found.node.responsive as Record<string, any>) || {}
            const currentBpStyles = currentResp[activeBp] || {}
            dispatch({
              type: 'UPDATE_NODE',
              nodeId: targetNodeId,
              updates: {
                responsive: {
                  ...currentResp,
                  [activeBp]: { ...currentBpStyles, fontSize: finalFontSize },
                },
              },
              pageId: found.page.id,
            } as any)
          } else {
            dispatch({
              type: 'SET_NODE_STYLES',
              nodeId: targetNodeId,
              styles: { fontSize: finalFontSize },
            })
          }
        } else {
          const finalWidthStr = `${Math.round(finalW)}px`
          const finalHeightStr = `${Math.round(finalH)}px`

          if (activeBp === 'tablet' || activeBp === 'mobile') {
            const currentResp = (found.node.responsive as Record<string, any>) || {}
            const currentBpStyles = currentResp[activeBp] || {}
            dispatch({
              type: 'UPDATE_NODE',
              nodeId: targetNodeId,
              updates: {
                responsive: {
                  ...currentResp,
                  [activeBp]: { ...currentBpStyles, width: finalWidthStr, height: finalHeightStr },
                },
              },
              pageId: found.page.id,
            } as any)
          } else {
            dispatch({
              type: 'SET_NODE_STYLES',
              nodeId: targetNodeId,
              styles: { width: finalWidthStr, height: finalHeightStr },
            })

            dispatch({
              type: 'UPDATE_PROPS',
              pageId: found.page.id,
              sectionId: targetNodeId,
              props: { width: finalWidthStr, height: finalHeightStr },
            })
          }
        }
      }

      setResizing(null)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }, [overlay.boundingRect, canvas.selectedSectionId, canvas.viewport.label, canvas.zoom, containerRef, dispatch, document, resizeRef])

  const displayRect = useMemo(() => {
    if (!overlay.boundingRect) return null
    let rect = overlay.boundingRect
    if (resizing) {
      rect = {
        ...rect,
        width: resizing.currentWidth,
        height: resizing.currentHeight,
      }
    }
    if (moving) {
      rect = {
        ...rect,
        x: rect.x + moving.deltaX,
        y: rect.y + moving.deltaY,
      }
    }
    return rect
  }, [overlay.boundingRect, resizing, moving])

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

          {/* Selection bounding box & interactive handles */}
          {displayRect && (
            <div ref={overlayGroupRef} className="absolute inset-0 pointer-events-none">
              <BoundingBox
                rect={displayRect}
                onMoveStart={handleMoveStart}
                isTextNode={isTextNode}
              />

              {/* Move Grip Handle — pointer capture for smooth drag even at high velocity */}
              <div
                style={{
                  left: displayRect.x + displayRect.width / 2,
                  top: displayRect.y - 8,
                  transform: 'translate(-50%, -100%)',
                }}
                onPointerDown={(e) => {
                  // Capture pointer so drag continues even if mouse leaves the element
                  e.currentTarget.setPointerCapture(e.pointerId)
                }}
                onMouseDown={handleMoveStart}
                className="absolute z-[125] pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 bg-[#121124] hover:bg-violet-600 text-violet-200 hover:text-white text-[11px] font-medium rounded-lg shadow-xl border border-violet-500/40 cursor-grab active:cursor-grabbing transition-all select-none group touch-none"
                title="Przeciągnij myszą, aby swobodnie przesunąć element po Canvasie"
              >
                <Move className="w-3.5 h-3.5 text-violet-400 group-hover:text-white transition-colors" />
                <span className="font-semibold">Przesuń</span>
                <span
                  ref={moveBadgeRef}
                  className={`ml-1 text-[10px] font-mono text-violet-200 bg-black/40 px-1.5 py-0.5 rounded border border-white/10 ${moving ? '' : 'hidden'}`}
                >
                  {moving ? `X: ${moving.startTx + Math.round(moving.deltaX)}px, Y: ${moving.startTy + Math.round(moving.deltaY)}px` : ''}
                </span>
              </div>

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
                  className="absolute z-[120] bg-violet-600 text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg shadow-xl border border-white/20 pointer-events-none whitespace-nowrap flex items-center gap-1.5"
                >
                  {resizing.isTextNode ? (
                    <>
                      <span className="text-violet-200 text-[10px] uppercase">Czcionka:</span>
                      <span>{resizing.currentFontSize}px</span>
                    </>
                  ) : (
                    <span>{resizing.currentWidth}px × {resizing.currentHeight}px</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick toolbar */}
          {toolbarData && !resizing && !moving && (
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

