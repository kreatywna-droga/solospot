/**
 * RenderProgress.test.ts — Sprint S27
 *
 * Tests for RenderProgressTracker:
 * start, advanceToFrame, step, complete, reset, ETA, throughput.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RenderProgressTracker } from '../RenderProgressTracker';

describe('RenderProgressTracker', () => {
  let tracker: RenderProgressTracker;

  beforeEach(() => {
    tracker = new RenderProgressTracker({ totalFrames: 300, targetFps: 30, startTimeMs: 0 });
  });

  it('starts at 0% progress', () => {
    const p = tracker.getProgress(0);
    expect(p.currentFrame).toBe(0);
    expect(p.progressPercentage).toBe(0);
    expect(p.elapsedTimeMs).toBe(0);
    expect(p.renderingFps).toBe(0);
  });

  it('start() returns initial snapshot', () => {
    const p = tracker.start(0);
    expect(p.currentFrame).toBe(0);
    expect(p.progressPercentage).toBe(0);
  });

  it('advanceToFrame computes progress percentage correctly', () => {
    const p = tracker.advanceToFrame(150, 1000);
    expect(p.currentFrame).toBe(150);
    expect(p.progressPercentage).toBe(50);
  });

  it('advanceToFrame clamps to [0, totalFrames]', () => {
    const over = tracker.advanceToFrame(999, 5000);
    expect(over.currentFrame).toBe(300);
    expect(over.progressPercentage).toBe(100);

    tracker.reset(0);
    const under = tracker.advanceToFrame(-10, 1000);
    expect(under.currentFrame).toBe(0);
  });

  it('step increments frame by delta', () => {
    tracker.start(0);
    tracker.step(60, 500);
    const p = tracker.step(60, 1000);
    expect(p.currentFrame).toBe(120);
  });

  it('complete() sets progress to 100%', () => {
    const p = tracker.complete(3000);
    expect(p.currentFrame).toBe(300);
    expect(p.progressPercentage).toBe(100);
    expect(p.estimatedRemainingMs).toBe(0);
  });

  it('calculates renderingFps from elapsed time', () => {
    // 150 frames in 1000ms → 150 fps
    const p = tracker.advanceToFrame(150, 1000);
    expect(p.renderingFps).toBeCloseTo(150, 0);
  });

  it('calculates ETA from rendering FPS', () => {
    // 150 frames done in 1000ms → 150 fps → 150 remaining at 150fps → ~1000ms
    const p = tracker.advanceToFrame(150, 1000);
    expect(p.estimatedRemainingMs).toBeCloseTo(1000, -2);
  });

  it('falls back to targetFps ETA when no frames rendered yet', () => {
    // 300 frames at 30fps = 10000ms
    const p = tracker.getProgress(0);
    expect(p.estimatedRemainingMs).toBe(10000);
  });

  it('reset() returns tracker to 0', () => {
    tracker.advanceToFrame(100, 1000);
    const p = tracker.reset(5000);
    expect(p.currentFrame).toBe(0);
    expect(p.progressPercentage).toBe(0);
    expect(p.elapsedTimeMs).toBe(0);
  });

  it('handles totalFrames=1 without division errors', () => {
    const tiny = new RenderProgressTracker({ totalFrames: 1, startTimeMs: 0 });
    const p = tiny.complete(100);
    expect(p.progressPercentage).toBe(100);
    expect(p.estimatedRemainingMs).toBe(0);
  });
});
