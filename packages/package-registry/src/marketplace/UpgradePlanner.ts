import { PackageManifest } from '../PackageManifest';
import { MigrationStep, MigrationEngine } from './MigrationEngine';

export interface UpgradePlan {
  readonly packageId: string;
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly updateAvailable: boolean;
  readonly isBreaking: boolean;
  readonly migrationRequired: boolean;
  readonly migrations: ReadonlyArray<MigrationStep>;
  readonly warnings: ReadonlyArray<string>;
}

export class UpgradePlanner {
  static planUpgrade(
    installed: PackageManifest,
    target: PackageManifest,
    coreVersion: string
  ): UpgradePlan {
    const fromVersion = installed.version;
    const toVersion = target.version;
    
    const updateAvailable = fromVersion !== toVersion;
    
    // Breaking check
    const [instMajor] = fromVersion.replace(/^v/, '').split('.').map(Number);
    const [tarMajor] = toVersion.replace(/^v/, '').split('.').map(Number);
    const isBreaking = tarMajor > instMajor;

    const migrations = MigrationEngine.getMigrationSteps(installed, target);
    const warnings: string[] = [];

    if (target.deprecated) {
      warnings.push(
        `Package '${target.id}' is deprecated since ${target.deprecatedSince || 'unknown'}.` +
        (target.replacement ? ` Use '${target.replacement}' instead.` : '')
      );
    }

    return {
      packageId: installed.id,
      fromVersion,
      toVersion,
      updateAvailable,
      isBreaking,
      migrationRequired: migrations.length > 0 || isBreaking,
      migrations,
      warnings
    };
  }
}
