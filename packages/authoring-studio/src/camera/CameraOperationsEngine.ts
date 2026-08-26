/**
 * CameraOperationsEngine.ts — Sprint S21 Camera Operations Engine (ETAP 2)
 *
 * Implements pure headless calculations for:
 * pan, zoom, rotate, fit-to-content, fit-selection, center-selection, reset-view, zoom-to-100%, zoom-to-fit.
 *
 * Decouples transient editor viewport state from persistent document SSOT.
 * Headless: NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import { Camera, CameraBounds } from './CameraModel';

export class CameraOperationsEngine {
  /**
   * Pans the camera by displacement delta (dx, dy).
   */
  public static panCamera(camera: Camera, dx: number, dy: number): Camera {
    return {
      ...camera,
      transform: {
        ...camera.transform,
        position: {
          ...camera.transform.position,
          x: camera.transform.position.x + dx,
          y: camera.transform.position.y + dy,
        },
      },
    };
  }

  /**
   * Zooms the camera by a multiplicative factor (e.g. 1.2 for zoom in, 0.8 for zoom out).
   * Optionally zooms around a specific pivot point in world space.
   */
  public static zoomCamera(
    camera: Camera,
    factor: number,
    pivotPoint?: { x: number; y: number }
  ): Camera {
    const minZoom = 0.05;
    const maxZoom = 50.0;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, camera.transform.zoom * factor));

    if (!pivotPoint) {
      return {
        ...camera,
        transform: {
          ...camera.transform,
          zoom: newZoom,
        },
      };
    }

    // Pivot-point zoom calculation
    const zoomRatio = 1 - newZoom / camera.transform.zoom;
    const newX = camera.transform.position.x + (pivotPoint.x - camera.transform.position.x) * zoomRatio;
    const newY = camera.transform.position.y + (pivotPoint.y - camera.transform.position.y) * zoomRatio;

    return {
      ...camera,
      transform: {
        position: {
          ...camera.transform.position,
          x: newX,
          y: newY,
        },
        zoom: newZoom,
        rotationDeg: camera.transform.rotationDeg,
      },
    };
  }

  /**
   * Rotates the camera view by deltaDeg degrees.
   */
  public static rotateCamera(camera: Camera, deltaDeg: number): Camera {
    const newRotation = (camera.transform.rotationDeg + deltaDeg) % 360;
    return {
      ...camera,
      transform: {
        ...camera.transform,
        rotationDeg: newRotation < 0 ? newRotation + 360 : newRotation,
      },
    };
  }

  /**
   * Adjusts camera position and zoom to fit target content bounds within the viewport.
   */
  public static fitToContent(
    camera: Camera,
    contentBounds: CameraBounds,
    padding: number = 40
  ): Camera {
    if (contentBounds.width <= 0 || contentBounds.height <= 0) return camera;

    const availWidth = Math.max(1, camera.viewport.width - padding * 2);
    const availHeight = Math.max(1, camera.viewport.height - padding * 2);

    const scaleX = availWidth / contentBounds.width;
    const scaleY = availHeight / contentBounds.height;
    const fitZoom = Math.min(scaleX, scaleY);

    const centerX = contentBounds.x + contentBounds.width / 2;
    const centerY = contentBounds.y + contentBounds.height / 2;

    return {
      ...camera,
      transform: {
        position: { x: centerX, y: centerY, z: 0 },
        zoom: Math.max(0.05, Math.min(20.0, fitZoom)),
        rotationDeg: 0,
      },
    };
  }

  /**
   * Fits a target selection bounding box into the camera view.
   */
  public static fitSelection(
    camera: Camera,
    selectionBounds: CameraBounds,
    padding: number = 20
  ): Camera {
    return this.fitToContent(camera, selectionBounds, padding);
  }

  /**
   * Centers the camera on target selection bounds without changing zoom level.
   */
  public static centerSelection(camera: Camera, selectionBounds: CameraBounds): Camera {
    const centerX = selectionBounds.x + selectionBounds.width / 2;
    const centerY = selectionBounds.y + selectionBounds.height / 2;

    return {
      ...camera,
      transform: {
        ...camera.transform,
        position: { ...camera.transform.position, x: centerX, y: centerY },
      },
    };
  }

  /**
   * Resets camera transform to default position (0, 0), zoom 1.0 (100%), and 0deg rotation.
   */
  public static resetView(camera: Camera): Camera {
    return {
      ...camera,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        zoom: 1.0,
        rotationDeg: 0,
      },
    };
  }

  /**
   * Sets zoom directly to 1.0 (100%) keeping current position and rotation.
   */
  public static zoomTo100(camera: Camera): Camera {
    return {
      ...camera,
      transform: {
        ...camera.transform,
        zoom: 1.0,
      },
    };
  }

  /**
   * Zooms to fit target container dimensions.
   */
  public static zoomToFit(camera: Camera, containerBounds: CameraBounds): Camera {
    return this.fitToContent(camera, containerBounds, 0);
  }
}
