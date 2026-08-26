/**
 * LayerAnimation.test.ts — Sprint S19 Vitest Test Suite (ETAP 7)
 */

import { describe, expect, it } from 'vitest';
import { LayerOperationsEngine } from '../LayerOperationsEngine';
import { SceneAnimationBridge } from '../SceneAnimationBridge';
import { createLayer, createScene } from '../SceneGraphModel';

describe('Layer Animation Integration (ETAP 5 & 7)', () => {
  it('creates AnimationTimeline tracks mapped to layer properties', () => {
    const track = SceneAnimationBridge.createPropertyTrack('opacity', [
      { id: 'kf1', timeOffset: 0, value: 0, easing: { type: 'linear' } },
      { id: 'kf2', timeOffset: 1000, value: 1, easing: { type: 'ease-out' } },
    ]);

    const timeline = SceneAnimationBridge.createLayerTimeline('layer_1', [track]);

    expect(timeline.targetNodeId).toBe('layer_1');
    expect(timeline.clips).toHaveLength(1);
    expect(timeline.clips[0].tracks).toHaveLength(1);
    expect(timeline.clips[0].tracks[0].propertyKey).toBe('opacity');
  });

  it('applies evaluated properties onto Scene layer DTOs', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(scene, createLayer({ id: 'l1', opacity: 0.1, transform: { x: 0, y: 0, width: 100, height: 100, rotationDeg: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 } }));

    scene = SceneAnimationBridge.applyEvaluatedProperties(scene, 'l1', {
      opacity: 0.9,
      'transform.x': 150,
      'transform.rotationDeg': 45,
    });

    expect(scene.layers['l1'].opacity).toBe(0.9);
    expect(scene.layers['l1'].transform.x).toBe(150);
    expect(scene.layers['l1'].transform.rotationDeg).toBe(45);
  });
});
