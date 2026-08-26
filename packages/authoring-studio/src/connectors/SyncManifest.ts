/**
 * SyncManifest.ts — Sprint S8 Synchronization Contracts (ETAP 5)
 *
 * Domain models for synchronization manifests.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export interface SyncManifestItem {
    readonly entityType: string;
    readonly entityId: string;
    readonly version: number;
    readonly checksum?: string;
    readonly lastModifiedAt: number;
}

export interface SyncManifest {
    readonly manifestId: string;
    readonly connectorId: string;
    readonly createdAt: number;
    readonly sourceVersion: string;
    readonly items: ReadonlyArray<SyncManifestItem>;
}

export interface SyncManifestState {
    readonly manifests: ReadonlyArray<SyncManifest>;
}

export function createSyncManifestState(
    manifests: ReadonlyArray<SyncManifest> = []
): SyncManifestState {
    return {
        manifests: [...manifests],
    };
}

export function createSyncManifest(
    connectorId: string,
    sourceVersion: string,
    items: ReadonlyArray<SyncManifestItem> = []
): SyncManifest {
    return {
        manifestId: `manifest-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        connectorId,
        createdAt: Date.now(),
        sourceVersion,
        items: [...items],
    };
}

export function getSyncManifest(
    state: SyncManifestState,
    connectorId: string
): SyncManifest | undefined {
    return state.manifests.find((m) => m.connectorId === connectorId);
}

export function upsertSyncManifest(
    state: SyncManifestState,
    manifest: SyncManifest
): SyncManifestState {
    const filtered = state.manifests.filter(
        (m) => m.connectorId !== manifest.connectorId
    );
    return {
        manifests: [...filtered, manifest],
    };
}

export function hasSyncManifestItem(
    manifest: SyncManifest,
    entityType: string,
    entityId: string
): boolean {
    return manifest.items.some(
        (i) => i.entityType === entityType && i.entityId === entityId
    );
}