/**
 * RuntimeScheduler.test.ts — PM32 Deterministic Runtime Scheduler Unit Tests
 *
 * Node environment — no jsdom.
 */

import { describe, it, expect } from 'vitest';
import type { AnimationTimeline } from '../AnimationTypes';
import { RuntimeScheduler } from '../RuntimeScheduler';

function createTimeline(loop = false): AnimationTimeline {
  return {
    id: 'timeline-1',
    targetNodeId: 'node-sec-hero',
    trigger: { type: 'onLoad' },
    playback: { repeatCount: 1, loop, fillMode: 'forwards', direction: 'normal' },
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

describe('PM32 — RuntimeScheduler', () => {
  it('tick returns a RuntimeTick with batch, state and time', () => {
    const scheduler = new RuntimeScheduler({ timeline: createTimeline() });
    scheduler.play();
    const tick = scheduler.tick(500);
    expect(tick.batch.clipId).toBe('clip-1');
    expect(tick.time).toBe(500);
    expect(tick.state.status).toBe('playing');
    expect(tick.batch.values.opacity).toBeCloseTo(0.5, 5);
  });

  it('advance returns the resolved batch', () => {
    const scheduler = new RuntimeScheduler({ timeline: createTimeline() });
    scheduler.play();
    const batch = scheduler.advance(500);
    expect(batch.values.opacity).toBeCloseTo(0.5, 5);
    expect(scheduler.time).toBe(500);
  });

  it('does not advance when paused', () => {
    const scheduler = new RuntimeScheduler({ timeline: createTimeline() });
    scheduler.play();
    scheduler.tick(100);
    scheduler.pause();
    scheduler.tick(1000);
    expect(scheduler.time).toBe(100);
  });

  it('reset rewinds to idle at time 0', () => {
    const scheduler = new RuntimeScheduler({ timeline: createTimeline() });
    scheduler.play();
    scheduler.tick(500);
    scheduler.reset();
    expect(scheduler.time).toBe(0);
    expect(scheduler.state.status).toBe('idle');
  });

  it('seek jumps to an absolute time', () => {
    const scheduler = new RuntimeScheduler({ timeline: createTimeline() });
    scheduler.seek(800);
    expect(scheduler.time).toBe(800);
    expect(scheduler.current().values.opacity).toBeCloseTo(0.8, 5);
  });

  it('stop rewinds to time 0', () => {
    const scheduler = new RuntimeScheduler({ timeline: createTimeline() });
    scheduler.play();
    scheduler.tick(500);
    scheduler.stop();
    expect(scheduler.time).toBe(0);
  });

  it('clamps at duration when loop is false', () => {
    const scheduler = new RuntimeScheduler({ timeline: createTimeline(false) });
    scheduler.play();
    scheduler.tick(1500);
    expect(scheduler.time).toBe(1000);
  });

  it('wraps around when loop is true', () => {
    const scheduler = new RuntimeScheduler({ timeline: createTimeline(true) });
    scheduler.play();
    scheduler.tick(1200);
    expect(scheduler.time).toBe(200);
  });
});
