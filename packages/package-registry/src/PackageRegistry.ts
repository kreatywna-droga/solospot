import { PackageManifest } from './PackageManifest';
import { PackageType } from './PackageType';

export interface PackageRegistry {
  register(manifest: PackageManifest, content: Uint8Array): Promise<void>;
  getPackage(id: string, versionConstraint?: string): Promise<{ manifest: PackageManifest; content: Uint8Array } | undefined>;
  listPackages(filter?: { type?: PackageType; capability?: string }): Promise<ReadonlyArray<PackageManifest>>;
}

export class InMemoryPackageRegistry implements PackageRegistry {
  private readonly registry = new Map<string, Map<string, { manifest: PackageManifest; content: Uint8Array }>>();

  async register(manifest: PackageManifest, content: Uint8Array): Promise<void> {
    if (!this.registry.has(manifest.id)) {
      this.registry.set(manifest.id, new Map());
    }
    const versions = this.registry.get(manifest.id)!;
    if (versions.has(manifest.version)) {
      throw new Error(`Package ${manifest.id}@${manifest.version} is already registered.`);
    }
    versions.set(manifest.version, { manifest, content });
  }

  async getPackage(id: string, versionConstraint?: string): Promise<{ manifest: PackageManifest; content: Uint8Array } | undefined> {
    const versions = this.registry.get(id);
    if (!versions || versions.size === 0) {
      return undefined;
    }

    if (!versionConstraint || versionConstraint === '*' || versionConstraint === 'latest') {
      // Return highest version (sorted alphabetically descending)
      const sortedVersions = Array.from(versions.keys()).sort((a, b) => b.localeCompare(a));
      return versions.get(sortedVersions[0]);
    }

    return versions.get(versionConstraint);
  }

  async listPackages(filter?: { type?: PackageType; capability?: string }): Promise<ReadonlyArray<PackageManifest>> {
    const all: PackageManifest[] = [];
    for (const versions of this.registry.values()) {
      for (const entry of versions.values()) {
        if (filter?.type && entry.manifest.type !== filter.type) {
          continue;
        }
        if (filter?.capability && !entry.manifest.capabilities.includes(filter.capability)) {
          continue;
        }
        all.push(entry.manifest);
      }
    }
    return all;
  }
}
