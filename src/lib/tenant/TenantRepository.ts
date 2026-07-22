import { getServiceSupabase } from '@/lib/supabase';
import type { Tenant, TenantStatus, StoreInstance, StoreStatus } from './TenantStatus';

export class TenantRepository {
  private readonly tenantTable = 'tenants';
  private readonly storeTable = 'stores';

  async createTenant(tenant: { id: string; ownerEmail: string; packageId: string; status: TenantStatus }): Promise<Tenant> {
    const supabase = getServiceSupabase();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from(this.tenantTable)
      .insert({
        id: tenant.id,
        owner_email: tenant.ownerEmail,
        package_id: tenant.packageId,
        status: tenant.status,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`TenantRepository.createTenant failed: ${error.message}`);
    }

    return this.mapTenant(data);
  }

  async getTenant(id: string): Promise<Tenant | null> {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from(this.tenantTable)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`TenantRepository.getTenant failed: ${error.message}`);
    }

    if (!data) return null;
    return this.mapTenant(data);
  }

  async getAllTenants(): Promise<Tenant[]> {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from(this.tenantTable)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`TenantRepository.getAllTenants failed: ${error.message}`);
    }

    return (data || []).map(row => this.mapTenant(row));
  }

  async updateTenantStatus(id: string, status: TenantStatus): Promise<Tenant> {
    const supabase = getServiceSupabase();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from(this.tenantTable)
      .update({
        status,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`TenantRepository.updateTenantStatus failed: ${error.message}`);
    }

    return this.mapTenant(data);
  }

  async createStore(store: { id: string; tenantId: string; name: string; slug: string; status: StoreStatus }): Promise<StoreInstance> {
    const supabase = getServiceSupabase();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from(this.storeTable)
      .insert({
        id: store.id,
        tenant_id: store.tenantId,
        name: store.name,
        slug: store.slug,
        status: store.status,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`TenantRepository.createStore failed: ${error.message}`);
    }

    return this.mapStore(data);
  }

  async getStoreByTenant(tenantId: string): Promise<StoreInstance | null> {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from(this.storeTable)
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) {
      throw new Error(`TenantRepository.getStoreByTenant failed: ${error.message}`);
    }

    if (!data) return null;
    return this.mapStore(data);
  }

  async updateStoreStatus(id: string, tenantId: string, status: StoreStatus): Promise<StoreInstance> {
    const supabase = getServiceSupabase();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from(this.storeTable)
      .update({
        status,
        updated_at: now,
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw new Error(`TenantRepository.updateStoreStatus failed: ${error.message}`);
    }

    return this.mapStore(data);
  }

  private mapTenant(row: any): Tenant {
    return {
      id: row.id,
      ownerEmail: row.owner_email,
      packageId: row.package_id,
      status: row.status as TenantStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapStore(row: any): StoreInstance {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      status: row.status as StoreStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
