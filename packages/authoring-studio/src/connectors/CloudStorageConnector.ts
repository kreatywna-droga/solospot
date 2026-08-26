/**
 * CloudStorageConnector.ts — Sprint S8 External Services (ETAP 3)
 *
 * Cloud storage connector contracts for remote object storage services.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { StorageItem, StorageOperationRequest, StorageOperationResult } from './StorageConnector';

export type CloudStorageProvider = 's3' | 'gcs' | 'azure_blob' | 'dropbox' | 'google_drive' | 'custom';

export interface CloudStorageConfig {
  readonly connectorId: string;
  readonly provider: CloudStorageProvider;
  readonly bucketName?: string;
  readonly region?: string;
  readonly endpoint?: string;
  readonly maxUploadSizeBytes?: number;
  readonly supportsMultipartUpload: boolean;
}

export interface CloudStorageUploadRequest {
  readonly connectorId: string;
  readonly item: StorageItem;
  readonly payload: unknown;
  readonly options?: Readonly<Record<string, unknown>>;
}

export interface CloudStorageUploadResult {
  readonly connectorId: string;
  readonly success: boolean;
  readonly itemId?: string;
  readonly uploadUrl?: string;
  readonly errorMessage?: string;
  readonly completedAt: number;
}

export interface CloudStorageConnectorContract {
  readonly connectorId: string;
  readonly config: CloudStorageConfig;
  readonly upload: (request: CloudStorageUploadRequest) => CloudStorageUploadResult;
  readonly download: (request: StorageOperationRequest) => StorageOperationResult;
  readonly delete: (request: StorageOperationRequest) => StorageOperationResult;
  readonly list: (request: StorageOperationRequest) => StorageOperationResult;
}

export function createCloudStorageConfig(
  connectorId: string,
  provider: CloudStorageProvider,
  bucketName?: string,
  region?: string,
  endpoint?: string,
  maxUploadSizeBytes?: number,
  supportsMultipartUpload: boolean = false
): CloudStorageConfig {
  return {
    connectorId,
    provider,
    bucketName,
    region,
    endpoint,
    maxUploadSizeBytes,
    supportsMultipartUpload,
  };
}

export function createCloudStorageUploadResult(
  connectorId: string,
  success: boolean,
  itemId?: string,
  uploadUrl?: string,
  errorMessage?: string
): CloudStorageUploadResult {
  return {
    connectorId,
    success,
    itemId,
    uploadUrl,
    errorMessage,
    completedAt: Date.now(),
  };
}
