/**
 * AnimationPlaybackController.test.ts — PM30 Playback Controller Unit Tests
 *
 * Node environment — no jsdom.
 */

import { describe, it, expect } from 'vitest';
import { AnimationPlaybackController } from '../AnimationPlaybackController';

describe('PM30 — AnimationPlaybackController', () => {
  it('initializes with default state', () => {
    const controller = new AnimationPlaybackController({ duration: 1000 });
    const state = controller.snapshot();
    expect(state.status).toBe('idle');
    expect(state.currentTime).toBe(0);
    expect(state.duration).toBe(1000);
    expect(state.speed).toBe(1);
    expect(state.loop).toBe(true);
    expect(state.direction).toBe('normal');
  });

  it('throws when duration is not positive', () => {
    expect(() => new AnimationPlaybackController({ duration: 0 })).toThrow();
    expect(() => new AnimationPlaybackController({ duration: -5 })).toThrow();
  });

  it('play/pause/stop/reset transition status correctly', () => {
    const controller = new AnimationPlaybackController({ duration: 1000 });
    controller.play();
    expect(controller.status).toBe('playing');

    controller.pause();
    expect(controller.status).toBe('paused');

    controller.play();
    expect(controller.status).toBe('playing');

    controller.stop();
    expect(controller.status).toBe('stopped');
    expect(controller.currentTime).toBe(0);

    controller.seek(500);
    controller.reset();
    expect(controller.status).toBe('idle');
    expect(controller.currentTime).toBe(0);
  });

  it('advances time when playing respecting speed', () => {
    const controller = new AnimationPlaybackController({ duration: 1000, speed: 2 });
    controller.play();
    controller.advance(100);
    expect(controller.currentTime).toBe(200);
  });

  it('does not advance when paused', () => {
    const controller = new AnimationPlaybackController({ duration: 1000 });
    controller.play();
    controller.advance(100);
    controller.pause();
    controller.advance(100);
    expect(controller.currentTime).toBe(100);
  });

  it('clamps at duration when loop is false and pauses', () => {
    const controller = new AnimationPlaybackController({ duration: 1000, loop: false });
    controller.play();
    controller.advance(1500);
    expect(controller.currentTime).toBe(1000);
    expect(controller.status).toBe('paused');
  });

  it('wraps around when loop is true', () => {
    const controller = new AnimationPlaybackController({ duration: 1000, loop: true });
    controller.play();
    controller.advance(1200);
    expect(controller.currentTime).toBe(200);
  });

it('respects reverse direction', () => {
    const controller = new AnimationPlaybackController({ duration: 1000, direction: 'reverse', loop: false });
    controller.seek(800);
    controller.play();
    controller.advance(100);
    // Reverse moves backward from 800 by 100 → 700.
    expect(controller.currentTime).toBe(700);
  });

  it('seek clamps to valid range', () => {
    const controller = new AnimationPlaybackController({ duration: 1000 });
    controller.seek(-50);
    expect(controller.currentTime).toBe(0);
    controller.seek(500);
    expect(controller.currentTime).toBe(500);
    controller.seek(5000);
    expect(controller.currentTime).toBe(1000);
  });
});
