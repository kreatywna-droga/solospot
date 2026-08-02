import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOutputModeStrategy } from '../OutputModes';
import { createSuccessResult, createErrorResult } from '../RuntimeResult';
import { createRuntimeSection } from '../RuntimeSection';

// Mock StoreRepository and ProductRepository for renderStore testing
vi.mock('@/lib/store/StoreRepository', () => ({
  StoreRepository: vi.fn().mockImplementation(() => ({
    getStoreBySlug: vi.fn().mockImplementation(async (slug: string) => {
      if (slug === 'test-shop') {
        return {
          id: 'store-123',
          tenantId: 'tenant-123',
          name: 'Test Shop',
          config: {
            branding: {
              primaryColor: '#7c3aed',
              secondaryColor: '#ec4899',
              font: 'Inter',
              description: 'Best test shop',
            },
            publicationStatus: 'PUBLISHED',
            pages: [
              {
                id: 'home',
                slug: '',
                name: 'Home',
                sections: [
                  {
                    id: 'hero-1',
                    type: 'hero',
                    label: 'Hero',
                    config: { title: 'Welcome' },
                  },
                  {
                    id: 'products-1',
                    type: 'product-grid',
                    label: 'Products',
                    config: { count: 8 },
                  },
                ],
              },
            ],
          },
        };
      }
      if (slug === 'draft-shop') {
        return {
          id: 'store-456',
          tenantId: 'tenant-456',
          name: 'Draft Shop',
          config: {
            branding: {
              primaryColor: '#000',
              secondaryColor: '#fff',
              font: 'Arial',
            },
            publicationStatus: 'DRAFT',
            pages: [
              {
                id: 'home',
                slug: '',
                name: 'Home',
                sections: [],
              },
            ],
          },
        };
      }
      return null;
    }),
  })),
}));

vi.mock('@/lib/product/ProductRepository', () => ({
  ProductRepository: vi.fn().mockImplementation(() => ({
    getProductsByStore: vi.fn().mockImplementation(async (tenantId: string, storeId: string) => {
      if (storeId === 'store-123') {
        return [
          { id: 'prod-1', name: 'Product 1', description: 'Desc 1', price: 100, currency: 'PLN', images: ['/img1.jpg'] },
          { id: 'prod-2', name: 'Product 2', description: 'Desc 2', price: 200, currency: 'PLN', images: ['/img2.jpg'] },
        ];
      }
      return [];
    }),
  })),
}));

// Import renderStore after mocks are set up
// Note: In test environment, we verify the OutputModeStrategy contracts
// which are the core of the renderStore pipeline

describe('Render Store - Output Mode Strategies', () => {
  describe('LIVE mode', () => {
    const strategy = createOutputModeStrategy('LIVE');

    it('passes sections through unchanged', () => {
      const section = createRuntimeSection('s-1', 'hero', 'Hero', { title: 'Hi' });
      const wrapped = strategy.wrapSection(section, '<h1>Hi</h1>');
      expect(wrapped).toBe('<h1>Hi</h1>');
    });

    it('assembles page as passthrough', () => {
      const page = strategy.assemblePage('<section>body</section>');
      expect(page).toBe('<section>body</section>');
    });

    it('includes all visible sections', () => {
      const section = createRuntimeSection('s-1', 'hero', 'Hero');
      expect(strategy.shouldIncludeInOutput(section)).toBe(true);
    });

    it('excludes invisible sections', () => {
      const section = createRuntimeSection('s-1', 'hero', 'Hero', {}, 0, false);
      expect(strategy.shouldIncludeInOutput(section)).toBe(false);
    });
  });

  describe('PREVIEW mode', () => {
    const strategy = createOutputModeStrategy('PREVIEW');

    it('wraps sections with preview data attributes', () => {
      const section = createRuntimeSection('s-prev-1', 'hero', 'Hero');
      const wrapped = strategy.wrapSection(section, '<h1>Preview</h1>');
      expect(wrapped).toContain('data-preview-id="s-prev-1"');
      expect(wrapped).toContain('data-preview-type="hero"');
      expect(wrapped).toContain('<h1>Preview</h1>');
    });

    it('assembles full HTML document', () => {
      const doc = strategy.assemblePage('<section>preview-body</section>');
      expect(doc).toContain('<!DOCTYPE html>');
      expect(doc).toContain('<body>');
      expect(doc).toContain('preview-body');
    });
  });

  describe('EXPORT mode', () => {
    const strategy = createOutputModeStrategy('EXPORT');

    it('assembles full HTML document for export', () => {
      const doc = strategy.assemblePage('<div>export-content</div>');
      expect(doc).toContain('<!DOCTYPE html>');
      expect(doc).toContain('<body>');
      expect(doc).toContain('export-content');
    });

    it('provides export options', () => {
      const options = strategy.getExportOptions?.();
      expect(options).toMatchObject({
        inlineStyles: true,
        removeScripts: true,
      });
    });

    it('skips draft section types', () => {
      const draftSection = createRuntimeSection('s-1', 'draft-banner', 'Banner');
      expect(strategy.canRenderSection(draftSection, { mode: 'EXPORT' } as any)).toBe(false);

      const normalSection = createRuntimeSection('s-2', 'hero', 'Hero');
      expect(strategy.canRenderSection(normalSection, { mode: 'EXPORT' } as any)).toBe(true);
    });

    it('strips script and style tags', async () => {
      const reg = {
        get: () => ({
          render: async () => '<div>ok</div><script>alert(1)</script><style>.x{}</style>',
        }),
      };
      const renderer = strategy.getSectionRenderer('hero', reg as any);
      const html = await renderer!.render({}, { primaryColor: '#000', secondaryColor: '#fff', font: 'Arial' }, {} as any);
      expect(html).toContain('ok');
      expect(html).not.toContain('<script');
      expect(html).not.toContain('<style');
    });
  });
});

describe('RuntimeResult creation', () => {
  it('creates a success result with correct fields', () => {
    const result = createSuccessResult(
      'store-1',
      'tenant-1',
      'home',
      '1.0.0',
      { id: 'page-1', slug: 'home', name: 'Home', sections: [] },
      [],
      { primaryColor: '#7c3aed', secondaryColor: '#ec4899', font: 'Inter' },
      { mode: 'LIVE', renderedAt: new Date().toISOString() }
    );

    expect(result.success).toBe(true);
    expect(result.storeId).toBe('store-1');
    expect(result.tenantId).toBe('tenant-1');
    expect(result.slug).toBe('home');
    expect(result.mode).toBe('LIVE');
  });

  it('creates an error result with error messages', () => {
    const result = createErrorResult(
      'store-1',
      'tenant-1',
      'home',
      '1.0.0',
      ['Store not found', 'Invalid config']
    );

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Store not found');
    expect(result.errors).toContain('Invalid config');
  });
});

describe('RuntimeSection utilities', () => {
  it('creates a runtime section with defaults', () => {
    const section = createRuntimeSection('s-1', 'hero', 'Hero');
    expect(section.id).toBe('s-1');
    expect(section.type).toBe('hero');
    expect(section.order).toBe(0);
    expect(section.visible).toBe(true);
    expect(section.props).toEqual({});
  });

  it('creates a runtime section with custom props and order', () => {
    const section = createRuntimeSection('s-2', 'product-grid', 'Products', { count: 8 }, 1, true);
    expect(section.props).toEqual({ count: 8 });
    expect(section.order).toBe(1);
  });
});

