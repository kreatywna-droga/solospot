import { getServiceSupabase } from '@/lib/supabase';
import type { Store, StoreRow, CreateStoreRequest, UpdateStoreRequest, StoreConfig, StoreBranding, PublicationStatus } from './StoreTypes';

export class StoreRepository {
  private readonly table = 'stores';

  async getStoresByTenant(tenantId: string): Promise<Store[]> {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`StoreRepository.getStoresByTenant failed: ${error.message}`);
    }

    return (data || []).map((row) => this.mapStore(row));
  }

  async getStoreBySlug(slug: string): Promise<Store | null> {
    const supabase = getServiceSupabase()
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      throw new Error(`StoreRepository.getStoreBySlug failed: ${error.message}`)
    }

    if (!data) return null
    return this.mapStore(data)
  }

  async getStore(id: string, tenantId: string): Promise<Store | null> {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) {
      throw new Error(`StoreRepository.getStore failed: ${error.message}`);
    }

    if (!data) return null;
    return this.mapStore(data);
  }

  async createStore(tenantId: string, req: CreateStoreRequest): Promise<Store> {
    const supabase = getServiceSupabase();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from(this.table)
      .insert({
        tenant_id: tenantId,
        name: req.name,
        slug: req.slug,
        domain: req.domain || null,
        status: 'CREATED',
        config: {},
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`StoreRepository.createStore failed: ${error.message}`);
    }

    return this.mapStore(data);
  }

  async updateStore(id: string, tenantId: string, req: UpdateStoreRequest): Promise<Store> {
    const supabase = getServiceSupabase();
    const now = new Date().toISOString();

    const updates: Record<string, unknown> = { updated_at: now };
    if (req.name !== undefined) updates.name = req.name;
    if (req.domain !== undefined) updates.domain = req.domain;
    if (req.config !== undefined) updates.config = req.config;

    const { data, error } = await supabase
      .from(this.table)
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw new Error(`StoreRepository.updateStore failed: ${error.message}`);
    }

    return this.mapStore(data);
  }

  async updateStorePublication(
    id: string,
    tenantId: string,
    publicationStatus: PublicationStatus
  ): Promise<Store> {
    const supabase = getServiceSupabase();
    const store = await this.getStore(id, tenantId);
    if (!store) throw new Error('Store not found');

    const config: StoreConfig = { ...store.config, publicationStatus };
    return this.updateStore(id, tenantId, { config });
  }

  async updateStoreBranding(
    id: string,
    tenantId: string,
    branding: StoreBranding
  ): Promise<Store> {
    const supabase = getServiceSupabase();
    const store = await this.getStore(id, tenantId);
    if (!store) throw new Error('Store not found');

    const config: StoreConfig = { ...store.config, branding };
    return this.updateStore(id, tenantId, { config });
  }

  private mapStore(row: StoreRow): Store {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      slug: row.slug,
      domain: row.domain,
      status: row.status as Store['status'],
      config: (row.config || {}) as StoreConfig,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
