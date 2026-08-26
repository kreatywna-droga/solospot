import { describe, expect, it } from 'vitest';
import { createLayer, createScene } from '../../scene/SceneGraphModel';
import { SceneRenderingBridge } from '../../scene/SceneRenderingBridge';
import { createBlurEffect, createDropShadowEffect } from '../EffectModel';

describe('Effect Rendering Command Compilation', () => {
  it('should compile visual effects into RendererCommand DTOs', () => {
    const layer = createLayer({
      id: 'l1',
      type: 'rectangle',
      effectStack: [
        createBlurEffect({ id: 'f1', radius: 10 }),
        createDropShadowEffect({ id: 'f2', blur: 12, offsetX: 4, offsetY: 4, color: '#000000' }),
      ],
    });

    const scene = createScene({ id: 's1', layers: { l1: layer }, rootLayerIds: ['l1'] });

    const commands = SceneRenderingBridge.compileSceneToCommands(scene);

    const applyFilterCmd = commands.find((c) => c.type === 'APPLY_FILTER');
    const applyShadowCmd = commands.find((c) => c.type === 'APPLY_SHADOW');
    const clearEffectsCmd = commands.find((c) => c.type === 'CLEAR_EFFECTS');

    expect(applyFilterCmd).toBeDefined();
    expect((applyFilterCmd as any).filterString).toBe('blur(10px)');

    expect(applyShadowCmd).toBeDefined();
    expect((applyShadowCmd as any).blur).toBe(12);
    expect((applyShadowCmd as any).offsetX).toBe(4);

    expect(clearEffectsCmd).toBeDefined();
  });
});
