/**
 * PluginMetadata.ts — PM43 Plugin Metadata Model (ETAP 1)
 *
 * DECISION-084: Public Extension API jest wersjonowane niezależnie od implementacji wewnętrznej.
 *
 * Core metadata model for Plugin SDK extensions.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface PluginMetadata {
  readonly pluginId: string;
  readonly name: string;
  readonly version: string; // Plugin semver
  readonly apiVersion: string; // Target Extension API semver (e.g., "1.0.0")
  readonly author: string;
  readonly description: string;
  readonly homepage?: string;
  readonly license?: string;
}

export function validatePluginMetadata(metadata: PluginMetadata | null): boolean {
  if (!metadata) return false;
  if (!metadata.pluginId || metadata.pluginId.trim().length === 0) return false;
  if (!metadata.name || metadata.name.trim().length === 0) return false;
  if (!metadata.version || metadata.version.trim().length === 0) return false;
  if (!metadata.apiVersion || metadata.apiVersion.trim().length === 0) return false;
  return true;
}
