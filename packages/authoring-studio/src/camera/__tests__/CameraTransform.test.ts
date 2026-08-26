import { describe, expect, it } from 'vitest';
import { createCamera } from '../CameraModel';
import { CameraOperationsEngine } from '../CameraOperationsEngine';

describe('CameraTransform Calculations', () => {
  it('should apply rotation deltas and normalize degrees to 0-360 range', () => {
    let cam = createCamera({ id: 'c1' });
    cam = CameraOperationsEngine.rotateCamera(cam, 90);
    expect(cam.transform.rotationDeg).toBe(90);

    cam = CameraOperationsEngine.rotateCamera(cam, 300);
    expect(cam.transform.rotationDeg).toBe(30);
  });

  it('should clamp zoom within min and max boundaries', () => {
    let cam = createCamera({ id: 'c1', transform: { zoom: 0.1 } });
    cam = CameraOperationsEngine.zoomCamera(cam, 0.001); // Attempts to zoom past min
    expect(cam.transform.zoom).toBeGreaterThanOrEqual(0.05);

    cam = CameraOperationsEngine.zoomCamera(cam, 1000); // Attempts to zoom past max
    expect(cam.transform.zoom).toBeLessThanOrEqual(50.0);
  });
});
