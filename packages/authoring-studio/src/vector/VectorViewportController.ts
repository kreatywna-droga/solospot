/**
 * VectorViewportController.ts — Sprint G1-37 Vector Viewport & Camera Controller
 *
 * Implements a pure, headless controller for Vector Canvas Viewport Navigation & Camera Operations.
 * Manages Zoom (scale factor, focal zoom), Pan (screen pixel offsets), Reset, Fit-to-Screen, Fit-to-Selection,
 * and bidirectional coordinate transformations between Document Canvas space (SSOT) and Viewport Screen space.
 *
 * All state operations return immutable VectorViewportState instances.
 * NO DOM, NO React, NO requestAnimationFrame.
 */

import { Point2D, BoundingBox2D, VectorGeometry } from './VectorGeometry';
import { VectorNode } from './VectorDomainModel';

export interface VectorViewportState {
  readonly zoom: number;             // Viewport scale factor (1.0 = 100%)
  readonly panX: number;             // Viewport offset X in screen pixels
  readonly panY: number;             // Viewport offset Y in screen pixels
  readonly viewportWidth: number;    // Viewport container width in screen pixels
  readonly viewportHeight: number;   // Viewport container height in screen pixels
  readonly minZoom: number;          // Minimum allowed zoom level (clamped, default 0.05)
  readonly maxZoom: number;          // Maximum allowed zoom level (clamped, default 50.0)
}

export function createVectorViewportState(
  initial?: Partial<VectorViewportState>
): VectorViewportState {
  const minZoom = initial?.minZoom !== undefined && Number.isFinite(initial.minZoom) && initial.minZoom > 0
    ? initial.minZoom
    : 0.05;
  const maxZoom = initial?.maxZoom !== undefined && Number.isFinite(initial.maxZoom) && initial.maxZoom >= minZoom
    ? initial.maxZoom
    : 50.0;

  let zoom = initial?.zoom !== undefined && Number.isFinite(initial.zoom) ? initial.zoom : 1.0;
  zoom = Math.max(minZoom, Math.min(maxZoom, zoom));

  const panX = initial?.panX !== undefined && Number.isFinite(initial.panX) ? initial.panX : 0;
  const panY = initial?.panY !== undefined && Number.isFinite(initial.panY) ? initial.panY : 0;
  const viewportWidth = initial?.viewportWidth !== undefined && Number.isFinite(initial.viewportWidth) && initial.viewportWidth >= 0
    ? initial.viewportWidth
    : 1920;
  const viewportHeight = initial?.viewportHeight !== undefined && Number.isFinite(initial.viewportHeight) && initial.viewportHeight >= 0
    ? initial.viewportHeight
    : 1080;

  return {
    zoom,
    panX,
    panY,
    viewportWidth,
    viewportHeight,
    minZoom,
    maxZoom,
  };
}

/**
 * Sets zoom level with optional focal point pinning.
 * If centerPoint is omitted, zooms relative to the center of the viewport container.
 */
export function setZoom(
  state: VectorViewportState,
  targetZoom: number,
  centerPoint?: Point2D
): VectorViewportState {
  if (!Number.isFinite(targetZoom)) {
    return state;
  }

  const clampedZoom = Math.max(state.minZoom, Math.min(state.maxZoom, targetZoom));
  if (clampedZoom === state.zoom) {
    return state;
  }

  const focal: Point2D = centerPoint && Number.isFinite(centerPoint.x) && Number.isFinite(centerPoint.y)
    ? centerPoint
    : { x: state.viewportWidth / 2, y: state.viewportHeight / 2 };

  // Canvas coordinate of the focal point before zoom
  const canvasFocalX = (focal.x - state.panX) / state.zoom;
  const canvasFocalY = (focal.y - state.panY) / state.zoom;

  // Compute new pan so focal point remains invariant in screen space
  const nextPanX = focal.x - canvasFocalX * clampedZoom;
  const nextPanY = focal.y - canvasFocalY * clampedZoom;

  return {
    ...state,
    zoom: clampedZoom,
    panX: nextPanX,
    panY: nextPanY,
  };
}

/**
 * Zooms in by scale factor (default 1.25).
 */
export function zoomIn(
  state: VectorViewportState,
  factor: number = 1.25,
  centerPoint?: Point2D
): VectorViewportState {
  if (!Number.isFinite(factor) || factor <= 0) {
    return state;
  }
  return setZoom(state, state.zoom * factor, centerPoint);
}

/**
 * Zooms out by scale factor (default 0.8).
 */
export function zoomOut(
  state: VectorViewportState,
  factor: number = 0.8,
  centerPoint?: Point2D
): VectorViewportState {
  if (!Number.isFinite(factor) || factor <= 0) {
    return state;
  }
  return setZoom(state, state.zoom * factor, centerPoint);
}

/**
 * Adjusts viewport pan position by screen pixel deltas (dx, dy).
 */
export function panViewport(
  state: VectorViewportState,
  deltaX: number,
  deltaY: number
): VectorViewportState {
  if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY) || (deltaX === 0 && deltaY === 0)) {
    return state;
  }

  return {
    ...state,
    panX: state.panX + deltaX,
    panY: state.panY + deltaY,
  };
}

/**
 * Resets viewport to 100% zoom (1.0) and origin pan (0,0).
 */
export function resetViewport(state: VectorViewportState): VectorViewportState {
  return {
    ...state,
    zoom: 1.0,
    panX: 0,
    panY: 0,
  };
}

/**
 * Fits a target bounding box into the viewport container with specified padding.
 */
export function fitToScreen(
  state: VectorViewportState,
  bounds: BoundingBox2D,
  containerSize?: { width: number; height: number },
  padding: number = 40
): VectorViewportState {
  if (
    !bounds ||
    !Number.isFinite(bounds.x) ||
    !Number.isFinite(bounds.y) ||
    !Number.isFinite(bounds.width) ||
    !Number.isFinite(bounds.height) ||
    bounds.width <= 0 ||
    bounds.height <= 0
  ) {
    return state;
  }

  const vWidth = containerSize && Number.isFinite(containerSize.width) && containerSize.width > 0
    ? containerSize.width
    : state.viewportWidth;
  const vHeight = containerSize && Number.isFinite(containerSize.height) && containerSize.height > 0
    ? containerSize.height
    : state.viewportHeight;

  const pad = Number.isFinite(padding) && padding >= 0 ? padding : 40;
  const availWidth = Math.max(10, vWidth - 2 * pad);
  const availHeight = Math.max(10, vHeight - 2 * pad);

  const rawZoom = Math.min(availWidth / bounds.width, availHeight / bounds.height);
  const clampedZoom = Math.max(state.minZoom, Math.min(state.maxZoom, rawZoom));

  const boundsCenterX = bounds.x + bounds.width / 2;
  const boundsCenterY = bounds.y + bounds.height / 2;

  const nextPanX = vWidth / 2 - boundsCenterX * clampedZoom;
  const nextPanY = vHeight / 2 - boundsCenterY * clampedZoom;

  return {
    ...state,
    zoom: clampedZoom,
    panX: nextPanX,
    panY: nextPanY,
    viewportWidth: vWidth,
    viewportHeight: vHeight,
  };
}

/**
 * Fits selected nodes bounding box into the viewport container.
 */
export function fitToSelection(
  state: VectorViewportState,
  selectedNodes: ReadonlyArray<VectorNode>,
  containerSize?: { width: number; height: number },
  padding: number = 40
): VectorViewportState {
  if (!selectedNodes || selectedNodes.length === 0) {
    return state;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of selectedNodes) {
    if (!node || typeof node !== 'object' || !node.transform || typeof node.transform !== 'object') {
      continue;
    }
    const bbox = VectorGeometry.computeBoundingBox(node);
    if (bbox && Number.isFinite(bbox.x) && Number.isFinite(bbox.y) && Number.isFinite(bbox.width) && Number.isFinite(bbox.height)) {
      if (bbox.width > 0 || bbox.height > 0) {
        minX = Math.min(minX, bbox.x);
        minY = Math.min(minY, bbox.y);
        maxX = Math.max(maxX, bbox.x + bbox.width);
        maxY = Math.max(maxY, bbox.y + bbox.height);
      }
    }
  }

  if (minX === Infinity || minY === Infinity || maxX <= minX || maxY <= minY) {
    return state;
  }

  const boundingBox: BoundingBox2D = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };

  return fitToScreen(state, boundingBox, containerSize, padding);
}

/**
 * Converts a document canvas point (x, y) to viewport screen coordinates (vx, vy).
 */
export function canvasToViewportPoint(
  point: Point2D,
  viewportState: VectorViewportState
): Point2D {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return { x: 0, y: 0 };
  }
  return {
    x: point.x * viewportState.zoom + viewportState.panX,
    y: point.y * viewportState.zoom + viewportState.panY,
  };
}

/**
 * Converts a viewport screen point (vx, vy) to document canvas coordinates (x, y).
 */
export function viewportToCanvasPoint(
  point: Point2D,
  viewportState: VectorViewportState
): Point2D {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return { x: 0, y: 0 };
  }
  return {
    x: (point.x - viewportState.panX) / viewportState.zoom,
    y: (point.y - viewportState.panY) / viewportState.zoom,
  };
}

/**
 * Converts a viewport screen bounding box to document canvas coordinates.
 */
export function viewportToCanvasBounds(
  bounds: BoundingBox2D,
  viewportState: VectorViewportState
): BoundingBox2D {
  if (
    !bounds ||
    !Number.isFinite(bounds.x) ||
    !Number.isFinite(bounds.y) ||
    !Number.isFinite(bounds.width) ||
    !Number.isFinite(bounds.height)
  ) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const topLeft = viewportToCanvasPoint({ x: bounds.x, y: bounds.y }, viewportState);
  const bottomRight = viewportToCanvasPoint(
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    viewportState
  );

  return {
    x: Math.min(topLeft.x, bottomRight.x),
    y: Math.min(topLeft.y, bottomRight.y),
    width: Math.abs(bottomRight.x - topLeft.x),
    height: Math.abs(bottomRight.y - topLeft.y),
  };
}

/**
 * Converts a document canvas bounding box to viewport screen coordinates.
 */
export function canvasToViewportBounds(
  bounds: BoundingBox2D,
  viewportState: VectorViewportState
): BoundingBox2D {
  if (
    !bounds ||
    !Number.isFinite(bounds.x) ||
    !Number.isFinite(bounds.y) ||
    !Number.isFinite(bounds.width) ||
    !Number.isFinite(bounds.height)
  ) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const topLeft = canvasToViewportPoint({ x: bounds.x, y: bounds.y }, viewportState);
  const bottomRight = canvasToViewportPoint(
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    viewportState
  );

  return {
    x: Math.min(topLeft.x, bottomRight.x),
    y: Math.min(topLeft.y, bottomRight.y),
    width: Math.abs(bottomRight.x - topLeft.x),
    height: Math.abs(bottomRight.y - topLeft.y),
  };
}
