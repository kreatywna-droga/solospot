import { StoreRepository } from './StoreRepository';
import type { Store, CreateStoreRequest, UpdateStoreRequest, StoreBranding, PublicationStatus } from './StoreTypes';
import { validateCreateStore, validateUpdateStore } from './StoreValidator';

export class StoreService {
  private readonly repo: StoreRepository;

  constructor() {
    this.repo = new StoreRepository();
  }

  async listStores(tenantId: string): Promise<Store[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.repo.getStoresByTenant(tenantId);
  }

  async getStore(tenantId: string, storeId: string): Promise<Store> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    const store = await this.repo.getStore(storeId, tenantId);
    if (!store) {
      throw new Error('Store not found');
    }
    return store;
  }

  async createStore(tenantId: string, req: CreateStoreRequest): Promise<Store> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const validation = validateCreateStore(req);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return this.repo.createStore(tenantId, {
      name: req.name.trim(),
      slug: req.slug.trim().toLowerCase(),
      domain: req.domain?.trim().toLowerCase(),
    });
  }

  async updateStore(tenantId: string, storeId: string, req: UpdateStoreRequest): Promise<Store> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const validation = validateUpdateStore(req);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return this.repo.updateStore(storeId, tenantId, req);
  }

  async publishStore(tenantId: string, storeId: string): Promise<Store> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return this.repo.updateStorePublication(storeId, tenantId, 'PUBLISHED');
  }

  async unpublishStore(tenantId: string, storeId: string): Promise<Store> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return this.repo.updateStorePublication(storeId, tenantId, 'DRAFT');
  }

  async markStoreReady(tenantId: string, storeId: string): Promise<Store> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return this.repo.updateStorePublication(storeId, tenantId, 'READY');
  }

  async updateBranding(tenantId: string, storeId: string, branding: StoreBranding): Promise<Store> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return this.repo.updateStoreBranding(storeId, tenantId, branding);
  }
}
