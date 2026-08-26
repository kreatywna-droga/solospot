/**
 * BoundingBoxModel.ts — Sprint S22 Bounding Box Core Engine
 *
 * Computes bounding boxes for single and multi-selection, corner points, center points,
 * aspect ratio locks, and scale/rotation transformations.
 *
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Scene, SceneLayerNode } from '../scene/SceneGraphModel';

export interface BoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotationDeg?: number;
}

export interface BoundingBoxPoints {
  readonly topLeft: { x: number; y: number };
  readonly topCenter: { x: number; y: number };
  readonly topRight: { x: number; y: number };
  readonly middleLeft: { x: number; y: number };
  readonly center: { x: number; y: number };
  readonly middleRight: { x: number; y: number };
  readonly bottomLeft: { x: number; y: number };
  readonly bottomCenter: { x: number; y: number };
  readonly bottomRight: { x: number; y: number };
  readonly rotateHandle: { x: number; y: number };
}

export class BoundingBoxModel {
  /**
   * Computes world space bounding box for a single node.
   */
  public static getNodeWorldBounds(node: SceneLayerNode): BoundingBox | null {
    return {
      x: node.transform.x,
      y: node.transform.y,
      width: node.transform.width,
      height: node.transform.height,
      rotationDeg: node.transform.rotationDeg,
    };
  }

  /**
   * Hit-tests all layers in the scene against a world-space point.
   */
  public static hitTestScene(scene: Scene, point: { x: number; y: number }): SceneLayerNode | null {
    const layers = Object.values(scene.layers ?? {});
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible || layer.locked) continue;
      const x = layer.transform.x;
      const y = layer.transform.y;
      const w = layer.transform.width;
      const h = layer.transform.height;
      if (point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h) {
        return layer;
      }
    }
    return null;
  }

  /**
   * Computes unified bounding box encapsulating multiple selected node IDs.
   */
  public static computeSelectionBounds(scene: Scene, selectedNodeIds: ReadonlyArray<string>): BoundingBox | null {
    if (selectedNodeIds.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let foundCount = 0;

    const layers = Object.values(scene.layers ?? {});
    for (const node of layers) {
      if (selectedNodeIds.includes(node.id) && node.visible) {
        const wBounds = this.getNodeWorldBounds(node);
        if (wBounds) {
          minX = Math.min(minX, wBounds.x);
          minY = Math.min(minY, wBounds.y);
          maxX = Math.max(maxX, wBounds.x + wBounds.width);
          maxY = Math.max(maxY, wBounds.y + wBounds.height);
          foundCount++;
        }
      }
    }

    if (foundCount === 0) return null;

    const firstNode = selectedNodeIds.length === 1 ? scene.layers[selectedNodeIds[0]] : undefined;

    return {
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      rotationDeg: firstNode?.transform.rotationDeg ?? 0,
    };
  }

  /**
   * Calculates 9 key point coordinates for a bounding box (corners, edges, center, rotate handle).
   */
  public static getBoundingBoxPoints(box: BoundingBox, rotateOffset: number = 24): BoundingBoxPoints {
    const { x, y, width, height } = box;

    return {
      topLeft: { x, y },
      topCenter: { x: x + width / 2, y },
      topRight: { x: x + width, y },
      middleLeft: { x, y: y + height / 2 },
      center: { x: x + width / 2, y: y + height / 2 },
      middleRight: { x: x + width, y: y + height / 2 },
      bottomLeft: { x, y: y + height },
      bottomCenter: { x: x + width / 2, y: y + height },
      bottomRight: { x: x + width, y: y + height },
      rotateHandle: { x: x + width / 2, y: y - rotateOffset },
    };
  }

  /**
   * Constrains scale dimensions to preserve original aspect ratio.
   */
  public static constrainAspectRatio(
    originalWidth: number,
    originalHeight: number,
    newWidth: number,
    newHeight: number
  ): { width: number; height: number } {
    if (originalWidth <= 0 || originalHeight <= 0) return { width: newWidth, height: newHeight };
    const aspect = originalWidth / originalHeight;

    if (newWidth / aspect <= newHeight) {
      return { width: newWidth, height: newWidth / aspect };
    } else {
      return { width: newHeight * aspect, height: newHeight };
    }
  }

  /**
   * Calculates center-scaled box bounds where scaling radiates outward from box center.
   */
  public static scaleFromCenter(
    originalBox: BoundingBox,
    scaleX: number,
    scaleY: number
  ): BoundingBox {
    const newWidth = Math.max(1, originalBox.width * scaleX);
    const newHeight = Math.max(1, originalBox.height * scaleY);
    const centerX = originalBox.x + originalBox.width / 2;
    const centerY = originalBox.y + originalBox.height / 2;

    return {
      x: centerX - newWidth / 2,
      y: centerY - newHeight / 2,
      width: newWidth,
      height: newHeight,
      rotationDeg: originalBox.rotationDeg,
    };
  }
}
