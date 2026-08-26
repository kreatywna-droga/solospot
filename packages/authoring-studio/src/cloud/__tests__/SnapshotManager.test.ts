import { describe, it, expect } from 'vitest';
import {
  createSnapshotManagerState,
  createProjectSnapshot,
  restoreProjectSnapshot,
} from '../SnapshotManager';
import { createBuilderDocument, createBuilderPage, createSectionNode } from '../../../../builder-core/src/BuilderDocument';

function buildDoc() {
  const doc = createBuilderDocument({
    id: 'store-snap',
    tenantId: 'tenant-snap',
    metadata: { storeName: 'Snap Test', storeSlug: 'snap', locale: 'en', currency: 'USD' },
  });
  const page = createBuilderPage({
    id: 'page-snap',
    slug: '/',
    name: 'Home',
    isHome: true,
    sections: [createSectionNode({ id: 'sec-snap-node', type: 'hero', label: 'Hero', order: 0 })],
  });
  return { ...doc, pages: [page] };
}

describe('SnapshotManager (PM44, ETAP 6 & DECISION-089)', () => {
  it('creates and restores project state snapshots deterministically (DECISION-089)', () => {
    const doc = buildDoc();
    let state = createSnapshotManagerState();

    const { updatedState, snapshot } = createProjectSnapshot(state, doc, 'Checkpoint 1', 'user-snap-1');
    state = updatedState;

    expect(state.snapshots).toHaveLength(1);
    expect(snapshot.metadata.label).toBe('Checkpoint 1');

    const restoreRes = restoreProjectSnapshot(state, snapshot.metadata.snapshotId);
    expect(restoreRes.restoredDocument.id).toBe('store-snap');
    expect(restoreRes.metadata.snapshotId).toBe(snapshot.metadata.snapshotId);
  });
});
