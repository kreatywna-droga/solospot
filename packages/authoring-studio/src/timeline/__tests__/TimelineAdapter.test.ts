import { describe, it, expect } from 'vitest';
import type { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';
import {
  toTimelineClipViewModel,
  toTimelineTrackViewModel,
  toTimelineKeyframeViewModel,
  toTimelineViewModel,
  toTimelinePanelViewModel,
} from '../TimelinePanelAdapter';

const timeline: AnimationTimeline = {
  id: 'timeline-1',
  targetNodeId: 'sec-1',
  trigger: { type: 'onLoad' },
  playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
  clips: [
    {
      id: 'clip-1',
      name: 'Fade In',
      duration: 800,
      delay: 100,
      tracks: [
        {
          id: 'track-1',
          propertyKey: 'opacity',
          keyframes: [
            { id: 'kf-1', timeOffset: 0, value: 0, easing: { type: 'linear' } },
            { id: 'kf-2', timeOffset: 800, value: 1, easing: { type: 'ease-out' } },
          ],
        },
      ],
    },
  ],
};

describe('TimelinePanelAdapter (PM36, ETAP 4)', () => {
  it('maps clips to view models with nested tracks/keyframes', () => {
    const clips = toTimelineClipViewModel(timeline);
    expect(clips).toHaveLength(1);
    expect(clips[0].id).toBe('clip-1');
    expect(clips[0].duration).toBe(800);
    expect(clips[0].delay).toBe(100);
    expect(clips[0].trackCount).toBe(1);
    expect(clips[0].keyframeCount).toBe(2);
    expect(clips[0].tracks).toHaveLength(1);
    expect(clips[0].tracks[0].keyframes).toHaveLength(2);
  });

  it('maps tracks for a given clip', () => {
    const tracks = toTimelineTrackViewModel(timeline, 'clip-1');
    expect(tracks).toHaveLength(1);
    expect(tracks[0].propertyKey).toBe('opacity');
    expect(tracks[0].keyframeCount).toBe(2);
  });

  it('returns empty for unknown clip', () => {
    expect(toTimelineTrackViewModel(timeline, 'nope')).toEqual([]);
  });

  it('maps keyframes for a given track', () => {
    const kfs = toTimelineKeyframeViewModel(timeline, 'clip-1', 'track-1');
    expect(kfs).toHaveLength(2);
    expect(kfs[0].timeOffset).toBe(0);
    expect(kfs[1].easingType).toBe('ease-out');
  });

  it('builds a timeline view model with totals', () => {
    const vm = toTimelineViewModel('sec-1', timeline);
    expect(vm.nodeId).toBe('sec-1');
    expect(vm.clipCount).toBe(1);
    expect(vm.totalDuration).toBe(800 + 100);
  });

  it('builds a full panel view model with viewport and grid', () => {
    const vm = toTimelinePanelViewModel('sec-1', timeline);
    expect(vm.viewport.pixelsPerMs).toBeGreaterThan(0);
    expect(vm.grid.ticks.length).toBeGreaterThan(0);
    expect(vm.timeline.clipCount).toBe(1);
  });
});
