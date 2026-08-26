import { describe, expect, it } from 'vitest';
import { createCamera } from '../CameraModel';
import { CameraOperationsEngine } from '../CameraOperationsEngine';

describe('ZoomPan Operations Engine', () => {
  it('should pan camera by delta (dx, dy)', () => {
    const camera = createCamera({ id: 'c1', transform: { position: { x: 50, y: 50, z: 0 } } });
    const panned = CameraOperationsEngine.panCamera(camera, 100, -30);

    expect(panned.transform.position.x).toBe(150);
    expect(panned.transform.position.y).toBe(20);
  });

  it('should zoom camera with pivot point calculation', () => {
    const camera = createCamera({
      id: 'c1',
      transform: { position: { x: 0, y: 0, z: 0 }, zoom: 1.0, rotationDeg: 0 },
    });

    const pivot = { x: 200, y: 200 };
    const zoomed = CameraOperationsEngine.zoomCamera(camera, 2.0, pivot);

    expect(zoomed.transform.zoom).toBe(2.0);
    expect(zoomed.transform.position.x).not.toBe(0);
    expect(zoomed.transform.position.y).not.toBe(0);
  });

  it('should clamp zoom levels safely between 0.05 and 50.0', () => {
    let camera = createCamera({ id: 'c1', transform: { zoom: 1.0 } });

    // Extreme zoom out
    camera = CameraOperationsEngine.zoomCamera(camera, 0.0001);
    expect(camera.transform.zoom).toBe(0.05);

    // Extreme zoom in
    camera = CameraOperationsEngine.zoomCamera(camera, 10000);
    expect(camera.transform.zoom).toBe(50.0);
  });
});
