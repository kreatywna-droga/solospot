/**
 * Versioning System — Design System Version Management
 *
 * Provides versioning for design system elements and style packs.
 */

import type { VersionedDependency, VersionChange, VersionedItem } from '../types';

export interface VersionEntry {
  id: string;
  itemId: string;
  itemType: string;
  version: string;
  changelog: VersionChange[];
  dependencies: VersionedDependency[];
  createdAt: number;
  updatedAt: number;
  breaking: boolean;
}

export interface VersionManager {
  getVersion(id: string): VersionEntry | undefined;
  getVersions(itemId: string): VersionEntry[];
  createVersion(itemId: string, itemType: string, version: string, changes: string[]): VersionEntry;
  addDependency(itemId: string, dependencyId: string, version: string): void;
  checkCompatibility(itemId: string, dependencyId: string): boolean;
  getLatestVersion(itemId: string): string;
  getChangelog(itemId: string): VersionChange[];
}

export function createVersionManager(): VersionManager {
  const versions: Map<string, VersionEntry> = new Map();

  return {
    getVersion(id: string): VersionEntry | undefined {
      return versions.get(id);
    },
    getVersions(itemId: string): VersionEntry[] {
      return Array.from(versions.values()).filter((v) => v.itemId === itemId);
    },
    createVersion(itemId: string, itemType: string, version: string, changes: string[]): VersionEntry {
      const existing = this.getVersions(itemId);
      const latest = existing.length > 0 ? existing[existing.length - 1] : null;
      const breaking = changes.some((c) => c.startsWith('BREAKING'));

      const entry: VersionEntry = {
        id: `${itemId}-${version}`,
        itemId,
        itemType,
        version,
        changelog: changes.map((change, index) => ({
          version,
          date: Date.now(),
          changes: [change],
          breaking,
        })),
        dependencies: latest?.dependencies || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        breaking,
      };

      versions.set(entry.id, entry);
      return entry;
    },
    addDependency(itemId: string, dependencyId: string, version: string): void {
      const entry = this.getVersion(itemId);
      if (entry) {
        entry.dependencies.push({ itemId: dependencyId, version, required: true });
      }
    },
    checkCompatibility(itemId: string, dependencyId: string): boolean {
      const entry = this.getVersion(itemId);
      if (!entry) return true;
      const dep = entry.dependencies.find((d) => d.itemId === dependencyId);
      return dep ? dep.version.startsWith('1.') : true;
    },
    getLatestVersion(itemId: string): string {
      const itemVersions = this.getVersions(itemId);
      if (itemVersions.length === 0) return '0.0.0';
      return itemVersions[itemVersions.length - 1].version;
    },
    getChangelog(itemId: string): VersionChange[] {
      const itemVersions = this.getVersions(itemId);
      return itemVersions.flatMap((v) => v.changelog);
    },
  };
}

export const versionManager = createVersionManager();

export function getVersionInfo(itemId: string): {
  version: string;
  changelog: VersionChange[];
  dependencies: VersionedDependency[];
  breaking: boolean;
} {
  const entry = versionManager.getVersion(itemId);
  if (!entry) {
    return { version: '0.0.0', changelog: [], dependencies: [], breaking: false };
  }
  return {
    version: entry.version,
    changelog: entry.changelog,
    dependencies: entry.dependencies,
    breaking: entry.breaking,
  };
}

export default versionManager;
