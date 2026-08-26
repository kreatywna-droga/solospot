import { describe, expect, it } from 'vitest';
import { createLayer, createScene, SceneGraphModel } from '../../scene/SceneGraphModel';
import { BoundingBoxModel } from '../BoundingBoxModel';

describe('BoundingBoxModel Calculations Engine', () => {
  it('should compute combined bounding box of multi-selection', () => {
    const l1 = createLayer({
      id: 'l1',
      name: 'Layer 1',
      type: 'vector',
      transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1 },
    });
    const l2 = createLayer({
      id: 'l2',
      name: 'Layer 2',
      type: 'vector',
      transform: { x: 200, y: 300, width: 50, height: 50, rotationDeg: 0, scaleX: 1, scaleY: 1 },
    });
    const scene = createScene({ id: 's1', layers: { [l1.id]: l1, [l2.id]: l2 } });

    const bounds = BoundingBoxModel.computeSelectionBounds(scene, ['l1', 'l2']);
    expect(bounds).not.toBeNull();
    expect(bounds?.x).toBe(0);
    expect(bounds?.y).toBe(0);
    expect(bounds?.width).toBe(250); // 200 + 50
    expect(bounds?.height).toBe(350); // 300 + 50
  });

  it('should calculate 9 key points for bounding box handles', () => {
    const box = { x: 100, y: 100, width: 200, height: 100 };
    const pts = BoundingBoxModel.getBoundingBoxPoints(box);

    expect(pts.topLeft).toEqual({ x: 100, y: 100 });
    expect(pts.center).toEqual({ x: 200, y: 150 });
    expect(pts.bottomRight).toEqual({ x: 300, y: 200 });
  });

  it('should constrain dimensions to aspect ratio', () => {
    const constrained = BoundingBoxModel.constrainAspectRatio(100, 50, 400, 300);
    expect(constrained.width / constrained.height).toBe(2.0); // 100 / 50 = 2.0
  });

  it('should scale bounding box from center', () => {
    const original = { x: 100, y: 100, width: 200, height: 100 };
    const scaled = BoundingBoxModel.scaleFromCenter(original, 2.0, 2.0);

    expect(scaled.width).toBe(400);
    expect(scaled.height).toBe(200);
    expect(scaled.x).toBe(0); // Center at (200, 150) -> x = 200 - 200 = 0
    expect(scaled.y).toBe(50); // y = 150 - 100 = 50
  });
});
