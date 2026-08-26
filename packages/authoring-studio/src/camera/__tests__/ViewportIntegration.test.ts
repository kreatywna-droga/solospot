import { describe, expect, it } from 'vitest';
import { createCamera } from '../CameraModel';
import { CameraOperationsEngine } from '../CameraOperationsEngine';
import { CoordinateSystems } from '../CoordinateSystems';
import { createMultiViewportLayout, createViewportConfiguration } from '../ViewportModel';
import { SceneGraphModel } from '../../scene/SceneGraphModel';
import { SceneRenderingBridge } from '../../scene/SceneRenderingBridge';

describe('Viewport End-to-End System Integration', () => {
  it('should manipulate camera and compile rendering commands for multiple viewports from a single Scene SSOT', () => {
    // 1. Single SSOT Scene
    let scene = SceneGraphModel.createScene('main_scene');
    scene = SceneGraphModel.addLayer(scene, {
      id: 'box',
      name: 'Central Box',
      type: 'rectangle',
      transform: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 } },
      bounds: { x: -100, y: -100, width: 200, height: 200 },
    });

    // 2. Multi-viewport setup with independent cameras
    const camPrimary = createCamera({ id: 'cam_primary', transform: { zoom: 1.0 } });
    let camSecondary = createCamera({ id: 'cam_secondary', transform: { zoom: 1.0 } });

    // 3. Pan secondary camera
    camSecondary = CameraOperationsEngine.panCamera(camSecondary, 500, 200);

    const vp1 = createViewportConfiguration({ id: 'vp1', type: 'primary', camera: camPrimary });
    const vp2 = createViewportConfiguration({ id: 'vp2', type: 'secondary', camera: camSecondary });

    const layout = createMultiViewportLayout({
      layoutMode: 'split-vertical',
      viewports: [vp1, vp2],
    });

    expect(layout.viewports.length).toBe(2);

    // 4. Compile commands for primary viewport
    const commandsVp1 = SceneRenderingBridge.compileSceneToCommands(scene, vp1.camera);
    expect(commandsVp1.length).toBeGreaterThan(0);

    // 5. Compile commands for secondary viewport using the SAME scene SSOT
    const commandsVp2 = SceneRenderingBridge.compileSceneToCommands(scene, vp2.camera);
    expect(commandsVp2.length).toBeGreaterThan(0);

    // 6. Coordinate system check
    const screenPt1 = CoordinateSystems.worldToScreen({ x: 0, y: 0 }, vp1.camera);
    const screenPt2 = CoordinateSystems.worldToScreen({ x: 0, y: 0 }, vp2.camera);

    // Positions differ due to secondary camera panning
    expect(screenPt1.x).not.toEqual(screenPt2.x);
  });
});
