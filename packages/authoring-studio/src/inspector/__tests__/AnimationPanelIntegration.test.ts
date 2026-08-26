/**
 * AnimationPanelIntegration.test.ts — Sprint S35 Golden E2E Integration Test
 *
 * Real authoring & Inspector binding lifecycle verification using ONLY production APIs:
 *   1. Create BuilderDocument & SectionNode via canonical production factories.
 *   2. Attach default AnimationTimeline DTO to node.props['animationTimeline'].
 *   3. Inspect node animation DTO via inspectNodeAnimation(doc, nodeId).
 *   4. Convert timeline DTO to flat inspector values dictionary via animationTimelineToInspectorValues(timeline).
 *   5. Simulate user editing 'animation.trigger.type' to 'inView' and 'animation.trigger.threshold' to 0.75.
 *   6. Convert updated values dictionary to AnimationTimeline DTO via inspectorValuesToAnimationTimeline(nodeId, updatedValues).
 *   7. Apply updated timeline to document via applyAnimationToNode(doc, nodeId, updatedTimeline) -> produces doc2.
 *   8. Execute applyAnimationInspectorChange(doc2, nodeId, 'animation.playback.duration', 1500) -> produces doc3.
 *   9. Push doc1, doc2, doc3 onto HistoryStack<BuilderDocument>.
 *  10. Execute history.undo() -> verify document reverts to doc2 state.
 *  11. Execute history.redo() -> verify document restores doc3 state with updated duration (1500ms).
 *  12. Verify BuilderDocument remains 100% SSOT with zero side effects or runtime playback calls.
 *  13. Verify lossless DTO patch (F-04): multi-clip, multi-track, multi-keyframe, speed preserved when editing a single field.
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
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';
import {
  inspectNodeAnimation,
  animationTimelineToInspectorValues,
  inspectorValuesToAnimationTimeline,
  applyAnimationToNode,
  applyAnimationInspectorChange,
} from '../animationDocumentBinding';

describe('S35 Golden E2E Integration Test — Inspector Animation Panel & SSOT History Pipeline', () => {
  it('executes full authoring, DTO binding, SSOT mutation, and HistoryStack undo/redo without runtime playback', () => {
    // -------------------------------------------------------------------------
    // STEP 1: Document & SectionNode Setup (Canonical Factories)
    // -------------------------------------------------------------------------
    const heroNode = createSectionNode({
      id: 'sec_hero_s35',
      type: 'hero',
      label: 'Hero Banner',
      props: { title: 'S35 Inspector Store' },
    });

    const page = createBuilderPage({
      id: 'page_main_s35',
      slug: '/',
      name: 'Main Page',
      isHome: true,
      sections: [heroNode],
    });

    const doc1: BuilderDocument = createBuilderDocument({
      id: 'doc_s35_e2e',
      tenantId: 'tenant_s35',
      metadata: {
        storeName: 'S35 Store',
        storeSlug: 's35-store',
        locale: 'en',
        currency: 'USD',
      },
    });
    doc1.pages = [page];

    // Initial timeline DTO
    const initialTimeline: AnimationTimeline = {
      id: 'tl_s35_hero',
      targetNodeId: heroNode.id,
      trigger: {
        type: 'onLoad',
        threshold: 0.5,
        targetElementId: heroNode.id,
      },
      playback: {
        repeatCount: 1,
        loop: false,
        fillMode: 'forwards',
        direction: 'normal',
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
                { id: 'kf_0', timeOffset: 0, value: 0, easing: { type: 'ease-out' } },
                { id: 'kf_1', timeOffset: 1000, value: 1, easing: { type: 'ease-out' } },
              ],
            },
          ],
        },
      ],
    };

    // Apply initial timeline DTO onto doc1 (stored under node.props['animationTimeline'])
    const docWithInitialTimeline = applyAnimationToNode(doc1, heroNode.id, initialTimeline);
    const initialDocJson = JSON.stringify(docWithInitialTimeline);

    // -------------------------------------------------------------------------
    // STEP 2: Inspect Node Animation & DTO Value Extraction
    // -------------------------------------------------------------------------
    const inspectedInitial = inspectNodeAnimation(docWithInitialTimeline, heroNode.id);
    expect(inspectedInitial).not.toBeNull();
    expect(inspectedInitial?.trigger.type).toBe('onLoad');

    const flatValues = animationTimelineToInspectorValues(inspectedInitial!);
    expect(flatValues['animation.trigger.type']).toBe('onLoad');
    expect(flatValues['animation.trigger.threshold']).toBe(0.5);
    expect(flatValues['animation.playback.duration']).toBe(1000);

    // -------------------------------------------------------------------------
    // STEP 3: User Form Edit Simulation 1 (Trigger Edit: onLoad -> inView, 0.75)
    // -------------------------------------------------------------------------
    const updatedValues1 = {
      ...flatValues,
      'animation.trigger.type': 'inView',
      'animation.trigger.threshold': 0.75,
    };

    const timeline2 = inspectorValuesToAnimationTimeline(heroNode.id, updatedValues1);
    const doc2 = applyAnimationToNode(docWithInitialTimeline, heroNode.id, timeline2);

    expect(doc2.version).toBe(docWithInitialTimeline.version + 1);
    const inspectedDoc2 = inspectNodeAnimation(doc2, heroNode.id);
    expect(inspectedDoc2?.trigger.type).toBe('inView');
    expect(inspectedDoc2?.trigger.threshold).toBe(0.75);

    // -------------------------------------------------------------------------
    // STEP 4: User Form Edit Simulation 2 (Playback Edit: duration -> 1500)
    // -------------------------------------------------------------------------
    const doc3 = applyAnimationInspectorChange(
      doc2,
      heroNode.id,
      'animation.playback.duration',
      1500
    );

    expect(doc3.version).toBe(doc2.version + 1);
    const inspectedDoc3 = inspectNodeAnimation(doc3, heroNode.id);
    expect(inspectedDoc3?.clips[0].duration).toBe(1500);

    // -------------------------------------------------------------------------
    // STEP 5: Canonical HistoryStack Integration (F-01 / F-02 Real API Contract)
    // -------------------------------------------------------------------------
    let history = createHistoryStack<BuilderDocument>();
    history = history.push(docWithInitialTimeline, 'Initial timeline');
    history = history.push(doc2, 'Edit trigger');
    history = history.push(doc3, 'Edit duration');

    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);
    expect(history.peek()?.version).toBe(doc3.version);

    // Undo 1: Reverts doc3 -> doc2 (duration 1500 -> 1000, trigger still inView)
    const undoRes2 = history.undo();
    expect(undoRes2).not.toBeNull();
    history = undoRes2!.stack;
    const undoDoc2 = undoRes2!.state;
    expect(undoDoc2.version).toBe(doc2.version);
    const inspectedUndo2 = inspectNodeAnimation(undoDoc2, heroNode.id);
    expect(inspectedUndo2?.trigger.type).toBe('inView');
    expect(inspectedUndo2?.clips[0].duration).toBe(1000);

    // Undo 2: Reverts doc2 -> docWithInitialTimeline (trigger inView -> onLoad)
    const undoRes1 = history.undo();
    expect(undoRes1).not.toBeNull();
    history = undoRes1!.stack;
    const undoDoc1 = undoRes1!.state;
    expect(undoDoc1.version).toBe(docWithInitialTimeline.version);
    const inspectedUndo1 = inspectNodeAnimation(undoDoc1, heroNode.id);
    expect(inspectedUndo1?.trigger.type).toBe('onLoad');

    // Redo 1: Restores doc2 state
    const redoRes2 = history.redo();
    expect(redoRes2).not.toBeNull();
    history = redoRes2!.stack;
    const redoDoc2 = redoRes2!.state;
    expect(redoDoc2.version).toBe(doc2.version);
    expect(inspectNodeAnimation(redoDoc2, heroNode.id)?.trigger.type).toBe('inView');

    // Redo 2: Restores doc3 state
    const redoRes3 = history.redo();
    expect(redoRes3).not.toBeNull();
    history = redoRes3!.stack;
    const redoDoc3 = redoRes3!.state;
    expect(redoDoc3.version).toBe(doc3.version);
    expect(inspectNodeAnimation(redoDoc3, heroNode.id)?.clips[0].duration).toBe(1500);

    // -------------------------------------------------------------------------
    // STEP 6: SSOT Immutability & Zero Runtime Playback Verification
    // -------------------------------------------------------------------------
    // Initial document snapshot remains 100% untouched
    expect(JSON.stringify(docWithInitialTimeline)).toBe(initialDocJson);

    // Verify canonical prop key 'animationTimeline' on SectionNode
    const heroNodeInDoc3 = doc3.pages[0].sections[0];
    expect(heroNodeInDoc3.props.animationTimeline).toBeDefined();
    expect(heroNodeInDoc3.props.animationTimeline).toEqual(inspectedDoc3);
  });

  it('preserves complex timeline structure (2 clips, 2 tracks, 3 keyframes, speed=1.5) when editing a single inspector field (F-04)', () => {
    const heroNode = createSectionNode({
      id: 'sec_complex',
      type: 'hero',
      label: 'Hero Section',
      props: {},
    });

    const page = createBuilderPage({
      id: 'page_complex',
      slug: '/',
      name: 'Home',
      sections: [heroNode],
    });

    const doc = createBuilderDocument({
      id: 'doc_complex',
      tenantId: 'tenant_c',
      metadata: {
        storeName: 'Complex Store',
        storeSlug: 'complex-store',
        locale: 'en',
        currency: 'USD',
      },
    });
    doc.pages = [page];

    // Complex AnimationTimeline DTO (2 clips, 2 tracks, 3 keyframes, playback speed = 1.5)
    const complexTimeline: AnimationTimeline = {
      id: 'tl_complex',
      targetNodeId: heroNode.id,
      trigger: { type: 'inView', threshold: 0.5, targetElementId: heroNode.id },
      playback: {
        repeatCount: 'infinite',
        loop: true,
        fillMode: 'both',
        direction: 'alternate',
        speed: 1.5,
      },
      clips: [
        {
          id: 'clip_1_fade',
          name: 'Fade In',
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
            {
              id: 'track_translateY',
              propertyKey: 'transform.translateY',
              keyframes: [
                { id: 'kf_t0', timeOffset: 0, value: 20, easing: { type: 'linear' } },
                { id: 'kf_t1', timeOffset: 1000, value: 0, easing: { type: 'linear' } },
              ],
            },
          ],
        },
        {
          id: 'clip_2_scale',
          name: 'Scale Up',
          duration: 500,
          delay: 1000,
          tracks: [
            {
              id: 'track_scale',
              propertyKey: 'transform.scale',
              keyframes: [
                { id: 'kf_s0', timeOffset: 0, value: 1, easing: { type: 'linear' } },
                { id: 'kf_s1', timeOffset: 500, value: 1.1, easing: { type: 'linear' } },
              ],
            },
          ],
        },
      ],
    };

    // Apply complex timeline onto document
    const docWithComplex = applyAnimationToNode(doc, heroNode.id, complexTimeline);

    // Edit ONLY a single property via applyAnimationInspectorChange (duration -> 1500)
    const updatedDoc = applyAnimationInspectorChange(
      docWithComplex,
      heroNode.id,
      'animation.playback.duration',
      1500
    );

    const editedTimeline = inspectNodeAnimation(updatedDoc, heroNode.id);
    expect(editedTimeline).not.toBeNull();

    // Verify lossless DTO patch (F-04):
    expect(editedTimeline?.clips).toHaveLength(2); // 2 clips preserved!
    expect(editedTimeline?.clips[0].tracks).toHaveLength(2); // 2 tracks preserved!
    expect(editedTimeline?.clips[0].tracks[0].keyframes).toHaveLength(3); // 3 keyframes preserved!
    expect(editedTimeline?.playback.speed).toBe(1.5); // Custom speed=1.5 preserved!
    expect(editedTimeline?.clips[1].name).toBe('Scale Up'); // 2nd clip name preserved!
    expect(editedTimeline?.clips[0].duration).toBe(1500); // Target duration property updated!
  });
});
