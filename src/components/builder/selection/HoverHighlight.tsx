'use client'

/**
 * HoverHighlight — C16.4 Hover Highlight
 *
 * Renders a subtle border around the hovered element.
 *
 * Architecture:
 *   Receives OverlayRect → renders thin dashed border
 *   NO logic — pure render.
 *   Hover state is managed entirely by SelectionEngine → OverlayController.
 *
 * Key principles:
 *   - Hover NEVER computes anything
 *   - Hover is independent of selection (both can exist simultaneously)
 *   - Hover highlight is visually distinct from selection (thinner, dashed, lower opacity)
 */

import { motion } from 'framer-motion'
import type { OverlayRect } from '../../../../packages/builder-core/src'
import { overlayRectToScreenRect, overlayTransform } from '../../../../packages/builder-core/src'

// ---------------------------------------------------------------------------
// HoverHighlight
// ---------------------------------------------------------------------------

interface HoverHighlightProps {
  /** The overlay rect for the hovered element */
  rect: OverlayRect
  /** Border color (default: violet-600 at 40%) */
  color?: string
  /** Border width in px */
  borderWidth?: number
  /** Animation duration in ms */
  animationDuration?: number
}

export function HoverHighlight({
  rect,
  color = '#7c3aed66',
  borderWidth = 1,
  animationDuration = 100,
}: HoverHighlightProps) {
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
        zIndex: rect.zIndex,
        borderWidth,
        borderStyle: 'dashed',
        borderColor: color,
        borderRadius: 4,
        transform,
      }}
    />
  )
}

