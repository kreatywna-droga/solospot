import { describe, expect, it } from 'vitest';
import { createScene, createLayer, findLayerNode } from '../../scene/SceneGraphModel';
import { DistributionEngine } from '../DistributionEngine';

describe('DistributionEngine Engine', () => {
  it('should distribute 3 layers horizontally with equal spacing', () => {
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
      transform: { x: 150, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1 },
    });
    const l3 = createLayer({
      id: 'l3',
      name: 'Layer 3',
      type: 'vector',
      transform: { x: 600, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1 },
    });
    let scene = createScene({ id: 's1', layers: { [l1.id]: l1, [l2.id]: l2, [l3.id]: l3 } });

    scene = DistributionEngine.distributeSelection(scene, ['l1', 'l2', 'l3'], 'horizontal');
    const n1 = findLayerNode(scene, 'l1');
    const n2 = findLayerNode(scene, 'l2');
    const n3 = findLayerNode(scene, 'l3');

    // Total width = 700 - 0 = 700. Total node width = 300. Gap space = 400. Gap per item = 200.
    // l1 = 0, l2 = 0 + 100 + 200 = 300, l3 = 600
    expect(n1?.transform.x).toBe(0);
    expect(n2?.transform.x).toBe(300);
    expect(n3?.transform.x).toBe(600);
  });
});
