'use client'

/**
 * BoundingBox — C16.4 Selection Bounding Box
 *
 * Renders the selection rectangle overlay.
 *
 * Architecture:
 *   Receives OverlayRect → renders with CSS transform
 *   No logic — pure render component.
 *
 * Handles:
 *   - Zoom (via overlayRectToScreenRect)
 *   - Rotation (via overlayTransform)
 *   - Viewport changes
 *   - Animation transitions
 */

import { motion } from 'framer-motion'
import type { OverlayRect } from '../../../../packages/builder-core/src'
import { overlayRectToScreenRect, overlayTransform } from '../../../../packages/builder-core/src'

// ---------------------------------------------------------------------------
// BoundingBox
// ---------------------------------------------------------------------------

interface BoundingBoxProps {
  /** The overlay rect to render */
  rect: OverlayRect
  /** Border color */
  color?: string
  /** Border width in px */
  borderWidth?: number
  /** Border style */
  borderStyle?: 'solid' | 'dashed'
  /** Animation duration in ms */
  animationDuration?: number
  /** Z-index */
  zIndex?: number
  /** Callback to initiate dragging/moving */
  onMoveStart?: (e: React.MouseEvent) => void
}

export function BoundingBox({
  rect,
  color = '#7c3aed',
  borderWidth = 2,
  borderStyle = 'solid',
  animationDuration = 150,
  zIndex,
  onMoveStart,
}: BoundingBoxProps) {
  if (!rect.visible) return null

  const screenRect = overlayRectToScreenRect(rect)
  const transform = overlayTransform(rect)

  return (
    <motion.div
      className="absolute pointer-events-none"
      initial={false}
      animate={{
        left: screenRect.left - borderWidth,
        top: screenRect.top - borderWidth,
        width: screenRect.width + borderWidth * 2,
        height: screenRect.height + borderWidth * 2,
        opacity: 1,
      }}
      transition={{
        duration: animationDuration / 1000,
        ease: 'easeOut',
      }}
      style={{
        zIndex: zIndex ?? rect.zIndex,
        borderWidth,
        borderStyle,
        borderColor: color,
        borderRadius: 4,
        transform,
        boxShadow: `0 0 0 1px ${color}33, 0 0 12px ${color}22`,
      }}
    >
      {/* Interactive border drag zones allowing user to grab any border to move element */}
      {onMoveStart && (
        <>
          {/* Top border drag zone */}
          <div
            onMouseDown={onMoveStart}
            className="absolute -top-1.5 left-0 right-0 h-3 pointer-events-auto cursor-move"
            title="Przeciągnij krawędź, aby przesunąć element"
          />
          {/* Bottom border drag zone */}
          <div
            onMouseDown={onMoveStart}
            className="absolute -bottom-1.5 left-0 right-0 h-3 pointer-events-auto cursor-move"
            title="Przeciągnij krawędź, aby przesunąć element"
          />
          {/* Left border drag zone */}
          <div
            onMouseDown={onMoveStart}
            className="absolute -left-1.5 top-0 bottom-0 w-3 pointer-events-auto cursor-move"
            title="Przeciągnij krawędź, aby przesunąć element"
          />
          {/* Right border drag zone */}
          <div
            onMouseDown={onMoveStart}
            className="absolute -right-1.5 top-0 bottom-0 w-3 pointer-events-auto cursor-move"
            title="Przeciągnij krawędź, aby przesunąć element"
          />
        </>
      )}
    </motion.div>
  )
}

