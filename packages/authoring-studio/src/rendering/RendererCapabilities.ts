/**
 * RendererCapabilities.ts — Sprint S11 Visual Rendering Backend
 *
 * Defines capabilities supported by a specific rendering backend.
 * NO DOM, NO React, NO window. Pure TS interface.
 */

export interface RendererCapabilities {
  readonly maxTextureSize: number;
  readonly supportedBlendModes: ReadonlyArray<string>;
  readonly supportsOffscreenCanvas: boolean;
  readonly supportsHighDpiScaling: boolean;
  readonly supportsClipping: boolean;
  readonly backendType: 'canvas2d' | 'webgl' | 'webgpu' | 'mock';
}

export const DEFAULT_CANVAS2D_CAPABILITIES: RendererCapabilities = {
  maxTextureSize: 4096,
  supportedBlendModes: [
    'source-over',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'hard-light',
    'soft-light',
    'difference',
    'exclusion',
    'hue',
    'saturation',
    'color',
    'luminosity',
  ],
  supportsOffscreenCanvas: true,
  supportsHighDpiScaling: true,
  supportsClipping: true,
  backendType: 'canvas2d',
};
