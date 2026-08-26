import { describe, it, expect } from 'vitest';
import {
  parseSemVer,
  compareSemVer,
  checkVersionCompatibility,
} from '../AnimationVersioning';

describe('AnimationVersioning (PM41, ETAP 6 & DECISION-073)', () => {
  it('parses semantic version strings (DECISION-073)', () => {
    const semver = parseSemVer('1.4.2');
    expect(semver).toEqual({ major: 1, minor: 4, patch: 2 });
    expect(() => parseSemVer('' as any)).toThrow();
  });

  it('compares semantic version strings', () => {
    expect(compareSemVer('1.0.0', '1.0.0')).toBe(0);
    expect(compareSemVer('1.0.0', '1.1.0')).toBeLessThan(0);
    expect(compareSemVer('2.0.0', '1.9.9')).toBeGreaterThan(0);
  });

  it('evaluates version compatibility and migration requirement', () => {
    const compatReport = checkVersionCompatibility('1.0.0', '1.2.0');
    expect(compatReport.isCompatible).toBe(true);
    expect(compatReport.requiresMigration).toBe(true);
    expect(compatReport.migrationSteps).toHaveLength(1);

    const breakingReport = checkVersionCompatibility('1.0.0', '2.0.0');
    expect(breakingReport.isCompatible).toBe(false);
  });
});
