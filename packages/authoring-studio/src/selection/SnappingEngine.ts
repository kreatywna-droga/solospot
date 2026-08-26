/**
 * SnappingEngine.ts — Sprint S22 Object, Grid & Guide Snapping Engine
 *
 * Headless calculation engine for:
 * - Snap to grid (configurable 8px/16px/32px/64px)
 * - Snap to target objects (edges and centers)
 * - Snap to custom guide lines
 *
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Scene, SceneLayerNode } from '../scene/SceneGraphModel';
import { BoundingBox } from './BoundingBoxModel';

export interface SnapGuideLine {
  readonly type: 'vertical' | 'horizontal';
  readonly position: number;
  readonly start: number;
  readonly end: number;
}

export interface SnapResult {
  readonly snappedDx: number;
  readonly snappedDy: number;
  readonly guideLines: ReadonlyArray<SnapGuideLine>;
}

export class SnappingEngine {
  /**
   * Snaps position delta (dx, dy) to grid lines.
   */
  public static snapToGrid(
    bounds: BoundingBox,
    dx: number,
    dy: number,
    gridSize: number = 16,
    threshold: number = 8
  ): SnapResult {
    const targetX = bounds.x + dx;
    const targetY = bounds.y + dy;

    const snapX = Math.round(targetX / gridSize) * gridSize;
    const snapY = Math.round(targetY / gridSize) * gridSize;

    const deltaX = Math.abs(targetX - snapX) <= threshold ? snapX - bounds.x : dx;
    const deltaY = Math.abs(targetY - snapY) <= threshold ? snapY - bounds.y : dy;

    return {
      snappedDx: deltaX,
      snappedDy: deltaY,
      guideLines: [],
    };
  }

  /**
   * Snaps position delta (dx, dy) against other non-selected scene objects.
   */
  public static snapToObjects(
    scene: Scene,
    selectedNodeIds: ReadonlyArray<string>,
    bounds: BoundingBox,
    dx: number,
    dy: number,
    threshold: number = 6
  ): SnapResult {
    const activeX = bounds.x + dx;
    const activeY = bounds.y + dy;
    const activeRight = activeX + bounds.width;
    const activeBottom = activeY + bounds.height;
    const activeCenterX = activeX + bounds.width / 2;
    const activeCenterY = activeY + bounds.height / 2;

    let bestSnapX = dx;
    let bestSnapY = dy;
    let minDiffX = threshold + 1;
    let minDiffY = threshold + 1;

    const guideLines: SnapGuideLine[] = [];

    const layers = Object.values(scene.layers ?? {});
    for (const node of layers) {
      if (selectedNodeIds.includes(node.id) || !node.visible) continue;

      const nodeX = node.transform.x;
      const nodeY = node.transform.y;
      const nodeRight = nodeX + node.transform.width;
      const nodeBottom = nodeY + node.transform.height;
      const nodeCenterX = nodeX + node.transform.width / 2;
      const nodeCenterY = nodeY + node.transform.height / 2;

      // X-alignment candidates: left-left, left-right, right-left, center-center
      const xPairs = [
        { current: activeX, target: nodeX, offset: nodeX - bounds.x },
        { current: activeX, target: nodeRight, offset: nodeRight - bounds.x },
        { current: activeRight, target: nodeX, offset: nodeX - bounds.x - bounds.width },
        { current: activeRight, target: nodeRight, offset: nodeRight - bounds.x - bounds.width },
        { current: activeCenterX, target: nodeCenterX, offset: nodeCenterX - bounds.width / 2 - bounds.x },
      ];

      for (const pair of xPairs) {
        const diff = Math.abs(pair.current - pair.target);
        if (diff < minDiffX) {
          minDiffX = diff;
          bestSnapX = pair.offset;
          guideLines.push({
            type: 'vertical',
            position: pair.target,
            start: Math.min(activeY, nodeY),
            end: Math.max(activeBottom, nodeBottom),
          });
        }
      }

      // Y-alignment candidates: top-top, top-bottom, bottom-top, center-center
      const yPairs = [
        { current: activeY, target: nodeY, offset: nodeY - bounds.y },
        { current: activeY, target: nodeBottom, offset: nodeBottom - bounds.y },
        { current: activeBottom, target: nodeY, offset: nodeY - bounds.y - bounds.height },
        { current: activeBottom, target: nodeBottom, offset: nodeBottom - bounds.y - bounds.height },
        { current: activeCenterY, target: nodeCenterY, offset: nodeCenterY - bounds.height / 2 - bounds.y },
      ];

      for (const pair of yPairs) {
        const diff = Math.abs(pair.current - pair.target);
        if (diff < minDiffY) {
          minDiffY = diff;
          bestSnapY = pair.offset;
          guideLines.push({
            type: 'horizontal',
            position: pair.target,
            start: Math.min(activeX, nodeX),
            end: Math.max(activeRight, nodeRight),
          });
        }
      }
    }

    return {
      snappedDx: bestSnapX,
      snappedDy: bestSnapY,
      guideLines,
    };
  }
}
