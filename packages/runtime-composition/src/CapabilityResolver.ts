import { PackageManifest } from './PackageResolver';

export class CompositionConflictError extends Error {
  constructor(message: string, public readonly conflictDetails?: any) {
    super(message);
    this.name = 'CompositionConflictError';
  }
}

export class CapabilityResolver {
  constructor() {}

  /**
   * Resolves a flat list of capabilities from resolved packages.
   * Leverages package priority to resolve duplicates.
   * Throws CompositionConflictError if there is a priority tie for the same capability.
   */
  public resolve(packages: PackageManifest[]): {
    capabilities: string[];
    mapping: Map<string, PackageManifest>;
  } {
    const capabilityOwners = new Map<string, PackageManifest>();
    const mapping = new Map<string, PackageManifest>();

    for (const pkg of packages) {
      for (const capability of pkg.capabilities) {
        const existingOwner = capabilityOwners.get(capability);
        if (existingOwner) {
          if (pkg.priority > existingOwner.priority) {
            // New package has higher priority, overrides existing
            capabilityOwners.set(capability, pkg);
          } else if (pkg.priority === existingOwner.priority) {
            // Tie -> Unresolved conflict
            throw new CompositionConflictError(
              `Capability conflict detected for '${capability}' between package '${pkg.id}' and '${existingOwner.id}' with identical priority ${pkg.priority}`,
              { capability, pkgA: pkg.id, pkgB: existingOwner.id, priority: pkg.priority }
            );
          }
          // If pkg.priority < existingOwner.priority, keep existingOwner (no-op)
        } else {
          capabilityOwners.set(capability, pkg);
        }
      }
    }

    const capabilities = Array.from(capabilityOwners.keys());
    for (const [cap, pkg] of capabilityOwners.entries()) {
      mapping.set(cap, pkg);
    }

    return {
      capabilities: capabilities.sort(),
      mapping,
    };
  }
}
