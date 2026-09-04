export type AssetCategory = 'image' | 'video' | 'audio' | 'document' | 'font' | 'archive' | 'other';

export interface AssetMetadata {
  width?: number;
  height?: number;
  format?: string;
  alt?: string;
  duration?: number;
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
  metadata?: AssetMetadata;
}

export interface AssetFilterOptions {
  type?: AssetCategory;
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
