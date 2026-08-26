/**
 * RenderStatistics.ts — Sprint S10 Performance Profiling
 *
 * Aggregator for overall render session throughput, hit rates, and timings.
 * Pure logic. NO DOM dependencies.
 */

import { FrameMetricRecord, SessionMetricsSummary } from './RenderMetrics';

export class RenderStatistics {
  public static summarize(
    records: ReadonlyArray<FrameMetricRecord>,
    cacheHitRatio = 0
  ): SessionMetricsSummary {
    if (records.length === 0) {
      return {
        totalFramesRendered: 0,
        totalRenderDurationMs: 0,
        averageFrameTimeMs: 0,
        maxFrameTimeMs: 0,
        minFrameTimeMs: 0,
        averageFps: 0,
        cacheHitRatio,
      };
    }

    let totalDuration = 0;
    let minTime = Infinity;
    let maxTime = -Infinity;

    for (const rec of records) {
      totalDuration += rec.totalRenderTimeMs;
      minTime = Math.min(minTime, rec.totalRenderTimeMs);
      maxTime = Math.max(maxTime, rec.totalRenderTimeMs);
    }

    const avgFrameTime = totalDuration / records.length;
    const avgFps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;

    return {
      totalFramesRendered: records.length,
      totalRenderDurationMs: totalDuration,
      averageFrameTimeMs: avgFrameTime,
      maxFrameTimeMs: maxTime === -Infinity ? 0 : maxTime,
      minFrameTimeMs: minTime === Infinity ? 0 : minTime,
      averageFps: avgFps,
      cacheHitRatio,
    };
  }
}
