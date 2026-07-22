// ProductRepository.ts
// C9.1: Commerce Persistence — product repository

import { QueryOptions, TenantAwareRepository } from '../interfaces/Repository'

export interface ProductQueryOptions extends QueryOptions {
  categoryId?: string
  isActive?: boolean
  minPrice?: number
  maxPrice?: number
}

export interface ProductRepository extends TenantAwareRepository<Product> {
  findBySlug(tenantId: string, slug: string): Promise<Product | null>
  findByCategory(tenantId: string, categoryId: string, options?: QueryOptions): Promise<Product[]>
  search(tenantId: string, query: string, options?: QueryOptions): Promise<Product[]>
}

export interface Product {
  id: string
  tenantId: string
  slug: string
  name: string
  description: string
  categories: string[]
  pricing: {
    priceGross: number
    priceNet: number
    taxRate: number
    currency: string
  }
  inventory: {
    sku: string
    quantityAvailable: number
    allowBackorder: boolean
  }
  isActive: boolean
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}
