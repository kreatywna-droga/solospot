'use client'

/**
 * ResizeHandles — C16.4 Selection Resize Handles
 *
 * Renders 8 resize handles (NW, N, NE, E, SE, S, SW, W)
 * positioned on the BoundingBox edges.
 *
 * Architecture:
 *   Receives OverlayRect + active HandleType[] → renders handles
 *   Handles emit onHandleMouseDown for drag-to-resize (Sprint 5+)
 *   No resize logic — pure render + event forwarding.
 *
 * Each handle:
 *   - Is positioned at the correct edge/corner
 *   - Has the correct cursor style
 *   - Is clickable for drag initiation
 */

import type { OverlayRect, HandleType } from '../../../../packages/builder-core/src'
import { overlayRectToScreenRect } from '../../../../packages/builder-core/src'
import { HANDLE_CURSOR, DEFAULT_OVERLAY_CONFIG } from '../../../../packages/builder-core/src'

// ---------------------------------------------------------------------------
// Handle position computation
// ---------------------------------------------------------------------------

interface HandlePosition {
  readonly x: number
  readonly y: number
  readonly cursor: string
}

function getHandlePosition(
  rect: OverlayRect,
  handle: HandleType,
  handleSize: number
): HandlePosition {
  const screen = overlayRectToScreenRect(rect)
  const half = handleSize / 2

  switch (handle) {
    case 'NW': return { x: -half, y: -half, cursor: HANDLE_CURSOR.NW }
    case 'N':  return { x: screen.width / 2 - half, y: -half, cursor: HANDLE_CURSOR.N }
    case 'NE': return { x: screen.width - half, y: -half, cursor: HANDLE_CURSOR.NE }
    case 'E':  return { x: screen.width - half, y: screen.height / 2 - half, cursor: HANDLE_CURSOR.E }
    case 'SE': return { x: screen.width - half, y: screen.height - half, cursor: HANDLE_CURSOR.SE }
    case 'S':  return { x: screen.width / 2 - half, y: screen.height - half, cursor: HANDLE_CURSOR.S }
    case 'SW': return { x: -half, y: screen.height - half, cursor: HANDLE_CURSOR.SW }
    case 'W':  return { x: -half, y: screen.height / 2 - half, cursor: HANDLE_CURSOR.W }
  }
}

// ---------------------------------------------------------------------------
// ResizeHandles
// ---------------------------------------------------------------------------

interface ResizeHandlesProps {
  /** The overlay rect to attach handles to */
  rect: OverlayRect
  /** Active handle types */
  handles: HandleType[]
  /** Handle size in px */
  handleSize?: number
  /** Handle border color */
  borderColor?: string
  /** Handle background color */
  backgroundColor?: string
  /** Called when a handle mousedown occurs (for drag-to-resize) */
  onHandleMouseDown?: (handle: HandleType, e: React.MouseEvent) => void
}

export function ResizeHandles({
  rect,
  handles,
  handleSize = DEFAULT_OVERLAY_CONFIG.handleSize,
  borderColor = DEFAULT_OVERLAY_CONFIG.handleBorderColor,
  backgroundColor = DEFAULT_OVERLAY_CONFIG.handleBackgroundColor,
  onHandleMouseDown,
}: ResizeHandlesProps) {
  if (!rect.visible || handles.length === 0) return null

  return (
    <>
      {handles.map(handle => {
        const pos = getHandlePosition(rect, handle, handleSize)

        return (
          <div
            key={handle}
            className="absolute"
            style={{
              left: pos.x,
              top: pos.y,
              width: handleSize,
              height: handleSize,
              cursor: pos.cursor,
              zIndex: rect.zIndex + 1,
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onHandleMouseDown?.(handle, e)
            }}
          >
            {/* Handle dot */}
            <div
              className="w-full h-full rounded-full border-2 transition-transform duration-100
                         hover:scale-125 active:scale-90"
              style={{
                borderColor,
                backgroundColor,
                boxShadow: '0 0 4px rgba(0,0,0,0.3)',
              }}
            />
          </div>
        )
      })}
    </>
  )
}

