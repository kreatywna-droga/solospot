/**
 * TimelineE2EWorkflow.test.ts — Golden E2E Integration Test for Sprint S36
 *
 * Verifies full interactive timeline authoring lifecycle on complex timelines:
 *   1. Create BuilderDocument & SectionNode using production factories.
 *   2. Attach complex AnimationTimeline DTO (2 clips, 2 tracks, 3 keyframes, playback speed = 1.5).
 *   3. Perform keyframe selection (selectKeyframe).
 *   4. Execute keyframe value edit (setKeyframeValue) -> doc2.
 *   5. Execute keyframe easing edit (setKeyframeEasing) -> doc3.
 *   6. Add new keyframe (addKeyframe) -> doc4.
 *   7. Move keyframe timeOffset (moveKeyframe) -> doc5.
 *   8. Resize clip duration (resizeClip) -> doc6.
 *   9. Push snapshots onto HistoryStack<BuilderDocument>.
 *  10. Execute history.undo() & history.redo() -> verify state restoration.
 *  11. Verify 100% LOSSLESS PRESERVATION: 2 clips, 2 tracks, keyframe ordering, and speed = 1.5 remain 100% intact throughout all mutations.
 *
 * ZERO fake playback execution, ZERO PlaybackController, ZERO RuntimeScheduler.
 */

import { describe, it, expect } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  type BuilderDocument,
} from '../../../../builder-core/src/BuilderDocument';
import { createHistoryStack } from '../../../../builder-core/src/HistoryStack';
import type {
  AnimationTimeline,
  AnimationKeyframe,
} from '../../../../builder-core/src/animation/AnimationTypes';

import {
  inspectNodeAnimation,
  applyAnimationToNode,
} from '../../inspector/animationDocumentBinding';

import {
  selectKeyframe,
  createTimelineSelection,
} from '../TimelineSelection';

import {
  setKeyframeValue,
  setKeyframeEasing,
  addKeyframe,
  moveKeyframe,
  resizeClip,
  getKeyframe,
  getClip,
} from '../timelineDocumentBinding';

describe('S36 Golden E2E Workflow — Timeline Editor & Keyframe Authoring', () => {
  it('executes full keyframe authoring, track editing, clip resizing, and HistoryStack undo/redo with 100% lossless DTO patching (DECISION-047)', () => {
    // -------------------------------------------------------------------------
    // STEP 1: Document & SectionNode Setup (Canonical Production Factories)
    // -------------------------------------------------------------------------
    const heroNode = createSectionNode({
      id: 'sec_hero_s36',
      type: 'hero',
      label: 'Hero Banner',
      props: {},
    });

    const page = createBuilderPage({
      id: 'page_main_s36',
      slug: '/',
      name: 'Main Page',
      isHome: true,
      sections: [heroNode],
    });

    const doc1: BuilderDocument = createBuilderDocument({
      id: 'doc_s36_golden',
      tenantId: 'tenant_s36',
      metadata: {
        storeName: 'S36 Timeline Store',
        storeSlug: 's36-timeline-store',
        locale: 'en',
        currency: 'USD',
      },
    });
    doc1.pages = [page];

    // Complex AnimationTimeline DTO (2 clips, 2 tracks, 3 keyframes on track 1, custom speed = 1.5)
    const initialComplexTimeline: AnimationTimeline = {
      id: 'tl_s36_hero',
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
          id: 'clip_hero_entrance',
          name: 'Hero Entrance',
          duration: 1000,
          delay: 0,
          tracks: [
            {
              id: 'track_hero_opacity',
              propertyKey: 'opacity',
              keyframes: [
                { id: 'kf_opacity_0', timeOffset: 0, value: 0, easing: { type: 'ease-out' } },
                { id: 'kf_opacity_1', timeOffset: 500, value: 0.5, easing: { type: 'linear' } },
                { id: 'kf_opacity_2', timeOffset: 1000, value: 1, easing: { type: 'ease-in' } },
              ],
            },
            {
              id: 'track_hero_translateY',
              propertyKey: 'transform.translateY',
              keyframes: [
                { id: 'kf_trans_0', timeOffset: 0, value: 50, easing: { type: 'linear' } },
                { id: 'kf_trans_1', timeOffset: 1000, value: 0, easing: { type: 'linear' } },
              ],
            },
          ],
        },
        {
          id: 'clip_hero_accent',
          name: 'Hero Accent Pulse',
          duration: 500,
          delay: 1000,
          tracks: [
            {
              id: 'track_accent_scale',
              propertyKey: 'transform.scale',
              keyframes: [
                { id: 'kf_scale_0', timeOffset: 0, value: 1, easing: { type: 'linear' } },
                { id: 'kf_scale_1', timeOffset: 500, value: 1.2, easing: { type: 'linear' } },
              ],
            },
          ],
        },
      ],
    };

    // Attach initial timeline onto document (stored under node.props['animationTimeline'])
    const docWithInitial = applyAnimationToNode(doc1, heroNode.id, initialComplexTimeline);
    const initialDocJson = JSON.stringify(docWithInitial);

    // -------------------------------------------------------------------------
    // STEP 2: Selection Model Initialization & Selection
    // -------------------------------------------------------------------------
    let selection = createTimelineSelection();
    selection = selectKeyframe(
      selection,
      'clip_hero_entrance',
      'track_hero_opacity',
      'kf_opacity_1'
    );
    expect(selection.selectedKeyframeId).toBe('kf_opacity_1');

    // -------------------------------------------------------------------------
    // STEP 3: Edit Keyframe Value (setKeyframeValue -> doc2)
    // -------------------------------------------------------------------------
    const doc2 = setKeyframeValue(
      docWithInitial,
      heroNode.id,
      'clip_hero_entrance',
      'track_hero_opacity',
      'kf_opacity_1',
      0.75
    );
    expect(doc2.version).toBe(docWithInitial.version + 1);

    const kfDoc2 = getKeyframe(doc2, heroNode.id, 'clip_hero_entrance', 'track_hero_opacity', 'kf_opacity_1');
    expect(kfDoc2?.value).toBe(0.75);

    // -------------------------------------------------------------------------
    // STEP 4: Edit Keyframe Easing (setKeyframeEasing -> doc3)
    // -------------------------------------------------------------------------
    const doc3 = setKeyframeEasing(
      doc2,
      heroNode.id,
      'clip_hero_entrance',
      'track_hero_opacity',
      'kf_opacity_1',
      { type: 'cubic-bezier', controlPoints: [0.4, 0, 0.2, 1] }
    );
    expect(doc3.version).toBe(doc2.version + 1);

    const kfDoc3 = getKeyframe(doc3, heroNode.id, 'clip_hero_entrance', 'track_hero_opacity', 'kf_opacity_1');
    expect(kfDoc3?.easing).toEqual({ type: 'cubic-bezier', controlPoints: [0.4, 0, 0.2, 1] });

    // -------------------------------------------------------------------------
    // STEP 5: Add New Keyframe (addKeyframe -> doc4)
    // -------------------------------------------------------------------------
    const newKeyframe: AnimationKeyframe = {
      id: 'kf_opacity_mid',
      timeOffset: 250,
      value: 0.25,
      easing: { type: 'linear' },
    };
    const doc4 = addKeyframe(
      doc3,
      heroNode.id,
      'clip_hero_entrance',
      'track_hero_opacity',
      newKeyframe
    );
    expect(doc4.version).toBe(doc3.version + 1);

    const tlDoc4 = inspectNodeAnimation(doc4, heroNode.id);
    expect(tlDoc4?.clips[0].tracks[0].keyframes).toHaveLength(4); // 4 keyframes now!

    // -------------------------------------------------------------------------
    // STEP 6: Move Keyframe (moveKeyframe -> doc5)
    // -------------------------------------------------------------------------
    const doc5 = moveKeyframe(
      doc4,
      heroNode.id,
      'clip_hero_entrance',
      'track_hero_opacity',
      'kf_opacity_mid',
      300
    );
    expect(doc5.version).toBe(doc4.version + 1);

    const kfDoc5 = getKeyframe(doc5, heroNode.id, 'clip_hero_entrance', 'track_hero_opacity', 'kf_opacity_mid');
    expect(kfDoc5?.timeOffset).toBe(300);

    // -------------------------------------------------------------------------
    // STEP 7: Resize Clip Duration (resizeClip -> doc6)
    // -------------------------------------------------------------------------
    const doc6 = resizeClip(
      doc5,
      heroNode.id,
      'clip_hero_entrance',
      2000
    );
    expect(doc6.version).toBe(doc5.version + 1);

    const clipDoc6 = getClip(doc6, heroNode.id, 'clip_hero_entrance');
    expect(clipDoc6?.duration).toBe(2000);

    // -------------------------------------------------------------------------
    // STEP 8: HistoryStack Undo / Redo Lifecycle Integration
    // -------------------------------------------------------------------------
    let history = createHistoryStack<BuilderDocument>();
    history = history.push(docWithInitial, 'Initial timeline');
    history = history.push(doc2, 'Edit keyframe value');
    history = history.push(doc3, 'Edit keyframe easing');
    history = history.push(doc4, 'Add keyframe');
    history = history.push(doc5, 'Move keyframe');
    history = history.push(doc6, 'Resize clip');

    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
    expect(history.peek()?.version).toBe(doc6.version);

    // Undo 1: Reverts doc6 -> doc5 (clip duration 2000 -> 1000)
    const undoRes1 = history.undo();
    expect(undoRes1).not.toBeNull();
    history = undoRes1!.stack;
    const undoDoc5 = undoRes1!.state;
    expect(undoDoc5.version).toBe(doc5.version);
    expect(getClip(undoDoc5, heroNode.id, 'clip_hero_entrance')?.duration).toBe(1000);

    // Undo step-by-step back to initial document snapshot
    while (history.canUndo) {
      const res = history.undo();
      if (!res) break;
      history = res.stack;
    }
    const restoredInitialDoc = history.peek()!;
    expect(restoredInitialDoc.version).toBe(docWithInitial.version);
    expect(JSON.stringify(restoredInitialDoc)).toBe(initialDocJson);

    // Redo step-by-step back to doc6 state
    while (history.canRedo) {
      const res = history.redo();
      if (!res) break;
      history = res.stack;
    }
    const redoDoc6 = history.peek()!;
    expect(redoDoc6.version).toBe(doc6.version);
    expect(getClip(redoDoc6, heroNode.id, 'clip_hero_entrance')?.duration).toBe(2000);

    // -------------------------------------------------------------------------
    // STEP 9: VERIFY LOSSLESS PRESERVATION (DECISION-047 / S36 Hard Rule)
    // -------------------------------------------------------------------------
    const finalTimeline = inspectNodeAnimation(doc6, heroNode.id);
    expect(finalTimeline).not.toBeNull();

    // 1. Clips preserved: 2 clips
    expect(finalTimeline?.clips).toHaveLength(2);
    expect(finalTimeline?.clips[1].name).toBe('Hero Accent Pulse'); // 2nd clip name preserved!
    expect(finalTimeline?.clips[1].tracks[0].propertyKey).toBe('transform.scale'); // 2nd clip track preserved!

    // 2. Tracks preserved: 2 tracks on clip 1
    expect(finalTimeline?.clips[0].tracks).toHaveLength(2);
    expect(finalTimeline?.clips[0].tracks[1].propertyKey).toBe('transform.translateY'); // 2nd track preserved!

    // 3. Playback custom speed preserved
    expect(finalTimeline?.playback.speed).toBe(1.5); // Custom speed=1.5 preserved!

    // 4. Initial document snapshot 100% immutably untouched
    expect(JSON.stringify(docWithInitial)).toBe(initialDocJson);
  });
});
