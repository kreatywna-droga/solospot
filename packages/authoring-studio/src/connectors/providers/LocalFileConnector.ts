/**
 * LocalFileConnector.ts — Sprint S9 Real Connector Implementation (ETAP 1)
 *
 * Implementation of local file system operations (Open, Save, Save As, Import/Export Folder)
 * as a pure DTO/state transformer adapter adhering to StorageConnectorContract.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { StorageConnectorContract, StorageOperationRequest, StorageOperationResult } from '../StorageConnector';
import { createStorageOperationResult } from '../StorageConnector';
import type { BuilderDocument } from '../../../../builder-core/src/BuilderDocument';

export interface LocalFileConnectorConfig {
  readonly connectorId: string;
  readonly baseFolderPath?: string;
}

export class LocalFileConnector implements StorageConnectorContract {
  readonly connectorId: string;
  private readonly config: LocalFileConnectorConfig;

  constructor(config: LocalFileConnectorConfig) {
    this.connectorId = config.connectorId;
    this.config = config;
  }

  supports(operation: StorageOperationRequest['operation']): boolean {
    return ['read', 'write', 'delete', 'list', 'exists'].includes(operation);
  }

  execute(request: StorageOperationRequest): StorageOperationResult {
    if (!this.supports(request.operation)) {
      return createStorageOperationResult(
        this.connectorId,
        request.operation,
        false,
        undefined,
        undefined,
        `Unsupported operation: ${request.operation}`
      );
    }

    // Pure DTO simulation of local file system execution
    return createStorageOperationResult(
      this.connectorId,
      request.operation,
      true,
      {
        itemId: `file-${Date.now()}`,
        name: request.path.split('/').pop() || request.path,
        path: request.path,
        sizeBytes: 1024,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    );
  }

  openProject(path: string): StorageOperationResult {
    return this.execute({ connectorId: this.connectorId, operation: 'read', path });
  }

  saveProject(document: BuilderDocument, path: string): StorageOperationResult {
    return this.execute({
      connectorId: this.connectorId,
      operation: 'write',
      path,
      payload: document,
    });
  }

  saveProjectAs(document: BuilderDocument, newPath: string): StorageOperationResult {
    return this.saveProject(document, newPath);
  }
}
