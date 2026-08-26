/**
 * AnimationAssetBrowser.ts — PM42 Asset Browser Model (ETAP 2)
 *
 * Folder tree hierarchy, collections, favorites, recent assets, and browser view state.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface AssetFolder {
  readonly id: string;
  readonly name: string;
  readonly parentFolderId?: string | null;
  readonly assetIds: ReadonlyArray<string>;
}

export interface AssetBrowserState {
  readonly activeFolderId: string | null;
  readonly folders: ReadonlyArray<AssetFolder>;
  readonly favoriteAssetIds: ReadonlyArray<string>;
  readonly recentAssetIds: ReadonlyArray<string>; // max 20
  readonly activeCategoryFilter?: string | null;
}

export const INITIAL_ASSET_BROWSER_STATE: AssetBrowserState = {
  activeFolderId: null,
  folders: [],
  favoriteAssetIds: [],
  recentAssetIds: [],
  activeCategoryFilter: null,
};

export function createAssetBrowserState(
  partial: Partial<AssetBrowserState> = {}
): AssetBrowserState {
  return {
    ...INITIAL_ASSET_BROWSER_STATE,
    ...partial,
  };
}

/**
 * Toggles an asset's favorite status immutably.
 */
export function toggleFavoriteAsset(
  state: AssetBrowserState,
  assetId: string
): AssetBrowserState {
  const isFav = state.favoriteAssetIds.includes(assetId);
  const favoriteAssetIds = isFav
    ? state.favoriteAssetIds.filter((id) => id !== assetId)
    : [...state.favoriteAssetIds, assetId];

  return {
    ...state,
    favoriteAssetIds,
  };
}

/**
 * Pushes an asset ID into the recent assets queue (max 20) immutably.
 */
export function touchRecentAsset(
  state: AssetBrowserState,
  assetId: string
): AssetBrowserState {
  const filtered = state.recentAssetIds.filter((id) => id !== assetId);
  const recentAssetIds = [assetId, ...filtered].slice(0, 20);

  return {
    ...state,
    recentAssetIds,
  };
}

/**
 * Creates or updates an asset folder immutably.
 */
export function addAssetFolder(
  state: AssetBrowserState,
  folder: AssetFolder
): AssetBrowserState {
  const filtered = state.folders.filter((f) => f.id !== folder.id);
  return {
    ...state,
    folders: [...filtered, folder],
  };
}
