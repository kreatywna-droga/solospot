/**
 * PluginManifest.ts — PM43 Plugin Manifest Specification (ETAP 1)
 *
 * Complete specification of a Studio plugin manifest.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { PluginMetadata } from './PluginMetadata';
import type { PluginCapability } from './PluginCapabilities';
import type { PluginPermissionsConfig } from './PluginPermissions';

export interface PluginCompatibility {
  readonly minStudioVersion: string;
  readonly maxStudioVersion?: string;
}

export interface PluginManifest {
  readonly metadata: PluginMetadata;
  readonly capabilities: ReadonlyArray<PluginCapability>;
  readonly permissions: PluginPermissionsConfig;
  readonly compatibility: PluginCompatibility;
  readonly entryPoint: string;
}

export interface ManifestValidationResult {
  readonly isValid: boolean;
  readonly errors: ReadonlyArray<string>;
}

export function validatePluginManifest(manifest: unknown): ManifestValidationResult {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== 'object' || manifest === null) {
    errors.push('Plugin manifest is null or not an object.');
    return { isValid: false, errors };
  }

  const m = manifest as PluginManifest;

  if (!m.metadata) {
    errors.push('Manifest missing required metadata.');
  } else {
    if (!m.metadata.pluginId) errors.push('Metadata missing pluginId.');
    if (!m.metadata.version) errors.push('Metadata missing version.');
    if (!m.metadata.apiVersion) errors.push('Metadata missing apiVersion.');
  }

  if (!m.capabilities || !Array.isArray(m.capabilities)) {
    errors.push('Manifest missing capabilities array.');
  }

  if (!m.compatibility || !m.compatibility.minStudioVersion) {
    errors.push('Manifest missing compatibility minStudioVersion.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
