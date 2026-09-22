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

import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Move } from 'lucide-react'
import { useBuilder } from '../state/BuilderProvider'
import { ExternalSectionRect, useOverlay, readCurrentScale } from './useOverlay'
import { BoundingBox } from './BoundingBox'
import { ResizeHandles } from './ResizeHandles'
import { HoverHighlight } from './HoverHighlight'
import { QuickToolbar } from './QuickToolbar'
import { ContextualSettingsPanel } from '../contextual/ContextualSettingsPanel'

import {
  findNode,
  HandleType,
  computeSectionSnap,
  SectionBounds,
  SectionSnapResult,
  OverlayRect,
  SmartGuideEngine,
  createContainerBounds,
  DEFAULT_SMART_GUIDE_CONFIG,
} from '../../../../packages/builder-core/src'
import { collectCanvasElementBounds } from '../canvas/guides/useSmartGuides'



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
    isButtonNode?: boolean
    startFontSize?: number
    currentFontSize?: number
    liveRect?: OverlayRect
  } | null>(null)

  const [moving, setMoving] = useState<{
    startX: number
    startY: number
    startTx: number
    startTy: number
    deltaX: number
    deltaY: number
  } | null>(null)

  // Contextual Settings Panel state
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
  const [settingsPanelRect, setSettingsPanelRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  // Refs for hot-path drag tracking (zero re-renders during pointermove)
  const dragRef = useMemo(() => ({ deltaX: 0, deltaY: 0 }), [])
  const resizeRef = useMemo(() => ({
    w: 0,
    h: 0,
    fontSize: 0,
    deltaTx: 0,
    deltaTy: 0,
    curTx: 0,
    curTy: 0,
  }), [])
  const overlayGroupRef = useRef<HTMLDivElement>(null)
  const moveBadgeRef = useRef<HTMLSpanElement>(null)

  const selectedFound = useMemo(() => {
    if (!canvas.selectedSectionId) return null
    return findNode(document, canvas.selectedSectionId)
  }, [document, canvas.selectedSectionId])

  const isTextNode = selectedFound?.node.type === 'text' || selectedFound?.node.type === 'heading'
  const hasChildren = Boolean(selectedFound?.node.children && selectedFound.node.children.length > 0)

  const [isInlineEditing, setIsInlineEditing] = useState(false)

  useEffect(() => {
    const handleFocus = () => {
      const active = window.document.activeElement
      const isEditing = active?.getAttribute('data-inline-edit') === 'text' || (active as HTMLElement)?.isContentEditable === true
      setIsInlineEditing(Boolean(isEditing))
    }
    window.document.addEventListener('focusin', handleFocus)
    window.document.addEventListener('focusout', handleFocus)
    return () => {
      window.document.removeEventListener('focusin', handleFocus)
      window.document.removeEventListener('focusout', handleFocus)
    }
  }, [])

  // Close contextual settings panel when selection changes
  useEffect(() => {
    setSettingsPanelOpen(false)
    setSettingsPanelRect(null)
  }, [canvas.selectedSectionId])

  // Synchronize overlay frame position with direct canvas node dragging in real-time
  useEffect(() => {
    const handleNodeDragMove = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail && detail.nodeId === canvas.selectedSectionId && overlayGroupRef.current) {
        overlayGroupRef.current.style.transform = `translate3d(${detail.deltaX}px, ${detail.deltaY}px, 0px)`
        if (moveBadgeRef.current) {
          moveBadgeRef.current.textContent = `X: ${detail.curTx}px, Y: ${detail.curTy}px`
          moveBadgeRef.current.classList.remove('hidden')
        }
      }
    }

    const handleNodeDragEnd = () => {
      if (overlayGroupRef.current) {
        overlayGroupRef.current.style.transform = ''
      }
      if (moveBadgeRef.current) {
        moveBadgeRef.current.classList.add('hidden')
      }
    }

    window.addEventListener('solospot:node-drag-move', handleNodeDragMove)
    window.addEventListener('solospot:node-drag-end', handleNodeDragEnd)
    return () => {
      window.removeEventListener('solospot:node-drag-move', handleNodeDragMove)
      window.removeEventListener('solospot:node-drag-end', handleNodeDragEnd)
    }
  }, [canvas.selectedSectionId])

  const handleDoubleClickText = useCallback((e: React.MouseEvent) => {
    const targetNodeId = canvas.selectedSectionId
    if (!targetNodeId) return
    const el = containerRef.current?.querySelector(`[data-node-id="${targetNodeId}"] [data-inline-edit="text"], [data-section-id="${targetNodeId}"] [data-inline-edit="text"]`) as HTMLElement | null
    if (el) {
      el.contentEditable = 'true'
      el.focus()
      const sel = window.getSelection()
      if (sel) {
        const range = window.document.createRange()
        range.selectNodeContents(el)
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
  }, [canvas.selectedSectionId, containerRef])

  // Compute toolbar data: find node in page or parent container
  // ---------------------------------------------------------------------------
  // Universal Canvas Move: Dragging element via Move Grip or BoundingBox edges
  // Supports MAGNETIC SECTION SNAP with zoom-aware threshold & flow reflow
  // ---------------------------------------------------------------------------
  const handleMoveStart = useCallback((e: React.MouseEvent) => {
    if (!overlay.boundingRect || !canvas.selectedSectionId) return
    e.preventDefault()
    e.stopPropagation()

    const targetNodeId = canvas.selectedSectionId
    const found = findNode(document, targetNodeId)
    if (!found) return

    const isSection = found.node.type === 'section' || found.page.sections.some(s => s.id === targetNodeId)

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

    // Measure sibling sections for magnetic snapping if dragging a section
    const sectionsBounds: SectionBounds[] = []
    const container = containerRef.current
    const containerRect = container ? container.getBoundingClientRect() : { left: 0, top: 0, width: 1200, height: 800 }
    if (container && isSection) {
      found.page.sections.forEach((s, idx) => {
        const el = container.querySelector(`[data-section-id="${s.id}"]`) as HTMLElement | null
        if (el) {
          const r = el.getBoundingClientRect()
          const sStyles = s.styles || {}
          const sTx = parseInt(String(sStyles.translateX || '0px').replace('px', '')) || 0
          const sTy = parseInt(String(sStyles.translateY || '0px').replace('px', '')) || 0
          const left = (r.left - containerRect.left) / zoom - sTx
          const top = (r.top - containerRect.top) / zoom - sTy
          const width = r.width / zoom
          const height = r.height / zoom
          sectionsBounds.push({
            id: s.id,
            label: s.label || `Sekcja #${idx + 1}`,
            index: idx,
            left,
            top,
            bottom: top + height,
            height,
            right: left + width,
            width,
          })
        }
      })
    }
    const myBounds = sectionsBounds.find(s => s.id === targetNodeId)
    const naturalTop = myBounds?.top ?? (overlay.boundingRect.y - startTy)
    const naturalLeft = myBounds?.left ?? (overlay.boundingRect.x - startTx)
    const pageWidth = container ? container.clientWidth : 1200

    // Initialize Smart Guide Engine & Canvas Element Bounds for real-time alignment
    const smartGuideEngine = new SmartGuideEngine()
    const allElementBounds = collectCanvasElementBounds(containerRef.current, zoom, targetNodeId)
    const containerBounds = createContainerBounds({
      width: container ? container.clientWidth : 1200,
      height: container ? Math.max(container.scrollHeight, 800) : 800,
    })

    // Disable CSS transitions during hot drag path for instant 120fps tracking
    const prevTransition = domEl?.style.transition || ''
    if (domEl) {
      domEl.style.setProperty('transition', 'none', 'important')
      domEl.style.setProperty('will-change', 'transform', 'important')
      domEl.querySelectorAll('*').forEach(c => {
        (c as HTMLElement).style?.setProperty('transition', 'none', 'important')
      })
    }
    if (overlayGroupRef.current) {
      overlayGroupRef.current.style.setProperty('transition', 'none', 'important')
      overlayGroupRef.current.style.setProperty('will-change', 'transform', 'important')
    }

    // Show badge once at start (no per-frame re-render)
    setMoving({ startX, startY, startTx, startTy, deltaX: 0, deltaY: 0 })

    let rafId: number | null = null
    let latestClientX = startX
    let latestClientY = startY

    const onMove = (moveEvt: MouseEvent | PointerEvent) => {
      latestClientX = moveEvt.clientX
      latestClientY = moveEvt.clientY

      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null
          const deltaX = (latestClientX - startX) / zoom
          const deltaY = (latestClientY - startY) / zoom
          dragRef.deltaX = deltaX
          dragRef.deltaY = deltaY

          let curTx = startTx + Math.round(deltaX)
          let curTy = startTy + Math.round(deltaY)

          const currentLeft = naturalLeft + curTx
          const currentTop = naturalTop + curTy

          // Live Smart Guide Engine computation for all elements & sections
          const guideRes = smartGuideEngine.computeAll({
            draggingElement: {
              id: targetNodeId,
              x: currentLeft,
              y: currentTop,
              width: overlay.boundingRect?.width || 200,
              height: overlay.boundingRect?.height || 100,
            },
            allElements: allElementBounds,
            container: containerBounds,
            config: {
              ...DEFAULT_SMART_GUIDE_CONFIG,
              threshold: Math.max(8, 12 / zoom),
              showAlignmentGuides: true,
              showCenterGuides: true,
              showDistanceGuides: false,
              showSpacingGuides: false,
              snapToGuides: true,
            },
          })

          if (guideRes.snapGuidance.snapped) {
            if (guideRes.snapGuidance.snapAxis === 'X' || guideRes.snapGuidance.snapAxis === 'BOTH') {
              curTx = Math.round(guideRes.snapGuidance.x - naturalLeft)
            }
            if (guideRes.snapGuidance.snapAxis === 'Y' || guideRes.snapGuidance.snapAxis === 'BOTH') {
              curTy = Math.round(guideRes.snapGuidance.y - naturalTop)
            }
          }

          // Broadcast live smart guides to SmartGuidesOverlay — strictly single crisp snapped lines
          const activeGuidesToRender = guideRes.snapGuidance.snapped
            ? guideRes.snapGuidance.guides
            : []
          window.dispatchEvent(new CustomEvent('solospot:smart-guides-update', {
            detail: { guides: activeGuidesToRender }
          }))

          if (isSection && overlay.boundingRect) {
            const snapRes = computeSectionSnap({
              draggingSectionId: targetNodeId,
              currentLeft,
              currentTop,
              width: overlay.boundingRect.width,
              height: overlay.boundingRect.height,
              naturalTop,
              naturalLeft,
              sections: sectionsBounds,
              pageWidth,
              zoom,
              threshold: 16,
            })

            if (snapRes.snapped) {
              if (snapRes.snappedX) curTx = snapRes.curTx
              if (snapRes.snappedY) curTy = snapRes.curTy
            }
          }

          // Direct 60/120fps hardware-accelerated DOM transform
          if (domEl) {
            domEl.style.transform = `translate3d(${curTx}px, ${curTy}px, 0px) rotate(${baseRotate}) scale(${baseScale})`
          }
          // Synchronously move the overlay box and grip with zero lag
          if (overlayGroupRef.current) {
            overlayGroupRef.current.style.transform = `translate3d(${curTx - startTx}px, ${curTy - startTy}px, 0px)`
          }
          if (moveBadgeRef.current) {
            moveBadgeRef.current.textContent = `X: ${curTx}px, Y: ${curTy}px`
          }
        })
      }
    }

    const onUp = (upEvt: MouseEvent | PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('pointercancel', onUp)

      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }

      // Clear smart guides on canvas overlay
      window.dispatchEvent(new CustomEvent('solospot:smart-guides-update', {
        detail: { guides: [] }
      }))

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

      if (isSection && overlay.boundingRect) {
        const currentLeft = naturalLeft + startTx + deltaX
        const currentTop = naturalTop + startTy + deltaY
        const finalSnap = computeSectionSnap({
          draggingSectionId: targetNodeId,
          currentLeft,
          currentTop,
          width: overlay.boundingRect.width,
          height: overlay.boundingRect.height,
          naturalTop,
          naturalLeft,
          sections: sectionsBounds,
          pageWidth,
          zoom,
          threshold: 16,
        })

        if (finalSnap.snapped) {
          if (finalSnap.reorderTargetIndex !== undefined && myBounds && finalSnap.reorderTargetIndex !== myBounds.index) {
            dispatch({
              type: 'MOVE_SECTION',
              pageId: found.page.id,
              fromIndex: myBounds.index,
              toIndex: finalSnap.reorderTargetIndex,
            })
            dispatch({
              type: 'SET_NODE_STYLES',
              nodeId: targetNodeId,
              styles: { translateX: '0px', translateY: '0px' },
            })
          } else {
            const finalTx = finalSnap.snappedX ? finalSnap.curTx : (startTx + Math.round(deltaX))
            const finalTy = finalSnap.snappedY ? finalSnap.curTy : (startTy + Math.round(deltaY))
            dispatch({
              type: 'SET_NODE_STYLES',
              nodeId: targetNodeId,
              styles: { translateX: `${finalTx}px`, translateY: `${finalTy}px` },
            })
          }
          setMoving(null)
          return
        }
      }

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

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('pointercancel', onUp)
  }, [overlay.boundingRect, canvas.selectedSectionId, canvas.viewport.label, canvas.zoom, containerRef, dispatch, document, dragRef])

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Universal Canvas Resize: Dragging corner or edge handles
  // REAL-TIME LIVE RESIZE: 60fps DOM + BoundingBox + Handles + Toolbar update
  // ---------------------------------------------------------------------------
  const handleResizeStart = useCallback((handle: HandleType, e: React.MouseEvent) => {
    if (!overlay.boundingRect || !canvas.selectedSectionId) return
    e.preventDefault()
    e.stopPropagation()

    const targetNodeId = canvas.selectedSectionId
    const found = findNode(document, targetNodeId)
    const isHeadingNode = found?.node.type === 'heading'
    const isTextNode = found?.node.type === 'text' || isHeadingNode
    const isButtonNode = found?.node.type === 'button'
    const isTablet = canvas.viewport.label === 'TABLET'
    const isMobile = canvas.viewport.label === 'MOBILE'
    const activeBp = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop'

    const activeStyles = found
      ? (activeBp === 'desktop'
          ? (found.node.styles || {})
          : { ...(found.node.styles || {}), ...((found.node.responsive as Record<string, any>)?.[activeBp] || {}) })
      : {}

    const zoom = canvas.zoom ?? 1.0
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = overlay.boundingRect.width
    const startHeight = overlay.boundingRect.height

    const domEl = containerRef.current?.querySelector(`[data-section-id="${targetNodeId}"], [data-node-id="${targetNodeId}"]`) as HTMLElement | null

    // Measure accurate computed font size directly from the active DOM element
    const textTarget = isButtonNode
      ? domEl?.querySelector<HTMLElement>('button')
      : (domEl?.querySelector<HTMLElement>('[data-inline-edit="text"], h1, h2, h3, h4, h5, h6, p, span') || domEl)
    const computedFs = textTarget ? parseFloat(window.getComputedStyle(textTarget).fontSize) : NaN
    const startFontSize = !isNaN(computedFs) && computedFs > 0
      ? Math.round(computedFs)
      : (parseInt(String((activeStyles as any).fontSize || (isHeadingNode ? '36px' : isButtonNode ? '14px' : '16px')).replace('px', '')) || 16)

    resizeRef.w = startWidth
    resizeRef.h = startHeight
    resizeRef.fontSize = startFontSize

    // Disable transitions during live resize for instant 60/120fps tracking
    const prevTransition = domEl?.style.transition || ''
    if (domEl) {
      domEl.style.setProperty('transition', 'none', 'important')
      domEl.querySelectorAll('*').forEach((el: any) => {
        if (el.style) {
          el.style.setProperty('transition', 'none', 'important')
        }
      })
      domEl.style.willChange = (isTextNode || isButtonNode) ? 'font-size, width, height' : 'width, height'
    }

    // Show badge and initial resize state
    setResizing({
      handle,
      startX,
      startY,
      startWidth,
      startHeight,
      currentWidth: startWidth,
      currentHeight: startHeight,
      isTextNode,
      isButtonNode,
      startFontSize,
      currentFontSize: startFontSize,
    })

    const onPointerMove = (moveEvt: MouseEvent | PointerEvent) => {
      const latestClientX = moveEvt.clientX
      const latestClientY = moveEvt.clientY

      const deltaX = (latestClientX - startX) / zoom
      const deltaY = (latestClientY - startY) / zoom

      let w = startWidth
      let h = startHeight

      if (handle.includes('E')) w = Math.max(20, startWidth + deltaX)
      if (handle.includes('W')) w = Math.max(20, startWidth - deltaX)
      if (handle.includes('S')) h = Math.max(20, startHeight + deltaY)
      if (handle.includes('N')) h = Math.max(20, startHeight - deltaY)

      let currentFontSize = startFontSize

      if (isButtonNode) {
        // BUTTON: Box dimensions only. Text inside button does NOT scale!
        // "NAPIS W PRZYCISKU NIE POWINIEN SIE SKALOWAĆ . TO POWINIEN BYC ODDZIELNY ELEMENT KTÓRY POTEM DOPASOWYWUJE."
        currentFontSize = startFontSize
      } else if (isTextNode) {
        // TEXT / HEADING:
        // "ROZCIAGANIE DZIAŁA TYLKO Z PUNKTAMI W NAROZNIKACH SRODKOWE KROPKI SŁUZA DO ZMNIEJSZANIA I POWIEKSZANIA OKNA ALBO NA BOKI ALBO DO GÓRY I NADÓŁ"
        // "POPRAW JEWSZCZE KIEDY POMNIEJSZE NAPIS I BEDE CHCIAC ZNORMALIZOWAC CZYLI WYRÓWNAC DOCIAGAJAC RAMKE DO NAPISU ABY PRZY TYM NIE ZMNIEJSZAŁ SIE NAPIS."
        if (handle.length === 2) {
          // Corner handles ONLY (SE, SW, NE, NW): scale both font-size and width proportionally
          const ratioW = w / Math.max(1, startWidth)
          const ratioH = h / Math.max(1, startHeight)
          const ratio = Math.abs(ratioW - 1) >= Math.abs(ratioH - 1) ? ratioW : ratioH
          currentFontSize = Math.min(200, Math.max(8, Math.round(startFontSize * ratio)))
        } else {
          // Middle edge handles (E, W, S, N): Window/box resize only — NEVER change font size!
          currentFontSize = startFontSize
        }
      }

      resizeRef.w = Math.round(w)
      resizeRef.h = Math.round(h)
      resizeRef.fontSize = currentFontSize

      // 1. Direct synchronous DOM preview — ZERO LATENCY (0ms)
      if (domEl) {
        if (isButtonNode) {
          domEl.style.setProperty('width', `${Math.round(w)}px`, 'important')
          domEl.style.setProperty('height', `${Math.round(h)}px`, 'important')

          const btnChildren = domEl.querySelectorAll<HTMLElement>('button')
          btnChildren.forEach(b => {
            b.style.setProperty('width', '100%', 'important')
            b.style.setProperty('height', '100%', 'important')
            b.style.setProperty('transition', 'none', 'important')
          })
        } else if (isTextNode) {
          if (handle.length === 2) {
            // Corner handles: set font size and width
            domEl.style.setProperty('font-size', `${currentFontSize}px`, 'important')
            domEl.style.setProperty('width', `${Math.round(w)}px`, 'important')

            // Target child headings, paragraphs, spans directly
            const textEls = domEl.querySelectorAll<HTMLElement>('[data-inline-edit="text"], h1, h2, h3, h4, h5, h6, p, span')
            textEls.forEach(el => {
              el.style.setProperty('font-size', `${currentFontSize}px`, 'important')
              el.style.setProperty('line-height', '1.15', 'important')
              el.style.setProperty('transition', 'none', 'important')
            })
          } else if (handle === 'E' || handle === 'W') {
            // Middle width dots: change ONLY width of container ("na boki")
            domEl.style.setProperty('width', `${Math.round(w)}px`, 'important')
          } else if (handle === 'S' || handle === 'N') {
            // Middle height dots: change ONLY height of container ("do góry i na dół")
            domEl.style.setProperty('min-height', `${Math.round(h)}px`, 'important')
            domEl.style.setProperty('height', `${Math.round(h)}px`, 'important')
          }
        } else {
          if (handle.includes('E') || handle.includes('W')) domEl.style.width = `${Math.round(w)}px`
          if (handle.includes('S') || handle.includes('N')) {
            domEl.style.height = `${Math.round(h)}px`
            if (found?.node.type === 'section') {
              domEl.style.minHeight = `${Math.round(h)}px`
            }
          }

          // Synchronously stretch all inner visual elements to 100% of the bounding container
          const innerVisuals = domEl.querySelectorAll<HTMLElement>('button, img, video, svg, canvas')
          innerVisuals.forEach(v => {
            v.style.width = '100%'
            v.style.height = '100%'
            v.style.minHeight = '100%'
          })
        }
      }

      // 2. Measure actual ground-truth element rectangle from the browser.
      // This automatically and perfectly tracks flex centering, grid placement, margins,
      // and natural alignment with 0px offset, preventing the selection box from escaping.
      let liveRect: OverlayRect | undefined = undefined
      const container = containerRef.current
      if (container && domEl) {
        const zoomWrapper = container.parentElement
        const actualScale = zoomWrapper ? readCurrentScale(zoomWrapper) : (zoom || 1)
        const containerRect = container.getBoundingClientRect()
        const elRect = domEl.getBoundingClientRect()

        liveRect = {
          x: (elRect.left - containerRect.left) / actualScale,
          y: (elRect.top - containerRect.top) / actualScale,
          width: elRect.width / actualScale,
          height: elRect.height / actualScale,
          visible: true,
          zIndex: overlay.boundingRect?.zIndex ?? 100,
          rotation: overlay.boundingRect?.rotation ?? 0,
          scale: overlay.boundingRect?.scale ?? 1,
          viewport: overlay.boundingRect?.viewport ?? {
            label: canvas.viewport.label as any,
            width: canvas.viewport.width,
            zoom: 1.0,
            offsetX: 0,
            offsetY: 0,
          },
        }
      }

      // 3. Instant frame update: keeps BoundingBox and handles glued to the element with 0ms lag
      setResizing({
        handle,
        startX,
        startY,
        startWidth,
        startHeight,
        currentWidth: Math.round(w),
        currentHeight: Math.round(h),
        isTextNode,
        isButtonNode,
        startFontSize,
        currentFontSize,
        liveRect,
      })
    }

    const onPointerUp = (upEvt: MouseEvent | PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('mouseup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)

      if (domEl) {
        domEl.style.transition = prevTransition
        domEl.style.willChange = ''
      }

      const finalW = resizeRef.w || startWidth
      const finalH = resizeRef.h || startHeight
      const finalFontSizeNum = resizeRef.fontSize || startFontSize

      if (found) {
        if (isButtonNode) {
          const finalWidthStr = `${Math.round(finalW)}px`
          const finalHeightStr = `${Math.round(finalH)}px`

          const styleUpdates: Record<string, any> = {
            width: finalWidthStr,
            height: finalHeightStr,
          }

          if (activeBp === 'tablet' || activeBp === 'mobile') {
            const currentResp = (found.node.responsive as Record<string, any>) || {}
            const currentBpStyles = currentResp[activeBp] || {}
            dispatch({
              type: 'UPDATE_NODE',
              nodeId: targetNodeId,
              updates: {
                responsive: {
                  ...currentResp,
                  [activeBp]: { ...currentBpStyles, ...styleUpdates },
                },
              },
              pageId: found.page.id,
            } as any)
          } else {
            dispatch({
              type: 'SET_NODE_STYLES',
              nodeId: targetNodeId,
              styles: styleUpdates,
            })
            dispatch({
              type: 'UPDATE_PROPS',
              pageId: found.page.id,
              sectionId: targetNodeId,
              props: styleUpdates,
            })
          }
        } else if (isTextNode) {
          const finalWidthStr = `${Math.round(finalW)}px`
          const finalHeightStr = `${Math.round(finalH)}px`

          const styleUpdates: Record<string, any> = {}
          if (handle.length === 2) {
            // Corner handles ONLY: update both font-size and width
            styleUpdates.fontSize = `${finalFontSizeNum}px`
            styleUpdates.width = finalWidthStr
          } else if (handle === 'E' || handle === 'W') {
            // Middle width dots: update ONLY width (normalizing frame to text)
            styleUpdates.width = finalWidthStr
          } else if (handle === 'S' || handle === 'N') {
            // Middle height dots: update ONLY height/minHeight
            styleUpdates.minHeight = finalHeightStr
          }

          if (activeBp === 'tablet' || activeBp === 'mobile') {
            const currentResp = (found.node.responsive as Record<string, any>) || {}
            const currentBpStyles = currentResp[activeBp] || {}
            dispatch({
              type: 'UPDATE_NODE',
              nodeId: targetNodeId,
              updates: {
                responsive: {
                  ...currentResp,
                  [activeBp]: { ...currentBpStyles, ...styleUpdates },
                },
              },
              pageId: found.page.id,
            } as any)
          } else {
            dispatch({
              type: 'SET_NODE_STYLES',
              nodeId: targetNodeId,
              styles: styleUpdates,
            })
            dispatch({
              type: 'UPDATE_PROPS',
              pageId: found.page.id,
              sectionId: targetNodeId,
              props: styleUpdates,
            })
          }
        } else {
          const finalWidthStr = `${Math.round(finalW)}px`
          const finalHeightStr = `${Math.round(finalH)}px`

          const styleUpdates: Record<string, any> = {}
          if (handle.includes('E') || handle.includes('W')) styleUpdates.width = finalWidthStr
          if (handle.includes('S') || handle.includes('N')) {
            styleUpdates.height = finalHeightStr
            if (found.node.type === 'section') {
              styleUpdates.minHeight = finalHeightStr
            }
          }

          if (activeBp === 'tablet' || activeBp === 'mobile') {
            const currentResp = (found.node.responsive as Record<string, any>) || {}
            const currentBpStyles = currentResp[activeBp] || {}
            dispatch({
              type: 'UPDATE_NODE',
              nodeId: targetNodeId,
              updates: {
                responsive: {
                  ...currentResp,
                  [activeBp]: { ...currentBpStyles, ...styleUpdates },
                },
              },
              pageId: found.page.id,
            } as any)
          } else {
            dispatch({
              type: 'SET_NODE_STYLES',
              nodeId: targetNodeId,
              styles: styleUpdates,
            })

            dispatch({
              type: 'UPDATE_PROPS',
              pageId: found.page.id,
              sectionId: targetNodeId,
              props: styleUpdates,
            })
          }
        }
      }

      setResizing(null)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('mousemove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('mouseup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }, [overlay.boundingRect, canvas.selectedSectionId, canvas.viewport.label, canvas.zoom, containerRef, dispatch, document, resizeRef])

  const displayRect = useMemo(() => {
    if (resizing?.liveRect) {
      return resizing.liveRect
    }
    if (!overlay.boundingRect) return null
    let rect = overlay.boundingRect
    if (moving) {
      rect = {
        ...rect,
        x: rect.x + moving.deltaX,
        y: rect.y + moving.deltaY,
      }
    }
    return rect
  }, [overlay.boundingRect, resizing, moving])

  // Compute toolbar data: find node in page or parent container
  const toolbarData = useMemo(() => {
    if (!overlay.toolbarPosition || !overlay.selectedSection) return null
    if (!canvas.selectedSectionId) return null

    const found = findNode(document, canvas.selectedSectionId)
    if (!found) return null

    const siblings = found.parent ? found.parent.children : found.page.sections
    const index = siblings.findIndex(s => s.id === canvas.selectedSectionId)

    const isSection = found.node.type === 'section' || found.page.sections.some(s => s.id === canvas.selectedSectionId)

    // For a SECTION / BANNER:
    // Position the contextual toolbar at the TOP, INSIDE the banner (displayRect.y + 14px),
    // NEVER at the bottom where it collides with "+ Dodaj Sekcję z Biblioteki" and column controls!
    const position = isSection && displayRect
      ? {
          x: displayRect.x + displayRect.width / 2,
          y: displayRect.y + 14,
          position: 'top' as const,
        }
      : overlay.toolbarPosition

    return {
      position,
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
    displayRect,
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

          {/* Selection bounding box & interactive handles */}
          {displayRect && (
            <div ref={overlayGroupRef} className="absolute inset-0 pointer-events-none">
              <BoundingBox
                rect={displayRect}
                onMoveStart={handleMoveStart}
                isTextNode={isTextNode}
                hasChildren={hasChildren}
                isEditingText={isInlineEditing}
                onDoubleClick={handleDoubleClickText}
              />

              {/* Move Grip Handle — smooth drag anywhere */}
              <div
                style={{
                  left: displayRect.x + displayRect.width / 2,
                  top: displayRect.y - 8,
                  transform: 'translate(-50%, -100%)',
                }}
                onMouseDown={handleMoveStart}
                className="absolute z-[125] pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 bg-[#18181B] hover:bg-[#D9A86C] text-zinc-300 hover:text-white text-[11px] font-medium rounded-lg shadow-xl border border-[#D9A86C]/40 cursor-grab active:cursor-grabbing transition-all select-none group touch-none"
                title="Przeciągnij myszą, aby swobodnie przesunąć element po Canvasie"
              >
                <Move className="w-3.5 h-3.5 text-[#F2C27F] group-hover:text-white transition-colors" />
                <span className="font-semibold">Przesuń</span>
                <span
                  ref={moveBadgeRef}
                  className={`ml-1 text-[10px] font-mono text-[#F2C27F] bg-black/40 px-1.5 py-0.5 rounded border border-white/10 ${moving ? '' : 'hidden'}`}
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
                  className="absolute z-[120] bg-[#D9A86C] text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg shadow-xl border border-white/20 pointer-events-none whitespace-nowrap flex items-center gap-1.5"
                >
                  {resizing.isTextNode && resizing.handle.length === 2 ? (
                    <>
                      <span className="text-[#F2C27F] text-[10px] uppercase">Czcionka:</span>
                      <span>{resizing.currentFontSize}px</span>
                      <span className="text-[#F2C27F] text-[10px] uppercase ml-1">Szer:</span>
                      <span>{resizing.currentWidth}px</span>
                    </>
                  ) : (
                    <span>{resizing.currentWidth}px × {resizing.currentHeight}px</span>
                  )}
                </div>
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
                    onSettingsOpen={() => {
                      // Convert canvas-local overlay rect to viewport coordinates
                      // because ContextualSettingsPanel renders with position:fixed.
                      const rect = overlay.boundingRect
                      const container = containerRef.current
                      if (!rect || !container) return

                      const zoomWrapper = container.parentElement
                      const actualScale = zoomWrapper ? readCurrentScale(zoomWrapper) : 1
                      const containerRect = container.getBoundingClientRect()

                      setSettingsPanelRect({
                        x: containerRect.left + rect.x * actualScale,
                        y: containerRect.top + rect.y * actualScale,
                        width: rect.width * actualScale,
                        height: rect.height * actualScale,
                      })
                      setSettingsPanelOpen(true)
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Contextual Settings Panel */}
      {settingsPanelOpen && settingsPanelRect && toolbarData && (
        <ContextualSettingsPanel
          sectionId={toolbarData.sectionId}
          pageId={toolbarData.pageId}
          elementRect={settingsPanelRect}
          onClose={() => {
            setSettingsPanelOpen(false)
            setSettingsPanelRect(null)
          }}
        />
      )}
    </AnimatePresence>
  )
}

