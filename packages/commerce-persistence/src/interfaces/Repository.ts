// Repository.ts
// C9.1: Commerce Persistence — base repository interface

export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDir?: 'asc' | 'desc'
  filters?: Record<string, unknown>
}

export interface Repository<T> {
  findById(id: string): Promise<T | null>
  findAll(options?: QueryOptions): Promise<T[]>
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
  count(options?: QueryOptions): Promise<number>
}

export interface TenantAwareRepository<T> extends Repository<T> {
  findByTenant(tenantId: string, options?: QueryOptions): Promise<T[]>
}
