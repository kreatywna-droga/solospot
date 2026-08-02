export type VersionBumpType = 'patch' | 'minor' | 'major' | 'none';

export interface PackageVersionInfo {
  packageName: string;
  currentVersion: string;
  isValidSemver: boolean;
  recommendedBump?: VersionBumpType;
  dependencyMismatches?: string[];
}

export class VersionAnalyzer {
  public static readonly SEMVER_REGEX = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

  public static validateSemver(version: string): boolean {
    return VersionAnalyzer.SEMVER_REGEX.test(version);
  }

  public static suggestBump(
    currentVersion: string,
    changeCategories: ('Added' | 'Changed' | 'Fixed' | 'Breaking')[]
  ): VersionBumpType {
    if (changeCategories.includes('Breaking')) {
      return 'major';
    }
    if (changeCategories.includes('Added') || changeCategories.includes('Changed')) {
      return 'minor';
    }
    if (changeCategories.includes('Fixed')) {
      return 'patch';
    }
    return 'none';
  }

  public static analyzePackages(packages: { name: string; version: string }[]): PackageVersionInfo[] {
    return packages.map(pkg => ({
      packageName: pkg.name,
      currentVersion: pkg.version,
      isValidSemver: VersionAnalyzer.validateSemver(pkg.version),
    }));
  }
}
