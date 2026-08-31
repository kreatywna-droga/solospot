/**
 * CapabilityVersionCompatibilityG1184.test.ts — G1-184 Capability Version Compatibility
 *
 * Covers version registration, compatibility checking, range parsing,
 * deprecation/sunset tracking, resolution, and report generation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CapabilityVersionManager,
  CapabilityVersionContract,
} from '../CapabilityVersionCompatibility';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeContract(overrides: Partial<CapabilityVersionContract> = {}): CapabilityVersionContract {
  return {
    capabilityId: 'test-cap',
    version: '1.0.0',
    compatibleWith: ['>=1.0.0 <2.0.0'],
    deprecated: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('CapabilityVersionManager', () => {
  let manager: CapabilityVersionManager;

  beforeEach(() => {
    manager = new CapabilityVersionManager();
  });

  // ──────────────────────────────────────────────────────────────
  // Registration (tests 1–6)
  // ──────────────────────────────────────────────────────────────

  it('1: registerVersion stores a version contract', () => {
    manager.registerVersion(makeContract());
    const report = manager.generateCompatibilityReport();
    expect(report.totalVersions).toBe(1);
  });

  it('2: registerVersion stores multiple versions for same capability', () => {
    manager.registerVersion(makeContract({ version: '1.0.0' }));
    manager.registerVersion(makeContract({ version: '1.1.0' }));
    manager.registerVersion(makeContract({ version: '2.0.0' }));
    const report = manager.generateCompatibilityReport();
    expect(report.totalVersions).toBe(3);
  });

  it('3: registerVersion overwrites existing contract with same version', () => {
    manager.registerVersion(makeContract({ version: '1.0.0', compatibleWith: ['>=1.0.0'] }));
    manager.registerVersion(makeContract({ version: '1.0.0', compatibleWith: ['>=2.0.0'] }));
    const report = manager.generateCompatibilityReport();
    expect(report.totalVersions).toBe(1);
  });

  it('4: registerVersion stores distinct capabilities', () => {
    manager.registerVersion(makeContract({ capabilityId: 'cap-a', version: '1.0.0' }));
    manager.registerVersion(makeContract({ capabilityId: 'cap-b', version: '2.0.0' }));
    const report = manager.generateCompatibilityReport();
    expect(report.totalCapabilities).toBe(2);
  });

  it('5: registerVersion with deprecated flag', () => {
    manager.registerVersion(makeContract({ version: '1.0.0', deprecated: true }));
    const deprecated = manager.getDeprecatedVersions('test-cap');
    expect(deprecated).toEqual(['1.0.0']);
  });

  it('6: registerVersion with sunset timestamp', () => {
    const sunsetMs = Date.now() + 100_000;
    manager.registerVersion(makeContract({ version: '1.0.0', sunsetAtMs: sunsetMs }));
    const sunset = manager.getSunsetVersions('test-cap');
    expect(sunset).toEqual([]);
  });

  // ──────────────────────────────────────────────────────────────
  // Compatibility checks (tests 7–14)
  // ──────────────────────────────────────────────────────────────

  it('7: isVersionCompatible returns false for unknown capability', () => {
    expect(manager.isVersionCompatible('unknown', '1.0.0')).toBe(false);
  });

  it('8: isVersionCompatible returns true for version within range', () => {
    manager.registerVersion(makeContract({ compatibleWith: ['>=1.0.0 <2.0.0'] }));
    expect(manager.isVersionCompatible('test-cap', '1.5.0')).toBe(true);
  });

  it('9: isVersionCompatible returns false for version outside range', () => {
    manager.registerVersion(makeContract({ compatibleWith: ['>=1.0.0 <2.0.0'] }));
    expect(manager.isVersionCompatible('test-cap', '2.0.0')).toBe(false);
  });

  it('10: isVersionCompatible with exact version range', () => {
    manager.registerVersion(makeContract({ compatibleWith: ['1.5.0'] }));
    expect(manager.isVersionCompatible('test-cap', '1.5.0')).toBe(true);
    expect(manager.isVersionCompatible('test-cap', '1.5.1')).toBe(false);
  });

  it('11: isVersionCompatible with caret range ^1.0.0', () => {
    manager.registerVersion(makeContract({ compatibleWith: ['^1.0.0'] }));
    expect(manager.isVersionCompatible('test-cap', '1.0.0')).toBe(true);
    expect(manager.isVersionCompatible('test-cap', '1.9.9')).toBe(true);
    expect(manager.isVersionCompatible('test-cap', '2.0.0')).toBe(false);
  });

  it('12: isVersionCompatible with tilde range ~1.2.0', () => {
    manager.registerVersion(makeContract({ compatibleWith: ['~1.2.0'] }));
    expect(manager.isVersionCompatible('test-cap', '1.2.0')).toBe(true);
    expect(manager.isVersionCompatible('test-cap', '1.2.9')).toBe(true);
    expect(manager.isVersionCompatible('test-cap', '1.3.0')).toBe(false);
  });

  it('13: isVersionCompatible with multiple ranges (OR logic)', () => {
    manager.registerVersion(makeContract({ compatibleWith: ['>=1.0.0 <2.0.0', '>=3.0.0 <4.0.0'] }));
    expect(manager.isVersionCompatible('test-cap', '1.5.0')).toBe(true);
    expect(manager.isVersionCompatible('test-cap', '3.5.0')).toBe(true);
    expect(manager.isVersionCompatible('test-cap', '2.5.0')).toBe(false);
  });

  it('14: isVersionCompatible with "1.x" major wildcard', () => {
    manager.registerVersion(makeContract({ compatibleWith: ['1.x'] }));
    expect(manager.isVersionCompatible('test-cap', '1.0.0')).toBe(true);
    expect(manager.isVersionCompatible('test-cap', '1.9.9')).toBe(true);
    expect(manager.isVersionCompatible('test-cap', '2.0.0')).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────
  // Latest version (tests 15–18)
  // ──────────────────────────────────────────────────────────────

  it('15: getLatestVersion returns undefined for unknown capability', () => {
    expect(manager.getLatestVersion('unknown')).toBeUndefined();
  });

  it('16: getLatestVersion returns the only version', () => {
    manager.registerVersion(makeContract({ version: '1.0.0' }));
    expect(manager.getLatestVersion('test-cap')).toBe('1.0.0');
  });

  it('17: getLatestVersion returns highest non-deprecated version', () => {
    manager.registerVersion(makeContract({ version: '1.0.0' }));
    manager.registerVersion(makeContract({ version: '2.0.0' }));
    manager.registerVersion(makeContract({ version: '3.0.0' }));
    expect(manager.getLatestVersion('test-cap')).toBe('3.0.0');
  });

  it('18: getLatestVersion skips deprecated versions', () => {
    manager.registerVersion(makeContract({ version: '1.0.0', deprecated: false }));
    manager.registerVersion(makeContract({ version: '2.0.0', deprecated: true }));
    manager.registerVersion(makeContract({ version: '3.0.0', deprecated: false }));
    expect(manager.getLatestVersion('test-cap')).toBe('3.0.0');
  });

  // ──────────────────────────────────────────────────────────────
  // Deprecated versions (tests 19–22)
  // ──────────────────────────────────────────────────────────────

  it('19: getDeprecatedVersions returns empty for unknown capability', () => {
    expect(manager.getDeprecatedVersions('unknown')).toEqual([]);
  });

  it('20: getDeprecatedVersions lists all deprecated versions', () => {
    manager.registerVersion(makeContract({ version: '1.0.0', deprecated: true }));
    manager.registerVersion(makeContract({ version: '2.0.0', deprecated: false }));
    manager.registerVersion(makeContract({ version: '3.0.0', deprecated: true }));
    expect(manager.getDeprecatedVersions('test-cap')).toEqual(['1.0.0', '3.0.0']);
  });

  it('21: getDeprecatedVersions returns empty when no deprecated versions exist', () => {
    manager.registerVersion(makeContract({ version: '1.0.0', deprecated: false }));
    expect(manager.getDeprecatedVersions('test-cap')).toEqual([]);
  });

  it('22: getDeprecatedVersions returns empty for capability with no versions', () => {
    expect(manager.getDeprecatedVersions('empty')).toEqual([]);
  });

  // ──────────────────────────────────────────────────────────────
  // Sunset versions (tests 23–26)
  // ──────────────────────────────────────────────────────────────

  it('23: getSunsetVersions returns empty for unknown capability', () => {
    expect(manager.getSunsetVersions('unknown')).toEqual([]);
  });

  it('24: getSunsetVersions includes versions past sunset', () => {
    const pastMs = Date.now() - 100_000;
    manager.registerVersion(makeContract({ version: '1.0.0', sunsetAtMs: pastMs }));
    expect(manager.getSunsetVersions('test-cap')).toEqual(['1.0.0']);
  });

  it('25: getSunsetVersions excludes versions not yet sunset', () => {
    const futureMs = Date.now() + 100_000;
    manager.registerVersion(makeContract({ version: '1.0.0', sunsetAtMs: futureMs }));
    expect(manager.getSunsetVersions('test-cap')).toEqual([]);
  });

  it('26: getSunsetVersions excludes versions without sunset time', () => {
    manager.registerVersion(makeContract({ version: '1.0.0' }));
    expect(manager.getSunsetVersions('test-cap')).toEqual([]);
  });

  // ──────────────────────────────────────────────────────────────
  // Version resolution (tests 27–30)
  // ──────────────────────────────────────────────────────────────

  it('27: resolveCompatibleVersion returns best match', () => {
    manager.registerVersion(makeContract({ version: '1.0.0' }));
    manager.registerVersion(makeContract({ version: '1.5.0' }));
    manager.registerVersion(makeContract({ version: '1.9.0' }));
    expect(manager.resolveCompatibleVersion('test-cap', '>=1.0.0 <2.0.0')).toBe('1.9.0');
  });

  it('28: resolveCompatibleVersion returns undefined if no match', () => {
    manager.registerVersion(makeContract({ version: '1.0.0' }));
    expect(manager.resolveCompatibleVersion('test-cap', '>=2.0.0')).toBeUndefined();
  });

  it('29: resolveCompatibleVersion skips sunset versions', () => {
    const pastMs = Date.now() - 100_000;
    manager.registerVersion(makeContract({ version: '1.0.0', sunsetAtMs: pastMs }));
    manager.registerVersion(makeContract({ version: '1.5.0' }));
    expect(manager.resolveCompatibleVersion('test-cap', '>=1.0.0 <2.0.0')).toBe('1.5.0');
  });

  it('30: resolveCompatibleVersion returns undefined for unknown capability', () => {
    expect(manager.resolveCompatibleVersion('unknown', '>=1.0.0')).toBeUndefined();
  });

  // ──────────────────────────────────────────────────────────────
  // Report generation (tests 31–34)
  // ──────────────────────────────────────────────────────────────

  it('31: generateCompatibilityReport returns empty report for empty manager', () => {
    const report = manager.generateCompatibilityReport();
    expect(report.totalCapabilities).toBe(0);
    expect(report.totalVersions).toBe(0);
    expect(report.capabilities).toEqual([]);
  });

  it('32: generateCompatibilityReport includes correct counts', () => {
    manager.registerVersion(makeContract({ capabilityId: 'a', version: '1.0.0' }));
    manager.registerVersion(makeContract({ capabilityId: 'a', version: '2.0.0' }));
    manager.registerVersion(makeContract({ capabilityId: 'b', version: '1.0.0' }));
    const report = manager.generateCompatibilityReport();
    expect(report.totalCapabilities).toBe(2);
    expect(report.totalVersions).toBe(3);
  });

  it('33: generateCompatibilityReport marks deprecated versions correctly', () => {
    manager.registerVersion(makeContract({ version: '1.0.0', deprecated: true }));
    manager.registerVersion(makeContract({ version: '2.0.0', deprecated: false }));
    const report = manager.generateCompatibilityReport();
    const cap = report.capabilities.find((c) => c.capabilityId === 'test-cap')!;
    expect(cap.versions.find((v) => v.version === '1.0.0')?.deprecated).toBe(true);
    expect(cap.versions.find((v) => v.version === '2.0.0')?.deprecated).toBe(false);
  });

  it('34: generateCompatibilityReport has valid ISO timestamp', () => {
    const report = manager.generateCompatibilityReport();
    expect(() => new Date(report.timestamp)).not.toThrow();
    expect(new Date(report.timestamp).getTime()).not.toBeNaN();
  });

  // ──────────────────────────────────────────────────────────────
  // Edge cases (tests 35–38)
  // ──────────────────────────────────────────────────────────────

  it('35: version "0.0.0" satisfies ^0.0.0', () => {
    manager.registerVersion(makeContract({ compatibleWith: ['^0.0.0'] }));
    expect(manager.isVersionCompatible('test-cap', '0.0.0')).toBe(true);
  });

  it('36: version "1.2.3" satisfies >=1.0.0', () => {
    manager.registerVersion(makeContract({ compatibleWith: ['>=1.0.0'] }));
    expect(manager.isVersionCompatible('test-cap', '1.2.3')).toBe(true);
  });

  it('37: version 1.0.0 does not satisfy >1.0.0', () => {
    manager.registerVersion(makeContract({ compatibleWith: ['>1.0.0'] }));
    expect(manager.isVersionCompatible('test-cap', '1.0.0')).toBe(false);
  });

  it('38: getLatestVersion returns undefined when all versions are deprecated', () => {
    manager.registerVersion(makeContract({ version: '1.0.0', deprecated: true }));
    manager.registerVersion(makeContract({ version: '2.0.0', deprecated: true }));
    expect(manager.getLatestVersion('test-cap')).toBeUndefined();
  });
});
