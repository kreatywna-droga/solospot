'use client'

/**
 * SmartGuidesOverlay — Real Smart Guides / Alignment Lines (UX Correction v1.0)
 *
 * Renders true, continuous smart alignment lines (Figma / Framer / Webflow style)
 * across the entire canvas during element drag and snap interactions.
 *
 * ARCHITECTURE:
 *   SmartGuideEngine / Drag Handler → useSmartGuides / Event
 *     → SmartGuidesOverlay (pure SVG) → renders real full-canvas alignment lines
 *
 * DESIGN SPECIFICATIONS:
 *   - Continuous 1.5px crisp lines traversing the canvas vertically or horizontally
 *   - SoloSpot signature violet/magenta glow palette (#d946ef / #c084fc / #ec4899)
 *   - Distinct visual styles for Element Alignment, Canvas Center, and Container Edges
 *   - Zero endpoint dots / blobs — real, clean alignment lines
 *   - Clean badge at alignment line position
 *   - z-[140] pointer-events-none overlay above elements and selection box
 */

import React from 'react'
import type { SmartGuide } from '../../../../../packages/builder-core/src/SmartGuideTypes'

// ---------------------------------------------------------------------------
// Guide rendering styles
// ---------------------------------------------------------------------------

const GUIDE_STYLES: Record<string, { stroke: string; strokeWidth: number; glowColor: string; dasharray?: string }> = {
  ALIGNMENT: { stroke: '#e879f9', strokeWidth: 1.5, glowColor: 'rgba(232, 121, 249, 0.9)' },       // magenta-400 — edge/center alignment
  CENTER:    { stroke: '#f43f5e', strokeWidth: 1.5, glowColor: 'rgba(244, 63, 94, 0.9)', dasharray: '6,3' }, // rose-500 — center axis
  CONTAINER: { stroke: '#a855f7', strokeWidth: 1.5, glowColor: 'rgba(168, 85, 247, 0.9)' },       // purple-500 — canvas edge
  DISTANCE:  { stroke: '#34d399', strokeWidth: 1, glowColor: 'rgba(52, 211, 153, 0.7)', dasharray: '4,3' },  // emerald-400 — distance
  SPACING:   { stroke: '#22d3ee', strokeWidth: 1.5, glowColor: 'rgba(34, 211, 238, 0.8)', dasharray: '6,3' }, // cyan-400 — equal spacing
  MARGIN:    { stroke: '#fb923c', strokeWidth: 1.2, glowColor: 'rgba(251, 146, 60, 0.8)', dasharray: '4,4' }, // orange-400 — margin
  ANCHOR:    { stroke: '#c084fc', strokeWidth: 1.5, glowColor: 'rgba(192, 132, 252, 0.9)' },
  RULE:      { stroke: '#64748b', strokeWidth: 1, glowColor: 'rgba(100, 116, 139, 0.6)' },
}

// ---------------------------------------------------------------------------
// SmartGuidesOverlay Props
// ---------------------------------------------------------------------------

interface SmartGuidesOverlayProps {
  /** Array of computed guides to render */
  guides: ReadonlyArray<SmartGuide>
  /** Width of the SVG overlay (canvas width) */
  width: number
  /** Height of the SVG overlay (canvas height) */
  height: number
  /** Whether to show the guides */
  visible: boolean
}

export function SmartGuidesOverlay({
  guides,
  width,
  height,
  visible,
}: SmartGuidesOverlayProps) {
  if (!visible || guides.length === 0) return null

  // Ensure canvas dimensions are robust even during page resizing/scrolling
  const canvasW = Math.max(width || 1200, 2400)
  const canvasH = Math.max(height || 800, 4000)

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-[140]"
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
        {/* Glowing aura filter for alignment lines */}
        <filter id="solospot-guide-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#d946ef" floodOpacity="0.8" />
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#a855f7" floodOpacity="0.4" />
        </filter>
        <filter id="solospot-center-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#f43f5e" floodOpacity="0.85" />
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ec4899" floodOpacity="0.45" />
        </filter>
        <filter id="badge-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="3" floodColor="rgba(0,0,0,0.65)" />
        </filter>
      </defs>

      {guides.map((guide, index) => {
        const guideKeyType = guide.source === 'CONTAINER' ? 'CONTAINER' : guide.type
        const style = GUIDE_STYLES[guideKeyType] ?? GUIDE_STYLES.ALIGNMENT
        const isHorizontal = guide.orientation === 'HORIZONTAL'
        const filterId = guide.type === 'CENTER' ? 'url(#solospot-center-glow)' : 'url(#solospot-guide-glow)'
        const key = `guide-${guide.type}-${guide.orientation}-${Math.round(guide.position)}-${index}`

        // For real Smart Guides (ALIGNMENT and CENTER), render full-span lines across the entire canvas
        const isFullSpan = guide.type === 'ALIGNMENT' || guide.type === 'CENTER' || guide.source === 'CONTAINER'

        const x1 = isHorizontal ? (isFullSpan ? -1000 : guide.start) : guide.position
        const y1 = isHorizontal ? guide.position : (isFullSpan ? -1000 : guide.start)
        const x2 = isHorizontal ? (isFullSpan ? canvasW + 1000 : guide.end) : guide.position
        const y2 = isHorizontal ? guide.position : (isFullSpan ? canvasH + 1000 : guide.end)

        return (
          <g key={key} opacity={Math.max(0.7, guide.opacity ?? 1)}>
            {/* Background halo stroke for high contrast against light or dark background */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(10, 10, 20, 0.45)"
              strokeWidth={style.strokeWidth + 2.5}
            />

            {/* Glowing Main Guide Line */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
              strokeDasharray={style.dasharray}
              filter={filterId}
            />

            {/* Distance label */}
            {guide.type === 'DISTANCE' && guide.label && (
              <g filter="url(#badge-shadow)">
                <rect
                  x={isHorizontal
                    ? (guide.start + guide.end) / 2 - (guide.label.length * 4 + 6)
                    : guide.position - 16
                  }
                  y={isHorizontal
                    ? guide.position - 19
                    : (guide.start + guide.end) / 2 - 8
                  }
                  width={guide.label.length * 8 + 12}
                  height={17}
                  rx={4}
                  fill="#09090b"
                  stroke={style.stroke}
                  strokeWidth={1}
                />
                <text
                  x={isHorizontal
                    ? (guide.start + guide.end) / 2
                    : guide.position
                  }
                  y={isHorizontal
                    ? guide.position - 7
                    : (guide.start + guide.end) / 2 + 4
                  }
                  textAnchor="middle"
                  fill="#34d399"
                  fontSize={10}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {guide.label}
                </text>
              </g>
            )}

            {/* Center label pill */}
            {guide.type === 'CENTER' && guide.label && (
              <g filter="url(#badge-shadow)">
                <rect
                  x={isHorizontal
                    ? Math.min(Math.max((guide.start + guide.end) / 2 - 36, 12), canvasW - 84)
                    : guide.position - 36
                  }
                  y={isHorizontal
                    ? guide.position - 10
                    : Math.min(Math.max((guide.start + guide.end) / 2 - 9, 20), canvasH - 30)
                  }
                  width={72}
                  height={18}
                  rx={4}
                  fill="#09090b"
                  stroke="#f43f5e"
                  strokeWidth={1.2}
                />
                <text
                  x={isHorizontal
                    ? Math.min(Math.max((guide.start + guide.end) / 2, 48), canvasW - 48)
                    : guide.position
                  }
                  y={isHorizontal
                    ? guide.position + 3
                    : Math.min(Math.max((guide.start + guide.end) / 2 + 3, 32), canvasH - 18)
                  }
                  textAnchor="middle"
                  fill="#fda4af"
                  fontSize={9.5}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  letterSpacing="0.04em"
                >
                  {guide.label === 'Center' ? 'ŚRODEK' : guide.label}
                </text>
              </g>
            )}

            {/* Alignment label pill */}
            {guide.type === 'ALIGNMENT' && guide.label && (
              <g filter="url(#badge-shadow)">
                <rect
                  x={isHorizontal
                    ? 18
                    : guide.position - 28
                  }
                  y={isHorizontal
                    ? guide.position - 9
                    : 16
                  }
                  width={Math.max(56, guide.label.length * 7 + 14)}
                  height={18}
                  rx={4}
                  fill="#09090b"
                  stroke="#d946ef"
                  strokeWidth={1}
                />
                <text
                  x={isHorizontal
                    ? 18 + Math.max(56, guide.label.length * 7 + 14) / 2
                    : guide.position
                  }
                  y={isHorizontal
                    ? guide.position + 3.5
                    : 28.5
                  }
                  textAnchor="middle"
                  fill="#f5d0fe"
                  fontSize={9}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                  letterSpacing="0.03em"
                >
                  {guide.label}
                </text>
              </g>
            )}

            {/* Spacing label */}
            {guide.type === 'SPACING' && guide.label && (
              <g filter="url(#badge-shadow)">
                <rect
                  x={isHorizontal
                    ? (guide.start + guide.end) / 2 - 18
                    : guide.position - 20
                  }
                  y={isHorizontal
                    ? guide.position - 18
                    : (guide.start + guide.end) / 2 - 8
                  }
                  width={36}
                  height={16}
                  rx={3}
                  fill="#09090b"
                  stroke={style.stroke}
                  strokeWidth={1}
                />
                <text
                  x={isHorizontal
                    ? (guide.start + guide.end) / 2
                    : guide.position
                  }
                  y={isHorizontal
                    ? guide.position - 6
                    : (guide.start + guide.end) / 2 + 4
                  }
                  textAnchor="middle"
                  fill="#67e8f9"
                  fontSize={9}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {guide.label}
                </text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}
