/**
 * AssetOperationsEngine.ts — Sprint S25 Professional Asset Operations
 *
 * Headless, immutable operations over the S15 `AnimationAssetRegistry`
 * (AssetRegistryState) — the single registry SSOT. NO second asset registry.
 *
 * Operations: import (single + batch), rename, duplicate, replace payload,
 * delete, relink-missing. Returns NEW registry/reference states + a log
 * entry. Binary payloads are NEVER inlined into BuilderDocument.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { AnimationAssetItem, AssetRegistryState } from './AnimationAssetRegistry';
import { registerAsset, unregisterAsset } from './AnimationAssetRegistry';
import type { AssetReferenceState, AssetReferenceLink } from './AnimationAssetReference';
import { AssetRelinkEngine } from './AssetRelinkEngine';
import { MediaImportEngine, type RawMediaFileDescriptor } from './MediaImportEngine';
import { AssetProcessingPipeline, type ProcessedAssetResult } from './AssetProcessingPipeline';
import { readAssetPayload } from './assetPayload';
import type { AnimationAssetMetadata } from './AnimationAssetMetadata';

export type AssetOperationType =
  | 'import'
  | 'rename'
  | 'duplicate'
  | 'replace_payload'
  | 'delete'
  | 'relink_missing';

export interface AssetOperationLogEntry {
  readonly operation: AssetOperationType;
  readonly assetId: string;
  readonly timestamp: number;
  readonly detail?: string;
}

export interface AssetSingleOperationResult {
  readonly nextRegistryState: AssetRegistryState;
  readonly log: ReadonlyArray<AssetOperationLogEntry>;
}

export interface AssetImportResult {
  readonly nextRegistryState: AssetRegistryState;
  readonly importedAssetIds: ReadonlyArray<string>;
  readonly results: ReadonlyArray<ProcessedAssetResult>;
  readonly log: ReadonlyArray<AssetOperationLogEntry>;
}

export interface AssetDeleteResult {
  readonly nextRegistryState: AssetRegistryState;
  readonly nextReferenceState: AssetReferenceState;
  readonly deletedAssetId: string;
  readonly removedReferenceLinks: ReadonlyArray<AssetReferenceLink>;
  readonly log: ReadonlyArray<AssetOperationLogEntry>;
}

export interface AssetRelinkResult {
  readonly nextRegistryState: AssetRegistryState;
  readonly nextReferenceState: AssetReferenceState;
  readonly relinkedAssetId: string;
  readonly affectedNodeIds: ReadonlyArray<string>;
  readonly log: ReadonlyArray<AssetOperationLogEntry>;
}

export interface AssetDuplicateResult {
  readonly nextRegistryState: AssetRegistryState;
  readonly newAssetId: string;
  readonly log: ReadonlyArray<AssetOperationLogEntry>;
}

function copyMetadata(
  meta: AnimationAssetMetadata,
  overrides: Partial<AnimationAssetMetadata>
): AnimationAssetMetadata {
  return { ...meta, ...overrides };
}

/**
 * Imports one or more raw media files into the registry using the existing
 * S15 MediaImportEngine → AssetProcessingPipeline. Reuses `registerAsset`.
 */
export function importAssets(
  rawFiles: ReadonlyArray<RawMediaFileDescriptor>,
  registryState: AssetRegistryState
): AssetImportResult {
  const log: AssetOperationLogEntry[] = [];
  const results: ProcessedAssetResult[] = [];
  const importedAssetIds: string[] = [];

  let next = registryState;
  const batch = MediaImportEngine.importBatch(rawFiles);

  for (const imported of batch) {
    const { nextRegistryState, result } = AssetProcessingPipeline.processAsset(imported, next);
    next = nextRegistryState;
    results.push(result);

    if (result.isValid) {
      importedAssetIds.push(result.assetItem.metadata.assetId);
      log.push({
        operation: 'import',
        assetId: result.assetItem.metadata.assetId,
        timestamp: Date.now(),
        detail: `${result.assetItem.metadata.category} ${result.assetItem.metadata.name}`,
      });
    } else {
      log.push({
        operation: 'import',
        assetId: imported.assetId,
        timestamp: Date.now(),
        detail: `import failed: ${result.validationErrors.join('; ')}`,
      });
    }
  }

  return { nextRegistryState: next, importedAssetIds, results, log };
}

/**
 * Renames an asset's display name immutably (metadata only, updatedAt bumped).
 */
export function renameAsset(
  registryState: AssetRegistryState,
  assetId: string,
  newName: string
): AssetSingleOperationResult {
  const existing = registryState.assets.find((a) => a.metadata.assetId === assetId);
  if (!existing) {
    throw new Error(`Asset not found: ${assetId}`);
  }

  const updatedMetadata = copyMetadata(existing.metadata, {
    name: newName,
    updatedAt: Date.now(),
  });
  const updatedItem: AnimationAssetItem = { ...existing, metadata: updatedMetadata };

  return {
    nextRegistryState: registerAsset(registryState, updatedItem),
    log: [{ operation: 'rename', assetId, timestamp: Date.now(), detail: newName }],
  };
}

/**
 * Duplicates an asset under a new stable AssetID. Payload reference is
 * shallow-copied (lightweight; binary data is never duplicated into
 * BuilderDocument — it stays in the registry payload store).
 */
export function duplicateAsset(
  registryState: AssetRegistryState,
  assetId: string,
  newName?: string
): AssetDuplicateResult {
  const existing = registryState.assets.find((a) => a.metadata.assetId === assetId);
  if (!existing) {
    throw new Error(`Asset not found: ${assetId}`);
  }

  const mediaKind = MediaImportEngine.detectMediaKind(
    existing.metadata.name,
    readAssetPayload(existing).mimeType ?? ''
  );
  const newAssetId = MediaImportEngine.generateAssetId(mediaKind, `copy_${existing.metadata.name}`);
  const ts = Date.now();
  const newMetadata = copyMetadata(existing.metadata, {
    assetId: newAssetId,
    name: newName ?? `Copy of ${existing.metadata.name}`,
    createdAt: ts,
    updatedAt: ts,
  });

  const newItem: AnimationAssetItem = {
    ...existing,
    metadata: newMetadata,
    payloadRef: { ...(existing.payloadRef as Record<string, unknown>) },
  };

  return {
    nextRegistryState: registerAsset(registryState, newItem),
    newAssetId,
    log: [{ operation: 'duplicate', assetId: newAssetId, timestamp: ts, detail: newMetadata.name }],
  };
}

/**
 * Replaces the underlying media payload of an existing asset (re-import) while
 * preserving its AssetID, name and existing reference bindings in
 * BuilderDocument. Returns the new registry state.
 */
export function replaceAssetPayload(
  registryState: AssetRegistryState,
  assetId: string,
  newRaw: RawMediaFileDescriptor
): AssetImportResult {
  const existing = registryState.assets.find((a) => a.metadata.assetId === assetId);
  if (!existing) {
    throw new Error(`Asset not found: ${assetId}`);
  }

  const { nextRegistryState, result } = AssetProcessingPipeline.processAsset(
    MediaImportEngine.importFile(newRaw),
    unregisterAsset(registryState, assetId)
  );

  // Restore the original identity + reference bindings (name preserved).
  const relabeled: AnimationAssetItem = {
    ...result.assetItem,
    metadata: copyMetadata(result.assetItem.metadata, {
      assetId,
      name: existing.metadata.name,
      createdAt: existing.metadata.createdAt,
    }),
  };

  const finalState = registerAsset(nextRegistryState, relabeled);

  return {
    nextRegistryState: finalState,
    importedAssetIds: [assetId],
    results: [result],
    log: [
      {
        operation: 'replace_payload',
        assetId,
        timestamp: Date.now(),
        detail: existing.metadata.name,
      },
    ],
  };
}

/**
 * Deletes an asset immutably. By default, dangling reference links are cleared
 * (relinquish) so downstream integrity reports no longer flag them; when
 * `preserveReferences` is true the links are left intact (flagged by the
 * AssetIntegrityScanner).
 */
export function deleteAsset(
  registryState: AssetRegistryState,
  referenceState: AssetReferenceState,
  assetId: string,
  preserveReferences: boolean = false
): AssetDeleteResult {
  const nextRegistry = unregisterAsset(registryState, assetId);

  let nextReference = referenceState;
  let removedLinks: ReadonlyArray<AssetReferenceLink> = [];

  if (!preserveReferences) {
    removedLinks = referenceState.links.filter((l) => l.assetId === assetId);
    nextReference = { links: referenceState.links.filter((l) => l.assetId !== assetId) };
  }

  return {
    nextRegistryState: nextRegistry,
    nextReferenceState: nextReference,
    deletedAssetId: assetId,
    removedReferenceLinks: removedLinks,
    log: [
      {
        operation: 'delete',
        assetId,
        timestamp: Date.now(),
        detail: preserveReferences ? 'references preserved' : 'references cleared',
      },
    ],
  };
}

/**
 * Relinks all references pointing to `missingAssetId` to resolve to
 * `replacementAssetId` (which must exist in the registry). Convenience
 * wrapper over `AssetRelinkEngine.relinkAsset`.
 */
export function relinkMissingAsset(
  registryState: AssetRegistryState,
  referenceState: AssetReferenceState,
  missingAssetId: string,
  replacementAssetId: string
): AssetRelinkResult {
  const replacement = registryState.assets.find((a) => a.metadata.assetId === replacementAssetId);
  if (!replacement) {
    throw new Error(`Replacement asset not found: ${replacementAssetId}`);
  }

  const { updatedReferenceState, affectedNodeIds } = AssetRelinkEngine.relinkAsset(
    referenceState,
    missingAssetId,
    replacementAssetId
  );

  return {
    nextRegistryState: registryState,
    nextReferenceState: updatedReferenceState,
    relinkedAssetId: replacementAssetId,
    affectedNodeIds,
    log: [
      {
        operation: 'relink_missing',
        assetId: replacementAssetId,
        timestamp: Date.now(),
        detail: `relinked ${affectedNodeIds.length} reference(s) from ${missingAssetId}`,
      },
    ],
  };
}
