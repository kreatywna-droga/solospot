import { describe, expect, it } from 'vitest';
import { createBuilderDocument, createHistoryStack } from '../../../../builder-core/src';
import { TransformHistoryBinding } from '../TransformHistoryBinding';

describe('TransformHistoryBinding Integration', () => {
  it('should push document transform state onto HistoryStack and execute undo/redo', () => {
    const doc1 = createBuilderDocument({
      id: 'doc1',
      tenantId: 'tenant1',
      metadata: { storeName: 'Test', storeSlug: 'test', locale: 'en', currency: 'USD' },
    });
    let history = createHistoryStack<any>(50);

    // Initial state
    history = TransformHistoryBinding.pushTransformState(history, doc1, 'Initial');

    // Mutate document
    const doc2 = { ...doc1, version: doc1.version + 1 };
    history = TransformHistoryBinding.pushTransformState(history, doc2, 'Move Layer');

    expect(history.entries[history.currentIndex]?.state.version).toBe(doc2.version);

    // Undo
    const undoRes = TransformHistoryBinding.undo(history);
    expect(undoRes).not.toBeNull();
    expect(undoRes?.state.version).toBe(doc1.version);

    // Redo
    const redoRes = TransformHistoryBinding.redo(undoRes!.stack);
    expect(redoRes).not.toBeNull();
    expect(redoRes?.state.version).toBe(doc2.version);
  });
});
