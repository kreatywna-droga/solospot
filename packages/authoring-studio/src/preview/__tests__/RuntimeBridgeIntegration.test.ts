import { describe, it, expect } from 'vitest';
import { createBuilderDocument, createBuilderPage, createSectionNode } from '../../../../builder-core/src/BuilderDocument';
import { AnimationRuntimeBridge } from '../../../../builder-core/src/animation/AnimationRuntimeBridge';
import { applyAnimationToNode, inspectNodeAnimation } from '../../inspector/animationDocumentBinding';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

import { createTimelinePlaybackSession } from '../../timeline/TimelinePlaybackSession';
import { PreviewRuntimeCoordinator } from '../PreviewRuntimeCoordinator';

function buildDoc() {
  const doc = createBuilderDocument({
    id: 'store-bridge-integration',
    tenantId: 'tenant-bridge',
    metadata: { storeName: 'Bridge Integration Store', storeSlug: 'bridge-store', locale: 'en', currency: 'USD' },
  });
  const page = createBuilderPage({
    id: 'page-main',
    slug: '/',
    name: 'Home',
    isHome: true,
    sections: [createSectionNode({ id: 'sec-hero-card', type: 'hero', label: 'Hero Card', order: 0 })],
  });
  return { ...doc, pages: [page] };
}

const integrationTimeline: AnimationTimeline = {
  id: 'tl-bridge-integration',
  targetNodeId: 'sec-hero-card',
  trigger: { type: 'onLoad' },
  playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
  clips: [
    {
      id: 'clip-hero-anim',
      name: 'Hero Anim',
      duration: 1000,
      delay: 0,
      tracks: [
        {
          id: 'track-opacity',
          propertyKey: 'opacity',
          keyframes: [
            { id: 'kf-op-0', timeOffset: 0, value: 0, easing: { type: 'linear' } },
            { id: 'kf-op-1', timeOffset: 1000, value: 1, easing: { type: 'linear' } },
          ],
        },
        {
          id: 'track-scale',
          propertyKey: 'scale',
          keyframes: [
            { id: 'kf-sc-0', timeOffset: 0, value: 0.8, easing: { type: 'linear' } },
            { id: 'kf-sc-1', timeOffset: 1000, value: 1.0, easing: { type: 'linear' } },
          ],
        },
      ],
    },
  ],
};

describe('RuntimeBridgeIntegration (PM38 Full Stack Integration)', () => {
  it('integrates PM32 AnimationRuntimeBridge with PM38 PreviewRuntimeCoordinator seamlessly', () => {
    // 1. Setup Document SSOT and populate timeline
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-hero-card', integrationTimeline);

    const timeline = inspectNodeAnimation(doc, 'sec-hero-card')!;
    expect(timeline.id).toBe('tl-bridge-integration');

    // 2. Instantiate real PM32 AnimationRuntimeBridge from builder-core
    const runtimeBridge = new AnimationRuntimeBridge();

    // 3. Instantiate PM37 TimelinePlaybackSession
    const session = createTimelinePlaybackSession({ selectedTimeline: timeline });

    // 4. Instantiate PM38 PreviewRuntimeCoordinator with DI
    const coordinator = new PreviewRuntimeCoordinator({
      session,
      runtimeBridge,
      document: doc,
    });

    // 5. Evaluate frame at scrub time 250ms
    const scrubResult = coordinator.scrubTo(250);
    expect(scrubResult.timeMs).toBe(250);
    expect(scrubResult.frameBatch).not.toBeNull();
expect(scrubResult.frameBatch?.values['opacity']).toBeCloseTo(0.25, 10);
    expect(scrubResult.frameBatch?.values['scale']).toBeCloseTo(0.85, 10);

    // 6. Test Keyframe Drag live re-evaluation
    const dragResult = coordinator.dragKeyframe(
      'sec-hero-card',
      'clip-hero-anim',
      'track-opacity',
      'kf-op-1',
      800
    );

    expect(dragResult.activeKeyframeId).toBe('kf-op-1');
    expect(dragResult.newTimeOffset).toBe(800);
    expect(dragResult.evaluatedFrame).not.toBeNull();

    // 7. Verify tri-selection sync
    const selection = coordinator.selectFromPreview('sec-hero-card');
    expect(selection.selectedClipId).toBe('clip-hero-anim');
    expect(coordinator.selectionSyncState.highlightedElementId).toBe('sec-hero-card');
  });
});
