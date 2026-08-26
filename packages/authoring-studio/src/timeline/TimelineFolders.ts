/**
 * TimelineFolders.ts — PM40 Timeline Track Folders (ETAP 6)
 *
 * DECISION-067: Bookmarks, Filtering oraz Foldery nie naruszają BuilderDocument SSOT.
 *
 * Folder hierarchy, collapse/expand toggle, and track grouping model.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface TimelineTrackFolder {
  readonly id: string;
  readonly name: string;
  readonly collapsed: boolean;
  readonly trackIds: ReadonlyArray<string>;
  readonly parentFolderId?: string | null;
  readonly color?: string;
}

export interface FoldersState {
  readonly folders: ReadonlyArray<TimelineTrackFolder>;
}

export const INITIAL_FOLDERS_STATE: FoldersState = {
  folders: [],
};

export function createFoldersState(
  partial: Partial<FoldersState> = {}
): FoldersState {
  return {
    ...INITIAL_FOLDERS_STATE,
    ...partial,
  };
}

/**
 * Adds or updates a folder immutably.
 */
export function addFolder(
  state: FoldersState,
  folder: TimelineTrackFolder
): FoldersState {
  const filtered = state.folders.filter((f) => f.id !== folder.id);
  return {
    folders: [...filtered, folder],
  };
}

/**
 * Removes a folder immutably.
 */
export function removeFolder(
  state: FoldersState,
  folderId: string
): FoldersState {
  return {
    folders: state.folders.filter((f) => f.id !== folderId),
  };
}

/**
 * Toggles collapse/expand status of a folder immutably.
 */
export function toggleFolderCollapsed(
  state: FoldersState,
  folderId: string
): FoldersState {
  return {
    folders: state.folders.map((f) =>
      f.id === folderId ? { ...f, collapsed: !f.collapsed } : f
    ),
  };
}

/**
 * Adds a track ID to a folder immutably.
 */
export function addTrackToFolder(
  state: FoldersState,
  folderId: string,
  trackId: string
): FoldersState {
  return {
    folders: state.folders.map((f) => {
      if (f.id === folderId) {
        const set = new Set([...f.trackIds, trackId]);
        return { ...f, trackIds: Array.from(set) };
      }
      return f;
    }),
  };
}
