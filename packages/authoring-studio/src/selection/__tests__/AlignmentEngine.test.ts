import { describe, expect, it } from 'vitest';
import { createScene, createLayer, addLayer, findLayerNode } from '../../scene/SceneGraphModel';
import { AlignmentEngine } from '../AlignmentEngine';

describe('AlignmentEngine Engine', () => {
  it('should align multi-selected layers to left edge', () => {
    const l1 = createLayer({
      id: 'l1',
      name: 'Layer 1',
      type: 'vector',
      transform: { x: 50, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1 },
    });
    const l2 = createLayer({
      id: 'l2',
      name: 'Layer 2',
      type: 'vector',
      transform: { x: 200, y: 100, width: 80, height: 80, rotationDeg: 0, scaleX: 1, scaleY: 1 },
    });
    let scene = createScene({ id: 's1', layers: { [l1.id]: l1, [l2.id]: l2 } });

    scene = AlignmentEngine.alignSelection(scene, ['l1', 'l2'], 'align-left');
    const node1 = findLayerNode(scene, 'l1');
    const node2 = findLayerNode(scene, 'l2');

    expect(node1?.transform.x).toBe(50);
    expect(node2?.transform.x).toBe(50);
  });

  it('should align single layer relative to canvas bounds', () => {
    const l1 = createLayer({
      id: 'l1',
      name: 'Layer 1',
      type: 'vector',
      transform: { x: 10, y: 10, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1 },
    });
    let scene = createScene({ id: 's1', layers: { [l1.id]: l1 } });

    scene = AlignmentEngine.alignSelection(scene, ['l1'], 'align-center-h', { width: 1000, height: 1000 });
    const node1 = findLayerNode(scene, 'l1');

    // 1000 / 2 - 100 / 2 = 450
    expect(node1?.transform.x).toBe(450);
  });
});
