export type AssetCategory = 'image' | 'video' | 'audio' | 'document' | 'font' | 'archive' | 'other';

export type AssetProviderId = 'shutterstock' | 'pexels' | 'pixabay' | 'solospot' | 'my_assets' | 'upload';

export type AssetSlotType = 'IMAGE' | 'BACKGROUND_IMAGE' | 'VIDEO' | 'BACKGROUND_VIDEO' | 'SVG' | 'ICON';

export interface AssetLicenseInfo {
  licenseId?: string;
  licenseType?: string;
  licensedAt?: string;
  usageRights?: string;
  attributionRequired: boolean;
  attributionData?: Record<string, any>;
  tenantId?: string;
  storeId?: string;
  projectId?: string;
  nodeId?: string;
}

export interface UniversalAsset {
  id: string;
  provider: AssetProviderId;
  providerAssetId: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  previewUrl: string;
  sourceUrl: string;
  downloadUrl?: string;
  title?: string;
  author?: string;
  width?: number;
  height?: number;
  duration?: number;
  aspectRatio?: string;
  license?: AssetLicenseInfo;
  metadata?: Record<string, unknown>;
}

export interface AssetMetadata {
  width?: number;
  height?: number;
  format?: string;
  alt?: string;
  duration?: number;
  provider?: AssetProviderId;
  providerAssetId?: string;
  licenseId?: string;
  licensedAt?: string;
  usageRights?: string;
  [key: string]: unknown;
}

export interface AssetRecord {
  id: string;
  tenantId: string;
  storeId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  publicUrl: string;
  type: AssetCategory;
  provider?: AssetProviderId;
  providerAssetId?: string;
  licenseId?: string;
  metadata: AssetMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetInput {
  tenantId: string;
  storeId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  publicUrl: string;
  type: AssetCategory;
  provider?: AssetProviderId;
  providerAssetId?: string;
  licenseId?: string;
  metadata?: AssetMetadata;
}

export interface AssetFilterOptions {
  type?: AssetCategory;
  provider?: AssetProviderId;
  query?: string;
  limit?: number;
  offset?: number;
}

export interface AssetValidationResult {
  valid: boolean;
  error?: string;
  type?: AssetCategory;
  mimeType?: string;
  sanitizedFilename?: string;
}

