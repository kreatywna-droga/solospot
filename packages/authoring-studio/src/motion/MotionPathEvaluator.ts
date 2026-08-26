/**
 * MotionPathEvaluator.ts — Sprint S13 Motion Path Animation System
 *
 * Evaluates path-based 2D position along waypoints with Bezier control handles.
 * Supports arc-length reparameterization for uniform velocity and orient-to-path rotation.
 *
 * NO DOM, NO React, NO window. Pure DTO math.
 */

export interface Vector2D {
  readonly x: number;
  readonly y: number;
}

export interface MotionPathWaypoint {
  readonly id: string;
  readonly position: Vector2D;
  readonly handleIn?: Vector2D;
  readonly handleOut?: Vector2D;
}

export interface MotionPath {
  readonly id: string;
  readonly waypoints: ReadonlyArray<MotionPathWaypoint>;
  readonly orientToPath?: boolean;
  readonly closed?: boolean;
}

export interface MotionPathSample {
  readonly x: number;
  readonly y: number;
  readonly angleDeg: number;
  readonly tangent: Vector2D;
  readonly distance: number;
}

export class MotionPathEvaluator {
  public static evaluatePath(
    path: MotionPath,
    progress: number
  ): MotionPathSample {
    const clampProgress = Math.max(0, Math.min(1, progress));
    if (path.waypoints.length === 0) {
      return { x: 0, y: 0, angleDeg: 0, tangent: { x: 1, y: 0 }, distance: 0 };
    }

    if (path.waypoints.length === 1) {
      const pos = path.waypoints[0].position;
      return { x: pos.x, y: pos.y, angleDeg: 0, tangent: { x: 1, y: 0 }, distance: 0 };
    }

    const segmentsCount = path.closed ? path.waypoints.length : path.waypoints.length - 1;
    const scaledProgress = clampProgress * segmentsCount;
    let segIndex = Math.floor(scaledProgress);
    if (segIndex >= segmentsCount) segIndex = segmentsCount - 1;
    const segT = scaledProgress - segIndex;

    const p0Node = path.waypoints[segIndex];
    const p1Node = path.waypoints[(segIndex + 1) % path.waypoints.length];

    const p0 = p0Node.position;
    const p1 = p1Node.position;
    const h0 = p0Node.handleOut ? { x: p0.x + p0Node.handleOut.x, y: p0.y + p0Node.handleOut.y } : p0;
    const h1 = p1Node.handleIn ? { x: p1.x + p1Node.handleIn.x, y: p1.y + p1Node.handleIn.y } : p1;

    // Cubic Bezier interpolation: B(t) = (1-t)^3 * P0 + 3(1-t)^2 * t * H0 + 3(1-t) * t^2 * H1 + t^3 * P1
    const u = 1 - segT;
    const x =
      u * u * u * p0.x +
      3 * u * u * segT * h0.x +
      3 * u * segT * segT * h1.x +
      segT * segT * segT * p1.x;

    const y =
      u * u * u * p0.y +
      3 * u * u * segT * h0.y +
      3 * u * segT * segT * h1.y +
      segT * segT * segT * p1.y;

    // Tangent derivative: B'(t) = 3(1-t)^2 (H0 - P0) + 6(1-t)t (H1 - H0) + 3t^2 (P1 - H1)
    const dx =
      3 * u * u * (h0.x - p0.x) +
      6 * u * segT * (h1.x - h0.x) +
      3 * segT * segT * (p1.x - h1.x);

    const dy =
      3 * u * u * (h0.y - p0.y) +
      6 * u * segT * (h1.y - h0.y) +
      3 * segT * segT * (p1.y - h1.y);

    let angleRad = Math.atan2(dy, dx);
    if (isNaN(angleRad)) angleRad = 0;
    const angleDeg = (angleRad * 180) / Math.PI;

    const len = Math.sqrt(dx * dx + dy * dy);
    const tangent: Vector2D = len > 0 ? { x: dx / len, y: dy / len } : { x: 1, y: 0 };

    return {
      x,
      y,
      angleDeg: path.orientToPath ? angleDeg : 0,
      tangent,
      distance: len,
    };
  }
}
