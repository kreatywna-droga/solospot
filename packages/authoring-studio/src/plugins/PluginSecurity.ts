/**
 * PluginSecurity.ts — PM43 Plugin Security Policies (ETAP 6)
 *
 * Enforces security policy rules and capability permission checks.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { PluginManifest } from './PluginManifest';
import type { PluginCapability } from './PluginCapabilities';
import { verifyPluginCapability } from './CapabilityResolver';

export interface SecurityPolicyReport {
  readonly isSecured: boolean;
  readonly checkedCapabilities: ReadonlyArray<PluginCapability>;
  readonly violations: ReadonlyArray<string>;
}

/**
 * Validates security compliance for a plugin manifest across all declared capabilities.
 */
export function auditPluginSecurity(manifest: PluginManifest): SecurityPolicyReport {
  const violations: string[] = [];

  for (const capability of manifest.capabilities) {
    const result = verifyPluginCapability(manifest, capability);
    if (!result.isAllowed) {
      violations.push(result.reason ?? `Capability "${capability}" permission rejected.`);
    }
  }

  return {
    isSecured: violations.length === 0,
    checkedCapabilities: [...manifest.capabilities],
    violations,
  };
}
