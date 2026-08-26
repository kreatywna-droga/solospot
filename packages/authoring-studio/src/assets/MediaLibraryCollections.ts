/**
 * MediaLibraryCollections.ts — Sprint S25 Professional Asset Collections
 *
 * Lightweight collection model (custom grouping of asset IDs) that extends the
 * S15 PM42 `AnimationAssetCollection` export/import pipeline and the
 * `AnimationAssetBrowser` folder model. Collections are pure DTO groupings —
 * they do not duplicate binary payloads and never replace the Asset Registry
 * as SSOT for assets.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { AssetBrowserState } from './AnimationAssetBrowser';

export interface MediaCollection {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly assetIds: ReadonlyArray<string>;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface MediaLibraryCollectionsState {
  readonly collections: ReadonlyArray<MediaCollection>;
}

export const INITIAL_MEDIA_LIBRARY_COLLECTIONS_STATE: MediaLibraryCollectionsState = {
  collections: [],
};

export function createMediaLibraryCollectionsState(
  partial: Partial<MediaLibraryCollectionsState> = {}
): MediaLibraryCollectionsState {
  return {
    ...INITIAL_MEDIA_LIBRARY_COLLECTIONS_STATE,
    ...partial,
  };
}

function now(): number {
  return Date.now();
}

/**
 * Creates a new empty collection immutably. Deterministic ordering preserved
 * (new collection appended to the end of the array).
 */
export function createCollection(
  state: MediaLibraryCollectionsState,
  id: string,
  name: string,
  description: string = ''
): MediaCollection {
  const ts = now();
  return { id, name, description, assetIds: [], createdAt: ts, updatedAt: ts };
}

export function addCollection(
  state: MediaLibraryCollectionsState,
  collection: MediaCollection
): MediaLibraryCollectionsState {
  const filtered = state.collections.filter((c) => c.id !== collection.id);
  return {
    collections: [...filtered, collection],
  };
}

/**
 * Renames a collection immutably. Throws if the collection does not exist.
 */
export function renameCollection(
  state: MediaLibraryCollectionsState,
  collectionId: string,
  newName: string
): MediaLibraryCollectionsState {
  const collection = state.collections.find((c) => c.id === collectionId);
  if (!collection) {
    throw new Error(`Collection not found: ${collectionId}`);
  }

  const updated = {
    ...collection,
    name: newName,
    updatedAt: now(),
  };

  return {
    collections: state.collections.map((c) => (c.id === collectionId ? updated : c)),
  };
}

/**
 * Deletes a collection immutably. Also clears it from the active browser folder
 * selection state when referenced (returns the derived next browser state).
 */
export function deleteCollection(
  state: MediaLibraryCollectionsState,
  collectionId: string
): MediaLibraryCollectionsState {
  const nextCollections = state.collections.filter((c) => c.id !== collectionId);
  if (nextCollections.length === state.collections.length) {
    throw new Error(`Collection not found: ${collectionId}`);
  }

  return {
    collections: nextCollections,
  };
}

/**
 * Adds an asset reference to a collection immutably (idempotent). Throws if
 * the collection does not exist. Does not duplicate binary payload — only the
 * `assetId` reference is stored.
 */
export function addAssetToCollection(
  state: MediaLibraryCollectionsState,
  collectionId: string,
  assetId: string
): MediaLibraryCollectionsState {
  const collection = state.collections.find((c) => c.id === collectionId);
  if (!collection) {
    throw new Error(`Collection not found: ${collectionId}`);
  }

  if (collection.assetIds.includes(assetId)) {
    return state;
  }

  const updated = {
    ...collection,
    assetIds: [...collection.assetIds, assetId],
    updatedAt: now(),
  };

  return {
    collections: state.collections.map((c) => (c.id === collectionId ? updated : c)),
  };
}

/**
 * Removes an asset reference from a collection immutably. Safe no-op when the
 * asset is not present in the collection.
 */
export function removeAssetFromCollection(
  state: MediaLibraryCollectionsState,
  collectionId: string,
  assetId: string
): MediaLibraryCollectionsState {
  const collection = state.collections.find((c) => c.id === collectionId);
  if (!collection) {
    throw new Error(`Collection not found: ${collectionId}`);
  }

  const updated = {
    ...collection,
    assetIds: collection.assetIds.filter((id) => id !== assetId),
    updatedAt: now(),
  };

  return {
    collections: state.collections.map((c) => (c.id === collectionId ? updated : c)),
  };
}

/**
 * Resolves the membership of an asset across all collections — returns the
 * collection IDs the asset belongs to (read-only, deterministic).
 */
export function getCollectionsForAsset(
  state: { readonly collections: ReadonlyArray<{ readonly id: string; readonly assetIds: ReadonlyArray<string> }> },
  assetId: string
): ReadonlyArray<string> {
  return state.collections
    .filter((c) => c.assetIds.includes(assetId))
    .map((c) => c.id);
}

/**
 * Returns true if the given asset belongs to the specified collection.
 */
export function isInCollection(
  state: MediaLibraryCollectionsState,
  assetId: string,
  collectionId: string
): boolean {
  const collection = state.collections.find((c) => c.id === collectionId);
  if (!collection) return false;
  return collection.assetIds.includes(assetId);
}

/**
 * Clears the active folder selection from the browser state when a referenced
 * collection is deleted. Pure helper kept here so collection lifecycle and
 * browser selection stay coherent.
 */
export function deriveBrowserOnCollectionDelete(
  collectionsState: MediaLibraryCollectionsState,
  deletedCollectionId: string,
  browserState: AssetBrowserState
): AssetBrowserState {
  if (browserState.activeFolderId !== deletedCollectionId) {
    return browserState;
  }
  return {
    ...browserState,
    activeFolderId: null,
  };
}
