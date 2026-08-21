/**
 * VectorSnappingEngine.ts — Sprint G1-40 Vector Snapping Engine (Night Shift Level 2)
 *
 * Provides real-time edge-to-edge, center-to-center, and canvas grid snapping calculations
 * for shape movement, resizing, and alignment guide generation.
 *
 * Pure headless TS engine, NO DOM, NO React, ZERO Browser APIs.
 */

import { VectorNode } from './VectorDomainModel';
import { VectorGeometry, BoundingBox2D } from './VectorGeometry';

export type SnapEdgeType = 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY';
export type GuideOrientation = 'horizontal' | 'vertical';
export type GuideType = 'edge' | 'center' | 'grid';

export interface GuideLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  orientation: GuideOrientation;
  type: GuideType;
}

export interface SnapMatch {
  edgeType: SnapEdgeType;
  targetCoord: number;
  referenceCoord: number;
  delta: number;
  referenceNodeId?: string;
}

export interface SnapResult {
  snappedDeltaX: number;
  snappedDeltaY: number;
  snappedX: boolean;
  snappedY: boolean;
  matches: SnapMatch[];
  guides: GuideLine[];
}

export interface GridSnapResult {
  snappedDeltaX: number;
  snappedDeltaY: number;
  snappedX: boolean;
  snappedY: boolean;
  guides: GuideLine[];
}

export interface SnappingOptions {
  snapToNodes?: boolean;
  snapToGrid?: boolean;
  snapToCanvas?: boolean;
  snapThresholdPx?: number;
  gridSizePx?: number;
  canvasBounds?: BoundingBox2D;
}

export class VectorSnappingEngine {
  public static readonly DEFAULT_THRESHOLD_PX = 5;
  public static readonly DEFAULT_GRID_SIZE_PX = 20;
  public static readonly DEFAULT_CANVAS_BOUNDS: BoundingBox2D = { x: 0, y: 0, width: 1920, height: 1080 };

  /**
   * Computes snapping delta and transient alignment guide lines for target node bounds relative to reference nodes.
   */
  public static computeSnapDelta(
    targetBounds: BoundingBox2D,
    referenceNodes: VectorNode[],
    options: SnappingOptions = {}
  ): SnapResult {
    const threshold = (Number.isFinite(options.snapThresholdPx) && options.snapThresholdPx! >= 0)
      ? options.snapThresholdPx!
      : VectorSnappingEngine.DEFAULT_THRESHOLD_PX;
    const canvas = options.canvasBounds && Number.isFinite(options.canvasBounds.width) ? options.canvasBounds : VectorSnappingEngine.DEFAULT_CANVAS_BOUNDS;

    if (!targetBounds || !Number.isFinite(targetBounds.x) || !Number.isFinite(targetBounds.y)) {
      return { snappedDeltaX: 0, snappedDeltaY: 0, snappedX: false, snappedY: false, matches: [], guides: [] };
    }

    if (threshold === 0) {
      return { snappedDeltaX: 0, snappedDeltaY: 0, snappedX: false, snappedY: false, matches: [], guides: [] };
    }

    const tLeft = targetBounds.x;
    const tRight = targetBounds.x + targetBounds.width;
    const tCenterX = targetBounds.x + targetBounds.width / 2;
    const tTop = targetBounds.y;
    const tBottom = targetBounds.y + targetBounds.height;
    const tCenterY = targetBounds.y + targetBounds.height / 2;

    let bestDeltaX = 0;
    let bestDistX = threshold + 1;
    let bestMatchX: SnapMatch | null = null;

    let bestDeltaY = 0;
    let bestDistY = threshold + 1;
    let bestMatchY: SnapMatch | null = null;

    const matches: SnapMatch[] = [];

    // Reference points from nodes
    const validNodes = Array.isArray(referenceNodes)
      ? referenceNodes.filter(n => n && typeof n === 'object' && n.transform)
      : [];

    for (const refNode of validNodes) {
      const rBox = VectorGeometry.computeBoundingBox(refNode);
      const rLeft = rBox.x;
      const rRight = rBox.x + rBox.width;
      const rCenterX = rBox.x + rBox.width / 2;
      const rTop = rBox.y;
      const rBottom = rBox.y + rBox.height;
      const rCenterY = rBox.y + rBox.height / 2;

      // X-Axis Snap Candidates (Vertical Guide Lines)
      const xCandidates: Array<{ edge: SnapEdgeType; tVal: number; rVal: number }> = [
        { edge: 'left', tVal: tLeft, rVal: rLeft },
        { edge: 'left', tVal: tLeft, rVal: rRight },
        { edge: 'right', tVal: tRight, rVal: rLeft },
        { edge: 'right', tVal: tRight, rVal: rRight },
        { edge: 'centerX', tVal: tCenterX, rVal: rCenterX },
      ];

      for (const cand of xCandidates) {
        const diff = cand.rVal - cand.tVal;
        const dist = Math.abs(diff);
        if (dist <= threshold && dist < bestDistX) {
          bestDistX = dist;
          bestDeltaX = diff;
          bestMatchX = {
            edgeType: cand.edge,
            targetCoord: cand.tVal,
            referenceCoord: cand.rVal,
            delta: diff,
            referenceNodeId: refNode.id,
          };
        }
      }

      // Y-Axis Snap Candidates (Horizontal Guide Lines)
      const yCandidates: Array<{ edge: SnapEdgeType; tVal: number; rVal: number }> = [
        { edge: 'top', tVal: tTop, rVal: rTop },
        { edge: 'top', tVal: tTop, rVal: rBottom },
        { edge: 'bottom', tVal: tBottom, rVal: rTop },
        { edge: 'bottom', tVal: tBottom, rVal: rBottom },
        { edge: 'centerY', tVal: tCenterY, rVal: rCenterY },
      ];

      for (const cand of yCandidates) {
        const diff = cand.rVal - cand.tVal;
        const dist = Math.abs(diff);
        if (dist <= threshold && dist < bestDistY) {
          bestDistY = dist;
          bestDeltaY = diff;
          bestMatchY = {
            edgeType: cand.edge,
            targetCoord: cand.tVal,
            referenceCoord: cand.rVal,
            delta: diff,
            referenceNodeId: refNode.id,
          };
        }
      }
    }

    // Canvas Bounds Snapping
    if (options.snapToCanvas !== false) {
      const canvasXCandidates = [
        { edge: 'left' as SnapEdgeType, tVal: tLeft, rVal: canvas.x },
        { edge: 'centerX' as SnapEdgeType, tVal: tCenterX, rVal: canvas.x + canvas.width / 2 },
        { edge: 'right' as SnapEdgeType, tVal: tRight, rVal: canvas.x + canvas.width },
      ];
      for (const cand of canvasXCandidates) {
        const diff = cand.rVal - cand.tVal;
        const dist = Math.abs(diff);
        if (dist <= threshold && dist < bestDistX) {
          bestDistX = dist;
          bestDeltaX = diff;
          bestMatchX = { edgeType: cand.edge, targetCoord: cand.tVal, referenceCoord: cand.rVal, delta: diff };
        }
      }

      const canvasYCandidates = [
        { edge: 'top' as SnapEdgeType, tVal: tTop, rVal: canvas.y },
        { edge: 'centerY' as SnapEdgeType, tVal: tCenterY, rVal: canvas.y + canvas.height / 2 },
        { edge: 'bottom' as SnapEdgeType, tVal: tBottom, rVal: canvas.y + canvas.height },
      ];
      for (const cand of canvasYCandidates) {
        const diff = cand.rVal - cand.tVal;
        const dist = Math.abs(diff);
        if (dist <= threshold && dist < bestDistY) {
          bestDistY = dist;
          bestDeltaY = diff;
          bestMatchY = { edgeType: cand.edge, targetCoord: cand.tVal, referenceCoord: cand.rVal, delta: diff };
        }
      }
    }

    if (bestMatchX) matches.push(bestMatchX);
    if (bestMatchY) matches.push(bestMatchY);

    const guides = VectorSnappingEngine.generateAlignmentGuides(matches, targetBounds, canvas);

    return {
      snappedDeltaX: bestMatchX ? bestDeltaX : 0,
      snappedDeltaY: bestMatchY ? bestDeltaY : 0,
      snappedX: !!bestMatchX,
      snappedY: !!bestMatchY,
      matches,
      guides,
    };
  }

  /**
   * Computes canvas grid snapping for target bounds.
   */
  public static computeGridSnap(
    targetBounds: BoundingBox2D,
    gridSizePx: number = VectorSnappingEngine.DEFAULT_GRID_SIZE_PX,
    snapThresholdPx: number = VectorSnappingEngine.DEFAULT_THRESHOLD_PX
  ): GridSnapResult {
    const grid = (Number.isFinite(gridSizePx) && gridSizePx > 0) ? gridSizePx : VectorSnappingEngine.DEFAULT_GRID_SIZE_PX;
    const threshold = Number.isFinite(snapThresholdPx) ? Math.max(0, snapThresholdPx) : VectorSnappingEngine.DEFAULT_THRESHOLD_PX;

    if (!targetBounds || !Number.isFinite(targetBounds.x) || !Number.isFinite(targetBounds.y)) {
      return { snappedDeltaX: 0, snappedDeltaY: 0, snappedX: false, snappedY: false, guides: [] };
    }

    const nearestGridX = Math.round(targetBounds.x / grid) * grid;
    const diffX = nearestGridX - targetBounds.x;
    const snapX = Math.abs(diffX) <= threshold;

    const nearestGridY = Math.round(targetBounds.y / grid) * grid;
    const diffY = nearestGridY - targetBounds.y;
    const snapY = Math.abs(diffY) <= threshold;

    const guides: GuideLine[] = [];
    if (snapX) {
      guides.push({
        id: `guide_grid_x_${nearestGridX}`,
        x1: nearestGridX,
        y1: 0,
        x2: nearestGridX,
        y2: 2000,
        orientation: 'vertical',
        type: 'grid',
      });
    }
    if (snapY) {
      guides.push({
        id: `guide_grid_y_${nearestGridY}`,
        x1: 0,
        y1: nearestGridY,
        x2: 2000,
        y2: nearestGridY,
        orientation: 'horizontal',
        type: 'grid',
      });
    }

    return {
      snappedDeltaX: snapX ? diffX : 0,
      snappedDeltaY: snapY ? diffY : 0,
      snappedX: snapX,
      snappedY: snapY,
      guides,
    };
  }

  /**
   * Generates transient alignment guide line overlay DTOs from active snap matches.
   */
  public static generateAlignmentGuides(
    matches: SnapMatch[],
    targetBounds: BoundingBox2D,
    canvasBounds: BoundingBox2D = VectorSnappingEngine.DEFAULT_CANVAS_BOUNDS
  ): GuideLine[] {
    if (!matches || matches.length === 0) return [];
    const guides: GuideLine[] = [];

    const minY = Math.min(0, canvasBounds.y - 500);
    const maxY = Math.max(2000, canvasBounds.y + canvasBounds.height + 500);
    const minX = Math.min(0, canvasBounds.x - 500);
    const maxX = Math.max(2000, canvasBounds.x + canvasBounds.width + 500);

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const isX = match.edgeType === 'left' || match.edgeType === 'right' || match.edgeType === 'centerX';

      if (isX) {
        guides.push({
          id: `guide_snap_x_${i}_${match.referenceCoord}`,
          x1: match.referenceCoord,
          y1: minY,
          x2: match.referenceCoord,
          y2: maxY,
          orientation: 'vertical',
          type: match.edgeType === 'centerX' ? 'center' : 'edge',
        });
      } else {
        guides.push({
          id: `guide_snap_y_${i}_${match.referenceCoord}`,
          x1: minX,
          y1: match.referenceCoord,
          x2: maxX,
          y2: match.referenceCoord,
          orientation: 'horizontal',
          type: match.edgeType === 'centerY' ? 'center' : 'edge',
        });
      }
    }

    return guides;
  }
}
