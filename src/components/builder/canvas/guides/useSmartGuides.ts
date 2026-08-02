'use client'

/**
 * useSmartGuides — C16.19 Smart Guide Hook (Sprint 6B)
 *
 * Bridges the DragContext with the SmartGuideEngine.
 * Computes guides on every drag frame and returns the result.
 *
 * ARCHITECTURE:
 *   DragEngine (drag position) → useSmartGuides (compute guides)
 *     → SmartGuidesOverlay (render SVG)
 *     → DragEngine (apply snap offset)
 *
 * DESIGN DECISIONS:
 *   - Pure computation — no side effects, no DOM access
 *   - Memoized engine instance — created once per component mount
 *   - Debounced by React's render cycle — no RAF needed
 *   - Returns computed guides + snap guidance for DragEngine
 *   - Configurable via SmartGuideConfig
 */

import { useMemo, useRef, useState, useCallback } from 'react'
import { SmartGuideEngine } from '../../../../../packages/builder-core/src/SmartGuideEngine'
import {
  DEFAULT_SMART_GUIDE_CONFIG,
  createElementBounds,
  createContainerBounds,
} from '../../../../../packages/builder-core/src/SmartGuideTypes'
import type {
  SmartGuide,
  SmartGuideConfig,
  ElementBounds,
  ContainerBounds,
  AggregatedGuideResult,
  SnapGuidance,
} from '../../../../../packages/builder-core/src/SmartGuideTypes'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SmartGuidesState {
  /** Computed guides to render */
  guides: ReadonlyArray<SmartGuide>
  /** Snap guidance for DragEngine */
  snapGuidance: SnapGuidance
  /** Whether guides are visible */
  visible: boolean
  /** Summary counts */
  activeGuideCount: number
  alignmentCount: number
  distanceCount: number
  centerCount: number
  marginCount: number
  spacingCount: number
}

export interface UseSmartGuidesInput {
  /** Current drag position of the element being dragged */
  dragPosition?: { x: number; y: number }
  /** Size of the element being dragged */
  dragSize?: { width: number; height: number }
  /** Bounds of all elements on the canvas (excluding the dragged element) */
  allElements?: ReadonlyArray<ElementBounds>
  /** Container bounds (canvas frame) */
  container?: ContainerBounds
  /** Optional config override */
  config?: Partial<SmartGuideConfig>
  /** Whether guides are enabled */
  enabled?: boolean
  /** Whether to show guides (user toggle) */
  showGuides?: boolean
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSmartGuides(input: UseSmartGuidesInput): SmartGuidesState {
  const {
    dragPosition,
    dragSize,
    allElements = [],
    container,
    config: configOverride,
    enabled = true,
    showGuides = true,
  } = input

  // Memoize the engine instance
  const engineRef = useRef<SmartGuideEngine | null>(null)
  const engine = useMemo(() => {
    if (!engineRef.current) {
      engineRef.current = new SmartGuideEngine()
    }
    return engineRef.current
  }, [])

  // Memoize the config
  const config = useMemo<SmartGuideConfig>(
    () => ({ ...DEFAULT_SMART_GUIDE_CONFIG, ...configOverride }),
    [configOverride]
  )

  // Compute guides
  const result = useMemo<AggregatedGuideResult>(() => {
    if (!enabled || !dragPosition || !dragSize) {
      return {
        guides: [],
        snapGuidance: { x: 0, y: 0, snapped: false, snapAxis: 'NONE', guides: [], offsetX: 0, offsetY: 0 },
        activeGuideCount: 0,
        alignmentCount: 0,
        distanceCount: 0,
        centerCount: 0,
        marginCount: 0,
        spacingCount: 0,
      }
    }

    const draggingElement = createElementBounds({
      id: '__dragging__',
      x: dragPosition.x,
      y: dragPosition.y,
      width: dragSize.width,
      height: dragSize.height,
    })

    const containerBounds = container ?? createContainerBounds()

    return engine.computeAll({
      draggingElement,
      allElements: allElements as ElementBounds[],
      container: containerBounds,
      config,
    })
  }, [enabled, dragPosition, dragSize, allElements, container, config, engine])

  return {
    ...result,
    visible: enabled && showGuides && result.activeGuideCount > 0,
  }
}

// ---------------------------------------------------------------------------
// Utility hook for canvas element extraction
// ---------------------------------------------------------------------------

/**
 * Extracts element bounds from canvas section nodes.
 * Bridge between SectionNode[] and ElementBounds[].
 */
export function useElementBounds(
  containerRef: React.RefObject<HTMLDivElement | null>,
  sectionIds: ReadonlyArray<string>
): ReadonlyArray<ElementBounds> {
  return useMemo(() => {
    if (!containerRef.current) return []
    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()

    return sectionIds
      .map(id => {
        const el = container.querySelector(`[data-section-id="${id}"]`)
        if (!el) return null
        const rect = el.getBoundingClientRect()
        return createElementBounds({
          id,
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        })
      })
      .filter((e): e is ElementBounds => e !== null)
  }, [containerRef, sectionIds])
}
