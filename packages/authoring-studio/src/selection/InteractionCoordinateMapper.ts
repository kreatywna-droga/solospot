/**
 * InteractionCoordinateMapper.ts — Sprint S22 Pointer Coordinate Mapper
 *
 * Maps pointer event / screen space coordinates through Camera and CoordinateSystems
 * into World space and layer local space.
 *
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Camera } from '../camera/CameraModel';
import { CoordinateSystems } from '../camera/CoordinateSystems';
import { SceneLayerNode } from '../scene/SceneGraphModel';

export class InteractionCoordinateMapper {
  /**
   * Converts a pointer screen coordinate (x, y) into World space.
   */
  public static screenToWorld(
    screenPoint: { x: number; y: number },
    camera: Camera
  ): { x: number; y: number } {
    return CoordinateSystems.screenToWorld(screenPoint, camera);
  }

  /**
   * Converts a World space point (x, y) into Screen space.
   */
  public static worldToScreen(
    worldPoint: { x: number; y: number },
    camera: Camera
  ): { x: number; y: number } {
    return CoordinateSystems.worldToScreen(worldPoint, camera);
  }

  /**
   * Converts a World space point (x, y) into a target layer's local space coordinates.
   */
  public static worldToLayerLocal(
    worldPoint: { x: number; y: number },
    layerNode: SceneLayerNode
  ): { x: number; y: number } {
    const transform = layerNode.transform as any;
    const parentX = typeof transform?.x === 'number' ? transform.x : (transform?.position?.x ?? 0);
    const parentY = typeof transform?.y === 'number' ? transform.y : (transform?.position?.y ?? 0);

    return {
      x: worldPoint.x - parentX,
      y: worldPoint.y - parentY,
    };
  }
}
