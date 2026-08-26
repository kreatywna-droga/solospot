/**
 * RendererSurface.ts — Sprint S11 Visual Rendering Backend
 *
 * Surface abstraction contract representing target canvas/rendering surface.
 * NO DOM, NO React, NO window direct imports. Pure TS interface.
 */

export interface RendererSurfaceContext {
  readonly canvas?: unknown;
  readonly ctx2d?: unknown;
  readonly type: string;
}

export interface RendererSurface {
  readonly width: number;
  readonly height: number;
  readonly devicePixelRatio: number;
  resize(width: number, height: number, devicePixelRatio?: number): void;
  getSurfaceContext(): RendererSurfaceContext;
  clear(): void;
}
