import type { StoreRuntimeConfig, RuntimePage, RuntimeSection, RuntimeTheme, SectionComponentProps } from './types'
import type { Product } from '@/lib/product/ProductTypes'

export interface RenderedPage {
  storeName: string
  page: RuntimePage
  theme: RuntimeTheme
  products: SectionComponentProps['products']
  publicationStatus: string
}

export class StoreRenderer {
  render(storeName: string, config: StoreRuntimeConfig, pageSlug: string, products: Product[]): RenderedPage {
    const pages = config.pages || []
    const branding = config.branding

    const theme: RuntimeTheme = {
      primaryColor: branding?.primaryColor || '#1a1a2e',
      secondaryColor: branding?.secondaryColor || '#e94560',
      font: branding?.font || 'Inter',
      description: branding?.description,
    }

    const page = pages.find((p) => p.slug === pageSlug) || pages[0]

    if (!page) {
      throw new Error('No pages found in store configuration')
    }

    return {
      storeName,
      page,
      theme,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        currency: p.currency,
        images: p.images,
      })),
      publicationStatus: config.publicationStatus || 'DRAFT',
    }
  }
}
