import { getServiceSupabase, isSupabaseConfigured } from '../supabase';
import type { AssetRecord, CreateAssetInput, AssetFilterOptions } from './AssetTypes';

// In-memory fallback map for offline / test environments
const inMemoryAssetStore: Map<string, AssetRecord> = new Map();

export function clearInMemoryAssets(): void {
  inMemoryAssetStore.clear();
}

export class AssetRepository {
  private readonly table = 'assets';

  async createAsset(input: CreateAssetInput): Promise<AssetRecord> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    if (isSupabaseConfigured()) {
      try {
        const supabase = getServiceSupabase();
        const { data, error } = await supabase
          .from(this.table)
          .insert({
            id,
            tenant_id: input.tenantId,
            store_id: input.storeId,
            filename: input.filename,
            original_name: input.originalName,
            mime_type: input.mimeType,
            size: input.size,
            storage_path: input.storagePath,
            public_url: input.publicUrl,
            type: input.type,
            metadata: input.metadata || {},
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (error) {
          throw new Error(`AssetRepository.createAsset failed: ${error.message}`);
        }
        return this.mapRow(data);
      } catch (err: any) {
        // If table does not exist or Supabase fails, fallback to in-memory store
        console.warn('[AssetRepository] Supabase insert failed, using memory store:', err.message);
      }
    }

    const record: AssetRecord = {
      id,
      tenantId: input.tenantId,
      storeId: input.storeId,
      filename: input.filename,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
      storagePath: input.storagePath,
      publicUrl: input.publicUrl,
      type: input.type,
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
    };
    inMemoryAssetStore.set(id, record);
    return record;
  }

  async getAsset(tenantId: string, storeId: string, assetId: string): Promise<AssetRecord | null> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getServiceSupabase();
        const { data, error } = await supabase
          .from(this.table)
          .select('*')
          .eq('id', assetId)
          .eq('tenant_id', tenantId)
          .eq('store_id', storeId)
          .maybeSingle();

        if (error) {
          throw new Error(`AssetRepository.getAsset failed: ${error.message}`);
        }
        if (data) return this.mapRow(data);
      } catch (err: any) {
        console.warn('[AssetRepository] Supabase getAsset failed:', err.message);
      }
    }

    const mem = inMemoryAssetStore.get(assetId);
    if (mem && mem.tenantId === tenantId && mem.storeId === storeId) {
      return mem;
    }
    return null;
  }

  async listAssets(
    tenantId: string,
    storeId: string,
    options: AssetFilterOptions = {}
  ): Promise<AssetRecord[]> {
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;

    if (isSupabaseConfigured()) {
      try {
        const supabase = getServiceSupabase();
        let query = supabase
          .from(this.table)
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('store_id', storeId);

        if (options.type) {
          query = query.eq('type', options.type);
        }

        if (options.query) {
          query = query.ilike('original_name', `%${options.query}%`);
        }

        const { data, error } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          throw new Error(`AssetRepository.listAssets failed: ${error.message}`);
        }
        if (data) {
          return data.map((row: any) => this.mapRow(row));
        }
      } catch (err: any) {
        console.warn('[AssetRepository] Supabase listAssets failed, using memory store:', err.message);
      }
    }

    let list = Array.from(inMemoryAssetStore.values()).filter(
      a => a.tenantId === tenantId && a.storeId === storeId
    );

    if (options.type) {
      list = list.filter(a => a.type === options.type);
    }
    if (options.query) {
      const q = options.query.toLowerCase();
      list = list.filter(a => a.originalName.toLowerCase().includes(q) || a.filename.toLowerCase().includes(q));
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list.slice(offset, offset + limit);
  }

  async deleteAsset(tenantId: string, storeId: string, assetId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getServiceSupabase();
        const { error } = await supabase
          .from(this.table)
          .delete()
          .eq('id', assetId)
          .eq('tenant_id', tenantId)
          .eq('store_id', storeId);

        if (error) {
          throw new Error(`AssetRepository.deleteAsset failed: ${error.message}`);
        }
      } catch (err: any) {
        console.warn('[AssetRepository] Supabase deleteAsset failed:', err.message);
      }
    }

    const mem = inMemoryAssetStore.get(assetId);
    if (mem && mem.tenantId === tenantId && mem.storeId === storeId) {
      inMemoryAssetStore.delete(assetId);
      return true;
    }
    return true;
  }

  async updateAsset(
    tenantId: string,
    storeId: string,
    assetId: string,
    updates: Partial<Pick<AssetRecord, 'originalName' | 'metadata' | 'storagePath' | 'publicUrl' | 'size'>>
  ): Promise<AssetRecord | null> {
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      try {
        const supabase = getServiceSupabase();
        const patch: Record<string, unknown> = { updated_at: now };
        if (updates.originalName) patch.original_name = updates.originalName;
        if (updates.metadata) patch.metadata = updates.metadata;
        if (updates.storagePath) patch.storage_path = updates.storagePath;
        if (updates.publicUrl) patch.public_url = updates.publicUrl;
        if (updates.size) patch.size = updates.size;

        const { data, error } = await supabase
          .from(this.table)
          .update(patch)
          .eq('id', assetId)
          .eq('tenant_id', tenantId)
          .eq('store_id', storeId)
          .select()
          .single();

        if (error) {
          throw new Error(`AssetRepository.updateAsset failed: ${error.message}`);
        }
        if (data) return this.mapRow(data);
      } catch (err: any) {
        console.warn('[AssetRepository] Supabase updateAsset failed:', err.message);
      }
    }

    const mem = inMemoryAssetStore.get(assetId);
    if (mem && mem.tenantId === tenantId && mem.storeId === storeId) {
      const updated: AssetRecord = {
        ...mem,
        ...updates,
        metadata: { ...mem.metadata, ...(updates.metadata || {}) },
        updatedAt: now,
      };
      inMemoryAssetStore.set(assetId, updated);
      return updated;
    }
    return null;
  }

  private mapRow(row: any): AssetRecord {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      storeId: row.store_id,
      filename: row.filename,
      originalName: row.original_name,
      mimeType: row.mime_type,
      size: Number(row.size),
      storagePath: row.storage_path,
      publicUrl: row.public_url,
      type: row.type,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
