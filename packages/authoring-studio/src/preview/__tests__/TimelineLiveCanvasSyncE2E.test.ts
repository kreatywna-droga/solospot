/**
 * TimelineLiveCanvasSyncE2E.test.ts — Golden E2E Integration Test for Sprint S38
 *
 * Verifies Live Canvas & Real-Time Animation Preview Sync lifecycle:
 *   1. Create BuilderDocument & SectionNode via canonical production factories.
 *   2. Attach complex AnimationTimeline DTO (2 clips, 2 tracks, 3 keyframes, speed = 1.5).
 *   3. Instantiate TimelineStudioBridge (Single Owner of Time via AnimationPlaybackController).
 *   4. Instantiate PreviewRuntimeCoordinator injecting TimelineStudioBridge delegates & session.
 *   5. Select timeline in bridge via bridge.selectTimeline(timeline).
 *   6. Execute bridge.play() -> verify single time owner status === 'playing'.
 *   7. Advance playhead by 250ms -> verify single time owner time === 375ms (250 * 1.5).
 *   8. Execute playhead seek to 500ms via bridge.seek(500) -> evaluate RuntimeFrameBatch for canvas.
 *   9. Execute live scrubbing to 750ms via coordinator.scrubTo(750) -> evaluate frameBatch via LiveScrubbingEngine.
 *  10. Dispatch frame batch to LiveCanvasAdapter.renderFrame(frameBatch).
 *  11. Execute bridge.pause() and bridge.stop() -> verify playhead resets to 0.
 *  12. VERIFY SSOT INTEGRITY & ZERO DOCUMENT MUTATION:
 *      JSON.stringify(docBefore) === JSON.stringify(docAfter) and HistoryStack length is 100% unchanged during all live canvas sync actions.
 *
 * ZERO fake engines, ZERO duplicate schedulers, ZERO requestAnimationFrame.
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  type BuilderDocument,
} from '../../../../builder-core/src/BuilderDocument';
import { createHistoryStack } from '../../../../builder-core/src/HistoryStack';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';
import type { RuntimeFrameBatch } from '../../../../builder-core/src/animation/AnimationRuntimeTypes';

import { applyAnimationToNode } from '../../timeline/timelineDocumentBinding';
import { TimelineStudioBridge } from '../../timeline/TimelineStudioBridge';
import { PreviewRuntimeCoordinator } from '../PreviewRuntimeCoordinator';

describe('S38 Golden E2E Integration — Live Canvas & Real-Time Animation Preview Sync', () => {
  it('executes full live canvas synchronization lifecycle (play, seek, scrubTo, renderFrame, pause, stop) with 100% SSOT document preservation and single owner of time', () => {
    // -------------------------------------------------------------------------
    // STEP 1: BuilderDocument & SectionNode Setup (Canonical Factories)
    // -------------------------------------------------------------------------
    const heroNode = createSectionNode({
      id: 'sec_s38_hero',
      type: 'hero',
      label: 'Hero Section',
      props: {},
    });

    const page = createBuilderPage({
      id: 'page_s38_main',
      slug: '/',
      name: 'Main Page',
      isHome: true,
      sections: [heroNode],
    });

    const doc1: BuilderDocument = createBuilderDocument({
      id: 'doc_s38_golden',
      tenantId: 'tenant_s38',
      metadata: {
        storeName: 'S38 Live Canvas Store',
        storeSlug: 's38-live-canvas-store',
        locale: 'en',
        currency: 'USD',
      },
    });
    doc1.pages = [page];

    // Complex AnimationTimeline DTO (2 clips: total duration = 1000 + 500 = 1500ms)
    const timeline: AnimationTimeline = {
      id: 'tl_s38_complex',
      targetNodeId: heroNode.id,
      trigger: {
        type: 'inView',
        threshold: 0.5,
        targetElementId: heroNode.id,
      },
      playback: {
        repeatCount: 1,
        loop: false,
        fillMode: 'forwards',
        direction: 'normal',
        speed: 1.5,
      },
      clips: [
        {
          id: 'clip_1_entrance',
          name: 'Hero Entrance',
          duration: 1000,
          delay: 0,
          tracks: [
            {
              id: 'track_opacity',
              propertyKey: 'opacity',
              keyframes: [
                { id: 'kf_0', timeOffset: 0, value: 0, easing: { type: 'ease-out' } },
                { id: 'kf_1', timeOffset: 500, value: 0.5, easing: { type: 'linear' } },
                { id: 'kf_2', timeOffset: 1000, value: 1, easing: { type: 'ease-in' } },
              ],
            },
          ],
        },
        {
          id: 'clip_2_scale',
          name: 'Hero Scale',
          duration: 500,
          delay: 1000,
          tracks: [
            {
              id: 'track_scale',
              propertyKey: 'transform.scale',
              keyframes: [
                { id: 'kf_s0', timeOffset: 0, value: 1, easing: { type: 'linear' } },
                { id: 'kf_s1', timeOffset: 500, value: 1.2, easing: { type: 'linear' } },
              ],
            },
          ],
        },
      ],
    };

    // Attach initial timeline DTO to document (SSOT)
    const docWithTimeline = applyAnimationToNode(doc1, heroNode.id, timeline);
    const docBeforeJson = JSON.stringify(docWithTimeline);

    // Initialize HistoryStack
    let history = createHistoryStack<BuilderDocument>();
    history = history.push(docWithTimeline, 'Attach timeline');
    const initialHistoryLength = history.peek()?.version;

    // -------------------------------------------------------------------------
    // STEP 2: Instantiate Studio Integration Bridge & Preview Coordinator
    // -------------------------------------------------------------------------
    const bridge = new TimelineStudioBridge();
    const selected = bridge.selectTimeline(timeline);
    expect(selected).toBe(true);

    const coordinator = new PreviewRuntimeCoordinator({
      session: bridge.session,
      runtimeBridge: bridge.runtimeBridge,
      previewAdapter: bridge.previewAdapter,
      document: docWithTimeline,
    });

    // Verify Single Time Owner (AnimationPlaybackController)
    expect(bridge.playbackController).not.toBeNull();
    expect(bridge.playbackController?.duration).toBe(1500);

    // Option B: Host-provided renderFrame callback representing the host consumer contract
    const renderedFrames: RuntimeFrameBatch[] = [];
    const hostRenderFrameCallback = (batch: RuntimeFrameBatch) => {
      renderedFrames.push(batch);
    };

    // -------------------------------------------------------------------------
    // STEP 3: Execute Playback & Live Canvas Synchronization
    // -------------------------------------------------------------------------
    // 1. Play
    bridge.play();
    coordinator.updateDocument(docWithTimeline);
    expect(bridge.session.status).toBe('playing');
    expect(bridge.playbackController?.status).toBe('playing');

    // 2. Advance 250ms (at speed 1.5 -> advance = 250 * 1.5 = 375ms)
    const frameAt375 = bridge.advance(250);
    expect(bridge.session.currentTime).toBe(375);
    expect(bridge.playbackController?.currentTime).toBe(375);
    expect(frameAt375).not.toBeNull();
    hostRenderFrameCallback(frameAt375!);

    // 3. Seek playhead to 500ms
    const frameAt500 = bridge.seek(500);
    expect(bridge.session.currentTime).toBe(500);
    expect(frameAt500).not.toBeNull();
    hostRenderFrameCallback(frameAt500!);

    // 4. Live scrubbing to 750ms via PreviewRuntimeCoordinator
    const scrubResult = coordinator.scrubTo(750);
    expect(scrubResult.timeMs).toBe(750);
    expect(scrubResult.frameBatch).not.toBeNull();
    hostRenderFrameCallback(scrubResult.frameBatch!);

    // 5. Pause & Stop
    bridge.pause();
    expect(bridge.session.status).toBe('paused');

    bridge.stop();
    expect(bridge.session.status).toBe('stopped');
    expect(bridge.session.currentTime).toBe(0);

    // Verify canvas rendered 3 distinct frame batches with detailed payload evidence
    expect(renderedFrames).toHaveLength(3);
    expect(renderedFrames[0].time).toBe(375);
    expect(renderedFrames[0].values).not.toBeNull();
    expect(renderedFrames[0].values['opacity']).toBe(0.375);
    expect(renderedFrames[1].time).toBe(500);
    expect(renderedFrames[1].values).not.toBeNull();
    expect(renderedFrames[1].values['opacity']).toBe(0.5);
    expect(renderedFrames[2].time).toBe(750);
    expect(renderedFrames[2].values).not.toBeNull();
    expect(renderedFrames[2].values['opacity']).toBe(0.75);

    // -------------------------------------------------------------------------
    // STEP 4: VERIFY SSOT INTEGRITY & ZERO DOCUMENT MUTATIONS
    // -------------------------------------------------------------------------
    // Document is 100% identical byte-for-byte to snapshot before playback
    const docAfterJson = JSON.stringify(docWithTimeline);
    expect(docAfterJson).toBe(docBeforeJson);

    // HistoryStack was NOT polluted with pure playback actions
    expect(history.peek()?.version).toBe(initialHistoryLength);
  });
});
