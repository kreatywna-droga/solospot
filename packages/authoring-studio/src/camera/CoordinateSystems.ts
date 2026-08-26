/**
 * CoordinateSystems.ts — Sprint S21 Coordinate Systems Engine (ETAP 3)
 *
 * Implements pure 2D affine matrix math mapping across coordinate spaces:
 * World Space ↔ Scene Space ↔ Camera Space ↔ Viewport Space ↔ Screen Space
 *
 * Functions:
 * - worldToScreen, screenToWorld
 * - worldToViewport, viewportToWorld
 * - computeCameraMatrix, computeInverseCameraMatrix
 *
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Matrix2D, SceneCompositor } from '../scene/SceneCompositor';
import { Camera, CameraBounds } from './CameraModel';

export class CoordinateSystems {
  /**
   * Computes the 2D affine transform matrix for a Camera instance.
   * Matrix translates world space by camera position, applies zoom scaling and view rotation.
   */
  public static computeCameraMatrix(camera: Camera): Matrix2D {
    const { position, zoom, rotationDeg } = camera.transform;
    const rad = (rotationDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Matrix: Translation(-pos) * Rotation * Scale(zoom) * Translation(viewportCenter)
    const vwHalf = camera.viewport.width / 2;
    const vhHalf = camera.viewport.height / 2;

    const a = cos * zoom;
    const b = sin * zoom;
    const c = -sin * zoom;
    const d = cos * zoom;

    const e = vwHalf - (position.x * a + position.y * c);
    const f = vhHalf - (position.x * b + position.y * d);

    return [a, b, c, d, e, f];
  }

  /**
   * Computes the inverse matrix of a 2D affine matrix [a, b, c, d, e, f].
   */
  public static invertMatrix(m: Matrix2D): Matrix2D {
    const [a, b, c, d, e, f] = m;
    const det = a * d - b * c;

    if (Math.abs(det) < 1e-10) {
      return SceneCompositor.IDENTITY_MATRIX;
    }

    const invDet = 1.0 / det;
    const invA = d * invDet;
    const invB = -b * invDet;
    const invC = -c * invDet;
    const invD = a * invDet;
    const invE = (c * f - d * e) * invDet;
    const invF = (b * e - a * f) * invDet;

    return [invA, invB, invC, invD, invE, invF];
  }

  /**
   * Computes the inverse camera matrix (Screen/Viewport space → World space).
   */
  public static computeInverseCameraMatrix(camera: Camera): Matrix2D {
    const matrix = this.computeCameraMatrix(camera);
    return this.invertMatrix(matrix);
  }

  /**
   * Transforms a 2D point (x, y) using an affine matrix.
   */
  public static transformPoint(
    point: { x: number; y: number },
    matrix: Matrix2D
  ): { x: number; y: number } {
    const [a, b, c, d, e, f] = matrix;
    return {
      x: a * point.x + c * point.y + e,
      y: b * point.x + d * point.y + f,
    };
  }

  /**
   * Transforms a point from World Space to Screen / Viewport Space.
   */
  public static worldToScreen(
    point: { x: number; y: number },
    camera: Camera
  ): { x: number; y: number } {
    const matrix = this.computeCameraMatrix(camera);
    const transformed = this.transformPoint(point, matrix);
    return {
      x: transformed.x * camera.viewport.devicePixelRatio,
      y: transformed.y * camera.viewport.devicePixelRatio,
    };
  }

  /**
   * Transforms a point from Screen / Viewport Space to World Space.
   */
  public static screenToWorld(
    point: { x: number; y: number },
    camera: Camera
  ): { x: number; y: number } {
    const unscaled = {
      x: point.x / camera.viewport.devicePixelRatio,
      y: point.y / camera.viewport.devicePixelRatio,
    };
    const invMatrix = this.computeInverseCameraMatrix(camera);
    return this.transformPoint(unscaled, invMatrix);
  }

  /**
   * Maps world space bounding box to viewport space bounding box.
   */
  public static worldToViewport(bounds: CameraBounds, camera: Camera): CameraBounds {
    const matrix = this.computeCameraMatrix(camera);
    const p1 = this.transformPoint({ x: bounds.x, y: bounds.y }, matrix);
    const p2 = this.transformPoint({ x: bounds.x + bounds.width, y: bounds.y }, matrix);
    const p3 = this.transformPoint({ x: bounds.x, y: bounds.y + bounds.height }, matrix);
    const p4 = this.transformPoint({ x: bounds.x + bounds.width, y: bounds.y + bounds.height }, matrix);

    const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Maps viewport space bounding box to world space bounding box.
   */
  public static viewportToWorld(bounds: CameraBounds, camera: Camera): CameraBounds {
    const invMatrix = this.computeInverseCameraMatrix(camera);
    const p1 = this.transformPoint({ x: bounds.x, y: bounds.y }, invMatrix);
    const p2 = this.transformPoint({ x: bounds.x + bounds.width, y: bounds.y }, invMatrix);
    const p3 = this.transformPoint({ x: bounds.x, y: bounds.y + bounds.height }, invMatrix);
    const p4 = this.transformPoint({ x: bounds.x + bounds.width, y: bounds.y + bounds.height }, invMatrix);

    const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
}
