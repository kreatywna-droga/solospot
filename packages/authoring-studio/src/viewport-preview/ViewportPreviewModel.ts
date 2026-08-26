/**
 * ViewportPreviewModel.ts — Sprint S31 Live Preview State & DTOs
 *
 * Defines pure domain DTOs for viewport preview state, zoom/pan bounds, container scale factor,
 * and bridges active breakpoint selection with S21 Camera & Viewport models.
 *
 * NO DOM, NO React, NO requestAnimationFrame, NO Browser API, ZERO Runtime execution.
 */

import type { Breakpoint, BreakpointId } from '../responsive/ResponsiveValueModel';
import { BreakpointRegistry } from '../responsive/BreakpointRegistry';
import { createCamera, createCameraViewport, type Camera } from '../camera/CameraModel';
import { createViewportConfiguration, type ViewportConfiguration } from '../camera/ViewportModel';

export interface ViewportPanPosition {
  readonly x: number;
  readonly y: number;
}

export interface ViewportPreviewState {
  readonly activeBreakpointId: BreakpointId;
  readonly activeBreakpoint: Breakpoint;
  readonly viewportWidthPx: number;
  readonly viewportHeightPx: number;
  readonly containerWidthPx: number;
  readonly containerHeightPx: number;
  readonly zoomLevel: number; // 0.1 - 5.0 (1.0 = 100%)
  readonly panPosition: ViewportPanPosition;
  readonly fitScaleFactor: number;
  readonly effectiveScale: number; // zoomLevel * fitScaleFactor
  readonly s21Camera: Camera;
  readonly s21ViewportConfig: ViewportConfiguration;
}

const DEFAULT_HEIGHT_MAP: Record<string, number> = {
  desktop: 900,
  laptop: 800,
  tablet: 1024,
  mobile: 812,
  mobile_small: 667,
};

export function calculateFitScale(
  viewportWidthPx: number,
  viewportHeightPx: number,
  containerWidthPx: number,
  containerHeightPx: number
): number {
  if (viewportWidthPx <= 0 || viewportHeightPx <= 0 || containerWidthPx <= 0 || containerHeightPx <= 0) {
    return 1.0;
  }
  const scaleX = containerWidthPx / viewportWidthPx;
  const scaleY = containerHeightPx / viewportHeightPx;
  const scale = Math.min(1.0, Math.min(scaleX, scaleY));
  return Math.round(scale * 1000) / 1000;
}

export function calculateEffectiveScale(zoomLevel: number, fitScaleFactor: number): number {
  const clampedZoom = Math.max(0.1, Math.min(5.0, zoomLevel));
  return Math.round(clampedZoom * fitScaleFactor * 1000) / 1000;
}

export function createViewportPreviewState(params?: {
  breakpointId?: BreakpointId;
  containerWidthPx?: number;
  containerHeightPx?: number;
  zoomLevel?: number;
  panPosition?: Partial<ViewportPanPosition>;
  registry?: BreakpointRegistry;
}): ViewportPreviewState {
  const registry = params?.registry ?? new BreakpointRegistry();
  const bpId = params?.breakpointId ?? 'desktop';
  const breakpoint = registry.getBreakpoint(bpId) ?? registry.getBreakpoint('desktop')!;

  const viewportWidthPx = breakpoint.minWidthPx;
  const viewportHeightPx = DEFAULT_HEIGHT_MAP[breakpoint.id] ?? 900;
  const containerWidthPx = params?.containerWidthPx ?? 1440;
  const containerHeightPx = params?.containerHeightPx ?? 900;
  const zoomLevel = Math.max(0.1, Math.min(5.0, params?.zoomLevel ?? 1.0));
  const panPosition: ViewportPanPosition = {
    x: params?.panPosition?.x ?? 0,
    y: params?.panPosition?.y ?? 0,
  };

  const fitScaleFactor = calculateFitScale(
    viewportWidthPx,
    viewportHeightPx,
    containerWidthPx,
    containerHeightPx
  );
  const effectiveScale = calculateEffectiveScale(zoomLevel, fitScaleFactor);

  const cameraViewport = createCameraViewport({
    width: viewportWidthPx,
    height: viewportHeightPx,
  });

  const s21Camera = createCamera({
    id: `cam_preview_${breakpoint.id}`,
    name: `Preview Camera ${breakpoint.name}`,
    viewport: cameraViewport,
    transform: {
      position: { x: panPosition.x, y: panPosition.y },
      zoom: effectiveScale,
      rotationDeg: 0,
    },
  });

  const s21ViewportConfig = createViewportConfiguration({
    id: `vp_preview_${breakpoint.id}`,
    name: `Preview Viewport (${breakpoint.name})`,
    type: 'primary',
    camera: s21Camera,
  });

  return {
    activeBreakpointId: breakpoint.id,
    activeBreakpoint: breakpoint,
    viewportWidthPx,
    viewportHeightPx,
    containerWidthPx,
    containerHeightPx,
    zoomLevel,
    panPosition,
    fitScaleFactor,
    effectiveScale,
    s21Camera,
    s21ViewportConfig,
  };
}
