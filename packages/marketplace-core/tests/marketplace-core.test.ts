import { describe, it, expect, beforeEach } from 'vitest';
import { MarketplaceSearchEngine, CompatibilityEngine } from '../src/MarketplaceSearchEngine';
import { MarketplaceTemplate } from '../src/entities';

describe('Marketplace Search Engine', () => {
  let searchEngine: MarketplaceSearchEngine;

  const sampleTemplate: MarketplaceTemplate = {
    id: 'template-1',
    slug: 'modern-store',
    name: 'Modern Store',
    description: 'A modern e-commerce template',
    author: { id: 'author-1', name: 'Test Author' },
    license: 'MIT',
    price: { amount: 0, currency: 'USD' },
    tags: ['storefront', 'ecommerce', 'modern'],
    categories: ['retail'],
    dependencies: [],
    screenshots: [],
    previewUrl: 'https://example.com/preview',
    compatibility: { builder: '>=3.0', runtime: '>=3.0' },
    ratings: [],
    versions: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01'
  };

  beforeEach(() => {
    searchEngine = new MarketplaceSearchEngine();
  });

  describe('addTemplate', () => {
    it('should add a template to the registry', () => {
      searchEngine.addTemplate(sampleTemplate);
      expect(searchEngine.getTemplate(sampleTemplate.id)).resolves.toBe(sampleTemplate);
    });
  });

  describe('removeTemplate', () => {
    it('should remove a template from the registry', () => {
      searchEngine.addTemplate(sampleTemplate);
      expect(searchEngine.removeTemplate(sampleTemplate.id)).toBe(true);
      expect(searchEngine.getTemplate(sampleTemplate.id)).resolves.toBeNull();
    });
  });

  describe('search', () => {
    beforeEach(() => {
      searchEngine.addTemplate(sampleTemplate);
      searchEngine.addTemplate({
        ...sampleTemplate,
        id: 'template-2',
        slug: 'classic-store',
        name: 'Classic Store',
        description: 'A classic template',
        tags: ['storefront', 'classic'],
        categories: ['blog']
      });
    });

    it('should search by query', async () => {
      const result = await searchEngine.search({ query: 'modern' });
      expect(result.total).toBe(1);
      expect(result.templates[0].id).toBe('template-1');
    });

    it('should filter by tags', async () => {
      const result = await searchEngine.search({ tags: ['classic'] });
      expect(result.total).toBe(1);
      expect(result.templates[0].id).toBe('template-2');
    });

    it('should filter by categories', async () => {
      const result = await searchEngine.search({ categories: ['retail'] });
      expect(result.total).toBe(1);
    });

    it('should filter by price', async () => {
      const result = await searchEngine.search({ price: 'free' });
      expect(result.total).toBe(2);
    });

    it('should sort by name', async () => {
      const result = await searchEngine.search({ sortBy: 'name' });
      expect(result.templates[0].name).toBe('Classic Store');
    });

    it('should sort by most recent', async () => {
      const result = await searchEngine.search({ sortBy: 'recent' });
      expect(result.templates.length).toBe(2);
    });

    it('should paginate results', async () => {
      const result = await searchEngine.search({ limit: 1, offset: 0 });
      expect(result.templates.length).toBe(1);
    });
  });

  describe('getTemplateBySlug', () => {
    it('should retrieve template by slug', async () => {
      searchEngine.addTemplate(sampleTemplate);
      const result = await searchEngine.getTemplateBySlug('modern-store');
      expect(result).toBe(sampleTemplate);
    });

    it('should return null for non-existent slug', async () => {
      const result = await searchEngine.getTemplateBySlug('non-existent');
      expect(result).toBeNull();
    });
  });
});

describe('Compatibility Engine', () => {
  let engine: CompatibilityEngine;

  beforeEach(() => {
    engine = new CompatibilityEngine();
  });

  it('should return compatible for matching versions', () => {
    const template = {
      id: 'test',
      slug: 'test',
      name: 'Test',
      description: 'Test',
      author: { id: 'a1', name: 'Author' },
      license: 'MIT',
      price: null,
      tags: [],
      categories: [],
      dependencies: [],
      screenshots: [],
      previewUrl: '',
      compatibility: { builder: '>=3.0' },
      ratings: [],
      versions: [],
      createdAt: '',
      updatedAt: ''
    };

    const result = engine.checkCompatibility(template, {
      builder: '3.0.0',
      runtime: '3.0.0',
      componentApi: '1.0.0',
      themeApi: '1.0.0',
      commerceApi: '1.0.0'
    });

    expect(result.compatible).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('should detect version mismatch', () => {
    const template = {
      id: 'test',
      slug: 'test',
      name: 'Test',
      description: 'Test',
      author: { id: 'a1', name: 'Author' },
      license: 'MIT',
      price: null,
      tags: [],
      categories: [],
      dependencies: [],
      screenshots: [],
      previewUrl: '',
      compatibility: { builder: '>=4.0.0' },
      ratings: [],
      versions: [],
      createdAt: '',
      updatedAt: ''
    };

    const result = engine.checkCompatibility(template, {
      builder: '3.0.0',
      runtime: '3.0.0',
      componentApi: '1.0.0',
      themeApi: '1.0.0',
      commerceApi: '1.0.0'
    });

    expect(result.compatible).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});