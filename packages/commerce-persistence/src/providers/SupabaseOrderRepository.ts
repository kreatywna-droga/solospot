// SupabaseOrderRepository.ts
// C9.1: Commerce Persistence — Supabase order repository

import { SupabaseRepository } from './SupabaseRepository'
import { Order, OrderRepository } from '../repositories/OrderRepository'

export class SupabaseOrderRepository extends SupabaseRepository<Order> implements OrderRepository {
  protected getTableName(): string {
    return 'orders'
  }

  async findByCustomer(tenantId: string, customerId: string, options?: { limit?: number; offset?: number }): Promise<Order[]> {
    return this.findAll({
      ...options,
      filters: { tenant_id: tenantId, customer_id: customerId },
    })
  }

  async findByStatus(tenantId: string, status: Order['status'], options?: { limit?: number; offset?: number }): Promise<Order[]> {
    return this.findAll({
      ...options,
      filters: { tenant_id: tenantId, status },
    })
  }
}
