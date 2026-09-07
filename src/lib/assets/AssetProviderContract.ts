import type { UniversalAsset, AssetProviderId } from './AssetTypes';

export interface AssetSearchOptions {
  query: string;
  category?: string;
  type?: 'image' | 'video';
  orientation?: 'horizontal' | 'vertical' | 'square';
  page?: number;
  limit?: number;
}

export interface LicenseOptions {
  tenantId: string;
  storeId: string;
  projectId?: string;
  nodeId?: string;
  licenseType?: string;
}

export interface AssetSearchResult {
  assets: UniversalAsset[];
  total: number;
  page: number;
  totalPages: number;
  provider: AssetProviderId;
}

export interface AssetProvider {
  readonly id: AssetProviderId;
  readonly name: string;
  search(options: AssetSearchOptions): Promise<AssetSearchResult>;
  getDetails(assetId: string): Promise<UniversalAsset>;
  getPreview(assetId: string): Promise<string>;
  license(assetId: string, options: LicenseOptions): Promise<UniversalAsset>;
  getUsageRights?(assetId: string): Promise<Record<string, unknown>>;
}
