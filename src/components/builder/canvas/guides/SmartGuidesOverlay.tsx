'use client'

/**
 * SmartGuidesOverlay — C16.19 Smart Guide Overlay (Sprint 6B)
 *
 * Pure presentation component — renders SVG guide lines on top of the canvas.
 * Receives computed guides from useSmartGuides hook and renders them.
 *
 * ARCHITECTURE:
 *   useSmartGuides (hook) → computes guides via SmartGuideEngine
 *     → SmartGuidesOverlay (pure SVG) → renders on canvas
 *
 * DESIGN DECISIONS:
 *   - Pure SVG — no DOM manipulation, no canvas API
 *   - Receives guides as props — zero computation logic
 *   - Renders in a fixed-position SVG overlay over the canvas
 *   - Each guide type has distinct visual style (color, stroke, opacity)
 *   - Distance guides include a label showing pixel value
 *   - Uses CSS pointer-events: none to not interfere with drag/click
 */

import React from 'react'
import type { SmartGuide } from '../../../../../packages/builder-core/src/SmartGuideTypes'

// ---------------------------------------------------------------------------
// Guide rendering styles
// ---------------------------------------------------------------------------

const GUIDE_STYLES: Record<string, { stroke: string; strokeWidth: number; dasharray?: string }> = {
  ALIGNMENT: { stroke: '#ff0000', strokeWidth: 1 },
  DISTANCE:  { stroke: '#00cc00', strokeWidth: 1, dasharray: '6,3' },
  CENTER:    { stroke: '#ff0000', strokeWidth: 1, dasharray: '8,4' },
  MARGIN:    { stroke: '#ff8800', strokeWidth: 1, dasharray: '4,4' },
  SPACING:   { stroke: '#00ccff', strokeWidth: 2, dasharray: '8,4' },
  ANCHOR:    { stroke: '#ff6600', strokeWidth: 1.5 },
  RULE:      { stroke: '#888888', strokeWidth: 1 },
}

// ---------------------------------------------------------------------------
// SmartGuidesOverlay
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

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-20"
      width={width}
      height={height}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <filter id="guide-shadow" x="-2" y="-2" width="4" height="4">
          <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="rgba(0,0,0,0.5)" />
        </filter>
      </defs>

      {guides.map((guide, index) => {
        const style = GUIDE_STYLES[guide.type] ?? GUIDE_STYLES.ALIGNMENT
        const isHorizontal = guide.orientation === 'HORIZONTAL'
        const key = `guide-${guide.type}-${guide.orientation}-${Math.round(guide.position)}-${index}`

        return (
          <React.Fragment key={key}>
            {/* Guide line */}
            <line
              x1={isHorizontal ? guide.start : guide.position}
              y1={isHorizontal ? guide.position : guide.start}
              x2={isHorizontal ? guide.end : guide.position}
              y2={isHorizontal ? guide.position : guide.end}
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
              strokeDasharray={style.dasharray}
              opacity={guide.opacity}
              filter="url(#guide-shadow)"
            />

            {/* Distance label */}
            {guide.type === 'DISTANCE' && guide.label && (
              <g>
                <rect
                  x={isHorizontal
                    ? (guide.start + guide.end) / 2 - guide.label.length * 4
                    : guide.position - 14
                  }
                  y={isHorizontal
                    ? guide.position - 18
                    : (guide.start + guide.end) / 2 - 7
                  }
                  width={guide.label.length * 8 + 8}
                  height={16}
                  rx={3}
                  fill={style.stroke}
                  opacity={0.9}
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
                  fill="white"
                  fontSize={10}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {guide.label}
                </text>
              </g>
            )}

            {/* Center label */}
            {guide.type === 'CENTER' && guide.label && (
              <g>
                <rect
                  x={isHorizontal
                    ? (guide.start + guide.end) / 2 - 24
                    : guide.position - 32
                  }
                  y={isHorizontal
                    ? guide.position - 18
                    : (guide.start + guide.end) / 2 - 7
                  }
                  width={48}
                  height={16}
                  rx={3}
                  fill={style.stroke}
                  opacity={0.85}
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
                  fill="white"
                  fontSize={9}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {guide.label}
                </text>
              </g>
            )}

            {/* Spacing label */}
            {guide.type === 'SPACING' && guide.label && (
              <g>
                <rect
                  x={isHorizontal
                    ? (guide.start + guide.end) / 2 - 16
                    : guide.position - 22
                  }
                  y={isHorizontal
                    ? guide.position - 18
                    : (guide.start + guide.end) / 2 - 7
                  }
                  width={32}
                  height={16}
                  rx={3}
                  fill={style.stroke}
                  opacity={0.85}
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
                  fill="white"
                  fontSize={9}
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {guide.label}
                </text>
              </g>
            )}

            {/* Alignment end markers */}
            {guide.type === 'ALIGNMENT' && (
              <>
                <circle
                  cx={isHorizontal ? guide.start : guide.position}
                  cy={isHorizontal ? guide.position : guide.start}
                  r={2.5}
                  fill={style.stroke}
                  opacity={guide.opacity}
                />
                <circle
                  cx={isHorizontal ? guide.end : guide.position}
                  cy={isHorizontal ? guide.position : guide.end}
                  r={2.5}
                  fill={style.stroke}
                  opacity={guide.opacity}
                />
              </>
            )}
          </React.Fragment>
        )
      })}
    </svg>
  )
}
