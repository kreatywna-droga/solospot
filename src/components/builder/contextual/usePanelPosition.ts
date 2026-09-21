'use client'

/**
 * usePanelPosition — Contextual Settings Panel positioning engine.
 *
 * Computes the optimal position for the settings panel relative to the selected
 * element, avoiding overlap with the element itself. Uses collision detection
 * to find the best available space.
 *
 * PRIORITY ORDER:
 *   1. Right side of element
 *   2. Left side of element
 *   3. Below element
 *   4. Above element
 *
 * Updates on: scroll, zoom, resize, element move.
 */

import { useState, useCallback, useLayoutEffect, useRef } from 'react'

export interface PanelPosition {
  x: number
  y: number
  placement: 'right' | 'left' | 'below' | 'above'
  maxHeight: number
}

export interface ElementRect {
  x: number
  y: number
  width: number
  height: number
}

interface UsePanelPositionOptions {
  /** Panel dimensions */
  panelWidth?: number
  panelMinHeight?: number
  /** Gap between element and panel (px) */
  gap?: number
  /** Safe margin from viewport edges (px) */
  viewportMargin?: number
}

const DEFAULT_OPTIONS: Required<UsePanelPositionOptions> = {
  panelWidth: 320,
  panelMinHeight: 200,
  gap: 12,
  viewportMargin: 16,
}

export function usePanelPosition(
  elementRect: ElementRect | null,
  isOpen: boolean,
  options: UsePanelPositionOptions = {}
): PanelPosition {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const [position, setPosition] = useState<PanelPosition>({
    x: 0,
    y: 0,
    placement: 'right',
    maxHeight: 600,
  })
  const panelRef = useRef<HTMLDivElement>(null)

  const computePosition = useCallback(() => {
    if (!elementRect || !isOpen) return

    const viewportW = window.innerWidth
    const viewportH = window.innerHeight
    const scrollX = window.scrollX
    const scrollY = window.scrollY

    // Element bounds in viewport coords
    const elLeft = elementRect.x
    const elTop = elementRect.y
    const elRight = elementRect.x + elementRect.width
    const elBottom = elementRect.y + elementRect.height

    // Available spaces
    const spaceRight = viewportW - elRight - opts.gap - opts.viewportMargin
    const spaceLeft = elLeft - opts.gap - opts.viewportMargin
    const spaceBelow = viewportH - elBottom - opts.gap - opts.viewportMargin
    const spaceAbove = elTop - opts.gap - opts.viewportMargin

    let x = 0
    let y = 0
    let placement: PanelPosition['placement'] = 'right'
    let maxHeight = viewportH - opts.viewportMargin * 2

    // Try right side first
    if (spaceRight >= opts.panelWidth) {
      placement = 'right'
      x = elRight + opts.gap
      y = elTop
      maxHeight = Math.min(spaceBelow + elementRect.height, viewportH - opts.viewportMargin * 2)
    }
    // Try left side
    else if (spaceLeft >= opts.panelWidth) {
      placement = 'left'
      x = elLeft - opts.panelWidth - opts.gap
      y = elTop
      maxHeight = Math.min(spaceBelow + elementRect.height, viewportH - opts.viewportMargin * 2)
    }
    // Try below
    else if (spaceBelow >= opts.panelMinHeight) {
      placement = 'below'
      x = Math.max(opts.viewportMargin, Math.min(elLeft, viewportW - opts.panelWidth - opts.viewportMargin))
      y = elBottom + opts.gap
      maxHeight = spaceBelow
    }
    // Fallback: above
    else {
      placement = 'above'
      x = Math.max(opts.viewportMargin, Math.min(elLeft, viewportW - opts.panelWidth - opts.viewportMargin))
      y = Math.max(opts.viewportMargin, elTop - opts.gap - opts.panelMinHeight)
      maxHeight = spaceAbove
    }

    // Clamp X to viewport
    x = Math.max(opts.viewportMargin, Math.min(x, viewportW - opts.panelWidth - opts.viewportMargin))

    // Clamp Y to viewport
    y = Math.max(opts.viewportMargin, y)

    // Max height with scrolling
    maxHeight = Math.min(maxHeight, viewportH - opts.viewportMargin * 2)

    setPosition({ x, y, placement, maxHeight })
  }, [elementRect, isOpen, opts.panelWidth, opts.panelMinHeight, opts.gap, opts.viewportMargin])

  // Recompute on every render when open
  useLayoutEffect(() => {
    computePosition()
  }, [computePosition])

  // Recompute on scroll/resize
  useLayoutEffect(() => {
    if (!isOpen) return

    const handleUpdate = () => computePosition()

    window.addEventListener('scroll', handleUpdate, { passive: true })
    window.addEventListener('resize', handleUpdate, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleUpdate)
      window.removeEventListener('resize', handleUpdate)
    }
  }, [isOpen, computePosition])

  return position
}
