/**
 * Compositing.test.ts — Sprint S19 Vitest Test Suite (ETAP 7)
 */

import { describe, expect, it } from 'vitest';
import { LayerOperationsEngine } from '../LayerOperationsEngine';
import { SceneCompositor } from '../SceneCompositor';
import { createLayer, createScene } from '../SceneGraphModel';

describe('SceneCompositor (ETAP 3 & 7)', () => {
  it('computes inherited opacity down nested group chain', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l1', opacity: 0.5 }));
    scene = LayerOperationsEngine.groupLayers(scene, 'g1', ['l1']);
    scene = LayerOperationsEngine.setOpacity(scene, 'g1', 0.5);

    const opacity = SceneCompositor.computeInheritedOpacity(scene, 'l1');
    expect(opacity).toBeCloseTo(0.25);
  });

  it('computes 2D world matrix concatenation for nested translation & rotation', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(
      scene,
      createLayer({ id: 'l1', transform: { x: 10, y: 20, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } })
    );
    scene = LayerOperationsEngine.groupLayers(scene, 'g1', ['l1']);
    scene = LayerOperationsEngine.createLayer(
      scene,
      createLayer({ id: 'g1', transform: { x: 50, y: 50, width: 200, height: 200, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } })
    );

    const matrix = SceneCompositor.computeWorldMatrix(scene, 'l1');
    const [a, b, c, d, e, f] = matrix;

    expect(e).toBe(60); // 50 + 10
    expect(f).toBe(70); // 50 + 20
  });

  it('traverses composited scene in z-order', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l1', name: 'Bottom' }));
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l2', name: 'Top' }));

    const composited = SceneCompositor.traverseCompositedScene(scene);
    expect(composited).toHaveLength(2);
    expect(composited[0].layerId).toBe('l1');
    expect(composited[1].layerId).toBe('l2');
  });
});
