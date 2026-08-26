/**
 * LayerRendering.test.ts — Sprint S19 Vitest Test Suite (ETAP 7)
 */

import { describe, expect, it } from 'vitest';
import { LayerOperationsEngine } from '../LayerOperationsEngine';
import { SceneRenderingBridge } from '../SceneRenderingBridge';
import { createLayer, createScene } from '../SceneGraphModel';

describe('Scene Rendering Integration (ETAP 4 & 7)', () => {
  it('compiles Scene Graph to lightweight RendererCommand DTOs', () => {
    let scene = createScene({ id: 's1' });
    scene = LayerOperationsEngine.createLayer(
      scene,
      createLayer({ id: 'rect1', type: 'vector', blendMode: 'multiply', opacity: 0.8, props: { fill: { color: '#FF0000' } } })
    );

    const commands = SceneRenderingBridge.compileSceneToCommands(scene);
    expect(commands.length).toBeGreaterThan(0);

    // Initial CLEAR command
    expect(commands[0].type).toBe('CLEAR');

    // Structural command checks
    const saveCmd = commands.find((c) => c.type === 'SAVE');
    const transformCmd = commands.find((c) => c.type === 'SET_TRANSFORM');
    const opacityCmd = commands.find((c) => c.type === 'SET_OPACITY');
    const blendCmd = commands.find((c) => c.type === 'SET_BLEND_MODE');
    const drawCmd = commands.find((c) => c.type === 'DRAW_RECT');
    const restoreCmd = commands.find((c) => c.type === 'RESTORE');

    expect(saveCmd).toBeDefined();
    expect(transformCmd).toBeDefined();
    expect((opacityCmd as any)?.opacity).toBe(0.8);
    expect((blendCmd as any)?.blendMode).toBe('multiply');
    expect(drawCmd).toBeDefined();
    expect(restoreCmd).toBeDefined();
  });
});
