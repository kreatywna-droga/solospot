import { describe, it, expect } from 'vitest';
import {
  copyKeyframesToClipboard,
  cutKeyframesToClipboard,
  pasteKeyframesFromClipboard,
  duplicateKeyframePayload,
} from '../TimelineClipboard';
import { createBuilderDocument, createBuilderPage, createSectionNode } from '../../../../builder-core/src/BuilderDocument';
import { applyAnimationToNode, inspectNodeAnimation } from '../../inspector/animationDocumentBinding';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

function buildDoc() {
  const doc = createBuilderDocument({
    id: 'store-clip',
    tenantId: 'tenant-clip',
    metadata: { storeName: 'Clip Test', storeSlug: 'clip', locale: 'en', currency: 'USD' },
  });
  const page = createBuilderPage({
    id: 'page-clip',
    slug: '/',
    name: 'Home',
    isHome: true,
    sections: [createSectionNode({ id: 'sec-clip-node', type: 'hero', label: 'Hero', order: 0 })],
  });
  return { ...doc, pages: [page] };
}

const mockTimeline: AnimationTimeline = {
  id: 'tl-clip-node',
  targetNodeId: 'sec-clip-node',
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
            { id: 'kf-2', timeOffset: 400, value: 0.5, easing: { type: 'linear' } },
          ],
        },
      ],
    },
  ],
};

describe('TimelineClipboard (PM39, ETAP 5 & DECISION-060)', () => {
  it('copies keyframes to a pure DTO payload (DECISION-060)', () => {
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-clip-node', mockTimeline);

    const refs = [{ clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-2' }];
    const payload = copyKeyframesToClipboard(doc, 'sec-clip-node', refs);

    expect(payload.type).toBe('keyframes');
    expect(payload.keyframes).toHaveLength(1);
    expect(payload.keyframes[0].value).toBe(0.5);
  });

  it('cuts keyframes immutably from BuilderDocument', () => {
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-clip-node', mockTimeline);

    const refs = [{ clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-2' }];
    const { updatedDoc, payload } = cutKeyframesToClipboard(doc, 'sec-clip-node', refs);

    expect(payload.keyframes).toHaveLength(1);
    const timeline = inspectNodeAnimation(updatedDoc, 'sec-clip-node')!;
    expect(timeline.clips[0].tracks[0].keyframes).toHaveLength(1);
    expect(timeline.clips[0].tracks[0].keyframes[0].id).toBe('kf-1');
  });

  it('pastes keyframes at specified target time offset', () => {
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-clip-node', mockTimeline);

    const refs = [{ clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-2' }];
    const payload = copyKeyframesToClipboard(doc, 'sec-clip-node', refs);

    const updatedDoc = pasteKeyframesFromClipboard(
      doc,
      'sec-clip-node',
      'clip-1',
      'track-1',
      payload,
      800
    );

    const timeline = inspectNodeAnimation(updatedDoc, 'sec-clip-node')!;
    expect(timeline.clips[0].tracks[0].keyframes).toHaveLength(3);

    const pasted = timeline.clips[0].tracks[0].keyframes.find((k) => k.timeOffset === 800)!;
    expect(pasted).toBeDefined();
    expect(pasted.value).toBe(0.5);
  });

  it('duplicates keyframe payload directly in place', () => {
    let doc = buildDoc();
    doc = applyAnimationToNode(doc, 'sec-clip-node', mockTimeline);

    const refs = [{ clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-2' }];
    const updatedDoc = duplicateKeyframePayload(
      doc,
      'sec-clip-node',
      'clip-1',
      'track-1',
      refs,
      100
    );

    const timeline = inspectNodeAnimation(updatedDoc, 'sec-clip-node')!;
    expect(timeline.clips[0].tracks[0].keyframes).toHaveLength(3);
    const dup = timeline.clips[0].tracks[0].keyframes.find((k) => k.timeOffset === 500)!;
    expect(dup).toBeDefined();
  });
});
