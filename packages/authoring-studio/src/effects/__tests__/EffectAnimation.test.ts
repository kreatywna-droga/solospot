import { describe, expect, it } from 'vitest';
import { createLayer, createScene } from '../../scene/SceneGraphModel';
import { createBlurEffect, createDropShadowEffect, createColorAdjustmentEffect } from '../EffectModel';
import { EffectAnimationBridge } from '../EffectAnimationBridge';
import { createAlphaMask } from '../../masks/MaskModel';

describe('Effect Animation Integration', () => {
  it('should build an AnimationTimeline DTO for effect properties', () => {
    const track1 = EffectAnimationBridge.createEffectTrack('effects.blur.radius', [
      { id: 'kf1', timeOffset: 0, value: 0, easing: { type: 'ease-out' } },
      { id: 'kf2', timeOffset: 1000, value: 25, easing: { type: 'ease-in' } },
    ]);

    const timeline = EffectAnimationBridge.createEffectTimeline('layer1', [track1]);

    expect(timeline.id).toBe('timeline_effect_layer1');
    expect(timeline.clips[0].tracks).toHaveLength(1);
    expect(timeline.clips[0].tracks[0].propertyKey).toBe('effects.blur.radius');
  });

  it('should apply evaluated effect property updates onto layer effect stack', () => {
    const layer = createLayer({
      id: 'l1',
      effectStack: [
        createBlurEffect({ id: 'f1', radius: 0 }),
        createDropShadowEffect({ id: 'f2', blur: 0, offsetX: 0, offsetY: 0 }),
        createColorAdjustmentEffect({ id: 'f3', brightness: 0, saturation: 0 }),
      ],
    });

    const scene = createScene({ id: 's1', layers: { l1: layer } });

    const updatedScene = EffectAnimationBridge.applyEvaluatedEffectProperties(scene, 'l1', {
      'effects.blur.radius': 15,
      'effects.dropShadow.blur': 20,
      'effects.dropShadow.offsetY': 8,
      'effects.colorAdjustment.brightness': 30,
    });

    const updatedLayer = updatedScene.layers['l1'];
    const blurFx = updatedLayer.effectStack?.find((f) => f.type === 'blur');
    const shadowFx = updatedLayer.effectStack?.find((f) => f.type === 'drop-shadow');
    const caFx = updatedLayer.effectStack?.find((f) => f.type === 'color-adjustment');

    expect((blurFx as any).radius).toBe(15);
    expect((shadowFx as any).blur).toBe(20);
    expect((shadowFx as any).offsetY).toBe(8);
    expect((caFx as any).brightness).toBe(30);
  });

  it('should apply evaluated mask opacity updates', () => {
    const layer = createLayer({
      id: 'l1',
      maskStack: [createAlphaMask({ id: 'm1', opacity: 1.0 })],
    });

    const scene = createScene({ id: 's1', layers: { l1: layer } });

    const updatedScene = EffectAnimationBridge.applyEvaluatedEffectProperties(scene, 'l1', {
      'masks.opacity': 0.4,
    });

    expect(updatedScene.layers['l1'].maskStack?.[0].opacity).toBe(0.4);
  });
});
