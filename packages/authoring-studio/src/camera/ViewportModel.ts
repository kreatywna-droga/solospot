/**
 * ViewportModel.ts — Sprint S21 Multi-Canvas / Multi-Viewport Domain Model (ETAP 4)
 *
 * Defines pure DTO data structures for Primary, Secondary, Preview, and Thumbnail viewports,
 * ViewportConfiguration, and MultiViewportLayout modes.
 *
 * Headless model: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Camera, createCamera } from './CameraModel';

export type ViewportType = 'primary' | 'secondary' | 'preview' | 'thumbnail';

export interface ViewportConfiguration {
  readonly id: string;
  readonly type: ViewportType;
  readonly name: string;
  readonly camera: Camera;
  readonly visible: boolean;
  readonly active: boolean;
  readonly syncWithPrimary: boolean;
  readonly containerBounds?: {
    readonly width: number;
    readonly height: number;
  };
}

export type MultiViewportLayoutMode =
  | 'single'
  | 'split-vertical'
  | 'split-horizontal'
  | 'quad'
  | 'pip';

export interface MultiViewportLayout {
  readonly layoutMode: MultiViewportLayoutMode;
  readonly viewports: ReadonlyArray<ViewportConfiguration>;
  readonly primaryViewportId: string;
}

export function createViewportConfiguration(params: {
  id: string;
  type?: ViewportType;
  name?: string;
  camera?: Camera;
  visible?: boolean;
  active?: boolean;
  syncWithPrimary?: boolean;
  containerBounds?: { width: number; height: number };
}): ViewportConfiguration {
  return {
    id: params.id,
    type: params.type ?? 'primary',
    name: params.name ?? `Viewport_${params.id}`,
    camera: params.camera ?? createCamera({ id: `cam_${params.id}` }),
    visible: params.visible ?? true,
    active: params.active ?? true,
    syncWithPrimary: params.syncWithPrimary ?? false,
    containerBounds: params.containerBounds ?? { width: 1920, height: 1080 },
  };
}

export function createMultiViewportLayout(params?: {
  layoutMode?: MultiViewportLayoutMode;
  viewports?: ViewportConfiguration[];
  primaryViewportId?: string;
}): MultiViewportLayout {
  const defaultPrimary = createViewportConfiguration({
    id: 'primary_vp',
    type: 'primary',
    name: 'Main Viewport',
  });

  const viewports = params?.viewports ?? [defaultPrimary];
  const primaryId = params?.primaryViewportId ?? viewports[0]?.id ?? 'primary_vp';

  return {
    layoutMode: params?.layoutMode ?? 'single',
    viewports,
    primaryViewportId: primaryId,
  };
}

export const DEFAULT_MULTI_VIEWPORT_LAYOUT: MultiViewportLayout = createMultiViewportLayout();
