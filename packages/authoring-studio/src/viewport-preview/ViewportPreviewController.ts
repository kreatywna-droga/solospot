/**
 * ViewportPreviewController.ts — Sprint S31 Viewport Preview Controller Operations
 *
 * Provides pure functional operations for viewport switching, zoom/pan adjustments,
 * container bounds updating, and syncing with S21 Camera models.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { BreakpointId } from '../responsive/ResponsiveValueModel';
import { BreakpointRegistry } from '../responsive/BreakpointRegistry';
import {
  createViewportPreviewState,
  type ViewportPanPosition,
  type ViewportPreviewState,
} from './ViewportPreviewModel';

export function switchBreakpoint(
  state: ViewportPreviewState,
  targetBreakpointId: BreakpointId,
  registry: BreakpointRegistry = new BreakpointRegistry()
): ViewportPreviewState {
  return createViewportPreviewState({
    breakpointId: targetBreakpointId,
    containerWidthPx: state.containerWidthPx,
    containerHeightPx: state.containerHeightPx,
    zoomLevel: state.zoomLevel,
    panPosition: state.panPosition,
    registry,
  });
}

export function updateContainerBounds(
  state: ViewportPreviewState,
  containerWidthPx: number,
  containerHeightPx: number,
  registry: BreakpointRegistry = new BreakpointRegistry()
): ViewportPreviewState {
  return createViewportPreviewState({
    breakpointId: state.activeBreakpointId,
    containerWidthPx,
    containerHeightPx,
    zoomLevel: state.zoomLevel,
    panPosition: state.panPosition,
    registry,
  });
}

export function setZoomLevel(
  state: ViewportPreviewState,
  zoomLevel: number,
  registry: BreakpointRegistry = new BreakpointRegistry()
): ViewportPreviewState {
  return createViewportPreviewState({
    breakpointId: state.activeBreakpointId,
    containerWidthPx: state.containerWidthPx,
    containerHeightPx: state.containerHeightPx,
    zoomLevel,
    panPosition: state.panPosition,
    registry,
  });
}

export function zoomIn(
  state: ViewportPreviewState,
  step: number = 0.1,
  registry: BreakpointRegistry = new BreakpointRegistry()
): ViewportPreviewState {
  return setZoomLevel(state, state.zoomLevel + step, registry);
}

export function zoomOut(
  state: ViewportPreviewState,
  step: number = 0.1,
  registry: BreakpointRegistry = new BreakpointRegistry()
): ViewportPreviewState {
  return setZoomLevel(state, state.zoomLevel - step, registry);
}

export function resetZoom(
  state: ViewportPreviewState,
  registry: BreakpointRegistry = new BreakpointRegistry()
): ViewportPreviewState {
  return setZoomLevel(state, 1.0, registry);
}

export function fitToContainer(
  state: ViewportPreviewState,
  registry: BreakpointRegistry = new BreakpointRegistry()
): ViewportPreviewState {
  return createViewportPreviewState({
    breakpointId: state.activeBreakpointId,
    containerWidthPx: state.containerWidthPx,
    containerHeightPx: state.containerHeightPx,
    zoomLevel: 1.0,
    panPosition: { x: 0, y: 0 },
    registry,
  });
}

export function setPanPosition(
  state: ViewportPreviewState,
  panPosition: ViewportPanPosition,
  registry: BreakpointRegistry = new BreakpointRegistry()
): ViewportPreviewState {
  return createViewportPreviewState({
    breakpointId: state.activeBreakpointId,
    containerWidthPx: state.containerWidthPx,
    containerHeightPx: state.containerHeightPx,
    zoomLevel: state.zoomLevel,
    panPosition,
    registry,
  });
}

export function panBy(
  state: ViewportPreviewState,
  dx: number,
  dy: number,
  registry: BreakpointRegistry = new BreakpointRegistry()
): ViewportPreviewState {
  return setPanPosition(
    state,
    {
      x: state.panPosition.x + dx,
      y: state.panPosition.y + dy,
    },
    registry
  );
}
