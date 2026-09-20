import { describe, it, expect } from 'vitest';
import {
  ALL_CURATED_ASSETS,
  getTotalAssetCount,
  getCategoryCounts,
  getAssetById,
  getAssetsByCategory,
  queryAssets,
  getHeroCandidates,
  getTeamCandidates,
} from '../UniversalAssetLibrary';

describe('UniversalAssetLibrary', () => {
  it('contains at least 500 license-cleared assets', () => {
    const total = getTotalAssetCount();
    expect(total).toBeGreaterThanOrEqual(500);
    expect(ALL_CURATED_ASSETS.length).toBe(total);
  });

  it('covers all 12 visual categories with required minimum quotas', () => {
    const counts = getCategoryCounts();
    expect(counts['people']).toBeGreaterThanOrEqual(60);
    expect(counts['business']).toBeGreaterThanOrEqual(40);
    expect(counts['tech']).toBeGreaterThanOrEqual(50);
    expect(counts['product']).toBeGreaterThanOrEqual(60);
    expect(counts['architecture']).toBeGreaterThanOrEqual(40);
    expect(counts['nature']).toBeGreaterThanOrEqual(50);
    expect(counts['creative']).toBeGreaterThanOrEqual(60);
    expect(counts['travel']).toBeGreaterThanOrEqual(30);
    expect(counts['food']).toBeGreaterThanOrEqual(30);
    expect(counts['background']).toBeGreaterThanOrEqual(50);
    expect(counts['video']).toBeGreaterThanOrEqual(20);
    expect(counts['3d']).toBeGreaterThanOrEqual(20);
  });

  it('retrieves assets by ID in O(1)', () => {
    const asset = getAssetById('ast-peo-001');
    expect(asset).toBeDefined();
    expect(asset?.category).toBe('people');
    expect(asset?.previewUrl).toContain('unsplash.com');
  });

  it('queries assets by search term and filters', () => {
    const results = queryAssets({
      query: 'developer',
      limit: 10,
    });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      const match =
        (r.title?.toLowerCase().includes('developer') ?? false) ||
        (r.tags?.some((t) => t.toLowerCase().includes('developer')) ?? false) ||
        (r.subcategory?.toLowerCase().includes('developer') ?? false);
      expect(match).toBe(true);
    }
  });

  it('retrieves hero candidates with landscape orientation', () => {
    const heroes = getHeroCandidates('technology');
    expect(heroes.length).toBeGreaterThan(0);
    for (const hero of heroes) {
      expect(hero.orientation).toBe('landscape');
    }
  });

  it('retrieves team candidates', () => {
    const team = getTeamCandidates('saas');
    expect(team.length).toBeGreaterThan(0);
    for (const member of team) {
      expect(member.category).toBe('people');
    }
  });
});
