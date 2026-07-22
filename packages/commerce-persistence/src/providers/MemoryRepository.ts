// MemoryRepository.ts
// C9.1: Commerce Persistence — in-memory repository for testing

import { Repository, TenantAwareRepository, QueryOptions } from '../interfaces/Repository'

export class MemoryRepository<T extends { id: string; createdAt: string; updatedAt: string }> implements Repository<T>, TenantAwareRepository<T> {
  protected items: Map<string, T> = new Map()

  async findById(id: string): Promise<T | null> {
    return this.items.get(id) ?? null
  }

  async findAll(options?: QueryOptions): Promise<T[]> {
    let results = Array.from(this.items.values())

    if (options?.filters) {
      results = results.filter(item => {
        return Object.entries(options.filters!).every(([key, value]) => {
          return (item as Record<string, unknown>)[key] === value
        })
      })
    }

    if (options?.orderBy) {
      const dir = options.orderDir === 'desc' ? -1 : 1
      results.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[options.orderBy!]
        const bVal = (b as Record<string, unknown>)[options.orderBy!]
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return dir * aVal.localeCompare(bVal)
        }
        return 0
      })
    }

    const offset = options?.offset ?? 0
    const limit = options?.limit
    if (limit !== undefined) {
      results = results.slice(offset, offset + limit)
    }

    return results
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<T> {
    const now = new Date().toISOString()
    const item = {
      ...data,
      id: data.id ?? crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    } as T
    this.items.set(item.id, item)
    return item
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const existing = this.items.get(id)
    if (!existing) {
      throw new Error(`Item not found: ${id}`)
    }
    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    this.items.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id)
  }

  async count(options?: QueryOptions): Promise<number> {
    const results = await this.findAll(options)
    return results.length
  }

  async findByTenant(tenantId: string, options?: QueryOptions): Promise<T[]> {
    const filters = { ...options?.filters, tenantId }
    return this.findAll({ ...options, filters })
  }
}
