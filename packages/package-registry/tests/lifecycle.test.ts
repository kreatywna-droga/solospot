import { describe, it, expect } from 'vitest';
import { VersionEngine } from '../src/marketplace/VersionEngine';
import { MigrationEngine } from '../src/marketplace/MigrationEngine';
import { UpgradePlanner } from '../src/marketplace/UpgradePlanner';
import { PackageManifest } from '../src/PackageManifest';

describe('Package Lifecycle Engine (C2.4)', () => {
  describe('VersionEngine SemVer parser and matcher', () => {
    it('should parse versions with prereleases', () => {
      const v = VersionEngine.parse('1.2.3-beta.1');
      expect(v.major).toBe(1);
      expect(v.minor).toBe(2);
      expect(v.patch).toBe(3);
      expect(v.prerelease).toBe('beta.1');
    });

    it('should compare versions correctly', () => {
      expect(VersionEngine.compare('1.2.3', '1.2.4')).toBeLessThan(0);
      expect(VersionEngine.compare('2.0.0', '1.9.9')).toBeGreaterThan(0);
      expect(VersionEngine.compare('1.0.0-beta', '1.0.0')).toBeLessThan(0);
      expect(VersionEngine.compare('1.2.3', '1.2.3')).toBe(0);
    });

    it('should satisfy constraint ranges correctly', () => {
      // Caret ^
      expect(VersionEngine.satisfies('1.2.5', '^1.2.0')).toBe(true);
      expect(VersionEngine.satisfies('2.0.0', '^1.2.0')).toBe(false);

      // Tilde ~
      expect(VersionEngine.satisfies('1.2.5', '~1.2.0')).toBe(true);
      expect(VersionEngine.satisfies('1.3.0', '~1.2.0')).toBe(false);

      // Operators >=, >, <=, <
      expect(VersionEngine.satisfies('3.0.0', '>=3.0')).toBe(true);
      expect(VersionEngine.satisfies('2.9.9', '>=3.0')).toBe(false);
      expect(VersionEngine.satisfies('1.0.0', '<2.0')).toBe(true);

      // Wildcard
      expect(VersionEngine.satisfies('9.9.9', '*')).toBe(true);
    });
  });

  describe('MigrationEngine & Deprecations', () => {
    it('should extract correct migration steps between version updates', () => {
      const installed: PackageManifest = {
        id: 'pkg-a',
        name: 'Pkg A',
        version: '1.0.0',
        type: 'integration',
        dependencies: {},
        capabilities: [],
        compatibility: { coreVersion: '*' },
        author: 'Antigravity',
        license: 'MIT'
      };

      const target: PackageManifest = {
        id: 'pkg-a',
        name: 'Pkg A',
        version: '2.0.0',
        type: 'integration',
        dependencies: {},
        capabilities: [],
        compatibility: { coreVersion: '*' },
        author: 'Antigravity',
        license: 'MIT',
        migrations: [
          { from: '1.0.0', to: '2.0.0', description: 'Run db upgrade script v2' }
        ]
      };

      const steps = MigrationEngine.getMigrationSteps(installed, target);
      expect(steps.length).toBe(1);
      expect(steps[0].description).toBe('Run db upgrade script v2');
    });

    it('should warn when packages are deprecated', () => {
      const installed: PackageManifest = {
        id: 'pkg-deprecated',
        name: 'Old App',
        version: '1.0.0',
        type: 'integration',
        dependencies: {},
        capabilities: [],
        compatibility: { coreVersion: '*' },
        author: 'Antigravity',
        license: 'MIT'
      };

      const target: PackageManifest = {
        id: 'pkg-deprecated',
        name: 'Old App',
        version: '2.0.0',
        type: 'integration',
        dependencies: {},
        capabilities: [],
        compatibility: { coreVersion: '*' },
        author: 'Antigravity',
        license: 'MIT',
        deprecated: true,
        deprecatedSince: '2026-01-01',
        replacement: 'new-app-id'
      };

      const plan = UpgradePlanner.planUpgrade(installed, target, '1.0.0');
      expect(plan.warnings.length).toBe(1);
      expect(plan.warnings[0]).toContain('deprecated since 2026-01-01');
      expect(plan.warnings[0]).toContain('Use \'new-app-id\' instead');
    });
  });

  describe('UpgradePlanner', () => {
    it('should flag breaking changes correctly on major version upgrades', () => {
      const installed: PackageManifest = {
        id: 'pkg-x',
        name: 'X',
        version: '1.2.0',
        type: 'integration',
        dependencies: {},
        capabilities: [],
        compatibility: { coreVersion: '*' },
        author: 'Antigravity',
        license: 'MIT'
      };

      const targetMinor: PackageManifest = {
        ...installed,
        version: '1.5.0'
      };

      const planMinor = UpgradePlanner.planUpgrade(installed, targetMinor, '1.0.0');
      expect(planMinor.isBreaking).toBe(false);

      const targetBreaking: PackageManifest = {
        ...installed,
        version: '2.0.0'
      };

      const planBreaking = UpgradePlanner.planUpgrade(installed, targetBreaking, '1.0.0');
      expect(planBreaking.isBreaking).toBe(true);
      expect(planBreaking.migrationRequired).toBe(true);
    });
  });
});
