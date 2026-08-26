import { describe, it, expect } from 'vitest';
import {
  createMultiSelectionState,
  toggleKeyframeSelection,
  rangeSelectKeyframes,
  selectKeyframesInMarquee,
} from '../TimelineMultiSelection';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';

const mockTimeline: AnimationTimeline = {
  id: 'tl-multi-sel',
  targetNodeId: 'node-1',
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

describe('TimelineMultiSelection (PM39, ETAP 3)', () => {
  it('toggles keyframe selection via Ctrl/Cmd + click gesture', () => {
    let state = createMultiSelectionState();
    const ref1 = { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-1' };
    const ref2 = { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-2' };

    state = toggleKeyframeSelection(state, ref1);
    expect(state.selectedKeyframeRefs).toHaveLength(1);
    expect(state.primarySelectedRef?.keyframeId).toBe('kf-1');

    state = toggleKeyframeSelection(state, ref2);
    expect(state.selectedKeyframeRefs).toHaveLength(2);
    expect(state.primarySelectedRef?.keyframeId).toBe('kf-2');

    // Toggle off ref1
    state = toggleKeyframeSelection(state, ref1);
    expect(state.selectedKeyframeRefs).toHaveLength(1);
    expect(state.selectedKeyframeRefs[0].keyframeId).toBe('kf-2');
  });

  it('range selects keyframes between start and end via Shift + click gesture', () => {
    const state = createMultiSelectionState();
    const startRef = { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-1' };
    const endRef = { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-3' };

    const nextState = rangeSelectKeyframes(
      state,
      mockTimeline,
      'clip-1',
      'track-1',
      startRef,
      endRef
    );

    expect(nextState.selectedKeyframeRefs).toHaveLength(3);
    expect(nextState.primarySelectedRef?.keyframeId).toBe('kf-3');
  });

  it('selects keyframes inside marquee selection rectangle', () => {
    const state = createMultiSelectionState();
    const positions = [
      { ref: { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-1' }, x: 10, y: 50 },
      { ref: { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-2' }, x: 100, y: 50 },
      { ref: { clipId: 'clip-1', trackId: 'track-1', keyframeId: 'kf-3' }, x: 300, y: 50 },
    ];

    const box = { startX: 0, startY: 0, endX: 150, endY: 100 };
    const selectedState = selectKeyframesInMarquee(state, positions, box);

    expect(selectedState.selectedKeyframeRefs).toHaveLength(2);
    expect(selectedState.selectedKeyframeRefs.map((k) => k.keyframeId)).toEqual(['kf-1', 'kf-2']);
  });
});
