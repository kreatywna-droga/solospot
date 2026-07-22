import { PackageManifest } from '../PackageManifest';
import { PackageRegistry } from '../PackageRegistry';

export interface UpdateReport {
  readonly packageId: string;
  readonly installedVersion: string;
  readonly availableVersion: string;
  readonly updateAvailable: boolean;
  readonly isBreaking: boolean;
  readonly migrationRequired: boolean;
}

export class UpdateDetector {
  constructor(private readonly registry: PackageRegistry) {}

  async detectUpdate(installed: PackageManifest): Promise<UpdateReport> {
    const latestEntry = await this.registry.getPackage(installed.id, 'latest');
    if (!latestEntry) {
      return {
        packageId: installed.id,
        installedVersion: installed.version,
        availableVersion: installed.version,
        updateAvailable: false,
        isBreaking: false,
        migrationRequired: false
      };
    }

    const latest = latestEntry.manifest;
    if (latest.version === installed.version) {
      return {
        packageId: installed.id,
        installedVersion: installed.version,
        availableVersion: installed.version,
        updateAvailable: false,
        isBreaking: false,
        migrationRequired: false
      };
    }

    // Determine if it is breaking
    const [instMajor] = installed.version.split('.').map(Number);
    const [latMajor] = latest.version.split('.').map(Number);
    const isBreaking = latMajor > instMajor;

    return {
      packageId: installed.id,
      installedVersion: installed.version,
      availableVersion: latest.version,
      updateAvailable: true,
      isBreaking,
      migrationRequired: isBreaking // if breaking, it requires migrations
    };
  }
}
