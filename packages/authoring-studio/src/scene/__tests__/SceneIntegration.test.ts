/**
 * SceneIntegration.test.ts — Sprint S19 Vitest Test Suite (ETAP 7)
 */

import { describe, expect, it } from 'vitest';
import { createBuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import { LayerOperationsEngine } from '../LayerOperationsEngine';
import { SceneCompositor } from '../SceneCompositor';
import { SceneRenderingBridge } from '../SceneRenderingBridge';
import { SceneAnimationBridge } from '../SceneAnimationBridge';
import { SceneHistoryBinding } from '../SceneHistoryBinding';
import { createLayer, createScene } from '../SceneGraphModel';

describe('Scene Integration End-to-End Pipeline (ETAP 7)', () => {
  it('executes full pipeline: Document -> Scene -> Operations -> Compositing -> Animation -> Rendering', () => {
    const doc = createBuilderDocument({
      id: 'doc_integration',
      tenantId: 't_integration',
      metadata: { storeName: 'IntegrationStore', storeSlug: 'int', locale: 'en-US', currency: 'USD' },
    });

    let scene = createScene({ id: 'scene_main', name: 'Main Scene' });
    const binding = new SceneHistoryBinding(doc, scene);

    // 1. Create Shape Layer & Text Layer
    binding.executeMutation('Add Rect', (s) =>
      LayerOperationsEngine.createLayer(s, createLayer({ id: 'rect1', type: 'vector', opacity: 0.8, props: { fill: { color: '#3B82F6' } } }))
    );

    binding.executeMutation('Add Text', (s) =>
      LayerOperationsEngine.createLayer(s, createLayer({ id: 'text1', type: 'text', props: { text: 'Hello Scene Graph' } }))
    );

    // 2. Group Layers
    binding.executeMutation('Group Layers', (s) =>
      LayerOperationsEngine.groupLayers(s, 'group1', ['rect1', 'text1'], 'Main Group')
    );

    // 3. Set Group Opacity & Blend Mode
    binding.executeMutation('Set Group Opacity', (s) =>
      LayerOperationsEngine.setOpacity(s, 'group1', 0.5)
    );

    binding.executeMutation('Set Blend Mode', (s) =>
      LayerOperationsEngine.setBlendMode(s, 'rect1', 'overlay')
    );

    // 4. Apply Animation Keyframe Evaluation
    const updatedScene = SceneAnimationBridge.applyEvaluatedProperties(binding.scene, 'rect1', {
      'transform.x': 250,
      opacity: 0.9,
    });

    // 5. Compute Composited Scene Nodes
    const compositedNodes = SceneCompositor.traverseCompositedScene(updatedScene);
    expect(compositedNodes.length).toBeGreaterThanOrEqual(3); // group1, rect1, text1

    const rectComposited = compositedNodes.find((n) => n.layerId === 'rect1');
    expect(rectComposited).toBeDefined();
    expect(rectComposited?.effectiveOpacity).toBeCloseTo(0.45); // 0.5 group * 0.9 rect
    expect(rectComposited?.blendMode).toBe('overlay');

    // 6. Compile to Renderer Commands
    const commands = SceneRenderingBridge.compileSceneToCommands(updatedScene);
    expect(commands.length).toBeGreaterThan(0);
    expect(commands[0].type).toBe('CLEAR');

    // Verify Undo capability
    expect(binding.canUndo).toBe(true);
    binding.undo(); // Undo Set Blend Mode
    binding.undo(); // Undo Set Group Opacity
    expect(binding.scene.layers['group1'].opacity).toBe(1.0);
  });
});
