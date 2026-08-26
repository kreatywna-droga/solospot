/**
 * TimelineSnappingUX.test.ts — Sprint S24 Timeline Snapping Vitest Suite
 * Node environment — no jsdom required.
 */

import { describe, expect, it } from 'vitest';
import { AnimationTimeline } from '../../../../builder-core/src/animation/AnimationTypes';
import { TimelineSnappingController } from '../TimelineSnappingController';

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
          keyframes: [{ id: 'kf-1', timeOffset: 500, value: 1, easing: { type: 'linear' } }],
        },
      ],
    },
  ],
};

describe('S24 — TimelineSnappingUX', () => {
  it('snaps to playhead position', () => {
    const res = TimelineSnappingController.snapTime(295, mockTimeline, [], 300, {
      magneticThresholdMs: 15,
      snapToPlayhead: true,
    });

    expect(res.isSnapped).toBe(true);
    expect(res.snappedTimeMs).toBe(300);
    expect(res.activeTarget?.type).toBe('playhead');
  });

  it('snaps to keyframe time offset', () => {
    const res = TimelineSnappingController.snapTime(505, mockTimeline, [], null, {
      magneticThresholdMs: 15,
      snapToKeyframes: true,
    });

    expect(res.isSnapped).toBe(true);
    expect(res.snappedTimeMs).toBe(500);
    expect(res.activeTarget?.type).toBe('keyframe');
  });

  it('snaps to FPS frame interval (60fps = 16.666ms per frame)', () => {
    const res = TimelineSnappingController.snapTime(34, null, [], null, {
      magneticThresholdMs: 10,
      snapToFpsFrame: true,
      fps: 60,
    });

    expect(res.isSnapped).toBe(true);
    expect(Math.round(res.snappedTimeMs)).toBe(33); // 2 frames * 16.666ms = 33.33ms
  });
});
