/**
 * G1-183: Runtime Composition Integrator
 *
 * Manages runtime capability bindings — registering, querying, health-checking,
 * versioning, and exporting the composition manifest.
 *
 * HONESTY BOUNDARY: This is a registry/manifest tool, NOT a live orchestration
 * engine. Health checks are stubs; capability execution lives elsewhere.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RuntimeCapabilityBinding {
  readonly capabilityId: string;
  readonly version: string;
  readonly runtimeEndpoint: string;
  readonly healthCheck: string;
  readonly enabled: boolean;
}

export interface CompositionManifest {
  readonly timestamp: string;
  readonly totalCapabilities: number;
  readonly activeCapabilities: number;
  readonly capabilities: ReadonlyArray<RuntimeCapabilityBinding>;
}

// ---------------------------------------------------------------------------
// Runtime Composition Integrator
// ---------------------------------------------------------------------------

export class RuntimeCompositionIntegrator {
  private _registry: Map<string, RuntimeCapabilityBinding> = new Map();

  /**
   * Register a capability in the runtime composition registry.
   * Overwrites any existing binding with the same capabilityId.
   */
  registerCapability(binding: RuntimeCapabilityBinding): void {
    this._registry.set(binding.capabilityId, binding);
  }

  /**
   * Remove a capability from the registry.
   * Returns true if the capability was present and removed, false otherwise.
   */
  unregisterCapability(capabilityId: string): boolean {
    return this._registry.delete(capabilityId);
  }

  /**
   * Retrieve the full binding info for a capability.
   */
  getCapability(capabilityId: string): RuntimeCapabilityBinding | undefined {
    return this._registry.get(capabilityId);
  }

  /**
   * List all capabilities that are currently enabled.
   */
  listActiveCapabilities(): ReadonlyArray<RuntimeCapabilityBinding> {
    return Array.from(this._registry.values()).filter((b) => b.enabled);
  }

  /**
   * Validate capability health.
   * Stub: returns true for registered capabilities, false for unregistered.
   */
  validateCapabilityHealth(capabilityId: string): boolean {
    return this._registry.has(capabilityId);
  }

  /**
   * Return the version string for a registered capability.
   */
  getCapabilityVersion(capabilityId: string): string | undefined {
    return this._registry.get(capabilityId)?.version;
  }

  /**
   * Upgrade the version of a registered capability.
   * Returns true if the upgrade succeeded, false if the capability is not found.
   */
  upgradeCapability(capabilityId: string, newVersion: string): boolean {
    const existing = this._registry.get(capabilityId);
    if (!existing) return false;

    this._registry.set(capabilityId, {
      ...existing,
      version: newVersion,
    });
    return true;
  }

  /**
   * Export the current composition state as a JSON-serialisable manifest.
   */
  exportCompositionManifest(): CompositionManifest {
    const all = Array.from(this._registry.values());
    return {
      timestamp: new Date().toISOString(),
      totalCapabilities: all.length,
      activeCapabilities: all.filter((b) => b.enabled).length,
      capabilities: all,
    };
  }
}
