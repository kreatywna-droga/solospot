/**
 * OverlayRect — C16.4 Selection Overlay Rect
 *
 * A viewport-aware bounding rectangle for selection overlay rendering.
 *
 * Why not DOMRect?
 *   - Supports rotation (elements can be rotated at any angle)
 *   - Carries its own scale factor (for zoom-aware rendering)
 *   - Carries viewport context (for mobile/tablet/desktop preview)
 *   - Carries visibility state (for conditional rendering)
 *   - Carries z-index (for stacking multiple overlays)
 *
 * This is the SINGLE source of truth for ALL overlay positioning.
 * BoundingBox, ResizeHandles, QuickToolbar all derive from OverlayRect.
 */

import type { ViewportLabel } from './CanvasState';

// ---------------------------------------------------------------------------
// Viewport context
// ---------------------------------------------------------------------------

export interface OverlayViewport {
  readonly label: ViewportLabel;
  readonly width: number;
  readonly zoom: number;
  readonly offsetX: number;   // canvas scroll offset (for large canvases)
  readonly offsetY: number;
}

// ---------------------------------------------------------------------------
// OverlayRect — the complete positioning model
// ---------------------------------------------------------------------------

export interface OverlayRect {
  /** Absolute x position in canvas space (not screen space) */
  readonly x: number;
  /** Absolute y position in canvas space */
  readonly y: number;
  /** Width of the element (excluding border) */
  readonly width: number;
  /** Height of the element (excluding border) */
  readonly height: number;

  /** Rotation in degrees (0 = no rotation) */
  readonly rotation: number;
  /** Scale factor applied (1.0 = normal) */
  readonly scale: number;

  /** Viewport context this rect was computed for */
  readonly viewport: OverlayViewport;

  /** Whether this overlay should be rendered */
  readonly visible: boolean;

  /** Z-index for stacking multiple overlays */
  readonly zIndex: number;
}

// ---------------------------------------------------------------------------
// Factory — build from DOMRect
// ---------------------------------------------------------------------------

export function createOverlayRect(params: {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  scale?: number;
  viewport: OverlayViewport;
  visible?: boolean;
  zIndex?: number;
}): OverlayRect {
  return {
    x: params.x,
    y: params.y,
    width: params.width,
    height: params.height,
    rotation: params.rotation ?? 0,
    scale: params.scale ?? 1,
    viewport: params.viewport,
    visible: params.visible ?? true,
    zIndex: params.zIndex ?? 100,
  };
}

// ---------------------------------------------------------------------------
// Transform helpers
// ---------------------------------------------------------------------------

/**
 * Convert a point from canvas-space to screen-space,
 * accounting for zoom and scroll offset.
 */
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  viewport: OverlayViewport
): { x: number; y: number } {
  return {
    x: canvasX * viewport.zoom + viewport.offsetX,
    y: canvasY * viewport.zoom + viewport.offsetY,
  };
}

/**
 * Convert a point from screen-space to canvas-space.
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  viewport: OverlayViewport
): { x: number; y: number } {
  return {
    x: (screenX - viewport.offsetX) / viewport.zoom,
    y: (screenY - viewport.offsetY) / viewport.zoom,
  };
}

/**
 * Compute the screen-space rendering rect from an OverlayRect.
 * This is what the UI layer actually renders.
 */
export function overlayRectToScreenRect(
  rect: OverlayRect
): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const screen = canvasToScreen(rect.x, rect.y, rect.viewport);
  return {
    left: screen.x,
    top: screen.y,
    width: rect.width * rect.viewport.zoom * rect.scale,
    height: rect.height * rect.viewport.zoom * rect.scale,
  };
}

/**
 * Get the CSS transform string for a rotated element overlay.
 */
export function overlayTransform(rect: OverlayRect): string {
  if (rect.rotation === 0) return '';
  return `rotate(${rect.rotation}deg)`;
}

