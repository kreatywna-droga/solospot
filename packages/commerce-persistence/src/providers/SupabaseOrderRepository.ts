// SupabaseOrderRepository.ts
// C9.1: Commerce Persistence — Supabase order repository
// G1-333 HARDEN: tenant-scoped findByTenantAndId for OrderProcessingEngine.

import { SupabaseRepository } from './SupabaseRepository'
import { Order, OrderRepository } from '../repositories/OrderRepository'

export class SupabaseOrderRepository extends SupabaseRepository<Order> implements OrderRepository {
  protected getTableName(): string {
    return 'orders'
  }

  async findByCustomer(tenantId: string, customerId: string, options?: { limit?: number; offset?: number; orderBy?: string; orderDir?: 'asc' | 'desc' }): Promise<Order[]> {
    return this.findAll({
      ...options,
      filters: { tenant_id: tenantId, customer_id: customerId },
    })
  }

  async findByStatus(tenantId: string, status: Order['status'], options?: { limit?: number; offset?: number; orderBy?: string; orderDir?: 'asc' | 'desc' }): Promise<Order[]> {
    return this.findAll({
      ...options,
      filters: { tenant_id: tenantId, status },
    })
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<Order | null> {
    if (!tenantId || !id) return null;
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(this.config.url, this.config.key)
    const { data, error } = await supabase
      .from(this.getTableName())
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return (data as Order | null) ?? null
  }
}