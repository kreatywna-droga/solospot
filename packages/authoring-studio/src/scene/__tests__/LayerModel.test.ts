/**
 * LayerModel.test.ts — Sprint S19 Vitest Test Suite (ETAP 7)
 */

import { describe, expect, it } from 'vitest';
import { DEFAULT_LAYER_TRANSFORM, createLayer, createLayerGroup } from '../SceneGraphModel';

describe('LayerModel DTO (ETAP 1 & 7)', () => {
  it('instantiates layer with default properties', () => {
    const layer = createLayer({ id: 'layer_1' });
    expect(layer.id).toBe('layer_1');
    expect(layer.type).toBe('vector');
    expect(layer.visible).toBe(true);
    expect(layer.locked).toBe(false);
    expect(layer.solo).toBe(false);
    expect(layer.isolate).toBe(false);
    expect(layer.opacity).toBe(1.0);
    expect(layer.blendMode).toBe('normal');
    expect(layer.transform).toEqual(DEFAULT_LAYER_TRANSFORM);
  });

  it('instantiates LayerGroup with childIds and group type', () => {
    const group = createLayerGroup({ id: 'group_1', name: 'MyGroup', childIds: ['child_1'] });
    expect(group.id).toBe('group_1');
    expect(group.type).toBe('group');
    expect(group.childIds).toEqual(['child_1']);
    expect(group.isExpanded).toBe(true);
  });

  it('supports custom transforms and blend modes', () => {
    const layer = createLayer({
      id: 'layer_custom',
      transform: { x: 50, y: 100, rotationDeg: 45 },
      blendMode: 'multiply',
      opacity: 0.8,
    });

    expect(layer.transform.x).toBe(50);
    expect(layer.transform.y).toBe(100);
    expect(layer.transform.rotationDeg).toBe(45);
    expect(layer.blendMode).toBe('multiply');
    expect(layer.opacity).toBe(0.8);
  });
});
