import { describe, it, expect } from 'vitest';
import {
  createTriSelectionState,
  syncPreviewSelectionToStudio,
  syncTimelineSelectionToPreview,
  syncInspectorSelectionToPreview,
} from '../PreviewSelectionSync';
import { createTimelineSelection } from '../../timeline/TimelineSelection';
import { createBuilderDocument, createBuilderPage, createSectionNode } from '../../../../builder-core/src/BuilderDocument';
import { applyAnimationToNode } from '../../inspector/animationDocumentBinding';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

function buildDoc() {
  const doc = createBuilderDocument({
    id: 'store-tri-sync',
    tenantId: 'tenant-tri',
    metadata: { storeName: 'Tri Sync Test', storeSlug: 'tri', locale: 'en', currency: 'USD' },
  });
  const page = createBuilderPage({
    id: 'page-tri',
    slug: '/',
    name: 'Home',
    isHome: true,
    sections: [createSectionNode({ id: 'sec-preview-node', type: 'hero', label: 'Hero', order: 0 })],
  });
  return { ...doc, pages: [page] };
}

const mockTimeline: AnimationTimeline = {
  id: 'tl-tri-node',
  targetNodeId: 'sec-preview-node',
  trigger: { type: 'onLoad' },
  playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
  clips: [
    {
      id: 'clip-tri-1',
      name: 'Fade',
      duration: 500,
      delay: 0,
      tracks: [{ id: 'track-tri-1', propertyKey: 'opacity', keyframes: [] }],
    },
  ],
};

describe('TimelinePreviewSelection (PM38, ETAP 4)', () => {
  it('syncs preview element click to studio timeline and inspector', () => {
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-preview-node', mockTimeline);

    const state = createTriSelectionState();
    const { nextState, selection } = syncPreviewSelectionToStudio(state, doc, 'sec-preview-node');

    expect(nextState.selectedNodeId).toBe('sec-preview-node');
    expect(nextState.highlightedElementId).toBe('sec-preview-node');
    expect(nextState.lastSource).toBe('preview');
    expect(selection.selectedClipId).toBe('clip-tri-1');
  });

  it('syncs timeline selection to preview element highlight', () => {
    const state = createTriSelectionState();
    const selection = createTimelineSelection({ selectedClipId: 'clip-tri-1' });

    const nextState = syncTimelineSelectionToPreview(state, 'sec-preview-node', selection);

    expect(nextState.selectedNodeId).toBe('sec-preview-node');
    expect(nextState.highlightedElementId).toBe('sec-preview-node');
    expect(nextState.lastSource).toBe('timeline');
    expect(nextState.timelineSelection.selectedClipId).toBe('clip-tri-1');
  });

  it('syncs inspector selection to preview', () => {
    const state = createTriSelectionState();

    const nextState = syncInspectorSelectionToPreview(
      state,
      'sec-preview-node',
      'clip-tri-1',
      'kf-tri-1'
    );

    expect(nextState.selectedNodeId).toBe('sec-preview-node');
    expect(nextState.lastSource).toBe('inspector');
    expect(nextState.timelineSelection.selectedKeyframeId).toBe('kf-tri-1');
  });
});
