import { describe, expect, it } from 'vitest';
import {
  ALL_BENCHMARK_DATASETS,
  BENCHMARK_SCENARIOS,
  LARGE_STORE,
  MEDIUM_STORE,
  OFFICIAL_PERFORMANCE_TARGETS,
  SMALL_STORE,
  XL_STORE,
  XXL_STORE,
} from './index';

describe('Runtime Benchmark Dataset Library (@web-factor/runtime-benchmark-datasets)', () => {
  it('should export reference datasets ranging from 10 to 1,000 sections', () => {
    expect(SMALL_STORE.sectionCount).toBe(10);
    expect(MEDIUM_STORE.sectionCount).toBe(50);
    expect(LARGE_STORE.sectionCount).toBe(200);
    expect(XL_STORE.sectionCount).toBe(500);
    expect(XXL_STORE.sectionCount).toBe(1000);
    expect(Object.keys(ALL_BENCHMARK_DATASETS).length).toBe(5);
  });

  it('should export valid benchmark scenarios with expectations', () => {
    expect(BENCHMARK_SCENARIOS.fullRender.renderMode).toBe('LIVE');
    expect(BENCHMARK_SCENARIOS.previewRender.renderMode).toBe('PREVIEW');
    expect(BENCHMARK_SCENARIOS.cacheHit.expectation.expectedCacheHitRatioPercent).toBe(100);
  });

  it('should export official performance targets', () => {
    expect(OFFICIAL_PERFORMANCE_TARGETS.previewSyncMaxLatencyMs).toBe(16);
    expect(OFFICIAL_PERFORMANCE_TARGETS.minCacheHitRatioPercent).toBe(85);
  });
});
