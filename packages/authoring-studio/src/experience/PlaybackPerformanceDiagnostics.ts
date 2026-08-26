/**
 * PlaybackPerformanceDiagnostics.ts — Sprint S12 Performance & Diagnostics Tracker
 *
 * Records frame timing, render timing, dropped-frame metrics, cache hit rates,
 * target vs actual FPS, and timing jitter for real-time playback & scrubbing.
 *
 * NO DOM, NO React, NO window. Pure DTO and analytics tracker.
 */

export interface FrameDiagnosticMetrics {
  readonly frameIndex: number;
  readonly timestampMs: number;
  readonly frameTimeMs: number;
  readonly renderTimeMs: number;
  readonly isDropped: boolean;
  readonly isCached: boolean;
}

export interface PlaybackPerformanceReport {
  readonly totalFramesProcessed: number;
  readonly totalRenderTimeMs: number;
  readonly averageFrameTimeMs: number;
  readonly averageRenderTimeMs: number;
  readonly droppedFrameCount: number;
  readonly cacheHitRate: number;
  readonly targetFps: number;
  readonly actualFps: number;
  readonly jitterMs: number;
}

export class PlaybackPerformanceDiagnostics {
  private targetFps: number;
  private frameHistory: FrameDiagnosticMetrics[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;
  private maxHistorySize = 300;

  constructor(targetFps: number = 60, maxHistorySize: number = 300) {
    this.targetFps = targetFps;
    this.maxHistorySize = maxHistorySize;
  }

  public recordFrame(metrics: FrameDiagnosticMetrics): void {
    if (metrics.isCached) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    this.frameHistory.push(metrics);

    if (this.frameHistory.length > this.maxHistorySize) {
      this.frameHistory.shift();
    }
  }

  public reset(): void {
    this.frameHistory = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  public getReport(): PlaybackPerformanceReport {
    const count = this.frameHistory.length;
    if (count === 0) {
      return {
        totalFramesProcessed: 0,
        totalRenderTimeMs: 0,
        averageFrameTimeMs: 0,
        averageRenderTimeMs: 0,
        droppedFrameCount: 0,
        cacheHitRate: 0,
        targetFps: this.targetFps,
        actualFps: 0,
        jitterMs: 0,
      };
    }

    let sumFrameTime = 0;
    let sumRenderTime = 0;
    let droppedCount = 0;
    let frameIntervals: number[] = [];

    for (let i = 0; i < count; i++) {
      const f = this.frameHistory[i];
      sumFrameTime += f.frameTimeMs;
      sumRenderTime += f.renderTimeMs;
      if (f.isDropped) droppedCount++;

      if (i > 0) {
        const interval = f.timestampMs - this.frameHistory[i - 1].timestampMs;
        if (interval > 0) frameIntervals.push(interval);
      }
    }

    const avgFrameTime = sumFrameTime / count;
    const avgRenderTime = sumRenderTime / count;
    const totalCache = this.cacheHits + this.cacheMisses;
    const cacheHitRate = totalCache > 0 ? this.cacheHits / totalCache : 0;
    const actualFps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;

    // Calculate jitter standard deviation
    let jitterMs = 0;
    if (frameIntervals.length > 0) {
      const targetInterval = 1000 / this.targetFps;
      const devSum = frameIntervals.reduce((acc, val) => acc + Math.pow(val - targetInterval, 2), 0);
      jitterMs = Math.sqrt(devSum / frameIntervals.length);
    }

    return {
      totalFramesProcessed: count,
      totalRenderTimeMs: sumRenderTime,
      averageFrameTimeMs: avgFrameTime,
      averageRenderTimeMs: avgRenderTime,
      droppedFrameCount: droppedCount,
      cacheHitRate,
      targetFps: this.targetFps,
      actualFps,
      jitterMs,
    };
  }
}
