import { describe, expect, it } from 'vitest';
import { createLayer } from '../../scene/SceneGraphModel';
import { createBlurEffect, createDropShadowEffect, createGlowEffect } from '../EffectModel';
import { EffectStackEngine } from '../EffectStackEngine';

describe('Effect Stack Operations Engine', () => {
  it('should add effects in deterministic order', () => {
    let layer = createLayer({ id: 'l1' });
    const fx1 = createBlurEffect({ id: 'f1' });
    const fx2 = createDropShadowEffect({ id: 'f2' });

    layer = EffectStackEngine.addEffect(layer, fx1);
    layer = EffectStackEngine.addEffect(layer, fx2);

    expect(layer.effectStack).toHaveLength(2);
    expect(layer.effectStack?.[0].id).toBe('f1');
    expect(layer.effectStack?.[1].id).toBe('f2');
  });

  it('should remove an effect from the stack', () => {
    let layer = createLayer({ id: 'l1' });
    layer = EffectStackEngine.addEffect(layer, createBlurEffect({ id: 'f1' }));
    layer = EffectStackEngine.addEffect(layer, createDropShadowEffect({ id: 'f2' }));

    layer = EffectStackEngine.removeEffect(layer, 'f1');
    expect(layer.effectStack).toHaveLength(1);
    expect(layer.effectStack?.[0].id).toBe('f2');
  });

  it('should reorder effects deterministically', () => {
    let layer = createLayer({ id: 'l1' });
    layer = EffectStackEngine.addEffect(layer, createBlurEffect({ id: 'f1' }));
    layer = EffectStackEngine.addEffect(layer, createDropShadowEffect({ id: 'f2' }));
    layer = EffectStackEngine.addEffect(layer, createGlowEffect({ id: 'f3' }));

    layer = EffectStackEngine.reorderEffect(layer, 'f3', 0);
    expect(layer.effectStack?.[0].id).toBe('f3');
    expect(layer.effectStack?.[1].id).toBe('f1');
    expect(layer.effectStack?.[2].id).toBe('f2');
  });

  it('should toggle effect enable state', () => {
    let layer = createLayer({ id: 'l1' });
    layer = EffectStackEngine.addEffect(layer, createBlurEffect({ id: 'f1', enabled: true }));

    layer = EffectStackEngine.toggleEffect(layer, 'f1');
    expect(layer.effectStack?.[0].enabled).toBe(false);

    layer = EffectStackEngine.toggleEffect(layer, 'f1');
    expect(layer.effectStack?.[0].enabled).toBe(true);
  });

  it('should update effect parameters', () => {
    let layer = createLayer({ id: 'l1' });
    layer = EffectStackEngine.addEffect(layer, createBlurEffect({ id: 'f1', radius: 5 }));

    layer = EffectStackEngine.updateEffect(layer, 'f1', { radius: 25 });
    expect((layer.effectStack?.[0] as any).radius).toBe(25);
  });

  it('should reset effect parameters to defaults', () => {
    let layer = createLayer({ id: 'l1' });
    layer = EffectStackEngine.addEffect(layer, createBlurEffect({ id: 'f1', radius: 50 }));

    layer = EffectStackEngine.resetEffect(layer, 'f1');
    expect((layer.effectStack?.[0] as any).radius).toBe(5);
  });

  it('should copy and paste effect stack across layers', () => {
    let layer1 = createLayer({ id: 'l1' });
    layer1 = EffectStackEngine.addEffect(layer1, createBlurEffect({ id: 'f1', radius: 10 }));
    layer1 = EffectStackEngine.addEffect(layer1, createDropShadowEffect({ id: 'f2', blur: 20 }));

    const copiedStack = EffectStackEngine.copyEffectStack(layer1);
    expect(copiedStack).toHaveLength(2);

    let layer2 = createLayer({ id: 'l2' });
    layer2 = EffectStackEngine.pasteEffectStack(layer2, copiedStack);

    expect(layer2.effectStack).toHaveLength(2);
    expect((layer2.effectStack?.[0] as any).radius).toBe(10);
    expect((layer2.effectStack?.[1] as any).blur).toBe(20);
    expect(layer2.effectStack?.[0].id).not.toBe('f1'); // Fresh ID assigned
  });
});
