/**
 * AnimationRuntimeBridge.test.ts — PM32 Runtime Bridge Unit Tests
 *
 * Node environment — no jsdom.
 */

import { describe, it, expect } from 'vitest';
import type { AnimationTimeline } from '../AnimationTypes';
import type { RuntimeState } from '../AnimationRuntimeTypes';
import { AnimationRuntimeBridge } from '../AnimationRuntimeBridge';
import { RuntimeFrameCache } from '../RuntimeFrameCache';

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
        ],
      },
    ],
  };
}

function makeState(): RuntimeState {
  return {
    status: 'playing',
    currentTime: 500,
    duration: 1000,
    speed: 1,
    loop: false,
    direction: 'normal',
  };
}

describe('PM32 — AnimationRuntimeBridge', () => {
  it('evaluateFrame returns a resolved batch from timeline + state + time', () => {
    const bridge = new AnimationRuntimeBridge();
    const batch = bridge.evaluateFrame(createTimeline(), makeState(), 500);
    expect(batch.clipId).toBe('clip-1');
    expect(batch.time).toBe(500);
    expect(batch.values.opacity).toBeCloseTo(0.5, 5);
  });

  it('returns an empty batch when time is outside any clip', () => {
    const bridge = new AnimationRuntimeBridge();
    const batch = bridge.evaluateFrame(createTimeline(), makeState(), 9999);
    expect(batch.clipId).toBeNull();
    expect(batch.values).toEqual({});
  });

  it('is side-effect free across repeated calls', () => {
    const bridge = new AnimationRuntimeBridge();
    const timeline = createTimeline();
    const a = bridge.evaluateFrame(timeline, makeState(), 500);
    const b = bridge.evaluateFrame(timeline, makeState(), 500);
    expect(a).toEqual(b);
  });

  it('uses the cache to memoize identical (timeline, time) lookups', () => {
    const cache = new RuntimeFrameCache();
    const bridge = new AnimationRuntimeBridge({ cache });
    const timeline = createTimeline();
    const first = bridge.evaluateFrame(timeline, makeState(), 500);
    expect(cache.has('timeline-1', 500)).toBe(true);
    // Second call hits the cache and returns an equal batch.
    const second = bridge.evaluateFrame(timeline, makeState(), 500);
    expect(second).toEqual(first);
  });

  it('evaluateStructure exposes the raw PM30 evaluation result', () => {
    const bridge = new AnimationRuntimeBridge();
    const result = bridge.evaluateStructure(createTimeline(), 500);
    expect(result.activeClip).not.toBeNull();
    expect(result.activeClip!.id).toBe('clip-1');
    expect(result.tracks).toHaveLength(1);
  });
});
