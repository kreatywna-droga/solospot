/**
 * Transform2DAnimation.ts — Sprint S13 Full 2D Transform Animation Engine
 *
 * Computes complete 2D transformation matrices including Position X/Y, Scale X/Y,
 * Rotation Z, Skew X/Y, Opacity, and Anchor Point (Pivot) matrix multiplication.
 *
 * NO DOM, NO React, NO window. Pure DTO math.
 */

import { Matrix2DAffine } from '../rendering/RendererCommand';
import { IDENTITY_MATRIX_2D } from '../rendering/RendererState';

export interface Transform2DState {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly rotationDeg: number;
  readonly skewXDeg: number;
  readonly skewYDeg: number;
  readonly opacity: number;
  readonly anchorX: number; // 0..1 (e.g. 0.5 center)
  readonly anchorY: number; // 0..1 (e.g. 0.5 center)
}

export const DEFAULT_TRANSFORM_2D_STATE: Transform2DState = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  scaleX: 1.0,
  scaleY: 1.0,
  rotationDeg: 0,
  skewXDeg: 0,
  skewYDeg: 0,
  opacity: 1.0,
  anchorX: 0.5,
  anchorY: 0.5,
};

export class Transform2DAnimation {
  public static multiplyAffineMatrices(a: Matrix2DAffine, b: Matrix2DAffine): Matrix2DAffine {
    // a = [a1, b1, c1, d1, e1, f1]
    // b = [a2, b2, c2, d2, e2, f2]
    const a1 = a[0], b1 = a[1], c1 = a[2], d1 = a[3], e1 = a[4], f1 = a[5];
    const a2 = b[0], b2 = b[1], c2 = b[2], d2 = b[3], e2 = b[4], f2 = b[5];

    return [
      a1 * a2 + c1 * b2,
      b1 * a2 + d1 * b2,
      a1 * c2 + c1 * d2,
      b1 * c2 + d1 * d2,
      a1 * e2 + c1 * f2 + e1,
      b1 * e2 + d1 * f2 + f1,
    ];
  }

  public static createTranslationMatrix(tx: number, ty: number): Matrix2DAffine {
    return [1, 0, 0, 1, tx, ty];
  }

  public static createScaleMatrix(sx: number, sy: number): Matrix2DAffine {
    return [sx, 0, 0, sy, 0, 0];
  }

  public static createRotationMatrix(rotationDeg: number): Matrix2DAffine {
    const rad = (rotationDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return [cos, sin, -sin, cos, 0, 0];
  }

  public static createSkewMatrix(skewXDeg: number, skewYDeg: number): Matrix2DAffine {
    const radX = (skewXDeg * Math.PI) / 180;
    const radY = (skewYDeg * Math.PI) / 180;
    const tanX = Math.tan(radX);
    const tanY = Math.tan(radY);
    return [1, tanY, tanX, 1, 0, 0];
  }

  public static computeLocalMatrix(state: Partial<Transform2DState>): Matrix2DAffine {
    const fullState: Transform2DState = {
      ...DEFAULT_TRANSFORM_2D_STATE,
      ...state,
    };

    const { x, y, width, height, scaleX, scaleY, rotationDeg, skewXDeg, skewYDeg, anchorX, anchorY } = fullState;

    // Relative pivot offset within node bounds
    const ox = width * anchorX;
    const oy = height * anchorY;

    // 1. Move to element position + pivot
    let mat = Transform2DAnimation.createTranslationMatrix(x + ox, y + oy);

    // 2. Rotation
    if (rotationDeg !== 0) {
      const rotMat = Transform2DAnimation.createRotationMatrix(rotationDeg);
      mat = Transform2DAnimation.multiplyAffineMatrices(mat, rotMat);
    }

    // 3. Skew
    if (skewXDeg !== 0 || skewYDeg !== 0) {
      const skewMat = Transform2DAnimation.createSkewMatrix(skewXDeg, skewYDeg);
      mat = Transform2DAnimation.multiplyAffineMatrices(mat, skewMat);
    }

    // 4. Scale
    if (scaleX !== 1 || scaleY !== 1) {
      const scaleMat = Transform2DAnimation.createScaleMatrix(scaleX, scaleY);
      mat = Transform2DAnimation.multiplyAffineMatrices(mat, scaleMat);
    }

    // 5. Move back from pivot offset
    const backTranslation = Transform2DAnimation.createTranslationMatrix(-ox, -oy);
    mat = Transform2DAnimation.multiplyAffineMatrices(mat, backTranslation);

    return mat;
  }

  public static calculateTransformMatrix(state: Partial<Transform2DState>): Matrix2DAffine {
    return Transform2DAnimation.computeLocalMatrix(state);
  }
}
