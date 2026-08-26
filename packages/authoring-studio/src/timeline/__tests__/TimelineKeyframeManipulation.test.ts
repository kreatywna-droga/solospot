/**
 * TimelineKeyframeManipulation.test.ts — Sprint S24 Keyframe Manipulation Vitest Suite
 * Node environment — no jsdom required.
 */

import { describe, expect, it } from 'vitest';
import { createBuilderDocument, createBuilderPage, createSectionNode } from '../../../../builder-core/src/BuilderDocument';
import { createDefaultTimeline, applyAnimationToNode, inspectNodeAnimation } from '../../inspector/animationDocumentBinding';
import { addClip, addKeyframe, addTrack } from '../timelineDocumentBinding';
import { TimelineKeyframeController } from '../TimelineKeyframeController';

function createTestDoc() {
  const section = createSectionNode({ id: 'sec1', type: 'rect' });
  const page = createBuilderPage({ id: 'page1', slug: '/', name: 'Home', isHome: true, sections: [section] });
  let doc = createBuilderDocument({
    id: 'doc1',
    tenantId: 'tenant1',
    metadata: { storeName: 'Test', storeSlug: 'test', locale: 'en', currency: 'USD' },
  });
  doc = { ...doc, pages: [page] };
  const nodeId = section.id;
  const defaultTimeline = {
    id: `timeline-${nodeId}`,
    targetNodeId: nodeId,
    trigger: { type: 'onLoad' as const },
    playback: { repeatCount: 1, loop: false, fillMode: 'forwards' as const, direction: 'normal' as const },
    clips: [],
  };
  doc = applyAnimationToNode(doc, nodeId, defaultTimeline);

  doc = addClip(doc, nodeId, {
    id: 'clip-1',
    name: 'Main Clip',
    duration: 1000,
    delay: 0,
    tracks: [],
  });

  doc = addTrack(doc, nodeId, 'clip-1', {
    id: 'track-1',
    propertyKey: 'opacity',
    keyframes: [],
  });

  doc = addKeyframe(doc, nodeId, 'clip-1', 'track-1', {
    id: 'kf-1',
    timeOffset: 0,
    value: 0,
    easing: { type: 'linear' },
  });

  doc = addKeyframe(doc, nodeId, 'clip-1', 'track-1', {
    id: 'kf-2',
    timeOffset: 500,
    value: 0.5,
    easing: { type: 'ease-in' },
  });

  return { doc, nodeId };
}

describe('S24 — TimelineKeyframeManipulation', () => {
  it('moves a single keyframe to new offset', () => {
    const { doc, nodeId } = createTestDoc();
    const ref = { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-1' };

    const updated = TimelineKeyframeController.moveKeyframe(doc, nodeId, ref, 250);
    const timeline = inspectNodeAnimation(updated, nodeId);
    const kf = timeline?.clips.find((c) => c.id === 'clip-1')?.tracks.find((t) => t.id === 'track-1')?.keyframes.find((k) => k.id === 'kf-1');

    expect(kf?.timeOffset).toBe(250);
  });

  it('copies, pastes and duplicates keyframes', () => {
    const { doc, nodeId } = createTestDoc();
    const refs = [
      { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-1' },
      { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-2' },
    ];

    const payload = TimelineKeyframeController.copyKeyframes(doc, nodeId, refs);
    expect(payload.keyframes.length).toBe(2);

    const pastedDoc = TimelineKeyframeController.pasteKeyframes(doc, nodeId, 'clip-1', 'track-1', payload, 600);
    const timeline = inspectNodeAnimation(pastedDoc, nodeId);
    const keyframes = timeline?.clips.find((c) => c.id === 'clip-1')?.tracks.find((t) => t.id === 'track-1')?.keyframes ?? [];
    expect(keyframes.length).toBe(4);
  });

  it('deletes selected keyframes', () => {
    const { doc, nodeId } = createTestDoc();
    const refs = [{ clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-1' }];

    const deletedDoc = TimelineKeyframeController.deleteKeyframes(doc, nodeId, refs);
    const timeline = inspectNodeAnimation(deletedDoc, nodeId);
    const keyframes = timeline?.clips.find((c) => c.id === 'clip-1')?.tracks.find((t) => t.id === 'track-1')?.keyframes ?? [];
    expect(keyframes.length).toBe(1);
    expect(keyframes[0].id).toBe('kf-2');
  });
});
