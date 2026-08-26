/**
 * CanvasRendererState.ts — Sprint S11 Canvas Renderer State Stack Tracker
 *
 * Tracks local stack state (transform, opacity, clip, blend mode) for CanvasRenderer.
 */

import { Matrix2DAffine, RenderBoundingBoxDTO } from './RendererCommand';
import { IDENTITY_MATRIX_2D, StackFrameState } from './RendererState';

export class CanvasRendererStateStack {
  private stack: StackFrameState[] = [];
  private currentTransform: Matrix2DAffine = IDENTITY_MATRIX_2D;
  private currentOpacity: number = 1.0;
  private currentBlendMode: string = 'source-over';
  private currentClipBounds?: RenderBoundingBoxDTO;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.stack = [];
    this.currentTransform = IDENTITY_MATRIX_2D;
    this.currentOpacity = 1.0;
    this.currentBlendMode = 'source-over';
    this.currentClipBounds = undefined;
  }

  public pushState(): void {
    this.stack.push({
      transform: [...this.currentTransform],
      opacity: this.currentOpacity,
      blendMode: this.currentBlendMode,
      clipBounds: this.currentClipBounds ? { ...this.currentClipBounds } : undefined,
    });
  }

  public popState(): void {
    const previous = this.stack.pop();
    if (previous) {
      this.currentTransform = previous.transform;
      this.currentOpacity = previous.opacity;
      this.currentBlendMode = previous.blendMode;
      this.currentClipBounds = previous.clipBounds;
    }
  }

  public setTransform(transform: Matrix2DAffine): void {
    this.currentTransform = transform;
  }

  public setOpacity(opacity: number): void {
    this.currentOpacity = Math.max(0, Math.min(1, opacity));
  }

  public setBlendMode(blendMode: string): void {
    this.currentBlendMode = blendMode;
  }

  public setClipBounds(bounds: RenderBoundingBoxDTO): void {
    this.currentClipBounds = bounds;
  }

  public get depth(): number {
    return this.stack.length;
  }

  public get transform(): Matrix2DAffine {
    return this.currentTransform;
  }

  public get opacity(): number {
    return this.currentOpacity;
  }

  public get blendMode(): string {
    return this.currentBlendMode;
  }

  public get clipBounds(): RenderBoundingBoxDTO | undefined {
    return this.currentClipBounds;
  }
}
