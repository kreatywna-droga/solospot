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
  /** Animation duration in ms (0 for instant 60fps tracking) */
  animationDuration?: number
  /** Z-index */
  zIndex?: number
  /** Callback to initiate dragging/moving */
  onMoveStart?: (e: React.MouseEvent) => void
  /** Is selected node a text node */
  isTextNode?: boolean
  /** Does selected node have children (container/parent node) */
  hasChildren?: boolean
  /** Whether the user is currently editing text inside this node */
  isEditingText?: boolean
  /** Callback for double-click to edit text */
  onDoubleClick?: (e: React.MouseEvent) => void
}

export function BoundingBox({
  rect,
  color = '#7c3aed',
  borderWidth = 2,
  borderStyle = 'solid',
  animationDuration = 0,
  zIndex,
  onMoveStart,
  isTextNode = false,
  hasChildren = false,
  isEditingText = false,
  onDoubleClick,
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
        ease: 'linear',
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
      {/* Interactive drag zones allowing user to grab anywhere on the asset to move it */}
      {onMoveStart && (
        <>
          {/* Full body drag surface for leaf elements (images, videos, icons, buttons, SVGs, text, empty containers) */}
          {/* If the element has children, do NOT block clicks to child elements! */}
          {!hasChildren && (
            <div
              onMouseDown={isEditingText ? undefined : onMoveStart}
              onDoubleClick={(e) => {
                if (isTextNode && onDoubleClick) {
                  e.stopPropagation()
                  onDoubleClick(e)
                }
              }}
              className={`absolute inset-0 select-none ${
                isEditingText ? 'pointer-events-none' : 'pointer-events-auto cursor-grab active:cursor-grabbing'
              }`}
              title={isTextNode ? "Kliknij dwukrotnie, aby edytować tekst, lub przeciągnij, aby przesunąć" : "Przeciągnij myszą, aby przesunąć asset po Canvasie"}
            />
          )}

          {/* Precision border drag zones */}
          <div
            onMouseDown={onMoveStart}
            className="absolute -top-2 left-0 right-0 h-4 pointer-events-auto cursor-move"
            title="Przeciągnij krawędź, aby przesunąć element"
          />
          <div
            onMouseDown={onMoveStart}
            className="absolute -bottom-2 left-0 right-0 h-4 pointer-events-auto cursor-move"
            title="Przeciągnij krawędź, aby przesunąć element"
          />
          <div
            onMouseDown={onMoveStart}
            className="absolute -left-2 top-0 bottom-0 w-4 pointer-events-auto cursor-move"
            title="Przeciągnij krawędź, aby przesunąć element"
          />
          <div
            onMouseDown={onMoveStart}
            className="absolute -right-2 top-0 bottom-0 w-4 pointer-events-auto cursor-move"
            title="Przeciągnij krawędź, aby przesunąć element"
          />
        </>
      )}
    </motion.div>
  )
}

