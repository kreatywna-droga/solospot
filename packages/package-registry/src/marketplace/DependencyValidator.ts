import { PackageManifest } from '../PackageManifest';
import { PackageRegistry } from '../PackageRegistry';

export interface DependencyValidationReport {
  readonly valid: boolean;
  readonly missingDependencies: ReadonlyArray<{ packageId: string; requiredConstraint: string; parentId: string }>;
  readonly cycles: ReadonlyArray<ReadonlyArray<string>>;
  readonly capabilityConflicts: ReadonlyArray<{ capability: string; packageIds: ReadonlyArray<string> }>;
  readonly errors: ReadonlyArray<string>;
}

export class DependencyValidator {
  constructor(private readonly registry: PackageRegistry) {}

  async validate(manifests: ReadonlyArray<PackageManifest>): Promise<DependencyValidationReport> {
    const missing: { packageId: string; requiredConstraint: string; parentId: string }[] = [];
    const errors: string[] = [];
    const manifestMap = new Map<string, PackageManifest>(manifests.map(m => [m.id, m]));

    // 1. Check missing and invalid dependency ranges
    for (const manifest of manifests) {
      for (const [depId, constraint] of Object.entries(manifest.dependencies)) {
        const resolved = manifestMap.get(depId);
        if (!resolved) {
          missing.push({ packageId: depId, requiredConstraint: constraint, parentId: manifest.id });
          errors.push(`Package '${manifest.id}' requires missing dependency '${depId}' (${constraint})`);
        } else {
          // Check version constraint compatibility (Simple major overlap check)
          const cleanVersion = resolved.version.replace(/^v/, '');
          const cleanConstraint = constraint.replace(/^[\^v]/, '');
          const [cMajor] = cleanConstraint.split('.').map(Number);
          const [vMajor] = cleanVersion.split('.').map(Number);
          if (cMajor !== vMajor && constraint !== '*') {
            errors.push(`Version conflict: '${manifest.id}' requires '${depId}' (${constraint}), but '${depId}' is version ${resolved.version}`);
          }
        }
      }
    }

    // 2. Detect cyclic dependencies
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const stack = new Set<string>();

    const dfs = (id: string, path: string[]) => {
      visited.add(id);
      stack.add(id);
      path.push(id);

      const manifest = manifestMap.get(id);
      if (manifest) {
        for (const depId of Object.keys(manifest.dependencies)) {
          if (stack.has(depId)) {
            const cycleStartIdx = path.indexOf(depId);
            cycles.push([...path.slice(cycleStartIdx), depId]);
          } else if (!visited.has(depId)) {
            dfs(depId, path);
          }
        }
      }

      path.pop();
      stack.delete(id);
    };

    for (const manifest of manifests) {
      if (!visited.has(manifest.id)) {
        dfs(manifest.id, []);
      }
    }

    if (cycles.length > 0) {
      errors.push(`Cyclic dependencies detected: ${cycles.map(c => c.join(' -> ')).join(', ')}`);
    }

    // 3. Detect capability conflicts (e.g. if we have two templates or theme conflicts)
    const capabilityOwners = new Map<string, string[]>();
    for (const manifest of manifests) {
      for (const cap of manifest.capabilities) {
        if (!capabilityOwners.has(cap)) {
          capabilityOwners.set(cap, []);
        }
        capabilityOwners.get(cap)!.push(manifest.id);
      }
    }

    const conflicts: { capability: string; packageIds: string[] }[] = [];
    // For certain capabilities (like 'theme'), we only allow one owner
    const exclusiveCapabilities = ['theme', 'template'];
    for (const [capability, owners] of capabilityOwners.entries()) {
      if (exclusiveCapabilities.includes(capability) && owners.length > 1) {
        conflicts.push({ capability, packageIds: owners });
        errors.push(`Capability conflict for '${capability}': multiple owners [${owners.join(', ')}]`);
      }
    }

    return {
      valid: errors.length === 0,
      missingDependencies: missing,
      cycles,
      capabilityConflicts: conflicts,
      errors
    };
  }
}
