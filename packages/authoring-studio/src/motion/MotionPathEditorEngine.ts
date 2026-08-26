/**
 * MotionPathEditorEngine.ts — Sprint S14 Motion Path Editor Engine
 *
 * Handles domain operations for spatial motion paths (drag path waypoints, adjust tangent handles,
 * reverse path direction, split path at waypoint, and compute animated preview positions).
 * Delegates path math strictly to S13 MotionPathEvaluator.
 */

import { MotionPathEvaluator, MotionPath, MotionPathWaypoint } from './MotionPathEvaluator';

export class MotionPathEditorEngine {
  /**
   * Drags a path waypoint to new (x, y) coordinates and returns updated MotionPath DTO.
   */
  public static moveWaypoint(path: MotionPath, waypointId: string, newX: number, newY: number): MotionPath {
    const updatedWaypoints = path.waypoints.map((wp) => {
      if (wp.id === waypointId) {
        return {
          ...wp,
          position: { x: newX, y: newY },
        };
      }
      return wp;
    });

    return {
      ...path,
      waypoints: updatedWaypoints,
    };
  }

  /**
   * Adjusts tangent handles (handleIn / handleOut) of a specific waypoint.
   */
  public static updateTangentHandles(
    path: MotionPath,
    waypointId: string,
    handleIn?: { x: number; y: number },
    handleOut?: { x: number; y: number }
  ): MotionPath {
    const updatedWaypoints = path.waypoints.map((wp) => {
      if (wp.id === waypointId) {
        return {
          ...wp,
          handleIn: handleIn ?? wp.handleIn,
          handleOut: handleOut ?? wp.handleOut,
        };
      }
      return wp;
    });

    return {
      ...path,
      waypoints: updatedWaypoints,
    };
  }

  /**
   * Reverses the waypoint order ($0..N \rightarrow N..0$) and swaps handleIn/handleOut vectors.
   */
  public static reversePath(path: MotionPath): MotionPath {
    const reversed = [...path.waypoints].reverse().map((wp, idx) => ({
      ...wp,
      id: `wp_${idx}`,
      handleIn: wp.handleOut ? { x: -wp.handleOut.x, y: -wp.handleOut.y } : undefined,
      handleOut: wp.handleIn ? { x: -wp.handleIn.x, y: -wp.handleIn.y } : undefined,
    }));

    return {
      ...path,
      waypoints: reversed,
    };
  }

  /**
   * Splits a path segment between waypoint index and index+1 by inserting a new midpoint waypoint.
   */
  public static splitPathSegment(path: MotionPath, segmentIndex: number): MotionPath {
    if (segmentIndex < 0 || segmentIndex >= path.waypoints.length - 1) return path;

    const wpA = path.waypoints[segmentIndex];
    const wpB = path.waypoints[segmentIndex + 1];

    const midX = (wpA.position.x + wpB.position.x) / 2;
    const midY = (wpA.position.y + wpB.position.y) / 2;

    const newWaypoint: MotionPathWaypoint = {
      id: `wp_split_${Date.now()}`,
      position: { x: midX, y: midY },
      handleIn: { x: -15, y: 0 },
      handleOut: { x: 15, y: 0 },
    };

    const updatedWaypoints = [
      ...path.waypoints.slice(0, segmentIndex + 1),
      newWaypoint,
      ...path.waypoints.slice(segmentIndex + 1),
    ];

    return {
      ...path,
      waypoints: updatedWaypoints,
    };
  }

  /**
   * Computes position and orientation along motion path at progress $t \in [0, 1]$ using S13 MotionPathEvaluator.
   */
  public static evaluatePathPreview(path: MotionPath, progress: number): { x: number; y: number; angleRad: number } {
    const sample = MotionPathEvaluator.evaluatePath(path, progress);
    return {
      x: sample.x,
      y: sample.y,
      angleRad: (sample.angleDeg * Math.PI) / 180,
    };
  }
}
