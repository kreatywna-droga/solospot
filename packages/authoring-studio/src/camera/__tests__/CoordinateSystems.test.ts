import { describe, expect, it } from 'vitest';
import { createCamera } from '../CameraModel';
import { CoordinateSystems } from '../CoordinateSystems';

describe('CoordinateSystems Math Engine', () => {
  it('should compute identity-like camera matrix for default camera', () => {
    const camera = createCamera({ id: 'c1', viewport: { width: 800, height: 600, devicePixelRatio: 1 } });
    const matrix = CoordinateSystems.computeCameraMatrix(camera);

    // Viewport center is at (400, 300)
    // World point (0, 0) maps to viewport center (400, 300)
    const screenPt = CoordinateSystems.worldToScreen({ x: 0, y: 0 }, camera);
    expect(screenPt.x).toBe(400);
    expect(screenPt.y).toBe(300);
  });

  it('should transform world to screen and back to world seamlessly (roundtrip)', () => {
    const camera = createCamera({
      id: 'c1',
      transform: { position: { x: 100, y: -50, z: 0 }, zoom: 1.5, rotationDeg: 0 },
      viewport: { width: 1920, height: 1080, devicePixelRatio: 1 },
    });

    const originalWorldPt = { x: 250, y: 400 };
    const screenPt = CoordinateSystems.worldToScreen(originalWorldPt, camera);
    const roundtripPt = CoordinateSystems.screenToWorld(screenPt, camera);

    expect(roundtripPt.x).toBeCloseTo(originalWorldPt.x, 4);
    expect(roundtripPt.y).toBeCloseTo(originalWorldPt.y, 4);
  });

  it('should handle devicePixelRatio scaling correctly', () => {
    const camera = createCamera({
      id: 'c1',
      viewport: { width: 1000, height: 1000, devicePixelRatio: 2.0 },
    });

    const worldPt = { x: 0, y: 0 };
    const screenPt = CoordinateSystems.worldToScreen(worldPt, camera);

    // Viewport center = (500, 500), with DPR = 2.0 -> Screen = (1000, 1000)
    expect(screenPt.x).toBe(1000);
    expect(screenPt.y).toBe(1000);

    const backToWorld = CoordinateSystems.screenToWorld({ x: 1000, y: 1000 }, camera);
    expect(backToWorld.x).toBeCloseTo(0, 4);
    expect(backToWorld.y).toBeCloseTo(0, 4);
  });

  it('should transform bounding boxes between world and viewport space', () => {
    const camera = createCamera({
      id: 'c1',
      transform: { position: { x: 0, y: 0, z: 0 }, zoom: 2.0, rotationDeg: 0 },
      viewport: { width: 800, height: 600, devicePixelRatio: 1 },
    });

    const worldBounds = { x: -50, y: -50, width: 100, height: 100 };
    const vpBounds = CoordinateSystems.worldToViewport(worldBounds, camera);

    expect(vpBounds.width).toBe(200); // 100 * zoom 2.0
    expect(vpBounds.height).toBe(200);
  });
});
