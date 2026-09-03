import { getServiceSupabase } from '@/lib/supabase';

export interface OrderPersistenceAdapter {
  upsertOrder(order: {
    id: string;
    tenantId: string;
    customerId: string | null;
    status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
    total: number;
    items: Array<{ id: string; productId: string; quantity: number; price: number }>;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }): Promise<void>;
  findByTenantAndId(tenantId: string, id: string): Promise<{
    id: string;
    tenantId: string;
    customerId: string | null;
    status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
    total: number;
    items: Array<{ id: string; productId: string; quantity: number; price: number }>;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  } | null>;
  listByTenant(tenantId: string): Promise<Array<{
    id: string;
    tenantId: string;
    customerId: string | null;
    status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
    total: number;
    items: Array<{ id: string; productId: string; quantity: number; price: number }>;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }>>;
  transitionOrderStatus?(
    tenantId: string,
    id: string,
    expectedStatus: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | Array<'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'>,
    newStatus: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled',
    metadataPatch?: Record<string, unknown>
  ): Promise<boolean>;
}

/**
 * Supabase-backed persistence adapter for OrderProcessingEngine.
 * Uses getServiceSupabase() for client creation (consistent with the rest of the codebase).
 */
export class SupabaseOrderPersistenceAdapter implements OrderPersistenceAdapter {
  private readonly table = 'orders';

  async upsertOrder(order: {
    id: string;
    tenantId: string;
    customerId: string | null;
    status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
    total: number;
    items: Array<{ id: string; productId: string; quantity: number; price: number }>;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }): Promise<void> {
    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from(this.table)
      .upsert({
        id: order.id,
        tenant_id: order.tenantId,
        customer_id: order.customerId,
        status: order.status,
        total: order.total,
        items: order.items,
        metadata: order.metadata,
        created_at: order.createdAt,
        updated_at: order.updatedAt,
      }, {
        onConflict: 'id',
      });

    if (error) {
      throw new Error(`SupabaseOrderPersistenceAdapter.upsertOrder failed: ${error.message}`);
    }
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<{
    id: string;
    tenantId: string;
    customerId: string | null;
    status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
    total: number;
    items: Array<{ id: string; productId: string; quantity: number; price: number }>;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`SupabaseOrderPersistenceAdapter.findByTenantAndId failed: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      tenantId: data.tenant_id,
      customerId: data.customer_id,
      status: data.status,
      total: data.total,
      items: data.items ?? [],
      metadata: data.metadata ?? {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async listByTenant(tenantId: string): Promise<Array<{
    id: string;
    tenantId: string;
    customerId: string | null;
    status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
    total: number;
    items: Array<{ id: string; productId: string; quantity: number; price: number }>;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`SupabaseOrderPersistenceAdapter.listByTenant failed: ${error.message}`);
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      customerId: row.customer_id,
      status: row.status,
      total: row.total,
      items: row.items ?? [],
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async transitionOrderStatus(
    tenantId: string,
    id: string,
    expectedStatus: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | Array<'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'>,
    newStatus: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled',
    metadataPatch?: Record<string, unknown>
  ): Promise<boolean> {
    const supabase = getServiceSupabase();
    const expectedArray = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];

    const existing = await this.findByTenantAndId(tenantId, id);
    if (!existing) return true;
    if (!expectedArray.includes(existing.status)) return false;

    const updatedMetadata = {
      ...(existing.metadata || {}),
      ...(metadataPatch || {}),
    };

    const { data, error } = await supabase
      .from(this.table)
      .update({
        status: newStatus,
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .in('status', expectedArray)
      .select();

    if (error) {
      throw new Error(`SupabaseOrderPersistenceAdapter.transitionOrderStatus failed: ${error.message}`);
    }

    return Boolean(data && data.length > 0);
  }
}
