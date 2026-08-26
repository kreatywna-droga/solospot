import { describe, expect, it } from 'vitest';
import { createCamera } from '../CameraModel';
import { SceneGraphModel } from '../../scene/SceneGraphModel';
import { SceneRenderingBridge } from '../../scene/SceneRenderingBridge';

describe('CameraRendering Integration (ETAP 5)', () => {
  it('should compile scene to commands incorporating camera transform matrix', () => {
    let scene = SceneGraphModel.createScene('s1');
    scene = SceneGraphModel.addLayer(scene, {
      id: 'rect1',
      name: 'Rectangle 1',
      type: 'rectangle',
      transform: { position: { x: 50, y: 50 }, rotation: 0, scale: { x: 1, y: 1 } },
      bounds: { x: 0, y: 0, width: 200, height: 100 },
    });

    const camera = createCamera({
      id: 'cam1',
      transform: { position: { x: 100, y: 100, z: 0 }, zoom: 2.0, rotationDeg: 0 },
      viewport: { width: 1000, height: 1000, devicePixelRatio: 1 },
    });

    const commands = SceneRenderingBridge.compileSceneToCommands(scene, camera);

    expect(commands.length).toBeGreaterThan(0);
    expect(commands[0].type).toBe('CLEAR');

    // Find SET_TRANSFORM command
    const transformCmd = commands.find((cmd) => cmd.type === 'SET_TRANSFORM') as any;
    expect(transformCmd).toBeDefined();
    expect(transformCmd.transform).toBeDefined();
  });
});
