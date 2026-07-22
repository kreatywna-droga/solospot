// MemoryCategoryRepository.ts
// C9.1: Commerce Persistence — in-memory implementation of CategoryRepository

import { MemoryRepository } from '../providers/MemoryRepository'
import { CategoryRepository } from './CategoryRepository'
import { Category } from './CategoryRepository'

export class MemoryCategoryRepository extends MemoryRepository<Category> implements CategoryRepository {
  async findBySlug(tenantId: string, slug: string): Promise<Category | null> {
    const results = await this.findAll({ filters: { tenantId, slug } })
    return results[0] ?? null
  }
}
