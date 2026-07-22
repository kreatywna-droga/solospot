import type { Store } from '@/lib/store/StoreTypes'
import type { StoreConfig } from '@/lib/store/StoreTypes'
import type { Product } from '@/lib/product/ProductTypes'
import type { TemplateDefinition } from '@/lib/template/TemplateTypes'
import type { StoreRuntimeConfig, RuntimeTheme, RuntimePage, RuntimeProduct } from './RuntimeTypes'
import { TemplateRegistry } from '@/lib/template/TemplateRegistry'
import { RuntimeValidator } from './RuntimeValidator'
import { RuntimeSectionAdapter } from '../../../packages/runtime-core/src/adapters'

export class RuntimeResolver {
  private readonly templateRegistry: TemplateRegistry
  private readonly validator: RuntimeValidator

  constructor() {
    this.templateRegistry = new TemplateRegistry()
    this.validator = new RuntimeValidator()
  }

  resolve(store: Store, products: Product[]): StoreRuntimeConfig {
    const storeConfig = (store.config || {}) as StoreConfig
    const branding = storeConfig.branding || {}

    const theme: RuntimeTheme = {
      primaryColor: branding.primaryColor || '#7c3aed',
      secondaryColor: branding.secondaryColor || '#ec4899',
      font: branding.font || 'Inter',
      logo: branding.logo,
      favicon: branding.favicon,
      description: branding.description,
    }

    const runtimeProducts: RuntimeProduct[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      currency: p.currency,
      images: p.images,
    }))

    const template = storeConfig.template
      ? this.templateRegistry.getBySlug(storeConfig.template)
      : undefined

    const pages = this.resolvePages(storeConfig, template)
    const publicationStatus = storeConfig.publicationStatus || 'DRAFT'

    const config: StoreRuntimeConfig = {
      storeId: store.id,
      storeName: store.name,
      theme,
      pages,
      products: runtimeProducts,
      publicationStatus,
      template: storeConfig.template,
    }

    const validation = this.validator.validateConfig(config)
    if (!validation.valid) {
      console.warn('RuntimeResolver: Config validation warnings:', validation.errors)
    }

    return config
  }

  canRender(status?: string): boolean {
    return this.validator.canRender(status)
  }

  isPubliclyAccessible(status?: string): boolean {
    return this.validator.isPubliclyAccessible(status)
  }

  private resolvePages(storeConfig: StoreConfig, template?: TemplateDefinition | null): RuntimePage[] {
    let legacyPages: RuntimePage[]

    if (storeConfig.pages && Array.isArray(storeConfig.pages) && storeConfig.pages.length > 0) {
      legacyPages = storeConfig.pages as RuntimePage[]
    } else if (template) {
      legacyPages = template.pages as RuntimePage[]
    } else {
      legacyPages = [
        {
          id: 'home',
          slug: '',
          name: 'Strona główna',
          sections: [
            { id: 'hero-1', type: 'hero', label: 'Hero', config: { title: storeConfig.branding?.description || 'Witaj w naszym sklepie' } },
            { id: 'products-1', type: 'product-grid', label: 'Produkty', config: {} },
            { id: 'footer-1', type: 'footer', label: 'Stopka', config: {} },
          ],
        },
      ]
    }

    return legacyPages.map((page) => ({
      ...page,
      sections: page.sections.map((section) =>
        RuntimeSectionAdapter.toLegacySection(
          RuntimeSectionAdapter.toRuntimeSection(section)
        )
      ),
    }))
  }
}
