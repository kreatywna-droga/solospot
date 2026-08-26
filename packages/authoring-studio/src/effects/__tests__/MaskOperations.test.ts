import { describe, expect, it } from 'vitest';
import { createLayer, createScene } from '../../scene/SceneGraphModel';
import { createAlphaMask, createShapeMask } from '../../masks/MaskModel';
import { EffectStackEngine } from '../EffectStackEngine';

describe('Mask Operations Engine', () => {
  it('should add masks to a layer stack', () => {
    let layer = createLayer({ id: 'layer1' });
    const mask1 = createAlphaMask({ id: 'm1' });
    const mask2 = createShapeMask({ id: 'm2', shapeType: 'rectangle' });

    layer = EffectStackEngine.addMask(layer, mask1);
    layer = EffectStackEngine.addMask(layer, mask2);

    expect(layer.maskStack).toHaveLength(2);
    expect(layer.maskStack?.[0].id).toBe('m1');
    expect(layer.maskStack?.[1].id).toBe('m2');
  });

  it('should remove a mask from a layer stack', () => {
    let layer = createLayer({ id: 'layer1' });
    const mask1 = createAlphaMask({ id: 'm1' });
    const mask2 = createShapeMask({ id: 'm2', shapeType: 'rectangle' });

    layer = EffectStackEngine.addMask(layer, mask1);
    layer = EffectStackEngine.addMask(layer, mask2);
    layer = EffectStackEngine.removeMask(layer, 'm1');

    expect(layer.maskStack).toHaveLength(1);
    expect(layer.maskStack?.[0].id).toBe('m2');
  });

  it('should reorder masks within a layer stack', () => {
    let layer = createLayer({ id: 'layer1' });
    const mask1 = createAlphaMask({ id: 'm1' });
    const mask2 = createShapeMask({ id: 'm2', shapeType: 'rectangle' });

    layer = EffectStackEngine.addMask(layer, mask1);
    layer = EffectStackEngine.addMask(layer, mask2);
    layer = EffectStackEngine.reorderMask(layer, 'm2', 0);

    expect(layer.maskStack?.[0].id).toBe('m2');
    expect(layer.maskStack?.[1].id).toBe('m1');
  });

  it('should toggle mask enable/disable state', () => {
    let layer = createLayer({ id: 'layer1' });
    const mask1 = createAlphaMask({ id: 'm1', enabled: true });

    layer = EffectStackEngine.addMask(layer, mask1);
    layer = EffectStackEngine.toggleMask(layer, 'm1');

    expect(layer.maskStack?.[0].enabled).toBe(false);
  });

  it('should update mask properties within a scene', () => {
    const scene = createScene({
      id: 's1',
      layers: {
        layer1: createLayer({ id: 'layer1', maskStack: [createAlphaMask({ id: 'm1', opacity: 1.0 })] }),
      },
    });

    const updatedScene = EffectStackEngine.mutateSceneLayer(scene, 'layer1', (l) =>
      EffectStackEngine.updateMask(l, 'm1', { opacity: 0.5 })
    );

    expect(updatedScene.layers['layer1'].maskStack?.[0].opacity).toBe(0.5);
  });
});
