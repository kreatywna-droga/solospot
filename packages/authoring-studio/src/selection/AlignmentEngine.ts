/**
 * AlignmentEngine.ts — Sprint S22 Alignment & Distribution Engine
 *
 * Implements pure headless alignment:
 * - align left, center horizontally, right
 * - align top, center vertically, bottom
 * - relative to canvas or multi-selection bounding box
 *
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Scene, SceneGraphModel } from '../scene/SceneGraphModel';
import { BoundingBoxModel } from './BoundingBoxModel';

export type AlignmentType =
  | 'align-left'
  | 'align-center-h'
  | 'align-right'
  | 'align-top'
  | 'align-center-v'
  | 'align-bottom';

export class AlignmentEngine {
  /**
   * Aligns selected layers horizontally or vertically relative to target reference box or unified selection bounds.
   */
  public static alignSelection(
    scene: Scene,
    selectedNodeIds: ReadonlyArray<string>,
    alignment: AlignmentType,
    canvasBounds?: { width: number; height: number }
  ): Scene {
    if (selectedNodeIds.length === 0) return scene;

    let targetBox = BoundingBoxModel.computeSelectionBounds(scene, selectedNodeIds);

    // If aligning single node, align relative to canvas or parent
    if (selectedNodeIds.length === 1 && canvasBounds) {
      targetBox = { x: 0, y: 0, width: canvasBounds.width, height: canvasBounds.height };
    }

    if (!targetBox) return scene;

    let updatedScene = scene;

    for (const id of selectedNodeIds) {
      const node = SceneGraphModel.findLayerNode(updatedScene, id);
      if (!node) continue;

      let newX = node.transform.x;
      let newY = node.transform.y;

      switch (alignment) {
        case 'align-left':
          newX = targetBox.x;
          break;

        case 'align-center-h':
          newX = targetBox.x + targetBox.width / 2 - node.transform.width / 2;
          break;

        case 'align-right':
          newX = targetBox.x + targetBox.width - node.transform.width;
          break;

        case 'align-top':
          newY = targetBox.y;
          break;

        case 'align-center-v':
          newY = targetBox.y + targetBox.height / 2 - node.transform.height / 2;
          break;

        case 'align-bottom':
          newY = targetBox.y + targetBox.height - node.transform.height;
          break;
      }

      updatedScene = SceneGraphModel.updateLayer(updatedScene, id, {
        transform: {
          ...node.transform,
          x: newX,
          y: newY,
        },
      });
    }

    return updatedScene;
  }
}
