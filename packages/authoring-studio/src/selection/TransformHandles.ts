/**
 * TransformHandles.ts — Sprint S22 Transform Handles & Hit Testing Engine
 *
 * Computes handle geometry and performs hit-testing for selection handles.
 *
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { BoundingBox, BoundingBoxModel } from './BoundingBoxModel';
import { TransformHandleType } from './SelectionModel';

export interface HandleDescriptor {
  readonly type: TransformHandleType;
  readonly x: number;
  readonly y: number;
  readonly cursor: string;
}

export class TransformHandles {
  /**
   * Computes handle positions and cursor hints for a given bounding box.
   */
  public static getHandles(box: BoundingBox, handleSize: number = 8): HandleDescriptor[] {
    const pts = BoundingBoxModel.getBoundingBoxPoints(box);

    return [
      { type: 'top-left', x: pts.topLeft.x, y: pts.topLeft.y, cursor: 'nwse-resize' },
      { type: 'top-center', x: pts.topCenter.x, y: pts.topCenter.y, cursor: 'ns-resize' },
      { type: 'top-right', x: pts.topRight.x, y: pts.topRight.y, cursor: 'nesw-resize' },
      { type: 'middle-left', x: pts.middleLeft.x, y: pts.middleLeft.y, cursor: 'ew-resize' },
      { type: 'middle-right', x: pts.middleRight.x, y: pts.middleRight.y, cursor: 'ew-resize' },
      { type: 'bottom-left', x: pts.bottomLeft.x, y: pts.bottomLeft.y, cursor: 'nesw-resize' },
      { type: 'bottom-center', x: pts.bottomCenter.x, y: pts.bottomCenter.y, cursor: 'ns-resize' },
      { type: 'bottom-right', x: pts.bottomRight.x, y: pts.bottomRight.y, cursor: 'nwse-resize' },
      { type: 'rotate', x: pts.rotateHandle.x, y: pts.rotateHandle.y, cursor: 'grab' },
    ];
  }

  /**
   * Hit-tests a point (x, y) against transform handles for a bounding box.
   */
  public static hitTestHandle(
    point: { x: number; y: number },
    box: BoundingBox,
    hitTolerance: number = 10
  ): TransformHandleType | null {
    const handles = this.getHandles(box);

    for (const handle of handles) {
      const dx = Math.abs(point.x - handle.x);
      const dy = Math.abs(point.y - handle.y);

      if (dx <= hitTolerance && dy <= hitTolerance) {
        return handle.type;
      }
    }

    return null;
  }

  /**
   * Alias for hitTestHandle with (box, point) or (point, box) compatibility.
   */
  public static hitTestHandles(
    boxOrPoint: BoundingBox | { x: number; y: number },
    pointOrBox: { x: number; y: number } | BoundingBox,
    hitTolerance: number = 10
  ): TransformHandleType | null {
    if ('startX' in boxOrPoint || 'minX' in boxOrPoint || 'width' in boxOrPoint) {
      return this.hitTestHandle(pointOrBox as { x: number; y: number }, boxOrPoint as BoundingBox, hitTolerance);
    }
    return this.hitTestHandle(boxOrPoint as { x: number; y: number }, pointOrBox as BoundingBox, hitTolerance);
  }
}
