import { describe, expect, it } from 'vitest';
import { createScene, createLayer } from '../../scene/SceneGraphModel';
import { GuidesEngine } from '../GuidesEngine';

describe('GuidesEngine Calculation Engine', () => {
  it('should compute smart center guide lines when active selection aligns with scene objects', () => {
    const layer1 = createLayer({
      id: 'l1',
      name: 'Layer 1',
      type: 'vector',
      transform: { x: 100, y: 100, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1 },
    });
    const scene = createScene({ id: 's1', layers: { [layer1.id]: layer1 } });

    // Active bounds centered at X = 150 (since l1 has x: 100, width: 100 => center: 150)
    const activeBounds = { x: 100, y: 300, width: 100, height: 100 };
    const res = GuidesEngine.computeSmartGuides(scene, ['active'], activeBounds);

    expect(res.lines.length).toBeGreaterThan(0);
    expect(res.lines[0].type).toBe('vertical');
    expect(res.lines[0].position).toBe(150);
  });
});
