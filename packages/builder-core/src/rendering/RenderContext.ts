/**
 * RenderContext.ts — Sprint S10 Real Rendering Engine Core
 *
 * Immutable context specification for frame rendering operations.
 * NO React, NO Browser API, NO side effects. Pure DTO and builder function.
 */

export interface RenderViewport {
  readonly width: number;
  readonly height: number;
  readonly devicePixelRatio: number;
}

export interface RenderQualityOptions {
  readonly colorSpace: 'srgb' | 'display-p3';
  readonly antialiasing: boolean;
  readonly precision: 'low' | 'medium' | 'high';
  readonly enableCache: boolean;
  readonly enableDirtyRegions: boolean;
}

export interface RenderContext {
  readonly id: string;
  readonly timestampMs: number;
  readonly frameIndex: number;
  readonly targetFps: number;
  readonly viewport: RenderViewport;
  readonly quality: RenderQualityOptions;
  readonly locale?: string;
  readonly isExportMode: boolean;
}

export const DEFAULT_VIEWPORT: RenderViewport = {
  width: 1920,
  height: 1080,
  devicePixelRatio: 1.0,
};

export const DEFAULT_RENDER_QUALITY: RenderQualityOptions = {
  colorSpace: 'srgb',
  antialiasing: true,
  precision: 'high',
  enableCache: true,
  enableDirtyRegions: true,
};

export function createRenderContext(
  overrides?: Partial<RenderContext>
): RenderContext {
  const timestampMs = overrides?.timestampMs ?? 0;
  const targetFps = overrides?.targetFps ?? 60;
  const frameIndex = overrides?.frameIndex ?? Math.floor((timestampMs / 1000) * targetFps);

  return {
    id: overrides?.id ?? `render_ctx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestampMs,
    frameIndex,
    targetFps,
    viewport: overrides?.viewport ? { ...DEFAULT_VIEWPORT, ...overrides.viewport } : DEFAULT_VIEWPORT,
    quality: overrides?.quality ? { ...DEFAULT_RENDER_QUALITY, ...overrides.quality } : DEFAULT_RENDER_QUALITY,
    locale: overrides?.locale ?? 'en-US',
    isExportMode: overrides?.isExportMode ?? false,
  };
}
