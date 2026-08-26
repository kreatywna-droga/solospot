/**
 * PluginPermissions.ts — PM43 Plugin Permissions Model (ETAP 1)
 *
 * DECISION-081: Wszystkie pluginy działają przez Capability API.
 *
 * Granular permissions evaluation for capabilities.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { PluginCapability } from './PluginCapabilities';

export type PermissionLevel = 'granted' | 'denied' | 'prompt';

export interface PluginPermissionsConfig {
  readonly declaredCapabilities: ReadonlyArray<PluginCapability>;
  readonly grantedCapabilities: ReadonlyArray<PluginCapability>;
}

export function createPluginPermissionsConfig(
  declaredCapabilities: ReadonlyArray<PluginCapability> = [],
  grantedCapabilities: ReadonlyArray<PluginCapability> = []
): PluginPermissionsConfig {
  return {
    declaredCapabilities: [...declaredCapabilities],
    grantedCapabilities: [...grantedCapabilities],
  };
}

/**
 * Checks if a specific capability is granted to the plugin.
 */
export function hasCapabilityPermission(
  config: PluginPermissionsConfig,
  capability: PluginCapability
): boolean {
  if (!config.declaredCapabilities.includes(capability)) {
    return false;
  }
  return config.grantedCapabilities.includes(capability);
}
