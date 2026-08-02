export type OutputRenderMode = 'LIVE' | 'PREVIEW' | 'EXPORT';

export interface BenchmarkExpectation {
  expectedRenderTimeMs: number;
  expectedMemoryUsageMb: number;
  expectedCacheHitRatioPercent: number;
}

export interface BenchmarkDataset {
  id: string;
  name: string;
  sectionCount: number;
  storeSlug: string;
  totalAssetsCount: number;
  totalProductsCount: number;
}

export interface BenchmarkScenario {
  id: string;
  name: string;
  renderMode: OutputRenderMode;
  targetFunction: 'renderStore' | 'renderStoreSection' | 'renderStorePartial';
  expectation: BenchmarkExpectation;
}

export interface BenchmarkResultReference {
  scenarioId: string;
  datasetId: string;
  measuredRenderTimeMs: number;
  measuredMemoryUsageMb: number;
  status: 'PASS' | 'WARN' | 'FAIL';
}
