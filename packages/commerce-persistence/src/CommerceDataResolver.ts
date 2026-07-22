// CommerceDataResolver.ts
// C9.5: Commerce Persistence — resolves live commerce data into the runtime

import { ProductRepository } from './repositories/ProductRepository'
import { CategoryRepository } from './repositories/CategoryRepository'

export interface CommerceProduct {
  id: string
  tenantId: string
  slug: string
  name: string
  description: string
  categories: string[]
  pricing: { priceGross: number; priceNet: number; taxRate: number; currency: string }
  inventory: { sku: string; quantityAvailable: number; allowBackorder: boolean }
  isActive: boolean
}

export interface CommerceCategory {
  id: string
  tenantId: string
  slug: string
  name: string
  parentId?: string
}

export interface CommerceDataProvider {
  getProducts(limit?: number): CommerceProduct[]
  getProduct(slug: string): CommerceProduct | undefined
  getByCategory(categoryId: string): CommerceProduct[]
  getCategories(): CommerceCategory[]
}

/**
 * CommerceDataResolver loads commerce data for a tenant and exposes it as a
 * CommerceDataProvider that the runtime/Components can consume. It does NOT
 * import runtime-core directly — it only produces a plain data object, which
 * is attached to RuntimeContext by the caller (PublishPipeline / C9.5 glue).
 */
export class CommerceDataResolver {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly categoryRepo?: CategoryRepository,
  ) {}

  async resolve(tenantId: string): Promise<CommerceDataProvider> {
    const products = await this.productRepo.findByTenant(tenantId, { orderBy: 'createdAt', orderDir: 'desc' })
    const categories = this.categoryRepo
      ? await this.categoryRepo.findByTenant(tenantId)
      : []

    const productList = products as unknown as CommerceProduct[]
    const categoryList = categories as unknown as CommerceCategory[]

    return {
      getProducts(limit?: number) {
        return limit ? productList.slice(0, limit) : productList
      },
      getProduct(slug: string) {
        return productList.find(p => p.slug === slug)
      },
      getByCategory(categoryId: string) {
        return productList.filter(p => p.categories.includes(categoryId))
      },
      getCategories() {
        return categoryList
      },
    }
  }
}
