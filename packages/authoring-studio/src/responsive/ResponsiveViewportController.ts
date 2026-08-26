/**
 * ResponsiveViewportController.ts — Sprint S28 Viewport & Camera Responsive Controller
 *
 * Headlessly coordinates switching active responsive breakpoints with S21 Viewport & Camera models.
 * Calculates frame-accurate canvas container bounds and aspect ratio scaling for crisp responsive previewing.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { Breakpoint, BreakpointId } from './ResponsiveValueModel';
import { BreakpointRegistry } from './BreakpointRegistry';
import { createViewportConfiguration, type ViewportConfiguration } from '../camera/ViewportModel';
import { createCamera, createCameraViewport, type CameraViewport } from '../camera/CameraModel';

export interface ResponsiveViewportState {
  readonly activeBreakpointId: BreakpointId;
  readonly activeBreakpoint: Breakpoint;
  readonly viewportWidthPx: number;
  readonly viewportHeightPx: number;
  readonly containerWidthPx: number;
  readonly containerHeightPx: number;
  readonly scaleFactor: number;
  readonly s21ViewportConfig: ViewportConfiguration;
}

/**
 * Creates an initial ResponsiveViewportState for a given breakpoint and canvas container size.
 */
export function createResponsiveViewportState(
  breakpointId: BreakpointId = 'desktop',
  containerWidthPx: number = 1440,
  containerHeightPx: number = 900,
  registry: BreakpointRegistry = new BreakpointRegistry()
): ResponsiveViewportState {
  const breakpoint = registry.getBreakpoint(breakpointId) ?? registry.getBreakpoint('desktop')!;
  
  // Default aspect ratio heights if not specified
  const heightMap: Record<string, number> = {
    desktop: 900,
    laptop: 800,
    tablet: 1024,
    mobile: 812,
    mobile_small: 667,
  };

  const viewportWidthPx = breakpoint.minWidthPx;
  const viewportHeightPx = heightMap[breakpoint.id] ?? 900;

  // Calculate container fit scale factor
  const scaleX = containerWidthPx / viewportWidthPx;
  const scaleY = containerHeightPx / viewportHeightPx;
  const scaleFactor = Math.min(1.0, Math.min(scaleX, scaleY));

  const cameraViewport: CameraViewport = createCameraViewport({
    width: viewportWidthPx,
    height: viewportHeightPx,
  });

  const camera = createCamera({
    id: `cam_responsive_${breakpoint.id}`,
    name: `Camera ${breakpoint.name}`,
    viewport: cameraViewport,
    transform: {
      position: { x: viewportWidthPx / 2, y: viewportHeightPx / 2 },
      zoom: scaleFactor,
      rotationDeg: 0,
    },
  });

  const s21ViewportConfig = createViewportConfiguration({
    id: `vp_responsive_${breakpoint.id}`,
    name: `Responsive Viewport (${breakpoint.name})`,
    type: 'primary',
    camera,
  });

  return {
    activeBreakpointId: breakpoint.id,
    activeBreakpoint: breakpoint,
    viewportWidthPx,
    viewportHeightPx,
    containerWidthPx,
    containerHeightPx,
    scaleFactor: Math.round(scaleFactor * 1000) / 1000,
    s21ViewportConfig,
  };
}

/**
 * Switches the active breakpoint in ResponsiveViewportState and updates S21 viewport configuration.
 */
export function switchActiveBreakpoint(
  state: ResponsiveViewportState,
  targetBreakpointId: BreakpointId,
  registry: BreakpointRegistry = new BreakpointRegistry()
): ResponsiveViewportState {
  return createResponsiveViewportState(
    targetBreakpointId,
    state.containerWidthPx,
    state.containerHeightPx,
    registry
  );
}

/**
 * Updates canvas container bounds and recalculates container fit scale factor.
 */
export function updateContainerBounds(
  state: ResponsiveViewportState,
  containerWidthPx: number,
  containerHeightPx: number,
  registry: BreakpointRegistry = new BreakpointRegistry()
): ResponsiveViewportState {
  return createResponsiveViewportState(
    state.activeBreakpointId,
    containerWidthPx,
    containerHeightPx,
    registry
  );
}
