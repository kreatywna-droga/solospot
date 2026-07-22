// SupabaseProductRepository.ts
// C9.1: Commerce Persistence — Supabase product repository

import { SupabaseRepository } from './SupabaseRepository'
import { Product, ProductQueryOptions } from '../repositories/ProductRepository'

export class SupabaseProductRepository extends SupabaseRepository<Product> {
  protected getTableName(): string {
    return 'products'
  }

  async findBySlug(tenantId: string, slug: string): Promise<Product | null> {
    const results = await this.findAll({
      filters: { tenant_id: tenantId, slug },
    })
    return results[0] ?? null
  }

  async findByCategory(tenantId: string, categoryId: string, options?: ProductQueryOptions): Promise<Product[]> {
    const results = await this.findAll({
      ...options,
      filters: { ...options?.filters, tenant_id: tenantId },
    })
    return results.filter(p => p.categories.includes(categoryId))
  }

  async search(tenantId: string, query: string, options?: ProductQueryOptions): Promise<Product[]> {
    const results = await this.findAll({
      ...options,
      filters: { ...options?.filters, tenant_id: tenantId },
    })
    const q = query.toLowerCase()
    return results.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
  }
}
