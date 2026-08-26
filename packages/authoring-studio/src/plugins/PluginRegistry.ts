/**
 * PluginRegistry.ts — PM43 Plugin Registry (ETAP 2)
 *
 * Registration, state management, conflict detection, and indexing of studio plugins.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { PluginManifest } from './PluginManifest';
import { validatePluginManifest } from './PluginManifest';

export type PluginStateStatus = 'installed' | 'active' | 'disabled' | 'error';

export interface PluginRecord {
  readonly manifest: PluginManifest;
  readonly status: PluginStateStatus;
  readonly installedAt: number;
  readonly activatedAt?: number;
  readonly errorMessage?: string;
}

export interface PluginRegistryState {
  readonly plugins: ReadonlyArray<PluginRecord>;
}

export const INITIAL_PLUGIN_REGISTRY_STATE: PluginRegistryState = {
  plugins: [],
};

export function createPluginRegistryState(
  initialPlugins: ReadonlyArray<PluginRecord> = []
): PluginRegistryState {
  return {
    plugins: [...initialPlugins],
  };
}

/**
 * Registers a plugin manifest into the registry immutably.
 */
export function registerPlugin(
  state: PluginRegistryState,
  manifest: PluginManifest
): PluginRegistryState {
  const validation = validatePluginManifest(manifest);
  if (!validation.isValid) {
    throw new Error(`Plugin manifest validation failed: ${validation.errors.join('; ')}`);
  }

  const record: PluginRecord = {
    manifest,
    status: 'installed',
    installedAt: Date.now(),
  };

  const filtered = state.plugins.filter((p) => p.manifest.metadata.pluginId !== manifest.metadata.pluginId);
  return {
    plugins: [...filtered, record],
  };
}

/**
 * Sets the active/disabled status of a plugin immutably.
 */
export function setPluginStatus(
  state: PluginRegistryState,
  pluginId: string,
  status: PluginStateStatus,
  errorMessage?: string
): PluginRegistryState {
  return {
    plugins: state.plugins.map((p) => {
      if (p.manifest.metadata.pluginId === pluginId) {
        return {
          ...p,
          status,
          activatedAt: status === 'active' ? Date.now() : p.activatedAt,
          errorMessage: status === 'error' ? errorMessage : undefined,
        };
      }
      return p;
    }),
  };
}

/**
 * Retrieves a registered plugin record by ID.
 */
export function getPluginById(
  state: PluginRegistryState,
  pluginId: string
): PluginRecord | null {
  return state.plugins.find((p) => p.manifest.metadata.pluginId === pluginId) ?? null;
}
