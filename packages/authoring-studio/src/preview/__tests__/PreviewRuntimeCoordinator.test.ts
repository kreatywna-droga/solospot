import { describe, it, expect, vi } from 'vitest';
import { PreviewRuntimeCoordinator } from '../PreviewRuntimeCoordinator';
import { createTimelinePlaybackSession } from '../../timeline/TimelinePlaybackSession';
import { createBuilderDocument, createBuilderPage, createSectionNode } from '../../../../builder-core/src/BuilderDocument';
import { applyAnimationToNode } from '../../inspector/animationDocumentBinding';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

function buildDoc() {
  const doc = createBuilderDocument({
    id: 'store-coord',
    tenantId: 'tenant-coord',
    metadata: { storeName: 'Coordinator Test', storeSlug: 'coord', locale: 'en', currency: 'USD' },
  });
  const page = createBuilderPage({
    id: 'page-coord',
    slug: '/',
    name: 'Home',
    isHome: true,
    sections: [createSectionNode({ id: 'sec-coord-node', type: 'hero', label: 'Hero', order: 0 })],
  });
  return { ...doc, pages: [page] };
}

const mockTimeline: AnimationTimeline = {
  id: 'tl-coord-1',
  targetNodeId: 'sec-coord-node',
  trigger: { type: 'onLoad' },
  playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
  clips: [
    {
      id: 'clip-c1',
      name: 'FadeIn',
      duration: 1000,
      delay: 0,
      tracks: [
        {
          id: 'track-c1',
          propertyKey: 'opacity',
          keyframes: [
            { id: 'kf-c1', timeOffset: 0, value: 0, easing: { type: 'linear' } },
            { id: 'kf-c2', timeOffset: 1000, value: 1, easing: { type: 'linear' } },
          ],
        },
      ],
    },
  ],
};

describe('PreviewRuntimeCoordinator (PM38, DECISION-053 & DECISION-056)', () => {
  it('instantiates coordinator using Dependency Injection (DECISION-056)', () => {
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-coord-node', mockTimeline);

    const session = createTimelinePlaybackSession({ selectedTimeline: mockTimeline });
    const mockBridge = { evaluateFrame: vi.fn() };

    const coordinator = new PreviewRuntimeCoordinator({
      session,
      runtimeBridge: mockBridge,
      document: doc,
    });

    expect(coordinator.session.selectedTimeline?.id).toBe('tl-coord-1');
    expect(coordinator.document).toBe(doc);
  });

  it('orchestrates playhead sync from timeline to preview', () => {
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-coord-node', mockTimeline);

    const session = createTimelinePlaybackSession({ selectedTimeline: mockTimeline });
    const mockBridge = {
      evaluateFrame: vi.fn().mockImplementation((_tl, _state, time) => ({
        clipId: 'clip-c1',
        time,
        values: { opacity: time / 1000 },
      })),
    };

    const coordinator = new PreviewRuntimeCoordinator({
      session,
      runtimeBridge: mockBridge,
      document: doc,
    });

    const frameBatch = coordinator.syncTimelinePlayhead(600);

    expect(coordinator.session.currentTime).toBe(600);
    expect(frameBatch?.values['opacity']).toBe(0.6);
    expect(mockBridge.evaluateFrame).toHaveBeenCalled();
  });

  it('orchestrates live playhead scrubbing to exact times', () => {
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-coord-node', mockTimeline);

    const session = createTimelinePlaybackSession({ selectedTimeline: mockTimeline });
    const mockBridge = {
      evaluateFrame: vi.fn().mockImplementation((_tl, _state, time) => ({
        clipId: 'clip-c1',
        time,
        values: { opacity: time / 1000 },
      })),
    };

    const coordinator = new PreviewRuntimeCoordinator({
      session,
      runtimeBridge: mockBridge,
      document: doc,
    });

    const scrubResult = coordinator.scrubTo(800);

    expect(scrubResult.timeMs).toBe(800);
    expect(scrubResult.frameBatch?.values['opacity']).toBe(0.8);
  });

  it('orchestrates keyframe drag preview re-evaluations immutably (DECISION-054 & DECISION-055)', () => {
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-coord-node', mockTimeline);

    const session = createTimelinePlaybackSession({ selectedTimeline: mockTimeline });
    const mockBridge = {
      evaluateFrame: vi.fn().mockReturnValue({
        clipId: 'clip-c1',
        time: 500,
        values: { opacity: 0.5 },
      }),
    };

    const coordinator = new PreviewRuntimeCoordinator({
      session,
      runtimeBridge: mockBridge,
      document: doc,
    });

    const dragResult = coordinator.dragKeyframe(
      'sec-coord-node',
      'clip-c1',
      'track-c1',
      'kf-c2',
      900
    );

    expect(dragResult.activeKeyframeId).toBe('kf-c2');
    expect(dragResult.newTimeOffset).toBe(900);
    expect(dragResult.evaluatedFrame).not.toBeNull();
    expect(coordinator.document).not.toBe(doc); // BuilderDocument immutably updated
  });
});
