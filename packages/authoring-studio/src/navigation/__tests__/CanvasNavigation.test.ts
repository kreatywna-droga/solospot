import { describe, expect, it } from 'vitest';
import { createCamera } from '../../camera/CameraModel';
import { CanvasNavigationController } from '../CanvasNavigationController';

describe('CanvasNavigationController', () => {
  const initialCamera = createCamera({
    id: 'cam_nav',
    transform: { position: { x: 0, y: 0, z: 0 }, zoom: 1.0, rotationDeg: 0 },
    viewport: { width: 1920, height: 1080, devicePixelRatio: 1.0 },
  });

  it('should zoom camera by multiplicative factor', () => {
    const zoomed = CanvasNavigationController.zoom(initialCamera, 1.5);
    expect(zoomed.transform.zoom).toBe(1.5);
  });

  it('should pan camera by delta', () => {
    const panned = CanvasNavigationController.pan(initialCamera, 100, -50);
    expect(panned.transform.position.x).toBe(100);
    expect(panned.transform.position.y).toBe(-50);
  });

  it('should zoom to cursor position correctly', () => {
    const screenPoint = { x: 960, y: 540 }; // center screen
    const zoomed = CanvasNavigationController.zoomToCursor(initialCamera, screenPoint, 2.0);
    expect(zoomed.transform.zoom).toBe(2.0);
  });

  it('should fit content bounds within viewport', () => {
    const contentBounds = { x: 0, y: 0, width: 3840, height: 2160 };
    const fitted = CanvasNavigationController.fitToContent(initialCamera, contentBounds, 0);
    expect(fitted.transform.zoom).toBeCloseTo(0.5);
    expect(fitted.transform.position.x).toBe(1920);
    expect(fitted.transform.position.y).toBe(1080);
  });

  it('should fit selection bounds within viewport', () => {
    const selectionBounds = { x: 100, y: 100, width: 800, height: 600 };
    const fitted = CanvasNavigationController.fitToSelection(initialCamera, selectionBounds, 20);
    expect(fitted.transform.zoom).toBeGreaterThan(0);
    expect(fitted.transform.position.x).toBe(500);
    expect(fitted.transform.position.y).toBe(400);
  });

  it('should reset viewport to default state', () => {
    const modified = CanvasNavigationController.pan(CanvasNavigationController.zoom(initialCamera, 3.0), 200, 300);
    const reset = CanvasNavigationController.resetViewport(modified);
    expect(reset.transform.position.x).toBe(0);
    expect(reset.transform.position.y).toBe(0);
    expect(reset.transform.zoom).toBe(1.0);
  });

  it('should center selection without altering zoom level', () => {
    const zoomed = CanvasNavigationController.zoom(initialCamera, 2.5);
    const selectionBounds = { x: 200, y: 400, width: 100, height: 100 };
    const centered = CanvasNavigationController.centerSelection(zoomed, selectionBounds);
    expect(centered.transform.zoom).toBe(2.5);
    expect(centered.transform.position.x).toBe(250);
    expect(centered.transform.position.y).toBe(450);
  });
});
