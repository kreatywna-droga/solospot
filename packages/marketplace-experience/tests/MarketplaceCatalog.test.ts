import { MarketplaceCatalog } from '../src/MarketplaceCatalog';
import { MarketplaceSearchEngine } from '../../marketplace-core/src/MarketplaceSearchEngine';
import { MarketplaceTemplate } from '../../marketplace-core/src/entities';
import { describe, it, expect, beforeEach } from 'vitest';

describe('MarketplaceCatalog', () => {
  let catalog: MarketplaceCatalog;
  let searchEngine: MarketplaceSearchEngine;

  beforeEach(() => {
    searchEngine = new MarketplaceSearchEngine();
    catalog = new MarketplaceCatalog(searchEngine);
  });

  describe('search', () => {
    it('should search templates', async () => {
      const template: MarketplaceTemplate = {
        id: 'test-1',
        slug: 'test-template',
        name: 'Test Template',
        description: 'A test template',
        author: { id: 'author-1', name: 'Author' },
        license: 'MIT',
        price: null,
        tags: ['test'],
        categories: ['storefront'],
        dependencies: [],
        screenshots: [],
        previewUrl: 'https://example.com',
        compatibility: {},
        ratings: [],
        versions: [{ id: 'v1', version: '1.0.0', publishedAt: '2026-01-01', author: { id: 'a1', name: 'A' }, isStable: true, downloads: 100 }],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01'
      };

      searchEngine.addTemplate(template);

      const results = await catalog.search({ query: 'test' });
      expect(results.total).toBe(1);
      expect(results.templates[0].id).toBe('test-1');
    });
  });

  describe('filters', () => {
    it('should get free templates', async () => {
      const template: MarketplaceTemplate = {
        id: 'free-1',
        slug: 'free-template',
        name: 'Free Template',
        description: 'Free',
        author: { id: 'author-1', name: 'Author' },
        license: 'MIT',
        price: null,
        tags: [],
        categories: [],
        dependencies: [],
        screenshots: [],
        previewUrl: '',
        compatibility: {},
        ratings: [],
        versions: [{ id: 'v1', version: '1.0.0', publishedAt: '', author: { id: '', name: '' }, isStable: true, downloads: 0 }],
        createdAt: '',
        updatedAt: ''
      };

      searchEngine.addTemplate(template);

      const templates = await catalog.getFreeTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should get popular templates', async () => {
      const templates = await catalog.getPopular(5);
      expect(Array.isArray(templates)).toBe(true);
    });
  });
});