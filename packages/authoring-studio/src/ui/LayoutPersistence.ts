/**
 * LayoutPersistence.ts — Sprint S2 Workspace Layout Persistence (Preferences)
 *
 * Serialization and deserialization models for saving and restoring user workspace layout state.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { WorkspaceLayoutModel } from './WorkspaceLayout';

export interface PersistedLayoutPayload {
  readonly version: string;
  readonly userId: string;
  readonly layout: WorkspaceLayoutModel;
  readonly savedAt: number;
}

export function serializeWorkspaceLayout(
  userId: string,
  layout: WorkspaceLayoutModel
): string {
  const payload: PersistedLayoutPayload = {
    version: '1.0.0',
    userId,
    layout,
    savedAt: Date.now(),
  };

  return JSON.stringify(payload);
}

export function deserializeWorkspaceLayout(serialized: string): WorkspaceLayoutModel {
  const parsed: PersistedLayoutPayload = JSON.parse(serialized);
  if (!parsed || !parsed.layout) {
    throw new Error('Invalid workspace layout payload.');
  }

  return parsed.layout;
}
