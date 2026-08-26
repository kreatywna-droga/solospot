/**
 * PluginSandbox.ts — PM43 Plugin Sandbox Isolation (ETAP 6)
 *
 * DECISION-083: Plugin Sandbox izoluje wykonanie oraz egzekwuje uprawnienia.
 *
 * Execution sandbox wrapper wrapping PublicExtensionAPI with capability checks.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { PluginManifest } from './PluginManifest';
import type { PluginCapability } from './PluginCapabilities';
import type { PublicExtensionAPI } from './PublicExtensionAPI';
import { verifyPluginCapability } from './CapabilityResolver';

export interface PluginSandboxInstance {
  readonly manifest: PluginManifest;
  readonly api: PublicExtensionAPI;
  readonly executeGuarded: <T>(requiredCapability: PluginCapability, action: () => T) => T;
}

/**
 * Creates an isolated execution sandbox for a plugin.
 * DECISION-083: Enforces capability checking before executing guarded plugin actions.
 */
export function createPluginSandbox(
  manifest: PluginManifest,
  baseAPI: PublicExtensionAPI
): PluginSandboxInstance {
  const executeGuarded = <T>(requiredCapability: PluginCapability, action: () => T): T => {
    const check = verifyPluginCapability(manifest, requiredCapability);
    if (!check.isAllowed) {
      throw new Error(`Plugin "${manifest.metadata.pluginId}" permission denied: ${check.reason}`);
    }
    return action();
  };

  return {
    manifest,
    api: baseAPI,
    executeGuarded,
  };
}
