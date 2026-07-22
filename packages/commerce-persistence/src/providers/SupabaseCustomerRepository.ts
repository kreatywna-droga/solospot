// SupabaseCustomerRepository.ts
// C9.1: Commerce Persistence — Supabase customer repository

import { SupabaseRepository } from './SupabaseRepository'
import { Customer, CustomerRepository } from '../repositories/CustomerRepository'

export class SupabaseCustomerRepository extends SupabaseRepository<Customer> implements CustomerRepository {
  protected getTableName(): string {
    return 'customers'
  }

  async findByEmail(tenantId: string, email: string): Promise<Customer | null> {
    const results = await this.findAll({
      filters: { tenant_id: tenantId, email },
    })
    return results[0] ?? null
  }
}
