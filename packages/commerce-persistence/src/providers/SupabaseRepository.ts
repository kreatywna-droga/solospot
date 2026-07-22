// SupabaseRepository.ts
// C9.1: Commerce Persistence — Supabase provider

import { Repository, TenantAwareRepository, QueryOptions } from '../interfaces/Repository'

export interface SupabaseConfig {
  url: string
  key: string
  tenantId: string
}

export class SupabaseRepository<T extends { id: string; createdAt: string; updatedAt: string }> implements Repository<T>, TenantAwareRepository<T> {
  constructor(private config: SupabaseConfig) {}

  async findById(id: string): Promise<T | null> {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(this.config.url, this.config.key)
    const { data, error } = await supabase
      .from(this.getTableName())
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return data as T
  }

  async findAll(options?: QueryOptions): Promise<T[]> {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(this.config.url, this.config.key)
    let query = supabase.from(this.getTableName()).select('*')

    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value as string)
      })
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.orderDir !== 'desc' })
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as T[]
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(this.config.url, this.config.key)
    const now = new Date().toISOString()
    const { data: result, error } = await supabase
      .from(this.getTableName())
      .insert({ ...data, createdAt: now, updatedAt: now })
      .select()
      .single()
    if (error) throw error
    return result as T
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(this.config.url, this.config.key)
    const now = new Date().toISOString()
    const { data: result, error } = await supabase
      .from(this.getTableName())
      .update({ ...data, updatedAt: now })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return result as T
  }

  async delete(id: string): Promise<void> {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(this.config.url, this.config.key)
    const { error } = await supabase.from(this.getTableName()).delete().eq('id', id)
    if (error) throw error
  }

  async count(options?: QueryOptions): Promise<number> {
    const results = await this.findAll(options)
    return results.length
  }

  async findByTenant(tenantId: string, options?: QueryOptions): Promise<T[]> {
    return this.findAll({ ...options, filters: { ...options?.filters, tenantId } })
  }

  protected getTableName(): string {
    return 'unknown'
  }
}
