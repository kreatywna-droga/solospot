import { describe, expect, it } from 'vitest';
import { createCamera } from '../CameraModel';
import { CameraOperationsEngine } from '../CameraOperationsEngine';

describe('FitToContent & Selection Operations', () => {
  it('should adjust camera position and zoom to fit content bounds', () => {
    const camera = createCamera({
      id: 'c1',
      viewport: { width: 1000, height: 1000, devicePixelRatio: 1 },
    });

    const contentBounds = { x: 100, y: 100, width: 800, height: 400 };
    const fitted = CameraOperationsEngine.fitToContent(camera, contentBounds, 50);

    // Center of content bounds is (500, 300)
    expect(fitted.transform.position.x).toBe(500);
    expect(fitted.transform.position.y).toBe(300);
    expect(fitted.transform.zoom).toBeGreaterThan(0);
  });

  it('should center selection without changing current zoom level', () => {
    const camera = createCamera({
      id: 'c1',
      transform: { zoom: 2.5, position: { x: 0, y: 0, z: 0 } },
    });

    const selectionBounds = { x: 300, y: 500, width: 200, height: 100 };
    const centered = CameraOperationsEngine.centerSelection(camera, selectionBounds);

    expect(centered.transform.position.x).toBe(400); // 300 + 100
    expect(centered.transform.position.y).toBe(550); // 500 + 50
    expect(centered.transform.zoom).toBe(2.5); // Unchanged
  });

  it('should reset view to default position (0, 0), zoom 1.0, rotation 0', () => {
    const camera = createCamera({
      id: 'c1',
      transform: { position: { x: 999, y: 888, z: 0 }, zoom: 5.0, rotationDeg: 120 },
    });

    const reset = CameraOperationsEngine.resetView(camera);
    expect(reset.transform.position).toEqual({ x: 0, y: 0, z: 0 });
    expect(reset.transform.zoom).toBe(1.0);
    expect(reset.transform.rotationDeg).toBe(0);
  });

  it('should zoom directly to 100% keeping current position and rotation', () => {
    const camera = createCamera({
      id: 'c1',
      transform: { position: { x: 250, y: 150, z: 0 }, zoom: 0.2, rotationDeg: 45 },
    });

    const z100 = CameraOperationsEngine.zoomTo100(camera);
    expect(z100.transform.zoom).toBe(1.0);
    expect(z100.transform.position.x).toBe(250);
    expect(z100.transform.rotationDeg).toBe(45);
  });
});
