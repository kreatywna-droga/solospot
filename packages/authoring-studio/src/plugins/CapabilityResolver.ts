/**
 * CapabilityResolver.ts — PM43 Capability Resolver (ETAP 6)
 *
 * Verifies capabilities and required permissions for plugin operations.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { PluginCapability } from './PluginCapabilities';
import type { PluginManifest } from './PluginManifest';
import { hasCapabilityPermission } from './PluginPermissions';

export interface CapabilityCheckResult {
  readonly isAllowed: boolean;
  readonly capability: PluginCapability;
  readonly reason?: string;
}

/**
 * Verifies whether a plugin manifest grants permission to execute a specific capability.
 */
export function verifyPluginCapability(
  manifest: PluginManifest,
  capability: PluginCapability
): CapabilityCheckResult {
  if (!manifest.capabilities.includes(capability)) {
    return {
      isAllowed: false,
      capability,
      reason: `Capability "${capability}" was not declared in plugin manifest.`,
    };
  }

  const isGranted = hasCapabilityPermission(manifest.permissions, capability);
  if (!isGranted) {
    return {
      isAllowed: false,
      capability,
      reason: `Permission for capability "${capability}" has not been granted by user/policy.`,
    };
  }

  return {
    isAllowed: true,
    capability,
  };
}
