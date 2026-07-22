import { describe, it, expect, beforeEach } from 'vitest';
import { ProductPage, ProductPageData } from '../src/ProductPage';
import { MarketplaceTemplate } from '../../marketplace-core/src/entities';

describe('ProductPage', () => {
  let productPage: ProductPage;

  beforeEach(() => {
    productPage = new ProductPage({
      builder: '3.0.0',
      runtime: '3.0.0',
      componentApi: '1.0.0',
      themeApi: '1.0.0',
      commerceApi: '1.0.0'
    });
  });

  describe('product page data', () => {
    it('should generate product page data', () => {
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
        screenshots: ['https://example.com/screenshot1.png'],
        previewUrl: 'https://example.com',
        compatibility: { builder: '>=3.0', runtime: '>=3.0' },
        ratings: [{ userId: 'u1', score: 5, createdAt: '2026-01-01' }],
        versions: [{ id: 'v1', version: '1.0.0', publishedAt: '2026-01-01', author: { id: 'a1', name: 'A' }, isStable: true, downloads: 100 }],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01'
      };

      const data = productPage.getProductPage(template);

      expect(data.template.id).toBe('test-1');
      expect(data.averageRating).toBe(5);
      expect(data.downloadCount).toBe(100);
    });

    it('should calculate average rating', () => {
      const ratings = [
        { userId: 'u1', score: 5, createdAt: '2026-01-01' },
        { userId: 'u2', score: 3, createdAt: '2026-01-01' },
        { userId: 'u3', score: 4, createdAt: '2026-01-01' }
      ];

      const avg = productPage.calculateAverageRating(ratings);
      expect(avg).toBeCloseTo(4, 1);
    });

    it('should format price', () => {
      const freeTemplate: MarketplaceTemplate = {
        id: 'free-1', slug: 'free', name: 'Free', description: '',
        author: { id: 'a1', name: 'A' }, license: 'MIT', price: null,
        tags: [], categories: [], dependencies: [], screenshots: [], previewUrl: '',
        compatibility: {}, ratings: [], versions: [], createdAt: '', updatedAt: ''
      };

      expect(productPage.formatPrice(freeTemplate)).toBe('Free');

      const paidTemplate: MarketplaceTemplate = {
        ...freeTemplate,
        id: 'paid-1', price: { amount: 99, currency: 'USD', free: false }
      };

      expect(productPage.formatPrice(paidTemplate)).toBe('99 USD');
    });
  });
});