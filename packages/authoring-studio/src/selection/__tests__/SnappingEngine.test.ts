import { describe, expect, it } from 'vitest';
import { createScene, createLayer } from '../../scene/SceneGraphModel';
import { SnappingEngine } from '../SnappingEngine';

describe('SnappingEngine Engine', () => {
  it('should snap position delta to nearest grid line', () => {
    const bounds = { x: 10, y: 10, width: 100, height: 100 };
    const res = SnappingEngine.snapToGrid(bounds, 4, 14, 16, 8);

    // Target X: 14 -> nearest 16 -> snapped delta = 6
    // Target Y: 24 -> nearest 32 -> diff = 8 <= threshold -> snapped delta = 22
    expect(res.snappedDx).toBe(6);
  });

  it('should snap selection bounds to target non-selected scene objects', () => {
    const target = createLayer({
      id: 'target',
      name: 'Target Object',
      type: 'vector',
      transform: { x: 200, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1 },
    });
    const scene = createScene({ id: 's1', layers: { [target.id]: target } });

    const activeBounds = { x: 95, y: 0, width: 100, height: 100 }; // Right edge = 195, close to 200
    const res = SnappingEngine.snapToObjects(scene, ['active'], activeBounds, 0, 0, 8);

    expect(res.snappedDx).toBe(5); // Snaps right edge from 195 to 200 (delta +5)
    expect(res.guideLines.length).toBeGreaterThan(0);
  });
});
