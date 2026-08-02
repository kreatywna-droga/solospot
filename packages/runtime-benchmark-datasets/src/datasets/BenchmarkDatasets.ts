import type { BenchmarkDataset } from '../contracts/BenchmarkContracts';

export const SMALL_STORE: BenchmarkDataset = {
  id: 'ds_small_10',
  name: 'Small Store (10 Sections)',
  sectionCount: 10,
  storeSlug: 'bench-small-10',
  totalAssetsCount: 15,
  totalProductsCount: 12,
};

export const MEDIUM_STORE: BenchmarkDataset = {
  id: 'ds_medium_50',
  name: 'Medium Store (50 Sections)',
  sectionCount: 50,
  storeSlug: 'bench-medium-50',
  totalAssetsCount: 80,
  totalProductsCount: 60,
};

export const LARGE_STORE: BenchmarkDataset = {
  id: 'ds_large_200',
  name: 'Large Store (200 Sections)',
  sectionCount: 200,
  storeSlug: 'bench-large-200',
  totalAssetsCount: 350,
  totalProductsCount: 250,
};

export const XL_STORE: BenchmarkDataset = {
  id: 'ds_xl_500',
  name: 'XL Store (500 Sections)',
  sectionCount: 500,
  storeSlug: 'bench-xl-500',
  totalAssetsCount: 900,
  totalProductsCount: 650,
};

export const XXL_STORE: BenchmarkDataset = {
  id: 'ds_xxl_1000',
  name: 'XXL Store (1000 Sections)',
  sectionCount: 1000,
  storeSlug: 'bench-xxl-1000',
  totalAssetsCount: 1800,
  totalProductsCount: 1500,
};

export const ALL_BENCHMARK_DATASETS: Record<string, BenchmarkDataset> = {
  SMALL_STORE,
  MEDIUM_STORE,
  LARGE_STORE,
  XL_STORE,
  XXL_STORE,
};
