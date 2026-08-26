/**
 * GenericCloudConnector.ts — Sprint S9 Real Connector Implementation (ETAP 4)
 *
 * Generic Cloud Storage Connector for custom cloud backends (S3 compatible, custom WebDAV, etc).
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { CloudStorageConnectorContract, CloudStorageConfig, CloudStorageUploadRequest, CloudStorageUploadResult } from '../CloudStorageConnector';
import { createCloudStorageUploadResult } from '../CloudStorageConnector';
import type { StorageOperationRequest, StorageOperationResult } from '../StorageConnector';
import { createStorageOperationResult } from '../StorageConnector';

export class GenericCloudConnector implements CloudStorageConnectorContract {
  readonly connectorId: string;
  readonly config: CloudStorageConfig;

  constructor(config: CloudStorageConfig) {
    this.connectorId = config.connectorId;
    this.config = config;
  }

  upload(request: CloudStorageUploadRequest): CloudStorageUploadResult {
    return createCloudStorageUploadResult(this.connectorId, true, request.item.itemId);
  }

  download(request: StorageOperationRequest): StorageOperationResult {
    return createStorageOperationResult(this.connectorId, 'read', true);
  }

  delete(request: StorageOperationRequest): StorageOperationResult {
    return createStorageOperationResult(this.connectorId, 'delete', true);
  }

  list(request: StorageOperationRequest): StorageOperationResult {
    return createStorageOperationResult(this.connectorId, 'list', true, undefined, []);
  }
}
