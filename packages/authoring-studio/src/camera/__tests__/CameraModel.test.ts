import { describe, expect, it } from 'vitest';
import {
  createCamera,
  createCameraTransform,
  createCameraViewport,
  DEFAULT_CAMERA_TRANSFORM,
  DEFAULT_CAMERA_VIEWPORT,
} from '../CameraModel';

describe('CameraModel DTOs', () => {
  it('should create CameraTransform with defaults', () => {
    const t = createCameraTransform();
    expect(t.position).toEqual({ x: 0, y: 0, z: 0 });
    expect(t.zoom).toBe(1.0);
    expect(t.rotationDeg).toBe(0);
  });

  it('should create CameraViewport with custom dimensions', () => {
    const vp = createCameraViewport({ width: 2560, height: 1440, devicePixelRatio: 2.0 });
    expect(vp.width).toBe(2560);
    expect(vp.height).toBe(1440);
    expect(vp.devicePixelRatio).toBe(2.0);
  });

  it('should create Camera with specified parameters', () => {
    const cam = createCamera({
      id: 'cam1',
      name: 'MainCamera',
      transform: { position: { x: 100, y: 200, z: 0 }, zoom: 2.0, rotationDeg: 45 },
      projection: 'orthographic',
    });

    expect(cam.id).toBe('cam1');
    expect(cam.name).toBe('MainCamera');
    expect(cam.transform.position.x).toBe(100);
    expect(cam.transform.zoom).toBe(2.0);
    expect(cam.transform.rotationDeg).toBe(45);
    expect(cam.projection).toBe('orthographic');
  });
});
