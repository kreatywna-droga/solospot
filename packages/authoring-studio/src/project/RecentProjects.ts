/**
 * RecentProjects.ts — Sprint S5 Recent Projects Registry (ETAP 4)
 *
 * Manages the ordered list of recently opened project references for the Welcome Screen.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { ProjectMetadata } from './ProjectMetadata';

export interface RecentProjectEntry {
  readonly projectId: string;
  readonly name: string;
  readonly thumbnailUrl?: string;
  readonly lastOpenedAt: number;
}

export interface RecentProjectsState {
  readonly entries: ReadonlyArray<RecentProjectEntry>;
  readonly maxEntries: number;
}

export function createRecentProjectsState(maxEntries: number = 10): RecentProjectsState {
  return { entries: [], maxEntries };
}

export function recordRecentProject(
  state: RecentProjectsState,
  metadata: ProjectMetadata
): RecentProjectsState {
  const filtered = state.entries.filter((e) => e.projectId !== metadata.projectId);
  const entry: RecentProjectEntry = {
    projectId: metadata.projectId,
    name: metadata.name,
    thumbnailUrl: metadata.thumbnailUrl,
    lastOpenedAt: Date.now(),
  };

  const updated = [entry, ...filtered].slice(0, state.maxEntries);
  return { ...state, entries: updated };
}

export function removeRecentProject(
  state: RecentProjectsState,
  projectId: string
): RecentProjectsState {
  return {
    ...state,
    entries: state.entries.filter((e) => e.projectId !== projectId),
  };
}

export function clearRecentProjects(state: RecentProjectsState): RecentProjectsState {
  return { ...state, entries: [] };
}
