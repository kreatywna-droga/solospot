/**
 * PerformanceProfiler.ts — Sprint S10 Performance Profiling
 *
 * Profiler recording frame render timings, bottleneck detection, and metrics.
 * Pure logic. NO DOM or Browser API dependencies.
 */

import { FrameMetricRecord, SessionMetricsSummary } from './RenderMetrics';
import { RenderStatistics } from './RenderStatistics';

export class PerformanceProfiler {
  private records: FrameMetricRecord[] = [];
  private isProfiling: boolean = false;

  public start(): void {
    this.records = [];
    this.isProfiling = true;
  }

  public stop(): SessionMetricsSummary {
    this.isProfiling = false;
    return this.getSummary();
  }

  public recordFrame(record: FrameMetricRecord): void {
    if (!this.isProfiling) return;
    this.records.push(record);
  }

  public getRecords(): ReadonlyArray<FrameMetricRecord> {
    return this.records;
  }

  public getSummary(cacheHitRatio = 0): SessionMetricsSummary {
    return RenderStatistics.summarize(this.records, cacheHitRatio);
  }

  public clear(): void {
    this.records = [];
  }
}
