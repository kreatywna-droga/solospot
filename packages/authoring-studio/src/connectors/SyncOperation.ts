/**
 * SyncOperation.ts — Sprint S8 Synchronization Contracts (ETAP 5)
 *
 * Domain models for connector synchronization operations.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export type SyncOperationType = 'create' | 'update' | 'delete' | 'upsert' | 'noop';

export type SyncOperationStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

export interface SyncOperation {
    readonly operationId: string;
    readonly connectorId: string;
    readonly operationType: SyncOperationType;
    readonly entityType: string;
    readonly entityId: string;
    readonly payload?: unknown;
    readonly status: SyncOperationStatus;
    readonly createdAt: number;
    readonly completedAt?: number;
    readonly errorMessage?: string;
    readonly retryCount: number;
}

export interface SyncOperationState {
    readonly operations: ReadonlyArray<SyncOperation>;
}

export function createSyncOperationState(
    operations: ReadonlyArray<SyncOperation> = []
): SyncOperationState {
    return {
        operations: [...operations],
    };
}

export function createSyncOperation(
    connectorId: string,
    operationType: SyncOperationType,
    entityType: string,
    entityId: string,
    payload?: unknown
): SyncOperation {
    return {
        operationId: `sync-op-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        connectorId,
        operationType,
        entityType,
        entityId,
        payload,
        status: 'pending',
        createdAt: Date.now(),
        retryCount: 0,
    };
}

export function updateSyncOperationStatus(
    state: SyncOperationState,
    operationId: string,
    status: SyncOperationStatus,
    errorMessage?: string
): SyncOperationState {
    return {
        operations: state.operations.map((op) =>
            op.operationId === operationId
                ? {
                    ...op,
                    status,
                    errorMessage: status === 'failed' ? errorMessage : undefined,
                    completedAt:
                        status === 'completed' || status === 'failed'
                            ? Date.now()
                            : op.completedAt,
                    retryCount:
                        status === 'failed' ? op.retryCount + 1 : op.retryCount,
                }
                : op
        ),
    };
}

export function getPendingSyncOperations(
    state: SyncOperationState,
    connectorId: string
): ReadonlyArray<SyncOperation> {
    return state.operations.filter(
        (op) => op.connectorId === connectorId && op.status === 'pending'
    );
}

export function getFailedSyncOperations(
    state: SyncOperationState,
    connectorId: string
): ReadonlyArray<SyncOperation> {
    return state.operations.filter(
        (op) => op.connectorId === connectorId && op.status === 'failed'
    );
}