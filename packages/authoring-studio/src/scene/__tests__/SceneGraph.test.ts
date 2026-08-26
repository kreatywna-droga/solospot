/**
 * SceneGraph.test.ts — Sprint S19 Vitest Test Suite (ETAP 7)
 */

import { describe, expect, it } from 'vitest';
import { createLayer, createScene } from '../SceneGraphModel';

describe('SceneGraph Model (ETAP 1 & 7)', () => {
  it('creates a default scene with expected viewport dimensions and empty layers', () => {
    const scene = createScene({ id: 'scene_1', name: 'MainScene' });
    expect(scene.id).toBe('scene_1');
    expect(scene.name).toBe('MainScene');
    expect(scene.viewportWidth).toBe(1920);
    expect(scene.viewportHeight).toBe(1080);
    expect(scene.rootLayerIds).toHaveLength(0);
    expect(Object.keys(scene.layers)).toHaveLength(0);
  });

  it('populates initial layers and rootLayerIds when supplied', () => {
    const layer1 = createLayer({ id: 'l1', name: 'Layer 1' });
    const layer2 = createLayer({ id: 'l2', name: 'Layer 2' });

    const scene = createScene({
      id: 'scene_2',
      layers: { l1: layer1, l2: layer2 },
      rootLayerIds: ['l1', 'l2'],
    });

    expect(scene.rootLayerIds).toEqual(['l1', 'l2']);
    expect(scene.layers['l1'].name).toBe('Layer 1');
    expect(scene.layers['l2'].name).toBe('Layer 2');
  });
});
