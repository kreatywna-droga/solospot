import type { BenchmarkScenario } from '../contracts/BenchmarkContracts';

export const BENCHMARK_SCENARIOS: Record<string, BenchmarkScenario> = {
  fullRender: {
    id: 'scen_full_render',
    name: 'Full Store Page Render',
    renderMode: 'LIVE',
    targetFunction: 'renderStore',
    expectation: {
      expectedRenderTimeMs: 15,
      expectedMemoryUsageMb: 45,
      expectedCacheHitRatioPercent: 0,
    },
  },
  partialRender: {
    id: 'scen_partial_render',
    name: 'Incremental Partial Render',
    renderMode: 'LIVE',
    targetFunction: 'renderStorePartial',
    expectation: {
      expectedRenderTimeMs: 4,
      expectedMemoryUsageMb: 15,
      expectedCacheHitRatioPercent: 90,
    },
  },
  sectionRender: {
    id: 'scen_section_render',
    name: 'Single Section Render',
    renderMode: 'LIVE',
    targetFunction: 'renderStoreSection',
    expectation: {
      expectedRenderTimeMs: 2,
      expectedMemoryUsageMb: 10,
      expectedCacheHitRatioPercent: 95,
    },
  },
  previewRender: {
    id: 'scen_preview_render',
    name: 'Builder Canvas Preview Render',
    renderMode: 'PREVIEW',
    targetFunction: 'renderStore',
    expectation: {
      expectedRenderTimeMs: 16,
      expectedMemoryUsageMb: 50,
      expectedCacheHitRatioPercent: 85,
    },
  },
  exportRender: {
    id: 'scen_export_render',
    name: 'Static Export Build Render',
    renderMode: 'EXPORT',
    targetFunction: 'renderStore',
    expectation: {
      expectedRenderTimeMs: 25,
      expectedMemoryUsageMb: 80,
      expectedCacheHitRatioPercent: 0,
    },
  },
  cacheHit: {
    id: 'scen_cache_hit',
    name: 'Runtime Cache Accelerated Hit',
    renderMode: 'LIVE',
    targetFunction: 'renderStore',
    expectation: {
      expectedRenderTimeMs: 1.5,
      expectedMemoryUsageMb: 8,
      expectedCacheHitRatioPercent: 100,
    },
  },
  cacheMiss: {
    id: 'scen_cache_miss',
    name: 'Runtime Cache Warmup Miss',
    renderMode: 'LIVE',
    targetFunction: 'renderStore',
    expectation: {
      expectedRenderTimeMs: 18,
      expectedMemoryUsageMb: 48,
      expectedCacheHitRatioPercent: 0,
    },
  },
};
