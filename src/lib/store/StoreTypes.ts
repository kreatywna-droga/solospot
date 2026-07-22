export type StoreStatus = 'CREATED' | 'PROVISIONING' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export type PublicationStatus = 'DRAFT' | 'READY' | 'PUBLISHED';

export interface StoreBranding {
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  font?: string;
  description?: string;
}

export interface StoreConfig {
  publicationStatus?: PublicationStatus;
  branding?: StoreBranding;
  template?: string;
  pages?: unknown[];
  packages?: string[];
}

export interface Store {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  domain?: string | null;
  status: StoreStatus;
  config?: StoreConfig;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreRequest {
  name: string;
  slug: string;
  domain?: string;
}

export interface UpdateStoreRequest {
  name?: string;
  domain?: string;
  config?: StoreConfig;
}

export interface StoreRow {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: string;
  config: StoreConfig;
  created_at: string;
  updated_at: string;
}
