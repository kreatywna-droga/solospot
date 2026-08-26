/**
 * CanvasSnappingController.ts — Sprint S23 Unified Canvas Snapping Controller
 *
 * Pure headless snapping controller orchestrating:
 * - grid snapping
 * - object snapping (edges & centers)
 * - edge snapping & center snapping
 * - guide snapping (user-defined guide lines)
 * - configurable snap tolerance (1px to 20px)
 *
 * Delegates directly to SnappingEngine (S22) and GuidesEngine (S22).
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Scene } from '../scene/SceneGraphModel';
import { BoundingBox } from './BoundingBoxModel';
import { SnappingEngine, SnapGuideLine, SnapResult } from './SnappingEngine';

export interface SnappingConfig {
  readonly enabled: boolean;
  readonly snapToGrid: boolean;
  readonly gridSize: number;
  readonly snapToObjects: boolean;
  readonly snapToEdges: boolean;
  readonly snapToCenters: boolean;
  readonly snapToGuides: boolean;
  readonly snapTolerance: number;
}

export const DEFAULT_SNAPPING_CONFIG: SnappingConfig = {
  enabled: true,
  snapToGrid: true,
  gridSize: 16,
  snapToObjects: true,
  snapToEdges: true,
  snapToCenters: true,
  snapToGuides: true,
  snapTolerance: 6,
};

export class CanvasSnappingController {
  /**
   * Evaluates displacement delta (rawDx, rawDy) against active snapping rules and returns snapped delta + guide lines.
   */
  public static snapDelta(
    scene: Scene,
    selectedNodeIds: ReadonlyArray<string>,
    activeBounds: BoundingBox,
    rawDx: number,
    rawDy: number,
    userGuides: ReadonlyArray<{ position: number; type: 'horizontal' | 'vertical' }> = [],
    customConfig?: Partial<SnappingConfig>
  ): SnapResult {
    const config: SnappingConfig = { ...DEFAULT_SNAPPING_CONFIG, ...customConfig };

    if (!config.enabled) {
      return { snappedDx: rawDx, snappedDy: rawDy, guideLines: [] };
    }

    let currentDx = rawDx;
    let currentDy = rawDy;
    const combinedGuideLines: SnapGuideLine[] = [];

    // 1. User Guide Snapping
    if (config.snapToGuides && userGuides.length > 0) {
      const activeX = activeBounds.x + currentDx;
      const activeY = activeBounds.y + currentDy;
      const activeRight = activeX + activeBounds.width;
      const activeBottom = activeY + activeBounds.height;
      const activeCenterX = activeX + activeBounds.width / 2;
      const activeCenterY = activeY + activeBounds.height / 2;

      for (const guide of userGuides) {
        if (guide.type === 'vertical') {
          const candidates = [
            { pos: activeX, offset: guide.position - activeBounds.x },
            { pos: activeRight, offset: guide.position - activeBounds.x - activeBounds.width },
            { pos: activeCenterX, offset: guide.position - activeBounds.width / 2 - activeBounds.x },
          ];
          for (const cand of candidates) {
            if (Math.abs(cand.pos - guide.position) <= config.snapTolerance) {
              currentDx = cand.offset;
              combinedGuideLines.push({
                type: 'vertical',
                position: guide.position,
                start: activeY - 50,
                end: activeBottom + 50,
              });
              break;
            }
          }
        } else {
          const candidates = [
            { pos: activeY, offset: guide.position - activeBounds.y },
            { pos: activeBottom, offset: guide.position - activeBounds.y - activeBounds.height },
            { pos: activeCenterY, offset: guide.position - activeBounds.height / 2 - activeBounds.y },
          ];
          for (const cand of candidates) {
            if (Math.abs(cand.pos - guide.position) <= config.snapTolerance) {
              currentDy = cand.offset;
              combinedGuideLines.push({
                type: 'horizontal',
                position: guide.position,
                start: activeX - 50,
                end: activeRight + 50,
              });
              break;
            }
          }
        }
      }
    }

    // 2. Object Snapping (Edges & Centers)
    if (config.snapToObjects) {
      const objectSnap = SnappingEngine.snapToObjects(
        scene,
        selectedNodeIds,
        activeBounds,
        currentDx,
        currentDy,
        config.snapTolerance
      );
      if (objectSnap.snappedDx !== currentDx || objectSnap.snappedDy !== currentDy) {
        currentDx = objectSnap.snappedDx;
        currentDy = objectSnap.snappedDy;
        combinedGuideLines.push(...objectSnap.guideLines);
      }
    }

    // 3. Grid Snapping
    if (config.snapToGrid) {
      const gridSnap = SnappingEngine.snapToGrid(
        activeBounds,
        currentDx,
        currentDy,
        config.gridSize,
        config.snapTolerance
      );
      currentDx = gridSnap.snappedDx;
      currentDy = gridSnap.snappedDy;
    }

    return {
      snappedDx: currentDx,
      snappedDy: currentDy,
      guideLines: combinedGuideLines,
    };
  }
}
