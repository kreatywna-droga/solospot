/**
 * G1-184: Capability Version Compatibility
 *
 * Manages semver-like version contracts for platform capabilities.
 * Supports range parsing, compatibility checks, deprecation, and sunset tracking.
 *
 * HONESTY BOUNDARY: This is a version registry/analysis tool.
 * It does NOT perform runtime version resolution or hot-swapping.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Simplified semver range string, e.g. `'1.x'`, `'^2.0.0'`, `'>=1.0.0 <3.0.0'` */
export type VersionRange = string;

export interface CapabilityVersionContract {
  readonly capabilityId: string;
  readonly version: string;
  readonly compatibleWith: ReadonlyArray<VersionRange>;
  readonly deprecated: boolean;
  readonly sunsetAtMs?: number;
}

export interface CompatibilityReport {
  readonly timestamp: string;
  readonly totalCapabilities: number;
  readonly totalVersions: number;
  readonly capabilities: ReadonlyArray<{
    readonly capabilityId: string;
    readonly versions: ReadonlyArray<{
      readonly version: string;
      readonly deprecated: boolean;
      readonly sunset: boolean;
    }>;
  }>;
}

// ---------------------------------------------------------------------------
// Version Parsing Helpers
// ---------------------------------------------------------------------------

/** Parse a semver string "major.minor.patch" into a numeric tuple. */
function parseVersion(v: string): [number, number, number] {
  const parts = v.split('.').map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

/** Compare two semver tuples: returns -1, 0, or 1. */
function compareVersions(a: string, b: string): number {
  const [aMaj, aMin, aPat] = parseVersion(a);
  const [bMaj, bMin, bPat] = parseVersion(b);
  if (aMaj !== bMaj) return aMaj < bMaj ? -1 : 1;
  if (aMin !== bMin) return aMin < bMin ? -1 : 1;
  if (aPat !== bPat) return aPat < bPat ? -1 : 1;
  return 0;
}

/** Check whether a concrete version satisfies a version range. */
function satisfiesRange(version: string, range: VersionRange): boolean {
  const trimmed = range.trim();

  // Exact match
  if (trimmed === version) return true;

  // "1.x" or "1.X" — major must match
  if (/^\d+\.x$/i.test(trimmed)) {
    const major = parseInt(trimmed.split('.')[0], 10);
    return parseVersion(version)[0] === major;
  }

  // "1.2.x" — major.minor must match
  if (/^\d+\.\d+\.x$/i.test(trimmed)) {
    const [maj, min] = trimmed.split('.').map(Number);
    const [vMaj, vMin] = parseVersion(version);
    return vMaj === maj && vMin === min;
  }

  // "^2.0.0" — compatible with (>= and < next breaking)
  const caretMatch = trimmed.match(/^\^(\d+)\.(\d+)\.(\d+)$/);
  if (caretMatch) {
    const [, cMaj, cMin, cPat] = caretMatch.map(Number);
    const [vMaj, vMin, vPat] = parseVersion(version);
    if (vMaj !== cMaj) return false;
    if (vMaj > cMaj) return true;
    if (vMin !== cMin) return vMin > cMin;
    return vPat >= cPat;
  }

  // "~1.2.3" — approximately equivalent (>= and < next minor)
  const tildeMatch = trimmed.match(/^~(\d+)\.(\d+)\.(\d+)$/);
  if (tildeMatch) {
    const [, tMaj, tMin, tPat] = tildeMatch.map(Number);
    const [vMaj, vMin, vPat] = parseVersion(version);
    if (vMaj !== tMaj) return false;
    if (vMin !== tMin) return false;
    return vPat >= tPat;
  }

  // ">=1.0.0 <3.0.0" — space-separated compound range
  if (trimmed.includes(' ')) {
    const parts = trimmed.split(/\s+/);
    for (const part of parts) {
      if (!satisfiesRange(version, part)) return false;
    }
    return true;
  }

  // Single comparator: ">=1.0.0", "<3.0.0", ">1.0.0", "<=2.0.0"
  const compMatch = trimmed.match(/^(>=|<=|>|<|==)?\s*(\d+(?:\.\d+)*(?:\.\d+)?)$/);
  if (compMatch) {
    const op = compMatch[1] ?? '==';
    const target = compMatch[2];
    const cmp = compareVersions(version, target);
    switch (op) {
      case '>=': return cmp >= 0;
      case '<=': return cmp <= 0;
      case '>':  return cmp > 0;
      case '<':  return cmp < 0;
      case '==':
      default:   return cmp === 0;
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Capability Version Manager
// ---------------------------------------------------------------------------

export class CapabilityVersionManager {
  private _contracts: Map<string, CapabilityVersionContract[]> = new Map();

  /**
   * Register a version contract. Overwrites if same capabilityId+version exists.
   */
  registerVersion(contract: CapabilityVersionContract): void {
    const existing = this._contracts.get(contract.capabilityId) ?? [];
    const filtered = existing.filter((c) => c.version !== contract.version);
    filtered.push(contract);
    this._contracts.set(contract.capabilityId, filtered);
  }

  /**
   * Check whether a target version of a capability is compatible with
   * any of the registered versions' `compatibleWith` ranges.
   */
  isVersionCompatible(capabilityId: string, targetVersion: string): boolean {
    const versions = this._contracts.get(capabilityId) ?? [];
    if (versions.length === 0) return false;
    return versions.some((v) =>
      v.compatibleWith.some((range) => satisfiesRange(targetVersion, range)),
    );
  }

  /**
   * Return the latest non-deprecated version for a capability.
   */
  getLatestVersion(capabilityId: string): string | undefined {
    const versions = this._contracts.get(capabilityId) ?? [];
    const nonDeprecated = versions.filter((v) => !v.deprecated);
    if (nonDeprecated.length === 0) return undefined;
    nonDeprecated.sort((a, b) => compareVersions(b.version, a.version));
    return nonDeprecated[0].version;
  }

  /**
   * List all deprecated versions for a capability.
   */
  getDeprecatedVersions(capabilityId: string): ReadonlyArray<string> {
    const versions = this._contracts.get(capabilityId) ?? [];
    return versions.filter((v) => v.deprecated).map((v) => v.version);
  }

  /**
   * List versions whose sunset time has passed.
   */
  getSunsetVersions(capabilityId: string): ReadonlyArray<string> {
    const now = Date.now();
    const versions = this._contracts.get(capabilityId) ?? [];
    return versions
      .filter((v) => v.sunsetAtMs !== undefined && v.sunsetAtMs <= now)
      .map((v) => v.version);
  }

  /**
   * Find the best matching version for a given range.
   * Returns the highest version that satisfies the range and is not sunset.
   */
  resolveCompatibleVersion(capabilityId: string, range: VersionRange): string | undefined {
    const now = Date.now();
    const versions = this._contracts.get(capabilityId) ?? [];
    const candidates = versions
      .filter((v) => satisfiesRange(v.version, range))
      .filter((v) => v.sunsetAtMs === undefined || v.sunsetAtMs > now)
      .sort((a, b) => compareVersions(b.version, a.version));
    return candidates[0]?.version;
  }

  /**
   * Generate a full compatibility report of all registered versions.
   */
  generateCompatibilityReport(): CompatibilityReport {
    const capabilities: Array<{
      readonly capabilityId: string;
      readonly versions: ReadonlyArray<{
        readonly version: string;
        readonly deprecated: boolean;
        readonly sunset: boolean;
      }>;
    }> = [];
    let totalVersions = 0;

    for (const [capId, versions] of this._contracts) {
      totalVersions += versions.length;
      capabilities.push({
        capabilityId: capId,
        versions: versions.map((v) => ({
          version: v.version,
          deprecated: v.deprecated,
          sunset: v.sunsetAtMs !== undefined && v.sunsetAtMs <= Date.now(),
        })),
      });
    }

    return {
      timestamp: new Date().toISOString(),
      totalCapabilities: this._contracts.size,
      totalVersions,
      capabilities,
    };
  }
}
