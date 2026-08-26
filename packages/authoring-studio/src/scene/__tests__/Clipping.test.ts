/**
 * Clipping.test.ts — Sprint S19 Vitest Test Suite (ETAP 7)
 */

import { describe, expect, it } from 'vitest';
import { LayerOperationsEngine } from '../LayerOperationsEngine';
import { SceneCompositor } from '../SceneCompositor';
import { createLayer, createScene } from '../SceneGraphModel';

describe('Clipping Groups & Masks (ETAP 1, 3 & 7)', () => {
  it('applies a clipping group to target layers', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'mask1', name: 'Mask' }));
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'target1', name: 'Target' }));

    scene = LayerOperationsEngine.setClippingGroup(scene, 'mask1', ['target1'], 'M 0 0 L 100 0 L 100 100 Z');

    const clippingInfo = SceneCompositor.computeClipping(scene, 'target1');
    expect(clippingInfo.isClipped).toBe(true);
    expect(clippingInfo.maskLayerId).toBe('mask1');
    expect(clippingInfo.clipPath).toBe('M 0 0 L 100 0 L 100 100 Z');
  });

  it('returns isClipped false for unclipped layers', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'unclipped' }));

    const clippingInfo = SceneCompositor.computeClipping(scene, 'unclipped');
    expect(clippingInfo.isClipped).toBe(false);
  });
});
