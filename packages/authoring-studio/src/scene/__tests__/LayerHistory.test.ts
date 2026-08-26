/**
 * LayerHistory.test.ts — Sprint S19 Vitest Test Suite (ETAP 7)
 */

import { describe, expect, it } from 'vitest';
import { createBuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import { LayerOperationsEngine } from '../LayerOperationsEngine';
import { SceneHistoryBinding } from '../SceneHistoryBinding';
import { createLayer, createScene } from '../SceneGraphModel';

describe('Layer History & Undo/Redo Integration (ETAP 2 & 7)', () => {
  it('records mutations and supports full Undo & Redo stack', () => {
    const doc = createBuilderDocument({
      id: 'doc1',
      tenantId: 't1',
      metadata: { storeName: 'TestStore', storeSlug: 'test', locale: 'pl-PL', currency: 'PLN' },
    });
    let scene = createScene({ id: 's1' });

    const binding = new SceneHistoryBinding(doc, scene);
    expect(binding.canUndo).toBe(false);

    // 1. Create Layer
    binding.executeMutation('Create Layer 1', (s) =>
      LayerOperationsEngine.createLayer(s, createLayer({ id: 'l1', name: 'Original Name' }))
    );

    expect(binding.canUndo).toBe(true);
    expect(binding.scene.layers['l1'].name).toBe('Original Name');

    // 2. Rename Layer
    binding.executeMutation('Rename Layer 1', (s) =>
      LayerOperationsEngine.renameLayer(s, 'l1', 'Renamed Layer')
    );

    expect(binding.scene.layers['l1'].name).toBe('Renamed Layer');

    // 3. Undo Rename
    binding.undo();
    expect(binding.scene.layers['l1'].name).toBe('Original Name');

    // 4. Redo Rename
    binding.redo();
    expect(binding.scene.layers['l1'].name).toBe('Renamed Layer');

    // 5. Undo back to initial empty scene
    binding.undo(); // Undo Rename
    binding.undo(); // Undo Create
    expect(binding.scene.layers['l1']).toBeUndefined();
  });
});
