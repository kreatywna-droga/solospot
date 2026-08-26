/**
 * RenderMetrics.ts — Sprint S10 Performance Profiling
 *
 * Metric types and containers for render timing, evaluation duration, and memory.
 * Pure DTO logic. NO Browser API dependencies.
 */

export interface FrameMetricRecord {
  readonly frameIndex: number;
  readonly timestampMs: number;
  readonly totalRenderTimeMs: number;
  readonly evaluationTimeMs: number;
  readonly compositionTimeMs: number;
  readonly nodeCount: number;
  readonly dirtyRegionCount: number;
  readonly isCached: boolean;
}

export interface SessionMetricsSummary {
  readonly totalFramesRendered: number;
  readonly totalRenderDurationMs: number;
  readonly averageFrameTimeMs: number;
  readonly maxFrameTimeMs: number;
  readonly minFrameTimeMs: number;
  readonly averageFps: number;
  readonly cacheHitRatio: number;
}
