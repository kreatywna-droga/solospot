/**
 * AnimationVersioning.ts — PM41 Animation Versioning (ETAP 6)
 *
 * DECISION-073: Versioning wykorzystuje Semantic Versioning.
 *
 * Semantic versioning parser (major.minor.patch), migration metadata, and version compatibility validators.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface SemVer {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

export interface MigrationStep {
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly description: string;
}

export interface VersionCompatibilityReport {
  readonly isCompatible: boolean;
  readonly currentVersion: string;
  readonly targetVersion: string;
  readonly requiresMigration: boolean;
  readonly migrationSteps: ReadonlyArray<MigrationStep>;
}

/**
 * Parses a semantic version string "X.Y.Z".
 */
export function parseSemVer(versionString: string): SemVer {
  if (!versionString || typeof versionString !== 'string') {
    throw new Error(`Invalid semantic version string: "${versionString}"`);
  }
  const parts = versionString.trim().split('.');
  const major = parseInt(parts[0] ?? '0', 10);
  const minor = parseInt(parts[1] ?? '0', 10);
  const patch = parseInt(parts[2] ?? '0', 10);

  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    throw new Error(`Invalid semantic version string: "${versionString}"`);
  }

  return { major, minor, patch };
}

/**
 * Compares two semantic version strings:
 *   returns < 0 if v1 < v2
 *   returns 0 if v1 === v2
 *   returns > 0 if v1 > v2
 */
export function compareSemVer(v1: string, v2: string): number {
  const s1 = parseSemVer(v1);
  const s2 = parseSemVer(v2);

  if (s1.major !== s2.major) return s1.major - s2.major;
  if (s1.minor !== s2.minor) return s1.minor - s2.minor;
  return s1.patch - s2.patch;
}

/**
 * Evaluates semantic version compatibility between current and target versions.
 */
export function checkVersionCompatibility(
  currentVersion: string,
  targetVersion: string
): VersionCompatibilityReport {
  const cur = parseSemVer(currentVersion);
  const tgt = parseSemVer(targetVersion);

  const isSameMajor = cur.major === tgt.major;
  const requiresMigration = compareSemVer(currentVersion, targetVersion) < 0;

  const migrationSteps: MigrationStep[] = [];
  if (requiresMigration) {
    migrationSteps.push({
      fromVersion: currentVersion,
      toVersion: targetVersion,
      description: `Migrate schema from v${currentVersion} to v${targetVersion}`,
    });
  }

  return {
    isCompatible: isSameMajor,
    currentVersion,
    targetVersion,
    requiresMigration,
    migrationSteps,
  };
}
