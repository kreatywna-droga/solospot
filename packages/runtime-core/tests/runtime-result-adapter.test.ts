import { describe, it, expect } from 'vitest';
import { RuntimeResultAdapter } from '../src/adapters/RuntimeResultAdapter';
import { RuntimeResult } from '../src/RuntimeResult';

describe('RuntimeResultAdapter', () => {
  const mockLegacyResult = {
    storeName: 'Test Shop',
    page: {
      id: 'page-1',
      slug: 'home',
      name: 'Home Page',
      sections: [
        { id: 'sec-1', type: 'hero', label: 'Hero', config: { title: 'Welcome' } },
        { id: 'sec-2', type: 'product-grid', label: 'Products', config: { count: 8 } },
      ],
    },
    theme: {
      primaryColor: '#7c3aed',
      secondaryColor: '#ec4899',
      font: 'Inter',
      logo: '/logo.png',
      favicon: '/favicon.ico',
      description: 'Test shop description',
    },
    products: [
      { id: 'prod-1', name: 'Product 1', description: 'Desc 1', price: 100, currency: 'PLN', images: ['/img1.jpg'] },
      { id: 'prod-2', name: 'Product 2', description: 'Desc 2', price: 200, currency: 'PLN', images: ['/img2.jpg'] },
    ],
    navigation: [
      { label: 'Home', href: '/', children: [] },
      { label: 'Shop', href: '/shop', children: [{ label: 'Category', href: '/shop/cat' }] },
    ],
    seo: {
      title: 'Test Shop',
      description: 'Best shop ever',
      ogImage: '/og.png',
    },
    publicationStatus: 'PUBLISHED',
  };

  describe('toRuntimeCoreResult', () => {
    it('should transform legacy result to core result with all required fields', () => {
      const core = RuntimeResultAdapter.toRuntimeCoreResult(
        mockLegacyResult,
        'tenant-123',
        'store-456',
        '1.0.0',
        'home',
        'LIVE'
      );

      expect(core.success).toBe(true);
      expect(core.tenantId).toBe('tenant-123');
      expect(core.storeId).toBe('store-456');
      expect(core.slug).toBe('home');
      expect(core.version).toBe('1.0.0');
      expect(core.mode).toBe('LIVE');
    });

    it('should map page correctly', () => {
      const core = RuntimeResultAdapter.toRuntimeCoreResult(
        mockLegacyResult,
        'tenant-123',
        'store-456',
        '1.0.0',
        'home'
      );

      expect(core.page.id).toBe('page-1');
      expect(core.page.slug).toBe('home');
      expect(core.page.name).toBe('Home Page');
      expect(core.page.sections).toHaveLength(2);
    });

    it('should map sections with proper RuntimeSection shape', () => {
      const core = RuntimeResultAdapter.toRuntimeCoreResult(
        mockLegacyResult,
        'tenant-123',
        'store-456',
        '1.0.0',
        'home'
      );

      expect(core.sections).toHaveLength(2);
      expect(core.sections[0]).toEqual({
        id: 'sec-1',
        type: 'hero',
        label: 'Hero',
        props: { title: 'Welcome' },
        order: 0,
        visible: true,
      });
      expect(core.sections[1].type).toBe('product-grid');
    });

    it('should map theme correctly', () => {
      const core = RuntimeResultAdapter.toRuntimeCoreResult(
        mockLegacyResult,
        'tenant-123',
        'store-456',
        '1.0.0',
        'home'
      );

      expect(core.theme).toEqual({
        primaryColor: '#7c3aed',
        secondaryColor: '#ec4899',
        font: 'Inter',
        logo: '/logo.png',
        favicon: '/favicon.ico',
        description: 'Test shop description',
      });
    });

    it('should put unmapped fields in metadata', () => {
      const core = RuntimeResultAdapter.toRuntimeCoreResult(
        mockLegacyResult,
        'tenant-123',
        'store-456',
        '1.0.0',
        'home'
      );

      expect(core.metadata).toBeDefined();
      expect(core.metadata?.products).toHaveLength(2);
      expect(core.metadata?.navigation).toHaveLength(2);
      expect(core.metadata?.seo).toBeDefined();
      expect(core.metadata?.publicationStatus).toBe('PUBLISHED');
      expect(core.metadata?.storeName).toBe('Test Shop');
    });

    it('should handle optional fields gracefully', () => {
      const minimalLegacy = {
        storeName: 'Minimal Shop',
        page: {
          id: 'page-1',
          slug: '',
          name: 'Home',
          sections: [],
        },
        theme: {
          primaryColor: '#000',
          secondaryColor: '#fff',
          font: 'Arial',
        },
        products: [],
        publicationStatus: 'DRAFT',
      };

      const core = RuntimeResultAdapter.toRuntimeCoreResult(
        minimalLegacy,
        'tenant-1',
        'store-1',
        '1.0.0',
        ''
      );

      expect(core.success).toBe(true);
      expect(core.page.sections).toHaveLength(0);
      expect(core.metadata?.navigation).toBeUndefined();
      expect(core.metadata?.seo).toBeUndefined();
    });

    it('should accept different modes', () => {
      const modes = ['LIVE', 'PREVIEW', 'EXPORT'] as const;

      for (const mode of modes) {
        const core = RuntimeResultAdapter.toRuntimeCoreResult(
          mockLegacyResult,
          'tenant-123',
          'store-456',
          '1.0.0',
          'home',
          mode
        );
        expect(core.mode).toBe(mode);
      }
    });

    it('should default mode to LIVE', () => {
      const core = RuntimeResultAdapter.toRuntimeCoreResult(
        mockLegacyResult,
        'tenant-123',
        'store-456',
        '1.0.0',
        'home'
      );
      expect(core.mode).toBe('LIVE');
    });

    it('should set renderedAt to undefined', () => {
      const core = RuntimeResultAdapter.toRuntimeCoreResult(
        mockLegacyResult,
        'tenant-123',
        'store-456',
        '1.0.0',
        'home'
      );
      expect(core.renderedAt).toBeUndefined();
    });

    it('should set errors to undefined for successful transform', () => {
      const core = RuntimeResultAdapter.toRuntimeCoreResult(
        mockLegacyResult,
        'tenant-123',
        'store-456',
        '1.0.0',
        'home'
      );
      expect(core.errors).toBeUndefined();
    });
  });

  describe('toLegacyResult (transitional)', () => {
    const mockCoreResult: RuntimeResult = {
      success: true,
      tenantId: 'tenant-123',
      storeId: 'store-456',
      slug: 'home',
      version: '1.0.0',
      page: {
        id: 'page-1',
        slug: 'home',
        name: 'Home Page',
        sections: [
          { id: 'sec-1', type: 'hero', label: 'Hero', props: { title: 'Welcome' }, order: 0, visible: true },
        ],
      },
      sections: [
        { id: 'sec-1', type: 'hero', label: 'Hero', props: { title: 'Welcome' }, order: 0, visible: true },
      ],
      theme: {
        primaryColor: '#7c3aed',
        secondaryColor: '#ec4899',
        font: 'Inter',
        logo: '/logo.png',
      },
      errors: undefined,
      metadata: {
        products: [
          { id: 'prod-1', name: 'Product 1', description: 'Desc 1', price: 100, currency: 'PLN', images: ['/img1.jpg'] },
        ],
        navigation: [
          { label: 'Home', href: '/', children: [] },
        ],
        seo: { title: 'Test', description: 'Desc', ogImage: '/og.png' },
        publicationStatus: 'PUBLISHED',
        storeName: 'Test Shop',
      },
      mode: 'LIVE',
      renderedAt: undefined,
    };

    it('should transform core result back to legacy shape', () => {
      const legacy = RuntimeResultAdapter.toLegacyResult(mockCoreResult);

      expect(legacy.storeName).toBe('Test Shop');
      expect(legacy.page.id).toBe('page-1');
      expect(legacy.page.slug).toBe('home');
      expect(legacy.page.name).toBe('Home Page');
      expect(legacy.page.sections).toHaveLength(1);
    });

    it('should map theme correctly', () => {
      const legacy = RuntimeResultAdapter.toLegacyResult(mockCoreResult);

      expect(legacy.theme.primaryColor).toBe('#7c3aed');
      expect(legacy.theme.secondaryColor).toBe('#ec4899');
      expect(legacy.theme.font).toBe('Inter');
      expect(legacy.theme.logo).toBe('/logo.png');
    });

    it('should map products from metadata', () => {
      const legacy = RuntimeResultAdapter.toLegacyResult(mockCoreResult);

      expect(legacy.products).toHaveLength(1);
      expect(legacy.products[0].name).toBe('Product 1');
      expect(legacy.products[0].price).toBe(100);
    });

    it('should map navigation from metadata', () => {
      const legacy = RuntimeResultAdapter.toLegacyResult(mockCoreResult);

      expect(legacy.navigation).toHaveLength(1);
      expect(legacy.navigation?.[0]?.label).toBe('Home');
    });

    it('should map seo from metadata', () => {
      const legacy = RuntimeResultAdapter.toLegacyResult(mockCoreResult);

      expect(legacy.seo?.title).toBe('Test');
      expect(legacy.seo?.description).toBe('Desc');
      expect(legacy.seo?.ogImage).toBe('/og.png');
    });

    it('should map publicationStatus from metadata', () => {
      const legacy = RuntimeResultAdapter.toLegacyResult(mockCoreResult);

      expect(legacy.publicationStatus).toBe('PUBLISHED');
    });

    it('should use storeName from metadata or fallback to page name', () => {
      const legacy = RuntimeResultAdapter.toLegacyResult(mockCoreResult);
      expect(legacy.storeName).toBe('Test Shop');
    });

    it('should fallback to page name when storeName not in metadata', () => {
      const coreNoStoreName = {
        ...mockCoreResult,
        metadata: {
          ...mockCoreResult.metadata,
          storeName: undefined,
        },
      };
      const legacy = RuntimeResultAdapter.toLegacyResult(coreNoStoreName);
      expect(legacy.storeName).toBe('Home Page');
    });
  });
});