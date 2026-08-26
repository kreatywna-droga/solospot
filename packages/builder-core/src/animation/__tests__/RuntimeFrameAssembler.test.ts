/**
 * RuntimeFrameAssembler.test.ts — PM32 Frame Assembler Unit Tests
 *
 * Node environment — no jsdom.
 */

import { describe, it, expect } from 'vitest';
import type { AnimationTimeline } from '../AnimationTypes';
import type { RuntimeFrame } from '../AnimationRuntimeTypes';
import { RuntimeFrameAssembler, interpolateFrame } from '../RuntimeFrameAssembler';

function createTimeline(): AnimationTimeline {
  return {
    id: 'timeline-1',
    targetNodeId: 'node-sec-hero',
    trigger: { type: 'onLoad' },
    playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
    clips: [
      {
        id: 'clip-1',
        name: 'Clip',
        duration: 1000,
        delay: 0,
        tracks: [
          {
            id: 'track-opacity',
            propertyKey: 'opacity',
            keyframes: [
              { id: 'kf-0', timeOffset: 0, value: 0, easing: { type: 'linear' } },
              { id: 'kf-1', timeOffset: 1000, value: 1, easing: { type: 'linear' } },
            ],
          },
          {
            id: 'track-x',
            propertyKey: 'transform.translateX',
            keyframes: [
              { id: 'kf-x0', timeOffset: 0, value: '0px', easing: { type: 'linear' } },
              { id: 'kf-x1', timeOffset: 1000, value: '100px', easing: { type: 'linear' } },
            ],
          },
        ],
      },
    ],
  };
}

describe('PM32 — RuntimeFrameAssembler', () => {
  it('assembles a resolved batch with interpolated values', () => {
    const timeline = createTimeline();
    const batch = RuntimeFrameAssembler.assemble(timeline, 500);
    expect(batch.clipId).toBe('clip-1');
    expect(batch.time).toBe(500);
    expect(batch.values.opacity).toBeCloseTo(0.5, 5);
    expect(batch.values['transform.translateX']).toBe('50px');
  });

  it('returns an empty batch when no clip is active', () => {
    const timeline = createTimeline();
    const batch = RuntimeFrameAssembler.assemble(timeline, 1500);
    expect(batch.clipId).toBeNull();
    expect(batch.values).toEqual({});
  });

it('interpolateFrame resolves a single frame via the interpolator', () => {
    const frame = {
      clipId: 'clip-1',
      trackId: 'track-opacity',
      propertyKey: 'opacity',
      clipTime: 500,
      from: { id: 'kf-0', timeOffset: 0, value: 0, easing: { type: 'linear' as const } },
      to: { id: 'kf-1', timeOffset: 1000, value: 1, easing: { type: 'linear' as const } },
      normalizedProgress: 0.5,
    } as RuntimeFrame;
    expect(interpolateFrame(frame)).toBeCloseTo(0.5, 5);
  });

  it('uses the from value when to is null (single keyframe)', () => {
    const timeline = createTimeline();
    timeline.clips[0].tracks[0].keyframes = [
      { id: 'kf-only', timeOffset: 0, value: 42, easing: { type: 'linear' } },
    ];
    const batch = RuntimeFrameAssembler.assemble(timeline, 300);
    expect(batch.values.opacity).toBe(42);
  });
});
