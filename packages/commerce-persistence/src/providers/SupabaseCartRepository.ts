// SupabaseCartRepository.ts
// C9.1: Commerce Persistence — Supabase cart repository

import { SupabaseRepository } from './SupabaseRepository'
import { Cart, CartRepository } from '../repositories/CartRepository'

export class SupabaseCartRepository extends SupabaseRepository<Cart> implements CartRepository {
  protected getTableName(): string {
    return 'carts'
  }

  async findByCustomer(tenantId: string, customerId: string): Promise<Cart | null> {
    const results = await this.findAll({
      filters: { tenant_id: tenantId, customer_id: customerId },
    })
    return results[0] ?? null
  }

  async findBySession(tenantId: string, sessionId: string): Promise<Cart | null> {
    const results = await this.findAll({
      filters: { tenant_id: tenantId, session_id: sessionId },
    })
    return results[0] ?? null
  }

  async clear(cartId: string): Promise<void> {
    await this.update(cartId, { items: [] })
  }
}
