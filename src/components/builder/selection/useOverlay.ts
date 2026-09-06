'use client'

/**
 * useOverlay — C16.4 Selection Overlay React Hook
 *
 * Bridges the pure OverlayController (core) with React state.
 *
 * This is the ONLY place where:
 *   - DOM measurements happen (getBoundingClientRect)
 *   - Viewport context is built from canvas state
 *   - OverlayController.computeOverlayState() is called
 *
 * All child components (BoundingBox, ResizeHandles, etc.) consume
 * the returned OverlayState without additional logic.
 *
 * COORDINATE MODEL:
 *   The overlay renders INSIDE canvasFrameRef (which is inside a
 *   transform: scale(zoom) wrapper). Both elements and the overlay
 *   share the same coordinate space. getElementRect() measures
 *   element positions in this shared space by reading the ACTUAL
 *   CSS transform scale from the zoom wrapper's computed style.
 *
 *   screen space → (divide by actualScale) → canvas-local coords
 *   canvas-local coords → overlay CSS left/top → visual position
 *
 *   We read the actual CSS scale (not canvas.zoom) to handle
 *   mid-transition measurements correctly.
 *
 * Architecture:
 *   SelectionEvents → useOverlay → OverlayState → [SelectionOverlay, ...]
 */

import { useCallback, useMemo, useState, useLayoutEffect } from 'react'
import { useBuilder } from '../state/BuilderProvider'
import type {
  SelectionState,
  ViewportLabel,
} from '../../../../packages/builder-core/src'
import {
  OverlayController,
  OverlayState,
  createEmptyOverlayState,
  DEFAULT_OVERLAY_CONFIG,
  OverlayConfig,
} from '../../../../packages/builder-core/src'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Read the actual CSS transform scale from an element's computed style.
 * Returns the uniform scale factor (assumes scaleX ≈ scaleY).
 * This accounts for any ongoing CSS transitions on the zoom wrapper.
 */
export function readCurrentScale(el: HTMLElement): number {
  try {
    const cs = window.getComputedStyle(el)
    const t = cs.transform
    if (!t || t === 'none') return 1
    const m = new DOMMatrix(t)
    return m.a || 1
  } catch {
    return 1
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface ExternalSectionRect {
  x: number
  y: number
  width: number
  height: number
}

export interface UseOverlayOptions {
  /** Optional: override overlay config */
  config?: Partial<OverlayConfig>
  /** Optional: a CSS selector to find elements by sectionId (data-section-id) */
  sectionSelector?: string
  /** Optional: external rects reported by preview channel (iframe postMessage) */
  externalRects?: Record<string, ExternalSectionRect> | null
}

export function useOverlay(
  canvasContainerRef: React.RefObject<HTMLDivElement | null>,
  options: UseOverlayOptions = {}
): OverlayState {
  const { canvas, document, ctx } = useBuilder()
  const selection = canvas.selection ?? ctx.canvas.selection
  const [overlayState, setOverlayState] = useState<OverlayState>(createEmptyOverlayState)

  const config = useMemo(
    () => ({ ...DEFAULT_OVERLAY_CONFIG, ...options.config }),
    [options.config]
  )

  /**
   * getElementRect — measures a node's bounding rect in canvas-local coordinates.
   *
   * Reads the ACTUAL CSS scale from the zoom wrapper's computed transform
   * instead of using canvas.zoom. This ensures correct measurements even
   * during CSS zoom transitions where the visual scale differs from the
   * target zoom value.
   */
  const getElementRect = useCallback(
    (sectionId: string): { x: number; y: number; width: number; height: number } | null => {
      // Architectural decision #3: prioritize externalRects reported by iframe
      if (options.externalRects?.[sectionId]) {
        return options.externalRects[sectionId]
      }

      const container = canvasContainerRef.current
      if (!container) return null

      // Try to find the element by data attribute (node or section)
      const selector = options.sectionSelector ?? `[data-node-id="${sectionId}"], [data-section-id="${sectionId}"]`
      const el = container.querySelector(selector) as HTMLElement | null
      if (!el) return null

      // Read the ACTUAL current CSS scale from the zoom wrapper.
      // The zoom wrapper (parent of canvasFrameRef) applies transform: scale(zoom)
      // with a CSS transition. During the transition, canvas.zoom is the TARGET
      // but getBoundingClientRect() reflects the INTERMEDIATE visual scale.
      // Reading the actual computed scale ensures correct coordinate conversion.
      const zoomWrapper = container.parentElement
      const actualScale = zoomWrapper ? readCurrentScale(zoomWrapper) : 1

      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()

      let left = elRect.left
      let top = elRect.top
      let right = elRect.right
      let bottom = elRect.bottom

      // Ensure the selection box tightly encloses child text elements even during dynamic wrapping or font scaling
      const textChild = el.querySelector('[data-inline-edit="text"], h1, h2, h3, h4, h5, h6, p, span, button') as HTMLElement | null
      if (textChild) {
        const textRect = textChild.getBoundingClientRect()
        if (textRect.width > 0 && textRect.height > 0) {
          left = Math.min(left, textRect.left)
          top = Math.min(top, textRect.top)
          right = Math.max(right, textRect.right)
          bottom = Math.max(bottom, textRect.bottom)
        }
      }

      // Position relative to canvasFrameRef in unscaled canvas logical pixels
      // Both measurements are in screen space (post-zoom), so dividing by the
      // actual CSS scale gives us the correct CSS-position within canvasFrameRef.
      return {
        x: (left - containerRect.left) / actualScale,
        y: (top - containerRect.top) / actualScale,
        width: (right - left) / actualScale,
        height: (bottom - top) / actualScale,
      }
    },
    [canvasContainerRef, options.sectionSelector, options.externalRects]
  )

  // Use useLayoutEffect for measurement BEFORE paint to avoid visual glitches.
  // The overlay state is set synchronously after DOM mutations, ensuring the
  // browser paints with the correct overlay position on the first frame.
  useLayoutEffect(() => {
    // Inside canvasFrameRef, coordinates are in 1:1 canvas space because
    // canvasFrameRef has CSS scale(zoom) applied to its parent container.
    // viewport.zoom = 1.0 because the overlay renders INSIDE the scaled
    // container, and getElementRect already converts to unscaled coords.
    const viewport = {
      label: canvas.viewport.label as ViewportLabel,
      width: canvas.viewport.width,
      zoom: 1.0,
      offsetX: 0,
      offsetY: 0,
    }

    const state = OverlayController.computeOverlayState({
      selection: selection as SelectionState,
      document,
      viewport,
      config,
      getElementRect,
    })

    setOverlayState(state)

    // Follow-up measurement after CSS transitions settle.
    // The zoom wrapper has a ~120ms CSS transition. We schedule a
    // follow-up measurement at 160ms to catch the final state.
    const followUp = setTimeout(() => {
      const finalState = OverlayController.computeOverlayState({
        selection: selection as SelectionState,
        document,
        viewport,
        config,
        getElementRect,
      })
      setOverlayState(finalState)
    }, 160)

    return () => clearTimeout(followUp)
  }, [
    selection,
    document,
    canvas.viewport,
    canvas.zoom,
    canvas.selectedSectionId,
    canvas.selectedPageId,
    config,
    getElementRect,
    canvasContainerRef,
    options.externalRects,
  ])

  return overlayState
}
