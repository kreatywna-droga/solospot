import { describe, it, expect } from 'vitest';
import { createBuilderDocument, createBuilderPage, createSectionNode } from '../../../../builder-core/src/BuilderDocument';
import { applyAnimationToNode, inspectNodeAnimation } from '../../inspector/animationDocumentBinding';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';
import { TimelineStudioBridge } from '../TimelineStudioBridge';
import { TimelineTransportController } from '../TimelineTransportController';
import { createScrollMessage } from '../../../../builder-core/src/animation/AnimationPreviewContract';
import { tickSession } from '../TimelinePlaybackSession';
import { syncInspectorSelectionToTimeline, syncTimelineSelectionToDocument, createSelectionSyncState } from '../TimelineSelectionSync';

function buildDoc() {
  const doc = createBuilderDocument({
    id: 'store-integration',
    tenantId: 'tenant-integration',
    metadata: { storeName: 'Studio Integration', storeSlug: 'studio', locale: 'en', currency: 'USD' },
  });
  const page = createBuilderPage({
    id: 'page-main',
    slug: '/',
    name: 'Main Page',
    isHome: true,
    sections: [createSectionNode({ id: 'sec-hero', type: 'hero', label: 'Hero Section', order: 0 })],
  });
  return { ...doc, pages: [page] };
}

const fullTimeline: AnimationTimeline = {
  id: 'tl-full-hero',
  targetNodeId: 'sec-hero',
  trigger: { type: 'scroll', threshold: 0.5 },
  playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
  clips: [
    {
      id: 'clip-hero-fade',
      name: 'Hero Fade In',
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
          id: 'track-transform',
          propertyKey: 'translateY',
          keyframes: [
            { id: 'kf-tr-0', timeOffset: 0, value: '50px', easing: { type: 'linear' } },
            { id: 'kf-tr-1', timeOffset: 1000, value: '0px', easing: { type: 'linear' } },
          ],
        },
      ],
    },
  ],
};

describe('TimelinePreviewIntegration (PM37 Studio Architecture Integration)', () => {
  it('connects PM30-PM37 into a single non-browser, immutable execution path', () => {
    // 1. BuilderDocument SSOT setup
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-hero', fullTimeline);

    const timeline = inspectNodeAnimation(doc, 'sec-hero')!;
    expect(timeline.id).toBe('tl-full-hero');

    // 2. Initialize Studio Bridge
    const bridge = new TimelineStudioBridge();
    bridge.selectTimeline(timeline);

    // 3. Evaluate frame at scrub time 500ms
    const frameAt500 = bridge.seek(500);
    expect(frameAt500).not.toBeNull();
    expect(frameAt500?.values['opacity']).toBe(0.5);

    // 4. Transport control: Step frame & Jump to Keyframe
    let session = bridge.session;
    session = TimelineTransportController.jumpToNextKeyframe(session);
    expect(session.currentTime).toBe(1000);

    bridge.updateSession(session);
    const frameAt1000 = bridge.evaluateCurrentFrame();
    expect(frameAt1000?.values['opacity']).toBe(1);

    // 5. Trigger event propagation from Preview Adapter (via canonical factory)
    const previewResult = bridge.processPreviewMessage(
      createScrollMessage(600)
    );
    expect(previewResult.evaluationReport.anySatisfied).toBe(true);
    expect(bridge.session.status).toBe('playing');

    // 6. Playback ticking simulation
    let tickingSession = bridge.session;
    tickingSession = tickSession(tickingSession, 200);
    expect(tickingSession.currentTime).toBe(1200);
    expect(tickingSession.status).toBe('stopped');

    // 7. Selection Sync validation
    const syncState = createSelectionSyncState();
    const { selection } = syncInspectorSelectionToTimeline(
      syncState,
      doc,
      'sec-hero',
      'clip-hero-fade',
      'track-opacity',
      'kf-op-1'
    );
    expect(selection.selectedKeyframeId).toBe('kf-op-1');

    const { updatedDoc } = syncTimelineSelectionToDocument(syncState, doc, 'sec-hero', selection);
    expect(updatedDoc).toBe(doc); // SSOT untouched
  });
});
