import { describe, expect, it } from 'vitest';
import { createScene, createLayer, findLayerNode } from '../../scene/SceneGraphModel';
import { TransformInteractionEngine } from '../TransformInteractionEngine';

describe('TransformInteractionEngine Engine', () => {
  it('should move selected layers by displacement delta (dx, dy)', () => {
    const l1 = createLayer({
      id: 'l1',
      name: 'Layer 1',
      type: 'vector',
      transform: { x: 10, y: 20, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1 },
    });
    let scene = createScene({ id: 's1', layers: { [l1.id]: l1 } });

    scene = TransformInteractionEngine.moveSelection(scene, ['l1'], 50, -10);
    const node = findLayerNode(scene, 'l1');

    expect(node?.transform.x).toBe(60);
    expect(node?.transform.y).toBe(10);
  });

  it('should resize selected layer when dragging handle', () => {
    const l1 = createLayer({
      id: 'l1',
      name: 'Layer 1',
      type: 'vector',
      transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1 },
    });
    let scene = createScene({ id: 's1', layers: { [l1.id]: l1 } });

    scene = TransformInteractionEngine.resizeSelection(scene, ['l1'], 'bottom-right', 50, 50);
    const node = findLayerNode(scene, 'l1');

    expect(node?.transform.width).toBe(150);
    expect(node?.transform.height).toBe(150);
  });

  it('should rotate selected layer by delta degrees', () => {
    const l1 = createLayer({
      id: 'l1',
      name: 'Layer 1',
      type: 'vector',
      transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 45, scaleX: 1, scaleY: 1 },
    });
    let scene = createScene({ id: 's1', layers: { [l1.id]: l1 } });

    scene = TransformInteractionEngine.rotateSelection(scene, ['l1'], 45);
    const node = findLayerNode(scene, 'l1');

    expect(node?.transform.rotationDeg).toBe(90);
  });
});
