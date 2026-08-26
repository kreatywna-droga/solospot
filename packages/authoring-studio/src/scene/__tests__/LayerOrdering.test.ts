/**
 * LayerOrdering.test.ts — Sprint S19 Vitest Test Suite (ETAP 7)
 */

import { describe, expect, it } from 'vitest';
import { LayerOperationsEngine } from '../LayerOperationsEngine';
import { createLayer, createScene } from '../SceneGraphModel';

describe('Layer Z-Ordering (ETAP 2 & 7)', () => {
  it('reorders layers via bringToFront, sendToBack, bringForward, sendBackward', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l1' }));
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l2' }));
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l3' }));

    expect(scene.rootLayerIds).toEqual(['l1', 'l2', 'l3']);

    // Send l3 to back
    scene = LayerOperationsEngine.reorderLayer(scene, 'l3', 'sendToBack');
    expect(scene.rootLayerIds).toEqual(['l3', 'l1', 'l2']);

    // Bring l3 to front
    scene = LayerOperationsEngine.reorderLayer(scene, 'l3', 'bringToFront');
    expect(scene.rootLayerIds).toEqual(['l1', 'l2', 'l3']);

    // Bring l1 forward
    scene = LayerOperationsEngine.reorderLayer(scene, 'l1', 'bringForward');
    expect(scene.rootLayerIds).toEqual(['l2', 'l1', 'l3']);

    // Send l1 backward
    scene = LayerOperationsEngine.reorderLayer(scene, 'l1', 'sendBackward');
    expect(scene.rootLayerIds).toEqual(['l1', 'l2', 'l3']);
  });
});
