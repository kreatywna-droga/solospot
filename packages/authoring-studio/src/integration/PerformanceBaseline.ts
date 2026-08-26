/**
 * PerformanceBaseline.ts — PM47 Performance Baseline Models (ETAP 6)
 *
 * Performance baseline metric data models for Studio operation timings.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime benchmarks.
 */

export interface PerformanceTimingMetric {
  readonly operationName: string;
  readonly targetBaselineMs: number;
  readonly acceptableThresholdMs: number;
}

export interface PerformanceBaselineReport {
  readonly reportId: string;
  readonly studioVersion: string;
  readonly metrics: ReadonlyArray<PerformanceTimingMetric>;
  readonly generatedAt: number;
}

export const STANDARD_PERFORMANCE_BASELINES: ReadonlyArray<PerformanceTimingMetric> = [
  { operationName: 'document_load', targetBaselineMs: 50, acceptableThresholdMs: 150 },
  { operationName: 'timeline_sync', targetBaselineMs: 10, acceptableThresholdMs: 30 },
  { operationName: 'export_pipeline', targetBaselineMs: 100, acceptableThresholdMs: 300 },
  { operationName: 'publish_pipeline', targetBaselineMs: 120, acceptableThresholdMs: 400 },
  { operationName: 'import_pipeline', targetBaselineMs: 80, acceptableThresholdMs: 250 },
];

export function createPerformanceBaselineReport(
  studioVersion: string = 'RC1'
): PerformanceBaselineReport {
  return {
    reportId: `perf-${Date.now()}`,
    studioVersion,
    metrics: STANDARD_PERFORMANCE_BASELINES,
    generatedAt: Date.now(),
  };
}
