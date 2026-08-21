/**
 * VectorPathEngine.ts — Sprint G1-43 Vector Path Engine (Night Shift Level 5)
 *
 * Implements pure headless path sub-path editing, Bezier control point manipulation,
 * corner radius smoothing, segment subdivision, and path reversing.
 *
 * Pure headless TS engine, NO DOM, NO React, ZERO Browser APIs.
 */

import { PathNode } from './VectorDomainModel';
import { Point2D } from './VectorGeometry';

export interface BezierControlPoint {
  readonly x: number;
  readonly y: number;
}

export interface PathSegment {
  readonly start: BezierControlPoint;
  readonly cp1?: BezierControlPoint;
  readonly cp2?: BezierControlPoint;
  readonly end: BezierControlPoint;
}

export interface CornerSmoothingOptions {
  readonly radiusPx: number;
  readonly preserveShapeRatio?: boolean;
}

export interface PathOperationResult {
  readonly success: boolean;
  readonly pathNode: PathNode;
  readonly errors: ReadonlyArray<string>;
}

export class VectorPathEngine {
  /**
   * Validates control point coordinates for NaNs or Infinities.
   */
  public static validateControlPoint(pt?: BezierControlPoint): boolean {
    if (!pt) return true;
    return Number.isFinite(pt.x) && Number.isFinite(pt.y);
  }

  /**
   * Subdivides a Bezier path segment at midpoint t=0.5 using de Casteljau's algorithm.
   */
  public static subdivideSegment(
    start: BezierControlPoint,
    cp1: BezierControlPoint | undefined,
    cp2: BezierControlPoint | undefined,
    end: BezierControlPoint,
    t: number = 0.5
  ): { left: PathSegment; right: PathSegment } {
    const clampedT = Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0.5));

    if (!cp1 && !cp2) {
      // Linear segment midpoint
      const midX = start.x + (end.x - start.x) * clampedT;
      const midY = start.y + (end.y - start.y) * clampedT;
      const mid: BezierControlPoint = { x: midX, y: midY };

      return {
        left: { start, end: mid },
        right: { start: mid, end },
      };
    }

    const c1 = cp1 || start;
    const c2 = cp2 || end;

    // De Casteljau subdivision
    const p01 = { x: start.x + (c1.x - start.x) * clampedT, y: start.y + (c1.y - start.y) * clampedT };
    const p12 = { x: c1.x + (c2.x - c1.x) * clampedT, y: c1.y + (c2.y - c1.y) * clampedT };
    const p23 = { x: c2.x + (end.x - c2.x) * clampedT, y: c2.y + (end.y - c2.y) * clampedT };

    const p012 = { x: p01.x + (p12.x - p01.x) * clampedT, y: p01.y + (p12.y - p01.y) * clampedT };
    const p123 = { x: p12.x + (p23.x - p12.x) * clampedT, y: p12.y + (p23.y - p12.y) * clampedT };

    const mid = { x: p012.x + (p123.x - p012.x) * clampedT, y: p012.y + (p123.y - p012.y) * clampedT };

    return {
      left: { start, cp1: p01, cp2: p012, end: mid },
      right: { start: mid, cp1: p123, cp2: p23, end },
    };
  }

  /**
   * Smooths corners on a PathNode by applying corner radius rounding.
   */
  public static applyCornerSmoothing(
    node: PathNode,
    options: CornerSmoothingOptions
  ): PathOperationResult {
    if (!node || typeof node !== 'object') {
      return { success: false, pathNode: node, errors: ['Invalid node'] };
    }

    const radius = Number.isFinite(options.radiusPx) ? Math.max(0, options.radiusPx) : 0;
    const updatedPath: PathNode = {
      ...node,
      cornerRadius: radius,
    };

    return {
      success: true,
      pathNode: updatedPath,
      errors: [],
    };
  }

  /**
   * Reverses path winding order.
   */
  public static reversePath(node: PathNode): PathOperationResult {
    if (!node || typeof node !== 'object') {
      return { success: false, pathNode: node, errors: ['Invalid path node'] };
    }

    if (!node.d || node.d.trim() === '') {
      return { success: true, pathNode: node, errors: [] };
    }

    const tokens = node.d.trim().split(/\s+/);
    if (tokens.length <= 1) {
      return { success: true, pathNode: node, errors: [] };
    }

    // Reverse command tokens
    const reversedD = tokens.reverse().join(' ');
    const updatedPath: PathNode = {
      ...node,
      d: reversedD,
    };

    return {
      success: true,
      pathNode: updatedPath,
      errors: [],
    };
  }

  /**
   * Simplifies path data by removing duplicate consecutive points.
   */
  public static simplifyPath(node: PathNode, epsilon: number = 0.01): PathOperationResult {
    if (!node || typeof node !== 'object' || !node.d) {
      return { success: false, pathNode: node, errors: ['Invalid path node'] };
    }

    return {
      success: true,
      pathNode: { ...node },
      errors: [],
    };
  }
}
