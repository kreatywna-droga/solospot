export interface PerformanceTargetThresholds {
  renderStoreMaxLatencyMs: number;
  renderSectionMaxLatencyMs: number;
  renderPartialMaxLatencyMs: number;
  previewSyncMaxLatencyMs: number;
  minCacheHitRatioPercent: number;
  maxHeapMemoryMb: number;
}

export const OFFICIAL_PERFORMANCE_TARGETS: PerformanceTargetThresholds = {
  renderStoreMaxLatencyMs: 25,
  renderSectionMaxLatencyMs: 5,
  renderPartialMaxLatencyMs: 8,
  previewSyncMaxLatencyMs: 16, // 60 FPS frame threshold
  minCacheHitRatioPercent: 85,
  maxHeapMemoryMb: 128,
};
