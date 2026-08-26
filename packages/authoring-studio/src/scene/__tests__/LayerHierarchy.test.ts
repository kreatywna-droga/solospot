/**
 * LayerHierarchy.test.ts — Sprint S19 Vitest Test Suite (ETAP 7)
 */

import { describe, expect, it } from 'vitest';
import { LayerOperationsEngine } from '../LayerOperationsEngine';
import { createLayer, createScene } from '../SceneGraphModel';

describe('Layer Hierarchy Operations (ETAP 2 & 7)', () => {
  it('groups multiple layers into a new LayerGroup', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l1' }));
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l2' }));

    scene = LayerOperationsEngine.groupLayers(scene, 'g1', ['l1', 'l2'], 'My Group');

    expect(scene.layers['g1']).toBeDefined();
    expect(scene.layers['g1'].type).toBe('group');
    expect(scene.layers['g1'].childIds).toEqual(['l1', 'l2']);
    expect(scene.layers['l1'].parentId).toBe('g1');
    expect(scene.layers['l2'].parentId).toBe('g1');
  });

  it('ungroups a LayerGroup, promoting children to parent level', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l1' }));
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l2' }));
    scene = LayerOperationsEngine.groupLayers(scene, 'g1', ['l1', 'l2']);

    scene = LayerOperationsEngine.ungroupLayers(scene, 'g1');

    expect(scene.layers['g1']).toBeUndefined();
    expect(scene.layers['l1'].parentId).toBeUndefined();
    expect(scene.layers['l2'].parentId).toBeUndefined();
    expect(scene.rootLayerIds).toContain('l1');
    expect(scene.rootLayerIds).toContain('l2');
  });

  it('moves a layer into and out of a group', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l1' }));
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l2' }));
    scene = LayerOperationsEngine.groupLayers(scene, 'g1', ['l1']);

    scene = LayerOperationsEngine.moveIntoGroup(scene, 'l2', 'g1');
    expect(scene.layers['g1'].childIds).toContain('l2');
    expect(scene.layers['l2'].parentId).toBe('g1');

    scene = LayerOperationsEngine.moveOutOfGroup(scene, 'l2');
    expect(scene.layers['g1'].childIds).not.toContain('l2');
    expect(scene.layers['l2'].parentId).toBeUndefined();
  });
});
