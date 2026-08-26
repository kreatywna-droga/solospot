import { describe, expect, it } from 'vitest';
import { createLayer, createScene } from '../../scene/SceneGraphModel';
import { createAlphaMask, createShapeMask } from '../../masks/MaskModel';
import { createBlurEffect, createDropShadowEffect } from '../EffectModel';
import { EffectStackEngine } from '../EffectStackEngine';
import { SceneCompositor } from '../../scene/SceneCompositor';
import { SceneRenderingBridge } from '../../scene/SceneRenderingBridge';
import { CanvasRenderer } from '../../rendering/CanvasRenderer';
import { EffectAnimationBridge } from '../EffectAnimationBridge';

describe('Mask & Effect Integration Pipeline', () => {
  it('should execute complete pipeline: SceneGraph → Compositor → Animation → RendererCommand[] → CanvasRenderer', () => {
    // 1. Create layer with mask stack & effect stack
    let layer = createLayer({ id: 'hero_rect', type: 'rectangle', opacity: 0.9 });
    layer = EffectStackEngine.addMask(layer, createAlphaMask({ id: 'm1', opacity: 1.0 }));
    layer = EffectStackEngine.addMask(layer, createShapeMask({ id: 'm2', shapeType: 'ellipse' }));
    layer = EffectStackEngine.addEffect(layer, createBlurEffect({ id: 'f1', radius: 5 }));
    layer = EffectStackEngine.addEffect(layer, createDropShadowEffect({ id: 'f2', blur: 10, offsetY: 4 }));

    let scene = createScene({ id: 'main_scene', layers: { hero_rect: layer }, rootLayerIds: ['hero_rect'] });

    // 2. Animate effect property via S13 Motion System bridge
    scene = EffectAnimationBridge.applyEvaluatedEffectProperties(scene, 'hero_rect', {
      'effects.blur.radius': 20,
    });

    // 3. Evaluate scene compositing
    const compositedNodes = SceneCompositor.traverseCompositedScene(scene);
    expect(compositedNodes).toHaveLength(1);
    expect(compositedNodes[0].masks).toHaveLength(2);
    expect(compositedNodes[0].effects).toHaveLength(2);
    expect(compositedNodes[0].evaluatedFilterString).toBe('blur(20px)');
    expect(compositedNodes[0].evaluatedShadow).toBeDefined();

    // 4. Compile to RendererCommand DTOs
    const commands = SceneRenderingBridge.compileSceneToCommands(scene);
    expect(commands.some((c) => c.type === 'APPLY_FILTER')).toBe(true);
    expect(commands.some((c) => c.type === 'APPLY_SHADOW')).toBe(true);
    expect(commands.some((c) => c.type === 'CLEAR_EFFECTS')).toBe(true);

    // 5. Execute commands on CanvasRenderer backend (mock surface)
    const mockContext = {
      save: () => {},
      restore: () => {},
      setTransform: () => {},
      fillRect: () => {},
      clearRect: () => {},
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      filter: '',
    };

    const mockSurface = {
      width: 1920,
      height: 1080,
      devicePixelRatio: 1.0,
      getSurfaceContext: () => ({ ctx2d: mockContext }),
    };

    const renderer = new CanvasRenderer();
    renderer.initialize(mockSurface as any);
    renderer.beginFrame(0, 0);
    renderer.executeCommands(commands);
    renderer.endFrame();

    expect(renderer.isInitialized).toBe(true);
  });
});
