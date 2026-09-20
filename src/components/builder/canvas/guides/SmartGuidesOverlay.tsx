'use client'

/**
 * SmartGuidesOverlay — Real Smart Guides / Alignment Lines (UX Correction v1.0)
 *
 * Renders true, continuous smart alignment lines (Figma / Framer / Webflow style)
 * across the entire canvas during element drag and snap interactions.
 *
 * 120 FPS PERFORMANCE & ISOLATION:
 *   - Autonomous event subscription to 'solospot:smart-guides-update'
 *   - Zero parent component (BuilderCanvas) re-renders during drag
 *   - Pure 60/120 FPS hardware accelerated SVG rendering
 *
 * COLOR REQUIREMENT:
 *   - Bright / Neon Green (#00FF66) for all alignment and center lines
 *   - High contrast dark backing halo (rgba(0,0,0,0.9)) for readability on any canvas
 *   - z-[150] pointer-events-none overlay above all canvas elements
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

  // Ensure canvas dimensions are robust even during page resizing/scrolling
  const canvasW = Math.max(width || 1400, 3000)
  const canvasH = Math.max(height || 1000, 6000)

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
      <defs>
        {/* Glowing aura filter for bright green alignment lines */}
        <filter id="solospot-green-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#00FF66" floodOpacity="0.95" />
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#00FF66" floodOpacity="0.6" />
        </filter>
        <filter id="badge-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.85)" />
        </filter>
      </defs>

      {activeGuides.map((guide, index) => {
        const isHorizontal = guide.orientation === 'HORIZONTAL'
        const key = `guide-${guide.type}-${guide.orientation}-${Math.round(guide.position)}-${index}`

        // True Smart Guides span across the entire canvas
        const x1 = isHorizontal ? -3000 : guide.position
        const y1 = isHorizontal ? guide.position : -3000
        const x2 = isHorizontal ? canvasW + 3000 : guide.position
        const y2 = isHorizontal ? guide.position : canvasH + 5000

        return (
          <g key={key}>
            {/* Background halo stroke for high contrast against light or dark canvas background */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(0, 0, 0, 0.9)"
              strokeWidth={4.5}
            />

            {/* Glowing Main Bright Neon Green Guide Line (#00FF66) */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#00FF66"
              strokeWidth={2}
              filter="url(#solospot-green-glow)"
            />

            {/* Minimal Badge at Canvas Edge */}
            {guide.label && (
              <g filter="url(#badge-shadow)">
                <rect
                  x={isHorizontal ? 24 : guide.position - 32}
                  y={isHorizontal ? guide.position - 10 : 20}
                  width={isHorizontal ? Math.max(64, guide.label.length * 8 + 16) : 64}
                  height={20}
                  rx={5}
                  fill="#050508"
                  stroke="#00FF66"
                  strokeWidth={1.5}
                />
                <text
                  x={isHorizontal ? 24 + Math.max(64, guide.label.length * 8 + 16) / 2 : guide.position}
                  y={isHorizontal ? guide.position + 4 : 33.5}
                  textAnchor="middle"
                  fill="#00FF66"
                  fontSize={10}
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
