/**
 * TimelineCurveAuthoring.test.ts — Sprint S24 Easing Curve Authoring Vitest Suite
 * Node environment — no jsdom required.
 */

import { describe, expect, it } from 'vitest';
import {
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
} from '../../../../builder-core/src/BuilderDocument';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';
import { applyAnimationToNode } from '../../inspector/animationDocumentBinding';
import { addClip, addKeyframe, addTrack } from '../timelineDocumentBinding';
import { TimelineCurveAuthoringController } from '../TimelineCurveAuthoringController';

function createTestDoc() {
  const section = createSectionNode({ id: 'sec-1', type: 'hero', label: 'Hero' });
  const docInit = createBuilderDocument({
    id: 'doc-1',
    tenantId: 'tenant-1',
    metadata: {
      storeName: 'Test Store',
      storeSlug: 'test-store',
      locale: 'en-US',
      currency: 'USD',
    },
  });
  let doc = {
    ...docInit,
    pages: [
      createBuilderPage({
        id: 'page-1',
        slug: '/',
        name: 'Home',
        isHome: true,
        sections: [section],
      }),
    ],
  };
  const nodeId = section.id;

  const initialTimeline: AnimationTimeline = {
    id: 'timeline-sec-1',
    targetNodeId: nodeId,
    trigger: { type: 'onLoad' },
    playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
    clips: [],
  };
  doc = applyAnimationToNode(doc, nodeId, initialTimeline);

  doc = addClip(doc, nodeId, { id: 'clip-1', name: 'Main Clip', duration: 1000, delay: 0, tracks: [] });
  doc = addTrack(doc, nodeId, 'clip-1', { id: 'track-1', propertyKey: 'opacity', keyframes: [] });
  doc = addKeyframe(doc, nodeId, 'clip-1', 'track-1', {
    id: 'kf-1',
    timeOffset: 0,
    value: 0,
    easing: { type: 'linear' },
  });

  return { doc, nodeId };
}

describe('S24 — TimelineCurveAuthoring', () => {
  it('applies easing presets and custom cubic-bezier curves', () => {
    const { doc, nodeId } = createTestDoc();
    const ref = { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-1' };

    const docPreset = TimelineCurveAuthoringController.setKeyframeEasingPreset(doc, nodeId, ref, 'easeIn');
    const anim1 = (docPreset.pages[0].sections[0].props as any)?.animationTimeline as AnimationTimeline | undefined;
    const kf1 = anim1?.clips[0].tracks[0].keyframes[0];
    expect(kf1?.easing.type).toBe('ease-in');

    const docCustom = TimelineCurveAuthoringController.setCustomCubicBezier(doc, nodeId, ref, {
      x1: 0.25,
      y1: 0.1,
      x2: 0.25,
      y2: 1.0,
    });
    const anim2 = (docCustom.pages[0].sections[0].props as any)?.animationTimeline as AnimationTimeline | undefined;
    const kf2 = anim2?.clips[0].tracks[0].keyframes[0];
    expect(kf2?.easing.type).toBe('cubic-bezier');
    expect(kf2?.easing.controlPoints?.[0]).toBe(0.25);
  });

  it('updates Bezier tangent handles and direct keyframe values', () => {
    const { doc, nodeId } = createTestDoc();
    const ref = { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-1' };

    const docHandle = TimelineCurveAuthoringController.updateBezierTangentHandles(doc, nodeId, ref, 'P1', 0.3, 0.2);
    const pts = TimelineCurveAuthoringController.extractKeyframeEasingPoints(docHandle, nodeId, ref);
    expect(pts.x1).toBe(0.3);
    expect(pts.y1).toBe(0.2);

    const docVal = TimelineCurveAuthoringController.setDirectKeyframeValue(doc, nodeId, ref, 0.85);
    const animVal = (docVal.pages[0].sections[0].props as any)?.animationTimeline as AnimationTimeline | undefined;
    const kfVal = animVal?.clips[0].tracks[0].keyframes[0];
    expect(kfVal?.value).toBe(0.85);
  });
});
