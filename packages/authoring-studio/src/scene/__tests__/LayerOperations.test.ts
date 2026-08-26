/**
 * LayerOperations.test.ts — Sprint S19 Vitest Test Suite (ETAP 7)
 */

import { describe, expect, it } from 'vitest';
import { LayerOperationsEngine } from '../LayerOperationsEngine';
import { createLayer, createScene } from '../SceneGraphModel';

describe('LayerOperationsEngine (ETAP 2 & 7)', () => {
  it('creates and appends a layer to scene root', () => {
    let scene = createScene({ id: 's1' });
    const layer = createLayer({ id: 'l1', name: 'Layer 1' });

    scene = LayerOperationsEngine.createLayer(scene, layer);
    expect(scene.rootLayerIds).toContain('l1');
    expect(scene.layers['l1'].name).toBe('Layer 1');
  });

  it('renames a layer', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l1', name: 'Old' }));

    scene = LayerOperationsEngine.renameLayer(scene, 'l1', 'New Name');
    expect(scene.layers['l1'].name).toBe('New Name');
  });

  it('duplicates a layer with spatial offset', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l1', name: 'Original', transform: { x: 10, y: 20 } }));

    const res = LayerOperationsEngine.duplicateLayer(scene, 'l1');
    expect(res.duplicatedId).not.toBe('');
    expect(res.scene.layers[res.duplicatedId].name).toBe('Original_copy');
    expect(res.scene.layers[res.duplicatedId].transform.x).toBe(30);
    expect(res.scene.layers[res.duplicatedId].transform.y).toBe(40);
  });

  it('deletes a layer from scene', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l1' }));

    scene = LayerOperationsEngine.deleteLayer(scene, 'l1');
    expect(scene.rootLayerIds).not.toContain('l1');
    expect(scene.layers['l1']).toBeUndefined();
  });

  it('updates opacity and blend mode', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l1' }));

    scene = LayerOperationsEngine.setOpacity(scene, 'l1', 0.5);
    scene = LayerOperationsEngine.setBlendMode(scene, 'l1', 'screen');

    expect(scene.layers['l1'].opacity).toBe(0.5);
    expect(scene.layers['l1'].blendMode).toBe('screen');
  });
});
