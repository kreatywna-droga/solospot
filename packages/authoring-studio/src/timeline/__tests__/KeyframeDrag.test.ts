import { describe, it, expect } from 'vitest';
import {
  moveMultipleKeyframes,
  duplicateKeyframe,
  deleteKeyframesBatch,
  dragKeyframeConstrained,
} from '../TimelineKeyframeAuthoring';
import { createBuilderDocument, createBuilderPage, createSectionNode } from '../../../../builder-core/src/BuilderDocument';
import { applyAnimationToNode, inspectNodeAnimation } from '../../inspector/animationDocumentBinding';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

function buildDoc() {
  const doc = createBuilderDocument({
    id: 'store-kf-drag',
    tenantId: 'tenant-kf',
    metadata: { storeName: 'KF Drag Test', storeSlug: 'kf', locale: 'en', currency: 'USD' },
  });
  const page = createBuilderPage({
    id: 'page-kf',
    slug: '/',
    name: 'Home',
    isHome: true,
    sections: [createSectionNode({ id: 'sec-kf-node', type: 'hero', label: 'Hero', order: 0 })],
  });
  return { ...doc, pages: [page] };
}

const mockTimeline: AnimationTimeline = {
  id: 'tl-kf-node',
  targetNodeId: 'sec-kf-node',
  trigger: { type: 'onLoad' },
  playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
  clips: [
    {
      id: 'clip-1',
      name: 'Fade',
      duration: 1000,
      delay: 0,
      tracks: [
        {
          id: 'track-1',
          propertyKey: 'opacity',
          keyframes: [
            { id: 'kf-1', timeOffset: 0, value: 0, easing: { type: 'linear' } },
            { id: 'kf-2', timeOffset: 500, value: 0.5, easing: { type: 'linear' } },
            { id: 'kf-3', timeOffset: 1000, value: 1, easing: { type: 'linear' } },
          ],
        },
      ],
    },
  ],
};

describe('KeyframeDrag Authoring UX (PM39, ETAP 2 & DECISION-059)', () => {
  it('moves multiple keyframes simultaneously returning a new BuilderDocument (SSOT)', () => {
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-kf-node', mockTimeline);

    const refs = [
      { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-2' },
      { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-3' },
    ];

    const updatedDoc = moveMultipleKeyframes(doc, 'sec-kf-node', refs, 200);

    expect(updatedDoc).not.toBe(doc); // SSOT Immutability verified
    const timeline = inspectNodeAnimation(updatedDoc, 'sec-kf-node')!;
    const kf2 = timeline.clips[0].tracks[0].keyframes.find((k) => k.id === 'kf-2')!;
    const kf3 = timeline.clips[0].tracks[0].keyframes.find((k) => k.id === 'kf-3')!;

    expect(kf2.timeOffset).toBe(700); // 500 + 200
    expect(kf3.timeOffset).toBe(1200); // 1000 + 200
  });

  it('duplicates a keyframe immutably', () => {
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-kf-node', mockTimeline);

    const ref = { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-2' };
    const { updatedDoc, newKeyframeId } = duplicateKeyframe(doc, 'sec-kf-node', ref, 150);

    expect(newKeyframeId).not.toBeNull();
    const timeline = inspectNodeAnimation(updatedDoc, 'sec-kf-node')!;
    expect(timeline.clips[0].tracks[0].keyframes).toHaveLength(4);

    const duplicated = timeline.clips[0].tracks[0].keyframes.find((k) => k.id === newKeyframeId)!;
    expect(duplicated.timeOffset).toBe(650); // 500 + 150
  });

  it('deletes a batch of keyframes', () => {
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-kf-node', mockTimeline);

    const refs = [
      { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-1' },
      { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-3' },
    ];

    const updatedDoc = deleteKeyframesBatch(doc, 'sec-kf-node', refs);
    const timeline = inspectNodeAnimation(updatedDoc, 'sec-kf-node')!;
    expect(timeline.clips[0].tracks[0].keyframes).toHaveLength(1);
    expect(timeline.clips[0].tracks[0].keyframes[0].id).toBe('kf-2');
  });

  it('drags keyframe with snapping resolver constraint', () => {
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-kf-node', mockTimeline);

    const ref = { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-2' };
    const snapResolver = (time: number) => Math.round(time / 100) * 100;

    const updatedDoc = dragKeyframeConstrained(doc, 'sec-kf-node', ref, 580, snapResolver);
    const timeline = inspectNodeAnimation(updatedDoc, 'sec-kf-node')!;
    const kf2 = timeline.clips[0].tracks[0].keyframes.find((k) => k.id === 'kf-2')!;

    expect(kf2.timeOffset).toBe(600); // 580 snapped to 600
  });
});
