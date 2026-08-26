/**
 * RendererState.ts — Sprint S11 Visual Rendering Backend
 *
 * State contract reflecting the current state of a RendererBackend.
 * NO DOM, NO React, NO window. Pure TS DTOs.
 */

import { Matrix2DAffine, RenderBoundingBoxDTO } from './RendererCommand';

export interface StackFrameState {
  readonly transform: Matrix2DAffine;
  readonly opacity: number;
  readonly blendMode: string;
  readonly clipBounds?: RenderBoundingBoxDTO;
}

export interface RendererState {
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly devicePixelRatio: number;
  readonly currentOpacity: number;
  readonly currentBlendMode: string;
  readonly currentTransform: Matrix2DAffine;
  readonly activeClipBounds?: RenderBoundingBoxDTO;
  readonly stackDepth: number;
}

export const IDENTITY_MATRIX_2D: Matrix2DAffine = [1, 0, 0, 1, 0, 0];

export function createInitialRendererState(
  width: number = 1920,
  height: number = 1080,
  dpr: number = 1.0
): RendererState {
  return {
    viewportWidth: width,
    viewportHeight: height,
    devicePixelRatio: dpr,
    currentOpacity: 1.0,
    currentBlendMode: 'source-over',
    currentTransform: IDENTITY_MATRIX_2D,
    stackDepth: 0,
  };
}
