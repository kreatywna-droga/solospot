/**
 * LayerVisibility.test.ts — Sprint S19 Vitest Test Suite (ETAP 7)
 */

import { describe, expect, it } from 'vitest';
import { LayerOperationsEngine } from '../LayerOperationsEngine';
import { SceneCompositor } from '../SceneCompositor';
import { createLayer, createScene } from '../SceneGraphModel';

describe('Layer Visibility, Lock, Solo & Isolate (ETAP 1, 2, 3 & 7)', () => {
  it('toggles visibility and lock state on layers', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l1', visible: true, locked: false }));

    scene = LayerOperationsEngine.toggleVisibility(scene, 'l1');
    expect(scene.layers['l1'].visible).toBe(false);

    scene = LayerOperationsEngine.toggleLock(scene, 'l1');
    expect(scene.layers['l1'].locked).toBe(true);
  });

  it('evaluates effective visibility taking parent visibility into account', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l1', visible: true }));
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l2', visible: true }));
    scene = LayerOperationsEngine.groupLayers(scene, 'g1', ['l1', 'l2']);

    // Hide parent group g1
    scene = LayerOperationsEngine.toggleVisibility(scene, 'g1', false);

    expect(scene.layers['l1'].visible).toBe(true); // local visible is true
    expect(SceneCompositor.computeEffectiveVisibility(scene, 'l1')).toBe(false); // effective is false
  });

  it('evaluates solo mode filtering', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l1' }));
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l2' }));

    // Solo layer l1
    scene = LayerOperationsEngine.toggleSolo(scene, 'l1', true);

    expect(SceneCompositor.computeEffectiveVisibility(scene, 'l1')).toBe(true);
    expect(SceneCompositor.computeEffectiveVisibility(scene, 'l2')).toBe(false);
  });

  it('evaluates isolation mode filtering', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l1' }));
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l2' }));

    // Isolate layer l1
    scene = LayerOperationsEngine.toggleIsolate(scene, 'l1', true);

    expect(scene.isolatedLayerId).toBe('l1');
    expect(SceneCompositor.computeEffectiveVisibility(scene, 'l1')).toBe(true);
    expect(SceneCompositor.computeEffectiveVisibility(scene, 'l2')).toBe(false);
  });
});
