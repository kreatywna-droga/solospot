// MemoryProductRepository.ts
// C9.1: Commerce Persistence — in-memory implementation of ProductRepository

import { MemoryRepository } from '../providers/MemoryRepository'
import { ProductRepository, ProductQueryOptions } from './ProductRepository'
import { Product } from './ProductRepository'

export class MemoryProductRepository extends MemoryRepository<Product> implements ProductRepository {
  async findBySlug(tenantId: string, slug: string): Promise<Product | null> {
    const results = await this.findAll({ filters: { tenantId, slug } })
    return results[0] ?? null
  }

  async findByCategory(tenantId: string, categoryId: string, options?: ProductQueryOptions): Promise<Product[]> {
    const results = await this.findAll({ ...options, filters: { ...options?.filters, tenantId } })
    return results.filter(p => p.categories.includes(categoryId))
  }

  async search(tenantId: string, query: string, options?: ProductQueryOptions): Promise<Product[]> {
    const results = await this.findAll({ ...options, filters: { ...options?.filters, tenantId } })
    const q = query.toLowerCase()
    return results.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
  }
}
