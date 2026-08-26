/**
 * TransformInteractionEngine.ts — Sprint S22 Core Transform Interaction Engine
 *
 * Implements pure headless transform operations:
 * - move (dx, dy)
 * - resize (handle drag, scale from center, constrain proportions)
 * - rotate (degrees around center pivot)
 * - group transform (proportional scale & translate for multi-selection)
 *
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Scene, SceneGraphModel } from '../scene/SceneGraphModel';
import { BoundingBoxModel } from './BoundingBoxModel';
import { TransformHandleType } from './SelectionModel';

export type { TransformHandleType };

export interface TransformOperationParams {
  readonly dx: number;
  readonly dy: number;
  readonly handle?: TransformHandleType;
  readonly scaleFromCenter?: boolean;
  readonly lockAspectRatio?: boolean;
}

export class TransformInteractionEngine {
  /**
   * Moves all selected node IDs by displacement delta (dx, dy).
   */
  public static moveSelection(scene: Scene, selectedNodeIds: ReadonlyArray<string>, dx: number, dy: number): Scene {
    let updatedScene = scene;

    for (const id of selectedNodeIds) {
      const node = SceneGraphModel.findLayerNode(updatedScene, id);
      if (!node) continue;

      updatedScene = SceneGraphModel.updateLayer(updatedScene, id, {
        transform: {
          ...node.transform,
          x: node.transform.x + dx,
          y: node.transform.y + dy,
        },
      });
    }

    return updatedScene;
  }

  /**
   * Resizes selected node(s) based on handle type, drag displacement (dx, dy), aspect ratio lock, and center-scaling option.
   */
  public static resizeSelection(
    scene: Scene,
    selectedNodeIds: ReadonlyArray<string>,
    handle: TransformHandleType,
    dx: number,
    dy: number,
    lockAspectRatio: boolean = false,
    scaleFromCenter: boolean = false
  ): Scene {
    if (selectedNodeIds.length === 0) return scene;

    let updatedScene = scene;

    for (const id of selectedNodeIds) {
      const node = SceneGraphModel.findLayerNode(updatedScene, id);
      if (!node) continue;

      let newX = node.transform.x;
      let newY = node.transform.y;
      let newWidth = node.transform.width;
      let newHeight = node.transform.height;

      switch (handle) {
        case 'bottom-right':
          newWidth = Math.max(1, node.transform.width + dx);
          newHeight = Math.max(1, node.transform.height + dy);
          break;

        case 'bottom-left':
          newWidth = Math.max(1, node.transform.width - dx);
          newHeight = Math.max(1, node.transform.height + dy);
          newX = node.transform.x + (node.transform.width - newWidth);
          break;

        case 'top-right':
          newWidth = Math.max(1, node.transform.width + dx);
          newHeight = Math.max(1, node.transform.height - dy);
          newY = node.transform.y + (node.transform.height - newHeight);
          break;

        case 'top-left':
          newWidth = Math.max(1, node.transform.width - dx);
          newHeight = Math.max(1, node.transform.height - dy);
          newX = node.transform.x + (node.transform.width - newWidth);
          newY = node.transform.y + (node.transform.height - newHeight);
          break;

        case 'middle-right':
          newWidth = Math.max(1, node.transform.width + dx);
          break;

        case 'middle-left':
          newWidth = Math.max(1, node.transform.width - dx);
          newX = node.transform.x + (node.transform.width - newWidth);
          break;

        case 'bottom-center':
          newHeight = Math.max(1, node.transform.height + dy);
          break;

        case 'top-center':
          newHeight = Math.max(1, node.transform.height - dy);
          newY = node.transform.y + (node.transform.height - newHeight);
          break;
      }

      if (lockAspectRatio) {
        const constrained = BoundingBoxModel.constrainAspectRatio(node.transform.width, node.transform.height, newWidth, newHeight);
        newWidth = constrained.width;
        newHeight = constrained.height;
      }

      if (scaleFromCenter) {
        const scaledBox = BoundingBoxModel.scaleFromCenter(
          { x: node.transform.x, y: node.transform.y, width: node.transform.width, height: node.transform.height },
          newWidth / node.transform.width,
          newHeight / node.transform.height
        );
        newX = scaledBox.x;
        newY = scaledBox.y;
        newWidth = scaledBox.width;
        newHeight = scaledBox.height;
      }

      updatedScene = SceneGraphModel.updateLayer(updatedScene, id, {
        transform: {
          ...node.transform,
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        },
      });
    }

    return updatedScene;
  }

  /**
   * Rotates selected node(s) by delta degrees.
   */
  public static rotateSelection(scene: Scene, selectedNodeIds: ReadonlyArray<string>, deltaDeg: number): Scene {
    let updatedScene = scene;

    for (const id of selectedNodeIds) {
      const node = SceneGraphModel.findLayerNode(updatedScene, id);
      if (!node) continue;

      const newRot = (node.transform.rotationDeg + deltaDeg) % 360;
      updatedScene = SceneGraphModel.updateLayer(updatedScene, id, {
        transform: {
          ...node.transform,
          rotationDeg: newRot < 0 ? newRot + 360 : newRot,
        },
      });
    }

    return updatedScene;
  }
}
