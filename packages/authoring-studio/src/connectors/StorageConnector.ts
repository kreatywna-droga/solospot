/**
 * StorageConnector.ts — Sprint S8 External Services (ETAP 3)
 *
 * Storage connector contracts for local and external file storage.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export type StorageOperationType = 'read' | 'write' | 'delete' | 'list' | 'exists';

export interface StorageItem {
    readonly itemId: string;
    readonly name: string;
    readonly path: string;
    readonly sizeBytes: number;
    readonly mimeType?: string;
    readonly createdAt: number;
    readonly updatedAt: number;
    readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface StorageOperationRequest {
    readonly connectorId: string;
    readonly operation: StorageOperationType;
    readonly path: string;
    readonly payload?: unknown;
    readonly options?: Readonly<Record<string, unknown>>;
}

export interface StorageOperationResult {
    readonly connectorId: string;
    readonly success: boolean;
    readonly operation: StorageOperationType;
    readonly item?: StorageItem;
    readonly items?: ReadonlyArray<StorageItem>;
    readonly errorMessage?: string;
    readonly completedAt: number;
}

export interface StorageConnectorContract {
    readonly connectorId: string;
    readonly supports: (operation: StorageOperationType) => boolean;
    readonly execute: (request: StorageOperationRequest) => StorageOperationResult;
}

export function createStorageOperationRequest(
    connectorId: string,
    operation: StorageOperationType,
    path: string,
    payload?: unknown,
    options?: Readonly<Record<string, unknown>>
): StorageOperationRequest {
    return {
        connectorId,
        operation,
        path,
        payload,
        options: options ? { ...options } : undefined,
    };
}

export function createStorageOperationResult(
    connectorId: string,
    operation: StorageOperationType,
    success: boolean,
    item?: StorageItem,
    items?: ReadonlyArray<StorageItem>,
    errorMessage?: string
): StorageOperationResult {
    return {
        connectorId,
        success,
        operation,
        item,
        items: items ? [...items] : undefined,
        errorMessage,
        completedAt: Date.now(),
    };
}