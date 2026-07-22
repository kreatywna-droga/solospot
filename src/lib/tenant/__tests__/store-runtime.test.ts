import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Product } from '@/lib/product/ProductTypes'

vi.mock('@/lib/supabase');

const { StoreRuntime } = await import('@/lib/runtime/StoreRuntime')
const { RuntimeResolver } = await import('@/lib/runtime/RuntimeResolver')
const { RuntimeValidator } = await import('@/lib/runtime/RuntimeValidator')
const { TemplateRegistry } = await import('@/lib/template/TemplateRegistry')

describe('Store Runtime Renderer', () => {
  let runtime: InstanceType<typeof StoreRuntime>
  let resolver: InstanceType<typeof RuntimeResolver>
  let validator: InstanceType<typeof RuntimeValidator>

  beforeEach(() => {
    vi.clearAllMocks()
    runtime = new StoreRuntime()
    resolver = new RuntimeResolver()
    validator = new RuntimeValidator()
  })

  it('renders a store from template config', () => {
    const registry = new TemplateRegistry()
    const tpl = registry.getBySlug('fashion-pro')!

    const config = resolver.resolve(
      { id: 'store-1', tenantId: 'demo-fashion', name: 'Fashion Demo Store', slug: 'fashion-demo', domain: null, status: 'ACTIVE', config: { branding: { primaryColor: tpl.theme.primaryColor, secondaryColor: tpl.theme.secondaryColor, font: tpl.theme.font }, pages: tpl.pages, template: 'fashion-pro', publicationStatus: 'PUBLISHED' }, createdAt: '', updatedAt: '' },
      []
    )

    const rendered = runtime.render(config)

    expect(rendered.storeName).toBe('Fashion Demo Store')
    expect(rendered.page).toBeDefined()
    expect(rendered.page.sections.length).toBeGreaterThan(0)
    expect(rendered.theme.primaryColor).toBe(tpl.theme.primaryColor)
    expect(rendered.publicationStatus).toBe('PUBLISHED')
  })

  it('renders with fallback theme when no branding provided', () => {
    const config = resolver.resolve(
      { id: 'store-1', tenantId: 'demo', name: 'Test Store', slug: 'test', domain: null, status: 'ACTIVE', config: {}, createdAt: '', updatedAt: '' },
      []
    )

    const rendered = runtime.render(config)
    expect(rendered.storeName).toBe('Test Store')
    expect(rendered.theme.primaryColor).toBe('#7c3aed')
    expect(rendered.theme.font).toBe('Inter')
  })

  it('selects correct page by slug', () => {
    const config = resolver.resolve(
      { id: 'store-1', tenantId: 'demo', name: 'Store', slug: 'store', domain: null, status: 'ACTIVE', config: { pages: [{ id: 'home', slug: '', name: 'Home', sections: [] }, { id: 'about', slug: 'about', name: 'About', sections: [] }] }, createdAt: '', updatedAt: '' },
      []
    )

    const rendered = runtime.render(config, 'about')
    expect(rendered.page.slug).toBe('about')
    expect(rendered.page.name).toBe('About')
  })

  it('renders products into the result', () => {
    const products: Product[] = [
      { id: 'p1', tenantId: 'demo', storeId: 's1', name: 'Product 1', description: 'Desc', price: 100, currency: 'PLN', images: [], status: 'ACTIVE', createdAt: '', updatedAt: '' },
      { id: 'p2', tenantId: 'demo', storeId: 's1', name: 'Product 2', description: 'Desc', price: 200, currency: 'PLN', images: [], status: 'ACTIVE', createdAt: '', updatedAt: '' },
    ]

    const config = resolver.resolve(
      { id: 'store-1', tenantId: 'demo', name: 'Store', slug: 'store', domain: null, status: 'ACTIVE', config: { pages: [{ id: 'home', slug: '', name: 'Home', sections: [] }] }, createdAt: '', updatedAt: '' },
      products
    )

    const rendered = runtime.render(config)
    expect(rendered.products).toHaveLength(2)
    expect(rendered.products[0].name).toBe('Product 1')
    expect(rendered.products[1].price).toBe(200)
  })

  it('throws when no pages exist', () => {
    expect(() =>
      runtime.render({
        storeId: 'store-1',
        storeName: 'Store',
        theme: { primaryColor: '#000', secondaryColor: '#fff', font: 'Inter' },
        pages: [],
        products: [],
        publicationStatus: 'DRAFT',
      })
    ).toThrow('No pages found in store configuration')
  })

  it('RuntimeValidator rejects invalid config', () => {
    const result = validator.validateConfig({})
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('RuntimeValidator accepts valid config', () => {
    const result = validator.validateConfig({
      storeId: 's1',
      storeName: 'Store',
      theme: { primaryColor: '#000', secondaryColor: '#fff', font: 'Inter' },
      pages: [{ id: 'home', slug: '', name: 'Home', sections: [] }],
    })
    expect(result.valid).toBe(true)
  })
})
