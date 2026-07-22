import { PackageManifest } from '../PackageManifest';

export interface MigrationStep {
  readonly from: string;
  readonly to: string;
  readonly description: string;
}

export class MigrationEngine {
  static getMigrationSteps(
    installed: PackageManifest,
    target: PackageManifest
  ): ReadonlyArray<MigrationStep> {
    if (!target.migrations) {
      return [];
    }

    return target.migrations.filter(m => {
      return m.to === target.version || m.from === installed.version;
    });
  }
}
