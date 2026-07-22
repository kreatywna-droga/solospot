import { PackageManifest } from '../PackageManifest';

import { VersionEngine } from './VersionEngine';

export interface CompatibilityReport {
  readonly compatible: boolean;
  readonly reasons: ReadonlyArray<string>;
}

export class CompatibilityValidator {
  static isSemverCompatible(version: string, constraint: string): boolean {
    return VersionEngine.satisfies(version, constraint);
  }

  static validate(
    manifest: PackageManifest,
    environment: {
      readonly coreVersion: string;
      readonly platformVersion: string;
      readonly theme?: string;
      readonly activeCapabilities?: ReadonlyArray<string>;
    }
  ): CompatibilityReport {
    const reasons: string[] = [];

    // Core compatibility
    if (!this.isSemverCompatible(environment.coreVersion, manifest.compatibility.coreVersion)) {
      reasons.push(
        `Package requires core version ${manifest.compatibility.coreVersion}, but running version is ${environment.coreVersion}`
      );
    }

    return {
      compatible: reasons.length === 0,
      reasons
    };
  }
}
