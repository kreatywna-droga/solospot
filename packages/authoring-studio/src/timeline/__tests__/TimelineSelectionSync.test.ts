import { describe, it, expect } from 'vitest';
import {
  createSelectionSyncState,
  syncTimelineSelectionToDocument,
  syncInspectorSelectionToTimeline,
  syncDocumentToTimelineSelection,
} from '../TimelineSelectionSync';
import { createTimelineSelection } from '../TimelineSelection';
import { createBuilderDocument, createBuilderPage, createSectionNode } from '../../../../builder-core/src/BuilderDocument';
import { applyAnimationToNode } from '../../inspector/animationDocumentBinding';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

function buildDoc() {
  const doc = createBuilderDocument({
    id: 'store-sync',
    tenantId: 'tenant-sync',
    metadata: { storeName: 'Test', storeSlug: 'test', locale: 'en', currency: 'USD' },
  });
  const page = createBuilderPage({
    id: 'page-home',
    slug: '/',
    name: 'Home',
    isHome: true,
    sections: [createSectionNode({ id: 'sec-1', type: 'hero', label: 'Hero', order: 0 })],
  });
  return { ...doc, pages: [page] };
}

const mockTimeline: AnimationTimeline = {
  id: 'tl-sync',
  targetNodeId: 'sec-1',
  trigger: { type: 'onLoad' },
  playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
  clips: [
    {
      id: 'clip-1',
      name: 'Fade',
      duration: 500,
      delay: 0,
      tracks: [],
    },
    {
      id: 'clip-2',
      name: 'Slide',
      duration: 500,
      delay: 0,
      tracks: [],
    },
  ],
};

describe('TimelineSelectionSync (PM37, DECISION-048 & DECISION-050)', () => {
  it('initializes clean selection sync state', () => {
    const state = createSelectionSyncState();
    expect(state.selectedNodeId).toBeNull();
    expect(state.lastSyncSource).toBeNull();
    expect(state.syncVersion).toBe(0);
  });

  it('syncs timeline selection to document without recursion loops', () => {
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-1', mockTimeline);

    const state = createSelectionSyncState();
    const selection = createTimelineSelection({ selectedClipId: 'clip-1' });

    const { nextState, updatedDoc } = syncTimelineSelectionToDocument(state, doc, 'sec-1', selection);

    expect(nextState.selectedNodeId).toBe('sec-1');
    expect(nextState.lastSyncSource).toBe('timeline');
    expect(nextState.syncVersion).toBe(1);
    expect(updatedDoc).toBe(doc); // SSOT preserved

    // Re-syncing identical timeline selection returns same state (loop prevention)
    const resync = syncTimelineSelectionToDocument(nextState, doc, 'sec-1', selection);
    expect(resync.nextState).toBe(nextState);
  });

  it('syncs inspector selection to timeline via BuilderDocument SSOT', () => {
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-1', mockTimeline);

    const state = createSelectionSyncState();

    const { nextState, selection } = syncInspectorSelectionToTimeline(
      state,
      doc,
      'sec-1',
      'clip-2',
      'track-1',
      'kf-1'
    );

    expect(nextState.lastSyncSource).toBe('inspector');
    expect(selection.selectedClipId).toBe('clip-2');
    expect(selection.selectedTrackId).toBe('track-1');
    expect(selection.selectedKeyframeId).toBe('kf-1');
  });

  it('syncs document state back to timeline fallback when selection becomes stale', () => {
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-1', mockTimeline);

    // If current timeline selection references a deleted clip ID
    const staleSelection = createTimelineSelection({ selectedClipId: 'clip-deleted' });
    const syncedSelection = syncDocumentToTimelineSelection(doc, 'sec-1', staleSelection);

    // Falls back to first available clip in SSOT document timeline
    expect(syncedSelection.selectedClipId).toBe('clip-1');
  });
});
