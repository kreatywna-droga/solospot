/**
 * CanvasNavigationController.ts — Sprint S23 Canvas Navigation Controller
 *
 * Pure headless controller orchestrating canvas navigation actions:
 * - zoom (multiplicative factor or absolute level)
 * - pan (delta displacement)
 * - zoom-to-cursor (pivot zoom based on screen cursor position)
 * - fit-to-content (fit scene bounds within viewport)
 * - fit-to-selection (fit selection bounds within viewport)
 * - reset viewport (reset to default position and 100% zoom)
 * - center selection (re-center viewport on active selection)
 *
 * Delegates directly to CameraOperationsEngine (S21) and InteractionCoordinateMapper.
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Camera, CameraBounds } from '../camera/CameraModel';
import { CameraOperationsEngine } from '../camera/CameraOperationsEngine';
import { InteractionCoordinateMapper } from '../selection/InteractionCoordinateMapper';

export class CanvasNavigationController {
  /**
   * Zooms the camera by a multiplicative factor (e.g. 1.25 for zoom in, 0.8 for zoom out).
   * Optionally zooms relative to an explicit world pivot point.
   */
  public static zoom(
    camera: Camera,
    factor: number,
    pivotPoint?: { x: number; y: number }
  ): Camera {
    return CameraOperationsEngine.zoomCamera(camera, factor, pivotPoint);
  }

  /**
   * Pans the camera by a screen/world displacement delta (dx, dy).
   */
  public static pan(camera: Camera, dx: number, dy: number): Camera {
    return CameraOperationsEngine.panCamera(camera, dx, dy);
  }

  /**
   * Zooms the camera centered around a mouse cursor screen position.
   * Converts screen position to world coordinates via InteractionCoordinateMapper.
   */
  public static zoomToCursor(
    camera: Camera,
    screenPoint: { x: number; y: number },
    factor: number
  ): Camera {
    const worldPivot = InteractionCoordinateMapper.screenToWorld(screenPoint, camera);
    return CameraOperationsEngine.zoomCamera(camera, factor, worldPivot);
  }

  /**
   * Fits all content bounds within the current viewport with optional padding.
   */
  public static fitToContent(
    camera: Camera,
    contentBounds: CameraBounds,
    padding: number = 40
  ): Camera {
    return CameraOperationsEngine.fitToContent(camera, contentBounds, padding);
  }

  /**
   * Fits active selection bounds within the current viewport with optional padding.
   */
  public static fitToSelection(
    camera: Camera,
    selectionBounds: CameraBounds,
    padding: number = 20
  ): Camera {
    return CameraOperationsEngine.fitSelection(camera, selectionBounds, padding);
  }

  /**
   * Resets camera transform to origin (0, 0) and 1.0 (100%) zoom.
   */
  public static resetViewport(camera: Camera): Camera {
    return CameraOperationsEngine.resetView(camera);
  }

  /**
   * Centers the viewport on target selection bounds without altering zoom level.
   */
  public static centerSelection(
    camera: Camera,
    selectionBounds: CameraBounds
  ): Camera {
    return CameraOperationsEngine.centerSelection(camera, selectionBounds);
  }
}
