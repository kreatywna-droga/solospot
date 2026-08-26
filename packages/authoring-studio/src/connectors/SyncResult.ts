/**
 * SyncResult.ts — Sprint S8 Synchronization Contracts (ETAP 5)
 *
 * Domain models for synchronization results.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export type SyncResultStatus = 'success' | 'partial' | 'failed' | 'cancelled';

export interface SyncResultSummary {
    readonly total: number;
    readonly succeeded: number;
    readonly failed: number;
    readonly skipped: number;
}

export interface SyncResult {
    readonly syncId: string;
    readonly connectorId: string;
    readonly status: SyncResultStatus;
    readonly summary: SyncResultSummary;
    readonly startedAt: number;
    readonly completedAt: number;
    readonly errorMessage?: string;
    readonly failedOperationIds?: ReadonlyArray<string>;
}

export function createSyncResult(
    connectorId: string,
    status: SyncResultStatus,
    summary: SyncResultSummary,
    startedAt: number,
    completedAt: number,
    errorMessage?: string,
    failedOperationIds?: ReadonlyArray<string>
): SyncResult {
    return {
        syncId: `sync-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        connectorId,
        status,
        summary,
        startedAt,
        completedAt,
        errorMessage,
        failedOperationIds: failedOperationIds ? [...failedOperationIds] : undefined,
    };
}

export function createSyncResultSummary(
    total: number,
    succeeded: number,
    failed: number,
    skipped: number
): SyncResultSummary {
    return { total, succeeded, failed, skipped };
}

export function isSyncResultSuccessful(result: SyncResult): boolean {
    return result.status === 'success';
}