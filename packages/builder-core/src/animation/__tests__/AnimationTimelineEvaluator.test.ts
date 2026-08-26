/**
 * AnimationTimelineEvaluator.test.ts — PM30 Timeline Evaluator Unit Tests
 *
 * Node environment — no jsdom.
 */

import { describe, it, expect } from 'vitest';
import type { AnimationTimeline } from '../AnimationTypes';
import { AnimationTimelineEvaluator } from '../AnimationTimelineEvaluator';

function createTimeline(): AnimationTimeline {
  return {
    id: 'timeline-1',
    targetNodeId: 'node-sec-hero',
    trigger: { type: 'onLoad' },
    playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal' },
    clips: [
      {
        id: 'clip-fade',
        name: 'Fade',
        duration: 1000,
        delay: 0,
        tracks: [
          {
            id: 'track-opacity',
            propertyKey: 'opacity',
            keyframes: [
              { id: 'kf-0', timeOffset: 0, value: 0, easing: { type: 'linear' } },
              { id: 'kf-1', timeOffset: 1000, value: 1, easing: { type: 'ease-out' } },
            ],
          },
        ],
      },
    ],
  };
}

describe('PM30 — AnimationTimelineEvaluator', () => {
  it('selects the active clip within its time window', () => {
    const timeline = createTimeline();
    const activeClip = AnimationTimelineEvaluator.selectActiveClip(timeline, 500);
    expect(activeClip).not.toBeNull();
    expect(activeClip!.id).toBe('clip-fade');
  });

  it('returns null when time is outside any clip', () => {
    const timeline = createTimeline();
    expect(AnimationTimelineEvaluator.selectActiveClip(timeline, 1500)).toBeNull();
    expect(AnimationTimelineEvaluator.selectActiveClip(timeline, -100)).toBeNull();
  });

  it('picks the LAST overlapping clip when clips overlap', () => {
    const timeline = createTimeline();
    timeline.clips.push({
      id: 'clip-override',
      name: 'Override',
      duration: 1000,
      delay: 0,
      tracks: [],
    });
    const active = AnimationTimelineEvaluator.selectActiveClip(timeline, 200);
    expect(active!.id).toBe('clip-override');
  });

  it('produces an evaluation result with track frames and normalized progress', () => {
    const timeline = createTimeline();
    const result = AnimationTimelineEvaluator.evaluate(timeline, 500);
    expect(result.activeClip).not.toBeNull();
    expect(result.tracks).toHaveLength(1);

    const track = result.tracks[0];
    expect(track.track.propertyKey).toBe('opacity');
    expect(track.frames).toHaveLength(1);

    const frame = track.frames[0];
    expect(frame.from.timeOffset).toBe(0);
    expect(frame.to!.timeOffset).toBe(1000);
    expect(frame.normalizedProgress).toBeCloseTo(0.5, 5);
  });

it('clamps normalized progress at boundaries', () => {
    const timeline = createTimeline();

    const atStart = AnimationTimelineEvaluator.evaluate(timeline, 0);
    expect(atStart.tracks[0].frames[0].normalizedProgress).toBe(0);

    // time=999 is within the clip [0,1000) and near the end of the window.
    const nearEnd = AnimationTimelineEvaluator.evaluate(timeline, 999);
    const endFrame = nearEnd.tracks[0].frames[0];
    expect(endFrame.normalizedProgress).toBeCloseTo(0.999, 3);
    expect(endFrame.to!.timeOffset).toBe(1000);
  });

  it('handles a single-keyframe track as a constant frame', () => {
    const timeline = createTimeline();
    timeline.clips[0].tracks[0].keyframes = [
      { id: 'kf-only', timeOffset: 0, value: 42, easing: { type: 'linear' } },
    ];
    const result = AnimationTimelineEvaluator.evaluate(timeline, 300);
    expect(result.tracks[0].frames).toHaveLength(1);
    expect(result.tracks[0].frames[0].to).toBeNull();
    expect(result.tracks[0].frames[0].normalizedProgress).toBe(0);
  });
});
