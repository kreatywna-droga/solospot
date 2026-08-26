/**
 * AnimationSharedLibrary.ts — PM42 Shared Asset Libraries (ETAP 6)
 *
 * DECISION-076: Shared Library nie zawiera Runtime.
 *
 * Multi-tier shared asset libraries model (Workspace Library, Global Library, User Library).
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { AnimationAssetItem } from './AnimationAssetRegistry';

export type LibraryTier = 'workspace' | 'global' | 'user';

export interface SharedAssetLibrary {
  readonly id: string;
  readonly name: string;
  readonly tier: LibraryTier;
  readonly isReadOnly: boolean;
  readonly assetItems: ReadonlyArray<AnimationAssetItem>;
}

export interface SharedLibrariesState {
  readonly workspaceLibraries: ReadonlyArray<SharedAssetLibrary>;
  readonly globalLibraries: ReadonlyArray<SharedAssetLibrary>;
  readonly userLibraries: ReadonlyArray<SharedAssetLibrary>;
}

export const INITIAL_SHARED_LIBRARIES_STATE: SharedLibrariesState = {
  workspaceLibraries: [],
  globalLibraries: [],
  userLibraries: [],
};

export function createSharedLibrariesState(
  partial: Partial<SharedLibrariesState> = {}
): SharedLibrariesState {
  return {
    ...INITIAL_SHARED_LIBRARIES_STATE,
    ...partial,
  };
}

/**
 * Registers or updates a shared asset library immutably in its corresponding tier array.
 */
export function registerSharedLibrary(
  state: SharedLibrariesState,
  library: SharedAssetLibrary
): SharedLibrariesState {
  if (library.tier === 'workspace') {
    const filtered = state.workspaceLibraries.filter((l) => l.id !== library.id);
    return { ...state, workspaceLibraries: [...filtered, library] };
  }

  if (library.tier === 'global') {
    const filtered = state.globalLibraries.filter((l) => l.id !== library.id);
    return { ...state, globalLibraries: [...filtered, library] };
  }

  const filtered = state.userLibraries.filter((l) => l.id !== library.id);
  return { ...state, userLibraries: [...filtered, library] };
}
