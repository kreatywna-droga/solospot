import { TemplateRegistry } from './TemplateRegistry'
import { StoreService } from '@/lib/store/StoreService'
import { ProductService } from '@/lib/product/ProductService'
import type { TemplateDefinition } from './TemplateTypes'

export class TemplateInstaller {
  private readonly registry: TemplateRegistry
  private readonly storeService: StoreService
  private readonly productService: ProductService

  constructor() {
    this.registry = new TemplateRegistry()
    this.storeService = new StoreService()
    this.productService = new ProductService()
  }

  async install(tenantId: string, storeId: string, templateSlug: string) {
    const template = this.registry.getBySlug(templateSlug)
    if (!template) {
      throw new Error(`Template not found: ${templateSlug}`)
    }

    const branding = {
      primaryColor: template.theme.primaryColor,
      secondaryColor: template.theme.secondaryColor,
      font: template.theme.font,
      description: template.theme.description || template.description,
    }

    await this.storeService.updateBranding(tenantId, storeId, branding)

    for (const productSeed of template.products) {
      await this.productService.createProduct(tenantId, {
        name: productSeed.name,
        description: productSeed.description,
        price: productSeed.price,
        currency: productSeed.currency || template.currency,
        images: productSeed.images || [],
        storeId,
        status: 'DRAFT',
      })
    }

    await this.storeService.updateStore(tenantId, storeId, {
      config: {
        branding,
        template: templateSlug,
        pages: template.pages,
      },
    })

    await this.storeService.markStoreReady(tenantId, storeId)

    return { template: template.slug, storeId }
  }
}
