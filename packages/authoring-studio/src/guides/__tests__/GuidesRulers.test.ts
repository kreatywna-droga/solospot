import { describe, expect, it } from 'vitest';
import { createCamera } from '../../camera/CameraModel';
import { createLayer, createScene } from '../../scene/SceneGraphModel';
import { GuidesRulersController } from '../GuidesRulersController';
import type { UserGuide } from '../GuidesRulersModel';

describe('GuidesRulersController', () => {
  const camera = createCamera({
    id: 'cam_g',
    transform: { position: { x: 0, y: 0, z: 0 }, zoom: 1.0, rotationDeg: 0 },
    viewport: { width: 1000, height: 800, devicePixelRatio: 1.0 },
  });

  it('should manage user guides (add, move, lock, remove, clear)', () => {
    let guides: ReadonlyArray<UserGuide> = [];
    const g1 = GuidesRulersController.createGuide({ type: 'horizontal', position: 150 });
    const g2 = GuidesRulersController.createGuide({ type: 'vertical', position: 300 });

    guides = GuidesRulersController.addGuide(guides, g1);
    guides = GuidesRulersController.addGuide(guides, g2);
    expect(guides.length).toBe(2);

    guides = GuidesRulersController.moveGuide(guides, g1.id, 180);
    expect(guides.find((g) => g.id === g1.id)?.position).toBe(180);

    guides = GuidesRulersController.toggleLockGuide(guides, g1.id);
    expect(guides.find((g) => g.id === g1.id)?.locked).toBe(true);

    // Locked guide shouldn't move
    guides = GuidesRulersController.moveGuide(guides, g1.id, 250);
    expect(guides.find((g) => g.id === g1.id)?.position).toBe(180);

    guides = GuidesRulersController.removeGuide(guides, g2.id);
    expect(guides.length).toBe(1);

    guides = GuidesRulersController.clearGuides();
    expect(guides.length).toBe(0);
  });

  it('should compute ruler ticks correctly for viewport', () => {
    const ticks = GuidesRulersController.computeRulerTicks(1000, camera, 'horizontal');
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.some((t) => t.isMajor && t.label !== undefined)).toBe(true);
  });

  it('should compute smart guide alignment lines and gaps', () => {
    const layer1 = createLayer({
      id: 'l1',
      name: 'L1',
      transform: { x: 100, y: 100, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1 },
    });
    const scene = createScene({ id: 's1', layers: { [layer1.id]: layer1 } });
    const activeBounds = { x: 200, y: 100, width: 100, height: 100 }; // horizontally aligned centers / top

    const result = GuidesRulersController.computeSmartGuides(scene, ['l2'], activeBounds);
    expect(result.lines.length).toBeGreaterThan(0);
  });
});
