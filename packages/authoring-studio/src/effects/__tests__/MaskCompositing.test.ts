import { describe, expect, it } from 'vitest';
import { createLayer, createScene } from '../../scene/SceneGraphModel';
import { SceneCompositor } from '../../scene/SceneCompositor';
import { createAlphaMask } from '../../masks/MaskModel';

describe('Mask Compositing Evaluation', () => {
  it('should evaluate mask stack on composited layer node', () => {
    const mask = createAlphaMask({ id: 'm1', mode: 'alpha', opacity: 0.9 });
    const layer = createLayer({ id: 'l1', maskStack: [mask] });
    const scene = createScene({ id: 's1', layers: { l1: layer }, rootLayerIds: ['l1'] });

    const composited = SceneCompositor.compositedNode(scene, 'l1');
    expect(composited).not.toBeNull();
    expect(composited?.masks).toHaveLength(1);
    expect(composited?.masks?.[0].id).toBe('m1');
    expect(composited?.masks?.[0].opacity).toBe(0.9);
  });

  it('should preserve clipping group mask evaluations alongside mask stacks', () => {
    const mask = createAlphaMask({ id: 'm1' });
    const layer = createLayer({ id: 'l1', maskStack: [mask] });
    const scene = createScene({ id: 's1', layers: { l1: layer }, rootLayerIds: ['l1'] });

    const nodes = SceneCompositor.traverseCompositedScene(scene);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].masks).toHaveLength(1);
  });
});
