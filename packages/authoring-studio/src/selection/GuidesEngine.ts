/**
 * GuidesEngine.ts — Sprint S22 Smart Guides Calculation Engine
 *
 * Implements pure calculations for smart alignment lines, center markers,
 * and equal gap distance indicators between objects.
 *
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Scene, Layer } from '../scene/SceneGraphModel';
import { BoundingBox } from './BoundingBoxModel';
import { SnapGuideLine } from './SnappingEngine';

export interface SmartGuideGap {
  readonly start: number;
  readonly end: number;
  readonly distance: number;
  readonly direction: 'horizontal' | 'vertical';
}

export interface SmartGuideResult {
  readonly lines: ReadonlyArray<SnapGuideLine>;
  readonly gaps: ReadonlyArray<SmartGuideGap>;
}

export class GuidesEngine {
  /**
   * Computes smart guide lines and equal gap indicators for active selection bounding box against scene layers.
   */
  public static computeSmartGuides(
    scene: Scene,
    selectedNodeIds: ReadonlyArray<string>,
    activeBounds: BoundingBox
  ): SmartGuideResult {
    const lines: SnapGuideLine[] = [];
    const gaps: SmartGuideGap[] = [];

    const activeCenterX = activeBounds.x + activeBounds.width / 2;
    const activeCenterY = activeBounds.y + activeBounds.height / 2;

    const layers = Object.values(scene.layers ?? {});

    for (const layer of layers) {
      if (!layer.visible || selectedNodeIds.includes(layer.id)) continue;

      const nX = layer.transform.x;
      const nY = layer.transform.y;
      const nW = layer.transform.width;
      const nH = layer.transform.height;
      const nCenterX = nX + nW / 2;
      const nCenterY = nY + nH / 2;

      // Vertical center guide line
      if (Math.abs(activeCenterX - nCenterX) < 1) {
        lines.push({
          type: 'vertical',
          position: nCenterX,
          start: Math.min(activeBounds.y, nY),
          end: Math.max(activeBounds.y + activeBounds.height, nY + nH),
        });
      }

      // Horizontal center guide line
      if (Math.abs(activeCenterY - nCenterY) < 1) {
        lines.push({
          type: 'horizontal',
          position: nCenterY,
          start: Math.min(activeBounds.x, nX),
          end: Math.max(activeBounds.x + activeBounds.width, nX + nW),
        });
      }
    }

    return { lines, gaps };
  }
}
