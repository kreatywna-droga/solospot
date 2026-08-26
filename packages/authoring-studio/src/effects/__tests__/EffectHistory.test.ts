import { describe, expect, it } from 'vitest';
import { createBuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import { createLayer, createScene } from '../../scene/SceneGraphModel';
import { SceneHistoryBinding } from '../../scene/SceneHistoryBinding';
import { EffectStackEngine } from '../EffectStackEngine';
import { createBlurEffect } from '../EffectModel';

describe('Effect Stack History Undo/Redo', () => {
  it('should push history snapshot on effect stack changes and support undo/redo', () => {
    const doc = createBuilderDocument({
      id: 'doc1',
      tenantId: 'tenant1',
      metadata: { storeName: 'Test', storeSlug: 'test', locale: 'en', currency: 'USD' },
    });
    const scene = createScene({
      id: 's1',
      layers: { l1: createLayer({ id: 'l1' }) },
      rootLayerIds: ['l1'],
    });
    const history = new SceneHistoryBinding(doc, scene);

    expect(history.canUndo).toBe(false);

    // Perform mutation
    history.executeMutation('Add Blur Effect', (currentScene) =>
      EffectStackEngine.mutateSceneLayer(currentScene, 'l1', (l) =>
        EffectStackEngine.addEffect(l, createBlurEffect({ id: 'f1', radius: 10 }))
      )
    );

    expect(history.canUndo).toBe(true);
    expect(history.scene.layers['l1'].effectStack).toHaveLength(1);

    // Undo
    history.undo();
    expect(history.scene.layers['l1'].effectStack ?? []).toHaveLength(0);

    // Redo
    history.redo();
    expect(history.scene.layers['l1'].effectStack).toHaveLength(1);
  });
});
