/**
 * CanvasRenderSurface.ts — Sprint S11 Canvas Surface Adapter
 *
 * Encapsulates an HTMLCanvasElement, OffscreenCanvas, or MockCanvas for rendering.
 * All Canvas API access is safely localized inside this adapter.
 */

import { RendererSurface, RendererSurfaceContext } from './RendererSurface';

export interface CanvasLikeElement {
  width: number;
  height: number;
  getContext?(contextId: '2d', options?: unknown): unknown;
}

export class CanvasRenderSurface implements RendererSurface {
  private canvasElement?: CanvasLikeElement;
  private ctx2dInstance?: any;
  private currentWidth: number;
  private currentHeight: number;
  private currentDpr: number;

  constructor(
    canvasOrCtx?: CanvasLikeElement | any,
    width: number = 1920,
    height: number = 1080,
    devicePixelRatio: number = 1.0
  ) {
    this.currentWidth = width;
    this.currentHeight = height;
    this.currentDpr = devicePixelRatio;

    if (canvasOrCtx) {
      if (typeof canvasOrCtx.getContext === 'function') {
        this.canvasElement = canvasOrCtx;
        this.ctx2dInstance = canvasOrCtx.getContext('2d');
        if (canvasOrCtx.width) this.currentWidth = canvasOrCtx.width;
        if (canvasOrCtx.height) this.currentHeight = canvasOrCtx.height;
      } else {
        // Direct context or mock context provided
        this.ctx2dInstance = canvasOrCtx;
      }
    }
  }

  public get width(): number {
    return this.currentWidth;
  }

  public get height(): number {
    return this.currentHeight;
  }

  public get devicePixelRatio(): number {
    return this.currentDpr;
  }

  public resize(width: number, height: number, devicePixelRatio: number = 1.0): void {
    this.currentWidth = width;
    this.currentHeight = height;
    this.currentDpr = devicePixelRatio;

    if (this.canvasElement) {
      this.canvasElement.width = Math.floor(width * devicePixelRatio);
      this.canvasElement.height = Math.floor(height * devicePixelRatio);
    }
  }

  public getSurfaceContext(): RendererSurfaceContext {
    return {
      canvas: this.canvasElement,
      ctx2d: this.ctx2dInstance,
      type: 'canvas2d',
    };
  }

  public clear(): void {
    if (this.ctx2dInstance && typeof this.ctx2dInstance.clearRect === 'function') {
      this.ctx2dInstance.clearRect(0, 0, this.currentWidth, this.currentHeight);
    }
  }
}
