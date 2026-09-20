'use client'

/**
 * SmartGuidesOverlay — Real Smart Guides / Alignment Lines (UX Correction v1.0)
 *
 * Renders true, continuous smart alignment lines across the entire canvas
 * during element drag and snap interactions.
 *
 * COLOR:
 *   - 100% PURE BRIGHT / NEON GREEN (#00FF66)
 *   - No black under-strokes or filters that could render as dark/black lines
 *   - Vibrant 2px core laser line with a 6px neon green glow aura
 *   - Visible instantly with maximum contrast on both pitch-black and pure-white backgrounds
 *   - z-[150] pointer-events-none overlay above all canvas elements
 *
 * PERFORMANCE:
 *   - Autonomous event subscription to 'solospot:smart-guides-update'
 *   - 0 parent component re-renders during dragging for 120 FPS buttery smooth drag
 */

import React, { useState, useEffect } from 'react'
import type { SmartGuide } from '../../../../../packages/builder-core/src/SmartGuideTypes'

interface SmartGuidesOverlayProps {
  /** Optional guides override (if not provided, listens autonomously to event) */
  guides?: ReadonlyArray<SmartGuide>
  /** Width of the SVG overlay (canvas width) */
  width?: number
  /** Height of the SVG overlay (canvas height) */
  height?: number
  /** Whether to show the guides */
  visible?: boolean
}

export function SmartGuidesOverlay({
  guides: externalGuides,
  width,
  height,
  visible = true,
}: SmartGuidesOverlayProps) {
  const [internalGuides, setInternalGuides] = useState<ReadonlyArray<SmartGuide>>([])

  // Autonomous event listener: updates ONLY this component, avoiding full BuilderCanvas re-renders
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail && Array.isArray(detail.guides)) {
        setInternalGuides(detail.guides)
      }
    }
    window.addEventListener('solospot:smart-guides-update', handleUpdate)
    return () => window.removeEventListener('solospot:smart-guides-update', handleUpdate)
  }, [])

  const activeGuides = externalGuides !== undefined ? externalGuides : internalGuides

  if (!visible || activeGuides.length === 0) return null

  // Ensure canvas dimensions cover the entire viewport and scrollable canvas
  const canvasW = Math.max(width || 1400, 3200)
  const canvasH = Math.max(height || 1000, 8000)

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-[150]"
      width="100%"
      height="100%"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
      }}
    >
      {activeGuides.map((guide, index) => {
        const isHorizontal = guide.orientation === 'HORIZONTAL'
        const key = `guide-${guide.type}-${guide.orientation}-${Math.round(guide.position)}-${index}`

        // True Smart Guides span across the entire canvas
        const x1 = isHorizontal ? -4000 : guide.position
        const y1 = isHorizontal ? guide.position : -4000
        const x2 = isHorizontal ? canvasW + 4000 : guide.position
        const y2 = isHorizontal ? guide.position : canvasH + 6000

        return (
          <g key={key}>
            {/* Subtle soft green aura (2.5px with 25% opacity) */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#00FF66"
              strokeWidth={2.5}
              strokeOpacity={0.25}
            />

            {/* Ultra-thin crisp hairline 1px Bright Neon Green (#00FF66) line */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#00FF66"
              strokeWidth={1}
              strokeOpacity={1}
            />

            {/* Clean Badge Pill at Canvas Edge */}
            {guide.label && (
              <g>
                <rect
                  x={isHorizontal ? 24 : guide.position - 36}
                  y={isHorizontal ? guide.position - 11 : 18}
                  width={isHorizontal ? Math.max(70, guide.label.length * 8 + 18) : 72}
                  height={22}
                  rx={5}
                  fill="#002b11"
                  stroke="#00FF66"
                  strokeWidth={1.5}
                />
                <text
                  x={isHorizontal ? 24 + Math.max(70, guide.label.length * 8 + 18) / 2 : guide.position}
                  y={isHorizontal ? guide.position + 4.5 : 32.5}
                  textAnchor="middle"
                  fill="#00FF66"
                  fontSize={10.5}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  letterSpacing="0.04em"
                >
                  {guide.label === 'Center' ? 'ŚRODEK' : guide.label}
                </text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}
