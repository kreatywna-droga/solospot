import { describe, expect, it } from 'vitest';
import { createLayer, createScene } from '../../scene/SceneGraphModel';
import { CanvasSnappingController } from '../CanvasSnappingController';

describe('CanvasSnappingController', () => {
  const layer1 = createLayer({
    id: 'l1',
    name: 'Layer 1',
    transform: { x: 100, y: 100, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1 },
  });

  const layer2 = createLayer({
    id: 'l2',
    name: 'Layer 2',
    transform: { x: 300, y: 100, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1 },
  });

  const scene = createScene({ id: 's1', layers: { [layer1.id]: layer1, [layer2.id]: layer2 } });

  it('should snap displacement delta to grid', () => {
    const activeBounds = { x: 100, y: 100, width: 100, height: 100 };
    // Move by (14, 14) -> target 114 -> nearest 16-multiple is 112 -> snapped delta = 12
    const result = CanvasSnappingController.snapDelta(scene, ['l1'], activeBounds, 14, 14, [], {
      snapToGrid: true,
      gridSize: 16,
      snapToObjects: false,
      snapToGuides: false,
    });

    expect(result.snappedDx).toBe(12);
    expect(result.snappedDy).toBe(12);
  });

  it('should snap displacement delta to user guide lines', () => {
    const activeBounds = { x: 100, y: 100, width: 100, height: 100 };
    const userGuides = [{ type: 'vertical' as const, position: 200 }]; // guide at x=200
    // Moving right edge from 200 to 198 (rawDx = 98 -> right edge at 198) -> snaps to 200 (dx = 100)
    const result = CanvasSnappingController.snapDelta(scene, ['l1'], activeBounds, 98, 0, userGuides, {
      snapToGuides: true,
      snapTolerance: 6,
      snapToGrid: false,
      snapToObjects: false,
    });

    expect(result.snappedDx).toBe(100);
    expect(result.guideLines.length).toBeGreaterThan(0);
  });

  it('should respect snap tolerance threshold', () => {
    const activeBounds = { x: 100, y: 100, width: 100, height: 100 };
    // Raw movement dx = 55 -> target 155 -> nearest 160 (diff=5) > snapTolerance of 3 -> remains 55
    const result = CanvasSnappingController.snapDelta(scene, ['l1'], activeBounds, 55, 55, [], {
      snapToGrid: true,
      gridSize: 16,
      snapTolerance: 3,
      snapToObjects: false,
      snapToGuides: false,
    });

    expect(result.snappedDx).toBe(55);
    expect(result.snappedDy).toBe(55);
  });
});
