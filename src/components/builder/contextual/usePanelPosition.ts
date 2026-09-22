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
 * BOUNDING AREA:
 *   The panel is clamped to the Builder WORKSPACE (the `<main data-builder-workspace>`
 *   region between the sidebars), not to the browser viewport — so it can never
 *   slide under the Inspector, the top bars, or off the visible workspace.
 *   When the content is taller than the available space, the panel gets a
 *   max-height and scrolls internally instead of leaving the workspace.
 *
 * Updates on: scroll, zoom, resize, element move, workspace resize.
 */

import { useState, useCallback, useLayoutEffect } from 'react'

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

export interface WorkspaceBounds {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

interface UsePanelPositionOptions {
  /** Panel dimensions */
  panelWidth?: number
  panelMinHeight?: number
  /** Gap between element and panel (px) */
  gap?: number
  /** Safe margin from workspace edges (px) */
  viewportMargin?: number
}

const DEFAULT_OPTIONS: Required<UsePanelPositionOptions> = {
  panelWidth: 320,
  panelMinHeight: 200,
  gap: 12,
  viewportMargin: 16,
}

/**
 * The bounding area for floating panels: the Builder workspace region
 * (`<main data-builder-workspace>`). Falls back to the browser viewport when
 * the workspace element is not present (e.g. outside the Builder shell).
 */
export function getWorkspaceBounds(): WorkspaceBounds {
  if (typeof document !== 'undefined') {
    const el = document.querySelector('[data-builder-workspace]')
    if (el) {
      const r = el.getBoundingClientRect()
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }
    }
  }
  const w = typeof window !== 'undefined' ? window.innerWidth : 0
  const h = typeof window !== 'undefined' ? window.innerHeight : 0
  return { left: 0, top: 0, right: w, bottom: h, width: w, height: h }
}

/**
 * Pure position computation — anchored to the element, then clamped so the
 * whole panel (up to maxHeight) stays inside `bounds` with `viewportMargin`
 * clearance on every side.
 */
export function computePanelPosition(
  elementRect: ElementRect,
  bounds: WorkspaceBounds,
  options: UsePanelPositionOptions = {}
): PanelPosition {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const margin = opts.viewportMargin
  const panelW = opts.panelWidth
  const maxPanelHeight = Math.max(opts.panelMinHeight, bounds.height - margin * 2)

  // Element bounds (same coordinate space as `bounds` — viewport coords)
  const elLeft = elementRect.x
  const elTop = elementRect.y
  const elRight = elementRect.x + elementRect.width
  const elBottom = elementRect.y + elementRect.height

  // Available spaces inside the workspace
  const spaceRight = bounds.right - elRight - opts.gap - margin
  const spaceLeft = elLeft - bounds.left - opts.gap - margin
  const spaceBelow = bounds.bottom - elBottom - opts.gap - margin
  const spaceAbove = elTop - bounds.top - opts.gap - margin

  let x = 0
  let y = 0
  let placement: PanelPosition['placement'] = 'right'
  let maxHeight = maxPanelHeight

  // Try right side first
  if (spaceRight >= panelW) {
    placement = 'right'
    x = elRight + opts.gap
    y = elTop
    maxHeight = Math.min(bounds.bottom - margin - y, maxPanelHeight)
  }
  // Try left side
  else if (spaceLeft >= panelW) {
    placement = 'left'
    x = elLeft - panelW - opts.gap
    y = elTop
    maxHeight = Math.min(bounds.bottom - margin - y, maxPanelHeight)
  }
  // Neither side fits fully — prefer the larger horizontal side and clamp to workspace edge
  else if (spaceRight >= spaceLeft) {
    placement = 'right'
    x = Math.min(elRight + opts.gap, bounds.right - panelW - margin)
    y = elTop
    maxHeight = Math.min(bounds.bottom - margin - y, maxPanelHeight)
  }
  else {
    placement = 'left'
    x = Math.max(bounds.left + margin, elLeft - panelW - opts.gap)
    y = elTop
    maxHeight = Math.min(bounds.bottom - margin - y, maxPanelHeight)
  }

  // If vertical room on the side is too small, fall back to below/above
  if (maxHeight < opts.panelMinHeight) {
    if (spaceBelow >= opts.panelMinHeight) {
      placement = 'below'
      x = Math.max(bounds.left + margin, Math.min(elLeft, bounds.right - panelW - margin))
      y = elBottom + opts.gap
      maxHeight = Math.min(spaceBelow, maxPanelHeight)
    }
    // Fallback: above
    else {
      placement = 'above'
      maxHeight = Math.min(Math.max(spaceAbove, opts.panelMinHeight), maxPanelHeight)
      x = Math.max(bounds.left + margin, Math.min(elLeft, bounds.right - panelW - margin))
      y = Math.max(bounds.top + margin, elTop - opts.gap - maxHeight)
    }
  }

  // Final horizontal clamp — panel never leaves the workspace left/right
  const minX = bounds.left + margin
  const maxX = Math.max(minX, bounds.right - panelW - margin)
  x = Math.max(minX, Math.min(x, maxX))

  // Max height with internal scrolling — keep a usable minimum when possible
  maxHeight = Math.max(Math.min(opts.panelMinHeight, maxPanelHeight), Math.min(maxHeight, maxPanelHeight))

  // Final vertical clamp — the panel's bottom edge (at maxHeight) stays inside
  const minY = bounds.top + margin
  const maxY = Math.max(minY, bounds.bottom - margin - maxHeight)
  y = Math.max(minY, Math.min(y, maxY))

  return { x, y, placement, maxHeight }
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

  const computePosition = useCallback(() => {
    if (!elementRect || !isOpen) return
    setPosition(computePanelPosition(elementRect, getWorkspaceBounds(), opts))
  }, [elementRect, isOpen, opts.panelWidth, opts.panelMinHeight, opts.gap, opts.viewportMargin])

  // Recompute on every render when open
  useLayoutEffect(() => {
    computePosition()
  }, [computePosition])

  // Recompute on scroll/resize and when the workspace region itself resizes
  // (sidebar / inspector drag-resize changes the clamping bounds).
  useLayoutEffect(() => {
    if (!isOpen) return

    const handleUpdate = () => computePosition()

    window.addEventListener('scroll', handleUpdate, { passive: true })
    window.addEventListener('resize', handleUpdate, { passive: true })

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      const workspaceEl = document.querySelector('[data-builder-workspace]')
      if (workspaceEl) {
        observer = new ResizeObserver(handleUpdate)
        observer.observe(workspaceEl)
      }
    }

    return () => {
      window.removeEventListener('scroll', handleUpdate)
      window.removeEventListener('resize', handleUpdate)
      observer?.disconnect()
    }
  }, [isOpen, computePosition])

  return position
}
