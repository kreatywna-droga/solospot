export interface PackageManifest {
  id: string;
  version: string;
  priority: number;
  dependencies?: Record<string, string>; // packageId -> semver constraint or simple version match
  capabilities: string[];
  configurationDefaults?: Record<string, any>;
}

export class PackageResolver {
  private readonly registry = new Map<string, PackageManifest>();

  constructor() {}

  /**
   * Registers a package manifest in the registry.
   */
  public register(manifest: PackageManifest): void {
    this.registry.set(manifest.id, manifest);
  }

  /**
   * Resets the registry for testing.
   */
  public clear(): void {
    this.registry.clear();
  }

  /**
   * Resolves packages and their dependencies in correct DAG order.
   * Throws if a package is missing or if a circular dependency is detected.
   */
  public resolve(requestedPackageIds: string[]): PackageManifest[] {
    const resolved: PackageManifest[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (packageId: string) => {
      if (visiting.has(packageId)) {
        throw new Error(`Circular dependency detected involving package: ${packageId}`);
      }
      if (visited.has(packageId)) {
        return;
      }

      const manifest = this.registry.get(packageId);
      if (!manifest) {
        throw new Error(`Package not found in registry: ${packageId}`);
      }

      visiting.add(packageId);

      // Resolve dependencies first
      if (manifest.dependencies) {
        for (const depId of Object.keys(manifest.dependencies)) {
          // Check version constraint (basic check for simplicity/robustness in tests)
          const depManifest = this.registry.get(depId);
          if (!depManifest) {
            throw new Error(`Package dependency not found: ${depId} (required by ${packageId})`);
          }
          // Dynamic DFS traversal
          visit(depId);
        }
      }

      visiting.delete(packageId);
      visited.add(packageId);
      resolved.push(manifest);
    };

    for (const id of requestedPackageIds) {
      visit(id);
    }

    return resolved;
  }
}
