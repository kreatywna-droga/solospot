/**
 * TimelineKeyboardPipeline.test.ts — Sprint S24 Keyboard Interaction & Pipeline Vitest Suite
 * Node environment — no jsdom required.
 */

import { describe, expect, it } from 'vitest';
import { createBuilderDocument, createBuilderPage, createSectionNode, createHistoryStack, type BuilderDocument } from '../../../../builder-core/src';
import { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';
import { createDefaultTimeline, applyAnimationToNode, inspectNodeAnimation } from '../../inspector/animationDocumentBinding';
import { addClip, addKeyframe, addTrack } from '../timelineDocumentBinding';
import { TimelineInteractionPipeline, TimelineInteractionState } from '../TimelineInteractionPipeline';
import { INITIAL_MARKERS_REGIONS_STATE } from '../TimelineMarkersRegionsModel';
import { createMultiSelectionState } from '../TimelineMultiSelection';
import { createTimelineViewport } from '../TimelineViewport';

function createInitialState(): TimelineInteractionState {
  const section = createSectionNode({ id: 'sec1', type: 'rect' });
  const page = createBuilderPage({ id: 'page1', slug: '/', name: 'Home', isHome: true, sections: [section] });
  let doc = createBuilderDocument({
    id: 'doc1',
    tenantId: 'tenant1',
    metadata: { storeName: 'Test', storeSlug: 'test', locale: 'en', currency: 'USD' },
  });
  doc = { ...doc, pages: [page] };
  const nodeId = section.id;
  const defaultTimeline: AnimationTimeline = {
    id: `timeline-${nodeId}`,
    targetNodeId: nodeId,
    trigger: { type: 'onLoad' },
    playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
    clips: [],
  };
  doc = applyAnimationToNode(doc, nodeId, defaultTimeline);

  doc = addClip(doc, nodeId, { id: 'clip-1', name: 'Main Clip', duration: 1000, delay: 0, tracks: [] });
  doc = addTrack(doc, nodeId, 'clip-1', { id: 'track-1', propertyKey: 'opacity', keyframes: [] });
  doc = addKeyframe(doc, nodeId, 'clip-1', 'track-1', { id: 'kf-1', timeOffset: 100, value: 0, easing: { type: 'linear' } });
  doc = addKeyframe(doc, nodeId, 'clip-1', 'track-1', { id: 'kf-2', timeOffset: 600, value: 1, easing: { type: 'ease-in' } });

  const timeline: AnimationTimeline = inspectNodeAnimation(doc, nodeId)!;

  return {
    doc,
    nodeId,
    timeline,
    selection: createMultiSelectionState({
      selectedKeyframeRefs: [{ clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-1' }],
      primarySelectedRef: { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-1' },
    }),
    viewport: createTimelineViewport(),
    markersState: INITIAL_MARKERS_REGIONS_STATE,
    historyStack: createHistoryStack<BuilderDocument>(100).push(doc, 'Init'),
    playheadTimeMs: 0,
  };
}

describe('S24 — TimelineKeyboardPipeline', () => {
  it('handles arrow key nudging and commits history stack', () => {
    const s0 = createInitialState();
    const s1 = TimelineInteractionPipeline.handleKeyDown(s0, {
      key: 'ArrowRight',
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    });

    const timeline = inspectNodeAnimation(s1.doc, s1.nodeId);
    const kf = timeline?.clips[0]?.tracks[0]?.keyframes.find((k) => k.id === 'kf-1') ??
      timeline?.clips.flatMap((c) => c.tracks).flatMap((t) => t.keyframes).find((k) => k.id === 'kf-1');
    expect(kf?.timeOffset).toBe(101);
    expect(s1.historyStack.canUndo).toBe(true);
  });

  it('handles copy and paste shortcuts', () => {
    const s0 = createInitialState();
    // Copy
    const s1 = TimelineInteractionPipeline.handleKeyDown(s0, {
      key: 'c',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    });
    expect(s1.clipboardPayload?.keyframes.length).toBe(1);

    // Paste at playhead = 300ms
    const s2 = { ...s1, playheadTimeMs: 300 };
    const s3 = TimelineInteractionPipeline.handleKeyDown(s2, {
      key: 'v',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    });

    const timeline = inspectNodeAnimation(s3.doc, s3.nodeId);
    const keyframes = timeline?.clips[0]?.tracks[0]?.keyframes ?? [];
    expect(keyframes.length).toBe(3);
  });

  it('handles J/K playhead jump between keyframes', () => {
    const s0 = createInitialState(); // playhead = 0, keyframes at 100ms and 600ms
    const sNext = TimelineInteractionPipeline.handleKeyDown(s0, {
      key: 'k',
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    });

    expect(sNext.playheadTimeMs).toBe(100);
  });

  it('handles timeline marker addition and loop region setting', () => {
    const s0 = createInitialState();
    const s1 = TimelineInteractionPipeline.handleAddMarker(s0, 250, 'Chorus Start');
    expect(s1.markersState.markers.length).toBe(1);
    expect(s1.markersState.markers[0].label).toBe('Chorus Start');

    const s2 = TimelineInteractionPipeline.handleSetLoopRegion(s1, 100, 500, true);
    expect(s2.markersState.loopRegion.enabled).toBe(true);
    expect(s2.markersState.loopRegion.startTimeMs).toBe(100);
    expect(s2.markersState.loopRegion.endTimeMs).toBe(500);
  });
});
