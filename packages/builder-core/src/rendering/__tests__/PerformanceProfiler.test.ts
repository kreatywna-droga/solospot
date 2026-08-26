import { describe, it, expect } from 'vitest';
import { PerformanceProfiler } from '../PerformanceProfiler';
import { FrameTiming } from '../FrameTiming';

describe('PerformanceProfiler & FrameTiming', () => {
  it('should record frame metrics and compute summary statistics', () => {
    const profiler = new PerformanceProfiler();
    profiler.start();

    profiler.recordFrame({
      frameIndex: 0,
      timestampMs: 0,
      totalRenderTimeMs: 16.6,
      evaluationTimeMs: 5.0,
      compositionTimeMs: 11.6,
      nodeCount: 10,
      dirtyRegionCount: 1,
      isCached: false,
    });

    profiler.recordFrame({
      frameIndex: 1,
      timestampMs: 16,
      totalRenderTimeMs: 10.0,
      evaluationTimeMs: 3.0,
      compositionTimeMs: 7.0,
      nodeCount: 10,
      dirtyRegionCount: 0,
      isCached: true,
    });

    const summary = profiler.stop();
    expect(summary.totalFramesRendered).toBe(2);
    expect(summary.maxFrameTimeMs).toBe(16.6);
    expect(summary.minFrameTimeMs).toBe(10.0);
    expect(summary.averageFrameTimeMs).toBe(13.3);
  });

  it('should track FPS and delta timing accurately', () => {
    const timing = new FrameTiming();
    const dt1 = timing.tick(1000);
    expect(dt1).toBe(0);

    const dt2 = timing.tick(1016);
    expect(dt2).toBe(16);
  });
});
