import { describe, it, expect } from 'vitest';
import { InMemoryPackageRegistry } from '../src/PackageRegistry';
import { InMemoryMarketplace } from '../src/marketplace/InMemoryMarketplace';
import { MarketplaceListing } from '../src/marketplace/MarketplaceListing';
import { PackageManifest } from '../src/PackageManifest';
import { CompatibilityValidator } from '../src/marketplace/CompatibilityValidator';
import { DependencyValidator } from '../src/marketplace/DependencyValidator';
import { UpdateDetector } from '../src/marketplace/UpdateDetector';

describe('Marketplace Catalog & Search (C2.2)', () => {
  it('should allow search and filtering on the listing catalog', async () => {
    const registry = new InMemoryPackageRegistry();
    const marketplace = new InMemoryMarketplace(registry);

    // Register underlying packages
    const manifestStripe: PackageManifest = {
      id: 'pkg-stripe',
      name: 'Stripe Payment',
      version: '1.2.0',
      type: 'payment',
      dependencies: {},
      capabilities: ['payments'],
      compatibility: { coreVersion: '^1.0.0' },
      author: 'Stripe Inc',
      license: 'MIT'
    };

    const manifestTheme: PackageManifest = {
      id: 'pkg-theme-ocean',
      name: 'Ocean Theme',
      version: '2.0.0',
      type: 'theme',
      dependencies: {},
      capabilities: ['theme'],
      compatibility: { coreVersion: '^2.0.0' },
      author: 'Designers',
      license: 'MIT'
    };

    await registry.register(manifestStripe, new Uint8Array());
    await registry.register(manifestTheme, new Uint8Array());

    // Create listings
    const listingStripe: MarketplaceListing = {
      id: 'pkg-stripe',
      title: 'Stripe Gateway for Web Factor',
      description: 'Accept credit card payments easily',
      author: 'Stripe Inc',
      publisher: 'Stripe Official',
      category: 'Payments',
      tags: ['stripe', 'payments', 'gateway'],
      rating: 4.8,
      downloads: 1200,
      license: 'MIT',
      price: 0,
      visibility: 'public',
      createdAt: '2026-07-10T10:00:00Z',
      updatedAt: '2026-07-19T10:00:00Z'
    };

    const listingTheme: MarketplaceListing = {
      id: 'pkg-theme-ocean',
      title: 'Oceanic Storefront Theme',
      description: 'Vibrant blue layout for retail stores',
      author: 'Designers',
      publisher: 'Themedevs',
      category: 'Themes',
      tags: ['blue', 'retail', 'clean'],
      rating: 4.5,
      downloads: 400,
      license: 'MIT',
      price: 49,
      visibility: 'public',
      createdAt: '2026-07-12T10:00:00Z',
      updatedAt: '2026-07-15T10:00:00Z'
    };

    await marketplace.addListing(listingStripe);
    await marketplace.addListing(listingTheme);

    // Search by text query
    const textSearch = await marketplace.search({ text: 'credit card' });
    expect(textSearch.total).toBe(1);
    expect(textSearch.items[0].id).toBe('pkg-stripe');

    // Search and filter by category
    const categorySearch = await marketplace.search({ categories: ['Themes'] });
    expect(categorySearch.total).toBe(1);
    expect(categorySearch.items[0].id).toBe('pkg-theme-ocean');

    // Search and filter by capability tag
    const capSearch = await marketplace.search({ capabilities: ['payments'] });
    expect(capSearch.total).toBe(1);
    expect(capSearch.items[0].id).toBe('pkg-stripe');
  });

  describe('CompatibilityValidator', () => {
    it('should validate platform and core compatibility ranges correctly', () => {
      const manifest: PackageManifest = {
        id: 'pkg-v1',
        name: 'V1 App',
        version: '1.0.0',
        type: 'integration',
        dependencies: {},
        capabilities: [],
        compatibility: { coreVersion: '^1.2.0' },
        author: 'Google Antigravity',
        license: 'MIT'
      };

      // Incompatible core
      const reportBad = CompatibilityValidator.validate(manifest, {
        coreVersion: '1.1.0',
        platformVersion: '1.0.0'
      });
      expect(reportBad.compatible).toBe(false);
      expect(reportBad.reasons[0]).toContain('requires core version ^1.2.0');

      // Compatible core
      const reportGood = CompatibilityValidator.validate(manifest, {
        coreVersion: '1.5.0',
        platformVersion: '1.0.0'
      });
      expect(reportGood.compatible).toBe(true);
    });
  });

  describe('DependencyValidator', () => {
    it('should detect missing dependencies, cyclic dependencies and capability conflicts', async () => {
      const registry = new InMemoryPackageRegistry();
      const validator = new DependencyValidator(registry);

      // Scenario A: Missing dependency
      const manifestA: PackageManifest = {
        id: 'pkg-a',
        name: 'A',
        version: '1.0.0',
        type: 'integration',
        dependencies: { 'pkg-missing': '^1.0.0' },
        capabilities: [],
        compatibility: { coreVersion: '*' },
        author: 'Google Antigravity',
        license: 'MIT'
      };

      const reportA = await validator.validate([manifestA]);
      expect(reportA.valid).toBe(false);
      expect(reportA.missingDependencies.length).toBe(1);
      expect(reportA.missingDependencies[0].packageId).toBe('pkg-missing');

      // Scenario B: Dependency Cycle
      const manifestCycle1: PackageManifest = {
        id: 'pkg-cycle-1',
        name: 'Cycle 1',
        version: '1.0.0',
        type: 'integration',
        dependencies: { 'pkg-cycle-2': '^1.0.0' },
        capabilities: [],
        compatibility: { coreVersion: '*' },
        author: 'Google Antigravity',
        license: 'MIT'
      };

      const manifestCycle2: PackageManifest = {
        id: 'pkg-cycle-2',
        name: 'Cycle 2',
        version: '1.0.0',
        type: 'integration',
        dependencies: { 'pkg-cycle-1': '^1.0.0' },
        capabilities: [],
        compatibility: { coreVersion: '*' },
        author: 'Google Antigravity',
        license: 'MIT'
      };

      const reportCycle = await validator.validate([manifestCycle1, manifestCycle2]);
      expect(reportCycle.valid).toBe(false);
      expect(reportCycle.cycles.length).toBeGreaterThan(0);
      expect(reportCycle.errors[0]).toContain('Cyclic dependencies detected');

      // Scenario C: Capability Conflict (Multiple Themes)
      const theme1: PackageManifest = {
        id: 'theme-1',
        name: 'Theme 1',
        version: '1.0.0',
        type: 'theme',
        dependencies: {},
        capabilities: ['theme'],
        compatibility: { coreVersion: '*' },
        author: 'Google Antigravity',
        license: 'MIT'
      };

      const theme2: PackageManifest = {
        id: 'theme-2',
        name: 'Theme 2',
        version: '1.0.0',
        type: 'theme',
        dependencies: {},
        capabilities: ['theme'],
        compatibility: { coreVersion: '*' },
        author: 'Google Antigravity',
        license: 'MIT'
      };

      const reportConflict = await validator.validate([theme1, theme2]);
      expect(reportConflict.valid).toBe(false);
      expect(reportConflict.capabilityConflicts.length).toBe(1);
      expect(reportConflict.capabilityConflicts[0].capability).toBe('theme');
    });
  });

  describe('UpdateDetector', () => {
    it('should identify update status, breaking changes, and migrations correctly', async () => {
      const registry = new InMemoryPackageRegistry();
      const detector = new UpdateDetector(registry);

      const installed: PackageManifest = {
        id: 'pkg-update-test',
        name: 'Update Test',
        version: '1.0.0',
        type: 'integration',
        dependencies: {},
        capabilities: [],
        compatibility: { coreVersion: '*' },
        author: 'Google Antigravity',
        license: 'MIT'
      };

      // 1. Same version available
      await registry.register(installed, new Uint8Array());
      const reportSame = await detector.detectUpdate(installed);
      expect(reportSame.updateAvailable).toBe(false);

      // 2. Non-breaking update (1.2.0 available for 1.0.0)
      const registryNew = new InMemoryPackageRegistry();
      const detectorNew = new UpdateDetector(registryNew);
      await registryNew.register(installed, new Uint8Array());
      await registryNew.register({
        ...installed,
        version: '1.2.0'
      }, new Uint8Array());

      const reportMinor = await detectorNew.detectUpdate(installed);
      expect(reportMinor.updateAvailable).toBe(true);
      expect(reportMinor.availableVersion).toBe('1.2.0');
      expect(reportMinor.isBreaking).toBe(false);
      expect(reportMinor.migrationRequired).toBe(false);

      // 3. Breaking update (2.0.0 available for 1.0.0)
      const registryBreaking = new InMemoryPackageRegistry();
      const detectorBreaking = new UpdateDetector(registryBreaking);
      await registryBreaking.register(installed, new Uint8Array());
      await registryBreaking.register({
        ...installed,
        version: '2.0.0'
      }, new Uint8Array());

      const reportBreaking = await detectorBreaking.detectUpdate(installed);
      expect(reportBreaking.updateAvailable).toBe(true);
      expect(reportBreaking.availableVersion).toBe('2.0.0');
      expect(reportBreaking.isBreaking).toBe(true);
      expect(reportBreaking.migrationRequired).toBe(true);
    });
  });
});
