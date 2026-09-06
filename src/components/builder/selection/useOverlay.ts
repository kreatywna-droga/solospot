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
 * Architecture:
 *   SelectionEvents → useOverlay → OverlayState → [SelectionOverlay, ...]
 *
 * Usage:
 *   const overlay = useOverlay(containerRef);
 *   return <SelectionOverlay overlay={overlay} />;
 */

import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
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

  // Build a getElementRect function that reads DOM positions or uses externalRects
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

      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      const zoom = canvas.zoom && canvas.zoom > 0 ? canvas.zoom : 1

      // Position relative to canvasFrameRef in unscaled canvas logical pixels
      return {
        x: (elRect.left - containerRect.left) / zoom,
        y: (elRect.top - containerRect.top) / zoom,
        width: elRect.width / zoom,
        height: elRect.height / zoom,
      }
    },
    [canvasContainerRef, options.sectionSelector, options.externalRects, canvas.zoom]
  )

  // Compute overlay state whenever selection or canvas changes
  useEffect(() => {
    // Inside canvasFrameRef, coordinates are in 1:1 canvas space because canvasFrameRef has CSS scale(zoom) applied to its parent container
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

