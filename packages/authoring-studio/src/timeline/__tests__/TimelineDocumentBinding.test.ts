import { describe, it, expect } from 'vitest';
import { createBuilderDocument, createBuilderPage, createSectionNode } from '../../../../builder-core/src/BuilderDocument';
import { applyAnimationToNode, inspectNodeAnimation } from '../../inspector/animationDocumentBinding';
import type { BuilderDocument } from '../../../../builder-core/src/BuilderDocument';
import type { AnimationTimeline, AnimationClip } from '../../../../builder-core/src/animation/AnimationTypes';
import {
  addClip,
  removeClip,
  moveClip,
  resizeClip,
  addTrack,
  removeTrack,
  moveKeyframe,
  addKeyframe,
  deleteKeyframe,
  setKeyframeValue,
  setKeyframeEasing,
  getClip,
  getTrack,
  getKeyframe,
} from '../timelineDocumentBinding';

function buildDoc(): BuilderDocument {
  const doc = createBuilderDocument({
    id: 'store-1',
    tenantId: 'tenant-1',
    metadata: { storeName: 'Test', storeSlug: 'test', locale: 'en', currency: 'USD' },
  });
  const page = createBuilderPage({
    id: 'page-home',
    slug: '/',
    name: 'Home',
    isHome: true,
    sections: [createSectionNode({ id: 'sec-1', type: 'hero', label: 'Hero', order: 0 })],
  });
  return { ...doc, pages: [page] };
}

// Seeds a timeline into the doc and returns the NEW document (immutably).
function seedTimeline(doc: BuilderDocument): BuilderDocument {
  const timeline: AnimationTimeline = {
    id: 'timeline-sec-1',
    targetNodeId: 'sec-1',
    trigger: { type: 'onLoad' },
    playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
    clips: [
      {
        id: 'clip-1',
        name: 'Fade In',
        duration: 800,
        delay: 0,
        tracks: [
          {
            id: 'track-1',
            propertyKey: 'opacity',
            keyframes: [
              { id: 'kf-1', timeOffset: 0, value: 0, easing: { type: 'linear' } },
              { id: 'kf-2', timeOffset: 800, value: 1, easing: { type: 'linear' } },
            ],
          },
        ],
      },
    ],
  };
  return applyAnimationToNode(doc, 'sec-1', timeline);
}

describe('TimelineDocumentBinding (PM36, DECISION-047 — immutable SSOT mutations)', () => {
  it('adds a clip immutably returning a new doc', () => {
    const seeded = seedTimeline(buildDoc());
    const newClip: AnimationClip = {
      id: 'clip-2',
      name: 'Slide In',
      duration: 500,
      delay: 100,
      tracks: [],
    };
    const newDoc = addClip(seeded, 'sec-1', newClip);
    expect(newDoc).not.toBe(seeded);
const result = inspectNodeAnimation(newDoc, 'sec-1')!;
    expect(result.clips.map((c: AnimationClip) => c.id)).toEqual(['clip-1', 'clip-2']);
  });

  it('removes a clip immutably', () => {
    const newDoc = removeClip(seedTimeline(buildDoc()), 'sec-1', 'clip-1');
    const result = inspectNodeAnimation(newDoc, 'sec-1')!;
    expect(result.clips).toHaveLength(0);
  });

  it('moves a clip to a new index', () => {
    const seeded = seedTimeline(buildDoc());
    const clip2: AnimationClip = {
      id: 'clip-2',
      name: 'B',
      duration: 300,
      delay: 0,
      tracks: [],
    };
    let newDoc = addClip(seeded, 'sec-1', clip2);
    newDoc = moveClip(newDoc, 'sec-1', 'clip-2', 0);
    const result = inspectNodeAnimation(newDoc, 'sec-1')!;
    expect(result.clips[0].id).toBe('clip-2');
  });

  it('resizes a clip duration', () => {
    const newDoc = resizeClip(seedTimeline(buildDoc()), 'sec-1', 'clip-1', 1200);
    expect(getClip(newDoc, 'sec-1', 'clip-1')!.duration).toBe(1200);
  });

  it('adds and removes a track', () => {
    const seeded = seedTimeline(buildDoc());
    let newDoc = addTrack(seeded, 'sec-1', 'clip-1', {
      id: 'track-2',
      propertyKey: 'transform.translateY',
      keyframes: [],
    });
expect(getClip(newDoc, 'sec-1', 'clip-1')!.tracks.map((t: { id: string }) => t.id)).toEqual([
      'track-1',
      'track-2',
    ]);

    newDoc = removeTrack(newDoc, 'sec-1', 'clip-1', 'track-2');
    expect(getClip(newDoc, 'sec-1', 'clip-1')!.tracks.map((t: { id: string }) => t.id)).toEqual(['track-1']);
  });

  it('moves a keyframe to a new time offset and re-sorts', () => {
    const newDoc = moveKeyframe(seedTimeline(buildDoc()), 'sec-1', 'clip-1', 'track-1', 'kf-1', 900);
    expect(getKeyframe(newDoc, 'sec-1', 'clip-1', 'track-1', 'kf-1')!.timeOffset).toBe(900);
    const track = getTrack(newDoc, 'sec-1', 'clip-1', 'track-1')!;
    expect(track.keyframes[0].timeOffset).toBeLessThanOrEqual(track.keyframes[1].timeOffset);
  });

  it('adds and deletes a keyframe', () => {
    const seeded = seedTimeline(buildDoc());
    let newDoc = addKeyframe(seeded, 'sec-1', 'clip-1', 'track-1', {
      id: 'kf-3',
      timeOffset: 400,
      value: 0.5,
      easing: { type: 'ease-out' },
    });
    expect(getTrack(newDoc, 'sec-1', 'clip-1', 'track-1')!.keyframes).toHaveLength(3);

    newDoc = deleteKeyframe(newDoc, 'sec-1', 'clip-1', 'track-1', 'kf-3');
    expect(getTrack(newDoc, 'sec-1', 'clip-1', 'track-1')!.keyframes).toHaveLength(2);
  });

  it('sets keyframe value and easing', () => {
    const seeded = seedTimeline(buildDoc());
    let newDoc = setKeyframeValue(seeded, 'sec-1', 'clip-1', 'track-1', 'kf-2', 0.75);
    expect(getKeyframe(newDoc, 'sec-1', 'clip-1', 'track-1', 'kf-2')!.value).toBe(0.75);

    newDoc = setKeyframeEasing(newDoc, 'sec-1', 'clip-1', 'track-1', 'kf-2', { type: 'spring' });
    expect(getKeyframe(newDoc, 'sec-1', 'clip-1', 'track-1', 'kf-2')!.easing?.type).toBe('spring');
  });

  it('verifies original document is not mutated (SSOT immutability)', () => {
    const doc = buildDoc();
    const originalJson = JSON.stringify(doc);
    addClip(doc, 'sec-1', {
      id: 'clip-9',
      name: 'X',
      duration: 100,
      delay: 0,
      tracks: [],
    });
    expect(JSON.stringify(doc)).toBe(originalJson);
  });
});
