// CategoryRepository.ts
// C9.1: Commerce Persistence — category repository

import { QueryOptions, TenantAwareRepository } from '../interfaces/Repository'

export interface Category {
  id: string
  tenantId: string
  slug: string
  name: string
  parentId?: string
  createdAt: string
  updatedAt: string
}

export interface CategoryRepository extends TenantAwareRepository<Category> {
  findBySlug(tenantId: string, slug: string): Promise<Category | null>
}
