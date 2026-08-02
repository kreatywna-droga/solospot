import { PackageVersionInfo, VersionAnalyzer } from '../version/VersionAnalyzer';
import { ChangelogEntry } from '../changelog/ChangelogAnalyzer';

export interface ReleaseValidationResult {
  isReady: boolean;
  errors: string[];
  warnings: string[];
  targetVersion: string;
}

export class ReleaseValidator {
  public static validateReleaseReadiness(
    targetVersion: string,
    packageInfos: PackageVersionInfo[],
    changelogEntries: ChangelogEntry[]
  ): ReleaseValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!VersionAnalyzer.validateSemver(targetVersion)) {
      errors.push(`Target release version '${targetVersion}' is not valid SemVer.`);
    }

    // Check invalid package versions
    for (const pkg of packageInfos) {
      if (!pkg.isValidSemver) {
        errors.push(`Package '${pkg.packageName}' has invalid version string '${pkg.currentVersion}'.`);
      }
    }

    // Check changelog entry presence
    const changelogEntry = changelogEntries.find(e => e.version === targetVersion);
    if (!changelogEntry) {
      warnings.push(`No CHANGELOG entry found for target version '${targetVersion}'.`);
    } else {
      const totalChanges = changelogEntry.added.length + changelogEntry.changed.length + changelogEntry.fixed.length + changelogEntry.breaking.length;
      if (totalChanges === 0) {
        warnings.push(`CHANGELOG entry for version '${targetVersion}' has zero documented changes.`);
      }
    }

    return {
      isReady: errors.length === 0,
      errors,
      warnings,
      targetVersion,
    };
  }
}
