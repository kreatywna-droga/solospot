/**
 * AnimationRuntime.test.ts — PM30 Animation Runtime Foundation Tests
 *
 * Node environment — no jsdom required.
 * Verifies EasingEngine, TimelineEvaluator, and PlaybackController.
 */

import { describe, it, expect } from 'vitest';
import type { AnimationTimeline } from '../AnimationTypes';
import { EasingEngine } from '../EasingEngine';
import { TimelineEvaluator } from '../TimelineEvaluator';
import { PlaybackController } from '../PlaybackController';

function createSampleTimeline(): AnimationTimeline {
  return {
    id: 'timeline-rt-1',
    targetNodeId: 'node-hero',
    trigger: { type: 'onLoad' },
    playback: { repeatCount: 1, loop: false, fillMode: 'forwards', direction: 'normal', speed: 1.0 },
    clips: [
      {
        id: 'clip-1',
        name: 'Slide & Fade',
        duration: 1000,
        delay: 0,
        tracks: [
          {
            id: 'tr-opacity',
            propertyKey: 'opacity',
            keyframes: [
              { id: 'k1', timeOffset: 0, value: 0, easing: { type: 'linear' } },
              { id: 'k2', timeOffset: 1000, value: 1, easing: { type: 'linear' } },
            ],
          },
          {
            id: 'tr-translate',
            propertyKey: 'translateY',
            keyframes: [
              { id: 'k3', timeOffset: 0, value: 100, easing: { type: 'ease-out' } },
              { id: 'k4', timeOffset: 1000, value: 0, easing: { type: 'ease-out' } },
            ],
          },
        ],
      },
    ],
  };
}

describe('PM30 — Animation Runtime Foundation', () => {
  it('should calculate linear and ease-in ratios accurately', () => {
    expect(EasingEngine.evaluate(0, { type: 'linear' })).toBe(0);
    expect(EasingEngine.evaluate(0.5, { type: 'linear' })).toBe(0.5);
    expect(EasingEngine.evaluate(1.0, { type: 'linear' })).toBe(1.0);
    expect(EasingEngine.evaluate(0.5, { type: 'ease-in' })).toBe(0.25);
  });

  it('should interpolate intermediate keyframe values at time t', () => {
    const timeline = createSampleTimeline();
    const propsAt500ms = TimelineEvaluator.evaluateClip(timeline.clips[0], 500);

    expect(propsAt500ms.opacity).toBe(0.5);
    expect(typeof propsAt500ms.translateY).toBe('number');
  });

  it('should manage playback state transitions (play, pause, seek, tick)', () => {
    const timeline = createSampleTimeline();
    const controller = new PlaybackController(timeline);

    expect(controller.getState()).toBe('idle');
    controller.play();
    expect(controller.getState()).toBe('playing');

    const props1 = controller.tick(500);
    expect(props1.opacity).toBe(0.5);
    expect(controller.getCurrentTime()).toBe(500);

    controller.pause();
    expect(controller.getState()).toBe('paused');

    controller.seek(1000);
    controller.play();
    const propsEnd = controller.tick(0);
    expect(propsEnd.opacity).toBe(1.0);
  });
});
