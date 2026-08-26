/**
 * TimelineKeyframeSelectionUX.test.ts — Sprint S24 Keyframe Selection UX Vitest Suite
 * Node environment — no jsdom required.
 */

import { describe, expect, it } from 'vitest';
import { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';
import { TimelineSelectionController } from '../TimelineSelectionController';

const mockTimeline: AnimationTimeline = {
  id: 'timeline-1',
  targetNodeId: 'node-1',
  trigger: { type: 'onLoad' },
  playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
  clips: [
    {
      id: 'clip-1',
      name: 'Main Clip',
      duration: 1000,
      delay: 0,
      tracks: [
        {
          id: 'track-1',
          propertyKey: 'opacity',
          keyframes: [
            { id: 'kf-1', timeOffset: 0, value: 0, easing: { type: 'linear' } },
            { id: 'kf-2', timeOffset: 500, value: 0.5, easing: { type: 'ease-in' } },
            { id: 'kf-3', timeOffset: 1000, value: 1, easing: { type: 'ease-out' } },
          ],
        },
      ],
    },
  ],
};

describe('S24 — TimelineKeyframeSelectionUX', () => {
  it('selects single keyframe', () => {
    const state = TimelineSelectionController.selectSingleKeyframe('clip-1', 'track-1', 'kf-1');
    expect(state.selectedKeyframeRefs.length).toBe(1);
    expect(state.primarySelectedRef?.keyframeId).toBe('kf-1');
    expect(TimelineSelectionController.isKeyframeSelected(state, 'kf-1')).toBe(true);
    expect(TimelineSelectionController.isKeyframeSelected(state, 'kf-2')).toBe(false);
  });

  it('toggles keyframe selection with Ctrl/Cmd', () => {
    const s1 = TimelineSelectionController.selectSingleKeyframe('clip-1', 'track-1', 'kf-1');
    const s2 = TimelineSelectionController.toggleKeyframe(s1, { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-2' });

    expect(s2.selectedKeyframeRefs.length).toBe(2);
    expect(TimelineSelectionController.isKeyframeSelected(s2, 'kf-1')).toBe(true);
    expect(TimelineSelectionController.isKeyframeSelected(s2, 'kf-2')).toBe(true);

    const s3 = TimelineSelectionController.toggleKeyframe(s2, { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-1' });
    expect(s3.selectedKeyframeRefs.length).toBe(1);
    expect(TimelineSelectionController.isKeyframeSelected(s3, 'kf-1')).toBe(false);
    expect(TimelineSelectionController.isKeyframeSelected(s3, 'kf-2')).toBe(true);
  });

  it('selects all keyframes and clears selection', () => {
    const sAll = TimelineSelectionController.selectAllKeyframes(mockTimeline);
    expect(sAll.selectedKeyframeRefs.length).toBe(3);

    const sCleared = TimelineSelectionController.deselectAllKeyframes();
    expect(sCleared.selectedKeyframeRefs.length).toBe(0);
    expect(sCleared.primarySelectedRef).toBeNull();
  });
});
